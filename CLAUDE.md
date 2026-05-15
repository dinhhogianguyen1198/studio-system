# CLAUDE.md — Studio System

> Tài liệu hướng dẫn chuẩn production dành cho Claude Code.
> Mọi code được sinh ra PHẢI tuân thủ toàn bộ quy tắc trong file này.

---

## 1. Project Philosophy

- Code được viết **một lần, đọc nhiều lần** — ưu tiên rõ ràng hơn thông minh.
- Không có "code tạm" trong codebase này. Mọi thứ đều là production.
- Mỗi file, module, component đều có **một trách nhiệm duy nhất**.
- Không giải quyết vấn đề chưa tồn tại. Không thiết kế cho yêu cầu tương lai chưa rõ.
- Khi có nghi ngờ: đơn giản hơn, rõ ràng hơn, ít trừu tượng hơn.

---

## 2. Architecture Principles

- **Feature-based modules**: mỗi domain (auth, crm, booking…) là một module độc lập.
- **Layered architecture** trong mỗi module: `schema → repository → service → action → component`.
- **Server Actions** thay cho API routes cho mọi data mutation.
- **Server Components** mặc định; chỉ dùng `"use client"` khi cần interactivity.
- **Không để business logic trong component**, route handler, hay action handler — logic thuộc về service layer.
- **Repository** chỉ chứa Prisma queries, không có business logic.
- **Service** chứa business logic, gọi repository, không biết về HTTP hay React.
- **Action** là bridge: validate input → gọi service → audit log → revalidate cache.

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.x |
| Language | TypeScript strict | 5.x |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 7.x |
| Auth | NextAuth.js v5 | 5.0.0-beta |
| Validation | Zod | 4.x |
| UI | shadcn/ui + Radix UI | latest |
| Styling | Tailwind CSS | v4 |
| Icons | Lucide React | latest |
| Forms | React Hook Form | 7.x |
| Tables | TanStack Table | 8.x |
| Toasts | Sonner | latest |
| Container | Docker + Docker Compose | - |

### Quy tắc Tech Stack

- **Không thêm dependency mới** mà không có lý do rõ ràng. Kiểm tra xem thư viện hiện có đã giải quyết được chưa.
- **Không dùng axios** — dùng native `fetch` hoặc Server Actions.
- **Không dùng Redux/Zustand** cho server state — dùng Server Components + `revalidatePath`.
- **Không dùng `moment.js`** — dùng `date-fns`.
- **Không dùng `class-transformer`** — dùng Zod `.transform()`.

---

## 4. Development Setup

### Kiến trúc môi trường

- **Next.js app chạy trực tiếp trên host** (`npm run dev`) — không qua Docker.
- **PostgreSQL chạy qua Docker** — expose port 5432 ra host để app local kết nối được.
- Không hard-code connection string. Mọi config đều qua environment variables trong `.env`.

### Khởi động PostgreSQL (Docker)

```bash
# Từ thư mục gốc studio-system/
docker compose up -d db

# Kiểm tra DB đang chạy
docker compose ps

# Xem logs DB
docker compose logs -f db

# Dừng DB
docker compose stop db
```

### Chạy Next.js app (local)

```bash
# Từ thư mục studio-system/app/
npm install          # lần đầu hoặc sau khi thêm package
npm run dev          # http://localhost:3000
```

### Prisma (chạy local, kết nối tới DB Docker)

```bash
# Từ thư mục studio-system/app/
npx prisma migrate dev --name <tên_migration>   # Tạo + apply migration
npx prisma migrate deploy                        # Apply migration (staging/prod)
npx prisma migrate reset                         # Reset DB (chỉ local)
npx prisma generate                              # Regenerate Prisma Client
npx prisma studio                                # GUI quản lý DB tại localhost:5555
npm run seed                                     # Chạy seed data
```

### Cài package mới

```bash
# Từ thư mục studio-system/app/
npm install <package>
```

### Service names

| Service | Chạy ở đâu | Port |
|---|---|---|
| Next.js app | Host (local) | 3000 |
| PostgreSQL | Docker container `studio-db` | 5432 |

### DATABASE_URL

App local kết nối tới DB Docker qua `localhost:5432`. Đảm bảo `.env` có:

```bash
DATABASE_URL="postgresql://studio:studio@localhost:5432/studio_db"
```

---

## 5. Backend Standards (Server Layer)

### Server Actions

