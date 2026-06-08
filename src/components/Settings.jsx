import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export default function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  /* Detect if user signed in via Google (no password) */
  const isGoogleUser = user?.providerData?.some((p) => p.providerId === "google.com");

  /* ── Change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!user) { setError("No user signed in."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords don't match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword === oldPassword) { setError("New password must differ from the old one."); return; }

    setIsLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setSuccess("Password updated successfully.");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      const msg = {
        "auth/wrong-password": "The current password is incorrect.",
        "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      }[err.code] || "An error occurred. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Delete account ── */
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Type DELETE exactly to confirm.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (isGoogleUser) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate("/auth");
    } catch (err) {
      setError("Couldn't delete account. You may need to sign in again first.");
      setIsLoading(false);
    }
  };

  const EyeIcon = ({ open }) => open ? (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
    </svg>
  );

  return (
    <div className="settings-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .settings-root {
          max-width: 560px; margin: 0 auto; padding: 36px 24px 80px;
          font-family: 'DM Sans', sans-serif;
        }
        .settings-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem; color: #e8d5a3; margin-bottom: 32px;
          font-weight: 700;
        }
        .section-card {
          background: #131009; border: 1px solid #2a2010;
          border-radius: 18px; padding: 32px; margin-bottom: 24px;
        }
        .section-card.danger { border-color: rgba(220,60,60,.25); }
        .section-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem; color: #e8d5a3; margin-bottom: 6px;
        }
        .section-card.danger .section-card-title { color: #e05050; }
        .section-card-sub { color: #4a3e20; font-size: .85rem; margin-bottom: 24px; line-height: 1.6; }

        /* Google-user notice */
        .google-notice {
          display: flex; align-items: center; gap: 10px;
          background: rgba(66,133,244,.08); border: 1px solid rgba(66,133,244,.15);
          border-radius: 10px; padding: 14px 16px; color: #7ab0f5; font-size: .87rem;
        }

        /* Alert banners */
        .alert { padding: 12px 16px; border-radius: 10px; font-size: .87rem; margin-bottom: 18px; }
        .alert-error { background: rgba(220,60,60,.1); border: 1px solid rgba(220,60,60,.2); color: #f08080; }
        .alert-success { background: rgba(80,200,100,.08); border: 1px solid rgba(80,200,100,.2); color: #5ac870; }

        /* Form */
        .form-fields { display: flex; flex-direction: column; gap: 18px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label { color: #7a6a42; font-size: .78rem; font-weight: 500; letter-spacing: .05em; text-transform: uppercase; }
        .input-wrap { position: relative; display: flex; align-items: center; }
        .field-input {
          width: 100%; background: #080704; border: 1px solid #2a2010;
          border-radius: 10px; padding: 13px 42px 13px 14px;
          color: #e8d5a3; font-size: .95rem;
          font-family: 'DM Sans', sans-serif;
          transition: border-color .2s, box-shadow .2s; outline: none;
        }
        .field-input::placeholder { color: #3a3018; }
        .field-input:focus { border-color: #c4922a; box-shadow: 0 0 0 3px rgba(196,146,42,.14); }
        .toggle-eye {
          position: absolute; right: 12px; background: transparent; border: none;
          color: #4a3e22; cursor: pointer; display: flex; align-items: center;
          transition: color .2s; padding: 4px;
        }
        .toggle-eye:hover { color: #c4922a; }

        .divider { height: 1px; background: #1e1a0e; margin: 24px 0; }

        /* Buttons */
        .btn-primary {
          width: 100%; padding: 13px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #c4922a, #a67820);
          color: #0a0805; font-weight: 700; font-size: .95rem;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: opacity .2s, transform .15s; letter-spacing: .03em;
          box-shadow: 0 4px 16px rgba(196,146,42,.25);
        }
        .btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: .45; cursor: not-allowed; transform: none; }
        .btn-danger {
          width: 100%; padding: 13px; border-radius: 10px; border: none;
          background: rgba(220,60,60,.12); color: #e05050;
          font-weight: 700; font-size: .95rem;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          border: 1px solid rgba(220,60,60,.2);
          transition: background .2s;
        }
        .btn-danger:hover:not(:disabled) { background: rgba(220,60,60,.2); }
        .btn-danger:disabled { opacity: .45; cursor: not-allowed; }

        /* Delete confirm */
        .delete-confirm-area { margin-top: 20px; animation: fadeIn .25s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } }
        .delete-label { color: #5a4e2a; font-size: .85rem; margin-bottom: 8px; }
        .delete-label strong { color: #e05050; }
        .delete-input {
          width: 100%; background: #080704; border: 1px solid rgba(220,60,60,.2);
          border-radius: 10px; padding: 12px 14px; color: #e8d5a3;
          font-size: .95rem; font-family: 'DM Sans', sans-serif; outline: none;
          margin-bottom: 12px; transition: border-color .2s;
        }
        .delete-input:focus { border-color: rgba(220,60,60,.5); }
        .btn-cancel-delete {
          width: 100%; padding: 12px; border-radius: 10px;
          background: transparent; border: 1px solid #2a2010;
          color: #6a5a34; font-size: .9rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif; margin-top: 8px;
          transition: color .2s, border-color .2s;
        }
        .btn-cancel-delete:hover { color: #e8d5a3; border-color: #5a4a28; }

        .spinner-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(10,8,5,.3); border-top-color: #0a0805;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        /* Account info */
        .account-info {
          background: #0f0d08; border: 1px solid #1e1a0e;
          border-radius: 10px; padding: 16px;
          margin-bottom: 24px;
        }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .info-row:not(:last-child) { border-bottom: 1px solid #1a1510; }
        .info-key { color: #4a3e20; font-size: .82rem; }
        .info-val { color: #8a7a4a; font-size: .82rem; }
      `}</style>

      <h2 className="settings-title">Settings</h2>

      {/* Account info */}
      <div className="section-card">
        <h3 className="section-card-title">Account</h3>
        <p className="section-card-sub">Your current account details.</p>
        <div className="account-info">
          <div className="info-row">
            <span className="info-key">Email</span>
            <span className="info-val">{user?.email}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Sign-in method</span>
            <span className="info-val">{isGoogleUser ? "Google" : "Email & Password"}</span>
          </div>
        </div>
      </div>

      {/* Password section */}
      <div className="section-card">
        <h3 className="section-card-title">Change Password</h3>
        <p className="section-card-sub">Use a strong, unique password you don't use elsewhere.</p>

        {isGoogleUser ? (
          <div className="google-notice">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            You're signed in with Google — password management is handled by Google.
          </div>
        ) : (
          <form onSubmit={handleChangePassword}>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-fields">
              <div className="field-group">
                <label className="field-label">Current Password</label>
                <div className="input-wrap">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required className="field-input" placeholder="Current password"
                    autoComplete="current-password"
                  />
                  <button type="button" className="toggle-eye" onClick={() => setShowOld((v) => !v)}>
                    <EyeIcon open={showOld} />
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="input-wrap">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required className="field-input" placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" className="toggle-eye" onClick={() => setShowNew((v) => !v)}>
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Confirm New Password</label>
                <div className="input-wrap">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required className="field-input" placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? <span className="spinner-row"><span className="spinner" />Updating…</span> : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div className="section-card danger">
        <h3 className="section-card-title">Delete Account</h3>
        <p className="section-card-sub">
          Permanently delete your account and all capsules. This cannot be undone.
          {isGoogleUser && " You'll be prompted to re-authenticate with Google."}
        </p>

        {!deleteStep ? (
          <button className="btn-danger" onClick={() => { setDeleteStep(true); setError(null); }}>
            Delete My Account
          </button>
        ) : (
          <div className="delete-confirm-area">
            {error && <div className="alert alert-error">{error}</div>}
            <p className="delete-label">Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="delete-input"
            />
            <button
              className="btn-danger"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading
                ? <span className="spinner-row"><span className="spinner" style={{ borderTopColor: "#e05050" }} />Deleting…</span>
                : "Confirm Delete Forever"
              }
            </button>
            <button className="btn-cancel-delete" onClick={() => { setDeleteStep(false); setDeleteConfirmText(""); setError(null); }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
