import type { HeritageCollection, HeritageRecord, SourceItem } from '../types/heritage';

export interface DublinCoreFieldSpec {
  key: keyof Pick<
    HeritageRecord,
    | 'dcTitle'
    | 'dcCreator'
    | 'dcSubject'
    | 'dcDescription'
    | 'dcPublisher'
    | 'dcContributor'
    | 'dcDate'
    | 'dcType'
    | 'dcFormat'
    | 'dcIdentifier'
    | 'dcSource'
    | 'dcLanguage'
    | 'dcRelation'
    | 'dcCoverage'
    | 'dcRights'
  >;
  index: number;
  englishName: string;
  vietnameseLabel: string;
  meaning: string;
  example: string;
  warningIfMissing: string;
  multiline?: boolean;
}

export const DUBLIN_CORE_FIELDS: DublinCoreFieldSpec[] = [
  {
    key: 'dcTitle',
    index: 1,
    englishName: 'Title',
    vietnameseLabel: 'Nhan đề',
    meaning: 'Tên gọi chính thức hoặc tên nhận diện chuẩn hóa của tư liệu di sản.',
    example: 'Ví dụ: Bia đề danh Tiến sĩ khoa Nhâm Tuất niên hiệu Đại Bảo thứ 3 (1442)',
    warningIfMissing: 'Thiếu nhan đề: Bắt buộc phải có tên gọi nhận diện tư liệu.',
  },
  {
    key: 'dcCreator',
    index: 2,
    englishName: 'Creator',
    vietnameseLabel: 'Người / cơ quan tạo ra',
    meaning: 'Cá nhân soạn văn bia, thợ khắc hoặc cơ quan chủ trì tạo lập hiện vật gốc.',
    example: 'Ví dụ: Thân Nhân Trung (soạn văn bia); Triều đình nhà Lê sơ (chủ trì dựng bia)',
    warningIfMissing: 'Thiếu người/cơ quan tạo ra. Nếu chưa đủ căn cứ, ghi "Chưa xác định".',
  },
  {
    key: 'dcSubject',
    index: 3,
    englishName: 'Subject',
    vietnameseLabel: 'Chủ đề',
    meaning: 'Từ khóa chủ đề lịch sử, khoa cử, nhân vật hoặc nội dung trọng tâm của tư liệu.',
    example: 'Ví dụ: Bia Tiến sĩ; Khoa cử Nho học; Triều Lê sơ; Văn Miếu – Quốc Tử Giám',
    warningIfMissing: 'Chưa có từ khóa chủ đề phục vụ tra cứu và phân nhóm.',
  },
  {
    key: 'dcDescription',
    index: 4,
    englishName: 'Description',
    vietnameseLabel: 'Mô tả',
    meaning: 'Tóm tắt nội dung văn bia, đặc điểm cấu trúc và bối cảnh lịch sử đã đối chiếu nguồn.',
    example: 'Ví dụ: Bia đá dựng trên lưng rùa đá, ghi danh các vị đỗ Tiến sĩ khoa thi cùng bài ký trọng hiền tài.',
    warningIfMissing: 'Thiếu mô tả nội dung tư liệu. Tuyệt đối không tự suy đoán.',
    multiline: true,
  },
  {
    key: 'dcPublisher',
    index: 5,
    englishName: 'Publisher',
    vietnameseLabel: 'Đơn vị công bố',
    meaning: 'Cơ quan, tổ chức chịu trách nhiệm xuất bản hoặc công bố bản ghi tư liệu số.',
    example: 'Ví dụ: Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu – Quốc Tử Giám (khi được cấp phép)',
    warningIfMissing: 'Thiếu đơn vị công bố.',
  },
  {
    key: 'dcContributor',
    index: 6,
    englishName: 'Contributor',
    vietnameseLabel: 'Người đóng góp',
    meaning: 'Người dịch nghĩa, hiệu đính Hán Nôm hoặc cộng tác viên đóng góp vào hồ sơ.',
    example: 'Ví dụ: Nhóm 1 – Đề tài F03; Chuyên gia hiệu đính văn bản Hán Nôm',
    warningIfMissing: 'Chưa ghi nhận người đóng góp/hiệu đính.',
  },
  {
    key: 'dcDate',
    index: 7,
    englishName: 'Date',
    vietnameseLabel: 'Niên đại',
    meaning: 'Thời điểm tạo lập hiện vật gốc, niên hiệu hoặc năm dựng bia có nguồn đối chiếu.',
    example: 'Ví dụ: Năm 1484 (niên hiệu Hồng Đức thứ 15)',
    warningIfMissing: 'Thiếu niên đại. Nếu chưa có căn cứ xác thực, ghi "Chưa xác định".',
  },
  {
    key: 'dcType',
    index: 8,
    englishName: 'Type',
    vietnameseLabel: 'Loại tư liệu',
    meaning: 'Bản chất hoặc thể loại của đối tượng di sản (Bia Tiến sĩ, Văn bia, Bản dập).',
    example: 'Ví dụ: Bia Tiến sĩ / Di sản tư liệu đá khắc',
    warningIfMissing: 'Chưa phân loại loại tư liệu.',
  },
  {
    key: 'dcFormat',
    index: 9,
    englishName: 'Format',
    vietnameseLabel: 'Định dạng / chất liệu',
    meaning: 'Chất liệu vật lý của hiện vật gốc, kích thước đo đạc hoặc định dạng tệp số.',
    example: 'Ví dụ: Bia đá xanh nguyên khối; Ảnh tư liệu số JPEG',
    warningIfMissing: 'Thiếu thông tin chất liệu hoặc định dạng tệp.',
  },
  {
    key: 'dcIdentifier',
    index: 10,
    englishName: 'Identifier',
    vietnameseLabel: 'Mã định danh',
    meaning: 'Mã định danh duy nhất cố định trong bộ sưu tập (F03-00001 đến F03-00015).',
    example: 'Ví dụ: F03-00001',
    warningIfMissing: 'Thiếu mã định danh chuẩn.',
  },
  {
    key: 'dcSource',
    index: 11,
    englishName: 'Source',
    vietnameseLabel: 'Nguồn gốc',
    meaning: 'Tư liệu gốc, bản dập hoặc hồ sơ lưu trữ cụ thể mà bản mô tả này căn cứ vào.',
    example: 'Ví dụ: Văn khắc Hán Nôm Việt Nam; Hồ sơ kiểm kê riêng của tấm bia',
    warningIfMissing: 'Thiếu thông tin nguồn gốc trực tiếp của tư liệu.',
  },
  {
    key: 'dcLanguage',
    index: 12,
    englishName: 'Language',
    vietnameseLabel: 'Ngôn ngữ',
    meaning: 'Ngôn ngữ trên hiện vật (chữ Hán) và ngôn ngữ mô tả/dịch nghĩa (tiếng Việt).',
    example: 'Ví dụ: Chữ Hán (văn bia gốc); Tiếng Việt (phiên âm, dịch nghĩa và mô tả)',
    warningIfMissing: 'Chưa khai báo ngôn ngữ văn bản.',
  },
  {
    key: 'dcRelation',
    index: 13,
    englishName: 'Relation',
    vietnameseLabel: 'Quan hệ',
    meaning: 'Liên kết tới quần thể 82 Bia Tiến sĩ, bản dập liên quan hoặc hồ sơ cùng khoa thi.',
    example: 'Ví dụ: Thuộc bộ 82 Bia Tiến sĩ Văn Miếu – Quốc Tử Giám; Liên quan bản dập ký hiệu...',
    warningIfMissing: 'Chưa ghi nhận quan hệ với bộ sưu tập hoặc tư liệu liên quan.',
  },
  {
    key: 'dcCoverage',
    index: 14,
    englishName: 'Coverage',
    vietnameseLabel: 'Phạm vi thời gian / không gian',
    meaning: 'Địa điểm lịch sử (địa danh cũ/hiện nay) và khung thời gian nội dung đề cập.',
    example: 'Ví dụ: Thăng Long – Hà Nội; Triều Lê sơ (thế kỷ XV)',
    warningIfMissing: 'Thiếu phạm vi không gian hoặc thời gian.',
  },
  {
    key: 'dcRights',
    index: 15,
    englishName: 'Rights',
    vietnameseLabel: 'Quyền sử dụng',
    meaning: 'Trạng thái bản quyền, quyền công bố ảnh và giới hạn sử dụng theo xác nhận thực tế.',
    example: 'Ví dụ: Chưa xác minh quyền — Cần liên hệ Trung tâm Hoạt động VHKH Văn Miếu – Quốc Tử Giám',
    warningIfMissing: 'Thiếu tuyên bố quyền sử dụng. Mặc định là Chưa xác minh quyền.',
  },
];

