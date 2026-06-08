import React, { useState } from "react";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

function UsernameSetup({ onComplete }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sanitize = (val) => val.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = sanitize(username);
    if (clean.length < 3) {
      setError("Username must be at least 3 characters (letters, numbers, underscores only).");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated.");

      // Check uniqueness
      const q = query(collection(db, "users"), where("username", "==", clean));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError("That username is already taken. Try another.");
        setIsLoading(false);
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: clean,
        email: user.email,
        createdAt: new Date(),
      });

      onComplete(clean);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chrono-overlay">
      <div className="chrono-modal">
        <div className="chrono-modal-inner">
          <div className="seal-icon">🕰️</div>
          <h2 className="modal-title">One last thing</h2>
          <p className="modal-subtitle">
            Choose a username for your capsule vault. You can't change this later.
          </p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="field-wrap">
              <span className="field-prefix">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(sanitize(e.target.value))}
                placeholder="your_username"
                maxLength={24}
                required
                className="field-input prefix-input"
                autoFocus
              />
            </div>
            <p className="field-hint">Letters, numbers, underscores · 3–24 chars</p>

            <button type="submit" disabled={isLoading} className="btn-primary full-width">
              {isLoading ? (
                <span className="spinner-row"><span className="spinner" /> Claiming…</span>
              ) : (
                "Claim Username"
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .chrono-overlay {
          position: fixed; inset: 0;
          background: rgba(10, 8, 5, 0.82);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 999;
          animation: fadeOverlay .25s ease;
        }
        @keyframes fadeOverlay { from { opacity: 0 } to { opacity: 1 } }
        .chrono-modal {
          background: #1a1510;
          border: 1px solid #4a3a20;
          border-radius: 16px;
          padding: 3px;
          width: 100%; max-width: 420px;
          box-shadow: 0 32px 80px rgba(0,0,0,.7), inset 0 1px 0 rgba(212,168,84,.15);
          animation: slideModal .3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes slideModal { from { opacity:0; transform:translateY(20px) scale(.96) } }
        .chrono-modal-inner {
          background: linear-gradient(145deg, #1f1a10 0%, #17130c 100%);
          border-radius: 14px; padding: 40px 36px; text-align: center;
        }
        .seal-icon { font-size: 2.5rem; margin-bottom: 16px; }
        .modal-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.75rem; font-weight: 700;
          color: #e8d5a3; margin: 0 0 8px;
        }
        .modal-subtitle {
          color: #8a7a5a; font-size: .9rem; line-height: 1.6;
          margin: 0 0 28px;
        }
        .error-banner {
          background: rgba(220,60,60,.12); border: 1px solid rgba(220,60,60,.3);
          color: #f08080; border-radius: 8px; padding: 10px 14px;
          font-size: .85rem; margin-bottom: 18px;
        }
        .modal-form { display: flex; flex-direction: column; gap: 10px; }
        .field-wrap { position: relative; display: flex; align-items: center; }
        .field-prefix {
          position: absolute; left: 14px;
          color: #6a5a3a; font-size: 1rem; font-weight: 600;
          pointer-events: none;
        }
        .field-input {
          width: 100%; background: #0d0b07;
          border: 1px solid #3a2e18;
          border-radius: 10px; padding: 13px 14px;
          color: #e8d5a3; font-size: 1rem;
          transition: border-color .2s, box-shadow .2s;
          outline: none; box-sizing: border-box;
        }
        .prefix-input { padding-left: 30px; }
        .field-input:focus {
          border-color: #c4922a;
          box-shadow: 0 0 0 3px rgba(196,146,42,.15);
        }
        .field-hint { color: #5a4e30; font-size: .78rem; text-align: left; margin: 0; }
        .btn-primary {
          background: linear-gradient(135deg, #c4922a 0%, #a67820 100%);
          color: #0d0b07; font-weight: 700; font-size: .95rem;
          border: none; border-radius: 10px; padding: 14px;
          cursor: pointer; transition: opacity .2s, transform .15s;
          letter-spacing: .03em;
        }
        .btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .full-width { width: 100%; }
        .spinner-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(13,11,7,.3); border-top-color: #0d0b07;
          animation: spin .7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

export default UsernameSetup;
