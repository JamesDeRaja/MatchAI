
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext, Page } from '../context/AppContext';
import { User, ExploreCardData } from '../types';
import { geminiService } from '../services/geminiService';

const AiAnalysisLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-700 dark:text-gray-300">
            <div className="relative w-16 h-16">
                 <div className="w-16 h-16 border-2 border-rose-200 dark:border-rose-600 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-rose-500 rounded-full animate-spin"></div>
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 opacity-80"><path d="M12 22a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6h0a6 6 0 0 0-6 6v7a6 6 0 0 0 6 6Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 12h.01"/></svg>
            </div>
            <p className="mt-4 text-sm font-semibold">AI is analyzing your match...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Crafting your connection story.</p>
        </div>
    );
};

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const MatchRating: React.FC<{ rating: number | undefined }> = ({ rating }) => {
    const [displayRating, setDisplayRating] = useState(0);

    useEffect(() => {
        if (rating === undefined) return;
        const animationTimeout = setTimeout(() => setDisplayRating(rating), 100);
        return () => clearTimeout(animationTimeout);
    }, [rating]);

    if (rating === undefined) {
        return null; 
    }

    const size = 52;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (displayRating / 100) * circumference;

    const getColor = (r: number) => {
        if (r < 40) return 'text-red-500';
        if (r < 75) return 'text-yellow-500';
        return 'text-green-500';
    };
    const colorClass = getColor(rating);
    const fireEmoji = rating > 85 ? '🔥' : '';

    return (
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="text-gray-200 dark:text-gray-600"
                />
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className={`${colorClass} transition-[stroke-dashoffset] duration-1000 ease-out`}
                    strokeLinecap="round"
                />
            </svg>
            <span className={`absolute text-md font-bold ${colorClass}`}>
                {Math.round(displayRating)}{fireEmoji}
            </span>
        </div>
    );
};