```typescript
// Pattern chuẩn cho mọi action
"use server"

export async function createEntityAction(
  prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  // 1. Xác thực quyền
  const session = await requirePermission("resource", "create")

  // 2. Parse + validate input
  const raw = Object.fromEntries(formData)
  const parsed = createEntitySchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // 3. Gọi service
  try {
    const result = await entityService.create(parsed.data, session.user.id)

    // 4. Audit log
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "entity",
      resourceId: result.id,
      metadata: { name: result.name },
    })

    // 5. Revalidate cache
    revalidatePath("/dashboard/entity")

    return { success: true, data: { id: result.id } }
  } catch (err) {
    return { success: false, error: toActionError(err, "Tạo thất bại") }
  }
}
```

### Service Layer

```typescript
// src/modules/<feature>/service/<feature>.service.ts
export const entityService = {
  async create(data: CreateEntityDto, createdById: string): Promise<EntityDetail> {
    // Business logic ở đây — không có Prisma, không có HTTP
    const existing = await entityRepository.findByUniqueField(data.field)
    if (existing) throw new Error("DUPLICATE_ENTITY")
    return entityRepository.create({ ...data, createdById })
  },
}
```

### Repository Layer

```typescript
// src/modules/<feature>/repository/<feature>.repository.ts
export const entityRepository = {
  async findMany(filters: EntityFilters): Promise<PaginatedResult<EntitySummary>> {
    const { page, pageSize, search } = filters
    const where: Prisma.EntityWhereInput = {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    }
    const [data, total] = await Promise.all([
      db.entity.findMany({
        where,
        select: entitySummarySelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.entity.count({ where }),
    ])
    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }
  },
}
```

---

## 6. Frontend Standards

### Component hierarchy

```
src/components/ui/          ← shadcn/ui primitives (không sửa trực tiếp)
src/components/layout/      ← Sidebar, Navbar, Shell
src/modules/<feature>/components/
  ├── <Feature>Form.tsx     ← Form component (Client)
  ├── <Feature>Table.tsx    ← Table component (Client)
  ├── <Feature>Filters.tsx  ← Filter bar (Client)
  └── Delete<Feature>Button.tsx  ← Destructive action (Client)
```

### Quy tắc Component

- **Default là Server Component**. Thêm `"use client"` chỉ khi cần `useState`, `useEffect`, event handler, hoặc browser API.
- **Không truyền event handler từ Server Component xuống Client Component** — tạo Client wrapper riêng.
- **Không để component > 200 dòng**. Tách thành sub-components nếu vượt.
- **Không viết inline style**. Dùng Tailwind utility classes.
- **Không hard-code text** — dùng constants hoặc i18n keys.

### Pattern cho Client Component nhận Server Action

```typescript
"use client"

interface Props {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>
}

export function EntityForm({ action }: Props) {
  const [state, formAction, isPending] = useActionState(action, { success: false })
  // ...
}
```

### Reusable UI patterns

- Dùng `Button asChild` + `Link` cho navigation buttons — không dùng `onClick` để navigate.
- Dùng `sonner` toast cho feedback sau action.
- Dùng `Dialog` từ shadcn cho confirmations, không dùng `window.confirm`.
- Mọi form đều dùng `react-hook-form` + Zod resolver cho client-side validation.

---

## 7. Prisma Standards

### Schema organization

```prisma
// prisma/schema.prisma
// Chia thành các block theo domain, comment rõ ràng

// ==================== AUTH ====================
model User { ... }
model Role { ... }
model Permission { ... }
model RolePermission { ... }

// ==================== CRM ====================
model Customer { ... }
model Lead { ... }
model CustomerNote { ... }
model LeadNote { ... }

// ==================== AUDIT ====================
model AuditLog { ... }
```

### Query rules

- **Luôn dùng `select` hoặc `include` explicit** — không dùng default select (trả về toàn bộ fields).
- **Tạo select fragment constants** cho các pattern tái sử dụng:

```typescript
const entitySummarySelect = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
} satisfies Prisma.EntitySelect
```

- **Không fetch relation không cần thiết**. Detail page và list page dùng select fragment khác nhau.
- **Paginate mọi list query** — không có query `findMany` không có `take`.
- **Dùng `Promise.all`** cho các query độc lập chạy song song.

### Transactions

Dùng transaction khi: (1) nhiều writes phụ thuộc nhau, (2) read-then-write (check-then-act).

