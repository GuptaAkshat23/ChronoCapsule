# ChronoCapsule UI Upgrade — Implementation Guide

## What's Changed

### New Features
- ✅ **Google Sign-In** (OAuth via Firebase popup)
- ✅ **Username setup flow** for Google users on first sign-in
- ✅ **Rate limiting** (client-side guard on login attempts)
- ✅ **Input sanitisation** on all username fields
- ✅ **Password visibility toggle** on all password fields
- ✅ **Confirm dialog** before deleting capsules (no more `window.confirm`)
- ✅ **Google user detection** in Settings (hides password change, shows Google notice)
- ✅ **Re-authentication** before password change and account deletion
- ✅ **Minimum date** enforced on capsule unlock date (must be tomorrow+)
- ✅ **Mobile nav drawer** with hamburger menu

### Visual Redesign
- Dark amber / aged-parchment aesthetic throughout
- Playfair Display + DM Sans typography
- Animated stat cards on Dashboard
- Thumbnail previews on capsule cards
- File drag-and-drop UI on CreateCapsule
- Step-progress bar while sealing a capsule

---

## Step 1 — Enable Google Sign-In in Firebase Console

1. Go to **Firebase Console → Authentication → Sign-in method**
2. Click **Google** → Enable → Save
3. Make sure your domain is listed under **Authorized domains**
   - `localhost` is added automatically
   - Add your Vercel domain (e.g. `chrono-capsule.vercel.app`)

---

## Step 2 — Copy Files

Replace/create these files in your project:

| Source file (this folder)     | Destination in your project                |
|-------------------------------|--------------------------------------------|
| `firebase.js`                 | `src/firebase.js`                          |
| `App.js`                      | `src/App.js`                               |
| `AuthPage.jsx`                | `src/components/AuthPage.jsx`              |
| `UsernameSetup.jsx`           | `src/components/UsernameSetup.jsx` *(new)* |
| `Welcome.jsx`                 | `src/components/Welcome.jsx`               |
| `Dashboard.jsx`               | `src/components/Dashboard.jsx`             |
| `CreateCapsule.jsx`           | `src/components/CreateCapsule.jsx`         |
| `Settings.jsx`                | `src/components/Settings.jsx`              |

`CapsuleView.jsx` and `ProtectedRoute.jsx` are unchanged — keep your existing versions.

---

## Step 3 — Add Google Fonts (optional but recommended)

The components import fonts via `@import url(...)` at runtime.
For better performance, add to `public/index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

---

## Step 4 — Firestore Security Rules

Replace your Firestore rules with these in **Firebase Console → Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Username uniqueness check (read-only for auth users)
    // Already covered by the users rule above

    // Capsules
    match /capsules/{capsuleId} {
      // Read: creator or collaborator
      allow read: if request.auth != null && (
        resource.data.creatorId == request.auth.uid ||
        request.auth.token.email in resource.data.collaboratorEmails
      );

      // Create: authenticated users only, must set own uid as creatorId
      allow create: if request.auth != null &&
        request.resource.data.creatorId == request.auth.uid &&
        request.resource.data.title is string &&
        request.resource.data.title.size() > 0 &&
        request.resource.data.title.size() <= 80 &&
        request.resource.data.message is string &&
        request.resource.data.message.size() > 0;

      // Update: creator only
      allow update: if request.auth != null &&
        resource.data.creatorId == request.auth.uid;

      // Delete: creator only
      allow delete: if request.auth != null &&
        resource.data.creatorId == request.auth.uid;
    }
  }
}
```

---

## Step 5 — Run & Test

```bash
npm start
```

### Test checklist
- [ ] Email sign-up creates user in Firestore + Auth
- [ ] Email login redirects to dashboard
- [ ] Google sign-in opens popup, new users see UsernameSetup modal
- [ ] Google sign-in returning users skip username setup
- [ ] Password change works (wrong current password shows error)
- [ ] Settings shows Google notice for Google-auth users
- [ ] Capsule deletion shows confirm modal (no browser `window.confirm`)
- [ ] Create capsule enforces future date
- [ ] Mobile hamburger menu opens/closes

---

## Notes

- **Cloudinary config** in `CreateCapsule.jsx` still uses hardcoded `CLOUD_NAME`/`UPLOAD_PRESET`. 
  Move these to `.env` as `REACT_APP_CLOUDINARY_CLOUD_NAME` and `REACT_APP_CLOUDINARY_UPLOAD_PRESET` for production.
- The client-side rate limiter resets on page refresh — for production, pair with Firebase App Check.
- `CapsuleView.jsx` uses the same dark theme via Tailwind classes but doesn't need replacement unless you want full consistency — consider adding inline styles matching the new palette.
