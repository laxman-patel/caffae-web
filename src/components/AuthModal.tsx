import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { useToast } from "@/hooks/use-toast";
import { X, LogIn, UserPlus, Chrome } from "lucide-react"; // Added Chrome icon (or use a dedicated Google icon)
import AuthSeparator from "./AuthSeperator";
import { GoogleIcon } from "./AuthSeperator"; // Ensure this path is correct

// Define the global window interface extension for TypeScript
declare global {
  interface Window {
    showSignInModal: () => void;
    showSignUpModal: () => void;
  }
}

// Simple SVG Google Icon component (replace with a better one if available)

export const AuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Specific loading for Google

  const { login, signup, signInWithGoogle } = useAuth(); // Get signInWithGoogle
  const { toast } = useToast();

  useEffect(() => {
    // ... (window function setup remains the same) ...
    window.showSignInModal = () => {
      setActiveTab("signin");
      setIsOpen(true);
    };
    window.showSignUpModal = () => {
      setActiveTab("signup");
      setIsOpen(true);
    };
    return () => {
      /* cleanup */ window.showSignInModal = undefined as any;
      window.showSignUpModal = undefined as any;
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setPassword("");
      setIsLoading(false);
      setIsGoogleLoading(false); // Reset Google loading state too
    }
    setIsOpen(open);
  };

  // Handler for Email/Password form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || isLoading || isGoogleLoading) return;
    setIsLoading(true); // Use main loading state for form

    try {
      if (activeTab === "signin") {
        await login(email, password);
        toast({ title: "🎉 Welcome back!" /* ... */ });
      } else {
        await signup(email, password);
        toast({ title: "🚀 Welcome to Caffae!" /* ... */ });
      }
      handleOpenChange(false);
    } catch (error) {
      console.error(/* ... */);
      toast({ title: "Authentication Error" /* ... */ });
      setIsLoading(false); // Reset loading on error
    }
  };

  // --- Handler for Google Sign In Button ---
  const handleGoogleSignIn = async () => {
    if (isLoading || isGoogleLoading) return;
    setIsGoogleLoading(true); // Use specific loading state for Google button

    try {
      await signInWithGoogle();
      // Don't close modal here, Supabase handles redirect.
      // Loading state will persist until redirect or error.
    } catch (error) {
      // Error toast is likely handled within signInWithGoogle in the context
      console.error("Google Sign In button error:", error); // Log specific error source
      setIsGoogleLoading(false); // Reset loading state on immediate error
    }
  };
  // --- End Google Handler ---

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-gray-700/50 shadow-2xl shadow-purple-500/10 bg-gray-950/90 backdrop-blur-lg rounded-2xl text-gray-100">
        <DialogHeader className="p-6 pb-0">
          <DialogClose asChild className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X size={20} />
            </Button>
          </DialogClose>
          <DialogTitle className="sr-only">{/* ... */}</DialogTitle>
          <DialogDescription className="sr-only">{/* ... */}</DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
          className="w-full px-6 pb-8 pt-4"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800/60 rounded-full h-11 p-1">
            <TabsTrigger
              value="signin"
              className="rounded-full text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:shadow-md transition-all duration-300"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-full text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:shadow-md transition-all duration-300"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Shared Divider and Google Button Component */}

          {/* --- Sign In Tab --- */}
          <TabsContent value="signin" className="mt-0 space-y-6">
            {/* ... (Welcome Back text) ... */}
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Welcome Back!
              </h3>
              <p className="text-sm text-gray-400">
                Enter your credentials to jump back in.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ... (Email Input) ... */}
              <div className="space-y-2">
                <Label
                  htmlFor="email-signin"
                  className="text-gray-300 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email-signin"
                  /* ...props... */ value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              {/* ... (Password Input) ... */}
              <div className="space-y-2">
                <Label
                  htmlFor="password-signin"
                  className="text-gray-300 font-medium"
                >
                  Password
                </Label>
                <Input
                  id="password-signin"
                  type="password"
                  /* ...props... */ value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full text-base font-semibold text-white rounded-full h-12 justify-center bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-blue-500/50 disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  "Signing In..."
                ) : (
                  <>
                    {" "}
                    <LogIn className="mr-2 h-5 w-5" /> Sign In{" "}
                  </>
                )}
              </Button>
            </form>

            <AuthSeparator
              isLoading={isLoading}
              isGoogleLoading={isGoogleLoading}
              handleGoogleSignIn={handleGoogleSignIn}
            />
          </TabsContent>

          {/* --- Sign Up Tab --- */}
          <TabsContent value="signup" className="mt-0 space-y-6">
            {/* ... (Join the Fun text) ... */}
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Join the Fun!
              </h3>
              <p className="text-sm text-gray-400">
                Create your account in seconds.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ... (Email Input) ... */}
              <div className="space-y-2">
                <Label
                  htmlFor="email-signup"
                  className="text-gray-300 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email-signup"
                  /* ...props... */ value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              {/* ... (Password Input) ... */}
              <div className="space-y-2">
                <Label
                  htmlFor="password-signup"
                  className="text-gray-300 font-medium"
                >
                  Password
                </Label>
                <Input
                  id="password-signup"
                  type="password"
                  /* ...props... */ value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              {/* Create Account Button */}
              <Button
                type="submit"
                className="w-full text-base font-semibold text-white rounded-full h-12 justify-center bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-pink-500/50 disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  "Creating Account..."
                ) : (
                  <>
                    {" "}
                    <UserPlus className="mr-2 h-5 w-5" /> Create Account{" "}
                  </>
                )}
              </Button>
            </form>
            <AuthSeparator
              isLoading={isLoading}
              isGoogleLoading={isGoogleLoading}
              handleGoogleSignIn={handleGoogleSignIn}
            />

            {/* Add Separator and Google Button */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
