// 게임 설정: 층, 테마, 균, 난이도, 학년군, 대사.

export const SAVE_VERSION = 1;
export const TEACHER_PIN = '0303';

export const BANDS = {
  low:  { name: '저학년', sub: '1~2학년' },
  mid:  { name: '중학년', sub: '3~4학년' },
  high: { name: '고학년', sub: '5~6학년' },
};
// 숨는 곳 이름: 고학년만 '쉘터'
export const hideName = (band) => (band === 'high' ? '쉘터' : '숨는 곳');

// 1시간용은 1·2·5층, 2시간용은 6층 전부
export const COURSES = {
  short: { name: '1시간용', stages: [1, 2, 5], sub: '3개 층 · 약 40분' },
  long:  { name: '2시간용', stages: [1, 2, 3, 4, 5, 6], sub: '6개 층 · 약 80분' },
};

export const DIFFS = {
  easy: { name: '쉬움', icon: '🙂', lives: Infinity, speed: 0.75, extraGerms: 0, desc: '목숨 무한 · 균이 느려요' },
  hard: { name: '어려움', icon: '💪', lives: 3, speed: 1, extraGerms: 2, desc: '목숨 3개 · 균이 빠르고 많아요' },
  hell: { name: '불지옥', icon: '🔥', lives: 1, speed: 1, extraGerms: 2, desc: '목숨 1개 · 쪽지 문제를 틀리면 조각이 흩어져요' },
};

export const CHARS = [
  { id: 'boy1', name: '하늘' },
  { id: 'boy2', name: '도윤' },
  { id: 'girl1', name: '보람' },
  { id: 'girl2', name: '수아' },
];

// 균 3종. 속도는 칸/초, 시야는 칸
export const GERMS = {
  basic:  { name: '꼬물이', img: 'germ_basic', walk: 1.3, run: 2.5, sight: 5, size: 1.0 },
  mold:   { name: '곰팡돌이', img: 'germ_mold', walk: 0.9, run: 1.9, sight: 7, size: 1.1 },
  cavity: { name: '충치쟁이', img: 'germ_cavity', walk: 1.5, run: 3.2, sight: 4.5, size: 0.95, tires: true },
};

export const PLAYER_SPEED = 3.4;
export const SEARCH_LOCK = 6;      // 가구 문제를 틀리면 잠기는 시간(초)
export const STUN_TIME = 4;        // 비눗방울에 맞으면 멈추는 시간(초)
export const WATER_TIME = 5;       // 물 한 컵: 빨라지는 시간
export const MASK_TIME = 6;        // 마스크: 균이 못 알아채는 시간
export const THROW_RANGE = 7;

