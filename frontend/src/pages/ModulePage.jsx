// frontend/src/pages/ModulePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import module1Data from "../data/modules/module1.json";
import StoryCard from "../components/learning/StoryCard";
import QuizCard from "../components/learning/QuizCard";
import ProgressBar from "../components/common/ProgressBar";
import RewardPopup from "../components/common/RewardPopup";
import FinalChallengePlaceholder from "../components/games/FinalChallengePlaceholder";
import "./ModulePage.css";

const ModulePage = () => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("story"); // "story" | "quiz" | "final_challenge"
  const [totalPoints, setTotalPoints] = useState(0);
  const [mistakeLog, setMistakeLog] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reward popup state
  const [showReward, setShowReward] = useState(false);
  const [pendingReward, setPendingReward] = useState(null);

  const moduleData = module1Data;
  const currentScreen = moduleData.screens[currentScreenIndex];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentScreenIndex, currentPhase]);

  // Transition helper: fade out → update state → fade in
  const transitionTo = useCallback((fn) => {
    setIsTransitioning(true);
    setTimeout(() => {
      fn();
      setIsTransitioning(false);
    }, 380);
  }, []);

  const handleStoryComplete = useCallback(() => {
    if (currentScreen.quiz_questions?.length > 0) {
      transitionTo(() => setCurrentPhase("quiz"));
    } else {
      // Screen has no quiz — award points and advance directly
      const reward = currentScreen.reward;
      setPendingReward({
        badge: reward?.badge || null,
        points: reward?.screen_completion_points || 0,
        quizScore: null,
        totalQuizPoints: 0,
      });
      setShowReward(true);
    }
  }, [currentScreen, transitionTo]);

  const handleQuizComplete = useCallback((quizScore, totalQuizPoints) => {
    const reward = currentScreen.reward;
    setPendingReward({
      badge: reward?.badge || null,
      points: reward?.screen_completion_points || 0,
      quizScore,
      totalQuizPoints,
    });
    setShowReward(true);
  }, [currentScreen]);

  const handleRewardClose = useCallback(() => {
    setShowReward(false);
    const earnedPoints = currentScreen.reward?.screen_completion_points || 0;
    setTotalPoints((prev) => prev + earnedPoints);

    transitionTo(() => {
      if (currentScreenIndex < moduleData.screens.length - 1) {
        setCurrentScreenIndex((prev) => prev + 1);
        setCurrentPhase("story");
      } else {
        setCurrentPhase("final_challenge");
      }
    });
  }, [currentScreen, currentScreenIndex, moduleData.screens.length, transitionTo]);

  const handleAnswerLogged = useCallback((answerData) => {
    if (!answerData.isCorrect) {
      setMistakeLog((prev) => [...prev, answerData]);
    }
  }, []);

  const handleFinalChallengeComplete = useCallback(() => {
    const finalTotal = totalPoints + moduleData.module_rewards.completion_points;
    alert(
      `🎉 Module Complete!\n\nTotal Points: ${finalTotal}\nBadge Earned: ${moduleData.module_rewards.completion_badge}`
    );
  }, [totalPoints, moduleData.module_rewards]);

  const progressCurrent =
    currentPhase === "final_challenge"
      ? moduleData.total_screens
      : currentScreenIndex;

  const isFinalChallenge = currentPhase === "final_challenge";

  return (
    <div className={`module-page ${isTransitioning ? "mp-fade-out" : "mp-fade-in"}`}>
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
            <span className="phase-pill phase-pill--{currentPhase}">
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
          completionBadge={moduleData.module_rewards.completion_badge}
          completionPoints={moduleData.module_rewards.completion_points}
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