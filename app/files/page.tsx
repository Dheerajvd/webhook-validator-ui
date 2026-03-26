"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteBackupFile,
  fetchBackupFiles,
  postBackup,
} from "@/lib/api-client";
import type { BackupFileMeta } from "@/lib/types";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const [files, setFiles] = useState<BackupFileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const env = await fetchBackupFiles();
      if (env.status !== 200) {
        setError("Could not list files");
        return;
      }
      setFiles(env.data.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onBackup() {
    setBusy(true);
    setError(null);
    try {
      const env = await postBackup();
      if (env.status !== 200) {
        setError("Backup failed");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(name: string) {
    if (!confirm(`Delete backup file ${name}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const env = await deleteBackupFile(name);
      if (env.status !== 200) {
        setError("Delete failed");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Backup files</h1>
      <p className="page-lede">
        Files API routes: <code>GET /files</code>,{" "}
        <code>GET /files/:filename</code>, <code>DELETE /files/:filename</code>,{" "}
        <code>POST /files/backup</code>. Listing uses GET on first paint; refresh
        after backup or delete.
      </p>

      <div className="toolbar">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void onBackup()}
          disabled={busy || loading}
        >
          Backup in-memory webhooks to disk
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => void load()}
          disabled={loading || busy}
        >
          Refresh list
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <p className="page-lede">Loading files…</p>
      ) : files.length === 0 ? (
        <div className="empty-state">
          No backup files yet. Create one from the button above (in-memory store
          can be empty — you will get an empty backup file).
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
                      onClick={() => void onDelete(f.name)}
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
