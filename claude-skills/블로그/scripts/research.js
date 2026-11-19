// 네이버 블로그 검색 상위 글을 모아 구조(글자수·이미지·서식 사용량)를 분석한다.
// 사용: node src/research.js "검색어1" "검색어2" ...   → research/refs.json
import { connect } from './browser.js';
import fs from 'node:fs/promises';

const QUERIES = process.argv.slice(2);
const PER_QUERY = 6;

const { context } = await connect();
const page = await context.newPage();

const urls = new Map();
for (const q of QUERIES) {
  await page.goto(`https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(q)}`);
  await page.waitForTimeout(2500);
  const found = await page.$$eval('a[href*="blog.naver.com/"]', (as) =>
    [...new Set(as.map((a) => a.href).filter((h) => /blog\.naver\.com\/[\w-]+\/\d{9,}/.test(h)))]);
  for (const u of found.slice(0, PER_QUERY)) if (!urls.has(u)) urls.set(u, q);
}

const results = [];
for (const [url, query] of urls) {
  const [, id, no] = url.match(/blog\.naver\.com\/([\w-]+)\/(\d+)/);
  try {
    await page.goto(`https://m.blog.naver.com/${id}/${no}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.se-main-container', { timeout: 8000 });
    await page.waitForTimeout(800);
    const data = await page.evaluate(() => {
      const root = document.querySelector('.se-main-container');
      const q = (s) => root.querySelectorAll(s).length;
      const text = [...root.querySelectorAll('.se-text-paragraph')].map((p) => p.innerText.trim()).filter(Boolean);
      const sizes = {};
      root.querySelectorAll('[class*="se-fs-"]').forEach((el) => {
        const m = el.className.match(/se-fs-(\w+)/); if (m) sizes[m[1]] = (sizes[m[1]] || 0) + 1;
      });
      return {
        title: document.querySelector('.se-title-text, .tit_h3')?.innerText.trim(),
        chars: text.join('').replace(/\s/g, '').length,
        charsWithSpaces: text.join('\n').length,
        paragraphs: text.length,
        images: q('.se-image'),
        captions: q('.se-image .se-caption, .se-imageStrip .se-caption'),
        imageStrips: q('.se-imageStrip'),
        videos: q('.se-video, .se-oembed'),
        quotes: q('.se-quotation'),
        quoteStyles: [...root.querySelectorAll('.se-quotation')].map((e) => e.className.match(/se-l-(\w+)/)?.[1]),
        tables: q('.se-table'),
        headings: q('.se-sectionTitle'),
        dividers: q('.se-horizontalLine'),
        stickers: q('.se-sticker'),
        links: q('.se-oglink'),
        bold: q('b, strong, .se-weight-bold, [style*="font-weight: bold"]'),
        underline: q('u, [style*="underline"]'),
        bgColor: q('[style*="background-color"]'),
        color: q('.se-text-paragraph [style*="color"]:not([style*="background"])'),
        fontSizes: sizes,
        firstLines: text.slice(0, 6),
        lastLines: text.slice(-4),
        hashtags: [...document.querySelectorAll('.post_tag a, .tag_area a, .se-hashtag')].map((a) => a.innerText.trim()).slice(0, 15),
      };
    });
    results.push({ url, query, ...data });
    console.log(`ok  ${data.chars}자 img${data.images} q${data.quotes} t${data.tables}  ${data.title}`);
  } catch (e) {
    console.log(`skip ${url}: ${e.message.split('\n')[0]}`);
  }
  await page.waitForTimeout(1200);
}

await fs.mkdir('research', { recursive: true });
await fs.writeFile('research/refs.json', JSON.stringify(results, null, 2));
await page.close();
console.log(`saved ${results.length} refs`);
process.exit(0);
