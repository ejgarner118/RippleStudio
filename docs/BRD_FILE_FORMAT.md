# `.brd` file format reference

This document describes the **`.brd`** surfboard design file format used by the legacy Java application (sources under `boardcad-java/` in this monorepo) and implemented in **`@boardcad/core`**. After reading it you should be able to parse, generate, transform, or validate `.brd` files and understand how geometry and metadata map to a surfboard (or similar) model.

---

## 1. What a `.brd` file is

A `.brd` file is a **textual, line-oriented** serialization of a **`BezierBoard`**: a parametric board model made of **cubic Bézier splines** plus optional **cross-sections** (transverse slices), machine/CAM settings, and free-form metadata.

Typical uses:

- **2D editing**: outline (planform), deck and bottom (longitudinal profile), rail cross-sections at stations along length.
- **3D reconstruction**: lofting/surfacing by interpolating cross-sections and sweeping deck/bottom along length (see Java `BezierBoard.update3DModel` and this repo’s `buildJavaSurfaceMesh`).
- **CAM / machine output**: feeds, margins, cutter geometry, strut positions, etc.

All numeric geometry is stored as **decimal numbers** in text. Interpretation in **millimetres vs inches** is controlled by a **units** field (`p38`); the file does not auto-scale numbers when units change—values are stored in the chosen unit system.

---

## 2. Physical vs on-disk form

### 2.1 Plaintext (most common)

- **Encoding**: UTF-8 (this port decodes the whole file as UTF-8).
- **Line endings**: `\n` or `\r\n` (both accepted when splitting lines).
- **Structure**: Each logical record is usually one line starting with **`p`** plus a **two-digit decimal id** and **` : `** (space, colon, space).

Example:

```text
p08 : MyBoardName
p32 : (
(cp [0,0,1,0,0,1] false false)
)
```

### 2.2 Encrypted variant

Some files begin with a magic header instead of `p01` or `p08`:

| Header line (first line) | Body encryption | Password (hard-coded in legacy Java app)   |
|----------------------------|-----------------|-------------------------------------|
| `%BRD-1.01\r\n`            | PBEWithMD5AndDES, DES-CBC | `deltaXTail`                |
| `%BRD-1.02\r\n`            | Same             | `deltaXTaildeltaXMiddle`             |

Details (matching OpenJDK / Java `BrdReader`):

- **Skip** the first **12 bytes** of the file (header + CRLF padding to 12).
- Remaining bytes are **ciphertext**.
- **PBE** derives an **8-byte DES key** and **8-byte IV** from the password and a fixed **8-byte salt**:
  - Salt bytes (hex): `c7 73 21 8c 7e c8 ee 99`
- **Iteration count**: **20**.
- Digest chain: MD5(password ‖ salt), then MD5(previous) for iterations 2…20; first 8 bytes = key, next 8 = IV.
- Decrypted payload is **UTF-8 text** in the same format as plaintext `.brd`.

This repo implements decrypt/encrypt in `packages/boardcad-core/src/brd/brdDecrypt.ts` (`loadBrdFromBytes` detects the header in `brdReader.ts`).

**Security note**: Passwords are fixed strings in the application, not user secrets. The format is **obfuscation**, not strong encryption.

---

## 3. Line grammar: property lines `pNN`

### 3.1 Parsing rule (critical)

Compatible parsers use the same rule as Java `BrdReader`:

- Ignore lines shorter than 3 characters, lines without `:`, or lines that do not start with **`p`**.
- **Property id**: `Integer.parseInt(line.substring(1, 3).trim())` → ids **`01`–`99`** as two decimal digits.
- **Value**: `line.substring(6).trim()` — this assumes the pattern **`p` + two digits + ` : `** (6 characters before the value).

So the canonical form is:

```text
p08 : value here
```

Single-digit ids are written with a leading zero: `p01`, not `p1`.

### 3.2 Types

| In file        | Example              | Notes                                      |
|----------------|----------------------|--------------------------------------------|
| Number         | `p11 : 3`            | Integer or double where specified below    |
| Boolean        | `p41 : true`         | `true` / `false`                           |
| String         | `p08 : Name`         | Empty string allowed on some fields        |
| Double array   | `p27 : [1,2,3]`      | Square brackets, comma-separated numbers    |
| Block start    | `p32 : (`            | Following lines until matching `)` are body |
| Multi-section  | `p35 : (` then `(p36` | Cross-sections; see §7                    |

