import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Square,
} from 'lucide-react';
import {
  DUBLIN_CORE_FIELDS,
  evaluateRecordCompleteness,
} from '../constants/dublinCore';
import {
  exportFullBackupJson,
  exportRecordsCsv,
  exportRecordsJson,
} from '../lib/exportUtils';
import type {
  AuditLog,
  ChecklistItem,
  HeritageCollection,
  HeritageRecord,
  PublicationRight,
  SourceItem,
  VerificationLog,
} from '../types/heritage';

interface SubmissionHubViewProps {
  collectionScope: HeritageCollection;
  realRecords: HeritageRecord[];
  realSources: SourceItem[];
  rights: PublicationRight[];
  verificationLogs: VerificationLog[];
  auditLogs: AuditLog[];
  checklist: ChecklistItem[];
  isAdmin: boolean;
  geminiConfigured: boolean | null;
  onSaveChecklistItem: (item: ChecklistItem) => Promise<void>;
}

type PrintMode = 'none' | 'single-record' | 'catalog-15' | 'summary-1page';

export const SubmissionHubView: React.FC<SubmissionHubViewProps> = ({
  collectionScope,
  realRecords,
  realSources,
  rights,
  verificationLogs,
  auditLogs,
  checklist,
  isAdmin,
  geminiConfigured,
  onSaveChecklistItem,
}) => {
  const [subTab, setSubTab] = useState<'export' | 'checklist' | 'about'>('export');
  const [printMode, setPrintMode] = useState<PrintMode>('none');
  const [previewMode, setPreviewMode] = useState<PrintMode>('none');
  const [selectedPrintCode, setSelectedPrintCode] = useState(
    realRecords[0]?.recordCode ?? ''
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [evidenceNoteDraft, setEvidenceNoteDraft] = useState('');
  const [evidenceUrlDraft, setEvidenceUrlDraft] = useState('');
  const [checklistError, setChecklistError] = useState<string | null>(null);

  const historicalSources = realSources.filter(
    (s) => s.sourceCategory !== 'Tài liệu kỹ thuật' && s.sourceCategory !== 'Tài liệu pháp lý'
  );
  const collectionLevelSourcesCount = historicalSources.filter(
    (s) => s.sourceLevel === 'Cấp bộ sưu tập'
  ).length;
  const steleSpecificSourcesCount = historicalSources.filter(
    (s) => s.sourceLevel === 'Cấp từng bia'
  ).length;
  const techLegalSourcesCount = realSources.filter(
    (s) => s.sourceCategory === 'Tài liệu kỹ thuật' || s.sourceCategory === 'Tài liệu pháp lý'
  ).length;
  const authoritativeSourcesCount = historicalSources.filter(
    (s) => s.sourceCategory === 'Chính thống'
  ).length;

  const verifiedRecordsCount = realRecords.filter(
    (r) =>
      r.recordVerificationLevel === 'Đã đối chiếu nguồn' ||
      (r.recordVerificationLevel as string) === 'Đã kiểm chứng'
  ).length;

  const sufficientSourcesCount = realRecords.filter(
    (r) => evaluateRecordCompleteness(r, realSources).hasSufficientEvidence
  ).length;

  const permittedRecordsCount = realRecords.filter(
    (r) => r.recordRightsStatus === 'Đã cấp phép' && r.allowImagePublish
  ).length;

  const imagesWithPermCount = realRecords.reduce((sum, r) => {
    if (r.recordRightsStatus !== 'Đã cấp phép' || !r.allowImagePublish) return sum;
    return sum + r.images.filter((img) => img.rightsVerified && img.allowWebDisplay).length;
  }, 0);

  const getAutoDiagnosticForQuestion = (orderIndex: number): string => {
    switch (orderIndex) {
      case 1:
        return `Phạm vi dự kiến: ${collectionScope.materialType} tại ${collectionScope.repositoryAddress}.`;
      case 2:
        return `Số bản ghi thật hiện có: ${realRecords.length}/15 (không tính DEMO).`;
      case 3:
        return `Đã đối chiếu nguồn: ${verifiedRecordsCount}/${realRecords.length} · Đủ nguồn riêng từng bia: ${sufficientSourcesCount}/${realRecords.length}.`;
      case 4:
        return `Cấp bộ sưu tập (N01–N07): ${collectionLevelSourcesCount}/7 · Nguồn riêng từng bia: ${steleSpecificSourcesCount} · Tài liệu kỹ thuật/pháp lý tách riêng: ${techLegalSourcesCount}.`;
      case 5:
        return `Trạng thái quyền bộ sưu tập: ${collectionScope.rightsStatus} · Hồ sơ có quyền công bố: ${permittedRecordsCount}/${realRecords.length}.`;
      case 6:
        return `Ảnh thật được phép công bố: ${imagesWithPermCount} ảnh.`;
      case 7:
        return geminiConfigured
          ? 'Máy chủ đã phát hiện GEMINI_API_KEY và giới hạn trả lời theo dữ liệu đã lưu.'
          : 'Chưa phát hiện GEMINI_API_KEY trên máy chủ.';
      default:
        return 'Cần kiểm tra thủ công và ghi rõ bằng chứng.';
    }
  };

  const triggerPrint = (mode: PrintMode) => {
    setPrintMode(mode);
    setPreviewMode('none');
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleToggleChecklist = async (item: ChecklistItem) => {
    setChecklistError(null);
    if (!item.isCompleted && !item.evidenceNote.trim() && !evidenceNoteDraft.trim()) {
      setEditingItemId(item.id);
      setEvidenceNoteDraft(item.evidenceNote);
      setEvidenceUrlDraft(item.evidenceUrl);
      setChecklistError(
        `Mục #${item.orderIndex}: Không được đánh dấu hoàn thành khi chưa có ghi chú bằng chứng đối chiếu.`
      );
      return;
    }
    await onSaveChecklistItem({
      ...item,
      isCompleted: !item.isCompleted,
    });
  };

  const handleSaveEvidence = async (item: ChecklistItem) => {
    setChecklistError(null);
    if (!evidenceNoteDraft.trim()) {
      setChecklistError('Vui lòng nhập mô tả bằng chứng trước khi lưu.');
      return;
    }
    await onSaveChecklistItem({
      ...item,
      evidenceNote: evidenceNoteDraft.trim(),
      evidenceUrl: evidenceUrlDraft.trim(),
      isCompleted: true,
    });
    setEditingItemId(null);
  };

  const completedCount = checklist.filter((c) => c.isCompleted).length;
  const singleRecordToPrint =
    realRecords.find((r) => r.recordCode === selectedPrintCode) ?? realRecords[0] ?? null;

  const renderPrintableBody = (mode: PrintMode) => {
    if (mode === 'summary-1page') {
      return (
        <div className="space-y-4 text-sm">
          <div className="border-b-2 border-black pb-3">
            <h1 className="font-serif text-2xl font-bold">
              TÓM TẮT SẢN PHẨM — DISANMETA (ĐỀ TÀI F03)
            </h1>
            <p className="text-xs mt-1">
              Công cụ mô tả và kiểm chứng di sản tư liệu số theo chuẩn Dublin Core tiếng Việt
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p><strong>Sinh viên:</strong> Trần Trung Hiếu (MSV: PH73027)</p>
              <p><strong>Nhóm / Đề tài:</strong> Nhóm 1 · Mã đề tài F03</p>
              <p><strong>Chương trình:</strong> Thực tập sinh Đợt 15 — FPT Polytechnic × IMTA TECH</p>
            </div>
            <div>
              <p><strong>Bộ sưu tập:</strong> 15 Bia Tiến sĩ chọn lọc (82 bia tại Văn Miếu – Quốc Tử Giám)</p>
              <p><strong>Nơi lưu giữ:</strong> {collectionScope.repositoryAddress}</p>
              <p><strong>Quyền công bố hiện tại:</strong> {collectionScope.rightsStatus}</p>
            </div>
          </div>
          <div className="border-t border-black pt-3 space-y-2 text-xs">
            <h2 className="font-bold uppercase">1. Mục tiêu &amp; Chuẩn mô tả</h2>
            <p>
              Dự án xã hội phi lợi nhuận, chuẩn hóa đủ 15 trường Dublin Core tiếng Việt, tách biệt 5 trạng thái kiểm chứng ở cấp trường và cấp hồ sơ, đồng thời quản lý chặt quyền công bố ảnh trước khi hiển thị công khai.
            </p>
            <h2 className="font-bold uppercase pt-2">2. Thống kê dữ liệu thật tại thời điểm xuất</h2>
            <p>
              Bản ghi thật: {realRecords.length}/15 · Đã đối chiếu nguồn: {verifiedRecordsCount} · Hồ sơ đủ nguồn riêng: {sufficientSourcesCount} · Nguồn chính thống cấp bộ sưu tập (N01–N07): {collectionLevelSourcesCount}/7 · Nguồn riêng từng bia: {steleSpecificSourcesCount} · Tài liệu kỹ thuật/pháp lý tách riêng: {techLegalSourcesCount} (Chính thống lịch sử: {authoritativeSourcesCount}) · Hồ sơ có quyền công bố ảnh: {permittedRecordsCount}.
            </p>
            <h2 className="font-bold uppercase pt-2">3. Kiến trúc bảo mật &amp; Kiểm chứng AI</h2>
            <p>
              Lưu trữ trên Firebase Firestore với xác thực quản trị viên, tách riêng bản ghi nội bộ và công khai, ẩn ảnh khi chưa xác minh quyền. Gemini API chạy qua máy chủ bảo mật, chỉ trả lời từ dữ liệu đã lưu và không tự xác nhận thông tin lịch sử là đúng.
            </p>
          </div>
        </div>
      );
    }

    if (mode === 'single-record' && singleRecordToPrint) {
      return (
        <div className="space-y-4 text-xs">
          <div className="border-b-2 border-black pb-2">
            <h1 className="font-serif text-xl font-bold">
              PHIẾU MÔ TẢ DI SẢN TƯ LIỆU SỐ — {singleRecordToPrint.recordCode}
            </h1>
            <p>Nhan đề: {singleRecordToPrint.dcTitle}</p>
          </div>
          <table className="w-full border-collapse border border-black text-xs">
            <tbody>
              {DUBLIN_CORE_FIELDS.map((f) => (
                <tr key={f.key}>
                  <td className="border border-black p-1.5 font-semibold w-1/3">
                    {f.index}. {f.englishName} ({f.vietnameseLabel})
                  </td>
                  <td className="border border-black p-1.5">
                    {String(singleRecordToPrint[f.key] || 'Chưa xác định')}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="border border-black p-1.5 font-semibold">Nơi lưu giữ hiện nay</td>
                <td className="border border-black p-1.5">{singleRecordToPrint.currentRepository}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-semibold">Loại bản hiển thị</td>
                <td className="border border-black p-1.5">{singleRecordToPrint.manifestationType}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-semibold">Trạng thái kiểm chứng</td>
                <td className="border border-black p-1.5">
                  {singleRecordToPrint.recordVerificationLevel} (Phiên âm: {singleRecordToPrint.transcriptionVerification}; Dịch nghĩa: {singleRecordToPrint.translationVerification})
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-semibold">Quyền công bố ảnh</td>
                <td className="border border-black p-1.5">
                  {singleRecordToPrint.recordRightsStatus} · Đăng ảnh: {singleRecordToPrint.allowImagePublish ? 'Có' : 'Không'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (mode === 'catalog-15') {
      return (
        <div className="space-y-4 text-xs">
          <div className="border-b-2 border-black pb-2">
            <h1 className="font-serif text-xl font-bold">
              DANH SÁCH PHIẾU HỒ SƠ DI SẢN TƯ LIỆU — ĐỀ TÀI F03
            </h1>
            <p>
              Bộ sưu tập: {collectionScope.name} · Tổng số bản ghi thật: {realRecords.length}/{collectionScope.plannedTotal}
            </p>
          </div>
          {realRecords.length === 0 ? (
            <p>Hiện chưa có bản ghi thật nào được nhập trong cơ sở dữ liệu.</p>
          ) : (
            realRecords.map((rec) => (
              <div key={rec.recordCode} className="border border-black p-3 space-y-1 print-avoid-break">
                <p className="font-bold">
                  {rec.recordCode} — {rec.dcTitle}
                </p>
                <p>
                  Niên đại: {rec.dcDate} · Loại bản: {rec.manifestationType} · Kiểm chứng: {rec.recordVerificationLevel}
                </p>
                <p>Lưu giữ: {rec.currentRepository}</p>
                <p>Mô tả: {rec.dcDescription}</p>
                <p>Quyền sử dụng: {rec.dcRights} ({rec.recordRightsStatus})</p>
              </div>
            ))
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="no-print flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E3DDD2] pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B5B3E] font-medium">
            Đóng gói dữ liệu · Kiểm tra nghiệm thu · Hồ sơ dự án F03
          </p>
          <h1 className="font-serif text-3xl font-semibold text-[#162436] mt-1">
            Xuất hồ sơ, Kiểm tra trước khi nộp &amp; Giới thiệu
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#EFEAE0] rounded-md self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('export')}
            className={`px-3.5 py-2 text-xs font-medium rounded cursor-pointer whitespace-nowrap ${
              subTab === 'export'
                ? 'bg-white text-[#162436] shadow-xs'
                : 'text-[#4B5B6E] hover:text-[#162436]'
            }`}
          >
            Xuất dữ liệu &amp; PDF
          </button>
          <button
            type="button"
            onClick={() => setSubTab('checklist')}
            className={`px-3.5 py-2 text-xs font-medium rounded cursor-pointer whitespace-nowrap ${
              subTab === 'checklist'
                ? 'bg-white text-[#162436] shadow-xs'
                : 'text-[#4B5B6E] hover:text-[#162436]'
            }`}
          >
            Kiểm tra nộp bài ({completedCount}/14)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('about')}
            className={`px-3.5 py-2 text-xs font-medium rounded cursor-pointer whitespace-nowrap ${
              subTab === 'about'
                ? 'bg-white text-[#162436] shadow-xs'
                : 'text-[#4B5B6E] hover:text-[#162436]'
            }`}
          >
            Giới thiệu &amp; Hạn chế
          </button>
        </div>
      </div>

      {/* TAB 1: EXPORT & PRINT */}
      {subTab === 'export' && (
        <div className="no-print space-y-6">
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#162436]">
              Xuất tệp dữ liệu có cấu trúc (UTF-8)
            </h2>
            <p className="text-sm text-[#4B5B6E]">
              Bản xuất công khai tự động loại bỏ thông tin nhạy cảm (vị trí cất giữ chi tiết, phần không công bố và ảnh chưa cấp phép). Dữ liệu DEMO không được xuất vào hồ sơ thật.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <button
                type="button"
                onClick={() => exportRecordsJson(realRecords, 'public')}
                className="p-4 border border-[#D7CFC0] rounded-lg text-left hover:bg-[#FAF7F0] transition-colors space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#162436]">
                  <span className="font-semibold text-sm">Xuất JSON UTF-8 (Công khai)</span>
                  <Download className="w-4 h-4 text-[#9A7B3E]" />
                </div>
                <p className="text-xs text-[#64748B]">
                  Chuẩn Dublin Core công khai ({realRecords.filter((r) => r.isPubliclyPublished).length} bản ghi).
                </p>
              </button>

              <button
                type="button"
                onClick={() => exportRecordsCsv(realRecords, 'public')}
                className="p-4 border border-[#D7CFC0] rounded-lg text-left hover:bg-[#FAF7F0] transition-colors space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#162436]">
                  <span className="font-semibold text-sm">Xuất CSV UTF-8 (Công khai)</span>
                  <FileSpreadsheet className="w-4 h-4 text-[#9A7B3E]" />
                </div>
                <p className="text-xs text-[#64748B]">
                  Có UTF-8 BOM mở trực tiếp trên Excel không lỗi dấu tiếng Việt.
                </p>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    exportFullBackupJson({
                      collectionScope,
                      records: realRecords,
                      sources: realSources,
                      rights,
                      verificationLogs,
                      auditLogs,
                      checklist,
                    })
                  }
                  className="p-4 border border-[#162436] bg-[#162436] text-[#FBF9F5] rounded-lg text-left hover:bg-[#233752] transition-colors space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Sao lưu toàn bộ hệ thống (JSON)</span>
                    <Download className="w-4 h-4 text-[#D8B979]" />
                  </div>
                  <p className="text-xs text-[#CBD5E1]">
                    Gồm bản ghi nội bộ, nguồn N01–N07, quyền công bố, nhật ký và checklist.
                  </p>
                </button>
              )}
            </div>

            {isAdmin && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-[#EFEAE0]">
                <button
                  type="button"
                  onClick={() => exportRecordsJson(realRecords, 'admin')}
                  className="px-3.5 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  Xuất JSON Nội bộ (đủ ghi chú quản trị)
                </button>
                <button
                  type="button"
                  onClick={() => exportRecordsCsv(realRecords, 'admin')}
                  className="px-3.5 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  Xuất CSV Nội bộ (đủ ghi chú quản trị)
                </button>
              </div>
            )}
          </div>

          {/* Printable / PDF Sheets with Preview */}
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#162436]">
              Xem trước &amp; Xuất PDF hồ sơ di sản (Khổ A4)
            </h2>
            <p className="text-sm text-[#4B5B6E]">
              Kiểm tra bản xem trước ngay trên màn hình trước khi bấm &quot;In / Lưu thành PDF&quot; để bảo đảm bố cục A4 và tiếng Việt UTF-8 rõ ràng.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 border border-[#E3DDD2] rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-[#162436] font-semibold text-sm">
                  <FileText className="w-4 h-4 text-[#9A7B3E]" />
                  <span>Phiếu từng bản ghi</span>
                </div>
                <select
                  value={selectedPrintCode}
                  onChange={(e) => setSelectedPrintCode(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs border border-[#D7CFC0] rounded bg-white"
                >
                  {realRecords.length === 0 ? (
                    <option value="">Chưa có bản ghi thật</option>
                  ) : (
                    realRecords.map((r) => (
                      <option key={r.recordCode} value={r.recordCode}>
                        {r.recordCode} — {r.dcTitle.slice(0, 32)}
                      </option>
                    ))
                  )}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!singleRecordToPrint}
                    onClick={() => setPreviewMode('single-record')}
                    className="flex-1 h-9 text-xs font-medium border border-[#D7CFC0] text-[#162436] rounded hover:bg-[#F3EFE6] disabled:opacity-40 cursor-pointer"
                  >
                    Xem trước A4
                  </button>
                  <button
                    type="button"
                    disabled={!singleRecordToPrint}
                    onClick={() => triggerPrint('single-record')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 text-xs font-medium bg-[#162436] text-white rounded hover:bg-[#233752] disabled:opacity-40 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border border-[#E3DDD2] rounded-lg space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#162436] font-semibold text-sm">
                    <Printer className="w-4 h-4 text-[#9A7B3E]" />
                    <span>Danh sách phiếu 15 bản ghi</span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Tổng hợp toàn bộ bản ghi thật hiện có ({realRecords.length}/15).
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('catalog-15')}
                    className="flex-1 h-9 text-xs font-medium border border-[#D7CFC0] text-[#162436] rounded hover:bg-[#F3EFE6] cursor-pointer"
                  >
                    Xem trước A4
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPrint('catalog-15')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 text-xs font-medium bg-[#162436] text-white rounded hover:bg-[#233752] cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border border-[#E3DDD2] rounded-lg space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#162436] font-semibold text-sm">
                    <FileText className="w-4 h-4 text-[#9A7B3E]" />
                    <span>Bản tóm tắt sản phẩm 1 trang</span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Tóm tắt phạm vi đề tài F03, kiến trúc, thống kê thực tế phục vụ nghiệm thu.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('summary-1page')}
                    className="flex-1 h-9 text-xs font-medium border border-[#D7CFC0] text-[#162436] rounded hover:bg-[#F3EFE6] cursor-pointer"
                  >
                    Xem trước A4
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPrint('summary-1page')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 text-xs font-medium bg-[#9A7B3E] text-white rounded hover:bg-[#785E2B] cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP A4 PRINT PREVIEW MODAL */}
      {previewMode !== 'none' && (
        <div
          className="no-print fixed inset-0 z-50 bg-[#162436]/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#EFEAE0] border border-[#D7CFC0] rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl">
            <div className="px-5 py-3.5 bg-white border-b border-[#E3DDD2] flex items-center justify-between gap-3 shrink-0">
              <p className="text-sm font-semibold text-[#162436]">
                Xem trước bản in khổ A4 (Tiếng Việt UTF-8)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerPrint(previewMode)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#162436] text-white rounded hover:bg-[#233752] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / Lưu thành PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('none')}
                  className="px-3 py-2 text-xs font-medium border border-[#D7CFC0] rounded bg-white hover:bg-[#F3EFE6] cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 sm:p-8 flex justify-center">
              <div className="bg-white text-black border border-[#D7CFC0] shadow-md w-full max-w-[210mm] p-6 sm:p-10">
                {renderPrintableBody(previewMode)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRE-SUBMISSION CHECKLIST (14 items) */}
      {subTab === 'checklist' && (
        <div className="no-print space-y-5">
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#162436]">
                Bảng kiểm tra trước khi nộp sản phẩm (14 tiêu chí)
              </h2>
              <p className="text-xs text-[#4B5B6E] mt-0.5">
                Hệ thống không tự động đánh dấu hoàn thành nếu chưa có bằng chứng kiểm chứng tương ứng.
              </p>
            </div>
            <p className="font-mono text-sm font-semibold tabular-nums text-[#162436]">
              Đã hoàn tất: {completedCount}/{checklist.length}
            </p>
          </div>

          {checklistError && (
            <div className="bg-[#FDF2EF] border border-[#E5C6BD] rounded-md p-3 text-xs text-[#9A3412]">
              {checklistError}
            </div>
          )}

          <div className="bg-white border border-[#E3DDD2] rounded-lg divide-y divide-[#EFEAE0]">
            {checklist.map((item) => {
              const isEditing = editingItemId === item.id;
              return (
                <div key={item.id} className="p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => handleToggleChecklist(item)}
                        className="mt-0.5 text-[#162436] disabled:opacity-40 cursor-pointer"
                        aria-label={`Đánh dấu mục ${item.orderIndex}`}
                      >
                        {item.isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-[#14532D]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#7A8699]" />
                        )}
                      </button>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#162436]">
                          <span className="font-mono text-[#9A7B3E] mr-2">
                            {String(item.orderIndex).padStart(2, '0')}.
                          </span>
                          {item.question}
                        </p>
                        <p className="text-xs text-[#4B5B6E]">
                          Đối chiếu hệ thống: {getAutoDiagnosticForQuestion(item.orderIndex)}
                        </p>
                        {item.evidenceNote && (
                          <p className="text-xs text-[#14532D] bg-[#F0F7F2] border border-[#B7D7C2] rounded px-2.5 py-1 inline-block">
                            Bằng chứng: {item.evidenceNote}
                            {item.evidenceUrl ? ` (${item.evidenceUrl})` : ''}
                            {item.verifiedByName ? ` — Xác nhận: ${item.verifiedByName}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingItemId(null);
                          } else {
                            setEditingItemId(item.id);
                            setEvidenceNoteDraft(item.evidenceNote);
                            setEvidenceUrlDraft(item.evidenceUrl);
                          }
                        }}
                        className="px-3 py-1.5 text-xs border border-[#D7CFC0] rounded hover:bg-[#F3EFE6] cursor-pointer shrink-0"
                      >
                        {isEditing ? 'Đóng' : 'Gắn bằng chứng'}
                      </button>
                    )}
                  </div>

                  {isEditing && isAdmin && (
                    <div className="pl-8 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={evidenceNoteDraft}
                        onChange={(e) => setEvidenceNoteDraft(e.target.value)}
                        placeholder="Mô tả bằng chứng cụ thể (bắt buộc)"
                        className="sm:col-span-2 h-9 px-3 text-xs border border-[#D7CFC0] rounded"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={evidenceUrlDraft}
                          onChange={(e) => setEvidenceUrlDraft(e.target.value)}
                          placeholder="URL minh chứng (nếu có)"
                          className="flex-1 h-9 px-2.5 text-xs border border-[#D7CFC0] rounded min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEvidence(item)}
                          className="px-3 h-9 bg-[#162436] text-white text-xs rounded hover:bg-[#233752] cursor-pointer shrink-0"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ABOUT & TRANSPARENT LIMITATIONS */}
      {subTab === 'about' && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-7 bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-3">
              Thông tin dự án DiSanMeta
            </h2>
            <dl className="divide-y divide-[#EFEAE0] text-sm">
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Tên ứng dụng</dt>
                <dd className="sm:col-span-2 font-semibold text-[#162436]">
                  DiSanMeta — Công cụ mô tả và kiểm chứng di sản tư liệu số theo chuẩn Dublin Core tiếng Việt
                </dd>
              </div>
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Sinh viên thực hiện</dt>
                <dd className="sm:col-span-2 text-[#162436]">Trần Trung Hiếu</dd>
              </div>
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Mã sinh viên / Nhóm</dt>
                <dd className="sm:col-span-2 font-mono text-[#162436]">PH73027 · Nhóm 1</dd>
              </div>
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Mã đề tài</dt>
                <dd className="sm:col-span-2 font-mono text-[#162436]">F03</dd>
              </div>
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Chương trình thực tập</dt>
                <dd className="sm:col-span-2 text-[#162436]">
                  Thực tập sinh Đợt 15 — FPT Polytechnic × IMTA TECH
                </dd>
              </div>
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Tính chất dự án</dt>
                <dd className="sm:col-span-2 text-[#3E4C5E]">
                  Dự án xã hội phi lợi nhuận, không quảng cáo, không thương mại.
                </dd>
              </div>
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Bộ sưu tập &amp; Nơi lưu giữ</dt>
                <dd className="sm:col-span-2 text-[#3E4C5E]">
                  15 Bia Tiến sĩ chọn lọc thuộc bộ 82 bia tại {collectionScope.repositoryAddress}. Đơn vị liên hệ quyền công bố: {collectionScope.rightsContactUnit}.
                </dd>
              </div>
            </dl>
          </section>

          <section className="lg:col-span-5 bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#9A7B3E]" />
              <span>Những việc còn thiếu để đạt nghiệm thu</span>
            </h2>
            <p className="text-xs text-[#4B5B6E] leading-relaxed">
              Để bảo đảm trung thực học thuật, hệ thống công khai tình trạng thực tế và chưa tự nhận hoàn tất cho tới khi các dữ liệu sau được nhập đầy đủ:
            </p>
            <ul className="space-y-3 text-xs text-[#3E4C5E] list-disc list-inside">
              <li>
                <strong>Hồ sơ bia thật ({realRecords.length}/15):</strong> Cần khảo sát và nhập đủ 15 hồ sơ bia Tiến sĩ (F03-00001 đến F03-00015), không dùng dữ liệu giả hay DEMO.
              </li>
              <li>
                <strong>Nguồn riêng từng bia ({steleSpecificSourcesCount} nguồn riêng · {sufficientSourcesCount}/{realRecords.length} hồ sơ đủ nguồn):</strong> Đã khởi tạo 7 nguồn chính thống cấp bộ sưu tập (N01–N07) và {techLegalSourcesCount} tài liệu kỹ thuật/pháp lý tách riêng; vẫn cần tiếp tục thu thập nguồn riêng phù hợp cho từng tấm bia.
              </li>
              <li>
                <strong>Kiểm chứng trường thông tin ({verifiedRecordsCount}/{realRecords.length} hồ sơ đã đối chiếu nguồn):</strong> Cần đối chiếu thủ công từng trường (niên đại, nhân vật, địa danh, tình trạng bản gốc) và ghi rõ người, ngày, kết quả đối chiếu.
              </li>
              <li>
                <strong>Quyền công bố ảnh ({collectionScope.rightsStatus} · {permittedRecordsCount} hồ sơ được cấp phép):</strong> Chưa có văn bản cấp phép chính thức từ Trung tâm Hoạt động VHKH Văn Miếu – Quốc Tử Giám nên ảnh tư liệu vẫn đang bị ẩn khỏi website công khai.
              </li>
              <li>
                <strong>Cấu hình Gemini API phía máy chủ:</strong>{' '}
                {geminiConfigured
                  ? 'Biến môi trường GEMINI_API_KEY đã sẵn sàng trên máy chủ.'
                  : 'Cần thiết lập biến GEMINI_API_KEY trong Settings > Secrets của môi trường triển khai.'}
              </li>
            </ul>
          </section>
        </div>
      )}

      {/* PRINT-ONLY RENDER TARGETS */}
      <div className="print-only space-y-6">
        {renderPrintableBody(printMode)}
      </div>
    </div>
  );
};
