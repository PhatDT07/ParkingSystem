Dưới đây là phần giải thích chi tiết về **nội dung code và mục đích** của từng commit do bạn (Dang Thanh Phat) làm (từ mới nhất đến cũ nhất):

### 1. Commit `3f6272b` (Ngày 22/07/2026)

**`feat(driver): migrate driver features to MongoDB (Price Lock, Penalty, Quota limits)`**

- **Mục đích**: Bổ sung các nghiệp vụ cốt lõi của tính năng đặt chỗ (driver) sau khi dự án chuyển sang dùng MongoDB.
- **Code đã viết**:
  - `ReservationService.java`: Thêm logic giới hạn Quota (chỉ cho phép 1 tài khoản có tối đa 3 vé đang hoạt động) và bắt lỗi trùng biển số `LICENSE_PLATE_OVERLAP`.
  - `ReservationController.java`: Mở thêm API `/extend` để khách hàng (Driver) có thể tự động gia hạn thêm giờ (`newExitTime`).
  - `SessionService.java`: Cập nhật logic tính phí phạt (`Penalty`) vào hàm Checkout khi khách lấy xe ra trễ so với giờ dự kiến ban đầu, đồng thời hỗ trợ "khóa giá" dựa theo khung giờ lúc đặt vé.

### 2. Commit `44ffc99` (Ngày 23/06/2026)

**`fix(driver): them jsonignore vao cac entity de tranh loi serialize proxy`**

- **Mục đích**: Sửa lỗi văng Exception (vòng lặp vô tận hoặc lỗi proxy) khi trả dữ liệu JSON về cho Frontend.
- **Code đã viết**:
  - `Feedback.java` & `Payment.java`: Gắn thêm annotation `@JsonIgnore` vào các trường chứa quan hệ (relationships/mapping) trỏ ngược lại đối tượng cha để Jackson (thư viện parse JSON) không bị đệ quy vô hạn khi parse ra JSON.

### 3. Commit `4a362dd` (Ngày 23/06/2026)

**`fix(driver): them transactional annotation de tranh lazy init exception`**

- **Mục đích**: Sửa lỗi Hibernate/MongoDB `LazyInitializationException` khi chọc vào DB.
- **Code đã viết**:
  - Gắn annotation `@Transactional` vào đầu các class `FeedbackDriverService`, `PaymentDriverService`, `SessionDriverService` để đảm bảo transaction của database luôn được giữ nguyên (Open) trong suốt vòng đời của function, cho phép load các dữ liệu lười (Lazy fetch) mà không bị lỗi đứt gánh.

### 4. Commit `8649819` (Ngày 23/06/2026)

**`feat(driver): them module thanh toan va phan hoi`**

- **Mục đích**: Code từ đầu 2 chức năng lớn cho App của Driver: Xem/Thanh toán hóa đơn và Gửi phản hồi (Feedback) cho bãi xe.
- **Code đã viết**:
  - `PaymentDriverController` / `PaymentDriverService`: Tạo API hiển thị hóa đơn đỗ xe cho Driver và xử lý luồng (flow) xác nhận thanh toán.
  - `FeedbackDriverController` / `FeedbackDriverService`: Tạo API cho phép tài xế nhập nội dung, rate sao (đánh giá) về chất lượng dịch vụ của bãi đỗ.
  - Tạo các DTO (`PaymentRequest`, `FeedbackRequest`) để map dữ liệu chuẩn từ Frontend gửi lên.

### 5. Commit `7258b33` (Ngày 23/06/2026)

**`feat(driver): them quan ly phien gui xe va pricing service`**

- **Mục đích**: Xây dựng module Tính tiền tự động và cho phép Driver xem lịch sử/tình trạng đỗ xe hiện tại.
- **Code đã viết**:
  - `PricingService`: File dùng để chứa thuật toán tính tiền đỗ xe dựa trên loại xe, thời gian gửi, và bảng giá (có tính cả block giờ mốc).
  - `SessionDriverController` / `SessionDriverService`: Tạo API `/api/driver/sessions` để Driver vào app thấy được chiếc xe của mình đang đỗ ở đâu, vào lúc mấy giờ, và tiền gửi hiện tại (tạm tính) là bao nhiêu.
  - Viết ra các DTO (`ParkingSessionDTO`, `SessionDetailResponse`) để bọc dữ liệu gọn gàng khi ném về cho Client.
