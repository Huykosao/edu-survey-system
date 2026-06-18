"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-2xl rounded-2xl p-xl max-w-[480px] w-full text-center flex flex-col items-center gap-md animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-error-container text-error rounded-full flex items-center justify-center shadow-inner mb-sm animate-bounce">
          <span className="material-symbols-outlined text-5xl font-bold">gpp_bad</span>
        </div>
        <h1 className="font-display-lg text-[64px] font-extrabold text-error leading-none">403</h1>
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Không có quyền truy cập</h2>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Tài khoản của bạn không được phân quyền để truy cập trang này. Vui lòng liên hệ với Quản trị viên hệ thống nếu bạn nghĩ đây là một sự nhầm lẫn.
        </p>
        <div className="flex flex-col sm:flex-row gap-sm w-full mt-lg">
          <button
            onClick={() => router.back()}
            className="flex-1 min-h-[48px] border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md rounded-lg transition-colors cursor-pointer"
          >
            Quay lại trang trước
          </button>
          <Link
            href="/login"
            className="flex-1 min-h-[48px] bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-label-md text-label-md rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            Về trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
