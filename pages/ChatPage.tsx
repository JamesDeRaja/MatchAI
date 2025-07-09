import React, { useState, useMemo } from 'react';
import { Conversation, User } from '../types';
import { useAppContext } from '../context/AppContext';

type ChatTab = 'conversations' | 'requests';

const ConversationItem: React.FC<{ conversation: Conversation }> = ({ conversation }) => {
    const { setViewingConversationId, user, usersList } = useAppContext();
    const lastMessage = conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1] : null;
  
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        
        if (diffSeconds < 60) return "Just now";
        const diffMinutes = Math.round(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.round(diffHours / 24);
        if (diffDays === 1) return "Yesterday";
        return date.toLocaleDateString();
    };

    const formatPresence = (onlineStatus: User['onlineStatus']): React.ReactNode => {
      if (onlineStatus === 'online') {
        return <span className="text-green-500">Online</span>;
      }
      const date = new Date(onlineStatus);
      const now = new Date();
      const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
      
      if (diffSeconds < 60) return "Last seen just now";
      const diffMinutes = Math.round(diffSeconds / 60);
      if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
      const diffHours = Math.round(diffMinutes / 60);
      if (diffHours < 24) return `Last seen ${diffHours}h ago`;
      const diffDays = Math.round(diffHours / 24);
      if (diffDays <= 1) return `Last seen yesterday`;
      return `Last seen on ${date.toLocaleDateString()}`;
    }

  return (
    <div onClick={() => setViewingConversationId(conversation.id)} className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors duration-200">
      <div className="relative flex-shrink-0">
        <img src={usersList[conversation?.participant?.id]?.avatar||conversation.participant.avatar} alt={usersList[conversation.participant.id]?.name||conversation.participant.name} className="w-14 h-14 rounded-full object-cover" />
        {conversation.participant.onlineStatus === 'online' && (
            <span className="absolute bottom-0.5 right-0.5 block h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-black"></span>
        )}
        {conversation.unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
              {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 ml-4 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white">{usersList[conversation.participant.id]?.name||conversation.participant.name}</h3>
          {lastMessage && <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{formatTimestamp(lastMessage.timestamp)}</p>}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {lastMessage ? 
                (lastMessage.senderId === user?.id ? "You: " : "") + lastMessage.text : 
                formatPresence(conversation.participant.onlineStatus)
            }
        </p>
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const { myConversations, requests, totalUnreadCount } = useAppContext();
  const [activeTab, setActiveTab] = useState<ChatTab>('conversations');

  const TabButton: React.FC<{ tab: ChatTab; label: string; count: number }> = ({ tab, label, count }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`w-full py-3 text-center font-semibold transition-colors duration-300 ${
          isActive ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label} {count > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{count > 9 ? '9+' : count}</span>}
      </button>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chats</h1>
      </div>
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <TabButton tab="conversations" label="Conversations" count={totalUnreadCount} />
        <TabButton tab="requests" label="Requests" count={requests.length} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' && (
          <div className="p-2 space-y-1">
            {myConversations.map(convo => (
              <ConversationItem key={convo.id} conversation={convo} />
            ))}
            {myConversations.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No active conversations yet.</p>}
          </div>
        )}
        {activeTab === 'requests' && (
          <div className="p-2 space-y-1">
            {requests.map(req => (
              <ConversationItem key={req.id} conversation={req} />
            ))}
            {requests.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No new requests.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;