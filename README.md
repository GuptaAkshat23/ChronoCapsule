# ⏳ ChronoCapsule

**Preserve Moments · Unlock Futures · Share Timeless Memories**

ChronoCapsule is a full-stack web application that enables users to create, share, and unlock digital time capsules filled with messages and multimedia content. Built with modern web technologies, it focuses on secure data handling, real-time updates, and an intuitive user experience.

---

## 🔗 Live Demo & Video

- 🌐 **Live Application:** [https://chrono-capsule.vercel.app/](https://chrono-capsule.vercel.app/)
- 🎥 **Demo Video (YouTube):** [https://www.youtube.com/watch?v=lrHb1Tl0W1w](https://www.youtube.com/watch?v=lrHb1Tl0W1w)

---

## 🛠 Tech Stack

**Frontend**
- React
- JavaScript (ES6+)
- Tailwind CSS

**Backend & Services**
- Firebase (Authentication & Database)
- Cloudinary (Media Storage)

**Tooling**
- npm
- GitHub
- Vercel (Deployment)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Why ChronoCapsule?](#why-chronocapsule)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## 📖 Overview

ChronoCapsule allows users to preserve memories by creating digital capsules that unlock at a future date. Capsules can include text, images, and other media, making the platform ideal for personal reflections, collaborative memories, or long-term messages to friends and family.

The application demonstrates best practices in full-stack development, real-time data handling, and cloud-based media management.

---

## ❓ Why ChronoCapsule?

This project was built to explore and demonstrate:

- Secure user authentication and protected routes
- Real-time data synchronization
- Cloud-based media storage
- Scalable and maintainable frontend architecture
- Clean, responsive UI design

---

## ✨ Key Features

- 🔐 **Secure Authentication** User login, registration, and protected routes powered by Firebase Authentication.

- 📸 **Media Uploads** Seamless multimedia uploads and management using Cloudinary.

- 🔄 **Real-Time Updates** Capsules update instantly with Firebase real-time data synchronization.

- 🌗 **Theme Toggling** Light and dark mode support for a personalized experience.

- 📦 **Capsule Management** Create, view, organize, and manage digital time capsules with metadata and sharing capabilities.

---

## 🚀 Getting Started

Follow the steps below to run ChronoCapsule locally.

### ✅ Prerequisites

Ensure you have the following installed:

- Node.js
- npm
- JavaScript (ES6+)

---

### 📥 Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/GuptaAkshat23/ChronoCapsule.git](https://github.com/GuptaAkshat23/ChronoCapsule.git)
   ```

2. **Navigate to the project directory**
   ```bash
   cd ChronoCapsule
   ```

3. **Install the dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory and add the required keys:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

---

## ▶️ Usage

Start the development server:
```bash
npm start
```
The application will be available at: `http://localhost:3000`

---

## 🧪 Testing

Run the test suite using:
```bash
npm test
```

---

## 🗂 Project Structure

```text
ChronoCapsule/
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── services/
│   ├── styles/
│   └── App.js
├── public/
├── package.json
└── README.md
```

---

## 🔮 Future Enhancements

- ⏰ Scheduled notifications for capsule unlocks
- 👥 Advanced collaboration and sharing controls
- 🔐 End-to-end encryption for capsule content
- 📱 Enhanced mobile responsiveness and PWA support

---

## 📄 License

This project is licensed under the MIT License.

⭐ **If you find this project useful or interesting, consider giving it a star on GitHub!**
