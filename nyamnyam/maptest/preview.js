(() => {
  // maptest/js/data.js
  var SAVE_VERSION = 1;
  var hideName = (band) => band === "high" ? "\uC258\uD130" : "\uC228\uB294 \uACF3";
  var COURSES = {
    short: { name: "1\uC2DC\uAC04\uC6A9", stages: [1, 2, 5], sub: "3\uAC1C \uCE35 \xB7 \uC57D 40\uBD84" },
    long: { name: "2\uC2DC\uAC04\uC6A9", stages: [1, 2, 3, 4, 5, 6], sub: "6\uAC1C \uCE35 \xB7 \uC57D 80\uBD84" }
  };
  var DIFFS = {
    easy: { name: "\uC26C\uC6C0", icon: "\u{1F642}", lives: Infinity, speed: 0.75, extraGerms: 0, desc: "\uBAA9\uC228 \uBB34\uD55C \xB7 \uADE0\uC774 \uB290\uB824\uC694" },
    hard: { name: "\uC5B4\uB824\uC6C0", icon: "\u{1F4AA}", lives: 3, speed: 1, extraGerms: 2, desc: "\uBAA9\uC228 3\uAC1C \xB7 \uADE0\uC774 \uBE60\uB974\uACE0 \uB9CE\uC544\uC694" },
    hell: { name: "\uBD88\uC9C0\uC625", icon: "\u{1F525}", lives: 1, speed: 1, extraGerms: 2, desc: "\uBAA9\uC228 1\uAC1C \xB7 \uCABD\uC9C0 \uBB38\uC81C\uB97C \uD2C0\uB9AC\uBA74 \uC870\uAC01\uC774 \uD769\uC5B4\uC838\uC694" }
  };
  var GERMS = {
    basic: { name: "\uAF2C\uBB3C\uC774", img: "germ_basic", walk: 1.3, run: 2.5, sight: 5, size: 1 },
    mold: { name: "\uACF0\uD321\uB3CC\uC774", img: "germ_mold", walk: 0.9, run: 1.9, sight: 7, size: 1.1 },
    cavity: { name: "\uCDA9\uCE58\uC7C1\uC774", img: "germ_cavity", walk: 1.5, run: 3.2, sight: 4.5, size: 0.95, tires: true }
  };
  var PLAYER_SPEED = 3.4;
  var SEARCH_LOCK = 6;
  var STUN_TIME = 4;
  var WATER_TIME = 5;
  var MASK_TIME = 6;
  var THROW_RANGE = 7;
  var THEMES = {
    practice: {
      floor: ["#fff7e6", "#fdeecf"],
      wall: "#f6b26b",
      wallTop: "#fbd3a5",
      line: "#e89a4f",
      decor: ["\u{1FAB4}", "\u{1F4DA}", "\u{1F9F8}"],
      search: [["\u{1F5C4}\uFE0F", "\uC11C\uB78D\uC7A5"], ["\u{1F4E6}", "\uC0C1\uC790"], ["\u{1F9FA}", "\uBC14\uAD6C\uB2C8"], ["\u{1FA91}", "\uC758\uC790"]],
      hide: ["\u{1F6CB}\uFE0F", "\uC18C\uD30C \uB4A4"]
    },
    cafeteria: {
      floor: ["#fff6dc", "#fbecc4"],
      wall: "#f4a259",
      wallTop: "#f9cb94",
      line: "#e08a3c",
      decor: ["\u{1F371}", "\u{1F962}", "\u{1FAB4}", "\u{1F37D}\uFE0F"],
      search: [["\u{1F37D}\uFE0F", "\uC2DD\uD0C1"], ["\u{1F958}", "\uBC30\uC2DD\uB300"], ["\u{1F6D2}", "\uC2DD\uD310 \uC218\uB808"], ["\u{1F5C4}\uFE0F", "\uC218\uC800\uD1B5"], ["\u{1F9C3}", "\uC74C\uB8CC \uB0C9\uC7A5\uACE0"]],
      hide: ["\u{1F9FA}", "\uBC30\uC2DD\uB300 \uC544\uB798"]
    },
    veggie: {
      floor: ["#eefaf0", "#dff3e3"],
      wall: "#9ad0ec",
      wallTop: "#cdeaf7",
      line: "#6fb3d6",
      decor: ["\u{1F96C}", "\u{1F955}", "\u{1F952}", "\u{1F345}", "\u{1F34E}", "\u{1F347}"],
      search: [["\u{1F96C}", "\uBC30\uCD94 \uB354\uBBF8"], ["\u{1F955}", "\uB2F9\uADFC \uC0C1\uC790"], ["\u{1F34E}", "\uC0AC\uACFC \uBC14\uAD6C\uB2C8"], ["\u{1F9CA}", "\uC5BC\uC74C \uD2C0"], ["\u{1F349}", "\uC218\uBC15"]],
      hide: ["\u{1F4E6}", "\uD070 \uC0C1\uC790 \uB4A4"]
    },
    dairy: {
      floor: ["#eef5ff", "#dde9fb"],
      wall: "#a8b8f0",
      wallTop: "#d4dcfa",
      line: "#8193d8",
      decor: ["\u{1F95B}", "\u{1F9C0}", "\u{1F95A}", "\u{1F41F}", "\u{1FAD8}"],
      search: [["\u{1F95B}", "\uC6B0\uC720 \uC0C1\uC790"], ["\u{1F9C0}", "\uCE58\uC988 \uD1B5"], ["\u{1F95A}", "\uB2EC\uAC40\uD310"], ["\u{1F41F}", "\uC0DD\uC120 \uC0C1\uC790"], ["\u{1F357}", "\uACE0\uAE30 \uCE78"]],
      hide: ["\u{1F4E6}", "\uD070 \uC0C1\uC790 \uB4A4"]
    },
    garden: {
      floor: ["#eaf7d9", "#dcf0c4"],
      wall: "#7cc36a",
      wallTop: "#a9dc98",
      line: "#5ea84d",
      decor: ["\u{1F33B}", "\u{1F33D}", "\u{1F353}", "\u{1F331}", "\u{1FAA8}"],
      search: [["\u{1F333}", "\uB098\uBB34"], ["\u{1FAA3}", "\uBB3C\uBFCC\uB9AC\uAC1C \uD1B5"], ["\u{1F9D1}\u200D\u{1F33E}", "\uD5C8\uC218\uC544\uBE44"], ["\u{1F954}", "\uAC10\uC790 \uBC2D"], ["\u{1FAB5}", "\uD1B5\uB098\uBB34"]],
      hide: ["\u{1F333}", "\uB364\uBD88 \uC18D"]
    },
    market: {
      floor: ["#fff1e6", "#fbe2cf"],
      wall: "#e88a7d",
      wallTop: "#f5b9b0",
      line: "#cf6b5d",
      decor: ["\u{1F34E}", "\u{1F41F}", "\u{1F956}", "\u{1F34A}", "\u{1F9FA}"],
      search: [["\u{1F34E}", "\uACFC\uC77C \uAC00\uAC8C"], ["\u{1F41F}", "\uC0DD\uC120 \uAC00\uAC8C"], ["\u{1F956}", "\uBE75 \uAC00\uAC8C"], ["\u{1F96C}", "\uCC44\uC18C \uAC00\uAC8C"], ["\u{1F9FE}", "\uACC4\uC0B0\uB300"]],
      hide: ["\u{1F9FA}", "\uD070 \uBC14\uAD6C\uB2C8 \uB4A4"]
    },
    kitchen: {
      floor: ["#f7f3ff", "#ece5fb"],
      wall: "#c3a6e8",
      wallTop: "#e0d2f5",
      line: "#a283d0",
      decor: ["\u{1F373}", "\u{1F944}", "\u{1F9C2}", "\u{1FAD6}", "\u{1FAB4}"],
      search: [["\u{1F9CA}", "\uB0C9\uC7A5\uACE0"], ["\u{1F373}", "\uAC00\uC2A4\uB808\uC778\uC9C0"], ["\u{1F6B0}", "\uAC1C\uC218\uB300"], ["\u{1F5C4}\uFE0F", "\uCC2C\uC7A5"], ["\u{1F9FA}", "\uC2DD\uB8CC\uD488 \uBC14\uAD6C\uB2C8"]],
      hide: ["\u{1F6AA}", "\uD070 \uCC2C\uC7A5 \uC548"]
    }
  };
  var STAGES = {
    0: {
      name: "\u{1F393} \uD29C\uD1A0\uB9AC\uC5BC",
      place: "\uC601\uC591\uC774\uC758 \uC5F0\uC2B5\uC2E4",
      theme: "practice",
      cols: 2,
      rows: 1,
      rw: 10,
      rh: 8,
      rooms: ["\uC5F0\uC2B5\uC2E4 \uC67C\uCABD", "\uC5F0\uC2B5\uC2E4 \uC624\uB978\uCABD"],
      germs: [],
      seed: 7
    },
    1: {
      name: "1\uCE35 \uD559\uAD50 \uAE09\uC2DD\uC2E4",
      place: "\uD559\uAD50 \uAE09\uC2DD\uC2E4",
      theme: "cafeteria",
      cols: 3,
      rows: 2,
      rw: 11,
      rh: 8,
      rooms: ["\uC785\uAD6C", "\uC2DD\uD0C1 \uAD6C\uC5ED", "\uBC30\uC2DD\uB300", "\uC190 \uC53B\uB294 \uACF3", "\uC2DD\uD310 \uBC18\uB0A9\uB300", "\uC870\uB9AC\uC2E4 \uC55E"],
      germs: ["basic", "basic", "mold"],
      seed: 101
    },
    2: {
      name: "2\uCE35 \uB0C9\uC7A5\uACE0 \uCC44\uC18C\uCE78",
      place: "\uB0C9\uC7A5\uACE0 \uCC44\uC18C\uCE78",
      theme: "veggie",
      cols: 3,
      rows: 2,
      rw: 11,
      rh: 8,
      rooms: ["\uBB38 \uCABD \uC120\uBC18", "\uC78E\uCC44\uC18C \uCE78", "\uBFCC\uB9AC\uCC44\uC18C \uCE78", "\uACFC\uC77C \uCE78", "\uC5BC\uC74C \uCE78", "\uB9E8 \uC544\uB798 \uC11C\uB78D"],
      germs: ["basic", "mold", "cavity"],
      seed: 202
    },
    3: {
      name: "3\uCE35 \uB0C9\uC7A5\uACE0 \uC6B0\uC720\xB7\uACE0\uAE30\uCE78",
      place: "\uB0C9\uC7A5\uACE0 \uC6B0\uC720\xB7\uACE0\uAE30\uCE78",
      theme: "dairy",
      cols: 3,
      rows: 2,
      rw: 11,
      rh: 8,
      rooms: ["\uC6B0\uC720 \uC120\uBC18", "\uCE58\uC988 \uC120\uBC18", "\uB2EC\uAC40 \uCE78", "\uB450\uBD80\xB7\uCF69 \uCE78", "\uC0DD\uC120 \uCE78", "\uACE0\uAE30 \uCE78"],
      germs: ["basic", "mold", "cavity"],
      seed: 303
    },
    4: {
      name: "4\uCE35 \uD143\uBC2D",
      place: "\uD559\uAD50 \uD143\uBC2D",
      theme: "garden",
      cols: 3,
      rows: 2,
      rw: 11,
      rh: 8,
      rooms: ["\uD143\uBC2D \uC785\uAD6C", "\uC0C1\uCD94 \uBC2D", "\uAC10\uC790 \uBC2D", "\uB538\uAE30 \uBC2D", "\uC625\uC218\uC218 \uBC2D", "\uBB3C \uC8FC\uB294 \uACF3"],
      germs: ["basic", "mold", "cavity", "basic"],
      seed: 404
    },
    5: {
      name: "5\uCE35 \uB3D9\uB124 \uC2DC\uC7A5",
      place: "\uB3D9\uB124 \uC2DC\uC7A5",
      theme: "market",
      cols: 3,
      rows: 2,
      rw: 11,
      rh: 8,
      rooms: ["\uC2DC\uC7A5 \uC785\uAD6C", "\uACFC\uC77C \uACE8\uBAA9", "\uCC44\uC18C \uACE8\uBAA9", "\uC0DD\uC120 \uACE8\uBAA9", "\uBE75 \uACE8\uBAA9", "\uACC4\uC0B0\uB300 \uC55E"],
      germs: ["basic", "cavity", "mold", "cavity"],
      seed: 505
    },
    6: {
      name: "6\uCE35 \uC6B0\uB9AC \uC9D1 \uC8FC\uBC29",
      place: "\uC6B0\uB9AC \uC9D1 \uC8FC\uBC29",
      theme: "kitchen",
      cols: 3,
      rows: 2,
      rw: 11,
      rh: 8,
      rooms: ["\uD604\uAD00", "\uC2DD\uD0C1", "\uAC1C\uC218\uB300", "\uB0C9\uC7A5\uACE0 \uC55E", "\uAC00\uC2A4\uB808\uC778\uC9C0", "\uCC2C\uC7A5 \uC55E"],
      germs: ["basic", "mold", "cavity", "cavity"],
      seed: 606
    }
  };
  var FOUND_LINES = [
    "\uCABD\uC9C0 \uC870\uAC01\uC744 \uCC3E\uC558\uC5B4! \uC870\uAE08\uB9CC \uB354 \uD798\uB0B4!",
    "\uC88B\uC544! \uC870\uAC01\uC774 \uD558\uB098 \uB354 \uBAA8\uC600\uC5B4!",
    "\uB300\uB2E8\uD574! \uC774\uC81C \uAC70\uC758 \uB2E4 \uC654\uC5B4!",
    "\uC870\uAC01\uC744 \uB2E4 \uBAA8\uC558\uC5B4! \uCABD\uC9C0\uB97C \uC5F4\uC5B4\uC11C \uC21C\uC11C\uB300\uB85C \uBD99\uC5EC \uBD10!"
  ];
  var MISS_LINES = [
    "\uC5EC\uAE34 \uC870\uAC01\uC774 \uC5C6\uB124. \uB2E4\uB978 ?\uAC00\uAD6C\uB97C \uCC3E\uC544\uBCF4\uC790!",
    "\uAF5D! \uADF8\uB798\uB3C4 \uAD1C\uCC2E\uC544, \uB2E4\uB978 \uACF3\uC5D0 \uC788\uC744 \uAC70\uC57C.",
    "\uC74C\u2026 \uC5EC\uAE30\uB294 \uC544\uB2C8\uC57C. \uAC10\uC9C0\uAE30\uB97C \uC798 \uBD10!"
  ];

  // maptest/js/layouts.js
  var LAYOUTS = {
    // 튜토리얼: L자 연습실 → 한 번 꺾이는 복도 → 홈이 파인 연습실
    0: { W: 36, H: 18, build(b) {
      b.room(0, 2, 2, 11, 6);
      b.room(0, 2, 8, 6, 5);
      b.hall(2, [13, 4], [18, 4], [18, 11], [22, 11]);
      b.room(1, 23, 7, 10, 8);
      b.cut(30, 7, 3, 2);
      b.fix("board", 3, 2, 2, 1);
      b.fix("desk", 8, 2, 3, 1);
      b.fix("cabinet", 23, 7, 2, 1);
      b.fix("crate", 30, 12, 2, 2);
      b.start(4, 5);
      b.exit(33, 11);
    } },
    // 1층 급식실: 입구 → 손 씻는 곳 → 넓은 식탁 구역. 북쪽 배식 통로와 동쪽 반납대가 조리실 앞에서 다시 만난다
    1: { W: 52, H: 32, build(b) {
      b.room(0, 2, 22, 9, 7);
      b.room(0, 11, 25, 4, 4);
      b.hall(2, [8, 21], [8, 18], [5, 18], [5, 16]);
      b.room(3, 3, 9, 8, 7);
      b.hall(2, [11, 11], [14, 11]);
      b.room(1, 15, 8, 18, 13);
      b.cut(29, 17, 4, 4);
      b.room(2, 17, 3, 16, 3);
      b.hall(2, [19, 6], [19, 7]);
      b.hall(2, [29, 6], [29, 7]);
      b.room(4, 35, 13, 7, 6);
      b.hall(2, [33, 14], [34, 14]);
      b.room(5, 38, 2, 11, 8);
      b.room(5, 43, 10, 6, 3);
      b.hall(2, [39, 10], [39, 12]);
      b.hall(2, [33, 3], [37, 3]);
      b.hall(2, [20, 21], [20, 26], [15, 26]);
      b.fix("board", 3, 22, 2, 1);
      b.fix("cabinet", 5, 22, 2, 1);
      b.fix("bench", 11, 28, 3, 1);
      b.fix("sink", 4, 9, 2, 1);
      b.fix("sink", 7, 9, 2, 1);
      b.fix("table", 17, 10, 3, 2);
      b.fix("table", 22, 10, 3, 2);
      b.fix("table", 17, 15, 3, 2);
      b.fix("table", 22, 15, 3, 2);
      b.fix("table", 27, 11, 3, 2);
      b.fix("counter", 21, 3, 3, 1);
      b.fix("counter", 25, 3, 3, 1);
      b.fix("sink", 36, 13, 2, 1);
      b.fix("counter", 39, 18, 3, 1);
      b.fix("stove", 41, 2, 2, 1);
      b.fix("stove", 44, 2, 2, 1);
      b.fix("fridge", 46, 7, 2, 2);
      b.start(4, 25);
      b.exit(49, 5);
    } },
    // 2층 냉장고 채소칸: 세로로 긴 문 쪽 선반, 계단 모양 잎채소 칸, 선반 줄 사이 좁은 통로, 떨어진 얼음 칸, 넓고 얕은 맨 아래 서랍
    2: { W: 50, H: 34, build(b) {
      b.room(0, 2, 2, 6, 22);
      b.room(1, 10, 2, 14, 8);
      b.room(1, 10, 10, 9, 4);
      b.hall(2, [8, 4], [9, 4]);
      b.hall(2, [8, 11], [9, 11]);
      b.room(2, 26, 2, 12, 10);
      b.hall(2, [24, 5], [25, 5]);
      b.room(4, 42, 2, 6, 7);
      b.hall(2, [38, 10], [44, 10], [44, 9]);
      b.hall(2, [44, 12], [44, 29]);
      b.room(3, 12, 17, 12, 7);
      b.room(3, 24, 19, 6, 5);
      b.hall(2, [14, 14], [14, 16]);
      b.hall(2, [8, 20], [11, 20]);
      b.room(5, 6, 28, 38, 4);
      b.hall(2, [26, 24], [26, 27]);
      b.hall(2, [4, 24], [4, 29]);
      b.fix("shelf", 2, 7, 1, 4);
      b.fix("shelf", 2, 14, 1, 4);
      b.fix("crate", 2, 19, 2, 2);
      b.fix("crate", 13, 4, 2, 2);
      b.fix("crate", 17, 4, 2, 2);
      b.fix("shelf", 20, 2, 4, 1);
      b.fix("shelf", 28, 4, 8, 1);
      b.fix("shelf", 28, 7, 8, 1);
      b.fix("fridge", 42, 2, 2, 2);
      b.fix("fridge", 46, 2, 2, 2);
      b.fix("crate", 13, 18, 2, 2);
      b.fix("shelf", 17, 17, 4, 1);
      b.fix("crate", 28, 19, 2, 2);
      b.fix("crate", 10, 30, 2, 2);
      b.fix("crate", 18, 30, 3, 2);
      b.fix("crate", 31, 30, 2, 2);
      b.start(4, 3);
      b.exit(36, 32);
    } },
    // 3층 우유·고기칸: 가운데 큰 냉장 설비를 한 바퀴 도는 통로와, 둘레에 붙은 크기가 다른 보관실
    3: { W: 48, H: 33, build(b) {
      b.hall(2, [16, 11], [30, 11], [30, 20], [16, 20], [16, 11]);
      b.fix("cooler", 18, 13, 12, 7, true);
      b.room(0, 3, 12, 10, 9);
      b.cut(3, 12, 3, 2);
      b.hall(2, [13, 15], [15, 15]);
      b.room(1, 6, 2, 12, 7);
      b.cut(6, 7, 4, 2);
      b.hall(2, [16, 9], [16, 10]);
      b.room(2, 24, 3, 8, 6);
      b.hall(2, [26, 9], [26, 10]);
      b.room(3, 35, 8, 9, 10);
      b.cut(41, 8, 3, 3);
      b.hall(2, [32, 14], [34, 14]);
      b.room(4, 30, 24, 14, 6);
      b.hall(2, [30, 22], [30, 23]);
      b.hall(2, [40, 18], [40, 23]);
      b.room(5, 5, 24, 15, 7);
      b.cut(5, 28, 4, 3);
      b.hall(2, [16, 22], [16, 23]);
      b.hall(2, [6, 21], [6, 23]);
      b.fix("shelf", 8, 20, 4, 1);
      b.fix("fridge", 10, 12, 2, 2);
      b.fix("shelf", 10, 2, 4, 1);
      b.fix("fridge", 15, 2, 2, 2);
      b.fix("crate", 7, 4, 2, 2);
      b.fix("shelf", 27, 3, 4, 1);
      b.fix("fridge", 42, 15, 2, 2);
      b.fix("shelf", 36, 8, 4, 1);
      b.fix("crate", 37, 13, 2, 2);
      b.fix("counter", 34, 24, 3, 1);
      b.fix("sink", 32, 29, 2, 1);
      b.fix("fridge", 36, 28, 2, 2);
      b.fix("fridge", 9, 24, 2, 2);
      b.fix("fridge", 12, 24, 2, 2);
      b.fix("counter", 14, 29, 3, 1);
      b.start(5, 16);
      b.exit(44, 27);
    } },
    // 4층 텃밭: 울타리 친 밭들 사이를 흙길이 굽이굽이 잇는 바깥 공간. 물 주는 곳에 도구 창고와 물탱크
    4: { W: 50, H: 34, build(b) {
      b.room(0, 2, 13, 8, 8);
      b.room(0, 4, 21, 4, 3);
      b.hall(2, [10, 15], [20, 15]);
      b.hall(2, [20, 4], [20, 28]);
      b.room(1, 8, 2, 10, 8);
      b.cut(8, 8, 3, 2);
      b.hall(2, [18, 5], [19, 5]);
      b.room(2, 24, 2, 12, 9);
      b.cut(32, 8, 4, 3);
      b.hall(2, [22, 6], [23, 6]);
      b.room(3, 24, 19, 10, 9);
      b.room(3, 34, 22, 4, 6);
      b.hall(2, [22, 21], [23, 21]);
      b.room(4, 6, 24, 12, 8);
      b.cut(6, 24, 3, 2);
      b.hall(2, [18, 27], [19, 27]);
      b.room(5, 40, 6, 8, 12);
      b.cut(46, 6, 2, 3);
      b.hall(2, [36, 7], [39, 7]);
      b.hall(2, [42, 18], [42, 24], [38, 24]);
      b.fix("board", 6, 13, 2, 1);
      b.fix("bench", 3, 19, 3, 1);
      b.fix("bed", 9, 3, 3, 2);
      b.fix("bed", 13, 3, 3, 2);
      b.fix("bed", 13, 7, 3, 2);
      b.fix("bed", 25, 3, 3, 2);
      b.fix("bed", 29, 3, 3, 2);
      b.fix("bed", 25, 7, 3, 2);
      b.fix("bed", 29, 7, 2, 2);
      b.fix("bed", 25, 20, 3, 2);
      b.fix("bed", 29, 20, 3, 2);
      b.fix("bed", 25, 24, 3, 2);
      b.fix("bed", 29, 24, 3, 2);
      b.fix("bed", 10, 26, 3, 2);
      b.fix("bed", 14, 26, 3, 2);
      b.fix("bed", 7, 29, 3, 2);
      b.fix("bed", 12, 29, 3, 2);
      b.fix("tank", 44, 9, 2, 2);
      b.fix("shed", 45, 15, 2, 2);
      b.fix("bench", 41, 16, 3, 1);
      b.start(4, 16);
      b.exit(48, 12);
    } },
    // 5층 동네 시장: 한 번 꺾이는 큰길에 크기가 다른 골목이 입을 벌리고 붙어 있다. 뒷길과 뒷창고로 돌아갈 수 있다
    5: { W: 54, H: 32, build(b) {
      b.room(0, 2, 11, 8, 9);
      b.hall(3, [10, 14], [24, 14], [24, 17], [44, 17]);
      b.room(1, 13, 2, 6, 12);
      b.room(1, 19, 4, 4, 5);
      b.room(2, 12, 17, 8, 11);
      b.room(2, 8, 23, 4, 5);
      b.room(3, 28, 3, 7, 14);
      b.room(3, 35, 3, 6, 4);
      b.room(4, 30, 20, 9, 7);
      b.room(5, 45, 10, 7, 14);
      b.hall(2, [41, 4], [47, 4], [47, 9]);
      b.hall(2, [6, 20], [6, 24], [7, 24]);
      b.fix("board", 3, 11, 2, 1);
      b.fix("bench", 2, 19, 3, 1);
      b.fix("stall", 13, 3, 3, 2);
      b.fix("stall", 16, 8, 3, 2);
      b.fix("crate", 20, 5, 2, 2);
      b.fix("stall", 12, 19, 3, 2);
      b.fix("stall", 17, 23, 3, 2);
      b.fix("crate", 9, 25, 2, 2);
      b.fix("fridge", 28, 4, 2, 2);
      b.fix("sink", 32, 3, 2, 1);
      b.fix("stall", 28, 10, 3, 2);
      b.fix("counter", 37, 3, 3, 1);
      b.fix("shelf", 31, 26, 4, 1);
      b.fix("counter", 35, 21, 3, 1);
      b.fix("desk", 47, 20, 3, 1);
      b.fix("cabinet", 46, 11, 2, 1);
      b.start(4, 15);
      b.exit(52, 16);
    } },
    // 6층 우리 집 주방: 좁은 현관 → 복도 → 식탁. 개수대·냉장고·가스레인지가 폭이 다른 통로로 이어지고 찬장 창고가 따로 있다
    6: { W: 46, H: 32, build(b) {
      b.room(0, 2, 20, 6, 9);
      b.hall(2, [8, 22], [13, 22], [13, 14]);
      b.room(1, 10, 3, 14, 11);
      b.cut(10, 3, 3, 3);
      b.room(2, 26, 3, 8, 4);
      b.hall(2, [24, 4], [25, 4]);
      b.room(3, 36, 3, 8, 9);
      b.hall(1, [34, 5], [35, 5]);
      b.room(4, 26, 10, 8, 8);
      b.hall(2, [24, 11], [25, 11]);
      b.hall(2, [36, 12], [36, 15], [34, 15]);
      b.room(5, 30, 21, 12, 8);
      b.room(5, 24, 24, 6, 4);
      b.hall(2, [30, 18], [30, 20]);
      b.hall(2, [8, 26], [23, 26]);
      b.fix("cabinet", 2, 20, 2, 1);
      b.fix("bench", 5, 28, 3, 1);
      b.fix("table", 14, 6, 3, 2);
      b.fix("table", 18, 6, 3, 2);
      b.fix("cabinet", 21, 12, 2, 1);
      b.fix("sink", 27, 3, 2, 1);
      b.fix("sink", 31, 3, 2, 1);
      b.fix("fridge", 42, 3, 2, 2);
      b.fix("fridge", 39, 3, 2, 2);
      b.fix("shelf", 40, 10, 3, 1);
      b.fix("stove", 27, 10, 2, 1);
      b.fix("stove", 31, 10, 2, 1);
      b.fix("counter", 30, 16, 3, 1);
      b.fix("shelf", 34, 21, 3, 1);
      b.fix("shelf", 38, 21, 3, 1);
      b.fix("crate", 37, 27, 2, 2);
      b.fix("cabinet", 24, 24, 2, 1);
      b.start(4, 26);
      b.exit(42, 25);
    } }
  };
  function compileLayout(id) {
    const L = LAYOUTS[id] || LAYOUTS[1], W = L.W, H = L.H;
    const kind = new Uint8Array(W * H), room = new Int8Array(W * H).fill(-1);
    const fixtures = [];
    let start = null, exit = null;
    const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const rect = (x, y, w, h, f) => {
      for (let Y = y; Y < y + h; Y++) for (let X = x; X < x + w; X++) if (inb(X, Y)) f(Y * W + X);
    };
    const b = {
      room(rid, x, y, w, h) {
        rect(x, y, w, h, (i) => {
          kind[i] = 1;
          room[i] = rid;
        });
      },
      cut(x, y, w, h) {
        rect(x, y, w, h, (i) => {
          kind[i] = 0;
          room[i] = -1;
        });
      },
      hall(wd, ...pts) {
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
          const x0 = Math.min(ax, bx), y0 = Math.min(ay, by);
          const w = ay === by ? Math.abs(bx - ax) + 1 : wd, h = ay === by ? wd : Math.abs(by - ay) + 1;
          rect(x0, y0, w, h, (i) => {
            if (kind[i] === 0) kind[i] = 1;
          });
        }
      },
      fix(type, x, y, w, h, hallSide) {
        fixtures.push({ type, x, y, w, h, hallSide: !!hallSide });
        rect(x, y, w, h, (i) => {
          kind[i] = 2;
        });
      },
      start(x, y) {
        start = { x, y };
      },
      exit(x, y) {
        exit = { x, y };
      }
    };
    L.build(b);
    return { W, H, kind, room, fixtures, start, exit };
  }

  // maptest/js/map.js
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }
  var ESCAPE_ROOMS = {
    practice: [
      ["\uC624\uB9AC\uC5D4\uD14C\uC774\uC158", "wood", ["desk", "cabinet", "board"], ["\uB2E8\uC11C \uC5F0\uC2B5 \uC11C\uB78D", "\uC601\uC591\uC774 \uC548\uB0B4 \uBCF4\uAD00\uD568"]],
      ["\uD0C8\uCD9C \uC5F0\uC2B5 \uAD6C\uC5ED", "tile", ["cabinet", "desk", "crate"], ["\uCABD\uC9C0 \uC5F0\uC2B5 \uC0C1\uC790", "\uD0C8\uCD9C \uC5F0\uC2B5 \uC11C\uB78D"]]
    ],
    cafeteria: [
      ["\uAE09\uC2DD\uC2E4 \uCD9C\uC785 \uD1B5\uC81C", "tile", ["cabinet", "desk", "board"], ["\uCD9C\uC785 \uAE30\uB85D\uD568", "\uC624\uB298\uC758 \uC2DD\uB2E8 \uC11C\uB78D"]],
      ["\uC2DD\uD0C1 \uAD6C\uC5ED", "tile", ["table", "table", "table"], ["\uC2DD\uD0C1 \uC544\uB798 \uBCF4\uAD00\uD568", "\uC2DD\uB2E8 \uCE74\uB4DC \uC0C1\uC790"]],
      ["\uBC30\uC2DD \uAD6C\uC5ED", "tile", ["counter", "counter", "fridge"], ["\uBC30\uC2DD\uB300 \uC11C\uB78D", "\uC218\uC800 \uBCF4\uAD00\uD568"]],
      ["\uC190 \uC53B\uB294 \uAD6C\uC5ED", "wet", ["sink", "sink", "cabinet"], ["\uC704\uC0DD\uC6A9\uD488 \uC218\uB0A9\uD568", "\uC190 \uC53B\uAE30 \uC548\uB0B4\uD568"]],
      ["\uC2DD\uD310 \uBC18\uB0A9 \uAD6C\uC5ED", "wet", ["sink", "counter", "crate"], ["\uC2DD\uD310 \uC218\uB808", "\uC138\uCC99 \uAE30\uB85D\uD568"]],
      ["\uC870\uB9AC \uC900\uBE44\uC2E4", "tile", ["stove", "counter", "fridge"], ["\uC870\uB9AC\uB300 \uC11C\uB78D", "\uC2DD\uC7AC\uB8CC \uB0C9\uC7A5\uACE0"]]
    ],
    veggie: [
      ["\uCC44\uC18C \uBCF4\uAD00 \uAD6C\uC5ED", "cold", ["crate", "crate", "shelf"], ["\uBC30\uCD94 \uBCF4\uAD00 \uC0C1\uC790", "\uCC44\uC18C \uAE30\uB85D\uD568"]],
      ["\uBFCC\uB9AC\uCC44\uC18C \uC120\uBC18", "cold", ["shelf", "crate", "crate"], ["\uB2F9\uADFC \uBCF4\uAD00 \uC0C1\uC790", "\uBFCC\uB9AC\uCC44\uC18C \uC11C\uB78D"]],
      ["\uACFC\uC77C \uC800\uC7A5 \uAD6C\uC5ED", "cold", ["crate", "shelf", "crate"], ["\uC0AC\uACFC \uBCF4\uAD00 \uC0C1\uC790", "\uACFC\uC77C \uAE30\uB85D\uD568"]],
      ["\uB0C9\uAC01 \uC124\uBE44\uC2E4", "wet", ["fridge", "fridge", "cabinet"], ["\uC5BC\uC74C \uD2C0 \uBCF4\uAD00\uD568", "\uC628\uB3C4 \uC810\uAC80\uD568"]],
      ["\uACFC\uCC44\uB958 \uBCF4\uAD00 \uAD6C\uC5ED", "cold", ["shelf", "crate", "shelf"], ["\uC218\uBC15 \uBCF4\uAD00 \uC0C1\uC790", "\uACFC\uCC44\uB958 \uAE30\uB85D\uD568"]],
      ["\uC7AC\uACE0 \uC810\uAC80 \uAD6C\uC5ED", "cold", ["desk", "cabinet", "shelf"], ["\uC7AC\uACE0 \uAE30\uB85D \uC11C\uB78D", "\uCC44\uC18C \uBD84\uB958\uD568"]]
    ],
    dairy: [
      ["\uC6B0\uC720 \uB0C9\uC7A5 \uAD6C\uC5ED", "cold", ["fridge", "fridge", "shelf"], ["\uC6B0\uC720 \uBCF4\uAD00\uD568", "\uC6B0\uC720 \uAE30\uB85D\uD568"]],
      ["\uCE58\uC988 \uC219\uC131 \uAD6C\uC5ED", "cold", ["shelf", "fridge", "crate"], ["\uCE58\uC988 \uBCF4\uAD00\uD568", "\uCE58\uC988 \uBD84\uB958\uD568"]],
      ["\uB2EC\uAC40 \uBCF4\uAD00 \uAD6C\uC5ED", "cold", ["shelf", "crate", "shelf"], ["\uB2EC\uAC40\uD310 \uBCF4\uAD00\uD568", "\uB2EC\uAC40 \uAE30\uB85D\uD568"]],
      ["\uCF69\xB7\uB450\uBD80 \uB0C9\uC7A5 \uAD6C\uC5ED", "cold", ["fridge", "shelf", "crate"], ["\uB450\uBD80 \uBCF4\uAD00\uD568", "\uCF69 \uBCF4\uAD00 \uC0C1\uC790"]],
      ["\uC0DD\uC120 \uB0C9\uC7A5 \uAD6C\uC5ED", "wet", ["fridge", "counter", "sink"], ["\uC0DD\uC120 \uBCF4\uAD00\uD568", "\uC0DD\uC120 \uC810\uAC80\uD568"]],
      ["\uACE0\uAE30 \uB0C9\uC7A5 \uAD6C\uC5ED", "cold", ["fridge", "counter", "cabinet"], ["\uACE0\uAE30 \uBCF4\uAD00\uD568", "\uB0C9\uC7A5 \uAE30\uB85D\uD568"]]
    ],
    garden: [
      ["\uD143\uBC2D \uAD00\uB9AC\uC18C", "stone", ["shed", "bench", "crate"], ["\uD143\uBC2D \uAD00\uB9AC \uC0C1\uC790", "\uC528\uC557 \uAE30\uB85D\uD568"]],
      ["\uC0C1\uCD94 \uC7AC\uBC30 \uAD6C\uC5ED", "soil", ["bed", "bed", "bench"], ["\uC0C1\uCD94 \uD45C\uC9C0 \uC0C1\uC790", "\uC7AC\uBC30 \uAE30\uB85D\uD568"]],
      ["\uAC10\uC790 \uC7AC\uBC30 \uAD6C\uC5ED", "soil", ["bed", "bed", "crate"], ["\uAC10\uC790 \uC218\uD655 \uC0C1\uC790", "\uAC10\uC790 \uAE30\uB85D\uD568"]],
      ["\uB538\uAE30 \uC7AC\uBC30 \uAD6C\uC5ED", "soil", ["bed", "bed", "bench"], ["\uB538\uAE30 \uC218\uD655 \uC0C1\uC790", "\uB538\uAE30 \uAE30\uB85D\uD568"]],
      ["\uC625\uC218\uC218 \uC7AC\uBC30 \uAD6C\uC5ED", "soil", ["bed", "bed", "shed"], ["\uC625\uC218\uC218 \uC218\uD655 \uC0C1\uC790", "\uC528\uC557 \uBCF4\uAD00\uD568"]],
      ["\uAE09\uC218\xB7\uB3C4\uAD6C \uCC3D\uACE0", "stone", ["tank", "shed", "bench"], ["\uBB3C\uBFCC\uB9AC\uAC1C \uBCF4\uAD00\uD568", "\uB3C4\uAD6C \uC815\uB9AC\uD568"]]
    ],
    market: [
      ["\uC2DC\uC7A5 \uC548\uB0B4 \uAD6C\uC5ED", "stone", ["stall", "bench", "board"], ["\uC2DC\uC7A5 \uC548\uB0B4\uD568", "\uC0C1\uC810 \uC9C0\uB3C4 \uC11C\uB78D"]],
      ["\uACFC\uC77C \uAC00\uAC8C", "stone", ["stall", "crate", "stall"], ["\uACFC\uC77C \uAC00\uAC8C \uC11C\uB78D", "\uACFC\uC77C \uC7AC\uACE0 \uC0C1\uC790"]],
      ["\uCC44\uC18C \uAC00\uAC8C", "stone", ["stall", "crate", "stall"], ["\uCC44\uC18C \uAC00\uAC8C \uC11C\uB78D", "\uCC44\uC18C \uC7AC\uACE0 \uC0C1\uC790"]],
      ["\uC0DD\uC120 \uAC00\uAC8C", "wet", ["stall", "sink", "fridge"], ["\uC0DD\uC120 \uAC00\uAC8C \uC11C\uB78D", "\uB0C9\uC7A5 \uC810\uAC80\uD568"]],
      ["\uBE75 \uAC00\uAC8C", "wood", ["stall", "shelf", "counter"], ["\uBE75 \uAC00\uAC8C \uC11C\uB78D", "\uBE75 \uC7AC\uB8CC \uBCF4\uAD00\uD568"]],
      ["\uC2DC\uC7A5 \uACC4\uC0B0 \uAD6C\uC5ED", "stone", ["desk", "cabinet", "crate"], ["\uACC4\uC0B0\uB300 \uC11C\uB78D", "\uC601\uC218\uC99D \uBCF4\uAD00\uD568"]]
    ],
    kitchen: [
      ["\uD604\uAD00\xB7\uC2DD\uD488 \uC218\uB0A9", "wood", ["cabinet", "bench", "shelf"], ["\uD604\uAD00 \uC218\uB0A9\uD568", "\uC2DD\uD488 \uBAA9\uB85D \uC11C\uB78D"]],
      ["\uAC00\uC871 \uC2DD\uD0C1", "wood", ["table", "table", "cabinet"], ["\uC2DD\uD0C1 \uC11C\uB78D", "\uC2DD\uB2E8 \uACC4\uD68D\uD568"]],
      ["\uC124\uAC70\uC9C0 \uAD6C\uC5ED", "wet", ["sink", "counter", "cabinet"], ["\uAC1C\uC218\uB300 \uC218\uB0A9\uD568", "\uC138\uCC99\uC6A9\uD488 \uBCF4\uAD00\uD568"]],
      ["\uB0C9\uC7A5\uACE0 \uAD6C\uC5ED", "tile", ["fridge", "fridge", "shelf"], ["\uB0C9\uC7A5\uACE0 \uC2DD\uD488\uCE78", "\uBCF4\uAD00 \uB0A0\uC9DC \uAE30\uB85D\uD568"]],
      ["\uAC00\uC5F4 \uC870\uB9AC \uAD6C\uC5ED", "tile", ["stove", "counter", "counter"], ["\uC870\uB9AC\uB300 \uC11C\uB78D", "\uC870\uB9AC \uB3C4\uAD6C\uD568"]],
      ["\uCC2C\uC7A5\xB7\uC2DD\uB8CC\uD488 \uCC3D\uACE0", "wood", ["cabinet", "shelf", "crate"], ["\uCC2C\uC7A5 \uBCF4\uAD00\uD568", "\uC2DD\uB8CC\uD488 \uBC14\uAD6C\uB2C8"]]
    ]
  };
  var pick = (r, a) => a[Math.floor(r() * a.length)];
  function shuffle(r, a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var MAP_VERSION = 4;
  function buildStage(stageId) {
    const S = STAGES[stageId], T = THEMES[S.theme], r = rng(S.seed);
    const L = compileLayout(stageId), W = L.W, H = L.H;
    const g = new Uint8Array(W * H).fill(1);
    const room = Int8Array.from(L.room);
    for (let i = 0; i < W * H; i++) if (L.kind[i]) g[i] = L.kind[i] === 1 ? 0 : 2;
    const at = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 1 : g[y * W + x];
    const set = (x, y, v) => {
      if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = v;
    };
    const rooms = S.rooms.map((name, id) => {
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (room[y * W + x] === id) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      let cx = x0, cy = y0, bd = 1e9, signX = x0, signY = y0, sd = 1e9;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (room[y * W + x] !== id || g[y * W + x] !== 0) continue;
        const d = (x - mx) ** 2 + (y - my) ** 2;
        if (d < bd) {
          bd = d;
          cx = x;
          cy = y;
        }
        if (at(x, y - 1) === 1 && at(x + 1, y) === 0 && y * 100 + x < sd) {
          sd = y * 100 + x;
          signX = x;
          signY = y;
        }
      }
      return { id, x0, y0, x1, y1, cx, cy, name, signX, signY };
    });
    const doors = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (g[i] !== 0 || room[i] >= 0) continue;
      for (const [dx, dy] of DIRS) {
        const j = (y + dy) * W + x + dx;
        if (room[j] < 0 || g[j] === 1) continue;
        const side = dx ? [at(x, y - 1), at(x, y + 1)] : [at(x - 1, y), at(x + 1, y)];
        if (side.includes(1)) {
          doors.push({ x, y, dx, dy, roomId: room[j] });
          break;
        }
      }
    }
    const startTile = { x: L.start.x, y: L.start.y };
    const start = { x: startTile.x + 0.5, y: startTile.y + 0.5 };
    const ex = L.exit, inner = DIRS.map(([dx, dy]) => ({ ix: ex.x - dx, iy: ex.y - dy, dx, dy })).find((n) => at(n.ix, n.iy) === 0);
    set(ex.x, ex.y, 1);
    const exit = { x: ex.x, y: ex.y, ix: inner.ix, iy: inner.iy, dir: inner.dx > 0 ? "e" : inner.dx < 0 ? "w" : inner.dy > 0 ? "s" : "n" };
    const keep = new Uint8Array(W * H);
    const keepAround = (x, y, rad) => {
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W && Y < H) keep[Y * W + X] = 1;
      }
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 0 && room[y * W + x] === -1) keepAround(x, y, 1);
    keepAround(startTile.x, startTile.y, 2);
    keepAround(exit.ix, exit.iy, 1);
    const free = (x, y) => at(x, y) === 0 && !keep[y * W + x];
    const nearSolid = (x, y) => DIRS.some(([dx, dy]) => at(x + dx, y + dy) !== 0);
    const objects = [];
    const reachable = () => objects.every((o) => o.kind === "decor" || DIRS.some(([dx, dy]) => at(o.x + dx, o.y + dy) === 0));
    const placeIn = (rm, kind, data, tries = 400) => {
      for (let t = 0; t < tries; t++) {
        const x = rm.x0 + Math.floor(r() * (rm.x1 - rm.x0 + 1)), y = rm.y0 + Math.floor(r() * (rm.y1 - rm.y0 + 1));
        if (room[y * W + x] !== rm.id || !free(x, y)) continue;
        if (kind !== "decor" && t < tries * 0.6 && !nearSolid(x, y)) continue;
        set(x, y, 2);
        if (!connected(g, W, H, startTile) || !reachable()) {
          set(x, y, 0);
          continue;
        }
        const o = { kind, x, y, ...data, id: objects.length };
        objects.push(o);
        keepAround(x, y, 0);
        return o;
      }
      return null;
    };
    const nSearch = stageId === 0 ? 4 : 10;
    const ids = rooms.map((rm) => rm.id), pool = stageId === 0 ? ids : ids.slice(1);
    const order = stageId === 0 ? [] : [0];
    while (order.length < nSearch) order.push(...shuffle(r, pool.slice()));
    order.length = nSearch;
    order.forEach((rid, i) => {
      const [emoji, name] = T.search[i % T.search.length];
      placeIn(rooms[rid], "search", { emoji, name });
    });
    const nHide = stageId === 0 ? 1 : 4;
    shuffle(r, rooms.slice(stageId === 0 ? 0 : 1)).slice(0, nHide).forEach((rm) => placeIn(rm, "hide", { emoji: T.hide[0], name: T.hide[1] }));
    if (stageId === 0 && !objects.some((o) => o.kind === "hide")) placeIn(rooms[0], "hide", { emoji: T.hide[0], name: T.hide[1] });
    for (const rm of rooms) {
      const n = stageId === 0 ? 2 : 3;
      for (let i = 0; i < n; i++) placeIn(rm, "decor", { emoji: pick(r, T.decor), name: "" }, 40);
    }
    const profiles = ESCAPE_ROOMS[S.theme] || ESCAPE_ROOMS.practice;
    for (const rm of rooms) {
      const profile = profiles[rm.id % profiles.length];
      rm.scene = profile[0];
      rm.floorStyle = profile[1];
      objects.filter((o) => o.kind === "search" && room[o.y * W + o.x] === rm.id).forEach((o, i) => {
        o.name = profile[3][i % profile[3].length];
        o.art = /냉장|우유|고기|생선/.test(o.name) ? "fridge" : /상자|바구니/.test(o.name) ? "crate" : "cabinet";
      });
    }
    const fixtures = L.fixtures.map((f) => ({ ...f, roomId: room[f.y * W + f.x] }));
    const pickups = [];
    const floorTiles = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 0 && room[y * W + x] >= 0 && !(x === startTile.x && y === startTile.y)) floorTiles.push({ x, y });
    shuffle(r, floorTiles);
    const nSoap = stageId === 0 ? 3 : 12;
    for (let i = 0; i < nSoap && i < floorTiles.length; i++) pickups.push({ id: i, kind: "soap", x: floorTiles[i].x, y: floorTiles[i].y });
    if (stageId !== 0) {
      pickups.push({ id: nSoap, kind: "water", x: floorTiles[nSoap].x, y: floorTiles[nSoap].y });
      pickups.push({ id: nSoap + 1, kind: "mask", x: floorTiles[nSoap + 1].x, y: floorTiles[nSoap + 1].y });
    }
    const germSpots = [];
    const others = rooms.length > 1 ? rooms.slice(1) : rooms;
    for (let i = 0; i < 12; i++) {
      const rm = others[i % others.length];
      for (let t = 0; t < 80; t++) {
        const x = rm.x0 + Math.floor(r() * (rm.x1 - rm.x0 + 1)), y = rm.y0 + Math.floor(r() * (rm.y1 - rm.y0 + 1));
        if (at(x, y) === 0 && room[y * W + x] === rm.id) {
          germSpots.push({ x: x + 0.5, y: y + 0.5 });
          break;
        }
      }
    }
    return {
      id: stageId,
      S,
      T,
      W,
      H,
      g,
      room,
      rooms,
      start,
      startTile,
      exit,
      objects,
      pickups,
      germSpots,
      doors,
      fixtures,
      layoutVersion: MAP_VERSION,
      at,
      solid: (x, y) => at(x, y) !== 0,
      roomAt(x, y) {
        const X = Math.floor(x), Y = Math.floor(y);
        if (X < 0 || Y < 0 || X >= W || Y >= H) return null;
        const id = room[Y * W + X];
        return id >= 0 ? rooms[id] : nearestRoom(rooms, X, Y);
      }
    };
  }
  function nearestRoom(rooms, x, y) {
    let best = rooms[0], bd = 1e9;
    for (const rm of rooms) {
      const cx = (rm.x0 + rm.x1) / 2, cy = (rm.y0 + rm.y1) / 2, d = (cx - x) ** 2 + (cy - y) ** 2;
      if (d < bd) {
        bd = d;
        best = rm;
      }
    }
    return best;
  }
  function connected(g, W, H, s) {
    let total = 0;
    for (let i = 0; i < g.length; i++) if (g[i] === 0) total++;
    const seen = new Uint8Array(W * H), q = [s.y * W + s.x];
    seen[q[0]] = 1;
    let n = 0;
    while (q.length) {
      const i = q.pop();
      n++;
      const x = i % W, y = i / W | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const j = Y * W + X;
        if (!seen[j] && g[j] === 0) {
          seen[j] = 1;
          q.push(j);
        }
      }
    }
    return n === total;
  }
  function lineOfSight(map, ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), steps = Math.ceil(d / 0.2);
    for (let i = 1; i < steps; i++) {
      const t = i / steps, x = Math.floor(ax + (bx - ax) * t), y = Math.floor(ay + (by - ay) * t);
      if (map.at(x, y) === 1) return false;
    }
    return true;
  }
  function findPath(map, sx, sy, tx, ty, maxLen = 400) {
    const { W, H } = map;
    sx = Math.floor(sx);
    sy = Math.floor(sy);
    tx = Math.floor(tx);
    ty = Math.floor(ty);
    if (map.solid(tx, ty)) return null;
    const prev = new Int32Array(W * H).fill(-1), s = sy * W + sx, t = ty * W + tx;
    prev[s] = s;
    const q = [s];
    let head = 0;
    while (head < q.length && head < maxLen * 8) {
      const i = q[head++];
      if (i === t) break;
      const x = i % W, y = i / W | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (map.solid(X, Y)) continue;
        const j = Y * W + X;
        if (prev[j] < 0) {
          prev[j] = i;
          q.push(j);
        }
      }
    }
    if (prev[t] < 0) return null;
    const path = [];
    for (let i = t; i !== s; i = prev[i]) path.push({ x: i % W + 0.5, y: (i / W | 0) + 0.5 });
    return path.reverse();
  }

  // maptest/js/save.js
  var PREFIX = "nyamtest1:";
  var key = (cls, num) => `${PREFIX}c${cls}:n${num}`;
  function read(k) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  }
  function write(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  }
  var Save = {
    load(cls, num) {
      const s = read(key(cls, num));
      return s && s.v === SAVE_VERSION ? s : null;
    },
    store(cls, num, data) {
      data.v = SAVE_VERSION;
      data.updated = Date.now();
      return write(key(cls, num), data);
    },
    remove(cls, num) {
      try {
        localStorage.removeItem(key(cls, num));
      } catch {
      }
    },
    // 반 전체 목록(선생님 화면)
    listClass(cls) {
      const out = [];
      for (let n = 1; n <= 30; n++) {
        const s = this.load(cls, n);
        if (s) out.push({ num: n, s });
      }
      return out;
    },
    removeClass(cls) {
      for (let n = 1; n <= 30; n++) this.remove(cls, n);
    },
    classesWithData() {
      const set = /* @__PURE__ */ new Set();
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          const m = k && k.match(/^nyamtest1:c(\d+):n\d+$/);
          if (m) set.add(+m[1]);
        }
      } catch {
      }
      return [...set].sort((a, b) => a - b);
    },
    // 마지막으로 고른 반(다음에 바로 보이게)
    get lastClass() {
      return +(read(PREFIX + "lastClass") || 0);
    },
    set lastClass(v) {
      write(PREFIX + "lastClass", v);
    },
    get sound() {
      return read(PREFIX + "sound") === true;
    },
    set sound(v) {
      write(PREFIX + "sound", !!v);
    },
    get diff() {
      return read(PREFIX + "diff") || "easy";
    },
    set diff(v) {
      write(PREFIX + "diff", v);
    }
  };

  // maptest/js/sound.js
  var ctx = null;
  var bgm = null;
  var BPM = 132;
  var STEP = 60 / BPM / 2;
  var LEAD = [
    76,
    0,
    79,
    0,
    84,
    83,
    81,
    79,
    // C
    77,
    0,
    81,
    0,
    84,
    0,
    81,
    0,
    // F
    79,
    0,
    83,
    0,
    86,
    84,
    83,
    81,
    // G
    79,
    0,
    76,
    0,
    72,
    0,
    0,
    0,
    // C
    76,
    0,
    81,
    0,
    84,
    0,
    81,
    76,
    // Am
    77,
    0,
    81,
    0,
    84,
    83,
    81,
    77,
    // F
    79,
    81,
    83,
    84,
    86,
    0,
    83,
    0,
    // G
    84,
    0,
    79,
    0,
    72,
    0,
    0,
    0
    // C
  ];
  var BASS = [
    48,
    55,
    48,
    55,
    53,
    60,
    53,
    60,
    55,
    62,
    55,
    62,
    48,
    55,
    48,
    55,
    57,
    64,
    57,
    64,
    53,
    60,
    53,
    60,
    55,
    62,
    55,
    62,
    48,
    55,
    48,
    48
  ];
  var midi = (m) => 440 * 2 ** ((m - 69) / 12);
  function note(m, t, dur, type, vol, out) {
    if (!m) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = midi(m);
    g.gain.setValueAtTime(1e-4, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(1e-3, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  var Sound = {
    on: Save.sound,
    get playing() {
      return !!bgm;
    },
    toggle() {
      this.on = !this.on;
      Save.sound = this.on;
      if (this.on) this.unlock();
      else this.bgmStop();
      return this.on;
    },
    unlock() {
      if (!this.on) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
      } catch {
        ctx = null;
      }
      this.bgmStart();
    },
    bgmStart() {
      if (!this.on || !ctx || bgm) return;
      const gain = ctx.createGain();
      gain.gain.value = 0.07;
      gain.connect(ctx.destination);
      bgm = { gain, step: 0, next: ctx.currentTime + 0.1, timer: setInterval(() => this.bgmTick(), 50) };
    },
    // 0.25초 앞까지 음을 미리 예약한다(타이머가 조금 늦어도 박자가 흔들리지 않게)
    bgmTick() {
      if (!bgm || !ctx) return;
      const now = ctx.currentTime;
      if (bgm.next < now - 0.3) bgm.next = now + 0.05;
      while (bgm.next < now + 0.25) {
        const i = bgm.step % LEAD.length;
        note(LEAD[i], bgm.next, STEP * 0.9, "triangle", 0.9, bgm.gain);
        if (i % 2 === 0) note(BASS[i / 2], bgm.next, STEP * 1.8, "square", 0.25, bgm.gain);
        bgm.step++;
        bgm.next += STEP;
      }
    },
    bgmStop() {
      if (!bgm) return;
      clearInterval(bgm.timer);
      const g = bgm.gain;
      bgm = null;
      try {
        g.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        setTimeout(() => g.disconnect(), 400);
      } catch {
      }
    },
    tone(freqs, dur = 0.12, type = "sine", vol = 0.15) {
      if (!this.on) return;
      this.unlock();
      if (!ctx) return;
      let t = ctx.currentTime;
      for (const f of freqs) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + dur);
        t += dur * 0.8;
      }
    },
    pickup() {
      this.tone([880, 1320], 0.08, "triangle");
    },
    good() {
      this.tone([660, 880, 1100], 0.1, "triangle");
    },
    bad() {
      this.tone([300, 220], 0.15, "square", 0.08);
    },
    pop() {
      this.tone([1200, 600], 0.06, "sine", 0.12);
    },
    caught() {
      this.tone([440, 330, 220], 0.16, "sawtooth", 0.07);
    },
    open() {
      this.tone([523, 659, 784, 1047], 0.12, "triangle");
    },
    spotted() {
      this.tone([700, 900], 0.07, "square", 0.05);
    }
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (!ctx) return;
      try {
        if (document.hidden) ctx.suspend();
        else if (Sound.on) ctx.resume();
      } catch {
      }
    });
  }

  // maptest/js/game.js
  var IMG = {};
  var emojiCache = /* @__PURE__ */ new Map();
  function emojiCanvas(e, px) {
    px = Math.max(8, Math.round(px));
    const k = e + px;
    let c = emojiCache.get(k);
    if (!c) {
      c = document.createElement("canvas");
      c.width = c.height = Math.ceil(px * 1.25);
      const g = c.getContext("2d");
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      g.fillText(e, c.width / 2, c.height / 2 + px * 0.06);
      emojiCache.set(k, c);
    }
    return c;
  }
  var rand = (a, b) => a + Math.random() * (b - a);
  function shuffled(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  var TUTORIAL = [
    { ev: "search", text: "\uAC10\uC9C0\uAE30(\uD654\uBA74 \uC704)\uB97C \uBCF4\uBA74\uC11C <b>?</b> \uAC00\uAD6C\uB85C \uAC00\uC11C <b>\uC0B4\uD3B4\uBCF4\uAE30</b>\uB97C \uB20C\uB7EC\uC694." },
    { ev: "hide", text: "<b>{hide}</b>\uC5D0 \uB4E4\uC5B4\uAC00 \uBCF4\uC138\uC694. \uC228\uC5B4 \uC788\uC73C\uBA74 \uADE0\uC774 \uB098\uB97C \uBABB \uCC3E\uC544\uC694." },
    { ev: "unhide", text: "\uB2E4\uC2DC <b>\uB098\uC624\uAE30</b>\uB97C \uB20C\uB7EC \uBC16\uC73C\uB85C \uB098\uC640\uC694." },
    { ev: "stun", text: "\uADE0\uC774 \uB098\uD0C0\uB0AC\uC5B4\uC694! <b>\u{1FAE7} \uBE44\uB217\uBC29\uC6B8</b>\uC744 \uB358\uC838\uC11C \uBA48\uCDB0 \uBCF4\uC138\uC694. \uB9DE\uC740 \uADE0\uC740 4\uCD08 \uB3D9\uC548 \uAF3C\uC9DD \uBABB \uD574\uC694." },
    { ev: "water", text: "<b>\u{1F4A7} \uBB3C \uD55C \uCEF5</b>\uC744 \uBC1B\uC558\uC5B4\uC694. <b>\uC544\uC774\uD15C</b> \uB2E8\uCD94\uB97C \uB20C\uB7EC \uB9C8\uC154 \uBCF4\uC138\uC694. 5\uCD08 \uB3D9\uC548 \uBE68\uB77C\uC838\uC694!" },
    { ev: "mask", text: "<b>\u{1F637} \uB9C8\uC2A4\uD06C</b>\uB97C \uBC1B\uC558\uC5B4\uC694. \uC368 \uBCF4\uC138\uC694. 6\uCD08 \uB3D9\uC548 \uADE0\uC774 \uB098\uB97C \uC54C\uC544\uCC44\uC9C0 \uBABB\uD574\uC694!" },
    { ev: "allFound", text: "\uB0A8\uC740 \uCABD\uC9C0 \uC870\uAC01\uC744 \uBAA8\uB450 \uCC3E\uC544\uC694. \uAC10\uC9C0\uAE30\uAC00 <b>\uAC00\uAE4C\uC6CC\uC694</b>\uB85C \uBC14\uB00C\uB294 \uACF3\uC744 \uCC3E\uC544\uBD10\uC694." },
    { ev: "noteSolved", text: "<b>\u{1F4DC} \uCABD\uC9C0</b>\uB97C \uC5F4\uC5B4 \uC870\uAC01\uC744 \uC21C\uC11C\uB300\uB85C \uBD99\uC774\uACE0 \uBB38\uC81C\uB97C \uD480\uC5B4\uC694." },
    { ev: "exit", text: "\uD0C8\uCD9C\uBB38\uC774 \uC5F4\uB838\uC5B4\uC694! <b>\uD654\uC0B4\uD45C</b>\uB97C \uB530\uB77C \uD0C8\uCD9C\uBB38\uC73C\uB85C \uB098\uAC00\uC694." }
  ];
  var Game = class {
    // opts: { stageId, band, diff, char, pool(문제 배열), run(저장된 상태 또는 null), ui }
    constructor(canvas, opts) {
      this.cv = canvas;
      this.cx = canvas.getContext("2d");
      this.o = opts;
      this.ui = opts.ui;
      this.map = buildStage(opts.stageId);
      this.tut = opts.stageId === 0;
      this.dark = !!opts.dark && !this.tut;
      this.input = { x: 0, y: 0 };
      this.keys = /* @__PURE__ */ new Set();
      this.fx = [];
      this.bubbles = [];
      this.paused = false;
      this.over = false;
      this.time = 0;
      this.saveT = 0;
      this.dirty = true;
      this.locks = {};
      this.run = opts.run && opts.run.stageId === opts.stageId && opts.run.mapVersion === MAP_VERSION ? opts.run : this.newRun();
      this.germs = this.run.germs.map((g) => this.makeGerm(g.type, g.x, g.y));
      this.invuln = opts.run ? 3 : 1.5;
      this.waterT = 0;
      this.maskT = 0;
      this.face = 1;
      this.walkT = 0;
      this.resize();
      this._loop = (t) => this.loop(t);
      this.last = performance.now();
      this.raf = requestAnimationFrame(this._loop);
    }
    newRun() {
      const m = this.map, nReal = this.tut ? 2 : 4;
      const searchIds = m.objects.filter((o) => o.kind === "search").map((o) => o.id);
      const pool = this.o.pool, noteQ = Math.floor(Math.random() * pool.length);
      const germs = [];
      if (!this.tut) {
        const list = [...this.stageGermList()];
        list.forEach((type, i) => {
          const s = m.germSpots[i % m.germSpots.length];
          germs.push({ type, x: s.x, y: s.y });
        });
      }
      return {
        mapVersion: MAP_VERSION,
        stageId: m.id,
        diff: this.o.diff,
        lives: DIFFS[this.o.diff].lives === Infinity ? -1 : DIFFS[this.o.diff].lives,
        px: m.start.x,
        py: m.start.y,
        soap: this.tut ? 0 : 3,
        soapGot: 0,
        soapTotal: m.pickups.filter((p) => p.kind === "soap").length,
        item: null,
        picked: [],
        searched: {},
        realIds: shuffled(searchIds).slice(0, nReal),
        noteQ,
        deck: shuffled(pool.map((_, i) => i).filter((i) => i !== noteQ)),
        deckPos: 0,
        disabled: [],
        noteSolved: false,
        exitOpen: false,
        wrong: 0,
        correct: 0,
        hidden: null,
        hideFrom: null,
        germs,
        tut: 0,
        tutSeen: [],
        scattered: 0
      };
    }
    stageGermList() {
      const list = this.map.S.germs.slice();
      if (DIFFS[this.o.diff].extraGerms) list.push("basic", "cavity");
      return list;
    }
    makeGerm(type, x, y) {
      return { type, def: GERMS[type], x, y, state: "wander", path: null, repath: 0, stun: 0, seen: 0, chaseT: 0, tired: 0, cool: 0, lx: x, ly: y, bob: Math.random() * 6, alertT: 0 };
    }
    get found() {
      return this.run.realIds.filter((id) => this.run.searched[id] === "found").length;
    }
    get need() {
      return this.run.realIds.length;
    }
    get lives() {
      return this.run.lives < 0 ? Infinity : this.run.lives;
    }
    get hideLabel() {
      return hideName(this.o.band);
    }
    destroy() {
      cancelAnimationFrame(this.raf);
      this.over = true;
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = this.cv.clientWidth || innerWidth, h = this.cv.clientHeight || innerHeight;
      this.cv.width = Math.round(w * dpr);
      this.cv.height = Math.round(h * dpr);
      this.dpr = dpr;
      this.vw = w;
      this.vh = h;
      this.TS = Math.round(Math.max(36, Math.min(h / 10.5, w / 15)));
    }
    serialize() {
      const r = this.run;
      r.germs = this.germs.map((g) => ({ type: g.type, x: +g.x.toFixed(2), y: +g.y.toFixed(2) }));
      r.px = +this.px.toFixed(2);
      r.py = +this.py.toFixed(2);
      return r;
    }
    get px() {
      return this.run.px;
    }
    set px(v) {
      this.run.px = v;
    }
    get py() {
      return this.run.py;
    }
    set py(v) {
      this.run.py = v;
    }
    // ---------- 루프 ----------
    loop(t) {
      if (this.over) return;
      const dt = Math.min(0.05, (t - this.last) / 1e3);
      this.last = t;
      if (!this.paused) this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(this._loop);
    }
    update(dt) {
      this.time += dt;
      this.invuln = Math.max(0, this.invuln - dt);
      this.waterT = Math.max(0, this.waterT - dt);
      this.maskT = Math.max(0, this.maskT - dt);
      for (const k in this.locks) if ((this.locks[k] -= dt) <= 0) delete this.locks[k];
      this.movePlayer(dt);
      this.pickups();
      for (const g of this.germs) this.updateGerm(g, dt);
      this.updateBubbles(dt);
      this.fx = this.fx.filter((f) => (f.t -= dt) > 0);
      this.checkCaught();
      if ((this.saveT += dt) > 2) {
        this.saveT = 0;
        this.dirty = true;
      }
    }
    movePlayer(dt) {
      if (this.run.hidden != null) return;
      let dx = this.input.x, dy = this.input.y;
      const K = this.keys;
      if (K.has("ArrowLeft") || K.has("KeyA")) dx -= 1;
      if (K.has("ArrowRight") || K.has("KeyD")) dx += 1;
      if (K.has("ArrowUp") || K.has("KeyW")) dy -= 1;
      if (K.has("ArrowDown") || K.has("KeyS")) dy += 1;
      const len = Math.hypot(dx, dy);
      if (len < 0.15) {
        this.walkT = 0;
        return;
      }
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      if (Math.abs(dx) > 0.2) this.face = dx > 0 ? 1 : -1;
      const sp = PLAYER_SPEED * (this.waterT > 0 ? 1.6 : 1) * dt;
      this.walkT += dt;
      this.slide(dx * sp, dy * sp);
    }
    slide(mx, my) {
      const r = 0.3, m = this.map;
      const blocked = (x, y) => m.solid(Math.floor(x - r), Math.floor(y - r)) || m.solid(Math.floor(x + r), Math.floor(y - r)) || m.solid(Math.floor(x - r), Math.floor(y + r)) || m.solid(Math.floor(x + r), Math.floor(y + r));
      if (!blocked(this.px + mx, this.py)) this.px += mx;
      if (!blocked(this.px, this.py + my)) this.py += my;
    }
    pickups() {
      const r = this.run;
      for (const p of this.map.pickups) {
        if (r.picked.includes(p.id)) continue;
        if (Math.hypot(p.x + 0.5 - this.px, p.y + 0.5 - this.py) > 0.65) continue;
        if (p.kind === "soap") {
          r.soap++;
          r.soapGot++;
          this.float("\u{1FAE7} +1", p.x + 0.5, p.y, "#2b7bd6");
        } else {
          if (r.item) {
            if (!p.warned) {
              p.warned = true;
              this.ui.toast("\uC544\uC774\uD15C\uC740 \uD558\uB098\uB9CC \uB4E4 \uC218 \uC788\uC5B4\uC694. \uBA3C\uC800 \uC4F0\uACE0 \uC624\uC138\uC694!");
            }
            continue;
          }
          r.item = p.kind;
          this.float(p.kind === "water" ? "\u{1F4A7} \uBB3C \uD55C \uCEF5!" : "\u{1F637} \uB9C8\uC2A4\uD06C!", p.x + 0.5, p.y, "#2b7bd6");
          this.ui.toast(p.kind === "water" ? "\u{1F4A7} \uBB3C \uD55C \uCEF5\uC744 \uC8FC\uC6E0\uC5B4\uC694! \uC544\uC774\uD15C \uB2E8\uCD94\uB85C \uB9C8\uC2DC\uBA74 5\uCD08 \uB3D9\uC548 \uBE68\uB77C\uC838\uC694." : "\u{1F637} \uB9C8\uC2A4\uD06C\uB97C \uC8FC\uC6E0\uC5B4\uC694! \uC4F0\uBA74 6\uCD08 \uB3D9\uC548 \uADE0\uC774 \uB098\uB97C \uC54C\uC544\uCC44\uC9C0 \uBABB\uD574\uC694.");
        }
        r.picked.push(p.id);
        Sound.pickup();
        this.dirty = true;
      }
    }
    // ---------- 균 ----------
    canSee(g) {
      if (this.run.hidden != null || this.maskT > 0 || this.invuln > 0 || g.cool > 0) return false;
      const d = Math.hypot(this.px - g.x, this.py - g.y);
      return d < g.def.sight && lineOfSight(this.map, g.x, g.y, this.px, this.py);
    }
    updateGerm(g, dt) {
      g.bob += dt * 4;
      g.alertT = Math.max(0, g.alertT - dt);
      if (g.stun > 0) {
        g.stun -= dt;
        return;
      }
      if (g.cool > 0) g.cool -= dt;
      if (g.tired > 0) {
        g.tired -= dt;
        return;
      }
      const spd = DIFFS[this.run.diff].speed * (this.tut ? 0.6 : 1);
      if (this.canSee(g)) {
        if (g.state !== "chase") {
          g.alertT = 1;
          Sound.spotted();
        }
        g.state = "chase";
        g.seen = 0;
        g.lx = this.px;
        g.ly = this.py;
      }
      if (g.state === "chase") {
        g.seen += dt;
        g.chaseT += dt;
        if (g.def.tires && g.chaseT > 4) {
          g.tired = 3;
          g.chaseT = 0;
          g.state = "wander";
          g.path = null;
          this.float("\uD5E5\uD5E5\u2026", g.x, g.y - 0.8, "#8a5cc7");
          return;
        }
        if (g.seen > 3) {
          g.state = "wander";
          g.path = null;
          g.chaseT = 0;
        }
        if ((g.repath -= dt) <= 0) {
          g.repath = 0.35;
          g.path = findPath(this.map, g.x, g.y, g.lx, g.ly);
        }
        if (Math.floor(g.x) === Math.floor(g.lx) && Math.floor(g.y) === Math.floor(g.ly)) this.stepTo(g, g.lx, g.ly, g.def.run * spd * dt);
        else this.follow(g, g.def.run * spd * dt);
      } else {
        if (!g.path || !g.path.length) {
          for (let t = 0; t < 10; t++) {
            const tx = Math.floor(g.x + rand(-7, 7)), ty = Math.floor(g.y + rand(-6, 6));
            if (!this.map.solid(tx, ty)) {
              g.path = findPath(this.map, g.x, g.y, tx, ty, 60);
              if (g.path) break;
            }
          }
        }
        this.follow(g, g.def.walk * spd * dt);
      }
    }
    follow(g, step) {
      if (!g.path || !g.path.length) return;
      const n = g.path[0];
      if (this.stepTo(g, n.x, n.y, step)) g.path.shift();
    }
    stepTo(g, tx, ty, step) {
      const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
      if (d <= step) {
        g.x = tx;
        g.y = ty;
        return true;
      }
      g.x += dx / d * step;
      g.y += dy / d * step;
      g.face = dx >= 0 ? 1 : -1;
      return false;
    }
    checkCaught() {
      if (this.invuln > 0 || this.run.hidden != null || this.paused) return;
      for (const g of this.germs) {
        if (g.stun > 0 || g.tired > 0 || g.cool > 0) continue;
        if (Math.hypot(g.x - this.px, g.y - this.py) < 0.6) {
          this.caught(g);
          return;
        }
      }
    }
    caught(g) {
      Sound.caught();
      g.cool = 4;
      g.state = "wander";
      g.path = null;
      for (const o of this.germs) if (o.state === "chase") {
        o.state = "wander";
        o.path = null;
      }
      if (this.tut) {
        this.respawn();
        this.ui.toast(`${g.def.name}\uC5D0\uAC8C \uC7A1\uD614\uC5B4\uC694! \uD29C\uD1A0\uB9AC\uC5BC\uC774\uB77C \uAD1C\uCC2E\uC544\uC694. \uCC98\uC74C \uC790\uB9AC\uC5D0\uC11C \uB2E4\uC2DC \uD574\uC694.`);
        return;
      }
      if (this.run.lives > 0) this.run.lives--;
      this.dirty = true;
      this.paused = true;
      this.ui.onCaught({ name: g.def.name, lives: this.lives, diff: this.run.diff });
    }
    respawn() {
      this.px = this.map.start.x;
      this.py = this.map.start.y;
      this.run.hidden = null;
      this.invuln = 2.5;
      this.paused = false;
      this.dirty = true;
    }
    // ---------- 비눗방울·아이템 ----------
    throwBubble() {
      const r = this.run;
      if (this.paused || r.hidden != null) return;
      if (r.soap <= 0) {
        this.ui.toast("\uBE44\uB217\uBC29\uC6B8\uC774 \uC5C6\uC5B4\uC694. \uBC14\uB2E5\uC758 \u{1F9FC} \uBE44\uB204\uB97C \uC8FC\uC6CC\uC694!");
        Sound.bad();
        return;
      }
      let best = null, bd = THROW_RANGE;
      for (const g of this.germs) {
        if (g.stun > 0) continue;
        const d = Math.hypot(g.x - this.px, g.y - this.py);
        if (d < bd && lineOfSight(this.map, this.px, this.py, g.x, g.y)) {
          bd = d;
          best = g;
        }
      }
      let vx = this.face, vy = 0;
      if (best) {
        const d = Math.hypot(best.x - this.px, best.y - this.py) || 1;
        vx = (best.x - this.px) / d;
        vy = (best.y - this.py) / d;
      } else if (Math.hypot(this.input.x, this.input.y) > 0.3) {
        const d = Math.hypot(this.input.x, this.input.y);
        vx = this.input.x / d;
        vy = this.input.y / d;
      }
      r.soap--;
      this.dirty = true;
      this.bubbles.push({ x: this.px, y: this.py - 0.2, vx: vx * 9, vy: vy * 9, dist: 0 });
      Sound.pop();
    }
    updateBubbles(dt) {
      for (const b of this.bubbles) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.dist += 9 * dt;
        if (this.map.at(Math.floor(b.x), Math.floor(b.y)) === 1 || b.dist > THROW_RANGE) {
          b.dead = true;
          this.float("\uD401", b.x, b.y, "#5aa9e6");
          continue;
        }
        for (const g of this.germs) {
          if (g.stun > 0) continue;
          if (Math.hypot(g.x - b.x, g.y - b.y) < 0.7) {
            g.stun = STUN_TIME;
            g.state = "wander";
            g.path = null;
            g.chaseT = 0;
            b.dead = true;
            this.float("\uBF40\uB4DD! \uBA48\uCDA4", g.x, g.y - 0.9, "#2b7bd6");
            Sound.good();
            this.event("stun");
            break;
          }
        }
      }
      this.bubbles = this.bubbles.filter((b) => !b.dead);
    }
    useItem() {
      const r = this.run;
      if (this.paused || !r.item) {
        if (!r.item) this.ui.toast("\uAC00\uC9C4 \uC544\uC774\uD15C\uC774 \uC5C6\uC5B4\uC694.");
        return;
      }
      const used = r.item;
      r.item = null;
      if (used === "water") {
        this.waterT = WATER_TIME;
        this.float("\u{1F4A7} \uBE68\uB77C\uC84C\uC5B4\uC694!", this.px, this.py - 1, "#2b7bd6");
      } else {
        this.maskT = MASK_TIME;
        this.float("\u{1F637} \uADE0\uC774 \uBABB \uC54C\uC544\uBD10\uC694!", this.px, this.py - 1, "#2b7bd6");
        for (const g of this.germs) if (g.state === "chase") {
          g.state = "wander";
          g.path = null;
        }
      }
      Sound.good();
      this.dirty = true;
      this.event(used);
    }
    // ---------- 상호작용 ----------
    nearby() {
      const r = this.run, m = this.map;
      if (r.hidden != null) return { type: "unhide", label: "\uB098\uC624\uAE30" };
      const e = m.exit;
      if (r.exitOpen && Math.hypot(e.ix + 0.5 - this.px, e.iy + 0.5 - this.py) < 1.4) return { type: "exit", label: "\uD0C8\uCD9C!" };
      let best = null, bd = 1.45;
      for (const o of m.objects) {
        if (o.kind === "decor") continue;
        if (o.kind === "search" && r.searched[o.id]) continue;
        const d = Math.hypot(o.x + 0.5 - this.px, o.y + 0.5 - this.py);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      if (!best) return null;
      if (best.kind === "hide") return { type: "hide", obj: best, label: `${this.hideLabel}\uC5D0 \uC228\uAE30` };
      return { type: "search", obj: best, label: this.locks[best.id] ? `\u{1F512} ${Math.ceil(this.locks[best.id])}\uCD08` : "\uC0B4\uD3B4\uBCF4\uAE30" };
    }
    interact() {
      if (this.paused) return;
      const n = this.nearby();
      if (!n) return;
      const r = this.run;
      if (n.type === "unhide") {
        const o = this.map.objects[r.hidden];
        r.hidden = null;
        if (r.hideFrom) {
          this.px = r.hideFrom.x;
          this.py = r.hideFrom.y;
        } else {
          this.px = o.x + 0.5;
          this.py = o.y + 1.5;
        }
        this.invuln = Math.max(this.invuln, 0.8);
        this.dirty = true;
        this.event("unhide");
        return;
      }
      if (n.type === "hide") {
        r.hideFrom = { x: this.px, y: this.py };
        r.hidden = n.obj.id;
        for (const g of this.germs) if (g.state === "chase") g.seen = Math.max(g.seen, 2);
        this.float("\uC27F!", n.obj.x + 0.5, n.obj.y - 0.2, "#3a9a4a");
        this.dirty = true;
        this.event("hide");
        return;
      }
      if (n.type === "exit") {
        this.clear();
        return;
      }
      if (n.type === "search") {
        if (this.locks[n.obj.id]) {
          this.ui.bigMsg(`\u{1F512} \uC544\uC9C1 ${Math.ceil(this.locks[n.obj.id])}\uCD08 \uB3D9\uC548 \uB4A4\uC9C8 \uC218 \uC5C6\uC5B4\uC694!`, "bad");
          Sound.bad();
          return;
        }
        this.askSearch(n.obj);
      }
    }
    nextQuestion() {
      const r = this.run, pool = this.o.pool;
      if (r.deckPos >= r.deck.length) {
        r.deck = shuffled(pool.map((_, i) => i).filter((i) => i !== r.noteQ));
        r.deckPos = 0;
      }
      return pool[r.deck[r.deckPos++]];
    }
    askSearch(obj) {
      const q = this.nextQuestion();
      this.paused = true;
      this.ui.openQuiz({ title: `${obj.emoji} ${obj.name} \uC0B4\uD3B4\uBCF4\uAE30`, q, disabled: [] }, (ok) => {
        this.paused = false;
        this.invuln = Math.max(this.invuln, 1);
        const r = this.run;
        if (!ok) {
          r.wrong++;
          this.locks[obj.id] = SEARCH_LOCK;
          this.dirty = true;
          this.ui.bigMsg(`\u274C \uD2C0\uB838\uC5B4\uC694! ${SEARCH_LOCK}\uCD08 \uB3D9\uC548 \uC774 \uAC00\uAD6C\uB97C \uB4A4\uC9C8 \uC218 \uC5C6\uC5B4\uC694!`, "bad");
          Sound.bad();
          this.event("search");
          return;
        }
        r.correct++;
        if (r.realIds.includes(obj.id)) {
          r.searched[obj.id] = "found";
          Sound.open();
          const n = this.found;
          this.ui.bigMsg(`\u{1F4DC} \uCABD\uC9C0 \uC870\uAC01\uC744 \uCC3E\uC558\uC5B4\uC694! (${n}/${this.need})`, "good");
          this.ui.say(n >= this.need ? FOUND_LINES[3] : FOUND_LINES[Math.min(n - 1, 2)]);
          if (n >= this.need) this.event("allFound");
        } else {
          r.searched[obj.id] = "miss";
          const roll = Math.random();
          if (roll < 0.5) {
            r.soap += 2;
            this.ui.bigMsg("\uAF5D! \uB300\uC2E0 \u{1FAE7} \uBE44\uB217\uBC29\uC6B8 2\uAC1C\uB97C \uC5BB\uC5C8\uC5B4\uC694", "info");
          } else if (roll < 0.75 && !r.item && !this.tut) {
            r.item = Math.random() < 0.5 ? "water" : "mask";
            this.ui.bigMsg(r.item === "water" ? "\uAF5D! \uB300\uC2E0 \u{1F4A7} \uBB3C \uD55C \uCEF5\uC744 \uC5BB\uC5C8\uC5B4\uC694" : "\uAF5D! \uB300\uC2E0 \u{1F637} \uB9C8\uC2A4\uD06C\uB97C \uC5BB\uC5C8\uC5B4\uC694", "info");
          } else {
            r.soap += 1;
            this.ui.bigMsg("\uAF5D! \uC870\uAC01\uC774 \uC5C6\uC5B4\uC694 (\u{1FAE7} +1)", "info");
            this.ui.say(MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)]);
          }
          Sound.pickup();
        }
        this.dirty = true;
        this.event("search");
      });
    }
    // 쪽지 문제를 풀었을 때(ui에서 부름)
    noteAnswer(choice, ok) {
      const r = this.run;
      if (ok) {
        r.noteSolved = true;
        r.exitOpen = true;
        this.dirty = true;
        Sound.open();
        this.ui.bigMsg("\u{1F6AA} \uD0C8\uCD9C\uBB38\uC774 \uC5F4\uB838\uC5B4\uC694! \uD654\uC0B4\uD45C\uB97C \uB530\uB77C\uAC00\uC694!", "good");
        this.event("noteSolved");
        return "open";
      }
      r.wrong++;
      if (r.diff === "hell") {
        const ids = this.map.objects.filter((o) => o.kind === "search").map((o) => o.id);
        r.searched = {};
        r.realIds = shuffled(ids).slice(0, this.need);
        r.scattered++;
        r.disabled.push(choice);
        this.dirty = true;
        Sound.bad();
        this.ui.bigMsg("\u{1F525} \uD2C0\uB838\uC5B4\uC694! \uCABD\uC9C0 \uC870\uAC01\uC774 \uB2E4\uC2DC \uD769\uC5B4\uC84C\uC5B4\uC694!", "bad");
        return "scatter";
      }
      r.disabled.push(choice);
      this.dirty = true;
      Sound.bad();
      return "retry";
    }
    clear() {
      const r = this.run;
      this.paused = true;
      this.over = true;
      this.event("exit");
      const stars = 1 + (r.wrong <= 2 ? 1 : 0) + (r.soapTotal && r.soapGot / r.soapTotal >= 0.6 ? 1 : 0);
      Sound.open();
      this.ui.onClear({ stageId: r.stageId, stars, diff: r.diff, wrong: r.wrong, correct: r.correct, soapGot: r.soapGot, soapTotal: r.soapTotal });
    }
    // 감지기: 가장 가까운 (못 찾은) 진짜 조각까지 거리
    detector() {
      const r = this.run;
      if (r.exitOpen) return { level: 5, text: "\uD0C8\uCD9C\uBB38\uC774 \uC5F4\uB838\uC5B4\uC694!", room: null };
      if (this.found >= this.need) return { level: 5, text: "\uCABD\uC9C0\uB97C \uC5F4\uC5B4 \uBCF4\uC138\uC694!", room: null };
      let best = null, bd = 1e9;
      for (const id of r.realIds) {
        if (r.searched[id] === "found") continue;
        const o = this.map.objects[id], d = Math.hypot(o.x + 0.5 - this.px, o.y + 0.5 - this.py);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      if (!best) return null;
      const room = this.map.roomAt(best.x + 0.5, best.y + 0.5).name;
      if (bd > 13) return { level: 1, text: "\uC870\uAC01\uACFC \uBA40\uC5B4\uC694", room };
      if (bd > 8) return { level: 2, text: "\uC870\uAE08 \uAC00\uAE4C\uC6CC\uC694", room };
      if (bd > 4.5) return { level: 3, text: "\uAC00\uAE4C\uC6CC\uC694!", room };
      if (bd > 2) return { level: 4, text: "\uC544\uC8FC \uAC00\uAE4C\uC6CC\uC694!", room };
      return { level: 5, text: "\uBC14\uB85C \uC5EC\uAE30\uC608\uC694!", room };
    }
    currentRoom() {
      var _a;
      return ((_a = this.map.roomAt(this.px, this.py)) == null ? void 0 : _a.name) || "";
    }
    exitAngle() {
      const e = this.map.exit;
      return { a: Math.atan2(e.y + 0.5 - this.py, e.x + 0.5 - this.px), d: Math.hypot(e.x + 0.5 - this.px, e.y + 0.5 - this.py) };
    }
    // ---------- 연습 층 ----------
    event(ev) {
      if (!this.tut) return;
      const r = this.run;
      if (!r.tutSeen.includes(ev)) r.tutSeen.push(ev);
      let changed = false;
      while (r.tut < TUTORIAL.length && r.tutSeen.includes(TUTORIAL[r.tut].ev)) {
        r.tut++;
        changed = true;
        this.enterTutStep();
      }
      if (changed) {
        this.dirty = true;
        this.ui.tutorial(r.tut);
      }
    }
    enterTutStep() {
      const r = this.run, step = TUTORIAL[r.tut];
      if (!step) return;
      if (step.ev === "stun") {
        if (r.soap < 3) r.soap = 3;
        if (!this.germs.length) {
          const rm = this.map.rooms[1] || this.map.rooms[0];
          this.germs.push(this.makeGerm("basic", rm.cx + 0.5, rm.cy + 0.5));
        }
      }
      if (step.ev === "water") r.item = "water";
      if (step.ev === "mask") r.item = "mask";
    }
    float(text, x, y, color = "#333") {
      this.fx.push({ text, x, y, t: 1.2, max: 1.2, color });
    }
    // ---------- 그리기 ----------
    draw() {
      const c = this.cx, TS2 = this.TS, m = this.map, T = m.T, r = this.run;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.fillStyle = this.voidColor();
      c.fillRect(0, 0, this.vw, this.vh);
      const camX = this.px * TS2 - this.vw / 2, camY = this.py * TS2 - this.vh / 2;
      c.save();
      c.translate(-Math.round(camX), -Math.round(camY));
      const x0 = Math.max(0, Math.floor(camX / TS2)), y0 = Math.max(0, Math.floor(camY / TS2));
      const x1 = Math.min(m.W - 1, Math.ceil((camX + this.vw) / TS2)), y1 = Math.min(m.H - 1, Math.ceil((camY + this.vh) / TS2));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.drawSceneTile(c, x, y, m.at(x, y), TS2);
      this.drawArchitecture(c, TS2);
      this.drawExit(c, TS2);
      for (const p of m.pickups) {
        if (r.picked.includes(p.id)) continue;
        const bob = Math.sin(this.time * 3 + p.id) * TS2 * 0.06;
        const e = p.kind === "soap" ? "\u{1F9FC}" : p.kind === "water" ? "\u{1F4A7}" : "\u{1F637}";
        const im = emojiCanvas(e, TS2 * 0.5);
        c.fillStyle = "rgba(0,0,0,0.08)";
        c.beginPath();
        c.ellipse((p.x + 0.5) * TS2, (p.y + 0.8) * TS2, TS2 * 0.22, TS2 * 0.08, 0, 0, 7);
        c.fill();
        c.drawImage(im, (p.x + 0.5) * TS2 - im.width / 2, (p.y + 0.5) * TS2 - im.height / 2 + bob);
      }
      const list = [];
      for (const f of m.fixtures) list.push({ y: f.h > 2 ? f.y + 1 : f.y + f.h - 0.05, d: () => this.drawFixture(c, f, TS2) });
      for (const o of m.objects) list.push({ y: o.y + 0.9, d: () => this.drawObject(c, o, TS2) });
      for (const g of this.germs) list.push({ y: g.y, d: () => this.drawGerm(c, g, TS2) });
      if (r.hidden == null) list.push({ y: this.py, d: () => this.drawPlayer(c, TS2) });
      list.sort((a, b) => a.y - b.y).forEach((it) => it.d());
      for (const b of this.bubbles) {
        c.fillStyle = "rgba(160,215,255,0.55)";
        c.strokeStyle = "#5aa9e6";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(b.x * TS2, b.y * TS2, TS2 * 0.22, 0, 7);
        c.fill();
        c.stroke();
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(b.x * TS2 - TS2 * 0.07, b.y * TS2 - TS2 * 0.07, TS2 * 0.05, 0, 7);
        c.fill();
      }
      if (this.dark) this.drawDark(c, TS2, camX, camY);
      c.textAlign = "center";
      c.textBaseline = "middle";
      for (const f of this.fx) {
        const k = f.t / f.max;
        c.globalAlpha = Math.min(1, k * 2);
        this.label(c, f.text, f.x * TS2, (f.y - (1 - k) * 0.6) * TS2, Math.round(TS2 * 0.36), f.color);
      }
      c.globalAlpha = 1;
      c.restore();
    }
    label(c, text, x, y, size, color = "#333", stroke = "#fff") {
      c.font = `${size}px "Ssurround","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineJoin = "round";
      c.lineWidth = Math.max(3, size * 0.28);
      c.strokeStyle = stroke;
      c.strokeText(text, x, y);
      c.fillStyle = color;
      c.fillText(text, x, y);
    }
    drawExit(c, TS2) {
      const e = this.map.exit, open = this.run.exitOpen, x = e.x * TS2, y = e.y * TS2;
      c.fillStyle = open ? "#4cc36a" : "#9aa0a6";
      c.fillRect(x + 3, y + 3, TS2 - 6, TS2 - 6);
      if (open) {
        c.strokeStyle = `rgba(76,195,106,${0.5 + 0.4 * Math.sin(this.time * 5)})`;
        c.lineWidth = 6;
        c.strokeRect(x - 2, y - 2, TS2 + 4, TS2 + 4);
      }
      const im = emojiCanvas(open ? "\u{1F6AA}" : "\u{1F512}", TS2 * 0.6);
      c.drawImage(im, x + TS2 / 2 - im.width / 2, y + TS2 / 2 - im.height / 2);
      const lx = e.ix * TS2 + TS2 / 2, ly = e.iy * TS2 + (e.dir === "s" ? -TS2 * 0.2 : e.dir === "n" ? TS2 * 1.1 : -TS2 * 0.3);
      this.label(c, open ? "\uD0C8\uCD9C\uBB38 \uC5F4\uB9BC!" : "\uD0C8\uCD9C\uBB38", lx, ly, Math.round(TS2 * 0.3), open ? "#1f8a3a" : "#666");
    }
    drawObject(c, o, TS2) {
      const r = this.run, cx = (o.x + 0.5) * TS2, cy = (o.y + 0.5) * TS2;
      if (o.kind === "decor") {
        const im = emojiCanvas(o.emoji, TS2 * 0.75);
        c.drawImage(im, cx - im.width / 2, cy - im.height / 2);
        return;
      }
      if (o.kind === "hide") {
        const hiding = r.hidden === o.id;
        c.fillStyle = hiding ? "rgba(76,195,106,0.35)" : "rgba(76,195,106,0.18)";
        c.strokeStyle = "#2e9a4a";
        c.lineWidth = 3;
        c.beginPath();
        c.roundRect(o.x * TS2 + 2, o.y * TS2 + 2, TS2 - 4, TS2 - 4, TS2 * 0.2);
        c.fill();
        c.stroke();
        const im = emojiCanvas(o.emoji, TS2 * 0.85);
        c.drawImage(im, cx - im.width / 2, cy - im.height / 2);
        this.label(c, hiding ? "\uC228\uB294 \uC911\u2026" : this.hideLabel, cx, o.y * TS2 - TS2 * 0.28, Math.round(TS2 * 0.34), "#fff", "#1f7a36");
        if (hiding) {
          const p = IMG[this.o.char];
          if (p) {
            c.globalAlpha = 0.45;
            const h = TS2 * 0.9, w = h * p.width / p.height;
            c.drawImage(p, cx - w / 2, cy - h / 2, w, h);
            c.globalAlpha = 1;
          }
        }
        return;
      }
      const st = r.searched[o.id], lock = this.locks[o.id];
      this.drawFixture(c, { x: o.x, y: o.y, w: 1, h: 1, type: o.art || "cabinet" }, TS2);
      c.strokeStyle = st === "found" ? "#4cc36a" : lock ? "#e0524a" : "#d9b869";
      c.lineWidth = 2;
      c.strokeRect(o.x * TS2 + 2, o.y * TS2 + 2, TS2 - 4, TS2 - 4);
      c.fillStyle = st ? "#a7b6aa" : "#f9ecc8";
      c.fillRect(cx - TS2 * 0.16, cy - TS2 * 0.1, TS2 * 0.32, TS2 * 0.23);
      c.strokeStyle = "#9c8052";
      c.beginPath();
      c.moveTo(cx - TS2 * 0.16, cy - TS2 * 0.1);
      c.lineTo(cx, cy + TS2 * 0.02);
      c.lineTo(cx + TS2 * 0.16, cy - TS2 * 0.1);
      c.stroke();
      if (lock) this.label(c, `\u{1F512}${Math.ceil(lock)}`, cx, o.y * TS2 - TS2 * 0.25, Math.round(TS2 * 0.34), "#e0524a");
      else if (!st) {
        const b = Math.sin(this.time * 4 + o.id) * TS2 * 0.06;
        c.fillStyle = "#ffb627";
        c.beginPath();
        c.arc(cx, o.y * TS2 - TS2 * 0.22 + b, TS2 * 0.2, 0, 7);
        c.fill();
        this.label(c, "?", cx, o.y * TS2 - TS2 * 0.22 + b, Math.round(TS2 * 0.3), "#fff", "#c97a00");
      } else if (st === "found") this.label(c, "\u2713", cx, o.y * TS2 - TS2 * 0.2, Math.round(TS2 * 0.34), "#2e9a4a");
    }
    // 외부 이미지 없이 그리는 테마별 공간과 가구.
    drawSceneTile(c, x, y, v, TS2) {
      const m = this.map, T = m.T, rm = m.roomAt(x, y), style = m.room[y * m.W + x] < 0 ? m.S.theme === "garden" ? "stone" : m.S.theme === "market" ? "stone" : "wood" : (rm == null ? void 0 : rm.floorStyle) || "tile";
      const px = x * TS2, py = y * TS2, garden = m.S.theme === "garden", market = m.S.theme === "market";
      if (v === 1) {
        let boundary = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (m.at(x + dx, y + dy) !== 1) boundary = true;
        if (!boundary) {
          c.fillStyle = garden ? "#43644b" : market ? "#514b47" : "#25313a";
          c.fillRect(px, py, TS2, TS2);
          if (garden && (x * 7 + y * 3) % 11 === 0) {
            c.fillStyle = "#628357";
            c.fillRect(px + TS2 * 0.25, py + TS2 * 0.2, TS2 * 0.2, TS2 * 0.12);
            c.fillRect(px + TS2 * 0.38, py + TS2 * 0.35, TS2 * 0.2, TS2 * 0.12);
          }
          return;
        }
        c.fillStyle = garden ? "#536b40" : market ? "#80574c" : "#3c4f60";
        c.fillRect(px, py, TS2, TS2);
        c.fillStyle = garden ? "#96b875" : T.wallTop;
        c.fillRect(px + 1, py + 1, TS2 - 2, TS2 * 0.58);
        c.strokeStyle = garden ? "#607f47" : "rgba(45,62,75,.20)";
        c.lineWidth = 1;
        c.strokeRect(px + 1, py + 1, TS2 - 2, TS2 * 0.58);
        if (m.at(x, y + 1) !== 1) {
          c.fillStyle = garden ? "#7c5b39" : T.wall;
          c.fillRect(px + 1, py + TS2 * 0.58, TS2 - 2, TS2 * 0.35);
          c.fillStyle = "rgba(0,0,0,.15)";
          c.fillRect(px, py + TS2 * 0.93, TS2, TS2 * 0.07);
        }
        if (garden) {
          c.fillStyle = "#e0c99b";
          c.fillRect(px + TS2 * 0.16, py + TS2 * 0.18, TS2 * 0.14, TS2 * 0.72);
          c.fillRect(px + TS2 * 0.67, py + TS2 * 0.18, TS2 * 0.14, TS2 * 0.72);
        } else {
          c.fillStyle = "rgba(255,255,255,.26)";
          c.fillRect(px + 2, py + 2, TS2 - 4, 2);
        }
        return;
      }
      const palettes = { wood: ["#c7a57b", "#d1b18b"], tile: ["#e0ddd1", "#ebe7da"], wet: ["#b7d5d9", "#c3e0e1"], cold: ["#d0e4e9", "#e0eef1"], soil: ["#82684a", "#8c7050"], stone: ["#b8b7a4", "#c5c1ad"] };
      const pal = palettes[style] || T.floor;
      c.fillStyle = pal[x + y & 1];
      c.fillRect(px, py, TS2, TS2);
      c.strokeStyle = style === "soil" ? "#63543d" : "rgba(61,76,82,.14)";
      c.lineWidth = 1;
      if (style === "wood") {
        c.beginPath();
        c.moveTo(px, py + TS2 * 0.5);
        c.lineTo(px + TS2, py + TS2 * 0.5);
        c.moveTo(px + TS2 * (y & 1 ? 0.25 : 0.75), py);
        c.lineTo(px + TS2 * (y & 1 ? 0.25 : 0.75), py + TS2 * 0.5);
        c.stroke();
        c.fillStyle = "rgba(94,62,28,.10)";
        c.fillRect(px + TS2 * 0.16, py + TS2 * 0.18, TS2 * 0.46, 1);
      } else if (style === "soil") {
        c.fillStyle = "#aa8b63";
        for (let i = 0; i < 3; i++) c.fillRect(px + TS2 * 0.12, py + TS2 * (0.18 + i * 0.28), TS2 * 0.76, TS2 * 0.06);
      } else {
        c.strokeRect(px + 1, py + 1, TS2 - 2, TS2 - 2);
        if (style === "cold" && (x + y) % 5 === 0) {
          c.fillStyle = "rgba(255,255,255,.6)";
          c.fillRect(px + TS2 * 0.22, py + TS2 * 0.28, TS2 * 0.2, 2);
        }
        if (style === "wet" && (x * 3 + y) % 7 === 0) {
          c.fillStyle = "#728e96";
          c.fillRect(px + TS2 * 0.35, py + TS2 * 0.35, TS2 * 0.3, TS2 * 0.3);
          c.fillStyle = "#b7d5d9";
          for (let j = 0; j < 3; j++) c.fillRect(px + TS2 * 0.38, py + TS2 * (0.4 + j * 0.08), TS2 * 0.24, 1);
        }
      }
      if (rm && m.room[y * m.W + x] >= 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.at(x + dx, y + dy) === 1)) {
        c.fillStyle = "rgba(51,61,57,.10)";
        c.fillRect(px, py, TS2, TS2);
      }
    }
    drawArchitecture(c, TS2) {
      var _a, _b, _c, _d;
      const m = this.map;
      for (const rm of m.rooms) {
        const x2 = (((_a = rm.signX) != null ? _a : rm.x0) + 0.15) * TS2, y2 = (((_b = rm.signY) != null ? _b : rm.y0) + 0.08) * TS2, w = Math.min(rm.name.length * 0.28 + 1.2, rm.x1 - rm.x0) * TS2;
        c.fillStyle = "#334653";
        c.fillRect(x2, y2, w, TS2 * 0.55);
        c.fillStyle = "#d8b76c";
        c.fillRect(x2, y2, TS2 * 0.09, TS2 * 0.55);
        this.label(c, `${String(rm.id + 1).padStart(2, "0")}  ${rm.name}`, x2 + w / 2, y2 + TS2 * 0.27, Math.round(TS2 * 0.23), "#fff", "#334653");
        const bx = (((_c = rm.signX) != null ? _c : rm.x0) + 0.2) * TS2, by = (((_d = rm.signY) != null ? _d : rm.y0) + 0.85) * TS2;
        c.fillStyle = "#765f47";
        c.fillRect(bx, by, TS2 * 0.56, TS2 * 0.67);
        c.fillStyle = "#f3e5ba";
        c.fillRect(bx + TS2 * 0.06, by + TS2 * 0.06, TS2 * 0.44, TS2 * 0.55);
        c.fillStyle = "#a47a43";
        for (let i = 0; i < 3; i++) c.fillRect(bx + TS2 * 0.12, by + TS2 * (0.2 + i * 0.1), TS2 * 0.29, TS2 * 0.025);
      }
      for (const d of m.doors) {
        const x2 = d.x * TS2, y2 = d.y * TS2, garden = m.S.theme === "garden";
        c.fillStyle = garden ? "#8a6a43" : "#9b8259";
        c.fillRect(x2, y2, TS2, TS2);
        c.fillStyle = garden ? "#c9a873" : "#ddc69a";
        c.fillRect(x2 + TS2 * 0.1, y2 + TS2 * 0.1, TS2 * 0.8, TS2 * 0.8);
        c.fillStyle = garden ? "#5e4428" : "#344c58";
        if (d.dx) c.fillRect(d.dx > 0 ? x2 + TS2 * 0.86 : x2, y2, TS2 * 0.14, TS2);
        else c.fillRect(x2, d.dy > 0 ? y2 + TS2 * 0.86 : y2, TS2, TS2 * 0.14);
      }
      const e = m.exit, x = e.ix * TS2, y = e.iy * TS2;
      c.fillStyle = "rgba(222,178,61,.26)";
      c.fillRect(x, y, TS2, TS2);
      c.strokeStyle = "#a58b42";
      c.lineWidth = 2;
      c.strokeRect(x + 3, y + 3, TS2 - 6, TS2 - 6);
    }
    voidColor() {
      const t = this.map.S.theme;
      return t === "garden" ? "#43644b" : t === "market" ? "#514b47" : "#25313a";
    }
    // 불 꺼진 층: 주인공 둘레만 밝고 나머지는 어둡다. 쫓아오는 균의 '!'와 열린 탈출문은 어둠 위에 다시 그린다
    drawDark(c, TS2, camX, camY) {
      const x = this.px * TS2, y = (this.py - 0.35) * TS2, f = Math.sin(this.time * 2.2) * 0.08;
      const grd = c.createRadialGradient(x, y, TS2 * (1.9 + f), x, y, TS2 * (3.7 + f));
      grd.addColorStop(0, "rgba(6,8,22,0)");
      grd.addColorStop(0.55, "rgba(6,8,22,0.75)");
      grd.addColorStop(1, "rgba(6,8,22,0.96)");
      c.fillStyle = grd;
      c.fillRect(Math.round(camX) - 2, Math.round(camY) - 2, this.vw + 4, this.vh + 4);
      for (const g of this.germs) if (g.state === "chase" && g.stun <= 0 && g.tired <= 0) this.label(c, "!", g.x * TS2, (g.y - g.def.size * 0.85) * TS2, Math.round(TS2 * 0.5), "#ff6b5e", "#2a0d0d");
      if (this.run.exitOpen) this.drawExit(c, TS2);
    }
    drawFixture(c, f, TS2) {
      const x = f.x * TS2, y = f.y * TS2, w = (f.w || 1) * TS2, h = (f.h || 1) * TS2, type = f.type || "cabinet", theme = this.map.S.theme;
      c.save();
      c.fillStyle = "rgba(22,31,36,.18)";
      c.fillRect(x + TS2 * 0.1, y + TS2 * 0.16, w - TS2 * 0.04, h - TS2 * 0.06);
      const metal = ["fridge", "sink", "stove", "counter", "tank"].includes(type);
      const base = metal ? "#637f8b" : type === "bed" ? "#65503a" : "#745a43";
      c.fillStyle = base;
      c.fillRect(x + 2, y + 2, w - 4, h - 4);
      c.fillStyle = metal ? "#c2d4d8" : type === "bed" ? "#947552" : "#ba9569";
      c.fillRect(x + 4, y + 4, w - 8, h - TS2 * 0.22 - 4);
      c.strokeStyle = metal ? "#425d68" : "#654a35";
      c.lineWidth = Math.max(1, TS2 * 0.035);
      c.strokeRect(x + 2, y + 2, w - 4, h - 4);
      if (type === "fridge" || type === "cabinet" || type === "shed") {
        c.beginPath();
        c.moveTo(x + w * 0.5, y + 4);
        c.lineTo(x + w * 0.5, y + h - 4);
        c.stroke();
        c.fillStyle = type === "fridge" ? "#557887" : "#e3c991";
        c.fillRect(x + w * 0.42, y + h * 0.42, TS2 * 0.06, TS2 * 0.25);
        c.fillRect(x + w * 0.55, y + h * 0.42, TS2 * 0.06, TS2 * 0.25);
        if (type === "fridge") {
          c.fillStyle = "#36545e";
          c.fillRect(x + w * 0.63, y + h * 0.15, w * 0.23, h * 0.16);
          c.fillStyle = "#78d3c7";
          c.fillRect(x + w * 0.67, y + h * 0.19, w * 0.12, h * 0.06);
        }
      } else if (type === "table" || type === "desk" || type === "bench") {
        c.strokeRect(x + TS2 * 0.13, y + TS2 * 0.13, w - TS2 * 0.26, h - TS2 * 0.35);
        if (type === "table") {
          for (let i = 0; i < 2; i++) {
            c.fillStyle = "#f6eee0";
            c.beginPath();
            c.arc(x + w * (0.3 + i * 0.4), y + h * 0.43, TS2 * 0.2, 0, 7);
            c.fill();
            c.stroke();
          }
        } else if (type === "desk") {
          c.fillStyle = "#f3e6c6";
          c.fillRect(x + w * 0.25, y + h * 0.2, w * 0.35, h * 0.42);
          c.fillStyle = "#8d6e4b";
          c.fillRect(x + w * 0.3, y + h * 0.3, w * 0.2, 2);
        }
      } else if (type === "sink") {
        c.fillStyle = "#536e79";
        c.fillRect(x + w * 0.19, y + h * 0.2, w * 0.62, h * 0.47);
        c.fillStyle = "#a9dbe5";
        c.fillRect(x + w * 0.25, y + h * 0.27, w * 0.5, h * 0.3);
        c.fillStyle = "#e6eff2";
        c.fillRect(x + w * 0.47, y + h * 0.08, w * 0.06, h * 0.27);
      } else if (type === "stove") {
        for (let i = 0; i < 2; i++) {
          c.fillStyle = "#354b55";
          c.beginPath();
          c.arc(x + w * (0.3 + i * 0.4), y + h * 0.42, TS2 * 0.22, 0, 7);
          c.fill();
          c.strokeStyle = "#95a5ad";
          c.beginPath();
          c.arc(x + w * (0.3 + i * 0.4), y + h * 0.42, TS2 * 0.12, 0, 7);
          c.stroke();
        }
      } else if (type === "shelf" || type === "crate" || type === "stall") {
        for (let i = 1; i < 3; i++) {
          c.fillStyle = "#795736";
          c.fillRect(x + 3, y + h * i / 3, w - 6, TS2 * 0.045);
        }
        const colors = theme === "dairy" ? ["#f0eee1", "#d6b459", "#d0d8d1"] : theme === "market" ? ["#ce704c", "#8aa362", "#e1b261"] : ["#89a866", "#d3914b", "#b96157"];
        for (let i = 0; i < 6; i++) {
          c.fillStyle = colors[i % 3];
          c.fillRect(x + w * (0.12 + i % 3 * 0.27), y + h * (0.17 + Math.floor(i / 3) * 0.34), w * 0.17, h * 0.2);
        }
        if (type === "stall") {
          c.fillStyle = "#bd6752";
          c.fillRect(x + 2, y + 2, w - 4, h * 0.22);
          for (let i = 0; i < 5; i++) {
            c.fillStyle = i % 2 ? "#bd6752" : "#f0d7ae";
            c.fillRect(x + 2 + i * (w - 4) / 5, y + 2, (w - 4) / 5, h * 0.22);
          }
        }
      } else if (type === "bed") {
        for (let i = 0; i < 6; i++) {
          const X = x + w * (0.17 + i % 3 * 0.32), Y = y + h * (0.3 + Math.floor(i / 3) * 0.4);
          c.fillStyle = "#476942";
          c.fillRect(X - TS2 * 0.1, Y - TS2 * 0.04, TS2 * 0.2, TS2 * 0.26);
          c.fillStyle = theme === "garden" && f.roomId === 3 ? "#cf6150" : "#79a05d";
          c.beginPath();
          c.ellipse(X, Y, TS2 * 0.18, TS2 * 0.1, -0.5, 0, 7);
          c.fill();
        }
      } else if (type === "tank") {
        c.fillStyle = "#94b7bf";
        c.beginPath();
        c.ellipse(x + w / 2, y + h * 0.42, w * 0.35, h * 0.28, 0, 0, 7);
        c.fill();
        c.stroke();
      } else if (type === "cooler") {
        c.fillStyle = "#9fc3cf";
        c.fillRect(x + TS2 * 0.3, y + TS2 * 0.3, w - TS2 * 0.6, h - TS2 * 0.6);
        c.fillStyle = "#6f95a3";
        for (let i = 1; i < h / TS2 - 1; i++) c.fillRect(x + TS2 * 0.6, y + i * TS2 + TS2 * 0.2, w - TS2 * 1.2, TS2 * 0.08);
        c.fillStyle = "#2f4752";
        c.fillRect(x + w / 2 - TS2 * 1.3, y + TS2 * 0.45, TS2 * 2.6, TS2 * 0.7);
        this.label(c, "\u2744 \uB0C9\uC7A5 \uC124\uBE44", x + w / 2, y + TS2 * 0.8, Math.round(TS2 * 0.3), "#bff3ff", "#2f4752");
      } else if (type === "board") {
        c.fillStyle = "#f0e2bd";
        c.fillRect(x + w * 0.12, y + h * 0.15, w * 0.76, h * 0.58);
        c.fillStyle = "#93744b";
        for (let i = 0; i < 3; i++) c.fillRect(x + w * 0.22, y + h * (0.27 + i * 0.12), w * 0.48, 1);
      }
      c.restore();
    }
    drawPlayer(c, TS2) {
      const im = IMG[this.o.char];
      const blink = this.invuln > 0 && Math.floor(this.time * 10) % 2 === 0;
      const x = this.px * TS2, y = this.py * TS2;
      c.fillStyle = "rgba(0,0,0,0.15)";
      c.beginPath();
      c.ellipse(x, y + TS2 * 0.3, TS2 * 0.32, TS2 * 0.1, 0, 0, 7);
      c.fill();
      if (this.maskT > 0) {
        c.fillStyle = "rgba(120,180,255,0.25)";
        c.beginPath();
        c.arc(x, y - TS2 * 0.3, TS2 * 0.7, 0, 7);
        c.fill();
      }
      if (blink) c.globalAlpha = 0.4;
      if (im) {
        const h = TS2 * 1.35, w = h * im.width / im.height, hop = this.walkT > 0 ? Math.abs(Math.sin(this.walkT * 12)) * TS2 * 0.08 : 0;
        c.save();
        c.translate(x, y + TS2 * 0.35 - hop);
        c.scale(this.face, 1);
        c.drawImage(im, -w / 2, -h, w, h);
        c.restore();
      } else {
        c.fillStyle = "#ff8a3d";
        c.beginPath();
        c.arc(x, y, TS2 * 0.35, 0, 7);
        c.fill();
      }
      c.globalAlpha = 1;
      if (this.waterT > 0) this.label(c, "\u{1F4A7}", x + TS2 * 0.45, y - TS2 * 1, Math.round(TS2 * 0.32));
      if (this.maskT > 0) this.label(c, "\u{1F637}", x - TS2 * 0.45, y - TS2 * 1, Math.round(TS2 * 0.32));
    }
    drawGerm(c, g, TS2) {
      const im = IMG[g.def.img], x = g.x * TS2, y = g.y * TS2, sz = TS2 * 1 * g.def.size;
      const squash = g.stun > 0 ? 1 : 1 + Math.sin(g.bob) * 0.05;
      c.fillStyle = g.state === "chase" ? "rgba(230,70,70,0.22)" : "rgba(0,0,0,0.12)";
      c.beginPath();
      c.ellipse(x, y + sz * 0.38, sz * 0.38, sz * 0.12, 0, 0, 7);
      c.fill();
      if (im) {
        c.save();
        c.translate(x, y + sz * 0.4);
        c.scale((g.face || 1) * (2 - squash), squash);
        if (g.cool > 0) c.globalAlpha = 0.55;
        c.drawImage(im, -sz / 2, -sz, sz, sz);
        c.restore();
        c.globalAlpha = 1;
      }
      if (g.stun > 0) {
        c.fillStyle = "rgba(160,215,255,0.35)";
        c.strokeStyle = "#5aa9e6";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(x, y - sz * 0.1, sz * 0.62, 0, 7);
        c.fill();
        c.stroke();
        this.label(c, `\u{1FAE7} ${Math.ceil(g.stun)}`, x, y - sz * 0.85, Math.round(TS2 * 0.3), "#2b7bd6");
      } else if (g.tired > 0) this.label(c, "\uD5E5\uD5E5 \u{1F4A4}", x, y - sz * 0.85, Math.round(TS2 * 0.28), "#8a5cc7");
      else if (g.state === "chase") this.label(c, "!", x, y - sz * 0.85 - (g.alertT > 0 ? TS2 * 0.15 : 0), Math.round(TS2 * 0.5), "#e0524a");
    }
  };

  // maptest/js/preview.js
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    };
  }
  var TS = 20;
  var lastOf = Object.fromEntries(Object.entries(COURSES).map(([k, c]) => [c.stages[c.stages.length - 1], c.name]));
  var inCourse = (id) => Object.values(COURSES).filter((c) => c.stages.includes(+id)).map((c) => c.name);
  function render(id, box2) {
    const m = buildStage(id);
    const g = Object.create(Game.prototype);
    Object.assign(g, { map: m, run: { searched: {}, exitOpen: false, hidden: null }, locks: {}, time: 0, o: { band: "mid" }, germs: [] });
    const cv = document.createElement("canvas");
    cv.width = m.W * TS;
    cv.height = m.H * TS;
    const c = cv.getContext("2d");
    c.fillStyle = g.voidColor();
    c.fillRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) g.drawSceneTile(c, x, y, m.at(x, y), TS);
    g.drawArchitecture(c, TS);
    g.drawExit(c, TS);
    const list = [];
    for (const f of m.fixtures) list.push({ y: f.h > 2 ? f.y + 1 : f.y + f.h - 0.05, d: () => g.drawFixture(c, f, TS) });
    for (const o of m.objects) list.push({ y: o.y + 0.9, d: () => g.drawObject(c, o, TS) });
    list.sort((a, b) => a.y - b.y).forEach((it) => it.d());
    g.label(c, "\u2605 \uCD9C\uBC1C", m.start.x * TS, m.start.y * TS, 13, "#fff", "#d0532a");
    for (const s of m.germSpots.slice(0, m.S.germs.length + 2)) {
      c.fillStyle = "rgba(200,40,60,.75)";
      c.beginPath();
      c.arc(s.x * TS, s.y * TS, 4, 0, 7);
      c.fill();
    }
    const sec = document.createElement("section");
    const tags = inCourse(id).map((n) => `<span class="tag">${n}</span>`).join("") + (lastOf[id] ? `<span class="tag dark">\u{1F311} ${lastOf[id]} \uB9C8\uC9C0\uB9C9 \uCE35: \uBD88 \uAEBC\uC9D0</span>` : "");
    sec.innerHTML = `<h2>${STAGES[id].name}</h2><p class="meta">${tags} <span>\uAC00\uB85C ${m.W} \xB7 \uC138\uB85C ${m.H}\uCE78 \xB7 \uBC29 ${m.rooms.length}\uAC1C \xB7 ?\uAC00\uAD6C ${m.objects.filter((o) => o.kind === "search").length}\uAC1C \xB7 \uC228\uB294 \uACF3 ${m.objects.filter((o) => o.kind === "hide").length}\uAC1C \xB7 \uACE0\uC815 \uAC00\uAD6C ${m.fixtures.length}\uAC1C</span></p>
    <p class="rooms">${m.rooms.map((r) => `<b>${String(r.id + 1).padStart(2, "0")}</b> ${r.name}`).join(" \xB7 ")}</p>`;
    const wrap = document.createElement("div");
    wrap.className = "cv";
    wrap.appendChild(cv);
    sec.appendChild(wrap);
    box2.appendChild(sec);
  }
  var box = document.getElementById("maps");
  Promise.resolve(document.fonts && document.fonts.load('20px "Ssurround"')).catch(() => {
  }).finally(() => {
    const one = new URLSearchParams(location.search).get("id");
    for (const id of Object.keys(STAGES)) if (one == null || one === id) render(+id, box);
  });
})();
