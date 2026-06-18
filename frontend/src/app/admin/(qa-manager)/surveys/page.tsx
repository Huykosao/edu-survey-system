"use client";

import React, { useState, useEffect } from "react";
import { surveysApi, facultiesApi, majorsApi, subjectsApi, usersApi } from "@/lib/api";

interface Survey {
  id: number;
  title: string;
  description: string;
  status: "draft" | "published" | "closed";
  is_anonymous: boolean;
  target_config: any;
  content?: any;
  created_at: string;
}

export default function SurveysManagerPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published" | "closed" | "resolved">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Master Data lists
  const [faculties, setFaculties] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);

  // Edit/Builder State
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsAnonymous, setEditIsAnonymous] = useState(true);
  const [editTargetRole, setEditTargetRole] = useState("STUDENT");
  const [editSections, setEditSections] = useState<any[]>([]);
  const [editTargetFacultyId, setEditTargetFacultyId] = useState("");
  const [editTargetMajorId, setEditTargetMajorId] = useState("");
  const [editTargetSubjectId, setEditTargetSubjectId] = useState("");
  const [editTargetLecturerId, setEditTargetLecturerId] = useState("");

  // Create Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [targetRole, setTargetRole] = useState("STUDENT");
  const [targetFacultyId, setTargetFacultyId] = useState("");
  const [targetMajorId, setTargetMajorId] = useState("");
  const [targetSubjectId, setTargetSubjectId] = useState("");
  const [targetLecturerId, setTargetLecturerId] = useState("");

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
    
    // Load Master Data
    facultiesApi.list().then(res => setFaculties(res || [])).catch(console.error);
    majorsApi.list().then(res => setMajors(res || [])).catch(console.error);
    subjectsApi.list().then(res => setSubjects(res || [])).catch(console.error);
    usersApi.list({ role: "LECTURER", limit: 100 }).then(res => setLecturers(res.data || [])).catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetConfig: Record<string, any> = { role: targetRole };
    if (targetFacultyId) targetConfig.faculty_id = Number(targetFacultyId);
    if (targetMajorId) targetConfig.major_id = Number(targetMajorId);
    if (targetSubjectId) targetConfig.subject_id = Number(targetSubjectId);
    if (targetLecturerId) targetConfig.lecturer_id = Number(targetLecturerId);

    try {
      await surveysApi.create({
        title,
        description,
        is_anonymous: isAnonymous,
        status: "draft",
        target_config: targetConfig,
        content: {
          sections: [
            {
              id: "s1",
              title: "Phần 1: Khảo sát ý kiến học viên",
              description: "Vui lòng trả lời các câu hỏi đánh giá dưới đây.",
              questions: [
                {
                  id: "q1",
                  type: "likert",
                  label: "Giảng viên giảng dạy rõ ràng và dễ hiểu.",
                  required: true,
                  min_label: "Hoàn toàn không đồng ý",
                  max_label: "Hoàn toàn đồng ý"
                },
                {
                  id: "q2",
                  type: "open_ended",
                  label: "Góp ý thêm cho giảng viên hoặc học phần (nếu có):",
                  required: false,
                  placeholder: "Nhập ý kiến của bạn...",
                  max_length: 1000
                }
              ]
            }
          ]
        }
      });
      setTitle("");
      setDescription("");
      setIsAnonymous(true);
      setTargetFacultyId("");
      setTargetMajorId("");
      setTargetSubjectId("");
      setTargetLecturerId("");
      setShowCreateModal(false);
      loadSurveys();
    } catch (err) {
      console.error("Error creating survey:", err);
      alert("Lỗi khi tạo khảo sát. Vui lòng thử lại.");
    }
  };

  // Edit / Builder Actions
  const handleStartEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setEditTitle(survey.title);
    setEditDescription(survey.description || "");
    setEditIsAnonymous(survey.is_anonymous);
    setEditTargetRole(survey.target_config?.role || "STUDENT");
    setEditTargetFacultyId(survey.target_config?.faculty_id ? String(survey.target_config.faculty_id) : "");
    setEditTargetMajorId(survey.target_config?.major_id ? String(survey.target_config.major_id) : "");
    setEditTargetSubjectId(survey.target_config?.subject_id ? String(survey.target_config.subject_id) : "");
    setEditTargetLecturerId(survey.target_config?.lecturer_id ? String(survey.target_config.lecturer_id) : "");
    
    const content = survey.content || {};
    const sectionsList = content.sections || [
      {
        id: "s1",
        title: "Phần 1: Nội dung khảo sát",
        description: "",
        questions: []
      }
    ];
    setEditSections(JSON.parse(JSON.stringify(sectionsList)));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurvey) return;
    if (!editTitle.trim()) return;

    const targetConfig: Record<string, any> = { role: editTargetRole };
    if (editTargetFacultyId) targetConfig.faculty_id = Number(editTargetFacultyId);
    if (editTargetMajorId) targetConfig.major_id = Number(editTargetMajorId);
    if (editTargetSubjectId) targetConfig.subject_id = Number(editTargetSubjectId);
    if (editTargetLecturerId) targetConfig.lecturer_id = Number(editTargetLecturerId);

    try {
      await surveysApi.update(editingSurvey.id, {
        title: editTitle,
        description: editDescription,
        is_anonymous: editIsAnonymous,
        target_config: targetConfig,
        content: {
          sections: editSections
        }
      });
      setEditingSurvey(null);
      loadSurveys();
    } catch (err) {
      console.error("Error updating survey:", err);
      alert("Lỗi cập nhật khảo sát. Vui lòng kiểm tra lại cấu trúc câu hỏi.");
    }
  };

  // Section Management
  const addSection = () => {
    const newSectionId = `s_${Date.now()}`;
    setEditSections(prev => [
      ...prev,
      {
        id: newSectionId,
        title: `Phần ${prev.length + 1}`,
        description: "",
        questions: []
      }
    ]);
  };

  const removeSection = (sectionId: string) => {
    if (editSections.length <= 1) {
      alert("Khảo sát phải có ít nhất một phần.");
      return;
    }
    setEditSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const updateSectionField = (sectionId: string, field: string, value: string) => {
    setEditSections(prev => prev.map(s => s.id === sectionId ? { ...s, [field]: value } : s));
  };

  // Question Management
  const addQuestion = (sectionId: string) => {
    setEditSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const newQId = `q_${Date.now()}`;
      return {
        ...s,
        questions: [
          ...s.questions,
          {
            id: newQId,
            type: "likert",
            label: "Nội dung câu hỏi mới",
            required: true,
            min_label: "Hoàn toàn không đồng ý",
            max_label: "Hoàn toàn đồng ý"
          }
        ]
      };
    }));
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    setEditSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.filter((q: any) => q.id !== questionId)
      };
    }));
  };

  const updateQuestionField = (sectionId: string, questionId: string, field: string, value: any) => {
    setEditSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map((q: any) => {
          if (q.id !== questionId) return q;
          const updated = { ...q, [field]: value };
          
          if (field === "type") {
            if (value === "likert") {
              updated.min_label = "Hoàn toàn không đồng ý";
              updated.max_label = "Hoàn toàn đồng ý";
              delete updated.options;
              delete updated.max_selections;
              delete updated.rows;
              delete updated.columns;
            } else if (value === "nps") {
              updated.min_label = "Hoàn toàn không";
              updated.max_label = "Chắc chắn có";
              delete updated.options;
              delete updated.max_selections;
              delete updated.rows;
              delete updated.columns;
            } else if (value === "single_choice" || value === "multiple_choice") {
              updated.options = ["Lựa chọn A", "Lựa chọn B"];
              if (value === "multiple_choice") {
                updated.max_selections = undefined;
              } else {
                delete updated.max_selections;
              }
              delete updated.min_label;
              delete updated.max_label;
              delete updated.rows;
              delete updated.columns;
            } else if (value === "matrix") {
              updated.rows = ["Tiêu chí A"];
              updated.columns = ["Kém", "Khá", "Tốt"];
              delete updated.options;
              delete updated.max_selections;
              delete updated.min_label;
              delete updated.max_label;
            } else if (value === "open_ended") {
              updated.placeholder = "Nhập ý kiến của bạn tại đây...";
              updated.max_length = 1000;
              delete updated.options;
              delete updated.max_selections;
              delete updated.min_label;
              delete updated.max_label;
              delete updated.rows;
              delete updated.columns;
            }
          }
          return updated;
        })
      };
    }));
  };

  // Helper arrays update
  const addArrayValue = (sectionId: string, questionId: string, field: "options" | "rows" | "columns") => {
    setEditSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map((q: any) => {
          if (q.id !== questionId) return q;
          const currentArr = q[field] || [];
          return {
            ...q,
            [field]: [...currentArr, `Mục mới ${currentArr.length + 1}`]
          };
        })
      };
    }));
  };

  const removeArrayValue = (sectionId: string, questionId: string, field: "options" | "rows" | "columns", index: number) => {
    setEditSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map((q: any) => {
          if (q.id !== questionId) return q;
          const currentArr = q[field] || [];
          if (currentArr.length <= 1) {
            alert("Phải có ít nhất 1 mục.");
            return q;
          }
          return {
            ...q,
            [field]: currentArr.filter((_: any, idx: number) => idx !== index)
          };
        })
      };
    }));
  };

  const updateArrayValue = (sectionId: string, questionId: string, field: "options" | "rows" | "columns", index: number, val: string) => {
    setEditSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map((q: any) => {
          if (q.id !== questionId) return q;
          const currentArr = [...(q[field] || [])];
          currentArr[index] = val;
          return {
            ...q,
            [field]: currentArr
          };
        })
      };
    }));
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
      alert("Lỗi khi xóa khảo sát.");
    }
  };

  const filteredSurveys = surveys.filter((s) => {
    if (activeTab === "all") return true;
    if (activeTab === "resolved") return !!s.target_config?.is_resolved;
    return s.status === activeTab && !s.target_config?.is_resolved;
  });

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
    <div className="flex flex-col gap-lg animate-in fade-in duration-300 h-auto md:h-full min-h-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Quản lý Khảo sát</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Tạo lập và quản lý các biểu mẫu khảo sát chất lượng giảng dạy, cơ sở vật chất.
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
          { key: "resolved", label: "Đã giải quyết" },
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
        <div className="flex-1 min-h-[300px] flex flex-col justify-center items-center text-primary bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm gap-md">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <span className="text-body-md text-on-surface-variant">Đang tải danh sách khảo sát...</span>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="flex-1 min-h-[300px] flex flex-col justify-center items-center text-on-surface-variant font-body-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm gap-2">
          <span className="material-symbols-outlined text-5xl text-outline mb-1 block">assignment_late</span>
          Không tìm thấy chiến dịch khảo sát nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch content-start gap-lg md:flex-1 md:min-h-0 md:overflow-y-auto overflow-visible pr-2 custom-scrollbar pb-4">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col justify-between hover:shadow-md hover:border-primary/25 transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start gap-md mb-sm">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(survey.status)}`}>
                      {getStatusLabel(survey.status)}
                    </span>
                    {survey.target_config?.is_resolved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-green-100 text-green-800 border-green-200">
                        Đã giải quyết
                      </span>
                    )}
                  </div>
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

              <div className="border-t border-outline-variant/30 pt-sm mt-md flex flex-wrap justify-between items-center gap-sm">
                {survey.status === "draft" ? (
                  <>
                    <button
                      onClick={() => handlePublish(survey.id)}
                      className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">publish</span>
                      Phát hành
                    </button>
                    <button
                      onClick={() => handleStartEdit(survey)}
                      className="text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      className="text-xs font-bold text-error hover:bg-error-container/20 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Xóa
                    </button>
                  </>
                ) : (
                  // Khảo sát đã public hoặc closed thì KHÔNG cho chỉnh sửa / xóa
                  <>
                    {survey.status === "published" && !survey.target_config?.is_resolved && (
                      <button
                        onClick={() => handleClose(survey.id)}
                        className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        Đóng lại
                      </button>
                    )}
                    {(survey.status === "closed" || survey.target_config?.is_resolved) && (
                      <a
                        href={`/admin/reports?sid=${survey.id}`}
                        className="text-xs font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">analytics</span>
                        Xem báo cáo
                      </a>
                    )}
                    <span className="text-[11px] italic text-on-surface-variant">Không thể chỉnh sửa</span>
                  </>
                )}
                
                <button
                  onClick={() => handleDuplicate(survey.id)}
                  className="text-xs font-bold text-primary hover:bg-primary/8 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  Sao chép
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
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[520px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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

              {/* School entity linkage */}
              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/40 space-y-sm">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Gắn đối tượng trường (tuỳ chọn)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs font-semibold text-on-surface-variant">Khoa</label>
                    <select
                      value={targetFacultyId}
                      onChange={(e) => { setTargetFacultyId(e.target.value); setTargetMajorId(""); }}
                      className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Không chọn --</option>
                      {faculties.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs font-semibold text-on-surface-variant">Ngành</label>
                    <select
                      value={targetMajorId}
                      onChange={(e) => setTargetMajorId(e.target.value)}
                      className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                      disabled={!targetFacultyId}
                    >
                      <option value="">-- Không chọn --</option>
                      {majors.filter((m: any) => !targetFacultyId || String(m.faculty_id) === targetFacultyId).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs font-semibold text-on-surface-variant">Môn học</label>
                    <select
                      value={targetSubjectId}
                      onChange={(e) => setTargetSubjectId(e.target.value)}
                      className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Không chọn --</option>
                      {subjects.filter((s: any) => !targetFacultyId || String(s.faculty_id) === targetFacultyId).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs font-semibold text-on-surface-variant">Giảng viên phụ trách</label>
                    <select
                      value={targetLecturerId}
                      onChange={(e) => setTargetLecturerId(e.target.value)}
                      className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Không chọn --</option>
                      {lecturers.map((l: any) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                    </select>
                  </div>
                </div>
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

      {/* Edit Survey / Survey Builder Modal */}
      {editingSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setEditingSurvey(null)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-lg md:p-xl max-w-[850px] w-full max-h-[90vh] flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-sm">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">
                Trình Thiết kế Khảo sát (Survey Builder)
              </h3>
              <button 
                onClick={() => setEditingSurvey(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col gap-lg overflow-y-auto pr-xs">
              
              {/* Metadata Settings */}
              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/40 grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="text-xs font-bold text-on-surface-variant">Tiêu đề khảo sát</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-xs font-bold text-on-surface-variant">Đối tượng khảo sát</label>
                  <select
                    value={editTargetRole}
                    onChange={(e) => setEditTargetRole(e.target.value)}
                    className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none"
                  >
                    <option value="STUDENT">Sinh viên</option>
                    <option value="ALUMNI">Cựu sinh viên</option>
                    <option value="EMPLOYER">Nhà tuyển dụng</option>
                    <option value="LECTURER">Giảng viên</option>
                  </select>
                </div>
                <div className="flex flex-col gap-xs md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant">Mô tả chi tiết</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                {/* School entity linkage for editing */}
                <div className="md:col-span-2 space-y-sm">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider border-t border-outline-variant/40 pt-sm">Gắn đối tượng trường (tuỳ chọn)</p>
                  <div className="grid grid-cols-2 gap-sm">
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant">Khoa</label>
                      <select
                        value={editTargetFacultyId}
                        onChange={(e) => { setEditTargetFacultyId(e.target.value); setEditTargetMajorId(""); }}
                        className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="">-- Không chọn --</option>
                        {faculties.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant">Ngành</label>
                      <select
                        value={editTargetMajorId}
                        onChange={(e) => setEditTargetMajorId(e.target.value)}
                        className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                        disabled={!editTargetFacultyId}
                      >
                        <option value="">-- Không chọn --</option>
                        {majors.filter((m: any) => !editTargetFacultyId || String(m.faculty_id) === editTargetFacultyId).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant">Môn học</label>
                      <select
                        value={editTargetSubjectId}
                        onChange={(e) => setEditTargetSubjectId(e.target.value)}
                        className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="">-- Không chọn --</option>
                        {subjects.filter((s: any) => !editTargetFacultyId || String(s.faculty_id) === editTargetFacultyId).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant">Giảng viên phụ trách</label>
                      <select
                        value={editTargetLecturerId}
                        onChange={(e) => setEditTargetLecturerId(e.target.value)}
                        className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="">-- Không chọn --</option>
                        {lecturers.map((l: any) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-md cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsAnonymous}
                      onChange={(e) => setEditIsAnonymous(e.target.checked)}
                      className="w-[18px] h-[18px] text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface-variant">Khảo sát ẩn danh (Không lưu danh tính người làm)</span>
                  </label>
                </div>
              </div>

              {/* Sections & Questions Builder */}
              <div className="space-y-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">Cấu trúc câu hỏi</h4>
                  <button
                    type="button"
                    onClick={addSection}
                    className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Thêm phần mới
                  </button>
                </div>

                {editSections.map((section, sIdx) => (
                  <div key={section.id} className="border border-outline-variant/60 rounded-xl p-md bg-surface-container-lowest shadow-sm space-y-md">
                    {/* Section Header */}
                    <div className="flex justify-between items-start gap-md">
                      <div className="flex-1 space-y-xs">
                        <input
                          type="text"
                          required
                          placeholder="Tiêu đề phần (ví dụ: Phần 1: Đánh giá môn học)"
                          value={section.title}
                          onChange={(e) => updateSectionField(section.id, "title", e.target.value)}
                          className="w-full text-base font-bold text-primary bg-transparent border-b border-outline-variant/30 focus:border-primary focus:outline-none pb-0.5"
                        />
                        <input
                          type="text"
                          placeholder="Mô tả ngắn cho phần này (không bắt buộc)"
                          value={section.description || ""}
                          onChange={(e) => updateSectionField(section.id, "description", e.target.value)}
                          className="w-full text-xs text-on-surface-variant bg-transparent border-none focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="text-error hover:bg-error/10 p-1.5 rounded-full flex items-center justify-center cursor-pointer"
                        title="Xóa phần này"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                      </button>
                    </div>

                    {/* Questions in Section */}
                    <div className="space-y-md border-l-2 border-primary/20 pl-md">
                      {section.questions.map((q: any, qIdx: number) => (
                        <div key={q.id} className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-md space-y-sm">
                          
                          {/* Question Base Fields */}
                          <div className="flex flex-col sm:flex-row gap-sm justify-between sm:items-center">
                            <span className="text-xs font-bold text-primary">Câu hỏi {qIdx + 1}</span>
                            <div className="flex items-center gap-sm">
                              <label className="flex items-center gap-xs cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) => updateQuestionField(section.id, q.id, "required", e.target.checked)}
                                  className="w-[14px] h-[14px] cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-on-surface-variant">Bắt buộc</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeQuestion(section.id, q.id)}
                                className="text-error hover:bg-error/10 p-1 rounded-full flex items-center justify-center cursor-pointer"
                                title="Xóa câu hỏi"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-sm">
                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                required
                                placeholder="Nhập câu hỏi..."
                                value={q.label}
                                onChange={(e) => updateQuestionField(section.id, q.id, "label", e.target.value)}
                                className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-primary focus:outline-none"
                              />
                            </div>
                            <div>
                              <select
                                value={q.type}
                                onChange={(e) => updateQuestionField(section.id, q.id, "type", e.target.value)}
                                className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-semibold focus:border-primary focus:outline-none h-full"
                              >
                                <option value="likert">Likert (1-5)</option>
                                <option value="single_choice">Một lựa chọn (Radio)</option>
                                <option value="multiple_choice">Nhiều lựa chọn (Checkbox)</option>
                                <option value="matrix">Ma trận đánh giá (Matrix)</option>
                                <option value="nps">NPS (0-10)</option>
                                <option value="open_ended">Câu hỏi mở (Textarea)</option>
                              </select>
                            </div>
                          </div>

                          {/* Question Custom Configs */}
                          {(q.type === "likert" || q.type === "nps") && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm pt-xs">
                              <div className="flex items-center gap-xs">
                                <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">Nhãn nhỏ nhất:</span>
                                <input
                                  type="text"
                                  value={q.min_label || ""}
                                  onChange={(e) => updateQuestionField(section.id, q.id, "min_label", e.target.value)}
                                  className="w-full p-1 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-xs">
                                <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">Nhãn lớn nhất:</span>
                                <input
                                  type="text"
                                  value={q.max_label || ""}
                                  onChange={(e) => updateQuestionField(section.id, q.id, "max_label", e.target.value)}
                                  className="w-full p-1 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {(q.type === "single_choice" || q.type === "multiple_choice") && (
                            <div className="space-y-xs pt-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-on-surface-variant">Lựa chọn trả lời:</span>
                                {q.type === "multiple_choice" && (
                                  <div className="flex items-center gap-xs">
                                    <span className="text-[10px] font-semibold text-on-surface-variant">Giới hạn lựa chọn tối đa:</span>
                                    <input
                                      type="number"
                                      value={q.max_selections || ""}
                                      placeholder="Không giới hạn"
                                      onChange={(e) => updateQuestionField(section.id, q.id, "max_selections", e.target.value ? parseInt(e.target.value) : undefined)}
                                      className="w-16 p-1 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-xs">
                                {q.options?.map((opt: string, optIdx: number) => (
                                  <div key={optIdx} className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/60 rounded px-1.5 py-0.5">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateArrayValue(section.id, q.id, "options", optIdx, e.target.value)}
                                      className="text-xs bg-transparent border-none focus:outline-none w-24"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeArrayValue(section.id, q.id, "options", optIdx)}
                                      className="text-error text-xs hover:bg-error/10 rounded flex items-center justify-center p-0.5 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addArrayValue(section.id, q.id, "options")}
                                  className="text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded px-2 py-0.5 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[10px] font-bold">add</span> Thêm lựa chọn
                                </button>
                              </div>
                            </div>
                          )}

                          {q.type === "matrix" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-xs border-t border-outline-variant/20">
                              
                              {/* Matrix Rows */}
                              <div className="space-y-xs">
                                <span className="text-[11px] font-bold text-on-surface-variant block">Các tiêu chí (Hàng):</span>
                                <div className="flex flex-wrap gap-xs">
                                  {q.rows?.map((row: string, rIdx: number) => (
                                    <div key={rIdx} className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/60 rounded px-1.5 py-0.5">
                                      <input
                                        type="text"
                                        value={row}
                                        onChange={(e) => updateArrayValue(section.id, q.id, "rows", rIdx, e.target.value)}
                                        className="text-xs bg-transparent border-none focus:outline-none w-24"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeArrayValue(section.id, q.id, "rows", rIdx)}
                                        className="text-error text-xs hover:bg-error/10 rounded p-0.5 cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addArrayValue(section.id, q.id, "rows")}
                                    className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/20 rounded px-2 py-0.5 cursor-pointer"
                                  >
                                    + Thêm hàng
                                  </button>
                                </div>
                              </div>

                              {/* Matrix Columns */}
                              <div className="space-y-xs">
                                <span className="text-[11px] font-bold text-on-surface-variant block">Mức đánh giá (Cột):</span>
                                <div className="flex flex-wrap gap-xs">
                                  {q.columns?.map((col: string, cIdx: number) => (
                                    <div key={cIdx} className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/60 rounded px-1.5 py-0.5">
                                      <input
                                        type="text"
                                        value={col}
                                        onChange={(e) => updateArrayValue(section.id, q.id, "columns", cIdx, e.target.value)}
                                        className="text-xs bg-transparent border-none focus:outline-none w-20"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeArrayValue(section.id, q.id, "columns", cIdx)}
                                        className="text-error text-xs hover:bg-error/10 rounded p-0.5 cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addArrayValue(section.id, q.id, "columns")}
                                    className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/20 rounded px-2 py-0.5 cursor-pointer"
                                  >
                                    + Thêm cột
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}

                          {q.type === "open_ended" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm pt-xs">
                              <div className="flex items-center gap-xs">
                                <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">Placeholder:</span>
                                <input
                                  type="text"
                                  value={q.placeholder || ""}
                                  onChange={(e) => updateQuestionField(section.id, q.id, "placeholder", e.target.value)}
                                  className="w-full p-1 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-xs">
                                <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">Ký tự tối đa:</span>
                                <input
                                  type="number"
                                  value={q.max_length || 1000}
                                  onChange={(e) => updateQuestionField(section.id, q.id, "max_length", parseInt(e.target.value) || 1000)}
                                  className="w-24 p-1 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addQuestion(section.id)}
                      className="w-full py-2 bg-primary/5 text-primary border border-dashed border-primary/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-primary/10 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Thêm câu hỏi mới vào phần này
                    </button>
                  </div>
                ))}
              </div>

              {/* Form Footer */}
              <div className="flex justify-end gap-sm border-t border-outline-variant/40 pt-md mt-md">
                <button
                  type="button"
                  onClick={() => setEditingSurvey(null)}
                  className="px-6 py-2.5 border border-outline-variant rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Lưu cấu hình
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
