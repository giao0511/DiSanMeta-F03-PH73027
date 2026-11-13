import React, { useState } from 'react';
import { ArrowRight, BookOpen, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { evaluateRecordCompleteness } from '../constants/dublinCore';
import type { HeritageCollection, HeritageRecord, SourceItem } from '../types/heritage';
import type { MainTab } from './Header';

interface HomeViewProps {
  collectionScope: HeritageCollection;
  realRecords: HeritageRecord[];
  realSources: SourceItem[];
  onSearchCatalog: (query: string) => void;
  onNavigate: (tab: MainTab) => void;
  onOpenNewRecord: () => void;
  isAdmin: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  collectionScope,
  realRecords,
  realSources,
  onSearchCatalog,
  onNavigate,
  onOpenNewRecord,
  isAdmin,
}) => {
  const [searchText, setSearchText] = useState('');

  // Tách nguồn lịch sử (N01-N07 + nguồn riêng từng bia) khỏi tài liệu kỹ thuật/pháp lý
  const historicalSources = realSources.filter(
    (s) => s.sourceCategory !== 'Tài liệu kỹ thuật' && s.sourceCategory !== 'Tài liệu pháp lý'
  );
  const authoritativeSourcesCount = historicalSources.filter(
    (s) => s.sourceCategory === 'Chính thống'
  ).length;

  // Thống kê nghiệm thu — CHỈ tính trên hồ sơ thật, tuyệt đối không tính DEMO
  const totalReal = realRecords.length;
  const verifiedCount = realRecords.filter(
    (r) => r.recordVerificationLevel === 'Đã đối chiếu nguồn'
  ).length;
  const sufficientSourceRecordsCount = realRecords.filter(
    (r) => evaluateRecordCompleteness(r, realSources).hasSufficientEvidence
  ).length;
  const permittedRightsCount = realRecords.filter(
    (r) => r.recordRightsStatus === 'Đã cấp phép' && r.allowImagePublish
  ).length;
  const pendingCount = realRecords.filter(
    (r) => r.recordVerificationLevel !== 'Đã đối chiếu nguồn'
  ).length;

  const progressPct = Math.min(
    100,
    Math.round((totalReal / Math.max(1, collectionScope.plannedTotal)) * 100)
  );

  // Phân bố theo 5 trạng thái xác thực thông tin
  const verificationBreakdown = [
    {
      label: 'Đã đối chiếu nguồn',
      count: realRecords.filter((r) => r.recordVerificationLevel === 'Đã đối chiếu nguồn').length,
      color: '#14532D',
    },
    {
      label: 'Chờ kiểm chứng',
      count: realRecords.filter((r) => r.recordVerificationLevel === 'Chờ kiểm chứng').length,
      color: '#9A7B3E',
    },
    {
      label: 'Chưa có nguồn',
      count: realRecords.filter((r) => r.recordVerificationLevel === 'Chưa có nguồn').length,
      color: '#64748B',
    },
    {
      label: 'Có thông tin mâu thuẫn',
      count: realRecords.filter((r) => r.recordVerificationLevel === 'Có thông tin mâu thuẫn').length,
      color: '#B45309',
    },
    {
      label: 'Không thể xác minh',
      count: realRecords.filter((r) => r.recordVerificationLevel === 'Không thể xác minh').length,
      color: '#9A3412',
    },
  ];

  const sourceBreakdown = [
    {
      label: 'Chính thống (cấp bộ sưu tập & bia)',
      count: historicalSources.filter((s) => s.sourceCategory === 'Chính thống').length,
      color: '#162436',
    },
    {
      label: 'Học thuật / Lưu trữ nội bộ',
      count: historicalSources.filter(
        (s) => s.sourceCategory === 'Học thuật' || s.sourceCategory === 'Lưu trữ nội bộ'
      ).length,
      color: '#9A7B3E',
    },
    {
      label: 'Tham khảo',
      count: historicalSources.filter(
        (s) => s.sourceCategory === 'Tham khảo' || s.sourceCategory === 'Tham khảo khác'
      ).length,
      color: '#64748B',
    },
    {
      label: 'Tài liệu kỹ thuật & pháp lý (tách riêng)',
      count: realSources.length - historicalSources.length,
      color: '#A8A29E',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchCatalog(searchText);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10">
      {/* Institutional Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#6B5B3E] font-medium">
              Bộ sưu tập Văn Miếu – Quốc Tử Giám
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#162436] leading-tight text-balance">
              Hồ sơ số Bia Tiến sĩ Văn Miếu
            </h1>
            <p className="text-base text-[#3E4C5E] leading-relaxed max-w-2xl">
              Tra cứu thông tin bia đá, văn bản Hán Nôm, nguồn sử liệu đối chiếu và tình trạng bản
              quyền hình ảnh di sản.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm theo mã F03-00001..F03-00015, nhan đề bia, niên đại, nguồn..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#D7CFC0] rounded-md text-sm text-[#162436] placeholder:text-[#7A8699] focus:outline-none focus:border-[#162436]"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-6 bg-[#162436] text-[#FBF9F5] text-sm font-medium rounded-md hover:bg-[#233752] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Tra cứu tư liệu
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="inline-flex items-center gap-1.5 font-medium text-[#162436] hover:text-[#9A7B3E] transition-colors cursor-pointer"
            >
              <span>Danh sách hồ sơ bia</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span aria-hidden="true" className="text-[#C7BFAE]">·</span>
            <button
              type="button"
              onClick={() => onNavigate('sources')}
              className="inline-flex items-center gap-1.5 font-medium text-[#785E2B] hover:text-[#162436] transition-colors cursor-pointer"
            >
              <span>Nguồn sử liệu gốc</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {isAdmin && (
              <>
                <span aria-hidden="true" className="text-[#C7BFAE]">·</span>
                <button
                  type="button"
                  onClick={onOpenNewRecord}
                  className="inline-flex items-center gap-1.5 font-medium text-[#162436] hover:text-[#9A7B3E] transition-colors cursor-pointer"
                >
                  <span>Thêm hồ sơ mới</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Collection Scope & Publication Rights Card */}
        <div className="lg:col-span-5 bg-white border border-[#E3DDD2] rounded-lg p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#EFEAE0] pb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#64748B]">
                  Phạm vi bộ sưu tập dự kiến
                </p>
                <h2 className="font-serif text-xl font-semibold text-[#162436] mt-1">
                  15 Bia Tiến sĩ — Văn Miếu – Quốc Tử Giám
                </h2>
              </div>
              <BookOpen className="w-5 h-5 text-[#9A7B3E] shrink-0 mt-1" />
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#64748B]">Bộ sưu tập</dt>
                <dd className="text-[#162436] font-medium mt-0.5">{collectionScope.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Nơi lưu giữ</dt>
                <dd className="text-[#3E4C5E] mt-0.5">{collectionScope.repositoryAddress}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Đơn vị cần liên hệ quyền công bố</dt>
                <dd className="text-[#3E4C5E] mt-0.5">{collectionScope.rightsContactUnit}</dd>
              </div>
            </dl>
          </div>

          <div className="pt-4 border-t border-[#EFEAE0] flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#64748B]">Tình trạng quyền công bố ảnh</p>
              <p
                className={`text-sm font-semibold mt-0.5 flex items-center gap-1.5 ${
                  collectionScope.rightsStatus === 'ĐÃ XÁC MINH ĐẦY ĐỦ'
                    ? 'text-[#14532D]'
                    : 'text-[#9A3412]'
                }`}
              >
                {collectionScope.rightsStatus === 'ĐÃ XÁC MINH ĐẦY ĐỦ' ? (
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                )}
                <span>{collectionScope.rightsStatus}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sources')}
              className="px-3.5 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Nguồn &amp; Quyền
            </button>
          </div>
        </div>
      </section>

      {/* Acceptance KPI Strip — Strictly Real Data (No Demo) */}
      <section aria-labelledby="stats-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E3DDD2] pb-3">
          <div>
            <h2 id="stats-heading" className="font-serif text-2xl font-semibold text-[#162436]">
              Tổng quan kho tư liệu
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Số liệu tính trên các hồ sơ và nguồn sử liệu chính thức hiện có (không tính bản mẫu thử nghiệm).
            </p>
          </div>
          <p className="text-xs font-mono tabular-nums text-[#6B5B3E]">
            Tiến độ bộ 15 bia: {totalReal}/{collectionScope.plannedTotal} ({progressPct}%)
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5">
            <p className="text-xs text-[#64748B]">Hồ sơ thật</p>
            <p className="font-mono text-3xl font-semibold text-[#162436] tabular-nums mt-2">
              {totalReal}
            </p>
            <p className="text-xs text-[#7A8699] mt-1">
              Mục tiêu: {collectionScope.plannedTotal} ({pendingCount} chờ kiểm)
            </p>
          </div>

          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5">
            <p className="text-xs text-[#64748B]">Đã đối chiếu nguồn</p>
            <p className="font-mono text-3xl font-semibold text-[#14532D] tabular-nums mt-2">
              {verifiedCount}
            </p>
            <p className="text-xs text-[#7A8699] mt-1">Quản trị viên xác nhận</p>
          </div>

          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5">
            <p className="text-xs text-[#64748B]">Hồ sơ đủ nguồn riêng</p>
            <p className="font-mono text-3xl font-semibold text-[#9A7B3E] tabular-nums mt-2">
              {sufficientSourceRecordsCount}
            </p>
            <p className="text-xs text-[#7A8699] mt-1">≥ 2 nguồn + bằng chứng</p>
          </div>

          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5">
            <p className="text-xs text-[#64748B]">Nguồn di sản thật</p>
            <p className="font-mono text-3xl font-semibold text-[#162436] tabular-nums mt-2">
              {historicalSources.length}
            </p>
            <p className="text-xs text-[#7A8699] mt-1">
              {authoritativeSourcesCount} nguồn chính thống (N01–N07)
            </p>
          </div>

          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 col-span-2 sm:col-span-1">
            <p className="text-xs text-[#64748B]">Có quyền công bố ảnh</p>
            <p className="font-mono text-3xl font-semibold text-[#162436] tabular-nums mt-2">
              {permittedRightsCount}
            </p>
            <p className="text-xs text-[#7A8699] mt-1">Mặc định: Chưa xác minh</p>
          </div>
        </div>
      </section>

      {/* Real-Data Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold text-[#162436]">
              Tình trạng đối chiếu sử liệu
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#64748B]">
              n = {totalReal}
            </span>
          </div>

          {totalReal === 0 ? (
            <div className="py-8 text-center border border-dashed border-[#D7CFC0] rounded-md bg-[#FBF9F5] space-y-2">
              <p className="text-sm font-medium text-[#162436]">
                Chưa có hồ sơ bia nào được lưu (0/15)
              </p>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Quản trị viên có thể đăng nhập để nhập thông tin từng tấm bia kèm nguồn đối chiếu trực tiếp.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {verificationBreakdown.map((item) => {
                const pct = totalReal > 0 ? Math.round((item.count / totalReal) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#162436]">{item.label}</span>
                      <span className="font-mono tabular-nums text-[#4B5B6E]">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[#EFEAE0] rounded-sm overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold text-[#162436]">
              Nguồn tài liệu tham chiếu
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#64748B]">
              {historicalSources.length} nguồn di sản + {realSources.length - historicalSources.length} kỹ thuật/pháp lý
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {sourceBreakdown.map((item) => {
              const pct =
                realSources.length > 0
                  ? Math.round((item.count / realSources.length) * 100)
                  : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#162436]">{item.label}</span>
                    <span className="font-mono tabular-nums text-[#4B5B6E]">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#EFEAE0] rounded-sm overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#64748B] pt-1">
            Bao gồm 7 nguồn cấp bộ sưu tập (UNESCO, Văn Miếu, Cục Di sản, Bộ VHTT&amp;DL) và các nguồn riêng theo từng bia.
          </p>
        </div>
      </section>
    </div>
  );
};