const ExploreCard: React.FC<{ card: ExploreCardData; onCancel: (userId: string) => void; }> = ({ card, onCancel }) => {
  const { user: currentUser, setViewingConversationId } = useAppContext();
  const [isExiting, setIsExiting] = useState(false);
  const [analysis, setAnalysis] = useState<{
    explanation: string | null;
    rating: number | null;
    isLoading: boolean;
  }>({ explanation: null, rating: null, isLoading: true });

  const { user } = card;
  const fetchAnalysis = async () => {
        setAnalysis({ explanation: null, rating: null, isLoading: true });
        try {
            if(currentUser){
              const { explanation, rating } = await geminiService.generateMatchExplanation(currentUser, card.user);
              setAnalysis({ explanation, rating, isLoading: false });
            }
        } catch (error) {
            console.error(`Failed to load explanation for ${card.user.name}`, error);
            setAnalysis({ explanation: 'Could not load AI analysis.', rating: 0, isLoading: false });
        }
    };
  useEffect(() => {
    if (!currentUser || !card.user) return;

    

    fetchAnalysis();
  }, [card.user, currentUser]);
  

  const handleActionClick = () => {
    setViewingConversationId(user.id);
  };
  
  const handleCancelClick = () => {
    setTimeout(() => {
      setIsExiting(true);
      onCancel(user.id);
    }, 500); // Match animation duration
  };
  
  const isRequest = card.type === 'request';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full ${isExiting ? 'animate-swipe-out' : 'animate-fade-in'}`}>
      <img src={user.avatar} alt={user.name} className="w-full h-56 object-cover flex-shrink-0" />
      <div className="p-4 flex flex-col flex-grow overflow-hidden">
        
        <div className="flex-shrink-0 flex justify-between items-start mb-1">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {isRequest ? 'Sent you a message' : `Seeking: ${user.relationshipGoal}`}
            </p>
          </div>
          <MatchRating rating={analysis.rating ?? undefined} />
        </div>
        
        <div className="bg-rose-50 dark:bg-gray-700 p-3 rounded-lg flex-1 overflow-y-auto">
          {isRequest && (
            <>
              <div>
                <h4 className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6h0a6 6 0 0 0-6 6v7a6 6 0 0 0 6 6Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 12h.01"/></svg>
                  Their First Message
                </h4>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 pr-2 italic">"{card.firstMessage}"</p>
              </div>
              <div className="my-3 border-t border-rose-200/80 dark:border-gray-600/80"></div>
            </>
          )}

          <div>
            <h4 className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6h0a6 6 0 0 0-6 6v7a6 6 0 0 0 6 6Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 12h.01"/></svg>
              AI Match Analysis
            </h4>
            <div className="mt-2 text-sm">
              {analysis.isLoading ? (
                <AiAnalysisLoader />
              ) : (
                <p
                  className="text-gray-700 dark:text-gray-300 pr-2 animate-fade-in"
                  dangerouslySetInnerHTML={{ __html: analysis.explanation || '' }}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full mt-4 flex items-center gap-4 flex-shrink-0">
            <button 
                onClick={handleCancelClick}
                className="p-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold rounded-full hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 transform hover:scale-110 focus:outline-none ring-2 ring-transparent focus:ring-red-300"
                aria-label="Cancel"
            >
                <XIcon />
            </button>
            <button onClick={handleActionClick} className="flex-1 bg-rose-500 text-white font-bold py-4 rounded-lg hover:bg-rose-600 transition-colors duration-300 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {isRequest ? 'Reply' : 'Start Chat'}
            </button>
        </div>
      </div>
    </div>
  );
};

const ExplorePage: React.FC = () => {
  const { user, setActivePage, requests, exploreUsers, dismissExploreUser } = useAppContext();
  
  const handleCancelCard = useCallback((userIdToRemove: string) => {
    dismissExploreUser(userIdToRemove);
  },[]);

  const allCards = useMemo(() => {
    const requestCards: ExploreCardData[] = requests.map(req => ({
        id: req.participant.id,
        user: req.participant,
        type: 'request',
        firstMessage: req.messages[0]?.text || "Sent you a message!",
    }));

    // exploreUsers are already filtered not to include anyone from conversations/requests
    const matchCards: ExploreCardData[] = exploreUsers.map((matchUser) => ({
        id: matchUser.id,
        user: matchUser,
        type: 'match',
        firstMessage: '',
    }));
    
    // Show requests first, then potential new matches
    return [...requestCards, ...matchCards];
  }, [requests, exploreUsers]);

  if (!user || !user.onboardingCompleted) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Complete your profile!</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Finish the AI chat to unlock your potential matches.</p>
            <button 
                onClick={() => setActivePage(Page.AI_CHAT)} 
                className="mt-6 px-6 py-2 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition"
            >
                Go to AI Chat
            </button>
        </div>
    );
  }

  // Reverse the array for rendering so the first card is visually on top of the stack
  const currentCards = allCards.slice().reverse();
  console.log(currentCards);
  return (
    <div className="p-4 bg-gradient-to-br from-rose-50 to-teal-50 dark:from-gray-900 dark:to-slate-900 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex-shrink-0">Explore Connections</h1>

      <div className="relative flex-1">
          {currentCards.length > 0 ? (
             currentCards.map((card, index) => (
                <div 
                    key={card.id}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ 
                        // transform: `scale(${1 - (index * 0.04)}) translateY(-${index * 12}px)`,
                        zIndex: currentCards.length - index,
                     }}
                >
                    <ExploreCard card={card} onCancel={handleCancelCard} />
                </div>
             ))
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400 mb-4"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/><path d="m11.645 20.91-1.112-1.016C4.872 14.624 2 11.536 2 8.019 2 4.904 4.496 2.5 7.5 2.5c1.808 0 3.504.856 4.5 2.15C13.008 3.352 14.688 2.5 16.5 2.5c3.008 0 5.5 2.404 5.5 5.519 0 3.517-2.872 6.605-8.533 11.875L12.355 20.91a.5.5 0 0 1-.71 0Z"/></svg>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">That's everyone for now!</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Check back later for new matches, or refine your profile in the AI Chat.</p>
                <button 
                    onClick={() => setActivePage(Page.AI_CHAT)} 
                    className="mt-6 px-6 py-2 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-transform transform hover:scale-105 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6h0a6 6 0 0 0-6 6v7a6 6 0 0 0 6 6Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 12h.01"/></svg>
                    Continue AI Chat
                </button>
             </div>
          )}
      </div>
    </div>
  );
};

export default ExplorePage;
