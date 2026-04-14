# STEP 1 — Project Setup & Folder Structure (Next.js 14+)

> Mục tiêu: khởi tạo nền tảng chuẩn production cho hệ thống rút gọn link nội bộ Thinksmart Insurance.

## 1) Exact shell commands

```bash
# 0) Tạo project Next.js 14+ với TypeScript + App Router + Tailwind + ESLint
npx create-next-app@latest thinksmart-shortlink \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd thinksmart-shortlink

# 1) Cài package UI & tiện ích chính
npm install next-themes lucide-react recharts qrcode.react zod react-hook-form @hookform/resolvers

# 2) Cài Prisma + PostgreSQL client
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql

# 3) Cài Redis client + geo/ip parser + helper
npm install ioredis ua-parser-js geoip-lite nanoid date-fns
npm install -D @types/geoip-lite

# 4) Cài Shadcn UI
npx shadcn@latest init

# 5) Add các component Shadcn dùng cho dashboard/link management
npx shadcn@latest add button card input label textarea select tabs dropdown-menu dialog sheet table badge avatar form switch separator toast tooltip popover calendar command skeleton alert

# 6) Tạo biến môi trường local
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/thinksmart_shortlink?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="replace-with-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ENVEOF

# 7) Khởi tạo Prisma Client
npx prisma generate

# 8) Chạy app dev
npm run dev
```

## 2) Complete directory tree (after Step 1)

```text
thinksmart-shortlink/
├── .env
├── .env.example
├── .eslintrc.json
├── components.json
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   └── ...
├── prisma/
│   └── schema.prisma
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── dang-nhap/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   ├── (dashboard)/
    │   │   ├── dashboard/
    │   │   │   └── page.tsx
    │   │   ├── links/
    │   │   │   ├── page.tsx
    │   │   │   └── tao-moi/
    │   │   │       └── page.tsx
    │   │   ├── domains/
    │   │   │   └── page.tsx
    │   │   ├── analytics/
    │   │   │   └── page.tsx
    │   │   ├── cai-dat/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   ├── [domain]/
    │   │   └── [slug]/
    │   │       └── route.ts
    │   ├── api/
    │   │   ├── links/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/route.ts
    │   │   ├── analytics/
    │   │   │   └── route.ts
    │   │   ├── domains/
    │   │   │   └── route.ts
    │   │   └── webhooks/
    │   │       └── route.ts
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── ui/
    │   │   └── ...shadcn components...
    │   ├── charts/
    │   │   ├── clicks-line-chart.tsx
    │   │   ├── top-links-bar.tsx
    │   │   └── traffic-donut.tsx
    │   ├── links/
    │   │   ├── create-link-form.tsx
    │   │   ├── links-table.tsx
    │   │   └── qr-dialog.tsx
    │   └── layout/
    │       ├── sidebar.tsx
    │       ├── header.tsx
    │       └── theme-toggle.tsx
    ├── lib/
    │   ├── prisma.ts
    │   ├── redis.ts
    │   ├── auth.ts
    │   ├── rbac.ts
    │   ├── validators/
    │   │   ├── domain.ts
    │   │   └── link.ts
    │   ├── analytics/
    │   │   └── heartbeat.ts
    │   └── utils.ts
    ├── server/
    │   ├── services/
    │   │   ├── domain.service.ts
    │   │   ├── link.service.ts
    │   │   └── analytics.service.ts
    │   └── repositories/
    │       ├── link.repository.ts
    │       └── click.repository.ts
    ├── hooks/
    │   ├── use-copy.ts
    │   └── use-debounce.ts
    └── types/
        ├── analytics.ts
        ├── link.ts
        └── domain.ts
```

## 3) Architecture notes for upcoming steps

- App Router route động `src/app/[domain]/[slug]/route.ts` sẽ là redirect engine ưu tiên Redis trước DB để đạt latency thấp.
- Prisma quản lý toàn bộ business entities; Redis dùng cho slug lookup cache + realtime counters.
- Dashboard analytics dùng Recharts, language hiển thị tiếng Việt, dark mode mặc định.