// 층마다 테마. decor: 막는 소품, search: ?가구(10개 중 4개 진짜), hide: 숨는 곳 모양
export const THEMES = {
  practice: {
    floor: ['#fff7e6', '#fdeecf'], wall: '#f6b26b', wallTop: '#fbd3a5', line: '#e89a4f',
    decor: ['🪴', '📚', '🧸'], search: [['🗄️', '서랍장'], ['📦', '상자'], ['🧺', '바구니'], ['🪑', '의자']],
    hide: ['🛋️', '소파 뒤'],
  },
  cafeteria: {
    floor: ['#fff6dc', '#fbecc4'], wall: '#f4a259', wallTop: '#f9cb94', line: '#e08a3c',
    decor: ['🍱', '🥢', '🪴', '🍽️'], search: [['🍽️', '식탁'], ['🥘', '배식대'], ['🛒', '식판 수레'], ['🗄️', '수저통'], ['🧃', '음료 냉장고']],
    hide: ['🧺', '배식대 아래'],
  },
  veggie: {
    floor: ['#eefaf0', '#dff3e3'], wall: '#9ad0ec', wallTop: '#cdeaf7', line: '#6fb3d6',
    decor: ['🥬', '🥕', '🥒', '🍅', '🍎', '🍇'], search: [['🥬', '배추 더미'], ['🥕', '당근 상자'], ['🍎', '사과 바구니'], ['🧊', '얼음 틀'], ['🍉', '수박']],
    hide: ['📦', '큰 상자 뒤'],
  },
  dairy: {
    floor: ['#eef5ff', '#dde9fb'], wall: '#a8b8f0', wallTop: '#d4dcfa', line: '#8193d8',
    decor: ['🥛', '🧀', '🥚', '🐟', '🫘'], search: [['🥛', '우유 상자'], ['🧀', '치즈 통'], ['🥚', '달걀판'], ['🐟', '생선 상자'], ['🍗', '고기 칸']],
    hide: ['📦', '큰 상자 뒤'],
  },
  garden: {
    floor: ['#eaf7d9', '#dcf0c4'], wall: '#7cc36a', wallTop: '#a9dc98', line: '#5ea84d',
    decor: ['🌻', '🌽', '🍓', '🌱', '🪨'], search: [['🌳', '나무'], ['🪣', '물뿌리개 통'], ['🧑‍🌾', '허수아비'], ['🥔', '감자 밭'], ['🪵', '통나무']],
    hide: ['🌳', '덤불 속'],
  },
  market: {
    floor: ['#fff1e6', '#fbe2cf'], wall: '#e88a7d', wallTop: '#f5b9b0', line: '#cf6b5d',
    decor: ['🍎', '🐟', '🥖', '🍊', '🧺'], search: [['🍎', '과일 가게'], ['🐟', '생선 가게'], ['🥖', '빵 가게'], ['🥬', '채소 가게'], ['🧾', '계산대']],
    hide: ['🧺', '큰 바구니 뒤'],
  },
  kitchen: {
    floor: ['#f7f3ff', '#ece5fb'], wall: '#c3a6e8', wallTop: '#e0d2f5', line: '#a283d0',
    decor: ['🍳', '🥄', '🧂', '🫖', '🪴'], search: [['🧊', '냉장고'], ['🍳', '가스레인지'], ['🚰', '개수대'], ['🗄️', '찬장'], ['🧺', '식료품 바구니']],
    hide: ['🚪', '큰 찬장 안'],
  },
};

// 층. grid: 방 배치(열×행), rooms: 방 이름(왼쪽 위부터)
export const STAGES = {
  0: { name: '연습 층', place: '영양이의 연습실', theme: 'practice', cols: 2, rows: 1, rw: 10, rh: 8,
       rooms: ['연습실 왼쪽', '연습실 오른쪽'], germs: [], seed: 7 },
  1: { name: '1층 학교 급식실', place: '학교 급식실', theme: 'cafeteria', cols: 3, rows: 2, rw: 11, rh: 8,
       rooms: ['입구', '식탁 구역', '배식대', '손 씻는 곳', '식판 반납대', '조리실 앞'], germs: ['basic', 'basic', 'mold'], seed: 101 },
  2: { name: '2층 냉장고 채소칸', place: '냉장고 채소칸', theme: 'veggie', cols: 3, rows: 2, rw: 11, rh: 8,
       rooms: ['문 쪽 선반', '잎채소 칸', '뿌리채소 칸', '과일 칸', '얼음 칸', '맨 아래 서랍'], germs: ['basic', 'mold', 'cavity'], seed: 202 },
  3: { name: '3층 냉장고 우유·고기칸', place: '냉장고 우유·고기칸', theme: 'dairy', cols: 3, rows: 2, rw: 11, rh: 8,
       rooms: ['우유 선반', '치즈 선반', '달걀 칸', '두부·콩 칸', '생선 칸', '고기 칸'], germs: ['basic', 'mold', 'cavity'], seed: 303 },
  4: { name: '4층 텃밭', place: '학교 텃밭', theme: 'garden', cols: 3, rows: 2, rw: 11, rh: 8,
       rooms: ['텃밭 입구', '상추 밭', '감자 밭', '딸기 밭', '옥수수 밭', '물 주는 곳'], germs: ['basic', 'mold', 'cavity', 'basic'], seed: 404 },
  5: { name: '5층 동네 시장', place: '동네 시장', theme: 'market', cols: 3, rows: 2, rw: 11, rh: 8,
       rooms: ['시장 입구', '과일 골목', '채소 골목', '생선 골목', '빵 골목', '계산대 앞'], germs: ['basic', 'cavity', 'mold', 'cavity'], seed: 505 },
  6: { name: '6층 우리 집 주방', place: '우리 집 주방', theme: 'kitchen', cols: 3, rows: 2, rw: 11, rh: 8,
       rooms: ['현관', '식탁', '개수대', '냉장고 앞', '가스레인지', '찬장 앞'], germs: ['basic', 'mold', 'cavity', 'cavity'], seed: 606 },
};

