import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose, // Import DialogClose
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { X, LogIn, UserPlus } from "lucide-react";

// Define the global window interface extension for TypeScript
declare global {
  interface Window {
    showSignInModal: () => void;
    showSignUpModal: () => void;
  }
}

export const AuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    window.showSignInModal = () => {
      setActiveTab("signin");
      setIsOpen(true);
    };
    window.showSignUpModal = () => {
      setActiveTab("signup");
      setIsOpen(true);
    };
    return () => {
      window.showSignInModal = undefined as any;
      window.showSignUpModal = undefined as any;
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setPassword("");
      setIsLoading(false);
    }
    setIsOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    setIsLoading(true);

    try {
      if (activeTab === "signin") {
        await login(email, password);
        toast({
          title: "🎉 Welcome back!",
          description: "You're signed in and ready to go!",
          className: "bg-green-600 border-green-700 text-white",
        });
      } else {
        await signup(email, password);
        toast({
          title: "🚀 Welcome to Caffae!",
          description: "Account created! Check your email to verify.",
          className: "bg-blue-600 border-blue-700 text-white",
        });
      }
      handleOpenChange(false);
    } catch (error) {
      console.error(
        `${activeTab === "signin" ? "Login" : "Signup"} error:`,
        error
      );
      toast({
        title: "Authentication Error",
        description:
          (error as Error).message ||
          `Failed to ${
            activeTab === "signin" ? "sign in" : "create account"
          }. Please try again.`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border border-gray-700/50 shadow-2xl shadow-purple-500/10
                              bg-gray-950/90 backdrop-blur-lg rounded-2xl text-gray-100"
      >
        <DialogHeader className="p-6 pb-0">
          {/* --- THIS IS THE ONLY CLOSE BUTTON --- */}
          <DialogClose asChild className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              aria-label="Close" // Add aria-label for accessibility
            >
              <X size={20} />
            </Button>
          </DialogClose>
          {/* ------------------------------------ */}
          <DialogTitle className="sr-only">
            {activeTab === "signin" ? "Sign In" : "Sign Up"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {activeTab === "signin"
              ? "Sign in to your Caffae account"
              : "Create a new Caffae account"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
          className="w-full px-6 pb-8 pt-4"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800/60 rounded-full h-11 p-1">
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

          <TabsContent value="signin" className="mt-0 space-y-6">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Welcome Back!
              </h3>
              <p className="text-sm text-gray-400">
                Enter your credentials to jump back in.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email-signin"
                  className="text-gray-300 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email-signin"
                  placeholder="you@awesome.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800/50 border border-gray-600/50 rounded-lg h-11 px-4 text-gray-100 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 focus-visible:ring-offset-gray-950"
                  disabled={isLoading}
                />
              </div>
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
                  placeholder="Super secret password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-800/50 border border-gray-600/50 rounded-lg h-11 px-4 text-gray-100 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 focus-visible:ring-offset-gray-950"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full text-base font-semibold text-white rounded-full h-12 justify-center
                             bg-gradient-to-r from-teal-400 to-blue-500
                             hover:from-teal-500 hover:to-blue-600
                             transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-blue-500/50
                             disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
                disabled={isLoading}
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
          </TabsContent>

          <TabsContent value="signup" className="mt-0 space-y-6">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Join the Fun!
              </h3>
              <p className="text-sm text-gray-400">
                Create your account in seconds.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email-signup"
                  className="text-gray-300 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email-signup"
                  placeholder="you@awesome.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800/50 border border-gray-600/50 rounded-lg h-11 px-4 text-gray-100 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 focus-visible:ring-offset-gray-950"
                  disabled={isLoading}
                />
              </div>
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
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-800/50 border border-gray-600/50 rounded-lg h-11 px-4 text-gray-100 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 focus-visible:ring-offset-gray-950"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full text-base font-semibold text-white rounded-full h-12 justify-center
                           bg-gradient-to-r from-pink-500 to-orange-500
                           hover:from-pink-600 hover:to-orange-600
                           transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-pink-500/50
                           disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
                disabled={isLoading}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
