# -*- coding: utf-8 -*-
"""
네이버 부동산 매물 조회 프로그램 (PySide6 UI 버전)
- naver_land_crawler.py 와 같은 폴더에 두고 실행하세요.
필요 라이브러리: pip install requests openpyxl PySide6
실행: python naver_land_gui.py
"""
import faulthandler
import logging
import os
import re
import sys
import traceback
from datetime import datetime

from PySide6.QtCore import Qt, QThread, Signal, QUrl, QtMsgType, qInstallMessageHandler
from PySide6.QtGui import QDesktopServices, QFont
from PySide6.QtWidgets import (
    QApplication, QComboBox, QDialog, QFileDialog, QHBoxLayout, QHeaderView, QLabel,
    QLineEdit, QMainWindow, QMessageBox, QPushButton, QTableWidget,
    QTableWidgetItem, QVBoxLayout, QWidget, QSplitter,
)

from naver_land_crawler import (AREA_TYPES, COLUMNS, HTTP_LIB, Cancelled, Cart, NaverLand, PROPERTY_GROUPS,
                                filter_by_area_types, property_group, save, to_rows, trade_label)

VERSION = "v7"
TRADE_CHOICES = [("매매", "A1", True), ("전세", "B1", True), ("월세", "B2", False)]  # (이름, 코드, 기본선택)

# 장바구니 자동저장 위치 (프로그램을 꺼도 유지)
APP_DIR = os.path.join(os.environ.get("APPDATA") or os.path.expanduser("~"), "NaverLandViewer")
CART_PATH = os.path.join(APP_DIR, "cart.json")
# 오류 기록 (문제가 생기면 이 파일을 보내주면 됨)
LOG_PATH = os.path.join(APP_DIR, "error.log")

log = logging.getLogger("naverland")
_fault_file = None  # faulthandler가 쓰는 파일은 프로그램이 끝날 때까지 열어둬야 함


