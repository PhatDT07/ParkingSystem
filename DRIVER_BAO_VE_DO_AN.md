# DRIVER_BAO_VE_DO_AN.md - Tai lieu bao ve do an BE Module Driver

# SWP391 - He thong bai do xe thong minh - Dang Thanh Phat

---

## MUC LUC

- PHAN 1: Nen tang (Connection String, JWT, 3 tang, Entity)
- PHAN 2: Auth Module (Dang ky 2 buoc OTP, Dang nhap, Quen mat khau)
- PHAN 3: Driver APIs - Luong chi tiet tung chuc nang
  - 3A: Lay thong tin bai xe (Headroom)
  - 3B: Xem bao gia (Quote)
  - 3C: Tao Dat cho (Create Reservation) - Core luong
  - 3D: Huy dat cho (Cancel)
  - 3E: Thanh toan coc PayOS (3 buoc)
  - 3F: Xac nhan coc (confirm-deposit)
  - 3G: Gia han booking (extendReservation)
  - 3H: Profile (Xem /
    Cap nhat)
  - 3I: Lich su & Danh gia (Session / Feedback)
- PHAN 4: Background Jobs (Scheduler - 5 Cron Job)
- PHAN 5: Bo 30 cau hoi bao ve & dap an chuan

---

# PHAN 1 - NEN TANG

## A. Connection String & application.yml

**File cau hinh:** `BE/src/main/resources/application.yml`

### Connection String MongoDB:

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/ParkingDB}
      auto-index-creation: true
```

**Giai thich tung phan:**

- `${MONGODB_URI:...}` = Spring doc bien moi truong `MONGODB_URI` cua he dieu hanh truoc. Neu may chu khong co bien do, dung gia tri sau dau `:` lam mac dinh (fallback).
- `mongodb://localhost:27017` = giao thuc `mongodb://` + may chu `localhost` + cong `27017` (mac dinh MongoDB)
- `ParkingDB` = ten database
- `auto-index-creation: true` = tu dong tao index khi Spring boot khoi dong, doc cac annotation `@Indexed` trong Entity

**Khi deploy len Render/Production:**

```
MONGODB_URI = mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/ParkingDB
```

Bien moi truong duoc dat trong Dashboard cua Render, khong bao gio commit len Git de tranh lo pass.

### Cau hinh JWT:

```yaml
app:
  jwt:
    secret: ${APP_JWT_SECRET:change-this-secret-64-chars-min}
    expiration-ms: ${APP_JWT_EXPIRATION_MS:28800000} # 8 tieng
```

- JWT **stateless**: server KHONG luu session. Dang xuat = client tu xoa token.
- Token song **8 tieng** (28800000ms), het han phai dang nhap lai.
- Secret key toi thieu 64 ky tu de dam bao do ben HMAC-SHA256.

### Cau hinh PayOS:

```yaml
payos:
  client-id: ${PAYOS_CLIENT_ID:}
  api-key: ${PAYOS_API_KEY:}
  checksum-key: ${PAYOS_CHECKSUM_KEY:}
  return-url: https://parking-driver.vercel.app/driver/payment/return
  cancel-url: https://parking-driver.vercel.app/driver/payment/return?cancel=true
```

**Cau hoi: "Tai sao return-url tro ve /payment/return thay vi /my-bookings?"**

> Vi trang `/payment/return` se tu dong goi API `confirm-deposit` de BE xac nhan lai voi PayOS rang giao dich da PAID. Neu tro thang `/my-bookings` se bo qua buoc xac nhan nay, coc mai o `Pending`, booking mai o `Pending`.

### Cau hinh CORS (SecurityConfig.java):

```java
configuration.setAllowedOriginPatterns(List.of(
    "http://localhost:3000", "http://localhost:5173",
    "https://parking-driver.vercel.app",
    "https://*.vercel.app"  // wildcard cho moi member deploy FE rieng
));
configuration.setAllowCredentials(true); // Gui JWT/cookie
// KHONG dung "*" vi allowCredentials(true) khong hop le voi "*"
```

---

## B. Bao mat - JWT hoat dong ra sao?

### B1. So do tong quat:

```
FE gui username + password
  --> POST /api/auth/login
  --> AuthController.login()
  --> AuthService.login()
  --> authenticationManager.authenticate()  // Spring kiem tra
  --> AppUserDetailsService.loadUserByUsername()  // Load tu DB
  --> BCrypt so sanh mat khau hash
  --> JwtService.generateToken()  // Tao JWT
  --> Tra JWT ve FE (luu vao localStorage)

Moi request sau:
  FE gui: Authorization: Bearer <JWT>
  --> JwtAuthFilter.doFilterInternal()  // Chay truoc moi request
  --> jwtService.extractUsername(token)  // Giai ma JWT lay username
  --> AppUserDetailsService.loadUserByUsername()  // Load user tu DB
  --> jwtService.isTokenValid()  // Kiem tra con han + khop username
  --> SecurityContextHolder.setAuthentication()  // Danh dau da login
  --> Request den Controller (Principal = username da duoc inject)
```

### B2. JwtService.java - Tao & Xac thuc token:

```java
public String generateToken(UserDetails userDetails) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + expirationMs); // + 8 tieng
    return Jwts.builder()
            .subject(userDetails.getUsername())  // Payload: username
            .issuedAt(now)                       // Thoi diem tao
            .expiration(expiry)                  // Het han sau 8 tieng
            .signWith(signingKey())              // Ky HMAC-SHA256 voi secret key
            .compact();
    // Token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkcml2ZXIxIn0.xxxxx
    //        ^--- Header ---^     ^------ Payload ------^  ^-Chu ky-^
}

public boolean isTokenValid(String token, UserDetails userDetails) {
    String username = extractUsername(token); // Lay "sub" tu payload
    return username != null
        && username.equals(userDetails.getUsername()) // Username khop
        && !isExpired(token);                         // Chua het han
}
```

**Token JWT gom 3 phan ngan cach boi dau `.`:**

1. **Header**: thuat toan ma hoa (HS256)
2. **Payload**: chua username (`sub`), thoi diem tao, het han
3. **Signature**: chu ky HMAC-SHA256 = HMAC(Header.Payload, secretKey)

### B3. JwtAuthFilter.java - Chay truoc moi request:

```java
// OncePerRequestFilter: bao dam chi chay dung 1 lan/request
@Override
protected void doFilterInternal(request, response, chain) {
    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
        chain.doFilter(request, response); // Khong co token -> bo qua
        return;
    }
    String token = header.substring(7); // Cat "Bearer " (7 ky tu) lay token
    String username = jwtService.extractUsername(token);
    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        UserDetails ud = userDetailsService.loadUserByUsername(username);
        if (jwtService.isTokenValid(token, ud)) {
            // Dat Authentication vao context -> Spring biet request nay da login
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
    }
    chain.doFilter(request, response); // Chuyen tiep xuong Controller
}
```

### B4. SecurityConfig.java - Quy tac phan quyen:

```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers(
        "/api/auth/**",               // Dang ky, dang nhap -> PUBLIC
        "/api/driver/parking-info",   // Thong tin bai xe -> PUBLIC
        "/api/payments/payos/webhook",// PayOS callback -> PUBLIC (khong co JWT)
        "/swagger-ui/**", "/api-docs/**"
    ).permitAll()
    .anyRequest().authenticated()     // Con lai -> phai co JWT
)
.sessionManagement(s -> s.sessionCreationPolicy(STATELESS)) // Khong tao Session HTTP
.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
```

### B5. Ma hoa mat khau BCrypt:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
    // "abc123" --> "$2a$10$xxx..." (hash 1 chieu, co salt ngau nhien)
    // Moi lan hash ra khac nhau; verify bang BCryptPasswordEncoder.matches()
    // KHONG the reverse (biet hash van khong the lay lai mat khau goc)
}
```

**BCrypt hoat dong:**

1. Sinh ngau nhien 1 `salt` (chuoi ngau nhien) moi lan hash
2. Ket hop salt + password roi chay thuat toan Blowfish 2^10 vong
3. Ket qua: `$2a$10$<salt><hash>` - luu nguyen vao DB
4. Khi dang nhap: lay salt trong chuoi hash, hash lai password goc, so sanh

**Tai sao 2 nguoi cung dat pass "123456" co hash khac nhau?** -> Vi moi lan hash co salt ngau nhien khac nhau.

### B6. ApiResponse - Format JSON chuan:

```java
// TAT CA API deu tra ve dinh dang nay:
{
  "success": true/false,
  "message": "Noi dung thong bao",
  "data": { ... },          // null neu loi
  "errorCode": "QUOTA_FULL" // null neu thanh cong
}
```

**Vi du thanh cong:**

```json
{
  "success": true,
  "message": "Tao booking thanh cong",
  "data": { "reservationId": "abc-123", "status": "Pending", ... },
  "errorCode": null
}
```

**Vi du loi:**

```json
{
  "success": false,
  "message": "Khung gio nay da het quota dat cho (5/5)",
  "data": null,
  "errorCode": "QUOTA_FULL"
}
```

---

## C. Tai sao chia 3 tang? (Kien truc phan lop)

```
[HTTP Request tu FE]
        |
[Controller]  -- "Tiep tan": Nhan HTTP request, kiem tra @Valid DTO,
        |         goi Service, boc ket qua trong ApiResponse tra ve FE.
        |         KHONG chua logic nghiep vu.
[Service]     -- "Nao bo": Toan bo nghiep vu: validate, tinh toan,
        |         xu ly ngoai le (throw Exception). Co the goi nhieu
        |         Repository. Duoc tai su dung boi Controller va Scheduler.
[Repository]  -- "Thu kho": Giao tiep voi MongoDB. Spring Data tu sinh
        |         code tu ten ham (findBy..., countBy...).
[MongoDB]     -- Luu du lieu thuc te
```

**Loi ich thuc te trong du an:**

1. **TAI SU DUNG**: Ham `cancelWithRefund()` trong `ReservationService` duoc goi tu ca:
   - Driver tu huy (API `PATCH /cancel`)
   - Scheduler no-show (`expireNoShowReservations`)
   - Manager cascade bao tri (`CapacityCrash`)
     => Viet 1 lan, dung nhieu noi. Neu viet trong Controller khong the tai su dung.

2. **DE TEST**: Mock `ReservationRepository`, test `ReservationService` doc lap ma khong can khoi dong Server hay ket noi DB that.

3. **TAI CO CAU TRUC**: Neu doi tu MongoDB sang MySQL, chi sua tang Repository, khong dung Service.

4. **RACH BIET**: `ReservationController` chi co 82 dong, ngan gon. `ReservationService` chua toan bo logic phuc tap.

---

## D. Database Entity - Cac Collection trong MongoDB

### D1. User (@Document collection="Users"):

```java
@Document(collection = "Users")
public class User {
    @Id
    private Long userId;

    @Indexed(unique = true)
    private String username;

    @JsonIgnore                        // Annotation nay dam bao passwordHash
    private String passwordHash;       // KHONG BAO GIO xuat hien trong JSON tra ve

    private String fullName;

    @Indexed(unique = true, sparse = true)
    private String phoneNumber;        // sparse = cho phep null (nhieu user khong co SDT)

    @Indexed(unique = true, sparse = true)
    private String email;

