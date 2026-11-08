// SmartEditor ONE 입력기: post.json 의 블록을 순서대로 넣고 임시저장한다.
// 사용: node src/editor.js posts/01            (posts/01/post.json 사용)
//
// 확인된 동작 (2026-10-23 실험):
//  - 실제 클립보드 HTML 붙여넣기(Ctrl+V)가 서식을 보존한다:
//    <b>/<strong>, <u>, style="background-color|color|font-size:NNpx", <table>, <blockquote>, <hr>
//  - YouTube URL 을 평문으로 붙여넣으면 영상 임베드(se-oembed)가 된다
//  - 이미지는 툴바 '사진' 버튼 → 파일 선택, 캡션은 이미지 클릭 후 .se-caption 에 입력
//
// post.json 형식:
// { "title": "...",
//   "blocks": [
//     { "type": "html",  "html": "<p>...</p><blockquote data-style=\"postit\">...</blockquote>" },
//     { "type": "video", "url": "https://www.youtube.com/watch?v=..." },
//     { "type": "image", "file": "manual/01.png", "caption": "..." }
//   ] }
import { connect } from './browser.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const BODY_FONT_SIZE = 16; // docs/STYLE.md 본문 기준

// <blockquote data-style="..."> 값 → 에디터 인용구 레이아웃
const QUOTE_STYLES = {
  default: 'default',               // 큰따옴표
  line: 'quotation_line',           // 왼쪽 세로선
  bubble: 'quotation_bubble',       // 말풍선
  underline: 'quotation_underline', // 밑줄
  postit: 'quotation_postit',       // 포스트잇
  corner: 'quotation_corner',       // 모서리 괄호
};

const SEL = {
  frame: 'PostWriteForm',
  helpClose: '.se-help-panel-close-button',
  popupCancel: '.se-popup-button-cancel',
  title: '.se-documentTitle .se-text-paragraph',
  textParagraph: '.se-component.se-text .se-text-paragraph',
  lastComponent: '.se-components-wrap > .se-component:last-child',
  imageButton: 'button[data-group="documentToolbar"][data-name="image"]',
  imageComponent: '.se-component.se-image',
  caption: '.se-caption .se-text-paragraph',
  saveButton: 'button[class*="save_btn"]',
  bgColorButton: 'button[data-name="background-color"]',
  noColor: '.se-property-color-picker-container .se-color-palette-no-color',
  quotation: '.se-component.se-quotation',
  quoteLayout: 'button[data-name="quotation-layout"]',
};

export async function openEditor(context) {
  const page = await context.newPage();
  await page.goto('https://blog.naver.com/MyBlog.naver', { waitUntil: 'domcontentloaded' });
  const blogId = page.url().match(/blog\.naver\.com\/([\w-]+)/)?.[1];
  if (!blogId || blogId === 'MyBlog.naver') throw new Error('네이버 로그인이 필요합니다');
  await page.goto(`https://blog.naver.com/${blogId}?Redirect=Write&`, { waitUntil: 'domcontentloaded' });
  let frame;
  for (let i = 0; i < 40 && !frame; i++) {
    frame = page.frames().find((f) => f.url().includes(SEL.frame));
    if (!frame) await page.waitForTimeout(500);
  }
  await frame.waitForSelector(SEL.title, { timeout: 20000 });
  // "작성 중인 글이 있습니다. 이어서 작성하시겠습니까?" 팝업은 늦게 뜰 수 있다 → 취소(새로 쓰기)
  await frame.locator(SEL.popupCancel).click({ timeout: 5000 }).catch(() => {});
  await frame.locator(SEL.helpClose).click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { page, frame, blogId };
}

