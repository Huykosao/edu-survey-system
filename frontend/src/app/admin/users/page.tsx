"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usersApi, facultiesApi } from "@/lib/api";
import * as XLSX from "xlsx";

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error" | "partial">("idle");
  const [importMessage, setImportMessage] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
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
  const [newPhone, setNewPhone] = useState("");
  const [newFacultyId, setNewFacultyId] = useState<number | "">("");
  const [newRole, setNewRole] = useState<"Sinh viên" | "Giảng viên" | "Quản lý" | "Quản trị viên" | "Cựu sinh viên" | "Nhà tuyển dụng">("Sinh viên");

  const [faculties, setFaculties] = useState<{id: number; name: string}[]>([]);

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
    facultiesApi.list().then((res: any) => setFaculties(res)).catch(() => {});
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
        role_ids: roleIds,
        phone: newPhone || undefined,
        faculty_id: newFacultyId ? Number(newFacultyId) : undefined,
      });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewPhone("");
      setNewFacultyId("");
      setNewRole("Sinh viên");
      setShowAddModal(false);
      loadUsers();
    } catch (err) {
      console.error("Error creating user:", err);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Họ và tên": "Nguyễn Văn A",
        "Email": "nva@example.com",
        "Mật khẩu": "matkhau123",
        "Vai trò": "Sinh viên",
        "Số điện thoại": "0987654321",
        "Khoa": "Công nghệ thông tin"
      },
      {
        "Họ và tên": "Trần Thị B",
        "Email": "ttb@example.com",
        "Mật khẩu": "matkhau456",
        "Vai trò": "Giảng viên",
        "Số điện thoại": "0912345678",
        "Khoa": "Kinh tế"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users Template");
    XLSX.writeFile(wb, "Mau_nhap_nguoi_dung.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const ab = evt.target?.result;
        if (!(ab instanceof ArrayBuffer)) {
          alert("Lỗi đọc file: Không thể đọc dữ liệu nhị phân.");
          return;
        }
        const wb = XLSX.read(ab, { type: "array" });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          alert("File Excel không hợp lệ hoặc không có trang tính.");
          return;
        }
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        // Lọc các hàng trống hoàn toàn
        const data = rawData.filter(row => Object.keys(row).some(key => row[key] !== undefined && row[key] !== null && row[key].toString().trim() !== ""));

        if (data.length === 0) {
          alert("File Excel trống hoặc không có dữ liệu hợp lệ!");
          return;
        }

        const frontendErrors: string[] = [];

        const usersToCreate = data.map((row: any, index: number) => {
          const rowNum = index + 2; // +1 for header, +1 for 0-index
          const name = row["Họ và tên"]?.toString().trim() || "";
          const email = row["Email"]?.toString().trim() || "";
          const password = row["Mật khẩu"]?.toString() || "";
          let phone = row["Số điện thoại"]?.toString().trim() || "";
          const roleName = row["Vai trò"]?.toString().trim() || "Sinh viên";
          let facultyName = row["Khoa"]?.toString().trim();
          if (!facultyName) facultyName = null;

          // Khôi phục số 0 đứng đầu nếu Excel tự động chuyển thành số và làm mất
          if (phone && phone.length === 9 && /^[35789]/.test(phone)) {
            phone = "0" + phone;
          }

          if (!name || !email || !password) {
            frontendErrors.push(`Dòng ${rowNum}: Thiếu thông tin bắt buộc (Họ tên, Email, Mật khẩu).`);
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              frontendErrors.push(`Dòng ${rowNum}: Email không hợp lệ (${email}).`);
            }
            if (phone && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phone)) {
              frontendErrors.push(`Dòng ${rowNum}: Số điện thoại không hợp lệ (${phone}).`);
            }
            if (password.length < 6) {
              frontendErrors.push(`Dòng ${rowNum}: Mật khẩu phải có ít nhất 6 ký tự.`);
            }
          }

          let roleIds = [4]; // STUDENT
          if (roleName === "Quản trị viên") roleIds = [1];
          else if (roleName === "Quản lý") roleIds = [2];
          else if (roleName === "Giảng viên") roleIds = [3];
          else if (roleName === "Cựu sinh viên") roleIds = [5];
          else if (roleName === "Nhà tuyển dụng") roleIds = [6];

          return {
            full_name: name,
            email: email,
            password: password,
            role_ids: roleIds,
            phone: phone || null,
            faculty_name: facultyName
          };
        }).filter(u => u.full_name && u.email && u.password);

        if (frontendErrors.length > 0) {
          setImportErrors(frontendErrors);
          setImportStatus("error");
          return;
        }

        if (usersToCreate.length === 0) {
          alert("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
          return;
        }

        if (usersToCreate.length > 500) {
          alert("Bạn chỉ được tải lên tối đa 500 người dùng một lần để đảm bảo hiệu năng hệ thống.");
          return;
        }

        setImportStatus("loading");
        const res: any = await usersApi.bulkCreate({ users: usersToCreate });
        
        if (res.errors && res.errors.length > 0) {
          const backendErrors = res.errors.map((e: any) => `- ${e.email}: ${e.error}`);
          setImportErrors(backendErrors);
          setImportMessage(`Tạo thành công ${res.success_count}/${res.total_count} người dùng.`);
          setImportStatus(res.success_count > 0 ? "partial" : "error");
        } else {
          setImportMessage(`Đã tạo thành công toàn bộ ${usersToCreate.length} người dùng!`);
          setImportStatus("success");
        }
        
        loadUsers();
      } catch (error: any) {
        console.error("Error parsing Excel file:", error);
        setImportErrors([error?.message || "Có lỗi xảy ra trong quá trình xử lý file."]);
        setImportStatus("error");
      } finally {
        if (e.target) e.target.value = ""; // Reset input
      }
    };
    reader.readAsArrayBuffer(file);
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
        <div className="flex gap-sm self-start md:self-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-surface-variant text-on-surface-variant px-4 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span className="hidden sm:inline">Import Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-on-primary px-4 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="hidden sm:inline">Thêm người dùng</span>
          </button>
        </div>
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
                } ${openDropdown === user.id ? "z-50" : "z-0"}`}
              >
                {/* Locked overlay effect */}
                {isLocked && <div className="absolute inset-0 bg-surface-container-highest opacity-25 pointer-events-none z-0 rounded-xl"></div>}

                <div className={`flex justify-between items-start mb-md relative ${openDropdown === user.id ? "z-30" : "z-10"}`}>
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
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-container relative z-10"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openDropdown === user.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setOpenDropdown(null)}
                        ></div>
                        <div className="absolute right-0 mt-1 w-48 bg-surface rounded-lg shadow-lg border border-outline-variant py-1 z-50">
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              router.push(`/admin/users/edit?id=${user.id}`);
                            }}
                            className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container flex items-center gap-3 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Chỉnh sửa
                          </button>
                          <button 
                            onClick={() => {
                              setOpenDropdown(null);
                              handleToggleLock(user.id);
                            }}
                            className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container flex items-center gap-3 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">{isLocked ? "lock_open" : "lock"}</span>
                            {isLocked ? "Mở khóa" : "Khóa tài khoản"}
                          </button>
                          <button 
                            onClick={() => {
                              setOpenDropdown(null);
                              handleDeleteUser(user.id);
                            }}
                            className="w-full text-left px-4 py-2.5 text-label-md text-error hover:bg-error-container/20 flex items-center gap-3 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Xóa người dùng
                          </button>
                        </div>
                      </>
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
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="user-phone">Số điện thoại</label>
                <input
                  id="user-phone"
                  type="text"
                  placeholder="Nhập số điện thoại..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="user-faculty">Khoa</label>
                <select
                  id="user-faculty"
                  value={newFacultyId}
                  onChange={(e) => setNewFacultyId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn Khoa (Không bắt buộc) --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
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
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => {
            if (importStatus !== "loading") {
              setShowImportModal(false);
              setImportStatus("idle");
            }
          }}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[500px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            {importStatus === "loading" ? (
              <div className="flex flex-col items-center justify-center py-xl gap-md">
                <span className="material-symbols-outlined animate-spin text-primary text-6xl">sync</span>
                <h3 className="font-headline-sm text-on-surface font-bold text-center">Đang xử lý dữ liệu...</h3>
                <p className="text-body-md text-on-surface-variant text-center">Hệ thống đang kiểm tra và tạo tài khoản. Vui lòng không đóng cửa sổ này.</p>
              </div>
            ) : importStatus === "success" || importStatus === "partial" ? (
              <div className="flex flex-col items-center justify-center py-xl gap-md animate-in zoom-in duration-300">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${importStatus === "success" ? "bg-green-100 text-green-600" : "bg-tertiary-container text-on-tertiary-container"}`}>
                  <span className="material-symbols-outlined text-4xl">{importStatus === "success" ? "check_circle" : "warning"}</span>
                </div>
                <h3 className="font-headline-sm text-on-surface font-bold">{importStatus === "success" ? "Hoàn tất!" : "Hoàn tất một phần"}</h3>
                <p className="text-body-md text-on-surface-variant text-center font-medium">{importMessage}</p>
                {importErrors.length > 0 && (
                  <div className="w-full max-h-40 overflow-y-auto bg-error-container/20 border border-error-container p-sm rounded-lg text-body-sm text-error mt-2">
                    <p className="font-bold mb-1">Các lỗi từ Server:</p>
                    <ul className="list-none space-y-1">
                      {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportStatus("idle");
                    setImportErrors([]);
                  }}
                  className="mt-4 px-xl py-2.5 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            ) : importStatus === "error" ? (
              <div className="flex flex-col items-center justify-center py-xl gap-md animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center text-error mb-2">
                  <span className="material-symbols-outlined text-4xl">error</span>
                </div>
                <h3 className="font-headline-sm text-error font-bold">Dữ liệu có lỗi!</h3>
                <p className="text-body-md text-on-surface-variant text-center">Vui lòng sửa các lỗi sau trong file Excel và thử lại.</p>
                <div className="w-full max-h-48 overflow-y-auto bg-surface-container-lowest border border-outline-variant p-md rounded-lg text-body-sm text-error text-left mt-2 shadow-inner">
                  <ul className="list-disc pl-5 space-y-1">
                    {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setImportStatus("idle");
                    setImportErrors([]);
                  }}
                  className="mt-4 px-xl py-2.5 bg-surface-variant text-on-surface-variant rounded-lg font-label-md hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm">
                  Nhập Người Dùng Từ Excel
                </h3>
                
                <div className="flex flex-col gap-sm">
                  <p className="text-body-md text-on-surface-variant">
                    Vui lòng tải xuống file mẫu và điền dữ liệu theo đúng định dạng. Các cột yêu cầu: <b>Họ và tên</b>, <b>Email</b>, <b>Mật khẩu</b>, <b>Vai trò</b>, <b>Số điện thoại</b>, <b>Khoa</b>. Cột Vai trò chỉ chấp nhận: <i>Sinh viên, Giảng viên, Quản lý, Quản trị viên, Cựu sinh viên, Nhà tuyển dụng</i>.
                  </p>
                  
                  <button 
                    onClick={handleDownloadTemplate}
                    className="mt-2 text-primary font-label-md flex items-center gap-2 hover:underline self-start bg-transparent border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Tải file Excel mẫu
                  </button>
                </div>

                <div className="mt-md border-2 border-dashed border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center bg-surface-container-lowest relative overflow-hidden group">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 group-hover:scale-110 transition-transform duration-300">upload_file</span>
                  <p className="text-label-md text-on-surface font-semibold mb-1">Kéo thả file vào đây hoặc nhấn để chọn</p>
                  <p className="text-body-sm text-on-surface-variant mb-4">Hỗ trợ định dạng .xlsx, .xls (Tối đa 500 dòng)</p>
                  
                  <input
                    type="file"
                    id="excel-upload"
                    accept=".xlsx, .xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileUpload}
                  />
                  <label 
                    htmlFor="excel-upload"
                    className="px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-label-md pointer-events-none group-hover:bg-primary/20 transition-colors"
                  >
                    Chọn file Excel
                  </label>
                </div>

                <div className="flex gap-sm justify-end mt-lg">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-md py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
