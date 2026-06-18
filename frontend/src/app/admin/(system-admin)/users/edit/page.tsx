"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usersApi, facultiesApi } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dept: string;
  role: "student" | "faculty" | "manager" | "admin" | "alumni" | "employer";
  status: "active" | "locked";
}

function EditUserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [profile, setProfile] = useState<UserProfile>({
    id: "2",
    name: "Trần Thị Mai",
    email: "mai.tran@faculty.edu",
    phone: "0912345678",
    dept: "Khoa Công nghệ Thông tin",
    role: "faculty",
    status: "active",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [faculties, setFaculties] = useState<{ id: number; name: string }[]>([]);

  // Load faculties on init
  useEffect(() => {
    facultiesApi.list()
      .then((res: any) => setFaculties(res))
      .catch((err) => console.error("Error loading faculties:", err));
  }, []);

  // Load real data on init
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    usersApi.get(parseInt(userId))
      .then((res: any) => {
        let r = "student";
        if (res.roles && res.roles.length > 0) {
          if (res.roles[0] === "ADMIN") r = "admin";
          else if (res.roles[0] === "MANAGER") r = "manager";
          else if (res.roles[0] === "LECTURER") r = "faculty";
          else if (res.roles[0] === "STUDENT") r = "student";
          else if (res.roles[0] === "ALUMNI") r = "alumni";
          else if (res.roles[0] === "EMPLOYER") r = "employer";
        }
        setProfile({
          id: res.id.toString(),
          name: res.full_name,
          email: res.email,
          phone: res.phone || "",
          dept: res.faculty_id ? res.faculty_id.toString() : "",
          role: r as any,
          status: res.status === "active" ? "active" : "locked",
        });
      })
      .catch((err) => console.error("Error loading user details:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    try {
      let role_id = 4; // student
      if (profile.role === "admin") role_id = 1;
      else if (profile.role === "manager") role_id = 2;
      else if (profile.role === "faculty") role_id = 3;
      else if (profile.role === "alumni") role_id = 5;
      else if (profile.role === "employer") role_id = 6;

      await usersApi.update(parseInt(userId), {
        full_name: profile.name,
        role_ids: [role_id],
        status: profile.status === "active" ? "active" : "inactive",
        phone: profile.phone || null,
        faculty_id: profile.dept ? parseInt(profile.dept) : null,
      });

      setToastMessage("Đã lưu các thay đổi của người dùng thành công!");
      setTimeout(() => {
        setToastMessage("");
        router.push("/admin/users");
      }, 1500);
    } catch (err) {
      console.error("Error saving user:", err);
    }
  };

  const handleCancel = () => {
    router.push("/admin/users");
  };

  const handleDelete = async () => {
    if (!userId) return;
    try {
      await usersApi.delete(parseInt(userId));
      setToastMessage("Tài khoản người dùng đã bị xóa vĩnh viễn.");
      setShowDeleteConfirm(false);
      setTimeout(() => {
        setToastMessage("");
        router.push("/admin/users");
      }, 1500);
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300 relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary text-on-primary px-lg py-md rounded-lg shadow-lg flex items-center gap-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-tertiary">check_circle</span>
          <span className="font-label-md text-label-md font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb / Back button */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center text-on-surface-variant hover:text-primary transition-colors text-label-md font-label-md mb-4"
        >
          <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
          Quay lại Danh sách Người dùng
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-headline-lg font-headline-lg text-on-surface font-bold">
            Chi tiết &amp; Chỉnh sửa Người dùng
          </h2>
          <div className="flex gap-sm">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-on-primary-container shadow-sm transition-colors cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start mt-md">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Card: Personal Information */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-lg">
            <h3 className="text-headline-md font-headline-md text-on-surface border-b border-outline-variant pb-md mb-lg flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-outline">person</span>
              Thông tin Cá nhân
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="block text-label-md font-semibold text-on-surface-variant" htmlFor="fullName">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-xs">
                <label className="block text-label-md font-semibold text-on-surface-variant" htmlFor="email">
                  Địa chỉ Email (ID)
                </label>
                <input
                  type="email"
                  id="email"
                  disabled
                  value={profile.email}
                  className="w-full p-3 bg-surface-container border border-outline-variant rounded-lg text-body-md font-body-md text-outline cursor-not-allowed"
                />
                <p className="text-label-sm font-label-sm text-outline mt-1">
                  Email là định danh duy nhất không thể thay đổi.
                </p>
              </div>
              <div className="space-y-xs">
                <label className="block text-label-md font-semibold text-on-surface-variant" htmlFor="phone">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-xs">
                <label className="block text-label-md font-semibold text-on-surface-variant" htmlFor="department">
                  Phòng ban / Khoa
                </label>
                <select
                  id="department"
                  value={profile.dept}
                  onChange={(e) => setProfile({ ...profile, dept: e.target.value })}
                  className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">-- Chưa cập nhật --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id.toString()}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card: Account Role */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-lg">
            <h3 className="text-headline-md font-headline-md text-on-surface border-b border-outline-variant pb-md mb-lg flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-outline">badge</span>
              Vai trò Tài khoản
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              {[
                {
                  id: "student",
                  title: "Sinh viên",
                  desc: "Chỉ được tham gia khảo sát được chỉ định.",
                },
                {
                  id: "faculty",
                  title: "Giảng viên",
                  desc: "Có thể đăng ký giải trình và gửi thông tin lớp học.",
                },
                {
                  id: "manager",
                  title: "Quản lý",
                  desc: "Xem báo cáo tổng hợp của khoa/ngành.",
                },
                {
                  id: "admin",
                  title: "Quản trị viên",
                  desc: "Toàn quyền kiểm soát hệ thống.",
                },
                {
                  id: "alumni",
                  title: "Cựu sinh viên",
                  desc: "Khảo sát việc làm và chất lượng đào tạo.",
                },
                {
                  id: "employer",
                  title: "Nhà tuyển dụng",
                  desc: "Khảo sát nhu cầu và phản hồi doanh nghiệp.",
                },
              ].map((role) => (
                <label
                  key={role.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors ${
                    profile.role === role.id
                      ? "border-primary bg-primary-fixed/15"
                      : "border-outline-variant"
                  }`}
                >
                  <div className="flex items-center h-6">
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={profile.role === role.id}
                      onChange={() => setProfile({ ...profile, role: role.id as any })}
                      className="w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="block text-body-md font-semibold text-on-surface">
                      {role.title}
                    </span>
                    <span className="block text-label-sm text-on-surface-variant mt-1">
                      {role.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Side Column: Status & Danger Zone */}
        <div className="space-y-lg flex flex-col">
          {/* Card: Account Status */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-lg">
            <h3 className="text-headline-md font-headline-md text-on-surface border-b border-outline-variant pb-md mb-lg flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-outline">security</span>
              Trạng thái Tài khoản
            </h3>
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant">
              <div>
                <span className="block text-body-md font-semibold text-on-surface">
                  Tạm khóa tài khoản
                </span>
                <span className="block text-label-sm text-on-surface-variant mt-1">
                  Người dùng sẽ không thể đăng nhập.
                </span>
              </div>
              
              {/* Custom Switch Toggle */}
              <button
                type="button"
                onClick={() => setProfile({ ...profile, status: profile.status === "active" ? "locked" : "active" })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  profile.status === "locked" ? "bg-error" : "bg-outline-variant"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    profile.status === "locked" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card: Danger Zone */}
          <div className="bg-error-container/20 border border-error/30 rounded-xl p-lg flex flex-col gap-md">
            <h3 className="text-headline-md font-headline-md text-error flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined">warning</span>
              Khu vực Nguy hiểm
            </h3>
            <p className="text-body-md text-sm text-on-surface-variant leading-relaxed">
              Hành động này sẽ xóa vĩnh viễn tài khoản người dùng và không thể hoàn tác. Mọi dữ liệu khảo sát cá nhân sẽ bị vô danh hóa.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 bg-error text-on-error py-3 rounded-lg text-label-md font-label-md hover:bg-error/90 transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
              Xóa vĩnh viễn tài khoản
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-error-container text-error rounded-full flex items-center justify-center shadow-inner mb-sm mx-auto">
              <span className="material-symbols-outlined text-3xl font-bold">warning</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-center text-error font-bold border-b border-outline-variant/40 pb-sm mb-sm">
              Xác nhận Xóa Tài khoản
            </h3>
            <p className="font-body-md text-body-md text-center text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của <strong>{profile.name}</strong> không? Hành động này sẽ không thể đảo ngược!
            </p>
            <div className="flex gap-sm justify-end mt-lg">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 bg-error text-on-error rounded-lg text-label-md font-label-md hover:bg-error/90 transition-colors shadow-sm cursor-pointer"
              >
                Xóa ngay lập tức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditUserPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
      </div>
    }>
      <EditUserForm />
    </Suspense>
  );
}
