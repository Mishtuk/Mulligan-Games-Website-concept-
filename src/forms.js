// Public forms (event sign-ups and the like): one guard for all of them. Foreign origins are refused, a filled honeypot looks like
// success but stores nothing, and a plain browser form post (no JS) gets a 303 back to its page, chosen from an allow-list.
import { clientIp } from './auth.js';

export const HONEYPOT = 'website'; // hidden field real people leave empty

/** handle(fields, ip) => { status, body } runs only for clean posts and does its own validation and rate limit (allow() in auth.js).
 *  pages = { __proto__: null, '/events': '/events/' }: the _page values a no-JS form may return to; the first is the default.
 *  onSpam(ip) is called instead of handle when the honeypot is filled (log it with audit.event). */
export async function publicForm(req, { origins, handle, pages, anchor = '', onSpam = () => {} }) {
  const origin = req.headers.get('origin');
  if (origin && !origins.includes(origin)) return Response.json({ error: 'origin' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const isJson = (req.headers.get('content-type') ?? '').includes('application/json');
  const raw = isJson ? await req.json().catch(() => null) : Object.fromEntries([...(await req.formData().catch(() => new FormData())).entries()].map(([k, v]) => [k, String(v)]));
  const fields = raw && typeof raw === 'object' ? raw : {};
  const ip = clientIp(req);
  const r = String(fields[HONEYPOT] ?? '').trim() ? (onSpam(ip), { status: 200, body: { ok: true } }) : await handle(fields, ip);
  if (isJson || (req.headers.get('accept') ?? '').includes('application/json')) return Response.json(r.body, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  const page = pages[fields._page] ?? Object.values(pages)[0];
  return new Response(null, { status: 303, headers: { Location: r.status === 200 ? `${page}?sent=1${anchor}` : `${page}?error=${r.body.error}${anchor}`, 'Cache-Control': 'no-store' } });
}
