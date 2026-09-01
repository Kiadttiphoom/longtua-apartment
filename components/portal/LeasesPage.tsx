"use client";

import { useMemo, useState } from "react";
import {
  Building2, CalendarCheck, CalendarRange, Eye, FileText, Home,
  LayoutGrid, List, Pencil, Plus, Printer, ShieldCheck, UserRound, UserRoundCheck, UsersRound, X,
} from "lucide-react";
import { createLeaseAction, updateLeaseAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable, EditButton, EmptyState, Field, Modal, PageHeader,
  PortalForm, SelectField, StatusBadge,
} from "@/components/portal/PortalUI";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import { money, thaiBahtText, thaiDate } from "@/lib/format";
import type { Lease, Property, Room, Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";
import { validateLease } from "@/lib/portal/validation.mjs";

type LeasePortalTarget = { lease: Lease; tenant: Tenant; room?: Room };
type ViewingLeaseTarget = {
  lease: Lease;
  tenant?: Tenant;
  room?: Room;
  propertyName?: string;
};

export function LeasesPage({
  organizationId,
  leases,
  properties,
  rooms,
  tenants,
  portalAccounts,
  canCreate,
  canEdit,
  canManageTenantPortal,
}: {
  organizationId: string;
  leases: Lease[];
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  portalAccounts: TenantPortalAccountSummary[];
  canCreate: boolean;
  canEdit: boolean;
  canManageTenantPortal: boolean;
}) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<Lease | "create" | null>(null);
  const [viewingLease, setViewingLease] = useState<ViewingLeaseTarget | null>(null);
  const [portalTarget, setPortalTarget] = useState<LeasePortalTarget | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const editing = selected && selected !== "create" ? selected : null;
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const tenantById = useMemo(() => new Map(tenants.map((item) => [item.id, item])), [tenants]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item.full_name])), [tenants]);
  const portalAccountMap = useMemo(
    () => new Map(portalAccounts.map((account) => [account.tenantId, account])),
    [portalAccounts]
  );
  const availableRooms = rooms.filter(
    (room) => room.status === "vacant" && (!propertyId || room.property_id === propertyId)
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return leases.filter((item) => {
      const room = roomMap.get(item.room_id);
      return (
        (status === "all" || item.status === status) &&
        (!keyword ||
          [
            item.lease_number,
            propertyMap.get(item.property_id),
            room?.room_number,
            tenantMap.get(item.primary_tenant_id),
            item.terms,
          ].some((value) => value?.toLocaleLowerCase("th").includes(keyword)))
      );
    });
  }, [leases, propertyMap, query, roomMap, status, tenantMap]);

  return (
    <>
      <PageHeader
        actionLabel={canCreate ? "สร้างสัญญา" : undefined}
        description="จัดการเงื่อนไขสัญญา ผู้เช่า ห้องพัก เงินประกัน และช่วงเวลาเช่า"
        onAction={() => {
          setSelected("create");
          setPropertyId("");
        }}
        title="สัญญาเช่า"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>{leases.length.toLocaleString("th-TH")}</strong>
          <span>สัญญาทั้งหมด</span>
        </div>
        <div>
          <strong>{leases.filter((item) => item.status === "active").length.toLocaleString("th-TH")}</strong>
          <span>กำลังใช้งาน</span>
        </div>
        <div>
          <strong>{leases.filter((item) => item.status === "draft").length.toLocaleString("th-TH")}</strong>
          <span>ฉบับร่าง</span>
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
              <List size={15} />
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} ฉบับ`}
        filter={{
          label: "กรองสถานะสัญญา",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "มีผลอยู่" },
            { value: "draft", label: "ฉบับร่าง" },
            { value: "ended", label: "สิ้นสุด" },
            { value: "cancelled", label: "ยกเลิก" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขสัญญา หอ ห้อง ผู้เช่า หรือข้อตกลง"
        query={query}
        title="รายการสัญญา"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <DataTable
            emptyDescription="สร้างสัญญาเช่าเพื่อเริ่มผูกห้องพักและผู้เช่า"
            emptyTitle="ไม่พบสัญญาเช่า"
            headers={[
              "เลขที่สัญญา",
              "ห้อง / ผู้เช่า",
              "ระยะเวลาสัญญา",
              "ค่าเช่า / ประกัน",
              "ข้อตกลงพิเศษ",
              "สถานะ",
              "การจัดการ",
            ]}
            rows={filtered.map((item) => {
              const room = roomMap.get(item.room_id);
              const tenant = tenantById.get(item.primary_tenant_id);
              const account = portalAccountMap.get(item.primary_tenant_id);
              const propName = propertyMap.get(item.property_id);

              return [
                // 1. เลขที่สัญญา
                <strong key="lease_number">{item.lease_number}</strong>,

                // 2. ห้อง / ผู้เช่า
                <div className="portal-lease-room-cell" key="room_tenant">
                  <span className="portal-lease-room-pill">{room?.room_number ?? "—"}</span>
                  <div className="portal-lease-tenant-meta">
                    <strong>{tenant?.full_name ?? "—"}</strong>
                    <small>{tenant?.phone ? `โทร. ${tenant.phone}` : "—"}</small>
                  </div>
                </div>,

                // 3. ระยะเวลาสัญญา
                <div className="portal-lease-date-meta" key="dates">
                  <strong>{thaiDate(item.start_date)}</strong>
                  <small>{item.end_date ? `ถึง ${thaiDate(item.end_date)}` : "ไม่ระบุวันสิ้นสุด"}</small>
                </div>,

                // 4. ค่าเช่า / ประกัน
                <div className="portal-lease-financial-meta" key="financials">
                  <strong>{money(Number(item.rent_amount))}/ด.</strong>
                  <small>ประกัน {money(Number(item.deposit_amount))}</small>
                </div>,

                // 5. ข้อตกลงพิเศษ
                <div className="portal-lease-terms-cell" key="terms" title={item.terms || undefined}>
                  {item.terms || "—"}
                </div>,

                // 6. สถานะ
                <span className={`portal-lease-status-dot ${item.status}`} key="status">
                  {item.status === "active"
                    ? "มีผลอยู่"
                    : item.status === "draft"
                    ? "ฉบับร่าง"
                    : item.status === "ended"
                    ? "สิ้นสุด"
                    : "ยกเลิก"}
                </span>,

                // 7. การจัดการ
                <div className="portal-lease-actions" key="actions">
                  <button
                    className="portal-table-action-btn view"
                    onClick={() =>
                      setViewingLease({
                        lease: item,
                        tenant,
                        room,
                        propertyName: propName,
                      })
                    }
                    title="ดูรายละเอียดสัญญา"
                    type="button"
                  >
                    <FileText size={14} />
                    <span>ดูสัญญา</span>
                  </button>
                  <button
                    className="portal-table-action-btn print"
                    onClick={() => {
                      setViewingLease({
                        lease: item,
                        tenant,
                        room,
                        propertyName: propName,
                      });
                      setTimeout(() => window.print(), 150);
                    }}
                    title="พิมพ์สัญญาเช่า"
                    type="button"
                  >
                    <Printer size={14} />
                    <span>พิมพ์</span>
                  </button>
                  {canEdit ? (
                    <button
                      className="portal-table-action-btn edit"
                      onClick={() => setSelected(item)}
                      title="แก้ไขสัญญา"
                      type="button"
                    >
                      <Pencil size={14} />
                      <span>แก้ไข</span>
                    </button>
                  ) : null}
                  {tenant && canManageTenantPortal && ["draft", "active"].includes(item.status) ? (
                    <button
                      aria-label={`${account ? "จัดการ" : "สร้าง"}บัญชีเข้าใช้ให้ ${tenant.full_name}`}
                      className="portal-table-action-btn account"
                      onClick={() => setPortalTarget({ lease: item, tenant, room })}
                      title={account ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                      type="button"
                    >
                      <UserRoundCheck size={14} />
                    </button>
                  ) : null}
                </div>,
              ];
            })}
          />
        ) : (
          <section className="portal-collection-grid">
            {filtered.map((item) => {
              const room = roomMap.get(item.room_id);
              const tenant = tenantById.get(item.primary_tenant_id);
              const account = portalAccountMap.get(item.primary_tenant_id);
              const propName = propertyMap.get(item.property_id);

              return (
                <article className="portal-lease-card" key={item.id}>
                  <header className="portal-lease-card-header">
                    <div>
                      <span className="portal-lease-room-pill">{room?.room_number ?? "—"}</span>
                      <div className="portal-lease-card-title">
                        <strong>{item.lease_number}</strong>
                        <small>{propName ?? "หอพัก"}</small>
                      </div>
                    </div>
                    <span className={`portal-lease-status-dot ${item.status}`}>
                      {item.status === "active"
                        ? "มีผลอยู่"
                        : item.status === "draft"
                        ? "ฉบับร่าง"
                        : item.status === "ended"
                        ? "สิ้นสุด"
                        : "ยกเลิก"}
                    </span>
                  </header>

                  <div className="portal-lease-card-tenant">
                    <div className="portal-lease-card-tenant-info">
                      <strong>{tenant?.full_name ?? "—"}</strong>
                      <small>{tenant?.phone ? `โทร. ${tenant.phone}` : "ยังไม่มีเบอร์โทร"}</small>
                    </div>
                    <span className="portal-lease-card-occupants">
                      <UsersRound size={13} /> {item.occupant_count} คน
                    </span>
                  </div>

                  <div className="portal-lease-card-grid">
                    <div className="portal-lease-card-grid-item">
                      <span>ค่าเช่า / ประกัน</span>
                      <strong>
                        {money(Number(item.rent_amount))}/ด.
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400, marginLeft: 4 }}>
                          (ประกัน {money(Number(item.deposit_amount))})
                        </span>
                      </strong>
                    </div>
                    <div className="portal-lease-card-grid-item">
                      <span>ระยะเวลาสัญญา</span>
                      <strong>
                        {thaiDate(item.start_date)}
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400, display: "block" }}>
                          ถึง {item.end_date ? thaiDate(item.end_date) : "ไม่ระบุ"}
                        </span>
                      </strong>
                    </div>
                  </div>

                  {item.terms ? (
                    <div className="portal-lease-card-terms">
                      <strong>ข้อตกลงพิเศษ:</strong> {item.terms}
                    </div>
                  ) : null}

                  <footer className="portal-lease-card-footer">
                    <div className="portal-lease-card-meta-row">
                      <span>
                        {account ? `บัญชีผู้เช่า: ${account.username || "เปิดแล้ว"}` : `ค่าเช่าล่วงหน้า: ${money(Number(item.advance_amount))}`}
                      </span>
                    </div>
                    <div className="portal-lease-card-actions-grid">
                      <button
                        className="portal-lease-card-btn view"
                        onClick={() =>
                          setViewingLease({
                            lease: item,
                            tenant,
                            room,
                            propertyName: propName,
                          })
                        }
                        title="ดูรายละเอียดสัญญา"
                        type="button"
                      >
                        <FileText size={15} />
                        <span>ดูสัญญา</span>
                      </button>
                      <button
                        className="portal-lease-card-btn print"
                        onClick={() => {
                          setViewingLease({
                            lease: item,
                            tenant,
                            room,
                            propertyName: propName,
                          });
                          setTimeout(() => window.print(), 150);
                        }}
                        title="พิมพ์สัญญาเช่า"
                        type="button"
                      >
                        <Printer size={15} />
                        <span>พิมพ์</span>
                      </button>
                      {canEdit ? (
                        <button
                          className="portal-lease-card-btn edit"
                          onClick={() => setSelected(item)}
                          title="แก้ไขสัญญา"
                          type="button"
                        >
                          <Pencil size={15} />
                          <span>แก้ไข</span>
                        </button>
                      ) : null}
                      {tenant && canManageTenantPortal && ["draft", "active"].includes(item.status) ? (
                        <button
                          aria-label={`${account ? "จัดการ" : "สร้าง"}บัญชีเข้าใช้ให้ ${tenant.full_name}`}
                          className="portal-lease-card-btn account"
                          onClick={() => setPortalTarget({ lease: item, tenant, room })}
                          title={account ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                          type="button"
                        >
                          <UserRoundCheck size={15} />
                          <span>{account ? "จัดการบัญชี" : "สร้างบัญชี"}</span>
                        </button>
                      ) : null}
                    </div>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <EmptyState
          description={
            leases.length
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
              : "ต้องมีห้องว่างและข้อมูลผู้เช่าก่อนจึงจะสร้างสัญญาได้"
          }
          title={leases.length ? "ไม่พบสัญญาที่ค้นหา" : "ยังไม่มีสัญญาเช่า"}
        />
      )}

      {/* Modal: View Contract Summary & Print */}
      {viewingLease ? (
        <Modal
          className="contract-modal"
          headerActions={
            <>
              {canEdit ? (
                <button
                  className="portal-secondary"
                  onClick={() => {
                    const itemToEdit = viewingLease.lease;
                    setViewingLease(null);
                    setSelected(itemToEdit);
                  }}
                  style={{ minHeight: 34, height: 34, padding: "0 12px", fontSize: 12.5 }}
                  type="button"
                >
                  <Pencil size={14} /> แก้ไขสัญญา
                </button>
              ) : null}
              <button
                className="portal-primary"
                onClick={() => window.print()}
                style={{ minHeight: 34, height: 34, padding: "0 14px", fontSize: 12.5 }}
                type="button"
              >
                <Printer size={14} /> พิมพ์ / บันทึก PDF
              </button>
            </>
          }
          maxWidth={840}
          onClose={() => setViewingLease(null)}
          title={`สัญญาเช่า · ห้อง ${viewingLease.room?.room_number ?? "—"} · ${viewingLease.tenant?.full_name ?? "—"} (${viewingLease.lease.lease_number})`}
        >
          <div className="contract-paper" id="print-area">
            <div className="contract-official-header">
              <div className="contract-official-emblem">🏢</div>
              <h1 className="contract-official-title">สัญญาเช่าห้องพักอาศัย</h1>
              <div className="contract-official-sub">RESIDENTIAL LEASE AGREEMENT</div>
            </div>

            <div className="contract-meta-bar">
              <span><strong>เลขที่สัญญา:</strong> {viewingLease.lease.lease_number}</span>
              <span><strong>ทำขึ้น ณ:</strong> {viewingLease.propertyName ?? "อาคารที่พักอาศัย"}</span>
              <span><strong>วันที่ทำสัญญา:</strong> {thaiDate(viewingLease.lease.start_date)}</span>
            </div>

            <div className="contract-clause">
              <p>
                สัญญาเช่าฉบับนี้ทำขึ้นระหว่าง <strong>{viewingLease.propertyName ?? "ผู้ให้เช่า"}</strong> (ผู้ให้เช่า)
                ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>&quot;ผู้ให้เช่า&quot;</strong> ฝ่ายหนึ่ง
              </p>
              <p style={{ marginTop: 8 }}>
                กับ <strong>{viewingLease.tenant?.full_name || "...................................................."}</strong> (ผู้เช่า)
                {viewingLease.tenant?.id_card_last4 ? ` เลขประจำตัวประชาชน •••• ${viewingLease.tenant.id_card_last4}` : ""}
                {viewingLease.tenant?.phone ? ` โทรศัพท์ ${viewingLease.tenant.phone}` : ""}
                ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>&quot;ผู้เช่า&quot;</strong> อีกฝ่ายหนึ่ง
              </p>
              <p style={{ marginTop: 8 }}>
                คู่สัญญาทั้งสองฝ่ายตกลงยินยอมทำสัญญาเช่าห้องพักอาศัย โดยมีข้อความและเงื่อนไขถูกต้องตรงกันดังต่อไปนี้:
              </p>
            </div>

            <div className="contract-clause">
              <h4>ข้อ ๑. ทรัพย์สินที่เช่าและวัตถุประสงค์</h4>
              <p>
                ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักหมายเลข <strong>{viewingLease.room?.room_number ?? "—"}</strong> ณ อาคาร {viewingLease.propertyName ?? "ที่พักอาศัย"}
                พร้อมด้วยเครื่องเรือน เฟอร์นิเจอร์ และอุปกรณ์ติดตั้งภายในห้องพักตามรายการตรวจรับ เพื่อใช้เป็นที่พักอาศัยโดยชอบด้วยกฎหมายเท่านั้น
                ห้ามนำไปใช้เพื่อประกอบการค้า ธุรกิจ หรือการกระทำอื่นใดที่ผิดกฎหมายหรือขัดต่อความสงบเรียบร้อย (จำนวนผู้พักอาศัย {viewingLease.lease.occupant_count} คน)
              </p>
            </div>

            <div className="contract-clause">
              <h4>ข้อ ๒. กำหนดระยะเวลาการเช่า</h4>
              <p>
                มีกำหนดเวลาเช่าตั้งแต่วันที่ <strong>{thaiDate(viewingLease.lease.start_date)}</strong> ถึงวันที่ <strong>{viewingLease.lease.end_date ? thaiDate(viewingLease.lease.end_date) : "ไม่ระบุวันสิ้นสุด"}</strong>
                เมื่อครบกำหนดตามสัญญานี้ หากผู้เช่าประสงค์จะต่ออายุสัญญาเช่า จะต้องแจ้งให้ผู้ให้เช่าทราบเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า ๓๐ (สามสิบ) วันก่อนสัญญาเช่าสิ้นสุด
              </p>
            </div>

            <div className="contract-clause">
              <h4>ข้อ ๓. อัตราค่าเช่าและกำหนดเวลาชำระ</h4>
              <p>
                ผู้เช่าตกลงชำระค่าเช่าห้องพักในอัตราเดือนละ <strong>฿{Number(viewingLease.lease.rent_amount).toLocaleString()} บาท ({thaiBahtText(Number(viewingLease.lease.rent_amount))})</strong>
                โดยต้องชำระล่วงหน้าตามรอบบิลที่กำหนด
              </p>
            </div>

            <div className="contract-clause">
              <h4>ข้อ ๔. เงินประกันความเสียหายและค่าเช่าล่วงหน้า</h4>
              <p>
                ในวันทำสัญญานี้ ผู้เช่าได้วางเงินประกันความเสียหายจำนวน <strong>฿{Number(viewingLease.lease.deposit_amount).toLocaleString()} บาท ({thaiBahtText(Number(viewingLease.lease.deposit_amount))})</strong>
                และค่าเช่าล่วงหน้าจำนวน <strong>฿{Number(viewingLease.lease.advance_amount).toLocaleString()} บาท ({thaiBahtText(Number(viewingLease.lease.advance_amount))})</strong> ให้แก่ผู้ให้เช่าไว้เรียบร้อยแล้ว
              </p>
              <p style={{ marginTop: 4 }}>
                เงินประกันดังกล่าว ผู้ให้เช่าจะคืนให้แก่ผู้เช่าภายหลังหักค่าใช้จ่ายค้างชำระ ค่าซ่อมแซมความเสียหายของห้องพักและทรัพย์สิน (ถ้ามี)
                ภายในกำหนดเวลาไม่เกิน ๓๐ วัน นับแต่วันที่ผู้เช่าได้ส่งมอบห้องพักคืนในสภาพเรียบร้อย
              </p>
            </div>

            <div className="contract-clause">
              <h4>ข้อ ๕. ค่าสาธารณูปโภคและค่าบริการ</h4>
              <p>
                ผู้เช่าตกลงชำระค่ากระแสไฟฟ้าและค่าน้ำประปาตามอัตราที่ผู้ให้เช่ากำหนดและเรียกเก็บในใบแจ้งหนี้ประจำเดือน
              </p>
            </div>

            <div className="contract-clause">
              <h4>ข้อ ๖. การดูแลรักษาห้องพักและทรัพย์สิน</h4>
              <p>
                ผู้เช่าสัญญาว่าจะดูแลรักษาห้องพักและทรัพย์สินภายในห้องพักให้อยู่ในสภาพเรียบร้อย สะอาด และปลอดภัยดั่งเช่นวิญญูชนพึงรักษาทรัพย์สินของตน
                ห้ามมิให้เจาะผนัง ดัดแปลง ต่อเติม หรือรื้อถอนส่วนประกอบใดๆ ของห้องพัก เว้นแต่จะได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า
              </p>
            </div>

            <div className="contract-clause">
              <h4>ข้อ ๗. ข้อห้ามและระเบียบการพักอาศัย</h4>
              <p>ผู้เช่าตกลงปฏิบัติตามกฎระเบียบของอาคารอย่างเคร่งครัด ดังนี้:</p>
              <ul>
                <li>ห้ามส่งเสียงดัง ก่อความรำคาญ หรือจัดงานสังสรรค์รบกวนผู้อื่นหลังเวลา ๒๒.๐๐ น.</li>
                <li>ห้ามนำสิ่งเสพติด วัตถุไวไฟ อาวุธ หรือสิ่งผิดกฎหมายทุกชนิดเข้ามาในบริเวณอาคาร</li>
                <li>ห้ามนำสัตว์เลี้ยงเข้ามาพักอาศัย เว้นแต่จะได้รับอนุญาตเป็นลายลักษณ์อักษร</li>
                <li>ห้ามนำห้องพักไปให้บุคคลอื่นเช่าช่วง หรือโอนสิทธิการเช่าให้แก่บุคคลภายนอก</li>
              </ul>
            </div>

            {viewingLease.lease.terms ? (
              <div className="contract-clause">
                <h4>ข้อ ๘. ข้อกำหนดและเงื่อนไขพิเศษเพิ่มเติม</h4>
                <p><strong>{viewingLease.lease.terms}</strong></p>
              </div>
            ) : null}

            <div className="contract-clause">
              <h4>ข้อ {viewingLease.lease.terms ? "๙" : "๘"}. การบอกเลิกสัญญา</h4>
              <p>
                หากผู้เช่าผิดนัดไม่ชำระค่าเช่าหรือค่าสาธารณูปโภคติดต่อกันเกินกว่า ๑๕ วัน หรือกระทำการฝ่าฝืนข้อกำหนดใดๆ ในสัญญานี้
                ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาเช่า ริบเงินประกันความเสียหาย และตัดสิทธิการเข้าออกห้องพักได้ทันที
              </p>
            </div>

            <div className="contract-clause" style={{ marginTop: 20 }}>
              <p>
                สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาได้อ่านและเข้าใจข้อความในสัญญานี้โดยละเอียดตลอดแล้ว
                จึงได้ลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน
              </p>
            </div>

            <div className="contract-signatures-grid">
              <div className="contract-sig-item">
                <p>ลงชื่อ ........................................................... ผู้ให้เช่า</p>
                <div className="sig-line" />
                <p><strong>( {viewingLease.propertyName || "ผู้มีอำนาจลงนาม / เจ้าของอาคาร"} )</strong></p>
                <p style={{ color: "#64748b", fontSize: 11 }}>ผู้มีอำนาจลงนาม / เจ้าของอาคาร</p>
              </div>

              <div className="contract-sig-item">
                <p>ลงชื่อ ........................................................... ผู้เช่า</p>
                <div className="sig-line" />
                <p><strong>( {viewingLease.tenant?.full_name || "...................................................."} )</strong></p>
                <p style={{ color: "#64748b", fontSize: 11 }}>ผู้เช่าห้องพักหมายเลข {viewingLease.room?.room_number ?? "—"}</p>
              </div>

              <div className="contract-sig-item">
                <p>ลงชื่อ ........................................................... พยาน</p>
                <div className="sig-line" />
                <p>( ........................................................... )</p>
              </div>

              <div className="contract-sig-item">
                <p>ลงชื่อ ........................................................... พยาน</p>
                <div className="sig-line" />
                <p>( ........................................................... )</p>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Modal: Create / Edit Lease */}
      {selected ? (
        <Modal
          description={
            editing
              ? "การเปลี่ยนห้องหรือผู้เช่าควรปิดสัญญาเดิมแล้วสร้างสัญญาใหม่"
              : "เลือกห้องว่างและผู้เช่า พร้อมระบุเงื่อนไขทางการเงิน"
          }
          onClose={() => setSelected(null)}
          title={editing ? `แก้ไขสัญญา ${editing.lease_number}` : "สร้างสัญญาเช่า"}
        >
          <PortalForm
            action={editing ? updateLeaseAction : createLeaseAction}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitLabel={editing ? "บันทึกการแก้ไข" : "สร้างสัญญา"}
            validate={validateLease}
          >
            {(errors, clear) => (
              <>
                {editing ? (
                  <>
                    <input name="leaseId" type="hidden" value={editing.id} />
                    <input name="propertyId" type="hidden" value={editing.property_id} />
                    <input name="roomId" type="hidden" value={editing.room_id} />
                    <input name="tenantId" type="hidden" value={editing.primary_tenant_id} />
                    <div className="portal-readonly-grid">
                      <div>
                        <span>หอ/ห้อง</span>
                        <strong>
                          {propertyMap.get(editing.property_id)} /{" "}
                          {roomMap.get(editing.room_id)?.room_number}
                        </strong>
                      </div>
                      <div>
                        <span>ผู้เช่า</span>
                        <strong>{tenantMap.get(editing.primary_tenant_id)}</strong>
                      </div>
                    </div>
                    <div className="portal-form-grid">
                      <Field
                        clear={clear}
                        defaultValue={editing.lease_number}
                        error={errors.leaseNumber}
                        label="เลขที่สัญญา"
                        name="leaseNumber"
                        required
                      />
                      <SelectField
                        clear={clear}
                        defaultValue={editing.status}
                        error={errors.status}
                        label="สถานะสัญญา"
                        name="status"
                        options={[
                          { value: "draft", label: "ฉบับร่าง" },
                          { value: "active", label: "มีผลอยู่" },
                          { value: "ended", label: "สิ้นสุด" },
                          { value: "cancelled", label: "ยกเลิก" },
                        ]}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <SelectField
                      clear={clear}
                      error={errors.propertyId}
                      label="หอพัก"
                      name="propertyId"
                      onChange={setPropertyId}
                      options={properties.map((item) => ({ value: item.id, label: item.name }))}
                      required
                    />
                    <div className="portal-form-grid">
                      <SelectField
                        clear={clear}
                        error={errors.roomId}
                        label="ห้องพัก"
                        name="roomId"
                        options={availableRooms.map((item) => ({
                          value: item.id,
                          label: `ห้อง ${item.room_number}`,
                        }))}
                        required
                      />
                      <SelectField
                        clear={clear}
                        error={errors.tenantId}
                        label="ผู้เช่า"
                        name="tenantId"
                        options={tenants
                          .filter((item) => item.status === "active")
                          .map((item) => ({ value: item.id, label: item.full_name }))}
                        required
                      />
                    </div>
                    <Field
                      clear={clear}
                      error={errors.leaseNumber}
                      label="เลขที่สัญญา"
                      name="leaseNumber"
                      required
                    />
                  </>
                )}

                <div className="portal-form-grid portal-form-grid-three">
                  <Field
                    clear={clear}
                    defaultValue={editing?.start_date}
                    error={errors.startDate}
                    label="วันเริ่มสัญญา"
                    name="startDate"
                    required
                    type="date"
                  />
                  <Field
                    clear={clear}
                    defaultValue={editing?.end_date}
                    error={errors.endDate}
                    label="วันสิ้นสุด"
                    name="endDate"
                    type="date"
                  />
                  <Field
                    clear={clear}
                    defaultValue={editing?.occupant_count ?? 1}
                    error={errors.occupantCount}
                    label="จำนวนผู้พัก (คน)"
                    max={50}
                    min={1}
                    name="occupantCount"
                    required
                    step="1"
                    type="number"
                  />
                </div>
                <div className="portal-form-grid portal-form-grid-three">
                  <Field
                    clear={clear}
                    defaultValue={editing?.rent_amount}
                    error={errors.rentAmount}
                    label="ค่าเช่าต่อเดือน"
                    min={0}
                    name="rentAmount"
                    required
                    step="0.01"
                    type="number"
                  />
                  <Field
                    clear={clear}
                    defaultValue={editing?.deposit_amount ?? 0}
                    error={errors.depositAmount}
                    label="เงินประกัน"
                    min={0}
                    name="depositAmount"
                    required
                    step="0.01"
                    type="number"
                  />
                  <Field
                    clear={clear}
                    defaultValue={editing?.advance_amount ?? 0}
                    error={errors.advanceAmount}
                    label="ค่าเช่าล่วงหน้า"
                    min={0}
                    name="advanceAmount"
                    required
                    step="0.01"
                    type="number"
                  />
                </div>
                <Field
                  clear={clear}
                  defaultValue={editing?.terms}
                  error={errors.terms}
                  label="เงื่อนไขเพิ่มเติม"
                  name="terms"
                />
                {editing ? (
                  <SelectField
                    clear={clear}
                    defaultValue={editing.status}
                    error={errors.status}
                    label="สถานะสัญญา"
                    name="status"
                    options={[
                      { value: "draft", label: "ฉบับร่าง" },
                      { value: "active", label: "มีผลอยู่" },
                      { value: "ended", label: "สิ้นสุด" },
                      { value: "cancelled", label: "ยกเลิก" },
                    ]}
                  />
                ) : null}
              </>
            )}
          </PortalForm>
        </Modal>
      ) : null}

      {portalTarget ? (
        <TenantPortalAccountModal
          account={portalAccountMap.get(portalTarget.tenant.id)}
          onClose={() => setPortalTarget(null)}
          organizationId={organizationId}
          roomNumber={portalTarget.room?.room_number}
          tenant={portalTarget.tenant}
        />
      ) : null}
    </>
  );
}
