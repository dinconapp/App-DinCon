export const PIX_EXPIRATION_SECONDS: number;
export function digitsOnly(value: string): string;
export function parseExpirationMs(value?: string | null): number | null;
export function getRemainingSeconds(expiration: string | number, now?: number): number;
export function formatCountdown(totalSeconds: number): string;
export function isActivePixStatus(status?: string | null): boolean;
export function isTerminalPixStatus(status?: string | null): boolean;
