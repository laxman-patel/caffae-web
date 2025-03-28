import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "./UserAvatar";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Video } from "lucide-react";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/caffae.png" alt="Caffae Logo" className="h-24 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/video-call">
                  <Button variant="ghost" className="text-base font-medium transition-all hover:text-primary">
                    <Video className="mr-2 h-5 w-5" />
                    Start Video Call
                  </Button>
                </Link>
                <div className="flex items-center space-x-4">
                  <UserAvatar user={user} />
                  <Button 
                    variant="ghost" 
                    className="text-base font-medium transition-all hover:text-destructive"
                    onClick={logout}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => window.showSignInModal()}>
                  Sign In
                </Button>
                <Button variant="default" onClick={() => window.showSignUpModal()}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden h-screen bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="pt-2 pb-4 px-4 space-y-3 flex flex-col items-center">
            {isAuthenticated ? (
              <>
                <div className="py-6 flex flex-col items-center">
                  <UserAvatar user={user} />
                  <span className="mt-2 text-sm text-muted-foreground">{user?.email}</span>
                </div>
                <Link to="/video-call" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full">
                    <Video className="mr-2 h-5 w-5" />
                    Start Video Call
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive hover:text-destructive/90"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="default" 
                  className="w-full" 
                  onClick={() => {
                    window.showSignInModal();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    window.showSignUpModal();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
