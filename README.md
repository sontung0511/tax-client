# Thuế Nhẹ Nhàng

MVP quản lý kê khai thuế hộ kinh doanh bằng Next.js, TypeScript và Tailwind CSS.

## Chạy local

```bash
npm install
npm run dev
```

Đăng nhập bằng `demo` / `demo123`. Mặc định frontend gọi backend Go tại `http://localhost:8080`.

Có thể đổi URL backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

Hoặc chạy cả frontend và backend bằng một lệnh: `npm run dev:full`.

Chỉ dùng localStorage khi chủ động chạy `NEXT_PUBLIC_USE_LOCAL_MOCK=true npm run dev`.

## Kiến trúc

- `src/domain`: kiểu dữ liệu; mọi khoản tiền là số nguyên VND.
- `src/repositories`: abstraction lưu trữ, có thể thay `LocalTaxRepository` bằng API backend.
- `src/services/tax-api.ts`: contract API duy nhất mà giao diện sử dụng.
- `src/repositories/http-tax-repository.ts`: adapter mặc định gọi backend Go; local repository chỉ bật bằng cờ demo.
- `src/tax-engine`: cấu hình theo năm/ngành và hàm tính thuế thuần.

Mỗi giao dịch doanh thu có nhóm ngành riêng. Rule thuế có năm hiệu lực, ngưỡng doanh thu và mã phiên bản; khi khóa kỳ, kết quả cùng phiên bản rule được lưu thành snapshot để thay đổi chính sách sau này không làm đổi kỳ cũ. Bộ kiểm tra cảnh báo dữ liệu thiếu/sai/trùng trước import và trước khi khóa kỳ. File xuất gồm tổng hợp thuế, doanh thu, chi phí, công nợ và nhóm sổ kế toán phù hợp; ứng dụng không tự động nộp lên Thuế điện tử.

Màn hình Sổ sách & công nợ tổng hợp dòng tiền, công nợ, tồn kho và chọn đúng nhóm sổ theo Thông tư 152/2025/TT-BTC: S1a-HKD, S2a-HKD hoặc S2b–S2e-HKD tùy phương pháp thuế trong Hồ sơ.

Tham chiếu hồ sơ/thủ tục: Thông tư 18/2026/TT-BTC và Thông tư 50/2026/TT-BTC. Việc ánh xạ biểu mẫu/tỷ lệ phải được nghiệp vụ xác nhận theo văn bản gốc trước production.

## Chế độ doanh nghiệp

Trong Hồ sơ có thể chuyển đối tượng sang doanh nghiệp/công ty và khai báo loại hình, phương pháp GTGT, chế độ kế toán. Module tờ khai doanh nghiệp hiện quản lý bản nháp, kiểm tra cơ bản và khóa phiên bản cho 01/GTGT, 05/KK-TNCN và 03/TNDN. Kết xuất XML và mã vạch đang chủ động tắt cho đến khi có schema/quy tắc chính thức và bộ test đối chiếu HTKK/iTaxViewer.

> Tỷ lệ thuế hiện tại chỉ phục vụ prototype, cần được nghiệp vụ xác nhận trước khi dùng thực tế.
