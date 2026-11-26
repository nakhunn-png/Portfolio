/* 냠냠 랜덤 디펜스 2 — 게임 설정값
 * 수치 조정은 이 파일에서만 한다. 괄호 안 번호는 PRD.md 의 장 번호.
 * 화면에 보이는 글자는 모두 한국어로 쓴다.
 */
var G = globalThis.G || (globalThis.G = {});

G.CONFIG = {
  // 5. 등급과 뽑기 확률 (합계 100). 히든은 뽑기로 나오지 않는다 (10-1)
  grades: [
    { key: 'normal',    name: '노말',     color: '#9aa0a8', dark: '#5d636b', light: '#e6e8eb', rate: 67, mult: 1 },
    { key: 'epic',      name: '에픽',     color: '#a45ee5', dark: '#6b2fa3', light: '#efe0fb', rate: 25, mult: 1.8 },
    { key: 'unique',    name: '유니크',   color: '#f28c28', dark: '#b85a0c', light: '#fde9d3', rate: 7,  mult: 3.5 },
    { key: 'legendary', name: '레전더리', color: '#3fbf4f', dark: '#1f7f2c', light: '#dcf6df', rate: 1,  mult: 7 },
    { key: 'hidden',    name: '히든',     color: '#3a2a3f', dark: '#1a1020', light: '#e4dcf0', rate: 0,  mult: 6 }
  ],
  merge: { normal: 5, epic: 3, unique: 3 },     // 5. 합성: 재료 몇 명 → 다음 등급 1명

  // 5. 냠냠 코인
  coin: { perCorrect: 10, comboEvery: 3, comboBonus: 5, drawCost: 30, start: 60 },

  // 6-1. 직업 6가지 (노말 기준). range 는 화면 픽셀, interval 은 게임 시간 초
  jobs: {
    sword:  { name: '검사',     atk: 22, interval: 0.9,  range: 200, style: '가까운 적 한 명을 세게' },
    archer: { name: '궁수',     atk: 11, interval: 0.55, range: 330, style: '먼 적 한 명을 빠르게' },
    mage:   { name: '마법사',   atk: 18, interval: 1.4,  range: 270, splash: 70, style: '여러 적에게 한꺼번에' },
    knight: { name: '기사',     atk: 16, interval: 1.0,  range: 220, push: 26, style: '적을 뒤로 밀어냄' },
    chef:   { name: '요리사',   atk: 7,  interval: 1.0,  range: 200, buff: 0.25, style: '옆 친구들 공격을 빠르게' },
    ice:    { name: '얼음술사', atk: 8,  interval: 1.1,  range: 250, slow: 0.4, slowSec: 1.6, style: '적을 느리게' }
  },
  slots: 8,              // 출전 칸 (2줄 × 4칸)
  life: 5,               // 생명. 적이 길을 한 바퀴 다 돌면 빠져나가며 생명 1 (보스는 2)
  escapeLaps: 1,         // 2026-11-25 「너무 쉬워」 → 두 바퀴에서 한 바퀴로

  // 9. 배속과 클리어 시간 보정
  speeds: [
    { name: '1배속',   v: 1,   count: 1.0, unlock: null },
    { name: '1.5배속', v: 1.5, count: 1.1, unlock: null },
    { name: '2배속',   v: 2,   count: 1.2, unlock: 3 },   // 스테이지 3을 깨면
    { name: '2.5배속', v: 2.5, count: 1.3, unlock: 6 }    // 스테이지 6을 깨면
  ],
  /* 웨이브 수는 미리 정하지 않고 실제 전투 시간으로 정한다 (9-3 원칙 2).
   * 웨이브가 끝날 때마다: 지금까지 실제 전투 시간 ≥ targetRealSec − (다음 웨이브 예상 실제 시간 × 0.5) 이면 끝.
   * 배속을 바꾸지 않으면 1배속 4, 1.5배속 5, 2배속 6, 2.5배속 7 웨이브가 된다. */
  battleTime: { targetRealSec: 220, waveGameSec: 66, minWaves: 4, maxWaves: 7 },   // 적이 나오는 시간 = 66 × 0.9 ≈ 59초 (1배속)
  bossSpeedCap: 1.5,
  questionBubbleSec: 20,       // 전투 중 문제 풍선 간격 (실제 시간)
  questionBubbleLife: 2,       // 풍선이 떠 있는 시간 (실제 시간). 2026-11-26 10 → 2초 (얼른 눌러야 하는 보너스)
  minCorrectToClear: 15,       // 9-3 원칙 3
  turboEnemyBonus: 5,          // 터보 적 코인
  problems: { prep: 5, betweenWaves: 3 },
  /* 튜토리얼은 2분 안에 끝난다 (2026-11-26): 문제 수·웨이브 수·웨이브 길이를 줄이고, 답을 알려 준다 */
  tutorialQuick: { prep: 3, betweenWaves: 1, waves: 2, minionWaves: 1, minCorrect: 4, waveMul: 0.45 },

  /* 7. 스테이지 9개
   * gimmick: bubble(거품 적) / blizzard(눈보라) / storm(모래폭풍·갈림길) / dark(어둠·조명)
   * hp: 적 체력 배율. 뒤 스테이지일수록 조금씩 세진다. speed: 적 빠르기 배율 (우주 정거장은 길이 아주 길어서 빠르게) */
  stages: [
    { no: 1, name: '과자 숲',     unit: 1, hp: 1.25, path: 'loop',    enemies: ['jellyBear', 'cookieSoldier'], types: ['A1', 'A2'], format: 'choice', ready: true,
      tip: '처음이에요! 문제를 풀고 친구를 뽑아요.' },
    { no: 2, name: '바닷속',      unit: 1, hp: 1.55, path: 'eight',   enemies: ['puffer', 'jellyfish'], types: ['A3', 'A4', 'A5'], format: 'choice', ready: true, gimmick: 'bubble',
      tip: '해파리는 거품 갑옷을 입었어요. 세 번 맞혀야 거품이 터져요!' },
    { no: 3, name: '문어 대장',   unit: 1, hp: 1.3, minionHp: 1.15, path: 'whirl',   boss: 'octopus', enemies: ['babyOctopus', 'puffer'], types: ['A5', 'A3'], format: 'choice', ready: true,
      tip: '보스가 나오면 문어 다리 숫자 두 개를 골라 10을 만들어 잘라요!' },
    { no: 4, name: '눈나라',      unit: 2, hp: 1.22, path: 'zigzag',  enemies: ['snowball', 'babyBear'], types: ['B1', 'B2'], format: 'tenframe', ready: true, gimmick: 'blizzard',
      tip: '눈보라가 불면 친구 하나가 잠깐 얼어요.' },
    { no: 5, name: '사막',        unit: 2, hp: 1.3, path: 'fork',    enemies: ['mole', 'cactus'], types: ['B3', 'B4'], format: 'keypad', ready: true, gimmick: 'storm',
      tip: '모래폭풍이 불면 적이 다른 길로 가요. 양쪽에 친구를 세워요!' },
    { no: 6, name: '전갈 왕',     unit: 2, hp: 1.7, minionHp: 1.2, path: 'arena',   boss: 'scorpion', enemies: ['babyScorpion', 'mole'], types: ['B1', 'B3'], format: 'choice', ready: true,
      tip: '보스가 나오면 영웅을 끌어서 빨간 원을 피해요!' },
    { no: 7, name: '우주 정거장', unit: 3, hp: 1.3, speed: 1.35, path: 'rings',   enemies: ['alien', 'meteorRock'], types: ['C1'], format: 'column', ready: true,
      tip: '적이 바깥 고리를 돈 뒤 안쪽 고리로 갈아타요.' },
    { no: 8, name: '밤 놀이공원', unit: 3, hp: 0.95, path: 'coaster', enemies: ['toySoldier', 'balloonGhost'], types: ['C2'], format: 'pickExpr', ready: true, gimmick: 'dark',
      tip: '깜깜해서 친구들이 가까운 적만 봐요. 보너스 문제를 맞히면 조명이 켜져요!' },
    { no: 9, name: '냠냠 마왕',   unit: 3, hp: 2.0, minionHp: 1.25, path: 'star',    boss: 'demon', enemies: ['imp', 'toySoldier'], types: ['A5', 'B1', 'B3', 'C1', 'C2'], format: 'choice', ready: true,
      tip: '마왕은 세 번 변신해요. 마지막에는 5문제를 연속으로 맞혀 마지막 일격!' }
  ],

  /* 18. 영웅 (스테이지를 시작할 때 1명 고른다). cd: 능력 다시 쓰는 시간 (게임 시간 초)
   * target: true 면 능력 버튼을 누른 뒤 화면에서 위치를 고른다. dmg 는 진행 정도만큼 함께 세진다 */
  heroes: {
    mage:   { name: '시간 마법사', skillName: '느려져라!',   skill: 'slowZone',  cd: 18, target: true, r: 120, slow: 0.3, dur: 15,
      desc: '고른 곳의 적을 15초 동안 아주 느리게 만들어요.' },
    cheer:  { name: '응원단장',   skillName: '힘내라 응원!', skill: 'cheer',     cd: 20, mult: 1.7, dur: 18,
      desc: '모든 친구의 공격력을 18초 동안 크게 올려요.' },
    shield: { name: '방패병',     skillName: '길 막기!',     skill: 'block',     cd: 16, target: true, dur: 12,
      desc: '고른 길을 12초 동안 막아 적이 못 지나가요.' },
    archer: { name: '명사수 궁수', skillName: '화살비!',      skill: 'arrowRain', cd: 15, target: true, r: 110, dmg: 160,
      desc: '고른 곳에 화살비를 쏟아 강하게 공격해요.' },
    // 아크메이지: 수학이 어려운 친구를 위한 치트키. 일부러 아주 세다(약하게 만들지 않는다). 2026-11-26 대기 26 → 10초, 피해 900 → 2500
    arch:   { name: '아크메이지', skillName: '메테오!',      skill: 'meteor',    cd: 10, dmg: 2500, secret: true,
      desc: '화면 모든 적에게 메테오를 떨어뜨려요. 10초마다 쓸 수 있어요!' }
  },
  heroOrder: ['mage', 'cheer', 'shield', 'archer', 'arch'],

  /* 8. 보스전. 보스 스테이지는 부하 웨이브 2개 → 문제 3개 → 보스
   * hp: 보스 체력 (스테이지 hp·난이도 bossHp 를 곱한다), speed: 길을 도는 빠르기 (난이도와 상관없이 같다). 한 바퀴를 다 돌면 생명 2 를 잃고 다시 돈다
   * 보스전 문제 칸: 맞힐 때마다 필살기 칸 1개 (3개가 차면 영웅 능력). 보스전 동안 능력 대기 시간은 멈춘다 */
  boss: {
    minionWaves: 2, lapLife: 2, pipsNeed: 3, heroMove: 320,
    octopus:  { name: '문어 대장', hp: 4100, speed: 16, legRegrow: 22, armor: 0.3, stun: 5, vuln: 2 },
    scorpion: { name: '전갈 왕',   hp: 3800, speed: 18, stingEvery: 5, stingWarn: 1.5, stingR: 52, heroStun: 3, quickSec: 7 },
    demon:    { name: '냠냠 마왕', hp: 5800, speed: 15, summonEvery: 8, summonHp: 60, starEvery: 4, starWarn: 1.6, starR: 56, eatEvery: 7, eatSec: 6, comboNeed: 5 }
  },

  /* 2026-11-26 적이 단단해져서 배율이 크게 곱해지면 어려움부터 절벽이 됐다(보통 83% → 어려움 30%). 한 단계마다 고르게 어려워지도록 줄임
   * 난이도 5단계 (영웅 고르기 화면에서 고른다). 재앙은 숨은 난이도: 냠냠 마왕을 「아주 어려움」으로 깨면 열린다
   * hp·count·speed: 적 체력·수·빠르기 배율, bossHp: 보스 체력 배율, life: 생명, keypad: 보기 고르기 문제를 숫자 자판으로, flash: 식이 이 초 뒤에 사라짐 */
  difficulties: [
    { key: 'tutorial', bossHp: 0.4, bossSpeed: 0.75, name: '튜토리얼',   hp: 0.5,  count: 0.7,  speed: 0.8,  life: 5, coins: 120, tutorial: true,
      desc: '처음이라면 여기부터! 답을 알려 주고 2분이면 끝나요.' },
    { key: 'easy', bossHp: 0.75, bossSpeed: 0.95,     name: '쉬움',       hp: 0.95, count: 0.95, speed: 0.92,  life: 5, coins: 90, desc: '처음 하는 친구에게 딱!' },
    { key: 'normal', bossHp: 1.0, bossSpeed: 1.06,   name: '보통',       hp: 1.0,  count: 1.0,  speed: 1.0,  life: 5, coins: 60, desc: '기본 난이도예요.' },
    { key: 'hard', bossHp: 1.25, bossSpeed: 1.08,     name: '어려움',     hp: 1.12, count: 1.05, speed: 1.05,  life: 4, coins: 60, keypad: true, desc: '답을 숫자 자판으로 직접 써요.' },
    { key: 'veryhard', bossHp: 1.7, bossSpeed: 1.2, name: '아주 어려움', hp: 1.32, count: 1.12, speed: 1.12,  life: 3, coins: 60, keypad: true, desc: '생명 3개, 적이 훨씬 강해요.' },
    { key: 'disaster', bossHp: 1.9, bossSpeed: 1.2, name: '재앙',       hp: 1.52,  count: 1.15, speed: 1.15,  life: 1, coins: 60, keypad: true, flash: 2, hidden: true,
      desc: '생명은 단 1개! 식은 2초 뒤에 사라져요.' }
  ],
  defaultDifficulty: 'normal',

  /* 6-3. 도감 보상. need: 모은 수 (hiddenOut 이면 히든을 빼고 센다) */
  bookRewards: [
    { key: 'gift100', need: 10, text: '선물 코인 100', desc: '다음 판을 시작할 때 코인 100을 더 받아요.' },
    { key: 'slot9',   need: 20, text: '출전 칸 +1',    desc: '친구 9명이 함께 싸워요.' },
    { key: 'gold',    need: 27, hiddenOut: true, text: '도감 금테', desc: '도감이 반짝이는 금테로 바뀌어요.' }
  ],
  extraSlots: 1,          // 출전 칸 +1 을 받으면 9칸

  /* 10-1. 도전 과제. 도전 영역은 스테이지 3을 깨면 열린다 */
  challengeUnlock: 3,
  achievements: [
    { key: 'bolt',     name: '번개 보스 사냥',   desc: '보스 셋을 모두 1.5배속으로 이기기', char: 'h1' },
    { key: 'combo15',  name: '척척 연속 정답',   desc: '한 판에서 15문제를 연속으로 맞히기', char: 'h2' },
    { key: 'tower30',  name: '탑 꼭대기',       desc: '도전의 탑 30층에 오르기',        char: 'h3' },
    { key: 'noHit',    name: '하나도 안 맞았어', desc: '생명을 잃지 않고 영웅도 안 맞고 보스 이기기', gift: 300 },
    { key: 'allStars', name: '별 부자',         desc: '9스테이지 모두 별 3개',          frame: 'rainbow' }
  ],

  /* 10-2. 도전의 탑. 한 층 = 웨이브 1개 + 문제 3개. 5층마다 작은 보스.
   * 5층마다 배경이 바뀐다 (themes 의 스테이지 길과 적을 빌려 쓴다. 기믹은 없다).
   * 적 수 = (base + countGrowth × (층 − 1)) × 배속 적 수 배율, 적 체력 = wave.hp × hpGrowth^(층 − 1) (곱으로 늘어야 뽑기·합성으로 강해지는 친구들을 따라잡는다) */
  tower: { name: '도전의 탑', hpMul: 0.32, themes: [1, 2, 4, 5, 7, 8, 9], themeFloors: 5, spawnSec: 24, base: 9, countGrowth: 0.45, hpGrowth: 1.1,
    miniEvery: 5, miniHp: 16, miniSpeed: 0.55, miniBosses: ['octopus', 'scorpion', 'demon'], problems: 3, goal: 30,
    units: [[1, 10, 1], [11, 20, 2], [21, 999, 3]] },   // 층 범위별로 새로 섞는 단원 (1~10층 단원 1, 11층부터 2까지, 21층부터 3까지)

  /* 10-3. 만들어요 놀이. rounds: 한 번에 몇 판, coin: 한 판 성공마다 선물 코인 */
  plays: [
    { key: 'dice',    name: '주사위 10 만들기', unit: '2단원', rounds: 6, coin: 5, desc: '주사위 두 개로 10을 만들고 남은 수를 더해요.' },
    { key: 'road',    name: '덧셈과 뺄셈 길',   unit: '4단원', rounds: 5, coin: 6, desc: '+, − 카드를 골라 도착 수까지 가요.' },
    { key: 'command', name: '명령어 만들기',    unit: '6단원', rounds: 5, coin: 6, desc: '앞으로, 뒤로 명령으로 깃발에 가요.' }
  ],
  giftMax: 600,           // 모아 둘 수 있는 선물 코인
  giftPerRun: 60,         // 한 판을 시작할 때 받는 선물 코인 (남은 것은 다음 판에)
  heroAttack: { atk: 18, interval: 0.9, range: 280 },   // 영웅의 보통 공격
  secretClicks: 5, secretGap: 1.2,   // 연속으로 누를 때 사이 시간(초)이 이보다 길면 처음부터
                                      // 영웅 고르기 화면을 이만큼 누르면 아크메이지가 나온다
  /* 웨이브 적 수 = (base + countGrowth × 진행 정도) × 배속 적 수 배율
   * 적 체력   = hp × (1 + hpGrowth × 진행 정도)
   * 진행 정도 = 그 웨이브 전까지의 계획 실제 시간 ÷ targetRealSec (0 ~ 약 0.9). 배속과 상관없이 마지막 웨이브 세기가 같다 */
  /* 2026-11-26 「나오자마자 5초도 안 돼서 죽는다」 → 적을 적게, 훨씬 단단하게. 첫 웨이브부터 길을 꽤 돌게 하고, 뒤로 갈수록 덜 가파르게 센다
   * (전: base 16 · countGrowth 13 · hp 66 · hpGrowth 1.2. 첫 웨이브 적이 길의 5% 만에 죽었다) */
  wave: { base: 9, countGrowth: 6, spawnPortion: 0.9, hp: 275, hpGrowth: 0.45, speed: 70 }
};

