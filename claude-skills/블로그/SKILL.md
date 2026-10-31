---
name: 블로그
description: "교실 밖 AI 공부기" 네이버 블로그 글 1편을 만들어 임시저장까지 하는 절차. 사용자가 /블로그, "블로그 글 써줘", "다음 회차 포스팅", "오늘 블로그" 등을 말하면 사용. 오늘 날짜 폴더의 사진·메모를 가공해 넣고, 영상 1개를 임베드하고, 스타일 가이드 문체로 원고를 써서 Playwright로 네이버 SmartEditor에 입력한다. 발행은 하지 않는다.
---

# /블로그 — AI 공부기 1편 만들기

## 위치

| 무엇 | 경로 |
|---|---|
| 스킬(코드·규칙, git 관리) | `~/.claude/skills/블로그/` → `scripts/`, `reference/STYLE.md`, `reference/EDITOR.md` |
| 작업 폴더(데이터, git 아님) | `D:\블로그 자동화` (환경변수 `BLOG_WORKSPACE` 로 변경 가능) → `posts/NN/`, 날짜 폴더(`26-10-24` 등), `docs/PLAN.md`, `research/`, `scripts/crop_NN.py`, `profile/`(로그인 쿠키) |

- **모든 명령은 작업 폴더에서**, 스크립트는 스킬 경로로 실행한다: `cd "D:/블로그 자동화" && node ~/.claude/skills/블로그/scripts/editor.js posts/NN`
- 처음 쓰는 PC에서는 `cd ~/.claude/skills/블로그/scripts && npm install` (node_modules는 git에 없음)
- **작업 데이터(사진·원고·프로필)를 스킬 폴더에 만들거나 복사하지 않는다** — 스킬 폴더는 GitHub 저장소다.

시작 전에 반드시 읽는다:
- `reference/STYLE.md` — 화자·문체·글 구조·서식 기준·연재표 (화자 정보는 여기만 믿을 것)
- `reference/EDITOR.md` — post.json 형식, 쓸 수 있는 서식, 에디터 함정
- 작업 폴더 `docs/PLAN.md` — 결정 사항과 작업 로그 (마지막 회차 확인)

사용자가 준 인자(회차·주제·메모·폴더)가 있으면 그게 우선이다. 날짜 폴더 안에 `.md` 브리핑이 있으면 그 지시(포함할 영상, 과장 금지, [확인 필요] 등)를 따른다.

## 1. 브라우저와 로그인

```bash
node ~/.claude/skills/블로그/scripts/naver.js ensure   # 크롬이 없으면 띄우고(분리 실행) 네이버 로그인 여부 출력
```
- 브라우저 실행·CDP(127.0.0.1:9222) 접속은 **샌드박스 해제** 필요.
- 로그인이 풀렸으면 사용자에게 열린 크롬 창에서 로그인해 달라고 한다. 비밀번호를 대신 입력하지 않는다.
- Playwright 번들 Chromium은 이 PC 정책으로 실행 불가 → 설치된 Chrome(`channel: 'chrome'`). 우회 시도 금지.
- claude.ai는 자동화 브라우저 로그인을 차단한다 → Claude 화면 캡처는 **사용자가 직접** 찍는다. 우회 시도 금지.

## 2. 회차와 폴더

- 다음 회차 번호 = 작업 폴더 `posts/` 안의 가장 큰 번호 + 1 (`test` 제외). 폴더 `posts/NN/` 생성.
- 주제는 사용자 지정 > `reference/STYLE.md` 4장 연재표의 다음 회차 순.

## 3. 이미지

1. 작업 폴더에서 **오늘 날짜 이름의 폴더**(예: `26-10-23`)나 사용자가 지정한 하위 폴더를 찾는다. 없으면 `posts/NN/manual/`. 둘 다 없으면 캡처를 요청하고 `posts/NN/QUESTIONS.md`(질문·캡처 리스트)를 만들어 준 뒤 멈춘다.
2. 사용자가 대화에 붙여 넣은 사진은 그 날짜 폴더에 원본으로 저장한다.
3. **모든 이미지를 직접 열어 본다.** 개인정보는 모자이크, 빈 여백·마우스 커서는 크롭.
   - 개인정보: 성명, 주민번호, 발급번호, 이메일, 학교명, 학생 정보, 사이드바의 다른 대화 제목, **사용자의 관심 부동산(실제로 살고 싶은 집) 이름·단지번호·매물 화면** (STYLE.md 2장)
   - 회차별 가공 스크립트를 작업 폴더 `scripts/crop_NN.py` 로 남긴다 (`crop_01.py` 의 `mosaic()` 패턴). `python -I` 로 실행.
   - 결과는 날짜 폴더에 `01.png` … 로 저장하고 `posts/NN/manual/` 에 복사.
