import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Edit3,
  ExternalLink,
  ImageOff,
  Lock,
  Printer,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import { DUBLIN_CORE_FIELDS, evaluateRecordCompleteness } from '../constants/dublinCore';
import type { HeritageRecord, SourceItem, VerificationLog } from '../types/heritage';

interface RecordDetailViewProps {
  record: HeritageRecord;
  sources: SourceItem[];
  verificationLogs: VerificationLog[];
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
}

export const RecordDetailView: React.FC<RecordDetailViewProps> = ({
  record,
  sources,
  verificationLogs,
  isAdmin,
  onBack,
  onEdit,
}) => {
  const [imageFilter, setImageFilter] = useState<'all' | 'toàn cảnh' | 'cận cảnh'>('all');
  const [zoomImage, setZoomImage] = useState<{
    url: string;
    caption: string;
    source: string;
    viewType: string;
  } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const completeness = evaluateRecordCompleteness(record, sources);

  const recordPermitsPublicImages =
    record.recordRightsStatus === 'Đã cấp phép' && record.allowImagePublish;

  const visibleImages = recordPermitsPublicImages
    ? record.images.filter((img) => {
        const permitted = img.rightsVerified && img.allowWebDisplay;
        if (!permitted) return false;
        if (imageFilter === 'all') return true;
        return img.viewType === imageFilter;
      })
    : [];

  const hiddenImagesCount = record.images.length - visibleImages.length;

  const linkedSources = sources.filter((s) => record.sourceIds.includes(s.id));
  const recordLogs = verificationLogs.filter((l) => l.recordCode === record.recordCode);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-[#E3DDD2] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#162436] hover:text-[#9A7B3E] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] bg-white hover:bg-[#F3EFE6] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / Lưu PDF phiếu bản ghi</span>
          </button>

          {isAdmin && !record.isDemo && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#162436] text-[#FBF9F5] rounded-md hover:bg-[#233752] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#D8B979]" />
              <span>Chỉnh sửa &amp; Kiểm chứng</span>
            </button>
          )}
        </div>
      </div>

      {/* Print Header */}
      <div className="print-only border-b border-black pb-3 mb-4">
        <p className="text-xs uppercase tracking-widest">
          DiSanMeta — Phiếu hồ sơ di sản tư liệu (Dublin Core)
        </p>
        <p className="text-xs mt-1">
          Mã hồ sơ: {record.recordCode} · Ngày in: {new Date().toLocaleDateString('vi-VN')}
        </p>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
          <span className="font-mono font-semibold text-[#162436]">{record.recordCode}</span>
          {record.isDemo && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold text-[#9A3412]">
                MẪU DEMO (KHÔNG TÍNH NGHIỆM THU)
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>Loại bản đang xem: {record.manifestationType}</span>
          <span aria-hidden="true">·</span>
          <span>Tình trạng bản gốc: {record.originalCondition}</span>
          <span aria-hidden="true">·</span>
          <span
            className={
              record.recordVerificationLevel === 'Đã đối chiếu nguồn'
                ? 'text-[#14532D] font-semibold'
                : 'text-[#9A7B3E] font-semibold'
            }
          >
            {record.recordVerificationLevel}
          </span>
          <span aria-hidden="true">·</span>
          <span>Quyền công bố: {record.recordRightsStatus}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#162436] leading-tight text-balance">
          {record.dcTitle}
        </h1>
      </header>

      {(completeness.warnings.length > 0 || !completeness.hasSufficientEvidence) && (
        <div className="no-print bg-[#FDF8EE] border border-[#DFC99B] rounded-lg p-4 space-y-1.5">
          <p className="text-xs font-semibold text-[#6B501D] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#9A7B3E]" />
            <span>
              {!completeness.hasSufficientEvidence
                ? 'Chưa đủ dữ liệu / Chưa đủ bằng chứng kiểm chứng'
                : 'Cảnh báo kiểm chứng & trường thiếu'}{' '}
              ({completeness.completionPercent}% đầy đủ)
            </span>
          </p>
          <ul className="list-disc list-inside text-xs text-[#6B501D] space-y-0.5">
            {completeness.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Real Image Viewer + Provenance + Publication Rights */}
        <section className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEAE0] pb-3">
              <h2 className="font-serif text-xl font-semibold text-[#162436]">
                Hình ảnh tư liệu thật
              </h2>
              <div className="no-print flex items-center gap-1 bg-[#F3EFE6] p-1 rounded-md text-xs">
                {(['all', 'toàn cảnh', 'cận cảnh'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setImageFilter(tab)}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                      imageFilter === tab
                        ? 'bg-white text-[#162436] shadow-xs'
                        : 'text-[#4B5B6E] hover:text-[#162436]'
                    }`}
                  >
                    {tab === 'all' ? 'Tất cả' : tab === 'toàn cảnh' ? 'Toàn cảnh' : 'Cận cảnh'}
                  </button>
                ))}
              </div>
            </div>

            {(!recordPermitsPublicImages || hiddenImagesCount > 0) && (
              <div className="bg-[#FAF6F0] border border-[#DFC99B] rounded-md p-3 text-xs text-[#6B501D] flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#9A7B3E]" />
                <div>
                  <strong>Trạng thái quyền ảnh: {record.recordRightsStatus}.</strong>{' '}
                  {hiddenImagesCount > 0
                    ? `Đã ẩn ${hiddenImagesCount} hình ảnh do chưa xác minh quyền hoặc không có quyền đăng lên website công khai.`
                    : 'Không hiển thị ảnh trên website công khai khi chưa có văn bản cấp phép hợp lệ.'}
                </div>
              </div>
            )}

            {visibleImages.length === 0 ? (
              <div className="py-10 px-4 text-center border border-dashed border-[#D7CFC0] rounded-md bg-[#FBF9F5] space-y-2">
                <ImageOff className="w-8 h-8 text-[#9A7B3E] mx-auto opacity-70" />
                <p className="text-sm font-medium text-[#162436]">
                  Chưa có ảnh được phép hiển thị công khai
                </p>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                  DiSanMeta không tự lấy ảnh trên mạng và không dùng ảnh AI tạo. Ảnh chỉ hiển thị khi đã được xác minh quyền và cấp phép đăng tải.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {visibleImages.map((img, index) => (
                  <figure key={img.id} className="space-y-2 print-avoid-break">
                    <div className="relative bg-[#F3EFE6] border border-[#E3DDD2] rounded-md overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.caption || `Ảnh ${img.viewType} của ${record.recordCode}`}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-80 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setZoomScale(1);
                          setZoomImage({
                            url: img.url,
                            caption: img.caption,
                            source: img.imageSource,
                            viewType: img.viewType,
                          });
                        }}
                        className="no-print absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#162436]/90 text-white text-xs rounded-md hover:bg-[#162436] cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Phóng to</span>
                      </button>
                    </div>
                    <figcaption className="text-xs text-[#4B5B6E] space-y-0.5">
                      <p className="font-medium text-[#162436]">
                        Hình {index + 1} ({img.viewType}): {img.caption || 'Chưa có chú thích'}
                      </p>
                      <p className="text-[#64748B]">
                        Nguồn ảnh: {img.imageSource || 'Chưa xác định'}
                        {img.photographer ? ` · Tác giả ảnh: ${img.photographer}` : ''}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          {/* Archival & Provenance */}
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-3">
            <h2 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
              Thông tin lưu giữ &amp; Phiếu tư liệu tuần 4
            </h2>
            <dl className="divide-y divide-[#EFEAE0] text-sm">
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Nơi lưu giữ hiện tại</dt>
                <dd className="sm:col-span-2 text-[#162436]">{record.currentRepository}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Địa danh cũ</dt>
                <dd className="sm:col-span-2 text-[#162436]">{record.historicalRepository}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Số đăng ký</dt>
                <dd className="sm:col-span-2 font-mono text-xs text-[#162436]">
                  {record.repositoryRegistrationNo}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Loại bản đang hiển thị</dt>
                <dd className="sm:col-span-2 text-[#162436] font-medium">{record.manifestationType}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Tình trạng bản gốc</dt>
                <dd className="sm:col-span-2 text-[#3E4C5E]">
                  <strong>{record.originalCondition}</strong> — {record.damageDescription}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Kiểm chứng &amp; Số hóa</dt>
                <dd className="sm:col-span-2 text-xs text-[#4B5B6E] space-y-1">
                  <p>
                    Người kiểm chứng: {record.verifierName} ({record.verifiedDate})
                  </p>
                  <p>
                    Người số hóa: {record.digitizerName} ({record.digitizedDate})
                  </p>
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Điểm chưa rõ</dt>
                <dd className="sm:col-span-2 text-[#3E4C5E]">{record.unclearPoints}</dd>
              </div>
            </dl>
          </div>

          {/* Publication Rights Details */}
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-3">
            <h2 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
              Quyền công bố tư liệu và hình ảnh
            </h2>
            <dl className="divide-y divide-[#EFEAE0] text-sm">
              <div className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Trạng thái quyền</dt>
                <dd className="sm:col-span-2 font-semibold text-[#9A3412]">
                  {record.recordRightsStatus}
                </dd>
              </div>
              <div className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Đơn vị / người có thẩm quyền</dt>
                <dd className="sm:col-span-2 text-[#162436]">{record.rightsAuthority}</dd>
              </div>
              <div className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Người xác nhận &amp; Ngày</dt>
                <dd className="sm:col-span-2 text-[#3E4C5E]">
                  {record.rightsConfirmedBy} ({record.rightsConsentDate})
                </dd>
              </div>
              <div className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Bằng chứng đồng ý</dt>
                <dd className="sm:col-span-2 text-[#3E4C5E]">{record.rightsEvidence}</dd>
              </div>
              <div className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-xs text-[#64748B]">Phạm vi, đăng &amp; tải ảnh</dt>
                <dd className="sm:col-span-2 text-xs text-[#4B5B6E]">
                  {record.rightsScope} · Quyền đăng ảnh: {record.allowImagePublish ? 'Có' : 'Không'} · Quyền tải ảnh: {record.allowImageDownload ? 'Có' : 'Không'}
                </dd>
              </div>
              {(record.hasRedactedContent || record.nonPublicContent || record.sensitiveStorageNote) && (
                <div className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-1 bg-[#FAF6F0] px-2 rounded">
                  <dt className="text-xs text-[#6B501D] font-medium">Phần bị hạn chế</dt>
                  <dd className="sm:col-span-2 text-xs text-[#6B501D]">
                    {isAdmin
                      ? `Nội bộ: ${record.nonPublicContent || 'Không'} | Vị trí chi tiết: ${record.sensitiveStorageNote || 'Không'}`
                      : 'Nội dung nhạy cảm hoặc phần không công bố đã được ẩn khỏi trang công khai.'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* Right: 15 Dublin Core + Transcription/Translation + Evidence Verification */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-3">
              15 Trường chuẩn Dublin Core
            </h2>
            <dl className="divide-y divide-[#EFEAE0] text-sm">
              {DUBLIN_CORE_FIELDS.map((field) => {
                const value = String(record[field.key] || 'Chưa xác định');
                const isUnknown =
                  value.trim().toLowerCase() === 'chưa xác định' ||
                  value.trim().toLowerCase() === 'chưa đủ bằng chứng';
                return (
                  <div key={field.key} className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <dt className="sm:col-span-4 text-xs font-medium text-[#4B5B6E]">
                      <span className="font-mono text-[#9A7B3E] mr-1.5">
                        {String(field.index).padStart(2, '0')}.
                      </span>
                      {field.englishName} – {field.vietnameseLabel}
                    </dt>
                    <dd
                      className={`sm:col-span-8 leading-relaxed whitespace-pre-line ${
                        isUnknown ? 'text-[#7A8699] italic' : 'text-[#162436]'
                      }`}
                    >
                      {value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-3">
              Phiên âm &amp; Dịch nghĩa văn bia
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#162436]">Phiên âm</h3>
                <span className="text-xs font-medium text-[#785E2B]">
                  Trạng thái: {record.transcriptionVerification}
                </span>
              </div>
              <div className="p-4 bg-[#FBF9F5] border border-[#E3DDD2] rounded-md text-sm text-[#162436] leading-relaxed whitespace-pre-line">
                {record.transcriptionText || 'Chưa có văn bản phiên âm.'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#162436]">Dịch nghĩa</h3>
                <span className="text-xs font-medium text-[#785E2B]">
                  Trạng thái: {record.translationVerification}
                </span>
              </div>
              <div className="p-4 bg-[#FBF9F5] border border-[#E3DDD2] rounded-md text-sm text-[#162436] leading-relaxed whitespace-pre-line">
                {record.translationText || 'Chưa có bản dịch nghĩa.'}
              </div>
            </div>
          </div>

          {/* Sources & Evidence Verification Ledger */}
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-3">
              <h2 className="font-serif text-2xl font-semibold text-[#162436]">
                Nguồn dẫn chứng &amp; Kết quả kiểm chứng
              </h2>
              <span className="text-xs font-mono tabular-nums text-[#64748B]">
                {linkedSources.length} nguồn gắn kết
              </span>
            </div>

            {linkedSources.length === 0 ? (
              <p className="text-sm text-[#9A3412]">
                Chưa có nguồn dẫn chứng gắn cho hồ sơ này (yêu cầu tối thiểu 2 nguồn phù hợp với chính tấm bia).
              </p>
            ) : (
              <ul className="divide-y divide-[#EFEAE0] text-sm">
                {linkedSources.map((src) => {
                  const isHttp = /^https?:\/\//i.test(src.urlOrArchiveCode);
                  return (
                    <li
                      key={src.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium text-[#162436]">
                          <span className="font-mono text-xs text-[#9A7B3E] mr-1.5">{src.id}</span>
                          {src.documentTitle}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {src.organizationOrAuthor} · {src.sourceCategory} · {src.sourceLevel} · {src.verificationStatus}
                        </p>
                      </div>
                      {isHttp ? (
                        <a
                          href={src.urlOrArchiveCode}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#785E2B] hover:text-[#162436] shrink-0"
                        >
                          <span>Mở nguồn gốc</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs font-mono text-[#64748B]">
                          Mã hồ sơ: {src.urlOrArchiveCode}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="pt-2 space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-[#64748B] font-semibold">
                Bảng kiểm chứng từng trường thông tin
              </h3>
              {record.evidenceMappings.length === 0 ? (
                <p className="text-xs text-[#9A3412]">
                  Chưa đủ bằng chứng: chưa có bản ghi đối chiếu nguồn cho từng trường thông tin (niên đại, nhân vật, địa danh, tình trạng bản gốc).
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-[#E3DDD2]">
                    <thead className="bg-[#F3EFE6] text-[#162436]">
                      <tr>
                        <th className="p-2.5 border-b border-[#E3DDD2]">Trường kiểm</th>
                        <th className="p-2.5 border-b border-[#E3DDD2]">Giá trị &amp; Vị trí dẫn chứng</th>
                        <th className="p-2.5 border-b border-[#E3DDD2]">Nguồn</th>
                        <th className="p-2.5 border-b border-[#E3DDD2]">Người &amp; Ngày kiểm</th>
                        <th className="p-2.5 border-b border-[#E3DDD2]">Kết quả đối chiếu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEAE0]">
                      {record.evidenceMappings.map((ev) => {
                        const matchedSrc = sources.find((s) => s.id === ev.sourceId);
                        return (
                          <tr key={ev.id}>
                            <td className="p-2.5 font-medium text-[#162436]">{ev.claimField}</td>
                            <td className="p-2.5 text-[#3E4C5E]">
                              {ev.claimValue}
                              {ev.citationDetail ? ` — (${ev.citationDetail})` : ''}
                            </td>
                            <td className="p-2.5 text-[#4B5B6E]">
                              {matchedSrc ? `${matchedSrc.id}: ${matchedSrc.documentTitle}` : ev.sourceId}
                            </td>
                            <td className="p-2.5 text-[#4B5B6E]">
                              {ev.verifiedBy || 'Chưa xác định'} ({ev.verifiedDate || 'Chưa rõ'})
                            </td>
                            <td className="p-2.5 font-semibold text-[#162436]">
                              {ev.verificationResult || 'Chờ kiểm chứng'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {recordLogs.length > 0 && (
              <div className="pt-3 border-t border-[#EFEAE0] space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-[#64748B] font-semibold">
                  Lịch sử chuyển trạng thái kiểm chứng
                </h3>
                <ul className="space-y-1.5 text-xs text-[#4B5B6E]">
                  {recordLogs.map((log) => (
                    <li key={log.id} className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[#64748B]">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <span>·</span>
                      <span className="font-medium text-[#162436]">{log.verifierName}</span>
                      <span>
                        "{log.previousLevel}" → "{log.newLevel}"
                      </span>
                      {log.notes && <span className="text-[#64748B]">({log.notes})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-[#0F1722]/90 flex flex-col p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/15">
            <div className="text-xs sm:text-sm">
              <span className="font-medium">{zoomImage.viewType}: {zoomImage.caption}</span>
              <span className="text-white/70 ml-2">· Nguồn: {zoomImage.source}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.5, Number((s - 0.25).toFixed(2))))}
                className="p-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                aria-label="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs tabular-nums w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(3, Number((s + 0.25).toFixed(2))))}
                className="p-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                aria-label="Phóng to thêm"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="p-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer ml-2"
                aria-label="Đóng trình xem ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <img
              src={zoomImage.url}
              alt={zoomImage.caption}
              referrerPolicy="no-referrer"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
              className="max-h-full max-w-full object-contain transition-transform duration-150"
            />
          </div>
        </div>
      )}
    </div>
  );
};
