"use client";

import React, { useState } from "react";

interface DeptRow {
  code: string;
  name: string;
  head: string;
  status: "Active" | "Inactive";
}

interface MajorRow {
  code: string;
  name: string;
  dept: string;
  status: "Active" | "Inactive";
}

interface ClassRow {
  code: string;
  name: string;
  major: string;
  advisor: string;
}

interface SubjectRow {
  code: string;
  name: string;
  credits: number;
  dept: string;
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"khoa" | "nganh" | "lop" | "mon">("khoa");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding new Dept
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHead, setNewDeptHead] = useState("");

  // Initial Data
  const [depts, setDepts] = useState<DeptRow[]>([
    { code: "KHMT", name: "Khoa Khoa học Máy tính", head: "TS. Alan Turing", status: "Active" },
    { code: "TOAN", name: "Khoa Toán học", head: "TS. Katherine Johnson", status: "Active" },
    { code: "VATLY", name: "Khoa Vật lý kỹ thuật", head: "TS. Marie Curie", status: "Inactive" },
    { code: "ANHVĂN", name: "Khoa Ngôn ngữ Anh", head: "GS. John Keating", status: "Active" },
  ]);

  const [majors, setMajors] = useState<MajorRow[]>([
    { code: "KTPM", name: "Kỹ thuật Phần mềm", dept: "Khoa Khoa học Máy tính", status: "Active" },
    { code: "HTTT", name: "Hệ thống Thông tin", dept: "Khoa Khoa học Máy tính", status: "Active" },
    { code: "TUD", name: "Toán Ứng dụng", dept: "Khoa Toán học", status: "Active" },
    { code: "VLHN", name: "Vật lý Hạt nhân", dept: "Khoa Vật lý kỹ thuật", status: "Inactive" },
  ]);

  const [classes, setClasses] = useState<ClassRow[]>([
    { code: "KTPM-K18A", name: "Lớp Kỹ thuật Phần mềm K18A", major: "Kỹ thuật Phần mềm", advisor: "ThS. Nguyễn Văn Hải" },
    { code: "HTTT-K18B", name: "Lớp Hệ thống Thông tin K18B", major: "Hệ thống Thông tin", advisor: "TS. Trần Thị Mai" },
    { code: "TUD-K17A", name: "Lớp Toán Ứng dụng K17A", major: "Toán Ứng dụng", advisor: "GS. Ngô Bảo Châu" },
  ]);

  const [subjects, setSubjects] = useState<SubjectRow[]>([
    { code: "CS101", name: "Nhập môn Lập trình", credits: 3, dept: "Khoa Khoa học Máy tính" },
    { code: "CS102", name: "Cấu trúc Dữ liệu và Giải thuật", credits: 4, dept: "Khoa Khoa học Máy tính" },
    { code: "MATH201", name: "Giải tích 1", credits: 3, dept: "Khoa Toán học" },
    { code: "PHYS101", name: "Vật lý Đại cương 1", credits: 3, dept: "Khoa Vật lý kỹ thuật" },
  ]);

  const handleDeleteDept = (code: string) => {
    setDepts(depts.filter((item) => item.code !== code));
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode || !newDeptName) return;
    const newDept: DeptRow = {
      code: newDeptCode,
      name: newDeptName,
      head: newDeptHead || "Chưa cập nhật",
      status: "Active",
    };
    setDepts([...depts, newDept]);
    // Reset form & close
    setNewDeptCode("");
    setNewDeptName("");
    setNewDeptHead("");
    setShowAddModal(false);
  };

  // Filtering based on tab and query
  const filteredDepts = depts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.head.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMajors = majors.filter(
    (m) =>
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classes.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.advisor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                {filteredDepts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy khoa nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredDepts.map((row) => (
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
                          <button className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDept(row.code)}
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
                {filteredMajors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy ngành nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredMajors.map((row) => (
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
                          <button className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded transition-colors cursor-pointer" title="Xóa">
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
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy lớp nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((row) => (
                    <tr key={row.code} className="hover:bg-surface-bright transition-colors group">
                      <td className="py-md px-md font-body-md text-body-md text-on-surface font-semibold">{row.code}</td>
                      <td className="py-md px-md font-body-md text-body-md font-medium text-primary">{row.name}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.major}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.advisor}</td>
                      <td className="py-md px-md text-right">
                        <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded transition-colors cursor-pointer" title="Xóa">
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
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-on-surface-variant font-body-md">
                      Không tìm thấy môn học nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((row) => (
                    <tr key={row.code} className="hover:bg-surface-bright transition-colors group">
                      <td className="py-md px-md font-body-md text-body-md text-on-surface font-semibold">{row.code}</td>
                      <td className="py-md px-md font-body-md text-body-md font-medium text-primary">{row.name}</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.credits} tín chỉ</td>
                      <td className="py-md px-md font-body-md text-body-md text-on-surface-variant">{row.dept}</td>
                      <td className="py-md px-md text-right">
                        <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1 rounded transition-colors cursor-pointer" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded transition-colors cursor-pointer" title="Xóa">
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
            Hiển thị 1 đến {activeTab === "khoa" ? filteredDepts.length : activeTab === "nganh" ? filteredMajors.length : activeTab === "lop" ? filteredClasses.length : filteredSubjects.length} trong tổng số các bản ghi
          </span>
          <div className="flex items-center gap-xs">
            <button className="p-1 text-outline hover:text-on-surface disabled:opacity-50 transition-colors cursor-pointer" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded bg-primary text-on-primary font-label-sm flex items-center justify-center cursor-pointer">1</button>
            <button className="w-8 h-8 rounded text-on-surface-variant hover:bg-surface-container font-label-sm flex items-center justify-center transition-colors cursor-pointer">2</button>
            <button className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
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
