import { User, Conversation, Message, RelationshipType } from './types';

export const GUEST_USER: User = {
  id: 'guest-user',
  name: 'Guest',
  avatar: 'https://picsum.photos/seed/guest/200',
  tags: { positive: [], negative: [] },
  onboardingCompleted: false,
  authType: 'guest',
  onlineStatus: 'online',
};

export const MOCK_USERS: User[] = [
  {
    id: 'mock-user-1',
    name: 'Alex',
    avatar: 'https://picsum.photos/seed/alex/200',
    tags: { positive: ['hiking', 'sci-fi movies', 'dogs'], negative: ['crowds'] },
    onboardingCompleted: true,
    relationshipGoal: RelationshipType.FRIENDSHIP,
    authType: 'guest',
    onlineStatus: 'online',
  },
  {
    id: 'mock-user-2',
    name: 'Benny',
    avatar: 'https://picsum.photos/seed/benny/200',
    tags: { positive: ['live music', 'foodie', 'travel'], negative: ['early mornings'] },
    onboardingCompleted: true,
    relationshipGoal: RelationshipType.LONG_TERM,
    authType: 'guest',
    onlineStatus: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'mock-user-3',
    name: 'Casey',
    avatar: 'https://picsum.photos/seed/casey/200',
    tags: { positive: ['gaming', 'anime', 'coffee'], negative: ['loud noises'] },
    onboardingCompleted: true,
    relationshipGoal: RelationshipType.SHORT_TERM,
    authType: 'guest',
    onlineStatus: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'mock-user-4',
    name: 'Dana',
    avatar: 'https://picsum.photos/seed/dana/200',
    tags: { positive: ['yoga', 'reading', 'cats'], negative: ['spicy food'] },
    onboardingCompleted: true,
    relationshipGoal: RelationshipType.STUDY_BUDDY,
    authType: 'guest',
    onlineStatus: 'online',
  },
];

export const getInitialMockChats = (currentUser: User): Conversation[] => {
    const chatUser = MOCK_USERS[1]; // Let's have everyone start a chat with Benny
    if (!chatUser || currentUser.id === chatUser.id) return [];

    const messages: Message[] = [
        {
            id: `msg-${Date.now()}`,
            senderId: chatUser.id,
            text: `Hey ${currentUser.name}! Saw your profile, we seem to have some stuff in common. How's it going?`,
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        }
    ];

    return [
        {
            id: chatUser.id,
            participant: chatUser,
            messages,
            unreadCount: 1,
        }
    ];
};