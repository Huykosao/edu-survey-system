"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authApi, ApiError } from "@/lib/api";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          typeof err.data === "object" && err.data && "detail" in (err.data as Record<string, unknown>)
            ? String((err.data as Record<string, unknown>).detail)
            : "Đổi mật khẩu thất bại"
        );
      } else {
        setError("Lỗi kết nối máy chủ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordField = ({
    id,
    label,
    value,
    onChange,
    show,
    onToggle,
    placeholder,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder: string;
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-on-surface" htmlFor={id}>
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px]">lock</span>
        </div>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => { onChange(e.target.value); setError(""); }}
          placeholder={placeholder}
          className="w-full h-[48px] pl-12 pr-12 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-outline/50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-[20px]">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-outline-variant/20 pb-4">
        <h2 className="text-[24px] text-primary font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px]">key</span>
          Đổi mật khẩu
        </h2>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Cập nhật mật khẩu tài khoản của bạn để bảo mật hệ thống
        </p>
      </div>

      <div className="max-w-[520px]">
        {/* User info bar */}
        <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-on-primary flex items-center justify-center font-bold text-[15px]">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-on-surface">{user?.full_name || "Người dùng"}</p>
            <p className="text-[12px] text-on-surface-variant">{user?.email}</p>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-tertiary-fixed/20 border border-tertiary/20 rounded-xl animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span>
            <span className="text-[14px] font-medium text-on-tertiary-fixed">Đổi mật khẩu thành công!</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-error-container/40 border border-error/20 rounded-xl animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-error text-xl">error</span>
            <span className="text-[14px] font-medium text-on-error-container">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-surface rounded-xl border border-outline-variant/20 p-6 shadow-sm">
          <PasswordField
            id="current-pw"
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
            placeholder="Nhập mật khẩu hiện tại"
          />
          <PasswordField
            id="new-pw"
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            placeholder="Tối thiểu 6 ký tự"
          />
          <PasswordField
            id="confirm-pw"
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            placeholder="Nhập lại mật khẩu mới"
          />

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <div className="flex items-center gap-2 text-[12px]">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      newPassword.length >= level * 3
                        ? level <= 2
                          ? "bg-error"
                          : level === 3
                          ? "bg-yellow-500"
                          : "bg-tertiary"
                        : "bg-outline-variant/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-on-surface-variant">
                {newPassword.length < 6
                  ? "Yếu"
                  : newPassword.length < 9
                  ? "Trung bình"
                  : "Mạnh"}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-[48px] mt-2 rounded-xl font-semibold text-[14px] text-on-primary bg-primary transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
              isLoading ? "opacity-80 cursor-not-allowed" : "hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang cập nhật...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">save</span>
                Cập nhật mật khẩu
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
