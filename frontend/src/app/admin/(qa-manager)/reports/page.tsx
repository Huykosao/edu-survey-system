"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { surveysApi, clarificationsApi, improvementsApi, aiApi, usersApi } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// --- Bảng màu chuẩn cho biểu đồ ---
const COLORS = [
  "#6750A4", // Primary
  "#006A60", // Tertiary
  "#984061", // Custom
  "#635F70", // Secondary
  "#7D5260", // Error-ish
  "#005FAF", // Blue
];

// --- Component: Thẻ chỉ số KPI ---
const KPICard = ({ title, value, icon, color, subValue }: any) => (
  <div
    className="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl flex items-center gap-lg shadow-sm border-b-4 animate-in slide-in-from-bottom duration-500"
    style={{ borderBottomColor: color }}
  >
    <div
      className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl`}
      style={{ backgroundColor: `${color}15`, color: color }}
    >
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-outline">
        {title}
      </p>
      <h3 className="text-3xl font-black text-on-surface leading-tight">
        {value}
      </h3>
      {subValue && (
        <p className="text-[10px] font-bold text-on-surface-variant mt-1">
          {subValue}
        </p>
      )}
    </div>
  </div>
);

// --- 1. Biểu đồ Likert (Cột đứng) ---
const LikertChart = ({ stats }: { stats: any }) => {
  const chartData = Object.entries(stats?.score_distribution || {}).map(
    ([key, value]) => ({
      name: `${key}⭐`,
      value,
    }),
  );
  return (
    <div className="w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#EADDFF"
          />
          <XAxis
            dataKey="name"
            fontSize={12}
            tick={{ fill: "#49454F" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            fontSize={12}
            tick={{ fill: "#49454F" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#F3EDF7" }}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Bar
            dataKey="value"
            fill="#6750A4"
            radius={[6, 6, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- 2. Biểu đồ Lựa chọn (Tròn) ---
const ChoiceChart = ({ stats }: { stats: any }) => {
  const chartData = Object.entries(stats.distribution || {}).map(
    ([key, value]: any) => ({
      name: key,
      value: typeof value === "object" ? value.count : value,
    }),
  );
  return (
    <div className="w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- 3. Chỉ số NPS (Đồng hồ bán nguyệt) ---
const NPSIndicator = ({ stats }: { stats: any }) => {
  const score = stats.score ?? 0;
  return (
    <div className="flex flex-col items-center justify-center p-md py-10">
      <div className="relative w-48 h-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 border-[20px] border-surface-variant rounded-full" />
        <div
          className="absolute top-0 left-0 w-48 h-48 border-[20px] border-primary rounded-full transition-transform duration-1000 ease-out"
          style={{
            clipPath: "inset(0 0 50% 0)",
            transform: `rotate(${(score + 100) * 0.9}deg)`,
          }}
        />
      </div>
      <div className="text-center mt-4">
        <span className="text-4xl font-black text-primary">{score}</span>
        <p className="text-[10px] uppercase tracking-widest text-outline font-bold mt-1">
          Net Promoter Score
        </p>
      </div>
      <div className="flex gap-4 mt-6 text-[10px] font-bold">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> P:{" "}
          {stats.distribution?.promoters}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Pa:{" "}
          {stats.distribution?.passives}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> D:{" "}
          {stats.distribution?.detractors}
        </div>
      </div>
    </div>
  );
};

// --- 4. Biểu đồ Ma trận (Thanh tiến độ phân đoạn) ---
const MatrixChart = ({ stats, columns }: { stats: any; columns: string[] }) => (
  <div className="space-y-5 w-full px-2">
    {Object.entries(stats.rows_data || {}).map(([rowLabel, rowDist]: any) => (
      <div key={rowLabel} className="space-y-1.5">
        <p className="text-xs font-bold text-on-surface">{rowLabel}</p>
        <div className="flex h-3 w-full bg-surface-variant rounded-full overflow-hidden shadow-inner">
          {columns.map((colLabel, idx) => {
            const val = rowDist[colLabel] || 0;
            const percentage = stats.total > 0 ? (val / stats.total) * 100 : 0;
            return (
              <div
                key={colLabel}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: COLORS[idx % COLORS.length],
                }}
                title={`${colLabel}: ${val}`}
                className="transition-all hover:opacity-80"
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[8px] text-outline uppercase font-black tracking-tighter">
          {columns.slice(0, 4).map((c) => (
            <span key={c}>
              {c}: {rowDist[c] || 0}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// --- 5. Danh sách câu hỏi mở ---
const OpenEndedList = ({ stats }: { stats: any }) => (
  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
    {stats.latest_samples?.length > 0 ? (
      stats.latest_samples.map((text: string, i: number) => (
        <div
          key={i}
          className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant text-sm text-on-surface-variant italic leading-relaxed shadow-sm"
        >
          &quot;{text}&quot;
        </div>
      ))
    ) : (
      <p className="text-center text-xs text-outline py-20 italic">
        Chưa có phản hồi văn bản nào.
      </p>
    )}
  </div>
);

// --- Sentiment Badge ---
const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const cfg: Record<string, { label: string; className: string }> = {
    POSITIVE: { label: "Tích cực", className: "bg-green-100 text-green-800 border-green-200" },
    NEGATIVE: { label: "Tiêu cực", className: "bg-red-100 text-red-800 border-red-200" },
    NEUTRAL: { label: "Trung lập", className: "bg-slate-100 text-slate-700 border-slate-200" },
  };
  const c = cfg[sentiment] || cfg["NEUTRAL"];
  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${c.className}`}>
      {c.label}
    </span>
  );
};

