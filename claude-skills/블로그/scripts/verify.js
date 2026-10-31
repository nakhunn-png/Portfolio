// 방금 입력한 에디터 화면을 점검한다: 컴포넌트 순서, 서식, 캡션, 글자수, 임시저장 개수.
// 사용: node src/verify.js posts/01     → 콘솔 요약 + posts/01/verify.png (본문 전체 캡처)
import { connect } from './browser.js';
import path from 'node:path';

const postDir = process.argv[2] ?? '.';
const { context } = await connect();
const page = context.pages().filter((p) => p.url().includes('Redirect=Write')).at(-1);
if (!page) throw new Error('열린 글쓰기 탭이 없습니다');
const frame = page.frames().find((f) => f.url().includes('PostWriteForm'));

const report = await frame.evaluate(() => {
  const comps = [...document.querySelectorAll('.se-components-wrap > .se-component')];
  const rows = comps.map((c) => {
    const [, type, layout] = c.className.match(/se-component (se-\w+) se-l-(\w+)/) ?? [];
    const fmt = new Set();
    c.querySelectorAll('b').forEach(() => fmt.add('B'));
    c.querySelectorAll('u').forEach(() => fmt.add('U'));
    c.querySelectorAll('.se-highlight').forEach(() => fmt.add('HL'));
    c.querySelectorAll('[class*="se-fs"]').forEach((e) => {
      const fs = e.className.match(/se-fs(\d+)/)?.[1];
      if (fs && !['13', '15', '16', '19', '32'].includes(fs)) fmt.add(`fs${fs}`);
    });
    const caption = c.querySelector('.se-caption .se-text-paragraph')?.innerText.trim();
    const text = (c.querySelector('.se-section')?.innerText ?? '').split('\n')[0].slice(0, 40);
    return { type, layout, text, caption, fmt: [...fmt].join(',') };
  });
  const body = [...document.querySelectorAll('.se-components-wrap .se-text-paragraph')]
    .filter((p) => !p.closest('.se-documentTitle')).map((p) => p.innerText).join(' ');
  return {
    rows,
    chars: body.replace(/\s+/g, ' ').trim().length,
    charsNoSpace: body.replace(/\s/g, '').length,
    images: rows.filter((r) => r.type === 'se-image').length,
    captions: rows.filter((r) => r.caption).length,
    videos: rows.filter((r) => r.type === 'se-oembed').length,
    leftoverUrls: body.match(/https?:\/\/\S+/g) ?? [],
  };
});

for (const r of report.rows) {
  console.log(`${r.type}${r.layout !== 'default' ? `(${r.layout})` : ''} :: ${r.text}${r.caption ? ` | 캡션: ${r.caption}` : ''} ${r.fmt}`);
}
console.log(`\n글자수(공백 포함) ${report.chars} / (공백 제외) ${report.charsNoSpace}`);
console.log(`이미지 ${report.images} · 캡션 ${report.captions} · 영상 ${report.videos}`);
if (report.leftoverUrls.length) console.log('⚠ 본문에 남은 URL:', report.leftoverUrls.join(' '));
console.log('임시저장 개수:', await frame.locator('button[class*="save_count_btn"]').innerText());
// 요소 전체 캡처는 화면 밖이 비어 나오므로, 스크롤하며 화면 단위로 저장한다
const comps = frame.locator('.se-components-wrap > .se-component');
const n = await comps.count();
let shot = 0;
let lastBottom = -Infinity;
const view = page.viewportSize() ?? await page.evaluate(() => ({ height: innerHeight }));
for (let i = 0; i < n; i++) {
  const box = await comps.nth(i).boundingBox();
  if (box && box.y + box.height <= lastBottom) continue;
  await comps.nth(i).evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(postDir, `verify-${++shot}.png`) });
  lastBottom = (await comps.nth(i).boundingBox()).y + view.height - 120;
}
console.log(`화면 캡처 ${shot}장: ${postDir}/verify-*.png`);
process.exit(0);
