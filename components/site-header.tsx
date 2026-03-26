import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          Webhook Validator
        </Link>
        <nav className="site-header__nav">
          <Link href="/">Live</Link>
          <Link href="/files">Backups</Link>
        </nav>
      </div>
    </header>
  );
}