    @DBRef
    private Role role;                 // DBRef: luu reference ObjectId, khong embed

    private String status;             // Active, Inactive, Banned

    @Builder.Default
    private Integer consecutiveNoShows = 0; // Dem no-show lien tiep

    @Builder.Default
    private Boolean blacklisted = false;    // Bi cam dat cho
}
```

**Giai thich @Indexed(sparse=true):** MongoDB cho phep nhieu document co field `null` du co unique index, vi `sparse=true` bo qua document co field `null` khi kiem tra unique.

**Giai thich @DBRef:** Thay vi nhung (embed) toan bo object Role vao User, MongoDB chi luu `{ "$ref": "Roles", "$id": 1 }`. Khi truy van, Spring tu dong fetch Role tu collection Roles. Tuong tu `@ManyToOne @JoinColumn` trong JPA/SQL.

### D2. Reservation (@Document collection="Reservations"):

```java
@Document(collection = "Reservations")
public class Reservation {
    @Id
    private UUID reservationId;    // PK dang UUID (sinh ngau nhien, khong doan duoc)

    @JsonIgnore @DBRef
    private User user;             // @JsonIgnore: khong tra User object ra FE
                                   // (tranh lo passwordHash)
    @JsonIgnore @DBRef
    private VehicleType vehicleType;

    private String licensePlate;
    private LocalDateTime expectedEntryTime;
    private LocalDateTime expectedExitTime;

    // ===== PRICE LOCK (Khoa gia) =====
    // Toan bo cac thanh phan gia tai thoi diem dat duoc "dong bang" vao day.
    // Khi checkout, tinh phi dung dung gia nay, KHONG lay gia hien tai.
    // Ly do: Manager co the doi bang gia bat cu luc nao. Phai bao dam
    // khach tra dung gia da xem va dong y luc dat cho.
    private BigDecimal priceAtBookingTime;      // Gia co ban (VD: 10000/h xe may)
    private Integer baseHoursAtBooking;         // So gio trong goi co ban
    private BigDecimal extraHourPriceAtBooking; // Gia gio vuot (sau base hours)
    private BigDecimal nightSurchargeAtBooking; // Phu phi dem
    private BigDecimal lostTicketFeeAtBooking;  // Phi mat ve
    private BigDecimal depositPercentAtBooking; // % coc (VD: 0.20 = 20%)
    private BigDecimal overstayRatePerHourAtBooking; // He so phat qua gio
    private BigDecimal estimatedFeeAtBooking;   // Phi uoc tinh tong the

    // ===== COC =====
    private BigDecimal depositAmount;  // So tien coc thuc te (da lam tron xuong 1000d)
    private String depositStatus;      // Pending, Paid, Forfeited, Refunded

    // ===== GRACE PERIOD (An han check-in) =====
    // checkinDeadline = expectedEntryTime + graceMinutes
    // Cong thuc: graceRaw = duration * depositPercent
    // Cap theo do dai booking: <24h -> tran 2h; <7 ngay -> tran 12h; >7 ngay -> tran 24h
    // Minimum 15 phut du sao
    private LocalDateTime checkinDeadline; // Deadline check-in no-show
    private Integer graceMinutes;          // So phut an han

    // ===== GIA HAN =====
    private LocalDateTime originalExpectedExitTime; // Gio ra GOC (khong thay doi khi gia han)

    private String status; // Pending, Confirmed, CheckedIn, Fulfilled, Cancelled, Expired
    private LocalDateTime createdAt;

    // Phuong thuc phu: phoi ID/ten phang ra JSON thay vi ca object
    // (vi user & vehicleType bi @JsonIgnore)
    public Long getUserId() { return user != null ? user.getUserId() : null; }
    public Integer getVehicleTypeId() { return vehicleType != null ? vehicleType.getVehicleTypeId() : null; }
    public String getVehicleTypeName() { return vehicleType != null ? vehicleType.getTypeName() : null; }
}
```

### D3. ParkingSession (@Document collection="ParkingSessions"):

```java
@Document(collection = "ParkingSessions")
public class ParkingSession {
    @Id private Long sessionId;
    @DBRef private Reservation reservation; // null neu walk-in (khach vang lai)
    @DBRef private User driver;             // null neu khong login
    private String licensePlateIn;
    private String licensePlateOut;
    private LocalDateTime entryTime;        // Bat dau tinh tien (luc barie mo)
    private LocalDateTime exitTime;
    @DBRef private Gate entryGate, exitGate;
    @DBRef private ParkingSlot suggestedSlot;  // O goi y khi vao
    @DBRef private ParkingSlot actualSlot;     // O thuc te camera xac nhan
    private String status; // Admitted, Parked, Moved, Completed, Exception
    private Boolean isForceCheckIn = false;    // Staff nhap tay bien so
    private Boolean isOverstay = false;        // Da tinh phi phat qua gio
    private Boolean isOverstayFlagged = false; // Dang qua gio (chua ra)
}
```

### D4. ParkingSlot (@Document collection="ParkingSlots"):

```java
@Document(collection = "ParkingSlots")
public class ParkingSlot {
    @Id private Long slotId;
    @DBRef private Floor floor;
    private String zone;                   // Khu (A, B, C...) - chi de chi duong
    @Indexed(unique = true)
    private String slotCode;              // VD: "B1-A01" (tang B1, khu A, o 01)
    @DBRef private VehicleType vehicleType;
    private String status;                // Available, Occupied, Maintenance
    // QUY TAC: Chi Camera CV hoac Manager moi duoc doi status
    // Driver/Booking TUYET DOI KHONG DUOC phep doi trang thai o vat ly
}
```

### D5. Payment (@Document collection="Payments"):

```java
@Document(collection = "Payments")
public class Payment {
    @Id private Long paymentId;
    @JsonIgnore @DBRef private ParkingSession session;
    @JsonIgnore @DBRef private Reservation reservation;
    private BigDecimal amount;
    private String paymentMethod;    // Cash, PayOS, VNPay_Mock
    private LocalDateTime paymentTime;
    private String paymentStatus;    // Success, Failed, Pending
    private String transactionReference;  // orderCode PayOS (de doi chieu webhook)
    private String paymentPurpose;  // Deposit, Fee, Extension, Refund
    private String refundStatus;    // null, Requested, AutoRefunded, ManualRequired
}
```

### D6. PricingPolicy (@Document collection="PricingPolicies"):

```java
@Document(collection = "PricingPolicies")
public class PricingPolicy {
    @Id private Integer policyId;
    @DBRef private VehicleType vehicleType;
    private BigDecimal basePrice;      // Gia co ban (bao gom baseHours dau)
    private Integer baseHours;         // So gio trong goi co ban (VD: 1 gio)
    private BigDecimal extraHourPrice; // Gia moi gio them sau baseHours
    private BigDecimal nightSurcharge; // Phu phi dem (18h-6h)
    private BigDecimal lostTicketFee;  // Phi mat ve
    private LocalDateTime effectiveDate;
    private String status; // Active, Expired
}
```

---

# PHAN 2 - AUTH MODULE (Dang ky, Dang nhap, Quen mat khau)

## Luong 2A: Dang ky tai khoan (2 buoc OTP)

**Tai sao lai 2 buoc?** Tranh spam tao tai khoan, xac minh email la that, tranh User "rac" trong DB.

### Buoc 1: Gui OTP

```
FE: POST /api/auth/register/send-otp
Body: { username, password, fullName, email, phoneNumber }
```

**Luong code trong `AuthController.sendRegisterOtp()`:**

1. **Rate Limit**: `rateLimiter.checkRateLimit("register-otp:" + clientIp, 5, 15 phut)` - chan spam email OTP (5 lan/15 phut/IP)
2. Goi `authService.startRegistration(request)`:
   - Validate: username, email, SDT co trung khong? (`userRepository.existsByUsername`, `existsByEmail`, `existsByPhoneNumber`)
   - Sinh OTP 6 so ngau nhien: `SecureRandom.nextInt(1_000_000)` -> format `%06d` (dam bao du 6 chu so)
   - Luu **tam thoi trong RAM** (`pendingRegistrations` - ConcurrentHashMap) - key theo email, TTL 10 phut
   - **KHONG tao User trong DB luc nay** - tranh User rac chua xac thuc
   - Hash password truoc khi luu: `passwordEncoder.encode(request.getPassword())`
   - Gui email OTP: `emailService.sendRegistrationOtp(email, otp, 10)`
3. Tra ve email da che (VD: `ngu***@gmail.com`)

### Buoc 2: Xac thuc OTP -> Tao User

```
FE: POST /api/auth/register/verify
Body: { email, otp }
```

**Luong code trong `AuthService.verifyRegistration()`:**

1. Lay `PendingRegistration` tu RAM theo email
2. Kiem tra OTP het han chua (TTL 10 phut)
3. So sanh OTP nguoi dung nhap vs OTP da luu
4. Kiem tra lai lan nua: username/email/SDT co bi nguoi khac chiem mat trong luc cho OTP khong
5. Tao `User` entity voi `role = "Driver"`, `status = "Active"`, luu vao MongoDB
6. Xoa khoi `pendingRegistrations` RAM
7. Goi `jwtService.generateToken()` tra JWT ngay -> **tu dong dang nhap**

## Luong 2B: Dang nhap

```
FE: POST /api/auth/login
Body: { username, password }
```

**Luong code trong `AuthService.login()`:**

```java
public LoginResponse login(LoginRequest request) {
    // Buoc 1: Spring Security kiem tra username + password
    // authenticationManager goi AppUserDetailsService.loadUserByUsername()
    // roi BCryptPasswordEncoder.matches(password, passwordHash)
    // Neu sai -> nem BadCredentialsException -> FE nhan 401
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
    );

    // Buoc 2: Load UserDetails de tao token
    UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());

    // Username co the la ten dang nhap / email / SDT (resolve cung 1 query)
    User user = userRepository.findByUsernameOrEmailOrPhone(request.getUsername())
        .stream().findFirst().orElseThrow(...);

    // Buoc 3: Sinh JWT
    String token = jwtService.generateToken(userDetails);

    // Tra ve token + username + roleName
    return new LoginResponse(token, user.getUsername(), user.getRole().getRoleName());
}
```

**Dang xuat:** JWT Stateless - server KHONG luu session. `POST /api/auth/logout` chi tra 200, thuc te FE xoa token khoi localStorage.

## Luong 2C: Quen mat khau (OTP qua Email)

**2 kenh tach biet:**

- Kenh **KHACH (Driver)**: `/api/auth/forgot-password` + `/api/auth/reset-password`
- Kenh **NOI BO (Staff/Manager/Admin)**: `/api/auth/staff/forgot-password` + `/api/auth/staff/reset-password`

**Tai sao tach 2 kenh?** App khach (parking-driver) KHONG the dung de dat lai mat khau tai khoan nhan vien. Bao mat tang them mot lop: Hacker co app khach cung khong tan cong tai khoan noi bo qua luong nay duoc.

**Luong OTP quen mat khau:**

```
FE gui: POST /api/auth/forgot-password
Body: { identifier: "username hoac email hoac SDT" }

