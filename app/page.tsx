import { WebhookFeed } from "@/components/webhook-feed";

export default function HomePage() {
  return (
    <>
      <h1 className="page-title">Live webhooks</h1>
      <WebhookFeed />
    </>
  );
}
