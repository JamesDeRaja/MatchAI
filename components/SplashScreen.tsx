
import React from 'react';
import { useAppContext } from '../context/AppContext';

const HeartIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="m11.645 20.91-1.112-1.016C4.872 14.624 2 11.536 2 8.019 2 4.904 4.496 2.5 7.5 2.5c1.808 0 3.504.856 4.5 2.15C13.008 3.352 14.688 2.5 16.5 2.5c3.008 0 5.5 2.404 5.5 5.519 0 3.517-2.872 6.605-8.533 11.875L12.355 20.91a.5.5 0 0 1-.71 0Z" />
  </svg>
);

const GoogleIcon: React.FC<{ className: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.591l6.19,5.238C44.434,36.338,48,30.656,48,24C48,22.659,47.862,21.35,47.611,20.083z"/>
    </svg>
);


const SplashScreen: React.FC = () => {
  const { signInAsGuest, signInWithGoogle } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-rose-100 to-teal-100 dark:from-gray-800 dark:to-slate-900 text-center p-4">
      <div className="flex items-center mb-4">
        <HeartIcon className="w-16 h-16 text-rose-500 animate-pulse" />
        <h1 className="text-5xl font-bold text-gray-800 dark:text-white ml-3">MatchAI</h1>
      </div>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
        Let our AI help you find your perfect connection.
      </p>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={signInWithGoogle}
          className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-transform transform hover:scale-105 duration-300 flex items-center justify-center"
        >
          <GoogleIcon className="w-6 h-6 mr-3" />
          Sign in with Google
        </button>

        <button
          onClick={signInAsGuest}
          className="w-full bg-transparent text-gray-600 dark:text-gray-400 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          Continue as Guest
        </button>
      </div>

      <p className="absolute bottom-5 text-xs text-gray-500 dark:text-gray-400">
        Find your movie buddy, gym partner, or maybe something more.
      </p>
    </div>
  );
};

export default SplashScreen;
