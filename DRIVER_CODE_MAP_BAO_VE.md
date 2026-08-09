# DRIVER_CODE_MAP_BAO_VE.md - BẢN ĐỒ MÃ NGUỒN (CHỐNG HỎI XOÁY CODE ĐÂU)

# SWP391 - Hệ thống bãi đỗ xe thông minh

---

> **Bí kíp:** Khi bị giáo viên (cô/thầy) yêu cầu: "Mở đoạn code làm nhiệm vụ tính tiền lên cho cô xem", hoặc "Em bảo có 9 chức năng thì code nằm ở file nào, dòng bao nhiêu?", hãy mở file này ra và đối chiếu.

---

## ⭐️ CHÚ Ý TRƯỚC TIÊN: Code "Tính Tiền" nằm ở đâu?

Đây là phần lõi cực kỳ quan trọng, thường bị hỏi nhiều nhất.

- **File:** `com\parking\common\service\PricingService.java`
- **Method:** `calculateFee()`
- **Từ dòng:** `48` đến `74`
- **Giải thích đoạn code:**
  - **Dòng 53-54:** Tính tổng số phút khách đỗ xe `Duration.between(entryTime, exitTime).toMinutes()`.
  - **Dòng 56:** Gọi hàm `baseAndExtra` (dòng 26-34) để tính phí cơ bản = Giá gốc + (Số giờ vượt x Giá giờ vượt).
  - **Dòng 59-66:** Đọc cấu hình giờ ngày/đêm từ cơ sở dữ liệu (`DAY_START_HOUR` và `DAY_END_HOUR`).
  - **Dòng 68-71:** Hàm `checkNightOverlap()` kiểm tra nếu khung giờ đỗ xe bị lọt vào ban đêm (18:00 đến 06:00 sáng hôm sau) thì sẽ **Cộng thêm phụ phí đêm (Night Surcharge)**.
- **Tại sao lại đặt ở `PricingService`?**
  - Đặt ở một file chung (`common/service`) để **Tái sử dụng**. Hàm này được gọi bởi (1) Tính phí ước tính cho Driver, (2) Tính phí gia hạn, và (3) Tính phí thật lúc Check-out ở cổng. Code không bị lặp lại, đảm bảo 3 nơi tính ra cùng 1 kết quả.

---

## BẢN ĐỒ 9 CHỨC NĂNG CỦA DRIVER

### 1. Xem thông tin bãi xe (Parking Info - Headroom)

- **File:** `com\parking\modules\driver\ParkingInfoService.java`
- **Method:** `getParkingInfo()`
- **Từ dòng:** `31` đến `86`
- **Giải thích đoạn code:**
  - Hệ thống lấy thời gian mở cửa/đóng cửa.
  - Lấy danh sách bảng giá đang `Active`.
  - **Dòng 57-59:** Điểm ăn tiền ở đây là dùng 1 câu SQL gom nhóm (`countSlotsGroupedByVehicleType()`) để đếm số chỗ trống thay vì dùng vòng lặp `for` query database N lần. Tối ưu hóa hiệu năng cực tốt.

### 2. Xem Báo giá (Quote)

- **File:** `com\parking\modules\driver\ReservationService.java`
- **Method:** `quote()`
- **Từ dòng:** `168` đến `175`
- **Giải thích đoạn code:**
  - Khách nhập giờ vào/ra, hàm này gọi `pricingService.calculateFee()` (đã nói ở trên) để ra được `fee` (phi ước tính).
  - Tiếp theo gọi hàm `depositFor()` (dòng 186) để nhân % cọc và **làm tròn xuống** (VD: 22,500đ thành 22,000đ) để ra số tiền cọc cuối cùng trả về FE.

### 3. Đặt chỗ (Create Reservation) - _Rất quan trọng_

- **File:** `com\parking\modules\driver\ReservationService.java`
- **Method chính:** `create()` (Từ dòng `48` đến `131`)
- **Method phụ (Kiểm tra hết chỗ):** `checkQuota()` (Từ dòng `200` đến `228`)
- **Giải thích đoạn code:**
  - **Dòng 48:** `@Transactional(isolation = Isolation.SERIALIZABLE)` -> Mức khóa CSDL cao nhất. Chống việc 2 người cùng đặt lúc chỉ còn 1 chỗ (Race condition).
  - **Dòng 56-60:** Ép khách phải đặt trước tối thiểu 15 phút so với giờ vào để có thời gian đóng cọc.
  - **Dòng 83:** Gọi hàm `checkQuota()`. Hàm này sẽ lấy tổng sức chứa (capacity) nhân với % giới hạn (quotaPercent) để ra giới hạn tối đa. Nếu số booking > giới hạn thì ném lỗi `QUOTA_FULL`.
  - **Dòng 102-123:** Code **"Khóa Giá" (Price Lock)**: Nó copy tất cả các giá (basePrice, nightSurcharge, extraHourPrice...) từ cấu hình và LƯU CHẾT vào entity `Reservation`. Tránh việc Manager đổi giá sau lưng thì khách vẫn được tính giá cũ.

### 4. Thanh toán cọc (Deposit Payment - PayOS)

