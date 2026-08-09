# Tài liệu Chuyên sâu Module Driver (Tài xế) - SWP391

Tài liệu này đi sâu vào **chi tiết từng dòng code** của luồng hoạt động phân hệ Driver. Mục tiêu là giúp bạn nắm rõ request đi từ FE xuống BE như thế nào, xử lý qua những Class/Service nào, và thuật toán cốt lõi là gì.

*Lưu ý:* Tất cả các API (trừ Webhook) đều yêu cầu Header: `Authorization: Bearer <JWT_TOKEN>`. Base path là `/api/driver`.

---

## Luồng 1: Xác thực & Hồ sơ cá nhân (Auth & Profile)

Luồng này phục vụ việc người dùng xem và cập nhật thông tin cá nhân.

### 1.1 Lấy thông tin cá nhân
*   **API:** `GET /api/driver/profile`
*   **Luồng hoạt động (FE):** Khi vào trang `/profile`, React Hook Form sẽ gọi API này (thông qua `useProfile.ts`) để lấy `fullName`, `phone`, `email` fill sẵn vào form.
*   **Luồng Code (BE):**
    *   **Nhận Request:** `ProfileController.java` -> `@GetMapping public ApiResponse<ProfileDTO> getProfile(Principal principal)`
    *   **Xử lý (ProfileService.java):**
        1. Lấy `username` từ `Principal` (được Spring Security tự động giải mã từ JWT token).
        2. Gọi `userRepository.findByUsername(username)` để tìm bản ghi User trong DB.
        3. Convert thực thể `User` sang `ProfileDTO` và trả về dạng JSON.

### 1.2 Cập nhật thông tin cá nhân
*   **API:** `PUT /api/driver/profile`
*   **Payload (JSON):** `{ "fullName": "Nguyễn Văn A", "phone": "0901234567" }`
*   **Luồng hoạt động (FE):** Sau khi sửa form, nhấn "Lưu", gọi API PUT. Nếu thành công, update lại Zustand store để đổi tên hiển thị ở Avatar/Header ngay lập tức mà không cần F5.
*   **Luồng Code (BE):**
    *   **Nhận Request:** `ProfileController.java` -> `@PutMapping public ApiResponse<ProfileDTO> updateProfile(...)`
    *   **Xử lý (ProfileService.java):**
        1. Lấy `username` từ `Principal`, tìm `User`.
        2. Kiểm tra các trường gửi lên, nếu có thì gán (set) giá trị mới vào `User`.
        3. Gọi `userRepository.save(user)` để UPDATE xuống Database.

---

## Luồng 2: Tra cứu & Đặt chỗ (Booking & Availability)

Đây là luồng quan trọng nhất, liên quan đến thuật toán giữ suất đỗ xe.

### 2.1 Lấy danh sách chỗ trống (Headroom)
*   **API:** `GET /api/driver/parking-info`
*   **Luồng hoạt động (FE):** Trang chủ gọi hook `useAvailability.ts` để hiển thị thẻ "Ô tô 4 chỗ: Còn 15 chỗ". FE hoàn toàn thụ động, lấy data hiển thị, không tự tính.
*   **Luồng Code (BE - `ParkingInfoService.java`):**
    1. Lấy toàn bộ `VehicleType` (loại xe).
    2. Với mỗi loại xe, đếm số ô **không bảo trì** (`capacity = slotRepository.countByStatusNot('Maintenance')`).
    3. Đếm số xe đang đỗ (`inside = count_session_Admitted_Parked`).
    4. Đếm số booking chờ (`outstanding = count_reservation_Pending_Confirmed_hien_tai`).
    5. Trả về: `availableSlots = capacity - inside - outstanding`. 

### 2.2 Lấy Báo giá & Cọc (Quote)
*   **API:** `GET /api/driver/reservations/quote?vehicleTypeId=1&entryTime=2026-07-25T08:00:00&exitTime=2026-07-25T10:00:00`
*   **Luồng Code (BE - `ReservationService.java`):**
    1. Kiểm tra `exitTime > entryTime`.
    2. Gọi `pricingService.calculateFee(...)` để lấy bảng giá (`PricingPolicy`) khớp với loại xe và tính ra tiền phí dự kiến `estimatedFee`.
    3. Tính tiền cọc: `deposit = estimatedFee * depositPercent` (Lấy `%` cấu hình từ `FeeConfigService`). Làm tròn xuống bội số của 1.000 VNĐ.

