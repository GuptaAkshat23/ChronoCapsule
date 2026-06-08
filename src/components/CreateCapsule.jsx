import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection, addDoc, Timestamp,
  doc, getDoc, query, where, getDocs,
} from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "dbijv7rqo";
const CLOUDINARY_UPLOAD_PRESET = "chrono_capsule_uploads";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CreateCapsule() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [files, setFiles] = useState([]);
  const [collaborators, setCollaborators] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ step: 0, label: "" }); // 0=idle
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  /* Min date = tomorrow */
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const steps = ["", "Verifying collaborators…", "Uploading memories…", "Sealing the capsule…", "Done ✓"];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setIsLoading(true);

    try {
      /* Step 1 — get creator username */
      setProgress({ step: 1, label: steps[1] });
      const creatorSnap = await getDoc(doc(db, "users", currentUser.uid));
      const creatorUsername = creatorSnap.exists()
        ? creatorSnap.data().username
        : currentUser.email;

      /* Resolve collaborator emails */
      const emails = collaborators
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e !== currentUser.email);

      const collaboratorsData = [];
      if (emails.length) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "in", emails.slice(0, 10))); // Firestore in-query max 10
        const snap = await getDocs(q);
        snap.forEach((d) => collaboratorsData.push({ uid: d.data().uid, email: d.data().email, username: d.data().username }));
      }

      /* Step 2 — upload media */
      setProgress({ step: 2, label: steps[2] });
      let mediaUrls = [];
      if (files.length) {
        const uploads = [...files].map((file) => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          return fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd })
            .then((r) => r.json());
        });
        const results = await Promise.all(uploads);
        mediaUrls = results.filter((r) => r.secure_url).map((r) => r.secure_url);
      }

      /* Step 3 — write to Firestore */
      setProgress({ step: 3, label: steps[3] });
      await addDoc(collection(db, "capsules"), {
        creatorId: currentUser.uid,
        creatorEmail: currentUser.email,
        creatorUsername,
        title: title.trim(),
        message: message.trim(),
        openDate: Timestamp.fromDate(new Date(openDate)),
        mediaUrls,
        createdAt: Timestamp.now(),
        collaboratorEmails: emails,
        collaborators: collaboratorsData,
      });

      setProgress({ step: 4, label: steps[4] });
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setProgress({ step: 0, label: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const fileCount = files.length;
  const filePreviews = fileCount
    ? Array.from(files)
        .slice(0, 4)
        .map((f) => URL.createObjectURL(f))
    : [];

  return (
    <div className="cc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .cc-root {
          max-width: 640px; margin: 0 auto; padding: 36px 24px 80px;
          font-family: 'DM Sans', sans-serif;
        }
        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: #5a4e2a; font-size: .87rem; margin-bottom: 28px;
          transition: color .2s; text-decoration: none;
        }
        .back-link:hover { color: #c4922a; }
        .cc-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem; color: #e8d5a3; font-weight: 700; margin-bottom: 6px;
        }
        .cc-sub { color: #4a3e20; font-size: .9rem; margin-bottom: 32px; }

        .cc-card {
          background: #131009; border: 1px solid #2a2010;
          border-radius: 20px; padding: 36px; margin-bottom: 20px;
        }
        .card-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem; color: #8a7a4a; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }

        .field-group { display: flex; flex-direction: column; gap: 7px; margin-bottom: 22px; }
        .field-label { color: #7a6a42; font-size: .78rem; font-weight: 500; letter-spacing: .05em; text-transform: uppercase; }
        .field-input, .field-textarea {
          width: 100%; background: #080704; border: 1px solid #2a2010;
          border-radius: 10px; padding: 13px 14px; color: #e8d5a3;
          font-size: .95rem; font-family: 'DM Sans', sans-serif;
          transition: border-color .2s, box-shadow .2s; outline: none; resize: none;
        }
        .field-input::placeholder, .field-textarea::placeholder { color: #3a3018; }
        .field-input:focus, .field-textarea:focus {
          border-color: #c4922a; box-shadow: 0 0 0 3px rgba(196,146,42,.14);
        }
        .field-hint { color: #3a3018; font-size: .78rem; }

        /* File upload */
        .file-drop {
          border: 2px dashed #2a2010; border-radius: 12px; padding: 28px;
          text-align: center; cursor: pointer;
          transition: border-color .2s, background .2s;
          position: relative;
        }
        .file-drop:hover { border-color: #5a4a28; background: #0f0d08; }
        .file-drop.has-files { border-color: #5a4a28; }
        .file-drop input[type="file"] {
          position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
        }
        .upload-icon { font-size: 2rem; margin-bottom: 10px; opacity: .5; }
        .upload-text { color: #5a4e2a; font-size: .9rem; }
        .upload-text strong { color: #c4922a; }
        .thumb-row {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;
        }
        .thumb {
          width: 64px; height: 64px; border-radius: 8px; object-fit: cover;
          border: 1px solid #2a2010;
        }
        .thumb-extra {
          width: 64px; height: 64px; border-radius: 8px;
          background: #1a1510; border: 1px solid #2a2010;
          display: flex; align-items: center; justify-content: center;
          color: #5a4e2a; font-size: .8rem; font-weight: 600;
        }

        /* Progress */
        .progress-bar-wrap {
          background: #0a0805; border-radius: 20px; height: 6px;
          overflow: hidden; margin: 20px 0 10px;
        }
        .progress-bar-fill {
          height: 100%; border-radius: 20px;
          background: linear-gradient(90deg, #c4922a, #e8c060);
          transition: width .5s ease;
        }
        .progress-label { color: #8a7a4a; font-size: .85rem; text-align: center; }

        /* Alert */
        .alert-error {
          background: rgba(220,60,60,.1); border: 1px solid rgba(220,60,60,.2);
          color: #f08080; border-radius: 10px; padding: 12px 16px;
          font-size: .87rem; margin-bottom: 18px;
        }

        /* Submit */
        .btn-seal {
          width: 100%; padding: 15px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #c4922a, #a67820);
          color: #0a0805; font-weight: 700; font-size: 1rem;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          letter-spacing: .03em;
          box-shadow: 0 4px 20px rgba(196,146,42,.3);
        }
        .btn-seal:hover:not(:disabled) { opacity: .9; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(196,146,42,.4); }
        .btn-seal:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

        .spinner-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(10,8,5,.3); border-top-color: #0a0805;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <Link to="/dashboard" className="back-link">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="cc-title">Seal a New Capsule</h1>
      <p className="cc-sub">Lock your memories away until the perfect moment.</p>

      <form onSubmit={handleCreate}>
        {/* Details card */}
        <div className="cc-card">
          <div className="card-section-title">📝 Capsule Details</div>

          {error && <div className="alert-error">{error}</div>}

          <div className="field-group">
            <label className="field-label">Title</label>
            <input
              type="text" value={title} required
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Our Summer 2025"
              className="field-input" maxLength={80}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Message to the Future</label>
            <textarea
              value={message} required rows={5}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write something for your future self…"
              className="field-textarea"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Unlock Date</label>
            <input
              type="date" value={openDate} required min={minDate}
              onChange={(e) => setOpenDate(e.target.value)}
              className="field-input"
            />
            <p className="field-hint">Must be at least tomorrow.</p>
          </div>
        </div>

        {/* Media card */}
        <div className="cc-card">
          <div className="card-section-title">📸 Memories (optional)</div>

          <label className={`file-drop ${fileCount ? "has-files" : ""}`}>
            <input
              type="file" multiple accept="image/*,video/*"
              onChange={(e) => setFiles(e.target.files)}
            />
            {fileCount === 0 ? (
              <>
                <div className="upload-icon">🖼️</div>
                <p className="upload-text"><strong>Click to upload</strong> or drag files here</p>
                <p className="field-hint" style={{ marginTop: 4 }}>Images & videos supported</p>
              </>
            ) : (
              <>
                <p className="upload-text"><strong>{fileCount} file{fileCount > 1 ? "s" : ""}</strong> selected</p>
                <div className="thumb-row">
                  {filePreviews.map((src, i) => (
                    <img key={i} src={src} alt="" className="thumb" />
                  ))}
                  {fileCount > 4 && <div className="thumb-extra">+{fileCount - 4}</div>}
                </div>
              </>
            )}
          </label>
        </div>

        {/* Collaborators card */}
        <div className="cc-card">
          <div className="card-section-title">👥 Share With Others (optional)</div>
          <div className="field-group">
            <label className="field-label">Email Addresses</label>
            <input
              type="text" value={collaborators}
              onChange={(e) => setCollaborators(e.target.value)}
              placeholder="friend@example.com, another@example.com"
              className="field-input"
            />
            <p className="field-hint">Separate multiple emails with commas. Only registered ChronoCapsule users will be added.</p>
          </div>
        </div>

        {/* Progress */}
        {isLoading && (
          <div>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: `${(progress.step / 4) * 100}%` }}
              />
            </div>
            <p className="progress-label">{progress.label}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-seal" style={{ marginTop: 8 }}>
          {isLoading ? (
            <span className="spinner-row"><span className="spinner" />{progress.label || "Working…"}</span>
          ) : (
            "🔒 Seal the Capsule"
          )}
        </button>
      </form>
    </div>
  );
}
