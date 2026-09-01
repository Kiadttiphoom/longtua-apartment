"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, LayoutGrid, ListFilter, ReceiptText } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { DataTable, EmptyState, PageHeader, StatusBadge } from "@/components/portal/PortalUI";
import type { Invoice, Room } from "@/components/portal/types";
import { money, thaiDate } from "@/lib/format";

export function ReceivablesPage({ invoices, rooms }: { invoices: Invoice[]; rooms: Room[] }) {
  const [query, setQuery] = useState("");
  const [urgency, setUrgency] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item.room_number])), [rooms]);
  const outstanding = useMemo(
    () => invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void"),
    [invoices]
  );
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return outstanding.filter((item) => {
      const overdue = item.due_at < today;
      return (
        (urgency === "all" || (urgency === "overdue" ? overdue : !overdue)) &&
        (!keyword ||
          [item.invoice_number, roomMap.get(item.room_id)].some((value) =>
            value?.toLocaleLowerCase("th").includes(keyword)
          ))
      );
    });
  }, [outstanding, query, roomMap, today, urgency]);

  const overdueCount = outstanding.filter((item) => item.due_at < today).length;

  return (
    <>
      <PageHeader
        description="ติดตามใบแจ้งหนี้ที่ยังมียอดคงเหลือและใกล้ครบกำหนดชำระ"
        title="ยอดค้างชำระ"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>{outstanding.length.toLocaleString("th-TH")}</strong>
          <span>เอกสารค้างชำระ</span>
        </div>
        <div>
          <strong style={{ color: "#e11d48" }}>
            {money(outstanding.reduce((sum, item) => sum + Number(item.balance_due), 0))}
          </strong>
          <span>ยอดค้างรวม</span>
        </div>
        <div>
          <strong style={{ color: overdueCount > 0 ? "#e11d48" : "#0d9488" }}>
            {overdueCount.toLocaleString("th-TH")}
          </strong>
          <span>เกินกำหนดชำระ</span>
        </div>
      </section>

      <CollectionToolbar
        actions={
          <div className="portal-view-toggle">
            <button
              aria-label="มุมมองตาราง"
              className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <ListFilter size={15} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={15} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`พบ ${filtered.length.toLocaleString("th-TH")} เอกสาร`}
        filter={{
          label: "กรองกำหนดชำระ",
          value: urgency,
          onChange: setUrgency,
          options: [
            { value: "all", label: "ทั้งหมด" },
            { value: "overdue", label: "เกินกำหนด" },
            { value: "upcoming", label: "ยังไม่ถึงกำหนด" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้หรือห้อง"
        query={query}
        title="รายการติดตามหนี้"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="portal-table-wrap">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ยอดค้างชำระ",
                "ยอดเรียกเก็บรวม",
                "กำหนดชำระ",
                "สถานะกำหนด",
                "สถานะเอกสาร",
              ]}
              rows={filtered.map((item) => {
                const overdue = item.due_at < today;
                return [
                  <div className="portal-lease-room-cell" key="inv">
                    <span
                      className="portal-lease-room-pill"
                      style={{
                        background: overdue ? "#fee2e2" : "#f1f5f9",
                        color: overdue ? "#991b1b" : "#334155",
                      }}
                    >
                      {roomMap.get(item.room_id) ?? "—"}
                    </span>
                    <div className="portal-lease-tenant-meta">
                      <strong>{item.invoice_number}</strong>
                      <small>ห้อง {roomMap.get(item.room_id) ?? "—"}</small>
                    </div>
                  </div>,
                  <strong key="bal" style={{ color: "#e11d48", fontSize: "14px" }}>
                    {money(Number(item.balance_due))}
                  </strong>,
                  <span key="tot" style={{ color: "#64748b" }}>
                    {money(Number(item.total))}
                  </span>,
                  <span key="due">{thaiDate(item.due_at)}</span>,
                  <span
                    className={`account-badge ${overdue ? "none" : "active"}`}
                    key="urgency"
                    style={{
                      background: overdue ? "#fee2e2" : "#ecfdf5",
                      color: overdue ? "#b91c1c" : "#059669",
                      borderColor: overdue ? "#fca5a5" : "#a7f3d0",
                    }}
                  >
                    {overdue ? "⚠️ เกินกำหนด" : "รอถึงกำหนด"}
                  </span>,
                  <StatusBadge key="status" status={item.status} />,
                ];
              })}
            />
          </div>
        ) : (
          <section className="portal-collection-grid">
            {filtered.map((item) => {
              const overdue = item.due_at < today;
              return (
                <article
                  className={`portal-record-card receivable-card${overdue ? " overdue" : ""}`}
                  key={item.id}
                >
                  <header>
                    <span className="portal-record-icon danger">
                      {overdue ? <AlertTriangle aria-hidden="true" size={20} /> : <ReceiptText aria-hidden="true" size={20} />}
                    </span>
                    <div>
                      <h2>{item.invoice_number}</h2>
                      <small>ห้อง {roomMap.get(item.room_id) ?? "—"}</small>
                    </div>
                    <StatusBadge status={item.status} />
                  </header>

                  <div className="portal-payment-amount">
                    <small>ยอดค้างชำระ</small>
                    <strong style={{ color: "#e11d48" }}>{money(Number(item.balance_due))}</strong>
                    <span>จากยอดรวม {money(Number(item.total))}</span>
                  </div>

                  <footer>
                    <span
                      style={{
                        fontWeight: 600,
                        color: overdue ? "#b91c1c" : "#475569",
                      }}
                    >
                      <CalendarClock aria-hidden="true" size={14} style={{ display: "inline", marginRight: 4 }} />
                      {overdue ? "⚠️ เกินกำหนดชำระ" : "ครบกำหนด"} {thaiDate(item.due_at)}
                    </span>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <EmptyState
          description={
            outstanding.length
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองกำหนดชำระ"
              : "ใบแจ้งหนี้ทั้งหมดปิดยอดแล้ว"
          }
          title={outstanding.length ? "ไม่พบยอดค้างตามเงื่อนไข" : "ไม่มียอดค้าง"}
        />
      )}
    </>
  );
}
