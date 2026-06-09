import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const route = readFileSync(join(process.cwd(), "src/app/api/checkin/route.ts"), "utf8");

test("checkin route keeps native new-api checkin but enables disabled backend settings", () => {
  assert.doesNotMatch(route, /makeProxy/);
  assert.match(route, /getGatewayBaseUrl/);
  assert.match(route, /\/api\/user\/checkin/);
  assert.match(route, /\/api\/option\//);
  assert.match(route, /checkin_setting\.enabled/);
  assert.match(route, /checkin_setting\.min_quota/);
  assert.match(route, /checkin_setting\.max_quota/);
  assert.match(route, /500_000/);
  assert.match(route, /1_500_000/);
  assert.match(route, /签到功能未启用/);
});

test("checkin route normalizes native response for the existing client", () => {
  assert.match(route, /quota_awarded/);
  assert.match(route, /can_checkin/);
  assert.match(route, /checked_in_today/);
  assert.match(route, /retry/);
});
