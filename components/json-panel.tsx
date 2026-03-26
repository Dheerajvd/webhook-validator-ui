"use client";

export function JsonPanel({ value }: { value: unknown }) {
  const text =
    typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2) ?? String(value);
  return (
    <pre className="json-panel" tabIndex={0}>
      <code>{text}</code>
    </pre>
  );
}
