// frontend/src/components/common/GuidedTour.jsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import "./GuidedTour.css";

/*
 * GuidedTour — a lightweight, dependency-free spotlight walkthrough.
 *
 * Deliberately generic: it knows nothing about Module 1, quizzes, or
 * notebooks. Callers pass a list of `steps`, each naming a CSS selector
 * for the real DOM element to spotlight, so any part of the app can
 * reuse this later without pulling in a third-party tour library.
 *
 * Step shape:
 *   {
 *     id, title, body,
 *     selector,            // required — the real element to highlight
 *     fallbackSelector,    // optional — used while `selector` isn't
 *                           // mounted yet (e.g. a quiz that only
 *                           // appears once the current story ends)
 *     fallbackTitle, fallbackBody, // optional copy shown while the
 *                           // fallback target is active
 *   }
 *
 * The tour never guesses or centers itself on the screen when a real
 * target exists — it always anchors to the actual DOM element it finds
 * (primary first, then fallback), and re-measures continuously so it
 * tracks layout changes, animations, and window resizes.
 */

const SPOTLIGHT_PADDING = 10;
const TOOLTIP_MARGIN = 16;
const POLL_MS = 250;

const findElement = (step) => {
  if (!step) return null;
  const primary = step.selector ? document.querySelector(step.selector) : null;
  if (primary) return { el: primary, usingFallback: false };
  const fallback = step.fallbackSelector ? document.querySelector(step.fallbackSelector) : null;
  if (fallback) return { el: fallback, usingFallback: true };
  return null;
};

const GuidedTour = ({ steps, onFinish, onSkip }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [target, setTarget] = useState(null); // { rect, usingFallback } | null
  const [prevAvailable, setPrevAvailable] = useState(false);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 190 });
  const tooltipRef = useRef(null);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // ── Continuously measure the current step's target (and check whether
  // the previous step's target is still around, so "Back" only appears
  // when it would actually go somewhere real). ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;

      const found = findElement(step);
      if (found) {
        const r = found.el.getBoundingClientRect();
        setTarget({
          rect: { top: r.top, left: r.left, width: r.width, height: r.height },
          usingFallback: found.usingFallback,
        });
      } else {
        setTarget(null);
      }

      const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : null;
      setPrevAvailable(!!(prevStep && findElement(prevStep)));
    };

    measure();
    const interval = setInterval(measure, POLL_MS);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, stepIndex, steps]);

  // Keep the tooltip's own measured size fresh so placement math can
  // clamp it fully on-screen (important on small/laptop screens).
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const r = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ width: r.width, height: r.height });
    }
  }, [stepIndex, target?.usingFallback, target?.rect?.width, target?.rect?.height]);

  // The student can always back out via Escape, in addition to the
  // explicit Skip/Exit control.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  const handleNext = useCallback(() => {
    if (isLastStep) onFinish();
    else setStepIndex((i) => i + 1);
  }, [isLastStep, onFinish]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // ── Spotlight geometry (clamped to the viewport) ──────────────────────
  let spot = null;
  if (target) {
    const top = Math.max(0, target.rect.top - SPOTLIGHT_PADDING);
    const left = Math.max(0, target.rect.left - SPOTLIGHT_PADDING);
    const width = Math.max(0, Math.min(vw - left, target.rect.width + SPOTLIGHT_PADDING * 2));
    const height = Math.max(0, Math.min(vh - top, target.rect.height + SPOTLIGHT_PADDING * 2));
    spot = { top, left, width, height };
  }

  // ── Tooltip placement: below the target if there's room, otherwise
  // above it — never dead-center-of-screen while a real target exists. ──
  let tooltipStyle = { position: "fixed" };
  if (spot) {
    const spaceBelow = vh - (spot.top + spot.height);
    const spaceAbove = spot.top;
    const placeBelow = spaceBelow >= tooltipSize.height + TOOLTIP_MARGIN || spaceBelow >= spaceAbove;

    let top = placeBelow
      ? spot.top + spot.height + TOOLTIP_MARGIN
      : spot.top - tooltipSize.height - TOOLTIP_MARGIN;
    top = Math.max(TOOLTIP_MARGIN, Math.min(top, vh - tooltipSize.height - TOOLTIP_MARGIN));

    let left = spot.left + spot.width / 2 - tooltipSize.width / 2;
    left = Math.max(TOOLTIP_MARGIN, Math.min(left, vw - tooltipSize.width - TOOLTIP_MARGIN));

    tooltipStyle = { position: "fixed", top, left };
  } else {
    // Only reachable if neither a step's primary nor fallback selector
    // resolved to anything on the page — should be rare in practice.
    // Anchors to the bottom edge rather than the center of the screen so
    // it still reads as "part of the interface", not a generic modal.
    tooltipStyle = {
      position: "fixed",
      left: "50%",
      bottom: TOOLTIP_MARGIN,
      transform: "translateX(-50%)",
    };
  }

  const title = target?.usingFallback ? step.fallbackTitle || step.title : step.title;
  const body = target?.usingFallback ? step.fallbackBody || step.body : step.body;

  return (
    <div className="gt-root" role="dialog" aria-modal="true" aria-label={`Guided tour: ${title}`}>
      {spot ? (
        <>
          <div className="gt-dim" style={{ top: 0, left: 0, right: 0, height: spot.top }} />
          <div className="gt-dim" style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0 }} />
          <div className="gt-dim" style={{ top: spot.top, left: 0, width: spot.left, height: spot.height }} />
          <div
            className="gt-dim"
            style={{ top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height }}
          />
          <div
            className="gt-spotlight-ring"
            style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          />
        </>
      ) : (
        <div className="gt-dim gt-dim--full" />
      )}

      <div className="gt-tooltip" style={tooltipStyle} ref={tooltipRef}>
        <div className="gt-tooltip-kicker">
          Step {stepIndex + 1} of {steps.length}
        </div>
        <h3 className="gt-tooltip-title">{title}</h3>
        <p className="gt-tooltip-body">{body}</p>

        <div className="gt-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={`gt-dot ${i === stepIndex ? "gt-dot--active" : ""}`} />
          ))}
        </div>

        <div className="gt-actions">
          <div className="gt-actions-left">
            {stepIndex > 0 && prevAvailable && (
              <button className="gt-btn gt-btn--ghost" onClick={handleBack}>
                ← Back
              </button>
            )}
          </div>
          <div className="gt-actions-right">
            <button className="gt-btn gt-btn--text" onClick={onSkip}>
              {isLastStep ? "Exit" : "Skip tour"}
            </button>
            <button className="gt-btn gt-btn--primary" onClick={handleNext} autoFocus>
              {isLastStep ? "Finish ✓" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
