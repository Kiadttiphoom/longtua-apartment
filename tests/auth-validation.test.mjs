import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  normalizePhone,
  normalizeUsername,
  validateLoginInput,
  validateRegistrationInput,
} from "../lib/auth/validation.mjs";

const authActionsSource = readFileSync(fileURLToPath(new URL("../app/auth/actions.ts", import.meta.url)), "utf8");
const loginFormSource = readFileSync(fileURLToPath(new URL("../components/auth/LoginForm.tsx", import.meta.url)), "utf8");

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

test("validateRegistrationInput_weakPasswordAndMissingConsent_blocksSignup", () => {
  assert.deepEqual(validateRegistrationInput({
    username: "owner_01",
    displayName: "สมชาย ใจดี",
    organizationName: "สมชายอพาร์ทเมนท์",
    phone: "081-234-5678",
    password: "abcdefgh",
    confirmPassword: "abcdefgh",
    accepted: false,
  }), {
    password: "รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลข",
    accepted: "กรุณายอมรับเงื่อนไขการใช้งาน",
  });
});

test("validateRegistrationInput_completeOwnerProfile_allowsThirtyDayTrialSignup", () => {
  assert.deepEqual(validateRegistrationInput({
    username: "owner_01",
    displayName: "สมชาย ใจดี",
    organizationName: "สมชายอพาร์ทเมนท์",
    phone: "081-234-5678",
    password: "Longtua123",
    confirmPassword: "Longtua123",
    accepted: true,
  }), {});
});

test("normalizePhone_formattedThaiNumber_returnsDigitsOnly", () => {
  assert.equal(normalizePhone("081-234-5678"), "0812345678");
  assert.equal(normalizePhone(""), null);
});

test("loginErrors_doNotExposeReferenceIdAndInvalidCredentialsAreNotLoggedAsServerErrors", () => {
  assert.doesNotMatch(loginFormSource, /รหัสอ้างอิง|error\.requestId/);
  assert.match(authActionsSource, /if \(!isInvalidCredentialsError\(error\)\) logAuthFailure/);
  assert.match(authActionsSource, /ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง/);
  const loginSection = authActionsSource.slice(authActionsSource.indexOf("export async function loginAction"), authActionsSource.indexOf("export async function registerAction"));
  assert.doesNotMatch(loginSection, /ระบบเข้าสู่ระบบไม่พร้อมใช้งานชั่วคราว/);
});
