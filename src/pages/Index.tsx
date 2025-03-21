
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Shield, Users } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AuthModal />
      
      {/* Hero Section */}
      <section className="flex-1 pt-24 pb-12 px-4 sm:pt-32 lg:pt-40">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Connect with someone new instantly
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connectopia brings you face to face with someone new from anywhere in the world. Start meaningful conversations in seconds.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up animation-delay-200">
            {isAuthenticated ? (
              <Link to="/chat">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Chatting <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => window.dialog_signup.showModal()}
                >
                  Join Connectopia <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Connectopia?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background rounded-xl p-6 shadow-subtle transition-all hover:shadow-elevated animate-slide-up">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Connections</h3>
              <p className="text-muted-foreground">
                Connect instantly with people from around the world. No waiting, no searching.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-subtle transition-all hover:shadow-elevated animate-slide-up animation-delay-200">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe Environment</h3>
              <p className="text-muted-foreground">
                We prioritize your privacy and safety with our advanced moderation system.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-subtle transition-all hover:shadow-elevated animate-slide-up animation-delay-400">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Meet New People</h3>
              <p className="text-muted-foreground">
                Expand your social circle and discover perspectives from around the globe.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Ready to start a conversation?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of users who are already making meaningful connections.
          </p>
          
          <div className="pt-4">
            {isAuthenticated ? (
              <Link to="/chat">
                <Button size="lg">
                  Start Chatting Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg"
                onClick={() => window.dialog_signin.showModal()}
              >
                Sign In to Start <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="ml-2 text-lg font-semibold">Connectopia</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Connectopia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
