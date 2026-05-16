"use client";

import { useState } from "react";
import { Github, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type SocialProvider = "google" | "github" | "apple" | "email";

interface SocialAuthButtonsProps {
  onEmailClick?: () => void;
  mode?: "login" | "register";
}

export function SocialAuthButtons({ onEmailClick, mode = "login" }: SocialAuthButtonsProps) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  const handleSocialAuth = async (provider: SocialProvider) => {
    if (provider === "email" && onEmailClick) {
      onEmailClick();
      return;
    }

    setLoading(provider);
    
    try {
      // Redirect to OAuth endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/${provider}/login`);
      const data = await response.json();
      
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        throw new Error(data.detail || "OAuth not configured");
      }
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      alert(error instanceof Error ? error.message : `${provider} authentication is not yet configured`);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#05070c] px-3 text-white/40 tracking-wider">
            {mode === "login" ? "Or continue with" : "Or sign up with"}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        <SocialButton
          provider="google"
          icon={<GoogleIcon />}
          label="Continue with Google"
          onClick={() => handleSocialAuth("google")}
          loading={loading === "google"}
          disabled={loading !== null}
        />
        
        <SocialButton
          provider="github"
          icon={<Github className="h-5 w-5" />}
          label="Continue with GitHub"
          onClick={() => handleSocialAuth("github")}
          loading={loading === "github"}
          disabled={loading !== null}
        />
        
        <SocialButton
          provider="apple"
          icon={<AppleIcon />}
          label="Continue with Apple"
          onClick={() => handleSocialAuth("apple")}
          loading={loading === "apple"}
          disabled={loading !== null}
        />
        
        {onEmailClick && (
          <SocialButton
            provider="email"
            icon={<Mail className="h-5 w-5" />}
            label="Continue with Email"
            onClick={() => handleSocialAuth("email")}
            loading={loading === "email"}
            disabled={loading !== null}
          />
        )}
      </div>
    </div>
  );
}

interface SocialButtonProps {
  provider: SocialProvider;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

function SocialButton({ provider, icon, label, onClick, loading, disabled }: SocialButtonProps) {
  const providerStyles = {
    google: "hover:bg-white/[0.08] hover:border-white/20",
    github: "hover:bg-white/[0.08] hover:border-white/20",
    apple: "hover:bg-white/[0.08] hover:border-white/20",
    email: "hover:bg-cyan-400/10 hover:border-cyan-400/30",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-white transition-all duration-200",
        providerStyles[provider],
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "backdrop-blur-sm",
        loading && "opacity-70"
      )}
    >
      {/* Glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10" />
      </div>

      <div className="relative flex items-center gap-3">
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        ) : (
          icon
        )}
        <span>{loading ? "Connecting..." : label}</span>
      </div>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
