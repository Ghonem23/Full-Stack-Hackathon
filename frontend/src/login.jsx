import React, { useState } from "react";
import "./login.css";
import { API_BASE_URL, MODEL_NAME } from "./config";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Activity,
} from "lucide-react";

/* ================================================================
   Design tokens
================================================================ */

const COLORS = {
  blue: "#046DD6",
  cyan: "#0493AE",
  navy: "#0D375D",
  red: "#5D0200",
  dark: "#131116",
};

/* ================================================================
   Mascot
================================================================ */

function DoctorRobot({ className }) {
  return (
    <svg
      viewBox="0 0 300 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of a robot wearing a doctor's coat and stethoscope"
      className={className}
    >
      <defs>
        <linearGradient id="dr-coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d7e4f3" />
        </linearGradient>

        <linearGradient id="dr-shell" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#f7fafe" />
          <stop offset="100%" stopColor="#c3d6ea" />
        </linearGradient>

        <linearGradient id="dr-visor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d375d" />
          <stop offset="100%" stopColor="#08202f" />
        </linearGradient>

        <radialGradient id="dr-halo">
          <stop
            offset="0%"
            stopColor="#45b8cd"
            stopOpacity="0.5"
          />
          <stop
            offset="100%"
            stopColor="#45b8cd"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      {/* Halo */}
      <ellipse
        cx="150"
        cy="165"
        rx="145"
        ry="150"
        fill="url(#dr-halo)"
      />

      {/* Antenna */}
      <path
        d="M150 62V44"
        stroke="#c3d6ea"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <circle
        cx="150"
        cy="32"
        r="13"
        fill="#45b8cd"
        opacity="0.35"
        className="animate-pulse-slow"
      />

      <circle
        cx="150"
        cy="32"
        r="7"
        fill="#0493ae"
      />

      {/* Ears */}
      <rect
        x="72"
        y="96"
        width="16"
        height="38"
        rx="8"
        fill="#c3d6ea"
      />

      <rect
        x="212"
        y="96"
        width="16"
        height="38"
        rx="8"
        fill="#c3d6ea"
      />

      {/* Head */}
      <rect
        x="86"
        y="58"
        width="128"
        height="110"
        rx="38"
        fill="url(#dr-shell)"
      />

      <rect
        x="87"
        y="59"
        width="126"
        height="108"
        rx="37"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="2"
      />

      {/* Face */}
      <rect
        x="99"
        y="78"
        width="102"
        height="70"
        rx="29"
        fill="url(#dr-visor)"
      />

      {/* Eyes */}
      <rect
        x="121"
        y="99"
        width="17"
        height="26"
        rx="8.5"
        fill="#5fdcf2"
      />

      <rect
        x="162"
        y="99"
        width="17"
        height="26"
        rx="8.5"
        fill="#5fdcf2"
      />

      {/* Smile */}
      <path
        d="M133 134q17 11 34 0"
        stroke="#5fdcf2"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Neck */}
      <rect
        x="134"
        y="163"
        width="32"
        height="22"
        rx="9"
        fill="#c3d6ea"
      />

      {/* Doctor coat */}
      <path
        d="M118 187 150 216 182 187c34 15 54 55 54 107v46H64v-46c0-52 20-92 54-107Z"
        fill="url(#dr-coat)"
      />

      {/* Lapels */}
      <path
        d="M118 187 150 216 132 238Z"
        fill="#cbdcee"
      />

      <path
        d="M182 187 150 216 168 238Z"
        fill="#cbdcee"
      />

      {/* Sleeve seams */}
      <path
        d="M108 213c-14 24-22 62-22 127"
        stroke="#c3d6ea"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M192 213c14 24 22 62 22 127"
        stroke="#c3d6ea"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Stethoscope */}
      <path
        d="M126 192c-14 42-4 76 18 88"
        stroke="#0493ae"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M176 192c12 34 8 60 0 74"
        stroke="#0493ae"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <circle
        cx="176"
        cy="272"
        r="6"
        fill="#0493ae"
      />

      <circle
        cx="146"
        cy="292"
        r="15"
        fill="#0493ae"
      />

      <circle
        cx="146"
        cy="292"
        r="7.5"
        fill="#86d3e2"
      />

      {/* Chest badge */}
      <rect
        x="182"
        y="232"
        width="44"
        height="28"
        rx="9"
        fill="#046dd6"
      />

      <path
        d="M190 246h5l3.5-8 4.5 16 3.5-8h11"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================
   Logo
================================================================ */

