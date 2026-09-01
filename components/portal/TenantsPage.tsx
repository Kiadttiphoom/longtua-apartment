"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, ListFilter, Mail, MapPin, Pencil, Phone, UserRound, UserRoundCheck } from "lucide-react";
import { createTenantAction, updateTenantAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  PortalForm,
  SelectField,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import type { Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";
import { validateTenant } from "@/lib/portal/validation.mjs";

export function TenantsPage({
  organizationId,
  items,
  portalAccounts,
  canCreate,
  canEdit,
}: {
  organizationId: string;
  items: Tenant[];
  portalAccounts: TenantPortalAccountSummary[];
  canCreate: boolean;
  canEdit: boolean;
}) {
  const [selected, setSelected] = useState<Tenant | "create" | null>(null);
  const [portalTarget, setPortalTarget] = useState<Tenant | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const editing = selected && selected !== "create" ? selected : null;
  const accountMap = useMemo(
    () => new Map(portalAccounts.map((account) => [account.tenantId, account])),
    [portalAccounts]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return items.filter(
      (item) =>
        (status === "all" || item.status === status) &&
        (!keyword ||
          [item.full_name, item.phone, item.email, item.address].some((value) =>
            value?.toLocaleLowerCase("th").includes(keyword)
          ))
    );
  }, [items, query, status]);

  return (
    <>
      <PageHeader
        actionLabel={canCreate ? "เพิ่มผู้เช่า" : undefined}
        description="ทะเบียนผู้เช่า ข้อมูลติดต่อ และสถานะผู้พักอาศัย"
        onAction={() => setSelected("create")}
        title="ผู้เช่า"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>{items.length.toLocaleString("th-TH")}</strong>
          <span>ผู้เช่าทั้งหมด</span>
        </div>
        <div>
          <strong>
            {items.filter((item) => item.status === "active").length.toLocaleString("th-TH")}
          </strong>
          <span>กำลังใช้งาน</span>
        </div>
        <div>
          <strong>
            {items.filter((item) => item.status === "former").length.toLocaleString("th-TH")}
          </strong>
          <span>ผู้เช่าเดิม</span>
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${items.length.toLocaleString("th-TH")} คน`}
        filter={{
          label: "กรองสถานะผู้เช่า",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "ใช้งาน" },
            { value: "former", label: "ผู้เช่าเดิม" },
            { value: "blocked", label: "ระงับ" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาชื่อ เบอร์โทร อีเมล หรือที่อยู่"
        query={query}
        title="รายชื่อผู้เช่า"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="portal-table-wrap">
            <DataTable
              headers={[
                "ชื่อผู้เช่า / เลขบัตร",
                "เบอร์โทรศัพท์ / อีเมล",
                "ที่อยู่",
                "บัญชีเข้าใช้",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const account = accountMap.get(item.id);
                return [
                  <div className="portal-tenant-table-cell" key="name">
                    <span className="portal-tenant-avatar-pill">
                      <UserRound size={16} />
                    </span>
                    <div>
                      <strong>{item.full_name}</strong>
                      <small>
                        {item.id_card_last4
                          ? `บัตร ปชช. •••• ${item.id_card_last4}`
                          : "ไม่ระบุบัตร ปชช."}
                      </small>
                    </div>
                  </div>,
                  <div className="portal-tenant-contact-cell" key="contact">
                    <span>{item.phone ? `โทร. ${item.phone}` : "ไม่มีเบอร์โทร"}</span>
                    <small>{item.email || "ไม่มีอีเมล"}</small>
                  </div>,
                  <span key="addr" style={{ fontSize: "12px", color: "#475569" }}>
                    {item.address || "—"}
                  </span>,
                  <div className="portal-tenant-account-cell" key="account">
                    {account ? (
                      <span className="account-badge active">
                        <UserRoundCheck size={13} />
                        {account.username}
                      </span>
                    ) : (
                      <span className="account-badge none">ยังไม่มีบัญชี</span>
                    )}
                  </div>,
                  <StatusBadge key="status" status={item.status} />,
                  <div className="portal-table-actions" key="actions">
                    <button
                      className="portal-table-action-btn account"
                      onClick={() => setPortalTarget(item)}
                      title={account ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                      type="button"
                    >
                      <UserRoundCheck size={14} />
                      <span>{account ? "จัดการ" : "สร้างบัญชี"}</span>
                    </button>
                    {canEdit ? (
                      <button
                        className="portal-table-action-btn edit"
                        onClick={() => setSelected(item)}
                        title="แก้ไขข้อมูลผู้เช่า"
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                    ) : null}
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          <section className="portal-collection-grid">
            {filtered.map((item) => {
              const account = accountMap.get(item.id);
              return (
                <article className="portal-record-card" key={item.id}>
                  <header>
                    <span className="portal-record-icon">
                      <UserRound aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <h2>{item.full_name}</h2>
                      <small>
                        {item.id_card_last4
                          ? `บัตรประชาชน •••• ${item.id_card_last4}`
                          : "ยังไม่ได้เก็บข้อมูลบัตรประชาชน"}
                      </small>
                    </div>
                    <StatusBadge status={item.status} />
                  </header>

                  <div className="portal-record-details">
                    <p>
                      <Phone aria-hidden="true" size={15} />
                      <span>{item.phone || "ยังไม่มีเบอร์โทรศัพท์"}</span>
                    </p>
                    <p>
                      <Mail aria-hidden="true" size={15} />
                      <span>{item.email || "ยังไม่มีอีเมล"}</span>
                    </p>
                    <p>
                      <MapPin aria-hidden="true" size={15} />
                      <span>{item.address || "ยังไม่มีที่อยู่"}</span>
                    </p>
                  </div>

                  <footer className="portal-lease-card-footer">
                    <div className="portal-lease-card-meta-row">
                      <span>
                        {account
                          ? `บัญชีผู้เช่า: ${account.username}`
                          : "ยังไม่มีบัญชี Tenant Portal"}
                      </span>
                    </div>
                    <div className="portal-lease-card-actions-grid">
                      <button
                        aria-label={`${account ? "จัดการ" : "เปิด"}บัญชี Tenant Portal ให้ ${item.full_name}`}
                        className="portal-lease-card-btn account"
                        onClick={() => setPortalTarget(item)}
                        title={account ? "จัดการบัญชีผู้เช่า" : "เปิดบัญชีผู้เช่า"}
                        type="button"
                      >
                        <UserRoundCheck size={15} />
                        <span>{account ? "จัดการบัญชี" : "สร้างบัญชี"}</span>
                      </button>
                      {canEdit ? (
                        <button
                          className="portal-lease-card-btn edit"
                          onClick={() => setSelected(item)}
                          title="แก้ไขผู้เช่า"
                          type="button"
                        >
                          <Pencil size={15} />
                          <span>แก้ไขข้อมูล</span>
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
            items.length
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
              : "เพิ่มผู้เช่าก่อนนำไปผูกกับห้องพักในสัญญาเช่า"
          }
          title={items.length ? "ไม่พบผู้เช่าที่ค้นหา" : "ยังไม่มีผู้เช่า"}
        />
      )}

      {selected ? (
        <Modal
          description="ข้อมูลที่จำเป็นต่อการติดต่อและจัดทำสัญญา"
          onClose={() => setSelected(null)}
          title={editing ? "แก้ไขผู้เช่า" : "เพิ่มผู้เช่า"}
        >
          <PortalForm
            action={editing ? updateTenantAction : createTenantAction}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มผู้เช่า"}
            validate={validateTenant}
          >
            {(errors, clear) => (
              <>
                {editing ? <input name="tenantId" type="hidden" value={editing.id} /> : null}
                <Field
                  clear={clear}
                  defaultValue={editing?.full_name}
                  error={errors.fullName}
                  label="ชื่อ-นามสกุล"
                  name="fullName"
                  required
                />
                <div className="portal-form-grid">
                  <Field
                    clear={clear}
                    defaultValue={editing?.phone}
                    error={errors.phone}
                    label="โทรศัพท์"
                    name="phone"
                  />
                  <Field
                    clear={clear}
                    defaultValue={editing?.email}
                    error={errors.email}
                    label="อีเมล"
                    name="email"
                    type="email"
                  />
                </div>
                <div className="portal-form-grid">
                  <Field
                    clear={clear}
                    defaultValue={editing?.id_card_last4}
                    error={errors.idCardLast4}
                    label="เลขบัตรประชาชน 4 ตัวท้าย"
                    name="idCardLast4"
                  />
                  {editing ? (
                    <SelectField
                      clear={clear}
                      defaultValue={editing.status}
                      error={errors.status}
                      label="สถานะ"
                      name="status"
                      options={[
                        { value: "active", label: "ใช้งาน" },
                        { value: "former", label: "ผู้เช่าเดิม" },
                        { value: "blocked", label: "ระงับ" },
                      ]}
                    />
                  ) : null}
                </div>
                <Field
                  clear={clear}
                  defaultValue={editing?.address}
                  error={errors.address}
                  label="ที่อยู่"
                  name="address"
                />
              </>
            )}
          </PortalForm>
        </Modal>
      ) : null}

      {portalTarget ? (
        <TenantPortalAccountModal
          account={accountMap.get(portalTarget.id)}
          onClose={() => setPortalTarget(null)}
          organizationId={organizationId}
          tenant={portalTarget}
        />
      ) : null}
    </>
  );
}
