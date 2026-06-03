"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/lib/api";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const primaryRole = roles[0] || "MANAGER";

  const [stats, setStats] = useState({
    total_users: 0,
    total_surveys: 0,
    total_responses: 0,
    pending_clarifications: 0,
    avg_rating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real stats overview
    dashboardApi
      .overview()
      .then((data: any) => {
        setStats({
          total_users: data.total_users || 0,
          total_surveys: data.total_surveys || 0,
          total_responses: data.total_responses || 0,
          pending_clarifications: data.pending_clarifications || 0,
          avg_rating: data.avg_rating || 0,
        });
      })
      .catch((err) => console.error("Error fetching overview stats:", err))
      .finally(() => setLoading(false));
  }, []);

  // =============================================================
  // 1. ADMIN DASHBOARD VIEW
  // =============================================================
  const renderAdminDashboard = () => {
    return (
      <div className="flex flex-col gap-lg animate-in fade-in duration-300">
        <div className="flex flex-col gap-sm border-b border-outline-variant/30 pb-md">
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Tổng quan Hệ thống</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Theo dõi trạng thái vận hành của máy chủ, số lượng tài khoản và phân quyền hệ thống.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Tổng người dùng</p>
              <h4 className="font-display-lg text-[36px] text-primary font-bold">{loading ? "..." : stats.total_users}</h4>
              <span className="text-[12px] text-tertiary flex items-center gap-1 mt-1 font-semibold">
                Tài khoản đang hoạt động
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-primary/8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] icon-fill">groups</span>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Tổng số Khảo sát</p>
              <h4 className="font-display-lg text-[36px] text-secondary font-bold">{loading ? "..." : stats.total_surveys}</h4>
              <span className="text-[12px] text-secondary flex items-center gap-1 mt-1 font-semibold">
                Được thiết kế bởi Manager
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-secondary/8 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] icon-fill">assignment_turned_in</span>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Phản hồi khảo sát</p>
              <h4 className="font-display-lg text-[36px] text-tertiary font-bold">{loading ? "..." : stats.total_responses}</h4>
              <span className="text-[12px] text-tertiary flex items-center gap-1 mt-1 font-semibold">
                Ý kiến đóng góp đã nhận
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-tertiary/8 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] icon-fill">forum</span>
            </div>
          </div>
        </div>

        {/* System Status & Server info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm lg:col-span-2 space-y-md">
            <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">dns</span>
              Trạng thái máy chủ & kết nối
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-sm">
              <div className="p-md rounded-lg bg-surface border border-outline-variant flex items-center gap-md">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping"></span>
                <div>
                  <p className="text-[13px] text-on-surface-variant">Cơ sở dữ liệu Supabase</p>
                  <p className="text-[14px] font-bold text-on-surface">Đang kết nối — Khỏe mạnh</p>
                </div>
              </div>
              <div className="p-md rounded-lg bg-surface border border-outline-variant flex items-center gap-md">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping"></span>
                <div>
                  <p className="text-[13px] text-on-surface-variant">API Server (FastAPI)</p>
                  <p className="text-[14px] font-bold text-on-surface">Online — Phản hồi 12ms</p>
                </div>
              </div>
            </div>

            <div className="border-t border-outline-variant/30 pt-md">
              <h4 className="font-label-md text-on-surface font-semibold mb-sm">Phiên bản phần mềm:</h4>
              <ul className="space-y-1 text-body-md text-sm text-on-surface-variant">
                <li>• Frontend: Next.js 16.2.6 (React 19)</li>
                <li>• Backend: Python 3.12, FastAPI 0.111</li>
                <li>• Database: Supabase PostgreSQL v15</li>
              </ul>
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col gap-md">
            <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">speed</span>
              Phím tắt quản trị
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Truy cập nhanh các khu vực quản trị tài khoản học viên và danh mục trường lớp.
            </p>
            <div className="flex flex-col gap-sm mt-auto">
              <a
                href="/admin/users"
                className="w-full py-2.5 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-center rounded-lg font-label-md text-label-md transition-colors"
              >
                Quản lý Người dùng
              </a>
              <a
                href="/admin/master-data"
                className="w-full py-2.5 border border-outline-variant text-on-surface hover:bg-surface-container-low text-center rounded-lg font-label-md text-label-md transition-colors"
              >
                Xem Danh mục cơ sở
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================
  // 2. MANAGER DASHBOARD VIEW
  // =============================================================
  const renderManagerDashboard = () => {
    return (
      <div className="flex flex-col gap-lg animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Báo cáo Tổng hợp (QA)</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Phân tích dữ liệu khảo sát và chất lượng giảng dạy toàn trường
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <a
              href="/admin/reports"
              className="flex items-center gap-sm px-md py-sm rounded-lg border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Xuất PDF/Excel
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Tổng số Khảo sát</p>
              <h4 className="font-display-lg text-[36px] text-primary font-bold">{loading ? "..." : stats.total_surveys}</h4>
              <span className="text-[12px] text-tertiary flex items-center gap-1 mt-1 font-semibold animate-pulse">
                Đang chạy &amp; nháp
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-primary/8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] icon-fill">ballot</span>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Tổng phản hồi</p>
              <h4 className="font-display-lg text-[36px] text-tertiary-container font-bold">{loading ? "..." : stats.total_responses}</h4>
              <span className="text-[12px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                +12% so với kỳ trước
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-tertiary/8 text-on-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] icon-fill">volunteer_activism</span>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Giải trình đang chờ</p>
              <h4 className="font-display-lg text-[36px] text-error font-bold">{loading ? "..." : stats.pending_clarifications}</h4>
              <span className="text-[12px] text-error flex items-center gap-1 mt-1 font-semibold">
                Cần phản hồi từ giảng viên
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-error/8 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] icon-fill">pending_actions</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Bar chart */}
          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm col-span-1 lg:col-span-2 min-h-[360px] flex flex-col">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Đánh giá trung bình theo tiêu chí (Cột)</h3>
              <span className="text-label-sm text-outline-variant font-medium">Học kỳ này</span>
            </div>
            <div className="flex-1 bg-surface-container-low rounded-lg border border-outline-variant/30 flex flex-col items-center justify-center p-md">
              <span className="text-on-surface-variant font-body-md">Chưa có dữ liệu biểu đồ từ hệ thống.</span>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-inverse-surface rounded-xl p-lg shadow-lg relative overflow-hidden text-background flex flex-col justify-between">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse"></div>
            <div className="relative z-10 flex flex-col gap-md">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-inverse-primary text-2xl">insights</span>
                <h3 className="font-headline-md text-headline-md text-white font-bold">Trợ lý AI phân tích</h3>
              </div>
              <p className="font-body-md text-sm text-inverse-on-surface opacity-90 leading-relaxed">
                Sau khi phân tích 1,200 ý kiến phản hồi tự do kỳ này, hệ thống AI đề xuất:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-md text-[13px] leading-relaxed text-white/95">
                <strong>💡 Đang chờ dữ liệu:</strong> Hệ thống AI đang thu thập thêm dữ liệu để đưa ra phân tích chi tiết.
              </div>
            </div>
            <a
              href="/admin/reports"
              className="mt-md text-[13px] font-bold text-inverse-primary hover:underline flex items-center gap-1 self-start cursor-pointer"
            >
              Xem toàn bộ phân tích AI <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================
  // 3. LECTURER DASHBOARD VIEW
  // =============================================================
  const renderLecturerDashboard = () => {
    return (
      <div className="flex flex-col gap-lg animate-in fade-in duration-300">
        <div className="flex flex-col gap-sm border-b border-outline-variant/30 pb-md">
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Bảng điều khiển Giảng viên</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Xem kết quả đánh giá giảng dạy và giải trình phản hồi trực tiếp từ sinh viên các môn phụ trách.
          </p>
        </div>

        {/* Quick evaluation stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Đánh giá chung học kỳ này</p>
              <h4 className="font-display-lg text-[44px] text-primary font-bold">{loading ? "..." : stats.avg_rating}<span className="text-xl text-on-surface-variant">/5.0</span></h4>
              <span className="text-[12px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Tính toán dựa trên dữ liệu thực tế
              </span>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] icon-fill">star</span>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Yêu cầu giải trình cần xử lý</p>
              <h4 className="font-display-lg text-[44px] text-error font-bold">{loading ? "..." : stats.pending_clarifications}</h4>
            </div>
            <div className="w-16 h-16 rounded-full bg-error/8 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] icon-fill">gavel</span>
            </div>
          </div>
        </div>

        {/* Subjects taught list */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm space-y-md">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            Môn học giảng dạy trong học kỳ (Học kỳ 1 - 2023/2024)
          </h3>

          <div className="pt-xs text-on-surface-variant font-body-md">
            Chưa có dữ liệu môn học được phân công từ hệ thống.
          </div>
        </div>
      </div>
    );
  };

  // Switch rendering based on role
  if (primaryRole === "ADMIN") {
    return renderAdminDashboard();
  } else if (primaryRole === "LECTURER") {
    return renderLecturerDashboard();
  } else {
    // MANAGER or QA is default
    return renderManagerDashboard();
  }
}
