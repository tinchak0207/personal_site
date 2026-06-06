import test from "node:test";
import assert from "node:assert/strict";
import { STYLE_PRESETS } from "./prompt-enhancer.ts";

test("style preset labels are simplified Chinese", () => {
  assert.deepEqual(STYLE_PRESETS.map((item) => item.label), [
    "写实摄影",
    "动漫插画",
    "网感街拍",
    "商品展示",
    "海报设计",
    "水彩插画",
  ]);
});
