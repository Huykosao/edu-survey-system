"use client";

import React, { useState } from "react";

export default function AdminDashboardPage() {
  const [selectedDept, setSelectedDept] = useState("Tất cả khoa");
  const [selectedMajor, setSelectedMajor] = useState("Tất cả ngành");
  const [selectedSemester, setSelectedSemester] = useState("Học kỳ 1 - 2023/2024");

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Báo cáo Tổng hợp</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Phân tích dữ liệu khảo sát và chất lượng giảng dạy của học sinh & giảng viên
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button className="flex items-center gap-sm px-md py-sm rounded-lg border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">download</span>
            Xuất PDF
          </button>
          <button className="flex items-center gap-sm px-md py-sm rounded-lg border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">table_view</span>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Advanced Filters Bento Box */}
      <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm">
        <div className="flex items-center gap-sm mb-md text-primary">
          <span className="material-symbols-outlined">filter_alt</span>
          <h3 className="font-label-md text-label-md font-bold uppercase tracking-wider">
            Bộ lọc nâng cao
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">Khoa</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-sm font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option>Tất cả khoa</option>
              <option>Công nghệ thông tin</option>
              <option>Kinh tế</option>
              <option>Ngoại ngữ</option>
            </select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">Ngành</label>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-sm font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option>Tất cả ngành</option>
              <option>Kỹ thuật phần mềm</option>
              <option>Hệ thống thông tin</option>
              <option>Quản trị kinh doanh</option>
            </select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-sm font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option>Học kỳ 1 - 2023/2024</option>
              <option>Học kỳ 2 - 2023/2024</option>
              <option>Học kỳ 1 - 2024/2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Tổng lượt tham gia</p>
            <h4 className="font-display-lg text-display-lg text-primary font-bold">12,450</h4>
            <span className="text-[12px] text-tertiary flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12.4% so với học kỳ trước
            </span>
          </div>
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-inner">
            <span className="material-symbols-outlined text-[32px] icon-fill">groups</span>
          </div>
        </div>
        
        <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Tỷ lệ hoàn thành</p>
            <h4 className="font-display-lg text-display-lg text-tertiary-container font-bold">94.2%</h4>
            <span className="text-[12px] text-tertiary flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">check</span>
              Đạt chỉ tiêu đề ra (trên 90%)
            </span>
          </div>
          <div className="w-16 h-16 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-inner">
            <span className="material-symbols-outlined text-[32px] icon-fill">check_circle</span>
          </div>
        </div>
      </div>

      {/* Charts Area with beautiful inline SVGs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Chart 1: Bar Chart */}
        <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm col-span-1 lg:col-span-2 min-h-[360px] flex flex-col">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label-md text-label-md font-bold text-on-surface">Phân tích trắc nghiệm (Cột)</h3>
            <span className="text-label-sm text-outline-variant font-medium">Theo tiêu chí CSVC</span>
          </div>
          <div className="flex-1 bg-surface-container-low rounded-lg border border-outline-variant/30 flex flex-col items-center justify-center p-md">
            {/* SVG Bar Chart Mockup */}
            <svg viewBox="0 0 500 200" className="w-full h-full max-h-[220px]">
              <g className="grid-lines" stroke="#e5e7eb" strokeWidth="1">
                <line x1="40" y1="20" x2="480" y2="20" />
                <line x1="40" y1="70" x2="480" y2="70" />
                <line x1="40" y1="120" x2="480" y2="120" />
                <line x1="40" y1="170" x2="480" y2="170" />
              </g>
              <g className="bars">
                {/* Bar 1: Rất hài lòng */}
                <rect x="70" y="40" width="50" height="130" rx="4" fill="#00236f" className="hover:opacity-85 transition-opacity" />
                <text x="95" y="30" textAnchor="middle" fill="#00236f" className="text-[12px] font-bold">65%</text>
                
                {/* Bar 2: Hài lòng */}
                <rect x="180" y="80" width="50" height="90" rx="4" fill="#0058be" className="hover:opacity-85 transition-opacity" />
                <text x="205" y="70" textAnchor="middle" fill="#0058be" className="text-[12px] font-bold">45%</text>

                {/* Bar 3: Bình thường */}
                <rect x="290" y="110" width="50" height="60" rx="4" fill="#757682" className="hover:opacity-85 transition-opacity" />
                <text x="315" y="100" textAnchor="middle" fill="#757682" className="text-[12px] font-bold">30%</text>

                {/* Bar 4: Không hài lòng */}
                <rect x="400" y="140" width="50" height="30" rx="4" fill="#ba1a1a" className="hover:opacity-85 transition-opacity" />
                <text x="425" y="130" textAnchor="middle" fill="#ba1a1a" className="text-[12px] font-bold">15%</text>
              </g>
              <g className="x-axis-labels">
                <text x="95" y="190" textAnchor="middle" fill="#444651" className="text-[11px] font-semibold">Rất hài lòng</text>
                <text x="205" y="190" textAnchor="middle" fill="#444651" className="text-[11px] font-semibold">Hài lòng</text>
                <text x="315" y="190" textAnchor="middle" fill="#444651" className="text-[11px] font-semibold">Bình thường</text>
                <text x="425" y="190" textAnchor="middle" fill="#444651" className="text-[11px] font-semibold">K. hài lòng</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Chart 2: Radar Chart */}
        <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm col-span-1 min-h-[360px] flex flex-col">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label-md text-label-md font-bold text-on-surface">Tiêu chí năng lực (Radar)</h3>
            <span className="text-label-sm text-outline-variant font-medium">5 Trục cốt lõi</span>
          </div>
          <div className="flex-1 bg-surface-container-low rounded-lg border border-outline-variant/30 flex items-center justify-center p-md">
            {/* SVG Radar Chart Mockup */}
            <svg viewBox="0 0 200 200" className="w-full h-full max-h-[220px]">
              {/* Pentagons */}
              <polygon points="100,20 176,75 147,165 53,165 24,75" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              <polygon points="100,50 151,87 133,145 67,145 49,87" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              <polygon points="100,80 126,99 119,125 81,125 74,99" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              
              {/* Web Lines */}
              <line x1="100" y1="100" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="100" y1="100" x2="176" y2="75" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="100" y1="100" x2="147" y2="165" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="100" y1="100" x2="53" y2="165" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="100" y1="100" x2="24" y2="75" stroke="#e5e7eb" strokeWidth="1" />
              
              {/* Data Shape */}
              <polygon points="100,35 160,80 135,130 75,150 40,85" fill="rgba(33, 112, 228, 0.2)" stroke="#2170e4" strokeWidth="2" />
              
              {/* Data points */}
              <circle cx="100" cy="35" r="3" fill="#2170e4" />
              <circle cx="160" cy="80" r="3" fill="#2170e4" />
              <circle cx="135" cy="130" r="3" fill="#2170e4" />
              <circle cx="75" cy="150" r="3" fill="#2170e4" />
              <circle cx="40" cy="85" r="3" fill="#2170e4" />

              {/* Labels */}
              <text x="100" y="15" textAnchor="middle" fill="#191c1e" className="text-[7px] font-bold">Chuyên môn</text>
              <text x="180" y="80" textAnchor="start" fill="#191c1e" className="text-[7px] font-bold">Tài liệu</text>
              <text x="145" y="175" textAnchor="middle" fill="#191c1e" className="text-[7px] font-bold">Tương tác</text>
              <text x="55" y="175" textAnchor="middle" fill="#191c1e" className="text-[7px] font-bold">Đánh giá</text>
              <text x="20" y="80" textAnchor="end" fill="#191c1e" className="text-[7px] font-bold">Hỗ trợ</text>
            </svg>
          </div>
        </div>
      </div>

      {/* AI Insights (Glowing / Sleek effect) */}
      <div className="bg-inverse-surface rounded-xl p-lg shadow-lg relative overflow-hidden text-background">
        {/* Glow backdrop light */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
        <div className="relative z-10 flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-inverse-primary text-2xl">lightbulb</span>
            <h3 className="font-headline-md text-headline-md text-white font-bold">
              AI Insight: Gợi ý cải tiến tự động
            </h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-md mt-sm">
            <li className="flex items-start gap-md p-md bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
              <span className="material-symbols-outlined text-tertiary-fixed-dim mt-xs">trending_up</span>
              <div>
                <h4 className="font-label-md text-label-md text-white font-bold">
                  Tăng cường hỗ trợ kỹ thuật
                </h4>
                <p className="font-body-md text-sm text-inverse-on-surface opacity-90 mt-1 leading-relaxed">
                  Phân tích cảm xúc cho thấy 15% sinh viên gặp khó khăn với hệ thống nộp bài trực tuyến. Đề xuất mở thêm kênh hỗ trợ 24/7 trong tuần thi.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-md p-md bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
              <span className="material-symbols-outlined text-secondary-fixed-dim mt-xs">info</span>
              <div>
                <h4 className="font-label-md text-label-md text-white font-bold">
                  Điều chỉnh khối lượng bài tập
                </h4>
                <p className="font-body-md text-sm text-inverse-on-surface opacity-90 mt-1 leading-relaxed">
                  Phản hồi từ khoa Kinh tế chỉ ra sự quá tải vào giữa kỳ. Cân nhắc giãn lịch kiểm tra tự luận.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
