import { money, thaiDate } from "@/lib/format";
import type { Invoice, Property, PropertySettings, Room, Tenant } from "./types";
import { parsePaymentSettings } from "@/lib/constants/banks";

export function InvoiceDocument({ invoice, property, room, tenant, settings }: {
  invoice: Invoice; property?: Property; room?: Room; tenant?: Tenant; settings?: PropertySettings;
}) {
  return (
    <article id="print-area" className="invoice-document">
      <header className="invoice-heading">
        <div className="invoice-issuer">
          <span className="invoice-eyebrow">PROPERTY MANAGEMENT</span>
          <h1>{property?.name || "หอพัก"}</h1>
          <p>{property?.address}</p>
          {property?.phone && <p>โทร. {property.phone}</p>}
        </div>
        <div className="invoice-title">
          <span className="invoice-eyebrow">INVOICE</span>
          <h2>ใบแจ้งหนี้</h2>
          {invoice.status === "void" && <p className="font-bold text-rose-700">ยกเลิกแล้ว / VOID</p>}
          <p className="invoice-number">{invoice.invoice_number}</p>
        </div>
      </header>

      <section className="invoice-parties">
        <div>
          <span className="invoice-label">เรียกเก็บจาก / BILL TO</span>
          <h3>{tenant?.full_name || "—"}</h3>
          <p>ห้อง {room?.room_number ?? "—"}{room?.floor ? ` · ชั้น ${room.floor}` : ""}</p>
          {tenant?.phone && <p>โทร. {tenant.phone}</p>}
        </div>
        <dl className="invoice-dates">
          <div><dt>วันที่ออกเอกสาร</dt><dd>{thaiDate(invoice.issued_at)}</dd></div>
          <div><dt>ครบกำหนดชำระ</dt><dd className="invoice-due">{thaiDate(invoice.due_at)}</dd></div>
          <div><dt>สกุลเงิน</dt><dd>บาท (THB)</dd></div>
        </dl>
      </section>

      <table className="invoice-lines">
        <thead><tr><th>ลำดับ</th><th>รายการเรียกเก็บ</th><th>จำนวนเงิน (บาท)</th></tr></thead>
        <tbody><tr><td>01</td><td><strong>ยอดเรียกเก็บตามใบแจ้งหนี้</strong><p>ห้อง {room?.room_number ?? "—"} · {invoice.invoice_number}</p></td><td>{money(Number(invoice.subtotal))}</td></tr></tbody>
      </table>

      <section className="invoice-summary">
        <div className="invoice-payment">
          <span className="invoice-label">ช่องทางชำระเงิน / PAYMENT</span>
          {(() => {
            const paymentInfo = parsePaymentSettings(settings);
            if (!paymentInfo.hasAny) {
              return <p>ติดต่อสำนักงานหอพักเพื่อชำระเงิน</p>;
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {paymentInfo.hasBank && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      {paymentInfo.bank && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={paymentInfo.bank.image}
                          alt={paymentInfo.bank.name}
                          style={{ width: "20px", height: "20px", objectFit: "contain" }}
                        />
                      )}
                      <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{paymentInfo.bank?.name || "บัญชีธนาคาร"}</h3>
                    </div>
                    <p className="invoice-account">{paymentInfo.bankAccountNo}</p>
                    {paymentInfo.bankAccountName && <p>ชื่อบัญชี {paymentInfo.bankAccountName}</p>}
                  </div>
                )}
                {paymentInfo.hasPromptpay && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/bank/พร้อมเพย์.png"
                        alt="พร้อมเพย์"
                        style={{ width: "20px", height: "20px", objectFit: "contain" }}
                      />
                      <h3 style={{ margin: 0, fontSize: "0.95rem" }}>พร้อมเพย์ (PromptPay)</h3>
                    </div>
                    <p className="invoice-account">{paymentInfo.promptpayId}</p>
                    {paymentInfo.promptpayName && <p>ชื่อบัญชี {paymentInfo.promptpayName}</p>}
                  </div>
                )}
              </div>
            );
          })()}
          <p className="invoice-payment-hint">โปรดระบุเลขห้องและเลขที่ใบแจ้งหนี้เมื่อชำระเงิน</p>
        </div>
        <div className="invoice-totals">
          <div><span>ยอดรวมทั้งสิ้น</span><strong>{money(Number(invoice.total))}</strong></div>
          <div className="invoice-balance"><span>ยอดคงเหลือที่ต้องชำระ</span><strong>{money(Number(invoice.balance_due))}</strong><small>บาท / THB</small></div>
        </div>
      </section>

      {invoice.note && <section className="invoice-note"><span className="invoice-label">หมายเหตุ</span><p>{invoice.note}</p></section>}
      <footer className="invoice-footer"><span>ขอบคุณที่ชำระเงินตรงเวลา</span><span>เอกสารนี้เป็นใบแจ้งหนี้ ไม่ใช่ใบเสร็จรับเงิน</span></footer>
    </article>
  );
}
