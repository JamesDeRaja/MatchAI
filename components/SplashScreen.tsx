import React from 'react';
import { useAppContext } from '../context/AppContext';

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M47.611,20.083c-1.358-7.239-7.496-12.512-14.789-12.512c-3.46,0-6.759,1.177-9.49,3.336 c-2.731-2.159-6.03-3.336-9.49-3.336c-7.293,0-13.431,5.273-14.789,12.512C-2.356,27.597,1.048,35.257,7.839,40.98l13.933,11.775 c0.907,0.766,2.032,1.149,3.16,1.149s2.253-0.383,3.16-1.149l13.933-11.775C46.952,35.257,50.356,27.597,47.611,20.083z"/>
  </svg>
);

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303C33.655,32.657,29.243,36,24,36c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.959,3.041l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20 s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.959,3.041l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.222,0-9.623-3.319-11.293-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.084,5.571l6.19,5.238 C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const SplashScreen: React.FC = () => {
  const { signInWithGoogle } = useAppContext();

  return (
    <div className="relative flex flex-col items-center justify-center h-screen text-center p-6 overflow-hidden">
      <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full bg-rose-300/30 blur-3xl"></div>
      <div className="absolute -bottom-20 -right-12 w-56 h-56 rounded-full bg-teal-300/30 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md rounded-3xl glass-panel shadow-2xl p-8 border border-white/70 dark:border-slate-700/60">
        <div className="inline-flex items-center justify-center mb-2">
          <HeartIcon className="w-16 h-16 text-rose-500 animate-pulse" />
        </div>
        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-teal-500 bg-clip-text text-transparent">MatchAI</h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mt-3 mb-8 leading-relaxed">
          Beautifully curated matches powered by AI insights. Meet people who match your vibe.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-100 font-semibold py-3 px-4 border border-gray-300/80 dark:border-gray-600 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-transform transform hover:scale-[1.01] duration-300 flex items-center justify-center"
        >
          <GoogleIcon className="w-6 h-6 mr-3" />
          Continue with Google
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          Find your movie buddy, gym partner, or maybe something more.
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
