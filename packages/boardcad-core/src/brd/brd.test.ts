import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import {
  loadBrdFromText,
  loadBrdFromBytes,
  readControlPointFromLine,
} from "./brdReader.js";
import { sampleBezierSpline2D } from "../geometry/bezierSample.js";
import { saveBrdToString } from "./brdWriter.js";
import { BOARD_WITH_SECTIONS_BRD, MINI_BOARD_BRD } from "../defaultBoards.js";
import { decryptBrdPayload, encryptBrdPayload, wrapEncryptedBrdFile } from "./brdDecrypt.js";

describe("BrdReader / BrdWriter", () => {
  it("golden: sampled outline point count for mini board (regression)", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, MINI_BOARD_BRD, "m.brd");
    const xy = sampleBezierSpline2D(brd.outline, 28);
    expect(xy.length).toBe(58);
    expect(xy[0]).toBeCloseTo(0);
    expect(xy[1]).toBeCloseTo(0);
  });

  it("loads mini board outline and cross-section structure", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, MINI_BOARD_BRD, "mini.brd")).toBe(0);
    expect(brd.outline.getNrOfControlPoints()).toBe(2);
    expect(brd.bottom.getNrOfControlPoints()).toBe(1);
    expect(brd.deck.getNrOfControlPoints()).toBe(1);
    expect(brd.crossSections.length).toBe(0);
    expect(brd.name).toBe("MiniTest");
    expect(brd.storedScalars.p1).toBe(100);
  });

  it("round-trips mini board scalar + spline data", () => {
    const a = new BezierBoard();
    loadBrdFromText(a, MINI_BOARD_BRD, "x.brd");
    const text = saveBrdToString(a);
    const b = new BezierBoard();
    expect(loadBrdFromText(b, text, "y.brd")).toBe(0);
    expect(b.outline.getNrOfControlPoints()).toBe(a.outline.getNrOfControlPoints());
    expect(b.outline.getControlPointOrThrow(0).getEndPoint().x).toBe(
      a.outline.getControlPointOrThrow(0).getEndPoint().x,
    );
    expect(b.storedScalars.p1).toBe(100);
  });

  it("encrypt/decrypt round-trip (Java-compatible PBE)", () => {
    const plain = "p07 : V4.4\np08 : EncTest\np32 : (\n(cp [0,0,1,0,0,1] false false)\n)\np33 : (\n(cp [0,0,1,0,0,1] false false)\n)\np34 : (\n(cp [0,0,1,0,0,1] false false)\n)\np35 : (\n)\n";
    const enc = encryptBrdPayload(plain, "deltaXTaildeltaXMiddle");
    const dec = decryptBrdPayload(enc, "deltaXTaildeltaXMiddle");
    expect(dec).toBe(plain);
  });

  it("loads from wrapped encrypted file bytes", () => {
    const plain = MINI_BOARD_BRD;
    const file = wrapEncryptedBrdFile(plain, "1.02");
    const brd = new BezierBoard();
    expect(loadBrdFromBytes(brd, file, "enc.brd")).toBe(0);
    expect(brd.name).toBe("MiniTest");
  });

  it("loads fixture with two cross-sections", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "sec.brd")).toBe(0);
    expect(brd.crossSections.length).toBe(2);
    expect(brd.crossSections[0]!.getPosition()).toBe(30);
    expect(brd.crossSections[1]!.getPosition()).toBe(70);
    expect(brd.crossSections[0]!.getBezierSpline().getNrOfControlPoints()).toBe(2);
  });

  it("readControlPoint parses Java format", () => {
    const k = readControlPointFromLine("(cp [1,2,3,4,5,6] true false)");
    expect(k).not.toBeNull();
    expect(k!.getEndPoint().x).toBe(1);
    expect(k!.isContinous()).toBe(true);
    expect(k!.getOther()).toBe(false);
  });
});
