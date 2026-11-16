#!/usr/bin/env python3
"""xl2claude — 재무 엑셀을 Claude가 적은 토큰으로 읽을 수 있는 형태로 바꾼다.

    python xl2claude.py convert 원장.xlsx -o 원장_c          # 변환
    python xl2claude.py query  원장_c "SELECT ..."            # 변환 결과에 SQL
    python xl2claude.py schema 원장_c                         # 테이블·열 목록

출력 폴더
    INDEX.md          가장 먼저 읽을 파일 (시트 목록·유형·크기·위치)
    sheets/*.md       시트별 내용. 서식형 시트는 셀 내용 그대로, 큰 표는 열 프로필·요약만
    data.sqlite       큰 표의 전체 행 (query 명령으로 필요한 부분만 꺼내 본다)

입력: .xlsx .xlsm .xlsb .xls .ods (python-calamine), .csv .tsv (UTF-8/CP949 자동)
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import os
import re
import sqlite3
import sys
import time

try:
    import python_calamine as _cal
except ImportError:  # pragma: no cover
    _cal = None
try:
    import openpyxl as _opx
except ImportError:  # pragma: no cover
    _opx = None

# ───────────────────────── 설정 ─────────────────────────
HEAD_SCAN = 60          # 머리글 탐색 범위(행)
TABLE_MIN = 50          # 이 행 수 이상인 표만 DB로 뺀다. 작으면 시트 md에 그대로
LAYOUT_MAX = 600        # 머리글이 없어도 이 행 수를 넘으면 DB로 뺀다
PREVIEW = 5             # 표 미리보기 행 수
NOTE_CAP = 3000         # 큰 표 바깥 메모 셀 최대 개수
BATCH = 20000

DR_PAT = re.compile(r"^(차변|차변금액|debit|dr|차변액)$|차변", re.I)
CR_PAT = re.compile(r"^(대변|대변금액|credit|cr|대변액)$|대변", re.I)
ACCT_NAME_PAT = re.compile(r"계정과목|계정명|과목명|account.?name|계정$", re.I)
ACCT_CODE_PAT = re.compile(r"계정코드|과목코드|account.?(code|no)|^코드$|^code$", re.I)
DATE_PAT = re.compile(r"일자|날짜|전기일|회계일|^date$|posting", re.I)
VOUCHER_PAT = re.compile(r"전표|voucher|document|^je|분개번호|slip", re.I)
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}")
REF_RE = re.compile(r"(\$?)([A-Z]{1,3})(\$?)(\d{1,7})(?![A-Za-z0-9_(])")


# ───────────────────────── 값 정규화 ─────────────────────────
def col_letter(i: int) -> str:  # 0 → A
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def col_index(s: str) -> int:
    n = 0
    for ch in s:
        n = n * 26 + ord(ch) - 64
    return n - 1


def norm(v):
    """셀 값을 저장용 파이썬 값으로. 빈 값은 None."""
    if v is None:
        return None
    if isinstance(v, str):
        v = v.strip()
        return v if v else None
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, float):
        if v != v:
            return None
        if v.is_integer() and abs(v) < 1e15:
            return int(v)
        return round(v, 6)
    if isinstance(v, int):
        return v
    if isinstance(v, dt.datetime):
        if v.hour == v.minute == v.second == 0:
            return v.date().isoformat()
        return v.replace(microsecond=0).isoformat(sep=" ")
    if isinstance(v, dt.date):
        return v.isoformat()
    if isinstance(v, dt.time):
        return v.replace(microsecond=0).isoformat()
    if isinstance(v, dt.timedelta):
        return str(v)
    return str(v)


def fmt(v) -> str:
    """표시용 문자열. 탭/줄바꿈은 한 줄로."""
    if v is None:
        return ""
    if isinstance(v, float):
        s = f"{v:.6f}".rstrip("0").rstrip(".")
        return s
    if isinstance(v, int):
        return str(v)
    s = str(v)
    if "\t" in s or "\n" in s or "\r" in s:
        s = s.replace("\r\n", "\n").replace("\r", "\n").replace("\n", "⏎").replace("\t", " ")
    return s


def fmt_amt(v) -> str:
    """금액 요약용: 천단위 콤마."""
    if v is None:
        return ""
    if isinstance(v, float) and not v.is_integer():
        return f"{v:,.2f}"
    return f"{int(v):,}"


def is_texty(v) -> bool:
    return isinstance(v, str) and not ISO_DATE.match(v) and not re.fullmatch(r"[-+]?[\d,.]+", v)


# ───────────────────────── 읽기 ─────────────────────────
class Sheet:
    def __init__(self, name, state, rows_fn, height):
        self.name, self.state, self.rows_fn, self.height = name, state, rows_fn, height


def open_book(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".csv", ".tsv", ".txt"):
        return [Sheet(os.path.splitext(os.path.basename(path))[0], "visible",
                      lambda: _csv_rows(path, ext), None)]
    if _cal is not None:
        wb = _cal.CalamineWorkbook.from_path(path)
        states = {}
        try:
            for m in wb.sheets_metadata:
                states[m.name] = str(getattr(m, "visible", "visible")).split(".")[-1].lower()
        except Exception:
            pass
        out = []
        for name in wb.sheet_names:
            def rows_fn(name=name):
                sh = wb.get_sheet_by_name(name)
                c0 = sh.start[1] if sh.start else 0
                pad = [None] * c0
                for r in sh.iter_rows():
                    yield pad + list(r) if c0 else r
            try:
                h = wb.get_sheet_by_name(name).height
            except Exception:
                h = None
            out.append(Sheet(name, states.get(name, "visible"), rows_fn, h))
        return out
    if _opx is None:
        sys.exit("python-calamine 또는 openpyxl 이 필요합니다: pip install python-calamine openpyxl")
    wb = _opx.load_workbook(path, read_only=True, data_only=True)
    return [Sheet(ws.title, ws.sheet_state, (lambda ws=ws: ws.iter_rows(values_only=True)), ws.max_row)
            for ws in wb.worksheets]


def _csv_rows(path, ext):
    raw = open(path, "rb").read(65536)
    enc = "utf-8-sig"
    try:
        raw.decode("utf-8")
    except UnicodeDecodeError:
        enc = "cp949"
    delim = "\t" if ext == ".tsv" else None
    with open(path, newline="", encoding=enc, errors="replace") as f:
        if delim is None:
            try:
                delim = csv.Sniffer().sniff(f.read(65536), delimiters=",;\t|").delimiter
            except csv.Error:
                delim = ","
            f.seek(0)
        for row in csv.reader(f, delimiter=delim):
            yield [_csv_val(x) for x in row]


def _csv_val(s):
    s = s.strip()
    if not s:
        return None
    t = s.replace(",", "")
    if re.fullmatch(r"-?\d+", t) and not (len(t) > 1 and t.lstrip("-").startswith("0")):
        return int(t)
    if re.fullmatch(r"-?\d*\.\d+", t):
        return float(t)
    if re.fullmatch(r"\(\d[\d.]*\)", t):  # (1,000) 음수 표기
        return -float(t[1:-1])
    return s


class Formulas:
    """openpyxl로 수식만 읽는다(xlsx/xlsm). 시트별로 필요한 행까지만."""

    def __init__(self, path, enabled):
        self.wb = None
        if enabled and _opx is not None and path.lower().endswith((".xlsx", ".xlsm")):
            try:
                self.wb = _opx.load_workbook(path, read_only=True, data_only=False)
            except Exception:
                self.wb = None

    def get(self, sheet, max_row):
        """{(r, c): '=...'} (0-based)"""
        if self.wb is None or sheet not in self.wb.sheetnames:
            return {}
        out = {}
        ws = self.wb[sheet]
        for r, row in enumerate(ws.iter_rows(max_row=max_row, values_only=True)):
            for c, v in enumerate(row):
                if isinstance(v, str) and v.startswith("="):
                    out[(r, c)] = v
                elif v is not None and type(v).__name__ == "ArrayFormula":
                    out[(r, c)] = "{" + str(getattr(v, "text", v)) + "}"
        return out


def rel_formula(f, r, c):
    """수식을 상대참조 형태로 바꿔 '위 셀과 같은 수식(채우기)'을 찾는다."""
    def sub(m):
        cc = m.group(2) if m.group(1) else f"C[{col_index(m.group(2)) - c}]"
        rr = m.group(4) if m.group(3) else f"R[{int(m.group(4)) - 1 - r}]"
        return cc + rr
    return REF_RE.sub(sub, f)


# ───────────────────────── 시트 분석 ─────────────────────────
def find_header(rows):
    """[(row_idx, c0, c1)] 머리글 후보 중 최선. 없으면 None."""
    best, best_score = None, 0
    n = len(rows)
    for i, row in enumerate(rows[: HEAD_SCAN]):
        cells = [(j, v) for j, v in enumerate(row) if v is not None]
        if len(cells) < 2:
            continue
        texty = sum(1 for _, v in cells if is_texty(v))
        if texty / len(cells) < 0.6:
            continue
        # 가장 긴 연속 구간(빈칸 1개까지 허용)
        runs, cur = [], [cells[0][0], cells[0][0]]
        for j, _ in cells[1:]:
            if j - cur[1] <= 2:
                cur[1] = j
            else:
                runs.append(cur)
                cur = [j, j]
        runs.append(cur)
        c0, c1 = max(runs, key=lambda x: x[1] - x[0])
        sample = rows[i + 1: i + 31]
        def has_data(j):
            return any(j < len(r) and r[j] is not None for r in sample)
        while c1 > c0 and not has_data(c1):
            c1 -= 1
        while c0 < c1 and not has_data(c0):
            c0 += 1
        hdr_cols = [j for j, _ in cells if c0 <= j <= c1]
        if len(hdr_cols) < 2:
            continue
        nxt = rows[i + 1: i + 21]
        if len(nxt) < 3:
            continue
        good = 0
        for r in nxt:
            filled = sum(1 for j in hdr_cols if j < len(r) and r[j] is not None)
            if filled >= max(2, len(hdr_cols) * 0.5):
                good += 1
        frac = good / len(nxt)
        if frac < 0.6:
            continue
        # 다음 행들이 머리글처럼 전부 텍스트면 감점(다단 머리글의 윗줄)
        score = len(hdr_cols) * frac
        if score > best_score + 0.01:
            best, best_score = (i, c0, c1), score
    return best


def extend_span(rows, hdr, c0, c1):
    sample = rows[hdr + 1: hdr + 31]
    def has(j):
        return sum(1 for r in sample if j < len(r) and r[j] is not None) >= max(1, len(sample) * 0.05)
    while c0 > 0 and has(c0 - 1):
        c0 -= 1
    while any(c1 + 1 < len(r) for r in sample) and has(c1 + 1):
        c1 += 1
    return c0, c1


def safe_ident(s, used):
    s = re.sub(r"[^\w]+", "_", str(s)).strip("_") or "col"
    if s[0].isdigit():
        s = "c_" + s
    base, k = s, 2
    while s.lower() in used:
        s = f"{base}_{k}"
        k += 1
    used.add(s.lower())
    return s


def trim_row(row):
    row = [norm(v) for v in row]
    while row and row[-1] is None:
        row.pop()
    return row


# ───────────────────────── 렌더링 ─────────────────────────
def render_cells(cells, formulas, title="셀"):
    """cells: {(r,c): value}. 밀도가 높으면 격자(TSV), 낮으면 '행번호 열=값' 희소 표기."""
    if not cells:
        return ""
    rs = sorted({r for r, _ in cells})
    cs = sorted({c for _, c in cells})
    c_min, c_max = cs[0], cs[-1]
    width = c_max - c_min + 1
    density = len(cells) / (len(rs) * width)

    above = {}
    def show(r, c):
        v = cells.get((r, c))
        f = formulas.get((r, c))
        s = fmt(v)
        if f and f == s:
            f = None
        if f:
            rf = rel_formula(f, r, c)
            if above.get(c) == rf:
                s = f"{s}[=↑]"
            else:
                s = f"{s}[{f}]"
            above[c] = rf
        else:
            above.pop(c, None)
        return s

    out = []
    if density >= 0.35 and width <= 40:
        out.append("행\t" + "\t".join(col_letter(c) for c in range(c_min, c_max + 1)))
        prev = None
        for r in rs:
            if prev is not None and r != prev + 1:
                above.clear()
            vals = [show(r, c) for c in range(c_min, c_max + 1)]
            while vals and vals[-1] == "":
                vals.pop()
            out.append(f"{r + 1}\t" + "\t".join(vals))
            prev = r
        fmt_name = "격자(TSV, 첫 줄=열 문자, 첫 칸=행 번호)"
    else:
        by_row = {}
        for (r, c) in sorted(cells):
            by_row.setdefault(r, []).append(c)
        prev = None
        for r in rs:
            if prev is not None and r != prev + 1:
                above.clear()
            out.append(f"{r + 1}\t" + "\t".join(f"{col_letter(c)}={show(r, c)}" for c in by_row[r]))
            prev = r
        fmt_name = "희소(행번호 ⇥ 열=값)"
    return f"<!-- {title}: {fmt_name}. [수식] = 셀 수식, [=↑] = 바로 위 셀과 같은 수식(채우기) -->\n" + "\n".join(out)


# ───────────────────────── 변환 본체 ─────────────────────────
class Converter:
    def __init__(self, src, out, formulas=True, table_min=TABLE_MIN, quiet=False):
        self.src, self.out, self.quiet = src, out, quiet
        self.table_min = table_min
        os.makedirs(os.path.join(out, "sheets"), exist_ok=True)
        dbp = os.path.join(out, "data.sqlite")
        if os.path.exists(dbp):
            os.remove(dbp)
        self.db = sqlite3.connect(dbp)
        self.db.execute("PRAGMA journal_mode=OFF")
        self.db.execute("PRAGMA synchronous=OFF")
        self.fx = Formulas(src, formulas)
        self.used_tables = set()
        self.hashes = {}   # hash → (sheet, table)
        self.index = []

    def log(self, *a):
        if not self.quiet:
            print(*a, file=sys.stderr, flush=True)

    def run(self):
        t0 = time.time()
        sheets = open_book(self.src)
        for k, sh in enumerate(sheets, 1):
            t = time.time()
            info = self.sheet(k, sh)
            self.index.append(info)
            self.log(f"  [{k}/{len(sheets)}] {sh.name}: {info['kind']} {info['dim']} ({time.time() - t:.1f}s)")
        self.db.commit()
        self.write_index(time.time() - t0)
        self.db.execute("VACUUM")
        self.db.close()
        return self.index

    # 한 시트 처리
    def sheet(self, k, sh):
        fname = f"{k:02d}_{re.sub(r'[^\w.-]+', '_', sh.name)}.md"
        it = iter(sh.rows_fn())
        head = []
        for row in it:
            head.append(trim_row(row))
            if len(head) >= HEAD_SCAN + self.table_min + 1:
                break
        exhausted = len(head) < HEAD_SCAN + self.table_min + 1
        hdr = find_header(head)
        big = (not exhausted) and (sh.height is None or sh.height > self.table_min)
        if hdr and big:
            return self.table_sheet(k, sh, fname, head, it, hdr)
        if not exhausted:
            rest = []
            for row in it:
                rest.append(trim_row(row))
                if len(head) + len(rest) > LAYOUT_MAX:
                    break
            if len(head) + len(rest) > LAYOUT_MAX:
                # 머리글 없이 큰 시트: 첫 비어있지 않은 행부터 열 문자를 열 이름으로
                return self.table_sheet(k, sh, fname, head + rest, it, None)
            head += rest
        return self.layout_sheet(k, sh, fname, head)

    def layout_sheet(self, k, sh, fname, rows):
        cells = {(r, c): v for r, row in enumerate(rows) for c, v in enumerate(row) if v is not None}
        fx = self.fx.get(sh.name, len(rows)) if cells else {}
        body = render_cells(cells, fx)
        h = hashlib.md5(body.encode()).hexdigest()
        dup = self.hashes.get(("L", h))
        nrows = len({r for r, _ in cells})
        ncols = len({c for _, c in cells})
        dim = f"{nrows}행×{ncols}열(값 {len(cells)}개)" if cells else "빈 시트"
        if dup:
            body = f"시트 `{dup}` 와 내용이 완전히 같음 → 그 파일 참고."
        else:
            self.hashes[("L", h)] = sh.name
        title = next((fmt(v) for (r, c), v in sorted(cells.items()) if is_texty(v)), "")[:40]
        self.write(fname, f"# 시트: {sh.name}  ({self.state_txt(sh)}서식형, {dim})\n\n{body}\n")
        return dict(no=k, name=sh.name, kind="서식형" if cells else "빈 시트", dim=dim, file=fname,
                    desc=("중복: " + dup) if dup else title, state=sh.state)

    def state_txt(self, sh):
        return "" if sh.state in ("visible", None) else f"⚠{sh.state} "

    def table_sheet(self, k, sh, fname, head, it, hdr):
        if hdr:
            h, c0, c1 = hdr
            c0, c1 = extend_span(head, h, c0, c1)
            hrow = head[h]
            names = [hrow[j] if j < len(hrow) and hrow[j] is not None else f"col_{col_letter(j)}"
                     for j in range(c0, c1 + 1)]
        else:
            h = next(i for i, r in enumerate(head) if r) - 1
            spans = [len(r) for r in head if r]
            c0, c1 = 0, max(spans) - 1
            names = [col_letter(j) for j in range(c0, c1 + 1)]
        used = set()
        idents = [safe_ident(n, used) for n in names]
        tname = safe_ident("t_" + sh.name, self.used_tables)
        cols_sql = ", ".join(f'"{c}"' for c in idents)
        self.db.execute(f'CREATE TABLE "{tname}" (_row INTEGER, {cols_sql})')
        ins = f'INSERT INTO "{tname}" VALUES ({",".join("?" * (len(idents) + 1))})'

        notes = {(r, c): v for r, row in enumerate(head[: h + 1]) for c, v in enumerate(row)
                 if v is not None and not (r == h and c0 <= c <= c1)}
        md5 = hashlib.md5()
        batch, n, blank, note_over = [], 0, 0, 0
        width = c1 - c0 + 1

        def feed(r, row):
            nonlocal n, blank, note_over
            part = row[c0: c1 + 1]
            if len(part) < width:
                part = part + [None] * (width - len(part))
            if len(row) > c1 + 1 or c0 > 0:
                for c, v in enumerate(row):
                    if v is not None and (c < c0 or c > c1):
                        if len(notes) < NOTE_CAP:
                            notes[(r, c)] = v
                        else:
                            note_over += 1
            if all(v is None for v in part):
                blank += 1
                return
            batch.append((r + 1, *part))
            md5.update(repr(part).encode())
            n += 1
            if len(batch) >= BATCH:
                self.db.executemany(ins, batch)
                batch.clear()

        for r in range(h + 1, len(head)):
            feed(r, head[r])
        r = len(head)
        for row in it:
            feed(r, trim_row(row))
            r += 1
            if r % 200000 == 0:
                self.log(f"      … {r:,}행")
        if batch:
            self.db.executemany(ins, batch)

        hsh = md5.hexdigest() + "|" + "|".join(map(str, names))
        dup = self.hashes.get(("T", hsh))
        fx = self.fx.get(sh.name, h + 4) if self.fx.wb else {}
        note_fx = {p: f for p, f in fx.items() if p[0] <= h}
        col_fx = {}
        for (fr, fc), f in fx.items():
            if fr > h and c0 <= fc <= c1 and (fc - c0) not in col_fx:
                col_fx[fc - c0] = f
        lines = [f"# 시트: {sh.name}  ({self.state_txt(sh)}데이터 표, {n:,}행×{width}열)\n"]
        if dup:
            self.db.execute(f'DROP TABLE "{tname}"')
            self.db.execute(f'CREATE VIEW "{tname}" AS SELECT * FROM "{dup[1]}"')
            lines.append(f"표 데이터가 시트 `{dup[0]}`(테이블 `{dup[1]}`)과 완전히 같음 → 프로필은 그 파일 참고. "
                         f"`{tname}` 은 같은 데이터를 가리키는 뷰.\n")
        else:
            self.hashes[("T", hsh)] = (sh.name, tname)
            lines.append(f"- DB 테이블: `{tname}` (data.sqlite) · 원본 위치: 머리글 {h + 1}행, "
                         f"{col_letter(c0)}~{col_letter(c1)}열 · `_row` = 엑셀 행 번호")
            if blank:
                lines.append(f"- 표 범위 안 빈 행 {blank:,}개는 제외")
            lines.append("")
            lines += self.profile(tname, idents, names, c0, col_fx, n)
            lines += self.journal(tname, idents, names, n)
            lines += self.groups(tname, idents, names, n)
        if notes:
            lines.append("\n## 표 바깥 셀 (제목·메모·검증식 등)")
            lines.append(render_cells(notes, note_fx, "표 바깥 셀"))
            if note_over:
                lines.append(f"(+ 표 바깥 셀 {note_over:,}개 생략)")
        self.write(fname, "\n".join(lines) + "\n")
        return dict(no=k, name=sh.name, kind="데이터 표", dim=f"{n:,}행×{width}열", file=fname,
                    desc=(f"중복: {dup[0]}" if dup else f"`{tname}`: " + ", ".join(map(str, names))[:120]),
                    state=sh.state)

    # 열 프로필
    def profile(self, t, idents, names, c0, col_fx, n):
        q = lambda s, *a: self.db.execute(s, a).fetchall()
        out = ["## 열 프로필",
               "<!-- 열\tDB이름\t유형\t값개수\t고유값\t요약 -->",
               "열\tDB이름\t유형\t값개수\t고유값\t요약"]
        self.meta = {}
        for i, (c, name) in enumerate(zip(idents, names)):
            nn, num, dist = q(f'SELECT COUNT("{c}"), SUM(typeof("{c}") IN (\'integer\',\'real\')), '
                              f'COUNT(DISTINCT "{c}") FROM "{t}"')[0]
            num = num or 0
            kind = "숫자" if nn and num / nn >= 0.9 else "텍스트"
            if kind == "텍스트" and nn:
                d = q(f'SELECT COUNT(*) FROM "{t}" WHERE "{c}" GLOB \'[12][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]*\'')[0][0]
                if d / nn >= 0.9:
                    kind = "날짜"
            self.meta[c] = (kind, dist, nn)
            if kind == "숫자":
                s, mn, mx = q(f'SELECT SUM("{c}"), MIN("{c}"), MAX("{c}") FROM "{t}" '
                              f'WHERE typeof("{c}") IN (\'integer\',\'real\')')[0]
                neg = q(f'SELECT COUNT(*) FROM "{t}" WHERE "{c}" < 0 AND typeof("{c}") IN (\'integer\',\'real\')')[0][0]
                summ = f"합계 {fmt_amt(s)} · 최소 {fmt_amt(mn)} · 최대 {fmt_amt(mx)}" + (f" · 음수 {neg:,}건" if neg else "")
            elif kind == "날짜":
                mn, mx = q(f'SELECT MIN("{c}"), MAX("{c}") FROM "{t}"')[0]
                summ = f"{mn} ~ {mx}"
            elif nn:
                top = q(f'SELECT "{c}", COUNT(*) k FROM "{t}" WHERE "{c}" IS NOT NULL GROUP BY 1 ORDER BY k DESC LIMIT 5')
                summ = "상위: " + ", ".join(f"{fmt(v)[:30]}({k:,})" for v, k in top)
                if top and top[0][1] <= 2 and dist > 5:
                    mn, mx = q(f'SELECT MIN("{c}"), MAX("{c}") FROM "{t}"')[0]
                    summ = f"거의 고유값 · 범위 {fmt(mn)[:30]} ~ {fmt(mx)[:30]}"
                elif dist <= 5:
                    summ = "값: " + summ[4:]
            else:
                summ = "(모두 빈칸)"
            if not nn and str(name).startswith("col_"):
                continue
            fx = col_fx.get(i)
            if fx:
                summ += f" · 수식열 예: {fx}"
            out.append(f"{col_letter(c0 + i)}\t{c if c == name else c + ' (' + fmt(name) + ')'}\t{kind}\t{nn:,}\t{dist:,}\t{summ}")
        head = self.db.execute(f'SELECT * FROM "{t}" LIMIT {PREVIEW}').fetchall()
        out.append(f"\n## 미리보기 (처음 {len(head)}행, 첫 칸 = 엑셀 행 번호)")
        out.append("_row\t" + "\t".join(idents))
        out += ["\t".join(fmt(v) for v in r) for r in head]
        if n > PREVIEW * 2:
            tail = self.db.execute(f'SELECT * FROM (SELECT * FROM "{t}" ORDER BY rowid DESC LIMIT 2) ORDER BY 1').fetchall()
            out.append("…")
            out += ["\t".join(fmt(v) for v in r) for r in tail]
        return out

    def _pick(self, idents, names, pat, kinds):
        for c, nm in zip(idents, names):
            if pat.search(str(nm)) and self.meta[c][0] in kinds:
                return c
        return None

    # 분개장 감지 시 차대 검증·계정별·월별 요약
    def journal(self, t, idents, names, n):
        dr = self._pick(idents, names, DR_PAT, ("숫자",))
        cr = self._pick(idents, names, CR_PAT, ("숫자", "텍스트"))
        if cr and self.meta[cr][0] != "숫자":
            cr = None
        if not (dr and cr) or dr == cr:
            return []
        q = lambda s: self.db.execute(s).fetchall()
        D, C = f'COALESCE("{dr}",0)', f'COALESCE("{cr}",0)'
        out = [f"\n## 분개장 요약 (차변=`{dr}`, 대변=`{cr}` 자동 인식)"]
        sd, sc = q(f'SELECT SUM({D}), SUM({C}) FROM "{t}"')[0]
        diff = (sd or 0) - (sc or 0)
        out.append(f"- 차변 합계 {fmt_amt(sd)} · 대변 합계 {fmt_amt(sc)} · 차이 {fmt_amt(diff)}"
                   + (" ✔ 일치" if abs(diff) < 0.5 else " ✖ 불일치"))
        both = q(f'SELECT COUNT(*) FROM "{t}" WHERE {D}<>0 AND {C}<>0')[0][0]
        zero = q(f'SELECT COUNT(*) FROM "{t}" WHERE {D}=0 AND {C}=0')[0][0]
        if both or zero:
            out.append(f"- 차·대변 동시 입력 {both:,}행 · 금액 0 행 {zero:,}행")
        date = self._pick(idents, names, DATE_PAT, ("날짜", "텍스트", "숫자"))
        vno = self._pick(idents, names, VOUCHER_PAT, ("텍스트", "숫자"))
        if vno:
            key = f'"{date}","{vno}"' if date else f'"{vno}"'
            nv, bad = q(f'SELECT COUNT(*), SUM(ABS(d-c)>=0.5) FROM (SELECT SUM({D}) d, SUM({C}) c FROM "{t}" GROUP BY {key})')[0]
            out.append(f"- 전표 {nv:,}건 (기준: {key.replace(chr(34), '')}) · 차대 불일치 전표 {bad or 0:,}건")
            if bad:
                rows = q(f'SELECT {key}, SUM({D}) d, SUM({C}) c, MIN(_row) FROM "{t}" GROUP BY {key} '
                         f'HAVING ABS(d-c)>=0.5 ORDER BY ABS(d-c) DESC LIMIT 10')
                out.append("  불일치 상위 10: " + "; ".join(
                    f"{'/'.join(fmt(x) for x in r[:-3])} 차{fmt_amt(r[-3])} 대{fmt_amt(r[-2])} (행{r[-1]})" for r in rows))
        if date and self.meta[date][0] == "날짜":
            rows = q(f'SELECT substr("{date}",1,7) m, COUNT(*), SUM({D}), SUM({C}) FROM "{t}" GROUP BY m ORDER BY m')
            if len(rows) <= 60:
                out.append("\n### 월별\n월\t행수\t차변\t대변")
                out += [f"{fmt(m)}\t{k:,}\t{fmt_amt(d)}\t{fmt_amt(c)}" for m, k, d, c in rows]
        code = self._pick(idents, names, ACCT_CODE_PAT, ("텍스트", "숫자"))
        name = self._pick(idents, names, ACCT_NAME_PAT, ("텍스트",))
        keys = [x for x in (code, name) if x]
        if keys:
            g = ",".join(f'"{x}"' for x in keys)
            total = q(f'SELECT COUNT(*) FROM (SELECT 1 FROM "{t}" GROUP BY {g})')[0][0]
            lim = 300 if total <= 300 else 100
            rows = q(f'SELECT {g}, COUNT(*), SUM({D}) d, SUM({C}) c FROM "{t}" GROUP BY {g} '
                     f'ORDER BY {"1" if total <= 300 else "ABS(d)+ABS(c) DESC"} LIMIT {lim}')
            out.append(f"\n### 계정별 ({total:,}개" + ("" if total <= 300 else ", 거래금액 상위 100개만") + ")")
            out.append("\t".join(keys) + "\t행수\t차변\t대변\t차-대")
            out += ["\t".join(fmt(x) for x in r[:len(keys)]) + f"\t{r[-3]:,}\t{fmt_amt(r[-2])}\t{fmt_amt(r[-1])}\t{fmt_amt((r[-2] or 0) - (r[-1] or 0))}"
                    for r in rows]
        return out

    # 범주형 열 × 금액 열 합계 (분개장 아닌 표)
    def groups(self, t, idents, names, n):
        if any(DR_PAT.search(str(nm)) for nm in names) and any(CR_PAT.search(str(nm)) for nm in names):
            return []
        nums = [c for c in idents if self.meta[c][0] == "숫자" and self.meta[c][1] > 12]
        cats = [c for c in idents if 2 <= self.meta[c][1] <= 30 and self.meta[c][2] >= n * 0.5 and c not in nums]
        if not nums or not cats:
            return []
        nums, cats = nums[:4], cats[:3]
        out = ["\n## 범주별 합계 (자동)"]
        for g in cats:
            rows = self.db.execute(
                f'SELECT "{g}", COUNT(*), ' + ", ".join(f'SUM("{m}")' for m in nums) +
                f' FROM "{t}" GROUP BY 1 ORDER BY 1').fetchall()
            out.append(f"\n### {g}별\n{g}\t행수\t" + "\t".join(nums))
            out += [fmt(r[0]) + f"\t{r[1]:,}\t" + "\t".join(fmt_amt(x) for x in r[2:]) for r in rows]
        return out

    def write(self, fname, text):
        with open(os.path.join(self.out, "sheets", fname), "w", encoding="utf-8") as f:
            f.write(text)

    def write_index(self, secs):
        L = [f"# {os.path.basename(self.src)} — 변환 색인",
             "",
             "Claude용 안내: 이 파일 → 필요한 `sheets/*.md` 순으로 읽는다. 큰 표의 전체 행은 `data.sqlite`에 있으니 "
             "원본을 통째로 읽지 말고 아래 query 명령으로 필요한 행·집계만 조회한다.",
             "```",
             f'python "{os.path.abspath(__file__)}" query "{os.path.abspath(self.out)}" "SELECT ... FROM 테이블 ..."',
             f'python "{os.path.abspath(__file__)}" schema "{os.path.abspath(self.out)}"',
             "```",
             "- 열 이름·유형·합계·상위값은 각 시트 md의 '열 프로필'에 있다. 원본 위치는 `_row`(엑셀 행 번호)로 역추적.",
             "- 값 표기: 날짜 YYYY-MM-DD, 숫자는 콤마 없음(요약표만 콤마), 셀 안 줄바꿈은 ⏎. "
             "서식형 시트의 `값[수식]`은 셀 수식, `[=↑]`는 바로 위 셀과 같은 수식.",
             "",
             f"시트 {len(self.index)}개 · 변환 {secs:.1f}초",
             "",
             "번호\t시트\t유형\t크기\t파일\t내용"]
        for x in self.index:
            st = "" if x["state"] in ("visible", None) else f" ⚠{x['state']}"
            L.append(f"{x['no']}\t{x['name']}{st}\t{x['kind']}\t{x['dim']}\tsheets/{x['file']}\t{x['desc']}")
        with open(os.path.join(self.out, "INDEX.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(L) + "\n")


# ───────────────────────── query / schema ─────────────────────────
def cmd_query(out, sql, maxrows):
    db = sqlite3.connect(f"file:{os.path.join(out, 'data.sqlite')}?mode=ro", uri=True)
    cur = db.execute(sql)
    if cur.description is None:
        return
    w = io.StringIO()
    print("\t".join(d[0] for d in cur.description), file=w)
    k = 0
    for row in cur:
        if k >= maxrows:
            rest = sum(1 for _ in cur)
            print(f"… (+{rest + 1:,}행 생략. LIMIT/집계로 줄이거나 --max 조정)", file=w)
            break
        print("\t".join(fmt(v) for v in row), file=w)
        k += 1
    sys.stdout.write(w.getvalue())


def cmd_schema(out):
    db = sqlite3.connect(f"file:{os.path.join(out, 'data.sqlite')}?mode=ro", uri=True)
    for name, typ in db.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY rowid"):
        cols = [r[1] for r in db.execute(f'PRAGMA table_info("{name}")')]
        n = db.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
        print(f"{name}\t{typ}\t{n:,}행\t{', '.join(cols)}")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="xl2claude", description="엑셀 → Claude가 읽기 좋은 형태")
    sp = ap.add_subparsers(dest="cmd", required=True)
    c = sp.add_parser("convert", help="엑셀/CSV 변환")
    c.add_argument("src")
    c.add_argument("-o", "--out", help="출력 폴더 (기본: <파일명>_claude)")
    c.add_argument("--no-formulas", action="store_true", help="수식 표시 안 함(조금 더 빠름)")
    c.add_argument("--table-min", type=int, default=TABLE_MIN, help=f"DB로 뺄 표 최소 행 수 (기본 {TABLE_MIN})")
    c.add_argument("-q", "--quiet", action="store_true")
    q = sp.add_parser("query", help="변환 결과 DB에 SQL 실행 (TSV 출력)")
    q.add_argument("out")
    q.add_argument("sql")
    q.add_argument("--max", type=int, default=200, help="최대 출력 행 (기본 200)")
    s = sp.add_parser("schema", help="DB 테이블·열 목록")
    s.add_argument("out")
    a = ap.parse_args(argv)
    if a.cmd == "convert":
        out = a.out or os.path.splitext(a.src)[0] + "_claude"
        Converter(a.src, out, formulas=not a.no_formulas, table_min=a.table_min, quiet=a.quiet).run()
        print(os.path.join(out, "INDEX.md"))
    elif a.cmd == "query":
        cmd_query(a.out, a.sql, a.max)
    else:
        cmd_schema(a.out)


if __name__ == "__main__":
    main()
