export type WebhookRecord = {
  id: string;
  createdAt: string;
  webhookData: unknown;
};

export type BackupFileMeta = {
  name: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
};

export type ApiEnvelope<T> = {
  status: number;
  data: T;
};