export function makeWriter(page, frame) {
  const pause = (ms) => page.waitForTimeout(ms);

  async function paste(html, text) {
    await frame.evaluate(async ([html, text]) => {
      const items = { 'text/plain': new Blob([text], { type: 'text/plain' }) };
      if (html) items['text/html'] = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem(items)]);
    }, [html, text]);
    await page.keyboard.press('Control+V');
    await pause(1200);
  }

  // 새 문단은 직전 문단의 글자크기·볼드·글자색을 물려받는다(소제목 뒤 본문이 24px 볼드가 됨).
  // 지정되지 않은 속성을 명시 span으로 감싸 상속을 끊는다. 단어 사이 공백 노드도 대상.
  // (font-weight:400 은 무시되고 normal 만 먹힘. 인용구는 자체 서식이 있어 제외)
  // 배경색은 transparent 지정이 무시되므로 clearBackground()로 커서 서식을 직접 끈다.
  async function normalize(html) {
    return frame.evaluate(([html, size]) => {
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      const structural = /^(BODY|TABLE|TBODY|THEAD|TR)$/;
      for (let n; (n = walker.nextNode());) {
        if (n.data.trim() || !structural.test(n.parentElement.tagName)) nodes.push(n);
      }
      for (const n of nodes) {
        const has = { size: false, bold: false, color: false };
        let quote = false;
        for (let e = n.parentElement; e && e !== doc.body; e = e.parentElement) {
          if (e.tagName === 'BLOCKQUOTE') { quote = true; break; }
          if (e.style?.fontSize) has.size = true;
          if (/^(B|STRONG)$/.test(e.tagName) || /bold|[6-9]00/.test(e.style?.fontWeight)) has.bold = true;
          if (e.style?.color) has.color = true;
        }
        if (quote || Object.values(has).every(Boolean)) continue;
        const span = doc.createElement('span');
        if (!has.size) span.style.fontSize = size;
        if (!has.bold) span.style.fontWeight = 'normal';
        if (!has.color) span.style.color = '#000000';
        n.replaceWith(span); span.append(n);
      }
      // 모바일 가독성: 본문 문단 사이에 빈 줄(<p><br></p>, 빈 <p>는 붙여넣기에서 사라짐).
      // 소제목(크기 19px 이상) 바로 뒤에는 넣지 않는다
      const isHeading = (p) => [...p.querySelectorAll('[style*="font-size"]')]
        .some((e) => parseInt(e.style.fontSize, 10) >= 19);
      for (const p of [...doc.body.querySelectorAll(':scope > p')]) {
        const next = p.nextElementSibling;
        if (next?.tagName === 'P' && p.textContent.trim() && next.textContent.trim() && !isHeading(p)) {
          const spacer = doc.createElement('p');
          spacer.append(doc.createElement('br'));
          p.after(spacer);
        }
      }
      return doc.body.innerHTML;
    }, [html, `${BODY_FONT_SIZE}px`]);
  }

  // 커서를 문서 맨 끝의 빈 문단으로 옮긴다
  async function toEmptyEnd() {
    const lastIsText = await frame.locator(SEL.lastComponent).evaluate((c) => c.classList.contains('se-text'));
    if (!lastIsText) throw new Error('마지막 컴포넌트가 텍스트가 아닙니다');
    // Ctrl+End는 여러 줄로 감긴 문단에서 '현재 줄 끝'까지만 가서 이미지·영상이 문단 중간에 끼었다.
    // 마지막 글자 바로 오른쪽을 클릭한 뒤 End로 문단 끝에 커서를 둔다.
    const last = frame.locator(SEL.textParagraph).last();
    await last.scrollIntoViewIfNeeded();
    const pos = await last.evaluate((p) => {
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      let node = null;
      for (let n; (n = walker.nextNode());) if (n.data.length) node = n;
      if (!node) return null;
      const r = document.createRange();
      r.setStart(node, node.data.length - 1);
      r.setEnd(node, node.data.length);
      const b = r.getBoundingClientRect();
      return { x: b.right, y: b.top + b.height / 2 };
    });
    if (pos) {
      const fbox = await (await frame.frameElement()).boundingBox();
      await page.mouse.click(fbox.x + pos.x, fbox.y + pos.y);
    } else {
      await last.click();
    }
    await page.keyboard.press('End');
    const empty = await frame.locator(SEL.textParagraph).last().evaluate((p) => !p.innerText.trim());
    if (!empty) await page.keyboard.press('Enter');
  }

  // 인용구를 선택하면 뜨는 툴바의 레이아웃 버튼으로 스타일을 바꾼다
  async function setQuoteStyle(quote, style) {
    const value = QUOTE_STYLES[style];
    if (!value) throw new Error(`알 수 없는 인용구 스타일: ${style} (${Object.keys(QUOTE_STYLES).join('/')})`);
    await quote.scrollIntoViewIfNeeded();
    await quote.click();
    await pause(400);
    await frame.locator(`${SEL.quoteLayout}[data-value="${value}"]`).filter({ visible: true }).first().click();
    await pause(400);
  }

  async function clearBackground() {
    await frame.locator(SEL.bgColorButton).filter({ visible: true }).first().click();
    await pause(400); // 팔레트 열림 애니메이션
    try {
      await frame.locator(SEL.noColor).filter({ visible: true }).first().click({ timeout: 8000 });
    } catch {
      console.warn('(배경색 초기화 실패 — 팔레트 닫고 계속)');
      await page.keyboard.press('Escape');
    }
    await pause(200);
  }

  return {
    async title(text) {
      await frame.locator(SEL.title).click();
      await page.keyboard.type(text, { delay: 30 });
    },
    async html(html) {
      await toEmptyEnd();
      await clearBackground();
      const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      // 붙여넣으면 blockquote 속성이 사라지므로 스타일 목록을 미리 뽑아 둔다
      const quoteStyles = [...html.matchAll(/<blockquote([^>]*)>/g)]
        .map((m) => m[1].match(/data-style="(\w+)"/)?.[1] ?? 'default');
      const before = await frame.locator(SEL.quotation).count();
      await paste(await normalize(html), plain);
      for (const [i, style] of quoteStyles.entries()) {
        if (style !== 'default') await setQuoteStyle(frame.locator(SEL.quotation).nth(before + i), style);
      }
    },
    async video(url) {
      await toEmptyEnd();
      await paste(null, url);
      await frame.waitForSelector('.se-component.se-oembed', { timeout: 15000 });
      await pause(1500);
      // 임베드가 생겨도 붙여넣은 URL 문자열이 문단에 남는다 → 그 문단을 비운다
      const urlPara = frame.locator(SEL.textParagraph).filter({ hasText: url }).last();
      if (await urlPara.count()) {
        await urlPara.click();
        await page.keyboard.press('End');
        // Shift+Home 선택은 링크 노드에서 끊겨 한 글자만 지워진다 → URL 글자 수만큼만 Backspace.
        // <br> 줄바꿈이 있는 문단 뒤에서는 URL이 앞 문장 줄 끝에 붙기도 해서 문단 전체 길이를 지우면 본문이 날아간다
        const text = (await urlPara.innerText()).trim();
        if (text.endsWith(url)) {
          for (let i = 0; i < url.length; i++) await page.keyboard.press('Backspace');
        } else {
          console.warn(`(영상 URL 문자열이 문단 끝에 있지 않아 지우지 않음: ${text.slice(0, 40)}…)`);
        }
        await pause(300);
      }
    },
    async image(file, caption) {
      await toEmptyEnd();
      const before = await frame.locator(SEL.imageComponent).count();
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        frame.locator(SEL.imageButton).click(),
      ]);
      await chooser.setFiles(file);
      await frame.waitForFunction(
        ([sel, n]) => document.querySelectorAll(sel).length > n
          && !document.querySelector(`${sel}:last-of-type .se-image-loading, .se-loading`),
        [SEL.imageComponent, before], { timeout: 30000 });
      await pause(1500);
      if (caption) {
        const img = frame.locator(SEL.imageComponent).nth(before);
        await img.locator('img').click();
        await img.locator(SEL.caption).click({ timeout: 5000 });
        await page.keyboard.type(caption, { delay: 15 });
      }
    },
    // 여러 문단을 붙여넣으면 본문 첫 빈 문단이 그대로 남는다 → 지운다
    async trimLeadingEmpty() {
      const first = frame.locator(SEL.textParagraph).first();
      if (await first.evaluate((p) => !p.innerText.trim())) {
        await first.click();
        await page.keyboard.press('Delete');
        await pause(300);
      }
    },
    async save() {
      await frame.locator(SEL.saveButton).click();
      await pause(2500);
    },
  };
}

