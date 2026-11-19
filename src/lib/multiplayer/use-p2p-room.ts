import { useCallback, useEffect, useRef, useState } from "react";
import { P2PRoom, type PeerInfo } from "./p2p";

export interface UseP2PRoomOptions {
  room: string;
  name?: string;
  /** Reuse this id across a refresh so the other phone sees the same player. */
  selfId?: string;
  /** Returning seat: dial immediately and skip SDP from the previous page. */
  redial?: boolean;
  /** Return false on a refresh so unmount does not remove the player from the room. */
  shouldLeave?: () => boolean;
}

export interface P2PRoomHandle {
  selfId: string;
  room: string;
  peers: PeerInfo[];
  joined: boolean;
  /** pending until the first /api/rtc poll settles. */
  signaling: "pending" | "ok" | "down";
  broadcast: (data: unknown) => void;
  send: (data: unknown, peerId?: string) => void;
  onMessage: (
    fn: (from: string, data: unknown, channel: "state" | "reliable") => void,
  ) => () => void;
}

export function useP2PRoom(options: UseP2PRoomOptions): P2PRoomHandle {
  const [selfId] = useState(() => options.selfId ?? `p-${Math.random().toString(36).slice(2, 10)}`);
  const [room] = useState(() => options.room);
  const [name] = useState(() => options.name ?? "Player");
  const [redial] = useState(() => options.redial === true);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [joined, setJoined] = useState(false);
  const [signaling, setSignaling] = useState<"pending" | "ok" | "down">("pending");
  const roomRef = useRef<P2PRoom | null>(null);
  const listeners = useRef(new Set<(from: string, data: unknown, channel: "state" | "reliable") => void>());
  const shouldLeaveRef = useRef(options.shouldLeave);
  shouldLeaveRef.current = options.shouldLeave;

  useEffect(() => {
    const p2p = new P2PRoom({
      room,
      selfId,
      name,
      redial,
      onPeersChanged: setPeers,
      onMessage: (from, data, channel) => {
        for (const fn of listeners.current) fn(from, data, channel);
      },
      onConnected: () => setJoined(true),
      onSignaling: setSignaling,
    });
    roomRef.current = p2p;
    void p2p.join();
    return () => {
      roomRef.current = null;
      const leave = shouldLeaveRef.current ? shouldLeaveRef.current() : true;
      p2p.close({ leave });
    };
  }, [room, selfId, name, redial]);

  const broadcast = useCallback((data: unknown) => roomRef.current?.broadcast(data), []);
  const send = useCallback((data: unknown, peerId?: string) => roomRef.current?.send(data, peerId), []);
  const onMessage = useCallback(
    (fn: (from: string, data: unknown, channel: "state" | "reliable") => void) => {
      listeners.current.add(fn);
      return () => {
        listeners.current.delete(fn);
      };
    },
    [],
  );

  return { selfId, room, peers, joined, signaling, broadcast, send, onMessage };
}
