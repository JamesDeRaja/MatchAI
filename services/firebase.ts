import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { User, Conversation, RelationshipType } from '../types';
import { getInitialMockChats } from '../constants';      // ← needed later

const USERS_COLLECTION = 'users';
const EXPLORED_COLLECTION = 'explored';

export interface FirestoreUserData {
  userProfile: User;
  aiChatMessages: any[];                  // or AiMessage[] if you decide to import it
  conversations: Conversation[];
  onboardingStep: number;
  onboardingProgress: number;
  userTags: { positive: string[]; negative: string[] };
  selectedRelationshipGoal: RelationshipType | null;
  showExploreTabNotification: boolean;
  dismissedUserIds: string[];
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVlvJioJ9Fu0jrEJugase5hSjUkCGObbE",
  authDomain: "kindred-464615.firebaseapp.com",
  projectId: "kindred-464615",
  storageBucket: "kindred-464615.firebasestorage.app",
  messagingSenderId: "389974416412",
  appId: "1:389974416412:web:31d7bc64919998ae8653d9",
  measurementId: "G-XV9H4S0Q6Q"
};


class FirebaseService {
    app: firebase.app.App;
    auth: firebase.auth.Auth;
    db: firebase.firestore.Firestore;
    googleProvider: firebase.auth.GoogleAuthProvider;

    constructor() {
        if (!firebase.apps.length) {
            this.app = firebase.initializeApp(firebaseConfig);
        } else {
            this.app = firebase.app();
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.googleProvider = new firebase.auth.GoogleAuthProvider();

        this.db.enablePersistence().catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Firebase persistence failed: multiple tabs open.');
            } else if (err.code == 'unimplemented') {
                console.warn('Firebase persistence not available in this browser.');
            }
        });
    }

    // --- Auth Methods ---
    
    onAuthChange(callback: (user: firebase.User | null) => void) {
        return this.auth.onAuthStateChanged(callback);
    }

    async signInWithGoogle() {
        return this.auth.signInWithPopup(this.googleProvider);
    }

    async signInGuest() {
        return this.auth.signInAnonymously();
    }

    async signOut() {
        const userId = this.auth.currentUser?.uid;
        if (userId) {
            await this.updateUserOnlineStatus(userId, new Date().toISOString());
        }
        return this.auth.signOut();
    }
    
    // --- Firestore Methods ---

    private processDocSnapshot(doc: firebase.firestore.DocumentSnapshot): FirestoreUserData | null {
        if (!doc.exists) {
            return null;
        }

        const data = doc.data() as any;

        const convertTimestamps = (obj: any): any => {
            if (!obj) return obj;
            if (obj instanceof firebase.firestore.Timestamp) {
                return obj.toDate().toISOString();
            }
            if (Array.isArray(obj)) {
                return obj.map(convertTimestamps);
            }
            if (typeof obj === 'object' && obj !== null) {
                const newObj: { [key: string]: any } = {};
                for (const key in obj) {
                    newObj[key] = convertTimestamps(obj[key]);
                }
                return newObj;
            }
            return obj;
        };

        return convertTimestamps(data) as FirestoreUserData;
    }
    
    onUserDataUpdate(userId: string, callback: (data: FirestoreUserData | null) => void) {
        const userDocRef = this.getUserDocRef(userId);
        return userDocRef.onSnapshot(
            (doc) => {
                const data = this.processDocSnapshot(doc);
                callback(data);
            },
            (error) => {
                console.error("Error in onUserDataUpdate listener:", error);
                callback(null);
            }
        );
    }

    getUserDocRef(userId: string) {
        return this.db.collection(USERS_COLLECTION).doc(userId);
    }
    
    async getUserData(userId: string): Promise<FirestoreUserData | null> {
        try {
            const userDoc = await this.getUserDocRef(userId).get();
            return this.processDocSnapshot(userDoc);
        } catch (error) {
            console.error("Error getting user data:", error);
            if ((error as any).code === 'unavailable' || (error as any).code === 'cancelled') {
                 console.error("Firestore is offline or the request was cancelled.");
            }
            return null;
        }
    }
    
    async getAllUsers(): Promise<User[]> {
        try {
            const usersSnapshot = await this.db.collection(USERS_COLLECTION).get();
            if (usersSnapshot.empty) {
                console.log("No users found in Firestore.");
                return [];
            }
            const users: User[] = [];
            usersSnapshot.forEach(doc => {
                const data = doc.data() as FirestoreUserData;
                // Ensure userProfile exists and has an id before pushing
                if (data.userProfile && data.userProfile.id) {
                    users.push(data.userProfile);
                }
            });
            return users;
        } catch (error) {
            console.error("Error getting all users:", error);
            return [];
        }
    }

    async createInitialUserData(
      firebaseUser: firebase.User,
      guestUserShell?: User
    ) {
      const uid = firebaseUser.uid;
    
      // 1. Build a complete User object
      const userProfile: User =
        guestUserShell ??
        ({
          id: uid,
          name: firebaseUser.displayName ?? 'New user',
          avatar:
            firebaseUser.photoURL ??
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              firebaseUser.displayName ?? 'U'
            )}`,
          authType: firebaseUser.isAnonymous ? 'guest' : 'google',
          tags: { positive: [], negative: [] },
          onboardingCompleted: false,
          onlineStatus: 'online',
        } as User);
    
      // 2. Build the **full schema** expected by the app
      const initialData: FirestoreUserData = {
        userProfile,
        aiChatMessages: [],
        conversations: [],
        onboardingStep: 0,
        onboardingProgress: 0,
        userTags: { positive: [], negative: [] },
        selectedRelationshipGoal: null,
        showExploreTabNotification: false,
        dismissedUserIds: [],
      };
    
      // 3. Write it once, with merge:false so we never leave half-baked docs
      await this.db.collection('users').doc(uid).set(initialData, {
        merge: false,
      });
    }
    
    async updateUserData(userId: string, data: Partial<FirestoreUserData>) {
        const userRef = this.getUserDocRef(userId);
        
        const replacer = (key: string, value: any) => {
            if (key === 'onOptionSelect') {
                return undefined;
            }
            return value;
        };

        try {
            const sanitizedData = JSON.parse(JSON.stringify(data, replacer));
            return await userRef.update(sanitizedData);
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('circular structure')) {
                console.error("Critical Error: A circular reference was detected in the application state, preventing data from being saved. This is a bug that needs to be fixed.", {data});
            } else {
                console.error("Failed to serialize or update user data:", error);
            }
        }
    }

    async function updateUserOnlineStatus(uid: string, status: string) {
      const ref = firebase.firestore().doc(`users/${uid}`);
      await ref.set(
        { userProfile: { onlineStatus: status } },
        { merge: true }
      );
    }

    // --- Explored Collection Methods ---

    async addDismissedUser(currentUserId: string, dismissedUserId: string) {
        const exploredRef = this.db.collection(EXPLORED_COLLECTION).doc(currentUserId);
        try {
            await exploredRef.set({
                dismissedIds: firebase.firestore.FieldValue.arrayUnion(dismissedUserId)
            }, { merge: true });
        } catch (error) {
            console.error("Error adding dismissed user:", error);
        }
    }

    async getDismissedIds(userId: string): Promise<string[]> {
        const exploredRef = this.db.collection(EXPLORED_COLLECTION).doc(userId);
        try {
            const doc = await exploredRef.get();
            if (!doc.exists) {
                return [];
            }
            return doc.data()?.dismissedIds || [];
        } catch (error) {
            console.error("Error getting dismissed IDs:", error);
            return [];
        }
    }
}

export const firebaseService = new FirebaseService();
