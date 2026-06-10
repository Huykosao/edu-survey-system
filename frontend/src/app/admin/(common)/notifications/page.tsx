"use client";

import React, { useState, useEffect } from "react";
import { notificationsApi } from "@/lib/api";

interface NotificationItem {
  id: number;
  recipient_id: number;
  type: string; // 'SECURITY', 'SURVEY', 'CLARIFICATION', 'SYSTEM'
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    notificationsApi
      .list()
      .then((data: any) => {
        setNotifications(data || []);
      })
      .catch((err) => console.error("Error loading notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const getFilteredList = () => {
    switch (filter) {
      case "unread":
        return notifications.filter(n => !n.is_read);
      case "read":
        return notifications.filter(n => n.is_read);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "SECURITY":
        return { name: "lock_reset", bg: "bg-error/8 text-error" };
      case "SURVEY":
        return { name: "assignment", bg: "bg-primary/8 text-primary" };
      case "CLARIFICATION":
        return { name: "gavel", bg: "bg-secondary/8 text-secondary" };
      default:
        return { name: "info", bg: "bg-surface-variant text-on-surface-variant" };
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return timeStr;
    }
  };

  const filteredList = getFilteredList();

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Trung tâm Thông báo</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Theo dõi, cập nhật những chỉ định khảo sát mới, yêu cầu giải trình và sự kiện hệ thống quan trọng.
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-sm px-md py-2.5 bg-primary/8 hover:bg-primary/15 text-primary rounded-lg font-label-md text-label-md transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-outline-variant gap-lg">
        {[
          { key: "all", label: "Tất cả" },
          { key: "unread", label: "Chưa đọc" },
          { key: "read", label: "Đã đọc" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`border-b-2 py-3 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer focus:outline-none ${
              filter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Timeline List */}
      <div className="flex flex-col gap-md">
        {loading ? (
          <div className="py-xl text-center flex flex-col items-center gap-md">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <span className="text-body-md text-on-surface-variant">Đang tải thông báo...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-inner">
            <span className="material-symbols-outlined text-5xl text-outline mb-1">notifications_off</span>
            <span>Không có thông báo nào.</span>
          </div>
        ) : (
          <div className="relative border-l border-outline-variant/60 ml-6 pl-8 space-y-md py-2">
            {filteredList.map((n) => {
              const iconMeta = getNotificationIcon(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`relative group bg-surface-container-lowest border rounded-xl p-md shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-xs hover:shadow-md hover:border-primary/30 ${
                    !n.is_read ? "border-primary/20 bg-primary-fixed/5 font-semibold" : "border-outline-variant/50"
                  }`}
                >
                  {/* Timeline Dot with Icon */}
                  <div
                    className={`absolute -left-[45px] top-4 w-9 h-9 rounded-full flex items-center justify-center border-2 border-surface-container-lowest shadow-md ${iconMeta.bg}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{iconMeta.name}</span>
                  </div>

                  <div className="flex items-start justify-between gap-md">
                    <h3 className="font-label-md text-label-md text-on-surface text-base leading-snug">
                      {n.title}
                    </h3>
                    <span className="text-[11px] text-on-surface-variant whitespace-nowrap">
                      {formatTime(n.created_at)}
                    </span>
                  </div>

                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                    {n.content}
                  </p>

                  {!n.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      className="text-xs font-bold text-primary hover:bg-primary/8 px-2 py-0.5 rounded-lg flex items-center gap-1 self-start mt-1 cursor-pointer transition-colors"
                    >
                      Đánh dấu là đã đọc
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
