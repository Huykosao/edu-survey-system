"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  surveysApi,
  responsesApi,
  improvementsApi,
  clarificationsApi,
} from "@/lib/api";
import type { SurveyContent, SurveyAnswers } from "@/lib/question-types";
import {
  getAllQuestions,
  calcProgress,
  collectOpenEndedText,
} from "@/lib/question-types";
import QuestionRenderer from "@/components/QuestionRenderer";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Survey {
  id: number;
  title: string;
  description: string;
  is_anonymous: boolean;
  target_config: Record<string, unknown>;
  /**
   * Cấu trúc câu hỏi chuẩn hoá — 5 dạng.
   * Survey cũ trong DB có thể có content: {} (không có sections)
   * → dùng optional chaining ?.sections khi truy cập.
   */
  content: Partial<SurveyContent> & Record<string, unknown>;
}

interface Improvement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

// ── Page Component ─────────────────────────────────────────────────────────────

export default function SurveyRespondentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [view, setView] = useState<"list" | "taking">("list");
  const [activeTab, setActiveTab] = useState<"todo" | "done" | "improvements">(
    "todo",
  );

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [completedSurveys, setCompletedSurveys] = useState<Survey[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [studentFeedbacks, setStudentFeedbacks] = useState<any[]>([]);

  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Load surveys & improvements
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [activeList, doneList, newsList] = await Promise.all([
        surveysApi.mySurveys(),
        surveysApi.myCompletedSurveys(),
        improvementsApi.list(),
      ]);
      setSurveys((activeList as any[]) || []);
      setCompletedSurveys((doneList as any[]) || []);
      setImprovements((newsList as any[]) || []);

      try {
        const feedbacksList = await clarificationsApi.getStudentFeedbacks();
        setStudentFeedbacks(feedbacksList || []);
      } catch {
        // feedbacks optional
      }
    } catch (err) {
      console.error("Error loading respondent dashboard:", err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, loadDashboardData]);

  // Tính progress mỗi khi answers thay đổi
  useEffect(() => {
    if (!selectedSurvey?.content?.sections?.length) {
      setProgress(0);
      return;
    }
    setProgress(calcProgress(selectedSurvey.content, answers));
  }, [answers, selectedSurvey]);

  const handleStartSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setAnswers({});
    setSubmitError(null);
    setView("taking");
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurvey) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const rawText = collectOpenEndedText(selectedSurvey.content, answers);
      await responsesApi.submit(selectedSurvey.id, {
        answers,
        raw_content_text: rawText,
      });
      setShowSuccess(true);
    } catch (err: any) {
      const detail = err?.data?.detail;
      if (detail && typeof detail === "object" && detail.errors) {
        setSubmitError((detail.errors as string[]).join("\n"));
      } else if (typeof detail === "string") {
        setSubmitError(detail);
      } else {
        setSubmitError("Có lỗi xảy ra khi gửi khảo sát. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishAndReturn = () => {
    setShowSuccess(false);
    setView("list");
    setSelectedSurvey(null);
    // Reload danh sách từ server để đảm bảo chính xác
    loadDashboardData();
  };

  // ── Loading & Auth Guard ───────────────────────────────────────────────────

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-[14px] text-on-surface-variant font-medium">
            Đang tải...
          </span>
        </div>
      </div>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────
  const sections = (selectedSurvey?.content?.sections || []) as any[];
  const allQuestions = sections.length
    ? getAllQuestions(selectedSurvey?.content)
    : [];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md antialiased pb-20">
      {/* Header */}
      <header className="bg-surface-container-lowest sticky top-0 z-30 shadow-sm border-b border-outline-variant/40">
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto px-md h-16">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary font-bold" style={{ fontSize: '24px', lineHeight: '1' }}>
              assignment
            </span>
            <h1 className="font-headline-md text-headline-md text-primary font-bold hidden sm:block leading-none">
              Cổng Khảo sát Độc lập
            </h1>
            <h1 className="font-headline-md text-headline-md text-primary font-bold sm:hidden leading-none">
              Khảo sát
            </h1>
          </div>
          <div className="flex items-center gap-md">
            <div className="text-right hidden md:block">
              <p className="text-[13px] font-semibold text-on-surface leading-tight">
                {user?.full_name}
              </p>
              <p className="text-[11px] text-on-surface-variant leading-none">
                {user?.roles?.[0]}
              </p>
            </div>
            <div className="w-px h-6 bg-outline-variant/40 hidden md:block"></div>
            <button
              onClick={() => logout()}
              className="text-error border border-error/25 hover:bg-error-container/15 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', lineHeight: '1' }}>
                logout
              </span>
              <span className="leading-none">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-md py-lg flex flex-col gap-lg">
        {view === "list" ? (
          // ── Dashboard View ────────────────────────────────────────────────
          <div className="space-y-lg animate-in fade-in duration-300">
            {/* Welcome */}
            <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary rounded-full filter blur-[70px] opacity-15"></div>
              <h2 className="text-headline-lg font-bold text-primary mb-1">
                Xin chào, {user?.full_name}!
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Ý kiến đóng góp của bạn là kim chỉ nam giúp nhà trường hoàn
                thiện chất lượng giảng dạy, cơ sở vật chất và trải nghiệm học
                tập tốt hơn mỗi ngày.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-outline-variant gap-lg">
              {(["todo", "done", "improvements"] as const).map((tab) => {
                const labels = {
                  todo: "Khảo sát chưa làm",
                  done: "Khảo sát đã hoàn thành",
                  improvements: "Bảng tin cải tiến",
                };
                const icons = {
                  todo: "assignment",
                  done: "task_alt",
                  improvements: "campaign",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 py-3 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', lineHeight: '1' }}>
                      {icons[tab]}
                    </span>
                    <span className="leading-none">{labels[tab]}</span>
                    {tab === "todo" && surveys.length > 0 && (
                      <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {surveys.length}
                      </span>
                    )}
                    {tab === "done" && completedSurveys.length > 0 && (
                      <span className="bg-secondary text-on-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {completedSurveys.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {loadingData ? (
              <div className="py-xl text-center flex flex-col items-center gap-md">
                <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: '36px', lineHeight: '1' }}>
                  sync
                </span>
                <span className="text-body-md text-on-surface-variant leading-none">
                  Đang tải...
                </span>
              </div>
            ) : activeTab === "todo" ? (
              <div className="space-y-md">
                {surveys.length === 0 ? (
                  <div className="py-xl text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-inner flex flex-col items-center gap-sm">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px', lineHeight: '1' }}>
                      assignment_turned_in
                    </span>
                    <span>Bạn đã hoàn thành tất cả khảo sát kỳ này! Cảm ơn bạn.</span>
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
                          {s.description ||
                            "Bấm nút bên phải để bắt đầu làm khảo sát."}
                        </p>
                        {/* Hiển thị số câu hỏi nếu có content */}
                        {s.content?.sections && (
                          <p className="text-[10px] text-primary font-semibold mt-1">
                            {getAllQuestions(s.content).length} câu hỏi ·{" "}
                            {s.content.sections.length} phần
                          </p>
                        )}
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
              <div className="space-y-md">
                {completedSurveys.length === 0 ? (
                  <div className="py-xl text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg flex flex-col items-center gap-sm">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: '36px', lineHeight: '1' }}>
                      history
                    </span>
                    <span>Chưa có khảo sát nào được hoàn thành.</span>
                  </div>
                ) : (
                  completedSurveys.map((s) => (
                    <div
                      key={s.id}
                      className="bg-surface-container-lowest border border-outline-variant/60 opacity-80 rounded-xl p-lg shadow-sm flex items-center justify-between gap-md"
                    >
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface text-base font-bold mb-xs">
                          {s.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 shrink-0 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <span className="material-symbols-outlined font-bold" style={{ fontSize: '16px', lineHeight: '1' }}>
                          verified
                        </span>
                        <span className="leading-none">Đã nộp bài</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Improvements & Feedbacks
              <div className="space-y-lg">
                <div className="space-y-md">
                  <h3 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', lineHeight: '1' }}>
                      campaign
                    </span>
                    <span className="leading-none">Thông báo Cải tiến từ Nhà trường</span>
                  </h3>
                  {improvements.length === 0 ? (
                    <div className="py-lg text-center text-on-surface-variant text-sm bg-surface-container rounded-xl p-md">
                      Chưa có thông báo cải tiến chung nào.
                    </div>
                  ) : (
                    improvements.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm space-y-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-secondary bg-secondary/8 px-2.5 py-0.5 rounded-full">
                            Cải tiến chất lượng
                          </span>
                          <span className="text-xs text-on-surface-variant font-medium">
                            {new Date(item.created_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                        <h4 className="font-label-md text-label-md text-on-surface text-base font-bold">
                          {item.title}
                        </h4>
                        <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-md border-t border-outline-variant/30 pt-lg mt-lg">
                  <h3 className="font-label-md text-label-md font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', lineHeight: '1' }}>
                      chat_bubble
                    </span>
                    <span className="leading-none">Phản hồi &amp; Cam kết của Giảng viên</span>
                  </h3>
                  {studentFeedbacks.length === 0 ? (
                    <div className="py-lg text-center text-on-surface-variant text-sm bg-surface-container rounded-xl p-md">
                      Chưa có thư phản hồi nào từ giảng viên được đăng tải.
                    </div>
                  ) : (
                    studentFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm space-y-sm"
                      >
                        <div className="flex justify-between items-start gap-md border-b border-outline-variant/30 pb-xs">
                          <div>
                            <h4 className="font-label-md text-label-md text-on-surface font-bold text-base">
                              {fb.survey_clarifications?.users?.full_name ||
                                "Giảng viên bộ môn"}
                            </h4>
                            <p className="text-xs text-primary font-semibold mt-0.5">
                              Môn:{" "}
                              {fb.survey_clarifications?.surveys?.title ||
                                "Khảo sát học phần"}
                            </p>
                          </div>
                          <span className="text-xs text-on-surface-variant font-medium shrink-0">
                            {new Date(fb.created_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                        <div className="pt-xs">
                          <p className="text-xs text-on-surface-variant font-bold mb-1">
                            Thư phản hồi gửi lớp:
                          </p>
                          <div className="p-md bg-surface rounded-lg border border-outline-variant/40 italic text-sm text-on-surface leading-relaxed">
                            &quot;{fb.message_content}&quot;
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── Taking Survey View ──────────────────────────────────────────────
          <div className="space-y-lg animate-in fade-in duration-300">
            {/* Progress Bar */}
            <section className="flex flex-col gap-sm bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex justify-between items-end">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                  {selectedSurvey?.title}
                </span>
                <span className="font-label-md text-label-md text-primary font-semibold">
                  Tiến độ: {progress}%
                </span>
              </div>
              <div className="w-full h-[6px] bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant">
                {allQuestions.filter((q) => q.required).length} câu hỏi bắt buộc
                {allQuestions.filter((q) => !q.required).length > 0 &&
                  ` · ${allQuestions.filter((q) => !q.required).length} câu hỏi tùy chọn`}
              </p>
            </section>

            {/* Error */}
            {submitError && (
              <div className="bg-error/8 border border-error/30 text-error rounded-xl p-md text-sm whitespace-pre-line">
                <p className="font-bold mb-1">Vui lòng kiểm tra lại:</p>
                {submitError}
              </div>
            )}

            {/* Survey Form */}
            <form onSubmit={handleSubmitSurvey} className="space-y-lg">
              {/* Render sections & questions */}
              {sections.length ? (
                sections.map((section) => (
                  <div key={section.id} className="space-y-md">
                    {/* Section Header */}
                    {(sections.length > 1 ||
                      section.title) && (
                      <div className="border-b border-outline-variant/30 pb-sm">
                        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          {section.title}
                        </h2>
                        {section.description && (
                          <p className="text-sm text-on-surface-variant mt-0.5">
                            {section.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Questions */}
                    {section.questions.map((question: any, idx: number) => {
                      // Tính index toàn cục
                      const globalIdx =
                        sections
                          .slice(
                            0,
                            sections.indexOf(section),
                          )
                          .reduce((acc, s) => acc + s.questions.length, 0) +
                        idx;

                      return (
                        <QuestionRenderer
                          key={question.id}
                          question={question}
                          answers={answers}
                          onChange={handleAnswerChange}
                          index={globalIdx}
                        />
                      );
                    })}
                  </div>
                ))
              ) : (
                /* Fallback nếu survey chưa có content */
                <div className="py-xl text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant p-lg flex flex-col items-center gap-sm">
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '36px', lineHeight: '1' }}>
                    warning
                  </span>
                  <p className="font-semibold">Khảo sát này chưa có câu hỏi.</p>
                  <p className="text-sm mt-1">
                    Vui lòng liên hệ quản lý để cập nhật nội dung khảo sát.
                  </p>
                </div>
              )}

              {/* Actions */}
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
                  disabled={submitting}
                  className="px-lg py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && (
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  )}
                  {submitting ? "Đang gửi..." : "Gửi khảo sát"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            onClick={handleFinishAndReturn}
          ></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md text-center items-center z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shadow-inner mb-sm">
              <span className="material-symbols-outlined font-bold" style={{ fontSize: '36px', lineHeight: '1' }}>
                check_circle
              </span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-primary font-bold">
              Gửi khảo sát thành công!
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Cảm ơn bạn đã đóng góp ý kiến phản hồi quý báu. Ý kiến này sẽ giúp
              nhà trường nâng cao chất lượng giáo dục trong học kỳ tới!
            </p>
            <button
              onClick={handleFinishAndReturn}
              className="w-full min-h-[48px] bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md rounded-lg transition-colors shadow-sm cursor-pointer mt-md"
            >
              Quay lại Danh sách
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