```typescript
await db.$transaction(async (tx) => {
  const existing = await tx.entity.findFirst({ where: { email: data.email } })
  if (existing) throw new Error("DUPLICATE")
  return tx.entity.create({ data })
})
```

### Indexes

Mọi column dùng trong `where`, `orderBy`, hoặc là foreign key đều phải có index:

```prisma
model Lead {
  @@index([status])
  @@index([customerId])
  @@index([assignedToId])
  @@index([createdById])
  @@index([createdAt])
}
```

### groupBy thay vì multiple counts

```typescript
// ĐÚNG
const rows = await db.entity.groupBy({ by: ["status"], _count: true })

// SAI
const [a, b, c] = await Promise.all([
  db.entity.count({ where: { status: "A" } }),
  db.entity.count({ where: { status: "B" } }),
  db.entity.count({ where: { status: "C" } }),
])
```

### Decimal fields

```typescript
// ĐÚNG
import { Prisma } from "@prisma/client"
value: data.value != null ? new Prisma.Decimal(data.value) : null

// SAI
value: String(data.value)
```

---

## 8. API Design Standards

- **Mutations dùng Server Actions**, không dùng API routes.
- **API routes chỉ dùng** cho: webhooks từ bên ngoài, OAuth callbacks, file uploads.
- **API routes phải có auth check** ngay đầu handler.
- **Versioning** khi cần public API: `src/app/api/v1/<resource>/route.ts`.

### ActionResult type

