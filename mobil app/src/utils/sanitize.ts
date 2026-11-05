// Utility for sanitizing user-entered text to prevent injection or malformed data

export function sanitizeText(input: string, maxLength: number = 500): string {
  if (!input) return '';

  return (
    input
      // Strip HTML tags
      .replace(/<[^>]*>?/gm, '')
      // Strip potentially harmful control characters
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
      // Normalize excessive whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Enforce max length
      .slice(0, maxLength)
  );
}

export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Keep only +, numbers, spaces and hyphens
  return phone.replace(/[^\d+\s-]/g, '').trim().slice(0, 20);
}

