// frontend/src/components/learning/StoryCard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./StoryCard.css";

/* ──────────────────────────────────────────────────────────
   Character SVG Avatars  (fallback when real PNGs missing)
   Dimensions target: 600×900px minimum for actual art assets
   ────────────────────────────────────────────────────────── */
const CHARACTER_META = {
  meena: {
    label: "Meena Aunty",
    hue: "#e8a838",
    emoji: "👩‍🍳",
    fallbackBg: "linear-gradient(175deg,#3a1f00 0%,#6b3800 60%,#1a0d00 100%)",
  },
  arjun: {
    label: "Arjun",
    hue: "#3ecfcf",
    emoji: "🧒",
    fallbackBg: "linear-gradient(175deg,#001a2a 0%,#00455e 60%,#001020 100%)",
  },
  narrator: {
    label: "Narrator",
    hue: "#a78bfa",
    emoji: "✨",
    fallbackBg: "linear-gradient(175deg,#0d0a2a 0%,#2a1a5a 60%,#080618 100%)",
  },
};

/* Background gradients per background key
   Replace with real images: /assets/backgrounds/<key>.jpg  */
const BG_GRADIENTS = {
  sweet_shop_bg:      "linear-gradient(160deg,#1a0900 0%,#3d1800 40%,#0a0400 100%)",
  sweet_shop_counter: "linear-gradient(160deg,#1a0d00 0%,#4a2400 40%,#0a0600 100%)",
  math_classroom:     "linear-gradient(160deg,#001420 0%,#003548 40%,#000c14 100%)",
  receipt_board:      "linear-gradient(160deg,#1a1000 0%,#3a2800 40%,#0c0800 100%)",
  sorting_station:    "linear-gradient(160deg,#0d0820 0%,#251550 40%,#060410 100%)",
  formula_board:      "linear-gradient(160deg,#060c20 0%,#101e48 40%,#030810 100%)",
  default_bg:         "linear-gradient(160deg,#0b0f1a 0%,#1a2035 40%,#07090f 100%)",
};

/* Typewriter speed in ms per character */
const TYPEWRITER_MS = 24;

