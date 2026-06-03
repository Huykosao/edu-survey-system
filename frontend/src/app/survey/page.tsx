"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { surveysApi, responsesApi, improvementsApi, clarificationsApi } from "@/lib/api";

interface Survey {
  id: number;
  title: string;
  description: string;
  is_anonymous: boolean;
  target_config: any;
}

interface Improvement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function SurveyRespondentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  const [view, setView] = useState<"list" | "taking">("list");
  const [activeTab, setActiveTab] = useState<"todo" | "done" | "improvements">("todo");
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [completedSurveys, setCompletedSurveys] = useState<Survey[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [studentFeedbacks, setStudentFeedbacks] = useState<any[]>([]);
  
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Form question template (used for survey taking)
  const defaultQuestions = [
    {
      id: "q1",
      type: "radio",
      label: "1. Mức độ hài lòng của bạn đối với chất lượng giảng dạy của học kỳ này?",
      options: ["Rất hài lòng", "Hài lòng", "Bình thường", "Không hài lòng"],
    },
    {
      id: "q2",
      type: "likert",
      label: "2. Đánh giá mức độ đồng ý: 'Giảng viên cung cấp tài liệu học tập đầy đủ và đúng hạn.'",
    },
    {
      id: "q3",
      type: "textarea",
      label: "3. Bạn có ý kiến đóng góp gì thêm để cải thiện chất lượng giảng dạy không?",
    }
  ];

  // Protect route
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Load surveys & improvements
  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // Get assigned surveys
      const activeList = await surveysApi.mySurveys();
      setSurveys(activeList as any || []);

      // Get improvement news
      const newsList = await improvementsApi.list();
      setImprovements(newsList as any || []);

      // Get approved feedbacks from lecturers
      try {
        const feedbacksList = await clarificationsApi.getStudentFeedbacks();
        setStudentFeedbacks(feedbacksList || []);
      } catch (err) {
        console.error("Error loading student feedbacks:", err);
      }

      // Mock completed surveys for visual representation
      setCompletedSurveys([
        {
          id: 99,
          title: "Khảo sát ý kiến người học về dịch vụ thư viện 2026",
          description: "Khảo sát kết thúc ngày 20/05/2026",
          is_anonymous: true,
          target_config: {},
        }
      ]);
    } catch (err) {
      console.error("Error loading respondent dashboard:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Calculate progress during taking survey
  useEffect(() => {
    if (!selectedSurvey) return;
    let answered = 0;
    if (answers.q1) answered++;
    if (answers.q2) answered++;
    if (answers.q3?.trim().length > 0) answered++;
    setProgress(Math.round((answered / 3) * 100));
  }, [answers, selectedSurvey]);

  const handleStartSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setAnswers({ q1: "", q2: "", q3: "" });
    setView("taking");
  };

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurvey) return;

    try {
      await responsesApi.submit(selectedSurvey.id, {
        answers,
        raw_content_text: answers.q3 || "",
      });

      setShowSuccess(true);
    } catch (err) {
      console.error("Error submitting survey response:", err);
    }
  };

  const handleFinishAndReturn = () => {
    setShowSuccess(false);
    setView("list");
    // Move completed survey to list (mock)
    if (selectedSurvey) {
      setSurveys(prev => prev.filter(s => s.id !== selectedSurvey.id));
      setCompletedSurveys(prev => [...prev, selectedSurvey]);
    }
    setSelectedSurvey(null);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-[14px] text-on-surface-variant font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md antialiased pb-20">
      {/* Dynamic Header */}
      <header className="bg-surface-container-lowest sticky top-0 z-30 shadow-sm border-b border-outline-variant/40">
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto px-md h-16">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-2xl font-bold">assignment</span>
            <h1 className="font-headline-md text-headline-md text-primary font-bold hidden sm:block">
              Cổng Khảo sát Độc lập
            </h1>
            <h1 className="font-headline-md text-headline-md text-primary font-bold sm:hidden">
              Khảo sát
            </h1>
          </div>

          <div className="flex items-center gap-md">
            <div className="text-right hidden md:block">
              <p className="text-[13px] font-semibold text-on-surface leading-tight">{user?.full_name}</p>
              <p className="text-[11px] text-on-surface-variant leading-none">{user?.roles?.[0]}</p>
            </div>
            <div className="w-px h-6 bg-outline-variant/40 hidden md:block"></div>
            <button
              onClick={() => logout()}
              className="text-error border border-error/25 hover:bg-error-container/15 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-md py-lg flex flex-col gap-lg">
        {view === "list" ? (
          // =============================================================
          // DASHBOARD TODO LIST & ANNOUNCEMENTS VIEW (E1, E3)
          // =============================================================
          <div className="space-y-lg animate-in fade-in duration-300">
            {/* Header section with welcome statement */}
            <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary rounded-full filter blur-[70px] opacity-15"></div>
              <h2 className="text-headline-lg font-bold text-primary mb-1">Xin chào, {user?.full_name}!</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Ý kiến đóng góp của bạn là kim chỉ nam giúp nhà trường hoàn thiện chất lượng giảng dạy, cơ sở vật chất và trải nghiệm học tập tốt hơn mỗi ngày.
              </p>
            </div>

            {/* Tabs for Todo, Completed, and Closing the Loop */}
            <div className="flex border-b border-outline-variant gap-lg">
              <button
                onClick={() => setActiveTab("todo")}
                className={`border-b-2 py-3 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "todo"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Khảo sát chưa làm
                {surveys.length > 0 && (
                  <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {surveys.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("done")}
                className={`border-b-2 py-3 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "done"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Khảo sát đã hoàn thành
              </button>
              <button
                onClick={() => setActiveTab("improvements")}
                className={`border-b-2 py-3 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "improvements"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Bảng tin cải tiến
              </button>
            </div>

            {/* Tab content */}
            {loadingData ? (
              <div className="py-xl text-center flex flex-col items-center gap-md">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
                <span className="text-body-md text-on-surface-variant">Đang tải...</span>
              </div>
            ) : activeTab === "todo" ? (
              // Todo Surveys
              <div className="space-y-md">
                {surveys.length === 0 ? (
                  <div className="py-xl text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-inner">
                    <span className="material-symbols-outlined text-5xl text-outline mb-sm block">assignment_turned_in</span>
                    Bạn đã hoàn thành tất cả khảo sát kỳ này! Cảm ơn bạn.
                  </div>
                ) : (
                  surveys.map((s) => (
                    <div
                      key={s.id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-md hover:border-primary/20 transition-all duration-150"
                    >
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface text-base font-bold mb-xs">
                          {s.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                          {s.description || "Bấm nút bên phải để bắt đầu làm khảo sát học phần này."}
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartSurvey(s)}
                        className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
                      >
                        Bắt đầu làm bài
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === "done" ? (
              // Completed Surveys
              <div className="space-y-md">
                {completedSurveys.map((s) => (
                  <div
                    key={s.id}
                    className="bg-surface-container-lowest border border-outline-variant/60 opacity-80 rounded-xl p-lg shadow-sm flex items-center justify-between gap-md"
                  >
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface text-base font-bold mb-xs">
                        {s.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{s.description}</p>
                    </div>
                    <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 shrink-0 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
                      Đã nộp bài
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              // Improvement Announcements & Lecturer Responses (Closing the Loop - E3)
              <div className="space-y-lg">
                {/* Column/Section 1: General improvements */}
                <div className="space-y-md">
                  <h3 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px]">campaign</span>
                    Thông báo Cải tiến từ Nhà trường
                  </h3>
                  {improvements.length === 0 ? (
                    <div className="py-lg text-center text-on-surface-variant text-sm bg-surface-container rounded-xl p-md">
                      Chưa có thông báo cải tiến chung nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-md">
                      {improvements.map((item) => (
                        <div
                          key={item.id}
                          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm space-y-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-secondary bg-secondary/8 px-2.5 py-0.5 rounded-full">
                              Cải tiến chất lượng
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">
                              {new Date(item.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <h4 className="font-label-md text-label-md text-on-surface text-base font-bold">
                            {item.title}
                          </h4>
                          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                            {item.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column/Section 2: Lecturer Feedback */}
                <div className="space-y-md border-t border-outline-variant/30 pt-lg mt-lg">
                  <h3 className="font-label-md text-label-md font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    Phản hồi &amp; Cam kết của Giảng viên
                  </h3>
                  <p className="text-xs text-on-surface-variant -mt-1 leading-relaxed">
                    Tổng hợp các cam kết cải tiến và lời nhắn gửi trực tiếp từ Thầy/Cô phụ trách môn học sau khi nhận kết quả khảo sát.
                  </p>
                  {studentFeedbacks.length === 0 ? (
                    <div className="py-lg text-center text-on-surface-variant text-sm bg-surface-container rounded-xl p-md">
                      Chưa có thư phản hồi nào từ giảng viên được đăng tải.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-md">
                      {studentFeedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm space-y-sm relative overflow-hidden"
                        >
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-md border-b border-outline-variant/30 pb-xs">
                            <div>
                              <h4 className="font-label-md text-label-md text-on-surface font-bold text-base">
                                {fb.survey_clarifications?.users?.full_name || "Giảng viên bộ môn"}
                              </h4>
                              <p className="text-xs text-primary font-semibold mt-0.5">
                                Môn: {fb.survey_clarifications?.surveys?.title || "Khảo sát học phần"}
                              </p>
                            </div>
                            <span className="text-xs text-on-surface-variant font-medium shrink-0">
                              {new Date(fb.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          {/* Message content */}
                          <div className="pt-xs">
                            <p className="text-xs text-on-surface-variant font-bold mb-1">Thư phản hồi gửi lớp:</p>
                            <div className="p-md bg-surface rounded-lg border border-outline-variant/40 italic text-sm text-on-surface leading-relaxed">
                              &quot;{fb.message_content}&quot;
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // =============================================================
          // TAKE SURVEY FORM VIEW (E2)
          // =============================================================
          <div className="space-y-lg animate-in fade-in duration-300">
            {/* Progress Card */}
            <section className="flex flex-col gap-sm bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex justify-between items-end">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                  Khảo sát: {selectedSurvey?.title}
                </span>
                <span className="font-label-md text-label-md text-primary font-semibold">
                  Tiến độ: {progress}%
                </span>
              </div>
              <div className="w-full h-[6px] bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </section>

            {/* Survey Form */}
            <form onSubmit={handleSubmitSurvey} className="space-y-lg">
              {/* Question 1: Radio Single Choice */}
              <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex flex-col gap-md">
                <h3 className="font-body-lg text-body-md font-bold text-on-surface">
                  {defaultQuestions[0].label}
                </h3>
                <div className="flex flex-col gap-xs mt-sm">
                  {defaultQuestions[0].options?.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-md cursor-pointer group p-sm rounded hover:bg-surface-container-low transition-colors"
                    >
                      <input
                        type="radio"
                        name="q1"
                        checked={answers.q1 === option}
                        onChange={() => handleAnswerChange("q1", option)}
                        className="w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer"
                        required
                      />
                      <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 2: Likert Scale */}
              <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex flex-col gap-md">
                <h3 className="font-body-lg text-body-md font-bold text-on-surface">
                  {defaultQuestions[1].label}
                </h3>
                <div className="flex justify-between items-center gap-md mt-sm bg-surface-container-lowest p-md rounded-lg border border-surface-container-high">
                  <span className="text-xs text-on-surface-variant hidden sm:block text-center leading-tight">
                    Hoàn toàn<br />không đồng ý
                  </span>
                  <div className="flex gap-md justify-between px-2 w-full sm:w-auto">
                    {["1", "2", "3", "4", "5"].map((num) => (
                      <label key={num} className="flex flex-col items-center gap-sm cursor-pointer group">
                        <span className="font-label-sm text-[11px] text-on-surface-variant sm:hidden">{num}</span>
                        <input
                          type="radio"
                          name="q2"
                          value={num}
                          checked={answers.q2 === num}
                          onChange={() => handleAnswerChange("q2", num)}
                          className="w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer"
                          required
                        />
                        <span className="hidden sm:block text-xs font-semibold text-on-surface-variant group-hover:text-primary mt-1">
                          {num}
                        </span>
                      </label>
                    ))}
                  </div>
                  <span className="text-xs text-on-surface-variant text-right hidden sm:block text-center leading-tight">
                    Hoàn toàn<br />đồng ý
                  </span>
                </div>
              </div>

              {/* Question 3: Feedback text area */}
              <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex flex-col gap-md">
                <h3 className="font-body-lg text-body-md font-bold text-on-surface">
                  {defaultQuestions[2].label}
                </h3>
                <textarea
                  placeholder="Nhập ý kiến đóng góp của bạn..."
                  value={answers.q3}
                  onChange={(e) => handleAnswerChange("q3", e.target.value)}
                  rows={4}
                  className="w-full p-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-sm justify-end pt-md">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="px-lg py-2.5 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ &amp; Quay lại
                </button>
                <button
                  type="submit"
                  className="px-lg py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Gửi khảo sát
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Success Modal (F2) */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={handleFinishAndReturn}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md text-center items-center z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shadow-inner mb-sm">
              <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-primary font-bold">Gửi khảo sát thành công!</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Cảm ơn bạn đã đóng góp ý kiến phản hồi quý báu của mình. Ý kiến này sẽ giúp nhà trường nâng cao chất lượng giáo dục trong học kỳ tới!
            </p>
            <div className="flex gap-sm w-full mt-lg">
              <button
                onClick={handleFinishAndReturn}
                className="flex-1 min-h-[48px] bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Quay lại Danh sách việc cần làm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
