# Product Requirements Document
# Sistem Informasi Rumah Sakit (SIRS)
> Hospital Information System — Website Platform

---

| Atribut | Detail |
|---|---|
| **Versi Dokumen** | 1.0.0 |
| **Tanggal Dibuat** | April 2026 |
| **Status** | Draft |
| **Platform** | Website (Responsive) |
| **Tipe Pengguna** | Super Admin, Admin, Staff Rumah Sakit |

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Gambaran Umum Produk](#2-gambaran-umum-produk)
3. [Fitur dan Kebutuhan Fungsional](#3-fitur-dan-kebutuhan-fungsional)
4. [Kebutuhan Non-Fungsional](#4-kebutuhan-non-fungsional)
5. [Alur Pengguna](#5-alur-pengguna-user-flow)
6. [Matriks Fitur per Peran](#6-matriks-fitur-per-peran-pengguna)
7. [Kriteria Penerimaan](#7-kriteria-penerimaan)
8. [Estimasi Timeline](#8-estimasi-timeline-pengembangan)
9. [Risiko dan Mitigasi](#9-risiko-dan-mitigasi)
10. [Lampiran](#10-lampiran)

---

## 1. Pendahuluan

### 1.1 Latar Belakang

Rumah sakit sebagai institusi pelayanan kesehatan membutuhkan sistem informasi yang terintegrasi untuk mendukung efisiensi operasional, terutama dalam pengelolaan laporan kerusakan fasilitas dan manajemen pengguna sistem. Saat ini, banyak rumah sakit masih mengandalkan proses manual yang rentan terhadap keterlambatan pelaporan, kehilangan data, dan minimnya transparansi antar level manajemen.

Sistem Informasi Rumah Sakit (SIRS) berbasis web ini dirancang untuk mengatasi permasalahan tersebut dengan menyediakan platform digital yang dapat diakses oleh tiga level pengguna — **Super Admin**, **Admin**, dan **Staff Rumah Sakit** — dengan hak akses dan fitur yang disesuaikan dengan kebutuhan masing-masing peran.

### 1.2 Tujuan Produk

- Menyediakan sistem pelaporan kerusakan fasilitas rumah sakit secara digital dan terpusat.
- Memisahkan hak akses dan tampilan antarmuka berdasarkan peran pengguna.
- Memudahkan Super Admin dalam mengelola seluruh akun pengguna sistem.
- Memberikan Admin kemampuan memantau dan mengelola laporan kerusakan.
- Memberikan Staff kemampuan membuat dan memantau laporan kerusakan secara mandiri.

### 1.3 Ruang Lingkup

Dokumen ini mencakup spesifikasi kebutuhan fungsional dan non-fungsional untuk SIRS berbasis web dengan modul-modul berikut:

- Sistem Autentikasi Multi-Peran (Login terpisah per peran pengguna)
- Dashboard informatif per peran pengguna
- Modul Laporan Kerusakan (Staff dan Admin)
- Modul Manajemen Pengguna (khusus Super Admin)

### 1.4 Definisi dan Singkatan

| Istilah | Definisi |
|---|---|
| **SIRS** | Sistem Informasi Rumah Sakit |
| **PRD** | Product Requirements Document |
| **Super Admin** | Pengguna dengan akses tertinggi, dapat mengelola seluruh data dan pengguna |
| **Admin** | Pengguna dengan akses manajerial untuk memantau dan mengelola laporan |
| **Staff** | Pengguna operasional yang membuat dan memantau laporan kerusakan |
| **Dashboard** | Halaman utama berisi ringkasan informasi dan statistik |
| **UI/UX** | User Interface / User Experience |

---

## 2. Gambaran Umum Produk

### 2.1 Deskripsi Sistem

SIRS adalah aplikasi web multi-peran yang memungkinkan pengelolaan laporan kerusakan fasilitas rumah sakit secara digital. Setiap peran pengguna memiliki halaman login, dashboard, dan fitur yang berbeda sesuai dengan tanggung jawab dan kewenangannya dalam organisasi rumah sakit.

### 2.2 Arsitektur Peran Pengguna

| Peran | Level Akses | Deskripsi |
|---|---|---|
| **Super Admin** | Level 1 (Tertinggi) | Mengelola seluruh sistem: dashboard, laporan kerusakan, dan manajemen pengguna (CRUD semua akun) |
| **Admin** | Level 2 | Memantau dashboard dan mengelola laporan kerusakan; tidak memiliki akses manajemen pengguna |
| **Staff Rumah Sakit** | Level 3 (Operasional) | Membuat laporan kerusakan baru dan memantau riwayat laporan yang telah dibuat |

### 2.3 Asumsi dan Ketergantungan

- Sistem diakses melalui browser web modern (Chrome, Firefox, Edge, Safari).
- Setiap pengguna harus terdaftar dalam sistem oleh Super Admin sebelum dapat login.
- Sistem membutuhkan koneksi internet aktif.
- Data tersimpan di server/database yang terpisah dari aplikasi front-end.

---

## 3. Fitur dan Kebutuhan Fungsional

### 3.1 Sistem Autentikasi & Login

Setiap peran pengguna mengakses sistem melalui URL halaman login yang berbeda, dengan tampilan antarmuka yang disesuaikan untuk masing-masing peran.

#### 3.1.1 Spesifikasi Halaman Login

| Peran | URL / Path | Keterangan |
|---|---|---|
| Super Admin | `/login/superadmin` | Antarmuka premium, identitas sistem lengkap |
| Admin | `/login/admin` | Antarmuka profesional manajemen |
| Staff | `/login/staff` | Antarmuka sederhana dan cepat diakses |

#### 3.1.2 Komponen Halaman Login (Semua Peran)

- Field input Email / Username dan Password
- Tombol Login dengan validasi form
- Pesan error yang informatif (email tidak ditemukan, password salah, akun nonaktif)
- Indikator peran pengguna yang jelas (label/badge identitas peran)
- Opsi "Lupa Password" dengan alur reset melalui email
- Redirect otomatis ke dashboard sesuai peran setelah login berhasil

#### 3.1.3 Keamanan Autentikasi

- Session token / JWT dengan waktu kedaluwarsa yang dapat dikonfigurasi
- Pembatasan akses halaman berdasarkan peran (route guard)
- Logout otomatis setelah periode tidak aktif
- Enkripsi password menggunakan algoritma bcrypt (salt factor minimal 10)

---

### 3.2 Portal Staff Rumah Sakit

Antarmuka Staff dirancang untuk kemudahan operasional sehari-hari dalam membuat dan memantau laporan kerusakan fasilitas.

#### 3.2.1 Tab Dashboard Staff

Dashboard memberikan gambaran umum status laporan yang dimiliki oleh staff yang sedang login.

**Komponen wajib:**
- Kartu ringkasan statistik: Total Laporan Dibuat, Laporan Pending, Laporan Diproses, Laporan Selesai
- Grafik tren laporan bulanan milik staff tersebut
- Tabel laporan terbaru (5–10 entri terakhir) dengan status terkini
- Notifikasi pembaruan status laporan yang belum dibaca
- Shortcut / tombol cepat menuju halaman Buat Laporan
- Informasi profil staff: nama, departemen/unit, tanggal login terakhir

#### 3.2.2 Tab Riwayat Laporan

Menampilkan seluruh laporan yang pernah dibuat oleh staff yang sedang login.

**Fitur yang tersedia:**
- Tabel daftar laporan dengan kolom: No. Laporan, Judul Kerusakan, Lokasi, Tanggal Dibuat, Status, Prioritas, Aksi
- Filter laporan berdasarkan: Status, Rentang Tanggal, Prioritas, Kategori Kerusakan
- Fitur pencarian berdasarkan nomor laporan atau kata kunci judul
- Pagination untuk pengelolaan data banyak
- Tombol Detail untuk melihat informasi lengkap laporan
- Badge status berwarna yang mudah dibedakan secara visual
- Ekspor data laporan dalam format PDF atau Excel

#### 3.2.3 Tab Buat Laporan

Form untuk membuat laporan kerusakan fasilitas baru.

**Field wajib pada form laporan:**
- Judul Kerusakan (teks singkat deskriptif)
- Kategori Kerusakan (dropdown: Listrik, Plumbing, Struktural, Peralatan Medis, HVAC, IT/Jaringan, Lainnya)
- Lokasi Kerusakan (dropdown gedung + input detail ruangan/lantai)
- Tingkat Prioritas (Rendah / Sedang / Tinggi / Darurat)
- Deskripsi Lengkap Kerusakan (textarea minimal 50 karakter)
- Upload Foto Bukti Kerusakan (maks. 5 foto, format JPG/PNG/WEBP, maks. 5 MB per foto)
- Tanggal dan Waktu Kejadian

**Perilaku Form:**
- Auto-fill nama pelapor, departemen, dan tanggal berdasarkan akun staff yang login
- Validasi real-time sebelum submit
- Konfirmasi dialog sebelum pengiriman laporan
- Nomor laporan otomatis ter-generate setelah submit berhasil
- Notifikasi sukses dengan nomor laporan untuk referensi
- Fitur simpan draft laporan yang belum selesai

---

### 3.3 Portal Admin

Admin memiliki akses untuk memantau keseluruhan laporan kerusakan di rumah sakit dan mengelola tindak lanjutnya, namun **tidak memiliki akses** untuk manajemen pengguna.

#### 3.3.1 Tab Dashboard Admin

**Komponen wajib:**
- Kartu KPI utama: Total Laporan Masuk, Laporan Pending, Laporan Dalam Proses, Laporan Selesai Bulan Ini
- Grafik laporan per kategori kerusakan (pie chart atau bar chart)
- Grafik tren laporan mingguan/bulanan
- Tabel laporan terbaru yang membutuhkan tindakan segera
- Statistik rata-rata waktu penanganan laporan
- Heatmap / ringkasan laporan berdasarkan lokasi/gedung
- Notifikasi laporan prioritas Tinggi dan Darurat yang belum ditangani

#### 3.3.2 Tab Laporan Kerusakan (Admin)

**Fitur pengelolaan laporan:**
- Tabel master laporan dengan kolom: No. Laporan, Pelapor, Judul, Kategori, Lokasi, Tanggal, Prioritas, Status, Assigned To, Aksi
- Filter multidimensi: Status, Prioritas, Kategori, Lokasi, Pelapor, Rentang Tanggal
- Tombol Ubah Status laporan (Pending → Diproses → Selesai / Ditolak)
- Form tambah komentar / catatan tindak lanjut pada laporan
- Fitur penugasan laporan kepada teknisi / petugas terkait
- Tombol Lihat Detail laporan lengkap beserta foto bukti
- Ekspor laporan dalam format PDF, Excel, atau CSV
- Pencarian global berdasarkan kata kunci

---

### 3.4 Portal Super Admin

Super Admin memiliki semua fitur yang dimiliki Admin, ditambah dengan akses penuh terhadap manajemen pengguna sistem.

#### 3.4.1 Tab Dashboard Super Admin

Identik dengan Dashboard Admin, dengan **komponen tambahan:**
- Ringkasan jumlah pengguna aktif per peran (Admin, Staff)
- Statistik aktivitas login sistem (pengguna aktif hari ini, minggu ini)
- Log aktivitas terbaru di seluruh sistem
- Indikator kesehatan sistem (uptime, status database)

#### 3.4.2 Tab Laporan Kerusakan (Super Admin)

Identik dengan Tab Laporan Kerusakan Admin, dengan tambahan hak akses:
- Menghapus laporan permanen dari sistem
- Melihat log perubahan status seluruh laporan
- Mengekspor semua data laporan historis

#### 3.4.3 Tab Manajemen Pengguna *(Eksklusif Super Admin)*

> ⚠️ Fitur ini **hanya tersedia untuk Super Admin** dan tidak dapat diakses oleh peran lain.

**Sub-fitur Manajemen Pengguna:**
- Tabel daftar semua pengguna dengan kolom: ID, Nama, Email, Peran, Departemen, Status Akun, Tanggal Dibuat, Aksi
- Tambah Pengguna Baru (nama, email, peran, departemen, password sementara)
- Edit Data Pengguna (semua field kecuali email yang sudah terverifikasi)
- Nonaktifkan / Aktifkan akun pengguna tanpa menghapus data
- Hapus Permanen akun pengguna dengan konfirmasi berlapis
- Filter daftar pengguna berdasarkan Peran dan Status Akun
- Reset Password pengguna (kirim link reset ke email)
- Log aktivitas pengguna (terakhir login, riwayat perubahan data)
- Impor pengguna secara massal melalui file Excel/CSV

---

## 4. Kebutuhan Non-Fungsional

### 4.1 Performa

- Waktu muat halaman pertama (First Contentful Paint) di bawah 3 detik pada koneksi 4G.
- Response time API tidak melebihi 500ms untuk operasi baca data standar.
- Sistem mampu menangani minimal 100 pengguna konkuren tanpa degradasi performa.
- Upload foto kerusakan diproses dalam waktu tidak lebih dari 10 detik.

### 4.2 Keamanan

- Implementasi HTTPS (TLS 1.2 atau lebih baru) untuk seluruh komunikasi data.
- Proteksi terhadap serangan CSRF, XSS, dan SQL Injection.
- Password disimpan dalam bentuk hash dengan algoritma bcrypt (salt factor minimal 10).
- Session token memiliki masa berlaku maksimal 8 jam dan diperbarui otomatis.
- Pembatasan akses endpoint API berdasarkan peran menggunakan middleware.
- Log audit untuk setiap perubahan data kritikal.

### 4.3 Ketersediaan & Keandalan

- Uptime sistem minimal 99.5% (termasuk maintenance window terjadwal).
- Backup data otomatis setiap 24 jam.
- Sistem harus memiliki mekanisme pemulihan kesalahan (error recovery) yang graceful.

### 4.4 Antarmuka Pengguna (UI/UX)

- Desain responsif: desktop (1280px+), tablet (768px–1279px), mobile (320px–767px).
- Konsistensi komponen UI di seluruh halaman menggunakan design system terpusat.
- Setiap aksi destruktif (hapus, nonaktifkan) memerlukan konfirmasi eksplisit.
- Pesan error dan sukses harus deskriptif dalam Bahasa Indonesia.
- Mendukung aksesibilitas dasar (contrast ratio minimal 4.5:1, navigasi keyboard).

### 4.5 Kompatibilitas Browser

| Browser | Versi Minimum | Level Dukungan |
|---|---|---|
| Google Chrome | v90+ | Penuh (Primary) |
| Mozilla Firefox | v88+ | Penuh |
| Microsoft Edge | v90+ | Penuh |
| Safari | v14+ | Sebagian besar fitur |

---

## 5. Alur Pengguna (User Flow)

### 5.1 Alur Login dan Navigasi

1. Pengguna mengakses URL login sesuai perannya (`/login/staff`, `/login/admin`, `/login/superadmin`).
2. Memasukkan kredensial (email + password).
3. Sistem memvalidasi kredensial dan memverifikasi peran.
4. Jika berhasil, pengguna diarahkan ke dashboard sesuai perannya.
5. Jika gagal, sistem menampilkan pesan error yang spesifik.

### 5.2 Alur Pembuatan Laporan (Staff)

1. Staff login melalui `/login/staff`.
2. Pada dashboard, klik tombol "Buat Laporan Baru" atau navigasi ke tab Buat Laporan.
3. Mengisi semua field wajib pada form laporan.
4. Upload foto bukti kerusakan (opsional namun direkomendasikan).
5. Klik tombol "Kirim Laporan" dan konfirmasi pada dialog yang muncul.
6. Sistem menghasilkan nomor laporan unik dan mengirim notifikasi ke Admin.
7. Staff dapat memantau status laporan melalui tab Riwayat Laporan.

### 5.3 Alur Pengelolaan Laporan (Admin / Super Admin)

1. Admin atau Super Admin login melalui URL masing-masing.
2. Memantau laporan baru pada dashboard atau tab Laporan Kerusakan.
3. Membuka detail laporan dan meninjau informasi serta foto yang dilampirkan.
4. Mengubah status laporan dan menambahkan catatan tindak lanjut.
5. Menugaskan laporan kepada teknisi yang bertanggung jawab.
6. Memperbarui status laporan hingga berstatus Selesai.
7. Staff pelapor menerima notifikasi pembaruan status secara otomatis.

### 5.4 Alur Manajemen Pengguna (Super Admin)

1. Super Admin membuka tab Manajemen Pengguna.
2. Untuk menambah pengguna: klik "Tambah Pengguna", isi form, submit.
3. Sistem mengirimkan email aktivasi berisi password sementara ke pengguna baru.
4. Untuk menonaktifkan: klik tombol Nonaktifkan pada baris pengguna, konfirmasi.
5. Pengguna yang dinonaktifkan tidak dapat login hingga diaktifkan kembali.

---

## 6. Matriks Fitur per Peran Pengguna

| Fitur / Halaman | Super Admin | Admin | Staff |
|---|:---:|:---:|:---:|
| Halaman Login Terpisah per Peran | ✅ | ✅ | ✅ |
| Dashboard (ringkasan statistik) | ✅ | ✅ | ✅ |
| Dashboard info pengguna aktif sistem | ✅ | ❌ | ❌ |
| Lihat semua laporan kerusakan | ✅ | ✅ | ❌ |
| Lihat laporan milik sendiri | ✅ | ✅ | ✅ |
| Buat laporan kerusakan baru | ❌ | ❌ | ✅ |
| Riwayat laporan (staff sendiri) | ❌ | ❌ | ✅ |
| Ubah status laporan | ✅ | ✅ | ❌ |
| Hapus laporan permanen | ✅ | ❌ | ❌ |
| Ekspor laporan (PDF/Excel) | ✅ | ✅ | ✅ |
| **Manajemen Pengguna (CRUD)** | ✅ | ❌ | ❌ |
| Reset password pengguna lain | ✅ | ❌ | ❌ |
| Impor pengguna massal (CSV) | ✅ | ❌ | ❌ |

---

## 7. Kriteria Penerimaan

### 7.1 Autentikasi

- Setiap peran dapat login melalui halaman login yang berbeda dan diarahkan ke portal yang tepat.
- Pengguna tidak dapat mengakses halaman peran lain meskipun mengetahui URL-nya.
- Sistem menampilkan pesan error yang spesifik untuk kredensial yang salah.

### 7.2 Staff

- Staff dapat membuat laporan lengkap beserta foto dan menerima nomor laporan.
- Riwayat laporan hanya menampilkan laporan milik staff yang sedang login.
- Dashboard menampilkan statistik akurat dari laporan milik staff tersebut.

### 7.3 Admin

- Admin dapat melihat dan mengelola seluruh laporan dari semua staff.
- Admin tidak dapat mengakses menu Manajemen Pengguna (halaman tidak tersedia / `403 Forbidden`).
- Perubahan status laporan tersimpan dan terrefleksi secara real-time.

### 7.4 Super Admin

- Super Admin dapat melakukan CRUD pengguna tanpa terkecuali.
- Akun yang dinonaktifkan tidak dapat login ke sistem.
- Super Admin memiliki semua kemampuan Admin ditambah fitur manajemen pengguna.

---

## 8. Estimasi Timeline Pengembangan

| No | Fase / Milestone | Estimasi Durasi | Deliverable Utama |
|:---:|---|---|---|
| 1 | Desain UI/UX & Wireframe | 2 minggu | Prototype Figma semua halaman |
| 2 | Setup Backend & Database | 1 minggu | Skema DB, API Auth, Role Guard |
| 3 | Pengembangan Portal Staff | 2 minggu | Login Staff, Dashboard, Form Laporan, Riwayat |
| 4 | Pengembangan Portal Admin | 2 minggu | Login Admin, Dashboard, Manajemen Laporan |
| 5 | Pengembangan Portal Super Admin | 2 minggu | Semua fitur Admin + Manajemen Pengguna |
| 6 | Integrasi, Testing & QA | 2 minggu | Bug fixes, UAT, laporan pengujian |
| 7 | Deployment & Go-Live | 1 minggu | Sistem live di server produksi |
| **Total** | | **~12 Minggu (3 Bulan)** | |

---

## 9. Risiko dan Mitigasi

| Risiko | Level | Strategi Mitigasi |
|---|:---:|---|
| Kebocoran data akibat akses lintas peran | 🔴 Tinggi | Implementasi route guard ketat + middleware validasi peran di setiap endpoint API |
| Performa lambat saat data laporan banyak | 🟡 Sedang | Implementasi pagination, lazy loading, dan indexing database |
| Kesalahan pengiriman laporan (duplikasi) | 🟡 Sedang | Debounce pada tombol submit + unique constraint pada nomor laporan |
| File foto berukuran besar memenuhi storage | 🟡 Sedang | Kompresi otomatis foto sebelum disimpan + kebijakan retensi file lama |
| Pengguna lupa password akun | 🟢 Rendah | Fitur self-service reset password via email |

---

## 10. Lampiran

### 10.1 Riwayat Revisi Dokumen

| Versi | Tanggal | Penulis | Catatan Perubahan |
|---|---|---|---|
| 1.0.0 | April 2026 | Tim Produk | Dokumen awal (initial release) |

### 10.2 Persetujuan Dokumen

| Nama | Jabatan | Tanda Tangan | Tanggal |
|---|---|---|---|
| | Product Owner | | |
| | Tech Lead | | |
| | UI/UX Designer | | |

---

*Dokumen ini bersifat confidential dan hanya untuk keperluan internal pengembangan Sistem Informasi Rumah Sakit.*
