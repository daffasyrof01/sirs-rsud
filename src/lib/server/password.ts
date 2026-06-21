const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function generateTemporaryPassword(length = 14) {
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join("");
}

export function assertPasswordStrength(password: string) {
  const normalized = password.trim();

  if (normalized.length < 8) {
    throw new Error("Password minimal 8 karakter.");
  }

  return normalized;
}
