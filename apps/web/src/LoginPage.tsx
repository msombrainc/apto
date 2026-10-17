import { FormEvent } from "react";
import { BrandMark } from "./BrandMark";
import { DEMO_PASSWORD, DEMO_USER } from "./demoAuth";

type LoginPageProps = {
  error: string | null;
  onLogin: (e: FormEvent<HTMLFormElement>) => void;
};

export function LoginPage({ error, onLogin }: LoginPageProps) {
  return (
    <div className="login-split">
      <section className="login-hero">
        <div className="login-hero-inner">
          <BrandMark />
          <h2 className="login-headline">
            Custom ITAD.
            <br />
            Total coverage.
            <br />
            Transparent results.
          </h2>
          <div className="login-headline-accent" aria-hidden />
          <p className="login-lede">
            AIMS keeps every customer, job and asset in one place — from pickup and
            intake to SLA tracking and settlement in QuickBooks.
          </p>
          <div className="login-pillars">
            <div>
              <strong>Accounts</strong>
              <span>Customer SLAs</span>
            </div>
            <div>
              <strong>Jobs</strong>
              <span>Live SLA countdown</span>
            </div>
            <div>
              <strong>Inventory</strong>
              <span>Asset-level audit trail</span>
            </div>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-panel-inner">
          <header>
            <h1>Sign in to AIMS</h1>
            <p className="muted">
              Asset &amp; inventory management for Apto operations.
            </p>
          </header>
          <form className="login-form" onSubmit={onLogin}>
            <label>
              Username
              <input name="user" autoComplete="username" defaultValue={DEMO_USER} />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue={DEMO_PASSWORD}
              />
            </label>
            <button type="submit" className="btn-primary">
              Sign in <span aria-hidden>→</span>
            </button>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </section>
    </div>
  );
}
