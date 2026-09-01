import { Banknote, Building2, DoorOpen, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import type { PortalData } from "@/components/portal/types";
import { money } from "@/lib/format";

export function ReportsPage({ data }: { data: PortalData }) {
  const revenue = data.payments
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const outstanding = data.invoices
    .filter((item) => item.status !== "void")
    .reduce((sum, item) => sum + Number(item.balance_due), 0);
  const occupancy = data.rooms.length
    ? Math.round(
        (data.rooms.filter((item) => item.status === "occupied").length / data.rooms.length) * 100
      )
    : 0;

  const propertyReports = data.properties.map((property) => {
    const rooms = data.rooms.filter((room) => room.property_id === property.id);
    const payments = data.payments.filter(
      (payment) => payment.property_id === property.id && payment.status === "confirmed"
    );
    const invoices = data.invoices.filter(
      (invoice) => invoice.property_id === property.id && invoice.status !== "void"
    );
    const occupied = rooms.filter((room) => room.status === "occupied").length;
    return {
      property,
      rooms: rooms.length,
      occupied,
      revenue: payments.reduce((sum, item) => sum + Number(item.amount), 0),
      outstanding: invoices.reduce((sum, item) => sum + Number(item.balance_due), 0),
    };
  });

  return (
    <>
      <header className="portal-page-header">
        <div>
          <h1>รายงานและสถิติ</h1>
          <p>ภาพรวมผลการดำเนินงาน อัตราเข้าพัก และรายรับจากข้อมูลจริงของกิจการ</p>
        </div>
      </header>

      <section className="portal-report-hero">
        <div>
          <span>
            <TrendingUp aria-hidden="true" size={24} />
          </span>
          <div>
            <small>รายรับสะสมที่ยืนยันแล้ว</small>
            <strong>{money(revenue)}</strong>
            <p>
              จาก{" "}
              {data.payments
                .filter((item) => item.status === "confirmed")
                .length.toLocaleString("th-TH")}{" "}
              รายการรับชำระ
            </p>
          </div>
        </div>
        <dl>
          <div>
            <dt>ยอดค้างปัจจุบัน</dt>
            <dd style={{ color: outstanding > 0 ? "#e11d48" : "#0d9488" }}>
              {money(outstanding)}
            </dd>
          </div>
          <div>
            <dt>อัตราเข้าพักรวม</dt>
            <dd style={{ color: "#0d9488" }}>{occupancy}%</dd>
          </div>
          <div>
            <dt>ใบแจ้งหนี้ออกแล้ว</dt>
            <dd>{data.invoices.length.toLocaleString("th-TH")} ฉบับ</dd>
          </div>
        </dl>
      </section>

      <section className="portal-summary-strip">
        <div>
          <strong>{data.properties.length.toLocaleString("th-TH")}</strong>
          <span>หอพักทั้งหมด</span>
        </div>
        <div>
          <strong>{data.rooms.length.toLocaleString("th-TH")}</strong>
          <span>ห้องทั้งหมด</span>
        </div>
        <div>
          <strong>
            {data.rooms.filter((item) => item.status === "occupied").length.toLocaleString("th-TH")}
          </strong>
          <span>ห้องมีผู้พัก</span>
        </div>
        <div>
          <strong>
            {data.leases.filter((item) => item.status === "active").length.toLocaleString("th-TH")}
          </strong>
          <span>สัญญาใช้งาน</span>
        </div>
      </section>

      <header className="portal-section-heading">
        <div>
          <h2>ผลการดำเนินงานแยกตามหอ</h2>
          <p>เปรียบเทียบจำนวนห้อง รายรับ และยอดค้างของแต่ละหอพัก</p>
        </div>
        <span>{propertyReports.length.toLocaleString("th-TH")} หอพัก</span>
      </header>

      {propertyReports.length ? (
        <section className="portal-dormitory-grid portal-report-properties">
          {propertyReports.map(
            ({
              property,
              rooms,
              occupied,
              revenue: propertyRevenue,
              outstanding: propertyOutstanding,
            }) => (
              <article className="portal-record-card report-property-card" key={property.id}>
                <header>
                  <span className="portal-dormitory-icon-pill">
                    <Building2 aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2>{property.name}</h2>
                    <small>
                      {rooms
                        ? `อัตราเข้าพัก ${Math.round((occupied / rooms) * 100)}%`
                        : "ยังไม่มีห้องพัก"}
                    </small>
                  </div>
                </header>

                <div
                  aria-label={`เข้าพัก ${occupied} จาก ${rooms} ห้อง`}
                  className="portal-occupancy-bar"
                >
                  <span style={{ width: `${rooms ? (occupied / rooms) * 100 : 0}%` }} />
                </div>

                <dl className="portal-record-metrics">
                  <div>
                    <dt>
                      <DoorOpen aria-hidden="true" size={13} /> ห้องพัก
                    </dt>
                    <dd>
                      {occupied}/{rooms} ห้อง
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Banknote aria-hidden="true" size={13} /> รายรับ
                    </dt>
                    <dd style={{ color: "#0d9488", fontWeight: 700 }}>
                      {money(propertyRevenue)}
                    </dd>
                  </div>
                  <div className="wide">
                    <dt>
                      <WalletCards aria-hidden="true" size={13} /> ยอดค้าง
                    </dt>
                    <dd
                      className={propertyOutstanding > 0 ? "danger-text" : ""}
                      style={{
                        color: propertyOutstanding > 0 ? "#e11d48" : "#64748b",
                        fontWeight: propertyOutstanding > 0 ? 700 : 400,
                      }}
                    >
                      {money(propertyOutstanding)}
                    </dd>
                  </div>
                </dl>

                <footer>
                  <span>
                    <ReceiptText aria-hidden="true" size={14} /> สรุปจากรายการที่บันทึกในระบบ
                  </span>
                </footer>
              </article>
            )
          )}
        </section>
      ) : (
        <div className="portal-report-empty">
          <Building2 aria-hidden="true" size={24} />
          <strong>ยังไม่มีข้อมูลหอพัก</strong>
          <span>เพิ่มหอพักและห้องเพื่อเริ่มดูรายงานแยกกิจการ</span>
        </div>
      )}
    </>
  );
}
