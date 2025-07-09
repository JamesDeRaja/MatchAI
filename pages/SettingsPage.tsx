
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

const SettingsPage: React.FC = () => {
  const { user, signOut, signInWithGoogle, updateUserProfile } = useAppContext();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar);
    }
  }, [user]);

  const handleSave = () => {
    if (user) {
      updateUserProfile(name, avatar);
      setIsEditing(false);
    }
  };
  
  const handleCancel = () => {
    if (user) {
        setName(user.name);
        setAvatar(user.avatar);
    }
    setIsEditing(false);
  };

  const handleAvatarChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // The result is a base64 Data URL, which can be used in the `src` attribute of an img tag
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return null; // Should not happen if logic is correct, but for safety
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <div className="flex flex-col items-center">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
          <div className="relative">
            <img src={avatar} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-rose-200 dark:border-rose-800" />
            {isEditing && (
              <button
                onClick={handleAvatarChangeClick}
                className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                aria-label="Change profile picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
            )}
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-4 text-2xl font-bold text-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-1"
            />
          ) : (
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{name}</h2>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.authType === 'google' ? 'Signed in with Google' : 'Guest Account'}</p>
        </div>
        
        {isEditing ? (
            <div className="mt-6 flex gap-4">
                <button
                    onClick={handleSave}
                    className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-lg hover:bg-rose-600 transition-colors duration-300"
                >
                    Save
                </button>
                <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300"
                >
                    Cancel
                </button>
            </div>
        ) : (
            <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                Edit Profile
            </button>
        )}
      </div>

      <div className="mt-8">
        {user.authType === 'guest' ? (
          <button
            onClick={signInWithGoogle}
            className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            Sign In with Google to Save Progress
          </button>
        ) : (
          <button
            onClick={signOut}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors duration-300"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
