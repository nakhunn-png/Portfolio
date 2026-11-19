// /네이버 스킬용 도우미: 로그인 유지 크롬을 띄우고 간단한 조회를 한다. 어느 폴더에서든 절대경로로 실행.
//   node "%USERPROFILE%/.claude/skills/블로그/scripts/naver.js" ensure              브라우저가 없으면 띄우고 로그인 여부 출력
//   node "%USERPROFILE%/.claude/skills/블로그/scripts/naver.js" text <url> [글자수]  새 탭에서 열어 본문 텍스트 출력 후 탭 닫기
//   node "%USERPROFILE%/.claude/skills/블로그/scripts/naver.js" shot <url> <out.png> 새 탭에서 열어 화면 캡처 후 탭 닫기
// 더 복잡한 조작은 스크립트에서 browser.js 의 connect() 를 import 해서 쓴다 (SKILL.md 참고).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect, CDP_PORT } from './browser.js';

const BROWSER_JS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'browser.js');

async function cdpUp() {
  try {
    const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    return r.ok;
  } catch {
    return false;
  }
}

async function ensure() {
  if (!(await cdpUp())) {
    spawn(process.execPath, [BROWSER_JS, 'https://www.naver.com'], {
      detached: true, stdio: 'ignore', cwd: path.dirname(BROWSER_JS),
    }).unref();
    for (let i = 0; i < 30 && !(await cdpUp()); i++) await new Promise((r) => setTimeout(r, 1000));
    if (!(await cdpUp())) throw new Error('브라우저를 띄우지 못했습니다');
  }
  const { context } = await connect();
  const cookies = await context.cookies(['https://www.naver.com']);
  const loggedIn = cookies.some((c) => c.name === 'NID_AUT');
  console.log(loggedIn ? '네이버 로그인됨' : '네이버 로그인 필요 — 열린 크롬 창에서 직접 로그인해 주세요');
  return context;
}

async function withPage(url, fn) {
  const context = await ensure();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    return await fn(page);
  } finally {
    await page.close({ runBeforeUnload: false }).catch(() => {});
  }
}

// 네이버 블로그 글은 iframe(mainFrame) 안에 본문이 있어 프레임까지 모아서 읽는다
async function pageText(page) {
  const texts = [];
  for (const f of page.frames()) {
    const t = await f.evaluate(() => document.body?.innerText ?? '').catch(() => '');
    if (t.trim()) texts.push(t.trim());
  }
  return texts.join('\n\n---\n\n');
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'ensure') {
  await ensure();
} else if (cmd === 'text') {
  const [url, limit = '8000'] = args;
  const text = await withPage(url, pageText);
  console.log(text.slice(0, Number(limit)));
} else if (cmd === 'shot') {
  const [url, out] = args;
  await withPage(url, (page) => page.screenshot({ path: out }));
  console.log(`saved ${out}`);
} else {
  console.log('사용법: ensure | text <url> [글자수] | shot <url> <out.png>');
}
process.exit(0);