### 2.3 Tạo Đặt chỗ (Booking) - Có chống Race Condition
*   **API:** `POST /api/driver/reservations`
*   **Payload (JSON):** `{ "vehicleTypeId": 1, "licensePlate": "51H-123.45", "expectedEntryTime": "...", "expectedExitTime": "..." }`
*   **Luồng Code (BE - `ReservationService.java`):**
    1. **Khóa Transaction:** Hàm được đánh dấu `@Transactional(isolation = Isolation.SERIALIZABLE)`. Cực kỳ quan trọng để chặn 2 người cùng đặt lúc còn 1 chỗ.
    2. **Validate Khắt khe:** 
       - Giới hạn: Mỗi User chỉ được ôm tối đa 3 vé đang `Pending` hoặc `Confirmed`.
       - Chống trùng lặp: Biển số xe không được phép có 2 booking trùng thời gian (Overlap).
       - Thời gian: Giờ vào phải cách hiện tại ít nhất 15 phút (để có thời gian thanh toán).
    3. **Check Quota (Hàm `checkQuota`):** 
        * Lấy Quota cho khung giờ đó (VD: 60% sức chứa). Tính ra số xe tối đa được phép đặt (VD: `quotaLimit` = 60).
        * Đếm số Booking `Pending` + `Confirmed` đang nằm trong khung giờ đó (`currentBooked`).
        * Nếu `currentBooked >= quotaLimit` -> Bắn Exception `QUOTA_FULL`.
    4. **Lưu DB (Khóa giá):** Tạo `Reservation` với status `Pending`. Đặc biệt, **Lưu cứng giá cước hiện tại vào cột `PriceAtBookingTime`**, đảm bảo khi khách check-out sẽ luôn dùng đúng giá lúc đặt cọc dù Manager có đổi giá. Trả về ID của Booking.

### 2.4 Hủy Đặt chỗ (Cancel)
*   **API:** `PATCH /api/driver/reservations/{id}/cancel`
*   **Luồng Code (BE - `ReservationService.java`):**
    1. Kiểm tra quyền sở hữu (User này có phải chủ booking không).
    2. Check thời gian: Nếu `expectedEntryTime` cách hiện tại < 3 giờ -> Bắn lỗi `CANCEL_TOO_LATE` (Hủy sát giờ không được phép).
    3. Đổi status thành `Cancelled`. Nếu trước đó đã trả cọc (`Paid`), đổi depositStatus thành `Refunded` (để kế toán biết mà trả tiền thủ công).

---

## Luồng 3: Thanh toán Cọc (Payment - PayOS)

Luồng này tích hợp hãng thứ 3.

### 3.1 Tạo Link Thanh Toán QR
*   **API:** `POST /api/driver/payments/payos/create-link` (Truyền lên `reservationId`)
*   **Luồng hoạt động (FE):** Sau khi booking xong, app chuyển sang trang thanh toán và gọi API này để lấy URL của PayOS.
*   **Luồng Code (BE - `PayosService.java`):**
    1. Lấy Booking ra. Check đúng chủ và status `Pending`.
    2. Tạo `orderCode` ngẫu nhiên nhưng phải <= `Number.MAX_SAFE_INTEGER` của Javascript (< 10^15). Thuật toán: `(hashCode % 10^8) * 10^6 + currentTimeMillis`.
    3. Tính chữ ký `HMAC-SHA256` các tham số gửi đi bằng `checksumKey`.
    4. Bắn HTTP POST (dùng `RestTemplate`) sang API của PayOS (`api-merchant.payos.vn/v2/payment-requests`).
    5. PayOS trả về `checkoutUrl`. Code BE lưu ngay 1 bản ghi vào bảng `Payments` với status `Pending` và `transactionReference = orderCode`. Trả `checkoutUrl` về FE.

### 3.2 Nhận Webhook từ PayOS (Tự động)
*   **API:** `POST /api/payments/payos/webhook` (PayOS tự gọi, không có Token)
*   **Luồng Code (BE - `PayosService.java` hàm `handleWebhook`):**
    1. Đọc Body JSON do PayOS gửi về. Lấy trường `signature`.
    2. Dùng `checksumKey` của hệ thống mã hóa lại data vừa nhận, so sánh với `signature`. Nếu khác -> Từ chối (chống Hacker).
    3. Lấy `orderCode` từ gói tin, gọi hàm `markPaymentPaid()`.
    4. Tìm `Payment` bằng `orderCode`. Nếu đã là `Success` thì bỏ qua (Idempotent). Nếu chưa, set `Success`. Đổi trạng thái `Reservation` thành `Confirmed` (hoặc cứu sống lại từ `Expired` nếu nó vừa bị timeout xong).

### 3.3 FE xác nhận giao dịch sau khi quay lại
*   **API:** `POST /api/driver/reservations/{id}/confirm-deposit`
*   **Luồng Code (BE - `ReservationService.java`):**
    1. Khi tài xế quét xong, đóng trình duyệt PayOS, web nhảy về trang Success. FE lúc này gọi API này để BE chốt hạ.
    2. BE không tin việc FE gọi là đã thành công. BE lấy `orderCode`, gọi `payosService.verifyPaymentStatus(orderCode)` bắn ngược lên server PayOS (phương thức GET) để check xem giao dịch này ĐÃ TRẢ TIỀN THẬT HAY CHƯA (`PAID`).
    3. Nếu PayOS chốt `PAID`, BE cập nhật trạng thái Booking (nếu webhook chưa kịp chạy).

---

## Luồng 4: Dọn rác nền (Cronjobs) - Cực kỳ quan trọng

