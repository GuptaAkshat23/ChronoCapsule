import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import Welcome from "./components/Welcome";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateCapsule from "./components/CreateCapsule";
import CapsuleView from "./components/CapsuleView";
import Settings from "./components/Settings";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Auth state listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          setUsername(snap.exists() ? snap.data().username : user.email);
        } catch {
          setUsername(user.email);
        }
      } else {
        setUsername("");
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Close mobile nav on route change ── */
  useEffect(() => { setNavOpen(false); }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="load-spinner" />
        <style>{`
          .app-loading {
            min-height: 100vh; background: #0a0805;
            display: flex; align-items: center; justify-content: center;
          }
          .load-spinner {
            width: 36px; height: 36px; border-radius: 50%;
            border: 2px solid #2a2010; border-top-color: #c4922a;
            animation: spin .7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>
      </div>
    );
  }

  const isAuthRoute = location.pathname === "/" || location.pathname === "/auth";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0805; color: #e8d5a3; font-family: 'DM Sans', sans-serif; }
        a { text-decoration: none; }
      `}</style>

      {/* ── Navbar (only when signed in & not on auth pages) ── */}
      {currentUser && !isAuthRoute && (
        <nav className="chrono-nav">
          <div className="nav-inner">
            {/* Logo */}
            <Link to="/dashboard" className="nav-logo">
              <span className="logo-icon">🕰️</span>
              <span className="logo-text">ChronoCapsule</span>
            </Link>

            {/* Desktop links */}
            <div className="nav-links">
              <NavLink to="/dashboard" label="Dashboard" />
              <NavLink to="/create-capsule" label="+ New Capsule" highlight />
              <NavLink to="/settings" label="Settings" />
            </div>

            {/* User chip + logout */}
            <div className="nav-right">
              <div className="user-chip">
                <span className="user-avatar">{username?.[0]?.toUpperCase() || "?"}</span>
                <span className="user-name">{username}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">Sign Out</button>
            </div>

            {/* Mobile hamburger */}
            <button className="hamburger" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle menu">
              {navOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              )}
            </button>
          </div>

          {/* Mobile drawer */}
          {navOpen && (
            <div className="nav-drawer">
              <Link to="/dashboard" className="drawer-link">Dashboard</Link>
              <Link to="/create-capsule" className="drawer-link drawer-highlight">+ New Capsule</Link>
              <Link to="/settings" className="drawer-link">Settings</Link>
              <div className="drawer-divider" />
              <div className="drawer-user">Signed in as <strong>{username}</strong></div>
              <button onClick={handleLogout} className="drawer-logout">Sign Out</button>
            </div>
          )}

          <style>{`
            .chrono-nav {
              position: sticky; top: 0; z-index: 100;
              background: rgba(10, 8, 5, .92);
              backdrop-filter: blur(12px);
              border-bottom: 1px solid #1e1a0e;
            }
            .nav-inner {
              max-width: 1200px; margin: 0 auto;
              padding: 0 24px; height: 60px;
              display: flex; align-items: center; gap: 32px;
            }
            .nav-logo {
              display: flex; align-items: center; gap: 10px;
              font-family: 'Playfair Display', serif;
              font-size: 1.2rem; color: #e8d5a3; flex-shrink: 0;
              transition: opacity .2s;
            }
            .nav-logo:hover { opacity: .8; }
            .logo-icon { font-size: 1.3rem; }
            .logo-text { font-weight: 600; }

            .nav-links { display: flex; align-items: center; gap: 4px; flex: 1; }
            @media (max-width: 700px) { .nav-links, .nav-right { display: none; } }

            .nav-link {
              color: #6a5a34; font-size: .88rem; font-weight: 500;
              padding: 7px 14px; border-radius: 8px;
              transition: color .2s, background .2s;
            }
            .nav-link:hover { color: #e8d5a3; background: #1a1510; }
            .nav-link.active { color: #c4922a; }
            .nav-link-highlight {
              color: #0a0805; font-size: .88rem; font-weight: 700;
              padding: 7px 16px; border-radius: 8px;
              background: linear-gradient(135deg, #c4922a, #a67820);
              transition: opacity .2s, transform .15s;
              letter-spacing: .02em;
            }
            .nav-link-highlight:hover { opacity: .88; transform: translateY(-1px); }

            .nav-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
            .user-chip {
              display: flex; align-items: center; gap: 8px;
              background: #1a1510; border: 1px solid #2a2010;
              border-radius: 20px; padding: 5px 12px 5px 5px;
            }
            .user-avatar {
              width: 26px; height: 26px; border-radius: 50%;
              background: linear-gradient(135deg, #c4922a, #a67820);
              display: flex; align-items: center; justify-content: center;
              font-size: .75rem; font-weight: 700; color: #0a0805; flex-shrink: 0;
            }
            .user-name { color: #8a7a4a; font-size: .82rem; font-weight: 500; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .btn-logout {
              background: transparent; border: 1px solid #2a2010;
              color: #6a5a34; font-size: .82rem; font-weight: 500;
              border-radius: 8px; padding: 7px 14px; cursor: pointer;
              transition: border-color .2s, color .2s;
              font-family: 'DM Sans', sans-serif;
            }
            .btn-logout:hover { border-color: #c4922a; color: #c4922a; }

            /* Hamburger */
            .hamburger {
              display: none; margin-left: auto;
              background: transparent; border: 1px solid #2a2010;
              color: #8a7a4a; border-radius: 8px; padding: 6px 8px;
              cursor: pointer; align-items: center;
            }
            @media (max-width: 700px) { .hamburger { display: flex; } }

            /* Mobile drawer */
            .nav-drawer {
              background: #0f0d08; border-top: 1px solid #1e1a0e;
              padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 4px;
              animation: drawerIn .2s ease;
            }
            @keyframes drawerIn { from { opacity:0; transform:translateY(-8px) } }
            .drawer-link {
              color: #8a7a4a; font-size: .95rem; font-weight: 500;
              padding: 12px 0; border-bottom: 1px solid #1a1510;
              transition: color .2s;
            }
            .drawer-link:hover { color: #e8d5a3; }
            .drawer-highlight { color: #c4922a !important; }
            .drawer-divider { height: 1px; background: #1e1a0e; margin: 8px 0; }
            .drawer-user { color: #4a3e20; font-size: .82rem; padding: 8px 0; }
            .drawer-user strong { color: #6a5a34; }
            .drawer-logout {
              margin-top: 8px; background: transparent; border: 1px solid #2a2010;
              color: #6a5a34; border-radius: 8px; padding: 12px;
              cursor: pointer; font-size: .9rem; font-family: 'DM Sans', sans-serif;
              transition: color .2s, border-color .2s;
            }
            .drawer-logout:hover { color: #c4922a; border-color: #c4922a; }
          `}</style>
        </nav>
      )}

      {/* ── Main content ── */}
      <main style={{ minHeight: currentUser && !isAuthRoute ? "calc(100vh - 60px)" : "100vh" }}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route
            path="/auth"
            element={!currentUser ? <AuthPage /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute currentUser={currentUser}><Dashboard user={currentUser} /></ProtectedRoute>}
          />
          <Route
            path="/create-capsule"
            element={<ProtectedRoute currentUser={currentUser}><CreateCapsule /></ProtectedRoute>}
          />
          <Route
            path="/capsule/:capsuleId"
            element={<ProtectedRoute currentUser={currentUser}><CapsuleView /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute currentUser={currentUser}><Settings /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/"} />} />
        </Routes>
      </main>
    </>
  );
}

/* ── Small NavLink component ── */
function NavLink({ to, label, highlight }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  if (highlight) return <Link to={to} className="nav-link-highlight">{label}</Link>;
  return <Link to={to} className={`nav-link${isActive ? " active" : ""}`}>{label}</Link>;
}
