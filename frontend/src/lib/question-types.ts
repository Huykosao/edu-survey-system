/**
 * lib/question-types.ts
 * ──────────────────────
 * TypeScript interfaces cho 5 dạng câu hỏi khảo sát chuẩn.
 * Phản ánh chính xác Pydantic schemas ở backend (schemas/survey.py).
 *
 * 1. LikertQuestion      — Thang đo đồng ý/hài lòng (1–5)
 * 2. SingleChoiceQuestion — Trắc nghiệm một đáp án
 * 3. MultipleChoiceQuestion — Trắc nghiệm nhiều đáp án
 * 4. MatrixQuestion      — Ma trận đánh giá nhiều tiêu chí
 * 5. NpsQuestion         — Net Promoter Score (0–10)
 * 6. OpenEndedQuestion   — Câu hỏi mở
 */

// ── Question Types ────────────────────────────────────────────────────────────

export type QuestionType =
  | "likert"
  | "single_choice"
  | "multiple_choice"
  | "matrix"
  | "nps"
  | "open_ended";

// Base interface cho tất cả câu hỏi
interface BaseQuestion {
  /** ID duy nhất trong toàn bộ survey, VD: "q1", "s2_q3" */
  id: string;
  type: QuestionType;
  /** Nội dung câu hỏi hiển thị cho người dùng */
  label: string;
  /** Câu hỏi có bắt buộc trả lời không */
  required: boolean;
}

/**
 * Thang đo Likert (1–5)
 * Answer: { "q1": 3 }  — số nguyên từ 1 đến 5
 */
export interface LikertQuestion extends BaseQuestion {
  type: "likert";
  min_label: string; // VD: "Hoàn toàn không đồng ý"
  max_label: string; // VD: "Hoàn toàn đồng ý"
}

/**
 * Trắc nghiệm một đáp án (Single Choice)
 * Answer: { "q2": "Trực tiếp" }  — một string trong options
 */
export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single_choice";
  options: string[];
}

/**
 * Trắc nghiệm nhiều đáp án (Multiple Choice)
 * Answer: { "q3": ["Trực tiếp", "Trực tuyến"] }  — mảng string
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: string[];
  /** Số lựa chọn tối đa, undefined = không giới hạn */
  max_selections?: number;
}

/**
 * Ma trận đánh giá (Matrix Rating)
 * Answer: { "q4": { "Nội dung bài giảng": "Tốt", ... } }
 */
export interface MatrixQuestion extends BaseQuestion {
  type: "matrix";
  /** Các tiêu chí (hàng trong bảng) */
  rows: string[];
  /** Các mức đánh giá (cột trong bảng) */
  columns: string[];
}

/**
 * Net Promoter Score (0–10)
 * Answer: { "q5": 8 }  — số nguyên từ 0 đến 10
 */
export interface NpsQuestion extends BaseQuestion {
  type: "nps";
  min_label: string; // VD: "Hoàn toàn không"
  max_label: string; // VD: "Chắc chắn có"
}

/**
 * Câu hỏi mở (Open Ended)
 * Answer: { "q6": "Tôi muốn thêm..." }  — string tùy ý
 */
export interface OpenEndedQuestion extends BaseQuestion {
  type: "open_ended";
  placeholder: string;
  /** Số ký tự tối đa */
  max_length: number;
}

/** Union type cho bất kỳ dạng câu hỏi nào */
export type AnyQuestion =
  | LikertQuestion
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | MatrixQuestion
  | NpsQuestion
  | OpenEndedQuestion;

// ── Survey Structure ──────────────────────────────────────────────────────────

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  questions: AnyQuestion[];
}

export interface SurveyContent {
  sections: SurveySection[];
}

// ── Answer Types ──────────────────────────────────────────────────────────────

/** Kiểu dữ liệu câu trả lời cho từng loại câu hỏi */
export type LikertAnswer = number;          // 1–5
export type SingleChoiceAnswer = string;    // 1 trong options
export type MultipleChoiceAnswer = string[]; // n trong options
export type MatrixAnswer = Record<string, string>; // { row: column }
export type NpsAnswer = number;             // 0–10
export type OpenEndedAnswer = string;       // văn bản tự do

/** Union type cho giá trị bất kỳ câu trả lời nào */
export type AnyAnswer =
  | LikertAnswer
  | SingleChoiceAnswer
  | MultipleChoiceAnswer
  | MatrixAnswer
  | NpsAnswer
  | OpenEndedAnswer;

/** Dict ánh xạ question_id → câu trả lời, dùng để gửi lên backend */
export type SurveyAnswers = Record<string, AnyAnswer>;

// ── Helper Functions ──────────────────────────────────────────────────────────

/** Lấy danh sách phẳng tất cả câu hỏi từ content */
export function getAllQuestions(content: any): AnyQuestion[] {
  if (!content?.sections) return [];
  return content.sections.flatMap((s: any) => s.questions ?? []);
}

/** Kiểm tra một câu hỏi đã được trả lời chưa */
export function isAnswered(question: AnyQuestion, answers: SurveyAnswers): boolean {
  const answer = answers[question.id];
  if (answer === undefined || answer === null || answer === "") return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === "object") return Object.keys(answer).length > 0;
  return true;
}

/** Tính phần trăm tiến độ dựa trên câu hỏi required */
export function calcProgress(content: any, answers: SurveyAnswers): number {
  const questions = getAllQuestions(content);
  const required = questions.filter((q) => q.required);
  if (required.length === 0) return 100;
  const answered = required.filter((q) => isAnswered(q, answers)).length;
  return Math.round((answered / required.length) * 100);
}

/** Tổng hợp text từ câu hỏi open_ended để tạo raw_content_text */
export function collectOpenEndedText(content: any, answers: SurveyAnswers): string {
  if (!content?.sections) return "";
  const texts: string[] = [];
  for (const q of getAllQuestions(content)) {
    if (q.type === "open_ended") {
      const val = answers[q.id];
      if (typeof val === "string" && val.trim()) {
        texts.push(`${q.label}: ${val.trim()}`);
      }
    }
  }
  return texts.join("\n\n");
}

