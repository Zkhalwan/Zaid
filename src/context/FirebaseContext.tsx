import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle,
  logOut,
  getAccessToken,
  setAccessToken,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { AiTool } from '../data/toolsData';

export interface ToolReviewItem {
  id: string;
  toolId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomPromptItem {
  id: string;
  userId: string;
  toolName: string;
  title: string;
  category: string;
  prompt: string;
  createdAt: string;
  updatedAt?: string;
}

interface FirebaseContextType {
  user: User | null;
  authLoading: boolean;
  accessToken: string | null;
  signIn: () => Promise<string | null>;
  signOut: () => Promise<void>;
  getDriveToken: () => Promise<string | null>;
  // Favorites
  favorites: string[];
  isFavorite: (toolId: string) => boolean;
  toggleFavorite: (tool: AiTool) => Promise<void>;
  // Reviews
  reviews: ToolReviewItem[];
  getToolReviews: (toolId: string) => ToolReviewItem[];
  addReview: (toolId: string, rating: number, comment: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  // Custom Prompts
  customPrompts: CustomPromptItem[];
  addCustomPrompt: (toolName: string, title: string, category: string, prompt: string) => Promise<void>;
  deleteCustomPrompt: (promptId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessToken, setTokenState] = useState<string | null>(getAccessToken());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ToolReviewItem[]>([]);
  const [customPrompts, setCustomPrompts] = useState<CustomPromptItem[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Sync user profile document to /users/{uid}
        try {
          await setDoc(
            doc(db, 'users', currentUser.uid),
            {
              id: currentUser.uid,
              displayName: (currentUser.displayName || 'مستخدم مسجل').slice(0, 100),
              email: (currentUser.email || '').slice(0, 200),
              photoURL: (currentUser.photoURL || '').slice(0, 500),
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );

          // Silently sync user to Cloud SQL database via backend
          const idToken = await currentUser.getIdToken();
          fetch('/api/user/sync', {
            headers: { Authorization: `Bearer ${idToken}` },
          }).catch((err) => {
            console.warn('Cloud SQL user background sync note:', err);
          });
        } catch (err) {
          console.warn('Profile sync note:', err);
        }
      } else {
        setFavorites([]);
        setCustomPrompts([]);
        setAccessToken(null);
        setTokenState(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Favorites Listener
  useEffect(() => {
    if (!user) return;

    const favoritesPath = `users/${user.uid}/favorites`;
    const unsubFavorites = onSnapshot(
      collection(db, 'users', user.uid, 'favorites'),
      (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.toolId) {
            ids.push(data.toolId);
          }
        });
        setFavorites(ids);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, favoritesPath);
      }
    );

    return () => unsubFavorites();
  }, [user]);

  // 3. User Custom Prompts Listener
  useEffect(() => {
    if (!user) return;

    const promptsPath = `users/${user.uid}/custom_prompts`;
    const unsubPrompts = onSnapshot(
      collection(db, 'users', user.uid, 'custom_prompts'),
      (snapshot) => {
        const items: CustomPromptItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as CustomPromptItem);
        });
        setCustomPrompts(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, promptsPath);
      }
    );

    return () => unsubPrompts();
  }, [user]);

  // 4. Public Reviews Listener
  useEffect(() => {
    const reviewsPath = 'tool_reviews';
    const q = query(collection(db, 'tool_reviews'), limit(150));
    const unsubReviews = onSnapshot(
      q,
      (snapshot) => {
        const items: ToolReviewItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ToolReviewItem);
        });
        items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setReviews(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, reviewsPath);
      }
    );

    return () => unsubReviews();
  }, []);

  const handleSignIn = async (): Promise<string | null> => {
    const result = await signInWithGoogle();
    setTokenState(result.accessToken);
    return result.accessToken;
  };

  const handleSignOut = async () => {
    await logOut();
    setTokenState(null);
  };

  const getDriveToken = async (): Promise<string | null> => {
    const current = getAccessToken();
    if (current) return current;
    // If user is logged in but token was cleared on page refresh, prompt popup sign-in
    const res = await handleSignIn();
    return res;
  };

  // Toggle favorite for tool
  const toggleFavorite = async (tool: AiTool) => {
    if (!user) {
      await handleSignIn();
      return;
    }

    const path = `users/${user.uid}/favorites/${tool.id}`;
    const isCurrentlyFav = favorites.includes(tool.id);

    try {
      if (isCurrentlyFav) {
        await deleteDoc(doc(db, 'users', user.uid, 'favorites', tool.id));
      } else {
        await setDoc(doc(db, 'users', user.uid, 'favorites', tool.id), {
          id: tool.id,
          userId: user.uid,
          toolId: tool.id,
          toolName: tool.name.slice(0, 100),
          arabicName: (tool.arabicName || '').slice(0, 100),
          category: (tool.category || '').slice(0, 50),
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      handleFirestoreError(
        error,
        isCurrentlyFav ? OperationType.DELETE : OperationType.CREATE,
        path
      );
    }
  };

  const isFavorite = (toolId: string) => favorites.includes(toolId);

  // Reviews helpers
  const getToolReviews = (toolId: string) => {
    return reviews.filter((r) => r.toolId.toLowerCase() === toolId.toLowerCase());
  };

  const addReview = async (toolId: string, rating: number, comment: string) => {
    if (!user) {
      await handleSignIn();
      return;
    }

    const path = 'tool_reviews';
    try {
      const reviewDocRef = doc(collection(db, 'tool_reviews'));
      const newReview: ToolReviewItem = {
        id: reviewDocRef.id,
        toolId: toolId.slice(0, 64),
        userId: user.uid,
        userName: (user.displayName || 'مستخدم مسجل').slice(0, 100),
        userPhoto: (user.photoURL || '').slice(0, 500),
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment.trim().slice(0, 1500),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(reviewDocRef, newReview);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return;
    const path = `tool_reviews/${reviewId}`;
    try {
      await deleteDoc(doc(db, 'tool_reviews', reviewId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Custom prompts helpers
  const addCustomPrompt = async (
    toolName: string,
    title: string,
    category: string,
    prompt: string
  ) => {
    if (!user) {
      await handleSignIn();
      return;
    }

    const path = `users/${user.uid}/custom_prompts`;
    try {
      const promptDocRef = doc(collection(db, 'users', user.uid, 'custom_prompts'));
      const newPrompt: CustomPromptItem = {
        id: promptDocRef.id,
        userId: user.uid,
        toolName: toolName.trim().slice(0, 100),
        title: title.trim().slice(0, 150),
        category: (category || 'عام').trim().slice(0, 64),
        prompt: prompt.trim().slice(0, 5000),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(promptDocRef, newPrompt);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteCustomPrompt = async (promptId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/custom_prompts/${promptId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'custom_prompts', promptId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authLoading,
        accessToken,
        signIn: handleSignIn,
        signOut: handleSignOut,
        getDriveToken,
        favorites,
        isFavorite,
        toggleFavorite,
        reviews,
        getToolReviews,
        addReview,
        deleteReview,
        customPrompts,
        addCustomPrompt,
        deleteCustomPrompt,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
