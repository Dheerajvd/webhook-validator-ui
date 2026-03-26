"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { WebhookRecord } from "@/lib/types";
import { getApiBaseUrl } from "@/lib/public-config";

/**
 * Subscribes to `webhook` events when `enabled` is true.
 * When disabled, does not connect; reports disconnected via `onConnectionChange`.
 */
export function useWebhookSocket(
  enabled: boolean,
  onRecord: (record: WebhookRecord) => void,
  onConnectionChange?: (connected: boolean) => void
) {
  const onRecordRef = useRef(onRecord);
  const onConnectionChangeRef = useRef(onConnectionChange);
  onRecordRef.current = onRecord;
  onConnectionChangeRef.current = onConnectionChange;

  useEffect(() => {
    if (!enabled) {
      onConnectionChangeRef.current?.(false);
      return;
    }

    const base = getApiBaseUrl();
    const socket: Socket = base
      ? io(base, {
          transports: ["websocket", "polling"],
          path: "/socket.io",
        })
      : io({
          transports: ["websocket", "polling"],
          path: "/socket.io",
        });

    socket.on("connect", () => onConnectionChangeRef.current?.(true));
    socket.on("disconnect", () => onConnectionChangeRef.current?.(false));
    socket.on("webhook", (record: WebhookRecord) => {
      onRecordRef.current(record);
    });

    return () => {
      socket.disconnect();
      onConnectionChangeRef.current?.(false);
    };
  }, [enabled]);
}
