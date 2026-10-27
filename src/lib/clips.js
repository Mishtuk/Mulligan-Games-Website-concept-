// "Clips from the shop" (round 6, D47): the store's own TikTok / Instagram videos, from src/content/clips.json. Cards are plain outbound links; only a
// TikTok card can open the official player, in a dialog, after a click (public/js/clips.js repeats the id pattern). Nothing here fetches anything.
export const HOSTS = { tiktok: 'www.tiktok.com', instagram: 'www.instagram.com' };
export const NAMES = { tiktok: 'TikTok', instagram: 'Instagram' };
export const TIKTOK_ID = /^\d{15,21}$/;
const IG_ID = /^[A-Za-z0-9_-]{5,20}$/;

/** A clip is shown only when its platform is known, its id has the platform's shape, its link is https on the platform's own host and its poster is ours. */
export function validClip(c) {
  if (!c || typeof c !== 'object' || !Object.hasOwn(HOSTS, c.platform)) return false;
  if (typeof c.id !== 'string' || typeof c.url !== 'string' || typeof c.poster !== 'string' || typeof c.caption !== 'string') return false;
  if (!(c.platform === 'tiktok' ? TIKTOK_ID : IG_ID).test(c.id)) return false;
  let u;
  try { u = new URL(c.url); } catch { return false; }
  return u.protocol === 'https:' && u.hostname === HOSTS[c.platform] && /^(media|img)\/social\/[\w.-]+$/.test(c.poster);
}
export const clipPos = (c) => (/^\d{1,3}% \d{1,3}%$/.test(c.pos || '') ? c.pos : '50% 50%');