export const DEFAULT_COLLECTION_SCOPE: HeritageCollection = {
  id: 'f03-van-mieu',
  name: '15 Bia Tiến sĩ chọn lọc thuộc bộ 82 bia tại Văn Miếu – Quốc Tử Giám',
  materialType: 'Bia Tiến sĩ',
  plannedTotal: 15,
  repositoryName: 'Khu bia Tiến sĩ, Văn Miếu – Quốc Tử Giám',
  repositoryAddress:
    'Khu bia Tiến sĩ, Văn Miếu – Quốc Tử Giám, số 58 Quốc Tử Giám, phường Văn Miếu – Quốc Tử Giám, thành phố Hà Nội',
  rightsContactUnit: 'Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu – Quốc Tử Giám',
  rightsStatus: 'CHƯA XÁC MINH',
  notes:
    'Bộ sưu tập dự kiến gồm 15 bia Tiến sĩ (mã F03-00001 đến F03-00015). Mặc định để trống hồ sơ thật cho tới khi có nguồn riêng và kiểm chứng hợp lệ; tình trạng quyền công bố ảnh hiện tại là CHƯA XÁC MINH.',
  isPublic: true,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_CHECKLIST_QUESTIONS: string[] = [
  'Đã chốt bộ tư liệu (15 bia chọn lọc) và nơi lưu giữ thực tế chưa?',
  'Có ít nhất 15 hồ sơ thật (F03-00001 đến F03-00015), không tính dữ liệu DEMO?',
  'Mỗi hồ sơ đủ 15 trường Dublin Core và các trường phiếu tư liệu tuần 4?',
  'Trang Nguồn có tối thiểu 7 nguồn thật (N01–N07) và nguồn riêng cho từng bia?',
  'Quyền công bố ảnh đã được Trung tâm Hoạt động VHKH Văn Miếu – Quốc Tử Giám xác minh?',
  'Có ảnh thật (toàn cảnh/cận cảnh) kèm nguồn ảnh và quyền sử dụng hợp lệ?',
  'Chức năng Trợ lý Gemini hoạt động thực tế qua máy chủ, không tự bịa thông tin?',
  'Xuất JSON UTF-8, CSV UTF-8 và in/lưu PDF hoạt động đầy đủ và ẩn dữ liệu nhạy cảm?',
  'Website mở và tra cứu được ở cửa sổ ẩn danh (không cần đăng nhập)?',
  'Giao diện hiển thị và thao tác tốt trên điện thoại di động?',
  'Không lộ Gemini API key hoặc thông tin nhạy cảm trong mã nguồn trình duyệt?',
  'Hồ sơ nộp (phiếu từng bản ghi, danh sách 15 phiếu, tóm tắt 1 trang) đã đầy đủ?',
  'Đã kiểm tra vận hành thực tế bằng máy tính/thiết bị khác?',
  'Đã chuẩn bị kịch bản trình bày 4 phút và trả lời 3 câu hỏi phản biện?',
];

export function evaluateRecordCompleteness(
  record: HeritageRecord,
  allSources?: SourceItem[]
): {
  missingDcFields: string[];
  missingArchivalFields: string[];
  warnings: string[];
  hasSufficientEvidence: boolean;
  steleSpecificSourceCount: number;
  collectionSourceOnlyWarning: boolean;
  completionPercent: number;
} {
  const isBlankOrUnknown = (v?: string) => {
    if (!v) return true;
    const t = v.trim().toLowerCase();
    return (
      t === '' ||
      t === 'chưa xác định' ||
      t === 'chưa đủ bằng chứng' ||
      t === 'chưa đủ dữ liệu'
    );
  };

  const missingDcFields: string[] = [];
  for (const spec of DUBLIN_CORE_FIELDS) {
    const val = record[spec.key];
    if (isBlankOrUnknown(typeof val === 'string' ? val : '')) {
      missingDcFields.push(`${spec.index}. ${spec.englishName} (${spec.vietnameseLabel})`);
    }
  }

  const archivalChecks: Array<[string, string | undefined]> = [
    ['Nơi lưu giữ hiện tại', record.currentRepository],
    ['Địa danh cũ / nơi lưu giữ thời điểm tư liệu', record.historicalRepository],
    ['Loại bản đang hiển thị', record.manifestationType],
    ['Tình trạng bản gốc', record.originalCondition],
    ['Mô tả hư hại', record.damageDescription],
    ['Số đăng ký', record.repositoryRegistrationNo],
    ['Đơn vị / người có thẩm quyền', record.rightsAuthority],
    ['Người xác nhận cho phép', record.rightsConfirmedBy],
    ['Ngày xác nhận', record.rightsConsentDate],
    ['Bằng chứng đồng ý', record.rightsEvidence],
    ['Phạm vi sử dụng', record.rightsScope],
    ['Người kiểm chứng', record.verifierName],
    ['Ngày kiểm chứng', record.verifiedDate],
    ['Người số hóa', record.digitizerName],
    ['Ngày số hóa', record.digitizedDate],
    ['Điểm chưa rõ', record.unclearPoints],
  ];

  const missingArchivalFields: string[] = [];
  for (const [label, val] of archivalChecks) {
    if (isBlankOrUnknown(val)) {
      missingArchivalFields.push(label);
    }
  }

  // Kiểm tra nguồn dẫn chứng: loại trừ Tài liệu kỹ thuật / pháp lý; phân biệt nguồn cấp bộ sưu tập vs nguồn cấp từng bia
  const attachedSources = (allSources ?? []).filter((s) =>
    record.sourceIds.includes(s.id)
  );
  const historicalSourcesCount =
    allSources && allSources.length > 0
      ? attachedSources.filter(
          (s) =>
            s.sourceCategory !== 'Tài liệu kỹ thuật' &&
            s.sourceCategory !== 'Tài liệu pháp lý'
        ).length
      : record.sourceIds.length;

  const steleSpecificSourceCount =
    allSources && allSources.length > 0
      ? attachedSources.filter((s) => s.sourceLevel === 'Cấp từng bia').length
      : 0;

  const collectionSourceOnlyWarning =
    historicalSourcesCount >= 2 &&
    allSources !== undefined &&
    allSources.length > 0 &&
    steleSpecificSourceCount === 0;

  const hasSufficientEvidence =
    historicalSourcesCount >= 2 &&
    !collectionSourceOnlyWarning &&
    (record.evidenceMappings?.length ?? 0) > 0;

  const warnings: string[] = [];
  if (missingDcFields.length > 0) {
    warnings.push(
      `Còn ${missingDcFields.length}/15 trường Dublin Core chưa điền hoặc đang "Chưa xác định".`
    );
  }
  if (historicalSourcesCount < 2) {
    warnings.push(
      `Chưa đủ dữ liệu nguồn: mới gắn ${historicalSourcesCount}/2 nguồn lịch sử tối thiểu cho hồ sơ này (không tính tài liệu kỹ thuật/pháp lý).`
    );
  }
  if (collectionSourceOnlyWarning) {
    warnings.push(
      'Đang chỉ gắn nguồn cấp bộ sưu tập (N01–N07). Bắt buộc thu thập và gắn nguồn riêng phù hợp với chính tấm bia này.'
    );
  }
  if ((record.evidenceMappings?.length ?? 0) === 0) {
    warnings.push(
      'Chưa đủ bằng chứng: chưa lập bản ghi kiểm chứng cho từng trường quan trọng (niên đại, nhân vật, địa danh, tình trạng bản gốc).'
    );
  }
  if (
    record.transcriptionVerification !== 'Đã đối chiếu nguồn' &&
    record.transcriptionVerification !== 'Đã kiểm chứng'
  ) {
    warnings.push(`Phiên âm đang ở trạng thái "${record.transcriptionVerification}".`);
  }
  if (
    record.translationVerification !== 'Đã đối chiếu nguồn' &&
    record.translationVerification !== 'Đã kiểm chứng'
  ) {
    warnings.push(`Dịch nghĩa đang ở trạng thái "${record.translationVerification}".`);
  }
  if (record.recordRightsStatus !== 'Đã cấp phép' || !record.allowImagePublish) {
    warnings.push(
      `Quyền công bố ảnh đang ở trạng thái "${record.recordRightsStatus}" — ảnh bị ẩn khỏi website công khai.`
    );
  } else if (record.images.length === 0) {
    warnings.push('Chưa có ảnh tư liệu thật đính kèm.');
  }

  const totalChecks = 15 + archivalChecks.length + 1;
  const passed =
    15 -
    missingDcFields.length +
    (archivalChecks.length - missingArchivalFields.length) +
    (historicalSourcesCount >= 2 ? 1 : 0);

  return {
    missingDcFields,
    missingArchivalFields,
    warnings,
    hasSufficientEvidence,
    steleSpecificSourceCount,
    collectionSourceOnlyWarning,
    completionPercent: Math.round((passed / totalChecks) * 100),
  };
}
