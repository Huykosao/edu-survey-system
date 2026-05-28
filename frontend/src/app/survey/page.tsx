"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SurveyPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<{
    q1: string;
    q2: string;
    mat1: string;
    mat2: string;
    mat3: string;
    nps: string;
    feedback: string;
  }>({
    q1: "Bình thường",
    q2: "4",
    mat1: "Cải thiện ít",
    mat2: "Cải thiện nhiều",
    mat3: "Cải thiện ít",
    nps: "8",
    feedback: "",
  });

  const [progress, setProgress] = useState(40);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Recalculate progress based on answered questions
  useEffect(() => {
    let answeredCount = 0;
    if (answers.q1) answeredCount++;
    if (answers.q2) answeredCount++;
    if (answers.mat1 && answers.mat2 && answers.mat3) answeredCount++;
    if (answers.nps) answeredCount++;
    if (answers.feedback.trim().length > 0) answeredCount++;

    // Calculate percentage based on 5 main questions
    const percentage = Math.round((answeredCount / 5) * 100);
    setProgress(percentage);
  }, [answers]);

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
    // Simulate auto-save
    setTimeout(() => {
      setIsSaved(true);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md antialiased">
      {/* Unified Public Header */}
      <header className="bg-surface sticky top-0 z-10 shadow-sm border-b border-surface-container-highest">
        <div className="flex items-center justify-between w-full max-w-container-max mx-auto px-lg h-16">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-2xl font-bold">assignment</span>
            <h1 className="font-headline-md text-headline-md text-primary font-bold">
              Khảo sát chất lượng đào tạo Học kỳ 1
            </h1>
          </div>
          <div className="flex items-center gap-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              {isSaved ? "cloud_done" : "sync"}
            </span>
            <span className="font-label-sm text-label-sm">
              {isSaved ? "Đã lưu tự động" : "Đang lưu..."}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-[720px] mx-auto px-md py-lg flex flex-col gap-lg pb-24">
        {/* Progress Section */}
        <section className="flex flex-col gap-sm bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-end">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Trang 2/5</span>
            <span className="font-label-md text-label-md text-primary font-semibold">
              Đã hoàn thành {progress}%
            </span>
          </div>
          <div aria-hidden="true" className="w-full h-[8px] bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </section>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
          {/* Question 1: Single Choice */}
          <div className="bg-surface rounded-lg border border-outline-variant p-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-md">
            <h2 className="font-body-lg text-body-lg font-semibold text-on-surface">
              1. Mức độ hài lòng của bạn đối với cơ sở vật chất của nhà trường?
            </h2>
            <div className="flex flex-col gap-xs mt-sm">
              {["Rất hài lòng", "Hài lòng", "Bình thường", "Không hài lòng"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-md cursor-pointer group p-sm -ml-sm rounded hover:bg-surface-container-low transition-colors"
                >
                  <input
                    type="radio"
                    name="q1"
                    checked={answers.q1 === option}
                    onChange={() => handleChange("q1", option)}
                    className="w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer"
                  />
                  <span className="font-body-md text-body-md group-hover:text-primary transition-colors">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 2: Likert Scale */}
          <div className="bg-surface rounded-lg border border-outline-variant p-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-md">
            <h2 className="font-body-lg text-body-lg font-semibold text-on-surface">
              2. Vui lòng đánh giá mức độ đồng ý của bạn: &quot;Giảng viên cung cấp tài liệu học tập đầy đủ và kịp thời.&quot;
            </h2>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-md mt-sm bg-surface-container-lowest p-md rounded-lg border border-surface-container-high">
              <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:block text-center leading-tight">
                Hoàn toàn<br />không đồng ý
              </span>
              <div className="flex gap-md w-full sm:w-auto justify-between sm:justify-start px-2">
                {["1", "2", "3", "4", "5"].map((num) => (
                  <label key={num} className="flex flex-col items-center gap-sm cursor-pointer group">
                    <span className="font-label-sm text-label-sm text-on-surface-variant sm:hidden">{num}</span>
                    <input
                      type="radio"
                      name="q2"
                      value={num}
                      checked={answers.q2 === num}
                      onChange={() => handleChange("q2", num)}
                      className="w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer"
                    />
                    <span className="hidden sm:block font-label-sm text-label-sm text-on-surface-variant group-hover:text-primary mt-1">
                      {num}
                    </span>
                  </label>
                ))}
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-right hidden sm:block text-center leading-tight">
                Hoàn toàn<br />đồng ý
              </span>
            </div>
          </div>

          {/* Question 3: Matrix */}
          <div className="bg-surface rounded-lg border border-outline-variant p-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-md overflow-hidden">
            <h2 className="font-body-lg text-body-lg font-semibold text-on-surface">
              3. Đánh giá mức độ cải thiện các năng lực sau của bạn sau khi hoàn thành học kỳ:
            </h2>
            <div className="overflow-x-auto mt-sm">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-surface-container-high">
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold w-1/3">Năng lực</th>
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold text-center">Không cải thiện</th>
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold text-center">Cải thiện ít</th>
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold text-center">Cải thiện nhiều</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "mat1", label: "Tư duy phản biện" },
                    { key: "mat2", label: "Lập trình & Kỹ thuật" },
                    { key: "mat3", label: "Giải quyết vấn đề" },
                  ].map((row) => (
                    <tr key={row.key} className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                      <td className="p-sm font-body-md text-body-md py-md font-medium">{row.label}</td>
                      {["Không cải thiện", "Cải thiện ít", "Cải thiện nhiều"].map((col) => (
                        <td key={col} className="p-sm text-center">
                          <input
                            type="radio"
                            name={row.key}
                            checked={answers[row.key as keyof typeof answers] === col}
                            onChange={() => handleChange(row.key, col)}
                            className="w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question 4: NPS Scale */}
          <div className="bg-surface rounded-lg border border-outline-variant p-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-md">
            <h2 className="font-body-lg text-body-lg font-semibold text-on-surface">
              4. Khả năng bạn sẽ giới thiệu chương trình đào tạo này cho bạn bè hoặc người thân?
            </h2>
            <div className="flex flex-col mt-sm gap-md">
              <div className="flex flex-wrap justify-between gap-xs sm:gap-sm bg-surface-container-lowest p-md rounded-lg border border-surface-container-high">
                {Array.from({ length: 11 }).map((_, i) => {
                  const numStr = i.toString();
                  return (
                    <label key={i} className="flex-1 flex justify-center cursor-pointer relative group min-w-[32px]">
                      <input
                        type="radio"
                        name="nps"
                        value={numStr}
                        checked={answers.nps === numStr}
                        onChange={() => handleChange("nps", numStr)}
                        className="peer sr-only"
                      />
                      <div className="w-10 h-10 flex items-center justify-center rounded border border-outline-variant font-label-md text-label-md peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary hover:bg-surface-container-low transition-colors">
                        {i}
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-between px-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Không bao giờ</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Chắc chắn</span>
              </div>
            </div>
          </div>

          {/* Question 5: Text Area */}
          <div className="bg-surface rounded-lg border border-outline-variant p-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-md">
            <h2 className="font-body-lg text-body-lg font-semibold text-on-surface">
              5. Bạn có ý kiến đóng góp gì thêm để cải thiện chất lượng đào tạo không?
            </h2>
            <div className="mt-sm flex flex-col gap-xs">
              <label className="sr-only" htmlFor="feedback">Ý kiến đóng góp</label>
              <textarea
                id="feedback"
                name="feedback"
                value={answers.feedback}
                onChange={(e) => handleChange("feedback", e.target.value)}
                placeholder="Nhập ý kiến của bạn tại đây..."
                rows={4}
                className="w-full min-h-[120px] p-md rounded-md border border-outline-variant font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:border-[2px] focus:ring-0 focus:outline-none transition-all resize-y"
              ></textarea>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-container-highest py-md shadow-lg z-20">
            <div className="w-full max-w-[720px] mx-auto px-md flex justify-between items-center gap-md">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="min-h-[48px] px-lg rounded font-label-md text-label-md font-semibold text-primary border border-primary hover:bg-surface-container-low focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Quay lại Đăng nhập
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-lg rounded font-label-md text-label-md font-semibold text-on-primary bg-primary hover:bg-primary-container hover:text-on-primary-container focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors shadow-sm cursor-pointer"
              >
                Gửi kết quả
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowSuccess(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md text-center items-center z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-tertiary-container text-on-tertiary-container rounded-full flex items-center justify-center shadow-inner mb-sm">
              <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-primary font-bold">Gửi khảo sát thành công!</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Cảm ơn bạn đã đóng góp ý kiến phản hồi quý báu của mình. Thông tin này sẽ giúp nhà trường cải tiến chất lượng dạy và học trong học kỳ tới.
            </p>
            <div className="flex gap-sm w-full mt-lg">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  router.push("/login");
                }}
                className="flex-1 min-h-[48px] bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-label-md text-label-md rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Về trang chủ đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Unified Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant py-md mt-auto mb-20">
        <div className="w-full max-w-container-max mx-auto px-lg text-center">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Ban Khảo sát và Đánh giá Giáo dục. Dữ liệu được mã hóa bảo mật.
          </p>
        </div>
      </footer>
    </div>
  );
}
