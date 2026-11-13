# DiSanMeta · Đề tài F03 · PH73027

**Sinh viên:** Trần Trung Hiếu (MSV: PH73027) · Nhóm 1  
**Đề tài:** Công cụ mô tả và kiểm chứng di sản tư liệu số theo chuẩn Dublin Core tiếng Việt  
**Chương trình:** Thực tập sinh Đợt 15 — FPT Polytechnic × IMTA TECH  
**Tính chất:** Dự án xã hội phi lợi nhuận, không quảng cáo, không thương mại.

## Tính năng chính

- **Trang chủ & Thống kê thực tế**: Tìm kiếm nhanh và thống kê tách biệt hồ sơ thật khỏi dữ liệu thử nghiệm (`DEMO`).
- **Danh mục tư liệu (15 trường Dublin Core tiếng Việt)**:
  - Tìm kiếm tiếng Việt có dấu / không dấu, lọc theo niên đại, loại tư liệu, nơi lưu giữ, tình trạng bản gốc, loại bản hiển thị và mức kiểm chứng.
  - Chuyển đổi chế độ **Danh sách** và **Lộ trình 15 bia (`F03-00001` → `F03-00015`)**.
  - Biểu mẫu 4 bước có nút **Điền khung chung Văn Miếu**, gán nguồn chứng minh theo từng trường, kiểm soát dung lượng tài liệu Firestore (`< 950 KB`).
- **Nguồn tư liệu & Quyền công bố**:
  - Khởi tạo sẵn 7 nguồn chính thống cấp bộ sưu tập (`N01–N07` từ UNESCO, Văn Miếu – Quốc Tử Giám, Cục Di sản văn hóa, Bộ VHTT&DL) và 2 tài liệu kỹ thuật/pháp lý tách riêng.
  - Thêm/sửa/xóa nguồn (có xác nhận và cảnh báo hồ sơ đang tham chiếu), kiểm tra URL phía máy chủ, ghi nhận ngày mở đọc thủ công.
  - Quản lý quyền công bố chi tiết và tự động ẩn ảnh trên trang công khai khi chưa xác minh quyền.
- **Trợ lý tra cứu Gemini**: Chạy qua Express server (`/api/gemini/*`), trả lời giới hạn trong dữ liệu đã lưu và không tự xác nhận tính đúng sai lịch sử.
- **Xuất hồ sơ & Hồ sơ nộp bài**: Xuất JSON, CSV (UTF-8 BOM), xem trước bản in A4 và bảng kiểm tra 14 tiêu chí trước khi nộp.

## Chạy ứng dụng trên máy cá nhân

1. Cài đặt **Node.js 20+** và chạy:
   ```bash
   npm install
   ```
2. Sao chép `.env.example` thành `.env` và điền `GEMINI_API_KEY` (tệp `.env` đã nằm trong `.gitignore`).
3. Khởi chạy máy chủ phát triển (Express + Vite tại cổng `3000`):
   ```bash
   npm run dev
   ```
4. Kiểm tra build & TypeScript:
   ```bash
   npm run lint
   npm run build
   ```