// 적 종류 (hp·speed 는 wave 기본값에 곱하는 배율)
// shield: 거품 갑옷 (이만큼 맞아야 터지고, 그 뒤에 체력이 준다)
G.ENEMIES = {
  jellyBear:     { name: '젤리 곰',     hp: 1.0, speed: 1.0 },
  cookieSoldier: { name: '쿠키 병정',   hp: 1.5, speed: 0.8 },
  puffer:        { name: '복어',       hp: 1.1, speed: 0.95 },
  jellyfish:     { name: '해파리',     hp: 0.8, speed: 0.9, shield: 3 },
  snowball:      { name: '눈덩이',     hp: 0.9, speed: 1.15 },
  babyBear:      { name: '아기 백곰',   hp: 1.6, speed: 0.75 },
  mole:          { name: '모래 두더지', hp: 1.0, speed: 1.05 },
  cactus:        { name: '선인장',     hp: 1.5, speed: 0.8 },
  alien:         { name: '꼬마 외계인', hp: 1.0, speed: 1.0 },
  meteorRock:    { name: '운석',       hp: 1.6, speed: 0.75 },
  toySoldier:    { name: '장난감 병정', hp: 1.3, speed: 0.85 },
  balloonGhost:  { name: '풍선 유령',   hp: 0.8, speed: 1.2 },
  // 보스 스테이지 부하
  babyOctopus:   { name: '꼬마 문어',   hp: 1.0, speed: 1.0 },
  babyScorpion:  { name: '아기 전갈',   hp: 1.2, speed: 1.0 },
  imp:           { name: '마왕의 부하', hp: 1.1, speed: 1.05 }
};

