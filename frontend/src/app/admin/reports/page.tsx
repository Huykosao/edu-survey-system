"use client";

import React, { useState, useEffect } from "react";
import { surveysApi } from "@/lib/api";

interface ReportItem {
  id: number;
  surveyId: number;
  title: string;
  totalResponses: number;
  averageRating: number;
  generatedDate: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    surveysApi
      .list()
      .then((res: any) => {
        // Map surveys to reports for demo
        const list = (res.data || []).map((s: any, idx: number) => ({
          id: s.id || idx + 1,
          surveyId: s.id,
          title: s.title,
          totalResponses: s.total_responses || 0,
          averageRating: s.average_rating || 0,
          generatedDate: new Date(s.created_at).toLocaleDateString("vi-VN"),
        }));
        setReports(list);
      })
      .catch((err) => console.error("Error mapping reports:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportPDF = (title: string) => {
    alert(`Đang khởi tạo tải báo cáo PDF cho: ${title}`);
  };

  const handleExportExcel = (title: string) => {
    alert(`Đang khởi tạo tải bảng dữ liệu Excel thô cho: ${title}`);
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-sm border-b border-outline-variant/30 pb-md">
        <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Báo cáo &amp; Xuất dữ liệu</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tổng hợp kết quả đánh giá, tính toán điểm trung bình tiêu chí và kết xuất báo cáo phục vụ hội đồng nhà trường.
        </p>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-xl text-center flex flex-col items-center gap-md">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <span className="text-body-md text-on-surface-variant">Đang tải danh sách báo cáo...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-xl text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-inner">
          <span className="material-symbols-outlined text-5xl text-outline mb-sm block">analytics</span>
          Chưa có chiến dịch khảo sát nào để lập báo cáo.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
          {/* List Column */}
          <div className="lg:col-span-1 space-y-sm">
            <h3 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
              Danh sách Chiến dịch Khảo sát
            </h3>
            <div className="space-y-sm">
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-md border rounded-xl shadow-sm cursor-pointer transition-all ${
                    selectedReport?.id === r.id
                      ? "border-primary bg-primary/8 shadow"
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary/25"
                  }`}
                >
                  <h4 className="font-label-md font-bold text-on-surface text-sm leading-snug">{r.title}</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant mt-2 font-medium">
                    <span>Lượt tham gia: <strong>{r.totalResponses}</strong></span>
                    <span>Ngày tạo: {r.generatedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details / Export Actions Column */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm space-y-lg">
                <div className="border-b border-outline-variant/30 pb-sm">
                  <h3 className="text-headline-md font-bold text-on-surface text-xl">
                    {selectedReport.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">Báo cáo tổng hợp số liệu tính đến hôm nay</p>
                </div>

                {/* Stats cards inside report */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div className="p-md rounded-lg bg-surface border border-outline-variant/80">
                    <p className="text-xs text-on-surface-variant">Lượt hoàn thành khảo sát</p>
                    <h4 className="text-2xl font-bold text-primary mt-1">{selectedReport.totalResponses} sinh viên</h4>
                  </div>
                  <div className="p-md rounded-lg bg-surface border border-outline-variant/80">
                    <p className="text-xs text-on-surface-variant">Điểm hài lòng trung bình (CSVC)</p>
                    <h4 className="text-2xl font-bold text-tertiary-container mt-1">{selectedReport.averageRating} / 5.0</h4>
                  </div>
                </div>

                {/* Export buttons */}
                <div className="border-t border-outline-variant/30 pt-md space-y-sm">
                  <h4 className="font-label-md font-bold text-on-surface">Kết xuất dữ liệu chiến dịch:</h4>
                  <div className="flex flex-col sm:flex-row gap-sm">
                    <button
                      onClick={() => handleExportPDF(selectedReport.title)}
                      className="flex-1 py-3 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md rounded-lg flex items-center justify-center gap-sm transition-colors shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                      Tải báo cáo PDF (Tổng hợp)
                    </button>
                    <button
                      onClick={() => handleExportExcel(selectedReport.title)}
                      className="flex-1 py-3 border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md rounded-lg flex items-center justify-center gap-sm transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined">table_view</span>
                      Tải dữ liệu thô Excel (Dữ liệu lớn)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-xl border border-outline-variant/30 p-xl text-center text-on-surface-variant font-body-md min-h-[300px] flex flex-col justify-center items-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-sm">file_download</span>
                Vui lòng chọn một chiến dịch khảo sát ở cột bên trái để xuất dữ liệu và báo cáo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
