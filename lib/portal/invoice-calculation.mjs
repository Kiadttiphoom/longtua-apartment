const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const periodKey = (value) => String(value ?? "").slice(0, 7);

function meterReadingFor(readings, meters, roomId, meterType, periodMonth) {
  const meter = meters.find((item) => item.room_id === roomId && item.meter_type === meterType && item.status === "active");
  if (!meter) return null;
  return readings.find((item) => item.meter_id === meter.id && periodKey(item.period_month) === periodMonth) ?? null;
}

function meterItem(itemType, label, reading, rate) {
  const quantity = Number(reading.usage_value);
  return {
    itemType,
    description: `${label} ${Number(reading.previous_value).toLocaleString("th-TH")} → ${Number(reading.current_value).toLocaleString("th-TH")} (${quantity.toLocaleString("th-TH")} หน่วย)`,
    quantity,
    unitPrice: Number(rate),
    amount: money(quantity * Number(rate)),
    metadata: {
      billing_method: "meter",
      previous_value: Number(reading.previous_value),
      current_value: Number(reading.current_value),
      usage_value: quantity,
    },
  };
}

export function calculateInvoiceBreakdown({ lease, settings, meters, readings, periodMonth }) {
  const missing = [];
  if (!lease) missing.push("lease");
  if (!settings) missing.push("settings");
  if (!lease || !settings || !/^\d{4}-\d{2}$/.test(periodMonth)) {
    return { ready: false, missing, items: [], total: 0 };
  }

  const items = [{
    itemType: "rent",
    description: "ค่าเช่าห้องพัก",
    quantity: 1,
    unitPrice: Number(lease.rent_amount),
    amount: money(lease.rent_amount),
    metadata: { billing_method: "monthly_rent" },
  }];

  const electricReading = meterReadingFor(readings, meters, lease.room_id, "electric", periodMonth);
  if (electricReading) items.push(meterItem("electric", "ค่าไฟฟ้า", electricReading, settings.electric_rate));
  else missing.push("electric");

  const waterMethod = settings.water_billing_method ?? "meter";
  if (waterMethod === "meter") {
    const waterReading = meterReadingFor(readings, meters, lease.room_id, "water", periodMonth);
    if (waterReading) items.push(meterItem("water", "ค่าน้ำประปา", waterReading, settings.water_rate));
    else missing.push("water");
  } else if (waterMethod === "per_person") {
    const occupants = Number(lease.occupant_count);
    items.push({
      itemType: "water",
      description: `ค่าน้ำประปา ${occupants.toLocaleString("th-TH")} คน × ${Number(settings.water_rate).toLocaleString("th-TH")} บาท/คน`,
      quantity: occupants,
      unitPrice: Number(settings.water_rate),
      amount: money(occupants * Number(settings.water_rate)),
      metadata: { billing_method: "per_person", occupant_count: occupants },
    });
  } else {
    items.push({
      itemType: "water",
      description: "ค่าน้ำประปาเหมาจ่ายต่อห้อง",
      quantity: 1,
      unitPrice: Number(settings.water_rate),
      amount: money(settings.water_rate),
      metadata: { billing_method: "flat_room" },
    });
  }

  return {
    ready: missing.length === 0,
    missing,
    items,
    total: money(items.reduce((sum, item) => sum + item.amount, 0)),
  };
}

export const invoiceMissingMessage = (missing) => {
  if (missing.includes("settings")) return "หอนี้ยังไม่ได้ตั้งค่าอัตราค่าน้ำและค่าไฟ";
  const utilities = [missing.includes("electric") ? "ไฟฟ้า" : "", missing.includes("water") ? "น้ำ" : ""].filter(Boolean);
  return utilities.length ? `ยังไม่มีเลขมิเตอร์${utilities.join("และ")}ของรอบเดือนนี้` : "ข้อมูลสำหรับออกใบแจ้งหนี้ยังไม่ครบ";
};
