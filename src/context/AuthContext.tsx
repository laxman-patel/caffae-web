// src/context/AuthContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase"; // Ensure supabase client is correctly initialized here
import { Session, User } from "@supabase/supabase-js";

// Export the User type to resolve the TypeScript error
export type { User };

export type AppUser = {
  id: string;
  email: string;
  avatar?: string;
};

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true); // Start loading when checking session
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            // Ensure avatar_url is accessed correctly based on your metadata structure
            avatar:
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture,
          });
        } else {
          setUser(null); // Explicitly set user to null if no session
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error getting initial session:", error);
        setIsLoading(false); // Stop loading even on error
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoading(true); // Set loading true while processing change
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          // Ensure avatar_url is accessed correctly based on your metadata structure
          avatar:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture,
        });
      } else {
        setUser(null);
      }
      // Delay setting loading false slightly to allow potential redirects to process
      setTimeout(() => setIsLoading(false), 100);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Auth state change listener will handle setting user/session
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Re-throw to be caught in the modal
    } finally {
      // Don't set isLoading false here, let the listener handle it
    }
  };

  const signup = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account",
      });
    } catch (error) {
      console.error("Signup error:", error);
      throw error; // Re-throw
    } finally {
      setIsLoading(false); // Set loading false here as listener might not trigger immediately
    }
  };

  const logout = async () => {
    setIsLoading(true); // Indicate loading during sign out
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null); // Manually clear user state immediately
      setSession(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: (error as Error).message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // --- New Google Sign In Function ---
  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true); // Indicate loading before redirect
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Supabase redirects back here after Google auth
          // Ensure this matches URL Configuration in Supabase settings
          redirectTo: window.location.origin,
          // Optional: Add scopes if needed
          // queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
      // If successful, Supabase handles the redirect to Google
      // The user will be redirected back, and the onAuthStateChange listener will pick up the session
    } catch (error) {
      console.error("Google Sign In error:", error);
      toast({
        title: "Google Sign-In Failed",
        description:
          (error as Error).message || "Could not initiate Google Sign-In.",
        variant: "destructive",
      });
      setIsLoading(false); // Stop loading if there's an immediate error
    }
    // Don't set isLoading false here if successful, as a redirect is happening
  };
  // --- End New Function ---

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    signInWithGoogle, // Add to context value
  };

  // Render null or a loader while initially loading to prevent flicker
  // if (isLoading && !session) {
  //    return null; // Or return a loading spinner component covering the screen
  // }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