- **File:** `com\parking\modules\driver\PayosService.java`
- **Method tạo Link QR:** `createDepositLink()` (Từ dòng `90` đến `124`)
- **Method nhận Webhook:** `handleWebhook()` (Từ dòng `268` đến `282`)
- **Giải thích đoạn code:**
  - Hàm `createDepositLink` lấy giá tiền, mã đơn hàng ngẫu nhiên, sau đó gọi thuật toán mã hóa `HMAC-SHA256` bằng khóa bí mật để tạo chuỗi an toàn gửi sang API PayOS.
  - Hàm `handleWebhook` là đoạn code _tự động nhận lệnh khi PayOS báo khách đã chuyển khoản thành công_. Nó check chữ ký bảo mật, sau đó gọi hàm `markPaymentPaid()` để đổi trạng thái booking từ `Pending` sang `Confirmed`.

### 5. Xác nhận cọc thủ công (Confirm Deposit)

- **File:** `com\parking\modules\driver\ReservationService.java`
- **Method:** `confirmDeposit()`
- **Từ dòng:** `311` đến `352`
- **Giải thích đoạn code:**
  - Lỡ webhook của bước 4 bị rớt mạng, hàm này sẽ chạy khi khách quay lại web.
  - Hàm sẽ lấy `orderCode`, gọi ngược sang PayOS (`payosService.verifyPaymentStatus`) (dòng 349) để "hỏi" xem PayOS đã thực sự nhận tiền chưa. Nếu PayOS bảo ĐÃ NHẬN, nó mới update CSDL. (Chống việc Frontend giả mạo gọi API báo đã đóng tiền).

### 7. Gia hạn thời gian (Extend)

- **File:** `com\parking\modules\driver\ReservationService.java`
- **Method:** `extendReservation()`
- **Từ dòng:** `358` đến `425`
- **Giải thích đoạn code:**
  - Điểm nhấn kỹ thuật: Dùng `@Transactional(propagation = Propagation.NOT_SUPPORTED)` kết hợp `TransactionTemplate`.
  - Mục đích: Chia việc chạy code làm 3 pha. Tránh việc giữ trạng thái khóa Database liên tục trong suốt 15 giây chờ PayOS trả lời. Đoạn code này được viết rất tối ưu về mặt chống "sập" database (DB connection leak) khi mạng chậm.

### 8. Xem & Cập nhật Hồ sơ (Profile)

- **File:** `com\parking\modules\driver\ProfileService.java`
- **Method:** `getProfile()` (Dòng 23-26) và `updateProfile()` (Dòng 28-40)
- **Giải thích đoạn code:**
  - Lấy `username` trực tiếp từ token JWT đang đăng nhập.
  - Chỉ cho phép sửa Họ tên, Email, SĐT. Tuyệt đối không cho phép dùng hàm này để đổi role (Từ khách thành Admin) hay đổi mật khẩu.

### 9. Lịch sử đỗ xe & Đánh giá (Feedback)

- **File:** `com\parking\modules\driver\SessionDriverService.java` và `com\parking\modules\driver\FeedbackDriverService.java`
- **Giải thích đoạn code:**
  - Code Đánh giá nằm trong hàm `createFeedback()`.
  - Nó kiểm tra chặt 3 điều kiện: (1) Phải là chủ của phiên đỗ xe, (2) Phiên phải đã hoàn tất (`Completed`), (3) Chưa từng đánh giá phiên này
   (`existsBySession_SessionId`). Thiếu 1 trong 3 đều ném lỗi không cho đánh giá.
### 3C - Các Unhappy Flows quan trọng (Kinh nghiệm bảo vệ)

❌ **Unhappy Flow 1 – Trùng biển số**

- **Điều kiện:** Biển số xe đã có booking khác trùng thời gian.
- **Vị trí Code Backend:**
  - **File:** `com\parking\modules\driver\ReservationService.java`
  - **Method:** `create()`
  - **Dòng code:** Từ `77` đến `81`
- **Đoạn code:**
  ```java
  List<Reservation> overlaps = reservationRepository.findByLicensePlateAndStatusInAndExpectedExitTimeGreaterThanAndExpectedEntryTimeLessThan(...);
  if (!overlaps.isEmpty()) {
      throw new BusinessRuleException("Biển số này đã có đặt chỗ trong khung giờ bạn chọn", "LICENSE_PLATE_OVERLAP");
  }
  ```
- **Backend trả lỗi:** `LICENSE_PLATE_OVERLAP`
- **Thông báo:** "Biển số này đã có đặt chỗ trong khung giờ bạn chọn."
- **FE xử lý:** Hiển thị lỗi ngay tại form. Không cho chuyển sang bước thanh toán.

❌ **Unhappy Flow 2 – Hết quota**

- **Điều kiện:** Khung giờ đã đủ số lượng xe cho loại xe được chọn.
- **Vị trí Code Backend:**
  - **File:** `com\parking\modules\driver\ReservationService.java`
  - **Method:** `checkQuota()`
  - **Dòng code:** Từ `218` đến `227`
- **Đoạn code:**
  ```java
  long currentBooked = reservationRepository.countByVehicleType_VehicleTypeIdAndStatusInAnd...
  if (currentBooked >= quotaLimit) {
      throw new BusinessRuleException("Khung giờ nay đã hết quota đặt cho...", "QUOTA_FULL");
  }
  ```
- **Backend trả về:** `HTTP 409 - QUOTA_FULL`
- **FE xử lý:** Khóa chức năng đặt chỗ. Hiển thị trạng thái Hết suất. Gợi ý người dùng chọn khung giờ khác.