BE: startReset(identifier, driverChannel=true)
  1. Tim user: userRepository.findByUsernameOrEmailOrPhone(identifier)
  2. Kiem tra dung kenh: isDriver(user) phai = true (neu la Staff -> bao loi)
  3. Xoa OTP cu: passwordResetTokenRepository.deleteByUser_UserId()
  4. Sinh OTP 6 so duy nhat (kiem tra UNIQUE trong DB truoc khi luu)
  5. Luu PasswordResetToken vao MongoDB (TTL 10 phut)
  6. Gui email: emailService.sendPasswordResetOtp(email, otp, 10)
  7. Tra ve email da che

FE gui: POST /api/auth/reset-password
Body: { otp: "123456", newPassword: "matkhaumoi" }

BE: finishReset(otp, newPassword, driverChannel=true)
  1. Validate do dai mat khau (6-50 ky tu)
  2. Tim PasswordResetToken theo OTP
  3. Kiem tra con han chua (expiryDate.isAfter(now))
  4. Kiem tra dung kenh (isDriver(user) phai = true)
  5. Hash mat khau moi: passwordEncoder.encode(newPassword)
  6. Luu User voi passwordHash moi
  7. Xoa PasswordResetToken (OTP dung 1 lan)
```

---

# PHAN 3 - DRIVER APIs (Chi tiet tung chuc nang)

**Base path:** `/api/driver`
**Phan quyen:** `@PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ADMIN')")` - tat ca API tru parking-info deu yeu cau JWT

---

## 3A. Lay thong tin bai xe (Headroom / Parking Info)

**API:** `GET /api/driver/parking-info`
**Phan quyen:** PUBLIC (khong can JWT - khach chua dang nhap van xem duoc)

**FE goi:** Trang chu goi API nay hien thi "Xe may: Con 25 cho | O to 4 cho: Con 10 cho"

**Luong code trong `ParkingInfoService.getParkingInfo()`:**

```java
public ParkingInfoResponse getParkingInfo() {
    // 1. Doc gio hoat dong tu SystemConfig
    String startHour = systemConfigRepository.findById("DAY_START_HOUR")
        .map(SystemConfig::getConfigValue).orElse("06:00");
    String endHour = systemConfigRepository.findById("DAY_END_HOUR")
        .map(SystemConfig::getConfigValue).orElse("18:00");

    // 2. Lay bang gia dang Active
    List<PricingPolicy> activePolicies = pricingPolicyRepository.findAll().stream()
        .filter(p -> "Active".equals(p.getStatus())).collect(toList());

    // 3. Dem so cho theo loai xe - 1 query GROUP BY thay vi vong lap N lan
    // (hieu qua hon: khong fetch toan bo danh sach slot ve RAM)
    Map<Integer, SlotCountByType> countByType = parkingSlotRepository
        .countSlotsGroupedByVehicleType().stream()
        .collect(toMap(SlotCountByType::getVehicleTypeId, c -> c));

    // 4. Tinh cho kha dung cho tung loai xe
    for (VehicleType vt : vehicleTypeRepository.findAll()) {
        SlotCountByType c = countByType.get(vt.getVehicleTypeId());
        long total = c != null ? c.getTotal() : 0;      // Tong so o (tru Maintenance)
        long available = c != null ? c.getAvailable() : 0; // So o hien con trong (Available)
        // available = tong o - o dang Occupied - o dang Maintenance
    }
}
```

**Luu y quan trong:** Cong thuc cho trong hien thi o trang chu (**cho vat ly**):
`available = total slots - Occupied slots - Maintenance slots`

Day KHAC voi cong thuc **Walk-in headroom** (cho theo suc chua + booking):
`Walk-in headroom = C - Inside(t) - Outstanding(t)`

---

## 3B. Xem Bao gia truoc khi dat (Quote)

**API:** `GET /api/driver/reservations/quote?vehicleTypeId=1&entryTime=...&exitTime=...`

**FE goi:** Truoc khi bam dat cho, hien thi "Phi uoc tinh: 20,000d | Tien coc: 4,000d"

**Luong code trong `ReservationService.quote()`:**

```java
@Transactional(readOnly = true)  // Chi doc, khong ghi -> hieu qua hon
public ReservationQuoteDTO quote(Integer vehicleTypeId, LocalDateTime entryTime, LocalDateTime exitTime) {
    if (!exitTime.isAfter(entryTime)) {
        throw new BusinessRuleException("Gio ra phai sau gio vao");
    }
    // Goi PricingService - tinh phi theo gio vao/ra + bang gia hien tai
    BigDecimal fee = pricingService.calculateFee(vehicleTypeId, entryTime, exitTime);

    // Tinh coc = fee * depositPercent (lay % tu FeeConfigService)
    // Lam tron xuong boi so cua 1000d (tranh so le)
    BigDecimal deposit = depositFor(fee, feeConfigService.getFeeConfig());

    return new ReservationQuoteDTO(fee, deposit);
}

private BigDecimal depositFor(BigDecimal fee, FeeConfigResponse feeConfig) {
    BigDecimal deposit = fee.multiply(toFraction(feeConfig.getDepositPercent()));
    // RoundingMode.FLOOR = lam tron XUONG (co loi cho khach)
    // VD: 22.500 -> 22.000 (boi so cua 1.000d)
    return deposit.divide(BigDecimal.valueOf(1000), 0, RoundingMode.FLOOR)
                  .multiply(BigDecimal.valueOf(1000));
}
```

---

## 3C. Tao Dat cho - LUONG CORE QUAN TRONG NHAT

**API:** `POST /api/driver/reservations`
**Body:** `{ "vehicleTypeId": 1, "licensePlate": "51H-123.45", "expectedEntryTime": "...", "expectedExitTime": "..." }`

**Day la luong dai nhat, phai giai thich ro tung buoc khi bao ve.**

### 3C-Step 1: Controller nhan request

```java
// ReservationController.java - dong 27
@PostMapping
@PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ADMIN')")
public ApiResponse<ReservationDTO> create(
        @Valid @RequestBody ReservationRequest request, // @Valid kich hoat Validation
        Authentication auth) {                          // Spring inject Principal tu JWT
    return ApiResponse.ok(
        "Tao booking thanh cong, vui long thanh toan coc de xac nhan",
        ReservationDTO.from(
            reservationService.create(request, auth.getName()) // auth.getName() = username
        )
    );
}
```

**`@Valid` lam gi?** Kich hoat kiem tra cac annotation trong `ReservationRequest` truoc khi vao Service:

- `@NotBlank` tren `licensePlate` -> bien so khong duoc trong
- `@Future` tren `expectedEntryTime` -> phai la thoi gian tuong lai
- `@NotNull` tren `vehicleTypeId` -> bat buoc chon loai xe

### 3C-Step 2: Service xu ly - `ReservationService.create()`

```java
@Transactional(isolation = Isolation.SERIALIZABLE) // Khoa giao dich toan phan
public Reservation create(ReservationRequest request, String username) {

    // === VALIDATE 1: Gio ra phai sau gio vao ===
    if (!request.getExpectedExitTime().isAfter(request.getExpectedEntryTime())) {
        throw new BusinessRuleException("Gio ra phai sau gio vao");
    }

    // === VALIDATE 2: Gio vao phai cach hien tai >= depositPaymentWindow phut ===
    // Ly do: Sau khi dat cho, khach can thoi gian thanh toan coc qua PayOS.
    // depositPaymentWindowMinutes lay tu SystemConfig (mac dinh 15 phut).
    // Neu dat cho sat gio thi khach khong kip thanh toan truoc khi Scheduler het han booking.
    int depositWindowMinutes = feeConfigService.getFeeConfig().getDepositPaymentWindowMinutes();
    if (request.getExpectedEntryTime().isBefore(LocalDateTime.now().plusMinutes(depositWindowMinutes))) {
        throw new BusinessRuleException(
            "Gio vao phai cach hien tai it nhat " + depositWindowMinutes + " phut");
    }

    // === VALIDATE 3: Kiem tra user ton tai va khong bi chan ===
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay user"));
    if (Boolean.TRUE.equals(user.getBlacklisted())) {
        throw new BusinessRuleException(
            "Tai khoan da bi blacklist do nhieu lan no-show", "USER_BLACKLISTED");
    }

    // === VALIDATE 4: Kiem tra loai xe ton tai ===
    VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay loai xe"));

    // === VALIDATE 5: Gioi han toi da 3 ve dang hoat dong ===
    // Tranh 1 nguoi gom qua nhieu slot gay cang thang suc chua
    long activeCount = reservationRepository.countByUser_UserIdAndStatusIn(
        user.getUserId(), List.of("Pending", "Confirmed", "CheckedIn"));
    if (activeCount >= 3) {
        throw new BusinessRuleException(
            "Mot tai khoan chi duoc phep co toi da 3 ve dang hoat dong", "MAX_RESERVATIONS_REACHED");
    }

    // === VALIDATE 6: Chong trung bien so (Overlap gio) ===
    // Bien so nay co dang co booking trong khung gio chon khong?
    List<Reservation> overlaps = reservationRepository
        .findByLicensePlateAndStatusInAndExpectedExitTimeGreaterThanAndExpectedEntryTimeLessThan(
            request.getLicensePlate(),
            List.of("Pending", "Confirmed", "CheckedIn"),
            request.getExpectedEntryTime(),   // exitTime cua booking cu > entryTime moi
            request.getExpectedExitTime());   // entryTime cua booking cu < exitTime moi
    if (!overlaps.isEmpty()) {
        throw new BusinessRuleException(
            "Bien so nay da co dat cho trong khung gio ban chon", "LICENSE_PLATE_OVERLAP");
    }

    // === VALIDATE 7: Kiem tra Quota (Suc chua theo khung gio) ===
    checkQuota(request, vehicleType);

    // === TINH TOAN GIA & COC ===
    // Lay bang gia Active moi nhat cho loai xe
    PricingPolicy policy = pricingPolicyRepository
        .findFirstByVehicleType_VehicleTypeIdAndStatusOrderByEffectiveDateDesc(
            vehicleType.getVehicleTypeId(), "Active")
        .orElseThrow(() -> new ResourceNotFoundException("Chua co bang gia cho loai xe nay"));

    // Tinh phi uoc tinh bang PricingService (dung chung voi checkOut sau nay)
    BigDecimal estimatedFee = pricingService.calculateFee(
        policy, request.getExpectedEntryTime(), request.getExpectedExitTime());

    // Tinh tien coc (lam tron xuong boi so 1000d)
    BigDecimal deposit = depositFor(estimatedFee, feeConfigService.getFeeConfig());

    // === TINH GRACE PERIOD (An han check-in) ===
    GracePeriod gracePeriod = computeGracePeriod(
        request.getExpectedEntryTime(),
        request.getExpectedExitTime(),
        feeConfigService.getFeeConfig().getDepositPercent());
    // Cong thuc:
    // graceRaw = duration * depositPercent
    // cap = <24h -> 2h ; <7 ngay -> 12h ; >7 ngay -> 24h
    // grace = MAX(15 phut, MIN(graceRaw, cap))
    // checkinDeadline = expectedEntryTime + grace

    // === TAO RESERVATION (KHOA GIA - PRICE LOCK) ===
    Reservation reservation = Reservation.builder()
        .user(user)
        .vehicleType(vehicleType)
        .licensePlate(request.getLicensePlate())
        .expectedEntryTime(request.getExpectedEntryTime())
        .expectedExitTime(request.getExpectedExitTime())
        .depositAmount(deposit)
        // SNAPSHOT GIA tai thoi diem dat:
        .priceAtBookingTime(policy.getBasePrice())
        .baseHoursAtBooking(policy.getBaseHours())
        .extraHourPriceAtBooking(policy.getExtraHourPrice())
        .nightSurchargeAtBooking(policy.getNightSurcharge())
        .lostTicketFeeAtBooking(policy.getLostTicketFee())
        .depositPercentAtBooking(feeConfig.getDepositPercent())
        .overstayRatePerHourAtBooking(feeConfig.getOverstayRatePerHour())
        .estimatedFeeAtBooking(estimatedFee)
        .originalExpectedExitTime(request.getExpectedExitTime())
        .checkinDeadline(gracePeriod.checkinDeadline())
        .graceMinutes(gracePeriod.graceMinutes())
        .depositStatus("Pending")  // Chua thanh toan coc
        .status("Pending")
        .createdAt(LocalDateTime.now())
        .build();

    return reservationRepository.save(reservation); // Luu vao MongoDB
}
```

