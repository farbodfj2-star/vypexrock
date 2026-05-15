"use client";

import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, useRef, useState } from "react";
import { BadgeCheck, Camera, Crown, Mail, ShieldCheck, Sparkles, UploadCloud, UserCircle2 } from "lucide-react";

import { apiFetch, resolveApiAssetUrl, uploadUserAvatar } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { User } from "@/types";

export default function ProfilePage() {
  const { token, user, setSession } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPulse, setAvatarPulse] = useState(false);
  const [uploading, setUploading] = useState(false);
  const profileQuery = useQuery({
    queryKey: ["profile", token],
    queryFn: () => apiFetch<User>("/auth/me", { token }),
    enabled: Boolean(token)
  });

  const profile = profileQuery.data ?? user;
  const fallbackAvatarUrl = profile?.email ? `https://api.dicebear.com/7.x/glass/svg?seed=${encodeURIComponent(profile.email)}` : null;
  const avatarUrl = resolveApiAssetUrl(profile?.avatar_url) ?? fallbackAvatarUrl;

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    try {
      const updated = await uploadUserAvatar(file, token);
      setSession({ token, user: updated });
      setAvatarPulse(true);
      window.setTimeout(() => setAvatarPulse(false), 850);
      await profileQuery.refetch();
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2.15rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,200,74,0.12),_transparent_20%),radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_24%),radial-gradient(circle_at_85%_10%,_rgba(139,92,246,0.22),_transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Member Profile</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Your Vypexrock account</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
          This is your private member profile for the Vypexrock workspace. Keep your account details, access level, and workspace identity in one premium place.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.email ?? "Profile"}
                  className={`h-32 w-32 rounded-full border border-white/10 bg-white/5 object-cover p-2 shadow-[0_0_44px_rgba(125,211,252,0.16)] transition duration-500 ${avatarPulse ? "scale-105 ring-4 ring-cyan-300/25" : ""}`}
                />
              ) : (
                <div className="grid h-32 w-32 place-items-center rounded-full border border-white/10 bg-white/5 text-white/50">
                  <UserCircle2 className="h-16 w-16" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-cyan-400 text-slate-950 shadow-[0_14px_40px_rgba(34,211,238,0.28)] transition hover:scale-105"
                aria-label="Upload profile image"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
            <h2 className="mt-5 text-2xl font-semibold text-white">{profile?.full_name ?? "Vypexrock Member"}</h2>
            <p className="mt-2 text-sm text-white/55">{profile?.email ?? "member@vypexrock.ai"}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={uploading || !token}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload image"}
              </button>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <StatusPill
                icon={profile?.is_premium ? Crown : ShieldCheck}
                label={profile?.is_premium ? "Premium member" : "Standard member"}
                tone={profile?.is_premium ? "gold" : "cyan"}
              />
              <StatusPill
                icon={profile?.is_active ? BadgeCheck : ShieldCheck}
                label={profile?.is_active ? "Account active" : "Review status"}
                tone={profile?.is_active ? "emerald" : "slate"}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <ProfileMetric label="Member ID" value={profile ? `#${profile.id}` : "Loading"} />
            <ProfileMetric label="Joined" value={profile?.created_at ? formatDate(profile.created_at) : "Recently"} />
            <ProfileMetric label="Workspace tier" value={profile?.is_premium ? "Premium research access" : "Core member access"} />
            <ProfileMetric label="Profile completion" value={profile?.avatar_url ? "92% complete" : "74% complete"} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={UserCircle2}
              title="Identity"
              text="Your member name and avatar are used across the private Vypexrock workspace."
            />
            <SummaryCard
              icon={Mail}
              title="Contact"
              text="Your email is the primary identity for login, profile recognition, and secure account access."
            />
            <SummaryCard
              icon={Sparkles}
              title="Workspace"
              text="This profile is ready to expand later with plan history, Telegram settings, and billing controls."
            />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <h2 className="text-xl font-semibold text-white">Account information</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DetailRow label="Full name" value={profile?.full_name ?? "Not set"} />
              <DetailRow label="Email address" value={profile?.email ?? "Not available"} />
              <DetailRow label="Status" value={profile?.is_active ? "Active" : "Inactive"} />
              <DetailRow label="Plan access" value={profile?.is_premium ? "Premium" : "Free / Core"} />
              <DetailRow label="Created at" value={profile?.created_at ? formatDateTime(profile.created_at) : "Unknown"} />
              <DetailRow label="Updated at" value={profile?.updated_at ? formatDateTime(profile.updated_at) : "Unknown"} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <h2 className="text-xl font-semibold text-white">Profile note</h2>
            <p className="mt-4 text-sm leading-7 text-white/60">
              Your uploaded avatar is saved locally in this browser for now, so the experience feels complete while the backend profile-image endpoint is still optional. The page is ready to connect to real storage later without changing the UI.
            </p>
          </div>
        </div>
      </section>

      {profileQuery.isLoading ? (
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 text-sm text-white/60">Refreshing profile information...</div>
      ) : null}
      {profileQuery.error ? (
        <div className="rounded-[1.8rem] border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          {profileQuery.error instanceof Error ? profileQuery.error.message : "Unable to refresh profile details right now."}
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone
}: {
  icon: typeof Crown;
  label: string;
  tone: "gold" | "cyan" | "emerald" | "slate";
}) {
  const toneClass =
    tone === "gold"
      ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
      : tone === "cyan"
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
        : tone === "emerald"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.04] text-white/70";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${toneClass}`}>
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#0d1224] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/38">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  text
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-white/58">{text}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-[#0d1224] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
