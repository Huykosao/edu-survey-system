"use client";

import React, { useState, useEffect, useCallback } from "react";
import { surveysApi, aiApi, labelsApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Survey {
  id: number;
  title: string;
  status: string;
  target_config: { role?: string; role_id?: number };
}

interface Label {
  id: number;
  label_name: string;
  role_id: number;
}

interface LabelSentiment {
  label_name: string;
  total_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
}

interface TrendSection {
  topic: string;
  sentiment_score: string;
  key_points: string[];
  problems: string[];
  suggestions: string[];
}

interface AIReport {
  executive_summary: string;
  detailed_analysis: TrendSection[];
  overall_recommendation: string;
  created_at?: string;
}

interface AIOverview {
  overview: {
    total_responses?: number;
    total_open_feedbacks?: number;
    total_labels?: number;
    positive_count?: number;
    negative_count?: number;
    neutral_count?: number;
  };
  label_summary: LabelSentiment[];
  question_summary: {
    question_id: string;
    total_count: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
  }[];
}

// ─── ROLE ID Map ──────────────────────────────────────────────────────────────
const ROLE_ID_MAP: Record<string, number> = {
  STUDENT: 4,
  ALUMNI: 3,
  EMPLOYER: 5,
  LECTURER: 2,
};

// ─── Sentiment Bar ────────────────────────────────────────────────────────────
const SentimentBar = ({
  positive,
  negative,
  neutral,
  total,
}: {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}) => {
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return (
    <div className="space-y-1">
      <div className="flex h-3 rounded-full overflow-hidden bg-surface-variant">
        <div
          style={{ width: `${pct(positive)}%` }}
          className="bg-emerald-500 transition-all duration-700"
          title={`Tích cực: ${positive}`}
        />
        <div
          style={{ width: `${pct(neutral)}%` }}
          className="bg-amber-400 transition-all duration-700"
          title={`Trung lập: ${neutral}`}
        />
        <div
          style={{ width: `${pct(negative)}%` }}
          className="bg-rose-500 transition-all duration-700"
          title={`Tiêu cực: ${negative}`}
        />
      </div>
      <div className="flex gap-3 text-[10px] font-bold">
        <span className="text-emerald-600 flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Tích cực {pct(positive)}%
        </span>
        <span className="text-amber-600 flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Trung lập {pct(neutral)}%
        </span>
        <span className="text-rose-600 flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          Tiêu cực {pct(negative)}%
        </span>
      </div>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; label: string }> = {
    published: {
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "Đang khảo sát",
    },
    closed: {
      cls: "bg-slate-100 text-slate-600 border-slate-200",
      label: "Đã đóng",
    },
    draft: {
      cls: "bg-amber-100 text-amber-700 border-amber-200",
      label: "Bản nháp",
    },
  };
  const cfg = map[status] || map.draft;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({
  msg,
  type,
}: {
  msg: string;
  type: "success" | "error" | "info";
}) => {
  const cls = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-primary",
  }[type];
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] ${cls} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300`}
    >
      <span className="material-symbols-outlined text-[18px]">
        {type === "success"
          ? "check_circle"
          : type === "error"
            ? "error"
            : "info"}
      </span>
      {msg}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState<"labels" | "classify" | "report">(
    "labels",
  );
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Labels tab state
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [labelRoleId, setLabelRoleId] = useState<number>(4);
  const [addingLabel, setAddingLabel] = useState(false);

  // Classify tab state
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<string | null>(null);

  // Overview state (for classify tab)
  const [overview, setOverview] = useState<AIOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Report tab state
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const showToast = (msg: string, type: "success" | "error" | "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load all surveys (published + closed)
  useEffect(() => {
    Promise.all([
      surveysApi.list({ status: "published" }),
      surveysApi.list({ status: "closed" }),
    ])
      .then(([pub, closed]: any) => {
        const combined = [...(pub.data || []), ...(closed.data || [])];
        setSurveys(combined);
        if (combined.length > 0) setSelectedSurveyId(combined[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingSurveys(false));
  }, []);

  const selectedSurvey = surveys.find((s) => s.id === selectedSurveyId);
  const surveyRoleId = selectedSurvey
    ? (selectedSurvey.target_config?.role_id ||
        ROLE_ID_MAP[selectedSurvey.target_config?.role || "STUDENT"] ||
        4)
    : 4;

  // Load labels
  const loadLabels = useCallback(
    async (roleId: number) => {
      setLoadingLabels(true);
      try {
        const res: any = await labelsApi.listByRole(roleId);
        // API returns { items: [...], total: N }
        setLabels(res?.items || res?.data || []);
      } catch {
        setLabels([]);
      } finally {
        setLoadingLabels(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadLabels(labelRoleId);
  }, [labelRoleId, loadLabels]);

  // Load overview when switching to classify tab
  useEffect(() => {
    if (activeTab === "classify" && selectedSurveyId) {
      setLoadingOverview(true);
      aiApi
        .getOverview(selectedSurveyId)
        .then((res: any) => setOverview(res))
        .catch(() => setOverview(null))
        .finally(() => setLoadingOverview(false));
    }
  }, [activeTab, selectedSurveyId]);

  // Load saved report when switching to report tab
  useEffect(() => {
    if (activeTab === "report" && selectedSurveyId) {
      setLoadingReport(true);
      aiApi
        .getReport(selectedSurveyId)
        .then((res: any) => {
          if (res) {
            setAiReport({
              executive_summary: res.summary_text,
              detailed_analysis: res.key_findings || [],
              overall_recommendation: res.recommendations,
              created_at: res.created_at,
            });
          } else {
            setAiReport(null);
          }
        })
        .catch(() => setAiReport(null))
        .finally(() => setLoadingReport(false));
    }
  }, [activeTab, selectedSurveyId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    setAddingLabel(true);
    try {
      await labelsApi.create({ role_id: labelRoleId, label_name: newLabelName.trim() });
      setNewLabelName("");
      showToast("Đã thêm nhãn thành công!", "success");
      loadLabels(labelRoleId);
    } catch {
      showToast("Lỗi khi thêm nhãn. Vui lòng thử lại.", "error");
    } finally {
      setAddingLabel(false);
    }
  };

  const handleClassify = async () => {
    if (!selectedSurveyId) return;
    setClassifying(true);
    setClassifyResult(null);
    try {
      const res = await aiApi.classify(selectedSurveyId, surveyRoleId);
      setClassifyResult(res.message);
      showToast(res.message, "success");
      // Refresh overview
      const newOverview = await aiApi.getOverview(selectedSurveyId) as any;
      setOverview(newOverview);
    } catch (err: any) {
      const msg = err?.data?.detail || "Lỗi khi chạy AI gán nhãn.";
      setClassifyResult(`❌ ${msg}`);
      showToast(msg, "error");
    } finally {
      setClassifying(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedSurveyId) return;
    setGeneratingReport(true);
    setAiReport(null);
    try {
      const res: any = await aiApi.generateReport(selectedSurveyId);
      setAiReport({
        executive_summary: res.executive_summary,
        detailed_analysis: res.detailed_analysis || [],
        overall_recommendation: res.overall_recommendation,
        created_at: new Date().toISOString(),
      });
      showToast("Đã tạo báo cáo AI thành công!", "success");
    } catch (err: any) {
      const msg = err?.data?.detail || "Lỗi khi tạo báo cáo AI.";
      showToast(msg, "error");
    } finally {
      setGeneratingReport(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300 pb-12">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Page Header */}
      <div className="flex flex-col gap-xs border-b border-outline-variant/30 pb-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <span className="material-symbols-outlined text-white text-[22px]">
              psychology
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Trung tâm Phân tích AI
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Gán nhãn tự động · Phân tích cảm xúc · Báo cáo xu hướng
            </p>
          </div>
        </div>
      </div>

      {/* Survey Selector */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-md flex flex-col sm:flex-row sm:items-center gap-md">
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-[20px]">
            assignment
          </span>
          <span className="text-sm font-bold text-on-surface">
            Khảo sát đang phân tích:
          </span>
        </div>
        {loadingSurveys ? (
          <div className="h-9 bg-surface-container rounded-lg animate-pulse flex-1" />
        ) : surveys.length === 0 ? (
          <p className="text-sm text-on-surface-variant italic">
            Chưa có khảo sát nào được phát hành hoặc đóng.
          </p>
        ) : (
          <select
            value={selectedSurveyId || ""}
            onChange={(e) => {
              setSelectedSurveyId(Number(e.target.value));
              setClassifyResult(null);
              setAiReport(null);
              setOverview(null);
            }}
            className="flex-1 p-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} — {s.title} ({s.target_config?.role || "STUDENT"})
              </option>
            ))}
          </select>
        )}
        {selectedSurvey && (
          <StatusBadge status={selectedSurvey.status} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/30">
        {[
          { key: "labels", label: "Quản lý Nhãn", icon: "label" },
          { key: "classify", label: "Gán nhãn AI", icon: "auto_awesome" },
          { key: "report", label: "Báo cáo phân tích", icon: "insights" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: LABEL MANAGEMENT ─────────────────────────────────────────────── */}
      {activeTab === "labels" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
          {/* Left: Role selector + Add label */}
          <div className="lg:col-span-2 space-y-md">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-lg shadow-sm">
              <h2 className="font-bold text-on-surface text-base mb-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  category
                </span>
                Thêm nhãn phân loại mới
              </h2>

              <form onSubmit={handleAddLabel} className="space-y-md">
                <div className="space-y-xs">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Nhóm đối tượng
                  </label>
                  <select
                    value={labelRoleId}
                    onChange={(e) => setLabelRoleId(Number(e.target.value))}
                    className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:border-primary focus:outline-none"
                  >
                    <option value={4}>Sinh viên (STUDENT)</option>
                    <option value={3}>Cựu sinh viên (ALUMNI)</option>
                    <option value={5}>Nhà tuyển dụng (EMPLOYER)</option>
                    <option value={2}>Giảng viên (LECTURER)</option>
                  </select>
                </div>

                <div className="space-y-xs">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Tên nhãn
                  </label>
                  <input
                    type="text"
                    required
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Ví dụ: Cơ sở vật chất, Phong cách giảng dạy..."
                    className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingLabel}
                  className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 transition-colors cursor-pointer shadow-sm"
                >
                  {addingLabel ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">
                      add_circle
                    </span>
                  )}
                  {addingLabel ? "Đang thêm..." : "Thêm nhãn"}
                </button>
              </form>

              <div className="mt-md pt-md border-t border-outline-variant/30">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-primary">Lưu ý:</span> Nhãn
                  được dùng để AI phân loại các câu trả lời mở của phản hồi
                  viên. Mỗi nhóm đối tượng có bộ nhãn riêng.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Label list */}
          <div className="lg:col-span-3">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-lg shadow-sm">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-bold text-on-surface text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    sell
                  </span>
                  Danh sách nhãn
                  {!loadingLabels && (
                    <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      {labels.length}
                    </span>
                  )}
                </h2>
                <select
                  value={labelRoleId}
                  onChange={(e) => setLabelRoleId(Number(e.target.value))}
                  className="p-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:outline-none"
                >
                  <option value={4}>Sinh viên</option>
                  <option value={3}>Cựu sinh viên</option>
                  <option value={5}>Nhà tuyển dụng</option>
                  <option value={2}>Giảng viên</option>
                </select>
              </div>

              {loadingLabels ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-surface-container rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : labels.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl text-outline mb-3">
                    label_off
                  </span>
                  <p className="text-sm font-medium">
                    Chưa có nhãn nào cho nhóm này.
                  </p>
                  <p className="text-xs text-outline mt-1">
                    Hãy thêm nhãn ở bên trái để bắt đầu.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  {labels.map((label, idx) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/30 group hover:border-primary/30 hover:bg-primary/3 transition-all duration-150"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {label.label_name}
                        </p>
                        <p className="text-[10px] text-outline">
                          ID: {label.id}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-primary transition-colors">
                        label
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CLASSIFY ─────────────────────────────────────────────────────── */}
      {activeTab === "classify" && (
        <div className="space-y-lg">
          {/* Action Card */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
              <div className="space-y-xs flex-1 min-w-0">
                <h2 className="font-bold text-on-surface text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-600 text-[22px]">
                    auto_awesome
                  </span>
                  Gán nhãn AI tự động
                </h2>
                <p className="text-xs text-on-surface-variant max-w-[450px] leading-relaxed">
                  AI sẽ quét toàn bộ câu trả lời mở trong khảo sát, phân loại
                  theo nhãn đã cài đặt, và gán nhãn cảm xúc{" "}
                  <span className="font-bold text-emerald-600">tích cực</span>,{" "}
                  <span className="font-bold text-rose-600">tiêu cực</span>,{" "}
                  <span className="font-bold text-amber-600">trung lập</span>.
                </p>
                {selectedSurvey && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                      Khảo sát #{selectedSurveyId} · Role ID:{" "}
                      {surveyRoleId}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleClassify}
                disabled={classifying || !selectedSurveyId}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200 cursor-pointer shrink-0"
              >
                {classifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      psychology
                    </span>
                    Chạy AI Gán nhãn
                  </>
                )}
              </button>
            </div>

            {/* Result Banner */}
            {classifyResult && (
              <div
                className={`mt-md p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                  classifyResult.startsWith("❌")
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {classifyResult.startsWith("❌")
                    ? "error"
                    : "check_circle"}
                </span>
                {classifyResult.replace("❌ ", "")}
              </div>
            )}
          </div>

          {/* Overview Stats */}
          {loadingOverview ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-surface-container rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : overview?.overview ? (
            <>
              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
                {[
                  {
                    label: "Phiếu khảo sát",
                    value: overview.overview.total_responses ?? 0,
                    icon: "assignment",
                    color: "#6750A4",
                  },
                  {
                    label: "Phản hồi mở",
                    value: overview.overview.total_open_feedbacks ?? 0,
                    icon: "chat_bubble",
                    color: "#006A60",
                  },
                  {
                    label: "Nhãn đã gán",
                    value: overview.overview.total_labels ?? 0,
                    icon: "sell",
                    color: "#984061",
                  },
                  {
                    label: "Tích cực",
                    value: overview.overview.positive_count ?? 0,
                    icon: "sentiment_satisfied",
                    color: "#16a34a",
                  },
                  {
                    label: "Trung lập",
                    value: overview.overview.neutral_count ?? 0,
                    icon: "sentiment_neutral",
                    color: "#d97706",
                  },
                  {
                    label: "Tiêu cực",
                    value: overview.overview.negative_count ?? 0,
                    icon: "sentiment_dissatisfied",
                    color: "#dc2626",
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-md shadow-sm flex flex-col gap-xs"
                    style={{ borderBottomColor: kpi.color, borderBottomWidth: 3 }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: kpi.color }}
                    >
                      {kpi.icon}
                    </span>
                    <p className="text-2xl font-black text-on-surface">
                      {kpi.value}
                    </p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider">
                      {kpi.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Label Sentiment Breakdown */}
              {overview.label_summary.length > 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-lg shadow-sm">
                  <h3 className="font-bold text-on-surface text-sm mb-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      bar_chart
                    </span>
                    Phân tích cảm xúc theo nhãn
                  </h3>
                  <div className="space-y-md">
                    {overview.label_summary.map((item) => (
                      <div key={item.label_name} className="space-y-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-on-surface">
                            {item.label_name}
                          </span>
                          <span className="text-xs text-outline font-bold">
                            {item.total_count} phản hồi
                          </span>
                        </div>
                        <SentimentBar
                          positive={item.positive_count}
                          negative={item.negative_count}
                          neutral={item.neutral_count}
                          total={item.total_count}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-2xl p-xl flex flex-col items-center text-outline gap-3">
              <span className="material-symbols-outlined text-4xl">analytics</span>
              <p className="text-sm font-medium">
                Chưa có dữ liệu phân tích. Hãy chạy AI Gán nhãn trước.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: AI REPORT ────────────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="space-y-lg">
          {/* Action Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 border border-indigo-200 rounded-2xl p-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
              <div className="space-y-xs flex-1 min-w-0">
                <h2 className="font-bold text-on-surface text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[22px]">
                    insights
                  </span>
                  Tạo báo cáo phân tích AI
                </h2>
                <p className="text-xs text-on-surface-variant max-w-[450px] leading-relaxed">
                  AI sẽ tổng hợp dữ liệu định lượng (điểm số Likert/NPS) và
                  định tính (nhãn đã gán) để lập báo cáo xu hướng và đề xuất
                  giải pháp cải thiện.
                </p>
                {aiReport?.created_at && (
                  <p className="text-[10px] text-outline font-medium">
                    Báo cáo gần nhất:{" "}
                    {new Date(aiReport.created_at).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={generatingReport || !selectedSurveyId}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200 cursor-pointer shrink-0"
              >
                {generatingReport ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      auto_awesome
                    </span>
                    Tạo báo cáo AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loadingReport && (
            <div className="flex items-center justify-center py-12 gap-3">
              <span className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-on-surface-variant">
                Đang tải báo cáo...
              </span>
            </div>
          )}

          {/* Generating */}
          {generatingReport && (
            <div className="bg-surface-container-lowest border border-indigo-200 rounded-2xl p-xl flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                    psychology
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-on-surface">
                  AI đang phân tích dữ liệu...
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Quá trình này có thể mất 30 – 60 giây
                </p>
              </div>
              <div className="flex gap-1 mt-2">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Report Display */}
          {!loadingReport && !generatingReport && aiReport && (
            <div className="space-y-lg animate-in fade-in duration-500">
              {/* Executive Summary */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-lg shadow-sm">
                <h3 className="font-bold text-primary text-base mb-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    summarize
                  </span>
                  Tóm tắt Điều hành
                </h3>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                  {aiReport.executive_summary}
                </p>
              </div>

              {/* Detailed Analysis */}
              {aiReport.detailed_analysis.length > 0 && (
                <div>
                  <h3 className="font-bold text-on-surface text-base mb-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      analytics
                    </span>
                    Phân tích chi tiết theo chủ đề
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                    {aiReport.detailed_analysis.map((section, idx) => (
                      <div
                        key={idx}
                        className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        {/* Topic Header */}
                        <div className="flex items-start justify-between gap-md mb-md">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                              {idx + 1}
                            </div>
                            <h4 className="font-bold text-on-surface text-sm leading-snug">
                              {section.topic}
                            </h4>
                          </div>
                          {section.sentiment_score && (
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                section.sentiment_score
                                  .toLowerCase()
                                  .includes("tích cực") ||
                                section.sentiment_score
                                  .toLowerCase()
                                  .includes("positive")
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : section.sentiment_score
                                        .toLowerCase()
                                        .includes("tiêu cực") ||
                                      section.sentiment_score
                                        .toLowerCase()
                                        .includes("negative")
                                    ? "bg-rose-100 text-rose-800 border-rose-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                            >
                              {section.sentiment_score}
                            </span>
                          )}
                        </div>

                        {/* Key Points */}
                        {section.key_points.length > 0 && (
                          <div className="mb-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-outline mb-1.5">
                              Điểm nổi bật
                            </p>
                            <ul className="space-y-1">
                              {section.key_points.map((pt, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-on-surface-variant"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Problems */}
                        {section.problems.length > 0 && (
                          <div className="mb-sm p-sm bg-rose-50 rounded-xl border border-rose-100">
                            <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 mb-1.5">
                              Vấn đề tồn tại
                            </p>
                            <ul className="space-y-1">
                              {section.problems.map((pr, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-rose-700"
                                >
                                  <span className="material-symbols-outlined text-[12px] mt-0.5 shrink-0">
                                    warning
                                  </span>
                                  {pr}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggestions */}
                        {section.suggestions.length > 0 && (
                          <div className="p-sm bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 mb-1.5">
                              Đề xuất cải thiện
                            </p>
                            <ul className="space-y-1">
                              {section.suggestions.map((sg, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-emerald-800"
                                >
                                  <span className="material-symbols-outlined text-[12px] mt-0.5 shrink-0">
                                    lightbulb
                                  </span>
                                  {sg}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Recommendation */}
              {aiReport.overall_recommendation && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-lg shadow-sm">
                  <h3 className="font-bold text-emerald-800 text-base mb-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      tips_and_updates
                    </span>
                    Khuyến nghị Tổng thể
                  </h3>
                  <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-line">
                    {aiReport.overall_recommendation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loadingReport && !generatingReport && !aiReport && (
            <div className="bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-2xl p-xl flex flex-col items-center text-outline gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-full scale-[2.5] blur-xl" />
                <div className="relative w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center border border-outline-variant/20 shadow-sm">
                  <span className="material-symbols-outlined text-4xl text-indigo-400">
                    description
                  </span>
                </div>
              </div>
              <div className="text-center w-full">
                <p className="font-bold text-on-surface text-base">
                  Chưa có báo cáo AI nào
                </p>
                <p className="text-sm text-on-surface-variant mt-2 w-full max-w-[380px] mx-auto leading-relaxed">
                  Nhấn <span className="font-bold">Tạo báo cáo AI</span> ở trên
                  để AI phân tích và lập báo cáo xu hướng cho khảo sát này.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
