// frontend/src/components/common/ModuleCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./ModuleCard.css";

const ModuleCard = ({ moduleData = {}, moduleId, progressData = {} }) => {
  const navigate = useNavigate();

  // ✅ SAFE FALLBACKS
  const safeData = {
    module_title: moduleData.module_title || `Module ${moduleId}`,
    module_description:
      moduleData.module_description || "Content coming soon...",
    screens: moduleData.screens || [],
    total_screens: moduleData.total_screens || 0,
    module_rewards: moduleData.module_rewards || {
      completion_points: 0,
      completion_badge: "Locked",
    },
  };

  const totalScreens =
    safeData.total_screens || safeData.screens.length || 0;

  const completedScreens = progressData.completedScreens || 0;

  const progressPct =
    totalScreens > 0
      ? Math.round((completedScreens / totalScreens) * 100)
      : 0;

  const handleClick = () => {
    navigate(`/module/${moduleId}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: "#111827",
        padding: "20px",
        borderRadius: "16px",
        marginBottom: "20px",
        cursor: "pointer",
        color: "white",
      }}
    >
      <h2>{safeData.module_title}</h2>
      <p>{safeData.module_description}</p>

      <div style={{ marginTop: "10px" }}>
        <strong>Progress:</strong> {progressPct}%
      </div>

      <div>
        {completedScreens} / {totalScreens} screens completed
      </div>

      <div style={{ marginTop: "10px", color: "#e8a838" }}>
        Reward: +{safeData.module_rewards.completion_points} XP
      </div>
    </div>
  );
};

export default ModuleCard;