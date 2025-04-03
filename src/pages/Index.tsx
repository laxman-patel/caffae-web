import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar"; // Assuming Navbar might need separate styling
import { AuthModal } from "@/components/AuthModal"; // Assuming AuthModal might need separate styling
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Users, Video } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    // Main container: Apply a dark background, maybe a subtle gradient, and default light text
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-gray-900 to-black text-gray-100">
      {/* Navbar and AuthModal remain structurally, but their internal styles might need updates too */}
      <Navbar />
      <AuthModal />

      {/* Hero Section */}
      <section className="flex-1 pt-24 pb-16 px-4 sm:pt-32 lg:pt-40">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="space-y-5 animate-slide-up">
            {/* Vibrant Gradient Heading */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight 
                           bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 
                           bg-clip-text text-transparent pb-2"
            >
              India’s First 1:1 Personalized Guidance App Unlocked!
            </h1>
            {/* Softer description text */}
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Bridging Aspirations to Achievements, <br /> Connect with Gurus on
              Caffae for Personalized Success.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4 animate-slide-up animation-delay-200">
            {/* Updated Button Style: More rounded, gradient, hover effect */}
            {isAuthenticated ? (
              <Link to="/video-call">
                <Button
                  size="lg"
                  className="text-lg px-10 py-4 font-semibold text-white rounded-full
                             bg-gradient-to-r from-pink-500 to-orange-500 
                             hover:from-pink-600 hover:to-orange-600
                             transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50"
                >
                  Start Video Call <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="lg"
                  className="text-lg px-10 py-4 font-semibold text-white rounded-full
                             bg-gradient-to-r from-pink-500 to-orange-500 
                             hover:from-pink-600 hover:to-orange-600
                             transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50"
                  onClick={() => window.showSignUpModal()}
                >
                  Join Caffae <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* Added some transparency and maybe backdrop blur for a modern glass effect */}
      <section className="py-20 px-4 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Why Choose Caffae?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card Style: Darker background, rounded, subtle border/glow */}
            <div
              className="bg-gray-800/70 rounded-2xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10 
                            transition-all duration-300 hover:border-purple-400/50 hover:-translate-y-1 animate-slide-up"
            >
              {/* Icon container with gradient background */}
              <div
                className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 
                              flex items-center justify-center mb-5"
              >
                <Video className="h-7 w-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                Instant Video Calls
              </h3>
              <p className="text-gray-400">
                Connect instantly with people from around the world. No waiting,
                no searching.
              </p>
            </div>

            <div
              className="bg-gray-800/70 rounded-2xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10 
                            transition-all duration-300 hover:border-purple-400/50 hover:-translate-y-1 animate-slide-up animation-delay-200"
            >
              <div
                className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 
                              flex items-center justify-center mb-5"
              >
                <Shield className="h-7 w-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                Safe Environment
              </h3>
              <p className="text-gray-400">
                We prioritize your privacy and safety with our advanced
                moderation system.
              </p>
            </div>

            <div
              className="bg-gray-800/70 rounded-2xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10 
                            transition-all duration-300 hover:border-purple-400/50 hover:-translate-y-1 animate-slide-up animation-delay-400"
            >
              <div
                className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 
                              flex items-center justify-center mb-5"
              >
                <Users className="h-7 w-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                Meet New People
              </h3>
              <p className="text-gray-400">
                Expand your social circle and discover perspectives from around
                the globe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold text-white">
            Ready to start a conversation?
          </h2>
          <p className="text-xl text-gray-300">
            Join thousands of users who are already making meaningful
            connections.
          </p>

          <div className="pt-4">
            {/* Consistent Button Style */}
            {isAuthenticated ? (
              <Link to="/video-call">
                <Button
                  size="lg"
                  className="text-lg px-10 py-4 font-semibold text-white rounded-full
                             bg-gradient-to-r from-pink-500 to-orange-500 
                             hover:from-pink-600 hover:to-orange-600
                             transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50"
                >
                  Start Video Call Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="text-lg px-10 py-4 font-semibold text-white rounded-full
                            bg-gradient-to-r from-teal-400 to-blue-500  
                            hover:from-teal-500 hover:to-blue-600 
                            transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50" // Slightly different CTA color maybe?
                onClick={() => window.showSignInModal()}
              >
                Sign In to Start <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-700">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            {/* Ensure logo is visible on dark background */}
            <img src="/caffae.png" alt="Caffae Logo" className="h-20 w-auto" />
          </div>

          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Caffae. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
