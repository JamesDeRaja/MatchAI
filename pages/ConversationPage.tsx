import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { geminiService } from '../services/geminiService';
import { firebaseService } from '../services/firebase';

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);
const PaperclipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);

const TypingIndicator: React.FC<{avatar: string}> = ({ avatar }) => (
    <div className="flex items-end gap-2 max-w-sm animate-fade-in">
        <img src={avatar} alt="Typing" className="w-8 h-8 rounded-full"/>
        <div className="px-4 py-2 rounded-2xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 bg-rose-400 rounded-full animate-bounce"></span>
          </div>
        </div>
    </div>
);


const formatPresence = (onlineStatus: User['onlineStatus']) => {
    if (onlineStatus === 'online') return 'Online';

    const date = new Date(onlineStatus);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return "last seen just now";
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `last seen ${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays <= 1) return `last seen yesterday`;
    return `last seen on ${date.toLocaleDateString()}`;
};

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

const ParticipantProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    participant: User;
    explanation: string | null;
    rating: number | null;
    isLoading: boolean;
}> = ({ isOpen, onClose, participant, explanation, rating, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-sm w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative">
                    <img src={participant.avatar} alt={participant.name} className="w-full h-56 object-cover rounded-t-2xl" />
                    <button onClick={onClose} className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-1.5">&times;</button>
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{participant.name}</h3>
                            <p className={`text-sm mb-3 ${participant.onlineStatus === 'online' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>{formatPresence(participant.onlineStatus)}</p>
                        </div>
                        {rating !== null && !isLoading && <MatchRating rating={rating ?? undefined} />}
                    </div>
                    
                    <div className="bg-rose-50 dark:bg-gray-700 p-3 rounded-lg">
                       <h4 className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6h0a6 6 0 0 0-6 6v7a6 6 0 0 0 6 6Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 12h.01"/></svg>
                        AI Match Analysis
                       </h4>
                       <div className="mt-2 text-gray-700 dark:text-gray-300 text-sm max-h-32 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
                            </div>
                        ) : (
                            <p dangerouslySetInnerHTML={{ __html: explanation || 'Could not load analysis.' }} />
                        )}
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConversationPage: React.FC<{ conversationId: string }> = ({ conversationId }) => {
    const { user, conversations, setViewingConversationId, sendMessage, typingParticipantIds, usersList } = useAppContext();
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{explanation: string | null, rating: number | null}>({ explanation: null, rating: null });
    const [isExplanationLoading, setIsExplanationLoading] = useState(false);
    
    const [participant, setParticipant] = useState<User | undefined>(() => conversations.find(c => c.id === conversationId)?.participant);
    const [isLoadingParticipant, setIsLoadingParticipant] = useState<boolean>(!participant);

    const conversation = conversations.find(c => c.id === conversationId);
    
    useEffect(() => {
        const existingParticipant = conversations.find(c => c.id === conversationId)?.participant;
        if (existingParticipant) {
            setParticipant(existingParticipant);
            setIsLoadingParticipant(false);
        } else {
            setIsLoadingParticipant(true);
            firebaseService.getUserData(conversationId).then(data => {
                if (data?.userProfile) {
                    setParticipant(data.userProfile);
                }
                setIsLoadingParticipant(false);
            });
        }
    }, [conversationId, conversations]);

    const isParticipantTyping = participant ? typingParticipantIds.includes(participant.id) : false;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.messages, isParticipantTyping]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !participant) return;
        setNewMessage('');
        await sendMessage(participant.id, newMessage.trim());
    };
    
    const handleImageSend = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && participant) {
            const reader = new FileReader();
            reader.onload = async () => {
                const imageUrl = reader.result as string;
                setNewMessage('');
                await sendMessage(participant.id, newMessage, imageUrl);
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const openProfileModal = async () => {
        if (!participant || !user) return;
        
        setProfileModalOpen(true);
        setIsExplanationLoading(true);
        // Reset previous data while loading new
        setModalData({ explanation: null, rating: null });

        try {
            const { explanation, rating } = await geminiService.generateMatchExplanation(user, participant);
            setModalData({ explanation, rating });
        } catch (e) {
            console.error("Failed to generate match explanation:", e);
            setModalData({ explanation: "Could not load AI analysis at this time.", rating: null });
        } finally {
            setIsExplanationLoading(false);
        }
    };

    if (isLoadingParticipant) {
        return (
            <div className="flex justify-center items-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    if (!participant || !user) {
        return (
            <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                Could not load conversation.
                <button onClick={() => setViewingConversationId(null)} className="text-rose-500 block mx-auto mt-4">Go Back</button>
            </div>
        );
    }
    
    const isWaitingForFirstReply = conversation &&
        conversation.messages.length > 0 &&
        conversation.messages[0].senderId === user.id &&
        !conversation.messages.some(m => m.senderId === participant.id);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <ParticipantProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                participant={participant}
                explanation={modalData.explanation}
                rating={modalData.rating}
                isLoading={isExplanationLoading}
            />
            {/* Header */}
            <header className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black sticky top-0 z-10">
                <button onClick={() => setViewingConversationId(null)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors">
                    <BackIcon />
                </button>
                <button onClick={openProfileModal} className="flex items-center text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors">
                    <div className="relative">
                        <img src={usersList[participant.id]?.avatar||participant.avatar} alt={usersList[participant.id]?.name||participant.name} className="w-10 h-10 rounded-full ml-2"/>
                        {participant.onlineStatus === 'online' && (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-black"></span>
                        )}
                    </div>
                    <div className="ml-3">
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{participant.name}</h2>
                        <p className={`text-xs ${(usersList[participant.id]?.onlineStatus||participant.onlineStatus) === 'online' ? 'text-green-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatPresence(usersList[participant.id]?.onlineStatus||participant.onlineStatus)}
                        </p>
                    </div>
                </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversation?.messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2 rounded-2xl max-w-sm animate-fade-in ${msg.senderId === user.id ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}`}>
                             {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="User upload" className="rounded-lg mb-2 max-w-xs object-cover" />
                            )}
                            {msg.text && <p>{msg.text}</p>}
                        </div>
                    </div>
                ))}
                {!conversation && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-fade-in">
                        Start the conversation! Send the first message to {participant.name}.
                    </div>
                )}
                 {isWaitingForFirstReply && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-fade-in">
                        You've sent a message. Wait for {participant.name} to reply!
                    </div>
                )}
                {isParticipantTyping && <TypingIndicator avatar={participant.avatar} />}
                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-2 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSend}
                        className="hidden"
                        accept="image/*"
                    />
{/*                     Enable if you need file upload
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                        <PaperclipIcon />
                    </button> */}
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isWaitingForFirstReply ? "Waiting for reply..." : "Type a message..."}
                        className="flex-1 w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-800 dark:text-gray-200 transition"
                        disabled={isWaitingForFirstReply || isParticipantTyping}
                    />
                    <button type="submit" disabled={!newMessage.trim() && !fileInputRef.current?.files?.length || isWaitingForFirstReply || isParticipantTyping} className="p-3 bg-rose-500 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-rose-600 transition-all transform hover:scale-110">
                       <SendIcon/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConversationPage;
