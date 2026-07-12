// frontend/src/pages/LandingPage.jsx
// NOTE: this file uses framer-motion. Install it in your frontend package:
//   npm install framer-motion
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./LandingPage.css";

// ─── Nav links ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Chapters", href: "#chapters" },
  { label: "Games", href: "#games" },
  { label: "About", href: "#about" },
];

// ─── "Choose Your Adventure" worlds ─────────────────────────────────────────────
const WORLDS = [
  {
    key: "algebra",
    dot: "🟣",
    name: "Algebra Kingdom",
    tagline: "Bend equations to your will",
    accent: "#7B61FF",
    glow: "rgba(123,97,255,0.28)",
    items: ["Puzzle Battles", "Formula Forge", "Identity Challenge"],
  },
  {
    key: "mensuration",
    dot: "🟢",
    name: "Mensuration Island",
    tagline: "Shape, measure, conquer",
    accent: "#2ECC71",
    glow: "rgba(46,204,113,0.26)",
    items: ["Build Structures", "Measure Worlds", "Treasure Hunt"],
  },
];

// ─── Feature pills ───────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "🎮", title: "Learn by Playing", desc: "Every concept becomes a game mechanic, not a worksheet.", accent: "#F5A623" },
  { icon: "🏆", title: "Earn Badges", desc: "Conquer chapters and unlock rare, collectible badges.", accent: "#7B61FF" },
  { icon: "💰", title: "Collect Coins", desc: "Every correct answer mints coins toward your hoard.", accent: "#00D4FF" },
  { icon: "📈", title: "Track Progress", desc: "A living map of your growth, quest by quest.", accent: "#2ECC71" },
];

