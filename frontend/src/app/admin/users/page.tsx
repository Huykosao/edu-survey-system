"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Sinh viên" | "Giảng viên" | "Quản lý" | "Quản trị viên";
  status: "Hoạt động" | "Tạm khóa";
  avatarInitials: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"Sinh viên" | "Giảng viên" | "Quản lý" | "Quản trị viên">("Sinh viên");

  // Users Data
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Nguyễn Văn Hải",
      email: "hai.nguyen@university.edu",
      role: "Sinh viên",
      status: "Hoạt động",
      avatarInitials: "NH",
    },
    {
      id: "2",
      name: "Trần Thị Mai",
      email: "mai.tran@faculty.edu",
      role: "Giảng viên",
      status: "Hoạt động",
      avatarInitials: "TM",
    },
    {
      id: "3",
      name: "Lê Văn Đức",
      email: "duc.le@admin.edu",
      role: "Quản lý",
      status: "Tạm khóa",
      avatarInitials: "LD",
    },
    {
      id: "4",
      name: "Phạm Ngọc Anh",
      email: "anh.pham@university.edu",
      role: "Sinh viên",
      status: "Hoạt động",
      avatarInitials: "PA",
    },
  ]);

  const handleToggleLock = (id: string) => {
    setUsers(
      users.map((user) => {
        if (user.id === id) {
          const newStatus = user.status === "Hoạt động" ? "Tạm khóa" : "Hoạt động";
          return { ...user, status: newStatus };
        }
        return user;
      })
    );
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const initials = newName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const newUser: User = {
      id: (users.length + 1).toString(),
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Hoạt động",
      avatarInitials: initials || "US",
    };

    setUsers([...users, newUser]);
    setNewName("");
    setNewEmail("");
    setNewRole("Sinh viên");
    setShowAddModal(false);
  };

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "" || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Quản lý Người dùng</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Quản lý quyền truy cập hệ thống, vai trò phân quyền và trạng thái tài khoản của người dùng.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Thêm người dùng mới
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex flex-col lg:flex-row gap-md items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-md w-full lg:w-auto">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span className="font-label-md text-label-md hidden sm:inline-block">Bộ lọc:</span>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-surface border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả vai trò</option>
            <option value="Sinh viên">Sinh viên</option>
            <option value="Giảng viên">Giảng viên</option>
            <option value="Quản lý">Quản lý</option>
            <option value="Quản trị viên">Quản trị viên</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-surface border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Tạm khóa">Tạm khóa</option>
          </select>
        </div>
      </div>

      {/* Bento Grid / Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-xl text-center text-on-surface-variant font-body-md">
            Không tìm thấy người dùng nào khớp với bộ lọc.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isLocked = user.status === "Tạm khóa";
            return (
              <div
                key={user.id}
                className={`rounded-xl p-lg hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col h-full relative overflow-hidden bg-surface-container-lowest border ${
                  isLocked ? "border-error-container" : "border-outline-variant"
                }`}
              >
                {/* Locked overlay effect */}
                {isLocked && <div className="absolute inset-0 bg-surface-container-highest opacity-25 pointer-events-none z-0"></div>}

                <div className="flex justify-between items-start mb-md relative z-10">
                  <div className="flex items-center gap-md">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-headline-md font-bold text-lg border ${
                        isLocked
                          ? "bg-surface-variant text-on-surface-variant border-outline"
                          : user.role === "Giảng viên"
                          ? "bg-primary-fixed text-on-primary-fixed border-transparent"
                          : user.role === "Quản lý"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed border-transparent"
                          : "bg-secondary-fixed text-on-secondary-fixed border-transparent"
                      }`}
                    >
                      {user.avatarInitials}
                    </div>
                    <div>
                      <h3 className="font-label-md text-label-md font-bold text-on-surface text-base">{user.name}</h3>
                      <p className="font-body-md text-label-sm text-on-surface-variant">{user.email}</p>
                    </div>
                  </div>
                  <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>

                <div className="flex gap-sm mb-lg mt-auto relative z-10">
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm border border-outline-variant">
                    {user.role}
                  </span>
                  {isLocked ? (
                    <span className="px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      Tạm khóa
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-[#dcfce7] text-[#166534] font-label-sm text-label-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
                      Hoạt động
                    </span>
                  )}
                </div>

                <div className="border-t border-outline-variant pt-md mt-auto flex justify-between items-center relative z-10">
                  <button
                    onClick={() => router.push(`/admin/users/edit?id=${user.id}`)}
                    className="flex items-center gap-2 text-primary font-label-md text-label-sm hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleToggleLock(user.id)}
                    className={`flex items-center gap-2 font-label-md text-label-sm transition-colors cursor-pointer ${
                      isLocked ? "text-secondary hover:text-primary" : "text-on-surface-variant hover:text-error"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{isLocked ? "lock_open" : "lock"}</span>
                    {isLocked ? "Mở khóa" : "Tạm khóa"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-md border-t border-outline-variant mt-md">
        <p className="font-body-md text-label-sm text-on-surface-variant">
          Hiển thị {filteredUsers.length} trên {users.length} người dùng
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded border border-outline-variant text-on-surface-variant disabled:opacity-50 cursor-pointer" disabled>
            Trước
          </button>
          <button className="px-3 py-1 rounded bg-primary text-on-primary cursor-pointer">1</button>
          <button className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:bg-surface-container-high cursor-pointer">2</button>
          <button className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:bg-surface-container-high cursor-pointer">Sau</button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm">
              Thêm Người Dùng Mới
            </h3>
            <form onSubmit={handleAddUser} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="user-name">Họ và tên</label>
                <input
                  id="user-name"
                  type="text"
                  required
                  placeholder="Nhập họ và tên..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="user-email">Địa chỉ Email</label>
                <input
                  id="user-email"
                  type="email"
                  required
                  placeholder="name@university.edu..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="user-role">Vai trò</label>
                <select
                  id="user-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>Sinh viên</option>
                  <option>Giảng viên</option>
                  <option>Quản lý</option>
                  <option>Quản trị viên</option>
                </select>
              </div>
              <div className="flex gap-sm justify-end mt-lg">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-md py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
