import { WebhookFeed } from "@/components/webhook-feed";
import { isSocketsEnabled } from "@/lib/public-config";

export default function HomePage() {
  const socketsOn = isSocketsEnabled();

  return (
    <>
      <h1 className="page-title">Live webhooks</h1>
      <p className="page-lede">
        This app calls your existing backend (see <code>specs.md</code>) via{" "}
        <code>NEXT_PUBLIC_BACKEND_URL</code>. Initial data loads with{" "}
        <code>GET /webhook</code>
        {socketsOn ? (
          <>
            ; new captures can stream over Socket.IO when your server exposes it
            (not available on typical serverless hosts).
          </>
        ) : (
          <>
            . Socket.IO is turned off — use <strong>Refresh (GET /webhook)</strong>{" "}
            for updates.
          </>
        )}
      </p>
      <WebhookFeed />
    </>
  );
}
