"use client";

import React, { useState } from "react";

interface RolePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

interface RoleRow {
  roleName: string;
  roleId: string;
  avatarIcon: string;
  avatarBg: string;
  permissions: {
    surveys: RolePermission;
    reports: RolePermission;
    users: RolePermission;
    settings: RolePermission;
  };
}

const defaultPermissions: RoleRow[] = [
  {
    roleName: "Quản trị viên",
    roleId: "admin",
    avatarIcon: "shield_person",
    avatarBg: "bg-primary-container text-on-primary-container",
    permissions: {
      surveys: { view: true, edit: true, delete: true, disabled: true },
      reports: { view: true, edit: true, delete: true, disabled: true },
      users: { view: true, edit: true, delete: true, disabled: true },
      settings: { view: true, edit: true, delete: true, disabled: true },
    },
  },
  {
    roleName: "Quản lý",
    roleId: "manager",
    avatarIcon: "manage_accounts",
    avatarBg: "bg-surface-container-highest text-on-surface",
    permissions: {
      surveys: { view: true, edit: true, delete: false },
      reports: { view: true, edit: true, delete: false },
      users: { view: true, edit: false, delete: false },
      settings: { view: false, edit: false, delete: false },
    },
  },
  {
    roleName: "Giảng viên",
    roleId: "instructor",
    avatarIcon: "school",
    avatarBg: "bg-surface-container-highest text-on-surface",
    permissions: {
      surveys: { view: true, edit: true, delete: false },
      reports: { view: true, edit: false, delete: false },
      users: { view: false, edit: false, delete: false },
      settings: { view: false, edit: false, delete: false },
    },
  },
  {
    roleName: "Sinh viên",
    roleId: "student",
    avatarIcon: "person",
    avatarBg: "bg-surface-container-highest text-on-surface",
    permissions: {
      surveys: { view: true, edit: false, delete: false },
      reports: { view: false, edit: false, delete: false },
      users: { view: false, edit: false, delete: false },
      settings: { view: false, edit: false, delete: false },
    },
  },
];