### 3C-Step 3: checkQuota() - Kiem tra suc chua

```java
private void checkQuota(ReservationRequest request, VehicleType vehicleType) {
    // 1. Lay cau hinh quota cho loai xe nay
    List<BookingQuota> quotas = bookingQuotaRepository
        .findByVehicleType_VehicleTypeId(vehicleType.getVehicleTypeId());

    // 2. Tim quota ap dung cho khung gio dang dat
    var entryTimeOfDay = request.getExpectedEntryTime().toLocalTime();
    BookingQuota applicable = quotas.stream()
        .filter(q -> !Boolean.FALSE.equals(q.getIsActive()))
        .filter(q -> !entryTimeOfDay.isBefore(q.getStartTime())
                  && entryTimeOfDay.isBefore(q.getEndTime()))
        .findFirst().orElse(null);

    if (applicable == null) return; // Khong co quota gioi han -> cho dat

    // 3. Tinh suc chua thuc te (bo o Maintenance)
    long capacity = slotRepository.countByVehicleType_VehicleTypeIdAndStatusNot(
        vehicleType.getVehicleTypeId(), "Maintenance");

    // 4. Quota = % * suc chua (VD: 60% * 100 o = 60 ve toi da)
    long quotaLimit = (long) Math.floor(capacity * applicable.getQuotaPercent().doubleValue() / 100.0);

    // 5. Dem booking dang chon khung gio do (overlap)
    long currentBooked = reservationRepository
        .countByVehicleType_VehicleTypeIdAndStatusInAndExpectedEntryTimeLessThanAndExpectedExitTimeGreaterThan(
            vehicleType.getVehicleTypeId(),
            List.of("Pending", "Confirmed"),  // Chi dem cac booking con hieu luc
            request.getExpectedExitTime(),     // Booking cu phai bat dau truoc gio ra moi
            request.getExpectedEntryTime());   // Booking cu phai ket thuc sau gio vao moi

    // 6. Het quota -> nem loi
    if (currentBooked >= quotaLimit) {
        throw new BusinessRuleException(
            "Khung gio nay da het quota dat cho (" + currentBooked + "/" + quotaLimit + ")",
            "QUOTA_FULL");
    }
}
```

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

### 3C-Step 4: Repository luu vao MongoDB

```java
// ReservationRepository.java - khai bao
public interface ReservationRepository extends MongoRepository<Reservation, UUID> {
    // Spring Data tu sinh code SQL-MongoDB tu ten ham:
    // countByUser_UserIdAndStatusIn -> dem theo userId + status nam trong list
    @CountQuery("{ 'user.$id': ?0, 'status': { $in: ?1 } }")
    long countByUser_UserIdAndStatusIn(Long userId, List<String> statuses);

    // Kiem tra overlap boi tu dieu kien:
    // licensePlate = ?0  AND  status IN ?1  AND  exitTime > entryNew  AND  entryTime < exitNew
    @Query("{ 'licensePlate': ?0, 'status': { $in: ?1 }, " +
           "'expectedExitTime': { $gt: ?2 }, 'expectedEntryTime': { $lt: ?3 } }")
    List<Reservation> findByLicensePlateAndStatusInAndExpectedExitTimeGreaterThanAndExpectedEntryTimeLessThan(
        String licensePlate, List<String> statuses, LocalDateTime start, LocalDateTime end);
}
```

### 3C-Step 5: Tra ket qua ve FE

```java
// Controller boc ket qua:
return ApiResponse.ok(
    "Tao booking thanh cong",
    ReservationDTO.from(reservation)  // Map Entity -> DTO (khong lo passwordHash)
);

// ReservationDTO.from() chi lay nhung truong FE can:
// reservationId, licensePlate, status, depositAmount, expectedEntryTime...
// KHONG tra: passwordHash, toan bo User object
```

**Tai sao dung `@Transactional(isolation = Isolation.SERIALIZABLE)`?**

> Day la muc cach ly cao nhat. Khi 2 nguoi cung dat cho luc con 1 suất:
>
> - Nguoi A va B cung vao `checkQuota()`, cung thay `currentBooked = 59, quotaLimit = 60` -> cung thoa man
> - O muc ReadCommitted (mac dinh): ca 2 cung INSERT thanh cong -> VƯỢT QUOTA
> - O muc SERIALIZABLE: MongoDB lock, ep xep hang. Nguoi A insert truoc, B vao `checkQuota()` lai thay `60 >= 60` -> nem `QUOTA_FULL`

---

## 3D. Huy Dat cho (Cancel)

**API:** `PATCH /api/driver/reservations/{id}/cancel`

**Luong code trong `ReservationService.cancel()`:**

```java
@Transactional
public Reservation cancel(UUID id, String username) {
    Reservation reservation = findById(id);

    // Kiem tra quyen so huu
    if (!reservation.getUser().getUsername().equals(username)) {
        throw new BusinessRuleException("Ban khong co quyen huy booking nay");
    }

    // Chi huy duoc Pending hoac Confirmed (khong the huy khi da vao bai)
    if (!List.of("Pending", "Confirmed").contains(reservation.getStatus())) {
        throw new BusinessRuleException("Booking khong the huy o trang thai hien tai");
    }

    // Cua so huy: phai truoc 3 gio so voi gio vao
    // Ly do: Bai xe can biet truoc de mo quota cho nguoi khac dat
    long hoursUntilEntry = ChronoUnit.HOURS.between(
        LocalDateTime.now(), reservation.getExpectedEntryTime());
    if (hoursUntilEntry < 3) {
        throw new BusinessRuleException(
            "Khong the huy booking trong vong 3 gio truoc gio vao", "CANCEL_TOO_LATE");
    }

    return cancelWithRefund(reservation, "Cancelled", true); // refund=true -> hoan coc
}
```

**Ham dung chung `cancelWithRefund()`:**

```java
// Ham nay duoc goi boi 3 noi:
// 1. Driver tu huy (refund=true)
// 2. Scheduler no-show (refund=false -> mat coc)
// 3. Manager cascade capacity crash (refund=true)
@Transactional
public Reservation cancelWithRefund(Reservation reservation, String newStatus, boolean refund) {
    reservation.setStatus(newStatus);
    String depositStatus = reservation.getDepositStatus();

    if (refund && "Paid".equals(depositStatus)) {
        // Co coc va can hoan -> goi PayOS Payout hoac danh dau ManualRequired
        payosService.attemptRefundPaidDeposit(reservation, "Hoan coc...");
        reservation.setDepositStatus("Refunded");
    } else if (refund && "Pending".equals(depositStatus)) {
        // Chua tra coc -> huy link thanh toan
        payosService.findPendingDepositOrderCode(reservation)
            .ifPresent(orderCode -> payosService.cancelPaymentLink(orderCode, "Huy..."));
    } else if (!refund && "Paid".equals(depositStatus)) {
        // No-show: mat coc
        reservation.setDepositStatus("Forfeited");
    }
    return reservationRepository.save(reservation);
}
```

---

## 3E. Thanh toan Coc qua PayOS (3 buoc)

### Buoc 1: Tao Link Thanh toan QR

**API:** `POST /api/driver/payments/payos/create-link`
**Body:** `{ "reservationId": "uuid..." }`

**Luong code trong `PayosService.createDepositLink()`:**

```java
@Transactional
public PayosLinkResponse createDepositLink(UUID reservationId, String username) {
    // 1. Kiem tra cau hinh PayOS
    if (clientId == null || clientId.isBlank()) {
        throw new BusinessRuleException("PayOS chua duoc cau hinh", "PAYOS_NOT_CONFIGURED");
    }

    // 2. Kiem tra booking ton tai + quyen so huu + trang thai Pending
    Reservation r = reservationRepository.findById(reservationId).orElseThrow(...);
    if (!r.getUser().getUsername().equals(username)) {
        throw new BusinessRuleException("Ban khong co quyen thanh toan booking nay");
    }
    if (!"Pending".equals(r.getStatus())) {
        throw new BusinessRuleException("Booking khong o trang thai cho thanh toan coc");
    }

    // 3. Tinh so tien coc (toi thieu 2000d theo quy dinh PayOS)
    long amount = r.getDepositAmount() != null ? r.getDepositAmount().longValue() : 0;
    if (amount < 1000) amount = 2000;

    // 4. Sinh orderCode: so nguyen duong, < Number.MAX_SAFE_INTEGER cua JS (< 10^15)
    // Thuat toan: (hashCode % 10^8) * 10^6 + currentTimeMillis
    long orderCode = buildOrderCode(reservationId);

    // 5. Mo ta ngan gon (<= 25 ky tu theo PayOS)
    String description = truncate("Coc " + r.getLicensePlate(), 25);

    // 6. Goi API PayOS tao link
    // Truoc khi goi: tao chu ky HMAC-SHA256 cac tham so
    PayosLinkResponse resp = callCreatePaymentLink(orderCode, amount, description);
    // callCreatePaymentLink lam:
    // - Sap xep param theo thu tu alphabetical (chuẩn PayOS)
    // - Tao chuoi: "amount=...&cancelUrl=...&description=...&orderCode=...&returnUrl=..."
    // - HMAC-SHA256(chuoi, checksumKey) -> signature
    // - POST https://api-merchant.payos.vn/v2/payment-requests
    // - PayOS tra ve { checkoutUrl, qrCode, orderCode, ... }

    // 7. Luu Payment Pending vao DB de webhook doi chieu sau
    paymentRepository.save(Payment.builder()
        .reservation(r)
        .amount(BigDecimal.valueOf(amount))
        .paymentMethod("PayOS")
        .paymentStatus("Pending")
        .paymentPurpose("Deposit")
        .transactionReference(String.valueOf(orderCode)) // Key quan trong de doi chieu webhook
        .build());

    // 8. Tra checkoutUrl ve FE -> FE chuyen huong trinh duyet
    return resp;
}
```

### Buoc 2: PayOS Webhook (Tu dong, PayOS goi BE)

**API:** `POST /api/payments/payos/webhook`
**Khong co JWT** (PayOS tu goi, khong co tai khoan user)

**Luong code trong `PayosService.handleWebhook()`:**

