# SIPEDRAS

SIPEDRAS adalah sistem pelaporan digital untuk kerusakan aset dan sarana rumah sakit. Aplikasi menyediakan portal terpisah untuk staff, admin, dan super admin, serta aplikasi Android berbasis Capacitor.

## Teknologi

- Next.js 15, React 19, TypeScript, dan Tailwind CSS
- PostgreSQL dengan Drizzle ORM
- Better Auth dengan role-based access control
- Vercel Blob untuk lampiran laporan
- Firebase Cloud Messaging dan Capacitor untuk notifikasi Android

## Menjalankan secara lokal

Prasyarat: Node.js 20+, npm, Docker, dan Java/Android SDK jika membangun aplikasi Android.

```bash
npm install
docker compose up -d
copy .env.example .env.local
npm run db:setup
npm run dev
```

Sesuaikan nilai `.env.local` sebelum menjalankan migrasi. Jangan commit file environment atau service-account ke repository.

## Validasi

```bash
npx tsc --noEmit
npm run build
cd android
gradlew.bat test
```

## Deployment

Deployment web menggunakan Vercel dengan project `sirs-rsud`. Konfigurasi environment production dikelola melalui Vercel, bukan melalui file yang disimpan di repository.

Android menggunakan Capacitor dan saat ini membuka deployment web melalui URL yang dikonfigurasi di `capacitor.config.ts`.

## Dokumentasi

- Kebutuhan produk: [`prd.md`](./prd.md)
- Konfigurasi Firebase Cloud Messaging: [`docs/fcm-setup.md`](./docs/fcm-setup.md)
