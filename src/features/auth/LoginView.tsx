import { Github, MessageCircle, Chrome, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components';

export const LoginView = () => {
  const { isAuthenticated, signInWithGithub, signInWithDiscord, signInWithGoogle } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center animate-fade-in relative px-6">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none animate-breathe" />

      <div className="text-center max-w-sm relative z-10 w-full">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-accent bg-accent-muted text-sm text-accent-primary mb-8">
          <Sparkles size={14} />
          <span className="font-medium">Join the Saga</span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-3 leading-tight">
          Enter the Multiverse
        </h1>
        <p className="text-text-secondary text-sm mb-10 leading-relaxed">
          Sign in to forge worlds, submit proposals, and shape canon.
        </p>

        {/* Auth Buttons */}
        {isSupabaseConfigured ? (
          <div className="space-y-3">
            <button
              onClick={signInWithGithub}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-elevated border border-border rounded-lg text-sm font-medium text-text-primary hover:border-border-accent hover:bg-surface-overlay transition-all duration-200"
            >
              <Github size={18} />
              Continue with GitHub
            </button>

            <button
              onClick={signInWithDiscord}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-elevated border border-border rounded-lg text-sm font-medium text-text-primary hover:border-border-accent hover:bg-surface-overlay transition-all duration-200"
            >
              <MessageCircle size={18} />
              Continue with Discord
            </button>

            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-elevated border border-border rounded-lg text-sm font-medium text-text-primary hover:border-border-accent hover:bg-surface-overlay transition-all duration-200"
            >
              <Chrome size={18} />
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="p-6 bg-surface-elevated border border-border rounded-xl">
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Authentication is not configured. Running in offline demo mode.
            </p>
            <Button variant="primary" onClick={() => window.location.href = '#/explore'}>
              Explore as Wanderer
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-text-tertiary text-xs mt-8">
          By continuing, you agree to the community Code of Conduct.
        </p>
      </div>
    </div>
  );
};
