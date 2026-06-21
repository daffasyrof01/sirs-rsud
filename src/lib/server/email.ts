const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getBrevoApiKey() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("BREVO_API_KEY belum dikonfigurasi.");
  }
  return apiKey;
}

function getBrevoSenderEmail() {
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL belum dikonfigurasi.");
  }
  return senderEmail;
}

function getBrevoSenderName() {
  return process.env.BREVO_SENDER_NAME?.trim() || "SIPEDRAS";
}

function getEmailSubject(type: "sign-in" | "email-verification" | "forget-password" | "change-email") {
  switch (type) {
    case "sign-in":
      return "Kode login SIPEDRAS";
    case "email-verification":
      return "Kode verifikasi email SIPEDRAS";
    case "forget-password":
      return "Kode reset password SIPEDRAS";
    case "change-email":
      return "Kode perubahan email SIPEDRAS";
  }
}

function getEmailIntro(type: "sign-in" | "email-verification" | "forget-password" | "change-email") {
  switch (type) {
    case "sign-in":
      return "Gunakan kode berikut untuk masuk ke akun SIPEDRAS Anda.";
    case "email-verification":
      return "Gunakan kode berikut untuk memverifikasi alamat email akun SIPEDRAS Anda.";
    case "forget-password":
      return "Gunakan kode berikut untuk melanjutkan reset password akun SIPEDRAS Anda.";
    case "change-email":
      return "Gunakan kode berikut untuk mengonfirmasi perubahan alamat email akun SIPEDRAS Anda.";
  }
}

export async function sendOtpEmail({
  to,
  otp,
  type,
}: {
  to: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
}) {
  const subject = getEmailSubject(type);
  const intro = getEmailIntro(type);
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">${subject}</h2>
      <p style="margin: 0 0 16px;">${intro}</p>
      <div style="display:inline-block;padding:16px 20px;border-radius:12px;background:#0f172a;color:#fff;font-size:28px;font-weight:700;letter-spacing:4px;">
        ${otp}
      </div>
      <p style="margin: 16px 0 0;">Kode ini hanya berlaku sementara. Jika Anda tidak meminta kode ini, abaikan email ini.</p>
    </div>
  `;

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": getBrevoApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: getBrevoSenderName(),
        email: getBrevoSenderEmail(),
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent,
      textContent: `${intro}\n\nKode OTP: ${otp}\n\nKode ini hanya berlaku sementara. Jika Anda tidak meminta kode ini, abaikan email ini.`,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
    throw new Error(payload?.message ?? payload?.code ?? "Gagal mengirim email OTP.");
  }
}
