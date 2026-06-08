"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSuccess(res.message || "Mật khẩu mới đã được gửi đến email của bạn");
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const errData = err.data as Record<string, any>;
        setError(String(errData?.detail || "Không thể cấp lại mật khẩu"));
      } else {
        setError("Lỗi kết nối máy chủ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-surface text-on-surface items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]"></div>

      <div className="w-full max-w-[420px] bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
          <h1 className="text-[24px] font-bold text-on-surface text-center">
            Quên mật khẩu
          </h1>
          <p className="text-[14px] text-on-surface-variant text-center mt-2">
            {!isSuccess
              ? "Nhập email liên kết với tài khoản để nhận mật khẩu mới."
              : "Kiểm tra hộp thư của bạn."}
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 p-3.5 bg-error-container/40 border border-error/20 rounded-xl text-on-error-container animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <span className="text-[13px] font-medium leading-tight pt-0.5">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 p-3.5 bg-tertiary-fixed/30 border border-tertiary/20 rounded-xl text-on-tertiary-fixed animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
            <span className="text-[13px] font-medium leading-tight pt-0.5">{success}</span>
          </div>
        )}

        {!isSuccess ? (
          <form onSubmit={handleRequestPassword} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-on-surface" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="w-full h-[48px] px-4 rounded-xl border border-outline-variant bg-surface text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-[48px] mt-2 rounded-xl font-semibold text-[14px] text-on-primary bg-primary transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${isLoading ? "opacity-80" : "hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]"
                }`}
            >
              {isLoading ? "Đang xử lý..." : "Nhận mật khẩu mới"}
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="w-full h-[48px] mt-2 rounded-xl font-semibold text-[14px] text-on-primary bg-primary transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]"
          >
            Quay lại Đăng nhập
          </Link>
        )}

        {!isSuccess && (
          <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
            <Link href="/login" className="text-[13px] font-semibold text-primary hover:underline inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
