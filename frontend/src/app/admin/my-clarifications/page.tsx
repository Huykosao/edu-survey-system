"use client";

import React, { useState, useEffect } from "react";
import { clarificationsApi } from "@/lib/api";

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
}

export default function MyClarificationsPage() {
  const [tasks, setTasks] = useState<ClarificationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ClarificationTask | null>(null);

  // Form submit state
  const [explanation, setExplanation] = useState("");
  const [commitment, setCommitment] = useState("");

  // Form message state
  const [studentMessage, setStudentMessage] = useState("");

  const loadTasks = () => {
    setLoading(true);
    clarificationsApi
      .listTasks()
      .then((res: any) => {
        setTasks(res || []);
      })
      .catch((err) => {
        console.error("Error loading lecturer tasks:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSubmitClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !explanation.trim()) return;

    try {
      await clarificationsApi.submit(selectedTask.id, {
        explanation_content: explanation,
        commitment_text: commitment,
      });

      // Optionally also submit message to students if entered
      if (studentMessage.trim()) {
        await clarificationsApi.submitResponseToStudents(selectedTask.id, studentMessage);
      }

      setExplanation("");
      setCommitment("");
      setStudentMessage("");
      setSelectedTask(null);
      loadTasks();
    } catch (err) {
      console.error("Error submitting explanation:", err);
    }
  };

  const handleDispute = async (id: number) => {
    if (!confirm("Bạn muốn gửi phản hồi khiếu nại về yêu cầu giải trình này?")) return;
    try {
      await clarificationsApi.dispute(id);
      setSelectedTask(null);
      loadTasks();
    } catch (err) {
      console.error("Error sending dispute:", err);
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
        return "Giải trình đã được duyệt";
      case "rejected":
        return "Bị từ chối - Cần giải trình lại";
      case "submitted":
        return "Đang chờ duyệt";
      case "disputed":
        return "Đang khiếu nại";
      default:
        return "Chưa giải trình";
    }
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-sm border-b border-outline-variant/30 pb-md">
        <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Cổng Giải trình &amp; Phản hồi</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Nơi tiếp nhận ý kiến đóng góp từ sinh viên, nhập giải trình gửi lên Ban quản lý và soạn thảo phản hồi gửi lớp.
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
        {/* Task List column */}
        <div className="lg:col-span-1 space-y-md">
          <h3 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
            Danh sách yêu cầu giải trình
          </h3>
          {loading ? (
            <div className="py-lg text-center flex flex-col items-center gap-sm">
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">sync</span>
              <span className="text-xs text-on-surface-variant">Đang tải...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-md text-center text-on-surface-variant text-sm bg-surface-container rounded-xl p-md">
              Tuyệt vời! Bạn không có yêu cầu giải trình nào.
            </div>
          ) : (
            <div className="space-y-sm">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-md border rounded-xl shadow-sm cursor-pointer transition-all ${
                    selectedTask?.id === task.id
                      ? "border-primary bg-primary/8 shadow"
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary/25"
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  <h4 className="font-label-md font-bold mt-2 text-on-surface">{task.surveys?.title || "Khảo sát môn học"}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">Lý do: {task.request_reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Details & Form column */}
        <div className="lg:col-span-2">
          {selectedTask ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm space-y-md">
              <div className="flex justify-between items-start gap-md border-b border-outline-variant/30 pb-md">
                <div>
                  <h3 className="text-headline-md font-bold text-on-surface">Chi tiết và Giải trình</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Chiến dịch: {selectedTask.surveys?.title}</p>
                </div>
                {selectedTask.status === "rejected" && (
                  <button
                    onClick={() => handleDispute(selectedTask.id)}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    Gửi khiếu nại (Dispute)
                  </button>
                )}
              </div>

              <div className="text-sm space-y-xs bg-surface p-md rounded-lg border border-outline-variant">
                <p><strong>Lý do từ Ban quản trị:</strong> {selectedTask.request_reason}</p>
                <p><strong>Hạn chót giải trình:</strong> {new Date(selectedTask.deadline).toLocaleString("vi-VN")}</p>
                {selectedTask.admin_comment && (
                  <p className="text-error font-semibold"><strong>Nhận xét từ Admin:</strong> {selectedTask.admin_comment}</p>
                )}
              </div>

              {selectedTask.status === "pending" || selectedTask.status === "rejected" ? (
                <form onSubmit={handleSubmitClarification} className="space-y-md pt-sm">
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-md font-bold text-on-surface" htmlFor="explanation-content">
                      Nội dung giải trình gửi Ban quản lý
                    </label>
                    <textarea
                      id="explanation-content"
                      placeholder="Giải trình cụ thể nguyên nhân kết quả học phần thấp..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-sm focus:border-primary focus:outline-none"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="text-label-md font-bold text-on-surface" htmlFor="commitment-text">
                      Cam kết cải tiến học kỳ tới (Commitment)
                    </label>
                    <textarea
                      id="commitment-text"
                      placeholder="Cam kết giải pháp khắc phục (ví dụ: bổ sung slide bài giảng, tổ chức thêm giờ phụ đạo)..."
                      value={commitment}
                      onChange={(e) => setCommitment(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-sm focus:border-primary focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex flex-col gap-xs border-t border-outline-variant/30 pt-md">
                    <label className="text-label-md font-bold text-on-surface" htmlFor="student-msg">
                      Lời nhắn gửi trực tiếp tới Sinh viên lớp học (Closing the Loop)
                    </label>
                    <p className="text-xs text-on-surface-variant mb-1">
                      (Lời nhắn này sẽ được chuyển tới sinh viên sau khi Ban quản lý phê duyệt)
                    </p>
                    <textarea
                      id="student-msg"
                      placeholder="Thầy/Cô đã ghi nhận phản hồi và sẽ bổ sung thêm tài liệu bài tập..."
                      value={studentMessage}
                      onChange={(e) => setStudentMessage(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-sm focus:border-primary focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-sm justify-end pt-sm">
                    <button
                      type="submit"
                      className="px-md py-2.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                    >
                      Gửi giải trình &amp; Phản hồi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-md bg-surface border border-outline-variant rounded-lg space-y-sm text-sm">
                  <p><strong>Nội dung đã giải trình:</strong> {selectedTask.explanation_content}</p>
                  {selectedTask.commitment_text && (
                    <p><strong>Cam kết cải tiến:</strong> {selectedTask.commitment_text}</p>
                  )}
                  <p className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Giải trình đã được gửi đi và xử lý.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-outline-variant/30 p-xl text-center text-on-surface-variant font-body-md min-h-[300px] flex flex-col justify-center items-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-sm">arrow_selector_tool</span>
              Vui lòng chọn một yêu cầu giải trình ở danh sách bên trái để thực hiện.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
