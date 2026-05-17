/**
 * Mirror of backend/app/services/avatar_service.py so the frontend
 * always renders an avatar even before /auth/me has refreshed.
 *
 * Same seed → same avatar across frontend + backend.
 */

const STYLES = [
  "notionists",
  "notionists-neutral",
  "glass",
  "bottts-neutral",
  "shapes",
  "rings",
  "lorelei",
  "personas",
];

const PALETTES = [
  "0a0c10,5eead4,a78bfa,1e293b",
  "020617,38bdf8,8b5cf6,0f172a",
  "020617,fcd34d,fb923c,0f172a",
  "0a0c10,fda4af,a78bfa,1e293b",
  "020617,6ee7b7,38bdf8,0f172a",
  "0a0c10,d6e4ee,7dd3fc,1e293b",
  "020617,c4b5fd,a78bfa,0f172a",
  "0a0c10,f0abfc,7dd3fc,1e293b",
];

function digest(seed: string): number {
  let s = 0;
  const k = seed.toLowerCase();
  for (let i = 0; i < k.length; i++) s += k.charCodeAt(i);
  return s;
}

/**
 * Build a deterministic avatar URL for any seed (typically email).
 */
export function generateAvatarUrl(seed: string): string {
  const token = (seed ?? "").trim().toLowerCase() || "vypexrock-member";
  const d = digest(token);
  const style = STYLES[d % STYLES.length];
  const palette = PALETTES[d % PALETTES.length];
  return (
    `https://api.dicebear.com/7.x/${style}/svg` +
    `?seed=${encodeURIComponent(token)}` +
    `&backgroundColor=${palette}` +
    `&backgroundType=gradientLinear` +
    `&radius=50`
  );
}

/**
 * Resolve the best avatar to render for a user object.
 * Always returns a non-empty URL.
 */
export function resolveUserAvatar(user: {
  avatar_url?: string | null;
  email?: string | null;
  full_name?: string | null;
} | null | undefined): string {
  const stored = user?.avatar_url?.trim();
  if (stored) return stored;
  const seed = user?.email || user?.full_name || "vypexrock-member";
  return generateAvatarUrl(seed);
}
