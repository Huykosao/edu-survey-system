"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usersApi, facultiesApi } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Sinh viên" | "Giảng viên" | "Quản lý" | "Quản trị viên" | "Cựu sinh viên" | "Nhà tuyển dụng";
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
  const [importSelectedRole, setImportSelectedRole] = useState<"Sinh viên" | "Giảng viên" | "Quản lý" | "Quản trị viên" | "Cựu sinh viên" | "Nhà tuyển dụng">("Sinh viên");
  const [loading, setLoading] = useState(false);

  // Pagination & Dropdown states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table" | "list">("grid");
  const [totalUsers, setTotalUsers] = useState(0);

  // Debounced search query to prevent spamming requests
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Form states for new user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFacultyId, setNewFacultyId] = useState<number | "">("");
  const [newRole, setNewRole] = useState<"Sinh viên" | "Giảng viên" | "Quản lý" | "Quản trị viên" | "Cựu sinh viên" | "Nhà tuyển dụng">("Sinh viên");

  const [faculties, setFaculties] = useState<{ id: number; name: string }[]>([]);

  // Users Data
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let apiRole = undefined;
      if (selectedRole === "Quản trị viên") apiRole = "ADMIN";
      else if (selectedRole === "Quản lý") apiRole = "MANAGER";
      else if (selectedRole === "Giảng viên") apiRole = "LECTURER";
      else if (selectedRole === "Sinh viên") apiRole = "STUDENT";
      else if (selectedRole === "Cựu sinh viên") apiRole = "ALUMNI";
      else if (selectedRole === "Nhà tuyển dụng") apiRole = "EMPLOYER";

      let apiStatus = undefined;
      if (selectedStatus === "Hoạt động") apiStatus = "active";
      else if (selectedStatus === "Tạm khóa") apiStatus = "inactive";

      const res: any = await usersApi.list({
        role: apiRole,
        status: apiStatus,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchQuery.trim() || undefined,
      });

      // Redirect to the last valid page if the current page has no users but there are users elsewhere
      if ((!res.data || res.data.length === 0) && res.total > 0 && currentPage > 1) {
        const maxPage = Math.max(1, Math.ceil(res.total / ITEMS_PER_PAGE));
        setCurrentPage(maxPage);
        return;
      }

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
      setTotalUsers(res.total || 0);
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
  }, [currentPage, debouncedSearchQuery, selectedRole, selectedStatus]);

  useEffect(() => {
    facultiesApi.list().then((res: any) => setFaculties(res)).catch(() => { });
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
      loadUsers();
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

  const handleDownloadTemplate = async () => {
    // @ts-ignore
    const ExcelJS = (await import("exceljs/dist/exceljs.min.js")).default || await import("exceljs/dist/exceljs.min.js");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Users Template");
    
    sheet.columns = [
      { header: "Mật khẩu", key: "password", width: 15 },
      { header: "Họ và tên", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Số điện thoại", key: "phone", width: 15 },
      { header: "Khoa", key: "faculty", width: 25 }
    ];
    
    sheet.addRow({ password: "matkhau123", name: "Nguyễn Văn A", email: "nva@example.com", phone: "0987654321", faculty: "Công nghệ thông tin" });
    sheet.addRow({ password: "matkhau456", name: "Trần Thị B", email: "ttb@example.com", phone: "0912345678", faculty: "Kinh tế" });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Mau_nhap_nguoi_dung.xlsx";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // @ts-ignore
      const ExcelJS = (await import("exceljs/dist/exceljs.min.js")).default || await import("exceljs/dist/exceljs.min.js");
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const ws = workbook.worksheets[0];
      if (!ws) {
        alert("File Excel không hợp lệ hoặc không có trang tính.");
        if (e.target) e.target.value = "";
        return;
      }

      const rawData: any[] = [];
      const headers: string[] = [];

      ws.eachRow((row: any, rowNumber: number) => {
        if (rowNumber === 1) {
          row.eachCell((cell: any, colNumber: number) => {
            headers[colNumber] = cell.value ? cell.value.toString().trim() : "";
          });
        } else {
          const rowData: any = {};
          let hasData = false;
          row.eachCell((cell: any, colNumber: number) => {
            const header = headers[colNumber];
            if (header && cell.value !== undefined && cell.value !== null) {
              rowData[header] = cell.value;
              hasData = true;
            }
          });
          if (hasData) rawData.push(rowData);
        }
      });

      const data = rawData;
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
          let facultyName = row["Khoa"]?.toString().trim();
          if (!facultyName) facultyName = null;

          // Khôi phục số 0 đứng đầu nếu Excel tự động chuyển thành số và làm mất
          if (phone && phone.length === 9 && /^[35789]/.test(phone)) {
            phone = "0" + phone;
          }

          let roleIds = [4]; // STUDENT mặc định
          if (importSelectedRole === "Quản trị viên") roleIds = [1];
          else if (importSelectedRole === "Quản lý") roleIds = [2];
          else if (importSelectedRole === "Giảng viên") roleIds = [3];
          else if (importSelectedRole === "Cựu sinh viên") roleIds = [5];
          else if (importSelectedRole === "Nhà tuyển dụng") roleIds = [6];

          if (!name || !email || !password) {
            frontendErrors.push(`Dòng ${rowNum}: Thiếu thông tin bắt buộc (Mật khẩu, Họ tên, Email).`);
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              frontendErrors.push(`Dòng ${rowNum}: Email không hợp lệ (${email}).`);
            }
            if (phone && !/^(0|\+84)[35789][0-9]{8}$/.test(phone)) {
              frontendErrors.push(`Dòng ${rowNum}: Số điện thoại không hợp lệ (${phone}).`);
            }
            if (password.length < 6) {
              frontendErrors.push(`Dòng ${rowNum}: Mật khẩu phải có ít nhất 6 ký tự.`);
            }
          }

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

  const totalPages = Math.max(1, Math.ceil(totalUsers / ITEMS_PER_PAGE));
  const paginatedUsers = users;

  return (
    <div className="flex flex-col gap-3 md:gap-lg animate-in fade-in duration-300 h-auto md:h-full min-h-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-md border-b border-outline-variant/30 pb-2 md:pb-md">
        <div>
          <h1 className="text-xl md:text-headline-lg text-primary font-bold">Quản lý Người dùng</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 hidden md:block">
            Quản lý quyền truy cập hệ thống, vai trò phân quyền và trạng thái tài khoản của người dùng.
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto w-full md:w-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 md:flex-initial bg-surface-variant text-on-surface-variant px-3 py-2 md:px-4 md:py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-initial bg-primary text-on-primary px-3 py-2 md:px-4 md:py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-surface-container-lowest p-2 md:p-md rounded-xl border border-outline-variant flex flex-col lg:flex-row gap-2 md:gap-md items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="w-full pl-9 pr-4 py-1.5 md:py-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-sm md:text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-md w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">filter_list</span>
            <span className="font-label-md text-sm md:text-label-md">Bộ lọc:</span>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 md:flex-initial bg-surface border border-outline-variant text-on-surface font-body-md text-sm rounded-lg px-2.5 py-1.5 md:px-4 md:py-2 focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả vai trò</option>
            <option value="Sinh viên">Sinh viên</option>
            <option value="Giảng viên">Giảng viên</option>
            <option value="Quản lý">Quản lý</option>
            <option value="Quản trị viên">Quản trị viên</option>
            <option value="Cựu sinh viên">Cựu sinh viên</option>
            <option value="Nhà tuyển dụng">Nhà tuyển dụng</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 md:flex-initial bg-surface border border-outline-variant text-on-surface font-body-md text-sm rounded-lg px-2.5 py-1.5 md:px-4 md:py-2 focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Tạm khóa">Tạm khóa</option>
          </select>

          {/* View Mode Switcher */}
          <div className="h-6 w-px bg-outline-variant/40 mx-1 hidden sm:block"></div>
          <div className="flex border border-outline-variant rounded-lg overflow-hidden bg-surface flex-shrink-0 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
              }`}
              title="Dạng lưới"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[20px]">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 flex items-center justify-center transition-colors border-l border-outline-variant cursor-pointer ${
                viewMode === "table" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
              }`}
              title="Dạng bảng"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[20px]">table_chart</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 flex items-center justify-center transition-colors border-l border-outline-variant cursor-pointer ${
                viewMode === "list" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
              }`}
              title="Dạng danh sách"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[20px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 min-h-[300px] flex flex-col justify-center items-center text-primary bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <span className="material-symbols-outlined animate-spin text-4xl mb-3">sync</span>
          <span className="font-body-md">Đang tải danh sách người dùng...</span>
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="flex-1 min-h-[300px] flex flex-col justify-center items-center text-on-surface-variant font-body-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
          <span>Không tìm thấy người dùng nào khớp với bộ lọc.</span>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch content-start gap-3 md:flex-1 md:min-h-0 md:overflow-y-auto overflow-visible pr-1">
          {paginatedUsers.map((user) => {
            const isLocked = user.status === "Tạm khóa";
            return (
              <div
                key={user.id}
                className={`rounded-lg p-3 lg:p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col justify-between gap-3 lg:gap-4 relative bg-surface-container-lowest border ${
                  isLocked ? "border-error-container" : "border-outline-variant"
                } ${openDropdown === user.id ? "z-50" : "z-0"}`}
              >
                {/* Locked overlay effect */}
                {isLocked && <div className="absolute inset-0 bg-surface-container-highest opacity-25 pointer-events-none z-0 rounded-lg"></div>}

                <div className={`flex justify-between items-center mb-2 lg:mb-3 relative ${openDropdown === user.id ? "z-30" : "z-10"}`}>
                  <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-bold text-sm lg:text-lg border flex-shrink-0 transition-all duration-200 ${
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
                    <div className="min-w-0">
                      <h3 className="font-label-md text-label-md font-bold text-on-surface text-sm lg:text-base truncate leading-snug">{user.name}</h3>
                      <p className="font-body-md text-[12px] lg:text-sm text-on-surface-variant truncate leading-normal mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-0.5 rounded-full hover:bg-surface-container relative z-10"
                    >
                      <span className="material-symbols-outlined text-[20px] lg:text-[24px]">more_vert</span>
                    </button>
                    {openDropdown === user.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setOpenDropdown(null)}
                        ></div>
                        <div className="absolute right-0 mt-1 w-44 bg-surface rounded-lg shadow-lg border border-outline-variant py-1 z-50">
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              router.push(`/admin/users/edit?id=${user.id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-label-md text-sm hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Chỉnh sửa
                          </button>
                          <button 
                            onClick={() => {
                              setOpenDropdown(null);
                              handleToggleLock(user.id);
                            }}
                            className="w-full text-left px-3 py-2 text-label-md text-sm hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">{isLocked ? "lock_open" : "lock"}</span>
                            {isLocked ? "Mở khóa" : "Khóa tài khoản"}
                          </button>
                          <button 
                            onClick={() => {
                              setOpenDropdown(null);
                              handleDeleteUser(user.id);
                            }}
                            className="w-full text-left px-3 py-2 text-label-md text-sm text-error hover:bg-error-container/20 flex items-center gap-2.5 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Xóa người dùng
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 lg:gap-2 mt-1 lg:mt-2 relative z-10">
                  <span className="px-2 py-0.5 lg:px-3 lg:py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[11px] lg:text-xs border border-outline-variant">
                    {user.role}
                  </span>
                  {isLocked ? (
                    <span className="px-2 py-0.5 lg:px-3 lg:py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] lg:text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] lg:text-[14px]">lock</span>
                      Tạm khóa
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 lg:px-3 lg:py-1 rounded-full bg-[#dcfce7] text-[#166534] font-label-sm text-[11px] lg:text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                      Hoạt động
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden md:flex-1 md:min-h-0 flex flex-col shadow-sm">
          <div 
            className="overflow-auto flex-grow"
          >
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 z-10">
                <tr className="h-11">
                  <th className="px-4 font-label-md text-label-md text-on-surface-variant font-bold bg-surface-container-high border-b border-outline-variant min-w-[200px] md:min-w-[280px] h-11">Người dùng</th>
                  <th className="px-4 font-label-md text-label-md text-on-surface-variant font-bold bg-surface-container-high border-b border-outline-variant w-32 md:w-40 h-11">Vai trò</th>
                  <th className="px-4 font-label-md text-label-md text-on-surface-variant font-bold bg-surface-container-high border-b border-outline-variant w-32 md:w-40 h-11">Trạng thái</th>
                  <th className="px-4 font-label-md text-label-md text-on-surface-variant font-bold text-right bg-surface-container-high border-b border-outline-variant w-28 md:w-36 pr-6 h-11">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isLocked = user.status === "Tạm khóa";
                  return (
                    <tr key={user.id} className={`hover:bg-surface-container-low transition-colors ${isLocked ? "bg-surface-container-highest/20" : ""}`}>
                      <td className="py-3 px-4 border-b border-outline-variant/30">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0 ${
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
                          <div className="min-w-0">
                            <p className="font-label-md text-label-md font-bold text-on-surface text-sm truncate">{user.name}</p>
                            <p className="text-[12px] text-on-surface-variant truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-b border-outline-variant/30">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[11px] border border-outline-variant">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-b border-outline-variant/30">
                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            Tạm khóa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] font-label-sm text-[11px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap border-b border-outline-variant/30 pr-6">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => router.push(`/admin/users/edit?id=${user.id}`)}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleLock(user.id)}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors cursor-pointer"
                            title={isLocked ? "Mở khóa" : "Khóa tài khoản"}
                          >
                            <span className="material-symbols-outlined text-[18px]">{isLocked ? "lock_open" : "lock"}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-error hover:bg-error-container/20 rounded transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant/30 md:flex-1 md:min-h-0 md:overflow-y-auto overflow-visible shadow-sm">
          {paginatedUsers.map((user) => {
            const isLocked = user.status === "Tạm khóa";
            return (
              <div key={user.id} className={`flex items-center justify-between p-3 hover:bg-surface-container-low transition-all ${isLocked ? "bg-surface-container-highest/10" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0 ${
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
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md font-bold text-on-surface text-sm truncate">{user.name}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[11px] border border-outline-variant">
                    {user.role}
                  </span>
                  {isLocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">lock</span>
                      Tạm khóa
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] font-label-sm text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                      Hoạt động
                    </span>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-container relative z-10"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    {openDropdown === user.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                        <div className="absolute right-0 mt-1 w-44 bg-surface rounded-lg shadow-lg border border-outline-variant py-1 z-50">
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              router.push(`/admin/users/edit?id=${user.id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-label-md text-sm hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              handleToggleLock(user.id);
                            }}
                            className="w-full text-left px-3 py-2 text-label-md text-sm hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">{isLocked ? "lock_open" : "lock"}</span>
                            {isLocked ? "Mở khóa" : "Khóa tài khoản"}
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              handleDeleteUser(user.id);
                            }}
                            className="w-full text-left px-3 py-2 text-label-md text-sm text-error hover:bg-error-container/20 flex items-center gap-2.5 transition-colors cursor-pointer relative z-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Xóa người dùng
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 pt-3 md:pt-md border-t border-outline-variant mt-2 md:mt-md flex-shrink-0">
        <p className="font-body-md text-[12px] md:text-label-sm text-on-surface-variant text-center sm:text-left">
          Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} trên {totalUsers} người dùng
        </p>
        <div className="flex gap-1.5 md:gap-2 items-center">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 text-sm md:px-3 md:py-1 rounded border border-outline-variant text-on-surface-variant disabled:opacity-50 cursor-pointer hover:bg-surface-container transition-colors"
          >
            Trước
          </button>
          
          <span className="text-sm md:text-label-md px-1 md:px-2 text-on-surface">
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
                    Vui lòng tải xuống file mẫu và điền dữ liệu theo đúng định dạng. Các cột yêu cầu: <b>Mật khẩu</b>, <b>Họ và tên</b>, <b>Email</b>, <b>Số điện thoại</b>, <b>Khoa</b>.
                  </p>

                  <button
                    onClick={handleDownloadTemplate}
                    className="mt-2 text-primary font-label-md flex items-center gap-2 hover:bg-primary/8 px-2 py-1 rounded-lg self-start bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Tải file Excel mẫu
                  </button>
                </div>

                <div className="flex flex-col gap-xs mt-2">
                  <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="import-role">Vai trò cho danh sách import này</label>
                  <select
                    id="import-role"
                    value={importSelectedRole}
                    onChange={(e) => setImportSelectedRole(e.target.value as any)}
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