```java
// Xac thuc chu ky truoc, xu ly sau
public void handleWebhook(JsonNode body) {
    // 1. Doc signature PayOS gui ve
    String receivedSignature = body.get("signature").asText();

    // 2. Tai tao signature ben BE tu data va checksumKey bi mat
    //    - Lay tat ca cac truong data, sap xep alphabetical
    //    - Ket hop: "amount=...&description=...&orderCode=..."
    //    - HMAC-SHA256(chuoi, checksumKey) -> expectedSig
    String expectedSignature = computeSignature(body.get("data"), checksumKey);

    // 3. So sanh: neu khong khop -> tu choi (Hacker gia mao)
    if (!expectedSignature.equals(receivedSignature)) {
        throw new BusinessRuleException("Chu ky webhook khong hop le", "INVALID_SIGNATURE");
    }

    // 4. Lay orderCode
    long orderCode = body.get("data").get("orderCode").asLong();

    // 5. Chuyen trang thai thanh toan
    markPaymentPaid(orderCode);
}

private void markPaymentPaid(long orderCode) {
    // Tim Payment theo orderCode
    Payment payment = paymentRepository.findFirstByTransactionReference(String.valueOf(orderCode))
        .orElseThrow(() -> ...);

    // Idempotent: neu da la Success thi bo qua (PayOS co the goi webhook nhieu lan)
    if ("Success".equals(payment.getPaymentStatus())) return;

    // Cap nhat Payment
    payment.setPaymentStatus("Success");
    paymentRepository.save(payment);

    // Cap nhat Reservation
    Reservation reservation = payment.getReservation();
    if ("Pending".equals(reservation.getStatus()) || "Expired".equals(reservation.getStatus())) {
        // Hoi sinh Expired: khach dang thanh toan tren PayOS thi Scheduler da het han booking
        // -> khi PayOS xac nhan PAID, ta hoi sinh booking thanh Confirmed
        reservation.setStatus("Confirmed");
        reservation.setDepositStatus("Paid");
        reservationRepository.save(reservation);
    }
}
```

### Buoc 3: FE xac nhan sau khi quay lai (confirm-deposit)

**API:** `POST /api/driver/reservations/{id}/confirm-deposit?orderCode=12345`

**Khi nao can buoc nay?** Webhook co the den muon hoac bi mat (mang). FE goi API nay khi khach quay lai trang web sau khi thanh toan de BE chu dong kiem tra voi PayOS.

```java
@Transactional
public Reservation confirmDeposit(UUID id, String username, Long orderCode) {
    Reservation reservation = findById(id);
    if (!reservation.getUser().getUsername().equals(username)) {
        throw new BusinessRuleException("Ban khong co quyen thanh toan booking nay");
    }

    // Cho phep ca "Expired": scheduler co the da het han trong luc khach thanh toan
    if (!"Pending".equals(reservation.getStatus()) && !"Expired".equals(reservation.getStatus())) {
        throw new BusinessRuleException("Booking khong o trang thai cho thanh toan coc");
    }

    // Tim giao dich Payment
    Payment payment;
    if (orderCode != null) {
        // Uu tien orderCode PayOS tra ve (giao dich thuc su da tra tien)
        payment = paymentRepository.findFirstByTransactionReference(String.valueOf(orderCode))
            .orElseThrow(() -> new BusinessRuleException("Khong tim thay giao dich " + orderCode));
    } else {
        // Fallback: giao dich moi nhat (can than: khach thu nhieu lan)
        payment = paymentRepository
            .findFirstByReservation_ReservationIdOrderByPaymentIdDesc(id)
            .orElseThrow(...);
    }

    // Goi PayOS kiem tra giao dich nay co that su PAID chua
    // BE KHONG tin FE goi la da xong -> phai kiem tra truc tiep voi PayOS
    payosService.verifyPaymentStatus(Long.parseLong(payment.getTransactionReference()));
    // verifyPaymentStatus goi PayOS GET /v2/payment-requests/{orderCode}
    // Neu PayOS tra ve PAID -> goi markPaymentPaid() cap nhat trang thai
    // Neu chua PAID -> nem BusinessRuleException -> FE hien thong bao loi

    return reservationRepository.findById(id).orElseThrow();
}
```

---

## 3F. Gia han Booking (extendReservation)

**API:** `POST /api/driver/reservations/{id}/extend?newExitTime=...`

**Khach dang trong bai (CheckedIn) muon o them gio.**

**Ky thuat dac biet - chia 3 pha (khong giu ket noi DB luc goi PayOS):**

```java
// @Transactional(propagation = NOT_SUPPORTED) = method nay khong co transaction
// Tu quan ly transaction bang TransactionTemplate
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public ExtendReservationResponse extendReservation(UUID id, String username, LocalDateTime newExitTime) {
    TransactionTemplate tx = new TransactionTemplate(txManager);

    // == PHA 1: Kiem tra + tinh phi (trong 1 transaction ngan) ==
    ExtensionQuote quote = tx.execute(status -> {
        Reservation reservation = findById(id);
        // Kiem tra quyen + trang thai
        if (!reservation.getUser().getUsername().equals(username)) throw ...;
        if (!List.of("Confirmed", "CheckedIn").contains(reservation.getStatus())) throw ...;
        if (!newExitTime.isAfter(reservation.getExpectedExitTime())) throw ...;

        // Kiem tra Quota cho phan gia han (khung gio mo rong)
        checkQuota(mockRequest, reservation.getVehicleType());

        // Tinh phi gia han theo BANG GIA HIEN TAI (khong dung snapshot cu)
        BigDecimal extensionFee = pricingService.calculateFee(
            vehicleTypeId, reservation.getExpectedExitTime(), newExitTime);

        return new ExtensionQuote(reservation.getReservationId(), reservation.getLicensePlate(), extensionFee);
    }); // Transaction dong lai day

    // == PHA 2: Goi PayOS (KHONG giu transaction DB) ==
    // Khi goi HTTP sang PayOS co the mat ~15 giay
    // Neu giu transaction mo: lock DB lau -> anh huong cac request khac
    PayosLinkResponse link = payosService.createLinkForAmount(
        quote.reservationId(), quote.fee().longValue(), "Gia han " + quote.licensePlate());

    // == PHA 3: Cap nhat DB (trong 1 transaction ngan) ==
    Reservation updated = tx.execute(status -> {
        Reservation reservation = findById(quote.reservationId());
        reservation.setExpectedExitTime(newExitTime); // Keo dai gio ra
        // originalExpectedExitTime KHONG thay doi -> checkout van dung gia khoa ban dau
        Reservation saved = reservationRepository.save(reservation);

        // Luu Payment Pending
        paymentRepository.save(Payment.builder()
            .reservation(saved)
            .amount(BigDecimal.valueOf(link.getAmount()))
            .paymentStatus("Pending")
            .paymentPurpose("Extension")
            .transactionReference(String.valueOf(link.getOrderCode()))
            .build());

        return saved;
    });

    return ExtendReservationResponse.builder()
        .reservation(ReservationDTO.from(updated))
        .payment(link)
        .build();
}
```

---

## 3G. Lay / Cap nhat Ho so ca nhan (Profile)

**GET /api/driver/profile:**

```java
// ProfileController.java
@GetMapping
public ApiResponse<ProfileDTO> getProfile(Authentication auth) {
    return ApiResponse.ok(profileService.getProfile(auth.getName()));
    // auth.getName() = username lay tu JWT (JwtAuthFilter da inject vao SecurityContext)
}

// ProfileService.getProfile()
@Transactional(readOnly = true)
public ProfileDTO getProfile(String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay user"));
    // Map User entity -> ProfileDTO (khong tra passwordHash)
    return ProfileDTO.builder()
        .username(user.getUsername())
        .fullName(user.getFullName())
        .email(user.getEmail())
        .phoneNumber(user.getPhoneNumber())
        .roleName(user.getRole() != null ? user.getRole().getRoleName() : null)
        .status(user.getStatus())
        .build();
}
```

**PUT /api/driver/profile:**

```java
// ProfileService.updateProfile()
@Transactional
public ProfileDTO updateProfile(String username, ProfileUpdateRequest request) {
    User user = findByUsername(username);
    user.setFullName(request.getFullName());
    if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
    if (request.getEmail() != null) user.setEmail(request.getEmail());
    user.setUpdatedAt(LocalDateTime.now());
    return toDto(userRepository.save(user)); // save() = UPDATE neu da ton tai @Id
}
```

---

## 3H. Lich su Phien & Danh gia (Session & Feedback)

**GET /api/driver/sessions/current:** Lay phien dang mo (Admitted / Parked)
**GET /api/driver/sessions/history:** Lich su cac phien da Completed

```
Luu y: Check-in (tao Session) va Check-out (dong Session)
la nhiem vu cua STAFF tai cong barie, khong phai Driver.
Driver chi CO THE XEM, khong doi trang thai session.
```

**POST /api/driver/feedbacks - Danh gia:**

```java
// FeedbackDriverService.java
public Feedback createFeedback(FeedbackRequest request, String username) {
    ParkingSession session = sessionRepository.findById(request.getSessionId()).orElseThrow();

    // Kiem tra quyen: phai la chu phien
    if (!session.getDriver().getUsername().equals(username)) throw ...;

    // Chi danh gia duoc khi phien da Completed
    if (!"Completed".equals(session.getStatus())) {
        throw new BusinessRuleException("Chi duoc danh gia phien da hoan tat");
    }

    // Moi phien chi duoc 1 feedback
    if (feedbackRepository.existsBySession_SessionId(session.getSessionId())) {
        throw new BusinessRuleException("Ban da danh gia phien nay roi");
    }

    return feedbackRepository.save(Feedback.builder()
        .session(session)
        .rating(request.getRating())  // 1-5 sao
        .comment(request.getComment())
        .createdAt(LocalDateTime.now())
        .build());
}
```

---

# PHAN 4 - BACKGROUND JOBS (SCHEDULER)

**File:** `BE/src/main/java/com/parking/scheduler/SessionExpiryScheduler.java`
**Annotation:** `@Component @Transactional @Scheduled` (Spring scheduler)

**5 Cron Job chay ngam, khong co API tuong ung:**

## 4.1 - Phat hien Loiterer (Moi 5 phut)

```java
@Scheduled(fixedDelay = 5 * 60 * 1000)  // 5 phut
public void flagStaleAdmittedSessions() {
    // Nguong: phien "Admitted" qua 15 phut ma chua Parked
    LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
    List<ParkingSession> stale = sessionRepository
        .findByStatusAndEntryTimeBefore("Admitted", threshold);

    for (ParkingSession session : stale) {
        // Tranh tao trung IncidentReport cho cung 1 phien
        if (incidentReportRepository.existsBySession_SessionIdAndIssueType(
                session.getSessionId(), "Loiterer")) continue;

        // Tao IncidentReport de Staff kiem tra thu cong
        createIncident(session, "Loiterer",
            "Phien Admitted #" + session.getSessionId() + " qua 15 phut khong tien trien");
    }
}
```

## 4.2 - Tu dong dong Phien treo "Moved" (Moi 5 phut)

```java
@Scheduled(fixedDelay = 5 * 60 * 1000)
public void autoCloseStaleMovedSessions() {
    // Phien "Moved" qua 30 phut khong check-out = co the tron ve
    LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);
    List<ParkingSession> stale = sessionRepository
        .findByStatusAndEntryTimeBefore("Moved", threshold);

    for (ParkingSession session : stale) {
        session.setStatus("Completed"); // Tu dong dong phien
        session.setExitTime(LocalDateTime.now());
        sessionRepository.save(session);

        // Tao IncidentReport de truy thu phi sau
        createIncident(session, "Overstay",
            "Phien Moved #" + session.getSessionId() + " qua 30 phut khong check-out");
    }
}
```

