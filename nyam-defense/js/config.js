/* 냠냠 랜덤 디펜스 — 게임 설정값
 * 수치 조정은 이 파일에서만 한다. (기획서 5·7·8·10·12장)
 * 화면에 보이는 글자는 모두 한국어로 쓴다.
 */
var G = globalThis.G || (globalThis.G = {});

G.CONFIG = {
  // 5-1. 등급과 확률 (합계 100)
  grades: [
    { key: 'normal',    name: '노말',     color: '#9aa0a8', dark: '#5d636b', light: '#e6e8eb', rate: 67, mult: 1,   frame: '동그라미' },
    { key: 'epic',      name: '에픽',     color: '#a45ee5', dark: '#6b2fa3', light: '#efe0fb', rate: 25, mult: 1.8, frame: '별' },
    { key: 'unique',    name: '유니크',   color: '#f28c28', dark: '#b85a0c', light: '#fde9d3', rate: 7,  mult: 3.5, frame: '꽃' },
    { key: 'legendary', name: '레전더리', color: '#3fbf4f', dark: '#1f7f2c', light: '#dcf6df', rate: 1,  mult: 7,   frame: '왕관' }
  ],

  // 7-1. 합성 규칙: [재료 등급] 몇 명 → 다음 등급 1명
  merge: { normal: 5, epic: 3, unique: 3 },

  // 8-1. 노말 기준 능력치 (공격 간격 단위: 초)
  jobs: {
    sword:  { name: '검사',   atk: 20, interval: 1.0,  hp: 120, style: '가까운 적 한 명',   range: 34,  melee: true,  splash: 0 },
    archer: { name: '궁수',   atk: 13, interval: 0.65, hp: 80,  style: '먼 적 한 명',       range: 430, melee: false, splash: 0 },
    mage:   { name: '마법사', atk: 30, interval: 1.5,  hp: 75,  style: '여러 적에게 마법',  range: 360, melee: false, splash: 62 },
    knight: { name: '기사',   atk: 10, interval: 1.0,  hp: 220, style: '가까운 적 한 명',   range: 34,  melee: true,  splash: 0 }
  },

  maxLineup: 8,          // 9-2. 출전 인원 최대 8명
  lifePerStage: 5,       // 12. 생명력 (스테이지마다 가득 채움)
  bossLifeDamage: 2,     // 우두머리가 방어선에 닿으면 줄어드는 생명력
  reviveSeconds: 8,      // 쓰러진 우리 캐릭터가 다시 일어나는 시간
  startTickets: 0,

  // 10. 일곱 스테이지 + 10-2 난이도 배율
  stages: [
    { no: 1, name: '초록 들판',   level: '매우 쉬움',     waves: 3, hp: 1,   atk: 1,   monsters: ['pinkSlime', 'greenSlime'],   boss: 'kingSlime', extra: -1 },
    { no: 2, name: '버섯 숲',     level: '쉬움',         waves: 3, hp: 1.3, atk: 1.2, monsters: ['mushroom', 'bat'],          boss: 'mushroomKing' },
    { no: 3, name: '수정 동굴',   level: '보통',         waves: 4, hp: 1.7, atk: 1.5, monsters: ['golem', 'gemBug'],          boss: 'crystalGiant' },
    { no: 4, name: '구름 언덕',   level: '보통',         waves: 4, hp: 2.2, atk: 1.8, monsters: ['cloudBird', 'windSpirit'],  boss: 'stormBird' },
    { no: 5, name: '용암 지대',   level: '어려움',       waves: 4, hp: 3,   atk: 2.3, monsters: ['fireSlime', 'babyDragon'],  boss: 'lavaDragon' },
    { no: 6, name: '마왕의 성',   level: '매우 어려움',   waves: 5, hp: 4,   atk: 3,   monsters: ['skeleton', 'darkKnight'],   boss: 'darkCaptain' },
    { no: 7, name: '마왕의 왕좌', level: '최종 우두머리', waves: 5, hp: 5.5, atk: 4,   monsters: ['minion', 'minion2'],         boss: 'demonKing' }
  ],

  // 몬스터 기본값 (스테이지 배율을 곱해 사용)
  // speed: 1초에 움직이는 거리. 예전 "빠르게"(26×1.6≈42)의 2배 이상인 84
  monsterBase: { hp: 110, atk: 12, interval: 1.3, speed: 84 },

  // 우리 캐릭터 이동 속도 (빠른 몬스터를 막으러 나갈 수 있도록)
  unitMoveSpeed: 160,

  // 무리 구성: 몬스터 수 = base + 무리번호*perWave + 스테이지*perStage
  // bossAtkMult: 우두머리 공격력 배율 / bossInterval: 우두머리 공격 간격(일반 몬스터의 몇 배)
  wave: { base: 2, perWave: 1, perStage: 1.7, maxCount: 9, spawnGap: 1.2, bossHpMult: 12, bossAtkMult: 4, bossInterval: 1.0 },
  // 우두머리 땅 쿵: 막고 있는 친구 둘레 radius 안의 다른 친구들도 공격력의 ratio 만큼 맞는다
  bossSlam: { radius: 80, ratio: 0.5 },

  /* 준비 시간 문제 묶음 규칙 (2~6단계)
   * count  : 그 준비 시간에 주는 문제 수 (맞혀도 틀려도 1문제씩 줄어든다)
   * need   : 이 수만큼 한 묶음. 묶음 안의 문제를 모두 맞혀야 뽑기권을 준다 (1이면 맞힐 때마다)
   * reward : 묶음을 모두 맞혔을 때 주는 뽑기권 수
   *   first      : 맨 처음
   *   wave       : 같은 지역 안에서 다음 무리로 넘어갈 때 (예: 2-2 → 2-3)
   *   stageClear : 우두머리를 물리치고 다음 지역으로 갈 때 (예: 2-마지막 → 3-1)
   *   retry      : 져서 다시 도전할 때
   *   rescue     : 친구가 한 명도 없어 싸울 수 없을 때 다시 주는 문제
   */
  rounds: {
    first:      { count: 5, need: 5, reward: 3 },
    wave:       { count: 3, need: 3, reward: 1 },
    stageClear: { count: 5, need: 5, reward: 3 },
    retry:      { count: 3, need: 1, reward: 1 },
    rescue:     { count: 5, need: 5, reward: 3 }
  },
  pictureRate: 0.3,   // 그림 보고 식 만들기 문제가 나올 비율

  /* 난이도 1~6 (새로 시작할 때 학생이 고른다)
   * unlimited : 문제 수 제한 없음 (1문제 맞히면 뽑기권 1개)
   * rounds    : 위의 기본 묶음 규칙 대신 쓸 규칙 (없으면 기본 규칙)
   * input     : 'choice' 보기 3개 중 고르기 / 'type' 숫자 자판으로 직접 입력하기
   * flashSec  : 문제 식이 이 시간(초) 뒤에 사라진다
   * monster   : 몬스터 수·빠르기·체력·공격력 배율
   */
  difficulties: [
    { level: 1, name: '아주 쉬움', desc: '문제를 마음껏 풀 수 있어요. 1문제를 맞히면 뽑기권 1개!',
      unlimited: true, input: 'choice', flashSec: 0, monster: { count: 0.8, speed: 1, hp: 0.8, atk: 0.8 } },
    { level: 2, name: '쉬움', desc: '문제 수가 정해져 있어요. 묶음을 모두 맞히면 뽑기권!',
      input: 'choice', flashSec: 0, monster: { count: 1, speed: 1, hp: 1, atk: 1 } },
    { level: 3, name: '보통', desc: '몬스터가 더 많고 빠르고 튼튼해요. 다시 도전해야 할 거예요.',
      input: 'choice', flashSec: 0, monster: { count: 1.15, speed: 1.1, hp: 1.2, atk: 1.15 } },
    { level: 4, name: '어려움', desc: '답을 숫자 자판으로 직접 써요. 몬스터가 훨씬 강해요.',
      input: 'type', flashSec: 0, monster: { count: 1.25, speed: 1.15, hp: 1.3, atk: 1.25 } },
    { level: 5, name: '아주 어려움', desc: '답을 직접 써요. 가장 강한 몬스터들이 몰려와요.',
      input: 'type', flashSec: 0, monster: { count: 1.35, speed: 1.25, hp: 1.45, atk: 1.35 } },
    { level: 6, name: '도전', desc: '답을 직접 쓰고, 식이 1초 뒤에 사라져요. 뽑기권도 적어요!',
      input: 'type', flashSec: 1, monster: { count: 1.2, speed: 1.1, hp: 1.25, atk: 1.2 },
      rounds: { first: { count: 5, need: 5, reward: 2 }, wave: { count: 3, need: 3, reward: 1 }, stageClear: { count: 5, need: 5, reward: 2 },
                retry: { count: 6, need: 2, reward: 1 }, rescue: { count: 5, need: 5, reward: 2 } } }
  ],
  defaultDifficulty: 2
};

