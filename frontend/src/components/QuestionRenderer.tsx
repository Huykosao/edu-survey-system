"use client";

/**
 * components/QuestionRenderer.tsx
 * ─────────────────────────────────
 * Component render động cho 5 dạng câu hỏi khảo sát.
 * Nhận vào một AnyQuestion và giá trị câu trả lời hiện tại,
 * gọi onChange khi người dùng thay đổi lựa chọn.
 */

import React from "react";
import type {
  AnyQuestion,
  SurveyAnswers,
  AnyAnswer,
  MatrixAnswer,
  MultipleChoiceAnswer,
} from "@/lib/question-types";

interface QuestionRendererProps {
  question: AnyQuestion;
  /** Toàn bộ state answers để lấy giá trị hiện tại */
  answers: SurveyAnswers;
  /** Callback khi người dùng thay đổi câu trả lời */
  onChange: (questionId: string, value: AnyAnswer) => void;
  /** Chỉ số câu hỏi để hiển thị số thứ tự */
  index: number;
}

export default function QuestionRenderer({
  question,
  answers,
  onChange,
  index,
}: QuestionRendererProps) {
  const currentAnswer = answers[question.id];

  // ── Wrapper dùng chung ──────────────────────────────────────────────────────
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm flex flex-col gap-md">
      {/* Question Label */}
      <div className="flex gap-sm">
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1">
          <h3 className="font-body-lg text-body-md font-bold text-on-surface leading-snug">
            {question.label}
            {question.required && (
              <span className="text-error ml-1 text-sm">*</span>
            )}
          </h3>
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5 block opacity-70">
            {typeLabel(question.type)}
          </span>
        </div>
      </div>

      {/* Question Input — theo từng loại */}
      <div className="pl-9">
        {question.type === "likert" && (
          <LikertInput
            questionId={question.id}
            minLabel={question.min_label}
            maxLabel={question.max_label}
            value={typeof currentAnswer === "number" ? currentAnswer : undefined}
            onChange={(v) => onChange(question.id, v)}
          />
        )}

        {question.type === "single_choice" && (
          <SingleChoiceInput
            questionId={question.id}
            options={question.options}
            value={typeof currentAnswer === "string" ? currentAnswer : undefined}
            onChange={(v) => onChange(question.id, v)}
          />
        )}

        {question.type === "multiple_choice" && (
          <MultipleChoiceInput
            questionId={question.id}
            options={question.options}
            maxSelections={question.max_selections}
            value={Array.isArray(currentAnswer) ? (currentAnswer as MultipleChoiceAnswer) : []}
            onChange={(v) => onChange(question.id, v)}
          />
        )}

        {question.type === "matrix" && (
          <MatrixInput
            questionId={question.id}
            rows={question.rows}
            columns={question.columns}
            value={
              currentAnswer && typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
                ? (currentAnswer as MatrixAnswer)
                : {}
            }
            onChange={(v) => onChange(question.id, v)}
          />
        )}

        {question.type === "nps" && (
          <NpsInput
            questionId={question.id}
            minLabel={question.min_label}
            maxLabel={question.max_label}
            value={typeof currentAnswer === "number" ? currentAnswer : undefined}
            onChange={(v) => onChange(question.id, v)}
          />
        )}

        {question.type === "open_ended" && (
          <OpenEndedInput
            questionId={question.id}
            placeholder={question.placeholder}
            maxLength={question.max_length}
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(v) => onChange(question.id, v)}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/** 1. Likert Scale (1–5) */
function LikertInput({
  questionId,
  minLabel,
  maxLabel,
  value,
  onChange,
}: {
  questionId: string;
  minLabel: string;
  maxLabel: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  const SCALE = [1, 2, 3, 4, 5] as const;
  const EMOJI = ["😞", "😕", "😐", "🙂", "😊"];

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center gap-xs bg-surface-container-lowest p-md rounded-xl border border-surface-container-high">
        <span className="text-xs text-on-surface-variant text-center leading-tight min-w-[70px] hidden sm:block">
          {minLabel}
        </span>
        <div className="flex justify-around items-center w-full px-2 gap-xs">
          {SCALE.map((num, i) => (
            <label
              key={num}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <input
                type="radio"
                name={questionId}
                value={num}
                checked={value === num}
                onChange={() => onChange(num)}
                className="sr-only"
              />
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base transition-all duration-150 ${
                  value === num
                    ? "bg-primary border-primary text-on-primary shadow-md scale-110"
                    : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary/50 hover:bg-primary/5"
                }`}
                onClick={() => onChange(num)}
              >
                {EMOJI[i]}
              </div>
              <span
                className={`text-xs font-bold transition-colors ${
                  value === num ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {num}
              </span>
            </label>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant text-center leading-tight min-w-[70px] hidden sm:block">
          {maxLabel}
        </span>
      </div>
      <div className="flex justify-between sm:hidden text-[10px] text-on-surface-variant px-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

/** 2. Single Choice */
function SingleChoiceInput({
  questionId,
  options,
  value,
  onChange,
}: {
  questionId: string;
  options: string[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-xs">
      {options.map((option) => (
        <label
          key={option}
          className={`flex items-center gap-md cursor-pointer p-sm rounded-lg border transition-all duration-150 ${
            value === option
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-transparent hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <input
            type="radio"
            name={questionId}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="w-4 h-4 text-primary border-outline-variant focus:ring-primary cursor-pointer accent-[var(--color-primary)]"
          />
          <span className="font-body-md text-sm font-medium">{option}</span>
        </label>
      ))}
    </div>
  );
}

/** 3. Multiple Choice */
function MultipleChoiceInput({
  questionId,
  options,
  maxSelections,
  value,
  onChange,
}: {
  questionId: string;
  options: string[];
  maxSelections?: number;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, option]);
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      {maxSelections && (
        <p className="text-xs text-on-surface-variant mb-xs">
          Chọn tối đa {maxSelections} lựa chọn
          <span className={`ml-2 font-bold ${value.length >= maxSelections ? "text-warning" : "text-primary"}`}>
            ({value.length}/{maxSelections})
          </span>
        </p>
      )}
      {options.map((option) => {
        const checked = value.includes(option);
        const disabled = !checked && !!maxSelections && value.length >= maxSelections;
        return (
          <label
            key={option}
            className={`flex items-center gap-md cursor-pointer p-sm rounded-lg border transition-all duration-150 ${
              checked
                ? "border-secondary/40 bg-secondary/5 text-secondary"
                : disabled
                ? "border-transparent opacity-40 cursor-not-allowed text-on-surface-variant"
                : "border-transparent hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(option)}
              className="w-4 h-4 text-secondary border-outline-variant focus:ring-secondary cursor-pointer accent-[var(--color-secondary)] rounded"
            />
            <span className="font-body-md text-sm font-medium">{option}</span>
          </label>
        );
      })}
    </div>
  );
}

/** 4. Matrix Rating */
function MatrixInput({
  questionId,
  rows,
  columns,
  value,
  onChange,
}: {
  questionId: string;
  rows: string[];
  columns: string[];
  value: MatrixAnswer;
  onChange: (v: MatrixAnswer) => void;
}) {
  const selectCell = (row: string, col: string) => {
    onChange({ ...value, [row]: col });
  };

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 text-xs text-on-surface-variant font-semibold min-w-[140px]">
              Tiêu chí
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="py-2 px-2 text-center text-xs text-on-surface-variant font-semibold min-w-[70px]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row}
              className={`border-t border-outline-variant/30 transition-colors ${
                value[row] ? "bg-primary/3" : ri % 2 === 0 ? "bg-transparent" : "bg-surface-container/30"
              }`}
            >
              <td className="py-2.5 px-3 text-on-surface text-xs font-medium leading-snug">
                {row}
              </td>
              {columns.map((col) => (
                <td key={col} className="py-2.5 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => selectCell(row, col)}
                    className={`w-6 h-6 rounded-full border-2 mx-auto transition-all duration-150 cursor-pointer ${
                      value[row] === col
                        ? "bg-primary border-primary shadow-sm scale-110"
                        : "border-outline-variant hover:border-primary/50 hover:bg-primary/5"
                    }`}
                    aria-label={`${row}: ${col}`}
                    title={col}
                  >
                    {value[row] === col && (
                      <span className="material-symbols-outlined text-on-primary text-[12px] leading-none flex items-center justify-center">
                        check
                      </span>
                    )}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 5. NPS Score (0–10) */
function NpsInput({
  questionId,
  minLabel,
  maxLabel,
  value,
  onChange,
}: {
  questionId: string;
  minLabel: string;
  maxLabel: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  const SCORES = Array.from({ length: 11 }, (_, i) => i); // 0..10

  const getColor = (score: number, selected: boolean) => {
    if (!selected) return "border-outline-variant bg-surface text-on-surface-variant hover:border-primary/50 hover:bg-primary/5";
    if (score <= 6) return "bg-error border-error text-on-error shadow-md";
    if (score <= 8) return "bg-warning border-warning text-on-warning shadow-md";
    return "bg-success border-success text-on-success shadow-md";
  };

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap gap-2 justify-between">
        {SCORES.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all duration-150 cursor-pointer flex-shrink-0 ${getColor(score, value === score)} ${value === score ? "scale-110" : ""}`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-on-surface-variant px-0.5">
        <span>0 — {minLabel}</span>
        <span>10 — {maxLabel}</span>
      </div>
      {value !== undefined && (
        <div className="text-center text-xs font-semibold mt-xs">
          <span className={`px-3 py-1 rounded-full ${getNpsCategory(value).color}`}>
            {getNpsCategory(value).label} — Điểm: {value}/10
          </span>
        </div>
      )}
    </div>
  );
}

/** 6. Open Ended */
function OpenEndedInput({
  questionId,
  placeholder,
  maxLength,
  value,
  onChange,
}: {
  questionId: string;
  placeholder: string;
  maxLength: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const remaining = maxLength - value.length;
  return (
    <div className="flex flex-col gap-xs">
      <textarea
        id={questionId}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full p-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y transition-colors"
      />
      <p
        className={`text-[11px] text-right ${remaining < 100 ? "text-warning font-semibold" : "text-on-surface-variant"}`}
      >
        Còn lại {remaining} ký tự
      </p>
    </div>
  );
}

// ── Utility Helpers ────────────────────────────────────────────────────────────

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    likert: "Thang đo Likert 1–5",
    single_choice: "Trắc nghiệm một đáp án",
    multiple_choice: "Trắc nghiệm nhiều đáp án",
    matrix: "Ma trận đánh giá",
    nps: "Chỉ số NPS 0–10",
    open_ended: "Câu hỏi mở",
  };
  return map[type] || type;
}

function getNpsCategory(score: number): { label: string; color: string } {
  if (score <= 6)
    return { label: "Không hài lòng (Detractor)", color: "bg-error/10 text-error" };
  if (score <= 8)
    return { label: "Trung lập (Passive)", color: "bg-warning/10 text-warning" };
  return { label: "Ủng hộ (Promoter)", color: "bg-success/10 text-success" };
}