// --- COMPONENT CHÍNH ---
export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // General stats (from PG functions)
  const [generalStats, setGeneralStats] = useState<any>(null);

  // AI data
  const [aiOverview, setAiOverview] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiFeedbackByLabel, setAiFeedbackByLabel] = useState<any>({});
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [aiRunStatus, setAiRunStatus] = useState<string | null>(null);

  // Post-survey actions states
  const [relatedClarifications, setRelatedClarifications] = useState<any[]>([]);
  const [relatedImprovements, setRelatedImprovements] = useState<any[]>([]);
  const [loadingPostActions, setLoadingPostActions] = useState(false);

  // Clarification modal
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarLecturerId, setClarLecturerId] = useState("");
  const [clarReason, setClarReason] = useState("");
  const [clarDeadline, setClarDeadline] = useState("");
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [clarSubmitting, setClarSubmitting] = useState(false);

  // Improvement modal
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [impTitle, setImpTitle] = useState("");
  const [impContent, setImpContent] = useState("");
  const [impSubmitting, setImpSubmitting] = useState(false);

  // Load surveys (cả published lẫn closed)
  const loadReports = () => {
    setLoading(true);
    Promise.all([
      surveysApi.list({ status: "published" }).catch(() => ({ data: [] })),
      surveysApi.list({ status: "closed" }).catch(() => ({ data: [] })),
    ]).then(([pubRes, closedRes]: any[]) => {
      const pub = pubRes.data || [];
      const closed = closedRes.data || [];
      const allSurveys = [
        ...closed.map((s: any) => ({ ...s, _statusGroup: "closed" })),
        ...pub.map((s: any) => ({ ...s, _statusGroup: "published" })),
      ];
      setReports(allSurveys);

      const idFromUrl = searchParams.get("sid");
      if (idFromUrl) {
        const found = allSurveys.find((r: any) => String(r.id) === idFromUrl);
        if (found) setSelectedReport(found);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
    // Load lecturers for clarification modal
    usersApi.list({ role: "LECTURER", limit: 100 }).then(res => setLecturers(res.data || [])).catch(console.error);
  }, []);

  // Khi chọn khảo sát: load phân tích, stats, AI data, và thông tin xử lý sau khảo sát
  useEffect(() => {
    if (!selectedReport) return;
    setIsAnalysing(true);
    setAnalysis(null);
    setGeneralStats(null);
    setAiOverview(null);
    setAiReport(null);
    setAiFeedbackByLabel({});
    setSelectedLabel(null);
    setRelatedClarifications([]);
    setRelatedImprovements([]);
    setLoadingPostActions(true);

    const currentSid = searchParams.get("sid");
    if (currentSid !== String(selectedReport.id)) {
      router.replace(`?sid=${selectedReport.id}`, { scroll: false });
    }

    const sid = selectedReport.id;

    // Fetch analysis
    surveysApi
      .getAnalysis(sid)
      .then((res: any) => setAnalysis(res))
      .catch(console.error)
      .finally(() => setIsAnalysing(false));

    // Fetch general stats
    surveysApi.getGeneralStats(sid)
      .then((res: any) => setGeneralStats(res))
      .catch(console.error);

    // Fetch related clarifications and improvements
    Promise.all([
      clarificationsApi.listAll().catch(() => [] as any[]),
      improvementsApi.list().catch(() => [] as any[]),
    ])
      .then(([clars, imps]: [any, any]) => {
        const clarsList = Array.isArray(clars) ? clars : (clars?.data || []);
        const impsList = Array.isArray(imps) ? imps : (imps?.data || []);
        setRelatedClarifications(clarsList.filter((c: any) => c.survey_id === sid));
        setRelatedImprovements(impsList.filter((imp: any) => imp.survey_id === sid));
      })
      .catch(console.error)
      .finally(() => setLoadingPostActions(false));

    // If closed, try to load AI data automatically
    if (selectedReport.status === "closed" || selectedReport._statusGroup === "closed") {
      aiApi.getOverview(sid)
        .then((res: any) => setAiOverview(res))
        .catch(() => setAiOverview(null));
      aiApi.getReport(sid)
        .then((res: any) => setAiReport(res))
        .catch(() => setAiReport(null));
      aiApi.getFeedbackByLabel(sid)
        .then((res: any) => setAiFeedbackByLabel(res))
        .catch(() => setAiFeedbackByLabel({}));
    }
  }, [selectedReport]);

  // Tính toán chỉ số Dashboard tổng quan
  const overviewStats = useMemo(() => {
    if (!analysis || !analysis.analysis) return null;

    let totalLikertScore = 0;
    let likertCount = 0;
    let npsScore: number | null = null;
    let totalCompleted = analysis.total_responses || 0;

    Object.values(analysis.analysis).forEach((q: any) => {
      if (q.question_type === "likert" && q.stats.average) {
        totalLikertScore += q.stats.average;
        likertCount++;
      }
      if (q.question_type === "nps" && npsScore === null) {
        npsScore = q.stats.score;
      }
    });

    const globalCSAT =
      likertCount > 0 ? (totalLikertScore / likertCount).toFixed(2) : "N/A";
    const csatPercentage =
      likertCount > 0 ? ((parseFloat(globalCSAT) / 5) * 100).toFixed(0) : 0;

    return { globalCSAT, csatPercentage, npsScore, totalCompleted };
  }, [analysis]);

  const isClosed = selectedReport?.status === "closed" || selectedReport?._statusGroup === "closed";
  const isResolved = !!selectedReport?.target_config?.is_resolved;

  const closedReports = useMemo(() => {
    return reports.filter((r) => r._statusGroup === "closed" && !r.target_config?.is_resolved);
  }, [reports]);

  const publishedReports = useMemo(() => {
    return reports.filter((r) => r._statusGroup === "published" && !r.target_config?.is_resolved);
  }, [reports]);

  const resolvedReports = useMemo(() => {
    return reports.filter((r) => !!r.target_config?.is_resolved);
  }, [reports]);

  const handleToggleResolved = async () => {
    if (!selectedReport) return;
    const nextResolvedState = !isResolved;

    if (nextResolvedState) {
      if (relatedImprovements.length === 0) {
        alert("Khảo sát này chưa có thông báo cải tiến. Bạn cần tạo ít nhất một thông báo cải tiến trước khi đánh dấu đã giải quyết.");
        return;
      }
      const hasUnapproved = relatedClarifications.some((c) => c.status !== "approved");
      if (hasUnapproved) {
        alert("Khảo sát này có yêu cầu giải trình chưa được phê duyệt hoàn toàn. Vui lòng phê duyệt tất cả giải trình trước.");
        return;
      }
    }

    try {
      const updatedConfig = {
        ...(selectedReport.target_config || {}),
        is_resolved: nextResolvedState,
      };
      await surveysApi.update(selectedReport.id, {
        target_config: updatedConfig,
      });
      setSelectedReport((prev: any) => ({
        ...prev,
        target_config: updatedConfig,
      }));
      loadReports();
    } catch (err: any) {
      console.error("Lỗi khi cập nhật trạng thái giải quyết:", err);
      const msg = err.message || "Lỗi khi cập nhật trạng thái giải quyết. Vui lòng thử lại.";
      alert(msg);
    }
  };

  const [isRunningClassify, setIsRunningClassify] = useState(false);
  const [isRunningTrend, setIsRunningTrend] = useState(false);

  const handleRunClassify = async () => {
    if (!selectedReport || !isClosed || isResolved) return;
    setIsRunningClassify(true);
    setAiRunStatus("Đang chạy phân loại nhãn cảm xúc...");
    try {
      await aiApi.classify(selectedReport.id);
      setAiRunStatus("Gán nhãn hoàn tất! Đang tải kết quả...");
      const [ov, fbLabel] = await Promise.all([
        aiApi.getOverview(selectedReport.id).catch(() => null),
        aiApi.getFeedbackByLabel(selectedReport.id).catch(() => ({})),
      ]);
      setAiOverview(ov);
      setAiFeedbackByLabel(fbLabel);
      setAiRunStatus("Gán nhãn & Phân tích cảm xúc hoàn tất ✓");
    } catch (err: any) {
      console.error(err);
      setAiRunStatus(`Lỗi khi phân loại nhãn: ${err.message || err}`);
    } finally {
      setIsRunningClassify(false);
      setTimeout(() => setAiRunStatus(null), 5000);
    }
  };

  const handleRunTrendAnalysis = async () => {
    if (!selectedReport || !isClosed || isResolved) return;
    setIsRunningTrend(true);
    setAiRunStatus("Đang lập báo cáo tóm tắt xu hướng và đề xuất...");
    try {
      await aiApi.generateReport(selectedReport.id);
      setAiRunStatus("Lập báo cáo hoàn tất! Đang tải...");
      const rpt = await aiApi.getReport(selectedReport.id).catch(() => null);
      setAiReport(rpt);
      setAiRunStatus("Báo cáo phân tích xu hướng hoàn tất ✓");
    } catch (err: any) {
      console.error(err);
      setAiRunStatus(`Lỗi khi lập báo cáo: ${err.message || err}`);
    } finally {
      setIsRunningTrend(false);
      setTimeout(() => setAiRunStatus(null), 5000);
    }
  };

  const handleSubmitClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !clarLecturerId || !clarReason) return;
    setClarSubmitting(true);
    try {
      await clarificationsApi.request({
        survey_id: selectedReport.id,
        lecturer_id: Number(clarLecturerId),
        request_reason: clarReason,
        deadline: clarDeadline || undefined,
      });
      setShowClarificationModal(false);
      setClarLecturerId("");
      setClarReason("");
      setClarDeadline("");
      alert("Yêu cầu giải trình đã được gửi thành công!");
      
      // Refresh clarifications
      const clars: any = await clarificationsApi.listAll().catch(() => []);
      const clarsList = Array.isArray(clars) ? clars : (clars?.data || []);
      setRelatedClarifications(clarsList.filter((c: any) => c.survey_id === selectedReport.id));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi yêu cầu giải trình. Vui lòng thử lại.");
    } finally {
      setClarSubmitting(false);
    }
  };

  const handleSubmitImprovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !impTitle || !impContent) return;
    setImpSubmitting(true);
    try {
      await improvementsApi.create({
        survey_id: selectedReport.id,
        title: impTitle,
        content: impContent,
        target_roles: ["STUDENT"],
      });
      setShowImprovementModal(false);
      setImpTitle("");
      setImpContent("");
      alert("Thông báo cải tiến đã được tạo và gửi thành công!");

      // Refresh improvements
      const imps: any = await improvementsApi.list().catch(() => []);
      const impsList = Array.isArray(imps) ? imps : (imps?.data || []);
      setRelatedImprovements(impsList.filter((imp: any) => imp.survey_id === selectedReport.id));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo thông báo cải tiến.");
    } finally {
      setImpSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!analysis || !selectedReport) return;

    try {
      // @ts-ignore
      const exceljsModule = await import("exceljs/dist/exceljs.min.js");
      // @ts-ignore
      const ExcelJS = exceljsModule.default || exceljsModule || window.ExcelJS;
      if (!ExcelJS || !ExcelJS.Workbook) {
        throw new Error("Thư viện ExcelJS chưa được tải đúng cách.");
      }
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Báo cáo phân tích", {
        views: [{ showGridLines: false }],
      });

      sheet.columns = [
        { header: "", key: "cauSo", width: 15 },
        { header: "", key: "noiDung", width: 90 },
        { header: "", key: "val1", width: 18 },
        { header: "", key: "val2", width: 18 },
        { header: "", key: "val3", width: 18 },
        { header: "", key: "val4", width: 18 },
        { header: "", key: "val5", width: 18 },
      ];

      sheet.getColumn("noiDung").alignment = { wrapText: true, vertical: "middle" };

      const titleRow = sheet.addRow(["BÁO CÁO PHÂN TÍCH: " + (selectedReport.title || "").toUpperCase()]);
      sheet.mergeCells(titleRow.number, 1, titleRow.number, 7);
      titleRow.height = 40;
      const titleCell = titleRow.getCell(1);
      titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00236F" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };

      const overviewTitleRow = sheet.addRow(["1. TỔNG QUAN CHIẾN DỊCH"]);
      sheet.mergeCells(overviewTitleRow.number, 1, overviewTitleRow.number, 7);
      overviewTitleRow.height = 30;
      const overviewTitleCell = overviewTitleRow.getCell(1);
      overviewTitleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF0058BE" } };
      overviewTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      overviewTitleCell.alignment = { vertical: "middle", horizontal: "left" };

      const tr1 = sheet.addRow({ cauSo: "", noiDung: "Tổng số phản hồi", val1: analysis.total_responses ?? 0 });
      const tr2 = sheet.addRow({ cauSo: "", noiDung: "CSAT (Hài lòng tổng thể)", val1: (overviewStats?.globalCSAT !== undefined && overviewStats?.globalCSAT !== null) ? `${overviewStats.globalCSAT}/5.0` : "Không áp dụng" });
      const tr3 = sheet.addRow({ cauSo: "", noiDung: "NPS (Chỉ số trung thành)", val1: overviewStats?.npsScore ?? "Không áp dụng" });

      const overviewBorder = {
        top: { style: "thin", color: { argb: "FFC5C5D3" } },
        left: { style: "thin", color: { argb: "FFC5C5D3" } },
        bottom: { style: "thin", color: { argb: "FFC5C5D3" } },
        right: { style: "thin", color: { argb: "FFC5C5D3" } },
      };
      [tr1, tr2, tr3].forEach((row: any) => {
        row.getCell(2).font = { bold: true };
        for (let c = 1; c <= 7; c++) {
          row.getCell(c).border = overviewBorder;
        }
      });

      sheet.addRow([]);

      const detailsTitleRow = sheet.addRow(["2. PHÂN TÍCH CHI TIẾT TỪNG CÂU HỎI"]);
      sheet.mergeCells(detailsTitleRow.number, 1, detailsTitleRow.number, 7);
      detailsTitleRow.height = 30;
      const detailsTitleCell = detailsTitleRow.getCell(1);
      detailsTitleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF0058BE" } };
      detailsTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      detailsTitleCell.alignment = { vertical: "middle", horizontal: "left" };

      const headerRow = sheet.addRow({
        cauSo: "CÂU SỐ",
        noiDung: "NỘI DUNG / THỐNG KÊ CHI TIẾT",
        val1: "GIÁ TRỊ 1",
        val2: "GIÁ TRỊ 2",
        val3: "GIÁ TRỊ 3",
        val4: "GIÁ TRỊ 4",
        val5: "GIÁ TRỊ 5",
      });

      headerRow.eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF757682" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFC5C5D3" } },
          left: { style: "thin", color: { argb: "FFC5C5D3" } },
          bottom: { style: "thin", color: { argb: "FFC5C5D3" } },
          right: { style: "thin", color: { argb: "FFC5C5D3" } },
        };
      });

      const detailsStartRowNumber = headerRow.number;

      let idx = 1;
      for (const [qId, qData] of Object.entries(analysis.analysis || {})) {
        const q = qData as any;

        const qRow = sheet.addRow({
          cauSo: `Câu ${idx++}`,
          noiDung: q.question_label,
        });
        qRow.font = { bold: true };
        qRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDEEF0" } };

        if (q.question_type === "likert") {
          sheet.addRow({
            noiDung: "→ Điểm TB & Phân bổ (Mức 1 đến 5)",
            val1: `TB: ${q.stats?.average ?? "Không áp dụng"}`,
            val2: `Mức 1: ${q.stats?.score_distribution?.["1"] ?? 0}`,
            val3: `Mức 2: ${q.stats?.score_distribution?.["2"] ?? 0}`,
            val4: `Mức 3: ${q.stats?.score_distribution?.["3"] ?? 0}`,
            val5: "Mức 4/5: " + (Number(q.stats?.score_distribution?.["4"] ?? 0) + Number(q.stats?.score_distribution?.["5"] ?? 0))
          });
        } else if (q.question_type === "nps") {
          sheet.addRow({
            noiDung: "→ Điểm NPS & Phân bổ",
            val1: `NPS: ${q.stats?.score ?? "Không áp dụng"}`,
            val2: `Ủng hộ: ${q.stats?.distribution?.promoters || 0}`,
            val3: `Thường: ${q.stats?.distribution?.passives || 0}`,
            val4: `Phản đối: ${q.stats?.distribution?.detractors || 0}`,
          });
        } else if (q.question_type === "single_choice" || q.question_type === "multiple_choice") {
          for (const [opt, value] of Object.entries(q.stats?.distribution || {})) {
            const count = typeof value === "object" ? (value as any).count : value;
            sheet.addRow({ noiDung: `   • ${opt}`, val1: `Chọn: ${count}` });
          }
        } else if (q.question_type === "matrix") {
          for (const [rowLabel, rowDist] of Object.entries(q.stats?.rows_data || {})) {
            const dist = (rowDist || {}) as Record<string, number>;
            const keys = Object.keys(dist);
            sheet.addRow({
              noiDung: `   • ${rowLabel}`,
              val1: keys[0] ? `${keys[0]}: ${dist[keys[0]]}` : "",
              val2: keys[1] ? `${keys[1]}: ${dist[keys[1]]}` : "",
              val3: keys[2] ? `${keys[2]}: ${dist[keys[2]]}` : "",
              val4: keys[3] ? `${keys[3]}: ${dist[keys[3]]}` : "",
              val5: keys[4] ? `${keys[4]}: ${dist[keys[4]]}` : "",
            });
          }
        } else if (q.question_type === "open_ended") {
          sheet.addRow({ noiDung: "→ Phản hồi văn bản (Mẫu mới nhất):", val1: "Văn bản" });
          (q.stats?.latest_samples || []).forEach((sample: string) => {
            const row = sheet.addRow({ noiDung: `   - "${sample}"` });
            row.getCell(2).alignment = { wrapText: true };
          });
        }
        sheet.addRow([]);
      }

      sheet.eachRow((row: any, rowNumber: number) => {
        if (rowNumber > detailsStartRowNumber) {
          if (row.cellCount > 0) {
            for (let colIdx = 1; colIdx <= 7; colIdx++) {
              const cell = row.getCell(colIdx);
              cell.border = {
                top: { style: "thin", color: { argb: "FFC5C5D3" } },
                left: { style: "thin", color: { argb: "FFC5C5D3" } },
                bottom: { style: "thin", color: { argb: "FFC5C5D3" } },
                right: { style: "thin", color: { argb: "FFC5C5D3" } },
              };
            }
          }
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `BaoCao_Excel_${selectedReport.id}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => { window.URL.revokeObjectURL(url); }, 1000);
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error);
      alert("Đã xảy ra lỗi trong quá trình xử lý file Excel. Vui lòng thử lại sau.");
    }
  };

  // Pre-fill clarification lecturer from survey target_config
  const suggestedLecturerId = selectedReport?.target_config?.lecturer_id;

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-700 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-sm border-b border-outline-variant/30 pb-md">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl">
            insights
          </span>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Trung tâm Phân tích Dữ liệu
          </h1>
        </div>
        <p className="font-body-md text-on-surface-variant italic">
          Chuyển đổi dữ liệu thô thành chỉ số thông minh để cải thiện chất lượng giáo dục.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg items-start">
        {/* Sidebar: Danh sách khảo sát */}
        <div className="lg:col-span-1 space-y-sm max-h-[80vh] overflow-y-auto pr-2 lg:sticky lg:top-4 custom-scrollbar">
          {/* Published */}
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-outline px-1 mb-1">
            Đang phát hành
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-surface-container rounded-2xl" />
              ))}
            </div>
          ) : (
            publishedReports.length === 0 ? (
              <p className="text-xs text-outline italic px-1 pb-2">Không có khảo sát đang phát hành.</p>
            ) : (
              publishedReports.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-md border rounded-2xl transition-all duration-300 cursor-pointer ${
                    selectedReport?.id === r.id
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <h4 className="font-bold text-sm text-on-surface line-clamp-2 leading-snug">{r.title}</h4>
                    </div>
                  </div>
                  <p className="text-[9px] text-outline mt-1 uppercase font-black tracking-widest flex items-center gap-1">
                    Đang mở · ID: #{r.id}
                  </p>
                </button>
              ))
            )
          )}

          {/* Closed */}
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-outline px-1 mb-1 mt-4">
            Đã đóng
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-surface-container rounded-2xl" />
              ))}
            </div>
          ) : (
            closedReports.length === 0 ? (
              <p className="text-xs text-outline italic px-1 pb-2">Chưa có khảo sát đóng.</p>
            ) : (
              closedReports.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-md border rounded-2xl transition-all duration-300 cursor-pointer ${
                    selectedReport?.id === r.id
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <h4 className="font-bold text-sm text-on-surface line-clamp-2 leading-snug">{r.title}</h4>
                    </div>
                  </div>
                  <p className="text-[9px] text-outline mt-1 uppercase font-black tracking-widest flex items-center gap-1">
                    Đã đóng · ID: #{r.id}
                  </p>
                </button>
              ))
            )
          )}

          {/* Resolved */}
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-outline px-1 mb-1 mt-4">
            Đã giải quyết
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-surface-container rounded-2xl" />
              ))}
            </div>
          ) : (
            resolvedReports.length === 0 ? (
              <p className="text-xs text-outline italic px-1 pb-2">Chưa có khảo sát đã giải quyết.</p>
            ) : (
              resolvedReports.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-md border rounded-2xl transition-all duration-300 cursor-pointer ${
                    selectedReport?.id === r.id
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <h4 className="font-bold text-sm text-on-surface line-clamp-2 leading-snug">{r.title}</h4>
                    </div>
                    <span className="text-[9px] bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      Đã giải quyết
                    </span>
                  </div>
                  <p className="text-[9px] text-outline mt-1 uppercase font-black tracking-widest flex items-center gap-1">
                    {r._statusGroup === "closed" ? "Đã đóng" : "Đang mở"} · ID: #{r.id}
                  </p>
                </button>
              ))
            )
          )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 min-h-[100vh]">
          {selectedReport ? (
            <div className="space-y-lg">
              {/* Report Title Card */}
              <div className="flex flex-col bg-surface-container-highest/30 p-lg rounded-2xl border border-outline-variant gap-lg shadow-sm">
                {/* Row 1: Status and Title */}
                <div className="space-y-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isResolved
                        ? "bg-green-100 text-green-800 border-green-200"
                        : isClosed
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200"
                    }`}>
                      {isResolved ? "Đã giải quyết" : isClosed ? "Đã đóng" : "Đang phát hành"}
                    </span>
                    <span className="text-[10px] text-outline font-bold">ID: #{selectedReport.id}</span>
                  </div>
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">
                    {selectedReport.title}
                  </h2>
                </div>

                {/* Row 2: Metadata chips — only config info, no duplicate stats */}
                {(selectedReport.target_config?.faculty_id || selectedReport.target_config?.subject_id || selectedReport.target_config?.lecturer_id) && (
                  <div className="flex flex-wrap items-center gap-sm border-t border-outline-variant/20 pt-sm">
                    {selectedReport.target_config?.faculty_id && (
                      <span className="bg-tertiary/10 text-tertiary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">school</span>
                        Khoa #{selectedReport.target_config.faculty_id}
                      </span>
                    )}
                    {selectedReport.target_config?.subject_id && (
                      <span className="bg-tertiary/10 text-tertiary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">book</span>
                        Môn #{selectedReport.target_config.subject_id}
                      </span>
                    )}
                    {selectedReport.target_config?.lecturer_id && (
                      <span className="bg-tertiary/10 text-tertiary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        GV #{selectedReport.target_config.lecturer_id}
                      </span>
                    )}
                  </div>
                )}

                {/* Row 3: Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* Export */}
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">table_chart</span>
                    Xuất Excel
                  </button>
                  {/* AI for closed surveys */}
                  {isClosed && (
                    <>
                      <button
                        onClick={handleRunClassify}
                        disabled={isRunningClassify || isResolved}
                        className="px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isRunningClassify ? (
                          <span className="w-3.5 h-3.5 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-base">label</span>
                        )}
                        {isRunningClassify ? "Đang gán nhãn..." : "Gán nhãn cảm xúc"}
                      </button>
                      <button
                        onClick={handleRunTrendAnalysis}
                        disabled={isRunningTrend || isResolved}
                        className="px-4 py-2.5 bg-secondary-container text-on-secondary-container border border-outline-variant/60 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isRunningTrend ? (
                          <span className="w-3.5 h-3.5 border-2 border-on-secondary-container/30 border-t-on-secondary-container rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-base">insights</span>
                        )}
                        {isRunningTrend ? "Đang phân tích..." : "Phân tích xu hướng"}
                      </button>
                    </>
                  )}
                  {/* Clarification for closed */}
                  {isClosed && (
                    <button
                      onClick={() => {
                        if (isResolved) return;
                        if (suggestedLecturerId) setClarLecturerId(String(suggestedLecturerId));
                        setShowClarificationModal(true);
                      }}
                      disabled={isResolved}
                      className="px-4 py-2.5 bg-error/10 text-error border border-error/30 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-error/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">report</span>
                      Yêu cầu giải trình
                    </button>
                  )}
                  {/* Improvement announcement */}
                  {isClosed && (
                    <button
                      onClick={() => {
                        if (isResolved) return;
                        setShowImprovementModal(true);
                      }}
                      disabled={isResolved}
                      className="px-4 py-2.5 bg-tertiary/10 text-tertiary border border-tertiary/30 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-tertiary/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">campaign</span>
                      Thông báo cải tiến
                    </button>
                  )}
                  {/* Mark as resolved / reopen */}
                  {isClosed && (
                    <button
                      onClick={handleToggleResolved}
                      className={`px-4 py-2.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                        isResolved
                          ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                          : "bg-surface-container-high text-on-surface border-outline-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isResolved ? "check_circle" : "task_alt"}
                      </span>
                      {isResolved ? "Đã giải quyết" : "Đánh dấu giải quyết"}
                    </button>
                  )}
                </div>
              </div>

              {/* AI Run Status */}
              {aiRunStatus && (
                <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-md text-sm text-secondary font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  {aiRunStatus}
                </div>
              )}

              {/* General Stats Panel */}
              {generalStats && (
                <div className="space-y-sm">
                  {/* Always-visible base stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                    {[
                      { label: "Phản hồi", value: generalStats.total_responses ?? 0, icon: "group", color: "#6750A4" },
                      { label: "Câu hỏi mở", value: generalStats.total_open_feedbacks ?? 0, icon: "chat", color: "#006A60" },
                      isClosed && { label: "Nhãn AI", value: generalStats.total_labels ?? 0, icon: "label", color: "#635F70" },
                      isClosed && { label: "Đã phân tích", value: (generalStats.positive_count ?? 0) + (generalStats.neutral_count ?? 0) + (generalStats.negative_count ?? 0), icon: "analytics", color: "#005FAF" },
                    ].filter(Boolean).map((stat: any) => (
                      <div key={stat.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-sm flex flex-col items-center gap-1 shadow-sm text-center min-w-0">
                        <span className="material-symbols-outlined text-xl" style={{ color: stat.color }}>{stat.icon}</span>
                        <span className="text-xl font-black text-on-surface">{stat.value}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-outline leading-tight">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Sentiment breakdown — only when there's AI data */}
                  {isClosed && (generalStats.positive_count > 0 || generalStats.negative_count > 0 || generalStats.neutral_count > 0) && (
                    <div className="grid grid-cols-3 gap-sm">
                      {[
                        { label: "Tích cực", value: generalStats.positive_count ?? 0, icon: "thumb_up", color: "#4CAF50", bg: "bg-green-50 border-green-200" },
                        { label: "Trung lập", value: generalStats.neutral_count ?? 0, icon: "thumbs_up_down", color: "#9E9E9E", bg: "bg-slate-50 border-slate-200" },
                        { label: "Tiêu cực", value: generalStats.negative_count ?? 0, icon: "thumb_down", color: "#f44336", bg: "bg-red-50 border-red-200" },
                      ].map((stat) => (
                        <div key={stat.label} className={`border rounded-xl p-sm flex flex-col items-center gap-1 shadow-sm text-center min-w-0 ${stat.bg}`}>
                          <span className="material-symbols-outlined text-xl" style={{ color: stat.color }}>{stat.icon}</span>
                          <span className="text-xl font-black text-on-surface">{stat.value}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-outline leading-tight">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* KPI Dashboard */}
              {!isAnalysing && overviewStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                  <KPICard
                    title="Hài lòng tổng thể (CSAT)"
                    value={`${overviewStats.globalCSAT}/5.0`}
                    subValue={`Đạt ${overviewStats.csatPercentage}% mức độ hài lòng`}
                    icon="sentiment_satisfied"
                    color="#6750A4"
                  />
                  <KPICard
                    title="Chỉ số Trung thành (NPS)"
                    value={overviewStats.npsScore !== null ? overviewStats.npsScore : "N/A"}
                    subValue={
                      overviewStats.npsScore && overviewStats.npsScore > 50
                        ? "Mức độ ủng hộ xuất sắc"
                        : "Cần cải thiện trải nghiệm"
                    }
                    icon="recommend"
                    color="#006A60"
                  />
                  <KPICard
                    title="Quy mô phản hồi"
                    value={overviewStats.totalCompleted}
                    subValue="Người đã hoàn thành"
                    icon="group"
                    color="#984061"
                  />
                </div>
              )}

              {/* AI Analysis Section (for closed surveys) */}
              {isClosed && (aiOverview || aiReport) && (
                <div className="space-y-md">
                  <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-sm">
                    <span className="material-symbols-outlined text-secondary text-xl">auto_awesome</span>
                    <h3 className="font-label-md text-label-md font-bold text-secondary uppercase tracking-wider">
                      Phân tích AI
                    </h3>
                    <span className="text-xs text-outline font-medium">· Tự động phân tích cảm xúc & xu hướng</span>
                  </div>

                  {/* AI Overview: label summary & feedback dropdowns */}
                  {aiOverview?.label_summary && aiOverview.label_summary.length > 0 && (
                    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-lg shadow-sm space-y-md">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
                          Phân tích cảm xúc theo nhãn
                        </h4>
                        <p className="text-xs text-outline font-medium mt-1">
                          Bấm vào từng nhãn bên dưới để xem danh sách phản hồi chi tiết.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-md">
                        {aiOverview.label_summary.map((row: any) => {
                          const isSelected = selectedLabel === row.label_name;
                          const total = row.total_count || (row.positive_count + row.negative_count + row.neutral_count) || 1;
                          const posPct = Math.round((row.positive_count / total) * 100);
                          const negPct = Math.round((row.negative_count / total) * 100);
                          const neuPct = 100 - posPct - negPct;

                          return (
                            <div
                              key={row.label_name}
                              onClick={() => setSelectedLabel(isSelected ? null : row.label_name)}
                              className={`p-md border rounded-2xl cursor-pointer transition-all duration-300 flex flex-col gap-2 hover:shadow-md ${
                                isSelected 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                                  : "border-outline-variant hover:bg-surface-container-low"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <h5 className="font-bold text-sm text-on-surface line-clamp-1">{row.label_name}</h5>
                                <span className="text-xs font-black bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant">
                                  {row.total_count}
                                </span>
                              </div>
                              
                              <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden flex">
                                <div style={{ width: `${posPct}%` }} className="bg-green-500" title={`Tích cực: ${posPct}%`} />
                                <div style={{ width: `${neuPct}%` }} className="bg-slate-400" title={`Trung lập: ${neuPct}%`} />
                                <div style={{ width: `${negPct}%` }} className="bg-red-500" title={`Tiêu cực: ${negPct}%`} />
                              </div>

                              <div className="flex justify-between text-[9px] text-outline font-bold">
                                <span className="text-green-600">👍 {row.positive_count}</span>
                                <span className="text-slate-500">😐 {row.neutral_count}</span>
                                <span className="text-red-500">👎 {row.negative_count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Feedbacks of selected label */}
                      {selectedLabel && (
                        <div className="mt-md border-t border-outline-variant/30 pt-md space-y-sm">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black uppercase tracking-wider text-primary">
                              Phản hồi của nhãn: {selectedLabel}
                            </h5>
                            <button
                              onClick={() => setSelectedLabel(null)}
                              className="text-xs font-bold text-outline hover:text-on-surface cursor-pointer"
                            >
                              Đóng
                            </button>
                          </div>
                          
                          <div className="space-y-sm max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {aiFeedbackByLabel[selectedLabel]?.length > 0 ? (
                              aiFeedbackByLabel[selectedLabel].map((fb: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="p-md bg-surface-container-low border border-outline-variant/50 rounded-xl flex flex-col gap-2 shadow-sm text-sm text-on-surface"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-outline">
                                      Câu hỏi: {fb.question_id}
                                    </span>
                                    <SentimentBadge sentiment={fb.sentiment?.toUpperCase() || "NEUTRAL"} />
                                  </div>
                                  <p className="italic font-medium leading-relaxed text-on-surface-variant">
                                    &quot;{fb.feedback_text}&quot;
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-xs text-outline py-8 italic">
                                Không tìm thấy phản hồi cụ thể cho nhãn này.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Report narrative (structured layout) */}
                  {(aiReport?.summary_text || aiReport?.executive_summary) && (
                    <div className="bg-gradient-to-br from-secondary/5 to-tertiary/5 border border-secondary/20 rounded-2xl p-lg shadow-sm space-y-md">
                      <div className="flex items-center gap-2 mb-md border-b border-outline-variant/30 pb-xs">
                        <span className="material-symbols-outlined text-secondary text-lg">article</span>
                        <h4 className="text-xs font-black uppercase tracking-wider text-secondary">
                          Báo cáo phân tích xu hướng
                        </h4>
                        <span className="text-[9px] text-outline ml-auto">
                          {aiReport.created_at ? new Date(aiReport.created_at).toLocaleDateString("vi-VN") : ""}
                        </span>
                      </div>
                      
                      <div className="space-y-sm">
                        <h5 className="text-sm font-bold text-on-surface">Tóm tắt điều hành</h5>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {aiReport.summary_text || aiReport.executive_summary}
                        </p>
                      </div>

                      {aiReport.key_findings && Array.isArray(aiReport.key_findings) && (
                        <div className="space-y-md pt-sm">
                          <h5 className="text-sm font-bold text-on-surface">Chi tiết theo các chủ đề/xu hướng</h5>
                          <div className="grid grid-cols-1 gap-md">
                            {aiReport.key_findings.map((finding: any, fIdx: number) => (
                              <div key={fIdx} className="bg-surface-container-low border border-outline-variant/50 p-md rounded-xl space-y-sm">
                                <div className="flex justify-between items-center">
                                  <h6 className="text-sm font-bold text-primary">{finding.topic}</h6>
                                  {finding.sentiment_score && (
                                    <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                      Điểm: {finding.sentiment_score}
                                    </span>
                                  )}
                                </div>
                                {finding.key_points && finding.key_points.length > 0 && (
                                  <div className="text-xs text-on-surface-variant">
                                    <span className="font-bold text-on-surface block mb-1">💡 Điểm chính:</span>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {finding.key_points.map((p: string, pIdx: number) => (
                                        <li key={pIdx}>{p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {finding.problems && finding.problems.length > 0 && (
                                  <div className="text-xs text-on-surface-variant">
                                    <span className="font-bold text-error block mb-1">⚠️ Vấn đề tồn tại:</span>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {finding.problems.map((p: string, pIdx: number) => (
                                        <li key={pIdx} className="text-error">{p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {finding.suggestions && finding.suggestions.length > 0 && (
                                  <div className="text-xs text-on-surface-variant">
                                    <span className="font-bold text-emerald-600 block mb-1">🛠️ Đề xuất cải tiến:</span>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {finding.suggestions.map((p: string, pIdx: number) => (
                                        <li key={pIdx} className="text-emerald-700">{p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(aiReport.recommendations || aiReport.overall_recommendation) && (
                        <div className="space-y-sm border-t border-outline-variant/30 pt-md">
                          <h5 className="text-sm font-bold text-on-surface">Đề xuất tổng thể từ AI</h5>
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            {aiReport.recommendations || aiReport.overall_recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No AI data yet */}
                  {!aiOverview?.label_summary && !aiReport?.executive_summary && !aiReport?.summary_text && (
                    <div className="bg-surface-container-lowest border border-dashed border-secondary/30 rounded-2xl p-lg text-center">
                      <span className="material-symbols-outlined text-3xl text-secondary/40 block mb-2">auto_awesome</span>
                      <p className="text-sm font-medium text-on-surface-variant">
                        Chưa có dữ liệu AI. Nhấn <strong>"Chạy AI"</strong> để phân tích khảo sát này.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Thông tin xử lý sau khảo sát */}
              {(relatedClarifications.length > 0 || relatedImprovements.length > 0) && (
                <div className="space-y-md">
                  <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-sm">
                    <span className="material-symbols-outlined text-tertiary text-xl">handshake</span>
                    <h3 className="font-label-md text-label-md font-bold text-tertiary uppercase tracking-wider">
                      Thông tin xử lý sau khảo sát
                    </h3>
                    <span className="text-xs text-outline font-medium">· Các hành động cải tiến & giải trình</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {/* Yêu cầu giải trình */}
                    <div className="bg-surface-container-lowest border border-outline-variant/40 p-lg rounded-2xl shadow-sm space-y-md">
                      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-xs">
                        <span className="material-symbols-outlined text-error text-lg">report</span>
                        <h4 className="text-xs font-black uppercase tracking-wider text-error">
                          Yêu cầu giải trình ({relatedClarifications.length})
                        </h4>
                      </div>
                      
                      {relatedClarifications.length === 0 ? (
                        <p className="text-xs text-outline italic py-4">Chưa có yêu cầu giải trình nào.</p>
                      ) : (
                        <div className="space-y-sm max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                          {relatedClarifications.map((clar) => {
                            const lecturerName = clar.users?.full_name || `Giảng viên #${clar.lecturer_id}`;
                            const statusConfig: Record<string, { label: string; className: string }> = {
                              approved: { label: "Đã phê duyệt", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                              rejected: { label: "Yêu cầu lại", className: "bg-red-100 text-red-800 border-red-200" },
                              submitted: { label: "Chờ phê duyệt", className: "bg-blue-100 text-blue-800 border-blue-200" },
                              disputed: { label: "Đang khiếu nại", className: "bg-purple-100 text-purple-800 border-purple-200" },
                              pending: { label: "Chờ giải trình", className: "bg-amber-100 text-amber-800 border-amber-200" },
                            };
                            const status = statusConfig[clar.status] || { label: clar.status, className: "bg-slate-100 text-slate-700 border-slate-200" };
                            
                            return (
                              <div key={clar.id} className="p-md bg-surface-container-low border border-outline-variant/50 rounded-xl space-y-sm shadow-sm text-sm">
                                <div className="flex justify-between items-center flex-wrap gap-xs">
                                  <span className="font-bold text-on-surface text-xs">{lecturerName}</span>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.className}`}>
                                    {status.label}
                                  </span>
                                </div>
                                <div className="text-xs text-on-surface-variant space-y-1">
                                  <p><span className="font-semibold">Lý do:</span> {clar.request_reason}</p>
                                  {clar.deadline && (
                                    <p><span className="font-semibold">Hạn chót:</span> {new Date(clar.deadline).toLocaleDateString("vi-VN")}</p>
                                  )}
                                  {clar.explanation_content && (
                                    <div className="mt-2 pt-2 border-t border-outline-variant/30 space-y-1">
                                      <p className="font-semibold text-primary text-[11px] uppercase tracking-wider">Giải trình:</p>
                                      <p className="italic bg-surface-container/50 p-2 rounded border border-outline-variant/20">{clar.explanation_content}</p>
                                    </div>
                                  )}
                                  {clar.commitment_text && (
                                    <div className="mt-1 space-y-1">
                                      <p className="font-semibold text-secondary text-[11px] uppercase tracking-wider">Cam kết cải tiến:</p>
                                      <p className="italic bg-surface-container/50 p-2 rounded border border-outline-variant/20">&quot;{clar.commitment_text}&quot;</p>
                                    </div>
                                  )}
                                  {clar.admin_comment && (
                                    <p className="mt-1 text-error"><span className="font-semibold">Ý kiến quản lý:</span> {clar.admin_comment}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Thông báo cải tiến */}
                    <div className="bg-surface-container-lowest border border-outline-variant/40 p-lg rounded-2xl shadow-sm space-y-md">
                      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-xs">
                        <span className="material-symbols-outlined text-tertiary text-lg">campaign</span>
                        <h4 className="text-xs font-black uppercase tracking-wider text-tertiary">
                          Thông báo cải tiến ({relatedImprovements.length})
                        </h4>
                      </div>
                      
                      {relatedImprovements.length === 0 ? (
                        <p className="text-xs text-outline italic py-4">Chưa có thông báo cải tiến nào.</p>
                      ) : (
                        <div className="space-y-sm max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                          {relatedImprovements.map((imp) => (
                            <div key={imp.id} className="p-md bg-surface-container-low border border-outline-variant/50 rounded-xl space-y-sm shadow-sm text-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-on-surface text-xs line-clamp-1">{imp.title}</span>
                                <span className="text-[10px] text-outline font-medium">
                                  {imp.created_at ? new Date(imp.created_at).toLocaleDateString("vi-VN") : ""}
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container/50 p-2 rounded border border-outline-variant/20 italic">
                                {imp.content}
                              </p>
                              {imp.target_roles && (
                                <div className="flex gap-1 flex-wrap">
                                  {imp.target_roles.map((role: string) => (
                                    <span key={role} className="text-[9px] font-black uppercase tracking-wider bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded border border-tertiary/20">
                                      {role === "STUDENT" ? "Sinh viên" : role === "LECTURER" ? "Giảng viên" : role}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Question Analysis */}
              {isAnalysing ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/50">
                  <div className="w-14 h-14 border-[5px] border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-on-surface font-black">Hệ thống đang tổng hợp dữ liệu...</p>
                    <p className="text-xs text-outline font-medium mt-1">Vui lòng đợi trong giây lát</p>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-md">
                  <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-sm">
                    <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                    <h3 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wider">
                      Phân tích chi tiết từng câu hỏi
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {Object.entries(analysis.analysis || {}).map(
                      ([qId, data]: any, idx: number) => (
                        <div
                          key={qId}
                          className="bg-surface-container-lowest border border-outline-variant/40 p-lg rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex items-start gap-4 mb-6">
                            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                              {idx + 1}
                            </span>
                            <div>
                              <h5 className="font-bold text-on-surface text-md leading-snug">
                                {data.question_label}
                              </h5>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-[9px] uppercase tracking-[0.15em] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                                  {data.question_type}
                                </span>
                                {data.stats?.average && (
                                  <span className="text-[9px] font-black text-tertiary-container bg-tertiary/10 px-2 py-0.5 rounded-md uppercase">
                                    Trung bình: {data.stats.average}/5.0
                                  </span>
                                )}
                                {isClosed && data.question_type === "open_ended" && (() => {
                                  const qSentiment = aiOverview?.question_summary?.find((qs: any) => qs.question_id === qId);
                                  return qSentiment ? (
                                    <>
                                      <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase">
                                        Tích cực: {qSentiment.positive_count}
                                      </span>
                                      <span className="text-[9px] font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase">
                                        Trung lập: {qSentiment.neutral_count}
                                      </span>
                                      <span className="text-[9px] font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">
                                        Tiêu cực: {qSentiment.negative_count}
                                      </span>
                                    </>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center min-h-[250px]">
                            {data.question_type === "likert" && (
                              <LikertChart stats={data.stats} />
                            )}
                            {data.question_type === "nps" && (
                              <NPSIndicator stats={data.stats} />
                            )}
                            {(data.question_type === "single_choice" ||
                              data.question_type === "multiple_choice") && (
                              <ChoiceChart stats={data.stats} />
                            )}
                            {data.question_type === "matrix" && (
                              <MatrixChart
                                stats={data.stats}
                                columns={data.columns || []}
                              />
                            )}
                            {data.question_type === "open_ended" && (
                              <OpenEndedList stats={data.stats} />
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex-1 min-h-[500px] h-full border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center text-outline bg-surface-container-lowest/40 backdrop-blur-sm p-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/5 rounded-full scale-[1.8] blur-xl" />
                <div className="relative w-20 h-20 bg-surface-container rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-5xl text-primary/40">
                    analytics
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-black text-on-surface tracking-tight">
                Trung tâm Phân tích
              </h3>

              <p className="max-w-[280px] text-center mt-3 text-sm font-medium leading-relaxed text-on-surface-variant/70">
                Vui lòng chọn một chiến dịch khảo sát từ danh sách bên trái để
                khám phá các số liệu thống kê chi tiết.
              </p>

              <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/20" />
                <div className="w-2 h-2 rounded-full bg-primary/10" />
                <div className="w-2 h-2 rounded-full bg-primary/5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clarification Modal */}
      {showClarificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowClarificationModal(false)} />
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[500px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-2xl">report</span>
                <h3 className="font-headline-md text-headline-md text-error font-bold">
                  Yêu cầu Giải trình
                </h3>
              </div>
              <button onClick={() => setShowClarificationModal(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant">
              Gửi yêu cầu giải trình cho giảng viên liên quan đến kết quả khảo sát <strong>&quot;{selectedReport?.title}&quot;</strong>.
            </p>
            <form onSubmit={handleSubmitClarification} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-bold text-on-surface-variant">Giảng viên cần giải trình *</label>
                <select
                  value={clarLecturerId}
                  onChange={e => setClarLecturerId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
                >
                  <option value="">-- Chọn giảng viên --</option>
                  {lecturers.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name}{l.id === suggestedLecturerId ? " (GV khảo sát)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-bold text-on-surface-variant">Lý do yêu cầu giải trình *</label>
                <textarea
                  value={clarReason}
                  onChange={e => setClarReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="Mô tả chi tiết lý do yêu cầu giải trình, các vấn đề phát sinh từ kết quả khảo sát..."
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-error focus:outline-none focus:ring-1 focus:ring-error resize-none"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-bold text-on-surface-variant">Hạn chót (tuỳ chọn)</label>
                <input
                  type="date"
                  value={clarDeadline}
                  onChange={e => setClarDeadline(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-error focus:outline-none"
                />
              </div>
              <div className="flex gap-sm justify-end mt-sm">
                <button
                  type="button"
                  onClick={() => setShowClarificationModal(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={clarSubmitting}
                  className="px-md py-2 bg-error text-on-error rounded-lg text-sm font-bold hover:opacity-90 transition-colors shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {clarSubmitting && <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />}
                  {clarSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Improvement Announcement Modal */}
      {showImprovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowImprovementModal(false)} />
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[500px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-2xl">campaign</span>
                <h3 className="font-headline-md text-headline-md text-tertiary font-bold">
                  Thông báo Cải tiến
                </h3>
              </div>
              <button onClick={() => setShowImprovementModal(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant">
              Tạo thông báo cải tiến liên kết với khảo sát <strong>&quot;{selectedReport?.title}&quot;</strong>. Thông báo sẽ hiển thị trên bảng tin của sinh viên.
            </p>
            <form onSubmit={handleSubmitImprovement} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-bold text-on-surface-variant">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  value={impTitle}
                  onChange={e => setImpTitle(e.target.value)}
                  required
                  placeholder="Ví dụ: Cải tiến chất lượng môn Lập trình Web..."
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-bold text-on-surface-variant">Nội dung thông báo *</label>
                <textarea
                  value={impContent}
                  onChange={e => setImpContent(e.target.value)}
                  required
                  rows={5}
                  placeholder="Mô tả chi tiết các cải tiến, hành động cụ thể nhà trường sẽ thực hiện dựa trên kết quả khảo sát..."
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary resize-none"
                />
              </div>
              <div className="flex gap-sm justify-end mt-sm">
                <button
                  type="button"
                  onClick={() => setShowImprovementModal(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={impSubmitting}
                  className="px-md py-2 bg-tertiary text-on-tertiary rounded-lg text-sm font-bold hover:opacity-90 transition-colors shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {impSubmitting && <span className="w-4 h-4 border-2 border-on-tertiary/30 border-t-on-tertiary rounded-full animate-spin" />}
                  {impSubmitting ? "Đang tạo..." : "Tạo thông báo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
