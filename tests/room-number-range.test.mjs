import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildRoomNumberRange, MAX_BULK_ROOMS } from "../lib/rooms/room-number-range.mjs";

test("buildRoomNumberRange_numericRooms_createsInclusiveSequence", () => {
  assert.deepEqual(buildRoomNumberRange({ start: 101, end: 104, padding: 0 }), {
    roomNumbers: ["101", "102", "103", "104"],
    error: null,
  });
});

test("buildRoomNumberRange_prefixAndPadding_createsApartmentStyleNumbers", () => {
  assert.deepEqual(buildRoomNumberRange({ prefix: " A ", start: 1, end: 3, padding: 2 }), {
    roomNumbers: ["A01", "A02", "A03"],
    error: null,
  });
});

test("buildRoomNumberRange_reversedOrOversizedRange_returnsValidationError", () => {
  assert.match(buildRoomNumberRange({ start: 20, end: 10 }).error, /ถูกต้อง/);
  assert.match(buildRoomNumberRange({ start: 1, end: MAX_BULK_ROOMS + 1 }).error, /สูงสุด 200 ห้อง/);
});

test("bulkRoomMigration_usesInvokerPermissionsAndCreatesMetersInOneFunction", () => {
  const migration = readFileSync(fileURLToPath(new URL(
    "../supabase/migrations/20260829023526_create_rooms_with_meters.sql",
    import.meta.url,
  )), "utf8");

  assert.match(migration, /security invoker/i);
  assert.match(migration, /private\.has_menu_action\(target_organization_id, 'customer_rooms', 'create'\)/);
  assert.match(migration, /cardinality\(requested_room_numbers\) > 200/);
  assert.match(migration, /'electric'\),\s*\(target_organization_id[^;]+'water'\)/s);
  assert.match(migration, /grant execute on function public\.create_rooms_with_meters[^;]+to authenticated, service_role/s);
});
