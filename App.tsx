import React from 'react';
import { Page, useAppContext } from './context/AppContext';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import AiChatPage from './pages/AiChatPage';
import ExplorePage from './pages/ExplorePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ConversationPage from './pages/ConversationPage';

const App: React.FC = () => {
  const { user, activePage, viewingConversationId, isInitialized } = useAppContext();

  const renderPage = () => {
    switch (activePage) {
      case Page.AI_CHAT:
        return <AiChatPage />;
      case Page.EXPLORE:
        return <ExplorePage />;
      case Page.CHAT:
        return <ChatPage />;
      case Page.SETTINGS:
        return <SettingsPage />;
      default:
        return <AiChatPage />;
    }
  };
  
  if (!isInitialized) {
      return (
          <div className="flex justify-center items-center h-screen bg-white/70 dark:bg-black/60 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]"></div>
          </div>
      );
  }

  if (!user) {
    return <SplashScreen />;
  }

  return (
    <div className="h-screen p-2 sm:p-4">
      <div className="relative flex flex-col h-full max-w-lg mx-auto rounded-[2rem] overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.2)] dark:shadow-[0_24px_80px_rgba(2,6,23,0.85)] ring-1 ring-rose-200/70 dark:ring-slate-700 glass-panel font-sans">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent dark:from-slate-900/45"></div>
        <main className={`relative z-10 flex-1 overflow-y-auto ${!viewingConversationId ? 'pb-20' : ''}`}>
          {viewingConversationId ? <ConversationPage conversationId={viewingConversationId} /> : renderPage()}
        </main>
        {!viewingConversationId && <BottomNav />}
      </div>
    </div>
  );
};

export default App;
