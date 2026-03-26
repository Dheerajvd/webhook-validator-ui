"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteBackupFile,
  fetchBackupFiles,
  postBackup,
} from "@/lib/api-client";
import type { BackupFileMeta } from "@/lib/types";
import { apiErrorMessage } from "@/lib/api-error";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<BackupFileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const env = await fetchBackupFiles();
      if (env.status !== 200) {
        showToast(
          apiErrorMessage(env.status, env.data, "Could not list backups"),
          "error"
        );
        return;
      }
      setFiles(env.data.files);
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onBackup() {
    setBusy(true);
    try {
      const env = await postBackup();
      if (env.status !== 200) {
        showToast(
          apiErrorMessage(env.status, env.data, "Backup failed"),
          "error"
        );
        return;
      }
      showToast("Backup saved", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const name = deleteTarget;
    setBusy(true);
    try {
      const env = await deleteBackupFile(name);
      if (env.status !== 200) {
        showToast(
          apiErrorMessage(env.status, env.data, "Could not delete file"),
          "error"
        );
        return;
      }
      showToast("Backup removed", "success");
      await load();
      setDeleteTarget(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => !busy && setDeleteTarget(null)}
        title="Delete backup file?"
        description={
          <>
            This cannot be undone. File: <code>{deleteTarget}</code>
          </>
        }
        cancelLabel="Cancel"
        confirmLabel="Delete"
        variant="danger"
        busy={busy}
        onConfirm={confirmDelete}
      />
      <h1 className="page-title">Backup files</h1>
      <p className="page-lede">
        Snapshots of captured webhooks saved as files. Open a file to view its
        contents, or remove backups you no longer need.
      </p>

      <div className="toolbar">
        <div className="toolbar__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void onBackup()}
            disabled={busy || loading}
          >
            Save backup
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void load()}
            disabled={loading || busy}
          >
            Reload list
          </button>
        </div>
      </div>

      {loading ? (
        <p className="page-lede">Loading files…</p>
      ) : files.length === 0 ? (
        <div className="empty-state">
          No backups yet. Use <strong>Save backup</strong> to write what is
          currently in memory to a file.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th>Modified</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.name}>
                  <td>
                    <Link href={`/files/${encodeURIComponent(f.name)}`}>
                      {f.name}
                    </Link>
                  </td>
                  <td>{formatBytes(f.size)}</td>
                  <td>{new Date(f.modifiedAt).toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn--danger"
                      disabled={busy}
                      onClick={() => setDeleteTarget(f.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
