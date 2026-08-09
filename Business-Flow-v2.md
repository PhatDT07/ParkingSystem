# Nghiệp vụ Bãi đỗ xe Thông minh (Mô hình Giữ-suất)

> **Phiên bản:** 2.1 — Cập nhật 2026-06-22
>
> **Nguyên lý cốt lõi:** Đặt chỗ (booking) không giữ một ô vật lý cụ thể, mà giữ một **suất chỗ** trong một khung giờ. Không ô nào bị "đóng đinh" cho ai — booking chỉ bảo đảm: (1) xe sẽ được cho vào trong khung giờ đã đặt, và (2) chắc chắn còn ít nhất một ô trống khi xe tới. Hệ thống giữ lời hứa này bằng cách **chặn bớt khách vãng lai**, sao cho tổng số xe không bao giờ vượt quá sức chứa trừ đi số booking đang chờ. Khi xe có booking tới, barie cấp cho họ một ô trống bất kỳ — y như khách vãng lai. Camera AI sẽ xác nhận xe thực tế đỗ ở ô nào.

---

## Mục lục

1. [Đối tượng & Vai trò](#1-đối-tượng--vai-trò)
2. [Mô hình sức chứa](#2-mô-hình-sức-chứa)
3. [Thiết kế tòa nhà & Quy ước đặt tên ô](#3-thiết-kế-tòa-nhà--quy-ước-đặt-tên-ô)
4. [Cơ chế nhận diện (Camera AI)](#4-cơ-chế-nhận-diện-camera-ai)
5. [Các trạng thái](#5-các-trạng-thái)
6. [Các luồng chính](#6-các-luồng-chính)
7. [Tình huống biên & Quyết định nghiệp vụ](#7-tình-huống-biên--quyết-định-nghiệp-vụ)
8. [Chính sách giá & Thanh toán](#8-chính-sách-giá--thanh-toán)
9. [Tham số cấu hình hệ thống](#9-tham-số-cấu-hình-hệ-thống)
10. [Yêu cầu kỹ thuật FE / BE](#10-yêu-cầu-kỹ-thuật-fe--be)

---

## 1. Đối tượng & Vai trò

| Vai trò | Mô tả | Đặt chỗ? |
|---------|--------|-----------|
| **Driver (Tài xế / Người dùng)** | Đặt trước hoặc vào theo lượt (vãng lai). Lưu thông tin & lịch sử booking khi đăng nhập. | Có |
| **Manager (Quản lý)** | Vận hành bãi xe, cấu hình giá & quota. Được đặt chỗ kể cả trong khung giờ đã khóa (override). | Có |
| **Staff (Nhân viên)** | Trực barie, nhập biển số thủ công khi cần, xử lý sự cố, force check-in. | Không |
| **Admin (Quản trị viên)** | Toàn quyền hệ thống: quản lý user, phân quyền, xem audit log, cấu hình hệ thống. | Có |
| **Hệ thống (Camera + Barie)** | Quét biển số cổng vào/ra, nhận diện ô đỗ, kiểm soát lượng xe vào. | — |

> **Lưu ý:** Tính năng Voucher đã được **loại bỏ** khỏi phạm vi dự án.

---

## 2. Mô hình sức chứa

### 2.1. Công thức tính (theo từng loại xe, trên toàn bãi)

Tại thời điểm **t**:

| Ký hiệu | Ý nghĩa |
|----------|----------|
| **C** | Tổng số ô dùng được (của loại xe đó) = Tổng ô − Ô đang `Maintenance` |
| **Inside(t)** | Số xe đang thực sự đỗ trong bãi *(camera đếm — số thật)* |
| **Outstanding(t)** | Số booking `Confirmed`, có khung giờ phủ **t**, nhưng xe chưa vào |
| **Walk-in headroom** | `C − Inside(t) − Outstanding(t)` = Suất còn cho khách vãng lai |

### 2.2. Luật cho vào

| Loại khách | Điều kiện |
|------------|-----------|
| **Khách vãng lai** | Chỉ được vào khi `Walk-in headroom > 0`. Nếu = 0 → LED báo "HẾT CHỖ", barie đóng. |
| **Xe có booking** | Được vào bất cứ lúc nào còn hiệu lực — suất đã được chừa sẵn trong `Outstanding`, cho vào chỉ chuyển từ `Outstanding` sang `Inside`, headroom không đổi. |

> **Quan trọng:** Mỗi khi barie mở, hệ thống tự động trừ một suất trống ngay lập tức (tránh trường hợp khách đang tìm chỗ chưa đỗ mà hệ thống vẫn báo trống → khách khác vào gây thiếu chỗ).

### 2.3. Luật nhận đặt chỗ (cho khung giờ W)

- Chỉ nhận khi `số_booking_trong_W < Quota(W)`.
- **Quota(W)** = trần số suất đặt chỗ cho khung giờ đó, tính **theo loại xe, trên toàn bãi** (không theo tầng).
- Quản trị viên đặt **dưới dạng % của C** (VD: "chừa tối đa 60% sức chứa ô tô cho khung 8–10h"), ràng buộc cứng `Quota(W) ≤ C`.
- Khi `số_booking` chạm `Quota(W)` → khung giờ đó bị **khóa đặt chỗ**.
- **Manager** vẫn override được khi khung giờ bị khóa.

> Nếu một tầng chuyên dụng cho một loại xe thì `C` của loại đó = tổng ô các tầng phục vụ nó — hệ thống tự cộng, Admin không nhập theo tầng.

### 2.4. Hiển thị số chỗ trống

- Số lượng vị trí trống hiển thị trên **tất cả các page FE** (header/sidebar).
- Công thức hiển thị: `Chỗ trống = Tổng vị trí − (Vị trí bảo trì + Vị trí đang có xe)`.

---

## 3. Thiết kế tòa nhà & Quy ước đặt tên ô

### 3.1. Cấu trúc tòa nhà

- Xác định số tầng, vùng (zone) và vị trí ô trên mỗi tầng.
- Mỗi tầng có thể chuyên dụng cho một loại xe hoặc dùng chung.

### 3.2. Quy ước đặt tên ô

Định dạng: **`{Tầng}-{Khu}{Số}`**

| Ví dụ | Ý nghĩa |
|-------|----------|
| `B1-A01` | Tầng B1, Khu A, ô 01 |
| `B1-07` | Tầng B1, không chia khu, ô 07 |

- **Khu (Zone)** = cụm ô theo hướng trên cùng tầng (A/B/C...). Chỉ phục vụ **chỉ đường** (bảng LED "hướng nào còn chỗ"), **không ảnh hưởng** đặt chỗ.
- Ô gợi ý hiển thị tại barie dùng đúng mã này (VD: "Gợi ý: B1-A07").
- Ô gợi ý được **giữ mềm** vài phút để hai xe không bị chỉ vào cùng một ô, sau đó tự nhả nếu không dùng.

---

## 4. Cơ chế nhận diện (Camera AI)

Không gắn thiết bị ở từng ô. Mỗi tầng được phủ bởi **một hoặc nhiều Camera AI mô phỏng (computer vision)** — tầng nhỏ 1 camera, tầng hầm lớn cần vài camera phủ hết lưới ô.

**Camera là thứ duy nhất ghi trạng thái ô:**

| Sự kiện | Hành động |
|---------|-----------|
| Phát hiện xe vừa đỗ vào ô | Đọc biển số → đánh ô `Occupied` → gán `ActualSlot` cho phiên |
| Phát hiện ô vừa trống | Đánh ô `Available` |

> **Lưu ý mô phỏng:** Vì không có camera thật, hệ thống **random vị trí đỗ** và ghi log để xác định vị trí nào đã đậu. Sau khi xe rời ô 10 giây, tự động chuyển ô thành `Available`.

---

## 5. Các trạng thái

### 5.1. Trạng thái Ô (`ParkingSlots.Status`)

Chỉ do **camera CV** hoặc **Manager** điều khiển — booking **không bao giờ** chạm vào.

```
Available ──→ Occupied      (camera phát hiện xe đỗ)
Occupied  ──→ Available     (camera phát hiện xe rời)
Available ←──→ Maintenance  (Manager đánh dấu thủ công)
```

### 5.2. Trạng thái Phiên (`ParkingSessions.Status`)

Mỗi lượt xe vào tạo 1 phiên:

```
Admitted ──→ Parked ──→ Moved ──→ Completed
                                      ↑
              (bất kỳ trạng thái) ──→ Exception
```

| Trạng thái | Ý nghĩa |
|------------|----------|
| `Admitted` | Barie mở, bắt đầu tính giờ |
| `Parked` | Camera xác nhận đã đỗ vào ô |
| `Moved` | Xe rời ô, đang đi ra cổng |
| `Completed` | Đã thanh toán, ra khỏi bãi |
| `Exception` | Sự cố (mất vé, loiterer, tailgating...) |

### 5.3. Trạng thái Booking (`Reservations.Status`)

```
Pending ──→ Confirmed ──→ CheckedIn ──→ Fulfilled
  │             │
  ├──→ Cancelled (người dùng hủy)
  └──→ Expired   (không đến, quá ân hạn)
```

| Trạng thái | Ý nghĩa |
|------------|----------|
| `Pending` | Mới tạo, chưa thanh toán cọc |
| `Confirmed` | Đã thanh toán cọc, suất đã được chừa |
| `CheckedIn` | Xe đã vào bãi |
| `Fulfilled` | Xe đã đỗ, camera xác nhận |
| `Cancelled` | Người dùng tự hủy |
| `Expired` | Không đến trong ân hạn → **mất cọc** |

---

## 6. Các luồng chính

### 6.A. Khách vãng lai (gửi xe theo lượt)

```
Xe tới barie → Camera quét biển số → Kiểm tra headroom
                     │                       │
                     ▼                       ▼
              TH1: Sai biển số        headroom > 0 ?
              → Staff nhập tay        ├─ Có  → Tạo phiên (Admitted), mở barie
                                      └─ Không → LED "HẾT CHỖ", barie đóng
```

1. Xe tới barie vào → **camera AI quét biển số** (nhân viên nhập tay nếu camera sai).
2. Hệ thống kiểm tra **Walk-in headroom > 0**. Nếu = 0 → LED báo "HẾT CHỖ", barie không mở.
3. Nếu được vào → tạo **phiên** (`Admitted`), **bắt đầu tính giờ**, hệ thống gợi ý ô trống, mở barie.
4. **Camera CV tầng** phát hiện xe đỗ vào ô → ô `Occupied`, đọc biển số, gán `ActualSlot`, phiên → `Parked`. Ô gợi ý (nếu khác) được nhả ra.

### 6.B. Ra bãi & Thanh toán (mọi xe)

```
Xe rời ô → Camera: ô → Available, phiên → Moved
     │
     ▼
Xe tới barie ra → Camera quét biển số → Tìm phiên đang mở
     │
     ▼
Tính tiền (từ EntryTime đến hiện tại) → Thanh toán → phiên → Completed
```

1. Xe rời ô → camera CV phát hiện ô trống → ô → `Available`, phiên → `Moved`.
   - *(Mô phỏng: sau 10s tự động chuyển ô thành `Available`)*
2. Xe tới barie ra → **camera quét biển số** → tìm phiên đang mở.
3. Tính tiền — **luôn từ `EntryTime` (lúc Admitted) đến lúc quét cổng ra**, theo bảng giá ngày/đêm.
4. Tài xế thanh toán — **tiền mặt / QR / QR dán kính xe**.
5. Thành công → phiên → `Completed`, barie mở. Booking (nếu có) đóng lại.

### 6.C. Đặt chỗ trước

```
Chọn loại xe + khung giờ → Kiểm tra Quota → Nhập biển số → Thanh toán cọc → Confirmed
```

1. Người dùng chọn **loại xe + khung giờ**.
2. Hệ thống kiểm tra `số_booking < Quota(W)`. Nếu đầy → khung giờ **bị khóa** (Manager override được).
3. Người dùng **nhập biển số** (bắt buộc — để camera đối chiếu tại cổng).
4. **Thu cọc** (20% mặc định, cấu hình được). Cọc → `Paid`, booking → `Confirmed`.

### 6.D. Khách có booking tới

```
Camera đọc biển số → Tìm booking Confirmed → CheckedIn → Tạo phiên Admitted → Gợi ý ô → Mở barie
     │
     ▼
Đỗ vào ô → Camera xác nhận → Parked, booking → Fulfilled → Ra bãi theo luồng 6.B
```

1. Camera cổng đọc biển số → tìm booking `Confirmed` còn hiệu lực → booking → `CheckedIn`.
2. Tạo phiên `Admitted`, bắt đầu tính giờ, gợi ý ô trống, mở barie.
3. Tài xế đỗ vào ô trống bất kỳ → camera xác nhận → ô `Occupied`, phiên `Parked`, booking `Fulfilled`.
4. Ra bãi giống luồng 6.B.

### 6.E. Quản trị / Kiểm soát khung giờ

1. Bảng điều khiển hiển thị theo từng khung giờ: **số vào, số ra, số đang trong bãi** và đường cong sử dụng.
2. Quản trị viên đặt `Quota(khung giờ)` (giờ cao điểm → thấp; giờ thấp điểm → cao hơn).
3. Khi `số_booking` chạm quota → tự động gắn cờ **khóa đặt chỗ**; Manager vẫn override được.

---

## 7. Tình huống biên & Quyết định nghiệp vụ

### 7.1. Tình huống biên

#### Khách đến sớm (chim sớm)

| Tình huống | Xử lý |
|------------|--------|
| Trong **ân hạn vào sớm** (mặc định 15 phút trước giờ hẹn) | Kích hoạt booking như thường → `CheckedIn` |
| Sớm hơn ân hạn + `headroom > 0` | Cho vào, **tiêu thụ suất booking** ngay (gỡ khỏi `Outstanding` để không đếm hai lần), tính tiền từ lúc vào |
| Sớm hơn ân hạn + `headroom = 0` | Mời chờ tới khung giờ đã đặt — suất chỉ được bảo đảm *trong* khung giờ |

#### Loiterer (vào nhưng không đỗ)

- Phiên `Admitted` quá **TTL-Admitted** (15 phút) mà chưa `Parked` → tự động tạo `IncidentReport` loại `Loiterer`.
- **KHÔNG tự trừ `Inside(t)`** — xe có thể vẫn trong bãi. Chỉ trừ khi xác nhận đã rời (quét cổng ra hoặc nhân viên xác nhận).
- Nếu xe chạy thẳng ra cổng → quét biển số tự đóng phiên (`Completed`, phí tối thiểu).

#### Trốn vé bám đuôi cổng ra (Exit tailgating)

- Phiên `Moved` quá **TTL-Moved** (30 phút) không có thanh toán cổng ra.
- → Tự đóng phiên (`Completed`), trừ `Inside(t)`, tạo `IncidentReport` loại `ExitTailgating`.
- Trích camera an ninh, truy thu / phạt nguội lần sau.

#### Nhập sai biển số khi đặt (typo) → Force Check-in

- Camera đọc biển số không khớp booking, bãi hết chỗ → barie đóng.
- Khách xuất trình mã QR booking → **Staff force check-in**: quét QR, kiểm tra hợp lệ (đã trả cọc), **gán biển số thực tế vào booking**, mở cổng thủ công.
- Ghi log audit + đánh dấu `IsForceCheckIn = true` trên phiên.

#### Capacity crash (sức chứa tụt đột ngột)

- Manager chuyển nhiều ô sang `Maintenance` → `C` tụt dưới `Inside + Outstanding` → `headroom` âm.
- → Chặn 100% khách vãng lai, cảnh báo Manager ngay lập tức.
- Tạo `IncidentReport` loại `CapacityCrash` cho số booking bị lố → **hoàn cọc đầy đủ** hoặc **Force-Cancel kèm thông báo**.

#### Quá giờ chèn ép booking

- Xe quá giờ ăn vào suất vãng lai trước → bảo vệ booking trước.
- Khi xe quá giờ vượt vùng đệm vãng lai → nhân viên can thiệp + phụ phí quá giờ.
- Được gắn cờ `Overstay`, không âm thầm vỡ.

#### Không đến (No-show)

- Booking `Expired` sau **ân hạn đến muộn** (30 phút). Suất trả lại cho khách vãng lai.
- **Cọc bị mất** (`DepositStatus` → `Forfeited`).

#### Camera sót

- Trạng thái ô bám theo camera CV — sót một lần thì chỉnh lại ở khung hình kế tiếp hoặc khi quét cổng ra.
- Booking **tuyệt đối không** lật trạng thái vật lý của ô.

#### Va chạm ô gợi ý

- Giữ mềm ô gợi ý vài phút (mặc định 5 phút) để hai barie không chỉ cùng một ô.
- Nhả khi xe đỗ chỗ khác hoặc hết hạn giữ.

### 7.2. Quyết định nghiệp vụ đã chốt

| Quyết định | Chi tiết |
|------------|----------|
| **Cọc đặt chỗ** | Bắt buộc (mặc định 20%), mất cọc nếu không đến. Chống spam giữ chỗ gây "cháy chỗ ảo". |
| **Hạn mức đặt chỗ** | Cố định theo khung giờ, tính theo % sức chứa, theo loại xe trên toàn bãi (không theo tầng). Tự co giãn khi ô vào Maintenance. Không dùng ML. |
| **Biển số khi đặt chỗ** | Bắt buộc — để camera đối chiếu tại cổng. FE bắt buộc nhập hoặc chọn xe đã lưu. |
| **Vé tháng** | Ngoài phạm vi chính. Nếu mở rộng: trừ thẳng số xe vé tháng khỏi `C`, miễn headroom. |

### 7.3. Vì sao "xe khác đỗ vào ô đã đặt" không thể xảy ra

| Tình huống | Kết quả |
|------------|---------|
| Khách booking đỗ đúng ô gợi ý | Camera xác nhận — xong. |
| Khách booking đỗ ô trống *khác* | Camera cập nhật `ActualSlot` — xong. Không ô nào bị đóng đinh. |
| Khách vãng lai cố lấy "ô cuối cùng" khi còn booking chờ | **Bị chặn tại barie** — headroom đã trừ suất booking. |
| Xe không booking lọt vào khu hạn chế | Camera đọc biển số không khớp → `IncidentReport` + báo Staff. |

> Lời bảo đảm được thực thi **tại barie (lúc cho vào)**, không phải tại ô (lúc đỗ).

---

## 8. Chính sách giá & Thanh toán

### 8.1. Bảng giá theo giờ

| Loại xe | Giá ban ngày (6h – 18h) | Giá ban đêm (18h – 6h) | Phí mất vé |
|---------|--------------------------|-------------------------|------------|
| Xe máy | 3,000 VNĐ/h | 5,000 VNĐ/h | 50,000 VNĐ |
| Ô tô 4 chỗ | 10,000 VNĐ/h | 15,000 VNĐ/h | 200,000 VNĐ |
| Ô tô 7 chỗ | 15,000 VNĐ/h | 20,000 VNĐ/h | 300,000 VNĐ |

> Khung giờ ngày/đêm là **tham số cấu hình** (`DayStartHour`, `DayEndHour`), không hardcode.

### 8.2. Cách tính phí

- Tính từ **`EntryTime`** (lúc barie mở) đến **thời điểm quét cổng ra**.
- Chia thời gian gửi xe thành các đoạn ngày/đêm, mỗi đoạn nhân với giá tương ứng.
- Làm tròn lên giờ (VD: 2h30 phút → tính 3 giờ).
- Nếu có booking → **trừ cọc** vào tổng tiền thanh toán.

### 8.3. Phương thức thanh toán

- Tiền mặt
- QR code (Momo, VNPay, ZaloPay...)
- QR dán trên kính xe (thanh toán tự động)

### 8.4. Cọc đặt chỗ

- Mặc định **20%** giá ước tính cho khung giờ đã đặt.
- Cọc **bắt buộc** khi đặt chỗ → booking chỉ `Confirmed` sau khi thanh toán cọc.
- **Mất cọc** nếu booking `Expired` (không đến).
- **Hoàn cọc** nếu người dùng `Cancelled` trước khung giờ, hoặc hệ thống `CapacityCrash`.

---

## 9. Tham số cấu hình hệ thống

Tất cả là tham số cấu hình trong bảng `SystemConfigs`, **không hardcode**.

| Tham số | Giá trị mặc định | Dùng ở |
|---------|-------------------|--------|
| `TIMEZONE` | `Asia/Ho_Chi_Minh` | Toàn hệ thống |
| `CURRENCY` | `VND` | Toàn hệ thống |
| `EARLY_GRACE_MINUTES` | 15 phút | Khách đến sớm |
| `NOSHOW_GRACE_MINUTES` | 30 phút | Không đến → `Expired` |
| `TTL_ADMITTED_MINUTES` | 15 phút | Loiterer → `IncidentReport` |
| `TTL_MOVED_MINUTES` | 30 phút | Exit tailgating → tự đóng phiên |
| `SUGGESTED_SLOT_HOLD_MINUTES` | 5 phút | Giữ mềm ô gợi ý |
| `DEPOSIT_PERCENT_DEFAULT` | 20% | % cọc mặc định khi đặt chỗ |
| `AUTO_RELEASE_SLOT_SECONDS` | 10 giây | Tự chuyển ô thành Available (mô phỏng, không camera) |

---

## 10. Yêu cầu kỹ thuật FE / BE

### FE (Frontend)

- Tạo **4 pages** cho 4 role khác nhau (dựa trên 4 phân hệ trong file PDF chức năng).
- Hiển thị **số lượng vị trí trống** trên tất cả các page.

### BE (Backend)

- Tạo **mainController** nhận diện role thông qua user đăng nhập → trỏ về các màn hình tương ứng.
- **RBAC** phân quyền chi tiết đến từng Permission (không chỉ Role).
- **Scheduler/Cron job** cho:
  - Tự động `Expired` booking quá ân hạn + `Forfeited` cọc.
  - TTL-Admitted → tạo IncidentReport.
  - TTL-Moved → tự đóng phiên.
  - Release ô gợi ý hết hạn giữ mềm.
- **AuditLog** ghi nhận mọi hành động quan trọng (force check-in, thay đổi slot, thay đổi giá, override quota...).
