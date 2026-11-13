import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Edit3,
  Eye,
  FlaskConical,
  Grid3X3,
  List,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { evaluateRecordCompleteness } from '../constants/dublinCore';
import { normalizeVietnamese } from '../lib/textUtils';
import type { HeritageRecord, SourceItem } from '../types/heritage';

interface CatalogViewProps {
  realRecords: HeritageRecord[];
  realSources: SourceItem[];
  demoRecords: HeritageRecord[];
  showDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
  initialQuery: string;
  isAdmin: boolean;
  onSelectRecord: (record: HeritageRecord) => void;
  onCreateRecord: (prefillCode?: string) => void;
  onEditRecord: (record: HeritageRecord) => void;
  onDeleteRecord: (record: HeritageRecord) => Promise<void>;
}

type SortKey = 'code-asc' | 'code-desc' | 'title-asc' | 'updated-desc';

const PLANNED_F03_CODES = Array.from({ length: 15 }, (_, idx) =>
  `F03-${String(idx + 1).padStart(5, '0')}`
);

export const CatalogView: React.FC<CatalogViewProps> = ({
  realRecords,
  realSources,
  demoRecords,
  showDemoMode,
  onToggleDemoMode,
  initialQuery,
  isAdmin,
  onSelectRecord,
  onCreateRecord,
  onEditRecord,
  onDeleteRecord,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRepo, setFilterRepo] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterManifestation, setFilterManifestation] = useState('');
  const [filterVerification, setFilterVerification] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('code-asc');
  const [pendingDelete, setPendingDelete] = useState<HeritageRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const combinedRecords = useMemo(() => {
    return showDemoMode ? [...realRecords, ...demoRecords] : realRecords;
  }, [realRecords, demoRecords, showDemoMode]);

  const realByCode = useMemo(() => {
    const map = new Map<string, HeritageRecord>();
    for (const r of realRecords) {
      map.set(r.recordCode, r);
    }
    return map;
  }, [realRecords]);

  const uniqueDates = useMemo(
    () => Array.from(new Set(combinedRecords.map((r) => r.dcDate).filter(Boolean))),
    [combinedRecords]
  );
  const uniqueTypes = useMemo(
    () => Array.from(new Set(combinedRecords.map((r) => r.dcType).filter(Boolean))),
    [combinedRecords]
  );
  const uniqueRepos = useMemo(
    () => Array.from(new Set(combinedRecords.map((r) => r.currentRepository).filter(Boolean))),
    [combinedRecords]
  );
  const uniqueConditions = useMemo(
    () => Array.from(new Set(combinedRecords.map((r) => r.originalCondition).filter(Boolean))),
    [combinedRecords]
  );

  const filteredRecords = useMemo(() => {
    const qNorm = normalizeVietnamese(searchQuery);
    const list = combinedRecords.filter((r) => {
      if (qNorm) {
        const haystack = normalizeVietnamese(
          [
            r.recordCode,
            r.dcTitle,
            r.dcCreator,
            r.dcSubject,
            r.dcDescription,
            r.dcDate,
            r.dcSource,
            r.dcCoverage,
            r.currentRepository,
            r.repositoryRegistrationNo,
            r.unclearPoints,
            r.sourceIds.join(' '),
          ].join(' ')
        );
        if (!haystack.includes(qNorm)) return false;
      }
      if (filterDate && r.dcDate !== filterDate) return false;
      if (filterType && r.dcType !== filterType) return false;
      if (filterRepo && r.currentRepository !== filterRepo) return false;
      if (filterCondition && r.originalCondition !== filterCondition) return false;
      if (filterManifestation && r.manifestationType !== filterManifestation) return false;
      if (filterVerification && r.recordVerificationLevel !== filterVerification) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'code-asc') return a.recordCode.localeCompare(b.recordCode);
      if (sortBy === 'code-desc') return b.recordCode.localeCompare(a.recordCode);
      if (sortBy === 'title-asc') return a.dcTitle.localeCompare(b.dcTitle, 'vi');
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [
    combinedRecords,
    searchQuery,
    filterDate,
    filterType,
    filterRepo,
    filterCondition,
    filterManifestation,
    filterVerification,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setFilterType('');
    setFilterRepo('');
    setFilterCondition('');
    setFilterManifestation('');
    setFilterVerification('');
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDeleteRecord(pendingDelete);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E3DDD2] pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B5B3E] font-medium">
            Bộ sưu tập 15 Bia Tiến sĩ · Văn Miếu – Quốc Tử Giám
          </p>
          <h1 className="font-serif text-3xl font-semibold text-[#162436] mt-1">
            Danh mục Hồ sơ Tư liệu
          </h1>
          <p className="text-sm text-[#4B5B6E] mt-1">
            Tìm kiếm có dấu hoặc không dấu theo mã bia, nhan đề, niên đại và nguồn tham chiếu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode toggle: List vs 15-Stele Roadmap Matrix */}
          <div className="inline-flex items-center p-1 bg-[#EFEAE0] rounded-md">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#162436] shadow-xs'
                  : 'text-[#4B5B6E] hover:text-[#162436]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#162436] shadow-xs'
                  : 'text-[#4B5B6E] hover:text-[#162436]'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Lộ trình 15 bia ({realRecords.length}/15)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onToggleDemoMode(!showDemoMode)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              showDemoMode
                ? 'bg-[#9A7B3E]/15 border-[#9A7B3E] text-[#785E2B]'
                : 'bg-white border-[#D7CFC0] text-[#4B5B6E] hover:text-[#162436]'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{showDemoMode ? 'Đang bật mẫu DEMO' : 'Xem mẫu DEMO'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onCreateRecord()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-[#162436] text-[#FBF9F5] rounded-md hover:bg-[#233752] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D8B979]" />
              <span>Tạo hồ sơ thật mới</span>
            </button>
          )}
        </div>
      </div>

      {showDemoMode && viewMode === 'list' && (
        <div className="bg-[#FDF8EE] border border-[#DFC99B] rounded-md px-4 py-3 text-xs text-[#6B501D] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#9A7B3E]" />
          <div>
            <strong>Chế độ xem thử DEMO đang bật:</strong> Bản ghi mang tiền tố{' '}
            <span className="font-mono">DEMO-</span> chỉ nhằm minh họa cấu trúc giao diện, không phải hồ sơ lịch sử thật và không được tính vào thống kê nghiệm thu hay xuất bản chính thức.
          </div>
        </div>
      )}

      {/* VIEW MODE 2: 15-STELE ROADMAP MATRIX */}
      {viewMode === 'matrix' ? (
        <div className="space-y-4">
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#162436]">
                Bảng theo dõi tiến độ 15 Bia Tiến sĩ dự kiến (F03-00001 → F03-00015)
              </h2>
              <p className="text-xs text-[#4B5B6E] mt-0.5">
                Phản ánh trung thực từng mã hồ sơ thật đã nhập, mức độ đủ 15 trường Dublin Core, số nguồn riêng cấp từng bia và quyền công bố ảnh.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#162436] shrink-0">
              Đã nhập: {realRecords.length}/15 hồ sơ thật
            </span>
          </div>

          <div className="bg-white border border-[#E3DDD2] rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F0] border-b border-[#E3DDD2] text-[#4B5B6E]">
                  <th className="py-3 px-4 font-semibold">Mã hồ sơ</th>
                  <th className="py-3 px-4 font-semibold">Nhan đề bia</th>
                  <th className="py-3 px-4 font-semibold">Niên đại</th>
                  <th className="py-3 px-4 font-semibold">Đủ trường</th>
                  <th className="py-3 px-4 font-semibold">Nguồn riêng</th>
                  <th className="py-3 px-4 font-semibold">Kiểm chứng</th>
                  <th className="py-3 px-4 font-semibold">Quyền ảnh</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {PLANNED_F03_CODES.map((code) => {
                  const rec = realByCode.get(code);
                  if (!rec) {
                    return (
                      <tr key={code} className="hover:bg-[#FBF9F5]">
                        <td className="py-3 px-4 font-mono font-semibold text-[#162436]">{code}</td>
                        <td className="py-3 px-4 text-[#7A8699] italic">Chưa nhập hồ sơ thật</td>
                        <td className="py-3 px-4 text-[#7A8699]">—</td>
                        <td className="py-3 px-4 font-mono text-[#7A8699]">0%</td>
                        <td className="py-3 px-4 font-mono text-[#7A8699]">0/2</td>
                        <td className="py-3 px-4 text-[#7A8699]">Chưa có nguồn</td>
                        <td className="py-3 px-4 text-[#9A3412]">Chưa xác minh quyền</td>
                        <td className="py-3 px-4 text-right">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => onCreateRecord(code)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#162436] text-white rounded hover:bg-[#233752] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Nhập {code}</span>
                            </button>
                          ) : (
                            <span className="text-[#7A8699]">Trống</span>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  const comp = evaluateRecordCompleteness(rec, realSources);
                  return (
                    <tr key={code} className="hover:bg-[#FAF7F0]">
                      <td className="py-3 px-4 font-mono font-semibold text-[#162436]">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(rec)}
                          className="hover:text-[#9A7B3E] underline cursor-pointer"
                        >
                          {code}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-[#162436] font-medium max-w-xs truncate">
                        {rec.dcTitle}
                      </td>
                      <td className="py-3 px-4 text-[#4B5B6E]">{rec.dcDate}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#162436]">
                        {comp.completionPercent}%
                      </td>
                      <td
                        className={`py-3 px-4 font-mono tabular-nums font-semibold ${
                          comp.hasSufficientEvidence ? 'text-[#14532D]' : 'text-[#9A3412]'
                        }`}
                      >
                        {comp.steleSpecificSourceCount} riêng / {rec.sourceIds.length} tổng
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            rec.recordVerificationLevel === 'Đã đối chiếu nguồn'
                              ? 'text-[#14532D] font-semibold inline-flex items-center gap-1'
                              : 'text-[#785E2B] font-medium'
                          }
                        >
                          {rec.recordVerificationLevel === 'Đã đối chiếu nguồn' && (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{rec.recordVerificationLevel}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#4B5B6E]">{rec.recordRightsStatus}</td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(rec)}
                          className="px-2.5 py-1 border border-[#D7CFC0] rounded hover:bg-[#EFE9DC] cursor-pointer"
                        >
                          Xem
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onEditRecord(rec)}
                            className="px-2.5 py-1 border border-[#D7CFC0] rounded hover:bg-[#EFE9DC] cursor-pointer"
                          >
                            Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Search & Filter Matrix */}
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm có dấu hoặc không dấu (vd: van mieu, 1442, F03-00001...)"
                  className="w-full h-10 pl-9 pr-3 bg-[#FBF9F5] border border-[#D7CFC0] rounded-md text-sm text-[#162436] focus:outline-none focus:border-[#162436]"
                />
              </div>

              <div className="md:col-span-4 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#64748B] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  aria-label="Sắp xếp danh sách"
                  className="w-full h-10 px-3 bg-[#FBF9F5] border border-[#D7CFC0] rounded-md text-sm text-[#162436] focus:outline-none focus:border-[#162436]"
                >
                  <option value="code-asc">Mã hồ sơ (A → Z)</option>
                  <option value="code-desc">Mã hồ sơ (Z → A)</option>
                  <option value="title-asc">Nhan đề (A → Z)</option>
                  <option value="updated-desc">Cập nhật gần nhất</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full h-10 px-3 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#4B5B6E] hover:bg-[#F3EFE6] hover:text-[#162436] cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            </div>

            {/* 6 Facet Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Lọc theo niên đại"
                className="h-10 px-2.5 bg-white border border-[#E3DDD2] rounded-md text-xs text-[#162436]"
              >
                <option value="">Tất cả niên đại</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                aria-label="Lọc theo loại tư liệu"
                className="h-10 px-2.5 bg-white border border-[#E3DDD2] rounded-md text-xs text-[#162436]"
              >
                <option value="">Tất cả loại tư liệu</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={filterRepo}
                onChange={(e) => setFilterRepo(e.target.value)}
                aria-label="Lọc theo nơi lưu giữ"
                className="h-10 px-2.5 bg-white border border-[#E3DDD2] rounded-md text-xs text-[#162436]"
              >
                <option value="">Tất cả nơi lưu giữ</option>
                {uniqueRepos.map((repo) => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>

              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                aria-label="Lọc theo tình trạng bản gốc"
                className="h-10 px-2.5 bg-white border border-[#E3DDD2] rounded-md text-xs text-[#162436]"
              >
                <option value="">Tình trạng bản gốc</option>
                {uniqueConditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>

              <select
                value={filterManifestation}
                onChange={(e) => setFilterManifestation(e.target.value)}
                aria-label="Lọc theo loại bản hiển thị"
                className="h-10 px-2.5 bg-white border border-[#E3DDD2] rounded-md text-xs text-[#162436]"
              >
                <option value="">Loại bản hiển thị</option>
                <option value="bản gốc">Bản gốc</option>
                <option value="bản sao">Bản sao</option>
                <option value="bản số của gốc">Bản số của gốc</option>
                <option value="bản số của sao">Bản số của sao</option>
                <option value="Chưa xác định">Chưa xác định</option>
              </select>

              <select
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value)}
                aria-label="Lọc theo trạng thái kiểm chứng"
                className="h-10 px-2.5 bg-white border border-[#E3DDD2] rounded-md text-xs text-[#162436]"
              >
                <option value="">Trạng thái kiểm chứng</option>
                <option value="Chưa có nguồn">Chưa có nguồn</option>
                <option value="Chờ kiểm chứng">Chờ kiểm chứng</option>
                <option value="Đã đối chiếu nguồn">Đã đối chiếu nguồn</option>
                <option value="Có thông tin mâu thuẫn">Có thông tin mâu thuẫn</option>
                <option value="Không thể xác minh">Không thể xác minh</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4B5B6E]">
            <span className="font-mono tabular-nums">
              Hiển thị {filteredRecords.length} hồ sơ ({realRecords.length}/15 hồ sơ thật)
            </span>
            {!isAdmin && (
              <span>
                Đang ở chế độ tra cứu công khai. Đăng nhập quản trị để tạo, sửa hoặc đối chiếu nguồn.
              </span>
            )}
          </div>

          {/* Records List */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white border border-[#E3DDD2] rounded-lg py-14 px-6 text-center space-y-3">
              <p className="font-serif text-xl font-medium text-[#162436]">
                {realRecords.length === 0 && !showDemoMode
                  ? 'Chưa có hồ sơ tư liệu thật nào trong danh sách'
                  : 'Không tìm thấy hồ sơ phù hợp'}
              </p>
              <p className="text-sm text-[#64748B] max-w-lg mx-auto">
                {realRecords.length === 0 && !showDemoMode
                  ? 'Hệ thống không tự tạo 15 hồ sơ bia giả. Bạn có thể chuyển sang tab "Lộ trình 15 bia", bật "Xem mẫu DEMO" để thử nghiệm giao diện, hoặc đăng nhập quản trị để nhập hồ sơ thật F03-00001..F03-00015.'
                  : 'Vui lòng thử từ khóa khác (hỗ trợ có dấu/không dấu) hoặc đặt lại bộ lọc.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E3DDD2] bg-white border border-[#E3DDD2] rounded-lg overflow-hidden">
              {filteredRecords.map((record) => {
                const completeness = evaluateRecordCompleteness(record, realSources);
                return (
                  <article
                    key={record.id}
                    className="p-5 hover:bg-[#FAF7F0] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#64748B]">
                        <span className="font-mono font-medium text-[#162436]">
                          {record.recordCode}
                        </span>
                        {record.isDemo && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono font-semibold text-[#9A3412]">
                              DEMO (KHÔNG TÍNH NGHIỆM THU)
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>Niên đại: {record.dcDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>Loại bản: {record.manifestationType}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            record.recordVerificationLevel === 'Đã đối chiếu nguồn'
                              ? 'text-[#14532D] font-semibold'
                              : record.recordVerificationLevel === 'Có thông tin mâu thuẫn' ||
                                record.recordVerificationLevel === 'Không thể xác minh'
                              ? 'text-[#9A3412] font-semibold'
                              : 'text-[#785E2B] font-semibold'
                          }
                        >
                          {record.recordVerificationLevel}
                        </span>
                        {!completeness.hasSufficientEvidence && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#9A3412] font-medium">Chưa đủ dữ liệu</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Đủ trường: {completeness.completionPercent}%
                        </span>
                      </div>

                      <h2 className="font-serif text-xl font-semibold text-[#162436] leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(record)}
                          className="text-left hover:text-[#9A7B3E] transition-colors cursor-pointer"
                        >
                          {record.dcTitle}
                        </button>
                      </h2>

                      <p className="text-sm text-[#4B5B6E] line-clamp-2">{record.dcDescription}</p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] pt-0.5">
                        <span>Lưu giữ: {record.currentRepository}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Nguồn riêng: {completeness.steleSpecificSourceCount} · Tổng nguồn:{' '}
                          {record.sourceIds.length}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Quyền ảnh: {record.recordRightsStatus}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectRecord(record)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#EFE9DC] whitespace-nowrap cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>

                      {isAdmin && !record.isDemo && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditRecord(record)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#EFE9DC] whitespace-nowrap cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#E5C6BD] rounded-md text-[#9A3412] hover:bg-[#FDF2EF] whitespace-nowrap cursor-pointer"
                            aria-label={`Xóa bản ghi ${record.recordCode}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 bg-[#162436]/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E3DDD2] rounded-lg max-w-md w-full p-6 space-y-4 shadow-lg">
            <h3 className="font-serif text-xl font-semibold text-[#162436]">
              Xác nhận xóa hồ sơ {pendingDelete.recordCode}
            </h3>
            <p className="text-sm text-[#4B5B6E]">
              Thao tác này sẽ xóa hồ sơ <strong>{pendingDelete.dcTitle}</strong> khỏi cả kho quản trị
              và cổng công khai, đồng thời ghi nhận vào nhật ký chỉnh sửa.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium bg-[#9A3412] text-white rounded-md hover:bg-[#7C2D12] cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