def setup_error_log(path=LOG_PATH):
    """놓친 파이썬 오류, Qt 경고/강제종료 메시지, 프로그램 비정상 종료를 path에 기록"""
    global _fault_file
    os.makedirs(os.path.dirname(path), exist_ok=True)
    handler = logging.FileHandler(path, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    log.addHandler(handler)
    log.setLevel(logging.INFO)
    log.info("프로그램 시작 (%s, 접속방식: %s)", VERSION, HTTP_LIB)

    _fault_file = open(path, "a", encoding="utf-8")
    faulthandler.enable(_fault_file)

    def qt_message(mode, context, message):
        if mode in (QtMsgType.QtWarningMsg, QtMsgType.QtCriticalMsg, QtMsgType.QtFatalMsg):
            log.error("Qt: %s", message)
    qInstallMessageHandler(qt_message)

    def excepthook(etype, value, tb):
        log.error("처리되지 않은 오류\n%s", "".join(traceback.format_exception(etype, value, tb)))
        if QApplication.instance():
            QMessageBox.warning(None, "오류", f"예상하지 못한 오류가 났어요.\n{etype.__name__}: {value}\n\n"
                                              f"자세한 내용은 아래 파일에 기록했어요:\n{path}")
    sys.excepthook = excepthook

TOGGLE_STYLE = """
QPushButton[toggle="true"] { padding: 4px 14px; border: 1px solid #b0b0b0; border-radius: 12px; background: #f4f4f4; }
QPushButton[toggle="true"]:checked { background: #03c75a; color: white; border-color: #03c75a; font-weight: bold; }
"""


def make_toggle(text, checked):
    b = QPushButton(text)
    b.setCheckable(True)
    b.setChecked(checked)
    b.setProperty("toggle", True)
    return b


class Worker(QThread):
    """네트워크 작업은 UI가 멈추지 않도록 별도 스레드에서 실행"""
    done = Signal(object)
    failed = Signal(str)
    cancelled = Signal(object)   # 중지됨. 그때까지 받은 결과
    progress = Signal(str)

    def __init__(self, fn, *args):
        super().__init__()
        self.fn, self.args = fn, args

    def run(self):
        try:
            self.done.emit(self.fn(self.progress.emit, *self.args))
        except Cancelled as e:
            self.cancelled.emit(e.partial)
        except Exception as e:  # noqa: BLE001
            log.error("작업 실패\n%s", traceback.format_exc())
            self.failed.emit(str(e))


class NumItem(QTableWidgetItem):
    """숫자 열은 숫자 기준으로 정렬"""
    def __lt__(self, other):
        try:
            return float(self.data(Qt.UserRole)) < float(other.data(Qt.UserRole))
        except (TypeError, ValueError):
            return super().__lt__(other)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"네이버 부동산 매물 조회  ({VERSION}, 접속방식: {HTTP_LIB})")
        self.resize(1300, 800)
        self.api = NaverLand()
        self.all_complexes, self.complexes, self.articles = [], [], []
        self.last_trade = ""
        self.raw_articles = []
        self.fetched_cx = None      # 현재 표에 보이는 매물의 단지
        self.cart = Cart(CART_PATH)
        self.current = None
        self.worker = None
        self._busy = False          # 작업 1개만 동시에 (끝난 뒤 결과 처리까지 포함)

        # --- 상단: 검색 ---
        self.keyword = QLineEdit(placeholderText="단지명 또는 지역 (예: 압구정 현대, 잠실동)")
        self.keyword.returnPressed.connect(self.search)
        self.btn_search = QPushButton("단지 검색", clicked=self.search)
        # 매물 종류 버튼: 켜고 끄면 단지 목록이 바로 걸러짐
        self.type_btns = {}
        for name in PROPERTY_GROUPS:
            b = make_toggle(name, True)
            b.toggled.connect(self.apply_type_filter)
            self.type_btns[name] = b
        top = QHBoxLayout()
        top.addWidget(QLabel("검색어"))
        top.addWidget(self.keyword, 1)
        top.addWidget(QLabel("  종류"))
        for b in self.type_btns.values():
            top.addWidget(b)
        top.addWidget(self.btn_search)

        # --- 단지 목록 ---
        self.tbl_cx = QTableWidget(0, 5)
        self.tbl_cx.setHorizontalHeaderLabels(["단지명", "주소", "유형", "세대수", "단지번호"])
        self.tbl_cx.setSelectionBehavior(QTableWidget.SelectRows)
        self.tbl_cx.setEditTriggers(QTableWidget.NoEditTriggers)
        self.tbl_cx.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.tbl_cx.cellDoubleClicked.connect(lambda *_: self.fetch())
        self.tbl_cx.itemSelectionChanged.connect(self.on_select)

        # --- 매물 조회 조건 ---
        self.lbl_sel = QLabel("선택된 단지: 없음")
        self.trade_btns = [(make_toggle(name, on), code) for name, code, on in TRADE_CHOICES]
        self.area_btns = {}
        for name, (lo, hi) in AREA_TYPES.items():
            b = make_toggle(name, False)
            b.setToolTip(f"전용면적 {lo:.2f}㎡ 이상 ~ {hi:.2f}㎡ 미만")
            b.toggled.connect(self.apply_area_filter)
            self.area_btns[name] = b
        self.btn_fetch = QPushButton("매물 조회", clicked=self.fetch)
        self.btn_stop = QPushButton("중지", clicked=self.stop)
        self.btn_stop.setToolTip("진행 중인 검색/조회를 멈추고 받은 데까지만 보여줘요")
        self.btn_stop.setEnabled(False)
        self.btn_excel = QPushButton("현재 표만 엑셀 저장", clicked=self.export)
        self.btn_excel.setEnabled(False)

        # --- 장바구니 ---
        self.lbl_cart = QLabel()
        self.lbl_cart.setStyleSheet("font-weight: bold; color: #03a04a;")
        self.btn_cart_add = QPushButton("장바구니 담기", clicked=self.cart_add)
        self.btn_cart_add.setEnabled(False)
        self.btn_cart_view = QPushButton("장바구니 보기/삭제", clicked=self.cart_view)
        self.btn_cart_dl = QPushButton("장바구니 엑셀 다운로드", clicked=self.cart_download)
        self.btn_cart_dl.setStyleSheet("QPushButton { background:#03c75a; color:white; font-weight:bold; padding:4px 12px; }"
                                       "QPushButton:disabled { background:#cfcfcf; }")
        cart_bar = QHBoxLayout()
        cart_bar.addWidget(self.lbl_cart, 1)
        cart_bar.addWidget(self.btn_cart_add)
        cart_bar.addWidget(self.btn_cart_view)
        cart_bar.addWidget(self.btn_cart_dl)
        cart_bar.addWidget(self.btn_excel)
        mid = QHBoxLayout()
        mid.addWidget(self.lbl_sel, 1)
        mid.addWidget(QLabel("거래유형 (여러 개 선택 가능, 모두 끄면 전체)"))
        for b, _ in self.trade_btns:
            mid.addWidget(b)
        mid.addSpacing(12)
        mid.addWidget(QLabel("전용면적 (모두 끄면 전체)"))
        for b in self.area_btns.values():
            mid.addWidget(b)
        mid.addSpacing(12)
        mid.addWidget(self.btn_fetch)
        mid.addWidget(self.btn_stop)

        # --- 매물 표 ---
        # 0번 열 = 체크박스, 그 뒤로 매물 정보. 맨 위 제목 칸(0번)을 누르면 전체선택/해제
        self.headers = [c[0] for c in COLUMNS]
        self.tbl = QTableWidget(0, len(self.headers) + 1)
        self.tbl.setHorizontalHeaderLabels(["☐ 전체선택"] + self.headers)
        self.tbl.setEditTriggers(QTableWidget.NoEditTriggers)
        self.tbl.setSortingEnabled(False)          # 정렬은 직접 처리(0번 열 클릭은 전체선택)
        self.tbl.horizontalHeader().setSectionsClickable(True)
        self.tbl.horizontalHeader().sectionClicked.connect(self.on_header_clicked)
        self.sort_state = (None, Qt.AscendingOrder)
        self.tbl.setAlternatingRowColors(True)
        self.tbl.cellDoubleClicked.connect(self.open_link)
        self.tbl.itemChanged.connect(self.on_item_changed)
        self._bulk = False

        self.status = QLabel("검색어를 입력하고 '단지 검색'을 누르세요. (매물 행을 더블클릭하면 네이버 부동산이 열려요)")

        bottom = QWidget()
        bl = QVBoxLayout(bottom)
        bl.setContentsMargins(0, 0, 0, 0)
        bl.addLayout(mid)
        bl.addLayout(cart_bar)
        bl.addWidget(self.tbl)
        split = QSplitter(Qt.Vertical)
        split.addWidget(self.tbl_cx)
        split.addWidget(bottom)
        split.setSizes([220, 580])

        root = QWidget()
        lay = QVBoxLayout(root)
        lay.addLayout(top)
        lay.addWidget(split, 1)
        lay.addWidget(self.status)
        self.setCentralWidget(root)
        self.refresh_cart_label()
        QApplication.instance().aboutToQuit.connect(self.shutdown)

    # ---------- 공통 ----------
    def is_busy(self):
        return self._busy or (self.worker is not None and self.worker.isRunning())

    def refuse_if_busy(self):
        """작업 중이면 안내만 하고 True"""
        if self.is_busy():
            self.status.setText("아직 조회 중이에요. 끝나거나 [중지]를 누른 뒤 다시 해주세요.")
            return True
        return False

    def run_bg(self, fn, on_done, *args):
        # 작업 중에 새 작업을 만들면 돌던 스레드가 지워지면서 Qt가 프로그램을 강제 종료함 (v6까지의 '툭 꺼짐')
        # 버튼, 더블클릭, Enter 모두 여기를 지나므로 이 한 곳에서 막음
        if self.refuse_if_busy():
            return False
        self.api.reset_cancel()
        self.set_busy(True)
        self.worker = Worker(fn, *args)
        self.worker.progress.connect(self.status.setText)
        self.worker.done.connect(lambda r: (self.set_busy(False), on_done(r)))
        self.worker.cancelled.connect(lambda r: self.on_cancelled(r, on_done))
        self.worker.failed.connect(self.on_fail)
        self.worker.start()
        return True

    def set_busy(self, busy):
        self._busy = busy
        for w in (self.btn_search, self.btn_fetch, self.keyword, self.tbl_cx):
            w.setEnabled(not busy)
        self.btn_stop.setEnabled(busy)
        self.btn_excel.setEnabled(not busy and bool(self.articles))

    def stop(self):
        if self.is_busy():
            self.api.cancel()
            self.btn_stop.setEnabled(False)
            self.status.setText("중지하는 중... (지금 받고 있는 페이지까지만 받고 멈춰요)")

    def on_cancelled(self, partial, on_done):
        self.set_busy(False)
        on_done(partial or [])
        self.status.setText("중지했어요. 받은 데까지만 보여줘요. " + self.status.text())

    def on_fail(self, msg):
        self.set_busy(False)
        self.status.setText("오류: " + msg)
        QMessageBox.warning(self, "오류", msg)

    def closeEvent(self, event):
        # 작업 중에 닫으면 중지 신호를 보내고, 스레드가 끝난 뒤에 프로그램을 끝냄 (창은 바로 숨김)
        if self.worker is not None and self.worker.isRunning():
            self.api.cancel()
            self.hide()
            event.ignore()
            app = QApplication.instance()
            self.worker.finished.connect(app.quit)
            if not self.worker.isRunning():  # 연결하는 사이에 끝났을 수도 있음
                app.quit()
            return
        super().closeEvent(event)

    def shutdown(self):
        """프로그램이 어떤 경로로 끝나든, 돌던 스레드가 멈출 때까지 기다린 뒤 끝냄"""
        if self.worker is not None and self.worker.isRunning():
            self.api.cancel()
            self.worker.wait()

    # ---------- 단지 검색 ----------
    def search(self):
        kw = self.keyword.text().strip()
        if not kw or self.refuse_if_busy():
            return
        self.status.setText(f"'{kw}' 검색 중...")
        self.run_bg(lambda emit, k: self.api.search_complexes(k, on_progress=emit), self.on_searched, kw)

    def on_searched(self, complexes):
        self.all_complexes = complexes
        self.apply_type_filter()

    def apply_type_filter(self, *_):
        on = [n for n, b in self.type_btns.items() if b.isChecked()]
        if not on:  # 둘 다 꺼져 있으면 전체
            shown = list(self.all_complexes)
        else:
            shown = [c for c in self.all_complexes if property_group(c) in on]
        self.current = None
        self.lbl_sel.setText("선택된 단지: 없음")
        self.show_complexes(shown)

    def show_complexes(self, complexes):
        self.complexes = complexes
        self.tbl_cx.setRowCount(len(complexes))
        for r, c in enumerate(complexes):
            vals = [c.get("complexName"), c.get("cortarAddress"), c.get("realEstateTypeName"),
                    c.get("totalHouseholdCount"), c.get("complexNo")]
            for col, v in enumerate(vals):
                self.tbl_cx.setItem(r, col, QTableWidgetItem("" if v is None else str(v)))
        counts = {}
        for c in self.all_complexes:
            counts[property_group(c)] = counts.get(property_group(c), 0) + 1
        detail = ", ".join(f"{k} {v}" for k, v in counts.items())
        self.status.setText(f"단지 {len(complexes)}개 표시 (전체 검색결과: {detail}). 단지를 선택하고 '매물 조회'를 누르세요 (더블클릭도 가능).")

    def on_select(self):
        rows = self.tbl_cx.selectionModel().selectedRows()
        if rows:
            self.current = self.complexes[rows[0].row()]
            self.lbl_sel.setText(f"선택된 단지: {self.current['complexName']} (#{self.current['complexNo']})")

    # ---------- 매물 조회 ----------
    def fetch(self):
        if self.refuse_if_busy():
            return
        if not self.current:
            QMessageBox.information(self, "알림", "먼저 단지를 선택하세요.")
            return
        trade = ":".join(code for b, code in self.trade_btns if b.isChecked())
        self.last_trade = trade
        cx = self.current

        group = property_group(cx)
        ret = ":".join(PROPERTY_GROUPS[group]) if group in PROPERTY_GROUPS else None

        def job(emit, complex_no, trade_code):
            return self.api.get_articles(
                complex_no, trade_code, real_estate_type=ret,
                on_progress=lambda msg: emit(f"[{cx['complexName']}] {msg.strip()} 수집 중..."))

        self.status.setText(f"[{cx['complexName']}] {trade_label(trade)} 매물 수집 중... (페이지마다 1.5~3초 대기)")
        self.run_bg(job, lambda arts: self.show_articles(arts, cx), cx["complexNo"], trade)

    def show_articles(self, articles, cx):
        self.raw_articles = articles
        self.fetched_cx = cx
        self.apply_area_filter()

    def apply_area_filter(self, *_):
        if not self.fetched_cx:
            return
        on = [n for n, b in self.area_btns.items() if b.isChecked()]
        articles = filter_by_area_types(self.raw_articles, on)
        self.render_articles(articles, on)

    def col(self, name):
        """매물 표에서 열 번호 (0번은 체크박스)"""
        return self.headers.index(name) + 1

    def render_articles(self, articles, area_on):
        self.articles = articles
        rows = to_rows(articles, self.fetched_cx["complexNo"])
        in_cart = self.cart.article_ids()
        self._bulk = True
        self.tbl.setRowCount(len(rows))
        for r, row in enumerate(rows):
            chk = QTableWidgetItem("담김" if articles[r].get("articleNo") in in_cart else "")
            chk.setFlags(Qt.ItemIsUserCheckable | Qt.ItemIsEnabled | Qt.ItemIsSelectable)
            chk.setCheckState(Qt.Unchecked)
            chk.setData(Qt.UserRole, r)              # 원래 매물 위치 (정렬해도 유지)
            chk.setToolTip("체크한 매물만 장바구니에 담겨요")
            self.tbl.setItem(r, 0, chk)
            for c, v in enumerate(row, start=1):
                if isinstance(v, (int, float)):
                    it = NumItem(f"{v:,}" if isinstance(v, int) else str(v))
                    it.setData(Qt.UserRole, v)
                    it.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
                else:
                    it = QTableWidgetItem("" if v is None else str(v))
                self.tbl.setItem(r, c, it)
        self._bulk = False
        self.sort_state = (None, Qt.AscendingOrder)
        self.tbl.horizontalHeader().setSortIndicatorShown(False)
        self.tbl.resizeColumnsToContents()
        self.tbl.setColumnWidth(0, 90)
        for c in (self.col("특징"), self.col("링크")):
            self.tbl.setColumnWidth(c, 300)
        self.btn_excel.setEnabled(bool(articles))
        self.update_check_ui()
        area_txt = f" / 면적 {'+'.join(area_on)}: {len(articles)}건 표시" if area_on else ""
        self.status.setText(f"[{self.fetched_cx['complexName']}] 매물 {len(self.raw_articles)}건 조회{area_txt}. "
                            f"담을 매물을 체크하거나 '전체선택'을 누른 뒤 장바구니에 담으세요.")

    # ---------- 체크박스 / 전체선택 ----------
    def checked_articles(self):
        out = []
        for r in range(self.tbl.rowCount()):
            it = self.tbl.item(r, 0)
            if it and it.checkState() == Qt.Checked:
                out.append(self.articles[it.data(Qt.UserRole)])
        return out

    def set_all_checked(self, checked):
        self._bulk = True
        state = Qt.Checked if checked else Qt.Unchecked
        for r in range(self.tbl.rowCount()):
            self.tbl.item(r, 0).setCheckState(state)
        self._bulk = False
        self.update_check_ui()

    def on_item_changed(self, item):
        if not self._bulk and item.column() == 0:
            self.update_check_ui()

    def update_check_ui(self):
        n_all, n_chk = self.tbl.rowCount(), len(self.checked_articles())
        mark = "☑" if n_all and n_chk == n_all else ("▣" if n_chk else "☐")
        self.tbl.horizontalHeaderItem(0).setText(f"{mark} 전체선택")
        self.btn_cart_add.setEnabled(n_chk > 0)
        self.btn_cart_add.setText(f"장바구니 담기 (체크 {n_chk}건)")

    def on_header_clicked(self, section):
        if section == 0:  # 전체선택 토글: 모두 체크돼 있으면 해제, 아니면 전부 체크
            n_all = self.tbl.rowCount()
            self.set_all_checked(not (n_all and len(self.checked_articles()) == n_all))
            return
        col, order = self.sort_state
        order = Qt.DescendingOrder if (col == section and order == Qt.AscendingOrder) else Qt.AscendingOrder
        self.sort_state = (section, order)
        self.tbl.sortItems(section, order)
        hdr = self.tbl.horizontalHeader()
        hdr.setSortIndicatorShown(True)
        hdr.setSortIndicator(section, order)

    def open_link(self, row, col):
        if col == 0:
            return
        it = self.tbl.item(row, self.col("링크"))
        if it:
            QDesktopServices.openUrl(QUrl(it.text()))

    # ---------- 엑셀 저장 ----------
    def export(self):
        if not self.articles:
            return
        targets = self.checked_articles() or self.articles   # 체크한 게 있으면 그것만, 없으면 표 전체
        safe = re.sub(r'[\\/:*?"<>|]', "_", self.fetched_cx["complexName"])
        default = f"매물_{safe}_{trade_label(self.last_trade)}_{datetime.now():%Y%m%d_%H%M}.xlsx"
        path, _ = QFileDialog.getSaveFileName(self, "엑셀로 저장", default, "Excel (*.xlsx)")
        if not path:
            return
        try:
            out = save(targets, path[:-5] if path.lower().endswith(".xlsx") else path,
                       self.fetched_cx["complexNo"], write_json=False)
        except PermissionError:
            QMessageBox.warning(self, "저장 실패", "같은 이름의 엑셀 파일이 열려 있어요. 엑셀을 닫고 다시 해주세요.")
            return
        except OSError as e:
            QMessageBox.warning(self, "저장 실패", f"엑셀 파일을 저장하지 못했어요.\n{e}")
            return
        self.status.setText(f"저장 완료: {out}")

    # ---------- 장바구니 ----------
    def current_condition(self):
        area_on = [n for n, b in self.area_btns.items() if b.isChecked()]
        return f"{trade_label(self.last_trade)} / {'+'.join(area_on) if area_on else '전체면적'}"

    def refresh_cart_label(self):
        self.lbl_cart.setText("" + self.cart.summary())
        self.btn_cart_dl.setEnabled(self.cart.total() > 0)
        self.btn_cart_view.setEnabled(bool(self.cart.groups))

    def cart_add(self):
        picked = self.checked_articles()
        if not picked or not self.fetched_cx:
            QMessageBox.information(self, "알림", "장바구니에 담을 매물을 체크해 주세요.\n(맨 위 '전체선택'을 누르면 한번에 체크돼요)")
            return
        cx = self.fetched_cx
        added, dup = self.cart.add(cx["complexNo"], cx["complexName"], self.current_condition(), picked)
        self.refresh_cart_label()
        # 담은 행은 '담김' 표시하고 체크 해제
        ids = self.cart.article_ids()
        self._bulk = True
        for r in range(self.tbl.rowCount()):
            it = self.tbl.item(r, 0)
            if self.articles[it.data(Qt.UserRole)].get("articleNo") in ids:
                it.setText("담김")
            it.setCheckState(Qt.Unchecked)
        self._bulk = False
        self.update_check_ui()
        msg = f"[{cx['complexName']}] {added}건을 장바구니에 담았어요."
        if dup:
            msg += f" (이미 담긴 {dup}건은 제외)"
        self.status.setText(msg + "  다른 단지를 검색해서 계속 담을 수 있어요.")

    def cart_view(self):
        dlg = CartDialog(self.cart, self)
        dlg.exec()
        self.refresh_cart_label()
        self.refresh_in_cart_marks()

    def refresh_in_cart_marks(self):
        ids = self.cart.article_ids()
        self._bulk = True
        for r in range(self.tbl.rowCount()):
            it = self.tbl.item(r, 0)
            it.setText("담김" if self.articles[it.data(Qt.UserRole)].get("articleNo") in ids else "")
        self._bulk = False

    def cart_download(self):
        if not self.cart.total():
            return
        default = f"매물_장바구니_{datetime.now():%Y%m%d_%H%M}.xlsx"
        path, _ = QFileDialog.getSaveFileName(self, "장바구니 엑셀 다운로드", default, "Excel (*.xlsx)")
        if not path:
            return
        try:
            out = self.cart.export_xlsx(path)
        except PermissionError:
            QMessageBox.warning(self, "저장 실패", "같은 이름의 엑셀 파일이 열려 있어요. 엑셀을 닫고 다시 해주세요.")
            return
        except OSError as e:
            QMessageBox.warning(self, "저장 실패", f"엑셀 파일을 저장하지 못했어요.\n{e}")
            return
        self.status.setText(f"장바구니 저장 완료: {out}")
        box = QMessageBox(self)
        box.setWindowTitle("저장 완료")
        box.setText(f"{self.cart.summary()}을 엑셀 하나로 저장했어요.\n\n{out}\n\n"
                    "시트: 요약 / 전체 / 담은 묶음별")
        b_open = box.addButton("엑셀 열기", QMessageBox.AcceptRole)
        b_clear = box.addButton("장바구니 비우기", QMessageBox.DestructiveRole)
        box.addButton("닫기", QMessageBox.RejectRole)
        box.exec()
        if box.clickedButton() is b_open:
            QDesktopServices.openUrl(QUrl.fromLocalFile(out))
        elif box.clickedButton() is b_clear:
            self.cart.clear()
            self.refresh_cart_label()
            self.refresh_in_cart_marks()