```typescript
// src/shared/types/api.types.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

Mọi Server Action đều trả về `ActionResult<T>`. Không throw error ra ngoài action boundary.

---

## 9. RBAC & Security Rules

### Permission check — bắt buộc

```typescript
// Trong mọi Server Action và Server Page
const session = await requirePermission("crm_customers", "create")
//                                       ^ resource        ^ action
```

**Không được dùng `requireSession()` cho các route cần authorization** — chỉ dùng `requirePermission()`.

### Resource/Action matrix

| Resource | Actions |
|---|---|
| `users` | create, read, update, delete, manage |
| `roles` | create, read, update, delete, manage |
| `crm_customers` | create, read, update, delete |
| `crm_leads` | create, read, update, delete |
| `audit_logs` | read |
| `settings` | read, update |

### AUTH_BYPASS_DEV

- **Chỉ dùng trong môi trường development local**.
- **Không bao giờ set `AUTH_BYPASS_DEV=true` trong staging hay production**.
- Trước khi deploy: verify `AUTH_BYPASS_DEV` không tồn tại trong env production.

### Security checklist cho mọi feature mới

- [ ] Server Action có `requirePermission()` ở đầu
- [ ] Input được validate bằng Zod trước khi dùng
- [ ] Ownership check nếu user chỉ được sửa resource của mình
- [ ] Sensitive data không log ra console
- [ ] Password không bao giờ trả về trong query result

### Rate limiting

Áp dụng cho tất cả auth routes (`/api/auth/*`, login action):

```typescript
// Dùng Upstash Rate Limit hoặc middleware-level throttle
// Giới hạn: 5 attempts / 15 phút / IP
```

### Password hashing

- Luôn dùng `hashPassword()` từ `shared/lib/password.ts` (bcrypt, SALT_ROUNDS=12).
- Không bao giờ store plain text password.
- Không bao giờ compare password bằng `===`.

---

## 10. Database Migration Rules

```bash
# Tạo migration mới
docker compose exec web npx prisma migrate dev --name <verb>_<noun>
# Ví dụ: add_lead_index, add_tenant_id_to_customer

# Apply migration lên staging/prod
docker compose exec web npx prisma migrate deploy

# Reset DB (chỉ local)
docker compose exec web npx prisma migrate reset
```

### Naming convention cho migration

- `add_<field>_to_<table>` — thêm column
- `create_<table>` — tạo table mới
- `add_index_<field>_on_<table>` — thêm index
- `drop_<table>` — xóa table
- Không dùng timestamp hay auto-generated tên chung chung

### Quy tắc migration

- **Không edit migration file đã commit**.
- **Mọi schema change đều qua migration** — không `db push` trên production.
- **Kiểm tra `prisma/migrations/` được commit** cùng với schema changes.
- **Backward-compatible migrations** khi có thể: add nullable column trước, backfill data, sau đó add constraint.

---

## 11. File Naming Conventions

| Loại | Convention | Ví dụ |
|---|---|---|
| React Component | PascalCase.tsx | `CustomerForm.tsx` |
| Server Action file | camelCase.actions.ts | `customer.actions.ts` |
| Service file | camelCase.service.ts | `customer.service.ts` |
| Repository file | camelCase.repository.ts | `customer.repository.ts` |
| Schema file | camelCase.schema.ts | `crm.schema.ts` |
| Types file | camelCase.types.ts | `crm.types.ts` |
| Hook | use-kebab-case.ts | `use-sidebar.ts` |
| Utility | kebab-case.ts | `auth-utils.ts` |
| Next.js page | page.tsx | `page.tsx` |
| Next.js layout | layout.tsx | `layout.tsx` |
| Route segment | lowercase-kebab | `customers/[id]/edit/` |
| Constant | SCREAMING_SNAKE_CASE | `CUSTOMER_STATUS_LABELS` |
| Zod schema | camelCase + Schema | `createCustomerSchema` |
| Prisma select | camelCase + Select | `customerSummarySelect` |

---

## 12. Folder Structure

```
studio-system/
├── docker-compose.yml
├── docker-compose.override.yml    # Dev overrides
├── docker-compose.prod.yml        # Prod config
├── app/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seeds/
│   │       ├── index.ts
│   │       ├── roles.seed.ts
│   │       └── users.seed.ts
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── crm/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── customers/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │   │       └── edit/page.tsx
│   │   │   │   │   │   └── leads/  # (same structure)
│   │   │   │   │   ├── booking/    # Future module
│   │   │   │   │   ├── finance/    # Future module
│   │   │   │   │   └── production/ # Future module
│   │   │   │   └── layout.tsx
│   │   │   ├── api/
│   │   │   │   └── auth/[...nextauth]/route.ts
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── modules/               # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── actions/
│   │   │   │   ├── components/
│   │   │   │   ├── repository/
│   │   │   │   ├── schemas/
│   │   │   │   ├── service/
│   │   │   │   └── types/
│   │   │   ├── crm/
│   │   │   │   ├── actions/
│   │   │   │   │   ├── customer.actions.ts
│   │   │   │   │   └── lead.actions.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── customers/
│   │   │   │   │   ├── leads/
│   │   │   │   │   └── shared/
│   │   │   │   ├── repository/
│   │   │   │   │   ├── customer.repository.ts
│   │   │   │   │   └── lead.repository.ts
│   │   │   │   ├── schemas/
│   │   │   │   │   └── crm.schema.ts
│   │   │   │   ├── service/
│   │   │   │   │   ├── customer.service.ts
│   │   │   │   │   └── lead.service.ts
│   │   │   │   └── types/
│   │   │   │       └── crm.types.ts
│   │   │   ├── booking/           # Future
│   │   │   ├── finance/           # Future
│   │   │   └── production/        # Future
│   │   ├── shared/
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts      # Singleton PrismaClient
│   │   │   │   ├── auth-utils.ts  # requireSession, requirePermission
│   │   │   │   ├── audit.ts       # writeAuditLog
│   │   │   │   ├── password.ts    # hashPassword, verifyPassword
│   │   │   │   └── action-error.ts # toActionError util
│   │   │   └── types/
│   │   │       ├── api.types.ts   # ActionResult<T>
│   │   │       ├── rbac.types.ts  # Permission, Resource, Action
│   │   │       └── session.types.ts
│   │   ├── components/
│   │   │   ├── ui/                # shadcn primitives
│   │   │   └── layout/            # Sidebar, Navbar
│   │   ├── config/
│   │   │   ├── env.ts             # Zod env validation
│   │   │   └── navigation.ts      # Nav items + RBAC
│   │   ├── lib/
│   │   │   ├── auth.ts            # NextAuth config
│   │   │   ├── auth.config.ts     # Edge config
│   │   │   └── utils.ts           # cn()
│   │   └── hooks/
│   │       └── use-sidebar.ts
│   ├── .env
│   ├── .env.example
│   ├── CLAUDE.md
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── package.json
```

---

## 13. Coding Standards

### TypeScript — bắt buộc tuyệt đối

```typescript
// CẤM — không bao giờ dùng any
const data: any = response        // ❌
function process(input: any) {}   // ❌
const result = value as any       // ❌

// ĐÚNG
const data: unknown = response
if (typeof data === "string") { ... }

// Cast an toàn với type guard
function isApiError(err: unknown): err is ApiError {
  return err instanceof Error && "code" in err
}
```

### Explicit return types cho mọi function public

```typescript
// SAI
async function getCustomer(id: string) {
  return customerRepository.findById(id)
}

// ĐÚNG
async function getCustomer(id: string): Promise<CustomerDetail> {
  return customerRepository.findById(id)
}
```

### Không dùng non-null assertion (`!`) trừ khi có lý do rõ ràng

```typescript
const name = user!.name    // ❌ — có thể throw runtime error
const name = user?.name ?? "Anonymous"  // ✅
```

### Enum vs union type

```typescript
// Dùng const object + type union thay vì TypeScript enum
const CustomerStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const
type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus]
```

### Import order

1. React/Next.js
2. Third-party libraries
3. Internal `@/modules/...`
4. Internal `@/shared/...`
5. Internal `@/components/...`
6. Relative imports

---

## 14. Error Handling Standards

### Shared error utility

```typescript
// src/shared/lib/action-error.ts
export function toActionError(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  return fallback
}
```

### Error codes thay vì error messages từ service

```typescript
// Service throw error code
throw new Error("DUPLICATE_EMAIL")

// Action translate sang user-friendly message
const ERROR_MESSAGES: Record<string, string> = {
  DUPLICATE_EMAIL: "Email đã được sử dụng",
  NOT_FOUND: "Không tìm thấy",
}

catch (err) {
  const code = err instanceof Error ? err.message : "UNKNOWN"
  return { success: false, error: ERROR_MESSAGES[code] ?? fallback }
}
```

### Không catch error ở repository layer

Repository để error bubble up tự nhiên. Service catch và rethrow có context. Action catch và convert thành ActionResult.

### Prisma error handling

```typescript
import { Prisma } from "@prisma/client"

if (err instanceof Prisma.PrismaClientKnownRequestError) {
  if (err.code === "P2002") throw new Error("DUPLICATE_UNIQUE_FIELD")
  if (err.code === "P2025") throw new Error("NOT_FOUND")
}
```

---

## 15. Logging Standards

### Audit log — bắt buộc cho mọi mutation

```typescript
await writeAuditLog({
  userId: session.user.id,
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGIN_FAILED" | "PERMISSION_DENIED",
  resource: "crm_customers" | "crm_leads" | "users" | ...,
  resourceId: entity.id,
  metadata: { /* relevant fields — không include sensitive data */ },
  ipAddress: headers().get("x-forwarded-for") ?? undefined,
  userAgent: headers().get("user-agent") ?? undefined,
})
```

### Console logging

- `console.error` — chỉ cho unexpected errors (không bao giờ bị silent).
- `console.warn` — deprecation, fallback behavior.
- `console.log` — chỉ trong development, không commit vào production code.
- Không bao giờ log: password, token, secret, PII.

### Server-side logging

```typescript
// Prisma log config trong prisma.ts
log: process.env.NODE_ENV === "development"
  ? ["query", "error", "warn"]
  : ["error"],
