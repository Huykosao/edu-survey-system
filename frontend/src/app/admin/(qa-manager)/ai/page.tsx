"use client";

import React, { useState, useEffect, useCallback } from "react";
import { labelsApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Label {
  id: number;
  label_name: string;
  label_description?: string;
  role_id: number;
}

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
export default function LabelManagementPage() {
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Labels state
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelDesc, setNewLabelDesc] = useState("");
  const [labelRoleId, setLabelRoleId] = useState<number>(4);
  const [addingLabel, setAddingLabel] = useState(false);

  // Inline editing state
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editingLabelName, setEditingLabelName] = useState("");
  const [editingLabelDesc, setEditingLabelDesc] = useState("");

  const showToast = (msg: string, type: "success" | "error" | "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

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

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    setAddingLabel(true);
    try {
      await labelsApi.create({ 
        role_id: labelRoleId, 
        label_name: newLabelName.trim(),
        label_description: newLabelDesc.trim() || undefined
      });
      setNewLabelName("");
      setNewLabelDesc("");
      showToast("Đã thêm nhãn thành công!", "success");
      loadLabels(labelRoleId);
    } catch {
      showToast("Lỗi khi thêm nhãn. Vui lòng thử lại.", "error");
    } finally {
      setAddingLabel(false);
    }
  };

  const handleSaveEdit = async (labelId: number) => {
    if (!editingLabelName.trim()) return;
    try {
      await labelsApi.update(labelId, { 
        role_id: labelRoleId, 
        label_name: editingLabelName.trim(),
        label_description: editingLabelDesc.trim() || undefined
      });
      setEditingLabelId(null);
      setEditingLabelName("");
      setEditingLabelDesc("");
      showToast("Cập nhật nhãn thành công!", "success");
      loadLabels(labelRoleId);
    } catch {
      showToast("Lỗi khi sửa nhãn. Vui lòng thử lại.", "error");
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhãn này? Các phản hồi đã gán nhãn này sẽ mất liên kết.")) return;
    try {
      await labelsApi.delete(labelId);
      showToast("Xóa nhãn thành công!", "success");
      loadLabels(labelRoleId);
    } catch {
      showToast("Lỗi khi xóa nhãn. Vui lòng thử lại.", "error");
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300 pb-12">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Page Header */}
      <div className="flex flex-col gap-xs border-b border-outline-variant/30 pb-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-white text-[22px]">
              sell
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Quản lý Nhãn Khảo sát
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Thiết lập danh mục nhãn phân loại ý kiến đóng góp cho từng nhóm đối tượng
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
        {/* Left: Add Label Form */}
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
                  Tên nhãn *
                </label>
                <input
                  type="text"
                  required
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Ví dụ: Cơ sở vật chất, Giảng dạy..."
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-xs">
                <label className="text-xs font-bold text-on-surface-variant">
                  Mô tả nhãn (tùy chọn)
                </label>
                <textarea
                  value={newLabelDesc}
                  onChange={(e) => setNewLabelDesc(e.target.value)}
                  placeholder="Mô tả ý nghĩa của nhãn phân loại này..."
                  rows={3}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
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
                <span className="font-bold text-primary">Lưu ý:</span> Bộ nhãn này sẽ được hiển thị khi thống kê khảo sát đã đóng để gán nhãn tự động cho các phản hồi mở của từng nhóm đối tượng tương ứng.
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
                className="p-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:outline-none font-bold text-primary"
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
                    className="h-16 bg-surface-container rounded-xl animate-pulse"
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
              <div className="flex flex-col gap-sm">
                {labels.map((label, idx) => {
                  const isEditing = editingLabelId === label.id;
                  return (
                    <div
                      key={label.id}
                      className="flex items-start gap-3 p-4 bg-surface-container rounded-2xl border border-outline-variant/30 group hover:border-primary/30 hover:bg-primary/3 transition-all duration-150"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      
                      {isEditing ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            type="text"
                            value={editingLabelName}
                            onChange={(e) => setEditingLabelName(e.target.value)}
                            placeholder="Tên nhãn *"
                            className="w-full p-2 bg-surface-container-lowest border border-outline rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                            autoFocus
                          />
                          <textarea
                            value={editingLabelDesc}
                            onChange={(e) => setEditingLabelDesc(e.target.value)}
                            placeholder="Mô tả nhãn..."
                            rows={2}
                            className="w-full p-2 bg-surface-container-lowest border border-outline rounded-lg text-xs focus:outline-none focus:border-primary resize-none"
                          />
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleSaveEdit(label.id)}
                              className="px-2.5 py-1.5 bg-primary text-on-primary rounded-lg text-[10px] font-bold flex items-center gap-1 hover:opacity-90 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">check</span>
                              Lưu
                            </button>
                            <button
                              onClick={() => {
                                setEditingLabelId(null);
                                setEditingLabelName("");
                                setEditingLabelDesc("");
                              }}
                              className="px-2.5 py-1.5 bg-outline-variant text-on-surface-variant rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-surface-container-high cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">
                              {label.label_name}
                            </p>
                            {label.label_description && (
                              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                {label.label_description}
                              </p>
                            )}
                            <p className="text-[9px] font-black uppercase text-outline mt-1.5 tracking-wider">
                              ID: #{label.id}
                            </p>
                          </div>
                          
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingLabelId(label.id);
                                setEditingLabelName(label.label_name);
                                setEditingLabelDesc(label.label_description || "");
                              }}
                              className="p-1.5 text-outline hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-primary/5"
                              title="Sửa"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLabel(label.id)}
                              className="p-1.5 text-outline hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                          
                          <span className="material-symbols-outlined text-[16px] text-outline group-hover:hidden transition-colors shrink-0 mt-1">
                            label
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
