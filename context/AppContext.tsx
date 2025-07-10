
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { Page, User, RelationshipType, AiMessage, Conversation, Message, ExploreCardData } from '../types';
import { GUEST_USER, MOCK_USERS } from '../constants';
import { firebaseService, FirestoreUserData } from '../services/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { geminiService } from '../services/geminiService';


interface AppContextType {
  user: User | null;
  isInitialized: boolean;
  activePage: Page;
  onboardingProgress: number;
  signInAsGuest: () => void;
  signInWithGoogle: () => void;
  signOut: () => void;
  setActivePage: (page: Page) => void;
  updateOnboardingProgress: (progress: number) => void;
  completeOnboarding: (relationshipGoal: RelationshipType, tags: { positive: string[], negative:string[] }) => void;
  updateUserProfile: (name: string, avatar: string) => void;
  updateUserTagsInProfile: (tags: { positive: string[]; negative: string[] }) => void;
  
  aiChatMessages: AiMessage[];
  addAiChatMessage: (message: AiMessage) => void;
  updateAiChatMessage: (messageId: string, updates: Partial<AiMessage>) => void;
  setAiChatMessages: (messages: AiMessage[]) => void;
  
  onboardingStep: number;
  updateOnboardingStep: (step: number) => void;
  userTags: { positive: string[], negative: string[] };
  updateUserTags: (tags: { positive: string[], negative: string[] }) => void;
  selectedRelationshipGoal: RelationshipType | null;
  setSelectedRelationshipGoal: (goal: RelationshipType | null) => void;

  conversations: Conversation[];
  requests: Conversation[];
  myConversations: Conversation[];
  viewingConversationId: string | null;
  setViewingConversationId: (id: string | null) => void;
  sendMessage: (participantId: string, text: string, imageUrl?: string) => void;
  typingParticipantIds: string[];

  exploreUsers: User[];
  dismissExploreUser: (userId: string) => void;

