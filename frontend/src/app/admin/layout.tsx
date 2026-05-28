"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      name: "Bảng điều khiển",
      path: "/admin",
      icon: "dashboard",
    },
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
      name: "Thiết lập Quyền truy cập",
      path: "/admin/permissions",
      icon: "admin_panel_settings",
    },
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md antialiased">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-lg z-50">
        <div className="flex items-center gap-md">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-on-surface-variant hover:bg-surface-container-low p-sm rounded-full flex items-center justify-center cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          {/* Logo Title */}
          <Link href="/admin" className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-3xl font-semibold">school</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">EduSurvey Admin</span>
          </Link>
        </div>

        {/* Top bar right actions */}
        <div className="flex items-center gap-md">
          {/* Search bar (Hidden on mobile) */}
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-64 h-[40px] pl-10 pr-4 bg-surface-container-low border border-outline-variant focus:border-2 focus:border-primary focus:outline-none rounded-full font-body-md text-body-md text-on-surface placeholder:text-outline transition-all"
            />
          </div>

          {/* Notifications */}
          <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-sm rounded-full flex items-center justify-center cursor-pointer relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full"></span>
          </button>

          {/* Help */}
          <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-sm rounded-full flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined">help_outline</span>
          </button>

          {/* Vertical divider */}
          <div className="h-6 w-px bg-outline-variant"></div>

          {/* Profile User Info */}
          <div className="flex items-center gap-sm cursor-pointer group" onClick={() => router.push("/admin/users/edit")}>
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-md border border-outline-variant overflow-hidden">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-label-md font-semibold text-on-surface leading-tight group-hover:text-primary transition-colors">Admin</span>
              <span className="text-[11px] text-on-surface-variant leading-none">Quản trị viên</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 pt-16 min-h-screen">
        {/* Sidebar for Desktop */}
        <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-low border-r border-outline-variant hidden md:flex flex-col p-md gap-sm z-40">
          <div className="flex-1 flex flex-col gap-xs">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-sm rounded-lg transition-all duration-150 ${
                    isActive
                      ? "bg-secondary-container text-on-secondary-container font-semibold scale-[0.98]"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? "icon-fill" : ""}`}>{item.icon}</span>
                  <span className="font-label-md text-label-md whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-outline-variant pt-md flex flex-col gap-xs">
            <Link
              href="/survey"
              className="flex items-center gap-3 px-3 py-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-all duration-150"
            >
              <span className="material-symbols-outlined">assignment</span>
              <span className="font-label-md text-label-md whitespace-nowrap">Giao diện Khảo sát</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-sm rounded-lg text-error hover:bg-error-container/20 transition-all duration-150"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-label-md whitespace-nowrap">Đăng xuất</span>
            </Link>
          </div>
        </aside>

        {/* Sidebar Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-35 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-low border-r border-outline-variant flex flex-col p-md gap-sm z-40 animate-in slide-in-from-left duration-200 md:hidden">
              <div className="flex-grow flex flex-col gap-xs">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-sm rounded-lg transition-all duration-150 ${
                        isActive
                          ? "bg-secondary-container text-on-secondary-container font-semibold scale-[0.98]"
                          : "text-on-surface-variant hover:bg-surface-variant"
                      }`}
                    >
                      <span className={`material-symbols-outlined ${isActive ? "icon-fill" : ""}`}>{item.icon}</span>
                      <span className="font-label-md text-label-md whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="border-t border-outline-variant pt-md flex flex-col gap-xs">
                <Link
                  href="/survey"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-all duration-150"
                >
                  <span className="material-symbols-outlined">assignment</span>
                  <span className="font-label-md text-label-md whitespace-nowrap">Giao diện Khảo sát</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-sm rounded-lg text-error hover:bg-error-container/20 transition-all duration-150"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-label-md text-label-md whitespace-nowrap">Đăng xuất</span>
                </Link>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 md:ml-72 p-md md:p-lg overflow-y-auto bg-background transition-all duration-200">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
