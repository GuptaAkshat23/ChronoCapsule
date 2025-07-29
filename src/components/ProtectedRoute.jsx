// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ currentUser, children }) {
  if (!currentUser) {
    // If no user is logged in, redirect to the new auth page
    return <Navigate to="/auth" />;
  }

  // If a user is logged in, show the page they were trying to access
  return children;
}

export default ProtectedRoute;