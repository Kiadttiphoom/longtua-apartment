import test from "node:test";
import assert from "node:assert/strict";
import { detectSlipType } from "../lib/tenant/slip-validation.mjs";
test("slip validation detects supported bytes instead of trusting file extensions", () => {
  assert.equal(detectSlipType(Uint8Array.from([255,216,255,224])).type, "image/jpeg");
  assert.equal(detectSlipType(Uint8Array.from([137,80,78,71,13,10,26,10])).type, "image/png");
  assert.equal(detectSlipType(new TextEncoder().encode("%PDF-1.7")), null);
  assert.equal(detectSlipType(new TextEncoder().encode("RIFF0000WEBP")), null);
  assert.equal(detectSlipType(new TextEncoder().encode("<svg onload='alert(1)'>")), null);
  assert.equal(detectSlipType(new Uint8Array()), null);
});
