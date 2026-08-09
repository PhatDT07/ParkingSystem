# Parking System (SWP391)

Đây là dự án môn học **SWP391**, được thực hiện bởi nhóm gồm **4 thành viên**.

## 📖 Giới thiệu dự án
**Parking System** là một hệ thống quản lý bãi đỗ xe thông minh hoạt động dựa trên mô hình **Giữ-suất (Booking không giữ ô vật lý cụ thể)**. Hệ thống cho phép người dùng (tài xế) đặt chỗ trước để đảm bảo chắc chắn có chỗ đỗ trong khung giờ mong muốn mà không lo hết chỗ khi đến nơi. 

Hệ thống kết hợp cùng công nghệ Camera AI để nhận diện biển số xe tự động tại cổng ra/vào và giám sát vị trí đỗ thực tế, tối ưu hóa công suất hoạt động của bãi đỗ xe.

### ✨ Các tính năng nổi bật:
- **Cơ chế Đặt chỗ (Booking):** Giữ suất thông minh, cho phép tài xế đặt trước. Số lượng xe vào bãi được kiểm soát dựa trên tổng sức chứa và số suất đã được đặt.
- **Nhận diện biển số tự động:** Sử dụng Camera AI để quét biển số xe khi ra/vào, tự động mở barie nếu xe hợp lệ.
- **Quản lý linh hoạt (Manager/Admin):** Dễ dàng cấu hình giá vé, quản lý quota đặt chỗ cho từng khung giờ, quản lý người dùng và theo dõi hoạt động toàn bãi xe.
- **Hỗ trợ khách vãng lai:** Khách vãng lai (không đặt trước) vẫn có thể sử dụng bãi xe nếu hệ thống tính toán thấy còn đủ chỗ trống (`Walk-in headroom > 0`).

### 👥 Các vai trò trong hệ thống:
- **Driver (Tài xế / Người dùng):** Có thể đặt chỗ trước hoặc gửi xe trực tiếp. Tra cứu lịch sử gửi xe và đặt chỗ.
- **Staff (Nhân viên bảo vệ):** Trực barie, hỗ trợ check-in thủ công khi nhận diện biển số gặp sự cố.
- **Manager (Quản lý bãi xe):** Vận hành, điều chỉnh cấu hình giá vé và quota chỗ trống.
- **Admin (Quản trị viên):** Quản lý tài khoản, phân quyền và cấu hình hệ thống cốt lõi.

---

## 🔗 Links để test ứng dụng:

- **Frontend (Người dùng/Khách hàng):** [https://fe-alpha-dun.vercel.app/](https://fe-alpha-dun.vercel.app/)
- **Driver (Bảo vệ/Tài xế):** [https://parking-driver-tau.vercel.app/driver](https://parking-driver-tau.vercel.app/driver)
- **Backend (API/Server):** [https://parking-backend-l03v.onrender.com/](https://parking-backend-l03v.onrender.com/)
