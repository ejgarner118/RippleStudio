import { useEffect, useState } from "react";
import App from "./App";
import { APP_DISPLAY_NAME } from "./constants/brand";
import "./site.css";

type Route = "/" | "/about" | "/contact" | "/app";
type NavRoute = Exclude<Route, "/app">;

type FeatureItem = {
  title: string;
  description: string;
};

const NAV_ITEMS: Array<{ href: NavRoute; label: string }> = [
  { href: "/", label: "Software" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Log In" },
];

const HERO_TRUST_ITEMS = ["Realtime CAD feedback", "Surf-craft workflow DNA", "Cloud-native collaboration"];

const BENTO_ITEMS: Array<FeatureItem & { size: "large" | "medium" | "small"; tag: string }> = [
  {
    title: "Real-time Volume Analytics",
    description: "Track liters, rocker shifts, and flow-impacting geometry while you shape.",
    size: "large",
    tag: "Live metrics",
  },
  {
    title: "Rail Geometry Presets",
    description: "Apply rail behaviors tuned for conditions, then fine-adjust with precision.",
    size: "medium",
    tag: "Preset engine",
  },
  {
    title: "Cloud Collaboration",
    description: "Share revisions with your shaping team and keep iterations synced.",
    size: "small",
    tag: "In progress",
  },
];

const STAT_ITEMS: FeatureItem[] = [
  {
    title: "Length / Width / Thickness",
    description: "Live technical readouts for shaping accuracy.",
  },
  {
    title: "Ghost board overlays",
    description: "Compare previous iterations in one workspace.",
  },
  {
    title: "Dark studio canvas",
    description: "Focused, low-noise environment for design sessions.",
  },
];

const HOME_FEATURE_ITEMS: FeatureItem[] = [
  {
    title: "CAD precision, shaped by feel",
    description: "Ripple Studio translates craftsmanship instincts into measurable digital control.",
  },
  {
    title: "Flow-first interaction design",
    description: "Controls and spacing are tuned for faster decision-making and lower cognitive load.",
  },
  {
    title: "Built for modern shaping teams",
    description: "From backyard tinkerers to world tour craftspeople, the workflow scales with ambition.",
  },
];

const FOUNDER_SPECS = [
  "Background: Engineering / TPM",
  "Focus: 3D Visualization & Fluid Dynamics",
  "Personal Quiver: 6'1\" Step-up Performance Shortboard",
  "Current Build: Prototype V2 (Cloud-Native)",
];

const COMING_SOON_ITEMS = [
  "Shaper account login and workspace sync",
  "Feedback and support console",
  "Release notes and roadmap access",
];

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

function ActionRow({
  primary,
  secondary,
}: {
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="hero__actions">
      <a className="btn btn--primary" href={primary.href}>
        {primary.label}
      </a>
      {secondary ? (
        <a className="btn btn--subtle" href={secondary.href}>
          {secondary.label}
        </a>
      ) : null}
    </div>
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
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} active={route === item.href} />
          ))}
          <a className="site-nav__cta" href="/app">
            Start Shaping
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
      <section className="hero hero--grid wave-reveal">
        <div className="hero__content">
          <p className="hero__eyebrow">Hydro-Technical Minimalism</p>
          <h1>Master the Rail. Perfect the Flow.</h1>
          <p className="hero__lead">
            The world&apos;s first cloud-native surfboard design engine built for the next generation of shapers.
          </p>
          <ActionRow
            primary={{ href: "/app", label: "Start Shaping" }}
            secondary={{ href: "/about", label: "Explore vision" }}
          />
          <div className="hero__trust" aria-label="Product trust signals">
            {HERO_TRUST_ITEMS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <aside className="wireframe-panel glass-card" aria-label="Interactive wireframe preview">
          <div className="wireframe-board" />
          <p>Interactive wireframe board preview</p>
        </aside>
      </section>

      <section className="bento-grid" aria-label="Feature bento">
        {BENTO_ITEMS.map((item) => (
          <article key={item.title} className={`bento-card bento-card--${item.size} glass-card`}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <span className="bento-tag">{item.tag}</span>
          </article>
        ))}
      </section>

      <section className="stats-strip" aria-label="Software highlights">
        {STAT_ITEMS.map((item) => (
          <div key={item.title} className="glass-inline">
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </div>
        ))}
      </section>

      <section className="feature-grid">
        {HOME_FEATURE_ITEMS.map((item) => (
          <article key={item.title} className="feature-card glass-soft">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="shapers-hand glass-card" aria-label="Shaper hand statement">
        <video autoPlay muted loop playsInline className="shapers-hand__video">
          <source src="/media/resin-pour.mp4" type="video/mp4" />
        </video>
        <div className="shapers-hand__overlay" />
        <p>From backyard tinkerers to World Tour masters.</p>
      </section>

      <section className="cta-band" aria-label="Primary call to action">
        <h2>Design with tide-level precision.</h2>
        <p>Start building boards with a studio interface engineered for speed, craft, and control.</p>
        <a className="btn btn--primary" href="/app">
          Enter the Studio
        </a>
      </section>
    </SiteLayout>
  );
}

function AboutPage({ route }: { route: Route }) {
  return (
    <SiteLayout route={route}>
      <section className="content-page">
        <p className="hero__eyebrow">About</p>
        <h1>The fusion of tech and tide.</h1>
        <p className="content-page__lead">
          Where industrial-grade engineering meets the organic soul of the surfboard. We don&apos;t just guess the
          rocker; we calculate the flow.
        </p>

        <div className="about-hero-split">
          <article className="about-hero-copy">
            <h2>Engineer&apos;s Bay</h2>
            <p>
              Ripple Studio is built around founder-led engineering: practical shaping workflows, high-utility UX, and
              precision-first geometry tooling designed for real-world board performance.
            </p>
          </article>
          <article className="about-schematic glass-card">
            <div className="about-schematic__board" />
            <p>Ripple Studio V1.0 - Beta</p>
          </article>
        </div>

        <section className="manifesto glass-card">
          <p>
            The craft of shaping has always relied on intuition. But in a world of millisecond performance, intuition
            needs an edge. Ripple Studio was built to give shapers the precision of CAD with the interface of a
            workshop. We honor the heritage of the manual planer by providing the digital tools to perfect it.
          </p>
        </section>

        <div className="about-split founder-bento">
          <article className="about-split__pane glass-card">
            <h2>Eric Garner | Founder &amp; Lead Architect</h2>
            <p>
              With a background in Technical Program Management and Nuclear Engineering, Eric spent years orchestrating
              complex systems in the semiconductor and tech industries. A lifelong surfer and 3D developer, he
              realized the tools available to shapers had not kept pace with modern hardware. Ripple Studio is the
              result of applying rigorous engineering standards to the art of surfboard design.
            </p>
          </article>
          <article className="founder-specs glass-card">
            <h2>Shaper Bio</h2>
            <ul>
              {FOUNDER_SPECS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <section className="founder-profile glass-soft" aria-label="Founder profile">
          <img src="/founder/eric-garner.jpg" alt="Eric Garner headshot" className="founder-profile__image" />
          <div className="founder-profile__meta">
            <h3>Eric Garner</h3>
            <p>Founder-led engineering, shaping-first software, and precision workflow architecture.</p>
          </div>
        </section>

        <div className="inline-cta">
          <ActionRow
            primary={{ href: "/app", label: "Start Shaping" }}
            secondary={{ href: "/contact", label: "Join updates" }}
          />
        </div>
      </section>
    </SiteLayout>
  );
}

function ContactPage({ route }: { route: Route }) {
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyState, setNotifyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [notifyMessage, setNotifyMessage] = useState("");

  const handleNotifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = notifyEmail.trim();
    if (!email) {
      setNotifyState("error");
      setNotifyMessage("Please enter an email address.");
      return;
    }
    setNotifyState("loading");
    setNotifyMessage("");
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "site_contact_notify",
        }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Unable to save your request right now.");
      }
      setNotifyState("success");
      setNotifyMessage(payload.message ?? "Thanks. You are on the waitlist.");
      setNotifyEmail("");
    } catch (error) {
      setNotifyState("error");
      setNotifyMessage(error instanceof Error ? error.message : "Unable to save your request right now.");
    }
  };

  return (
    <SiteLayout route={route}>
      <section className="content-page contact-coming">
        <p className="hero__eyebrow">Log In / Contact</p>
        <h1>Studio portal coming soon.</h1>
        <p className="content-page__lead">
          We are building the full Ripple Studio account and support portal. For immediate access requests, reach out
          directly.
        </p>
        <div className="coming-soon-card glass-card coming-soon-float">
          <h2>Coming online</h2>
          <p>
            The Studio is almost live. We are currently in closed beta for professional shapers. Leave your mark and
            be the first to know when we open the bay.
          </p>
          <ul>
            {COMING_SOON_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <form className="notify-form" onSubmit={handleNotifySubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Email for updates"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              disabled={notifyState === "loading"}
              required
            />
            <button type="submit" className="btn btn--primary" disabled={notifyState === "loading"}>
              {notifyState === "loading" ? "Submitting..." : "Notify Me"}
            </button>
          </form>
          {notifyMessage ? (
            <p className={`notify-status ${notifyState === "success" ? "notify-status--success" : "notify-status--error"}`}>
              {notifyMessage}
            </p>
          ) : null}
          <ActionRow
            primary={{ href: "mailto:support@ripplestudio.app", label: "Email support@ripplestudio.app" }}
            secondary={{ href: "/app", label: "Open App" }}
          />
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

