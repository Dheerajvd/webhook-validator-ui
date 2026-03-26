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
        title="Use Refresh to load the latest payloads"
      >
        <span className="connection-pill__dot" aria-hidden />
        Manual refresh
      </span>
    );
  }

  const { connected } = props;
  return (
    <span
      className={`connection-pill ${connected ? "connection-pill--on" : "connection-pill--off"}`}
      title={connected ? "Receiving live updates" : "Live updates unavailable"}
    >
      <span className="connection-pill__dot" aria-hidden />
      {connected ? "Live" : "Offline"}
    </span>
  );
}