export async function writePost(postDir) {
  const post = JSON.parse(await fs.readFile(path.join(postDir, 'post.json'), 'utf8'));
  const { context } = await connect();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://blog.naver.com' });
  const { page, frame } = await openEditor(context);
  await page.bringToFront();

  // 사용자의 클립보드 텍스트를 백업했다가 끝나면 되돌린다
  const savedClipboard = await frame.evaluate(() => navigator.clipboard.readText().catch(() => ''));

  const w = makeWriter(page, frame);
  try {
    await w.title(post.title);
    for (const [i, b] of post.blocks.entries()) {
      process.stdout.write(`[${i + 1}/${post.blocks.length}] ${b.type} `);
      if (b.type === 'html') await w.html(b.html);
      else if (b.type === 'video') await w.video(b.url);
      else if (b.type === 'image') await w.image(path.resolve(postDir, b.file), b.caption);
      else throw new Error(`알 수 없는 블록: ${b.type}`);
      console.log('ok');
    }
    await w.trimLeadingEmpty();
    await w.save();
    await page.screenshot({ path: path.join(postDir, 'result.png'), fullPage: false });
    console.log('임시저장 완료');
  } catch (e) {
    await page.screenshot({ path: path.join(postDir, 'error.png') }).catch(() => {});
    throw e;
  } finally {
    await frame.evaluate((t) => navigator.clipboard.writeText(t), savedClipboard).catch(() => {});
  }
  return { page, frame };
}

if (process.argv[1]?.endsWith('editor.js')) {
  await writePost(process.argv[2] ?? 'posts/test');
  process.exit(0);
}