## 4.3 - Danh dau xe Qua gio (Moi 5 phut)

```java
@Scheduled(fixedDelay = 5 * 60 * 1000)
public void flagOverstaySessions() {
    // Phat hien phien Admitted/Parked co booking da qua expectedExitTime + 30 phut
    List<ParkingSession> openSessions = sessionRepository
        .findByStatusInAndIsOverstayFlaggedNot(List.of("Admitted", "Parked"));

    for (ParkingSession session : openSessions) {
        Reservation reservation = session.getReservation();
        if (reservation == null) continue; // Walk-in: khong co deadline

        if (reservation.getExpectedExitTime().plusMinutes(30).isBefore(LocalDateTime.now())) {
            session.setIsOverstayFlagged(true); // Bao trang thai qua gio
            sessionRepository.save(session);
            // Tao IncidentReport de Staff xu ly
            createIncident(session, "Overstay", "Phien #" + session.getSessionId() + " qua gio du kien...");
        }
    }
}
```

## 4.4 - Xu ly Khach bung hen No-show (Moi 5 phut)

```java
@Scheduled(fixedDelay = 5 * 60 * 1000)
public void expireNoShowReservations() {
    LocalDateTime now = LocalDateTime.now();

    // Tim booking Pending/Confirmed da qua checkinDeadline
    // (checkinDeadline = expectedEntryTime + graceMinutes)
    List<Reservation> noShows = reservationRepository
        .findByStatusInAndCheckinDeadlineBefore(List.of("Pending", "Confirmed"), now);

    for (Reservation reservation : noShows) {
        // Huy booking + mat coc (refund=false -> depositStatus = Forfeited)
        reservationService.cancelWithRefund(reservation, "Expired", false);

        // Tang dem no-show va co the blacklist user
        recordNoShow(reservation.getUser());
    }
}

private void recordNoShow(User user) {
    int count = (user.getConsecutiveNoShows() == null ? 0 : user.getConsecutiveNoShows()) + 1;
    user.setConsecutiveNoShows(count);
    int threshold = feeConfigService.getFeeConfig().getBlacklistThreshold();
    if (count >= threshold) {
        user.setBlacklisted(true); // Cam dat cho moi
    }
    userRepository.save(user);
}
```

## 4.5 - Huy Booking chua tra coc (Moi 5 phut)

```java
@Scheduled(fixedDelay = 5 * 60 * 1000)
public void expireUnpaidReservations() {
    // Cua so cho phep thanh toan: lay tu SystemConfig (mac dinh 15 phut)
    int windowMinutes = feeConfigService.getFeeConfig().getDepositPaymentWindowMinutes();
    LocalDateTime cutoff = LocalDateTime.now().minusMinutes(windowMinutes);

    // Booking "Pending" qua cua so thanh toan
    List<Reservation> unpaid = reservationRepository.findByStatusAndCreatedAtBefore("Pending", cutoff);

    for (Reservation reservation : unpaid) {
        // KHONG het han ngay neu dang co Payment Pending (khach co the dang thanh toan)
        Optional<Payment> latestPayment = paymentRepository
            .findFirstByReservation_ReservationIdOrderByPaymentIdDesc(reservation.getReservationId());

        if (latestPayment.isPresent()
                && "Pending".equals(latestPayment.get().getPaymentStatus())
                && latestPayment.get().getTransactionReference() != null) {
            try {
                // Hoi PayOS xem da thanh toan that chua
                payosService.verifyPaymentStatus(Long.parseLong(
                    latestPayment.get().getTransactionReference()));
                // Neu PAID -> verifyPaymentStatus tu cap nhat -> skip vong lap nay
                continue;
            } catch (BusinessRuleException e) {
                if (!"PAYMENT_NOT_PAID".equals(e.getErrorCode())) {
                    // Loi goi PayOS: bo qua, thu lai chu ky sau
                    continue;
                }
                // PAYMENT_NOT_PAID: chua tra -> het han binh thuong
            }
        }

        // Het han -> huy va giai phong quota
        reservationService.cancelWithRefund(reservation, "Expired", false);
    }
}
```

---

# PHAN 5 - BO 30 CAU HOI BAO VE & DAP AN CHUAN

---

**Q1: Connection String MongoDB nam o dau? Cac thanh phan co nghia la gi?**

**A:** Nam o file `BE/src/main/resources/application.yml`:

```yaml
spring.data.mongodb.uri: ${MONGODB_URI:mongodb://localhost:27017/ParkingDB}
```

- `${MONGODB_URI:...}` = doc bien moi truong `MONGODB_URI`. Neu khong co thi dung gia tri mac dinh sau dau `:`.
- `mongodb://` = giao thuc MongoDB
- `localhost:27017` = dia chi may chu va cong mac dinh MongoDB
- `ParkingDB` = ten database
- Khi deploy: dat bien moi truong `MONGODB_URI=mongodb+srv://...` trong Dashboard cua Render. Khong bao gio luu mat khau trong file code.

---

**Q2: Tai sao phai chia 3 tang Controller / Service / Repository? Viet gop vao Controller co duoc khong?**

**A:** Viet gop duoc nhung vi pham nguyen tac thiet ke va rat kho bao tri.

- **Controller** chi nhan HTTP request, kiem tra dau vao, goi Service, boc ket qua tra ve. Ngan gon (82 dong cho ReservationController).
- **Service** chua toan bo logic nghiep vu. Duoc tai su dung: ham `cancelWithRefund()` trong `ReservationService` duoc goi boi ca Controller (Driver tu huy) va Scheduler (no-show tu dong). Neu viet trong Controller thi Scheduler khong the goi duoc.
- **Repository** chi chua cac truy van MongoDB. Neu doi sang MySQL, chi sua tang nay.

---

**Q3: DTO va Entity khac nhau the nao? Tai sao khong tra Entity thang ra Frontend?**

**A:**

- **Entity** = class anh xa truc tiep vao collection MongoDB, chua moi truong ke ca nhay cam (`passwordHash`, `blacklisted`...)
- **DTO** = class chi chua nhung truong FE can, duoc thiet ke cho muc dich truyen du lieu

**Neu tra Entity thang:**

1. `User` entity chua `passwordHash` -> Lo mat khau da ma hoa ra mang
2. Hacker co the truyen them truong `role: "ADMIN"` trong request -> gia leo quyen

**Trong code:** `User` entity duoc annotation `@JsonIgnore` tren `passwordHash`. `Reservation` entity co `@JsonIgnore` tren ca `User` object. Thay vao do, chi phoi `userId` qua phuong thuc `getUserId()`.

---

**Q4: Lam the nao dam bao 2 nguoi cung dat cho luc bai chi con 1 cho cuoi khong bi race condition?**

**A:** Dung `@Transactional(isolation = Isolation.SERIALIZABLE)` o ham `ReservationService.create()`.

Day la muc cach ly cao nhat. MongoDB ep 2 request chay tuan tu, khong dong thoi.

- Nguoi A vao `checkQuota()`, thay `currentBooked = 59, limit = 60` -> thoa man -> INSERT
- Nguoi B vao `checkQuota()` sau A, thay `currentBooked = 60, limit = 60` -> `60 >= 60` -> nem `QUOTA_FULL`

Neu khong co Serializable: ca A va B cung thay `59 < 60` va cung INSERT -> vuot quota.

---

**Q5: Validation du lieu dau vao em xu ly o dau?**

**A:** Hai lop validation:

**Lop 1 - Annotation tren DTO** (ki thuat, kiem tra format):

```java
public class ReservationRequest {
    @NotNull private Integer vehicleTypeId;
    @NotBlank private String licensePlate;
    @Future private LocalDateTime expectedEntryTime; // Phai la tuong lai
}
```

Controller co `@Valid @RequestBody` -> Spring tu dong kiem tra truoc khi vao Service. Sai -> nem `MethodArgumentNotValidException` -> `GlobalExceptionHandler` bat va tra 400.

**Lop 2 - Logic trong Service** (nghiep vu, kiem tra business rule):

```java
// ReservationService.create()
if (!exitTime.isAfter(entryTime)) throw new BusinessRuleException("Gio ra phai sau gio vao");
if (activeCount >= 3) throw new BusinessRuleException("Toi da 3 ve hoat dong", "MAX_RESERVATIONS_REACHED");
```

---

**Q6: Neu Service nem Exception, lam sao FE nhan duoc JSON thong bao loi thay vi trang 500?**

