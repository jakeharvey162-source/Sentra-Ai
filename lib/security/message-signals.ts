/** Normalize common invisible separators and explicit authentication-code aliases. */
export function normalizeSecurityText(input: string): string {
  return input.normalize("NFKC")
    .replace(/[\u00AD\u034F\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    .replace(/\b(?:one[ \u2010-\u2015-]time (?:password|passcode|code)|(?:2fa|mfa|authentication|login|password reset) code|two[ \u2010-\u2015-]factor(?: authentication)? code)\b/gi, "verification code");
}

export function requestsCredentials(input: string): boolean {
  return normalizeSecurityText(input).split(/[.!?;\n]+/).some(sentence => {
    const remainder = sentence.replace(/\b(?:never|do not|don't|won't|will never)\s+(?:\w+\s+){0,3}(?:share|send|give|disclose|ask|request)\s+(?:\w+\s+){0,3}(?:password|otp|pin|verification code)(?:\s+(?:or|and)\s+(?:password|otp|pin|verification code))?/gi, "");
    return /\b(password|otp|pin|verification code|login|sign in)\b/i.test(remainder)
      && /\b(send|share|enter|provide|give|confirm|verify|sign in|log ?in)\b/i.test(remainder);
  });
}
