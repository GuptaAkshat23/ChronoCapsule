import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const CLOUDINARY_CLOUD_NAME = "dbijv7rqo";
const CLOUDINARY_UPLOAD_PRESET = "chrono_capsule_uploads";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


function CreateCapsule() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [files, setFiles] = useState([]);
  const [collaborators, setCollaborators] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const handleCreateCapsule = async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setStatusMessage('Sealing your capsule...');

    try {
      const creatorDocRef = doc(db, "users", currentUser.uid);
      const creatorDocSnap = await getDoc(creatorDocRef);
      const creatorUsername = creatorDocSnap.exists() ? creatorDocSnap.data().username : currentUser.email;

      const collaboratorEmails = collaborators.split(',').map(email => email.trim()).filter(email => email);
      const collaboratorsData = [];

      if (collaboratorEmails.length > 0) {
        setStatusMessage('Checking collaborators...');
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "in", collaboratorEmails));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          collaboratorsData.push({
            uid: doc.data().uid,
            email: doc.data().email,
            username: doc.data().username,
          });
        });
      }
      
      let mediaUrls = [];
      if (files.length > 0) {
        setStatusMessage('Uploading memories...');
        const uploadPromises = [...files].map(file => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          return fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData,
          }).then(response => response.json());
        });
        const uploadedMedia = await Promise.all(uploadPromises);
        mediaUrls = uploadedMedia.map(media => media.secure_url);
      }
      

      setStatusMessage('Placing capsule in the vault...');
      const capsuleCollectionRef = collection(db, 'capsules');
      await addDoc(capsuleCollectionRef, {
        creatorId: currentUser.uid,
        creatorEmail: currentUser.email,
        creatorUsername: creatorUsername,
        title: title,
        message: message,
        openDate: Timestamp.fromDate(new Date(openDate)),
        mediaUrls: mediaUrls,
        createdAt: Timestamp.now(),
        collaboratorEmails: collaboratorEmails,
        collaborators: collaboratorsData,
      });

      setStatusMessage('Capsule sealed successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (error) {
      console.error("Error creating capsule:", error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create a New Time Capsule</h2>
      
      <form onSubmit={handleCreateCapsule} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Capsule Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g., Our 2025 Family Vacation"
            className="w-full p-3 mt-1 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">A Message to the Future</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows="4"
            placeholder="Write something for your future self or others to read..."
            className="w-full p-3 mt-1 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          ></textarea>
        </div>

        <div>
          <label htmlFor="openDate" className="block text-sm font-medium text-gray-700">Opening Date</label>
          <input
            id="openDate"
            type="date"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
            required
            className="w-full p-3 mt-1 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label htmlFor="files" className="block text-sm font-medium text-gray-700">Upload Memories (Images/Videos)</label>
          <input
            id="files"
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="w-full p-2 mt-1 text-gray-700 bg-gray-100 rounded-lg border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label htmlFor="collaborators" className="block text-sm font-medium text-gray-700">Share With Others (by email)</label>
          <input
            id="collaborators"
            type="text"
            value={collaborators}
            onChange={(e) => setCollaborators(e.target.value)}
            placeholder="friend1@example.com, friend2@example.com"
            className="w-full p-3 mt-1 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple emails with a comma.</p>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-blue-300"
          >
            {isLoading ? 'Sealing...' : 'Seal the Capsule'}
          </button>
        </div>

        {statusMessage && (
          <p className="text-center text-sm font-medium text-gray-600 mt-4">{statusMessage}</p>
        )}
      </form>
    </div>
  );
}

export default CreateCapsule;