// 연습 층 문제(학년 상관없이 아주 쉬운 문제)
export const PRACTICE_QUESTIONS = [
  { q: '밥을 먹기 전에 꼭 해야 하는 일은 무엇일까요?', c: ['손 씻기', '낮잠 자기', '게임 하기', '뛰어다니기'], h: '비누로 깨끗이!' },
  { q: '당근은 무슨 색일까요?', c: ['주황색', '파란색', '검은색', '보라색'], h: '토끼가 좋아하는 채소예요.' },
  { q: '우유를 마시면 무엇이 튼튼해질까요?', c: ['뼈와 이', '머리카락 색', '목소리', '눈썹'], h: '칼슘이 많아요.' },
  { q: '사과는 어떤 음식에 속할까요?', c: ['과일', '고기', '과자', '음료수'], h: '나무에 열려요.' },
  { q: '목이 마를 때 가장 좋은 음료는 무엇일까요?', c: ['물', '콜라', '사이다', '탄산 주스'], h: '색도 맛도 없지만 몸에 꼭 필요해요.' },
  { q: '골고루 먹는다는 것은 어떤 뜻일까요?', c: ['여러 가지 음식을 고르게 먹기', '좋아하는 것만 먹기', '한 가지만 많이 먹기', '굶기'], h: '편식의 반대예요.' },
];

// 영양이 대사: 층 시작(학년군별), 조각 찾았을 때
export const STAGE_INTRO = {
  0: { all: '안녕! 나는 영양이야. 여기서 탈출하는 방법을 하나씩 알려 줄게!' },
  1: { low: '급식실이야! 반찬을 골고루 먹으면 균도 이길 수 있어!', mid: '급식실이야! 식단에는 여러 식품군이 골고루 들어 있어.', high: '급식실이야! 영양사 선생님이 균형 잡힌 식단을 짜 주시지.' },
  2: { low: '냉장고 채소칸이야! 채소와 과일은 색깔이 참 다양하지?', mid: '채소칸이야! 채소와 과일에는 비타민과 무기질이 많아.', high: '채소칸이야! 식이섬유는 장을 튼튼하게 해 줘.' },
  3: { low: '우유·고기칸이야! 우유를 마시면 뼈가 튼튼해져!', mid: '여기엔 단백질과 칼슘이 가득해!', high: '5대 영양소가 하는 일을 떠올리며 탈출해 보자!' },
  4: { low: '텃밭이야! 채소가 어떻게 자라는지 살펴보자!', mid: '텃밭이야! 제철 음식은 맛도 영양도 최고야.', high: '텃밭이야! 가까운 곳에서 기른 농산물은 탄소 발자국이 적어.' },
  5: { low: '시장이야! 건강한 간식을 골라 보자!', mid: '시장이야! 당과 나트륨은 조금만!', high: '시장이야! 식품 표시를 꼼꼼히 읽어 보자.' },
  6: { low: '우리 집 주방이야! 손을 깨끗이 씻고 탈출하자!', mid: '주방이야! 음식은 알맞게 보관해야 해.', high: '마지막 층! 식중독을 막는 방법을 기억해!' },
};
export const FOUND_LINES = [
  '쪽지 조각을 찾았어! 조금만 더 힘내!',
  '좋아! 조각이 하나 더 모였어!',
  '대단해! 이제 거의 다 왔어!',
  '조각을 다 모았어! 쪽지를 열어서 순서대로 붙여 봐!',
];
export const MISS_LINES = [
  '여긴 조각이 없네. 다른 ?가구를 찾아보자!',
  '꽝! 그래도 괜찮아, 다른 곳에 있을 거야.',
  '음… 여기는 아니야. 감지기를 잘 봐!',
];
