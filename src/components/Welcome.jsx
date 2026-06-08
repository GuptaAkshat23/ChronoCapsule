import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0); // 0=icon, 1=text, 2=fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => navigate("/auth"), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  return (
    <div className={`welcome-root ${phase === 2 ? "fade-out" : ""}`}>
      {/* Background orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      {/* Content */}
      <div className="welcome-content">
        <div className={`seal ${phase >= 0 ? "seal-in" : ""}`}>🕰️</div>
        <h1 className={`welcome-title ${phase >= 1 ? "text-in" : ""}`}>
          ChronoCapsule
        </h1>
        <p className={`welcome-sub ${phase >= 1 ? "text-in delay-1" : ""}`}>
          Preserve moments · Unlock futures
        </p>

        {/* Progress bar */}
        <div className={`progress-wrap ${phase >= 1 ? "text-in delay-2" : ""}`}>
          <div className="progress-bar" />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .welcome-root {
          position: fixed; inset: 0;
          background: #0a0805;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          transition: opacity .5s ease;
        }
        .welcome-root.fade-out { opacity: 0; }

        /* Orbs */
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
          animation: pulse 6s ease-in-out infinite;
        }
        .orb1 { width: 400px; height: 400px; background: #6a3e08; opacity: .25; top: -100px; right: -80px; animation-delay: 0s; }
        .orb2 { width: 300px; height: 300px; background: #3a2006; opacity: .3; bottom: -60px; left: -60px; animation-delay: 2s; }
        .orb3 { width: 200px; height: 200px; background: #c4922a; opacity: .07; top: 50%; left: 50%; transform: translate(-50%,-50%); animation-delay: 1s; }
        @keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }

        /* Content */
        .welcome-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; align-items: center;
          gap: 16px;
        }

        .seal {
          font-size: 4rem; line-height: 1;
          opacity: 0; transform: scale(.6) rotate(-12deg);
          transition: opacity .6s cubic-bezier(.34,1.56,.64,1), transform .6s cubic-bezier(.34,1.56,.64,1);
        }
        .seal.seal-in { opacity: 1; transform: scale(1) rotate(0deg); }

        .welcome-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.2rem, 6vw, 3.5rem);
          font-weight: 700; color: #e8d5a3;
          letter-spacing: -.02em; line-height: 1;
          opacity: 0; transform: translateY(14px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .welcome-sub {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300; font-size: 1rem;
          color: #5a4e2a; letter-spacing: .12em; text-transform: uppercase;
          opacity: 0; transform: translateY(10px);
          transition: opacity .5s ease .1s, transform .5s ease .1s;
        }
        .text-in { opacity: 1 !important; transform: translateY(0) !important; }
        .delay-1 { transition-delay: .15s !important; }
        .delay-2 { transition-delay: .3s !important; }

        .progress-wrap {
          width: 120px; height: 2px;
          background: #1e1a0e; border-radius: 2px;
          overflow: hidden; margin-top: 8px;
          opacity: 0; transform: translateY(6px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #c4922a, #e8c060);
          border-radius: 2px;
          animation: fillBar 2s ease forwards .4s;
          width: 0;
        }
        @keyframes fillBar { to { width: 100% } }
      `}</style>
    </div>
  );
}
