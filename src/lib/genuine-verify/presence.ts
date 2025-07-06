export interface PresenceToken {
  token: string;
  gesture: 'blink' | 'headTilt';
  issuedAt: string;
  expiresAt: string;
  version: number;
}

export function getPresenceToken(
  gesture: 'blink' | 'headTilt',
  ttlMs: number = 300_000
): PresenceToken {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlMs);
  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now();
  return {
    token,
    gesture,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    version: 1,
  };
}

export function isTokenExpired(token: PresenceToken): boolean {
  return Date.now() > new Date(token.expiresAt).getTime();
} 