"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUser = (currentUser: any) => {
    const roles = currentUser?.roles || [];
    if (roles.includes("STUDENT") || roles.includes("ALUMNI") || roles.includes("EMPLOYER")) {
      router.push("/survey");
    } else if (roles.includes("ADMIN")) {
      router.push("/admin/users");
    } else {
      router.push("/admin");
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      redirectUser(user);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-surface text-on-surface">
      {/* Left Column: Academic Branding — Desktop only */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-primary items-center justify-center overflow-hidden">
        {/* Layered background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary/80"></div>
        
        {/* Animated floating orbs */}
        <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full bg-secondary/15 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[5%] w-96 h-96 rounded-full bg-on-primary-container/10 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-[50%] left-[60%] w-48 h-48 rounded-full bg-tertiary-fixed/10 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:28px_28px] opacity-30"></div>

        {/* Content */}
        <div className="relative z-20 px-16 max-w-[520px] text-on-primary flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Logo mark */}
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-4xl text-white icon-fill">school</span>
          </div>

          <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-tight text-white">
            Hệ thống
            <br />
            <span className="bg-gradient-to-r from-white via-primary-fixed-dim to-secondary-fixed-dim bg-clip-text text-transparent">
              Khảo sát Giáo dục
            </span>
          </h1>

          <p className="text-[17px] text-white/70 leading-relaxed max-w-[420px]">
            Nền tảng thu thập dữ liệu an toàn, phân tích AI tự động, giúp nâng cao chất lượng đào tạo cho các tổ chức giáo dục.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-2">
            {["Khảo sát đa kênh", "Phân tích AI", "Báo cáo tự động", "Bảo mật cao"].map((feature) => (
              <span
                key={feature}
                className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-white/10 backdrop-blur-sm border border-white/15 text-white/90"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">12K+</span>
              <span className="text-[12px] text-white/50 uppercase tracking-wider">Lượt phản hồi</span>
            </div>
            <div className="w-px h-10 bg-white/15"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">98%</span>
              <span className="text-[12px] text-white/50 uppercase tracking-wider">Tỷ lệ hài lòng</span>
            </div>
            <div className="w-px h-10 bg-white/15"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">15+</span>
              <span className="text-[12px] text-white/50 uppercase tracking-wider">Khoa tham gia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-[48%] flex flex-col items-center justify-center p-6 sm:p-10 bg-surface relative">
        {/* Subtle background texture for right side */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-3xl icon-fill">school</span>
            </div>
            <span className="text-[13px] font-semibold text-primary tracking-wider uppercase">EduSurvey</span>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-[28px] md:text-[32px] text-on-surface font-bold tracking-tight">
              Đăng nhập
            </h2>
            <p className="text-[15px] text-on-surface-variant">
              Truy cập hệ thống quản lý khảo sát của bạn
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 flex items-center gap-3 p-4 bg-error-container/40 border border-error/20 rounded-xl text-on-error-container animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
              <span className="text-[14px] font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-on-surface tracking-wide"
                htmlFor="login-email"
              >
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-[15px] font-medium focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-outline/50 hover:border-outline"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label
                  className="text-[13px] font-semibold text-on-surface tracking-wide"
                  htmlFor="login-password"
                >
                  Mật khẩu
                </label>
                <a
                  href="/forgot-password"
                  className="text-[12px] font-semibold text-primary hover:text-primary-container transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className="w-full h-[52px] pl-12 pr-12 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-[15px] font-medium focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-outline/50 hover:border-outline"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-[52px] mt-2 rounded-xl font-semibold text-[15px] text-on-primary bg-primary transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 ${
                isLoading
                  ? "opacity-80 cursor-not-allowed"
                  : "hover:bg-primary-container hover:text-on-primary-container hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">login</span>
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="h-px bg-outline-variant/40 flex-1"></div>
            <span className="text-[11px] text-outline uppercase tracking-[0.15em] font-semibold">Hoặc</span>
            <div className="h-px bg-outline-variant/40 flex-1"></div>
          </div>

          {/* Employer OTP Access */}
          <div className="p-5 bg-surface-container-low/60 rounded-xl border border-outline-variant/30">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">business</span>
              <h3 className="text-[14px] font-bold text-on-surface">
                Dành cho Nhà tuyển dụng
              </h3>
            </div>
            <p className="text-[13px] text-on-surface-variant mb-4 leading-relaxed">
              Nhập email hoặc SĐT doanh nghiệp để nhận mã OTP truy cập khảo sát.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Email hoặc SĐT doanh nghiệp"
                className="flex-1 h-[44px] px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-[14px] focus:border-primary focus:ring-1 focus:ring-primary/15 outline-none transition-all placeholder:text-outline/50"
              />
              <button
                type="button"
                className="h-[44px] px-5 rounded-lg border-2 border-primary text-primary text-[13px] font-semibold hover:bg-primary hover:text-on-primary transition-all cursor-pointer whitespace-nowrap"
              >
                Gửi OTP
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 flex justify-center gap-4 text-[13px]">
            <a href="#" className="text-primary font-medium hover:underline transition-all">Cần hỗ trợ?</a>
            <span className="text-outline-variant">•</span>
            <a href="#" className="text-primary font-medium hover:underline transition-all">Quyền riêng tư</a>
          </div>

          {/* Footer */}
          <footer className="mt-auto pt-10 pb-4 w-full text-center">
            <p className="text-[12px] text-on-surface-variant/70">
              © 2026 Ban Khảo sát & Đánh giá Giáo dục. Dữ liệu được mã hóa bảo mật.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
