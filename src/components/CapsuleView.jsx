// src/components/CapsuleView.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// --- Helper function to determine media type from URL ---
const getMediaType = (url) => {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        return 'image';
    }
    if (['mp4', 'webm', 'ogg'].includes(extension)) {
        return 'video';
    }
    if (extension === 'pdf') {
        return 'pdf';
    }
    return 'unknown';
};


function CapsuleView() {
  const { capsuleId } = useParams();
  const [capsule, setCapsule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;

  // --- State for the media modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const openModal = (url) => {
    setSelectedMedia({ url, type: getMediaType(url) });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMedia(null);
  };

  // --- Effect to handle 'Escape' key press for closing modal ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);


  useEffect(() => {
    const fetchCapsule = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'capsules', capsuleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCapsule({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching capsule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapsule();
  }, [capsuleId]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg text-gray-500">Unsealing your capsule...</p>
        </div>
    );
  }

  if (!capsule) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Capsule Not Found</h2>
            <p className="text-gray-500 mb-4">This memory might be lost to time, or the link is incorrect.</p>
            <Link to="/dashboard" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Return to Dashboard
            </Link>
        </div>
    );
  }
  
  const isOwner = currentUser && currentUser.uid === capsule.creatorId;
  const creatorDisplayName = isOwner ? "You" : (capsule.creatorUsername || capsule.creatorEmail);

  return (
    <>
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      
      {/* --- Header Section --- */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{capsule.title}</h1>
        <p className="text-md text-gray-500">
          Created by: <strong className="text-gray-700">{creatorDisplayName}</strong> on {capsule.createdAt.toDate().toLocaleDateString()}
        </p>
      </div>

      {/* --- Message & Collaborators Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            {/* --- Message Section --- */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">A Message From The Past</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {capsule.message}
                </p>
            </div>
        </div>
        
        {/* --- Collaborators Section --- */}
        {capsule.collaborators && capsule.collaborators.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Shared With</h3>
              <div className="flex flex-wrap gap-2">
                {capsule.collaborators.map(collaborator => (
                  <span key={collaborator.uid} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {collaborator.uid === currentUser.uid ? `${collaborator.username} (You)` : collaborator.username}
                  </span>
                ))}
              </div>
            </div>
        )}
      </div>


      {/* --- Media Section --- */}
      {capsule.mediaUrls && capsule.mediaUrls.length > 0 && (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Memories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {capsule.mediaUrls.map((url, index) => (
                <div 
                    key={index} 
                    onClick={() => openModal(url)}
                    className="group overflow-hidden rounded-lg shadow-md cursor-pointer"
                >
                    <img 
                        src={getMediaType(url) === 'image' ? url : 'https://placehold.co/600x400/e2e8f0/4a5568?text=View+File'}
                        alt={`Memory ${index + 1}`} 
                        className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
                    />
                </div>
                ))}
            </div>
        </div>
      )}
    </div>

    {/* --- Media Modal --- */}
    {isModalOpen && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={closeModal}
        >
            <button 
                className="absolute top-4 right-4 text-white text-4xl font-bold"
                onClick={closeModal}
            >
                &times;
            </button>
            <div 
                className="bg-white p-2 rounded-lg max-w-4xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside content
            >
                {selectedMedia.type === 'image' && (
                    <img src={selectedMedia.url} alt="Enlarged view" className="w-full h-full object-contain max-h-[85vh]" />
                )}
                {selectedMedia.type === 'video' && (
                    <video src={selectedMedia.url} controls autoPlay className="w-full h-full object-contain max-h-[85vh]">
                        Your browser does not support the video tag.
                    </video>
                )}
                {selectedMedia.type === 'pdf' && (
                    <iframe src={selectedMedia.url} className="w-full h-[85vh]" title="PDF Viewer"></iframe>
                )}
            </div>
        </div>
    )}
    </>
  );
}

export default CapsuleView;
