# Konfigurasi notifikasi Android SIPEDRAS

FCM dipakai agar notifikasi tetap bisa masuk ke Android walaupun aplikasi tidak sedang dibuka.

Gunakan Node.js 22+, Java 21, dan Android SDK 36 untuk menyiapkan build Android.

## 1. Buat Firebase Project

1. Buka Firebase Console.
2. Buat project baru atau pakai project yang sudah ada.
3. Tambahkan aplikasi Android.
4. Isi package name:

```text
id.rsud.sirs
```

## 2. Pasang google-services.json

Unduh file `google-services.json` dari Firebase, lalu taruh di:

```text
android/app/google-services.json
```

Setelah itu jalankan:

```powershell
npm.cmd run cap:sync
cd android
.\gradlew.bat assembleDebug
```

## 3. Isi Environment Variable Backend

Buat service account di Firebase/Google Cloud, lalu isi env berikut di lokal dan Vercel:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Untuk `FIREBASE_PRIVATE_KEY`, gunakan format dengan `\n`, contohnya:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nISI_KEY_ANDA\n-----END PRIVATE KEY-----\n"
```

## 4. Jalankan Migration

FCM membutuhkan tabel `push_device_tokens`.

```powershell
npm.cmd run db:migrate
```

## 5. Deploy Ulang

Setelah env Vercel diisi:

```powershell
npx.cmd vercel deploy --prod --yes --scope daffasyrofs-projects
```

## 6. Cara Test

1. Install APK terbaru di HP.
2. Login sebagai staff.
3. Izinkan notifikasi.
4. Login sebagai admin/superadmin dari browser.
5. Ubah status laporan milik staff.
6. Notifikasi FCM seharusnya masuk ke HP walaupun aplikasi tidak sedang dibuka.