function Logo({ variant = "light" }) {
  return (
    <div className={`nm-logo nm-logo--${variant}`}>
      <span className="nm-logo-icon">
        <Activity size={16} />
      </span>

      <span className="nm-logo-word">
        {MODEL_NAME}
      </span>
    </div>
  );
}

/* ================================================================
   Helpers
================================================================ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ message }) {
  if (!message) return null;

  return (
    <div className="nm-field-error">
      <AlertCircle size={13} />
      <span>{message}</span>
    </div>
  );
}

/* ================================================================
   Login Form
================================================================ */

function LoginForm({ onForgotPassword, onSuccess, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const validate = () => {
    const next = {};

    if (!email.trim()) {
      next.email = "Enter your email address.";
    } else if (!EMAIL_RE.test(email)) {
      next.email = "Enter a valid email address.";
    }

    if (!password) {
      next.password = "Enter your password.";
    } else if (password.length < 6) {
      next.password =
        "Password must be at least 6 characters.";
    }

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = validate();

    setErrors(next);

    if (Object.keys(next).length > 0) {
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          form: data.error || "Incorrect email or password. Please try again.",
        });
        setStatus("idle");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }

      setStatus("success");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            email: email.trim(),
            remember,
            token: data.token,
            user: data.user,
          });
        }
      }, 1000);
    } catch (err) {
      setErrors({
        form: "Cannot connect to server. Please check your backend connection.",
      });
      setStatus("idle");
    }
  };

  /* ==========================================================
     SUCCESS SCREEN
  ========================================================== */

  if (status === "success") {
    return (
      <div className="nm-state">

        <div className="nm-state-icon nm-state-icon--success">
          <CheckCircle2 size={28} />
        </div>

        <h2 className="nm-state-title">
          Welcome back
        </h2>

        <p className="nm-state-text">
          Signed in successfully.
          Loading your workspace…
        </p>

      </div>
    );
  }

  /* ==========================================================
     LOGIN FORM
  ========================================================== */

  return (
    <form
      className="nm-form"
      onSubmit={handleSubmit}
      noValidate
    >

      {/* FORM ERROR */}

      {errors.form && (
        <div className="nm-banner nm-banner--error">
          <AlertCircle size={15} />

          <span>
            {errors.form}
          </span>
        </div>
      )}

      {/* EMAIL */}

      <div className="nm-field">

        <label
          className="nm-label"
          htmlFor="nm-email"
        >
          Email address
        </label>

        <div
          className={`nm-input-wrap ${
            errors.email
              ? "nm-input-wrap--error"
              : ""
          }`}
        >

          <Mail
            size={17}
            className="nm-input-icon"
          />

          <input
            id="nm-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              if (
                errors.email ||
                errors.form
              ) {
                setErrors((prev) => ({
                  ...prev,
                  email: undefined,
                  form: undefined,
                }));
              }
            }}
            className="nm-input"
          />

        </div>

        <FieldError
          message={errors.email}
        />

      </div>

      {/* PASSWORD */}

      <div className="nm-field">

        <label
          className="nm-label"
          htmlFor="nm-password"
        >
          Password
        </label>

        <div
          className={`nm-input-wrap ${
            errors.password
              ? "nm-input-wrap--error"
              : ""
          }`}
        >

          <Lock
            size={17}
            className="nm-input-icon"
          />

          <input
            id="nm-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);

              if (
                errors.password ||
                errors.form
              ) {
                setErrors((prev) => ({
                  ...prev,
                  password: undefined,
                  form: undefined,
                }));
              }
            }}
            className="nm-input"
          />

          <button
            type="button"
            className="nm-eye-btn"
            onClick={() =>
              setShowPassword(
                (prev) => !prev
              )
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff size={17} />
            ) : (
              <Eye size={17} />
            )}
          </button>

        </div>

        <FieldError
          message={errors.password}
        />

      </div>

      {/* REMEMBER / FORGOT */}

      <div className="nm-row-between">

        <label className="nm-checkbox">

          <input
            type="checkbox"
            checked={remember}
            onChange={(e) =>
              setRemember(
                e.target.checked
              )
            }
          />

          <span className="nm-checkbox-box" />

          <span className="nm-checkbox-label">
            Remember me
          </span>

        </label>

        <button
          type="button"
          className="nm-link-btn"
          onClick={onForgotPassword}
        >
          Forgot password?
        </button>

      </div>

      {/* LOGIN BUTTON */}

      <button
        type="submit"
        className="nm-submit"
        disabled={status === "loading"}
      >

        {status === "loading" ? (
          <>
            <Loader2
              size={17}
              className="nm-spin"
            />

            Signing in…
          </>
        ) : (
          <>
            Sign in

            <ArrowRight size={17} />
          </>
        )}

      </button>

      {/* SIGN UP */}

      <p className="nm-switch">

        Don't have an account?{" "}

        <button
          type="button"
          className="nm-link-btn nm-link-btn--strong"
          onClick={() => {
            if (onNavigate) {
              onNavigate("signup");
            }
          }}
        >
          Sign up
        </button>

      </p>

    </form>
  );
}

