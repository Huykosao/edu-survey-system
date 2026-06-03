"use client";

import React, { useState, useEffect } from "react";
import { surveysApi } from "@/lib/api";

interface Survey {
  id: number;
  title: string;
  description: string;
  status: "draft" | "published" | "closed";
  is_anonymous: boolean;
  target_config: any;
  created_at: string;
}

export default function SurveysManagerPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published" | "closed">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [targetRole, setTargetRole] = useState("STUDENT");

  const loadSurveys = () => {
    setLoading(true);
    surveysApi
      .list()
      .then((res: any) => {
        setSurveys(res.data || []);
      })
      .catch((err) => console.error("Error loading surveys:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await surveysApi.create({
        title,
        description,
        is_anonymous: isAnonymous,
        status: "draft",
        target_config: { role: targetRole },
        content: {
          questions: [
            {
              id: "q1",
              type: "scale",
              label: "Đánh giá chất lượng chung của học phần?",
              min: 1,
              max: 5,
            },
            {
              id: "q2",
              type: "text",
              label: "Ý kiến đóng góp cải tiến học phần?",
            },
          ],
        },
      });
      setTitle("");
      setDescription("");
      setIsAnonymous(true);
      setShowCreateModal(false);
      loadSurveys();
    } catch (err) {
      console.error("Error creating survey:", err);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await surveysApi.publish(id);
      loadSurveys();
    } catch (err) {
      console.error("Error publishing:", err);
    }
  };

  const handleClose = async (id: number) => {
    try {
      await surveysApi.close(id);
      loadSurveys();
    } catch (err) {
      console.error("Error closing:", err);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await surveysApi.duplicate(id);
      loadSurveys();
    } catch (err) {
      console.error("Error duplicating:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài khảo sát này không?")) return;
    try {
      await surveysApi.delete(id);
      loadSurveys();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const filteredSurveys = surveys.filter(
    (s) => activeTab === "all" || s.status === activeTab
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "closed":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Đang khảo sát";
      case "closed":
        return "Đã đóng";
      default:
        return "Bản nháp";
    }
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Quản lý Khảo sát (Survey Builder)</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Thiết kế câu hỏi, phân phối đối tượng khảo sát và quản lý trạng thái các chiến dịch đánh giá chất lượng.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add_task</span>
          Thiết kế Khảo sát mới
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-outline-variant gap-lg">
        {[
          { key: "all", label: "Tất cả" },
          { key: "draft", label: "Bản nháp" },
          { key: "published", label: "Đang phát hành" },
          { key: "closed", label: "Đã đóng" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`border-b-2 py-3 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-xl text-center flex flex-col items-center gap-md">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <span className="text-body-md text-on-surface-variant">Đang tải danh sách khảo sát...</span>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="py-xl text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-inner">
          <span className="material-symbols-outlined text-5xl text-outline mb-sm block">assignment_late</span>
          Không tìm thấy chiến dịch khảo sát nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col justify-between hover:shadow-md hover:border-primary/25 transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start gap-md mb-sm">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(survey.status)}`}>
                    {getStatusLabel(survey.status)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {survey.is_anonymous ? "Ẩn danh" : "Công khai danh tính"}
                  </span>
                </div>
                <h3 className="font-label-md text-label-md text-on-surface text-base font-bold mb-xs">
                  {survey.title}
                </h3>
                <p className="font-body-md text-xs text-on-surface-variant line-clamp-3 mb-md leading-relaxed">
                  {survey.description || "Không có mô tả cho khảo sát này."}
                </p>
                <div className="text-[11px] font-semibold text-primary-container bg-primary/8 px-2 py-1 rounded inline-block">
                  🎯 Đối tượng: {survey.target_config?.role || "Sinh viên"}
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-sm mt-md flex justify-between items-center gap-sm">
                {survey.status === "draft" && (
                  <button
                    onClick={() => handlePublish(survey.id)}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">publish</span>
                    Phát hành
                  </button>
                )}
                {survey.status === "published" && (
                  <button
                    onClick={() => handleClose(survey.id)}
                    className="text-xs font-bold text-slate-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Đóng lại
                  </button>
                )}
                <button
                  onClick={() => handleDuplicate(survey.id)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  Sao chép
                </button>
                <button
                  onClick={() => handleDelete(survey.id)}
                  className="text-xs font-bold text-error hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm">
              Thiết kế Khảo sát Mới
            </h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="survey-title">Tiêu đề khảo sát</label>
                <input
                  id="survey-title"
                  type="text"
                  required
                  placeholder="Nhập tiêu đề..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="survey-desc">Mô tả khảo sát</label>
                <textarea
                  id="survey-desc"
                  placeholder="Nhập mô tả chi tiết..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="target-role">Đối tượng khảo sát</label>
                <select
                  id="target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="ALUMNI">Cựu sinh viên</option>
                  <option value="EMPLOYER">Nhà tuyển dụng</option>
                  <option value="LECTURER">Giảng viên</option>
                </select>
              </div>
              <label className="flex items-center gap-md cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-[18px] h-[18px] text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
                />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Khảo sát ẩn danh (Ẩn thông tin sinh viên)</span>
              </label>

              <div className="flex gap-sm justify-end mt-lg">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-md py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Tạo bản nháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
