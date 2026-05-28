"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSSOLogin = (role: "admin" | "student") => {
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/survey");
    }
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;
    setOtpSent(true);
    setTimeout(() => {
      // Auto redirect to student view for simplicity after OTP
      router.push("/survey");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full bg-surface text-on-surface">
      {/* Left Column: Academic Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-container items-center justify-center overflow-hidden">
        {/* Academic background image overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 to-primary-container/95 z-10"></div>
        <img
          alt="Hình ảnh học thuật"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop"
        />
        {/* Mesh grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] opacity-40 z-10"></div>
        
        {/* Content overlay */}
        <div className="relative z-20 px-xl max-w-[540px] text-on-primary flex flex-col gap-md">
          <div className="w-16 h-16 bg-surface-container-lowest text-primary rounded-xl flex items-center justify-center shadow-md mb-sm">
            <span className="material-symbols-outlined text-4xl font-semibold">school</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-white font-bold leading-tight">
            Nền tảng Khảo sát Học thuật
          </h1>
          <p className="font-body-lg text-body-lg text-primary-fixed-dim/90 leading-relaxed">
            Hệ thống thu thập dữ liệu an toàn, thiết kế tối giản nhằm nâng cao sự tập trung và đảm bảo tính toàn vẹn thông tin cho các tổ chức giáo dục.
          </p>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-md sm:p-lg md:p-xl bg-surface relative">
        <div className="w-full max-w-[440px] flex flex-col">
          {/* Header Branding (visible on mobile) */}
          <div className="flex flex-col gap-sm text-center mb-xl">
            <div className="lg:hidden mx-auto w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center mb-xs shadow-md">
              <span className="material-symbols-outlined text-3xl font-semibold">school</span>
            </div>
            <h2 className="font-headline-lg text-2xl md:text-3xl text-on-surface font-bold">Đăng nhập</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Truy cập vào hệ thống khảo sát của bạn</p>
          </div>

          {/* Form Container */}
          <div className="flex flex-col gap-lg bg-surface-container-lowest p-lg rounded-xl shadow-md border border-outline-variant/30">
            {/* Quick Access Roles Switcher */}
            <div className="flex flex-col gap-sm">
              <span className="text-label-sm font-semibold text-outline uppercase tracking-wider text-center block mb-xs">
                Chọn vai trò đăng nhập (SSO)
              </span>
              <div className="grid grid-cols-2 gap-sm">
                <button
                  onClick={() => handleSSOLogin("student")}
                  className="h-[48px] bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-all rounded-lg flex items-center justify-center gap-sm font-label-md text-label-md shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">person</span>
                  Sinh viên
                </button>
                <button
                  onClick={() => handleSSOLogin("admin")}
                  className="h-[48px] bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all rounded-lg flex items-center justify-center gap-sm font-label-md text-label-md shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                  Quản trị viên
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-md">
              <div className="h-px bg-outline-variant/50 flex-1"></div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">Hoặc</span>
              <div className="h-px bg-outline-variant/50 flex-1"></div>
            </div>

            {/* OTP Section for Partners */}
            <form onSubmit={handleOTPSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <h3 className="font-label-md text-label-md text-on-surface font-bold mb-xs">
                  Dành cho Doanh nghiệp / Nhà tuyển dụng
                </h3>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="login-input">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </div>
                  <input
                    id="login-input"
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="Nhập email hoặc SĐT..."
                    className="w-full h-[48px] pl-[44px] pr-md rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline/70"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={otpSent}
                className={`w-full h-[48px] border-2 border-primary text-primary hover:bg-primary-container hover:text-on-primary-container transition-colors rounded-lg flex items-center justify-center gap-sm font-label-md text-label-md mt-sm cursor-pointer ${
                  otpSent ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                <span className="material-symbols-outlined text-xl">key</span>
                {otpSent ? "Đang gửi OTP..." : "Nhận mã OTP / Link truy cập"}
              </button>
            </form>
          </div>

          {/* Help Links */}
          <div className="mt-lg flex justify-center gap-md font-label-md text-label-md">
            <a href="#" className="text-primary hover:underline transition-all">Cần hỗ trợ?</a>
            <span className="text-outline-variant">•</span>
            <a href="#" className="text-primary hover:underline transition-all">Quyền riêng tư</a>
          </div>

          {/* Simple Unified Footer */}
          <footer className="mt-auto pt-xl pb-md w-full text-center">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Ban Khảo sát và Đánh giá Giáo dục. Dữ liệu được mã hóa bảo mật.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
