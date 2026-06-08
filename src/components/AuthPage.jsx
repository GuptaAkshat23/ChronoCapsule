import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import UsernameSetup from "./UsernameSetup";

/* ─── Rate-limit helper (client-side guard) ─────────────────────── */
const attempts = {};
function isRateLimited(key, maxAttempts = 5, windowMs = 60_000) {
  const now = Date.now();
  if (!attempts[key]) attempts[key] = [];
  attempts[key] = attempts[key].filter((t) => now - t < windowMs);
  if (attempts[key].length >= maxAttempts) return true;
  attempts[key].push(now);
  return false;
}

/* ─── Input sanitiser ───────────────────────────────────────────── */
const sanitizeUsername = (v) => v.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24);

export default function AuthPage() {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleNeedsUsername, setGoogleNeedsUsername] = useState(false);

  const navigate = useNavigate();

  /* ── Friendly error messages ── */
  const friendly = (code) =>
    ({
      "auth/user-not-found": "No account found with that email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/popup-closed-by-user": "Sign-in popup was closed. Try again.",
    }[code] || "Something went wrong. Please try again.");

  /* ── Email login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isRateLimited(email)) {
      setError("Too many login attempts. Please wait a minute.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(friendly(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Email sign-up ── */
  const handleSignUp = async (e) => {
    e.preventDefault();
    const clean = sanitizeUsername(username);
    if (clean.length < 3) {
      setError("Username must be at least 3 characters (letters, numbers, underscores).");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      // Username uniqueness check
      const q = query(collection(db, "users"), where("username", "==", clean));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError("That username is taken. Please choose another.");
        setIsLoading(false);
        return;
      }

      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: clean,
        email: user.email,
        createdAt: new Date(),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(friendly(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Google sign-in ── */
  const handleGoogle = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      // Check if user doc exists (returning user)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        navigate("/dashboard");
      } else {
        // New Google user — needs username
        setGoogleNeedsUsername(true);
      }
    } catch (err) {
      setError(friendly(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameComplete = () => navigate("/dashboard");

  const switchTab = (t) => {
    setTab(t);
    setError(null);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  return (
    <>
      {googleNeedsUsername && <UsernameSetup onComplete={handleUsernameComplete} />}

      <div className="auth-root">
        {/* Left panel — branding */}
        <aside className="auth-brand">
          <div className="brand-content">
            <div className="brand-seal">🕰️</div>
            <h1 className="brand-name">ChronoCapsule</h1>
            <p className="brand-tagline">Preserve moments.<br />Unlock futures.</p>
            <ul className="brand-features">
              <li><span className="feat-dot" />Lock memories until a chosen date</li>
              <li><span className="feat-dot" />Share with friends & family</li>
              <li><span className="feat-dot" />Photos, videos &amp; messages</li>
            </ul>
          </div>
          <div className="brand-ornament" aria-hidden="true">
            <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
          </div>
        </aside>

        {/* Right panel — form */}
        <main className="auth-form-panel">
          <div className="auth-card">
            {/* Tab switcher */}
            <div className="tab-row">
              <button
                className={`tab-btn ${tab === "login" ? "active" : ""}`}
                onClick={() => switchTab("login")}
              >
                Sign In
              </button>
              <button
                className={`tab-btn ${tab === "signup" ? "active" : ""}`}
                onClick={() => switchTab("signup")}
              >
                Create Account
              </button>
              <div className={`tab-slider ${tab === "signup" ? "right" : ""}`} />
            </div>

            {error && (
              <div className="error-box" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form
              onSubmit={tab === "login" ? handleLogin : handleSignUp}
              className="form-body"
              noValidate
            >
              {tab === "signup" && (
                <div className="field-group">
                  <label className="field-label" htmlFor="username">Username</label>
                  <div className="input-wrap">
                    <span className="input-icon">@</span>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                      placeholder="your_username"
                      maxLength={24}
                      required
                      className="field-input icon-left"
                      autoComplete="username"
                    />
                  </div>
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="email">Email</label>
                <div className="input-wrap">
                  <span className="input-icon icon-svg">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="field-input icon-left"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="input-wrap">
                  <span className="input-icon icon-svg">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === "signup" ? "Min. 6 characters" : "Your password"}
                    required
                    minLength={6}
                    className="field-input icon-left icon-right"
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-submit">
                {isLoading ? (
                  <span className="spinner-row"><span className="spinner" />{tab === "login" ? "Signing in…" : "Creating account…"}</span>
                ) : (
                  tab === "login" ? "Sign In" : "Create Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider"><span>or</span></div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="btn-google"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="auth-footer">
              By continuing, you agree to our{" "}
              <a href="#terms" className="text-link">Terms</a> &amp;{" "}
              <a href="#privacy" className="text-link">Privacy Policy</a>.
            </p>
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh; display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0d0b07;
        }

        /* ── Left brand ── */
        .auth-brand {
          position: relative; overflow: hidden;
          flex: 0 0 420px; display: flex; align-items: center;
          background: linear-gradient(160deg, #1a1409 0%, #0f0c06 60%, #1c1508 100%);
          border-right: 1px solid #2a2010;
          padding: 60px 48px;
        }
        @media (max-width: 768px) { .auth-brand { display: none; } }

        .brand-content { position: relative; z-index: 2; }
        .brand-seal { font-size: 3rem; margin-bottom: 24px; display: block; }
        .brand-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.4rem; font-weight: 700;
          color: #e8d5a3; line-height: 1.1; margin-bottom: 14px;
        }
        .brand-tagline {
          color: #7a6a42; font-size: 1.05rem; line-height: 1.7;
          margin-bottom: 40px; font-weight: 300;
        }
        .brand-features { list-style: none; display: flex; flex-direction: column; gap: 14px; }
        .brand-features li {
          display: flex; align-items: center; gap: 10px;
          color: #6a5a34; font-size: .9rem;
        }
        .feat-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #c4922a; flex-shrink: 0;
        }

        /* Orbs */
        .brand-ornament { position: absolute; inset: 0; pointer-events: none; }
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(60px); opacity: .35;
        }
        .orb1 { width: 280px; height: 280px; background: #7a5010; top: -80px; right: -60px; }
        .orb2 { width: 200px; height: 200px; background: #3a2808; bottom: 40px; left: -40px; }
        .orb3 { width: 140px; height: 140px; background: #c4922a; bottom: 160px; right: 30px; opacity: .15; }

        /* ── Right form ── */
        .auth-form-panel {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
          background: #0d0b07;
        }
        .auth-card {
          width: 100%; max-width: 420px;
          background: #131009;
          border: 1px solid #2a2010;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 24px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(212,168,84,.08);
          animation: cardIn .4s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes cardIn { from { opacity:0; transform:translateY(18px) scale(.97) } }

        /* Tabs */
        .tab-row {
          position: relative; display: flex;
          background: #0a0805; border-radius: 10px; padding: 4px;
          margin-bottom: 28px;
        }
        .tab-btn {
          position: relative; z-index: 1; flex: 1;
          background: transparent; border: none;
          color: #5a4e30; font-size: .9rem; font-weight: 500;
          padding: 10px; border-radius: 7px; cursor: pointer;
          transition: color .25s;
          font-family: 'DM Sans', sans-serif;
        }
        .tab-btn.active { color: #e8d5a3; }
        .tab-slider {
          position: absolute; top: 4px; bottom: 4px; left: 4px;
          width: calc(50% - 4px);
          background: linear-gradient(135deg, #1e1810 0%, #18140c 100%);
          border: 1px solid #3a2e18;
          border-radius: 7px; transition: transform .25s cubic-bezier(.4,0,.2,1);
        }
        .tab-slider.right { transform: translateX(calc(100% + 4px)); }

        /* Error */
        .error-box {
          display: flex; align-items: center; gap: 8px;
          background: rgba(220,60,60,.1); border: 1px solid rgba(220,60,60,.25);
          color: #f08080; border-radius: 10px; padding: 11px 14px;
          font-size: .85rem; margin-bottom: 18px;
          animation: shakeX .4s ease;
        }
        @keyframes shakeX {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }

        /* Form */
        .form-body { display: flex; flex-direction: column; gap: 18px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label { color: #7a6a42; font-size: .82rem; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; }

        .input-wrap { position: relative; display: flex; align-items: center; }
        .input-icon {
          position: absolute; left: 13px; z-index: 1;
          color: #4a3e22; line-height: 1;
          font-size: .95rem; font-weight: 600;
          display: flex; align-items: center;
          pointer-events: none;
        }
        .icon-svg { left: 12px; }

        .field-input {
          width: 100%;
          background: #080704; border: 1px solid #2a2010;
          border-radius: 10px; padding: 13px 14px;
          color: #e8d5a3; font-size: .95rem;
          font-family: 'DM Sans', sans-serif;
          transition: border-color .2s, box-shadow .2s; outline: none;
        }
        .field-input::placeholder { color: #3a3018; }
        .field-input.icon-left { padding-left: 38px; }
        .field-input.icon-right { padding-right: 40px; }
        .field-input:focus {
          border-color: #c4922a;
          box-shadow: 0 0 0 3px rgba(196,146,42,.14);
        }

        .toggle-pass {
          position: absolute; right: 12px;
          background: transparent; border: none; cursor: pointer;
          color: #4a3e22; display: flex; align-items: center;
          padding: 4px; transition: color .2s;
        }
        .toggle-pass:hover { color: #c4922a; }

        /* Submit */
        .btn-submit {
          margin-top: 4px;
          background: linear-gradient(135deg, #c4922a 0%, #a67820 100%);
          color: #0a0805; font-weight: 700; font-size: .95rem;
          border: none; border-radius: 10px; padding: 14px;
          cursor: pointer; transition: opacity .2s, transform .15s, box-shadow .2s;
          letter-spacing: .03em; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(196,146,42,.3);
        }
        .btn-submit:hover:not(:disabled) {
          opacity: .92; transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(196,146,42,.4);
        }
        .btn-submit:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

        .spinner-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(10,8,5,.3); border-top-color: #0a0805;
          animation: spin .7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 24px 0; color: #3a3018; font-size: .8rem;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: #2a2010;
        }

        /* Google */
        .btn-google {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #1a1610; border: 1px solid #3a2e18;
          color: #b09060; font-size: .92rem; font-weight: 500;
          border-radius: 10px; padding: 13px;
          cursor: pointer; transition: background .2s, border-color .2s, color .2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-google:hover:not(:disabled) {
          background: #201c12; border-color: #5a4a28; color: #e8d5a3;
        }
        .btn-google:disabled { opacity: .5; cursor: not-allowed; }

        /* Footer */
        .auth-footer {
          text-align: center; color: #3a3018; font-size: .78rem;
          margin-top: 20px; line-height: 1.6;
        }
        .text-link { color: #6a5a32; text-decoration: none; transition: color .2s; }
        .text-link:hover { color: #c4922a; }
      `}</style>
    </>
  );
}
