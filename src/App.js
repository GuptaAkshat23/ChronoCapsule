// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'; // Add Navigate and useNavigate
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase';

// Import all your components
import Welcome from './components/Welcome'; // NEW
import AuthPage from './components/AuthPage'; // NEW
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CreateCapsule from './components/CreateCapsule';
import CapsuleView from './components/CapsuleView';
import Settings from './components/Settings';

// You no longer need to import Login or SignUp here
// import SignUp from './components/SignUp';
// import Login from './components/Login';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false); // Set loading to false once user status is known
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth'); // Redirect to the auth page on logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="App bg-gray-50 min-h-screen">
      {/* Only show Navbar if a user is logged in */}
      {currentUser && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <Link to="/dashboard" className="text-xl font-bold text-blue-600">ChronoCapsule</Link>
                <div className="flex items-center space-x-4">
                  <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                  <Link to="/settings" className="text-gray-600 hover:text-blue-600">Settings</Link>
                  <button onClick={handleLogout} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700">Logout</button>
                </div>
            </div>
          </div>
        </nav>
      )}
      
      <main className="p-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route 
            path="/auth" 
            element={!currentUser ? <AuthPage /> : <Navigate to="/dashboard" />} 
          />
          
          {/* Protected Routes */}
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
          {/* Add a catch-all route to redirect to the dashboard if logged in, or auth if not */}
          <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/auth"} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;