/* 18. 영웅 그림 재료 (도감에는 들어가지 않는다) */
G.HERO_CHARS = [
  { id: 'mage',   grade: 'unique', job: 'mage',   name: '시간 마법사',
    look: { hair: '#c9a8ff', hairStyle: 'long', hat: 'wizard', hatColor: '#5a3fb0', hatStar: true, outfit: '#7b5fd8', outfit2: '#3c2a8a', weapon: 'staff', orb: '#7fe3ff', extra: 'cape', capeColor: '#2a6ad0' } },
  { id: 'cheer',  grade: 'unique', job: 'chef',   name: '응원단장',
    look: { hair: '#ffb02e', hairStyle: 'twin', hat: 'band', hatColor: '#e0303a', outfit: '#e0303a', outfit2: '#ffffff', weapon: 'pompom' } },
  { id: 'shield', grade: 'unique', job: 'knight', name: '방패병',
    look: { hair: '#5a3a1e', hairStyle: 'short', hat: 'helmet', hatColor: '#7d8894', plume: '#3aa0f0', outfit: '#9fb2d8', outfit2: '#4b5a78', weapon: 'bigShield', shieldColor: '#3aa0f0' } },
  { id: 'archer', grade: 'unique', job: 'archer', name: '명사수 궁수',
    look: { hair: '#f5c542', hairStyle: 'long', ears: 'elf', hat: 'feather', hatColor: '#e0603a', outfit: '#2e9a3d', outfit2: '#1f6a2a', weapon: 'bow', bowColor: '#ffd23f', bowGem: '#ff5a7a' } },
  { id: 'arch',   grade: 'legendary', job: 'mage', name: '아크메이지',
    look: { hair: '#f2f2f2', hairStyle: 'long', hat: 'wizard', hatColor: '#3a1a5a', hatStar: true, outfit: '#5a1a3a', outfit2: '#ffd23f', weapon: 'staff', orb: '#ff7a3a', extra: 'wings' } }
];

