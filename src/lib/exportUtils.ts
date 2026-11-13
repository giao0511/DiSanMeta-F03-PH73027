import type {
  AuditLog,
  ChecklistItem,
  HeritageCollection,
  HeritageRecord,
  PublicationRight,
  SourceItem,
  VerificationLog,
} from '../types/heritage';

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeRecordForPublicExport(record: HeritageRecord) {
  const canPublishImages =
    record.recordRightsStatus === 'Đã cấp phép' && record.allowImagePublish;

  const permittedImages = canPublishImages
    ? (record.images ?? [])
        .filter((img) => img.rightsVerified && img.allowWebDisplay)
        .map((img) => ({
          id: img.id,
          viewType: img.viewType,
          caption: img.caption,
          imageSource: img.imageSource,
          allowDownload: record.allowImageDownload && img.allowDownload,
          url:
            record.allowImageDownload && img.allowDownload
              ? img.url
              : '[Ẩn tệp tải về theo phạm vi quyền]',
        }))
    : [];

  return {
    recordCode: record.recordCode,
    collectionId: record.collectionId,
    dublinCore: {
      title: record.dcTitle,
      creator: record.dcCreator,
      subject: record.dcSubject,
      description: record.dcDescription,
      publisher: record.dcPublisher,
      contributor: record.dcContributor,
      date: record.dcDate,
      type: record.dcType,
      format: record.dcFormat,
      identifier: record.dcIdentifier,
      source: record.dcSource,
      language: record.dcLanguage,
      relation: record.dcRelation,
      coverage: record.dcCoverage,
      rights: record.dcRights,
    },
    archivalMetadata: {
      currentRepository: record.currentRepository,
      historicalRepository: record.historicalRepository,
      manifestationType: record.manifestationType,
      originalCondition: record.originalCondition,
      damageDescription: record.damageDescription,
      repositoryRegistrationNo: record.repositoryRegistrationNo,
      rightsAuthority: record.rightsAuthority,
      rightsConfirmedBy: record.rightsConfirmedBy,
      rightsConsentDate: record.rightsConsentDate,
      rightsEvidence: record.rightsEvidence,
      rightsScope: record.rightsScope,
      recordRightsStatus: record.recordRightsStatus,
      allowImagePublish: record.allowImagePublish,
      allowImageDownload: record.allowImageDownload,
      transcriptionText: record.transcriptionText,
      transcriptionVerification: record.transcriptionVerification,
      translationText: record.translationText,
      translationVerification: record.translationVerification,
      verifierName: record.verifierName,
      verifiedDate: record.verifiedDate,
      digitizerName: record.digitizerName,
      digitizedDate: record.digitizedDate,
      unclearPoints: record.unclearPoints,
      recordVerificationLevel: record.recordVerificationLevel,
    },
    sourceIds: record.sourceIds,
    evidenceMappings: record.evidenceMappings,
    permittedImages,
    updatedAt: record.updatedAt,
  };
}

export function exportRecordsJson(
  records: HeritageRecord[],
  mode: 'public' | 'admin'
) {
  const filtered =
    mode === 'public'
      ? records.filter((r) => r.isPubliclyPublished && !r.isDemo)
      : records.filter((r) => !r.isDemo);

  const payload = {
    exportedAt: new Date().toISOString(),
    exportScope: mode === 'public' ? 'PUBLIC_REDACTED_EXPORT' : 'ADMIN_INTERNAL_BACKUP',
    standard: 'Dublin Core Metadata Element Set (ISO 15836) - Tiếng Việt',
    totalRecords: filtered.length,
    records:
      mode === 'public'
        ? filtered.map(sanitizeRecordForPublicExport)
        : filtered,
  };

  const json = JSON.stringify(payload, null, 2);
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(
    `disanmeta-${mode === 'public' ? 'cong-khai' : 'noi-bo'}-${dateTag}.json`,
    json,
    'application/json;charset=utf-8'
  );
}

