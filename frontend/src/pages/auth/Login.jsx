// frontend/src/pages/auth/Login.jsx
// Real JWT auth with role-based post-login redirect.
// Reuses LoginPage.css — no style changes needed.
import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { login as loginAPI } from "../../services/authService";
import "../../pages/LoginPage.css";

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const navigate   = useNavigate();
  const location   = useLocation();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginAPI({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Store token + normalised user (login also extracts role from JWT)
      login(data.token, data.user);

      // Role-based redirect:
      //   If the user was trying to visit a specific page, honour that.
      //   Otherwise route by role.
      const from = location.state?.from?.pathname;
      if (from && from !== "/" && from !== "/login") {
        navigate(from, { replace: true });
      } else if (data.user.role === "teacher") {
        navigate("/teacher-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
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
          <div className="lp-logo">⚡</div>
          <h1 className="lp-title">MathQuest</h1>
          <p className="lp-subtitle">Gamified Math Learning</p>
        </div>

        <form className="lp-form" onSubmit={handleSubmit} noValidate>
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
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="lp-error" role="alert">
              {error}
            </p>
          )}

          <button className="lp-btn" type="submit" disabled={loading}>
            {loading ? <span className="lp-spinner" /> : "Enter the Quest →"}
          </button>
        </form>

        <p className="lp-hint">
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "#e8a838", fontWeight: 700, textDecoration: "none" }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