```

---

## 16. Environment Variable Rules

### Cấu trúc `.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/studio_db"

# Auth
AUTH_SECRET="min-32-characters-random-string"
AUTH_URL="http://localhost:3000"

# App
NODE_ENV="development"

# Development only — KHÔNG SET TRONG PRODUCTION
# AUTH_BYPASS_DEV="true"
```

### Validation với Zod (bắt buộc)

```typescript
// src/config/env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

export const env = envSchema.parse(process.env)
```

### Quy tắc

- **Không hard-code bất kỳ URL, port, credential nào** — mọi thứ qua `env.*`.
- **Không commit `.env`** — chỉ commit `.env.example`.
- **`AUTH_BYPASS_DEV` nghiêm cấm trong staging/production**.
- Tách secrets theo môi trường: dev / staging / prod dùng các secret riêng biệt.

---

## 17. Git Workflow

### Commit message format (Conventional Commits)

```
<type>(<scope>): <subject>

Types: feat | fix | refactor | perf | style | test | docs | chore | security
Scope: crm | auth | booking | prisma | docker | ui | api

Ví dụ:
feat(crm): add lead pipeline view
fix(auth): remove AUTH_BYPASS_DEV from production middleware
refactor(crm): extract shared note action utilities
perf(prisma): add missing indexes on Lead and CustomerNote
security(rbac): add requirePermission to all crm actions
```

### Branch naming

```
feat/<scope>/<short-description>
fix/<scope>/<short-description>
refactor/<scope>/<short-description>