/* 6-2. 캐릭터 30종 (노말 12, 에픽 8, 유니크 5, 레전더리 2, 히든 3)
 * look 은 도트 그림 재료 (js/art/characters.js). theme 은 그 테마 스테이지에서 공격 +10%.
 */
G.CHARACTERS = [
  // ── 노말 12 ──
  { id: 'n1',  grade: 'normal', job: 'sword',  name: '갈색 머리 검사', desc: '씩씩하게 칼을 휘두르는 첫 번째 친구예요.',
    look: { hair: '#8a5a32', hairStyle: 'short', outfit: '#4a7fd4', outfit2: '#2f5aa0', weapon: 'sword' } },
  { id: 'n2',  grade: 'normal', job: 'sword',  name: '토끼 귀 검사', desc: '긴 귀로 적 발소리를 먼저 들어요.',
    look: { hair: '#f2f2f2', hairStyle: 'bob', ears: 'bunny', earColor: '#f2f2f2', outfit: '#f08bb0', outfit2: '#c95a85', weapon: 'sword' } },
  { id: 'n3',  grade: 'normal', job: 'archer', name: '초록 모자 궁수', desc: '나무 위에서 화살을 쏘는 걸 좋아해요.',
    look: { hair: '#d9a441', hairStyle: 'short', hat: 'hood', hatColor: '#55b04a', outfit: '#55b04a', outfit2: '#3a7d33', weapon: 'bow' } },
  { id: 'n4',  grade: 'normal', job: 'archer', name: '꼬마 궁수', desc: '작지만 화살은 누구보다 빨라요.',
    look: { hair: '#4a3020', hairStyle: 'twin', outfit: '#e2a24a', outfit2: '#b5762a', weapon: 'bow' } },
  { id: 'n5',  grade: 'normal', job: 'mage',   name: '꼬마 마법사', desc: '처음 배운 마법으로 반짝반짝 공격해요.',
    look: { hair: '#6b4426', hairStyle: 'long', hat: 'wizard', hatColor: '#4f78d8', outfit: '#4f78d8', outfit2: '#33529e', weapon: 'staff', orb: '#7fe3ff' } },
  { id: 'n6',  grade: 'normal', job: 'mage',   name: '파란 망토 마법사', desc: '망토를 펄럭이며 물방울 마법을 써요.',
    look: { hair: '#2b2b45', hairStyle: 'spiky', outfit: '#3aa7c9', outfit2: '#24758f', weapon: 'staff', orb: '#bdf3ff', extra: 'cape', capeColor: '#2a6ad0' } },
  { id: 'n7',  grade: 'normal', job: 'knight', name: '작은 갑옷 기사', desc: '작은 갑옷을 입고 친구들을 지켜요.',
    look: { hair: '#8a5a32', hairStyle: 'short', hat: 'helmet', hatColor: '#b8c2cc', outfit: '#b8c2cc', outfit2: '#7d8894', weapon: 'shield', shieldColor: '#c9a05a' } },
  { id: 'n8',  grade: 'normal', job: 'knight', name: '냄비 투구 기사', desc: '엄마 냄비를 투구로 썼지만 아주 튼튼해요.',
    look: { hair: '#d9a441', hairStyle: 'bob', hat: 'pot', hatColor: '#8c9298', outfit: '#9c7a54', outfit2: '#6e5236', weapon: 'shield', shieldColor: '#a7764a' } },
  { id: 'n9',  grade: 'normal', job: 'chef',   name: '국자 요리사', desc: '맛있는 냄새로 친구들 힘을 북돋아요.',
    look: { hair: '#6b4426', hairStyle: 'short', hat: 'chef', hatColor: '#ffffff', outfit: '#ffffff', outfit2: '#e05a4a', weapon: 'ladle' } },
  { id: 'n10', grade: 'normal', job: 'chef',   name: '붕어빵 요리사', desc: '따끈한 붕어빵을 친구들에게 나눠 줘요.',
    look: { hair: '#2b2b45', hairStyle: 'bob', hat: 'beanie', hatColor: '#e8a24a', outfit: '#f6d37a', outfit2: '#c98a2a', weapon: 'fishbun' } },
  { id: 'n11', grade: 'normal', job: 'ice',    name: '눈사람 꼬마', desc: '눈덩이를 던져 적을 느리게 해요.',
    look: { hair: '#4a3020', hairStyle: 'short', hat: 'bucket', hatColor: '#d84a3a', outfit: '#f2f6fa', outfit2: '#9fb2c8', weapon: 'staff', orb: '#ffffff' } },
  { id: 'n12', grade: 'normal', job: 'ice',    name: '빙수 꼬마', desc: '시원한 빙수 바람으로 적을 꽁꽁.',
    look: { hair: '#ff9fb8', hairStyle: 'twin', outfit: '#bfe6ff', outfit2: '#7ab8e0', weapon: 'staff', orb: '#ffd0e0' } },

  // ── 에픽 8 ──
  { id: 'e1', grade: 'epic', job: 'sword',  name: '강아지 귀 검사', desc: '꼬리를 흔들며 용감하게 앞으로 나가요.',
    look: { hair: '#c98a4a', hairStyle: 'spiky', ears: 'dog', earColor: '#a36a32', outfit: '#8e5cd8', outfit2: '#5e389e', weapon: 'sword', blade: '#e9f2ff' } },
  { id: 'e2', grade: 'epic', job: 'sword',  name: '상어 모자 검사', desc: '상어처럼 빠르게 헤엄치듯 달려요.', theme: 2,
    look: { hair: '#2b2b45', hairStyle: 'short', hat: 'shark', hatColor: '#7aa7c9', outfit: '#3a6ea8', outfit2: '#24497a', weapon: 'sword', blade: '#e9f2ff' } },
  { id: 'e3', grade: 'epic', job: 'archer', name: '꽃 장식 궁수', desc: '머리의 꽃에서 좋은 향기가 나요.', theme: 1,
    look: { hair: '#f5c542', hairStyle: 'long', hat: 'flower', hatColor: '#ff7fae', outfit: '#9be07a', outfit2: '#5fae44', weapon: 'bow', bowColor: '#d07a3a' } },
  { id: 'e4', grade: 'epic', job: 'archer', name: '토끼 궁수', desc: '깡충깡충 뛰면서도 화살을 정확히 맞혀요.',
    look: { skin: '#fff4f0', hair: '#ffffff', hairStyle: 'bob', ears: 'bunny', earColor: '#ffffff', outfit: '#ffb3c7', outfit2: '#e07b97', weapon: 'bow', bowColor: '#8a5a32' } },
  { id: 'e5', grade: 'epic', job: 'mage',   name: '고양이 마법사', desc: '야옹! 별 마법으로 적을 깜짝 놀라게 해요.',
    look: { hair: '#3a3a3a', hairStyle: 'bob', ears: 'cat', earColor: '#3a3a3a', outfit: '#a45ee5', outfit2: '#6b2fa3', weapon: 'staff', orb: '#ffe066' } },
  { id: 'e6', grade: 'epic', job: 'knight', name: '별 방패 기사', desc: '별 모양 방패는 어떤 공격도 막아 줘요.',
    look: { hair: '#2b2b45', hairStyle: 'short', hat: 'helmet', hatColor: '#9fb2d8', plume: '#a45ee5', outfit: '#9fb2d8', outfit2: '#62739a', weapon: 'shield', shieldColor: '#7b4fd0', shieldStar: true } },
  { id: 'e7', grade: 'epic', job: 'chef',   name: '솜사탕 요리사', desc: '폭신한 솜사탕으로 모두를 신나게 해요.', theme: 1,
    look: { hair: '#ffb3d9', hairStyle: 'long', hat: 'chef', hatColor: '#ffe0f0', outfit: '#ffd0e8', outfit2: '#e07bb0', weapon: 'cotton' } },
  { id: 'e8', grade: 'epic', job: 'ice',    name: '펭귄 얼음술사', desc: '뒤뚱뒤뚱 걸으며 얼음 마법을 써요.', theme: 4,
    look: { hair: '#2b2b45', hairStyle: 'short', hat: 'penguin', hatColor: '#2b2b45', outfit: '#2b2b45', outfit2: '#f2f2f2', weapon: 'staff', orb: '#bdf3ff' } },

  // ── 유니크 5 ──
  { id: 'u1', grade: 'unique', job: 'sword',  name: '불꽃 칼 검사', desc: '따뜻한 불꽃 칼로 적을 물리쳐요.', theme: 5,
    look: { hair: '#d8402a', hairStyle: 'spiky', outfit: '#f28c28', outfit2: '#b85a0c', weapon: 'sword', blade: '#ffb347', bladeGlow: '#ffe066', extra: 'cape', capeColor: '#c0392b' } },
  { id: 'u2', grade: 'unique', job: 'archer', name: '우주 비행사 궁수', desc: '별빛 화살을 우주 끝까지 쏘아요.', theme: 7,
    look: { hair: '#6b4426', hairStyle: 'short', hat: 'astro', hatColor: '#e8eef5', outfit: '#e8eef5', outfit2: '#4f78d8', weapon: 'bow', bowColor: '#4f78d8', bowGem: '#ffe066' } },
  { id: 'u3', grade: 'unique', job: 'mage',   name: '아기 용 마법사', desc: '단짝 아기 용과 함께 불 마법을 써요.',
    look: { hair: '#f5c542', hairStyle: 'long', hat: 'wizard', hatColor: '#e0603a', outfit: '#e0603a', outfit2: '#a33c20', weapon: 'staff', orb: '#ffd34d', extra: 'dragon' } },
  { id: 'u4', grade: 'unique', job: 'knight', name: '작은 요정 기사', desc: '반짝이는 날개로 친구들 앞을 지켜요.',
    look: { hair: '#7fd36b', hairStyle: 'bob', hat: 'helmet', hatColor: '#e9d27a', outfit: '#e9d27a', outfit2: '#b39a3e', weapon: 'shield', shieldColor: '#7fd3c9', extra: 'wings' } },
  { id: 'u5', grade: 'unique', job: 'ice',    name: '얼음 공주', desc: '눈송이 마법으로 적을 꽁꽁 얼려요.', theme: 4,
    look: { hair: '#bfe6ff', hairStyle: 'long', hat: 'tiara', hatColor: '#9fe8ff', outfit: '#8fd0f5', outfit2: '#4b9fd1', weapon: 'staff', orb: '#e8fbff', extra: 'cape', capeColor: '#cfefff' } },

  // ── 레전더리 2 ──
  { id: 'l1', grade: 'legendary', job: 'sword', name: '왕관 검사', desc: '전설의 왕관을 쓴 용감한 검사예요.',
    look: { hair: '#8a5a32', hairStyle: 'spiky', hat: 'crown', hatColor: '#ffd23f', outfit: '#3fbf4f', outfit2: '#1f7f2c', weapon: 'sword', blade: '#fffbe0', bladeGlow: '#bfffb0', extra: 'cape', capeColor: '#d63a3a' } },
  { id: 'l2', grade: 'legendary', job: 'mage',  name: '별빛 대마법사', desc: '밤하늘의 별을 모아 커다란 마법을 만들어요.',
    look: { hair: '#f2f2f2', hairStyle: 'long', hat: 'wizard', hatColor: '#26306b', hatStar: true, outfit: '#26306b', outfit2: '#3fbf4f', weapon: 'staff', orb: '#fff27a', extra: 'cape', capeColor: '#3a2f8f' } },

  // ── 히든 3 (도전 과제로만 얻음) ──
  { id: 'h1', grade: 'hidden', job: 'sword', name: '번개 냠냠', desc: '번개처럼 빠르게 보스를 이긴 친구에게 와요.',
    hint: '보스 셋을 모두 1.5배속으로 이겨 봐요',
    look: { hair: '#ffe066', hairStyle: 'spiky', outfit: '#ffd23f', outfit2: '#3a2a3f', weapon: 'sword', blade: '#fff7b0', bladeGlow: '#7fe3ff', extra: 'cape', capeColor: '#3a2a3f' } },
  { id: 'h2', grade: 'hidden', job: 'chef',  name: '무지개 요리사', desc: '무지개 국자로 모두에게 힘을 나눠 줘요.', hint: '한 판에서 15문제를 연속으로 맞혀 봐요',
    look: { hair: '#ff7fae', hairStyle: 'twin', hat: 'chef', hatColor: '#ffffff', outfit: '#7fd3ff', outfit2: '#a45ee5', weapon: 'ladle', extra: 'wings' } },
  { id: 'h3', grade: 'hidden', job: 'mage',  name: '마왕의 아이', desc: '마왕 성에서 도망쳐 나온 착한 아이예요.', hint: '도전의 탑 30층에 올라 봐요',
    look: { hair: '#3a2a3f', hairStyle: 'spiky', hat: 'horns', hatColor: '#e05a4a', outfit: '#3a2a3f', outfit2: '#a33c20', weapon: 'staff', orb: '#ff6b6b', extra: 'cape', capeColor: '#6b1f2a' } }
];

