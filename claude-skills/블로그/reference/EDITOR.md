# SmartEditor 입력기 (`scripts/editor.js`) 메모

> 2026-10-23 실험·테스트 결과. 네이버가 에디터를 바꾸면 여기부터 다시 확인.

## 실행

```bash
node ~/.claude/skills/블로그/scripts/naver.js ensure   # 브라우저(로그인 유지 프로필) 띄우기 — 작업 폴더에서 실행
node ~/.claude/skills/블로그/scripts/editor.js posts/01   # posts/01/post.json 을 입력하고 임시저장
```

- 결과 화면: `posts/<회차>/result.png`, 실패 시 `error.png`
- 실행 중 시스템 클립보드를 쓰므로 **입력이 끝날 때까지 복사·붙여넣기 금지** (끝나면 원래 클립보드 텍스트 복원)

## post.json

```json
{
  "title": "제목",
  "blocks": [
    { "type": "html",  "html": "<p>본문 <b>볼드</b> <u>밑줄</u></p>" },
    { "type": "video", "url": "https://www.youtube.com/watch?v=..." },
    { "type": "image", "file": "manual/01.png", "caption": "캡션" }
  ]
}
```

## html 블록에서 쓸 수 있는 서식 (붙여넣기로 보존 확인)

| 서식 | 쓰는 법 | 결과 |
|---|---|---|
| 볼드 | `<b>` / `<strong>` | O |
| 밑줄 | `<u>` (`text-decoration` 스타일은 X) | O |
| 글자 배경색 | `<span style="background-color:#fff59d">` | O (형광) |
| 글자색 | `<span style="color:#1e88e5">` | O |
| 글자크기 | `<span style="font-size:24px">` | O (se-fs24) |
| 인용구 | `<blockquote>` 또는 `<blockquote data-style="...">` | O (아래 스타일 표) |
| 표 | `<table border="1">` | O |
| 구분선 | `<hr>` | O |
| 기울임 | `<i>` | O |

## 인용구 스타일

`<blockquote data-style="postit">문장</blockquote>` 처럼 지정. 생략하면 기본형.
붙여넣으면 속성이 사라지므로, 입력기가 붙여넣기 후 해당 인용구를 클릭해 툴바 레이아웃 버튼(`data-name="quotation-layout"`)으로 바꾼다.

| data-style | 에디터 값 | 모양 |
|---|---|---|
| `default` | default | 큰따옴표 + 명조 기울임, 가운데 |
| `line` | quotation_line | 왼쪽 굵은 세로선, 왼쪽 정렬 |
| `bubble` | quotation_bubble | 말풍선 박스 |
| `underline` | quotation_underline | 작은 따옴표 아이콘 + 아래 밑줄, 왼쪽 정렬 |
| `postit` | quotation_postit | 접힌 모서리 메모지 박스 |
| `corner` | quotation_corner | 모서리 괄호 「」 |

## 알게 된 함정과 처리

| 문제 | 처리 |
|---|---|
| 합성 paste 이벤트는 무시됨 | 실제 클립보드에 쓰고 Ctrl+V |
| 새 문단이 직전 서식(크기·볼드·글자색)을 상속 → 소제목 뒤 본문이 24px 볼드 | `normalize()`가 지정 안 된 텍스트를 `font-size:16px; font-weight:normal; color:#000` span으로 감쌈 (`font-weight:400`은 무시됨) |
| 배경색도 상속되는데 `transparent` 지정은 무시됨 | 붙여넣기 전 툴바 배경색 → "색상 없음" 클릭 |
| YouTube URL 붙여넣으면 임베드는 생기지만 URL 글자가 남음 | 임베드 확인 후 **URL 글자 수만큼만** Backspace (Shift+Home은 링크에서 끊김). `<br>` 줄바꿈 문단 뒤에선 URL이 앞 문장 줄 끝에 붙어서, 문단 전체 길이만큼 지우면 앞 문장이 날아갔음(#3, 2026-10-24 수정). 문단이 URL로 끝날 때만 지움 |
| 본문 첫 빈 문단이 남음 | 끝나고 첫 문단이 비었으면 Delete |
| 여러 줄로 감긴 문단에서 Ctrl+End가 '현재 줄 끝'까지만 감 → 이미지·영상이 문단 중간에 끼임 | 마지막 글자 오른쪽을 마우스로 클릭 후 End |
| 문단이 빈 줄 없이 붙어 빽빽함 | `normalize()`가 본문 문단 사이에 `<p><br></p>` 삽입 (빈 `<p>`는 사라짐, 소제목 뒤는 제외) |
| "작성 중인 글이 있습니다" 팝업이 늦게 뜸 | 최대 5초 기다렸다가 취소 |
| 캡션 영역은 이미지 선택 전엔 숨겨짐 | 이미지 클릭 → `.se-caption` 클릭 → 입력 |
| 툴바에 `data-name="image"` 버튼이 2개 | `data-group="documentToolbar"` 로 한정 |

## 아직 안 한 것

- 태그 입력(발행 창에서만 가능) → 본문 마지막 해시태그 문단으로 대체
- 대표 이미지 지정: 첫 이미지가 자동 대표