Ví dụ:
feat/crm/lead-pipeline
fix/auth/bypass-dev-removal
refactor/crm/note-actions
```

### Quy tắc

- Mỗi commit chứa một thay đổi logic duy nhất — không bundle nhiều unrelated changes.
- Không commit code có `console.log`, `TODO` chưa track, hay `any` cast.
- Không commit `.env`, secrets, hay debug code.
- Squash commits trước khi merge vào `main`.

---

## 18. Testing Standards

### Cấu trúc test

```
src/modules/<feature>/
├── service/__tests__/
│   └── <feature>.service.test.ts
├── repository/__tests__/
│   └── <feature>.repository.test.ts
└── actions/__tests__/
    └── <feature>.actions.test.ts
```

### Quy tắc

- **Service tests**: unit test với Prisma mock (`jest-mock-extended` hoặc `vitest-mock-extended`).
- **Repository tests**: integration test với real database (test container hoặc Docker test DB).
- **Action tests**: integration test — kiểm tra validate + service call + audit log.
- **Không mock database cho integration tests** — dùng transaction rollback hoặc test DB riêng.
- Mỗi test phải independent — không phụ thuộc state từ test khác.
- Test coverage tối thiểu: service layer 80%, repository layer 60%.

### Test naming

```typescript
describe("CustomerService", () => {
  describe("createCustomer", () => {
    it("throws DUPLICATE_EMAIL when email already exists", async () => { ... })
    it("creates customer with tags parsed from comma-separated string", async () => { ... })
  })
})
```

---

## 19. Performance Rules

### Database

- **Mọi list query phải có pagination** — default `pageSize: 20`, max `100`.
- **Không fetch data không cần thiết** — select chỉ fields cần cho view đó.
- **Dùng `Promise.all`** cho các independent queries thay vì await tuần tự.
- **Count query chạy song song** với data query (không phải sau).
- **Index** mọi column trong `where`, `orderBy`, foreign keys.

### Caching strategy

- **Next.js fetch cache**: dùng `unstable_cache` cho data ít thay đổi (roles, permissions).
- **`revalidatePath`**: gọi trong action sau mọi mutation để invalidate cache.
- **Session data**: cache role + permissions trong JWT token (8 giờ TTL).
- **Không cache** data có tenant/user scope mà không kèm cache key phân biệt.

```typescript
import { unstable_cache } from "next/cache"

export const getRoles = unstable_cache(
  async () => roleRepository.findAll(),
  ["roles"],
  { revalidate: 3600, tags: ["roles"] }
)
```

### Frontend

- **Images**: dùng `next/image` với `sizes` prop đúng.
- **Không fetch data trong Client Components** — fetch trong Server Components, pass xuống dưới.
- **Lazy load** heavy Client Components bằng `next/dynamic`.
- **Tránh prop drilling > 2 levels** — dùng composition hoặc context.

---

## 20. AI Agent Execution Workflow

Khi Claude Code thực hiện một task, tuân theo workflow sau:

### Trước khi viết code

1. **Đọc file liên quan** — không đoán, không assume.
2. **Xác định layer** — task này thuộc schema / repository / service / action / component?
3. **Kiểm tra module tồn tại** — đặt code vào đúng module.
4. **Kiểm tra pattern hiện có** — follow pattern của module, không tạo pattern mới.

### Khi viết code

1. **Luôn hiển thị đường dẫn file đầy đủ** trước khi viết nội dung file.
2. **Viết toàn bộ nội dung file** — không dùng `// ... rest of file`.
3. **Schema trước** → repository → service → action → component (đúng thứ tự).
4. **Prisma migration** nếu có schema change.
5. Không viết business logic ở sai layer.

### Sau khi viết code

1. Kiểm tra không có `any` type.
2. Kiểm tra mọi Server Action có `requirePermission()`.
3. Kiểm tra mọi mutation có `writeAuditLog()`.
4. Kiểm tra mọi list query có pagination.
5. Kiểm tra không có hardcoded values.

---

## 21. Definition of Done

Một feature/fix chỉ được coi là **DONE** khi:

