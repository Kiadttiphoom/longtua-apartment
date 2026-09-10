import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  normalizePhone,
  normalizeUsername,
  validateLoginInput,
  validateTrialRequestInput,
} from "../lib/auth/validation.mjs";

const authActionsSource = readFileSync(fileURLToPath(new URL("../app/auth/actions.ts", import.meta.url)), "utf8");
const loginFormSource = readFileSync(fileURLToPath(new URL("../components/auth/LoginForm.tsx", import.meta.url)), "utf8");
const trialRequestRouteSource = readFileSync(fileURLToPath(new URL("../lib/auth/create-trial-request.ts", import.meta.url)), "utf8");

test("normalizeUsername_mixedCaseAndWhitespace_returnsCanonicalLoginKey", () => {
  assert.equal(normalizeUsername("  Somchai.Owner  "), "somchai.owner");
});

test("validateLoginInput_usernameWithoutEmail_acceptsValidUsernameAndPassword", () => {
  assert.deepEqual(validateLoginInput({ username: "owner_01", password: "Longtua123" }), {});
});

test("validateLoginInput_invalidUsernameAndShortPassword_returnsFieldErrors", () => {
  assert.deepEqual(validateLoginInput({ username: "อ", password: "123" }), {
    username: "ชื่อผู้ใช้ต้องมี 4–30 ตัว ใช้ a-z, 0-9, จุด, _ หรือ -",
    password: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
  });
});

test("validateTrialRequestInput_weakPasswordAndMissingConsent_blocksRequest", () => {
  assert.deepEqual(validateTrialRequestInput({
    username: "owner_01",
    operatorName: "สมชาย ใจดี",
    propertyName: "หอพักสมชาย",
    contactEmail: "owner@example.com",
    phone: "081-234-5678",
    requestedRoomCount: 30,
    password: "abcdefgh",
    confirmPassword: "abcdefgh",
    accepted: false,
  }), {
    password: "รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลข",
    accepted: "กรุณายอมรับเงื่อนไขการใช้งาน",
  });
});

test("validateTrialRequestInput_completeApplication_allowsPendingRequest", () => {
  assert.deepEqual(validateTrialRequestInput({
    username: "owner_01",
    operatorName: "สมชาย ใจดี",
    propertyName: "หอพักสมชาย",
    contactEmail: "owner@example.com",
    phone: "081-234-5678",
    requestedRoomCount: 30,
    password: "Longtua123",
    confirmPassword: "Longtua123",
    accepted: true,
  }), {});
});

test("trialRequestEndpoint_keepsOperatorAndPropertyNamesDistinct", () => {
  assert.match(trialRequestRouteSource, /operatorName\?: unknown/);
  assert.match(trialRequestRouteSource, /propertyName\?: unknown/);
  assert.match(trialRequestRouteSource, /new_operator_name: operatorName/);
  assert.match(trialRequestRouteSource, /new_property_name: propertyName/);
});

test("normalizePhone_formattedThaiNumber_returnsDigitsOnly", () => {
  assert.equal(normalizePhone("081-234-5678"), "0812345678");
  assert.equal(normalizePhone(""), null);
});

test("loginErrors_doNotExposeReferenceIdAndInvalidCredentialsAreNotLoggedAsServerErrors", () => {
  assert.doesNotMatch(loginFormSource, /รหัสอ้างอิง|error\.requestId/);
  assert.match(authActionsSource, /if \(!isInvalidCredentialsError\(error\)\) logAuthFailure/);
  assert.match(authActionsSource, /ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง/);
  const loginStart = authActionsSource.indexOf("export async function loginAction");
  const logoutStart = authActionsSource.indexOf("export async function logoutAction", loginStart);
  const loginSection = authActionsSource.slice(loginStart, logoutStart === -1 ? undefined : logoutStart);
  assert.doesNotMatch(loginSection, /ระบบเข้าสู่ระบบไม่พร้อมใช้งานชั่วคราว/);
});
