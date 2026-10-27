import { getCategoryLabel, getPriorityLabel, getStatusLabel } from "@/lib/constants/app";
import { getReportSummary } from "@/lib/services/report-service";
import { formatDate } from "@/lib/utils";
import type { Report, Role } from "@/lib/types";

type ChatRule = {
  keywords: string[];
  answer: string;
  roles?: Role[];
};

const COMMON_RULES: ChatRule[] = [
  {
    keywords: ["buat laporan", "laporan baru", "membuat laporan", "kirim laporan"],
    answer:
      "Untuk membuat laporan, buka menu Buat Laporan, isi judul, kategori, lokasi, prioritas, tanggal kejadian, deskripsi, lalu tambahkan foto bukti bila ada. Setelah yakin, tekan Kirim Laporan dan konfirmasi pengiriman.",
    roles: ["staff"],
  },
  {
    keywords: ["foto", "kamera", "upload", "lampiran", "bukti"],
    answer:
      "Di form Buat Laporan, gunakan Ambil Foto untuk membuka kamera HP atau Pilih dari Galeri untuk memilih file. Maksimal 5 foto, dan setiap foto maksimal 4 MB. Foto bisa dihapus sebelum laporan dikirim.",
  },
  {
    keywords: ["draft", "simpan draft", "hapus draft"],
    answer:
      "Gunakan Simpan Draft jika laporan belum siap dikirim. Draft tersimpan di perangkat yang sedang dipakai. Tombol Bersihkan Draft akan menghapus isi draft dan lampiran dari form.",
    roles: ["staff"],
  },
  {
    keywords: ["riwayat", "status laporan", "laporan saya", "lihat laporan"],
    answer:
      "Buka menu Riwayat Laporan untuk melihat daftar laporan. Anda bisa memakai pencarian dan filter status, kategori, prioritas, atau lokasi untuk menemukan laporan tertentu.",
    roles: ["staff"],
  },
  {
    keywords: ["pending", "diproses", "selesai", "ditolak", "arti status"],
    answer:
      "Pending berarti laporan baru masuk. Diproses berarti laporan sedang ditangani. Selesai berarti pekerjaan sudah ditutup. Ditolak berarti laporan tidak dapat dilanjutkan sesuai pertimbangan pengelola.",
  },
  {
    keywords: ["notifikasi", "pemberitahuan", "notif"],
    answer:
      "Tekan tombol Notifikasi di kanan atas untuk melihat pembaruan. Di aplikasi Android, aktifkan izin notifikasi agar pembaruan laporan bisa muncul dari sistem HP.",
  },
  {
    keywords: ["excel", "export", "ekspor", "laporan excel", "unduh"],
    answer:
      "Buka menu Laporan, lalu tekan Export Excel. File yang diunduh memuat tanggal dan jam kirim laporan, penugasan, serta penyelesaian jika data tersebut sudah tersedia.",
  },
  {
    keywords: ["tema", "dark", "light", "mode gelap", "mode terang"],
    answer:
      "Gunakan tombol tema di kanan atas untuk mengganti mode terang dan gelap. Pilihan tema akan disimpan untuk kunjungan berikutnya.",
  },
  {
    keywords: ["logout", "keluar", "login ulang"],
    answer:
      "Gunakan tombol Keluar di sidebar bagian bawah. Jika tidak menekan Keluar, sesi login akan tetap tersimpan selama masa sesi masih aktif.",
  },
];

const ADMIN_RULES: ChatRule[] = [
  {
    keywords: ["proses laporan", "ubah status", "tandai diproses", "tandai selesai", "selesaikan laporan"],
    answer:
      "Buka menu Laporan Kerusakan, masuk ke detail laporan, lalu gunakan Ubah Status. Setelah menekan Tandai Diproses atau Tandai Selesai, halaman akan menampilkan pesan berhasil dan status terbaru.",
    roles: ["admin", "superadmin"],
  },
  {
    keywords: ["penugasan", "teknisi", "assigned", "assign", "tim"],
    answer:
      "Di detail laporan admin, isi nama petugas atau vendor pada Penugasan Teknisi, tambahkan catatan jika perlu, lalu tekan Simpan Penugasan. Waktu penugasan akan tercatat untuk ekspor laporan berikutnya.",
    roles: ["admin", "superadmin"],
  },
  {
    keywords: ["catatan", "komentar", "tindak lanjut"],
    answer:
      "Riwayat catatan tetap tampil di bagian Catatan Tindak Lanjut pada detail laporan. Jika ingin mencatat kebutuhan teknis, gunakan bagian Spare Part.",
    roles: ["admin", "superadmin"],
  },
  {
    keywords: ["spare part", "sparepart"],
    answer:
      "Di detail laporan, gunakan bagian Spare Part untuk menulis spare part yang dipakai. Informasi tersebut akan ikut tersimpan pada laporan dan bisa muncul di ekspor Excel.",
    roles: ["admin", "superadmin"],
  },
];

