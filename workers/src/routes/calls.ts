import { Hono } from 'hono';
import type { Env } from '../index';
import { authMiddleware } from '../middleware/auth';

/**
 * WebRTC Signaling Server Routes
 *
 * Uses Cloudflare KV (CACHE binding) as a lightweight signaling relay.
 * All signaling data is stored with short TTLs (60-120s) since it is
 * ephemeral and only needed during call setup / active call.
 *
 * Flow:
 *   1. Caller POST /calls/initiate  -> creates call, stores metadata
 *   2. Callee GET  /calls/incoming   -> polls for incoming calls
 *   3. Callee POST /calls/:id/accept -> marks call as active
 *   4. Caller POST /calls/:id/offer  -> stores SDP offer
 *   5. Callee GET  /calls/:id/offer  -> retrieves SDP offer
 *   6. Callee POST /calls/:id/answer -> stores SDP answer
 *   7. Caller GET  /calls/:id/answer -> retrieves SDP answer
 *   8. Both   POST /calls/:id/ice    -> trickle ICE candidates
 *   9. Both   GET  /calls/:id/ice/:userId -> poll partner's ICE candidates
 *  10. Either POST /calls/:id/end    -> tear down
 */

const callRoutes = new Hono<{ Bindings: Env }>();

// All endpoints require authentication
callRoutes.use('*', authMiddleware);

// ─── Constants ───────────────────────────────────────────────────────────────

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const TTL_CALL_META = 120;   // 2 min – call metadata
const TTL_SIGNALING = 60;    // 1 min – SDP / ICE data
const TTL_INCOMING  = 120;   // 2 min – incoming call list

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface CallMeta {
  callId: string;
  callerId: string;
  calleeId: string;
  callType: 'audio' | 'video';
  status: 'ringing' | 'active' | 'rejected' | 'ended';
  createdAt: string;
}

function kvCallKey(callId: string): string {
  return `call:${callId}`;
}

function kvIncomingKey(userId: string): string {
  return `calls:incoming:${userId}`;
}

function kvOfferKey(callId: string): string {
  return `call:${callId}:offer`;
}

function kvAnswerKey(callId: string): string {
  return `call:${callId}:answer`;
}

function kvIceKey(callId: string, userId: string): string {
  return `call:${callId}:ice:${userId}`;
}

/** Append a callId to the callee's incoming list in KV. */
async function appendIncoming(kv: KVNamespace, calleeId: string, callId: string): Promise<void> {
  const key = kvIncomingKey(calleeId);
  const existing = await kv.get(key);
  const list: string[] = existing ? JSON.parse(existing) : [];
  if (!list.includes(callId)) {
    list.push(callId);
  }
  await kv.put(key, JSON.stringify(list), { expirationTtl: TTL_INCOMING });
}

/** Remove a callId from the callee's incoming list. */
async function removeIncoming(kv: KVNamespace, calleeId: string, callId: string): Promise<void> {
  const key = kvIncomingKey(calleeId);
  const existing = await kv.get(key);
  if (!existing) return;
  const list: string[] = JSON.parse(existing);
  const filtered = list.filter((id) => id !== callId);
  if (filtered.length === 0) {
    await kv.delete(key);
  } else {
    await kv.put(key, JSON.stringify(filtered), { expirationTtl: TTL_INCOMING });
  }
}

/** Clean up all KV entries related to a call. */
async function cleanupCall(kv: KVNamespace, meta: CallMeta): Promise<void> {
  await Promise.allSettled([
    kv.delete(kvCallKey(meta.callId)),
    kv.delete(kvOfferKey(meta.callId)),
    kv.delete(kvAnswerKey(meta.callId)),
    kv.delete(kvIceKey(meta.callId, meta.callerId)),
    kv.delete(kvIceKey(meta.callId, meta.calleeId)),
    removeIncoming(kv, meta.calleeId, meta.callId),
  ]);
}

// ─── POST /calls/initiate ────────────────────────────────────────────────────