// ─── Product preview: student dashboard mockup ─────────────────────────────────
const DashboardPreview = () => (
  <div className="lnd-dash-mock" aria-hidden="true">
    <div className="lnd-dash-topbar">
      <div className="lnd-dash-dot lnd-dash-dot--red" />
      <div className="lnd-dash-dot lnd-dash-dot--yellow" />
      <div className="lnd-dash-dot lnd-dash-dot--green" />
      <span className="lnd-dash-topbar-title">Student Dashboard</span>
    </div>
    <div className="lnd-dash-body">
      <div className="lnd-dash-side">
        <div className="lnd-dash-avatar">🧙</div>
        <span className="lnd-dash-name">Level 6 Explorer</span>
        <div className="lnd-dash-xp">
          <div className="lnd-dash-xp-fill" />
        </div>
        <span className="lnd-dash-xp-label">2,140 / 3,000 XP</span>
      </div>
      <div className="lnd-dash-main">
        <div className="lnd-dash-stats">
          <div className="lnd-dash-stat">
            <span className="lnd-dash-stat-num">12</span>
            <span className="lnd-dash-stat-label">Modules Done</span>
          </div>
          <div className="lnd-dash-stat">
            <span className="lnd-dash-stat-num">27</span>
            <span className="lnd-dash-stat-label">Badges</span>
          </div>
          <div className="lnd-dash-stat">
            <span className="lnd-dash-stat-num">94%</span>
            <span className="lnd-dash-stat-label">Quiz Avg</span>
          </div>
        </div>
        <div className="lnd-dash-modules">
          <div className="lnd-dash-module lnd-dash-module--done">
            <span>Linear Equations</span>
            <span className="lnd-dash-check">✓</span>
          </div>
          <div className="lnd-dash-module lnd-dash-module--active">
            <span>Quadratic Quests</span>
            <span className="lnd-dash-progress-pill">62%</span>
          </div>
          <div className="lnd-dash-module lnd-dash-module--locked">
            <span>Polynomial Peaks</span>
            <span>🔒</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Story preview: in-app dialogue mockup ─────────────────────────────────────
const StoryPreview = () => (
  <div className="lnd-story-mock">
    <div className="lnd-story-scene" aria-hidden="true">
      <div className="lnd-story-scene-glow" />
      <span className="lnd-story-avatar">🧙‍♂️</span>
    </div>
    <div className="lnd-story-dialogue">
      <span className="lnd-story-speaker">Elder Numeron</span>
      <p className="lnd-story-text">
        "The Bridge of Balance will only appear once both sides of the equation
        are equal, young apprentice. Solve for <em>x</em>, and the path will open."
      </p>
      <button className="lnd-story-continue">
        Continue <span aria-hidden="true">→</span>
      </button>
    </div>
  </div>
);

// ─── Journey / timeline steps ───────────────────────────────────────────────────
const STEPS = [
  { icon: "🗺️", title: "Choose Module", desc: "Pick a chapter from the academy map." },
  { icon: "📖", title: "Story", desc: "Follow the narrative that teaches it." },
  { icon: "🧠", title: "Quiz", desc: "Prove your understanding." },
  { icon: "🎮", title: "Game", desc: "Reinforce it hands-on." },
  { icon: "🏆", title: "Rewards", desc: "Collect XP and badges." },
];

// ─── Hero illustration: explorer scene with ruins, portal, treasure, book ──────
const HeroIllustration = ({ mx, my }) => (
  <motion.div
    className="lnd-hero-illus"
    style={{ rotateX: my, rotateY: mx }}
  >
    <div className="lnd-hero-particles" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className={`lnd-particle lnd-particle-${(i % 6) + 1}`} />
      ))}
    </div>
    <svg viewBox="0 0 560 480" className="lnd-hero-svg">
      <defs>
        <linearGradient id="portalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7B61FF" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="chestGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#c87820" />
        </linearGradient>
        <linearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B61FF" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="ruinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4358" />
          <stop offset="100%" stopColor="#1b2233" />
        </linearGradient>
        <radialGradient id="heroGlowGrad" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#F5A623" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="280" cy="250" r="220" fill="url(#heroGlowGrad)" />

      {/* Ancient ruins (back layer) */}
      <g opacity="0.55">
        <rect x="30" y="300" width="26" height="120" rx="3" fill="url(#ruinGrad)" />
        <rect x="70" y="260" width="26" height="160" rx="3" fill="url(#ruinGrad)" />
        <rect x="470" y="280" width="26" height="140" rx="3" fill="url(#ruinGrad)" />
        <rect x="30" y="290" width="66" height="14" rx="3" fill="url(#ruinGrad)" />
      </g>

      {/* Portal */}
      <g className="lnd-illus-float lnd-illus-float-2" transform="translate(370,70)">
        <ellipse cx="0" cy="60" rx="70" ry="95" fill="url(#portalGrad)" opacity="0.5" />
        <ellipse cx="0" cy="60" rx="46" ry="72" fill="#090B13" opacity="0.6" />
        <ellipse cx="0" cy="60" rx="46" ry="72" fill="none" stroke="#00D4FF" strokeWidth="2" opacity="0.6" />
      </g>

      {/* Ground glow */}
      <ellipse cx="280" cy="420" rx="200" ry="18" fill="#F5A623" opacity="0.1" />

      {/* Floating algebra equations */}
      <text x="40" y="110" className="lnd-sym lnd-sym-1">x² + 2x</text>
      <text x="420" y="200" className="lnd-sym lnd-sym-2">a² = b² + c²</text>
      <text x="30" y="220" className="lnd-sym lnd-sym-3">+</text>
      <text x="470" y="330" className="lnd-sym lnd-sym-4">√x</text>
      <text x="250" y="30" className="lnd-sym lnd-sym-5">π</text>
      <text x="400" y="410" className="lnd-sym lnd-sym-6">÷</text>
      <text x="20" y="380" className="lnd-sym lnd-sym-7">∞</text>
      <text x="200" y="450" className="lnd-sym lnd-sym-1">y = mx+c</text>

      {/* Floating cubes */}
      <g className="lnd-illus-float lnd-illus-float-1" transform="translate(120,90)">
        <rect x="0" y="0" width="26" height="26" rx="4" fill="#00D4FF" opacity="0.35" transform="rotate(18 13 13)" />
      </g>
      <g className="lnd-illus-float lnd-illus-float-3" transform="translate(430,260)">
        <rect x="0" y="0" width="20" height="20" rx="4" fill="#7B61FF" opacity="0.4" transform="rotate(-14 10 10)" />
      </g>

      {/* Coins */}
      <g className="lnd-illus-float lnd-illus-float-2">
        <circle cx="150" cy="330" r="12" fill="#F5A623" stroke="#c87820" strokeWidth="2" />
        <circle cx="170" cy="345" r="9" fill="#f5c842" stroke="#c87820" strokeWidth="2" />
      </g>

      {/* Ancient math book */}
      <g transform="translate(90,240)" className="lnd-illus-float lnd-illus-float-1">
        <path d="M0 40 Q40 20 80 40 L80 90 Q40 70 0 90 Z" fill="url(#bookGrad)" opacity="0.94" />
        <path d="M80 40 Q120 20 160 40 L160 90 Q120 70 80 90 Z" fill="#00D4FF" opacity="0.35" />
        <line x1="80" y1="40" x2="80" y2="90" stroke="#0b0f1a" strokeWidth="2" opacity="0.4" />
      </g>

      {/* Treasure chest */}
      <g transform="translate(220,300)" className="lnd-illus-float lnd-illus-float-2">
        <rect x="0" y="30" width="110" height="60" rx="8" fill="url(#chestGrad)" />
        <path d="M0 30 Q55 -10 110 30 L110 45 Q55 15 0 45 Z" fill="#f5c842" />
        <rect x="45" y="45" width="20" height="16" rx="3" fill="#1a0f2e" />
        <circle cx="55" cy="53" r="3" fill="#F5A623" />
        <rect x="0" y="30" width="110" height="6" fill="#0b0f1a" opacity="0.2" />
      </g>

      {/* Explorer character */}
      <g transform="translate(320,250)" className="lnd-illus-float lnd-illus-float-3">
        <circle cx="20" cy="20" r="16" fill="#f5c842" opacity="0.95" />
        <path d="M2 18 Q20 -2 38 18 L38 6 Q20 -10 2 6 Z" fill="#2b3446" />
        <path d="M4 20 Q20 4 36 20" fill="none" stroke="#F5A623" strokeWidth="3" />
        <rect x="4" y="36" width="32" height="46" rx="10" fill="#7B61FF" opacity="0.9" />
        <rect x="10" y="42" width="20" height="10" rx="3" fill="#00D4FF" opacity="0.6" />
      </g>

      {/* Stars */}
      <g className="lnd-twinkle lnd-twinkle-1"><path d="M100 130 l4 10 10 4 -10 4 -4 10 -4-10 -10-4 10-4z" fill="#f5c842" /></g>
      <g className="lnd-twinkle lnd-twinkle-2"><path d="M420 340 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill="#00D4FF" /></g>
      <g className="lnd-twinkle lnd-twinkle-3"><path d="M390 150 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill="#e8edf4" /></g>
      <g className="lnd-twinkle lnd-twinkle-4"><path d="M140 400 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill="#7B61FF" /></g>
      <g className="lnd-twinkle lnd-twinkle-1"><circle cx="480" cy="120" r="2.5" fill="#F5A623" /></g>
      <g className="lnd-twinkle lnd-twinkle-3"><circle cx="60" cy="60" r="2" fill="#00D4FF" /></g>
    </svg>

    {/* Gamification UI cards */}
    <motion.div
      className="lnd-hud-card lnd-hud-card--level"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{ opacity: { duration: 0.6, delay: 0.4 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
    >
      <span className="lnd-hud-icon">🛡️</span>
      <div>
        <span className="lnd-hud-label">Level</span>
        <span className="lnd-hud-value">3</span>
      </div>
    </motion.div>
    <motion.div
      className="lnd-hud-card lnd-hud-card--xp"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: [0, -10, 0] }}
      transition={{ opacity: { duration: 0.6, delay: 0.6 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
    >
      <span className="lnd-hud-icon">⭐</span>
      <div>
        <span className="lnd-hud-label">XP</span>
        <span className="lnd-hud-value">2450</span>
      </div>
    </motion.div>
    <motion.div
      className="lnd-hud-card lnd-hud-card--coins"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: [0, -7, 0] }}
      transition={{ opacity: { duration: 0.6, delay: 0.8 }, y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } }}
    >
      <span className="lnd-hud-icon">💰</span>
      <div>
        <span className="lnd-hud-label">Coins</span>
        <span className="lnd-hud-value">320</span>
      </div>
    </motion.div>
  </motion.div>
);