const SUPERADMIN_RULES: ChatRule[] = [
  {
    keywords: ["user", "pengguna", "akun", "reset password", "nonaktif", "aktifkan"],
    answer:
      "Buka Manajemen Pengguna untuk membuat akun, mengedit data, mengaktifkan atau menonaktifkan pengguna, reset password, atau menghapus akun yang tidak diperlukan.",
    roles: ["superadmin"],
  },
  {
    keywords: ["hapus laporan", "delete laporan", "hapus permanen"],
    answer:
      "Super Admin dapat membuka detail laporan lalu menekan Hapus Permanen. Gunakan fitur ini dengan hati-hati karena data laporan akan dihapus dari sistem.",
    roles: ["superadmin"],
  },
  {
    keywords: ["audit", "log", "aktivitas"],
    answer:
      "Dashboard Super Admin menampilkan ringkasan aktivitas sistem, termasuk aktivitas login, perubahan laporan, dan tindakan penting pada pengguna.",
    roles: ["superadmin"],
  },
];

const ROLE_FALLBACK: Record<Role, string> = {
  staff:
    "Saya bisa membantu tentang cara buat laporan, upload foto, simpan draft, melihat riwayat laporan, notifikasi, dan export Excel. Coba tulis: cara buat laporan.",
  admin:
    "Saya bisa membantu tentang ubah status laporan, penugasan teknisi, spare part, export Excel, dan notifikasi. Coba tulis: cara ubah status laporan.",
  superadmin:
    "Saya bisa membantu tentang laporan, user management, audit log, hapus laporan, export Excel, dan notifikasi. Coba tulis: cara reset password user.",
};

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function getReportAwareChatbotAnswer({
  question,
  role,
  reports,
}: {
  question: string;
  role: Role;
  reports: Report[];
}) {
  const normalizedQuestion = question.toLowerCase().trim();
  if (!includesAny(normalizedQuestion, ["laporan", "pending", "diproses", "selesai", "darurat", "prioritas", "urgent", "terbaru", "berapa"])) {
    return null;
  }

  const summary = getReportSummary(reports);
  const scope = role === "staff" ? "laporan Anda" : "laporan yang dapat Anda akses";

  if (includesAny(normalizedQuestion, ["berapa", "jumlah", "total", "ringkasan", "rekap"])) {
    return `Ringkasan ${scope}: total ${summary.total}, pending ${summary.pending}, diproses ${summary.inProgress}, selesai ${summary.resolved}, ditolak ${summary.rejected}, dan prioritas tinggi/darurat ${summary.urgent}.`;
  }

  if (includesAny(normalizedQuestion, ["pending", "belum diproses"])) {
    return `Ada ${summary.pending} ${scope} yang masih berstatus Pending.`;
  }

  if (includesAny(normalizedQuestion, ["diproses", "proses"])) {
    return `Ada ${summary.inProgress} ${scope} yang sedang Diproses.`;
  }

  if (includesAny(normalizedQuestion, ["selesai", "sudah selesai"])) {
    return `Ada ${summary.resolved} ${scope} yang sudah Selesai. Bulan ini ada ${summary.resolvedThisMonth} laporan selesai.`;
  }

  if (includesAny(normalizedQuestion, ["darurat", "urgent", "prioritas tinggi", "tinggi"])) {
    const urgentReports = reports.filter((report) => report.priority === "high" || report.priority === "emergency").slice(0, 3);
    if (urgentReports.length === 0) return `Saat ini tidak ada ${scope} dengan prioritas tinggi atau darurat.`;

    return `Ada ${summary.urgent} ${scope} dengan prioritas tinggi/darurat. Teratas: ${urgentReports
      .map((report) => `${report.reportNumber} - ${report.title} (${getPriorityLabel(report.priority)}, ${getStatusLabel(report.status)})`)
      .join("; ")}.`;
  }

  if (includesAny(normalizedQuestion, ["terbaru", "paling baru", "baru masuk"])) {
    const latestReports = reports.slice(0, 3);
    if (latestReports.length === 0) return `Belum ada ${scope}.`;

    return `Laporan terbaru: ${latestReports
      .map((report) => `${report.reportNumber} - ${report.title}, ${getCategoryLabel(report.category)}, ${getStatusLabel(report.status)}, ${formatDate(report.createdAt)}`)
      .join("; ")}.`;
  }

  return null;
}

export function getChatbotAnswer({ question, role }: { question: string; role: Role }) {
  const normalizedQuestion = question.toLowerCase().trim();
  const rules = [...COMMON_RULES, ...ADMIN_RULES, ...SUPERADMIN_RULES];
  const matchedRule = rules.find((rule) => {
    const roleAllowed = !rule.roles || rule.roles.includes(role);
    if (!roleAllowed) return false;

    return rule.keywords.some((keyword) => normalizedQuestion.includes(keyword));
  });

  return matchedRule?.answer ?? ROLE_FALLBACK[role];
}

export function getChatbotSuggestions(role: Role) {
  if (role === "staff") {
    return ["Ringkasan laporan saya", "Laporan pending saya", "Cara buat laporan", "Cara upload foto"];
  }

  if (role === "admin") {
    return ["Ringkasan laporan", "Laporan darurat", "Cara ubah status laporan", "Cara penugasan teknisi"];
  }

  return ["Ringkasan laporan", "Laporan terbaru", "Cara kelola pengguna", "Cara lihat audit log"];
}
