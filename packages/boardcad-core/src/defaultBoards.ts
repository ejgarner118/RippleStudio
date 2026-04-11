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
