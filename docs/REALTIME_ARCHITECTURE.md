# Real-Time Architecture

## Current State: Optimised Polling

The platform uses client-driven HTTP polling to approximate real-time
behaviour. This is the correct choice while Cloudflare Durable Objects are
unavailable, because it requires no infrastructure changes, works behind any
CDN, and degrades gracefully when the API is slow or offline.

### Polling registry — `RealtimePoller`

`src/services/realtimePoller.ts` is a singleton that owns every polling loop
in the app. Features register a loop with a stable string ID; the poller fires
an immediate fetch and then repeats at the configured interval. Registering the
same ID twice cancels the previous loop first, making it safe to call from
inside React effects.

```
realtimePoller.start('notifications:summary', {
  type: 'notifications',
  endpoint: '/api/v1/notifications/summary',
  interval: 30_000,
  onData: (data) => updateUnreadCount(data.unreadTotal),
  enabled: isAuthenticated,
});
```

The singleton holds a reference to the current bearer token (`setToken()`),
so all pollers stay auth-aware without each component needing to track the
token itself.

### Active polling loops and intervals

| ID / Feature              | Endpoint                          | Interval | Owner                         |
|---------------------------|-----------------------------------|----------|-------------------------------|
| notifications             | `GET /notifications`              | 30 s     | `useRealtimeNotifications`    |
| notifications/summary     | `GET /notifications/summary`      | 30 s     | `useRealtimeNotifications`    |
| presence heartbeat        | `POST /presence/heartbeat`        | 30 s     | `usePresenceStore` (existing) |
| chat messages (per-room)  | `GET /chat/rooms/:id/messages`    | 3–5 s*   | `ChatRoom` page (existing)    |
| DM messages (per-convo)   | `GET /dm/conversations/:id/msgs`  | 3–5 s*   | `Conversation` page (existing)|
| typing indicators         | `GET /chat/rooms/:id/typing`      | 2 s*     | `ChatRoom` page (existing)    |

*Short-interval loops (< 5 s) are acceptable only while a specific room or
conversation is open. They should be stopped the moment the user navigates
away — use the `realtimePoller.stop(id)` cleanup in the effect return.

### Page Visibility API integration

`useRealtimeNotifications` listens for the browser's `visibilitychange` event.
When the tab goes into the background all notification polling pauses; it
resumes immediately on tab focus. This eliminates wasted API calls when the
user is not actively looking at the app — a measurable improvement for mobile
users on metered data.

Chat and DM loops should apply the same pattern. The recommended pattern is:

```typescript
useEffect(() => {
  if (!roomId) return;

  const start = () => realtimePoller.start('chat:' + roomId, config);
  const stop  = () => realtimePoller.stop('chat:' + roomId);

  document.addEventListener('visibilitychange', () =>
    document.hidden ? stop() : start()
  );
  if (!document.hidden) start();

  return () => {
    stop();
    document.removeEventListener('visibilitychange', ...);
  };
}, [roomId]);
```

---

## What Durable Objects Would Enable

Cloudflare Durable Objects (DOs) give each logical room or user a single
co-located JS instance with its own persistent state and a hibernating
WebSocket handler. This enables genuine server-push rather than client-pull.

### Feature comparison

| Capability              | Polling (now)              | Durable Objects (future)      |
|-------------------------|----------------------------|-------------------------------|
| Message delivery        | Up to interval delay       | < 100 ms end-to-end           |
| Typing indicators       | 2 s lag minimum            | Instant (event-driven)        |
| Online presence         | 30 s stale window          | Connect/disconnect events     |
| Server load             | O(users × interval)        | O(active connections)         |
| Battery / data usage    | Constant drain             | Event-driven, near-zero idle  |
| Offline queue           | Client retries on reconnect| DO persists and drains queue  |
| Read receipts           | Polling round-trip         | Push to all room members      |

### Architecture with Durable Objects

```
Browser ──WS──► ChatRoom DO (per room)
                  ├── hibernated WebSocket connections (all room members)
                  ├── persisted message log (DO storage)
                  └── broadcasts to all sockets on new message

Browser ──WS──► UserPresence DO (per user)
                  ├── tracks online/away/offline state
                  └── notifies subscribers (friends, group members)
```

The Worker (stateless edge function) handles auth and routes the upgrade
request to the correct DO:

```typescript
// workers/src/routes/chat.ts
export async function handleChatUpgrade(req: Request, env: Env) {
  const roomId = new URL(req.url).searchParams.get('roomId');
  const doId   = env.CHAT_ROOM.idFromName(roomId!);
  const stub   = env.CHAT_ROOM.get(doId);
  return stub.fetch(req); // DO handles the WS upgrade + hibernation
}
```

---

## Migration Path: Polling → Durable Objects

The code is already structured to make this migration low-risk.

### Step 1 — Add DO bindings to `wrangler.toml`

```toml
[[durable_objects.bindings]]
name        = "CHAT_ROOM"
class_name  = "ChatRoomDO"

[[durable_objects.bindings]]
name        = "USER_PRESENCE"
class_name  = "UserPresenceDO"
```

### Step 2 — Implement the DO classes in the Worker

Create `workers/src/durableObjects/ChatRoomDO.ts` and
`workers/src/durableObjects/UserPresenceDO.ts`. Use the WebSocket Hibernation
API so the DO sleeps when no connections are active (zero cost at idle).

### Step 3 — Add WebSocket client to the frontend

Create `src/services/realtimeSocket.ts` — a thin wrapper around `WebSocket`
with exponential-backoff reconnect and message dispatching to Zustand stores.

```typescript
export function connectChatRoom(roomId: string, token: string) {
  const ws = new WebSocket(
    `wss://ohcs-elibrary-api.ghwmelite.workers.dev/ws/chat/${roomId}?token=${token}`
  );
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    useChatStore.getState().addMessage(msg);
  };
  return ws;
}
```

### Step 4 — Replace polling in chat components

In `ChatRoom.tsx` and `Conversation.tsx`:

- Remove the `realtimePoller.start('chat:…')` call.
- Open a WebSocket connection on mount via `connectChatRoom()`.
- Keep polling as a fallback: detect if WebSocket fails to connect within 3 s
  and fall back to `realtimePoller` automatically.

### Step 5 — Retire notification polling last

Notifications are the lowest-urgency real-time feature (30 s delay is
acceptable). Migrate them last, after chat and presence are proven stable.
The `useRealtimeNotifications` hook can be updated in a single line — change
`setInterval` to a WebSocket subscription — without touching any consumer.

---

## Feature Priority for Real-Time Upgrade

Ordered by user-visible impact:

1. **Chat room messages** — visible lag disrupts conversation flow most severely.
2. **DM messages** — same as chat; users expect instant delivery in 1-on-1 chat.
3. **Typing indicators** — 2 s polling lag makes indicators feel broken.
4. **Online presence** — 30 s stale window means presence badges are often wrong.
5. **Notifications** — 30 s polling is acceptable; users tolerate slight delay.

---

## Operational Notes

- All polling loops are silent on failure — transient API errors never surface
  a console error or UI toast. This is intentional for background tasks.
- `realtimePoller.activeIds` can be inspected in the browser console during
  development to audit which loops are running.
- The presence heartbeat (`usePresenceStore.startHeartbeatPolling`) is separate
  from `realtimePoller` because it sends a `POST`, not a `GET`. It follows the
  same visibility-pause pattern and should be migrated to DO connect/disconnect
  events in Step 4 above.
