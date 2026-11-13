# DiSanMeta · F03 · Trần Trung Hiếu · PH73027

**Đề tài:** Công cụ mô tả tư liệu theo chuẩn Dublin Core tiếng Việt  
**Chương trình:** Thực tập sinh Đợt 15, FPT Polytechnic × IMTA TECH  
**Chủ đề chung:** Di sản tư liệu và bảo tàng số  
**Loại dự án:** Xã hội phi lợi nhuận, không thu phí, không quảng cáo.

## 1. Đây là gì?

Ứng dụng web quản lý mô tả một **khối tư liệu hoặc bộ hiện vật có thật, đang lưu giữ ở một địa điểm cụ thể**. Trọng tâm riêng của đề tài F03 là biểu mẫu **15 trường Dublin Core bằng tiếng Việt**, kèm giải thích/ví dụ, kiểm tra dữ liệu thiếu, lưu, tìm kiếm, sửa, in phiếu và xuất JSON/CSV. Yêu cầu chung tuần 4 còn có 9 trường bổ sung, ảnh thật, quyền công bố, nguồn chính thống, Gemini và đường dẫn công khai.

**Bản giao mã nguồn này chưa phải bài nộp đã hoàn tất:** hiện không có bộ tư liệu 15 bản ghi thật, nguồn đã kiểm chứng, giấy phép ảnh, API key Gemini hoặc URL website được triển khai. Không được dùng dữ liệu giả để thay thế. Những phần đó cần người làm bài xác nhận và nạp vào.

## 2. Chạy trên máy tính (không cần cài thư viện)

1. Cài **Node.js 20 trở lên**.
2. Giải nén file ZIP và mở Terminal/CMD tại thư mục có `server.mjs`.
3. Copy `.env.example` thành `.env`.
4. Trong `.env`, **thay `ADMIN_PASSWORD` bằng mật khẩu dài, bí mật**. Khóa Gemini là tùy chọn để xem giao diện, nhưng **bắt buộc** để nghiệm thu tính năng AI.
5. Gõ `npm start`.
6. Truy cập `http://127.0.0.1:3000`.
7. Nhấn **Đăng nhập quản trị**, nhập mật khẩu ở `.env`.

Ứng dụng sử dụng máy chủ Node.js thuần, không có `npm install` và không cần thêm dependency. Các thay đổi được lưu vào `data/*.json`, ảnh xem trước được lưu trong `uploads/*.jpg`.

```bash
cp .env.example .env
# sửa .env bằng trình soạn thảo của bạn
npm start
```

> Trên Windows, có thể dùng File Explorer để sao chép `.env.example` thành `.env`, rồi mở CMD và chạy `npm start`.

## 3. Thiết lập Gemini