function escapeCsvCell(val: unknown): string {
  const s = String(val ?? '');
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportRecordsCsv(
  records: HeritageRecord[],
  mode: 'public' | 'admin'
) {
  const filtered =
    mode === 'public'
      ? records.filter((r) => r.isPubliclyPublished && !r.isDemo)
      : records.filter((r) => !r.isDemo);

  const headers = [
    'Mã bản ghi',
    '1. Title (Nhan đề)',
    '2. Creator (Người/cơ quan tạo ra)',
    '3. Subject (Chủ đề)',
    '4. Description (Mô tả)',
    '5. Publisher (Đơn vị công bố)',
    '6. Contributor (Người đóng góp)',
    '7. Date (Niên đại)',
    '8. Type (Loại tư liệu)',
    '9. Format (Định dạng/chất liệu)',
    '10. Identifier (Mã định danh)',
    '11. Source (Nguồn gốc)',
    '12. Language (Ngôn ngữ)',
    '13. Relation (Quan hệ)',
    '14. Coverage (Phạm vi thời gian/không gian)',
    '15. Rights (Quyền sử dụng)',
    'Nơi lưu giữ hiện tại',
    'Địa danh cũ / nơi lưu giữ thời điểm tư liệu',
    'Loại bản đang hiển thị',
    'Tình trạng bản gốc',
    'Mô tả hư hại',
    'Số đăng ký',
    'Đơn vị có thẩm quyền',
    'Người xác nhận cho phép',
    'Ngày xác nhận',
    'Bằng chứng đồng ý',
    'Phạm vi sử dụng',
    'Trạng thái quyền công bố',
    'Quyền đăng ảnh',
    'Quyền tải ảnh',
    'Mức kiểm chứng phiên âm',
    'Mức kiểm chứng dịch nghĩa',
    'Mức kiểm chứng hồ sơ',
    'Người kiểm chứng',
    'Ngày kiểm chứng',
    'Người số hóa',
    'Ngày số hóa',
    'Điểm chưa rõ',
    'Số nguồn dẫn chứng',
  ];

  if (mode === 'admin') {
    headers.push('Vị trí cất giữ chi tiết (Nội bộ)', 'Phần không công bố (Nội bộ)');
  }

  const rows = filtered.map((r) => {
    const base = [
      r.recordCode,
      r.dcTitle,
      r.dcCreator,
      r.dcSubject,
      r.dcDescription,
      r.dcPublisher,
      r.dcContributor,
      r.dcDate,
      r.dcType,
      r.dcFormat,
      r.dcIdentifier,
      r.dcSource,
      r.dcLanguage,
      r.dcRelation,
      r.dcCoverage,
      r.dcRights,
      r.currentRepository,
      r.historicalRepository,
      r.manifestationType,
      r.originalCondition,
      r.damageDescription,
      r.repositoryRegistrationNo,
      r.rightsAuthority,
      r.rightsConfirmedBy,
      r.rightsConsentDate,
      r.rightsEvidence,
      r.rightsScope,
      r.recordRightsStatus,
      r.allowImagePublish ? 'Có' : 'Không',
      r.allowImageDownload ? 'Có' : 'Không',
      r.transcriptionVerification,
      r.translationVerification,
      r.recordVerificationLevel,
      r.verifierName,
      r.verifiedDate,
      r.digitizerName,
      r.digitizedDate,
      r.unclearPoints,
      r.sourceIds.length,
    ];
    if (mode === 'admin') {
      base.push(r.sensitiveStorageNote ?? '', r.nonPublicContent ?? '');
    }
    return base.map(escapeCsvCell).join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(
    `disanmeta-${mode === 'public' ? 'cong-khai' : 'noi-bo'}-${dateTag}.csv`,
    csvContent,
    'text/csv;charset=utf-8'
  );
}

export function exportFullBackupJson(data: {
  collectionScope: HeritageCollection;
  records: HeritageRecord[];
  sources: SourceItem[];
  rights: PublicationRight[];
  verificationLogs: VerificationLog[];
  auditLogs: AuditLog[];
  checklist: ChecklistItem[];
}) {
  const payload = {
    backupVersion: '1.1',
    exportedAt: new Date().toISOString(),
    project: 'DiSanMeta - Đề tài F03',
    ...data,
    records: data.records.filter((r) => !r.isDemo),
    sources: data.sources.filter((s) => !s.isDemo),
  };
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(
    `disanmeta-sao-luu-toan-bo-${dateTag}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
}
