import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("reference image upload uses proven image upload libraries", () => {
  const source = read("src/components/ReferenceImageUpload.tsx");
  const pkg = read("package.json");

  assert.match(pkg, /"react-dropzone"/);
  assert.match(pkg, /"browser-image-compression"/);
  assert.match(source, /useDropzone/);
  assert.match(source, /imageCompression/);
  assert.match(source, /MAX_REFERENCE_IMAGES = 6/);
  assert.match(source, /accept:\s*\{\s*"image\/\*"/);
  assert.match(source, /multiple: true/);
  assert.match(source, /URL\.revokeObjectURL/);
});

test("reference image previews are not revoked when upload widget remounts", () => {
  const source = read("src/components/ReferenceImageUpload.tsx");

  assert.doesNotMatch(source, /useEffect\(\(\) => \(\) => \{[\s\S]*?revokeObjectURL/);
  assert.match(source, /const removeImage[\s\S]*?URL\.revokeObjectURL\(target\.previewUrl\)/);
});