- [ ] Code tuân thủ toàn bộ quy tắc trong CLAUDE.md này
- [ ] Không có `any` type trong code mới
- [ ] Mọi Server Action có `requirePermission()` check
- [ ] Mọi mutation có `writeAuditLog()`
- [ ] Input được validate bằng Zod schema
- [ ] Mọi list query có pagination
- [ ] Mọi column filter/sort có Prisma index
- [ ] Prisma migration được tạo nếu schema thay đổi
- [ ] Error handling đúng pattern (toActionError)
- [ ] Explicit return types trên public functions
- [ ] Không có hardcoded URL, credential, hay magic number
- [ ] Không có `console.log` trong production code
- [ ] Component < 200 dòng
- [ ] `AUTH_BYPASS_DEV` không xuất hiện trong production env

---

## 22. Forbidden Anti-Patterns

Các pattern sau bị **cấm tuyệt đối**:

### TypeScript

```typescript
// ❌ any type
const data: any = something
function fn(x: any) {}
(value as any).property

// ❌ Non-null assertion không có guard
user!.profile.name

// ❌ Implicit return type trên public API
export async function getUser(id: string) { ... }
```

### Architecture

```typescript
// ❌ Business logic trong component
export default function CustomerPage() {
  const isDuplicate = customers.filter(c => c.email === email).length > 1
  // ...
}

// ❌ Business logic trong action
export async function createAction(fd: FormData) {
  const existing = await db.customer.findFirst({ where: { email } })
  if (existing) return { success: false, error: "..." }
  // ...
}

// ❌ Direct Prisma calls trong action
export async function createAction(fd: FormData) {
  await db.customer.create({ data: { ... } })
}

// ❌ HTTP concerns trong service
export const customerService = {
  async create(req: Request) { ... }  // service không biết về Request
}
```

### Security

```typescript
// ❌ requireSession thay vì requirePermission
const session = await requireSession()  // Không đủ cho protected resource

// ❌ Bỏ qua ownership check
await customerRepository.delete(id)  // Không kiểm tra user có quyền không

// ❌ Log sensitive data
console.log("User login:", { email, password })
```

### Database

```typescript
// ❌ Select toàn bộ model
db.customer.findMany()  // Không có select

// ❌ N+1 query trong loop
for (const customer of customers) {
  const notes = await db.customerNote.findMany({ where: { customerId: customer.id } })
}

// ❌ findMany không có take
db.customer.findMany({ where: { status: "ACTIVE" } })  // Không có pagination
```

### React/Next.js

```typescript
// ❌ onClick handler từ Server Component xuống Client Component
<ClientButton onClick={() => serverFunction()} />

// ❌ useEffect để fetch data
useEffect(() => {
  fetch("/api/customers").then(...)
}, [])

// ❌ navigate bằng onClick thay vì Link
<Button onClick={() => router.push("/dashboard")}>Go</Button>
```

### Git

```
# ❌ Commit message không rõ ràng
git commit -m "fix"
git commit -m "update code"
git commit -m "wip"
git commit -m "asdfgh"
```

---

## Appendix: Domain Constants

### Booking Statuses

```typescript
const BOOKING_STATUS = {
  LEAD: "LEAD",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PRODUCTION: "IN_PRODUCTION",
  EDITING: "EDITING",
  REVIEW: "REVIEW",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const
```

### CRM Enums

- **CustomerStatus**: `ACTIVE` | `INACTIVE` | `BLOCKED`
- **CustomerSource**: `DIRECT` | `REFERRAL` | `SOCIAL_MEDIA` | `WEBSITE` | `EVENT` | `OTHER`
- **LeadStatus**: `NEW` | `CONTACTED` | `QUALIFIED` | `PROPOSAL` | `NEGOTIATION` | `WON` | `LOST`
- **LeadPriority**: `LOW` | `MEDIUM` | `HIGH` | `URGENT`

---

## 23. Design System

### Philosophy

**Notion-inspired Minimal Precision** — zinc-based neutral palette, near-black primary, extreme whitespace discipline. Every color has a purpose. No decorative color.

Inspired by: Notion, Linear, Vercel, Stripe Dashboard.

---

### Color Token System

Tất cả màu được định nghĩa trong `src/app/globals.css` dưới dạng CSS custom properties, ánh xạ qua `@theme inline` thành Tailwind utilities. **Không hard-code màu trong component**.

#### Semantic tokens — dùng trong mọi component

