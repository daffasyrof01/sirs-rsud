# SIPEDRAS

SIPEDRAS adalah sistem pelaporan digital untuk kerusakan aset dan sarana rumah sakit. Aplikasi menyediakan portal terpisah untuk staff, admin, dan super admin, serta aplikasi Android berbasis Capacitor.

## Teknologi

- Next.js 15, React 19, TypeScript, dan Tailwind CSS
- PostgreSQL dengan Drizzle ORM
- Better Auth dengan role-based access control
- Vercel Blob untuk lampiran laporan
- Firebase Cloud Messaging dan Capacitor untuk notifikasi Android

## Menjalankan secara lokal

Prasyarat: Node.js 22 atau lebih baru dan npm. Docker diperlukan jika memakai database lokal dari `docker-compose.yml`.
Build Android membutuhkan Java 21 dan Android SDK 36.

```bash
npm ci
docker compose up -d
```

Salin `.env.example` ke `.env.local`, lalu sesuaikan koneksi database dan konfigurasi lainnya.
Untuk database baru yang masih kosong:

```bash
npm run db:migrate
npm run db:bootstrap
npm run dev
```

`db:bootstrap` membuat akun superadmin awal berdasarkan `INITIAL_SUPERADMIN_EMAIL` dan
`INITIAL_SUPERADMIN_PASSWORD`. Saat memakai hasil restore database, akun lama tetap tersedia;
bootstrap tidak diperlukan. Jangan commit file environment atau service-account ke repository.

## Status fitur

- Akun dibuat dan dikelola oleh Super Admin; pendaftaran mandiri dinonaktifkan.
- Pemulihan password dilakukan oleh Super Admin melalui Manajemen Pengguna. Halaman Lupa Password berisi panduan menghubungi Super Admin.
- Impor CSV/Excel belum tersedia. Pengguna ditambahkan satu per satu.
- Foto laporan memakai Vercel Blob. Backup database dan backup lampiran perlu disiapkan terpisah.

## Validasi

```bash
npm test
npx tsc --noEmit
npm run build
```

Tes akun memakai penyimpanan di memori dan tidak mengakses PostgreSQL atau layanan email.

Untuk Android, sinkronkan project lalu jalankan dari PowerShell:

```powershell
npm run cap:sync
cd android
.\gradlew.bat assembleDebug assembleDebugAndroidTest
.\gradlew.bat connectedDebugAndroidTest
```

`connectedDebugAndroidTest` membutuhkan emulator atau perangkat Android terhubung dan memeriksa identitas aplikasi serta launcher.

## Deployment

Deployment web menggunakan Vercel dengan project `sirs-rsud`. Konfigurasi environment production dikelola melalui Vercel, bukan melalui file yang disimpan di repository.

Android menggunakan Capacitor dan saat ini membuka deployment web melalui URL yang dikonfigurasi di `capacitor.config.ts`.

Untuk menjalankan web pada server sendiri, siapkan environment production, lalu jalankan `npm ci`,
`npm run build`, dan `npm start`. Gunakan HTTPS dan isi `BETTER_AUTH_URL` sesuai alamat aplikasi.
`docker-compose.yml` hanya menyiapkan PostgreSQL pengembangan dengan credential lokal; sesuaikan untuk server rumah sakit.

## Dokumentasi

- Kebutuhan produk: [`prd.md`](./prd.md)
- Konfigurasi Firebase Cloud Messaging: [`docs/fcm-setup.md`](./docs/fcm-setup.md)
