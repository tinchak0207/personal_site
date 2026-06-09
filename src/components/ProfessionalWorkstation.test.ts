import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("professional workstation is based on InvokeAI github workstation patterns", () => {
  const source = read("src/components/pro-workstation/InvokeInspiredWorkstation.tsx");
  const sources = read("src/components/pro-workstation/workstation-sources.ts");
  const design = read("docs/plans/2026-06-09-pro-workstation-platform-design.md");
  const playground = read("src/components/ImagePlayground.tsx");
  const pkg = read("package.json");

  assert.match(sources, /github\.com\/invoke-ai\/InvokeAI/);
  assert.match(sources, /Apache-2\.0/);
  assert.match(sources, /github\.com\/Stability-AI\/StableStudio/);
  assert.match(sources, /MIT/);
  assert.match(sources, /github\.com\/Comfy-Org\/ComfyUI_frontend/);
  assert.match(sources, /github\.com\/comfyanonymous\/ComfyUI/);
  assert.match(sources, /github\.com\/lllyasviel\/Fooocus/);
  assert.match(sources, /github\.com\/AUTOMATIC1111\/stable-diffusion-webui/);
  assert.match(sources, /AGPL-3\.0/);
  assert.match(sources, /product-reference/);
  assert.match(sources, /Unified Canvas/);
  assert.match(sources, /Control Layers/);
  assert.match(sources, /Board & Gallery Management/);
  assert.match(sources, /Queue/);
  assert.match(sources, /Prompt Library/);
  assert.match(sources, /Image Prompt/);
  assert.match(sources, /PNG Info/);
  assert.match(design, /\/api\/generate-images/);
  assert.match(design, /quota/);
  assert.match(design, /history/);
  assert.match(design, /Mobile should keep normal mode/);
  assert.match(design, /No fake node execution engine/);
  assert.match(source, /WORKSTATION_SOURCES/);
  assert.match(source, /WORKFLOW_PRESETS/);
  assert.match(source, /REFERENCE_IMAGE_ROLES/);
  assert.match(source, /negativePrompt/);
  assert.match(source, /workflowPreset/);
  assert.match(source, /role/);
  assert.match(source, /预计消耗/);
  assert.match(source, /Prompt Lab/);
  assert.match(source, /Workflow Plan/);
  assert.match(pkg, /"@atlaskit\/pragmatic-drag-and-drop"/);
  assert.match(pkg, /"react-virtuoso"/);
  assert.match(pkg, /"react-hotkeys-hook"/);
  assert.match(source, /draggable\(/);
  assert.match(source, /Virtuoso/);
  assert.match(source, /useHotkeys/);
  assert.match(source, /concurrency/);
  assert.match(source, /contextPrompt/);
  assert.match(playground, /dynamic\(\(\) => import\("@\/components\/pro-workstation\/InvokeInspiredWorkstation"\)/);
  assert.match(playground, /showProfessionalMode/);
  assert.match(playground, /hidden md:inline-flex/);
});