G.charById = function (id) {
  for (var i = 0; i < G.CHARACTERS.length; i++) if (G.CHARACTERS[i].id === id) return G.CHARACTERS[i];
  for (var j = 0; j < G.HERO_CHARS.length; j++) if (G.HERO_CHARS[j].id === id) return G.HERO_CHARS[j];
  return null;
};
G.charsOfGrade = function (grade) { return G.CHARACTERS.filter(function (c) { return c.grade === grade; }); };
G.gradeIndex = function (key) { for (var i = 0; i < G.CONFIG.grades.length; i++) if (G.CONFIG.grades[i].key === key) return i; return -1; };
G.gradeInfo = function (key) { return G.CONFIG.grades[G.gradeIndex(key)]; };
// 10번은 도전의 탑 (스테이지 목록에는 없다). 길·적은 층마다 정한다 (G.Challenge.towerTheme)
G.TOWER_NO = 10;
G.stageByNo = function (no) {
  if (no === G.TOWER_NO) {
    var T = G.CONFIG.tower;
    return { no: G.TOWER_NO, name: T.name, unit: 0, hp: 1, path: 'loop', enemies: ['jellyBear', 'cookieSoldier'], types: ['A1', 'A3', 'A4', 'A5'], format: 'choice', ready: true, tower: true };
  }
  return G.CONFIG.stages[no - 1];
};
G.difficultyByKey = function (key) {
  var list = G.CONFIG.difficulties;
  for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
  return G.difficultyByKey(G.CONFIG.defaultDifficulty);
};