class CartDialog(QDialog):
    """장바구니 내용 보기 + 선택 삭제 + 비우기"""

    def __init__(self, cart, parent=None):
        super().__init__(parent)
        self.cart = cart
        self.setWindowTitle("장바구니")
        self.resize(720, 360)
        self.tbl = QTableWidget(0, 5)
        self.tbl.setHorizontalHeaderLabels(["단지명", "담은 조건", "매물 수", "담은 시각", "단지번호"])
        self.tbl.setSelectionBehavior(QTableWidget.SelectRows)
        self.tbl.setEditTriggers(QTableWidget.NoEditTriggers)
        self.tbl.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.lbl = QLabel()
        b_del = QPushButton("선택 항목 삭제", clicked=self.delete_selected)
        b_clear = QPushButton("전부 비우기", clicked=self.clear_all)
        b_close = QPushButton("닫기", clicked=self.accept)
        bar = QHBoxLayout()
        bar.addWidget(self.lbl, 1)
        for b in (b_del, b_clear, b_close):
            bar.addWidget(b)
        lay = QVBoxLayout(self)
        lay.addWidget(self.tbl)
        lay.addLayout(bar)
        self.refresh()

    def refresh(self):
        self.tbl.setRowCount(len(self.cart.groups))
        for r, g in enumerate(self.cart.groups):
            for c, v in enumerate([g["complexName"], g["condition"], len(g["articles"]), g["addedAt"], g["complexNo"]]):
                self.tbl.setItem(r, c, QTableWidgetItem(str(v)))
        self.lbl.setText(self.cart.summary())

    def delete_selected(self):
        rows = sorted({i.row() for i in self.tbl.selectionModel().selectedRows()}, reverse=True)
        for r in rows:
            self.cart.remove(r)
        self.refresh()

    def clear_all(self):
        if QMessageBox.question(self, "확인", "장바구니를 전부 비울까요?") == QMessageBox.Yes:
            self.cart.clear()
            self.refresh()


if __name__ == "__main__":
    try:
        setup_error_log()
    except OSError:
        pass  # 기록을 못 남겨도 프로그램은 실행
    app = QApplication(sys.argv)
    app.setFont(QFont("Malgun Gothic", 9))
    app.setStyleSheet(TOGGLE_STYLE)
    w = MainWindow()
    w.show()
    sys.exit(app.exec())
