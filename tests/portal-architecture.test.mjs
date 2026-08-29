import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  validateDormitory, validateGuestroom, validateInvoice, validateLease,
  validateMeter, validatePayment, validateSettings, validateTenant,
} from "../lib/portal/validation.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

test("portalRoutes_dashboardDoesNotOwnFeaturePages", () => {
  for (const route of ["dashboard", "dormitories", "guestrooms", "tenants", "leases", "meters", "invoices"]) {
    assert.equal(existsSync(`${root}/app/(portal)/${route}/page.tsx`), true, `missing /${route}`);
  }
  assert.equal(existsSync(`${root}/components/dashboard/ApartmentDashboard.tsx`), false);
  assert.match(read("app/(portal)/layout.tsx"), /PortalShell/);
});

test("portalValidation_everyCreateAndEditFormReturnsSpecificFieldErrors", () => {
  assert.equal(validateDormitory({ name: "" }).name, "กรุณากรอกชื่อหอพัก");
  assert.equal(validateGuestroom({ propertyId: "", baseRent: "-1" }).propertyId, "กรุณาเลือกหอพัก");
  assert.equal(validateTenant({ fullName: "ก", email: "bad" }).email, "รูปแบบอีเมลไม่ถูกต้อง");
  assert.equal(validateLease({ startDate: "2026-08-20", endDate: "2026-08-01" }).endDate, "วันสิ้นสุดต้องไม่ก่อนวันเริ่มสัญญา");
  assert.equal(validateMeter({ previousValue: "20", currentValue: "10" }).currentValue, "เลขครั้งนี้ต้องไม่น้อยกว่าเลขครั้งก่อน");
  assert.equal(validateInvoice({ total: "-1" }).total, "กรุณากรอกยอดรวมตั้งแต่ 0 ขึ้นไป");
  assert.equal(validatePayment({ amount: "0" }).amount, "ยอดรับชำระต้องมากกว่า 0");
  assert.equal(validateSettings({ billDay: "29", dueDay: "0" }).billDay, "กรุณากรอกวันที่ระหว่าง 1–28");
});