G.difficulty = function (level) { return G.CONFIG.difficulties[(level || G.CONFIG.defaultDifficulty) - 1]; };
// 난이도의 문제 묶음 규칙 하나 (kind: first / wave / stageClear / retry / rescue)
G.roundRule = function (level, kind) { var D = G.difficulty(level); return (D.rounds && D.rounds[kind]) || G.CONFIG.rounds[kind]; };

// 몬스터 종류 (이름·크기·특징)
G.MONSTERS = {
  pinkSlime:    { name: '분홍 슬라임',   hp: 1.0, atk: 1.0, speed: 1.0,  size: 1 },
  greenSlime:   { name: '초록 슬라임',   hp: 1.2, atk: 0.9, speed: 0.85, size: 1 },
  mushroom:     { name: '버섯 요정',     hp: 1.2, atk: 1.0, speed: 0.85, size: 1 },
  bat:          { name: '작은 박쥐',     hp: 0.7, atk: 0.9, speed: 1.5,  size: 1 },
  golem:        { name: '수정 골렘',     hp: 1.6, atk: 1.1, speed: 0.7,  size: 1 },
  gemBug:       { name: '보석 벌레',     hp: 0.8, atk: 1.0, speed: 1.3,  size: 1 },
  cloudBird:    { name: '구름 새',       hp: 0.8, atk: 1.0, speed: 1.4,  size: 1 },
  windSpirit:   { name: '바람 정령',     hp: 1.1, atk: 1.1, speed: 1.1,  size: 1 },
  fireSlime:    { name: '불꽃 슬라임',   hp: 1.0, atk: 1.2, speed: 1.0,  size: 1 },
  babyDragon:   { name: '작은 용',       hp: 1.4, atk: 1.1, speed: 0.9,  size: 1 },
  skeleton:     { name: '갑옷 해골',     hp: 1.0, atk: 0.9, speed: 0.95, size: 1 },
  darkKnight:   { name: '어둠 기사',     hp: 1.25, atk: 1.0, speed: 0.8,  size: 1 },
  minion:       { name: '마왕의 부하',   hp: 0.85, atk: 0.85, speed: 1.0,  size: 1 },
  minion2:      { name: '마왕의 박쥐 부하', hp: 0.65, atk: 0.8, speed: 1.4, size: 1 },
  // 지역 우두머리 6종 + 최종 마왕
  kingSlime:    { name: '왕관 슬라임 대장', hp: 0.4, atk: 0.5, speed: 0.6, size: 2, boss: true },
  mushroomKing: { name: '버섯 대왕',       hp: 1, atk: 1, speed: 0.6, size: 2, boss: true },
  crystalGiant: { name: '수정 거인',       hp: 1, atk: 1, speed: 0.5, size: 2, boss: true },
  stormBird:    { name: '폭풍 새 대장',    hp: 1, atk: 1, speed: 0.7, size: 2, boss: true },
  lavaDragon:   { name: '용암 용',         hp: 1, atk: 1, speed: 0.55, size: 2, boss: true },
  darkCaptain:  { name: '어둠 기사 대장',  hp: 1, atk: 1, speed: 0.55, size: 2, boss: true },
  demonKing:    { name: '최종 마왕',       hp: 1.1, atk: 0.85, speed: 0.45, size: 2.4, boss: true, final: true }
};

