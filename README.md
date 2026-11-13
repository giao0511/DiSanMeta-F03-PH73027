# DiSanMeta · F03 · PH73027

**Học viên:** Trần Trung Hiếu · Nhóm 1  
**Đề tài:** Công cụ mô tả tư liệu theo chuẩn Dublin Core tiếng Việt  
**Chương trình:** Thực tập sinh Đợt 15 — FPT Polytechnic × IMTA TECH  
**Loại dự án:** Phi lợi nhuận, không thu phí, không quảng cáo.

## Nội dung đã có trong repository

Bản mã nguồn chạy bằng **Node.js 20+**, không cần cài thư viện ngoài. Đã có:

- Trang chủ, Kho tư liệu, biểu mẫu nhập/sửa/xóa, hồ sơ chi tiết, Nguồn & Ghi nhận, Gemini, Checklist, Giới thiệu.
- **15 trường Dublin Core** kèm tên tiếng Việt, gợi ý, ví dụ; **9 trường bổ sung** về nơi lưu giữ, loại bản, tình trạng bản gốc, đăng ký, quyền và mức kiểm chứng.
- Kiểm tra trường còn thiếu trước khi chuyển bản ghi sang công khai.
- Bản nháp chỉ quản trị được xem; bản ghi có quyền công bố mới xuất hiện ở trang công khai.
- Tìm kiếm, xuất **JSON và CSV**, in phiếu chi tiết qua chức năng in của trình duyệt.
- Gemini gọi từ **máy chủ**, chỉ nhận dữ liệu đã công bố; chưa có API key thì không chạy AI.
- Trang web responsive cho màn hình điện thoại.

**Chưa có trong repository:** 15 bản ghi thật, 7 nguồn thực tế (3 nguồn chính thống), ảnh tư liệu có phép, xác nhận của người lưu giữ, triển khai website công khai hoặc API key Gemini. Đây là phần bắt buộc phải hoàn thiện để nộp bài. **Ứng dụng chưa có chức năng upload ảnh trực tiếp, import JSON hoặc in hàng loạt phiếu**; có thể nhập URL ảnh HTTPS đã được phép công bố và in từng phiếu. Chưa có cơ chế tài khoản đa người dùng.

## Chạy ứng dụng trên máy

1. Cài Node.js phiên bản 20 hoặc mới hơn.
2. Clone repository hoặc tải ZIP mã nguồn GitHub.
3. Copy file \`.env.example\` thành \`.env\`.
4. Thay \`ADMIN_PASSWORD\` bằng mật khẩu dài, bí mật (không dùng giá trị mẫu).
5. Tùy chọn: đặt \`GEMINI_API_KEY\` vào \`.env\`. **Không commit file \`.env\`.**
6. Từ thư mục gốc chạy:

\`\`\`bash
npm start
\`\`\`

Sau đó vào **http://127.0.0.1:3000**. Dùng nút **Đăng nhập quản trị** để nhập mật khẩu ở \`.env\`.

## Gemini

Cấu hình trên máy chủ:

\`\`\`ini
GEMINI_API_KEY=YOUR_PRIVATE_API_KEY
GEMINI_MODEL=gemini-2.5-flash
\`\`\`

Model có thể đổi tùy tình trạng API của Google. **Không đặt API key trong tệp JavaScript phía trình duyệt.** Gemini có thể trả lời sai dù đã được ràng buộc nguồn, vì vậy cần kiểm tra thủ công ít nhất ba câu hỏi (gồm câu hỏi ngoài dữ liệu).

## Cách hoàn thiện bài tuần 4

1. **M1 — 13/11:** Chọn khối tư liệu hoặc bộ hiện vật **cụ thể**, nơi lưu giữ hiện nay và người/cơ quan quản lý. Xin phép đăng tư liệu/ảnh.
2. **M2 — 14/11:** Chuẩn bị tối thiểu **15 bản ghi thật**, **7 nguồn**, trong đó **3 nguồn chính thống**; kiểm chứng, chốt trường dữ liệu.
3. **M3 — 16/11:** Nhập bản ghi và đưa ảnh thật được phép lên web. Điền đủ 15 trường Dublin Core và 9 trường bổ sung. Không đăng bản chưa được phép.
4. **M4 — 17/11:** Hoàn thiện Gemini, xuất JSON/CSV, triển khai lần đầu và kiểm tra đường dẫn từ máy khác.
5. **M5 — trước 22:00 18/11:** Kiểm chứng nguồn/quyền, kiểm tra bảo mật, sao lưu mã nguồn/tư liệu, nộp hồ sơ.
6. **Nghiệm thu — 14:00 19/11/2026:** 4 phút trình bày trực tuyến và 3 phút trả lời câu hỏi.

**Hồ sơ nộp:** URL công khai, file dữ liệu xuất, phiếu cho toàn bộ bản ghi, bản mô tả tối đa 1 trang, ba ảnh chụp màn hình, danh sách người cho phép công bố và phạm vi (nếu tự số hóa), mã nguồn hoặc link GitHub.

Mẫu báo cáo và báo tin đi kèm ở \`BAO_CAO_1_TRANG_MAU.md\` và \`MAU_BAO_TIN_HANG_NGAY.md\`.

## Kiểm thử

\`\`\`bash
npm test
\`\`\`

Bài kiểm thử tích hợp kiểm tra API, phân quyền, tính riêng tư của bản nháp và thao tác tạo/xóa bản ghi. **Không thể xác nhận đã chạy CI trên GitHub** cho đến khi có kết quả workflow; cần chạy tại máy hoặc môi trường triển khai. Nhớ thử thực tế trên điện thoại, in phiếu, xuất file, Gemini và link ẩn danh.

## Triển khai

Đây là ứng dụng có **backend Node.js** nên không chạy đầy đủ bằng GitHub Pages đơn thuần. Cần host chạy Node.js (Render, Railway, VPS...). Đặt \`HOST=0.0.0.0\`, \`ADMIN_PASSWORD\` và \`GEMINI_API_KEY\` bằng **secret environment variables** trong dịch vụ host. File \`data/store.json\` lưu dữ liệu tại máy chủ, nên cần **persistent disk**; hosting lưu tạm có thể làm mất dữ liệu sau restart/deploy. Chỉ công bố link HTTPS. Không gửi mật khẩu quản trị hoặc API key vào chat.

## Lưu ý về quyền

Mỗi tư liệu phải chỉ ra được nơi lưu giữ, loại bản, tình trạng bản gốc và người cho phép. Dữ liệu được mở công khai không đương nhiên có quyền sao chép. Không dùng hình AI giả làm hiện vật thật, không công bố tư liệu riêng tư hoặc vị trí cất giữ hiện vật quý khi chưa được phép. Nếu không chắc quyền, để bản ghi ở trạng thái **Bản nháp**.

## GitHub → Google AI Studio

Vào Google AI Studio Build, chọn chức năng import từ GitHub (nếu tài khoản đang hỗ trợ) và chọn repository này. Vì dự án có backend Node.js, AI Studio có thể cần chuyển đổi hoặc điều chỉnh quá trình chạy và triển khai. Import không đảm bảo toàn bộ chức năng chạy ngay.
