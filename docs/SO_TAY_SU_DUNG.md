# Sổ tay sử dụng nhanh

## Quy trình một kỳ kê khai

1. Vào **Hồ sơ kinh doanh**, kiểm tra mã số thuế, ngành nghề, phương pháp thuế và kỳ khai tháng/quý.
2. Vào **Kỳ kê khai**, kiểm tra kỳ cần làm và hạn nộp. Kỳ không có giao dịch phải hiển thị **Chưa nhập**.
3. Vào **Thu chi & hóa đơn**, nhập doanh thu/chi phí hoặc dùng **Import Excel**. Mỗi dòng cần ngày, nhóm ngành, nội dung, số hóa đơn/chứng từ và số tiền nguyên VND.
4. Xử lý hết cảnh báo thiếu, sai hoặc trùng; xóa giao dịch nhập sai trước khi khóa kỳ.
5. Vào **Kết quả tính thuế**, đối chiếu doanh thu theo ngành, GTGT, thuế thu nhập, đã nộp và còn phải nộp.
6. Khi dữ liệu chính xác, chọn **Khóa kỳ & lưu snapshot**. Kỳ đã khóa không thể thêm, sửa hoặc xóa giao dịch.
7. Vào **Lịch sử & xuất file** để xuất tổng hợp thuế, doanh thu, chi phí, công nợ và sổ kế toán.

## Trạng thái kỳ

- **Chưa nhập:** chưa có giao dịch trong kỳ.
- **Đang nhập:** đã có dữ liệu nhưng chưa gửi kiểm tra/duyệt.
- **Chờ duyệt:** chỉ xuất hiện sau thao tác chủ động gửi duyệt, không được gán sẵn.
- **Đã khóa:** dữ liệu và phiên bản công thức đã được chốt.

## Khi frontend báo không kết nối API

Chạy cả frontend và backend:

```bash
cd /home/tunghs/sontungAI/tax-client
npm run dev:full
```

Badge trên góc phải phải hiển thị `API · http://localhost:8080`.