Không phải API, nhưng là "Trái tim" của hệ thống xử lý ngoại lệ. Chạy ngầm trong `SessionExpiryScheduler.java` (Sử dụng `@Scheduled`).

### 4.1. Dọn Booking không trả tiền cọc
*   **Hàm:** `expireUnpaidReservations()` - Chạy **mỗi 1 phút**.
*   **Cách hoạt động:** Tìm tất cả Reservation trạng thái `Pending`. Thời gian cho phép giữ trạng thái Pending **được giảm xuống chỉ còn 3 phút**. Hết 3 phút chưa trả tiền cọc -> Tự hủy để nhường chỗ cho khách khác.

### 4.2. Khách bùng hẹn (No-show) & Grace Period thông minh
*   **Hàm:** `expireNoShowReservations()` - Chạy định kỳ.
*   **Thời gian ân hạn (Grace Period):** Tính toán linh hoạt thay vì fix cứng.
    - `GraceRaw` = (Thời lượng booking) x (Phần trăm cọc).
    - `Cap` (Giới hạn tối đa): <24h -> trần 2 tiếng; <7 ngày -> trần 12 tiếng; >7 ngày -> trần 24 tiếng.
    - `Grace Period Thực tế` = MAX(15 phút, MIN(GraceRaw, Cap)).
*   **Xử lý:** Quét các booking `Confirmed`. Nếu quá hạn `ExpectedEntryTime + Grace Period` mà xe vẫn chưa vào bãi -> Đổi trạng thái thành `Expired`. Thu hồi cọc (`depositStatus = Forfeited`) và trả lại slot ngay lập tức.

### 4.3. Xử lý sự cố sức chứa (Capacity Crash)
*   Nằm ở `CapacityService`. Khi Manager chuyển quá nhiều ô sang `Maintenance` khiến sức chứa khả dụng (Walk-in headroom) bị âm.
*   Hệ thống sẽ **tự động quét và hủy** các Booking mới đặt gần nhất (LIFO) cho tới khi Headroom >= 0. Những vé bị hủy tự động sẽ được ghi nhận để hoàn tiền (Refunded).

---

## Luồng 5: Lịch sử & Đánh giá (Session & Feedback)

### 5.1 Lịch sử & Hiện tại
*   **API:** `GET /api/driver/sessions/current` và `GET /api/driver/sessions/history`
*   **Luồng Code (BE - `SessionDriverController`):** Chỉ lấy dữ liệu từ bảng `ParkingSession` (where user = principal, status in [danh sách status phù hợp]). 
*   *Lưu ý:* Việc check-in (tạo session) và check-out (đóng session) là việc của thẻ từ ở cổng (Nhân viên Staff), App Driver hoàn toàn không nhúng tay vào việc đổi trạng thái Session.

### 5.2 Đánh giá (Feedback)
*   **API:** `POST /api/driver/feedbacks`
*   **Luồng Code (BE - `FeedbackDriverService.java`):**
    1. Kiểm tra Session gửi lên có phải của User này không, trạng thái có phải là `Completed` không (đang đỗ không được rate).
    2. Kiểm tra Session đã từng đánh giá chưa (chỉ được 1 feedback/session).
    3. Tạo bản ghi `Feedback` lưu điểm số (1-5) và bình luận.

---

## Luồng 6: Tính tiền Check-out & Gia hạn tại bãi (Mới)

### 6.1 Tính tiền lúc ra cổng (`SessionService.checkOut`)
*   **Lấy giá gốc:** Dùng đúng cột `PriceAtBookingTime` đã khóa lúc đặt để tính phí gốc (Base Fee).
*   **Ra sớm:** Không hoàn tiền dư. Vẫn thu đủ tiền cho toàn bộ khung giờ khách đã giữ chỗ (trừ đi tiền cọc).
*   **Trễ giờ (Overstay):**
    *   <= 10 phút: **Miễn phí** (Buffer kẹt xe, xếp hàng).
    *   10 - 30 phút: Tính tròn 1 block 30 phút (0.5h).
    *   > 30 phút: Làm tròn lên block 1 giờ.
    *   Phí phạt: Tính gấp đôi giá đặt cọc (`lockedPrice * 2`).
    *   Tự động ghi Log sự cố (`INCIDENT_OVERSTAY`) nhắc nhở nhân viên nếu trễ quá 30 phút.

### 6.2 Gia hạn Booking khi đang ở trong bãi
*   **API:** `POST /api/driver/reservations/{id}/extend`
*   **Cách hoạt động:** Khách đang gửi xe (Session đang mở, Reservation đang `CheckedIn`) muốn gia hạn giờ.
*   **Xử lý (`ReservationService.extendReservation`):** Kiểm tra Quota của khung giờ mở rộng xem bãi còn đáp ứng được không. Nếu còn, kéo dài `ExpectedExitTime`. Lúc khách ra cổng, phí thanh toán sẽ tự động tăng lên dựa theo mức giờ mới.
