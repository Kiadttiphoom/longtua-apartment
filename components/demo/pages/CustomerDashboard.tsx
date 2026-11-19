"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  FileText,
  Gauge,
  ReceiptText,
  Wallet,
} from "lucide-react";
import type { ContractRecord, PageKey, Property } from "../types";

const monthlyStats = [
  {
    month: "มี.ค.",
    billed: 45000,
    collected: 45000,
  },
  {
    month: "เม.ย.",
    billed: 48500,
    collected: 46000,
  },
  {
    month: "พ.ค.",
    billed: 50200,
    collected: 49000,
  },
  {
    month: "มิ.ย.",
    billed: 52000,
    collected: 50500,
  },
  {
    month: "ก.ค.",
    billed: 54300,
    collected: 51200,
  },
  {
    month: "ส.ค.",
    billed: 56100,
    collected: 45000,
  },
];

const invoices = [
  {
    number: "INV-2568-08101",
    room: "101",
    issued: "1 ส.ค. 2568",
    due: "5 ส.ค. 2568",
    total: "฿5,050.00",
    balance: "฿0.00",
    status: "paid",
  },
  {
    number: "INV-2568-08102",
    room: "102",
    issued: "1 ส.ค. 2568",
    due: "5 ส.ค. 2568",
    total: "฿5,050.00",
    balance: "฿5,050.00",
    status: "overdue",
  },
  {
    number: "INV-2568-08201",
    room: "201",
    issued: "1 ส.ค. 2568",
    due: "5 ส.ค. 2568",
    total: "฿5,600.00",
    balance: "฿0.00",
    status: "paid",
  },
  {
    number: "INV-2568-08301",
    room: "301",
    issued: "1 ส.ค. 2568",
    due: "5 ส.ค. 2568",
    total: "฿6,050.00",
    balance: "฿6,050.00",
    status: "overdue",
  },
  {
    number: "INV-2568-08302",
    room: "302",
    issued: "1 ส.ค. 2568",
    due: "5 ส.ค. 2568",
    total: "฿5,600.00",
    balance: "฿0.00",
    status: "paid",
  },
  {
    number: "INV-2568-08401",
    room: "401",
    issued: "1 ส.ค. 2568",
    due: "5 ส.ค. 2568",
    total: "฿6,700.00",
    balance: "฿0.00",
    status: "paid",
  },
];

const baht = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const chartCeiling = 60000;
const shortcuts = [
  { label: "ห้องพัก", page: "rooms", icon: Building2 },
  { label: "สัญญาเช่า", page: "contracts", icon: FileText },
  { label: "จดมิเตอร์", page: "meters", icon: Gauge },
] as const;