callRoutes.post('/initiate', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;

  const body = await c.req.json<{ targetUserId: string; callType: 'audio' | 'video' }>().catch(() => null);
  if (!body?.targetUserId || !body?.callType) {
    return c.json({ error: 'Missing targetUserId or callType' }, 400);
  }

  if (!['audio', 'video'].includes(body.callType)) {
    return c.json({ error: 'callType must be "audio" or "video"' }, 400);
  }

  if (body.targetUserId === user.id) {
    return c.json({ error: 'Cannot call yourself' }, 400);
  }

  // Verify target user exists
  const target = await c.env.DB.prepare(
    'SELECT id, displayName, avatar FROM users WHERE id = ? AND isActive = 1',
  ).bind(body.targetUserId).first();

  if (!target) {
    return c.json({ error: 'Target user not found' }, 404);
  }

  const callId = crypto.randomUUID();
  const now = new Date().toISOString();

  const meta: CallMeta = {
    callId,
    callerId: user.id,
    calleeId: body.targetUserId,
    callType: body.callType,
    status: 'ringing',
    createdAt: now,
  };

  // Store call metadata and add to callee's incoming list
  await Promise.all([
    kv.put(kvCallKey(callId), JSON.stringify(meta), { expirationTtl: TTL_CALL_META }),
    appendIncoming(kv, body.targetUserId, callId),
  ]);

  return c.json({ callId, iceServers: ICE_SERVERS }, 201);
});

// ─── GET /calls/incoming ─────────────────────────────────────────────────────

callRoutes.get('/incoming', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;

  const raw = await kv.get(kvIncomingKey(user.id));
  const callIds: string[] = raw ? JSON.parse(raw) : [];

  if (callIds.length === 0) {
    return c.json({ calls: [] });
  }

  // Fetch metadata for each call and enrich with caller info
  const calls: Array<CallMeta & { callerName?: string; callerAvatar?: string | null }> = [];

  for (const callId of callIds) {
    const metaRaw = await kv.get(kvCallKey(callId));
    if (!metaRaw) continue;

    const meta: CallMeta = JSON.parse(metaRaw);
    if (meta.status !== 'ringing') continue;

    // Fetch caller info
    const caller = await c.env.DB.prepare(
      'SELECT displayName, avatar FROM users WHERE id = ?',
    ).bind(meta.callerId).first<{ displayName: string; avatar: string | null }>();

    calls.push({
      ...meta,
      callerName: caller?.displayName ?? undefined,
      callerAvatar: caller?.avatar ?? null,
    });
  }

  return c.json({ calls });
});

// ─── POST /calls/:callId/offer ───────────────────────────────────────────────

callRoutes.post('/:callId/offer', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  const body = await c.req.json<{ sdp: string }>().catch(() => null);
  if (!body?.sdp) {
    return c.json({ error: 'Missing sdp' }, 400);
  }

  // Verify call exists and user is the caller
  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.callerId !== user.id) {
    return c.json({ error: 'Only the caller can set the offer' }, 403);
  }

  await kv.put(kvOfferKey(callId), body.sdp, { expirationTtl: TTL_SIGNALING });
  return c.json({ success: true });
});

// ─── GET /calls/:callId/offer ────────────────────────────────────────────────

callRoutes.get('/:callId/offer', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  // Verify call exists and user is a participant
  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.callerId !== user.id && meta.calleeId !== user.id) {
    return c.json({ error: 'Not a participant in this call' }, 403);
  }

  const sdp = await kv.get(kvOfferKey(callId));
  if (!sdp) {
    return c.json({ offer: null });
  }

  return c.json({ offer: sdp });
});

// ─── POST /calls/:callId/answer ──────────────────────────────────────────────

callRoutes.post('/:callId/answer', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  const body = await c.req.json<{ sdp: string }>().catch(() => null);
  if (!body?.sdp) {
    return c.json({ error: 'Missing sdp' }, 400);
  }

  // Verify call exists and user is the callee
  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.calleeId !== user.id) {
    return c.json({ error: 'Only the callee can set the answer' }, 403);
  }

  await kv.put(kvAnswerKey(callId), body.sdp, { expirationTtl: TTL_SIGNALING });
  return c.json({ success: true });
});

// ─── GET /calls/:callId/answer ───────────────────────────────────────────────

callRoutes.get('/:callId/answer', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  // Verify call exists and user is a participant
  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.callerId !== user.id && meta.calleeId !== user.id) {
    return c.json({ error: 'Not a participant in this call' }, 403);
  }

  const sdp = await kv.get(kvAnswerKey(callId));
  if (!sdp) {
    return c.json({ answer: null });
  }

  return c.json({ answer: sdp });
});

