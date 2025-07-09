
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
          <div className="flex justify-center items-center h-screen bg-white dark:bg-black">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-rose-500"></div>
          </div>
      );
  }

  if (!user) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white dark:bg-black font-sans">
      <main className={`flex-1 overflow-y-auto ${!viewingConversationId ? 'pb-20' : ''}`}>
        {viewingConversationId ? <ConversationPage conversationId={viewingConversationId} /> : renderPage()}
      </main>
      {!viewingConversationId && <BottomNav />}
    </div>
  );
};

export default App;