"use client";

import React, { useState, useEffect, useMemo } from "react";
import { surveysApi } from "@/lib/api";
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
    className="bg-surface-container-lowest border border-outline-variant p-lg rounded-[2rem] flex items-center gap-lg shadow-sm border-b-4 animate-in slide-in-from-bottom duration-500"
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
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
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
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
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
          "{text}"
        </div>
      ))
    ) : (
      <p className="text-center text-xs text-outline py-20 italic">
        Chưa có phản hồi văn bản nào.
      </p>
    )}
  </div>
);

// --- COMPONENT CHÍNH ---
export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Lấy danh sách khảo sát
  useEffect(() => {
    surveysApi
      .list({ status: "published" })
      .then((res: any) => setReports(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Lấy phân tích chi tiết
  useEffect(() => {
    if (selectedReport) {
      setIsAnalysing(true);
      setAnalysis(null);
      surveysApi
        .getAnalysis(selectedReport.id)
        .then((res: any) => setAnalysis(res))
        .catch(console.error)
        .finally(() => setIsAnalysing(false));
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
          Chuyển đổi dữ liệu thô thành chỉ số thông minh để cải thiện chất lượng
          giáo dục.
        </p>
      </div>

      {/* KPI Dashboard Section */}
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
            value={
              overviewStats.npsScore !== null ? overviewStats.npsScore : "N/A"
            }
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
            subValue="Sinh viên đã hoàn thành"
            icon="group"
            color="#984061"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg items-start">
        {/* Sidebar: Danh sách khảo sát */}
        <div className="lg:col-span-1 space-y-sm max-h-[80vh] overflow-y-auto pr-2 sticky top-4 custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-outline px-3 mb-3">
            Chiến dịch khả dụng
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-surface-container rounded-2xl"
                />
              ))}
            </div>
          ) : (
            reports.map((r: any) => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className={`w-full text-left p-md border rounded-[1.5rem] transition-all duration-300 ${
                  selectedReport?.id === r.id
                    ? "border-primary bg-primary/5 shadow-md scale-[1.02] ring-1 ring-primary/20"
                    : "border-outline-variant hover:bg-surface-container-low"
                }`}
              >
                <h4 className="font-bold text-sm text-on-surface line-clamp-2 leading-snug">
                  {r.title}
                </h4>
                <p className="text-[9px] text-outline mt-2 uppercase font-black tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-outline" /> ID: #
                  {r.id}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Content Area: Biểu đồ chi tiết */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <div className="space-y-lg">
              {/* Report Title Card */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-highest/30 p-lg rounded-[2.5rem] border border-outline-variant gap-4">
                <div>
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">
                    {selectedReport.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        analytics
                      </span>{" "}
                      {analysis?.total_responses || 0} Phản hồi
                    </span>
                    <span className="text-xs text-outline font-bold uppercase tracking-tighter">
                      Cập nhật: {new Date().toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                <button className="px-6 py-3 bg-primary text-on-primary rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-lg">
                    picture_as_pdf
                  </span>
                  Xuất Báo cáo
                </button>
              </div>

              {isAnalysing ? (
                <div className="flex flex-col items-center py-40 gap-6 bg-surface-container-lowest rounded-[3rem] border border-dashed border-outline-variant/50">
                  <div className="w-14 h-14 border-[5px] border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-on-surface font-black">
                      Hệ thống đang tổng hợp dữ liệu...
                    </p>
                    <p className="text-xs text-outline font-medium mt-1">
                      Vui lòng đợi trong giây lát
                    </p>
                  </div>
                </div>
              ) : analysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {Object.entries(analysis.analysis || {}).map(
                    ([qId, data]: any) => (
                      <div
                        key={qId}
                        className="bg-surface-container-lowest border border-outline-variant/40 p-lg rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 group"
                      >
                        {/* Question Label Section */}
                        <div className="flex items-start gap-4 mb-8">
                          <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                            {qId.replace("q_", "").replace("q", "")}
                          </span>
                          <div>
                            <h5 className="font-bold text-on-surface text-md leading-snug">
                              {data.question_label}
                            </h5>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] uppercase tracking-[0.15em] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                                {data.question_type}
                              </span>
                              {data.stats?.average && (
                                <span className="text-[9px] font-black text-tertiary-container bg-tertiary/10 px-2 py-0.5 rounded-md uppercase">
                                  Trung bình: {data.stats.average}/5.0
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Visual Content Section */}
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
              ) : null}
            </div>
          ) : (
            <div className="flex-1 min-h-[500px] h-full border-2 border-dashed border-outline-variant/30 rounded-[2.5rem] flex flex-col items-center justify-center text-outline bg-surface-container-lowest/40 backdrop-blur-sm p-xl">
              <div className="relative">
                {/* Vòng tròn trang trí phía sau biểu tượng */}
                <div className="absolute inset-0 bg-primary/5 rounded-full scale-[1.8] blur-xl" />

                <div className="relative w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-outline-variant/20">
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

              {/* Một vài gợi ý nhỏ phía dưới để làm đẹp UI */}
              <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/20" />
                <div className="w-2 h-2 rounded-full bg-primary/10" />
                <div className="w-2 h-2 rounded-full bg-primary/5" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
