import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';

function Dashboard({ user }) {
  const [ownedCapsules, setOwnedCapsules] = useState([]);
  const [sharedCapsules, setSharedCapsules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      const fetchUsername = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUsername(userDocSnap.data().username);
        } else {
          setUsername(user.email);
        }
      };
      fetchUsername();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !user.uid) {
      setIsLoading(false);
      return;
    }

    const ownerQuery = query(collection(db, "capsules"), where("creatorId", "==", user.uid));
    const unsubOwner = onSnapshot(ownerQuery, (snapshot) => {
      setOwnedCapsules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    const collaboratorQuery = query(collection(db, "capsules"), where("collaboratorEmails", "array-contains", user.email));
    const unsubCollaborator = onSnapshot(collaboratorQuery, (snapshot) => {
      setSharedCapsules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    return () => { unsubOwner(); unsubCollaborator(); };
  }, [user]);

  const handleDelete = async (capsuleId) => {
    if (window.confirm("Are you sure you want to permanently delete this capsule?")) {
      try {
        await deleteDoc(doc(db, "capsules", capsuleId));
      } catch (error) {
        console.error("Error deleting capsule: ", error);
        alert("Error deleting capsule.");
      }
    }
  };

  const allCapsules = useMemo(() => {
    const combined = [...ownedCapsules, ...sharedCapsules];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    unique.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    return unique;
  }, [ownedCapsules, sharedCapsules]);

  const getFadeInStyle = (index) => ({
    animation: `fadeIn 0.5s ease-out forwards ${index * 0.1}s`,
    opacity: 0,
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <style>{`
        @keyframes fadeIn {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, <span className="text-blue-600">{username || '...'}</span>!
        </h1>
        <p className="text-gray-500 mt-1">Ready to take a trip down memory lane?</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Time Capsules</h2>
        <Link 
          to="/create-capsule" 
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
        >
          + Create New Capsule
        </Link>
      </div>
      <hr className="mb-6" />

      {isLoading ? (
        <p className="text-center text-gray-500">Loading your capsules...</p>
      ) : allCapsules.length === 0 ? (
        <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700">No Capsules Found</h3>
            <p className="text-gray-500 mt-2">It looks like your vault is empty. Why not create your first memory?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCapsules.map((capsule, index) => {
            const isUnlocked = capsule.openDate.toDate() <= new Date();
            const isOwner = capsule.creatorId === user.uid;

            return (
              <div 
                key={capsule.id} 
                style={getFadeInStyle(index)}
                className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-2 flex flex-col"
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{capsule.title}</h3>
                    {!isOwner && <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Shared</span>}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    By: <span className="font-medium text-gray-600">{capsule.creatorUsername || capsule.creatorEmail}</span>
                  </p>
                  
                  {isUnlocked ? (
                     <p className="text-sm font-bold text-green-600">Ready to Open!</p>
                  ) : (
                    <p className="text-sm font-bold text-yellow-600">
                      Opens on: {capsule.openDate.toDate().toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                  {isUnlocked && (
                    <Link to={`/capsule/${capsule.id}`} className="flex-1 text-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                      Open
                    </Link>
                  )}
                  {isOwner && (
                    <button onClick={() => handleDelete(capsule.id)} className="flex-1 text-center bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
