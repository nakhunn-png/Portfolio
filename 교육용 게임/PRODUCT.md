# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Korean first-grade students (age 7) in a regular classroom, each on their own Galaxy Tab in landscape, opened from one QR code. Reading ability varies widely; some cannot read fluently yet. The teacher runs the session and is not watching each screen. The class shares tablets with other classes.

## Product Purpose
A math practice game for the first-grade, second-semester units 덧셈과 뺄셈(1)(2)(3). It replaces worksheet drill with situations where the student can see why the calculation matters: someone asks for an exact number of things, and the student fulfills the order. Success means every student, including the slowest, reaches the ending inside the class time, and every student can say what they were doing and why the number mattered.

## Positioning
Every problem is an order to fulfill, not a quiz. A character asks for an exact amount ("사과 13개 주세요"), the student builds or computes that amount, hands it over, and the character reacts to what they actually received. A wrong answer shows its consequence ("하나 모자라요") instead of a red X. The calculation strategy of each unit (making 10, going through 10, tens and ones) is the physical way the order gets packed.

## Operating Context
- Played across two consecutive 40-minute periods with a 10-minute break; total play must fit in 80 minutes, basic completion about 60 minutes.
- One URL, one QR code, plain HTML hosted on GitHub Pages; works offline once loaded.
- Students log in by class (반) and number (번호); progress saves per student on the tablet.
- The teacher has a hidden menu (title tapped 5 times, code 1010) for sound, voice, resets, unlocking, and a problem-range test.
- Spoken instructions via the browser's Korean speech voice when available.

## Capabilities and Constraints
- Three stages in textbook order: 덧셈과 뺄셈(1) 2단원 (세 수, 10 만들기, 10에서 빼기, 10을 만들어 더하기), 덧셈과 뺄셈(2) 4단원 (받아올림 있는 (몇)+(몇), 받아내림 있는 (십몇)−(몇), 덧셈표 규칙), 덧셈과 뺄셈(3) 6단원 (받아올림·받아내림 없는 두 자리 수). Each stage ends with the unit's '수학이랑 만들어요' activity (주사위로 10 만들기, 덧셈과 뺄셈 길, 명령어).
- Four self-chosen difficulty levels per station (objects → pictures → expressions → challenge) plus hidden content; reward is relative to the student's own previous best.
- No penalties, lives, timers, rankings, or teacher dashboard. At most two tries per problem, then the solution is shown and play moves on.
- Student-facing Korean is polite, one sentence, about 20 characters; avoid the words 받아올림/받아내림.
- Galaxy Tab landscape, touch first; tap-to-place as well as drag.
- Illustrations (characters, backgrounds, items) will be produced by the user with GPT image generation and dropped into `assets/` by file name; the game must look complete with code-drawn placeholders until then. Countable objects (ten-frames, eggs, boxes, number lines, hundred board) are always drawn in code.

## Brand Commitments
- Name: 열매 마을 축제 (may change only if the user agrees).
- The user rejected the first version as childish (emoji characters, pastel cartoon look), unclear about why the math is done, and unclear about what to do. Those are anti-references.

## Evidence on Hand
- Curriculum lesson lists for units 2, 4, 6 from the user's textbook portal (차시 titles only; some lesson content inferred from titles).
- No real student data, teacher quotes, or illustrations exist yet.

## Product Principles
1. The reason for every calculation is on screen before the calculation: who asked, for how many, and what happens when they receive it.
2. One obvious action per screen; a first grader who cannot read must still know what to touch.
3. Mistakes have visible, kind consequences, never scores.
4. The slowest student finishes; faster students find more, not a different game.
5. The unit's strategy is the mechanism, not a hint: the way you pack the order is the way you compute.

## Accessibility & Inclusion
Pre-readers and weak readers: all instructions must be understandable from picture, motion, and voice alone. Large touch targets for small hands. Sound and voice can be turned off by the teacher.
