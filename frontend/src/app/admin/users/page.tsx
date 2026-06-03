"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";

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
  const [loading, setLoading] = useState(false);
  
  // Pagination & Dropdown states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedStatus]);

  // Form states for new user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"Sinh viên" | "Giảng viên" | "Quản lý" | "Quản trị viên" | "Cựu sinh viên" | "Nhà tuyển dụng">("Sinh viên");

  // Users Data
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res: any = await usersApi.list();
      const mapped = (res.data || []).map((u: any) => {
        let role = "Sinh viên";
        if (u.roles && u.roles.length > 0) {
          if (u.roles[0] === "ADMIN") role = "Quản trị viên";
          else if (u.roles[0] === "MANAGER") role = "Quản lý";
          else if (u.roles[0] === "LECTURER") role = "Giảng viên";
          else if (u.roles[0] === "STUDENT") role = "Sinh viên";
          else if (u.roles[0] === "ALUMNI") role = "Cựu sinh viên";
          else if (u.roles[0] === "EMPLOYER") role = "Nhà tuyển dụng";
        }
        return {
          id: u.id.toString(),
          name: u.full_name,
          email: u.email,
          role,
          status: u.status === "active" ? "Hoạt động" : "Tạm khóa",
          avatarInitials: (u.full_name || "U").substring(0, 2).toUpperCase()
        };
      });
      setUsers(mapped);
    } catch (err: any) {
      if (err?.message !== "Failed to fetch") {
        console.error("Error loading users:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleLock = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === "Hoạt động" ? "inactive" : "active";
    try {
      await usersApi.update(parseInt(id), { status: newStatus });
      setUsers(
        users.map((u) => {
          if (u.id === id) {
            return { ...u, status: newStatus === "active" ? "Hoạt động" : "Tạm khóa" as any };
          }
          return u;
        })
      );
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      await usersApi.delete(parseInt(id));
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Có lỗi xảy ra khi xóa người dùng.");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    let roleIds = [4]; // STUDENT
    if (newRole === "Quản trị viên") roleIds = [1];
    else if (newRole === "Quản lý") roleIds = [2];
    else if (newRole === "Giảng viên") roleIds = [3];
    else if (newRole === "Cựu sinh viên") roleIds = [5];
    else if (newRole === "Nhà tuyển dụng") roleIds = [6];

    try {
      await usersApi.create({
        full_name: newName,
        email: newEmail,
        password: newPassword,
        role_ids: roleIds
      });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("Sinh viên");
      setShowAddModal(false);
      loadUsers();
    } catch (err) {
      console.error("Error creating user:", err);
    }
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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
          {loading ? (
            <div className="col-span-full py-20 flex justify-center items-center text-primary">
              <span className="material-symbols-outlined animate-spin text-4xl mr-3">sync</span>
              Đang tải danh sách người dùng...
            </div>
          ) : paginatedUsers.length === 0 ? (
          <div className="col-span-full py-xl text-center text-on-surface-variant font-body-md">
            Không tìm thấy người dùng nào khớp với bộ lọc.
            </div>
          ) : (
            paginatedUsers.map((user) => {
              const isLocked = user.status === "Tạm khóa";
            return (
              <div
                key={user.id}
                className={`rounded-xl p-lg hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col h-full relative bg-surface-container-lowest border ${
                  isLocked ? "border-error-container" : "border-outline-variant"
                }`}
              >
                {/* Locked overlay effect */}
                {isLocked && <div className="absolute inset-0 bg-surface-container-highest opacity-25 pointer-events-none z-0 rounded-xl"></div>}

                <div className="flex justify-between items-start mb-md relative z-50">
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
                  <div className="relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openDropdown === user.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-surface rounded-lg shadow-lg border border-outline-variant py-1 z-20">
                        <button
                          onClick={() => {
                            setOpenDropdown(null);
                            router.push(`/admin/users/edit?id=${user.id}`);
                          }}
                          className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          Chỉnh sửa
                        </button>
                        <button 
                          onClick={() => {
                            setOpenDropdown(null);
                            handleToggleLock(user.id);
                          }}
                          className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">{isLocked ? "lock_open" : "lock"}</span>
                          {isLocked ? "Mở khóa" : "Khóa tài khoản"}
                        </button>
                        <button 
                          onClick={() => {
                            setOpenDropdown(null);
                            handleDeleteUser(user.id);
                          }}
                          className="w-full text-left px-4 py-2.5 text-label-md text-error hover:bg-error-container/20 flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Xóa người dùng
                        </button>
                      </div>
                    )}
                  </div>
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
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-md border-t border-outline-variant mt-md">
        <p className="font-body-md text-label-sm text-on-surface-variant">
          Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} trên {filteredUsers.length} người dùng
        </p>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-outline-variant text-on-surface-variant disabled:opacity-50 cursor-pointer hover:bg-surface-container transition-colors"
          >
            Trước
          </button>
          
          <span className="font-label-md px-2 text-on-surface">
            Trang {currentPage} / {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-50 cursor-pointer transition-colors"
          >
            Sau
          </button>
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
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="user-password">Mật khẩu</label>
                <input
                  id="user-password"
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  <option>Cựu sinh viên</option>
                  <option>Nhà tuyển dụng</option>
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
