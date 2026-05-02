// frontend/src/pages/ModulePage.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import StoryCard from "../components/learning/StoryCard";
import QuizCard from "../components/learning/QuizCard";
import ProgressBar from "../components/common/ProgressBar";
import RewardPopup from "../components/common/RewardPopup";
import FinalChallengePlaceholder from "../components/games/FinalChallengePlaceholder";
import "./ModulePage.css";

// ─── Progress persistence helpers ─────────────────────────────────────────
const getProgressKey = (userId, moduleId) => `mq_progress_u${userId}_m${moduleId}`;

const saveProgress = (userId, moduleId, data) => {
  try {
    localStorage.setItem(getProgressKey(userId, moduleId), JSON.stringify(data));
  } catch {
    /* storage full or unavailable */
  }
};

const loadProgress = (userId, moduleId) => {
  try {
    const raw = localStorage.getItem(getProgressKey(userId, moduleId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Loading state ─────────────────────────────────────────────────────────
const ModuleLoadingScreen = () => (
  <div className="mp-loader" role="status" aria-live="polite">
    <div className="mp-loader-spinner" />
    <p className="mp-loader-text">Loading module…</p>
  </div>
);

// ─── Error state ───────────────────────────────────────────────────────────
const ModuleErrorScreen = ({ moduleId, onBack }) => (
  <div className="mp-error" role="alert">
    <span className="mp-error-icon">⚠️</span>
    <h2 className="mp-error-title">Module Not Found</h2>
    <p className="mp-error-sub">Module {moduleId} is not available yet.</p>
    <button className="mp-error-btn" onClick={onBack}>
      ← Back to Dashboard
    </button>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
const ModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ── Data state ──────────────────────────────────────────────────────────
  const [moduleData, setModuleData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  // ── Learning state ──────────────────────────────────────────────────────
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("story"); // "story" | "quiz" | "final_challenge"
  const [totalPoints, setTotalPoints] = useState(0);
  const [mistakeLog, setMistakeLog] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Reward popup state ──────────────────────────────────────────────────
  const [showReward, setShowReward] = useState(false);
  const [pendingReward, setPendingReward] = useState(null);

  // ── Load module JSON dynamically ────────────────────────────────────────
  useEffect(() => {
    const id = parseInt(moduleId, 10);
    if (!id || isNaN(id)) {
      setDataError(true);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setDataError(false);

    import(`../data/modules/module${id}.json`)
      .then((data) => {
        setModuleData(data.default || data);
        setDataLoading(false);
      })
      .catch(() => {
        setDataError(true);
        setDataLoading(false);
      });
  }, [moduleId]);

  // ── Restore saved progress ──────────────────────────────────────────────
  useEffect(() => {
    if (!moduleData || !user) return;
    const saved = loadProgress(user.id, moduleId);
    if (saved) {
      setCurrentScreenIndex(saved.screenIndex || 0);
      setCurrentPhase(saved.phase || "story");
      setTotalPoints(saved.totalPoints || 0);
      setMistakeLog(saved.mistakeLog || []);
    }
  }, [moduleData, user, moduleId]);

  // ── Persist progress on changes ─────────────────────────────────────────
  useEffect(() => {
    if (!moduleData || !user) return;
    saveProgress(user.id, moduleId, {
      screenIndex: currentScreenIndex,
      phase: currentPhase,
      totalPoints,
      mistakeLog,
      completedScreens:
        currentPhase === "final_challenge"
          ? moduleData.total_screens
          : currentScreenIndex,
    });
  }, [currentScreenIndex, currentPhase, totalPoints, mistakeLog, moduleData, user, moduleId]);

  // ── Scroll to top on screen change ─────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentScreenIndex, currentPhase]);

  // ── Transition helper ───────────────────────────────────────────────────
  const transitionTo = useCallback((fn) => {
    setIsTransitioning(true);
    setTimeout(() => {
      fn();
      setIsTransitioning(false);
    }, 380);
  }, []);

  // ── Guards (only after data is loaded) ─────────────────────────────────
  const currentScreen = moduleData?.screens?.[currentScreenIndex];

  // ── Story completion ────────────────────────────────────────────────────
  const handleStoryComplete = useCallback(() => {
    if (currentScreen?.quiz_questions?.length > 0) {
      transitionTo(() => setCurrentPhase("quiz"));
    } else {
      const reward = currentScreen?.reward;
      setPendingReward({
        badge: reward?.badge || null,
        points: reward?.screen_completion_points || 0,
        quizScore: null,
        totalQuizPoints: 0,
      });
      setShowReward(true);
    }
  }, [currentScreen, transitionTo]);

  // ── Quiz completion ─────────────────────────────────────────────────────
  const handleQuizComplete = useCallback(
    (quizScore, totalQuizPoints) => {
      const reward = currentScreen?.reward;
      setPendingReward({
        badge: reward?.badge || null,
        points: reward?.screen_completion_points || 0,
        quizScore,
        totalQuizPoints,
      });
      setShowReward(true);
    },
    [currentScreen]
  );

  // ── Reward close ────────────────────────────────────────────────────────
  const handleRewardClose = useCallback(() => {
    setShowReward(false);
    const earnedPoints = currentScreen?.reward?.screen_completion_points || 0;
    setTotalPoints((prev) => prev + earnedPoints);

    transitionTo(() => {
      if (currentScreenIndex < (moduleData?.screens?.length || 0) - 1) {
        setCurrentScreenIndex((prev) => prev + 1);
        setCurrentPhase("story");
      } else {
        setCurrentPhase("final_challenge");
      }
    });
  }, [currentScreen, currentScreenIndex, moduleData, transitionTo]);

  // ── Mistake logging ─────────────────────────────────────────────────────
  const handleAnswerLogged = useCallback((answerData) => {
    if (!answerData.isCorrect) {
      setMistakeLog((prev) => [...prev, answerData]);
    }
  }, []);

  // ── Final challenge complete ────────────────────────────────────────────
  const handleFinalChallengeComplete = useCallback(() => {
    const finalTotal = totalPoints + (moduleData?.module_rewards?.completion_points || 0);
    alert(
      `🎉 Module Complete!\n\nTotal Points: ${finalTotal}\nBadge Earned: ${moduleData?.module_rewards?.completion_badge}`
    );
  }, [totalPoints, moduleData]);

  // ── Back to dashboard ───────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  // ── Progress bar values ─────────────────────────────────────────────────
  const progressCurrent =
    currentPhase === "final_challenge"
      ? moduleData?.total_screens || 0
      : currentScreenIndex;

  const isFinalChallenge = currentPhase === "final_challenge";

  // ─────────────────────────────────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────────────────────────────────

  if (dataLoading) return <ModuleLoadingScreen />;
  if (dataError || !moduleData) {
    return <ModuleErrorScreen moduleId={moduleId} onBack={handleBack} />;
  }

  return (
    <div className={`module-page ${isTransitioning ? "mp-fade-out" : "mp-fade-in"}`}>
      {/* === Back button === */}
      <button
        className="mp-back-btn"
        onClick={handleBack}
        aria-label="Back to Dashboard"
      >
        ← Dashboard
      </button>

      {/* === Fixed Progress Bar === */}
      <ProgressBar
        current={progressCurrent}
        total={moduleData.total_screens}
        screens={moduleData.screens}
        totalPoints={totalPoints}
        currentPhase={currentPhase}
        moduleTitle={moduleData.module_title}
      />

      {/* === Module Header (story + quiz phases only) === */}
      {!isFinalChallenge && currentScreen && (
        <div className="module-header" aria-label="Current screen info">
          <div className="module-breadcrumb">
            <span className="module-badge">📖 {moduleData.module_title}</span>
            <span className="breadcrumb-sep" aria-hidden="true">›</span>
            <span className="screen-title-badge">{currentScreen.title}</span>
            <span className={`phase-pill phase-pill--${currentPhase}`}>
              {currentPhase === "story" ? "Story" : "Quiz"}
            </span>
          </div>
          <p className="screen-objective">{currentScreen.objective}</p>
        </div>
      )}

      {/* === Content Phases === */}
      {currentPhase === "story" && currentScreen && (
        <StoryCard
          screenData={currentScreen}
          onComplete={handleStoryComplete}
        />
      )}

      {currentPhase === "quiz" && currentScreen && (
        <QuizCard
          screenData={currentScreen}
          onComplete={handleQuizComplete}
          onAnswerLogged={handleAnswerLogged}
        />
      )}

      {isFinalChallenge && (
        <FinalChallengePlaceholder
          challengeData={moduleData.final_challenge}
          totalPoints={totalPoints}
          mistakeLog={mistakeLog}
          completionBadge={moduleData.module_rewards?.completion_badge}
          completionPoints={moduleData.module_rewards?.completion_points}
          onComplete={handleFinalChallengeComplete}
        />
      )}

      {/* === Reward Popup Overlay === */}
      {showReward && pendingReward && (
        <RewardPopup
          badge={pendingReward.badge}
          points={pendingReward.points}
          quizScore={pendingReward.quizScore}
          totalQuizPoints={pendingReward.totalQuizPoints}
          onClose={handleRewardClose}
        />
      )}
    </div>
  );
};

export default ModulePage;