/* ================================================================
   Forgot Password
================================================================ */

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setStatus("loading");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to process request. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("success");
    } catch (err) {
      setError("Cannot connect to server. Please try again later.");
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <div className="nm-state">

        <div className="nm-state-icon nm-state-icon--success">
          <CheckCircle2 size={26} />
        </div>

        <h2 className="nm-state-title">
          Check your inbox
        </h2>

        <p className="nm-state-text">
          Password reset instructions have been sent to your
          email.
        </p>

        <button
          type="button"
          className="nm-secondary-btn"
          onClick={onBack}
        >
          <ArrowLeft size={15} />
          Back to sign in
        </button>

      </div>
    );
  }

  return (
    <form
      className="nm-form"
      onSubmit={handleSubmit}
      noValidate
    >

      <button
        type="button"
        className="nm-back-btn"
        onClick={onBack}
      >
        <ArrowLeft size={15} />
        Back to sign in
      </button>

      <div className="nm-form-head">

        <div className="nm-state-icon nm-state-icon--neutral">
          <ShieldCheck size={22} />
        </div>

        <p className="nm-subtitle">
          Enter the email linked to your account and we'll send
          a secure reset link.
        </p>

      </div>

      <div className="nm-field">

        <label
          className="nm-label"
          htmlFor="nm-reset-email"
        >
          Email address
        </label>

        <div
          className={`nm-input-wrap ${
            error
              ? "nm-input-wrap--error"
              : ""
          }`}
        >

          <Mail
            size={16}
            className="nm-input-icon"
          />

          <input
            id="nm-reset-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              if (error) {
                setError("");
              }
            }}
            className="nm-input"
          />

        </div>

        <FieldError message={error} />

      </div>

      <button
        type="submit"
        className="nm-submit"
        disabled={status === "loading"}
      >

        {status === "loading" ? (
          <>
            <Loader2
              size={16}
              className="nm-spin"
            />

            Sending link…
          </>
        ) : (
          <>
            Send reset link
            <ArrowRight size={16} />
          </>
        )}

      </button>

    </form>
  );
}

/* ================================================================
   MAIN LOGIN PAGE
================================================================ */

export default function Login({ onSuccess, onNavigate }) {
  const [view, setView] = useState("login");

  const cardTitle =
    view === "login"
      ? "Welcome back"
      : "Reset your password";

  const cardSubtitle =
    view === "login"
      ? "Sign in to continue exploring evidence-grounded medical insights."
      : null;

  return (
    <div className="nm-page">

      {/* ==========================================================
          LEFT VISUAL SECTION
      ========================================================== */}

      <div className="nm-visual">

        <div className="nm-grid" />
        <div className="nm-glow" />

        <Logo variant="light" />

        <div className="nm-mascot-wrap">
          <DoctorRobot className="nm-mascot" />
        </div>

        <div className="nm-visual-copy">

          <h2 className="nm-visual-title">
            How your mind
            <br />
            shapes your immunity.
          </h2>

          <p className="nm-visual-text">
            Ask about the relationship between depression and
            the immune system, and get an answer drawn from
            published research — in plain language.
          </p>

        </div>

        <svg
          className="nm-wave"
          viewBox="0 0 220 40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points="0,22 30,22 42,8 54,34 66,22 90,22 100,14 112,28 124,22 220,22"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

      </div>

      {/* ==========================================================
          RIGHT PANEL
      ========================================================== */}

      <div className="nm-panel">

        <div className="nm-panel-inner">

          <div className="nm-panel-head">

            <h1 className="nm-title">
              {cardTitle}
            </h1>

            {cardSubtitle && (
              <p className="nm-panel-subtitle">
                {cardSubtitle}
              </p>
            )}

          </div>

          <div className="nm-card">

            {view === "login" ? (

              <LoginForm
                onForgotPassword={() =>
                  setView("forgot")
                }
                onSuccess={onSuccess}
                onNavigate={onNavigate}
              />

            ) : (

              <ForgotPassword
                onBack={() =>
                  setView("login")
                }
              />

            )}

          </div>

        </div>

      </div>

    </div>
  );
}