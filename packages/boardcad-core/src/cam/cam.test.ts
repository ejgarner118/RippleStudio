import { describe, it, expect } from "vitest";
import { parseShapebotProperties, generateGcodeDeckStub } from "./index.js";

describe("cam / shapebot", () => {
  it("parses shapebot.properties fields", () => {
    const cfg = parseShapebotProperties(`
# x
toolpathGenerator.deckScript = shapebot5deck.py
toolpathGenerator.bottomScript = shapebot5bottom.py
g.deckCuts = 20
g.speed = 10000
g.toolName = flat.stl
g.zMaxHeight = 500
`);
    expect(cfg.deckScript).toBe("shapebot5deck.py");
    expect(cfg.deckCuts).toBe(20);
    expect(cfg.speed).toBe(10000);
  });

  it("gcode stub contains header", () => {
    const g = generateGcodeDeckStub(parseShapebotProperties(""));
    expect(g).toContain("G21");
    expect(g).toContain("deck");
  });
});
