"use client";

import React, { useState, useEffect } from "react";
import { clarificationsApi, surveysApi, usersApi } from "@/lib/api";

interface ClarificationTask {
  id: number;
  survey_id: number;
  lecturer_id: number;
  request_reason: string;
  deadline: string;
  explanation_content: string;
  commitment_text: string;
  status: "pending" | "submitted" | "approved" | "rejected" | "disputed";
  admin_comment: string;
  surveys?: { title: string };
  users?: { full_name: string };
}

export default function ClarificationCenterPage() {
  const [tasks, setTasks] = useState<ClarificationTask[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ClarificationTask | null>(null);

  // Form Request State
  const [surveyId, setSurveyId] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [reason, setReason] = useState("");
  const [deadline, setDeadline] = useState("");

  const [adminComment, setAdminComment] = useState("");

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const surveyRes: any = await surveysApi.list();
      setSurveys(surveyRes.data || []);

      const userRes: any = await usersApi.list({ role: "Giảng viên" });
      setLecturers(userRes.data || []);

      const tasksRes: any = await clarificationsApi.listAll();
      const mappedTasks = (tasksRes || []).map((t: any) => ({
        id: t.id,
        survey_id: t.survey_id,
        lecturer_id: t.lecturer_id,
        request_reason: t.request_reason,
        deadline: t.deadline || new Date().toISOString(),
        explanation_content: t.explanation_content || "",
        commitment_text: t.commitment_text || "",
        status: t.status,
        admin_comment: t.admin_comment || "",
        surveys: t.surveys || { title: `Khảo sát #${t.survey_id}` },
        users: t.users || { full_name: `Giảng viên #${t.lecturer_id}` }
      }));
      setTasks(mappedTasks);
    } catch (err) {
      console.error("Error loading clarification center data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyId || !lecturerId || !reason) return;

    try {
      await clarificationsApi.request({
        survey_id: parseInt(surveyId),
        lecturer_id: parseInt(lecturerId),
        request_reason: reason,
        deadline: deadline || undefined,
      });

      // Clear & close
      setSurveyId("");
      setLecturerId("");
      setReason("");
      setDeadline("");
      setShowRequestModal(false);
      loadData();
    } catch (err) {
      console.error("Error sending clarification request:", err);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await clarificationsApi.approve(id);
      setSelectedTask(null);
      loadData();
    } catch (err) {
      console.error("Error approving:", err);
    }
  };

  const handleReject = async (id: number) => {
    if (!adminComment.trim()) {
      alert("Vui lòng nhập nhận xét/lý do từ chối giải trình");
      return;
    }
    try {
      await clarificationsApi.reject(id, adminComment);
      setSelectedTask(null);
      setAdminComment("");
      loadData();
    } catch (err) {
      console.error("Error rejecting:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected":
        return "bg-error-container text-on-error-container border-error/20";
      case "submitted":
        return "bg-primary-fixed text-on-primary-fixed border-primary/20";
      case "disputed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Đã phê duyệt";
      case "rejected":
        return "Yêu cầu giải trình lại";
      case "submitted":
        return "Chờ phê duyệt";
      case "disputed":
        return "Đang khiếu nại";
      default:
        return "Chờ giải trình";
    }
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Trung tâm Điều phối Giải trình</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Yêu cầu giảng viên giải trình về các phản hồi tiêu cực của sinh viên và theo dõi kết quả cam kết cải tiến.
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">notification_important</span>
          Yêu cầu giải trình mới
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-xl text-center flex flex-col items-center gap-md">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <span className="text-body-md text-on-surface-variant">Đang tải dữ liệu...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-xl text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-inner">
          <span className="material-symbols-outlined text-5xl text-outline mb-sm block">rule_folder</span>
          Chưa có yêu cầu giải trình nào được tạo.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-md"
            >
              <div className="flex flex-col gap-xs">
                <div className="flex items-center gap-sm">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  <span className="text-[12px] text-on-surface-variant font-semibold">
                    Hạn chót: {new Date(task.deadline).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <h3 className="font-label-md text-label-md text-on-surface text-base font-bold mt-1">
                  Giảng viên: {task.users?.full_name || "Thầy Nguyễn Giảng Viên"}
                </h3>
                <p className="font-body-md text-sm text-on-surface-variant">
                  Lý do: {task.request_reason}
                </p>
              </div>
              <button
                className="text-primary hover:underline text-sm font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Chi tiết
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Popup */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedTask(null)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[600px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm flex items-center gap-2">
              <span className="material-symbols-outlined">feedback</span>
              Chi tiết Yêu cầu Giải trình
            </h3>

            <div className="space-y-sm text-body-md text-on-surface text-sm">
              <p><strong>Giảng viên:</strong> {selectedTask.users?.full_name || "Thầy Nguyễn Giảng Viên"}</p>
              <p><strong>Lý do yêu cầu:</strong> {selectedTask.request_reason}</p>
              <p><strong>Hạn giải trình:</strong> {new Date(selectedTask.deadline).toLocaleString("vi-VN")}</p>
              <p><strong>Trạng thái:</strong> <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getStatusBadge(selectedTask.status)}`}>{getStatusLabel(selectedTask.status)}</span></p>
            </div>

            {selectedTask.explanation_content && (
              <div className="p-md bg-surface-container border border-outline-variant rounded-lg space-y-xs mt-sm">
                <h4 className="font-label-md text-primary font-bold">Nội dung giải trình của Giảng viên:</h4>
                <p className="text-sm text-on-surface leading-relaxed">{selectedTask.explanation_content}</p>
                {selectedTask.commitment_text && (
                  <>
                    <h4 className="font-label-md text-secondary font-bold mt-sm">Cam kết cải tiến học kỳ tới:</h4>
                    <p className="text-sm text-on-surface leading-relaxed italic">&quot;{selectedTask.commitment_text}&quot;</p>
                  </>
                )}
              </div>
            )}

            {selectedTask.status === "submitted" && (
              <div className="flex flex-col gap-sm border-t border-outline-variant/30 pt-md mt-sm">
                <textarea
                  placeholder="Nhập ý kiến nhận xét (bắt buộc nếu từ chối)..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm focus:border-primary focus:outline-none"
                  rows={2}
                />
                <div className="flex gap-sm justify-end">
                  <button
                    onClick={() => handleReject(selectedTask.id)}
                    className="px-md py-2 bg-error text-on-error hover:bg-error/95 rounded-lg text-label-md font-label-md transition-colors cursor-pointer"
                  >
                    Yêu cầu giải trình lại
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTask.id)}
                    className="px-md py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-label-md font-label-md transition-colors cursor-pointer"
                  >
                    Duyệt &amp; Phê duyệt giải trình
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowRequestModal(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm">
              Yêu cầu Giải trình mới
            </h3>
            <form onSubmit={handleCreateRequest} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="select-survey">Chiến dịch Khảo sát</label>
                <select
                  id="select-survey"
                  value={surveyId}
                  onChange={(e) => setSurveyId(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                  required
                >
                  <option value="">Chọn khảo sát...</option>
                  {surveys.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="select-lecturer">Giảng viên giải trình</label>
                <select
                  id="select-lecturer"
                  value={lecturerId}
                  onChange={(e) => setLecturerId(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                  required
                >
                  <option value="">Chọn giảng viên...</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>{l.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="reason-text">Lý do yêu cầu giải trình</label>
                <textarea
                  id="reason-text"
                  placeholder="Mô tả tiêu chí thấp hoặc ý kiến trái chiều của SV..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="deadline-time">Hạn chót giải trình</label>
                <input
                  id="deadline-time"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>

              <div className="flex gap-sm justify-end mt-lg">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-md py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Gửi yêu cầu giải trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
