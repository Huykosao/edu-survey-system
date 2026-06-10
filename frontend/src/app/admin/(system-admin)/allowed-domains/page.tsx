"use client";

import React, { useState, useEffect } from "react";
import { allowedDomainsApi } from "@/lib/api";

interface AllowedDomain {
  id: number;
  domain: string;
  description: string;
  created_at: string;
}

export default function AllowedDomainsPage() {
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<AllowedDomain | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  // Form states
  const [domainName, setDomainName] = useState("");
  const [domainDesc, setDomainDesc] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const loadDomains = async () => {
    setLoading(true);
    try {
      const res = await allowedDomainsApi.list();
      setDomains((res as any) || []);
    } catch (err) {
      console.error("Error loading allowed domains:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName) return;

    try {
      await allowedDomainsApi.create({
        domain: domainName.toLowerCase().trim(),
        description: domainDesc.trim() || undefined,
      });
      setDomainName("");
      setDomainDesc("");
      setShowAddModal(false);
      loadDomains();
      showToast("Đã thêm tên miền mới thành công!");
    } catch (err: any) {
      console.error("Error adding domain:", err);
      alert(err.message || "Có lỗi xảy ra khi thêm tên miền.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !domainName) return;

    try {
      await allowedDomainsApi.update(selectedDomain.id, {
        domain: domainName.toLowerCase().trim(),
        description: domainDesc.trim() || undefined,
      });
      setDomainName("");
      setDomainDesc("");
      setSelectedDomain(null);
      setShowEditModal(false);
      loadDomains();
      showToast("Đã cập nhật thông tin tên miền!");
    } catch (err: any) {
      console.error("Error updating domain:", err);
      alert(err.message || "Có lỗi xảy ra khi cập nhật tên miền.");
    }
  };

  const handleDelete = async (id: number, domain: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tên miền '${domain}' khỏi danh sách cho phép?`)) return;
    try {
      await allowedDomainsApi.delete(id);
      loadDomains();
      showToast("Đã xóa tên miền thành công!");
    } catch (err) {
      console.error("Error deleting domain:", err);
      showToast("Có lỗi xảy ra khi xóa tên miền.");
    }
  };

  const openEdit = (item: AllowedDomain) => {
    setSelectedDomain(item);
    setDomainName(item.domain);
    setDomainDesc(item.description || "");
    setShowEditModal(true);
  };

  // Filter logic
  const filteredDomains = domains.filter((item) =>
    item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary text-on-primary px-lg py-md rounded-lg shadow-lg flex items-center gap-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-tertiary">check_circle</span>
          <span className="font-label-md text-label-md font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Quản lý Tên miền đăng nhập</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Quản lý các tên miền email của trường, viện hoặc đối tác ngoài được quyền đăng ký/đăng nhập vào hệ thống.
          </p>
        </div>
        <button
          onClick={() => {
            setDomainName("");
            setDomainDesc("");
            setShowAddModal(true);
          }}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add_moderator</span>
          Thêm tên miền mới
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex gap-md items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tên miền hoặc mô tả..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="text-on-surface-variant text-label-sm font-semibold">
          Tổng số: {filteredDomains.length} tên miền
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center text-primary">
            <span className="material-symbols-outlined animate-spin text-4xl mr-3">sync</span>
            Đang tải danh sách tên miền...
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-sm">
            <span className="material-symbols-outlined text-5xl text-outline">language</span>
            Không tìm thấy tên miền nào trong hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container">
                  <th className="p-md font-label-md text-on-surface-variant font-semibold">Tên miền (Domain)</th>
                  <th className="p-md font-label-md text-on-surface-variant font-semibold">Mô tả ghi chú</th>
                  <th className="p-md font-label-md text-on-surface-variant font-semibold">Ngày thêm</th>
                  <th className="p-md font-label-md text-on-surface-variant font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDomains.map((item) => (
                  <tr key={item.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low/40 transition-colors">
                    <td className="p-md font-body-md text-on-surface font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">alternate_email</span>
                      {item.domain}
                    </td>
                    <td className="p-md font-body-md text-on-surface-variant">
                      {item.description || <span className="text-outline italic">Không có mô tả</span>}
                    </td>
                    <td className="p-md font-body-md text-on-surface-variant">
                      {new Date(item.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-md text-right space-x-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-primary hover:bg-primary-fixed/20 p-2 rounded-full cursor-pointer transition-colors"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.domain)}
                        className="text-error hover:bg-error-container/20 p-2 rounded-full cursor-pointer transition-colors"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm">
              Thêm Tên Miền Mới
            </h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="add-domain-name">Tên miền (Domain)</label>
                <input
                  id="add-domain-name"
                  type="text"
                  required
                  placeholder="ví dụ: uet.vnu.edu.vn"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="add-domain-desc">Mô tả / Ghi chú</label>
                <textarea
                  id="add-domain-desc"
                  placeholder="Ghi chú đối tượng áp dụng của tên miền..."
                  value={domainDesc}
                  onChange={(e) => setDomainDesc(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-sm justify-end mt-lg">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-md py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Thêm tên miền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Domain Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm">
              Cập Nhật Tên Miền
            </h3>
            <form onSubmit={handleEdit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="edit-domain-name">Tên miền (Domain)</label>
                <input
                  id="edit-domain-name"
                  type="text"
                  required
                  placeholder="ví dụ: uet.vnu.edu.vn"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="edit-domain-desc">Mô tả / Ghi chú</label>
                <textarea
                  id="edit-domain-desc"
                  placeholder="Ghi chú đối tượng áp dụng của tên miền..."
                  value={domainDesc}
                  onChange={(e) => setDomainDesc(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-sm justify-end mt-lg">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-md py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
