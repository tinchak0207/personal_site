import test from "node:test";
import assert from "node:assert/strict";

import {
  WORKFLOW_SCHEMA_VERSION,
  createGenerationWorkflow,
  buildWorkflowPrompt,
} from "./generation-workflow.ts";

test("createGenerationWorkflow enriches enterprise preset metadata", () => {
  const workflow = createGenerationWorkflow(
    {
      contextPrompt: "Brand: clean skincare",
      negativePrompt: "bad label",
      negativeHint: "no watermark",
      workflowPreset: "product-shot",
      workflowPresetLabel: "商品主图",
      promptHint: "premium bottle, clean studio light",
      copies: 12,
      concurrency: 9,
    },
    [
      {
        id: "ref-1",
        name: "bottle.png",
        file: new File(["x"], "bottle.png", { type: "image/png" }),
        previewUrl: "blob:ref",
        size: 12,
        role: "product",
      },
    ],
  );

  assert.equal(workflow?.schemaVersion, WORKFLOW_SCHEMA_VERSION);
  assert.equal(workflow?.workflowPreset, "product-shot");
  assert.equal(workflow?.workflowPresetLabel, "商品主图");
  assert.equal(workflow?.promptHint, "premium bottle, clean studio light");
  assert.equal(workflow?.negativeHint, "no watermark");
  assert.equal(workflow?.estimatedCredits, 8);
  assert.equal(workflow?.copies, 8);
  assert.equal(workflow?.concurrency, 4);
  assert.equal(workflow?.referenceImages?.[0]?.role, "product");
});

test("buildWorkflowPrompt includes preset and hint guidance without leaking unsupported fields separately", () => {
  const prompt = buildWorkflowPrompt("Generate a product hero image", {
    schemaVersion: WORKFLOW_SCHEMA_VERSION,
    workflowPreset: "product-shot",
    workflowPresetLabel: "商品主图",
    promptHint: "studio lighting, readable packaging",
    negativeHint: "no logo distortion",
    negativePrompt: "no watermark",
    referenceImages: [{ name: "bottle.png", role: "product", size: 12 }],
  });

  assert.match(prompt, /Workflow preset: 商品主图/);
  assert.match(prompt, /Preset guidance:/);
  assert.match(prompt, /studio lighting/);
  assert.match(prompt, /Avoid:/);
  assert.match(prompt, /no logo distortion/);
  assert.match(prompt, /bottle\.png as product/);
});
