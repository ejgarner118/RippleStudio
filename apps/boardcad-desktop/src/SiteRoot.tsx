import { useEffect, useState } from "react";
import App from "./App";
import { APP_DISPLAY_NAME } from "./constants/brand";
import "./site.css";

type Route = "/" | "/about" | "/contact" | "/app";

function normalizePathname(pathname: string): Route {
  if (pathname === "/about") return "/about";
  if (pathname === "/contact") return "/contact";
  if (pathname === "/app") return "/app";
  return "/";
}

function NavLink({ href, label, active }: { href: Route; label: string; active?: boolean }) {
  return (
    <a className={`site-nav__link ${active ? "site-nav__link--active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
      {label}
    </a>
  );
}

function SiteLayout({ children, route }: { children: React.ReactNode; route: Route }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="/" className="site-brand">
          <img src="/branding/RS_LogoBoard100.png" alt="" width={28} height={28} />
          <span>{APP_DISPLAY_NAME}</span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          <NavLink href="/" label="Home" active={route === "/"} />
          <NavLink href="/about" label="About" active={route === "/about"} />
          <NavLink href="/contact" label="Contact" active={route === "/contact"} />
          <a className="site-nav__cta" href="/app">
            Launch App
          </a>
        </nav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>{new Date().getFullYear()} Ripple Studio · Web-first surfboard CAD</span>
        <div className="site-footer__links">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/app">Launch App</a>
        </div>
      </footer>
    </div>
  );
}

function HomePage({ route }: { route: Route }) {
  return (
    <SiteLayout route={route}>
      <section className="hero">
        <p className="hero__eyebrow">Board Design, Modernized</p>
        <h1>From concept to cut path, in one clean shaping workflow.</h1>
        <p>
          Ripple Studio combines precise curve control, project snapshots, analytics, and manufacturing outputs
          in a fast interface designed for modern shaping workflows.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="/app">
            Launch App
          </a>
          <a className="btn btn--subtle" href="/about">
            Learn More
          </a>
        </div>
      </section>
      <section className="logo-rail" aria-label="Workflow outcomes">
        <span>Task-first editing</span>
        <span>Cross-section control</span>
        <span>QA + CAM readiness</span>
        <span>Versioned project snapshots</span>
      </section>
      <section className="stats-strip" aria-label="Product highlights">
        <div>
          <strong>2D + 3D</strong>
          <span>Linked editing workflow</span>
        </div>
        <div>
          <strong>Project snapshots</strong>
          <span>Versioned board evolution</span>
        </div>
        <div>
          <strong>QA + CAM</strong>
          <span>Pre-manufacturing validation</span>
        </div>
      </section>
      <section className="feature-grid">
        <article className="feature-card">
          <h2>Shape with confidence</h2>
          <p>Outline, rocker, and rail editing with direct manipulation, stable handle modes, and clear visual feedback.</p>
        </article>
        <article className="feature-card">
          <h2>Validate before cutting</h2>
          <p>Built-in QA checks and CAM preview reduce costly CNC and shaping mistakes.</p>
        </article>
        <article className="feature-card">
          <h2>Track project evolution</h2>
          <p>Project library + snapshots keep version history and let you reopen prior milestones instantly.</p>
        </article>
      </section>
      <section className="split-showcase">
        <article className="showcase-panel">
          <h2>Built for fast iteration</h2>
          <p>
            Start from proven templates, compare deltas against baseline boards, and auto-scale while preserving key
            performance constraints.
          </p>
        </article>
        <article className="showcase-panel">
          <h2>Ready for manufacturing handoff</h2>
          <p>
            Export board data in practical formats and review machining intent early with preview + rule checks before
            committing foam and machine time.
          </p>
        </article>
      </section>
    </SiteLayout>
  );
}

function AboutPage({ route }: { route: Route }) {
  return (
    <SiteLayout route={route}>
      <section className="content-page">
        <h1>About Ripple Studio</h1>
        <p>
          Ripple Studio is a web-first surfboard CAD and design environment built to bridge power-user shaping
          workflows with modern UI/UX standards.
        </p>
        <h2>What we focus on</h2>
        <ul>
          <li>Fast iterative board design with clear visual editing</li>
          <li>Reliable manufacturing handoff (exports, CAM prep, QA checks)</li>
          <li>Simple workflows that still preserve advanced control</li>
        </ul>
        <div className="inline-cta">
          <a className="btn btn--primary" href="/app">Launch the app</a>
        </div>
      </section>
    </SiteLayout>
  );
}

function ContactPage({ route }: { route: Route }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const canSend = name.trim().length > 1 && email.includes("@") && message.trim().length > 8;
  return (
    <SiteLayout route={route}>
      <section className="content-page">
        <h1>Contact Us</h1>
        <p>Questions, feedback, or feature requests? We would love to hear from you.</p>
        <div className="contact-cards">
          <article className="feature-card">
            <h2>Email</h2>
            <p>
              <a href="mailto:support@ripplestudio.app">support@ripplestudio.app</a>
            </p>
          </article>
          <article className="feature-card">
            <h2>Product Feedback</h2>
            <p>
              Share your workflow pain points and we will prioritize improvements in upcoming releases.
            </p>
          </article>
        </div>
        <div className="inline-cta">
          <div className="contact-form">
            <label>
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label>
              <span>Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              <span>Message</span>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
            </label>
          </div>
          <a className="btn btn--primary" href="/app">
            Launch App
          </a>
          <a
            className={`btn btn--subtle ${canSend ? "" : "btn--disabled-link"}`}
            href={
              canSend
                ? `mailto:support@ripplestudio.app?subject=${encodeURIComponent(`Ripple Studio contact from ${name}`)}&body=${encodeURIComponent(
                    `Name: ${name}\nEmail: ${email}\n\n${message}`,
                  )}`
                : "#"
            }
            onClick={(e) => {
              if (!canSend) e.preventDefault();
            }}
          >
            Send via email
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}

export function SiteRoot() {
  const [route, setRoute] = useState<Route>(() => normalizePathname(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(normalizePathname(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      if (anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const next = normalizePathname(new URL(anchor.href, window.location.origin).pathname);
      event.preventDefault();
      window.history.pushState({}, "", next);
      setRoute(next);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (route === "/app") return <App />;
  if (route === "/about") return <AboutPage route={route} />;
  if (route === "/contact") return <ContactPage route={route} />;
  return <HomePage route={route} />;
}

