"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const roles = user?.roles || [];
  const primaryRole = roles[0] || "";

  // Check sub-page permissions
  const hasAdmin = roles.includes("ADMIN");
  const hasManager = roles.includes("MANAGER");
  const hasLecturer = roles.includes("LECTURER");

  const adminOnlyPaths = ["/admin/users", "/admin/master-data", "/admin/permissions", "/admin/logs"];
  const managerOnlyPaths = ["/admin/surveys", "/admin/clarifications", "/admin/approvals", "/admin/reports"];
  const lecturerOnlyPaths = ["/admin/my-clarifications"];

  const isTryingAdminPath = adminOnlyPaths.some(path => pathname === path || pathname?.startsWith(path + "/"));
  const isTryingManagerPath = managerOnlyPaths.some(path => pathname === path || pathname?.startsWith(path + "/"));
  const isTryingLecturerPath = lecturerOnlyPaths.some(path => pathname === path || pathname?.startsWith(path + "/"));

  const isAuthorized = isAuthenticated && (
    hasAdmin ||
    (hasManager && !isTryingAdminPath) ||
    (hasLecturer && !isTryingAdminPath && !isTryingManagerPath)
  );

  // Protect admin routes and verify permissions
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Check if student, alumni, or employer trying to access admin
      const isSurveyUser = roles.includes("STUDENT") || roles.includes("ALUMNI") || roles.includes("EMPLOYER");
      if (isSurveyUser && !hasAdmin && !hasManager && !hasLecturer) {
        router.push("/survey");
        return;
      }

      if (isTryingAdminPath && !hasAdmin) {
        router.push("/403");
      } else if (isTryingManagerPath && !hasManager && !hasAdmin) {
        router.push("/403");
      } else if (isTryingLecturerPath && !hasLecturer && !hasAdmin) {
        router.push("/403");
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    roles,
    pathname,
    router,
    hasAdmin,
    hasManager,
    hasLecturer,
    isTryingAdminPath,
    isTryingManagerPath,
    isTryingLecturerPath,
  ]);

  // Define sidebar menu based on roles
  const getMenuItems = () => {
    const items = [];

    // General items for Manager/Lecturer, Admin has different dashboard focus
    if (roles.includes("MANAGER") || roles.includes("LECTURER")) {
      items.push({
        name: "Bảng điều khiển",
        path: "/admin",
        icon: "dashboard",
      });
    }

    if (roles.includes("ADMIN")) {
      items.push(
        {
          name: "Quản lý Người dùng",
          path: "/admin/users",
          icon: "group",
        },
        {
          name: "Quản lý Danh mục",
          path: "/admin/master-data",
          icon: "settings",
        },
        {
          name: "Thiết lập Quyền",
          path: "/admin/permissions",
          icon: "admin_panel_settings",
        },
        {
          name: "Nhật ký Hệ thống",
          path: "/admin/logs",
          icon: "history_toggle_off",
        }
      );
    }

    if (roles.includes("MANAGER")) {
      items.push(
        {
          name: "Quản lý Khảo sát",
          path: "/admin/surveys",
          icon: "assignment",
        },
        {
          name: "Trung tâm Giải trình",
          path: "/admin/clarifications",
          icon: "flaky",
        },
        {
          name: "Phê duyệt Phản hồi",
          path: "/admin/approvals",
          icon: "fact_check",
        },
        {
          name: "Báo cáo & Thống kê",
          path: "/admin/reports",
          icon: "analytics",
        }
      );
    }

    if (roles.includes("LECTURER")) {
      items.push({
        name: "Giải trình của tôi",
        path: "/admin/my-clarifications",
        icon: "feedback",
      });
    }

    // Common items
    items.push({
      name: "Trung tâm Thông báo",
      path: "/admin/notifications",
      icon: "notifications",
    });

    return items;
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await logout();
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-[14px] text-on-surface-variant font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return null;
  }

  // Helper for displaying role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị hệ thống";
      case "MANAGER":
        return "Cán bộ quản lý (QA)";
      case "LECTURER":
        return "Giảng viên";
      default:
        return role;
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md antialiased">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant/50 flex items-center justify-between px-4 lg:px-6 z-50 backdrop-blur-md bg-surface-container-lowest/95">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
          
          {/* Logo Title */}
          <Link href={roles.includes("ADMIN") ? "/admin/users" : "/admin"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-on-primary text-[20px] icon-fill">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-primary leading-tight">EduSurvey</span>
              <span className="text-[10px] text-on-surface-variant leading-none hidden sm:block">
                {getRoleLabel(primaryRole)}
              </span>
            </div>
          </Link>
        </div>

        {/* Top bar right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Link
            href="/admin/notifications"
            className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-full flex items-center justify-center cursor-pointer relative"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest"></span>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-outline-variant/40 mx-1 hidden sm:block"></div>

          {/* Profile User Info + Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 cursor-pointer group p-1.5 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-on-primary flex items-center justify-center font-bold text-[13px] shadow-sm">
                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[13px] font-semibold text-on-surface leading-tight group-hover:text-primary transition-colors">
                  {user?.full_name || "Người dùng"}
                </span>
                <span className="text-[11px] text-on-surface-variant leading-none">
                  {getRoleLabel(primaryRole)}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] hidden lg:block">expand_more</span>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-outline-variant/20 mb-1">
                    <p className="text-[13px] font-semibold text-on-surface">{user?.full_name}</p>
                    <p className="text-[12px] text-on-surface-variant">{user?.email}</p>
                  </div>
                  <Link
                    href="/admin/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/admin/change-password"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    Đổi mật khẩu
                  </Link>
                  <div className="h-px bg-outline-variant/20 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-error hover:bg-error-container/15 transition-colors w-full text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 pt-16 min-h-screen">
        {/* Sidebar for Desktop */}
        <aside className="fixed left-0 top-16 bottom-0 w-[260px] bg-surface-container-lowest border-r border-outline-variant/30 hidden md:flex flex-col py-4 px-3 z-40">
          <nav className="flex-1 flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/admin" && pathname?.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 h-11 rounded-xl transition-all duration-150 group ${
                    isActive
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${isActive ? "icon-fill text-primary" : "group-hover:text-on-surface"}`}>
                    {item.icon}
                  </span>
                  <span className="text-[14px] whitespace-nowrap">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-5 bg-primary rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-outline-variant/20 pt-3 flex flex-col gap-1">
            {/* Show survey board link for student roles or anyone who has it */}
            {(roles.includes("STUDENT") || roles.includes("ALUMNI") || roles.includes("EMPLOYER")) && (
              <Link
                href="/survey"
                className="flex items-center gap-3 px-3 h-11 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all duration-150"
              >
                <span className="material-symbols-outlined text-[22px]">assignment</span>
                <span className="text-[14px] whitespace-nowrap">Giao diện Khảo sát</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 h-11 rounded-xl text-error hover:bg-error-container/15 transition-all duration-150 w-full text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
              <span className="text-[14px] whitespace-nowrap">Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-35 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <aside className="fixed left-0 top-16 bottom-0 w-[280px] bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col py-4 px-3 z-40 md:hidden shadow-2xl">
              <nav className="flex-grow flex flex-col gap-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/admin" && pathname?.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 h-11 rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-primary/8 text-primary font-semibold"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${isActive ? "icon-fill text-primary" : ""}`}>
                        {item.icon}
                      </span>
                      <span className="text-[14px] whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Sidebar Footer */}
              <div className="border-t border-outline-variant/20 pt-3 flex flex-col gap-1">
                {(roles.includes("STUDENT") || roles.includes("ALUMNI") || roles.includes("EMPLOYER")) && (
                  <Link
                    href="/survey"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 h-11 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all duration-150"
                  >
                    <span className="material-symbols-outlined text-[22px]">assignment</span>
                    <span className="text-[14px] whitespace-nowrap">Giao diện Khảo sát</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 h-11 rounded-xl text-error hover:bg-error-container/15 transition-all duration-150 w-full text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">logout</span>
                  <span className="text-[14px] whitespace-nowrap">Đăng xuất</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 md:ml-[260px] p-4 md:p-6 overflow-y-auto bg-background transition-all duration-200">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
