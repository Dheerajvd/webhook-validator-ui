import type { ApiEnvelope, BackupFileMeta, WebhookRecord } from "./types";
import { apiUrl } from "./public-config";

const jsonHeaders = { Accept: "application/json" };

export async function fetchWebhooks(
  params?: URLSearchParams | Record<string, string>
): Promise<ApiEnvelope<{ records: WebhookRecord[]; count: number }>> {
  const q =
    params instanceof URLSearchParams
      ? params.toString()
      : params
        ? new URLSearchParams(params).toString()
        : "";
  const path = q ? `/webhook?${q}` : "/webhook";
  const res = await fetch(apiUrl(path), { headers: jsonHeaders });
  return res.json() as Promise<
    ApiEnvelope<{ records: WebhookRecord[]; count: number }>
  >;
}

export async function fetchWebhook(
  id: string
): Promise<ApiEnvelope<{ record: WebhookRecord } | { message: string }>> {
  const res = await fetch(apiUrl(`/webhook/${encodeURIComponent(id)}`), {
    headers: jsonHeaders,
  });
  return res.json() as Promise<
    ApiEnvelope<{ record: WebhookRecord } | { message: string }>
  >;
}

export async function postFlush(): Promise<
  ApiEnvelope<{ message: string; count: number }>
> {
  const res = await fetch(apiUrl("/webhook/flush"), { method: "POST" });
  return res.json() as Promise<
    ApiEnvelope<{ message: string; count: number }>
  >;
}

export async function fetchBackupFiles(): Promise<
  ApiEnvelope<{ files: BackupFileMeta[]; count: number }>
> {
  const res = await fetch(apiUrl("/files"), { headers: jsonHeaders });
  return res.json() as Promise<
    ApiEnvelope<{ files: BackupFileMeta[]; count: number }>
  >;
}

export async function fetchBackupFile(filename: string): Promise<
  ApiEnvelope<
    | { filename: string; records: WebhookRecord[]; count: number }
    | { message: string }
  >
> {
  const res = await fetch(apiUrl(`/files/${encodeURIComponent(filename)}`), {
    headers: jsonHeaders,
  });
  return res.json() as Promise<
    ApiEnvelope<
      | { filename: string; records: WebhookRecord[]; count: number }
      | { message: string }
    >
  >;
}

export async function postBackup(): Promise<
  ApiEnvelope<{
    message: string;
    filename: string;
    count: number;
  }>
> {
  const res = await fetch(apiUrl("/files/backup"), { method: "POST" });
  return res.json() as Promise<
    ApiEnvelope<{ message: string; filename: string; count: number }>
  >;
}

export async function deleteBackupFile(
  filename: string
): Promise<ApiEnvelope<{ message: string; filename: string } | { message: string }>> {
  const res = await fetch(apiUrl(`/files/${encodeURIComponent(filename)}`), {
    method: "DELETE",
  });
  return res.json() as Promise<
    ApiEnvelope<{ message: string; filename: string } | { message: string }>
  >;
}
