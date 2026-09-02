"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { saveRoleMenuActionsAction, saveUserMenuActionsAction, updateMembershipRoleAction } from "@/app/(admin)/admin/actions";

export type ActionOption = { code: string; name: string };
export type MenuOption = { id: string; code: string; label: string; actionCodes: string[] };
export type RoleOption = { id: string; code: string; name: string; values: Record<string, boolean> };
export type UserOption = { id: string; username: string; name: string; roleCode: string; roleName: string; values: Record<string, "inherit" | "allow" | "deny"> };

function useDirtyWarning(dirty: boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

function changeLocation(url: string, dirty: boolean) {
  if (!dirty || window.confirm("มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?")) {
    window.location.href = url;
  }
}

export function RolePermissionMatrix({ menus, actions, roles, selectedRoleId }: { menus: MenuOption[]; actions: ActionOption[]; roles: RoleOption[]; selectedRoleId: string }) {
  const role = roles.find((item) => item.id === selectedRoleId) ?? roles[0];
  const [values, setValues] = useState<Record<string, boolean>>(role?.values ?? {});
  const [dirty, setDirty] = useState(false);
  useDirtyWarning(dirty);

  const locked = !role || role.code === "super_admin";
  const supported = (menu: MenuOption, actionCode: string) => menu.actionCodes.includes(actionCode);

  const setCell = (menu: MenuOption, actionCode: string, checked: boolean) => {
    setValues((current) => {
      const next = { ...current, [`${menu.id}:${actionCode}`]: checked };
      if (checked) {
        if (supported(menu, "menu_view")) next[`${menu.id}:menu_view`] = true;
        if (supported(menu, "view")) next[`${menu.id}:view`] = true;
      }
      if (!checked && ["menu_view", "view"].includes(actionCode)) {
        for (const code of menu.actionCodes) next[`${menu.id}:${code}`] = false;
      }
      return next;
    });
    setDirty(true);
  };

  const rows = useMemo(
    () =>
      menus.flatMap((menu) =>
        menu.actionCodes.map((actionCode) => ({
          menuId: menu.id,
          actionCode,
          isAllowed: Boolean(values[`${menu.id}:${actionCode}`]),
        }))
      ),
    [menus, values]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span>Role:</span>
          <select
            className="h-8 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
            onChange={(event) => changeLocation(`/admin/permissions?role=${event.target.value}`, dirty)}
            value={role?.id ?? ""}
          >
            {roles.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span>คัดลอกสิทธิ์จาก Role:</span>
          <select
            className="h-8 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal disabled:opacity-50"
            defaultValue=""
            disabled={locked}
            onChange={(event) => {
              const source = roles.find((item) => item.id === event.target.value);
              if (source) {
                setValues(source.values);
                setDirty(true);
              }
            }}
          >
            <option value="">เลือก Role</option>
            {roles.filter((item) => item.id !== role?.id).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      {locked ? (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          Super Admin ได้รับสิทธิ์ทั้งหมดอัตโนมัติและล็อก Matrix ไว้
        </div>
      ) : null}

      <form action={saveRoleMenuActionsAction} onSubmit={() => setDirty(false)}>
        <input name="roleId" type="hidden" value={role?.id ?? ""} />
        <input name="values" type="hidden" value={JSON.stringify(rows)} />

        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-[13px] border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">เมนู</th>
                {actions.map((action) => (
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center" key={action.code}>
                    <button
                      className="hover:text-blue-600 cursor-pointer disabled:cursor-default"
                      disabled={locked}
                      onClick={() => {
                        const targets = menus.filter((menu) => supported(menu, action.code));
                        const checked = !targets.every((menu) => values[`${menu.id}:${action.code}`]);
                        for (const menu of targets) setCell(menu, action.code, checked);
                      }}
                      type="button"
                    >
                      {action.name}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menus.map((menu) => (
                <tr className="hover:bg-slate-50/70 transition-colors" key={menu.id}>
                  <th className="px-4 py-3 align-middle font-normal text-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        checked={menu.actionCodes.every((code) => Boolean(values[`${menu.id}:${code}`]))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        disabled={locked}
                        onChange={(event) => {
                          for (const code of menu.actionCodes) setCell(menu, code, event.target.checked);
                        }}
                        type="checkbox"
                      />
                      <span>
                        <strong className="block text-xs font-semibold">{menu.label}</strong>
                        <small className="block text-[10px] text-slate-400">{menu.code}</small>
                      </span>
                    </label>
                  </th>
                  {actions.map((action) => (
                    <td className="px-4 py-3 align-middle text-center" key={action.code}>
                      {supported(menu, action.code) ? (
                        <input
                          aria-label={`${menu.label} ${action.name}`}
                          checked={Boolean(values[`${menu.id}:${action.code}`])}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                          disabled={locked}
                          onChange={(event) => setCell(menu, action.code, event.target.checked)}
                          type="checkbox"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!locked ? (
          <div className="sticky bottom-4 mt-4 p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xl">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              {dirty ? (
                <>
                  <AlertCircle size={15} className="text-amber-400" strokeWidth={2.2} />
                  <span>มีการแก้ไขที่ยังไม่ได้บันทึก</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} className="text-emerald-400" strokeWidth={2.2} />
                  <span>ข้อมูลเป็นปัจจุบัน</span>
                </>
              )}
            </span>
            <button
              className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              type="submit"
            >
              บันทึกสิทธิ์ Role
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

export function UserPermissionMatrix({ menus, actions, organizations, organizationRoles, selectedOrganizationId, users, selectedUserId }: { menus: MenuOption[]; actions: ActionOption[]; organizations: Array<{ id: string; name: string }>; organizationRoles: Array<{ code: string; name: string }>; selectedOrganizationId: string; users: UserOption[]; selectedUserId: string }) {
  const user = users.find((item) => item.id === selectedUserId) ?? users[0];
  const [values, setValues] = useState<Record<string, "inherit" | "allow" | "deny">>(user?.values ?? {});
  const [dirty, setDirty] = useState(false);
  useDirtyWarning(dirty);

  const rows = useMemo(
    () =>
      menus.flatMap((menu) =>
        menu.actionCodes.map((actionCode) => ({
          menuId: menu.id,
          actionCode,
          mode: values[`${menu.id}:${actionCode}`] ?? "inherit",
        }))
      ),
    [menus, values]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <label className="flex items-center gap-2 font-semibold text-slate-700">
          <span>กิจการ:</span>
          <select
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
            onChange={(event) => changeLocation(`/admin/permissions?mode=user&organization=${event.target.value}`, dirty)}
            value={selectedOrganizationId}
          >
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 font-semibold text-slate-700">
          <span>ผู้ใช้งาน:</span>
          <select
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
            onChange={(event) => changeLocation(`/admin/permissions?mode=user&organization=${selectedOrganizationId}&user=${event.target.value}`, dirty)}
            value={user?.id ?? ""}
          >
            {users.map((item) => (
              <option key={item.id} value={item.id}>{item.name} · {item.username}</option>
            ))}
          </select>
        </label>

        {user ? (
          user.roleCode === "owner" ? (
            <p className="text-slate-600">
              Role: <strong className="text-slate-800">{user.roleName}</strong> (เจ้าของกิจการ)
            </p>
          ) : (
            <form action={updateMembershipRoleAction} className="inline-flex items-center gap-2">
              <input name="organizationId" type="hidden" value={selectedOrganizationId} />
              <input name="userId" type="hidden" value={user.id} />
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <span>Role:</span>
                <select
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                  defaultValue={user.roleCode}
                  name="roleCode"
                >
                  {organizationRoles
                    .filter((item) => item.code !== "owner")
                    .map((item) => (
                      <option key={item.code} value={item.code}>{item.name}</option>
                    ))}
                </select>
              </label>
              <button
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                type="submit"
              >
                เปลี่ยน Role
              </button>
            </form>
          )
        ) : null}
      </div>

      {!user ? (
        <p className="p-8 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-xs text-slate-400">
          กิจการนี้ยังไม่มีสมาชิกที่ Active
        </p>
      ) : (
        <form action={saveUserMenuActionsAction} onSubmit={() => setDirty(false)}>
          <input name="organizationId" type="hidden" value={selectedOrganizationId} />
          <input name="userId" type="hidden" value={user.id} />
          <input name="values" type="hidden" value={JSON.stringify(rows)} />

          <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-[13px] border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">เมนู</th>
                  {actions.map((action) => (
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center" key={action.code}>
                      {action.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menus.map((menu) => (
                  <tr className="hover:bg-slate-50/70 transition-colors" key={menu.id}>
                    <th className="px-4 py-3 align-middle font-normal text-slate-800">
                      <span>
                        <strong className="block text-xs font-semibold">{menu.label}</strong>
                        <small className="block text-[10px] text-slate-400">{menu.code}</small>
                      </span>
                    </th>
                    {actions.map((action) => {
                      const enabled = menu.actionCodes.includes(action.code);
                      const key = `${menu.id}:${action.code}`;
                      return (
                        <td className="px-4 py-3 align-middle text-center" key={action.code}>
                          {enabled ? (
                            <select
                              aria-label={`${menu.label} ${action.name}`}
                              className="h-7 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onChange={(event) => {
                                setValues((current) => ({
                                  ...current,
                                  [key]: event.target.value as "inherit" | "allow" | "deny",
                                }));
                                setDirty(true);
                              }}
                              value={values[key] ?? "inherit"}
                            >
                              <option value="inherit">ตาม Role</option>
                              <option value="allow">อนุญาต</option>
                              <option value="deny">ปฏิเสธ</option>
                            </select>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sticky bottom-4 mt-4 p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xl">
            <button
              className="h-9 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
              onClick={() => {
                setValues({});
                setDirty(true);
              }}
              type="button"
            >
              คืนค่าตาม Role ทั้งหมด
            </button>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                {dirty ? (
                  <>
                    <AlertCircle size={15} className="text-amber-400" strokeWidth={2.2} />
                    <span>มีการแก้ไขที่ยังไม่ได้บันทึก</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-400" strokeWidth={2.2} />
                    <span>ข้อมูลเป็นปัจจุบัน</span>
                  </>
                )}
              </span>
              <button
                className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                type="submit"
              >
                บันทึก Override
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