// ─── World card (Choose Your Adventure) ─────────────────────────────────────────
const WorldCard = ({ dot, name, tagline, accent, glow, items }) => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  };
  const handleLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      className="lnd-world-card"
      style={{ "--w-accent": accent, "--w-glow": glow }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 150, damping: 14 }}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="lnd-world-glow" aria-hidden="true" />
      <span className="lnd-world-dot">{dot}</span>
      <h3 className="lnd-world-name">{name}</h3>
      <p className="lnd-world-tagline">{tagline}</p>
      <ul className="lnd-world-list">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
      <button className="lnd-world-cta">Enter World →</button>
    </motion.div>
  );
};

// ─── Feature card ───────────────────────────────────────────────────────────────
const FeatureCard = ({ icon, title, desc, accent, index }) => (
  <motion.div
    className="lnd-feat-pill"
    style={{ "--f-accent": accent }}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    whileHover={{ y: -6 }}
  >
    <span className="lnd-feat-pill-icon">{icon}</span>
    <h3 className="lnd-feat-pill-title">{title}</h3>
    <p className="lnd-feat-pill-desc">{desc}</p>
  </motion.div>
);

// ─── Landing Page ───────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x: px * 8, y: py * -8 });
  };
  const handleHeroMouseLeave = () => setMouse({ x: 0, y: 0 });

  return (
    <div className="lnd-root">
      {/* ── Background ── */}
      <div className="lnd-bg-fx" aria-hidden="true">
        <div className="lnd-orb lnd-orb-1" />
        <div className="lnd-orb lnd-orb-2" />
        <div className="lnd-orb lnd-orb-3" />
        <div className="lnd-grid-lines" />
        <div className="lnd-bg-stars">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className={`lnd-bg-star lnd-bg-star-${(i % 6) + 1}`} />
          ))}
        </div>
        <div className="lnd-bg-symbols" aria-hidden="true">
          <span className="lnd-bg-symbol lnd-bg-symbol-1">π</span>
          <span className="lnd-bg-symbol lnd-bg-symbol-2">∑</span>
          <span className="lnd-bg-symbol lnd-bg-symbol-3">√</span>
          <span className="lnd-bg-symbol lnd-bg-symbol-4">x²</span>
          <span className="lnd-bg-symbol lnd-bg-symbol-5">∞</span>
        </div>
      </div>

      {/* ── Navbar ── */}
      <motion.nav
        className="lnd-nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="lnd-nav-brand">
          <span className="lnd-nav-logo">🧮</span>
          <span className="lnd-nav-name">MathQuest</span>
        </div>
        <div className="lnd-nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="lnd-nav-link">
              {l.label}
            </a>
          ))}
        </div>
        <div className="lnd-nav-actions">
          <button className="lnd-nav-btn lnd-nav-btn--ghost" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="lnd-nav-btn lnd-nav-btn--primary" onClick={() => navigate("/register")}>
            Get Started
          </button>
        </div>
      </motion.nav>

      <main className="lnd-main">
        {/* ── Hero ── */}
        <section
          className="lnd-hero"
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
        >
          <motion.div
            className="lnd-hero-text"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.span
              className="lnd-hero-eyebrow"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              Class 8 Algebra Academy
            </motion.span>
            <motion.h1
              className="lnd-hero-title"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            >
              <span className="lnd-hero-title-accent">Gamified</span>{" "}
              <span className="lnd-hero-title-accent">Math</span> <br />
              <span className="lnd-hero-title-accent">Adventure</span>
            </motion.h1>
            <motion.p
              className="lnd-hero-sub"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            >
              Master Algebra through epic adventures, exciting battles, magical
              puzzles, and rewarding quests.
            </motion.p>
            <motion.div
              className="lnd-hero-actions"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            >
              <motion.button
                className="lnd-btn lnd-btn--primary lnd-btn--lg lnd-btn--pulse"
                onClick={() => navigate("/register")}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                🚀 Start Your Adventure
              </motion.button>
            </motion.div>
          </motion.div>

          <HeroIllustration mx={mouse.x} my={mouse.y} />
        </section>

        {/* ── Choose Your Adventure ── */}
        <section className="lnd-section" id="chapters">
          <div className="lnd-section-header">
            <h2 className="lnd-section-title">Choose Your Adventure</h2>
            <p className="lnd-section-sub">Two worlds. Countless quests. Pick your path.</p>
          </div>
          <div className="lnd-worlds-grid">
            {WORLDS.map((w) => (
              <WorldCard key={w.key} {...w} />
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="lnd-section" id="features">
          <div className="lnd-section-header">
            <h2 className="lnd-section-title">Why Explorers Choose MathQuest</h2>
            <p className="lnd-section-sub">Learning that feels like leveling up</p>
          </div>
          <div className="lnd-feat-grid">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </section>

        {/* ── Product Preview ── */}
        <section className="lnd-section" id="leaderboard">
          <div className="lnd-section-header">
            <h2 className="lnd-section-title">Step Inside the Academy</h2>
            <p className="lnd-section-sub">A living dashboard that tracks every quest</p>
          </div>
          <DashboardPreview />
        </section>

        {/* ── Story Preview ── */}
        <section className="lnd-section" id="games">
          <div className="lnd-section-header">
            <h2 className="lnd-section-title">Every Lesson Has a Story</h2>
            <p className="lnd-section-sub">Meet the characters who guide your journey</p>
          </div>
          <StoryPreview />
        </section>

        {/* ── How It Works ── */}
        <section className="lnd-section" id="about">
          <div className="lnd-section-header">
            <h2 className="lnd-section-title">How It Works</h2>
            <p className="lnd-section-sub">Five steps from story to reward</p>
          </div>
          <div className="lnd-journey">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.title}>
                <motion.div
                  className="lnd-journey-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <span className="lnd-journey-icon">{s.icon}</span>
                  <h3 className="lnd-journey-title">{s.title}</h3>
                  <p className="lnd-journey-desc">{s.desc}</p>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className="lnd-journey-connector" aria-hidden="true">
                    <span className="lnd-journey-arrow">→</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="lnd-cta">
          <div className="lnd-cta-glow" aria-hidden="true" />
          <span className="lnd-cta-eyebrow">Class 8 Algebra Academy</span>
          <h2 className="lnd-cta-title">Your Adventure Begins Here</h2>
          <p className="lnd-cta-sub">Join the academy and turn every lesson into a quest.</p>
          <motion.button
            className="lnd-btn lnd-btn--primary lnd-btn--xl lnd-btn--pulse"
            onClick={() => navigate("/register")}
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            🚀 Start Your Adventure
          </motion.button>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lnd-footer">
        <div className="lnd-footer-brand">
          <span className="lnd-nav-logo">🧮</span>
          <span className="lnd-nav-name">MathQuest</span>
        </div>
        <p className="lnd-footer-sub">Gamified Math Learning · Built with the MERN Stack</p>
      </footer>
    </div>
  );
};

export default LandingPage;
