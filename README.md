#ChronoCapsule
This project was bootstrapped with Create React App and customized to build a full-stack digital time capsule application.

##About This Project
ChronoCapsule is a web application that allows users to create and share digital time capsules. Users can write messages, attach media files, and set a future date for the capsule to be unlocked. It's built to preserve memories and share them with others across time.

Live Demo URL: [https://chronocapsule-app.vercel.app/](https://chrono-capsule.vercel.app/)

##Key Features
  User Authentication: Secure sign-up and login functionality.

  Capsule Creation: Create capsules with a title, message, media, and an unlock date.

  Collaboration: Share capsules with friends via email.

  Personalized Dashboard: View and manage all your created and shared capsules.

##Tech Stack
  Frontend: React, React Router

  Styling: Tailwind CSS

  Backend Services: Firebase (Authentication, Firestore Database)

  Media Storage: Cloudinary
  
  Deployment: Vercel

##Setup and Installation

  To get a local copy up and running, follow these steps.

  git clone
  First, clone the repository from GitHub to your local machine:

  git clone https://github.com/GuptaAkshat23/ChronoCapsule.git
  cd ChronoCapsule

  npm install

Next, install the necessary project dependencies:

 npm install

##Set up Environment Variables
  Before running the app, you must provide your own API keys.

  Create a file named .env.local in the root of your project.

  Add your Firebase and Cloudinary configuration details to this file.

  REACT_APP_FIREBASE_API_KEY="YOUR_API_KEY"
  REACT_APP_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
  REACT_APP_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
  REACT_APP_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
  REACT_APP_FIREBASE_APP_ID="YOUR_APP_ID"

##Available Scripts
  In the project directory, you can run:

  npm start
  Runs the app in the development mode.

  Open http://localhost:3000 to view it in your browser.
  
  The page will reload when you make changes.

  You may also see any lint errors in the console.

  npm test
  
  Launches the test runner in the interactive watch mode.

  See the section about running tests for more information.

  npm run build
  Builds the app for production to the build folder.

  It correctly bundles React in production mode and optimizes the build for the best performance.

  The build is minified and the filenames include the hashes.
  
  Your app is ready to be deployed!
  
  See the section about deployment for more information.

##Deployment
  This application is configured for seamless deployment on Vercel.

  The deployment process is automated through a CI/CD pipeline linked to the main branch of the GitHub repository. Any push to the main branch will automatically trigger a new build and deployment.

  For manual deployment, you can run npm run build and upload the contents of the build folder to any static site hosting service.

Learn More
You can learn more in the Create React App documentation.

To learn React, check out the React documentation.