/* 캐릭터 23명 (노말 8, 에픽 6, 유니크 5, 레전더리 4)
 * look: 도트 그림을 만드는 재료. assets/캐릭터/<id>.png 파일이 있으면 그 그림을 대신 쓴다.
 */
G.CHARACTERS = [
  // ── 노말 8명 ──
  { id: 'n1', grade: 'normal', job: 'sword',  name: '갈색 머리 검사', desc: '씩씩하게 칼을 휘두르는 우리 반 첫 번째 친구예요.',
    look: { hair: '#8a5a32', hairStyle: 'short', outfit: '#4a7fd4', outfit2: '#2f5aa0', weapon: 'sword' } },
  { id: 'n2', grade: 'normal', job: 'sword',  name: '토끼 귀 검사', desc: '긴 귀로 몬스터 발소리를 먼저 들어요.',
    look: { hair: '#f2f2f2', hairStyle: 'bob', ears: 'bunny', earColor: '#f2f2f2', outfit: '#f08bb0', outfit2: '#c95a85', weapon: 'sword' } },
  { id: 'n3', grade: 'normal', job: 'archer', name: '초록 모자 궁수', desc: '나무 위에서 화살을 쏘는 걸 좋아해요.',
    look: { hair: '#d9a441', hairStyle: 'short', hat: 'hood', hatColor: '#55b04a', outfit: '#55b04a', outfit2: '#3a7d33', weapon: 'bow' } },
  { id: 'n4', grade: 'normal', job: 'archer', name: '꼬마 궁수', desc: '작지만 화살은 누구보다 빨라요.',
    look: { hair: '#4a3020', hairStyle: 'twin', outfit: '#e2a24a', outfit2: '#b5762a', weapon: 'bow' } },
  { id: 'n5', grade: 'normal', job: 'mage',   name: '꼬마 마법사', desc: '처음 배운 마법으로 반짝반짝 공격해요.',
    look: { hair: '#6b4426', hairStyle: 'long', hat: 'wizard', hatColor: '#4f78d8', outfit: '#4f78d8', outfit2: '#33529e', weapon: 'staff', orb: '#7fe3ff' } },
  { id: 'n6', grade: 'normal', job: 'mage',   name: '파란 망토 마법사', desc: '망토를 펄럭이며 물방울 마법을 써요.',
    look: { hair: '#2b2b45', hairStyle: 'spiky', outfit: '#3aa7c9', outfit2: '#24758f', weapon: 'staff', orb: '#bdf3ff', extra: 'cape', capeColor: '#2a6ad0' } },
  { id: 'n7', grade: 'normal', job: 'knight', name: '작은 갑옷 기사', desc: '작은 갑옷을 입고 친구들을 지켜요.',
    look: { hair: '#8a5a32', hairStyle: 'short', hat: 'helmet', hatColor: '#b8c2cc', outfit: '#b8c2cc', outfit2: '#7d8894', weapon: 'shield', shieldColor: '#c9a05a' } },
  { id: 'n8', grade: 'normal', job: 'knight', name: '냄비 투구 기사', desc: '엄마 냄비를 투구로 썼지만 아주 튼튼해요.',
    look: { hair: '#d9a441', hairStyle: 'bob', hat: 'pot', hatColor: '#8c9298', outfit: '#9c7a54', outfit2: '#6e5236', weapon: 'shield', shieldColor: '#a7764a' } },

  // ── 에픽 6명 ──
  { id: 'e1', grade: 'epic', job: 'sword',  name: '강아지 귀 검사', desc: '꼬리를 흔들며 용감하게 앞으로 나가요.',
    look: { hair: '#c98a4a', hairStyle: 'spiky', ears: 'dog', earColor: '#a36a32', outfit: '#8e5cd8', outfit2: '#5e389e', weapon: 'sword', blade: '#e9f2ff' } },
  { id: 'e2', grade: 'epic', job: 'archer', name: '꽃 장식 궁수', desc: '머리의 꽃에서 좋은 향기가 나요.',
    look: { hair: '#f5c542', hairStyle: 'long', hat: 'flower', hatColor: '#ff7fae', outfit: '#9be07a', outfit2: '#5fae44', weapon: 'bow', bowColor: '#d07a3a' } },
  { id: 'e3', grade: 'epic', job: 'mage',   name: '고양이 마법사', desc: '야옹! 별 마법으로 몬스터를 깜짝 놀라게 해요.',
    look: { hair: '#3a3a3a', hairStyle: 'bob', ears: 'cat', earColor: '#3a3a3a', outfit: '#a45ee5', outfit2: '#6b2fa3', weapon: 'staff', orb: '#ffe066' } },
  { id: 'e4', grade: 'epic', job: 'knight', name: '별 방패 기사', desc: '별 모양 방패는 어떤 공격도 막아 줘요.',
    look: { hair: '#2b2b45', hairStyle: 'short', hat: 'helmet', hatColor: '#9fb2d8', plume: '#a45ee5', outfit: '#9fb2d8', outfit2: '#62739a', weapon: 'shield', shieldColor: '#7b4fd0', shieldStar: true } },
  { id: 'e5', grade: 'epic', job: 'mage',   name: '보라 모자 마법사', desc: '빛나는 지팡이로 보라색 번개를 불러요.',
    look: { hair: '#8a5a32', hairStyle: 'long', hat: 'wizard', hatColor: '#7b3fc4', outfit: '#7b3fc4', outfit2: '#4f2585', weapon: 'staff', orb: '#ff9cf2' } },
  { id: 'e6', grade: 'epic', job: 'archer', name: '토끼 궁수', desc: '깡충깡충 뛰면서도 화살을 정확히 맞혀요.',
    look: { skin: '#fff4f0', hair: '#ffffff', hairStyle: 'bob', ears: 'bunny', earColor: '#ffffff', outfit: '#ffb3c7', outfit2: '#e07b97', weapon: 'bow', bowColor: '#8a5a32' } },

  // ── 유니크 5명 ──
  { id: 'u1', grade: 'unique', job: 'sword',  name: '불꽃 칼 검사', desc: '따뜻한 불꽃 칼로 몬스터를 물리쳐요.',
    look: { hair: '#d8402a', hairStyle: 'spiky', outfit: '#f28c28', outfit2: '#b85a0c', weapon: 'sword', blade: '#ffb347', bladeGlow: '#ffe066', extra: 'cape', capeColor: '#c0392b' } },
  { id: 'u2', grade: 'unique', job: 'archer', name: '주황 깃털 궁수', desc: '깃털 장식 활은 아주 멀리까지 쏠 수 있어요.',
    look: { hair: '#6b4426', hairStyle: 'twin', hat: 'feather', hatColor: '#f28c28', outfit: '#3d9a8b', outfit2: '#276b60', weapon: 'bow', bowColor: '#f28c28', bowGem: '#ffe066' } },
  { id: 'u3', grade: 'unique', job: 'mage',   name: '아기 용 마법사', desc: '단짝 아기 용과 함께 불 마법을 써요.',
    look: { hair: '#f5c542', hairStyle: 'long', hat: 'wizard', hatColor: '#e0603a', outfit: '#e0603a', outfit2: '#a33c20', weapon: 'staff', orb: '#ffd34d', extra: 'dragon' } },
  { id: 'u4', grade: 'unique', job: 'knight', name: '작은 요정 기사', desc: '반짝이는 날개로 친구들 앞을 지켜요.',
    look: { hair: '#7fd36b', hairStyle: 'bob', hat: 'helmet', hatColor: '#e9d27a', outfit: '#e9d27a', outfit2: '#b39a3e', weapon: 'shield', shieldColor: '#7fd3c9', extra: 'wings' } },
  { id: 'u5', grade: 'unique', job: 'mage',   name: '얼음 공주 마법사', desc: '눈송이 마법으로 몬스터를 꽁꽁 얼려요.',
    look: { hair: '#bfe6ff', hairStyle: 'long', hat: 'tiara', hatColor: '#9fe8ff', outfit: '#8fd0f5', outfit2: '#4b9fd1', weapon: 'staff', orb: '#e8fbff', extra: 'cape', capeColor: '#cfefff' } },

  // ── 레전더리 4명 ──
  { id: 'l1', grade: 'legendary', job: 'sword',  name: '왕관 검사', desc: '전설의 왕관을 쓴 용감한 검사예요. 빛나는 칼을 들었어요.',
    look: { hair: '#8a5a32', hairStyle: 'spiky', hat: 'crown', hatColor: '#ffd23f', outfit: '#3fbf4f', outfit2: '#1f7f2c', weapon: 'sword', blade: '#fffbe0', bladeGlow: '#bfffb0', extra: 'cape', capeColor: '#d63a3a' } },
  { id: 'l2', grade: 'legendary', job: 'knight', name: '전설의 왕관 기사', desc: '화려한 갑옷과 왕관! 무엇이든 막아 내는 전설의 기사예요.',
    look: { hair: '#f5c542', hairStyle: 'short', hat: 'crownHelm', hatColor: '#ffd23f', outfit: '#e8eef5', outfit2: '#3fbf4f', weapon: 'shield', shieldColor: '#3fbf4f', shieldStar: true, extra: 'cape', capeColor: '#2e9a3d' } },
  { id: 'l3', grade: 'legendary', job: 'mage',   name: '별빛 대마법사', desc: '밤하늘의 별을 모아 커다란 마법을 만들어요.',
    look: { hair: '#f2f2f2', hairStyle: 'long', hat: 'wizard', hatColor: '#26306b', hatStar: true, outfit: '#26306b', outfit2: '#3fbf4f', weapon: 'staff', orb: '#fff27a', extra: 'cape', capeColor: '#3a2f8f' } },
  { id: 'l4', grade: 'legendary', job: 'archer', name: '숲의 수호 궁수', desc: '숲의 친구들이 힘을 빌려주는 전설의 궁수예요.',
    look: { hair: '#5a3a1e', hairStyle: 'long', ears: 'elf', earColor: null, hat: 'leafCrown', hatColor: '#3fbf4f', outfit: '#2e9a3d', outfit2: '#ffd23f', weapon: 'bow', bowColor: '#ffd23f', bowGem: '#bfffb0', extra: 'wings' } }
];

G.gradeIndex = function (key) {
  for (var i = 0; i < G.CONFIG.grades.length; i++) if (G.CONFIG.grades[i].key === key) return i;
  return -1;
};
G.grade = function (key) { return G.CONFIG.grades[G.gradeIndex(key)]; };
G.charById = function (id) {
  for (var i = 0; i < G.CHARACTERS.length; i++) if (G.CHARACTERS[i].id === id) return G.CHARACTERS[i];
  return null;
};
G.charsOfGrade = function (key) { return G.CHARACTERS.filter(function (c) { return c.grade === key; }); };

// 캐릭터 한 명의 실제 능력치 (8-2: 공격력과 체력에 배율, 정수 반올림)
G.unitStats = function (charId) {
  var c = G.charById(charId), j = G.CONFIG.jobs[c.job], m = G.grade(c.grade).mult;
  return { atk: Math.round(j.atk * m), hp: Math.round(j.hp * m), interval: j.interval, range: j.range, melee: j.melee, splash: j.splash };
};
// 전투력: 화면 표시와 출전 선택용
G.unitPower = function (charId) {
  var s = G.unitStats(charId);
  return Math.round(s.atk / s.interval * 2 + s.hp / 10);
};