export function CustomerDashboard({
  onNavigate,
  properties,
  contracts,
}: {
  onNavigate: (page: PageKey) => void;
  properties: Property[];
  contracts: ContractRecord[];
}) {
  const [months, setMonths] = useState(6);
  const [series, setSeries] = useState<"collected" | "billed">("collected");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const visibleMonths = monthlyStats.slice(-months);
  const chartPoints = visibleMonths.map((item, index) => ({
    month: item.month,
    amount: baht.format(item[series]),
    x: ((index + 0.5) / visibleMonths.length) * 100,
    y: (1 - item[series] / chartCeiling) * 100,
  }));
  const latestMonth = monthlyStats[monthlyStats.length - 1];
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance.replace(/[^\d.]/g, "")),
    0,
  );
  const rooms = properties.reduce(
    (count, property) => count + property.rooms.length,
    0,
  );
  const activeContracts = contracts.filter(
    (contract) => contract.status === "active",
  ).length;
  const metrics = [
    {
      label: "รับชำระรอบล่าสุด",
      value: latestMonth.collected,
      detail: "ยอดรับชำระในเดือนล่าสุดของ Demo",
      icon: Wallet,
      page: "payments",
    },
    {
      label: "ยอดค้างชำระ",
      value: outstanding,
      detail: "ยอดคงเหลือจากใบแจ้งหนี้ตัวอย่าง",
      icon: ReceiptText,
      page: "receivables",
    },
  ] as const;

  return (
    <div className="demo-overview">
      <header className="demo-overview-heading">
        <div>
          <h1>ภาพรวมกิจการ</h1>
          <p>
            {properties.length} หอพัก · {rooms} ห้อง · {activeContracts}{" "}
            สัญญาที่ใช้งาน
          </p>
        </div>
        <button
          className="demo-control"
          type="button"
          onClick={() => onNavigate("reports")}
        >
          ดูรายงาน <ArrowUpRight size={15} />
        </button>
      </header>

      <section className="demo-kpis" aria-label="สรุปการเงิน">
        {metrics.map(({ label, value, detail, icon: Icon, page }) => (
          <button
            className="demo-kpi"
            type="button"
            key={page}
            onClick={() => onNavigate(page)}
          >
            <span className="demo-kpi-label">
              <Icon size={17} />
              {label}
              <ArrowUpRight size={14} />
            </span>
            <strong>{baht.format(value)}</strong>
            <small>{detail}</small>
          </button>
        ))}
      </section>

      <section className="demo-overview-panel" aria-labelledby="demo-cash-flow">
        <header className="demo-panel-toolbar">
          <h2 id="demo-cash-flow">กระแสเงินสด</h2>
          <div className="demo-toolbar-controls">
            <div
              className="demo-chart-switch"
              role="group"
              aria-label="รูปแบบกราฟ"
            >
              <button
                type="button"
                aria-pressed={chartType === "line"}
                onClick={() => setChartType("line")}
              >
                เส้น
              </button>
              <button
                type="button"
                aria-pressed={chartType === "bar"}
                onClick={() => setChartType("bar")}
              >
                แท่ง
              </button>
            </div>
            <div className="demo-chart-switch" aria-label="ชุดข้อมูล">
              <button
                type="button"
                aria-pressed={series === "collected"}
                onClick={() => setSeries("collected")}
              >
                รับชำระ
              </button>
              <button
                type="button"
                aria-pressed={series === "billed"}
                onClick={() => setSeries("billed")}
              >
                เรียกเก็บ
              </button>
            </div>
            <select
              className="demo-control"
              aria-label="ช่วงเวลากราฟกระแสเงินสด"
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
            >
              <option value={6}>6 เดือน</option>
              <option value={3}>3 เดือน</option>
            </select>
          </div>
        </header>

        <div className="demo-plot">
          <div className="demo-axis" aria-hidden="true">
            <span>฿60,000</span>
            <span>฿30,000</span>
            <span>฿0</span>
          </div>
          <div className="demo-plot-series">
            <div className="demo-chart-area">
              {chartType === "line" ? (
                <svg
                  className="demo-chart-line"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    points={chartPoints
                      .map(({ x, y }) => `${x},${y}`)
                      .join(" ")}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : null}
              {chartPoints.map(({ month, amount, x, y }) => (
                <span
                  key={month}
                  className={
                    chartType === "line"
                      ? "demo-chart-dot"
                      : "demo-chart-column"
                  }
                  style={{ left: `${x}%`, top: `${y}%` }}
                  role="img"
                  aria-label={`${month} ${amount}`}
                  title={`${month} ${amount}`}
                />
              ))}
            </div>
            <div className="demo-chart-months" aria-hidden="true">
              {chartPoints.map(({ month }) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="demo-overview-panel"
        aria-labelledby="demo-recent-invoices"
      >
        <header className="demo-panel-toolbar">
          <h2 id="demo-recent-invoices">ใบแจ้งหนี้ล่าสุด</h2>
          <button
            type="button"
            className="demo-control"
            onClick={() => onNavigate("invoices")}
          >
            ดูใบแจ้งหนี้ <ArrowUpRight size={14} />
          </button>
        </header>
        <div className="demo-invoice-scroll">
          <table className="demo-invoice-list">
            <thead>
              <tr>
                <th scope="col">เลขที่ใบแจ้งหนี้</th>
                <th scope="col">ห้อง</th>
                <th scope="col">สถานะ</th>
                <th scope="col">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 4).map((invoice) => (
                <tr key={invoice.number}>
                  <th scope="row">
                    <span>
                      <FileText size={15} aria-hidden="true" />
                      {invoice.number}
                    </span>
                  </th>
                  <td>{invoice.room}</td>
                  <td>
                    <span
                      className="demo-invoice-status"
                      data-status={invoice.status}
                    >
                      {invoice.status === "paid" ? "ชำระแล้ว" : "เกินกำหนด"}
                    </span>
                  </td>
                  <td>{invoice.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav className="demo-shortcuts" aria-label="งานจัดการหอพัก">
        {shortcuts.map(({ label, page, icon: Icon }) => (
          <button
            className="demo-control"
            key={page}
            type="button"
            onClick={() => onNavigate(page)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
