// frontend/src/pages/ModulePage.jsx
import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { saveProgressToBackend } from "../services/progressService";

import StoryCard from "../components/learning/StoryCard";
import QuizCard from "../components/learning/QuizCard";
import ProgressBar from "../components/common/ProgressBar";
import RewardPopup from "../components/common/RewardPopup";
import FinalChallengePlaceholder from "../components/games/FinalChallengePlaceholder";
import { isGameAvailable } from "../utils/GameRegistry";
import "./ModulePage.css";

// ─── Progress helpers ─────────────────────────────────────────────────────────
const getProgressKey = (userId, moduleId) =>
  `mq_progress_u${userId}_m${moduleId}`;

const saveProgress = (userId, moduleId, data) => {
  try {
    localStorage.setItem(getProgressKey(userId, moduleId), JSON.stringify(data));
  } catch {}
};

const loadProgress = (userId, moduleId) => {
  try {
    const raw = localStorage.getItem(getProgressKey(userId, moduleId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Simple UI state screens ──────────────────────────────────────────────────
const ModuleLoadingScreen = () => (
  <div className="mp-loader">
    <div className="mp-loader-spinner" />
    <p className="mp-loader-text">Loading module…</p>
  </div>
);

const ModuleErrorScreen = ({ moduleId, onBack }) => (
  <div className="mp-error">
    <span className="mp-error-icon">⚠️</span>
    <h2 className="mp-error-title">Module {moduleId} not found</h2>
    <p className="mp-error-sub">This module doesn't exist or couldn't load.</p>
    <button className="mp-error-btn" onClick={onBack}>
      ← Back to Dashboard
    </button>
  </div>
);

const ModuleCompleteScreen = ({ moduleId, moduleTitle, onPlayGame, onDashboard }) => {
  const gameAvailable = isGameAvailable(moduleId);

  return (
    <div
      className="mp-complete"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        background: "#0b0f1a",
        color: "#e8edf4",
        fontFamily: "'Nunito', sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <span style={{ fontSize: "3rem" }}>🎓</span>

      <h2
        style={{
          fontFamily: "'Cinzel', serif",
          color: "#e8a838",
          margin: 0,
        }}
      >
        Module Complete!
      </h2>

      <p style={{ color: "#7a8aaa", margin: 0 }}>{moduleTitle}</p>

      {gameAvailable ? (
        <button
          onClick={onPlayGame}
          style={{
            padding: "0.9rem 2rem",
            background: "linear-gradient(135deg,#e8a838,#c87820)",
            border: "none",
            borderRadius: "14px",
            color: "#0b0f1a",
            fontWeight: 900,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          🎮 Play Game
        </button>
      ) : (
        <p style={{ color: "#4a5870", fontSize: "0.9rem" }}>
          🔒 Game coming soon
        </p>
      )}

      <button
        onClick={onDashboard}
        style={{
          padding: "0.75rem 1.8rem",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "14px",
          color: "#e8edf4",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const parsedId = parseInt(moduleId, 10);
  const isInvalidId = !parsedId || isNaN(parsedId);

  // FIX: completionTime was always hardcoded to 0 when saving progress,
  // which is why "Avg Time Spent" on the teacher dashboard could never be
  // anything but 0m. Track a real session start timestamp so we can send
  // actual elapsed seconds instead.
  const sessionStartRef = useRef(Date.now());

  // ── Data loading state ────────────────────────────────────────────────────
  const [moduleData, setModuleData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  // ── Load saved progress once ──────────────────────────────────────────────
  const savedRef = useRef(null);

  if (savedRef.current === null && user) {
    savedRef.current = loadProgress(user.id, moduleId) || {};
  }

  const saved = savedRef.current || {};

  const [currentScreenIndex, setCurrentScreenIndex] = useState(
    saved.screenIndex || 0
  );
  const [currentPhase, setCurrentPhase] = useState(saved.phase || "story");
  const [totalPoints, setTotalPoints] = useState(saved.totalPoints || 0);
  const [mistakeLog, setMistakeLog] = useState(saved.mistakeLog || []);

  // FIX: track whether the backend save has actually succeeded, so
  // "completedScreens" (read by the Student Dashboard) can never claim a
  // module is done before MongoDB agrees it's done.
  const [backendSaveConfirmed, setBackendSaveConfirmed] = useState(
    saved.backendSaveConfirmed || false
  );
  const [isSavingFinal, setIsSavingFinal] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [pendingReward, setPendingReward] = useState(null);

  // ── Load module JSON ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isInvalidId) return;

    setDataLoading(true);
    setDataError(false);

    import(`../data/modules/module${parsedId}.json`)
      .then((data) => {
        setModuleData(data.default || data);
        setDataLoading(false);
      })
      .catch(() => {
        setDataError(true);
        setDataLoading(false);
      });
  }, [parsedId, isInvalidId]);

  // ── Save local progress ───────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleData || !user) return;

    const screens = moduleData.screens || [];
    const totalScreens = moduleData.total_screens || screens.length;

    saveProgress(user.id, moduleId, {
      screenIndex: currentScreenIndex,
      phase: currentPhase,
      totalPoints,
      mistakeLog,
      backendSaveConfirmed,

      // FIX: previously this flipped to totalScreens the instant the student
      // reached "final_challenge"/"module_complete", i.e. before the
      // "Complete Module" button was even clicked and long before the
      // backend save resolved. That let the Student Dashboard show a module
      // as done while MongoDB (and thus the Teacher Dashboard) still had
      // nothing recorded. Now it only reflects "done" once the backend save
      // has actually succeeded.
      completedScreens: backendSaveConfirmed ? totalScreens : currentScreenIndex,

      quizAccuracy:
        mistakeLog.length > 0
          ? Math.max(
              0,
              Math.round(
                100 - (mistakeLog.length / Math.max(currentScreenIndex, 1)) * 20
              )
            )
          : null,
    });
  }, [
    currentScreenIndex,
    currentPhase,
    totalPoints,
    mistakeLog,
    backendSaveConfirmed,
    moduleData,
    user,
    moduleId,
  ]);

  // ── Scroll reset on screen change ────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreenIndex, currentPhase]);

  // ── Transition helper ────────────────────────────────────────────────────
  const transitionTo = useCallback((fn) => {
    setIsTransitioning(true);

    setTimeout(() => {
      fn();
      setIsTransitioning(false);
    }, 300);
  }, []);

  const currentScreen = moduleData?.screens?.[currentScreenIndex];

  // ── Story complete ───────────────────────────────────────────────────────
  const handleStoryComplete = useCallback(() => {
    if (currentScreen?.quiz_questions?.length > 0) {
      transitionTo(() => setCurrentPhase("quiz"));
    } else {
      setPendingReward({
        badge: currentScreen?.reward?.badge || null,
        points: currentScreen?.reward?.screen_completion_points || 10,
        quizScore: null,
        totalQuizPoints: null,
      });

      setShowReward(true);
    }
  }, [currentScreen, transitionTo]);

  // ── Quiz complete ────────────────────────────────────────────────────────
  const handleQuizComplete = useCallback(
    (score, totalPossiblePoints) => {
      setPendingReward({
        badge: currentScreen?.reward?.badge || null,
        points: currentScreen?.reward?.screen_completion_points || 10,
        quizScore: score,
        totalQuizPoints: totalPossiblePoints,
      });

      setShowReward(true);
    },
    [currentScreen]
  );

  // ── Log wrong answers ────────────────────────────────────────────────────
  const handleAnswerLogged = useCallback((answerData) => {
    if (!answerData.isCorrect) {
      setMistakeLog((prev) => [...prev, answerData]);
    }
  }, []);

  // ── Reward close ─────────────────────────────────────────────────────────
  const handleRewardClose = useCallback(() => {
    if (pendingReward?.points) {
      setTotalPoints((p) => p + pendingReward.points);
    }

    setShowReward(false);
    setPendingReward(null);

    const screens = moduleData?.screens || [];
    const isLast = currentScreenIndex >= screens.length - 1;

    if (isLast) {
      transitionTo(() => setCurrentPhase("final_challenge"));
    } else {
      transitionTo(() => {
        setCurrentScreenIndex((i) => i + 1);
        setCurrentPhase("story");
      });
    }
  }, [pendingReward, moduleData, currentScreenIndex, transitionTo]);

  // ── Final module complete: save to backend MongoDB ───────────────────────
  const handleFinalChallengeComplete = async () => {
    if (isSavingFinal) return; // guard against double-submit while a save is in flight

    setIsSavingFinal(true);
    setSaveError(false);

    const completionPoints = moduleData.module_rewards?.completion_points || 0;
    const finalPoints = totalPoints + completionPoints;

    const totalQuestions = Math.max(currentScreenIndex + mistakeLog.length, 1);

    const accuracy = Math.max(
      0,
      Math.round(((totalQuestions - mistakeLog.length) / totalQuestions) * 100)
    );

    const weakTopics = [
      ...new Set(
        mistakeLog
          .map(
            (m) =>
              m.topic ||
              m.weakTopic ||
              m.concept ||
              m.skill ||
              m.questionTopic ||
              null
          )
          .filter(Boolean)
      ),
    ];

    // FIX: measure actual time spent in the module (in seconds) instead of
    // hardcoding 0, so teacher analytics can report real average time spent.
    const completionTimeSeconds = Math.max(
      0,
      Math.round((Date.now() - sessionStartRef.current) / 1000)
    );

    const success = await saveProgressToBackend({
      moduleId: parsedId,
      moduleTitle: moduleData.module_title || `Module ${parsedId}`,
      gameId: `module-${parsedId}`,
      score: accuracy,
      accuracy,
      mistakes: mistakeLog.length,
      completionTime: completionTimeSeconds,
      stars: finalPoints >= 80 ? 3 : finalPoints >= 50 ? 2 : 1,
      rewardPoints: finalPoints,
      completed: true,
      weakTopics,
      playedAt: new Date(),
    });

    setIsSavingFinal(false);

    if (!success) {
      // Backend save failed — do NOT mark the module complete locally.
      // Leave the student on the final-challenge screen so they can retry
      // by clicking "Complete Module" again.
      setSaveError(true);
      return;
    }

    // Only now, with a confirmed backend save, do we award points locally,
    // mark the module truly complete, and advance the phase.
    setTotalPoints(finalPoints);
    setBackendSaveConfirmed(true);
    transitionTo(() => setCurrentPhase("module_complete"));
  };

  // ── Early returns ─────────────────────────────────────────────────────────
  if (isInvalidId) {
    return (
      <ModuleErrorScreen
        moduleId={moduleId}
        onBack={() => navigate("/dashboard")}
      />
    );
  }

  if (dataLoading) return <ModuleLoadingScreen />;

  if (dataError || !moduleData) {
    return (
      <ModuleErrorScreen
        moduleId={moduleId}
        onBack={() => navigate("/dashboard")}
      />
    );
  }

  if (currentPhase === "module_complete") {
    return (
      <ModuleCompleteScreen
        moduleId={parsedId}
        moduleTitle={moduleData.module_title}
        onPlayGame={() => navigate(`/module/${moduleId}/game`)}
        onDashboard={() => navigate("/dashboard")}
      />
    );
  }

  const screens = moduleData.screens || [];
  const totalScreens = moduleData.total_screens || screens.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`module-page ${
        isTransitioning ? "mp-fade-out" : "mp-fade-in"
      }`}
    >
      {/* Back button */}
      <button className="mp-back-btn" onClick={() => navigate("/dashboard")}>
        ← Dashboard
      </button>

      <ProgressBar
        current={currentScreenIndex}
        total={totalScreens}
        screens={screens}
        totalPoints={totalPoints}
        currentPhase={currentPhase}
        moduleTitle={moduleData.module_title}
      />

      {/* Module header breadcrumb */}
      {currentScreen && (
        <div className="module-header">
          <div className="module-breadcrumb">
            <span className="module-badge">{moduleData.module_title}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="screen-title-badge">{currentScreen.title}</span>
            <span className="phase-pill">
              {currentPhase === "story"
                ? "📖 Story"
                : currentPhase === "quiz"
                ? "📝 Quiz"
                : "🏆 Final"}
            </span>
          </div>

          {currentScreen.objective && (
            <p className="screen-objective">{currentScreen.objective}</p>
          )}
        </div>
      )}

      {currentPhase === "story" && currentScreen && (
        <StoryCard screenData={currentScreen} onComplete={handleStoryComplete} />
      )}

      {currentPhase === "quiz" && currentScreen && (
        <QuizCard
          screenData={currentScreen}
          onComplete={handleQuizComplete}
          onAnswerLogged={handleAnswerLogged}
        />
      )}

      {currentPhase === "final_challenge" && (
        <FinalChallengePlaceholder
          challengeData={moduleData.final_challenge}
          totalPoints={totalPoints}
          mistakeLog={mistakeLog}
          completionBadge={moduleData.module_rewards?.completion_badge}
          completionPoints={moduleData.module_rewards?.completion_points || 0}
          onComplete={handleFinalChallengeComplete}
          isSaving={isSavingFinal}
          saveError={saveError}
        />
      )}

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