const StoryCard = ({ screenData, onComplete }) => {
  const [segIdx, setSegIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [btnVisible, setBtnVisible] = useState(false);
  const [cardFade, setCardFade] = useState("seg-fade-in");
  const intervalRef = useRef(null);

  const segments = screenData.story_segments || [];
  const seg = segments[segIdx];

  /* ── Typewriter effect ── */
  const startTypewriter = useCallback((text) => {
    if (!text) { setBtnVisible(true); return; }
    setDisplayText("");
    setBtnVisible(false);

    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      // Show button when ~60% typed OR text is short (<80 chars)
      if (i >= Math.ceil(text.length * 0.6) || text.length < 80) {
        setBtnVisible(true);
      }
      if (i >= text.length) {
        clearInterval(intervalRef.current);
        setBtnVisible(true);
      }
    }, TYPEWRITER_MS);
  }, []);

  /* Skip typewriter on tap of dialogue area */
  const skipTypewriter = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      if (seg) setDisplayText(seg.text);
      setBtnVisible(true);
    }
  }, [seg]);

  /* ── Start typewriter on segment change ── */
  useEffect(() => {
    if (!seg) return;
    setCardFade("seg-fade-in");
    startTypewriter(seg.text);
    return () => clearInterval(intervalRef.current);
  }, [segIdx, seg, startTypewriter]);

  /* ── Advance to next segment or quiz ── */
  const handleNext = useCallback(() => {
    if (segIdx < segments.length - 1) {
      setCardFade("seg-fade-out");
      setTimeout(() => {
        setSegIdx((p) => p + 1);
        setCardFade("seg-fade-in");
      }, 280);
    } else {
      setCardFade("seg-fade-out");
      setTimeout(onComplete, 280);
    }
  }, [segIdx, segments.length, onComplete]);

  /* ── Keyboard shortcut: Space / Enter ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (!btnVisible) { skipTypewriter(); return; }
        handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [btnVisible, handleNext, skipTypewriter]);

  /* ── After all segments ── */
  if (!seg) {
    return (
      <div className="story-card story-card--complete">
        <button className="sc-btn sc-btn--primary" onClick={onComplete}>
          Begin Quiz →
        </button>
      </div>
    );
  }

  /* ── Resolve assets ── */
  const portraitKey   = seg.portrait || "narrator";
  const charMeta      = CHARACTER_META[portraitKey] || CHARACTER_META.narrator;
  const bgKey         = seg.background || "default_bg";
  const bgGradient    = BG_GRADIENTS[bgKey] || BG_GRADIENTS.default_bg;

  /* Real asset paths — swap in once PNGs are added */
  const bgImgPath       = `/assets/backgrounds/${bgKey}.jpg`;
  const portraitImgPath = portraitKey !== "narrator"
    ? `/assets/characters/${portraitKey}.png`
    : null;

  const isNarrator   = portraitKey === "narrator";
  const isLastSeg    = segIdx === segments.length - 1;
  const segProgress  = ((segIdx + 1) / segments.length) * 100;

  return (
    <section
      className={`story-card ${cardFade}`}
      aria-label={`Story segment: ${seg.speaker}`}
      style={{ "--sc-bg-gradient": bgGradient }}
    >
      {/* ── Background layer ── */}
      <div
        className="sc-bg"
        style={{
          backgroundImage: `url('${bgImgPath}'), ${bgGradient}`,
        }}
        aria-hidden="true"
      />
      <div className="sc-bg-overlay" aria-hidden="true" />

      {/* ── Segment progress dots ── */}
      <div className="sc-progress-dots" aria-label="Segment progress">
        {segments.map((_, i) => (
          <span
            key={i}
            className={`sc-dot ${i < segIdx ? "sc-dot--done" : i === segIdx ? "sc-dot--active" : ""}`}
            aria-hidden="true"
          />
        ))}
        <span className="sc-seg-count">{segIdx + 1}/{segments.length}</span>
      </div>

      {/* ── Visual state label ── */}
      {seg.visual_state && (
        <div className="sc-visual-badge" aria-hidden="true">
          {seg.visual_state.replace(/_/g, " ")}
        </div>
      )}

      {/* ── Character portrait ── */}
      {!isNarrator && (
        <div className="sc-portrait-frame" aria-hidden="true">
          {portraitImgPath ? (
            <img
              src={portraitImgPath}
              alt={`${charMeta.label} character portrait`}
              className="sc-portrait-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : null}
          {/* Fallback portrait (always rendered, hidden when img loads) */}
          <div
            className="sc-portrait-fallback"
            style={{ background: charMeta.fallbackBg }}
          >
            <span className="sc-portrait-emoji">{charMeta.emoji}</span>
            <span
              className="sc-portrait-glow"
              style={{ background: charMeta.hue, boxShadow: `0 0 60px ${charMeta.hue}` }}
              aria-hidden="true"
            />
          </div>
          <div
            className="sc-portrait-accent"
            style={{ background: `linear-gradient(to top, ${charMeta.hue}55, transparent)` }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* ── Dialogue box ── */}
      <div
        className={`sc-dialogue ${isNarrator ? "sc-dialogue--narrator" : ""}`}
        onClick={skipTypewriter}
        role="region"
        aria-live="polite"
        aria-label="Dialogue"
      >
        {/* Speaker name */}
        <div
          className="sc-speaker"
          style={{ color: charMeta.hue, borderColor: `${charMeta.hue}55` }}
        >
          <span className="sc-speaker-emoji">{charMeta.emoji}</span>
          <span className="sc-speaker-name">{seg.speaker}</span>
          {isNarrator && <span className="sc-narrator-tag">Narrator</span>}
        </div>

        {/* Dialogue text with typewriter cursor */}
        <p className="sc-text" aria-label={seg.text}>
          {displayText}
          <span className="sc-cursor" aria-hidden="true">▌</span>
        </p>

        {/* Action button */}
        <div className={`sc-btn-row ${btnVisible ? "sc-btn-row--visible" : ""}`}>
          <button
            className={`sc-btn ${isLastSeg ? "sc-btn--cta" : "sc-btn--primary"}`}
            onClick={handleNext}
            disabled={!btnVisible}
            aria-label={isLastSeg ? "Continue to quiz" : "Next dialogue"}
          >
            {isLastSeg ? "Start Quiz  →" : "Next  →"}
          </button>
          {!btnVisible && (
            <span className="sc-skip-hint" onClick={skipTypewriter} role="button" tabIndex={0}>
              tap to skip
            </span>
          )}
        </div>
      </div>

      {/* ── Story progress bar strip ── */}
      <div className="sc-strip" aria-hidden="true">
        <div className="sc-strip-fill" style={{ width: `${segProgress}%` }} />
      </div>
    </section>
  );
};

export default StoryCard;