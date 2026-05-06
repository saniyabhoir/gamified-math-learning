// frontend/src/pages/auth/Register.jsx
// Uses the same LoginPage.css design system — no new styles needed.
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerAPI } from "../../services/authService";
import "../../pages/LoginPage.css";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:     "",
    email:    "",
    password: "",
    role:     "student",
  });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await registerAPI({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     form.role,
      });

      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-stars">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="lp-star" style={{ "--i": i }} />
        ))}
      </div>

      <div className="lp-card">
        <div className="lp-brand">
          <div className="lp-logo">🧮</div>
          <h1 className="lp-title">Join MathQuest</h1>
          <p className="lp-subtitle">Create your free account</p>
        </div>

        <form className="lp-form" onSubmit={handleSubmit} noValidate>
          <div className="lp-field">
            <label className="lp-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              className="lp-input"
              type="text"
              name="name"
              placeholder="Arjun Sharma"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              disabled={loading}
            />
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="lp-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="lp-input"
              type="password"
              name="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="role">I am a…</label>
            <select
              id="role"
              name="role"
              className="lp-input"
              value={form.role}
              onChange={handleChange}
              disabled={loading}
              style={{ cursor: "pointer" }}
            >
              <option value="student">🎓 Student</option>
              <option value="teacher">📚 Teacher</option>
            </select>
          </div>

          {error && (
            <p className="lp-error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p
              className="lp-error"
              role="status"
              style={{
                color:       "#4ade80",
                background:  "rgba(74,222,128,0.08)",
                borderColor: "rgba(74,222,128,0.2)",
              }}
            >
              {success}
            </p>
          )}

          <button className="lp-btn" type="submit" disabled={loading}>
            {loading ? <span className="lp-spinner" /> : "Create Account →"}
          </button>
        </form>

        <p className="lp-hint">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#e8a838", fontWeight: 700, textDecoration: "none" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

