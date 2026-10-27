# Spesifikasi SIPEDRAS

SIPEDRAS (Sistem Pelaporan Digital Respon Aset dan Sarana) dipakai untuk melaporkan
kerusakan aset dan fasilitas rumah sakit, mencatat penanganan, dan mengelola akun pengguna.
Dokumen ini menjelaskan implementasi dalam repository. Hasil pengujian perangkat dan
beban pengguna perlu dicatat terpisah saat penerimaan oleh rumah sakit.

## Pengguna dan hak akses

| Kegiatan | Staff | Admin | Super Admin |
|---|---|---|---|
| Melihat laporan sendiri | Ya | Ya | Ya |
| Melihat seluruh laporan | Tidak | Ya | Ya |
| Membuat laporan melalui portal Staff | Ya | Tidak | Tidak |
| Mengubah status, penugasan, dan spare part | Tidak | Ya | Ya |
| Menghapus laporan permanen | Tidak | Tidak | Ya |
| Mengelola akun dan mereset password pengguna | Tidak | Tidak | Ya |

Login tersedia di `/login/staff`, `/login/admin`, dan `/login/superadmin`.
Pembatasan akses diterapkan di server, termasuk pada endpoint administrasi Better Auth.
Pendaftaran mandiri dinonaktifkan; Super Admin membuat akun dari Manajemen Pengguna.

## Laporan kerusakan

Staff mengisi judul, kategori, lokasi berupa teks, prioritas, waktu kejadian, dan
deskripsi. Foto bukti bersifat opsional. Form membatasi foto hingga lima file,
masing-masing maksimal 4 MB dalam format JPEG, PNG, atau WebP.

Kategori meliputi listrik, plumbing, struktural, peralatan medis, HVAC, IT/jaringan,
dan lainnya. Prioritas meliputi rendah, sedang, tinggi, dan darurat. Status laporan
meliputi pending, diproses, selesai, dan ditolak.

Draft disimpan pada perangkat melalui localStorage. Setelah dikirim, laporan dan
riwayat perubahan disimpan di PostgreSQL. Foto yang diunggah disimpan di Vercel Blob;
database menyimpan referensi file. Jika unggahan Blob gagal, implementasi saat ini
dapat menyimpan foto inline dalam database.

Admin dan Super Admin dapat mengubah status, mengisi penugasan teknisi, dan mencatat
spare part. Dashboard menampilkan ringkasan laporan. Daftar laporan menyediakan
pencarian, filter, detail, dan ekspor PDF, Excel XML, atau CSV. Penyaringan daftar
saat ini dilakukan di sisi browser; pagination server belum tersedia.

## Akun dan pemulihan password

Super Admin dapat membuat, mengedit, mengaktifkan, menonaktifkan, menghapus akun,
dan memberikan password sementara. Password tidak dikirim dalam respons daftar
pengguna. Riwayat tindakan penting dicatat pada audit log.

Pemulihan password dilakukan melalui Super Admin. Halaman Lupa Password meminta
pengguna menghubungi Super Admin dengan identitas akun. Tidak ada pengiriman tautan
reset melalui email pada alur ini. Impor CSV/Excel belum tersedia dan tidak
ditampilkan sebagai tindakan aktif.

Sesi dan hash password dikelola oleh Better Auth. Masa sesi dikonfigurasi 30 hari,
dengan pembaruan sesi setiap satu hari; tidak ada logout otomatis berdasarkan waktu
idle yang terpisah. Verifikasi email OTP bersifat opsional melalui
`NEXT_PUBLIC_EMAIL_OTP_ENABLED` dan memerlukan konfigurasi layanan email.

## Notifikasi dan Android

Notifikasi tersedia di aplikasi web. Aplikasi Android memakai Capacitor untuk
membuka alamat web pada `capacitor.config.ts`. Notifikasi Android melalui Firebase
Cloud Messaging memerlukan konfigurasi Firebase di aplikasi dan backend.
Langkah konfigurasi tersedia di [docs/fcm-setup.md](docs/fcm-setup.md).

Perubahan domain saat migrasi membutuhkan penyesuaian konfigurasi web dan URL
Android, kemudian pengujian ulang pada perangkat.

## Kebutuhan instalasi dan operasi

- Node.js 22 atau lebih baru, npm, dan PostgreSQL.
- Java 21 serta Android SDK 36 untuk build Android.
- HTTPS pada server produksi dan environment variable yang sesuai
  [README.md](README.md) serta `.env.example`.
- Backup database dan file lampiran secara terpisah.
- Pengaturan jadwal backup, retensi file, kapasitas server, dan monitoring oleh
  pengelola server. Repository tidak menjalankan backup terjadwal otomatis.

## Verifikasi sebelum serah terima

Jalankan `npm test`, `npx tsc --noEmit`, dan `npm run build`. Tes akun menggunakan
penyimpanan di memori, tanpa PostgreSQL produksi. Pengujian Android pada perangkat
menggunakan `connectedDebugAndroidTest`.

Pada server tujuan, verifikasi login tiap peran, pembatasan akses laporan, pengelolaan
akun oleh Super Admin, reset password, pembuatan laporan, foto, perubahan status,
ekspor, dan notifikasi. Kapasitas pengguna serentak, waktu respons, serta prosedur
restore perlu diuji sebelum dinyatakan memenuhi kebutuhan operasional.
