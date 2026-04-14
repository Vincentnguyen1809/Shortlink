# Thinksmart Shortlink

Hệ thống rút gọn link nội bộ cho Thinksmart Insurance (Next.js App Router + Prisma + Redis).

## Chạy local

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy Vercel (quan trọng)

1. Import repo vào Vercel.
2. Thêm biến môi trường:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
3. Build Command: `npm run build`
4. Install Command: `npm install`
5. Output: `.next`

## Lưu ý

- Nếu domain gốc hiện `404: NOT_FOUND`, kiểm tra lại route root `src/app/page.tsx` và `src/app/layout.tsx` đã có trong branch deploy hay chưa.
- Với production DB, cần chạy migrate từ môi trường CI/CD trước khi mở traffic.
