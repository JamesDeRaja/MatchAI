export enum Page {
  AI_CHAT = 'AI_CHAT',
  EXPLORE = 'EXPLORE',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS',
}

export enum RelationshipType {
  SHORT_TERM = 'Short-term Relationship',
  LONG_TERM = 'Long-term Relationship',
  FRIENDSHIP = 'Friendship',
  GYM_BUDDY = 'Gym Buddy',
  MOVIE_BUDDY = 'Movie Buddy',
  STUDY_BUDDY = 'Study Buddy',
}

export interface UsersList {
  [key:string]:User
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  tags: {
    positive: string[];
    negative: string[];
  };
  onboardingCompleted: boolean;
  relationshipGoal?: RelationshipType;
  authType: 'guest' | 'google';
  onlineStatus: 'online' | string; // 'online' or ISO timestamp string
  selectedRelationshipGoal?:RelationshipType|null;
}

export interface OnboardingQuestion {
  question: string;
  options: string[];
}

export interface AiMessage {
  id:string;
  sender: 'user' | 'ai';
  text: string;
  options?: string[];
  onOptionSelect?: (option: string) => void;
}

export interface Match {
  user: User;
  matchExplanation: string;
  matchRating?: number;
}

export interface Message {
  id: string;
  senderId: string; // Corresponds to a User['id']
  text: string;
  timestamp: string; // ISO String
  imageUrl?: string;
}

export interface Conversation {
  id: string; // Unique ID for the conversation, same as participant.id
  participant: User; // The other person in the chat
  messages: Message[];
  unreadCount: number; // for the current user
}

export interface DecodedJwtPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
  exp?: number;
  iat?: number;
}

// Added for Explore Page cards
export interface ExploreCardData {
  id: string; // Corresponds to user.id
  user: User;
  type: 'match' | 'request';
  firstMessage: string;
}