Tạo API key tại [Google AI Studio](https://aistudio.google.com/app/apikey), ghi vào **máy chủ**, chỉ bên trong `.env`:

```ini
GEMINI_API_KEY=YOUR_PRIVATE_API_KEY
GEMINI_MODEL=gemini-3.8-flash
```

Có thể đổi tên model khi Google thay danh sách hỗ trợ. Máy chủ gọi Gemini REST API, khóa **không nằm trong HTML/JavaScript phía trình duyệt**. Tính năng Trợ lý Gemini chỉ truy vấn các bản ghi đã công bố, không dùng bản nháp hoặc dữ liệu riêng tư.

AI được ra lệnh phải trả lời từ JSON đã nạp và ghi mã, nơi lưu giữ, loại bản; **không có cách nào đảm bảo tuyệt đối AI không sai**, nên phải thử tối thiểu 3 câu hỏi thực tế và kiểm tra thủ công, gồm 1 câu hỏi ngoài dữ liệu.

## 4. Quy trình nhập dữ liệu đúng yêu cầu

**Bước A — Chốt M1:** Đăng nhập quản trị > Tổng quan > Chỉnh sửa > nhập rõ tên bộ tư liệu, cơ quan/người giữ, nơi lưu giữ hiện nay, người phụ trách. Chọn một khối cụ thể, không ghi chung chung "di sản Việt Nam". Trao đổi với Phó nhóm để xác nhận phạm vi.

**Bước B — Thu thập M2:** Mục Nguồn & ghi nhận > thêm ít nhất **7 nguồn có thật**, trong đó ít nhất **3 nguồn chính thống**. Nếu chỉ sử dụng tư liệu đã được cơ quan công bố, đối chiếu giấy phép và điều kiện sử dụng; không mặc định ảnh công khai = ảnh được sử dụng tự do. Chuẩn bị **15 tư liệu thật** nằm trong cùng bộ, mỗi bản ghi có nguồn xác minh và giấy phép phù hợp.

**Bước C — Nhập bản ghi:** Kho tư liệu > Thêm bản ghi. Điền 15 trường lõi Dublin Core, 9 trường bổ sung, liên kết nguồn; chọn ảnh thật và chú thích/nguồn. Hãy chọn **Lưu nháp** nếu chưa có phép hoặc chưa đủ thông tin. Chỉ đánh dấu **Đã xác minh quyền công bố** nếu có căn cứ, rồi Lưu & công bố. Ảnh tải lên sẽ tự nén thành bản xem trước (JPEG ~500KB); giữ bản gốc nguyên vẹn ở ít nhất 2 nơi khác.

**Bước D — Kiểm tra M3/M4:** Trình duyệt bình thường xem được các bản đã công bố; có ít nhất 4 chức năng: Kho tư liệu, Chi tiết, Trợ lý AI, Nguồn, cộng Biểu mẫu và Tổng quan. Thử tìm kiếm theo từ khóa. Dùng nút **Xuất JSON** / **Xuất CSV** và mở lại file. Thử Gemini với câu hỏi có dữ liệu và câu hỏi không có dữ liệu.

**Bước E — Nộp M5:** Kiểm thử link, ảnh, ghi nhận quyền và tính tương thích điện thoại. Gói hồ sơ nêu ở mục 6, nộp **trước 22:00 thứ Tư 18/11/2026**. Nghiệm thu trực tuyến **14:00 thứ Năm 19/11/2026**, 4 phút demo + 3 phút trả lời.

## 5. Đối chiếu yêu cầu tài liệu tuần 4

| Yêu cầu | Tình trạng trong mã nguồn |
|---|---|
| 15 trường Dublin Core, tiếng Việt, có chú giải ví dụ | **Đã code** tại Biểu mẫu |
| Các trường bổ sung: nơi giữ, bản gốc/sao/số, tình trạng, đăng ký, quyền, phần không công bố, kiểm chứng | **Đã code** tại Biểu mẫu và Chi tiết |
| Website 4+ màn hình / chức năng | **Đã code**: 6 menu + trang chi tiết |
| Nhập, tìm kiếm, xem, sửa, xóa, lưu bản ghi | **Đã code**, cần đăng nhập quản trị để ghi |
| Xuất JSON/CSV, import JSON, in phiếu | **Đã code**, cần kiểm thử trên dữ liệu thật |
| Hình ảnh có chú thích/nguồn; ảnh preview ~500 KB | **Đã code**, nội dung ảnh và quyền do người làm bài cung cấp |
| 15 bản ghi thật cùng khối tư liệu | **Chưa có** — cần thu thập |
| 7 nguồn, trong đó 3 chính thống, nguồn mở được | **Có chức năng**, **chưa có danh mục nguồn** |
| Người cho phép công bố, phạm vi rõ | **Có biểu mẫu và khóa công bố**, **chưa có giấy phép thật** |
| Ứng dụng công khai bằng URL | **Chưa triển khai**, cần hosting Node.js |
| Gemini trả lời dựa vào tư liệu | **Đã code endpoint**, cần `GEMINI_API_KEY` + kiểm thử |
| API key không nằm phía trình duyệt | **Đã thiết kế** đặt server-side |
| Giới thiệu học viên, MSV, Nhóm 1, phi lợi nhuận | **Đã code** |
| Bản gốc lưu riêng 2 nơi, mức kiểm chứng | **Có hướng dẫn và trường theo dõi**, việc sao lưu thực tế do người làm bài |
| Bản mô tả 1 trang, 3 ảnh màn hình, danh sách người cho phép | **Có mẫu/hướng dẫn**, cần tạo theo bản hoàn chỉnh |
| 4 phút demo, 3 phút phản biện | **Có hướng dẫn**, cần luyện tập |
| Phó nhóm xác nhận kiểm tra chéo | **Cần thực hiện thực tế** |

## 6. Hồ sơ nộp (theo mục XIII.2)

1. URL công khai (mở được ở chế độ ẩn danh).
2. JSON/CSV xuất từ ứng dụng.
3. Phiếu của tất cả bản ghi (trang Chi tiết > In phiếu hoặc từ dữ liệu xuất).
4. Bản mô tả sản phẩm tối đa 1 trang: xem `BAO_CAO_1_TRANG_MAU.md`.
5. Ba ảnh màn hình chức năng chính **chụp từ bản đã nhập dữ liệu thật**.
6. Danh sách người cho phép công bố và phạm vi đối với tư liệu tự số hoá.
7. Link repository hoặc ZIP mã nguồn nếu có.

## 7. Đưa lên Internet

Vì có backend Node.js và tệp ảnh lưu trên máy chủ, **không thể chỉ tải `index.html` lên GitHub Pages** rồi có đủ chức năng. Cần một dịch vụ triển khai Node.js (Render, Railway, VPS hoặc tương đương), đặt:

- Lệnh start: `npm start`
- `HOST=0.0.0.0`
- `PORT` do nền tảng cấp hoặc mặc định 3000
- `ADMIN_PASSWORD` là mật khẩu mạnh bí mật
- `GEMINI_API_KEY` trong **server environment**, tuyệt đối không đưa lên GitHub
- **Bắt buộc cấu hình ổ đĩa lưu trữ bền vững** cho `data/` và `uploads/`, hoặc tự chuyển sang cơ sở dữ liệu/object storage. Hosting có hệ thống file tạm có thể xóa mất dữ liệu sau khi restart/deploy.
- HTTPS cho trang công khai, vì quản trị gửi mật khẩu trong header.

Sau khi triển khai, mở URL trên cửa sổ ẩn danh và máy/điện thoại khác. Không gửi mật khẩu quản trị cho người lạ; trong nghiệm thu người trình bày tự đăng nhập để demo phần chỉnh sửa.

## 8. Vấn đề quyền và an toàn cần nhớ

- **Không** đưa địa chỉ cất giữ chi tiết của hiện vật quý, dữ liệu cá nhân nhạy cảm, hoặc nội dung bị chủ sở hữu yêu cầu giữ kín vào web.
- Mục "Ghi chú nội bộ" được loại khỏi API công khai; chỉ tài khoản quản trị thấy.
- Ảnh chưa được phép thì không đăng và không tạo ảnh AI giả thay thế.
- Khi chủ sở hữu rút phép, sửa bản ghi thành nháp, xóa ảnh công khai và xóa bản upload khỏi máy chủ khi cần. Ứng dụng chưa có tính năng dọn tệp ảnh mồ côi tự động, phải kiểm tra thư mục `uploads/`.
- Địa chỉ URL ngoài cần được kiểm tra thực tế về khả năng truy cập, nội dung và giấy phép. Ứng dụng không thể tự xác minh tư cách "chính thống" của một trang.
- Mật khẩu quản trị dùng chung chỉ phù hợp đồ án nhỏ; nếu vận hành lâu dài hoặc nhiều người chỉnh sửa, nâng cấp tài khoản người dùng/phân quyền và cơ sở dữ liệu.

## 9. Kiểm thử nhanh

```bash
npm test
```

Bạn cũng nên kiểm thử thủ công trên Chrome/Edge và điện thoại: tạo nguồn, điền một bản ghi nháp, sửa, tìm kiếm, xuất tệp, kiểm tra ảnh, thử câu hỏi Gemini, kiểm tra URL ẩn danh.