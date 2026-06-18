"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { profileApi, ApiError } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [profileDetails, setProfileDetails] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    profileApi.getDetails().then(setProfileDetails).catch(() => {});
  }, []);

  useEffect(() => {
    if (profileDetails) {
      setPhone(String(profileDetails.phone || ""));
      setAddress(String(profileDetails.address || ""));
    }
  }, [profileDetails]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      await profileApi.updateDetails({ phone, address });
      setSuccess(true);
      refreshUser();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Lỗi kết nối máy chủ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-outline-variant/20 pb-4">
        <h2 className="text-[24px] text-primary font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px]">person</span>
          Hồ sơ cá nhân
        </h2>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Quản lý thông tin tài khoản và hồ sơ cá nhân của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar + Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-outline-variant/20 p-6 shadow-sm flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary text-on-primary flex items-center justify-center font-bold text-[36px] shadow-lg">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="text-center">
              <h3 className="text-[18px] font-bold text-on-surface">{user?.full_name}</h3>
              <p className="text-[13px] text-on-surface-variant mt-0.5">
                {user?.roles?.[0] || "Quản trị viên"}
              </p>
            </div>

            {/* Quick Info */}
            <div className="w-full border-t border-outline-variant/15 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-outline">mail</span>
                <span className="text-[13px] text-on-surface-variant">{user?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-outline">badge</span>
                <span className="text-[13px] text-on-surface-variant">{user?.username || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-outline">schedule</span>
                <span className="text-[13px] text-on-surface-variant">
                  Đăng nhập gần nhất: {user?.last_login ? new Date(user.last_login).toLocaleString("vi-VN") : "—"}
                </span>
              </div>
            </div>

            {/* Status badge */}
            <div className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium ${
              user?.status === "active"
                ? "bg-tertiary-fixed/15 text-tertiary-container"
                : "bg-error-container/30 text-error"
            }`}>
              <span className="material-symbols-outlined text-[16px] icon-fill">
                {user?.status === "active" ? "check_circle" : "block"}
              </span>
              {user?.status === "active" ? "Tài khoản đang hoạt động" : "Tài khoản bị khóa"}
            </div>
          </div>
        </div>

        {/* Right: Edit Form */}
        <div className="lg:col-span-2">
          {/* Alerts */}
          {success && (
            <div className="mb-4 flex items-center gap-3 p-4 bg-tertiary-fixed/20 border border-tertiary/20 rounded-xl animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span>
              <span className="text-[14px] font-medium text-on-tertiary-fixed">Cập nhật hồ sơ thành công!</span>
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-3 p-4 bg-error-container/40 border border-error/20 rounded-xl animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-error text-xl">error</span>
              <span className="text-[14px] font-medium text-on-error-container">{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="bg-surface rounded-xl border border-outline-variant/20 p-6 shadow-sm flex flex-col gap-5">
            <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">edit</span>
              Thông tin liên hệ
            </h3>

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Họ tên</label>
                <input
                  type="text"
                  value={user?.full_name || ""}
                  disabled
                  className="h-[44px] px-4 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant text-[14px] cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Email</label>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                  className="h-[44px] px-4 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant text-[14px] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="phone">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0xxx xxx xxx"
                  className="h-[44px] px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-outline/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="address">
                  Địa chỉ liên hệ
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ..."
                  className="h-[44px] px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-outline/50"
                />
              </div>
            </div>

            {/* Role-specific fields hint */}
            {profileDetails && (
              <div className="border-t border-outline-variant/15 pt-4">
                <h4 className="text-[14px] font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">info</span>
                  Thông tin đặc thù
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Boolean(profileDetails.student_code) && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Mã sinh viên</span>
                      <span className="text-[14px] text-on-surface font-medium">{String(profileDetails.student_code)}</span>
                    </div>
                  )}
                  {Boolean(profileDetails.lecturer_code) && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Mã giảng viên</span>
                      <span className="text-[14px] text-on-surface font-medium">{String(profileDetails.lecturer_code)}</span>
                    </div>
                  )}
                  {Boolean(profileDetails.company_name) && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Doanh nghiệp</span>
                      <span className="text-[14px] text-on-surface font-medium">{String(profileDetails.company_name)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`self-start h-[44px] px-8 rounded-xl font-semibold text-[14px] text-on-primary bg-primary transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                isLoading ? "opacity-80 cursor-not-allowed" : "hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  Lưu thay đổi
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