// ─── POST /calls/:callId/ice ─────────────────────────────────────────────────

callRoutes.post('/:callId/ice', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  const body = await c.req.json<{
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
  }>().catch(() => null);

  if (!body?.candidate || body.sdpMid === undefined || body.sdpMLineIndex === undefined) {
    return c.json({ error: 'Missing candidate, sdpMid, or sdpMLineIndex' }, 400);
  }

  // Verify call exists and user is a participant
  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.callerId !== user.id && meta.calleeId !== user.id) {
    return c.json({ error: 'Not a participant in this call' }, 403);
  }

  // Append to the user's ICE candidate list
  const iceKey = kvIceKey(callId, user.id);
  const existing = await kv.get(iceKey);
  const candidates: Array<{ candidate: string; sdpMid: string; sdpMLineIndex: number }> =
    existing ? JSON.parse(existing) : [];

  candidates.push({
    candidate: body.candidate,
    sdpMid: body.sdpMid,
    sdpMLineIndex: body.sdpMLineIndex,
  });

  await kv.put(iceKey, JSON.stringify(candidates), { expirationTtl: TTL_SIGNALING });
  return c.json({ success: true });
});

// ─── GET /calls/:callId/ice/:userId ──────────────────────────────────────────

callRoutes.get('/:callId/ice/:userId', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId, userId } = c.req.param();

  // Verify call exists and requester is a participant
  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.callerId !== user.id && meta.calleeId !== user.id) {
    return c.json({ error: 'Not a participant in this call' }, 403);
  }

  // Only allow reading the other party's ICE candidates
  if (userId === user.id) {
    return c.json({ error: 'Cannot read your own ICE candidates' }, 400);
  }

  const raw = await kv.get(kvIceKey(callId, userId));
  const candidates = raw ? JSON.parse(raw) : [];

  return c.json({ candidates });
});

// ─── POST /calls/:callId/accept ──────────────────────────────────────────────

callRoutes.post('/:callId/accept', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.calleeId !== user.id) {
    return c.json({ error: 'Only the callee can accept' }, 403);
  }

  if (meta.status !== 'ringing') {
    return c.json({ error: `Cannot accept a call with status "${meta.status}"` }, 409);
  }

  meta.status = 'active';
  await kv.put(kvCallKey(callId), JSON.stringify(meta), { expirationTtl: TTL_CALL_META });

  // Remove from incoming list
  await removeIncoming(kv, user.id, callId);

  return c.json({ success: true, iceServers: ICE_SERVERS });
});

// ─── POST /calls/:callId/reject ──────────────────────────────────────────────

callRoutes.post('/:callId/reject', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.calleeId !== user.id) {
    return c.json({ error: 'Only the callee can reject' }, 403);
  }

  if (meta.status !== 'ringing') {
    return c.json({ error: `Cannot reject a call with status "${meta.status}"` }, 409);
  }

  meta.status = 'rejected';
  await kv.put(kvCallKey(callId), JSON.stringify(meta), { expirationTtl: 10 }); // short TTL for rejection notice

  // Clean up
  await cleanupCall(kv, { ...meta, status: 'rejected' });

  return c.json({ success: true });
});

// ─── POST /calls/:callId/end ─────────────────────────────────────────────────

callRoutes.post('/:callId/end', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.callerId !== user.id && meta.calleeId !== user.id) {
    return c.json({ error: 'Not a participant in this call' }, 403);
  }

  // Briefly mark as ended so the other party can detect it
  meta.status = 'ended';
  await kv.put(kvCallKey(callId), JSON.stringify(meta), { expirationTtl: 10 });

  // Clean up all signaling data
  await cleanupCall(kv, meta);

  return c.json({ success: true });
});

// ─── GET /calls/:callId ──────────────────────────────────────────────────────

callRoutes.get('/:callId', async (c) => {
  const user = c.get('user');
  const kv = c.env.CACHE;
  const { callId } = c.req.param();

  const metaRaw = await kv.get(kvCallKey(callId));
  if (!metaRaw) {
    return c.json({ error: 'Call not found' }, 404);
  }

  const meta: CallMeta = JSON.parse(metaRaw);
  if (meta.callerId !== user.id && meta.calleeId !== user.id) {
    return c.json({ error: 'Not a participant in this call' }, 403);
  }

  return c.json(meta);
});

export { callRoutes };
