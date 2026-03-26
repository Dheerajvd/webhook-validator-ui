"use client";

type Props =
  | {
      mode: "socket";
      connected: boolean;
    }
  | {
      mode: "http-only";
    };

export function ConnectionPill(props: Props) {
  if (props.mode === "http-only") {
    return (
      <span
        className="connection-pill connection-pill--http"
        title="Socket.IO disabled — use Refresh to load latest from GET /webhook"
      >
        <span className="connection-pill__dot" aria-hidden />
        HTTP only
      </span>
    );
  }

  const { connected } = props;
  return (
    <span
      className={`connection-pill ${connected ? "connection-pill--on" : "connection-pill--off"}`}
      title={connected ? "Socket.IO connected" : "Socket.IO disconnected"}
    >
      <span className="connection-pill__dot" aria-hidden />
      {connected ? "Live" : "Offline"}
    </span>
  );
}
