// frontend/src/pages/LoginPage.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import "./LoginPage.css";

const LoginPage = () => {
  const auth = useContext(AuthContext);

  // ✅ SAFE fallback (prevents crash)
  const login = auth?.login || ((userData) => {
    console.log("Fallback login:", userData);
  });

  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim()) {
      setError("Please enter your username.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      login({
        id: "u1",
        username: form.username.trim(),
        displayName: form.username.trim(),
        avatar: "🧙",
        joinedAt: new Date().toISOString(),
      });

      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="lp-root">
      {/* Stars Background */}
      <div className="lp-stars">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="lp-star" style={{ "--i": i }} />
        ))}
      </div>

      <div className="lp-card">
        {/* Branding */}
        <div className="lp-brand">
          <div className="lp-logo">⚡</div>
          <h1 className="lp-title">MathQuest</h1>
          <p className="lp-subtitle">Gamified Math Learning</p>
        </div>

        {/* Form */}
        <form className="lp-form" onSubmit={handleSubmit}>
          <input
            className="lp-input"
            type="text"
            placeholder="Enter username"
            value={form.username}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, username: e.target.value }))
            }
          />

          <input
            className="lp-input"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />

          {error && <p className="lp-error">{error}</p>}

          <button className="lp-btn" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Enter the Quest →"}
          </button>
        </form>

        <p className="lp-hint">
          Demo: enter any username to continue
        </p>
      </div>
    </div>
  );
};

export default LoginPage;