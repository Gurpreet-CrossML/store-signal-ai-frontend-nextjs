"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { ENDPOINTS } from "@/lib/config";
import type {
  SocialComment,
  SocialCommentAiResponse,
  SocialCommentAnalysis,
  SocialDm,
} from "@/redux/api-slice/social-ai-slice";

/** A new DM — the payload adds a flat contact id and the owning account. */
export type SocialDmEvent = SocialDm & {
  social_user_id: number | null;
  account_external_id: string;
};

/** A new comment — the payload adds the post's and account's Graph ids. */
export type SocialCommentEvent = SocialComment & {
  post_external_id: string | null;
  account_external_id: string;
};

/** AI tagging finished for a comment that already arrived. */
export type SocialCommentTaggedEvent = {
  message_id: number;
  post_external_id: string | null;
  account_external_id: string;
  analysis: SocialCommentAnalysis;
};

/** A comment's AI reply landed (or was regenerated on a re-tag). */
export type SocialCommentAiResponseEvent = {
  message_id: number;
  post_external_id: string | null;
  account_external_id: string;
  ai_response: SocialCommentAiResponse;
};

export type SocialSocketEvent =
  | { action_type: "connection" }
  | { action_type: "dm_created"; data: SocialDmEvent }
  | { action_type: "comment_created"; data: SocialCommentEvent }
  | { action_type: "comment_tagged"; data: SocialCommentTaggedEvent }
  | {
      action_type: "comment_ai_response";
      data: SocialCommentAiResponseEvent;
    };

// Backoff between reconnect attempts, capped so a long outage doesn't turn
// into a permanently dead socket.
const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/**
 * "connecting" is the first attempt, "reconnecting" means the stream
 * dropped and is being retried — worth telling the agent about, because
 * the screen is no longer live while it lasts.
 */
export type SocialSocketStatus = "connecting" | "open" | "reconnecting";

type Listener = {
  onEvent: (event: SocialSocketEvent) => void;
  onReconnect: () => void;
  onStatus: (status: SocialSocketStatus) => void;
};

type Connection = {
  socket: WebSocket | null;
  listeners: Set<Listener>;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  attempt: number;
  hasConnectedOnce: boolean;
  released: boolean;
  status: SocialSocketStatus;
};

function setStatus(connection: Connection, status: SocialSocketStatus) {
  if (connection.status === status) return;
  connection.status = status;
  connection.listeners.forEach((listener) => listener.onStatus(status));
}

// One socket per store, shared by every subscriber on the page. A post feed
// renders a comment list per post, and each wants the same stream — opening
// a connection each would be a socket per post.
const connections = new Map<string, Connection>();

function openSocket(url: string) {
  const connection = connections.get(url);
  if (!connection || connection.released) return;

  if (connection.reconnectTimer) {
    clearTimeout(connection.reconnectTimer);
    connection.reconnectTimer = null;
  }

  const socket = new WebSocket(url);
  connection.socket = socket;

  socket.onopen = () => {
    connection.attempt = 0;
    setStatus(connection, "open");
    // Only a *re*-connection means events may have been missed.
    if (connection.hasConnectedOnce) {
      connection.listeners.forEach((listener) => listener.onReconnect());
    }
    connection.hasConnectedOnce = true;
  };

  socket.onmessage = (event) => {
    let parsed: SocialSocketEvent;
    try {
      parsed = JSON.parse(event.data) as SocialSocketEvent;
    } catch {
      // A frame we can't parse is not worth breaking the stream over.
      return;
    }
    connection.listeners.forEach((listener) => listener.onEvent(parsed));
  };

  socket.onclose = () => {
    if (connection.released) return;
    connection.socket = null;
    setStatus(
      connection,
      connection.hasConnectedOnce ? "reconnecting" : "connecting",
    );
    // A rejected handshake (bad or expired token) surfaces here the same as
    // a dropped connection — backing off covers both.
    const delay =
      RECONNECT_DELAYS_MS[
        Math.min(connection.attempt, RECONNECT_DELAYS_MS.length - 1)
      ];
    connection.attempt += 1;
    connection.reconnectTimer = setTimeout(() => openSocket(url), delay);
  };
}

/**
 * Retry every dropped connection right now instead of waiting out its
 * backoff. Sitting on a 30s timer after the laptop wakes or the wifi comes
 * back is the difference between "instant" and "why is this stale".
 */
function retryAllNow() {
  connections.forEach((connection, url) => {
    if (connection.released) return;
    if (connection.socket) return;
    connection.attempt = 0;
    openSocket(url);
  });
}

// Registered once for the module — these fire far less often than the
// per-connection lifecycle, and every connection wants the same response.
if (typeof window !== "undefined") {
  window.addEventListener("online", retryAllNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") retryAllNow();
  });
}

function subscribe(url: string, listener: Listener) {
  let connection = connections.get(url);

  if (!connection) {
    connection = {
      socket: null,
      listeners: new Set(),
      reconnectTimer: null,
      attempt: 0,
      hasConnectedOnce: false,
      released: false,
      status: "connecting",
    };
    connections.set(url, connection);
    connection.listeners.add(listener);
    openSocket(url);
  } else {
    connection.listeners.add(listener);
    // Catch a late subscriber up to where the shared connection already is.
    // Deferred so this never lands as a synchronous setState inside the
    // subscriber's effect.
    const current = connection;
    queueMicrotask(() => {
      if (current.listeners.has(listener)) listener.onStatus(current.status);
    });
  }

  return () => {
    const current = connections.get(url);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size > 0) return;

    current.released = true;
    if (current.reconnectTimer) clearTimeout(current.reconnectTimer);
    current.socket?.close();
    connections.delete(url);
  };
}

/**
 * Subscribes to the store's social event stream
 * (`ws/social/<store_code>/?token=<jwt>`).
 *
 * The socket is read-only by design — every action still goes through the
 * REST API, and its result comes back around as one of these broadcasts.
 * The server keeps no backlog (Redis pub/sub, no replay), so anything that
 * happened while disconnected is lost: `onReconnect` fires after every
 * successful re-connection so the screen can refetch and catch up.
 */
export function useSocialSocket({
  storeCode,
  onEvent,
  onReconnect,
  onStatusChange,
}: {
  storeCode: string | null | undefined;
  onEvent: (event: SocialSocketEvent) => void;
  onReconnect?: () => void;
  /** Called on every transition — never during render, so it may setState. */
  onStatusChange?: (status: SocialSocketStatus) => void;
}) {
  const { data: session } = useSession();
  const token = session?.user?.access_token;

  // Held in refs so a re-rendered handler never tears down the connection.
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectRef.current = onReconnect;
    onStatusChangeRef.current = onStatusChange;
  }, [onEvent, onReconnect, onStatusChange]);

  useEffect(() => {
    if (!storeCode || !token) return;

    return subscribe(ENDPOINTS.socialSocket(storeCode, token), {
      onEvent: (event) => onEventRef.current(event),
      onReconnect: () => onReconnectRef.current?.(),
      onStatus: (status) => onStatusChangeRef.current?.(status),
    });
  }, [storeCode, token]);
}
