"use client";

import React, { useState, useEffect } from "react";
import { facultiesApi, majorsApi, classesApi, subjectsApi } from "@/lib/api";

interface DeptRow {
  id?: number;
  code: string;
  name: string;
  head: string;
  status: "Active" | "Inactive";
}

interface MajorRow {
  id?: number;
  code: string;
  name: string;
  dept: string;
  status: "Active" | "Inactive";
}

interface ClassRow {
  id?: number;
  code: string;
  name: string;
  major: string;
  advisor: string;
}

interface SubjectRow {
  id?: number;
  code: string;
  name: string;
  credits: number;
  dept: string;
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"khoa" | "nganh" | "lop" | "mon">("khoa");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Form states for adding new Dept
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHead, setNewDeptHead] = useState("");

  // Initial Data
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [majors, setMajors] = useState<MajorRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "khoa") {
          const res = await facultiesApi.list();
          setDepts((res as any[]).map(f => ({
            id: f.id,
            code: f.id.toString(), // or f.code if exists
            name: f.name,
            head: f.dean_id ? `User #${f.dean_id}` : "Chưa cập nhật",
            status: "Active"
          })));
        } else if (activeTab === "nganh") {
          const res = await majorsApi.list();
          setMajors((res as any[]).map(m => ({
            id: m.id,
            code: m.id.toString(),
            name: m.name,
            dept: m.faculty_id ? `Khoa #${m.faculty_id}` : "Chưa cập nhật",
            status: "Active"
          })));
        } else if (activeTab === "lop") {
          const res = await classesApi.list();
          setClasses((res as any[]).map(c => ({
            id: c.id,
            code: c.id.toString(),
            name: c.name,
            major: c.major_id ? `Ngành #${c.major_id}` : "Chưa cập nhật",
            advisor: "Chưa cập nhật"
          })));
        } else if (activeTab === "mon") {
          const res = await subjectsApi.list();
          setSubjects((res as any[]).map(s => ({
            id: s.id,
            code: s.code || s.id.toString(),
            name: s.name,
            credits: s.credits || 0,
            dept: s.faculty_id ? `Khoa #${s.faculty_id}` : "Chưa cập nhật"
          })));
        }
      } catch (err: any) {
        if (err?.message !== "Failed to fetch") {
          console.error("Error loading master data:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  const handleDeleteDept = async (id?: number) => {
    if (!id) return;
    try {
      await facultiesApi.delete(id);
      setDepts(depts.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting dept:", err);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    try {
      await facultiesApi.create({ name: newDeptName });
      // Reset form & close
      setNewDeptCode("");
      setNewDeptName("");
      setNewDeptHead("");
      setShowAddModal(false);
      // Reload faculties
      setActiveTab("khoa");
      const res = await facultiesApi.list();
      setDepts((res as any[]).map(f => ({
        id: f.id,
        code: f.id.toString(),
        name: f.name,
        head: f.dean_id ? `User #${f.dean_id}` : "Chưa cập nhật",
        status: "Active"
      })));
    } catch (err) {
      console.error("Error creating dept:", err);
    }
  };

  // Delete handlers for all tabs
  const handleDeleteMajor = async (id?: number) => {
    if (!id) return;
    try {
      await majorsApi.delete(id);
      setMajors(majors.filter(m => m.id !== id));
    } catch (err) { console.error("Error deleting major:", err); }
  };

  const handleDeleteClass = async (id?: number) => {
    if (!id) return;
    try {
      await classesApi.delete(id);
      setClasses(classes.filter(c => c.id !== id));
    } catch (err) { console.error("Error deleting class:", err); }
  };

  const handleDeleteSubject = async (id?: number) => {
    if (!id) return;
    try {
      await subjectsApi.delete(id);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (err) { console.error("Error deleting subject:", err); }
  };

  // Edit handlers (inline edit via prompt for simplicity)
  const handleEditDept = async (row: DeptRow) => {
    const newName = prompt("Nhập tên khoa mới:", row.name);
    if (!newName || !row.id) return;
    try {
      await facultiesApi.update(row.id, { name: newName });
      setDepts(depts.map(d => d.id === row.id ? { ...d, name: newName } : d));
    } catch (err) { console.error("Error updating dept:", err); }
  };

  const handleEditMajor = async (row: MajorRow) => {
    const newName = prompt("Nhập tên ngành mới:", row.name);
    if (!newName || !row.id) return;
    try {
      await majorsApi.update(row.id, { name: newName });
      setMajors(majors.map(m => m.id === row.id ? { ...m, name: newName } : m));
    } catch (err) { console.error("Error updating major:", err); }
  };

  const handleEditClass = async (row: ClassRow) => {
    const newName = prompt("Nhập tên lớp mới:", row.name);
    if (!newName || !row.id) return;
    try {
      await classesApi.update(row.id, { name: newName });
      setClasses(classes.map(c => c.id === row.id ? { ...c, name: newName } : c));
    } catch (err) { console.error("Error updating class:", err); }
  };

  const handleEditSubject = async (row: SubjectRow) => {
    const newName = prompt("Nhập tên môn học mới:", row.name);
    if (!newName || !row.id) return;
    try {
      await subjectsApi.update(row.id, { name: newName });
      setSubjects(subjects.map(s => s.id === row.id ? { ...s, name: newName } : s));
    } catch (err) { console.error("Error updating subject:", err); }
  };

  // Filtering based on tab and query
  const filteredDepts = depts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.head.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedDepts = filteredDepts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredMajors = majors.filter(
    (m) =>
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedMajors = filteredMajors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredClasses = classes.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.advisor.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedSubjects = filteredSubjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const activeDataList = activeTab === "khoa" ? filteredDepts : activeTab === "nganh" ? filteredMajors : activeTab === "lop" ? filteredClasses : filteredSubjects;
  const totalPages = Math.max(1, Math.ceil(activeDataList.length / ITEMS_PER_PAGE));

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-sm">
        <h1 className="font-display-lg text-[32px] font-bold text-on-surface">Quản lý Danh mục nền</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Cấu hình và duy trì sơ đồ phân cấp học thuật cốt lõi bao gồm khoa, ngành, lớp học và môn học.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-outline-variant">
        <nav aria-label="Tabs" className="-mb-px flex gap-lg">
          <button
            onClick={() => { setActiveTab("khoa"); setSearchQuery(""); }}
            className={`border-b-2 py-4 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer ${
              activeTab === "khoa"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface"
            }`}
          >
            Khoa (Departments)
          </button>
          <button
            onClick={() => { setActiveTab("nganh"); setSearchQuery(""); }}
            className={`border-b-2 py-4 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer ${
              activeTab === "nganh"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface"
            }`}
          >
            Ngành (Majors)
          </button>
          <button
            onClick={() => { setActiveTab("lop"); setSearchQuery(""); }}
            className={`border-b-2 py-4 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer ${
              activeTab === "lop"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface"
            }`}
          >
            Lớp (Classes)
          </button>
          <button
            onClick={() => { setActiveTab("mon"); setSearchQuery(""); }}
            className={`border-b-2 py-4 px-1 font-label-md text-label-md font-semibold transition-colors cursor-pointer ${
              activeTab === "mon"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface"
            }`}
          >
            Môn học (Subjects)
          </button>
        </nav>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-md border-b border-outline-variant flex flex-col sm:flex-row gap-sm justify-between items-center bg-surface-bright">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-sm px-md min-h-[40px] hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {activeTab === "khoa" && "Thêm Khoa mới"}
            {activeTab === "nganh" && "Thêm Ngành mới"}
            {activeTab === "lop" && "Thêm Lớp mới"}
            {activeTab === "mon" && "Thêm Môn học mới"}
          </button>
          
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full bg-surface-container-lowest border border-outline-variant focus:border-2 focus:border-primary focus:outline-none rounded-lg h-[40px] pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all"
            />
          </div>
        </div>

        {/* Table representation based on active tab */}
        <div className="overflow-x-auto">
          {activeTab === "khoa" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Mã khoa</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Tên khoa</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Trưởng khoa</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Trạng thái</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      <span className="material-symbols-outlined text-3xl text-primary animate-spin inline-block align-middle mr-2">sync</span>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedDepts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy khoa nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  paginatedDepts.map((row) => (
                    <tr key={row.code} className="hover:bg-surface-bright transition-colors group">
                      <td className="py-md px-md font-body-md text-body-md text-on-surface font-semibold">{row.code}</td>
                      <td className="py-md px-md font-body-md text-body-md font-medium text-primary">{row.name}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.head}</td>
                      <td className="py-md px-md">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border ${
                          row.status === "Active"
                            ? "bg-tertiary-fixed-dim text-on-tertiary-fixed border-tertiary-fixed"
                            : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                        }`}>
                          {row.status === "Active" ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="py-md px-md text-right">
                        <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditDept(row)} className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDept(row.id)}
                            className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "nganh" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Mã ngành</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Tên ngành</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Thuộc khoa</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Trạng thái</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      <span className="material-symbols-outlined text-3xl text-primary animate-spin inline-block align-middle mr-2">sync</span>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedMajors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy ngành nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  paginatedMajors.map((row) => (
                    <tr key={row.code} className="hover:bg-surface-bright transition-colors group">
                      <td className="py-md px-md font-body-md text-body-md text-on-surface font-semibold">{row.code}</td>
                      <td className="py-md px-md font-body-md text-body-md font-medium text-primary">{row.name}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.dept}</td>
                      <td className="py-md px-md">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border ${
                          row.status === "Active"
                            ? "bg-tertiary-fixed-dim text-on-tertiary-fixed border-tertiary-fixed"
                            : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                        }`}>
                          {row.status === "Active" ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="py-md px-md text-right">
                        <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditMajor(row)} className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteMajor(row.id)} className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded transition-colors cursor-pointer" title="Xóa">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "lop" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Mã lớp</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Tên lớp</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Chuyên ngành</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Cố vấn học tập</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      <span className="material-symbols-outlined text-3xl text-primary animate-spin inline-block align-middle mr-2">sync</span>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy lớp nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  paginatedClasses.map((row) => (
                    <tr key={row.code} className="hover:bg-surface-bright transition-colors group">
                      <td className="py-md px-md font-body-md text-body-md text-on-surface font-semibold">{row.code}</td>
                      <td className="py-md px-md font-body-md text-body-md font-medium text-primary">{row.name}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.major}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.advisor}</td>
                      <td className="py-md px-md text-right">
                        <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClass(row)} className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteClass(row.id)} className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded transition-colors cursor-pointer" title="Xóa">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "mon" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Mã môn</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Tên môn học</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Số tín chỉ</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Khoa phụ trách</th>
                  <th className="py-sm px-md font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      <span className="material-symbols-outlined text-3xl text-primary animate-spin inline-block align-middle mr-2">sync</span>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy môn học nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  paginatedSubjects.map((row) => (
                    <tr key={row.code} className="hover:bg-surface-bright transition-colors group">
                      <td className="py-md px-md font-body-md text-body-md text-on-surface font-semibold">{row.code}</td>
                      <td className="py-md px-md font-body-md text-body-md font-medium text-primary">{row.name}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.credits} tín chỉ</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.dept}</td>
                      <td className="py-md px-md text-right">
                        <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditSubject(row)} className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteSubject(row.id)} className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded transition-colors cursor-pointer" title="Xóa">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-sm border-t border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row gap-sm items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant px-sm">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, activeDataList.length)} trong tổng số {activeDataList.length} bản ghi
          </span>
          <div className="flex items-center gap-xs">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="px-2 font-label-sm text-on-surface">Trang {currentPage} / {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-surface rounded-xl border border-outline-variant/30 shadow-2xl p-xl max-w-[480px] w-full flex flex-col gap-md z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/40 pb-sm mb-sm">
              Thêm Khoa Mới
            </h3>
            <form onSubmit={handleAddDept} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="dept-code">Mã khoa</label>
                <input
                  id="dept-code"
                  type="text"
                  required
                  placeholder="Ví dụ: KHMT, TOAN..."
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="dept-name">Tên khoa</label>
                <input
                  id="dept-name"
                  type="text"
                  required
                  placeholder="Tên đầy đủ của khoa..."
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="dept-head">Trưởng khoa</label>
                <input
                  id="dept-head"
                  type="text"
                  placeholder="TS/GS..."
                  value={newDeptHead}
                  onChange={(e) => setNewDeptHead(e.target.value)}
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
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
