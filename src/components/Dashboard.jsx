import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection, query, where, onSnapshot,
  doc, deleteDoc, getDoc,
} from "firebase/firestore";

export default function Dashboard({ user }) {
  const [ownedCapsules, setOwnedCapsules] = useState([]);
  const [sharedCapsules, setSharedCapsules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // capsule id

  /* ── Fetch username ── */
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      setUsername(snap.exists() ? snap.data().username : user.email);
    });
  }, [user]);

  /* ── Real-time capsule listeners ── */
  useEffect(() => {
    if (!user?.uid) { setIsLoading(false); return; }

    const q1 = query(collection(db, "capsules"), where("creatorId", "==", user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      setOwnedCapsules(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    });

    const q2 = query(collection(db, "capsules"), where("collaboratorEmails", "array-contains", user.email));
    const unsub2 = onSnapshot(q2, (snap) => {
      setSharedCapsules(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "capsules", id));
    } catch {
      alert("Couldn't delete capsule. Try again.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const allCapsules = useMemo(() => {
    const combined = [...ownedCapsules, ...sharedCapsules];
    const unique = Array.from(new Map(combined.map((c) => [c.id, c])).values());
    return unique.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [ownedCapsules, sharedCapsules]);

  const now = new Date();
  const openCount = allCapsules.filter((c) => c.openDate.toDate() <= now).length;
  const sealedCount = allCapsules.length - openCount;

  return (
    <div className="dash-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .dash-root {
          max-width: 1100px; margin: 0 auto;
          padding: 32px 24px 80px;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Hero greeting ── */
        .dash-hero {
          margin-bottom: 40px;
          padding: 36px 40px;
          background: linear-gradient(135deg, #131009 0%, #0f0d08 100%);
          border: 1px solid #2a2010; border-radius: 20px;
          position: relative; overflow: hidden;
        }
        .dash-hero::before {
          content: ''; position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle, rgba(196,146,42,.12), transparent 70%);
          pointer-events: none;
        }
        .dash-greeting {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem; color: #e8d5a3; font-weight: 700;
          margin-bottom: 6px;
        }
        .dash-greeting .highlight { color: #c4922a; }
        .dash-sub { color: #5a4e2a; font-size: .9rem; }

        /* ── Stats row ── */
        .stats-row {
          display: flex; gap: 16px; margin-bottom: 36px; flex-wrap: wrap;
        }
        .stat-card {
          flex: 1; min-width: 130px;
          background: #131009; border: 1px solid #2a2010; border-radius: 14px;
          padding: 20px 22px;
        }
        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 2rem; color: #c4922a; font-weight: 700; line-height: 1;
          margin-bottom: 4px;
        }
        .stat-label { color: #5a4e2a; font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; }

        /* ── Section header ── */
        .section-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem; color: #e8d5a3;
        }
        .btn-new {
          display: flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #c4922a, #a67820);
          color: #0a0805; font-weight: 700; font-size: .88rem;
          border-radius: 10px; padding: 10px 18px;
          border: none; cursor: pointer;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          letter-spacing: .03em; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(196,146,42,.25);
          text-decoration: none;
        }
        .btn-new:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(196,146,42,.35); }

        /* ── Capsule grid ── */
        .capsule-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .capsule-card {
          background: #131009; border: 1px solid #2a2010;
          border-radius: 16px; overflow: hidden;
          transition: border-color .25s, transform .25s, box-shadow .25s;
          display: flex; flex-direction: column;
          animation: cardIn .4s ease both;
        }
        .capsule-card:hover {
          border-color: #4a3a1a; transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(0,0,0,.5);
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(12px) }
          to { opacity:1; transform:translateY(0) }
        }

        .card-body { padding: 24px; flex: 1; }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem; color: #e8d5a3; font-weight: 600;
          line-height: 1.3; word-break: break-word;
          flex: 1; margin-right: 10px;
        }
        .badge {
          font-size: .72rem; font-weight: 600; letter-spacing: .05em;
          padding: 3px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0;
        }
        .badge-shared { background: #1e1a10; border: 1px solid #3a2e18; color: #7a6a3a; }
        .badge-open { background: rgba(80,200,100,.1); border: 1px solid rgba(80,200,100,.2); color: #5ac870; }
        .badge-sealed { background: rgba(196,146,42,.08); border: 1px solid rgba(196,146,42,.15); color: #c4922a; }

        .card-creator { color: #4a3e20; font-size: .82rem; margin-bottom: 16px; }
        .card-creator strong { color: #6a5a30; }

        .card-date {
          display: flex; align-items: center; gap: 8px;
          font-size: .85rem; padding: 10px 14px; border-radius: 10px;
        }
        .card-date.open { background: rgba(80,200,100,.07); color: #5ac870; }
        .card-date.sealed { background: rgba(196,146,42,.07); color: #9a7830; }
        .date-icon { font-size: 1rem; }

        /* Thumbnail strip */
        .thumb-strip {
          display: flex; gap: 6px; padding: 0 24px 16px; overflow-x: auto;
          scrollbar-width: none;
        }
        .thumb-strip::-webkit-scrollbar { display: none; }
        .thumb-img {
          width: 52px; height: 52px; border-radius: 8px; object-fit: cover;
          border: 1px solid #2a2010; flex-shrink: 0;
        }
        .thumb-more {
          width: 52px; height: 52px; border-radius: 8px;
          background: #1a1510; border: 1px solid #2a2010;
          display: flex; align-items: center; justify-content: center;
          color: #5a4e2a; font-size: .75rem; font-weight: 600; flex-shrink: 0;
        }

        .card-actions {
          padding: 16px 24px; background: #0f0d08;
          border-top: 1px solid #1e1a0e;
          display: flex; gap: 10px;
        }
        .btn-card {
          flex: 1; text-align: center; font-size: .85rem; font-weight: 600;
          padding: 10px; border-radius: 8px; cursor: pointer; border: none;
          transition: opacity .2s, transform .15s;
          font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 5px;
          text-decoration: none;
        }
        .btn-card:hover { opacity: .85; transform: translateY(-1px); }
        .btn-open { background: rgba(80,200,100,.12); color: #5ac870; border: 1px solid rgba(80,200,100,.2); }
        .btn-delete { background: rgba(220,60,60,.08); color: #e05050; border: 1px solid rgba(220,60,60,.15); }
        .btn-waiting {
          flex: 1; text-align: center; font-size: .82rem; color: #3a3018;
          padding: 10px; border-radius: 8px; background: #0a0805;
          border: 1px solid #1a1510; cursor: default;
        }

        /* Empty state */
        .empty-state {
          text-align: center; padding: 80px 24px;
          background: #131009; border: 1px dashed #2a2010;
          border-radius: 20px;
        }
        .empty-icon { font-size: 3.5rem; margin-bottom: 20px; opacity: .5; }
        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem; color: #5a4e2a; margin-bottom: 8px;
        }
        .empty-sub { color: #3a3018; font-size: .9rem; margin-bottom: 28px; }

        /* Delete confirm modal */
        .delete-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; backdrop-filter: blur(4px);
        }
        .delete-modal {
          background: #1a1510; border: 1px solid #3a2e18;
          border-radius: 16px; padding: 36px 32px; width: 100%; max-width: 380px;
          text-align: center; animation: scaleIn .25s ease;
        }
        @keyframes scaleIn { from { opacity:0; transform:scale(.94) } }
        .delete-modal h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem; color: #e8d5a3; margin-bottom: 10px;
        }
        .delete-modal p { color: #5a4e2a; font-size: .88rem; margin-bottom: 28px; line-height: 1.6; }
        .delete-modal-actions { display: flex; gap: 12px; }
        .btn-cancel {
          flex: 1; padding: 12px; border-radius: 8px;
          border: 1px solid #2a2010; background: transparent;
          color: #6a5a34; font-size: .9rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: color .2s, border-color .2s;
        }
        .btn-cancel:hover { color: #e8d5a3; border-color: #5a4a28; }
        .btn-confirm-delete {
          flex: 1; padding: 12px; border-radius: 8px;
          border: none; background: rgba(220,60,60,.15);
          color: #e05050; font-size: .9rem; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; border: 1px solid rgba(220,60,60,.2);
          transition: background .2s;
        }
        .btn-confirm-delete:hover { background: rgba(220,60,60,.25); }

        .loading-row {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          padding: 60px; color: #4a3e20; font-size: .9rem;
        }
        .mini-spinner {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid #2a2010; border-top-color: #c4922a;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Hero */}
      <div className="dash-hero">
        <h1 className="dash-greeting">
          Welcome back, <span className="highlight">{username || "…"}</span>
        </h1>
        <p className="dash-sub">Your vault of memories awaits.</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{allCapsules.length}</div>
          <div className="stat-label">Total Capsules</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{openCount}</div>
          <div className="stat-label">Ready to Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sealedCount}</div>
          <div className="stat-label">Still Sealed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sharedCapsules.length}</div>
          <div className="stat-label">Shared With You</div>
        </div>
      </div>

      {/* Section header */}
      <div className="section-header">
        <h2 className="section-title">My Capsules</h2>
        <Link to="/create-capsule" className="btn-new">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          New Capsule
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="loading-row">
          <div className="mini-spinner" /> Loading your capsules…
        </div>
      ) : allCapsules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3 className="empty-title">Your vault is empty</h3>
          <p className="empty-sub">Seal your first memory and unlock it in the future.</p>
          <Link to="/create-capsule" className="btn-new" style={{ display: "inline-flex" }}>
            Create Your First Capsule
          </Link>
        </div>
      ) : (
        <div className="capsule-grid">
          {allCapsules.map((capsule, i) => {
            const isOpen = capsule.openDate.toDate() <= now;
            const isOwner = capsule.creatorId === user.uid;
            const thumbs = (capsule.mediaUrls || []).slice(0, 3);
            const extra = (capsule.mediaUrls || []).length - 3;

            return (
              <div
                key={capsule.id}
                className="capsule-card"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="card-body">
                  <div className="card-top">
                    <h3 className="card-title">{capsule.title}</h3>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {!isOwner && <span className="badge badge-shared">Shared</span>}
                      <span className={`badge ${isOpen ? "badge-open" : "badge-sealed"}`}>
                        {isOpen ? "Unlocked" : "Sealed"}
                      </span>
                    </div>
                  </div>

                  <p className="card-creator">
                    By <strong>{isOwner ? "You" : (capsule.creatorUsername || capsule.creatorEmail)}</strong>
                  </p>

                  <div className={`card-date ${isOpen ? "open" : "sealed"}`}>
                    <span className="date-icon">{isOpen ? "🔓" : "🔒"}</span>
                    {isOpen
                      ? "Available to open!"
                      : `Opens ${capsule.openDate.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    }
                  </div>
                </div>

                {/* Thumbnail strip */}
                {thumbs.length > 0 && (
                  <div className="thumb-strip">
                    {thumbs.map((url, j) => (
                      <img key={j} src={url} alt="" className="thumb-img" />
                    ))}
                    {extra > 0 && <div className="thumb-more">+{extra}</div>}
                  </div>
                )}

                <div className="card-actions">
                  {isOpen ? (
                    <Link to={`/capsule/${capsule.id}`} className="btn-card btn-open">
                      <span>🔓</span> Open Capsule
                    </Link>
                  ) : (
                    <span className="btn-waiting">⏳ Not yet…</span>
                  )}
                  {isOwner && (
                    <button onClick={() => setDeleteConfirm(capsule.id)} className="btn-card btn-delete">
                      <span>🗑</span> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this capsule?</h3>
            <p>This action is permanent and cannot be undone. All contents will be lost forever.</p>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deleteConfirm)}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
