/** Starter template for File → New (editable mini board, untitled). */
export const STARTER_BOARD_BRD = `p01 : 100
p02 : 100
p03 : 5
p04 : 40
p07 : V4.4
p08 : Untitled
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [100,0,99,0,101,0] false false)
)
p33 : (
(cp [0,0,1,0,0,1] false false)
)
p34 : (
(cp [0,1,1,1,0,1] false false)
)
p35 : (
(p36 30.0
(cp [0,0,1,0,0,1] false false)
(cp [15,20,14,20,16,20] false false)
)
(p36 70.0
(cp [0,0,1,0,0,1] false false)
(cp [18,22,17,22,19,22] false false)
)
)
`;

/** Minimal valid board with almost no shape — for “start from nothing” workflows. */
export const BLANK_BOARD_BRD = `p01 : 100
p02 : 100
p03 : 5
p04 : 40
p07 : V4.4
p08 : Untitled
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [150,0,149,0,151,0] false false)
)
p33 : (
(cp [0,0,1,0,0,1] false false)
(cp [150,2,149,2,151,2] false false)
)
p34 : (
(cp [0,0,1,0,0,1] false false)
(cp [150,0,149,0,151,0] false false)
)
p35 : (
(p36 45.0
(cp [0,0,1,0,0,1] false false)
(cp [12,18,11,18,13,18] false false)
)
(p36 105.0
(cp [0,0,1,0,0,1] false false)
(cp [12,18,11,18,13,18] false false)
)
)
`;

/** Minimal valid .brd for tests (matches Java reader structure). */
export const MINI_BOARD_BRD = `p01 : 100
p02 : 100
p03 : 5
p04 : 40
p07 : V4.4
p08 : MiniTest
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [100,0,99,0,101,0] false false)
)
p33 : (
(cp [0,0,1,0,0,1] false false)
)
p34 : (
(cp [0,1,1,1,0,1] false false)
)
p35 : (
)
`;

/** Same as mini board plus two cross-sections at stations 30 and 70 (tests + loft). */
export const BOARD_WITH_SECTIONS_BRD = `p01 : 100
p02 : 100
p03 : 5
p04 : 40
p07 : V4.4
p08 : MiniSections
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [100,0,99,0,101,0] false false)
)
p33 : (
(cp [0,0,1,0,0,1] false false)
)
p34 : (
(cp [0,1,1,1,0,1] false false)
)
p35 : (
(p36 30.0
(cp [0,0,1,0,0,1] false false)
(cp [15,20,14,20,16,20] false false)
)
(p36 70.0
(cp [0,0,1,0,0,1] false false)
(cp [18,22,17,22,19,22] false false)
)
)
`;

/** Three interior cross-sections (regression: interpolation must pick adjacent distinct indices). */
export const BOARD_WITH_THREE_SECTIONS_BRD = `p01 : 100
p02 : 100
p03 : 5
p04 : 40
p07 : V4.4
p08 : ThreeSec
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [100,0,99,0,101,0] false false)
)
p33 : (
(cp [0,0,1,0,0,1] false false)
)
p34 : (
(cp [0,1,1,1,0,1] false false)
)
p35 : (
(p36 20.0
(cp [0,0,1,0,0,1] false false)
(cp [14,18,13,18,15,18] false false)
)
(p36 50.0
(cp [0,0,1,0,0,1] false false)
(cp [16,20,15,20,17,20] false false)
)
(p36 80.0
(cp [0,0,1,0,0,1] false false)
(cp [15,19,14,19,16,19] false false)
)
)
`;

/** Template variants used by New Board wizard (fallback built-ins). */
export const SHORTBOARD_TEMPLATE_BRD = `p01 : 92
p02 : 92
p03 : 5.5
p04 : 38
p07 : V4.4
p08 : Shortboard
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [92,0,91,0,93,0] false false)
)
p33 : (
(cp [0,2,1,2,0,2] false false)
(cp [92,18,91,18,93,18] false false)
)
p34 : (
(cp [0,0,1,0,0,0] false false)
(cp [92,28,91,28,93,28] false false)
)
p35 : (
(p36 28.0
(cp [0,0,1,0,0,1] false false)
(cp [14,18,13,18,15,18] false false)
)
(p36 64.0
(cp [0,0,1,0,0,1] false false)
(cp [16,20,15,20,17,20] false false)
)
)
`;

export const FISH_TEMPLATE_BRD = `p01 : 88
p02 : 88
p03 : 6.2
p04 : 44
p07 : V4.4
p08 : Fish
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [88,0,87,0,89,0] false false)
)
p33 : (
(cp [0,1.5,1,1.5,0,1.5] false false)
(cp [88,14,87,14,89,14] false false)
)
p34 : (
(cp [0,0,1,0,0,0] false false)
(cp [88,22,87,22,89,22] false false)
)
p35 : (
(p36 26.0
(cp [0,0,1,0,0,1] false false)
(cp [17,19,16,19,18,19] false false)
)
(p36 60.0
(cp [0,0,1,0,0,1] false false)
(cp [20,22,19,22,21,22] false false)
)
)
`;

export const LONGBOARD_TEMPLATE_BRD = `p01 : 118
p02 : 118
p03 : 6.5
p04 : 52
p07 : V4.4
p08 : Longboard
p11 : 0
p12 : 0
p13 : 0
p14 : 0
p15 : 0
p16 : 0
p17 : 0
p18 : 0
p99 : 0
p19 : 0
p20 : 0
p21 : 0
p22 : 0
p23 : 0
p24 : 0
p25 : 0
p42 : 0
p26 : 0
p44 : 0
p46 : 0
p47 : 0
p38 : 0
p53 : 0
p41 : true
p50 : [0,0,0,0,0,0,0,0,0]
p48 : 
p49 : 
p51 : 
p27 : [0,0,0]
p28 : [0,0,0]
p29 : [0,0,0]
p30 : [0,0,0]
p31 : [0,0,0]
p32 : (
(cp [0,0,1,0,0,1] false false)
(cp [118,0,117,0,119,0] false false)
)
p33 : (
(cp [0,1,1,1,0,1] false false)
(cp [118,10,117,10,119,10] false false)
)
p34 : (
(cp [0,0,1,0,0,0] false false)
(cp [118,16,117,16,119,16] false false)
)
p35 : (
(p36 36.0
(cp [0,0,1,0,0,1] false false)
(cp [18,23,17,23,19,23] false false)
)
(p36 82.0
(cp [0,0,1,0,0,1] false false)
(cp [24,26,23,26,25,26] false false)
)
)
`;
