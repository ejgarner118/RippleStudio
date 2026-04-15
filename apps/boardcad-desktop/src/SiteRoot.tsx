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

function NavLink({ href, label }: { href: Route; label: string }) {
  return (
    <a className="site-nav__link" href={href}>
      {label}
    </a>
  );
}

function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="/" className="site-brand">
          <img src="/branding/RS_LogoBoard100.png" alt="" width={28} height={28} />
          <span>{APP_DISPLAY_NAME}</span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          <NavLink href="/" label="Home" />
          <NavLink href="/about" label="About" />
          <NavLink href="/contact" label="Contact" />
          <a className="site-nav__cta" href="/app">
            Launch App
          </a>
        </nav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>{new Date().getFullYear()} Ripple Studio</span>
        <div className="site-footer__links">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/app">Launch App</a>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <SiteLayout>
      <section className="hero">
        <p className="hero__eyebrow">Board Design, Modernized</p>
        <h1>Design surfboards faster with clear tools and production-ready outputs.</h1>
        <p>
          Ripple Studio combines precision spline editing, analytics, QA checks, and manufacturing export workflows
          in a clean web-native interface.
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
      <section className="feature-grid">
        <article className="feature-card">
          <h2>Shape with confidence</h2>
          <p>Outline, rocker, and cross-section editing with handle controls and live visual feedback.</p>
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
    </SiteLayout>
  );
}

function AboutPage() {
  return (
    <SiteLayout>
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
        <p>
          Ready to start? <a href="/app">Launch the app</a>.
        </p>
      </section>
    </SiteLayout>
  );
}

function ContactPage() {
  return (
    <SiteLayout>
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
        <a className="btn btn--primary" href="/app">
          Launch App
        </a>
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
  if (route === "/about") return <AboutPage />;
  if (route === "/contact") return <ContactPage />;
  return <HomePage />;
}

