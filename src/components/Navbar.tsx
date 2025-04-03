import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "./UserAvatar";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Video, LogOut, LogIn, UserPlus } from "lucide-react"; // Added more icons

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper function to close mobile menu
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    // Darker, glassy navbar background
    <nav
      className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
        mobileMenuOpen
          ? "bg-gray-950"
          : "bg-gray-950/80 backdrop-blur-lg border-b border-gray-700/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {" "}
          {/* Increased height slightly */}
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center space-x-2 flex-shrink-0"
            >
              {/* Slightly smaller logo for navbar */}
              <p className="text-md font-normal underline text-white">
                Consult an expert?
              </p>
            </Link>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/video-call">
                  {/* Subtle but highlighted action */}
                  <Button
                    variant="ghost"
                    className="text-base font-semibold text-gray-200 hover:text-pink-400 transition-colors duration-200 rounded-lg"
                  >
                    <Video className="mr-2 h-5 w-5 text-pink-400" />
                    Start Video Call
                  </Button>
                </Link>
                <div className="flex items-center space-x-4">
                  <UserAvatar user={user} />{" "}
                  {/* Ensure UserAvatar style fits */}
                  <Button
                    variant="ghost"
                    className="text-base font-medium text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 rounded-lg px-3 py-2"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Ghost Sign In */}
                <Button
                  variant="ghost"
                  className="text-base font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors duration-200 rounded-lg px-4 py-2"
                  onClick={() => window.showSignInModal()}
                >
                  Sign In
                </Button>
                {/* Gradient Sign Up */}
                <Button
                  className="text-base font-semibold text-white rounded-full px-6 py-2
                               bg-gradient-to-r from-pink-500 to-orange-500
                               hover:from-pink-600 hover:to-orange-600
                               transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-pink-500/40"
                  onClick={() => window.showSignUpModal()}
                >
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
              className="h-10 w-10 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Full screen takeover style */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-20 z-40 // Adjusted top padding to match navbar height
                       bg-gradient-to-b from-gray-950 via-indigo-950/90 to-black // Gradient background
                       backdrop-blur-md // Optional: keep blur if desired
                       animate-fade-in overflow-y-auto"
        >
          <div className="pt-8 pb-6 px-6 space-y-6 flex flex-col h-full">
            {isAuthenticated ? (
              <>
                <div className="py-6 flex flex-col items-center border-b border-gray-700 pb-8">
                  <UserAvatar user={user} />{" "}
                  {/* Optionally make avatar larger */}
                  <span className="mt-3 text-base font-medium text-gray-200">
                    {user?.email}
                  </span>
                  <span className="mt-1 text-sm text-gray-400">
                    {user?.email}
                  </span>
                </div>
                <div className="space-y-4 flex-grow flex flex-col">
                  <Link
                    to="/video-call"
                    className="w-full"
                    onClick={closeMobileMenu}
                  >
                    {/* Prominent Gradient Button */}
                    <Button
                      size="lg"
                      className="w-full text-lg font-semibold text-white rounded-full px-8 py-3 justify-center
                                bg-gradient-to-r from-pink-500 to-orange-500
                                hover:from-pink-600 hover:to-orange-600
                                transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50"
                    >
                      <Video className="mr-2 h-5 w-5" />
                      Start Video Call
                    </Button>
                  </Link>
                </div>
                {/* Sign Out button at the bottom */}
                <Button
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-auto py-3 rounded-lg text-base"
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4 flex-grow flex flex-col pt-10">
                  {" "}
                  {/* Added padding top */}
                  {/* Gradient Sign In */}
                  <Button
                    size="lg"
                    className="w-full text-lg font-semibold text-white rounded-full px-8 py-3 justify-center
                                    bg-gradient-to-r from-teal-400 to-blue-500
                                    hover:from-teal-500 hover:to-blue-600
                                    transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                    onClick={() => {
                      window.showSignInModal();
                      closeMobileMenu();
                    }}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </Button>
                  {/* Outline/Secondary Sign Up */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full text-lg font-semibold rounded-full px-8 py-3 justify-center
                                    border-pink-500/80 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 hover:border-pink-500
                                    transition-colors duration-200"
                    onClick={() => {
                      window.showSignUpModal();
                      closeMobileMenu();
                    }}
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Sign Up
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
