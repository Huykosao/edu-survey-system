"use client";

import React, { useState, useEffect } from "react";
import { usersApi } from "@/lib/api";

interface LogEntry {
  id: number;
  time: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  useEffect(() => {
    usersApi
      .listLogs()
      .then((data: any) => {
        const mapped = (data || []).map((l: any) => ({
          id: l.id,
          time: new Date(l.created_at).toLocaleString("vi-VN"),
          user: l.user_id ? `User #${l.user_id}` : "Hệ thống",
          action: l.action || "UNKNOWN",
          details: typeof l.details === "string" ? l.details : JSON.stringify(l.details || {}),
          ip: l.ip_address || "127.0.0.1",
        }));
        setLogs(mapped);
      })
      .catch((err) => console.error("Error fetching logs:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-sm border-b border-outline-variant/30 pb-md">
        <div className="flex items-center gap-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">history_toggle_off</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Bảo mật &amp; Hệ thống
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Nhật ký Hệ thống (Security Logs)</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Giám sát và kiểm tra hoạt động bảo mật, đăng nhập, chỉnh sửa dữ liệu của tất cả người dùng.
        </p>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex flex-col md:flex-row gap-md items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài khoản, chi tiết..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-md w-full md:w-auto">
          <span className="font-label-md text-on-surface-variant hidden sm:inline">Hành động:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-surface border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-2 focus:outline-none focus:border-primary w-full md:w-48"
          >
            <option value="">Tất cả hành động</option>
            <option value="LOGIN">LOGIN</option>
            <option value="UPDATE_USER">UPDATE_USER</option>
            <option value="CREATE_SURVEY">CREATE_SURVEY</option>
            <option value="SUBMIT_RESPONSE">SUBMIT_RESPONSE</option>
            <option value="RESET_PASSWORD">RESET_PASSWORD</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[13px] font-semibold text-on-surface-variant">
                <th className="py-md px-lg w-1/5">Thời gian</th>
                <th className="py-md px-lg w-1/4">Người dùng</th>
                <th className="py-md px-lg w-1/6">Hành động</th>
                <th className="py-md px-lg w-1/6">Địa chỉ IP</th>
                <th className="py-md px-lg text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                    <span className="material-symbols-outlined text-3xl text-primary animate-spin inline-block align-middle mr-2">sync</span>
                    Đang tải nhật ký từ hệ thống...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                    Không tìm thấy bản ghi nhật ký nào.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-surface-bright/50 transition-colors">
                        <td className="py-md px-lg text-sm font-medium text-on-surface">{log.time}</td>
                        <td className="py-md px-lg text-sm text-primary font-semibold">{log.user}</td>
                        <td className="py-md px-lg">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              log.action === "LOGIN"
                                ? "bg-primary-fixed text-on-primary-fixed"
                                : log.action.startsWith("CREATE")
                                ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                : log.action.startsWith("SUBMIT")
                                ? "bg-[#dcfce7] text-[#166534]"
                                : "bg-error-container text-on-error-container"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-md px-lg text-sm text-on-surface-variant">{log.ip}</td>
                        <td className="py-md px-lg text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-primary hover:text-primary-container text-sm font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            {isExpanded ? "Ẩn" : "Xem JSON"}
                            <span className="material-symbols-outlined text-[16px]">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-surface-container-low/30">
                          <td colSpan={5} className="py-md px-lg">
                            <pre className="p-md bg-surface-container-high rounded-lg text-xs font-mono text-on-surface-variant overflow-x-auto">
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(log.details), null, 2);
                                } catch {
                                  return log.details;
                                }
                              })()}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