4. 가공 결과를 다시 열어 가림·크롭 확인.
5. 사진 장수는 사용자가 정한 대로. 있는 것만 쓰고 지어내지 않는다.

## 4. 영상 1개

- 사용자가 지정한 영상이 있으면 그것. 없으면 Anthropic 등 공식 채널. 찾지 못하면 넣지 않고 보고한다.
- 후보 URL은 oEmbed로 채널·제목 확인 (curl은 한글이 깨지니 node fetch):
  `node -e '(async()=>{const r=await fetch("https://www.youtube.com/oembed?url=<URL>&format=json");const d=await r.json();console.log(d.author_name,"|",d.title)})()'`
- 영상 아래에 `출처: <채널명> 「<영상 제목>」` 회색 글씨.
- **보지 않은 영상의 내용을 인용하거나 단정하지 않는다.** 요약은 사용자가 준 내용만.

## 5. 원고 (`posts/NN/post.json`)

- 형식과 서식 문법은 `reference/EDITOR.md`. 구조·말투·서식 개수는 `reference/STYLE.md` 3장 템플릿.
- 제목: `[교실 밖 AI 공부기 #N] ...`
- 글자수: **공백 포함 2,000~2,500자** (아래 명령으로 확인, verify로 재확인).
- 말투: **구어체 존댓말**(~했습니다/~거든요/~더라구요). 일기체·문학적 묘사·경구는 쓰지 않는다 (STYLE.md 2장 "쓰지 않는 것").
  - 레퍼런스 두 개를 섹션 역할로 나눠 섞는다:
    - 정보·방법·검증 섹션 = meetcpa: 한 줄 한 호흡 `<br>`, 2~4줄 묶음, 인용구 소제목
    - 도입·고민·소회·마무리 = 후천적 재능러: 한 문장 = 한 `<p>`, 근황으로 시작, 기대 vs 현실 솔직 고백, `,,`/`,,,` 회당 2~4번, 짧은 다짐 줄로 끝
  - 레퍼런스 문장을 그대로 베끼지 않는다.
- 인용구: 섹션 제목은 `data-style="line"`, 인물 대사는 `underline`.
- 사실이 아닌 것을 사실처럼 쓰지 않는다. 기록에 없는 개인 이야기는 빨간 글씨 `[확인 필요: …]` 로 남기고 보고에서 짚는다.
- 세법·회계 내용은 법령 원문(korean-law MCP 등)과 대조한 것만 단정한다. AI 답변은 "원문과 대조" 검증 습관을 보여준다.

```bash
node -e 'const p=require("./posts/NN/post.json");const t=p.blocks.map(b=>b.type==="html"?b.html.replace(/<br>/g," ").replace(/<[^>]+>/g," "):b.type==="image"?b.caption:"").join(" ");console.log(t.replace(/\s+/g," ").trim().length)'
```

## 6. 입력 → 검증

```bash
node ~/.claude/skills/블로그/scripts/editor.js posts/NN   # 새 글쓰기 탭에 입력 + 임시저장 (실행 중 클립보드 사용)
node ~/.claude/skills/블로그/scripts/verify.js posts/NN   # 컴포넌트·서식·캡션·글자수 요약 + verify-*.png
```
- 이전 글쓰기 탭이 열려 있으면 먼저 닫는다 (`page.close({ runBeforeUnload: false })`). 단, **사용자가 직접 고치던 탭이면 닫기 전에 내용을 읽어 반영**한다.
- `verify-*.png` 를 **전부 열어서** 확인: 이미지·영상이 문단 중간에 끼지 않았는지, 영상 앞 문장이 남아 있는지, 소제목 뒤 본문 크기, 형광 번짐, 남은 URL, 캡션, 가림.
- 다시 입력할 때마다 임시저장 글이 늘어나므로, 마지막에 **가장 최근 것만 남기고 지우라고** 안내한다 (삭제는 사용자가 직접).

## 7. 마무리

- **발행 버튼은 누르지 않는다.** 임시저장까지만.
- 작업 폴더 `docs/PLAN.md` 에 날짜·회차·제목·특이사항 기록. 연재표·문체 규칙 변경은 `reference/STYLE.md`, 에디터 동작에서 새로 알게 된 것은 `reference/EDITOR.md` 에 (스킬 저장소 변경이므로 커밋 여부는 사용자에게 맡긴다).
- 사용자 보고: 제목, 글자수, 이미지/영상 출처, 모자이크한 항목, 확인이 필요한 서술, 정리할 임시저장 글.