Newlines inside strings are escaped as **`\n`** (two characters) in the file; readers replace `\\n` with a real newline (e.g. comments `p49`).

---

## 4. Property index (all known `p` ids)

The **semantic names** below match Java `BrdReader` comments where available. **`@boardcad/core`** maps these to `BezierBoard` fields in `brdReader.ts`.

| Id  | Field / meaning | Type | Notes |
|-----|-----------------|------|--------|
| **01** | Length (cached) | double | Java **does not apply** on read (derived from geometry). This port **stores** in `storedScalars.p1` for round-trip. |
| **02** | Length over curve | double | Same as p01 in practice in writer estimates; Java ignores on read. Stored as `p2`. |
| **03** | Thickness (cached) | double | Java ignores on read. Stored as `p3`. |
| **04** | Width (cached) | double | Java ignores on read. Stored as `p4`. |
| **05** | Nose rocker (cached) | double | Java ignores on read. Stored as `p5`. |
| **06** | Tail rocker (cached) | double | Java ignores on read. Stored as `p6`. |
| **07** | File / format version | string | e.g. `V4.4` → `version` |
| **08** | Board name | string | `name` |
| **09** | Author | string | `author` |
| **10** | Blank file | string | `blankFile` |
| **11** | Top cuts | int | `topCuts` |
| **12** | Bottom cuts | int | `bottomCuts` |
| **13** | Rail cuts | int | `railCuts` |
| **14** | Cutter diameter | double | `cutterDiam` |
| **15** | Blank pivot | double | `blankPivot` |
| **16** | Board pivot | double | `boardPivot` |
| **17** | Max angle | double | `maxAngle` |
| **18** | Nose margin | double | `noseMargin` |
| **19** | Nose length | double | `noseLength` |
| **20** | Tail length | double | `tailLength` |
| **21** | Delta X nose | double | `deltaXNose` |
| **22** | Delta X tail | double | `deltaXTail` (also used as PBE password fragment—see §2.2) |
| **23** | Delta X middle | double | `deltaXMiddle` |
| **24** | To-tail speed | int | `toTailSpeed` |
| **25** | Stringer speed | int | `stringerSpeed` |
| **26** | Regular speed | int | `regularSpeed` |
| **27** | Strut 1 | `[x,y,z]` (3 doubles) | `strut1` |
| **28** | Strut 2 | `[x,y,z]` | `strut2` |
| **29** | Cutter start position | `[x,y,z]` | `cutterStartPos` |
| **30** | Blank tail position | `[x,y,z]` | `blankTailPos` |
| **31** | Board start position | `[x,y,z]` | `boardStartPos` |
| **32** | **Outline** spline | block | Half-outline in **plan view**; see §6 |
| **33** | **Bottom** spline | block | **Rocker profile** (bottom); see §6 |
| **34** | **Deck** spline | block | **Rocker profile** (deck); see §6 |
| **35** | **Cross-sections** | block | Zero or more `(p36 …)` sections; see §7 |
| **36** | *(inline only)* | — | Not a top-level `p36 :` line; appears as `(p36 <station>` inside `p35` |
| **38** | Current units | int | `0` = mm, `1` = cm, `2` = inch (classic `.brd` convention) |
| **39** | Nose rocker one foot | double | `noseRockerOneFoot` |
| **40** | Tail rocker one foot | double | `tailRockerOneFoot` |
| **41** | Show original board | bool | `showOriginalBoard` |
| **42** | Stringer speed bottom | int | `stringerSpeedBottom` |
| **43** | Machine output folder | string | `machineFolder` (often Windows path) |
| **44** | Top shoulder angle | double | `topShoulderAngle` |
| **45** | Designer | string | `designer` |
| **46** | Top shoulder cuts | int | `topShoulderCuts` |
| **47** | Bottom rail cuts | int | `bottomRailCuts` |
| **48** | Surfer | string | `surfer` |
| **49** | Comments | string | Escaped newlines `\\n` → newline |
| **50** | Fins | **9** doubles `[…]` | `fins[]` |
| **51** | Fin type | string | `finType` |
| **52** | Description | string | `description` |
| **53** | Security level | int | `securityLevel` |
| **54** | Model | string | `model` |
| **55** | Aux1 / akubird board ID | string | `aux1` |
| **56** | Aux2 / akubird model ID | string | `aux2` |
| **57** | Aux3 / akubird last update | string | `aux3` |
| **99** | Tail margin | double | `tailMargin` |