test("portalEditActions_reauthorizeAndScopeUpdatesToOrganization", () => {
  const actions = read("app/(portal)/resource-actions.ts");
  for (const name of ["updatePropertyAction", "updateRoomAction", "updateTenantAction", "updateLeaseAction", "updateInvoiceAction"]) {
    const start = actions.indexOf(`export async function ${name}`);
    assert.notEqual(start, -1, `${name} is missing`);
    const section = actions.slice(start, actions.indexOf("\nexport async function", start + 10) === -1 ? undefined : actions.indexOf("\nexport async function", start + 10));
    assert.match(section, /actionContext\(formData, "customer_[^"]+", "update"\)/);
    assert.match(section, /\.eq\("organization_id", context\.organizationId\)/);
  }
});

test("portalDeleteActions_followGranularPermissionAndPreserveReferencedHistory", () => {
  const actions = read("app/(portal)/resource-actions.ts");
  for (const [name, menu] of [["deletePropertyAction", "customer_properties"], ["deleteRoomAction", "customer_rooms"]]) {
    const start = actions.indexOf(`export async function ${name}`);
    assert.notEqual(start, -1, `${name} is missing`);
    const next = actions.indexOf("\nexport async function", start + 10);
    const section = actions.slice(start, next === -1 ? undefined : next);
    assert.match(section, new RegExp(`actionContext\\(formData, "${menu}", "delete"\\)`));
    assert.match(section, /\.eq\("organization_id", context\.organizationId\)/);
    assert.match(section, /error\.code === "23503"/);
  }
  assert.match(read("app/(portal)/dormitories/page.tsx"), /canDelete=\{can\(context, "customer_properties", "delete"\)\}/);
  assert.match(read("app/(portal)/guestrooms/page.tsx"), /canDelete=\{can\(context, "customer_rooms", "delete"\)\}/);
  assert.match(read("components/portal/DormitoriesPage.tsx"), /DeleteConfirmation/);
  assert.match(read("components/portal/GuestroomsPage.tsx"), /DeleteConfirmation/);
});

test("portalForms_disableNativeTooltipsAndRenderInlineErrors", () => {
  const ui = read("components/portal/PortalUI.tsx");
  assert.match(ui, /<form className="portal-form" noValidate/);
  assert.match(ui, /aria-invalid=\{Boolean\(error\)\}/);
  assert.match(ui, /className="field-error"/);
  assert.match(ui, /querySelector<HTMLElement>\('\[aria-invalid="true"\]'\)/);
});

test("portalFormatting_serverComponentsDoNotInvokeClientModuleUtilities", () => {
  const ui = read("components/portal/PortalUI.tsx");
  assert.doesNotMatch(ui, /export function (money|thaiDate)/);
  assert.match(read("lib/format.ts"), /export function money/);
  for (const component of ["DashboardOverview", "ReceivablesPage", "ReportsPage"]) {
    const source = read(`components/portal/${component}.tsx`);
    assert.match(source, /from "@\/lib\/format"/);
    assert.doesNotMatch(source, /\b(money|thaiDate)\b[^\n]*from "@\/components\/portal\/PortalUI"/);
  }
});

test("sharedUi_portalAndAdminUseOneTableStatusAndFormattingSystem", () => {
  const portalUi = read("components/portal/PortalUI.tsx");
  const adminPrimitives = read("components/admin/AdminPrimitives.tsx");
  const adminViews = ["AdminOverviewView", "AdminPropertyViews", "AdminTenantViews", "AdminBillingViews"].map((name) => read(`components/admin/views/${name}.tsx`)).join("\n");
  assert.match(portalUi, /export \{ DataTable \} from "@\/components\/ui\/DataTable"/);
  assert.match(adminPrimitives, /import \{ DataTable \} from "@\/components\/ui\/DataTable"/);
  assert.match(portalUi, /export \{ StatusBadge \} from "@\/components\/ui\/StatusBadge"/);
  assert.match(adminViews, /from "@\/components\/ui\/StatusBadge"/);
  assert.match(adminPrimitives, /from "@\/lib\/format"/);
  assert.doesNotMatch(portalUi + adminPrimitives, /export function (money|thaiDate|statusLabel)/);
});

test("customDropdown_customerPortalUsesAccessibleListboxWithFormDataField", () => {
  const control = read("components/ui/SelectControl.tsx");
  assert.match(control, /role="combobox"/);
  assert.match(control, /role="listbox"/);
  assert.match(control, /role="option"/);
  assert.match(control, /<input name=\{name\} readOnly ref=\{hiddenInputRef\} type="hidden" value=\{selectedValue\}/);
  assert.match(control, /hiddenInputRef\.current\.value = nextValue/);
  assert.match(control, /createPortal\(/);
  for (const path of ["components/portal/PortalUI.tsx", "components/portal/PortalShell.tsx", "components/portal/GuestroomsPage.tsx"]) {
    assert.doesNotMatch(read(path), /<select\b/, `${path} still renders a native select`);
  }
});

test("customDropdown_showsSearchFilterByDefaultAndCanBeDisabledExplicitly", () => {
  const selectControl = read("components/ui/SelectControl.tsx");
  assert.match(selectControl, /const hasSearch = searchable \?\? true/);
  assert.match(selectControl, /option\.value/);
  assert.match(selectControl, /ไม่พบรายการที่ค้นหา/);
});

test("customDateTime_customerFormsUseThaiCalendarForDateMonthTimeAndDateTimeValues", () => {
  const control = read("components/ui/DateTimeControl.tsx");
  const ui = read("components/portal/PortalUI.tsx");
  assert.match(control, /"date" \| "month" \| "time" \| "datetime-local"/);
  assert.match(control, /new Intl\.DateTimeFormat\("th-TH"/);
  assert.match(control, /<input name=\{name\} readOnly type="hidden" value=\{value\}/);
  assert.match(control, /`\$\{selectedDate\}T\$\{pad\(hour\)\}:\$\{pad\(minute\)\}`/);
  assert.match(ui, /\["date", "month", "time", "datetime-local"\]\.includes\(type\)/);
  assert.match(read("components/portal/LeasesPage.tsx"), /type="date"/);
  assert.match(read("components/portal/MetersPage.tsx"), /type="month"/);
});
