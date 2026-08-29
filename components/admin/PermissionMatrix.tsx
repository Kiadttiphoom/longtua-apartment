"use client";

import { useEffect, useMemo, useState } from "react";
import { saveRoleMenuActionsAction, saveUserMenuActionsAction, updateMembershipRoleAction } from "@/app/(admin)/admin/actions";

export type ActionOption = { code: string; name: string };
export type MenuOption = { id: string; code: string; label: string; actionCodes: string[] };
export type RoleOption = { id: string; code: string; name: string; values: Record<string, boolean> };
export type UserOption = { id: string; username: string; name: string; roleCode: string; roleName: string; values: Record<string, "inherit" | "allow" | "deny"> };

function useDirtyWarning(dirty: boolean) {
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
}

function changeLocation(url: string, dirty: boolean) {
  if (!dirty || window.confirm("มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?")) window.location.href = url;
}

export function RolePermissionMatrix({ menus, actions, roles, selectedRoleId }: { menus: MenuOption[]; actions: ActionOption[]; roles: RoleOption[]; selectedRoleId: string }) {
  const role = roles.find((item) => item.id === selectedRoleId) ?? roles[0];
  const [values, setValues] = useState<Record<string, boolean>>(role?.values ?? {}), [dirty, setDirty] = useState(false);
  useDirtyWarning(dirty);
  const locked = !role || role.code === "super_admin";
  const supported = (menu: MenuOption, actionCode: string) => menu.actionCodes.includes(actionCode);
  const setCell = (menu: MenuOption, actionCode: string, checked: boolean) => {
    setValues((current) => {
      const next = { ...current, [`${menu.id}:${actionCode}`]: checked };
      if (checked) { if (supported(menu, "menu_view")) next[`${menu.id}:menu_view`] = true; if (supported(menu, "view")) next[`${menu.id}:view`] = true; }
      if (!checked && ["menu_view", "view"].includes(actionCode)) for (const code of menu.actionCodes) next[`${menu.id}:${code}`] = false;
      return next;
    });
    setDirty(true);
  };
  const rows = useMemo(() => menus.flatMap((menu) => menu.actionCodes.map((actionCode) => ({ menuId: menu.id, actionCode, isAllowed: Boolean(values[`${menu.id}:${actionCode}`]) }))), [menus, values]);
  return <div className="admin-permission-manager">
    <div className="admin-permission-toolbar"><label>Role<select value={role?.id ?? ""} onChange={(event) => changeLocation(`/admin/permissions?role=${event.target.value}`, dirty)}>{roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>คัดลอกสิทธิ์จาก Role<select disabled={locked} defaultValue="" onChange={(event) => { const source = roles.find((item) => item.id === event.target.value); if (source) { setValues(source.values); setDirty(true); } }}><option value="">เลือก Role</option>{roles.filter((item) => item.id !== role?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    {locked ? <div className="admin-notice success">Super Admin ได้รับสิทธิ์ทั้งหมดอัตโนมัติและล็อก Matrix ไว้</div> : null}
    <form action={saveRoleMenuActionsAction} onSubmit={() => setDirty(false)}><input type="hidden" name="roleId" value={role?.id ?? ""} /><input type="hidden" name="values" value={JSON.stringify(rows)} />
      <div className="admin-table-wrap"><table className="admin-permission-table"><thead><tr><th>เมนู</th>{actions.map((action) => <th key={action.code}><button type="button" disabled={locked} onClick={() => { const targets = menus.filter((menu) => supported(menu, action.code)); const checked = !targets.every((menu) => values[`${menu.id}:${action.code}`]); for (const menu of targets) setCell(menu, action.code, checked); }}>{action.name}</button></th>)}</tr></thead><tbody>{menus.map((menu) => <tr key={menu.id}><th><label><input type="checkbox" disabled={locked} checked={menu.actionCodes.every((code) => Boolean(values[`${menu.id}:${code}`]))} onChange={(event) => { for (const code of menu.actionCodes) setCell(menu, code, event.target.checked); }} /><span>{menu.label}<small>{menu.code}</small></span></label></th>{actions.map((action) => <td key={action.code}>{supported(menu, action.code) ? <input type="checkbox" disabled={locked} aria-label={`${menu.label} ${action.name}`} checked={Boolean(values[`${menu.id}:${action.code}`])} onChange={(event) => setCell(menu, action.code, event.target.checked)} /> : <span>—</span>}</td>)}</tr>)}</tbody></table></div>
      {!locked ? <div className="admin-sticky-save"><span>{dirty ? "มีการแก้ไขที่ยังไม่ได้บันทึก" : "ข้อมูลเป็นปัจจุบัน"}</span><button type="submit">บันทึกสิทธิ์ Role</button></div> : null}
    </form>
  </div>;
}

export function UserPermissionMatrix({ menus, actions, organizations, organizationRoles, selectedOrganizationId, users, selectedUserId }: { menus: MenuOption[]; actions: ActionOption[]; organizations: Array<{ id: string; name: string }>; organizationRoles: Array<{ code: string; name: string }>; selectedOrganizationId: string; users: UserOption[]; selectedUserId: string }) {
  const user = users.find((item) => item.id === selectedUserId) ?? users[0];
  const [values, setValues] = useState<Record<string, "inherit" | "allow" | "deny">>(user?.values ?? {}), [dirty, setDirty] = useState(false);
  useDirtyWarning(dirty);
  const rows = useMemo(() => menus.flatMap((menu) => menu.actionCodes.map((actionCode) => ({ menuId: menu.id, actionCode, mode: values[`${menu.id}:${actionCode}`] ?? "inherit" }))), [menus, values]);
  return <div className="admin-permission-manager"><div className="admin-permission-toolbar"><label>กิจการ<select value={selectedOrganizationId} onChange={(event) => changeLocation(`/admin/permissions?mode=user&organization=${event.target.value}`, dirty)}>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>ผู้ใช้งาน<select value={user?.id ?? ""} onChange={(event) => changeLocation(`/admin/permissions?mode=user&organization=${selectedOrganizationId}&user=${event.target.value}`, dirty)}>{users.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.username}</option>)}</select></label>{user ? user.roleCode === "owner" ? <p>Role: <strong>{user.roleName}</strong> (เจ้าของกิจการ)</p> : <form action={updateMembershipRoleAction} className="admin-role-assignment"><input type="hidden" name="organizationId" value={selectedOrganizationId} /><input type="hidden" name="userId" value={user.id} /><label>Role<select name="roleCode" defaultValue={user.roleCode}>{organizationRoles.filter((item) => item.code !== "owner").map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><button type="submit">เปลี่ยน Role</button></form> : null}</div>
    {!user ? <p className="admin-empty">กิจการนี้ยังไม่มีสมาชิกที่ Active</p> : <form action={saveUserMenuActionsAction} onSubmit={() => setDirty(false)}><input type="hidden" name="organizationId" value={selectedOrganizationId} /><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="values" value={JSON.stringify(rows)} />
      <div className="admin-table-wrap"><table className="admin-permission-table override"><thead><tr><th>เมนู</th>{actions.map((action) => <th key={action.code}>{action.name}</th>)}</tr></thead><tbody>{menus.map((menu) => <tr key={menu.id}><th><span>{menu.label}<small>{menu.code}</small></span></th>{actions.map((action) => { const enabled = menu.actionCodes.includes(action.code), key = `${menu.id}:${action.code}`; return <td key={action.code}>{enabled ? <select aria-label={`${menu.label} ${action.name}`} value={values[key] ?? "inherit"} onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value as "inherit" | "allow" | "deny" })); setDirty(true); }}><option value="inherit">ตาม Role</option><option value="allow">อนุญาต</option><option value="deny">ปฏิเสธ</option></select> : <span>—</span>}</td>; })}</tr>)}</tbody></table></div>
      <div className="admin-sticky-save"><button type="button" className="secondary" onClick={() => { setValues({}); setDirty(true); }}>คืนค่าตาม Role ทั้งหมด</button><span>{dirty ? "มีการแก้ไขที่ยังไม่ได้บันทึก" : "ข้อมูลเป็นปัจจุบัน"}</span><button type="submit">บันทึก Override</button></div>
    </form>}
  </div>;
}
