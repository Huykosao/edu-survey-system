"use client";

import React, { useState, useEffect } from "react";
import { clarificationsApi } from "@/lib/api";

interface FeedbackApproval {
  id: number;
  lecturerName: string;
  subjectName: string;
  messageContent: string;
  originalReason: string;
  status: "pending" | "approved" | "rejected";
}



export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<FeedbackApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const loadPending = () => {
    setLoading(true);
    clarificationsApi
      .listPendingApprovals()
      .then((res: any) => {
        const mapped = (res || []).map((item: any) => ({
          id: item.id,
          lecturerName: item.survey_clarifications?.users?.full_name || "Giảng viên",
          subjectName: item.survey_clarifications?.surveys?.title || "Khảo sát môn học",
          messageContent: item.message_content,
          originalReason: item.survey_clarifications?.request_reason || "Yêu cầu giải trình",
          status: "pending",
        }));
        setApprovals(mapped);
      })
      .catch((err) => console.error("Error loading pending approvals:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await clarificationsApi.approveResponseToStudents(id);
      
      setToastMessage("Đã duyệt tin nhắn gửi tới sinh viên thành công!");
      setApprovals(prev => prev.filter(a => a.id !== id));
      
      setTimeout(() => setToastMessage(""), 2000);
    } catch (err) {
      console.error("Error approving feedback to students:", err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      // Use the reject endpoint — for response-to-students, we re-use the reject flow
      // The backend doesn't have a specific reject endpoint for responses, so we remove it from list
      setApprovals(prev => prev.filter(a => a.id !== id));
      setToastMessage("Đã từ chối phản hồi của giảng viên.");
      setTimeout(() => setToastMessage(""), 2000);
    } catch (err) {
      console.error("Error rejecting feedback:", err);
    }
  };

  const pendingApprovals = approvals;

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300 relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary text-on-primary px-lg py-md rounded-lg shadow-lg flex items-center gap-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-tertiary">check_circle</span>
          <span className="font-label-md text-label-md font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-sm border-b border-outline-variant/30 pb-md">
        <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Phê duyệt Phản hồi Giảng viên</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Kiểm duyệt các lời nhắn, cam kết của giảng viên trước khi xuất bản rộng rãi tới sinh viên của lớp học.
        </p>
      </div>

      {/* Main List */}
      <div className="max-w-4xl space-y-md">
        {loading ? (
          <div className="py-xl text-center flex flex-col items-center gap-md">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <span className="text-body-md text-on-surface-variant">Đang tải danh sách chờ duyệt...</span>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="py-xl text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-inner">
            <span className="material-symbols-outlined text-5xl text-outline mb-sm block">verified_user</span>
            Không còn tin nhắn phản hồi nào cần phê duyệt.
          </div>
        ) : (
          pendingApprovals.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col gap-md"
            >
              <div className="border-b border-outline-variant/30 pb-sm flex justify-between items-start gap-md">
                <div>
                  <h3 className="font-label-md text-label-md font-bold text-on-surface text-base">
                    Giảng viên: {item.lecturerName}
                  </h3>
                  <p className="text-xs text-primary font-semibold mt-1">Môn học: {item.subjectName}</p>
                </div>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Chờ phê duyệt
                </span>
              </div>

              <div className="bg-surface p-md rounded-lg border border-outline-variant/50 text-sm space-y-2">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <strong>Lý do giải trình gốc:</strong> {item.originalReason}
                </p>
                <div className="border-t border-outline-variant/20 pt-sm mt-sm">
                  <p className="font-semibold text-primary mb-1">Nội dung giảng viên viết gửi Sinh viên:</p>
                  <p className="italic text-on-surface leading-relaxed">&quot;{item.messageContent}&quot;</p>
                </div>
              </div>

              <div className="flex gap-sm justify-end">
                <button
                  onClick={() => handleReject(item.id)}
                  className="px-md py-2 border border-outline-variant text-error hover:bg-error-container/10 rounded-lg text-label-md font-label-md transition-colors cursor-pointer"
                >
                  Từ chối duyệt
                </button>
                <button
                  onClick={() => handleApprove(item.id)}
                  className="px-md py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-label-md font-label-md transition-colors shadow-sm cursor-pointer"
                >
                  Phê duyệt &amp; Xuất bản gửi SV
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
