// 단계·캐릭터·설정 상수. 숫자를 바꾸려면 여기만 고치면 된다.
(function (root) {
  'use strict';
  root.GRD = {
    TEACHER_PIN: '0303', // 선생님 화면 비밀번호(공개 코드라 마음먹으면 보인다)
    RUN_COUNT: 10,       // 달리기 문제 수
    RETRY_MAX: 5,        // 틀린 문제를 다시 내는 최대 개수
    BOSS_COUNT: 3,       // 보스전 문제 수
    START_FRIENDS: 5,
    GAIN: 3, LOSS: 2, HIT_LOSS: 1,
    UNLOCK_STARS: 2,     // 다음 단계가 열리는 별 수
    // 단계: types 유형, n 보기 수, t 문제가 뜨고 숫자 문에 닿기까지 초(사이에 능력 문·균 무리 등이 지나간다), boss 그림
    STAGES: [
      { name: '1단계', title: '받아올림 없는 덧셈', ex: '3 + 4', types: ['A'], n: 2, t: 8, boss: 'basic' },
      { name: '2단계', title: '한 자리 뺄셈', ex: '9 − 4', types: ['C'], n: 2, t: 8, boss: 'basic' },
      { name: '3단계', title: '받아올림 있는 덧셈', ex: '8 + 5', types: ['B'], n: 3, t: 8, boss: 'cavity' },
      { name: '4단계', title: '(십몇) − (몇)', ex: '15 − 3', types: ['D1'], n: 3, t: 7, boss: 'cavity' },
      { name: '5단계', title: '받아내림 있는 뺄셈', ex: '13 − 5', types: ['D2'], n: 3, t: 7, boss: 'mold' },
      { name: '6단계', title: '모두 섞기', ex: '대왕전', types: ['A', 'B', 'C', 'D1', 'D2'], n: 3, t: 6, boss: 'king' },
    ],
    BOSSES: {
      basic: { name: '장난꾸러기 균', img: 'img/germ_basic.png', hp: 110 },
      cavity: { name: '충치 균', img: 'img/germ_cavity.png', hp: 130 },
      mold: { name: '곰팡이 균', img: 'img/germ_mold.png', hp: 150 },
      king: { name: '심술 대왕', img: 'img/king.png', hp: 190 },
    },
    KIDS: [
      { name: '돌이', img: 'img/kid1.png' },
      { name: '분이', img: 'img/kid2.png' },
      { name: '철이', img: 'img/kid3.png' },
      { name: '순이', img: 'img/kid4.png' },
    ],
    // 옷 문에서 모으는 옷. req = 옷 문을 통과할 때 필요한 친구 수. 앞에서부터 차례로 나온다
    COSTUMES: [
      { k: 'gat', name: '갓', icon: '🎩', req: 10 },
      { k: 'flower', name: '꽃핀', icon: '🌸', req: 12 },
      { k: 'cape', name: '빨간 망토', icon: '🧣', req: 15 },
      { k: 'horns', name: '도깨비 뿔', icon: '😈', req: 18 },
      { k: 'crown', name: '왕관', icon: '👑', req: 22 },
      { k: 'gold', name: '황금 변신', icon: '✨', req: 26 },
    ],
    SPEEDS: { slow: { name: '느리게', mul: 1.3 }, normal: { name: '보통', mul: 1 }, fast: { name: '빠르게', mul: 0.75 } },
  };
})(window);
