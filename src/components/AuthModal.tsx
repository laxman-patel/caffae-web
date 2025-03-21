
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface AuthModalProps {
  defaultTab?: 'signin' | 'signup';
}

// Define the global window interface extension for TypeScript
declare global {
  interface Window {
    showSignInModal: () => void;
    showSignUpModal: () => void;
  }
}

export const AuthModal = ({ defaultTab = 'signin' }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const { login, signup } = useAuth();
  const { toast } = useToast();
  
  const signinDialogRef = useRef<HTMLDialogElement>(null);
  const signupDialogRef = useRef<HTMLDialogElement>(null);
  
  // Expose modal show methods to window for global access
  React.useEffect(() => {
    window.showSignInModal = () => signinDialogRef.current?.showModal();
    window.showSignUpModal = () => signupDialogRef.current?.showModal();
    
    return () => {
      window.showSignInModal = undefined as any;
      window.showSignUpModal = undefined as any;
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (activeTab === 'signin') {
        await login(email, password);
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in."
        });
      } else {
        await signup(email, password);
        toast({
          title: "Welcome to Connectopia!",
          description: "Your account has been created successfully."
        });
      }
      
      // Close modal
      const dialog = e.currentTarget.closest('dialog') as HTMLDialogElement;
      if (dialog) dialog.close();
      
      // Reset form
      setEmail("");
      setPassword("");
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: (error as Error).message || "Failed to authenticate",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <dialog ref={signinDialogRef} className="bg-background/80 backdrop-blur-md rounded-xl border border-border">
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-none bg-transparent">
          <div className="flex justify-end p-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signinDialogRef.current?.close()}
            >
              <X size={18} />
            </Button>
          </div>
          <Tabs defaultValue="signin" className="w-full px-6 pb-8" value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-0">
              <div className="space-y-2 text-center mb-6">
                <h3 className="text-xl font-semibold tracking-tight">Welcome back</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your email and password to sign in
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input
                    id="email-signin"
                    placeholder="hello@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input
                    id="password-signin"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <div className="space-y-2 text-center mb-6">
                <h3 className="text-xl font-semibold tracking-tight">Create an account</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your details to create a new account
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    placeholder="hello@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </dialog>
      
      <dialog ref={signupDialogRef} className="bg-background/80 backdrop-blur-md rounded-xl border border-border">
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-none bg-transparent">
          <div className="flex justify-end p-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signupDialogRef.current?.close()}
            >
              <X size={18} />
            </Button>
          </div>
          <Tabs defaultValue="signup" className="w-full px-6 pb-8" value="signup">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" onClick={() => {
                signupDialogRef.current?.close();
                signinDialogRef.current?.showModal();
              }}>Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signup" className="mt-0">
              <div className="space-y-2 text-center mb-6">
                <h3 className="text-xl font-semibold tracking-tight">Create an account</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your details to create a new account
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup2">Email</Label>
                  <Input
                    id="email-signup2"
                    placeholder="hello@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup2">Password</Label>
                  <Input
                    id="password-signup2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </dialog>
    </>
  );
};