**A:** Du an dung `@RestControllerAdvice` - Global Exception Handler (nam trong `com.parking.common`).

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessRuleException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // HTTP 400
    public ApiResponse<Void> handleBusiness(BusinessRuleException e) {
        return ApiResponse.error(e.getMessage(), e.getErrorCode());
    }
}
```

Khi `ReservationService` nem `new BusinessRuleException("QUOTA_FULL")`:

1. Exception bay len Controller
2. Controller khong xu ly -> bay tiep len Spring
3. `GlobalExceptionHandler` "bat" lai
4. Format thanh JSON: `{ success: false, message: "...", errorCode: "QUOTA_FULL" }`
5. Tra ve FE voi HTTP 400

**Loi ich:** Service code sach, khong co `try-catch`. Cu sai la `throw`.

---

**Q7: Code xac thuc JWT nam o dau? Luong chay the nao?**

**A:** Nam o file `JwtAuthFilter.java` (ke thua `OncePerRequestFilter` - chay dung 1 lan/request).

**Luong:**

1. Moi request den -> Filter chay truoc
2. Doc header: `Authorization: Bearer eyJhbGci...`
3. Cat chuoi "Bearer " (7 ky tu), lay phan token
4. `jwtService.extractUsername(token)` - giai ma JWT, lay username tu truong `sub`
5. `userDetailsService.loadUserByUsername(username)` - load User tu MongoDB
6. `jwtService.isTokenValid(token, userDetails)` - kiem tra username khop va chua het han
7. Neu hop le: nap vao `SecurityContextHolder` -> Spring biet request nay da xac thuc
8. Request di tiep vao Controller, `auth.getName()` tra ve username

---

**Q8: Luong thanh toan PayOS hoat dong nhu the nao? BE va FE tuong tac the nao?**

**A:** Gom 3 buoc chinh:

**Buoc 1 (FE -> BE -> PayOS):** FE goi `POST /api/driver/payments/payos/create-link`. BE lay thong tin don hang, tinh so tien coc, sinh `orderCode`, tao chu ky HMAC-SHA256 (ky cac param bang `checksumKey` bi mat). BE goi HTTPS POST sang `api-merchant.payos.vn/v2/payment-requests`. PayOS xac thuc chu ky, tao trang thanh toan, tra `checkoutUrl`. BE luu `Payment{status=Pending, transactionReference=orderCode}` vao DB. BE tra `checkoutUrl` ve FE.

**Buoc 2 (Khach quet QR):** FE chuyen huong trình duyet toi `checkoutUrl` cua PayOS. Khach quet QR bang app ngan hang. PayOS nhan tien -> tu dong POST sang `POST /api/payments/payos/webhook` (PayOS goi truc tiep vao BE, khong qua FE).

**Buoc 3 (Webhook hoac confirm):** BE nhan webhook, xac thuc chu ky, goi `markPaymentPaid(orderCode)` -> doi Reservation tu `Pending` sang `Confirmed`. Dong thoi khi FE quay lai trang success, goi `POST /reservations/{id}/confirm-deposit` - BE goi cheo sang PayOS kiem tra giao dich co PAID that khong. Hai co che nay du phong nhau.

---

**Q9: Tai sao Webhook PayOS khong can JWT nhung van an toan?**

**A:** PayOS KHONG the lay JWT cua nguoi dung vi PayOS la he thong ben thu 3, khong dang nhap vao ung dung cua minh.

Thay the, BE xac thuc bang **chu ky HMAC-SHA256**:

1. BE va PayOS cung biet `checksumKey` bi mat (cau hinh truoc)
2. PayOS gui webhook kem `signature` = HMAC-SHA256(data, checksumKey)
3. BE tinh lai `expectedSignature` = HMAC-SHA256(data, checksumKey)
4. So sanh: neu khop -> tin la PayOS that gui; neu khong khop -> tu choi (Hacker gia mao)

Hacker co the goi `/webhook` nhung khong co `checksumKey` nen khong tao duoc chu ky hop le.

---

**Q10: Dat khau duoc bao mat the nao? Neu lo Database co mat pass khong?**

**A:** Dung `BCryptPasswordEncoder`.

**Cach BCrypt bao ve:**

1. Sinh `salt` ngau nhien cho moi lan hash
2. Hash = Blowfish(salt + password) qua 2^10 vong lap (rat cham, kho brute-force)
3. Luu vao DB: `$2a$10$<22-char-salt><31-char-hash>`

**Neu lo Database:** Hacker chi co hash. Khong the dao nguoc (one-way). Brute-force mat rat lau vi moi lan thu 1 mat khau phai chay 2^10 vong.

**2 nguoi cung dat pass "123456" co hash khac nhau** vi moi lan hash co salt ngau nhien khac nhau.

**Khi dang nhap:**

```java
BCryptPasswordEncoder.matches("123456", "$2a$10$...hash...")
// = lay salt tu chuoi hash, hash lai password, so sanh voi hash da luu
```

---

**Q11: Tai sao phai co "Price Lock" (Khoa gia) khi dat cho?**

**A:** Khi khach dat cho luc 8h sang, Manager co the tang gia luc 2h chieu. Khi khach check-out luc 4h chieu phai dung gia nao?

**Neu khong khoa gia:** Khach thay gia 10,000d/h khi dat, Manager tang len 15,000d/h, khach phai tra 15,000d/h -> Bat cong, khach khieu nai.

**Giai phap:** Khi tao `Reservation`, BE lay toan bo bang gia hien tai va luu snapshot vao cac truong:

```java
.priceAtBookingTime(policy.getBasePrice())       // 10,000d/h
.extraHourPriceAtBooking(policy.getExtraHourPrice())
.nightSurchargeAtBooking(policy.getNightSurcharge())
// ... va nhieu truong khac
```

Khi `SessionService.checkOut()` tinh tien: dung `priceAtBookingTime` (gia da khoa), khong lay `PricingPolicy` hien tai.

---

**Q12: Grace Period (An han check-in) la gi? Tinh nhu the nao?**

**A:** La thoi gian khach duoc phep den muon so voi gio dat ma khong bi coi la no-show.

**Cong thuc (trong `computeGracePeriod()`):**

```
graceRaw (phut) = (thoi_luong_booking_phut) × (ti_le_coc)
cap (tran tren) = {
    < 24 gio: tran 2 gio
    < 7 ngay: tran 12 gio
    >= 7 ngay: tran 24 gio
}
grace = MAX(15 phut, MIN(graceRaw, cap))
checkinDeadline = expectedEntryTime + grace
```

**Vi du:** Dat 2 gio, coc 20%:

- `graceRaw = 120 * 0.20 = 24 phut`
- `cap = 120 phut (2 gio, vi booking < 24 gio)`
- `grace = MAX(15, MIN(24, 120)) = 24 phut`
- Deadline = gio_vao + 24 phut

**Tai sao tinh the nay?** Coc cao hon -> khach cam ket nhieu hon -> an han dai hon. Booking dai hon -> cho phep tre lau hon (kho tinh chinh xac gio den xa).

---

**Q13: Scheduler chay nhu the nao? Co tu dong khoi dong cung BE khong?**

**A:** Dung `@Scheduled` cua Spring Boot. Them `@EnableScheduling` vao class Application chinh.

```java
@Scheduled(fixedDelay = 5 * 60 * 1000)
// fixedDelay = tu luc KET THUC lan chay truoc den luc BAT DAU lan chay tiep
// = 5 * 60 * 1000 milliseconds = 5 phut
```

**Tu dong khoi dong:** Co. Khi Spring Boot khoi dong, cac method `@Scheduled` tu dong duoc dang ky va chay ngam trong thread pool rieng. Khong can goi API kich hoat.

**Khong co API tuong ung:** Cac Scheduler KHONG CO endpoint `/api`. Chung la tac vu nen, Staff/Driver khong the tu khai thac.

---

**Q14: Cau hoi bao ve: "Dung bam nut Dat cho tren FE, du lieu di qua nhung buoc nao trong BE?"**

**A:** Luong hoan chinh:

```
1. FE (parking-driver)
   - User dien form: chon loai xe, nhap bien so, chon khung gio
   - Goi: POST /api/driver/reservations
   - Header: Authorization: Bearer <JWT>
   - Body: { vehicleTypeId: 1, licensePlate: "51H-123.45", expectedEntryTime: ..., expectedExitTime: ... }

2. JwtAuthFilter (Chay truoc Controller)
   - Doc header Authorization
   - Giai ma JWT, lay username = "driver1"
   - Load user tu DB, kiem tra token con han
   - Inject Authentication vao SecurityContext

3. ReservationController.create()
   - @Valid kiem tra ReservationRequest (NotBlank, Future, NotNull)
   - Goi reservationService.create(request, "driver1")

4. ReservationService.create() - @Transactional(SERIALIZABLE)
   - Validate gio vao/ra
   - Kiem tra gio vao cach hien tai du depositWindowMinutes
   - userRepository.findByUsername("driver1") -> lay User entity
   - Kiem tra user khong bi blacklist
   - vehicleTypeRepository.findById(1) -> lay VehicleType
   - countByUser_UserIdAndStatusIn() -> kiem tra toi da 3 ve
   - findByLicensePlate...() -> kiem tra overlap bien so
   - checkQuota() -> kiem tra suc chua khung gio
   - pricingPolicyRepository.findFirst...() -> lay bang gia hien tai
   - pricingService.calculateFee() -> tinh phi uoc tinh
   - depositFor() -> tinh tien coc (lam tron xuong 1000d)
   - computeGracePeriod() -> tinh an han check-in
   - Tao Reservation entity voi SNAPSHOT GIA
   - reservationRepository.save(reservation) -> luu vao MongoDB

5. MongoDB
   - Luu document vao collection "Reservations"
   - Tu dong tao _id (UUID)

6. ReservationService tra ve Reservation entity
   - Controller goi ReservationDTO.from(reservation)
   - DTO chi lay: reservationId, licensePlate, status, depositAmount, gio vao/ra, vehicleTypeName
   - KHONG lay: passwordHash, toan bo User object

7. ApiResponse.ok("Tao booking thanh cong", dto)
   - Boc trong ApiResponse: { success: true, message: "...", data: {...} }

8. Spring serialize thanh JSON
   - Tra HTTP 200
   - Body: { "success": true, "message": "Tao booking thanh cong", "data": { "reservationId": "...", "status": "Pending", ... } }

9. FE nhan response
   - Hien thi thong bao thanh cong
   - Chuyen sang trang thanh toan coc (goi PayOS)
```

---

**Q15: @DBRef trong MongoDB la gi? Khac gi @ManyToOne trong JPA?**

**A:**

- `@ManyToOne @JoinColumn` (SQL/JPA): Luu `foreign key` (so nguyen) trong cung bang, JOIN khi truy van.
- `@DBRef` (MongoDB): Luu `{ "$ref": "Roles", "$id": 1 }` trong document. Spring tu dong `lookup` (tuong tu JOIN) khi load.

**Vi du trong `User.java`:**

```java
@DBRef
private Role role;
// Luu trong MongoDB: { "role": { "$ref": "Roles", "$id": 1 } }
// Khi doc: Spring tu dong truy van collection Roles tim document co _id = 1
```

**Nhuoc diem @DBRef:** Khong the dung trong query filter truc tiep. Phai dung `@Query("{ 'role.$id': ?0 }")` va chi dinh dung cu phap MongoDB.

---

**Q16: @Transactional trong MongoDB co thuc su hoat dong khong? Khac SQL the nao?**

**A:**

- **SQL**: Transaction la co ban, ACID day du.
- **MongoDB**: Ho tro Multi-document Transaction tu phien ban 4.0+ (Replica Set) va 4.2+ (Sharded). Project nay dung `@Transactional` de dam bao nhieu thao tac trong 1 ham chay nguyen tu.

**Vi du:** Trong `cancelWithRefund()`: vua doi trang thai Reservation, vua tao Payment. Neu mat mang giua chung: `@Transactional` dam bao ca 2 cung rollback, tranh du lieu khong nhat quan.

**Han che:** O moi truong standalone (khong phai Replica Set), MongoDB khong ho tro transaction. Mac dinh Atlas (cloud) dung Replica Set nen OK.

---

**Q17: Tai sao bao ve dat cho khoi spam ma khong dung CAPTCHA?**

**A:** Du an dung **Rate Limiter** (`RateLimiterService`) theo IP va theo dinh danh.

```java
// AuthController.java
rateLimiter.checkRateLimit("login:" + clientIp(http), 20, 15 phut);
// login: toi da 20 lan/IP/15 phut

rateLimiter.checkRateLimit("register-otp:" + clientIp, 5, 15 phut);
// gui OTP dang ky: toi da 5 lan/IP/15 phut

// Voi forgot-password: 2 lop
rateLimiter.checkRateLimit("forgot-ip:" + clientIp, 5, 15 phut);    // theo IP
rateLimiter.checkRateLimit("forgot-id:" + identifier, 3, 15 phut);  // theo tai khoan muc tieu
```

**Tai sao 2 lop cho forgot-password?**

- Theo IP: chan 1 nguoi spam tu 1 may
- Theo tai khoan muc tieu: chan "email-bomb" - 1 Hacker dung nhieu IP cung tan cong 1 tai khoan

---

**Q18: Du lieu di tu FE sang BE nhu the nao? JSON duoc chuyen thanh gi?**

**A:**

```
FE gui HTTP POST voi Body JSON:
{ "vehicleTypeId": 1, "licensePlate": "51H-123.45" }

--> HTTP den Spring Boot
--> Jackson (thu vien JSON) tu dong parse JSON thanh class Java:
    ReservationRequest request = new ReservationRequest();
    request.vehicleTypeId = 1;
    request.licensePlate = "51H-123.45";

--> Controller nhan duoc object Java da duoc dien day du
--> Controller truyen xuong Service
--> Service xu ly, tao Reservation entity
--> Repository.save(entity) -> Jackson/Spring Data chuyen Entity thanh BSON -> MongoDB