  showExploreTabNotification: boolean;
  totalUnreadCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activePage, _setActivePage] = useState<Page>(Page.AI_CHAT);
  const [onboardingProgress, setOnboardingProgress] = useState(0);

  const [aiChatMessages, setAiChatMessages] = useState<AiMessage[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userTags, setUserTags] = useState<{ positive: string[], negative: string[] }>({ positive: [], negative: [] });
  const [selectedRelationshipGoal, setSelectedRelationshipGoal] = useState<RelationshipType | null>(null);

  const [conversations, setConversations] =useState<Conversation[]>([]);
  const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);
  const [typingParticipantIds, setTypingParticipantIds] = useState<string[]>([]);

  const [exploreUsers, setExploreUsers] = useState<User[]>([]);

  const [showExploreTabNotification, setShowExploreTabNotification] = useState(false);
  
  const prevConversationsLength = useRef<number | undefined>(undefined);

  const setActivePage = useCallback((page: Page) => {
    if (page === Page.EXPLORE) {
      setShowExploreTabNotification(false);
      if (user) {
        firebaseService.updateUserData(user.id, { showExploreTabNotification: false });
      }
    }
    _setActivePage(page);
  }, [user]);

  const { requests, myConversations } = useMemo(() => {
    if (!user) return { requests: [], myConversations: [] };
    
    const reqs: Conversation[] = [];
    const convos: Conversation[] = [];

    conversations.forEach(c => {
      if (c.messages.length === 0) return;

      const iReplied = c.messages.some(m => m.senderId === user.id);
      const theyStarted = c.messages[0].senderId === c.participant.id;

      if (theyStarted && !iReplied) {
        reqs.push(c);
      } else {
        convos.push(c);
      }
    });

    const sortByMostRecent = (a: Conversation, b: Conversation) => 
        new Date(b.messages[b.messages.length - 1].timestamp).getTime() - 
        new Date(a.messages[a.messages.length - 1].timestamp).getTime();

    return { 
      requests: reqs.sort(sortByMostRecent), 
      myConversations: convos.sort(sortByMostRecent) 
    };
  }, [conversations, user]);
  
  const totalUnreadCount = useMemo(() => {
    if (!user) return 0;
    
    return myConversations.reduce((count, convo) => {
        return count + convo.unreadCount;
    }, 0);
  }, [myConversations, user]);

  const dismissExploreUser = useCallback(async (dismissedUserId: string) => {
    if (!user) return;
    
    if (!MOCK_USERS.some(mock => mock.id === dismissedUserId)) {
      await firebaseService.addDismissedUser(user.id, dismissedUserId);
    }

    setExploreUsers(prev => prev.filter(u => u.id !== dismissedUserId));
    setConversations(prev => prev.filter(c => c.participant.id !== dismissedUserId));
  }, [user]);

  useEffect(() => {
    let unsubscribeData: (() => void) | null = null;

    const unsubscribeAuth = firebaseService.onAuthChange(async (firebaseUser: firebase.User | null) => {
        if (unsubscribeData) {
            unsubscribeData();
            unsubscribeData = null;
        }

        if (firebaseUser) {
            await firebaseService.updateUserOnlineStatus(firebaseUser.uid, 'online');
            
            unsubscribeData = firebaseService.onUserDataUpdate(firebaseUser.uid, async (data) => {
                if (data) {
                    setUser(data.userProfile);
                    setAiChatMessages(data.aiChatMessages || []);
                    setConversations(data.conversations || []);
                    setOnboardingStep(data.onboardingStep || 0);
                    setUserTags(data.userTags || { positive: [], negative: [] });
                    setSelectedRelationshipGoal(data.selectedRelationshipGoal || null);
                    setOnboardingProgress(data.onboardingProgress || 0);
                    setShowExploreTabNotification(data.showExploreTabNotification || false);
                    setIsInitialized(true);
                } else {
                    // Data is null, probably a new user, so create their data
                    const guestUserShell = firebaseUser.isAnonymous ? GUEST_USER : undefined;
                    await firebaseService.createInitialUserData(firebaseUser, guestUserShell);
                    // The listener will be triggered again with the new data
                }
            });
        } else {
            // Signed out
            setUser(null);
            setAiChatMessages([]);
            setConversations([]);
            setOnboardingStep(0);
            setUserTags({ positive: [], negative: [] });
            setSelectedRelationshipGoal(null);
            setOnboardingProgress(0);
            setShowExploreTabNotification(false);
            setExploreUsers([]);
            _setActivePage(Page.AI_CHAT);
            setViewingConversationId(null);
            setIsInitialized(true);
        }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeData) {
            unsubscribeData();
        }
    };
  }, []);

  useEffect(() => {
      const handleVisibilityChange = () => {
          if (!user) return;
          if (document.visibilityState === 'hidden') {
              firebaseService.updateUserOnlineStatus(user.id, new Date().toISOString());
          } else {
              firebaseService.updateUserOnlineStatus(user.id, 'online');
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [user]);

  const signInAsGuest = useCallback(async () => {
      try {
          await firebaseService.signInGuest();
      } catch (error) {
          console.error("Error signing in as guest:", error);
      }
  }, []);

  const signInWithGoogle = useCallback(async () => {
      try {
          await firebaseService.signInWithGoogle();
      } catch (error) {
          console.error("Error signing in with Google:", error);
      }
  }, []);

  const signOut = useCallback(async () => {
      try {
          if (user) {
            await firebaseService.updateUserOnlineStatus(user.id, new Date().toISOString());
          }
          await firebaseService.signOut();
      } catch (error) {
          console.error("Error signing out:", error);
      }
  }, [user]);
  
  const sendMessage = useCallback(async (participantId: string, text: string, imageUrl?: string) => {
    if (!user) return;

    const isMockParticipant = MOCK_USERS.some(u => u.id === participantId);

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      text,
      timestamp: new Date().toISOString(),
      ...(imageUrl && { imageUrl }),
    };

    // --- Update SENDER's state locally & persist ---
    const senderConvo = conversations.find(c => c.participant.id === participantId);
    let updatedSenderConversations;
    let targetConversation;

    if (senderConvo) {
      targetConversation = { ...senderConvo, messages: [...senderConvo.messages, newMessage] };
      updatedSenderConversations = conversations.map(c => c.id === participantId ? targetConversation : c);
    } else {
      let participantData = isMockParticipant 
        ? MOCK_USERS.find(u => u.id === participantId) 
        : (await firebaseService.getUserData(participantId))?.userProfile;

      if (!participantData) {
        console.error("Could not find participant to send message");
        return;
      }
      targetConversation = { id: participantData.id, participant: participantData, messages: [newMessage], unreadCount: 0 };
      updatedSenderConversations = [targetConversation, ...conversations];
    }
    setConversations(updatedSenderConversations);
    await firebaseService.updateUserData(user.id, { conversations: updatedSenderConversations });
    setUser(prev => prev ? { ...prev, onlineStatus: 'online' } : null);

    // --- Handle PARTICIPANT's state ---
    if (isMockParticipant && targetConversation) {
        setTypingParticipantIds(prev => [...prev, participantId]);
        const randomDelay = Math.random() * 4000 + 1000;
        
        setTimeout(async () => {
            try {
                const aiResponseText = await geminiService.generateChatResponse(user, targetConversation!.participant, targetConversation!.messages);
                const aiMessage: Message = { id: `msg-${Date.now() + 1}`, senderId: participantId, text: aiResponseText, timestamp: new Date().toISOString() };
                
                let finalConversationsWithAiReply;
                
                setConversations(currentConversations => {
                    finalConversationsWithAiReply = currentConversations.map(c => 
                        c.id === participantId ? { ...c, messages: [...c.messages, aiMessage] } : c
                    );
                    return finalConversationsWithAiReply;
                });
                
                if (finalConversationsWithAiReply) {
                    await firebaseService.updateUserData(user.id, { conversations: finalConversationsWithAiReply });
                }

            } catch(error) {
                console.error("Failed to get AI response", error);
            } finally {
                setTypingParticipantIds(prev => prev.filter(id => id !== participantId));
            }
        }, randomDelay);

    } else if (!isMockParticipant) {
        // Persist message to REAL participant's document in Firestore
        const participantDoc = await firebaseService.getUserData(participantId);
        if (participantDoc) {
            const pConvos = participantDoc.conversations || [];
            const convoWithCurrentUser = pConvos.find(c => c.participant.id === user.id);
            let updatedParticipantConversations;

            if (convoWithCurrentUser) {
                updatedParticipantConversations = pConvos.map(c => 
                    c.id === user.id ? { ...c, messages: [...c.messages, newMessage], unreadCount: (c.unreadCount || 0) + 1 } : c
                );
            } else {
                const newConvoForParticipant = { id: user.id, participant: user, messages: [newMessage], unreadCount: 1 };
                updatedParticipantConversations = [newConvoForParticipant, ...pConvos];
            }
            await firebaseService.updateUserData(participantId, { conversations: updatedParticipantConversations });
        }
    }
  }, [user, conversations, viewingConversationId]);


  const handleSetViewingConversationId = useCallback((id: string | null) => {
      if (id && user) {
          const updatedConversations = conversations.map(c => 
              c.id === id ? { ...c, unreadCount: 0 } : c
          );
          if (JSON.stringify(updatedConversations) !== JSON.stringify(conversations)) {
              setConversations(updatedConversations);
              firebaseService.updateUserData(user.id, { conversations: updatedConversations });
          }
      }
      setViewingConversationId(id);
  }, [user, conversations]);

  const _updateAndPersist = useCallback((updates: Partial<FirestoreUserData>) => {
      if(user) firebaseService.updateUserData(user.id, updates);
  }, [user]);

  const addAiChatMessage = useCallback((message: AiMessage) => {
      const newMessages = [...aiChatMessages, message];
      setAiChatMessages(newMessages);
      _updateAndPersist({ aiChatMessages: newMessages.map(({onOptionSelect, ...rest}) => rest) });
  }, [aiChatMessages, _updateAndPersist]);
  
  const updateAiChatMessage = useCallback((messageId: string, updates: Partial<AiMessage>) => {
      const newMessages = aiChatMessages.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg));
      setAiChatMessages(newMessages);
      _updateAndPersist({ aiChatMessages: newMessages.map(({onOptionSelect, ...rest}) => rest) });
  }, [aiChatMessages, _updateAndPersist]);

  const setAiChatMessagesAndPersist = useCallback((messages: AiMessage[]) => {
      setAiChatMessages(messages);
      _updateAndPersist({ aiChatMessages: messages.map(({onOptionSelect, ...rest}) => rest) });
  }, [_updateAndPersist]);

  const updateOnboardingStep = useCallback((step: number) => {
      setOnboardingStep(step);
      _updateAndPersist({ onboardingStep: step });
  }, [_updateAndPersist]);

  const updateUserTags = useCallback((tags: { positive: string[]; negative: string[] }) => {
      setUserTags(tags);
      _updateAndPersist({ userTags: tags });
  }, [_updateAndPersist]);

  const setSelectedRelationshipGoalAndPersist = useCallback((goal: RelationshipType | null) => {
      setSelectedRelationshipGoal(goal);
      _updateAndPersist({ selectedRelationshipGoal: goal });
  }, [_updateAndPersist]);

  const updateOnboardingProgress = useCallback((progress: number) => {
      setOnboardingProgress(progress);
      _updateAndPersist({ onboardingProgress: progress });
  }, [_updateAndPersist]);
  
  const completeOnboarding = useCallback((relationshipGoal: RelationshipType, tags: { positive: string[], negative: string[] }) => {
    const updatedUser = user ? { ...user, onboardingCompleted: true, relationshipGoal, tags } : null;
    if (updatedUser) {
        setUser(updatedUser);
        setOnboardingProgress(100);
        setShowExploreTabNotification(true);
        _updateAndPersist({
            userProfile: updatedUser,
            onboardingProgress: 100,
            showExploreTabNotification: true,
        });
    }
  }, [user, _updateAndPersist]);

  const updateUserProfile = useCallback((name: string, avatar: string) => {
      const updatedUser = user ? { ...user, name, avatar } : null;
      if (updatedUser) {
          setUser(updatedUser);
          _updateAndPersist({ userProfile: updatedUser });
      }
  }, [user, _updateAndPersist]);

  const updateUserTagsInProfile = useCallback((tags: { positive: string[]; negative: string[] }) => {
    if (!user || !user.onboardingCompleted) return;
    const newPositive = [...new Set([...user.tags.positive, ...tags.positive])];
    const newNegative = [...new Set([...user.tags.negative, ...tags.negative])];
    const updatedUser = { ...user, tags: { positive: newPositive, negative: newNegative } };
    setUser(updatedUser);
    _updateAndPersist({ userProfile: updatedUser });
  }, [user, _updateAndPersist]);

  const generateExploreUsers = useCallback(async () => {
      if (!user || !user.onboardingCompleted) return;

      const [firebaseUsers, dismissedIds] = await Promise.all([
          firebaseService.getAllUsers(),
          firebaseService.getDismissedIds(user.id),
      ]);
      
      const allPossibleUsers = [...MOCK_USERS, ...firebaseUsers];
      
      const dismissedIdsSet = new Set(dismissedIds);
      const conversationParticipantIds = new Set(
          conversations.map(c => c.participant.id)
      );
      
      const addedUserIds = new Set<string>();
      const potentialMatches = allPossibleUsers.filter(
          (potentialMatch) => {
              if (addedUserIds.has(potentialMatch.id)) {
                  return false;
              }
              
              const isInvalid =
                  potentialMatch.id === user.id ||
                  !potentialMatch.onboardingCompleted ||
                  conversationParticipantIds.has(potentialMatch.id) ||
                  dismissedIdsSet.has(potentialMatch.id);
              
              if (!isInvalid) {
                  addedUserIds.add(potentialMatch.id);
              }

              return !isInvalid;
          }
      );
      
      potentialMatches.sort(() => Math.random() - 0.5);
      setExploreUsers(potentialMatches);
  }, [user, conversations]);

  useEffect(() => {
    const isInitialLoad = prevConversationsLength.current === undefined;
    const newChatStarted = !isInitialLoad && conversations.length > prevConversationsLength.current!;

    if (user?.onboardingCompleted) {
        if (isInitialLoad || newChatStarted) {
            generateExploreUsers();
        }
    } else {
        setExploreUsers([]);
    }
    
    prevConversationsLength.current = conversations.length;
  }, [user?.onboardingCompleted, conversations, generateExploreUsers]);

  const contextValue: AppContextType = {
    user, isInitialized, activePage, onboardingProgress, signInAsGuest, signInWithGoogle, signOut,
    setActivePage, updateOnboardingProgress, completeOnboarding,
    updateUserProfile, updateUserTagsInProfile, aiChatMessages, addAiChatMessage, updateAiChatMessage,
    setAiChatMessages: setAiChatMessagesAndPersist, onboardingStep, updateOnboardingStep, userTags,
    updateUserTags, selectedRelationshipGoal, setSelectedRelationshipGoal: setSelectedRelationshipGoalAndPersist,
    conversations, requests, myConversations, viewingConversationId, setViewingConversationId: handleSetViewingConversationId, sendMessage,
    typingParticipantIds, exploreUsers, dismissExploreUser, showExploreTabNotification, totalUnreadCount
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export { Page };