export default function AccessControlPage() {
  const [roles, setRoles] = useState<RoleRow[]>(JSON.parse(JSON.stringify(defaultPermissions)));
  const [toastMessage, setToastMessage] = useState("");

  const handleCheckboxChange = (
    roleIndex: number,
    section: "surveys" | "reports" | "users" | "settings",
    field: "view" | "edit" | "delete"
  ) => {
    const updatedRoles = [...roles];
    const perm = updatedRoles[roleIndex].permissions[section];
    if (perm.disabled) return; // Prevent modification if disabled

    perm[field] = !perm[field];
    setRoles(updatedRoles);
  };

  const handleSave = () => {
    setToastMessage("Cấu hình phân quyền đã được lưu và áp dụng trên toàn bộ hệ thống!");
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  const handleDiscard = () => {
    setRoles(JSON.parse(JSON.stringify(defaultPermissions)));
    setToastMessage("Đã khôi phục cấu hình phân quyền ban đầu.");
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary text-on-primary px-lg py-md rounded-lg shadow-lg flex items-center gap-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-tertiary">check_circle</span>
          <span className="font-label-md text-label-md font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <div className="flex items-center gap-sm text-on-surface-variant mb-xs">
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Thiết lập Hệ thống / Phân quyền
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Thiết lập Quyền truy cập</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-2xl">
            Quản lý bảng phân quyền chi tiết dựa trên vai trò của người dùng. Các thay đổi sẽ được áp dụng ngay lập tức cho toàn bộ các phiên hoạt động trên hệ thống.
          </p>
        </div>
        <div className="flex gap-md shrink-0 self-start md:self-auto">
          <button
            onClick={handleDiscard}
            className="px-md py-2 border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            Hủy bỏ thay đổi
          </button>
          <button
            onClick={handleSave}
            className="px-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
          >
            Lưu cấu hình
          </button>
        </div>
      </div>

      {/* Permission Matrix Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden mt-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-lg font-label-md text-label-md text-on-surface font-semibold w-1/5">
                  Nhóm đối tượng (Role)
                </th>
                <th className="p-lg font-label-md text-label-md text-on-surface font-semibold w-1/5">
                  Quản lý khảo sát
                </th>
                <th className="p-lg font-label-md text-label-md text-on-surface font-semibold w-1/5">
                  Xem báo cáo
                </th>
                <th className="p-lg font-label-md text-label-md text-on-surface font-semibold w-1/5">
                  Quản lý người dùng
                </th>
                <th className="p-lg font-label-md text-label-md text-on-surface font-semibold w-1/5">
                  Thiết lập hệ thống
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {roles.map((roleRow, roleIndex) => (
                <tr key={roleRow.roleId} className="hover:bg-surface-bright/50 transition-colors">
                  {/* Role cell */}
                  <td className="p-lg border-r border-outline-variant">
                    <div className="flex items-center gap-sm">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleRow.avatarBg}`}>
                        <span className="material-symbols-outlined text-[18px]">{roleRow.avatarIcon}</span>
                      </div>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        {roleRow.roleName}
                      </span>
                    </div>
                  </td>

                  {/* Survey permissions */}
                  <td className="p-lg">
                    <div className="flex flex-col gap-sm">
                      {["view", "edit", "delete"].map((field) => {
                        const perm = roleRow.permissions.surveys;
                        const key = field as "view" | "edit" | "delete";
                        const label = field === "view" ? "Xem (View)" : field === "edit" ? "Sửa (Edit)" : "Xóa (Delete)";
                        return (
                          <label key={field} className="flex items-center gap-sm cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={perm[key]}
                              disabled={perm.disabled}
                              onChange={() => handleCheckboxChange(roleIndex, "surveys", key)}
                              className="w-[18px] h-[18px] text-primary border-outline-variant rounded focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </td>

                  {/* Reports permissions */}
                  <td className="p-lg">
                    <div className="flex flex-col gap-sm">
                      {["view", "edit", "delete"].map((field) => {
                        const perm = roleRow.permissions.reports;
                        const key = field as "view" | "edit" | "delete";
                        const label = field === "view" ? "Xem (View)" : field === "edit" ? "Sửa (Edit)" : "Xóa (Delete)";
                        return (
                          <label key={field} className="flex items-center gap-sm cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={perm[key]}
                              disabled={perm.disabled}
                              onChange={() => handleCheckboxChange(roleIndex, "reports", key)}
                              className="w-[18px] h-[18px] text-primary border-outline-variant rounded focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </td>

                  {/* Users permissions */}
                  <td className="p-lg">
                    <div className="flex flex-col gap-sm">
                      {["view", "edit", "delete"].map((field) => {
                        const perm = roleRow.permissions.users;
                        const key = field as "view" | "edit" | "delete";
                        const label = field === "view" ? "Xem (View)" : field === "edit" ? "Sửa (Edit)" : "Xóa (Delete)";
                        return (
                          <label key={field} className="flex items-center gap-sm cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={perm[key]}
                              disabled={perm.disabled}
                              onChange={() => handleCheckboxChange(roleIndex, "users", key)}
                              className="w-[18px] h-[18px] text-primary border-outline-variant rounded focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </td>

                  {/* Settings permissions */}
                  <td className="p-lg">
                    <div className="flex flex-col gap-sm">
                      {["view", "edit", "delete"].map((field) => {
                        const perm = roleRow.permissions.settings;
                        const key = field as "view" | "edit" | "delete";
                        const label = field === "view" ? "Xem (View)" : field === "edit" ? "Sửa (Edit)" : "Xóa (Delete)";
                        return (
                          <label key={field} className="flex items-center gap-sm cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={perm[key]}
                              disabled={perm.disabled}
                              onChange={() => handleCheckboxChange(roleIndex, "settings", key)}
                              className="w-[18px] h-[18px] text-primary border-outline-variant rounded focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
