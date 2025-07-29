// src/components/Settings.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- State for the Change Password form ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("No user is currently signed in.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
    }

    setIsLoading(true);

    try {
      // 1. Create a credential from the user's old password
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      
      // 2. Re-authenticate the user with the credential
      await reauthenticateWithCredential(user, credential);
      
      // 3. If re-authentication is successful, update the password
      await updatePassword(user, newPassword);

      setSuccess("Password updated successfully!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        setError("The old password you entered is incorrect.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
        setIsLoading(false);
    }
  };


  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmation = window.prompt("This is irreversible and will delete all your data, including your capsules. To confirm, please type 'DELETE' below:");
    if (confirmation === 'DELETE') {
      try {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
        alert("Account deleted successfully.");
        navigate('/auth');
      } catch (error) {
        console.error("Error deleting account: ", error);
        alert("Error deleting account. You may need to log in again to complete this action.");
      }
    } else {
      alert("Deletion cancelled.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 text-center">Account Settings</h2>
      
      {/* --- Change Password Card --- */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Change Password</h3>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        {success && <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{success}</p>}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="old-password"className="block text-sm font-medium text-gray-700">Old Password</label>
            <input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full p-3 mt-1 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="new-password"className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full p-3 mt-1 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-3 mt-1 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={isLoading} className="w-full py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* --- Delete Account Card --- */}
      <div className="bg-white border-2 border-red-500 p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account</h3>
        <p className="text-gray-600 mb-4">Warning: This action is permanent. It will delete your profile and all of your capsules. This cannot be undone.</p>
        <button onClick={handleDeleteAccount} className="w-full py-3 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">
          Delete My Account Permanently
        </button>
      </div>
    </div>
  );
}

export default Settings;
