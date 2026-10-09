"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { ENDPOINTS } from "@/lib/config";
import { useAppSelector } from "@/redux/hooks";
import type {
  Customer,
  Thread,
  ThreadHandlerUser,
} from "@/redux/api-slice/thread-slice";

export type SupportDashboardMessageEvent = {
  id: string;
  message: string;
  role: string;
  thread_id: string;
  customer?: Customer | null;
  is_active: boolean;
  created_at: string;
  source?: Thread["source"];
  chat_handler?: Thread["chat_handler"];
  chat_handler_user?: ThreadHandlerUser | null;
  ai_responding?: boolean;
  need_escalation?: boolean;
  escalation_time?: string | null;
};

export type SupportDashboardThreadUpdateEvent = {
  thread_id: string;
  source?: Thread["source"];
  chat_handler?: Thread["chat_handler"];
  chat_handler_user?: ThreadHandlerUser | null;
  ai_responding?: boolean;
  need_escalation?: boolean;
  escalation_time?: string | null;
};

export type SupportDashboardEvent =
  | {
      success: true;
      action_type: "message";
      data: SupportDashboardMessageEvent;
    }
  | {
      success: true;
      action_type: "thread_updated";
      data: SupportDashboardThreadUpdateEvent;
    }
  | {
      success: true;
      action_type: "thread_closed";
      data: { thread_id: string };
    };

type DashboardSocketPayload =
  | SupportDashboardEvent
  | { success: boolean; action_type: "connection"; data?: unknown };

type DashboardListener = (event: SupportDashboardEvent) => void;

const dashboardListeners = new Set<DashboardListener>();

let dashboardSocket: WebSocket | null = null;
let dashboardSocketKey: string | null = null;

function closeDashboardSocket() {
  dashboardSocket?.close();
  dashboardSocket = null;
  dashboardSocketKey = null;
}

function isDashboardEvent(
  data: DashboardSocketPayload,
): data is SupportDashboardEvent {
  return (
    data.success === true &&
    ["message", "thread_updated", "thread_closed"].includes(data.action_type)
  );
}

function notifyDashboardListeners(event: SupportDashboardEvent) {
  dashboardListeners.forEach((listener) => listener(event));
}

function ensureDashboardSocket(storeCode: string, token: string) {
  const socketKey = `${storeCode}:${token}`;
  const socketReady =
    dashboardSocket?.readyState === WebSocket.OPEN ||
    dashboardSocket?.readyState === WebSocket.CONNECTING;

  if (dashboardSocketKey === socketKey && socketReady) {
    return;
  }

  closeDashboardSocket();

  const socket = new WebSocket(ENDPOINTS.dashboardSocket(storeCode, token));
  dashboardSocket = socket;
  dashboardSocketKey = socketKey;

  socket.onmessage = (event) => {
    let data: DashboardSocketPayload;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse dashboard socket message", error);
      return;
    }

    if (isDashboardEvent(data)) {
      notifyDashboardListeners(data);
    }
  };

  socket.onclose = () => {
    if (dashboardSocket === socket) {
      dashboardSocket = null;
      dashboardSocketKey = null;
    }
  };

  socket.onerror = () => {};
}

export function useSupportDashboardEvents(onEvent: DashboardListener) {
  const { data: session } = useSession();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const latestOnEvent = useRef(onEvent);

  useEffect(() => {
    latestOnEvent.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const token = session?.user?.access_token;
    if (!token || !storeCode) {
      return;
    }

    const listener: DashboardListener = (event) => {
      latestOnEvent.current(event);
    };

    dashboardListeners.add(listener);
    ensureDashboardSocket(storeCode, token);

    return () => {
      dashboardListeners.delete(listener);

      if (dashboardListeners.size === 0) {
        closeDashboardSocket();
      }
    };
  }, [session?.user?.access_token, storeCode]);
}
