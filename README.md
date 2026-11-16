# Studio System — Cloudflare Workers + D1

Ứng dụng Next.js 16, Prisma 7 và Cloudflare D1 (SQLite), đóng gói bằng OpenNext.
PostgreSQL và `DATABASE_URL` không còn được dùng. D1 được cấp qua binding `DB`.

## Chạy local

Cần Node.js 24 và npm. Từ thư mục gốc repository:

```bash
npm ci
cp .env.example .env
npm run db:migrate:local
npm run seed
npm run dev
```

Trước khi seed, nhập `AUTH_SECRET`, `SEED_ADMIN_EMAIL` và
`SEED_ADMIN_PASSWORD` vào `.env` (file được Git bỏ qua). Mật khẩu seed phải ít
nhất 12 ký tự. Tạo `AUTH_SECRET` bằng `openssl rand -base64 32`.
Local dùng `AUTH_URL=http://localhost:3000`. Không có mật khẩu admin mặc định.
Seed tạo roles, permissions, owner và danh mục chi phí; chạy lại sẽ cập nhật
roles và owner được chỉ định, kể cả mật khẩu. Không dùng seed để nhập dữ liệu nghiệp vụ.

`npm run dev` chạy Next.js với D1 local qua OpenNext/Miniflare. `npm start`
chỉ chạy Next.js Node server, không cung cấp binding D1; dùng `npm run preview`
để kiểm thử bản Worker sau khi build. Wrangler preview đọc secrets từ `.dev.vars`: tạo file này từ `.env.example`, nhập `AUTH_SECRET` và đặt `AUTH_URL=http://localhost:8787`. Không commit file này.

## Tạo và kết nối D1 production

Trong Cloudflare chọn **Storage & databases → D1 SQLite Database → Create
Database**, đặt tên `studio-system`. Điền Database ID thật vào `database_id`
trong `wrangler.jsonc`; binding phải là `DB`. ID toàn số 0 chỉ phục vụ local.
Không dùng connection string hay mật khẩu PostgreSQL.

Hoặc từ máy đã đăng nhập Wrangler:

```bash
npx wrangler login
npm run db:create
```

Lệnh tạo database dùng khu vực `apac` và tự cập nhật cấu hình. Kiểm tra lại
`wrangler.jsonc` có đúng một binding `DB`, đúng Database ID và
`migrations_dir: "prisma/d1-migrations"` trước khi commit.

Áp dụng schema và tạo owner **trước khi phục vụ production**:

```bash
npm run db:migrate:remote
npm run seed:remote
```

`seed:remote` dùng Prisma D1 HTTP adapter. Trên máy vận hành, cấu hình riêng
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`
(token có quyền D1 edit cho tài khoản đó), `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`. Nhập qua biến môi trường hoặc `.env` riêng; không ghi
vào repository, build log hay chat. Worker không cần API token này.

Migration mới nằm trong `prisma/d1-migrations`. Các migration PostgreSQL cũ
trong `prisma/migrations` được giữ làm lịch sử và không áp dụng lên D1. Đây là
schema cho database D1 mới; không phải công cụ chuyển dữ liệu PostgreSQL đã có.
Thay đổi schema tiếp theo cần migration D1 riêng, không sửa migration đã áp dụng.

## Cấu hình Cloudflare Workers Builds

Đẩy code và Database ID thật lên nhánh mà Cloudflare theo dõi. Xuất bản môi
trường Codex không tự đẩy code lên repository.

- Build command: `npm run build` (hoặc alias `npm run build:cloudflare`).
- Deploy command: `npm run deploy`.
- Worker entry: `.open-next/worker.js`; assets: `.open-next/assets`.
- D1 binding: `DB`, trỏ đến database vừa tạo.
- Worker secret: `AUTH_SECRET` (tối thiểu 32 ký tự, tạo ngẫu nhiên).
- Worker variable: `AUTH_URL`, URL HTTPS thực tế của ứng dụng.
- `AUTH_TRUST_HOST=true` và `nodejs_compat` đã có trong `wrangler.jsonc`.

Không cần database hoặc khóa auth trong bước build. Không đặt
`AUTH_BYPASS_DEV=true` trong production. Build không tự migrate hay seed database.
`npm run build` tạo gói Worker hoàn chỉnh, nên cấu hình Build command cũ của Cloudflare vẫn dùng được. `npm run build:next` chỉ tạo bản Next.js; OpenNext gọi lệnh này nội bộ để tránh vòng lặp build.

Bản này dùng Edge `src/middleware.ts`. Prisma dùng entry `@prisma/client/edge` và compiler `small` để nạp WebAssembly tĩnh trong Workers. Test integration ánh xạ entry này sang bản Node cùng schema để chạy Miniflare.

Node.js `src/proxy.ts` của Next.js 16
chưa được phiên bản OpenNext đã pin hỗ trợ. Next.js có thể báo cảnh báo
middleware deprecated; kiểm tra xác thực vẫn được giữ nguyên.

## Kiểm tra

```bash
npm test
npm run test:d1
npx tsc --noEmit --incremental false
npm run build:cloudflare
npm run preview
```

Integration test D1 tạo database tạm riêng để kiểm tra JSON, Decimal, mã đơn
đồng thời, rollback batch, quyền, hóa đơn, freelancer và báo cáo SQLite.
Trong sandbox không cho ghi thư mục cấu hình người dùng, đặt
`XDG_CONFIG_HOME=/workspace/.config` trước các lệnh Wrangler/OpenNext.

D1 không hỗ trợ transaction tương tác của Prisma. Các thao tác nhiều lệnh
quan trọng dùng `atomicBatch` (D1 `batch` rollback toàn bộ nếu lỗi). Không
thêm `db.$transaction`; lớp database chủ động từ chối API này. Native type
`@db.Decimal`, chuỗi mảng và SQL PostgreSQL đã được chuyển sang SQLite/JSON.
SQLite NUMERIC không có bảo đảm precision/scale giống PostgreSQL DECIMAL;
API Prisma vẫn dùng Decimal và cần kiểm tra giới hạn số tiền thực tế khi nhập dữ liệu.