### 4.1 Writer coverage in `@boardcad/core`

`saveBrdToString` emits a **subset** that matches Java `BrdWriter` ordering: it **does not** currently emit **`p09`, `p10`, `p05`, `p06`, `p39`, `p40`, `p52`** even if those fields were loaded from an existing file. If you need a **lossless** round-trip for those keys, merge loaded values back into the serialized text or extend the writer.

---

## 5. Control points: cubic Bézier knots `(cp …)`

Each control point is one line:

```text
(cp [x0,y0,x1,y1,x2,y2] <continuous> <other>)
```

- **`[x0,y0]`** — **anchor** (on-curve point). In the Java reader this is the knot’s **end point**.
- **`[x1,y1]`** — **handle toward previous** segment (`tangentToPrev`).
- **`[x2,y2]`** — **handle toward next** segment (`tangentToNext`).

Together, consecutive knots define **Cubic Bézier** spans (see `BezierSpline` / `BezierKnot` in the model).

### 5.1 Flags

| Flag | Type | Meaning |
|------|------|---------|
| 3rd token | `true`/`false` | **Continuous** (Java spelling `Continous`) — C¹-style continuity hint at the knot; after load, the runtime runs `checkAndFixContinousy` to reconcile with actual tangent angles. |
| 4th token | `true`/`false` | **Other** — application-specific flag preserved in the knot. |

### 5.2 Guide points `(gp …)` inside a spline block

Optional, after all `(cp …)` lines for that spline:

```text
gps : (
(gp [x,y])
(gp [x,y])
)
```

Guide points are **2D** aids used by the UI; they are **not** the same as Bézier control handles.

### 5.3 Spline block structure (`p32` / `p33` / `p34` / cross-section body)

```text
p32 : (
(cp [...] false false)
(cp [...] false false)
gps : (
(gp [1,2])
)
)
```

- Opening: `pNN : (` on one line.
- Zero or more `(cp …)` lines.
- Optionally `gps : (` … `)` as above.
- Closing: **`)`** on its own line.

---

## 6. Coordinate semantics (how to use the numbers)

Understanding **which axis means what** is essential for exporters, viewers, and CNC post-processors.

### 6.1 Outline (`p32`)

- Laid out in the **board plan** (looking down at the deck).
- **`x`**: distance along the board from the **tail** toward the **nose** (length axis; tail at lower `x`, nose at higher `x` in typical files).
- **`y`**: **half-width** of the outline on one side of the stringer (the other rail is mirrored in 3D). Full width at a given `x` is often computed as **`2 × outlineY(x)`** when sampling the outline as a function of `x` (see `getWidthAtPosJava`).

### 6.2 Deck (`p34`) and bottom (`p33`)

- **Side view** / **longitudinal profile** along the same **`x`** (length) axis as the outline.
- **`y`**: vertical position of deck or bottom **in profile** (rocker). **Thickness** along the stringer at `x` is **`deckY(x) − bottomY(x)`** (see `getThicknessAtPosJava`).

### 6.3 Cross-sections (`p35` / `p36`)

- Each section has a **`position`**: an **`x`**-coordinate along the board length where this rail cross-section applies.
- The section’s own spline is in **section-local 2D** (typically **half-section** shape: `x` lateral from stringer, `y` vertical thickness profile of the rail), used when interpolating the 3D skin between sections.

### 6.4 3D convention (Java / this port’s mesh)

When building a 3D mesh (`buildJavaSurfaceMesh`), Java-style coordinates are:

- **X**: length (along board)
- **Y**: lateral (half-width direction; mesh mirrors for the other rail)
- **Z**: vertical (thickness / rocker)

Exporters to other tools (Blender Y-up, etc.) apply a fixed axis remap.

---

## 7. Cross-sections: `p35` and `(p36 …)`

Block opens with `p35 : (`. Each cross-section:

```text
(p36 450.0
(cp [...] false false)
...
)
```

- **`450.0`** is the **station** along length (`BezierBoardCrossSection.position`).
- The inner content is the same as a spline block **without** a `p32` header: control points, optional `gps` wrapper, then closing **`)`** for that section.
- After the last section, a final **`)`** closes the `p35` block.