| Token | Tailwind class | Mô tả |
|---|---|---|
| `--background` | `bg-background` | Nền trang (#FAFAFA light / #0C0C0E dark) |
| `--foreground` | `text-foreground` | Text chính (near-black / near-white) |
| `--card` | `bg-card` | Nền card (white / zinc-900) |
| `--primary` | `bg-primary` | Primary action (zinc-950 / white) |
| `--primary-foreground` | `text-primary-foreground` | Text trên primary |
| `--secondary` | `bg-secondary` | Fill thứ cấp (zinc-100 / zinc-900) |
| `--muted` | `bg-muted` | Nền nhạt (zinc-100) |
| `--muted-foreground` | `text-muted-foreground` | Text phụ (zinc-500 / zinc-400) |
| `--border` | `border-border` | Đường viền (zinc-200 / 9% white) |
| `--ring` | `ring-ring` | Focus ring (zinc-900 / white) |
| `--destructive` | `text-destructive` / `bg-destructive` | Nguy hiểm (red-500) |
| `--success` | `bg-success text-success-foreground` | Thành công (emerald tinted) |
| `--warning` | `bg-warning text-warning-foreground` | Cảnh báo (amber tinted) |
| `--info` | `bg-info text-info-foreground` | Thông tin (blue tinted) |

#### Sidebar tokens (dùng trong sidebar component)

```
bg-sidebar          — sidebar background
text-sidebar-foreground
bg-sidebar-accent   — active / hover item background
text-sidebar-accent-foreground
border-sidebar-border
```

---

### Radius Scale

Base: `--radius: 0.5rem` (8px). Components dùng `rounded-md` (8px) làm chuẩn.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `rounded-sm` / `--radius-sm` | 4px | Badge, tag nhỏ |
| `rounded-md` / `--radius-md` | 6px | Button xs/sm |
| `rounded-lg` / `--radius-lg` | 8px | Input, Button, Card, Modal |
| `rounded-xl` / `--radius-xl` | 12px | Large card, sheet |

---

### Component Conventions

#### Button
- `variant="default"` — near-black fill, white text. Dùng cho primary CTA.
- `variant="secondary"` — zinc-100 fill. Dùng cho secondary action.
- `variant="outline"` — transparent + border. Dùng cho tertiary action.
- `variant="ghost"` — no border, no fill. Dùng trong toolbar, table actions.
- `variant="destructive"` — soft red. Dùng cho delete/cancel.
- Sizes: `xs` (h-6) | `sm` (h-7) | `default` (h-8) | `lg` (h-9) | `xl` (h-10)

#### Badge
- `rounded-md` (không phải pill) — enterprise style.
- Dùng semantic variants: `success`, `warning`, `info`, `destructive`, `muted`.
- **Không dùng màu hardcode** như `bg-emerald-100` — dùng `variant="success"`.

#### Input / Select
- Height chuẩn: `h-8` (32px) — đồng nhất với button default.
- Focus: `ring-2 ring-ring/20` — subtle, không harsh.

#### Card
- Border: `border border-border` — không dùng `ring-1 ring-foreground/10`.
- Radius: `rounded-lg` (8px).
- Padding: `px-5 py-5`.

#### Table
- Container: `rounded-lg border border-border` — card-style wrapper.
- Header: `sticky top-0` + `text-xs uppercase tracking-wide text-muted-foreground`.
- Row height: `h-11` (44px) với `px-3 first:pl-4 last:pr-4`.
- Hover: `hover:bg-muted/40` — very subtle.

---

### Typography

Font: **Nunito** (Google Fonts, subset `latin` + `vietnamese`).

| Element | Class | Ghi chú |
|---|---|---|
| Page title | `text-2xl font-semibold tracking-tight` | h1 |
| Section heading | `text-base font-semibold` | Card title |
| Body | `text-sm` | Default |
| Caption / label | `text-xs text-muted-foreground` | Helper text |
| Table header | `text-xs font-medium uppercase tracking-wide` | TableHead |

---

### Quy tắc màu — bắt buộc

- **Không bao giờ** dùng màu Tailwind hardcode (`bg-emerald-100`, `text-blue-800`…) trong component — dùng semantic tokens.
- **Không** dùng `ring-1 ring-foreground/10` cho card — dùng `border border-border`.
- **Không** dùng `rounded-xl` hay `rounded-full` cho button/input — dùng `rounded-md`.
- **Không** dùng `bg-indigo-*` hay màu brand cũ — palette đã chuyển sang zinc.
- Chart colors dùng `--chart-1` đến `--chart-5` (không hardcode).
