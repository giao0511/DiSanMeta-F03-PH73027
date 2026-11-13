import type { SourceItem } from '../types/heritage';

/**
 * 7 NGUỒN THẬT KHỞI TẠO SẴN CẤP BỘ SƯU TẬP (N01–N07)
 * Lưu ý học thuật: Đây là các nguồn cấp bộ sưu tập (chứng minh giá trị di sản tổng quan của 82 Bia Tiến sĩ).
 * Không tự gắn 2 nguồn chung để hợp thức hóa thông tin chi tiết của từng bia; phải tiếp tục thu thập nguồn riêng cho từng bia.
 * Trạng thái mặc định là "Chưa xác minh liên kết" / "Chờ kiểm chứng" cho đến khi quản trị viên kiểm tra và đối chiếu thực tế.
 */
export const INITIAL_COLLECTION_SOURCES: SourceItem[] = [
  {
    id: 'N01',
    organizationOrAuthor: 'UNESCO (Chương trình Ký ức Thế giới)',
    documentTitle: 'Stone Stele Records of Royal Examinations of the Le and Mac Dynasties (1442–1779)',
    urlOrArchiveCode:
      'https://www.unesco.org/en/memory-world/stone-stele-records-royal-examinations-le-and-mac-dynasties-1442-1779',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Chính thống',
    sourceLevel: 'Cấp bộ sưu tập',
    provableScope:
      'Nguồn cấp bộ sưu tập: chứng minh việc UNESCO ghi danh Di sản tư liệu thế giới đối với 82 bia Tiến sĩ triều Lê – Mạc (1442–1779). Không thay thế nguồn riêng cho từng tấm bia.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Nguồn quốc tế chính thống cấp bộ sưu tập. Cần kiểm tra liên kết và đối chiếu thủ công.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'N02',
    organizationOrAuthor: 'UNESCO (Hồ sơ đề cử Di sản tư liệu thế giới)',
    documentTitle:
      'Nomination Form: Stone Stele Records of Royal Examinations of the Le and Mac Dynasties (1442–1779)',
    urlOrArchiveCode:
      'https://media.unesco.org/sites/default/files/webform/mow001/vietnam_stone_stele_records_royal_examinations_le_mac_dynasties.pdf',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Chính thống',
    sourceLevel: 'Cấp bộ sưu tập',
    provableScope:
      'Nguồn cấp bộ sưu tập: hồ sơ đề cử chính thức mô tả lịch sử hình thành, tiêu chí di sản và thông tin tổng thể bộ 82 bia. Cần tải/đọc trang cụ thể khi dẫn chứng.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Tài liệu PDF hồ sơ đề cử UNESCO. Chưa tự nhận đã đọc toàn bộ nội dung.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'N03',
    organizationOrAuthor: 'Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu – Quốc Tử Giám',
    documentTitle: 'Khu nội tự & Khu bia Tiến sĩ — Văn Miếu – Quốc Tử Giám',
    urlOrArchiveCode: 'https://vanmieu.gov.vn/vi/inner-temple',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Chính thống',
    sourceLevel: 'Cấp bộ sưu tập',
    provableScope:
      'Nguồn từ đơn vị trực tiếp quản lý di tích: chứng minh nơi lưu giữ hiện nay tại Khu bia Tiến sĩ, Văn Miếu – Quốc Tử Giám và đầu mối liên hệ quyền công bố.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Cổng thông tin của đơn vị quản lý di tích. Chưa bao gồm văn bản cấp phép đăng tải ảnh.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'N04',
    organizationOrAuthor: 'Cục Di sản văn hóa (Bộ Văn hóa, Thể thao và Du lịch)',
    documentTitle: 'Bia đề danh Tiến sĩ tại Văn Miếu – Quốc Tử Giám, Hà Nội',
    urlOrArchiveCode:
      'https://dsvh.gov.vn/bia-de-danh-tien-si-tai-van-mieu-quoc-tu-giam-ha-noi-3109',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Chính thống',
    sourceLevel: 'Cấp bộ sưu tập',
    provableScope:
      'Nguồn cơ quan quản lý nhà nước: chứng minh xếp hạng di sản, giá trị lịch sử – văn hóa tổng quan và khung niên đại bộ sưu tập 82 bia Tiến sĩ.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Nguồn chính thống cấp bộ sưu tập từ Cục Di sản văn hóa.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'N05',
    organizationOrAuthor: 'Cục Di sản văn hóa (Bộ Văn hóa, Thể thao và Du lịch)',
    documentTitle: 'Danh mục Di sản tư liệu Việt Nam được UNESCO ghi danh',
    urlOrArchiveCode: 'https://dsvh.gov.vn/di-san-tu-lieu-1761',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Chính thống',
    sourceLevel: 'Cấp bộ sưu tập',
    provableScope:
      'Nguồn cơ quan quản lý nhà nước: chứng minh vị trí của 82 Bia Tiến sĩ trong danh mục Di sản tư liệu quốc gia/thế giới.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Nguồn danh mục di sản tư liệu chính thống.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'N06',
    organizationOrAuthor: 'Cục Di sản văn hóa (Bộ Văn hóa, Thể thao và Du lịch)',
    documentTitle: 'Di tích lịch sử và kiến trúc nghệ thuật Văn Miếu – Quốc Tử Giám',
    urlOrArchiveCode:
      'https://dsvh.gov.vn/di-tich-lich-su-va-kien-truc-nghe-thuat-van-mieu-quoc-tu-giam-2953',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Chính thống',
    sourceLevel: 'Cấp bộ sưu tập',
    provableScope:
      'Nguồn cơ quan quản lý nhà nước: chứng minh thông tin di tích quốc gia đặc biệt Văn Miếu – Quốc Tử Giám và bối cảnh không gian lưu giữ.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Nguồn cấp bộ sưu tập về di tích lưu giữ.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'N07',
    organizationOrAuthor: 'Bộ Văn hóa, Thể thao và Du lịch',
    documentTitle: 'Bia Tiến sĩ Văn Miếu là Di sản tư liệu thế giới',
    urlOrArchiveCode:
      'https://bvhttdl.gov.vn/bia-tien-si-van-mieu-la-di-san-tu-lieu-the-gioi-618.htm',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Chính thống',
    sourceLevel: 'Cấp bộ sưu tập',
    provableScope:
      'Nguồn cổng thông tin Bộ VHTTDL: chứng minh thông tin công bố chính thức về sự kiện ghi danh bộ sưu tập Bia Tiến sĩ Văn Miếu.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Nguồn báo/cổng thông tin chính thống của Bộ VHTTDL cấp bộ sưu tập.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
];

/**
 * TÀI LIỆU KỸ THUẬT VÀ TÀI LIỆU PHÁP LÝ (PHÂN LOẠI RIÊNG)
 * Tuyệt đối KHÔNG tính là bằng chứng lịch sử cho từng tấm bia.
 */
export const TECHNICAL_AND_LEGAL_SOURCES: SourceItem[] = [
  {
    id: 'TECH-DCMI',
    organizationOrAuthor: 'Dublin Core Metadata Initiative (DCMI)',
    documentTitle: 'DCMI Metadata Terms (Tài liệu chuẩn kỹ thuật 15 trường Dublin Core)',
    urlOrArchiveCode: 'https://www.dublincore.org/specifications/dublin-core/dcmi-terms/',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Tài liệu kỹ thuật',
    sourceLevel: 'Kỹ thuật / Pháp lý',
    provableScope:
      'Tài liệu kỹ thuật: quy chuẩn định nghĩa 15 yếu tố siêu dữ liệu Dublin Core. KHÔNG sử dụng làm bằng chứng lịch sử cho bia Tiến sĩ.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Phân loại riêng làm chuẩn kỹ thuật biên mục siêu dữ liệu.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'LAW-45-2024',
    organizationOrAuthor: 'Quốc hội nước CHXHCN Việt Nam (Cổng TTĐT Chính phủ)',
    documentTitle: 'Luật Di sản văn hóa số 45/2024/QH15',
    urlOrArchiveCode: 'https://vanban.chinhphu.vn/?docid=212473&pageid=27160',
    accessDate: 'Chưa xác định',
    sourceCategory: 'Tài liệu pháp lý',
    sourceLevel: 'Kỹ thuật / Pháp lý',
    provableScope:
      'Tài liệu pháp lý: quy định về bảo vệ, số hóa và quyền công bố di sản văn hóa. KHÔNG sử dụng làm bằng chứng lịch sử cho từng bia.',
    verificationStatus: 'Chờ kiểm chứng',
    lastLinkCheckResult: 'Chưa xác minh liên kết',
    notes: 'Phân loại riêng làm căn cứ pháp lý và quy trình xin phép công bố.',
    isPublic: true,
    isBuiltIn: true,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  },
];

export const BUILTIN_SOURCES: SourceItem[] = [
  ...INITIAL_COLLECTION_SOURCES,
  ...TECHNICAL_AND_LEGAL_SOURCES,
];