The **first and last** “ drawable” sections are often special in the UI; for meshing you need **at least two** meaningful sections for many loft algorithms (this app uses `firstDrawableCrossSectionIndex` heuristics).

---

## 8. After load: continuity and locks (for implementers)

The legacy runtime does not rely on the file alone for all editing constraints.

1. **`checkAndFixContinousy(false, true)`** — adjusts the **continuous** flag on knots from tangent geometry (see `BezierBoard` in the model).
2. **`setLocks()`** — sets tangent locks, masks, and **slave** relationships (e.g. deck/bottom linked at ends).

If you build a **minimal** `.brd` by hand, opening it in this app or the Java tool will still mutate these derived fields in memory on load. For **byte-identical** round-trips, preserve the original text; for **semantic** equivalence, accept these normalizations.

---

## 9. Minimal valid plaintext example

```text
p01 : 100
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
```

(This matches the `MINI_BOARD_BRD` fixture in `packages/boardcad-core/src/defaultBoards.ts`.)

---

## 10. Programmatic usage (`@boardcad/core`)

Typical flow:

```ts
import { BezierBoard, loadBrdFromBytes, saveBrdToString } from "@boardcad/core";

const board = new BezierBoard();
const status = loadBrdFromBytes(board, uint8FromFile, "design.brd");
if (status !== 0) throw new Error(/* use getBrdReadError() */);

const text = saveBrdToString(board);
```

- **`loadBrdFromText(board, text, filename)`** — plaintext only.
- **`loadBrdFromBytes(board, data, filename)`** — detects `%BRD-1.0x` and decrypts.
- **`readControlPointFromLine(line)`** — parse a single `(cp …)` line.
- **Geometry**: `sampleBezierSpline2D`, `buildJavaSurfaceMesh`, `buildLoftMesh3D`, etc.

---

## 11. Practical recipes

| Goal | Approach |
|------|----------|
| **Read board name / metadata** | Parse `p08`, `p45`, `p54`, or load into `BezierBoard`. |
| **Outline polygon for CNC 2D** | Sample `board.outline` at many `t` or by arc length; mirror `y` for full width. |
| **Rocker curve** | Sample `board.deck` and `board.bottom` vs `x`; thickness = difference. |
| **Convert units** | Scale all knot coordinates and numeric fields by the appropriate factor and set `p38`; verify machine parameters (`p14`–`p31`) separately. |
| **Merge two files** | No single standard: typically copy `p32`–`p35` blocks and reconcile `p01`–`p04` caches manually. |
| **Validate** | Require at least 2 outline knots; deck/bottom at least 1 knot each for profile; check `substring(1,3)` ids are digits. |
| **Encrypt like legacy app** | `wrapEncryptedBrdFile(plaintext, "1.02")` in `brdDecrypt.ts`. |

---

## 12. Quirks and compatibility

- **Two-digit ids only**: `p101` would be mis-parsed (`substring(1,3)` → `10`).
- **Value column starts at index 6**: lines must use **`pNN : `** exactly for Java-compatible parsing.
- **Java debug print**: `BrdReader` prints each line to stdout when loading—ignore for format spec.
- **Unknown `p` ids**: safely ignored by switch default (forward compatibility).
- **Author / description**: may exist in legacy files but disappear on re-save if your writer omits them (see §4.1).

---

## 13. References in this repository

| Area | Path |
|------|------|
| Read plaintext / bytes | `packages/boardcad-core/src/brd/brdReader.ts` |
| Write | `packages/boardcad-core/src/brd/brdWriter.ts` |
| Encryption | `packages/boardcad-core/src/brd/brdDecrypt.ts` |
| Model | `packages/boardcad-core/src/model/bezierBoard.ts`, `bezierKnot.ts`, `bezierBoardCrossSection.ts` |
| Tests / fixtures | `packages/boardcad-core/src/brd/brd.test.ts`, `defaultBoards.ts` |
| Java reference | `boardcad-java/board/readers/BrdReader.java`, `board/writers/BrdWriter.java` |

---

*This document reflects the behavior implemented in this repo and the Java sources under `boardcad-java/` as of the time of writing. If you extend the format, add new `p` ids to §4 and keep readers tolerant of unknown fields.*
