// 설치된 Google Chrome을 작업 폴더의 영구 프로필로 띄우고 계속 열어 둔다.
// 다른 스크립트는 connect()로 CDP 포트(9222)에 붙어서 같은 창·로그인 세션을 쓴다.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 로그인 프로필(쿠키)은 스킬 폴더(=git 저장소)가 아니라 작업 폴더에 둔다
export const WORKSPACE = process.env.BLOG_WORKSPACE ?? 'D:/블로그 자동화';
export const PROFILE_DIR = path.join(WORKSPACE, 'profile');
export const CDP_PORT = 9222;

export async function connect() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  return { browser, context: browser.contexts()[0] };
}

async function launch(urls) {
  // Playwright 번들 Chromium(AppData)은 PC 실행 정책에 막혀 설치된 Google Chrome을 사용
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    locale: 'ko-KR',
    args: [`--remote-debugging-port=${CDP_PORT}`, '--start-maximized'],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const [first] = context.pages();
  for (const [i, url] of urls.entries()) {
    const page = i === 0 && first ? first : await context.newPage();
    await page.goto(url).catch(() => {});
  }
  console.log(`테스트 브라우저 실행됨 (CDP ${CDP_PORT}). 창을 닫으면 종료됩니다.`);
  await new Promise((resolve) => context.on('close', resolve));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const urls = process.argv.slice(2);
  await launch(urls.length ? urls : ['https://nid.naver.com/nidlogin.login', 'https://claude.ai/login']);
}