Chieu nguoc lai:
MongoDB -> Entity -> Service -> Controller -> Jackson -> JSON -> FE
```

**Annotation quan trong:**

- `@RequestBody` = Spring dung Jackson parse JSON trong body request thanh DTO
- `@ResponseBody` (co san trong `@RestController`) = Spring dung Jackson chuyen ket qua tra ve thanh JSON

---

**Q19: Gia han booking (extendReservation) su dung gia nao? Gia khoa hay gia hien tai?**

**A:** Dung **gia hien tai** (khong phai gia da khoa).

**Ly do:** Gia han la mot **giao dich moi**, khac voi phi goc da dat truoc. Khach dat cho luc 8h sang voi gia 10,000d/h (khoa gia). Khi gia han luc 3h chieu, neu Manager da tang gia len 12,000d/h, phan gia han se tinh 12,000d/h.

```java
// ReservationService.extendReservation()
BigDecimal extensionFee = pricingService.calculateFee(
    reservation.getVehicleType().getVehicleTypeId(),
    reservation.getExpectedExitTime(),  // Tu gio ra cu
    newExitTime);                        // Den gio ra moi
// Dung vehicleTypeId -> pricingService lay PricingPolicy HIEN TAI
```

**`originalExpectedExitTime` khong thay doi khi gia han** -> Dam bao checkout dung gio ra GOC khi tinh base fee, tranh loi tinh 2 lan.

---

**Q20: Trong MongoDB lam sao Spring biet query nao de chay? Viet SQL o dau?**

**A:** Spring Data MongoDB tu dong sinh query MongoDB tu **ten phuong thuc**.

```java
// Phuong thuc trong ReservationRepository:
long countByUser_UserIdAndStatusIn(Long userId, List<String> statuses);
// Spring dich: db.Reservations.countDocuments({ "user.$id": userId, "status": { $in: statuses } })

List<Reservation> findByStatusAndCreatedAtBefore(String status, LocalDateTime threshold);
// Spring dich: db.Reservations.find({ "status": status, "createdAt": { $lt: threshold } })
```

Quy tac dat ten: `findBy` + `TenTruong` + `DieuKien` (And, Or, GreaterThan, LessThan, In, Before, After...)

**Khi can query phuc tap hon:**

```java
@Query("{ 'user.$id': ?0 }") // Viet thang MongoDB query bang @Query
List<Reservation> findByUser_UserId(Long userId);

@CountQuery("{ 'vehicleType.$id': ?0, 'status': { $in: ?1 }, ... }") // Dem
long countBy...();
```

---

**Q21: Cac trang thai cua Booking (Reservation) va chuyen dich the nao?**

**A:**

```
[Tao dat cho] -> Pending
     |
     | [Thanh toan coc PayOS thanh cong / Webhook / confirm-deposit]
     v
  Confirmed  <-- Suất được chừa, xe chắc chắn có chỗ
     |              |
     |              | [Khong den, qua checkinDeadline] -> Scheduler
     |              v
     |           Expired (Mat coc - Forfeited)
     |
     | [Xe vao barie, camera quet bien so khop]
     v
  CheckedIn  <-- Staff/Camera tao ParkingSession
     |
     | [Camera xac nhan xe da do vao o vat ly]
     v
  Fulfilled  <-- Hoan tat
     |
     | (Session Completed khi xe ra - qua SessionService.checkOut)

Cancelled: Driver tu huy truoc 3 gio (hoan coc)
Expired: Khong den / chua tra coc (mat coc / huy link)
```

---

**Q22: @JsonIgnore trong User.java dung de lam gi?**

**A:** Khi Spring serialize `User` entity thanh JSON (tra ve FE), annotation `@JsonIgnore` tren `passwordHash` bao Jackson **bo qua truong nay**, khong dua vao JSON.

```java
public class User {
    @JsonIgnore
    private String passwordHash;  // Khong bao gio xuat hien trong JSON tra ve
}
```

**Ket qua:** Du User entity chua `passwordHash = "$2a$10$xxx..."`, JSON tra ve chi co:

```json
{ "userId": 1, "username": "driver1", "fullName": "Nguyen Van A", "email": "...", ... }
```

Tuong tu, `Reservation` entity co `@JsonIgnore` tren `user` va `vehicleType` (la `@DBRef`) -> Khong tra toan bo object User ra, tranh lo `passwordHash`. Thay vao do, dung cac phuong thuc `getUserId()`, `getVehicleTypeName()` de phoi ID/ten phang.

---

**Q23: Rate Limiter hoat dong nhu the nao trong du an?**

**A:** `RateLimiterService` su dung cau truc du lieu **Sliding Window** luu trong RAM (ConcurrentHashMap).

```
Key: "login:192.168.1.1"  (hanh dong + IP)
Value: danh sach timestamp cac lan goi gan day

Khi goi: them timestamp hien tai vao danh sach
         xoa cac timestamp cu hon window (15 phut)
         dem so timestamp con lai
         neu > limit -> nem RateLimitException
```

**Luu y:** Du lieu luu trong RAM -> mat khi restart BE. OK cho dev. Production nen dung Redis.

---

**Q24: Lam sao FE biet duoc user hien tai co role gi de hien thi dung giao dien?**

**A:** Khi dang nhap thanh cong, `AuthService.login()` tra ve `LoginResponse` gom 3 truong:

```java
return new LoginResponse(token, user.getUsername(), user.getRole().getRoleName());
// LoginResponse: { token: "eyJ...", username: "driver1", roleName: "Driver" }
```

FE nhan `roleName` va luu vao Zustand store (`auth.ts`). Sau do check `roleName` de hien thi dung trang/nut/menu.

Phia BE: moi API protected dung `@PreAuthorize` kiem tra role tu JWT:

```java
@PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ADMIN')")
// hoac
@PreAuthorize("hasRole('MANAGER')")
```

---

**Q25: Viec dang xuat hoat dong nhu the nao? BE co luu danh sach token bi thu hoi khong?**

**A:** JWT Stateless -> BE KHONG luu danh sach token. `POST /api/auth/logout` chi tra HTTP 200, thuc te khong lam gi.

**Cach client xoa token:**

1. FE nhan response 200
2. FE xoa token khoi localStorage
3. FE xoa store Zustand
4. Redirect ve trang login

**Han che:** Token cu van con hieu luc cho den khi het han (8 tieng). Day la danh doi chap nhan duoc cua JWT stateless.

**Giai phap neu can revoke ngay lap tuc (khong lam trong du an nay):** Dung blacklist token trong Redis, moi request kiem tra token co trong blacklist khong.

---

**Q26: Chuyen gi xay ra neu Manager tang gia sau khi khach da dat cho?**

**A:** Gia khach phai tra KHONG THAY DOI. Vi du:

1. Khach dat cho luc 8h, gia xe may = 3,000d/h, phi 2h = 6,000d, coc = 1,200d
2. Manager tang gia len 5,000d/h luc 10h
3. Khach vao bai luc 14h, ra luc 16h (thuc te 2h)
4. **Checkout tinh:** 3,000d/h x 2h = 6,000d (gia cu da khoa) - 1,200d (coc) = **4,800d**

Neu khong co Price Lock: 5,000d x 2h = 10,000d - 1,200d = 8,800d (bat cong)

**Code dam bao:** `SessionService.checkOut()` lay gia tu `reservation.getPriceAtBookingTime()` (gia da snap), khong goi `pricingPolicyRepository`.

---

**Q27: Blacklist user la gi? Khi nao bi blacklist? Lam sao duoc giai phong?**

**A:**

**Khi nao bi blacklist:**

- Moi lan no-show (Scheduler `expireNoShowReservations` chay) -> `consecutiveNoShows++`
- Khi `consecutiveNoShows >= BLACKLIST_THRESHOLD` (lay tu `FeeConfigService`) -> `blacklisted = true`

**Anh huong:**

- Khi dat cho moi: `ReservationService.create()` kiem tra `user.getBlacklisted() == true` -> nem `USER_BLACKLISTED`

**Lam sao giai phong:** Manager hoac Admin dat lai `blacklisted = false` va `consecutiveNoShows = 0` qua API quan tri.

**consecutiveNoShows reset khi nao:** Khi khach check-in thanh cong cho 1 booking -> `SessionService.checkIn()` goi reset.

---

**Q28: PricingPolicy co nhieu ban ghi cho cung 1 loai xe - lay ban ghi nao?**

**A:** Luon lay ban ghi **Active moi nhat** theo `effectiveDate`:

```java
pricingPolicyRepository.findFirstByVehicleType_VehicleTypeIdAndStatusOrderByEffectiveDateDesc(
    vehicleType.getVehicleTypeId(), "Active")
```

- `OrderByEffectiveDateDesc` = sap xep effectiveDate giam dan (moi nhat truoc)
- `findFirst` = lay ban ghi dau tien (moi nhat)

Khi Manager cap nhat gia:

1. Khong xoa ban ghi cu - doi status thanh `Expired`
2. Tao ban ghi moi voi status `Active`
   -> Lich su gia duoc giu lai, booking cu van tro ve dung bang gia da khoa.

---

**Q29: Cau truc thu muc du an theo nguyen tac gi?**

**A:** Du an dung **Domain-Driven Design (DDD)** chia package theo Actor/Muc dich:

```
com.parking/
├── auth/                    -- Dang ky, dang nhap, JWT
├── common/                  -- Dung chung: ApiResponse, Exception, Service
│   ├── exception/           -- BusinessRuleException, ResourceNotFoundException
│   └── service/             -- PricingService, EmailService, RateLimiterService
├── config/                  -- SecurityConfig, JwtService, JwtAuthFilter
├── entity/                  -- Cac class anh xa MongoDB collection
├── modules/
│   ├── driver/              -- Tat ca API cho Driver (Tai xe)
│   ├── manager/             -- API cho Manager (Quan ly)
│   ├── staff/               -- API cho Staff (Nhan vien cong)
│   └── admin/               -- API quan tri he thong
├── repository/              -- Interface truy van MongoDB
└── scheduler/               -- Background jobs (Cron)
```

**Loi ich:** Tim code rat nhanh. Hoi "code dat cho o dau?" -> `modules/driver/ReservationService.java`. Hoi "lich schedule o dau?" -> `scheduler/`.

---

**Q30: Spring Boot tu ket noi MongoDB nhu the nao? Khong can viet code ket noi?**

**A:** Dung **Spring Data MongoDB** (spring-boot-starter-data-mongodb).

1. Spring Boot doc `spring.data.mongodb.uri` tu `application.yml`
2. Tu dong tao `MongoClient` (pool ket noi)
3. Cac `Repository` interface ke thua `MongoRepository<Entity, IdType>` -> Spring tao `Proxy` class tu dong implement cac phuong thuc CRUD:
   - `save()` -> `db.collection.insertOne()` hoac `updateOne()`
   - `findById()` -> `db.collection.findOne({ _id: id })`
   - `findAll()` -> `db.collection.find()`
   - `delete()` -> `db.collection.deleteOne()`
4. Cac phuong thuc dat ten dac biet -> Spring sinh MongoDB query tu ten

**Khong phai viet JDBC, Connection Pool, hay Statement gi ca.** Spring Boot lo toan bo.
