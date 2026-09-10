"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Users, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeckerLogo } from "@/components/ui/pecker-logo";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { toast } from "@/hooks/useToast";
import Link from "next/link";

const roleOptions = [
  {
    value: "RESIDENT",
    icon: Users,
    label: "Resident",
    sub: "Report & track incidents in your community",
  },
  {
    value: "RESPONDER",
    icon: ShieldCheck,
    label: "Responder",
    sub: "Manage and resolve incidents across Nigeria",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({ resolver: zodResolver(registerSchema), defaultValues: { role: "RESIDENT" } });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!result.success) {
        toast({ title: "Registration failed", description: result.error, variant: "destructive" });
        return;
      }

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/incidents");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Left panel (desktop only) ── */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-[#0D1F52]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-blue-400/10 blur-2xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        <div className="relative z-10">
          <PeckerLogo variant="white" size="lg" showTagline className="flex-col items-start" />
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Join your community</p>
          {[
            "Free to use — no subscription required",
            "Reports go directly to local response teams",
            "Anonymous reporting available for sensitive issues",
            "Real-time status updates on every incident",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-white/75 text-sm">{item}</p>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-white/30 text-xs">© 2026 Pecker · Nigeria&apos;s Nationwide Safety Platform</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1535] to-[#0D1F52] md:bg-none md:bg-gray-50 min-h-screen md:min-h-0">

        {/* Mobile logo */}
        <div className="md:hidden mb-8 flex flex-col items-center">
          <PeckerLogo variant="white" size="xl" showTagline className="flex-col items-center" />
        </div>

        <div className="w-full max-w-sm md:max-w-md">
          <div className="bg-white/10 md:bg-white backdrop-blur-md md:backdrop-blur-none rounded-3xl p-8 border border-white/20 md:border-gray-200 shadow-2xl md:shadow-lg">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/login"
                className="w-8 h-8 rounded-lg bg-white/10 md:bg-gray-100 flex items-center justify-center text-white/70 md:text-gray-500 hover:text-white md:hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white md:text-gray-900">Create account</h1>
                <p className="text-white/60 md:text-gray-500 text-sm">Join your community platform</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 md:text-gray-600 uppercase tracking-wide">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map(({ value, icon: Icon, label, sub }) => {
                    const active = selectedRole === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("role", value)}
                        className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-left ${
                          active
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                            : "bg-white/10 md:bg-gray-50 border-white/20 md:border-gray-200 text-white/70 md:text-gray-500 hover:border-indigo-400/60"
                        }`}
                      >
                        {active && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                          </div>
                        )}
                        <Icon className={`h-5 w-5 ${active ? "text-white" : "text-indigo-300 md:text-indigo-400"}`} />
                        <span className="font-semibold text-sm">{label}</span>
                        <span className={`text-[10px] text-center leading-tight ${active ? "text-indigo-100" : "text-white/50 md:text-gray-400"}`}>
                          {sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <input type="hidden" {...register("role")} />

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 md:text-gray-600 uppercase tracking-wide">Full name</label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="John Okafor"
                  autoComplete="name"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 md:focus:ring-indigo-500/40 focus:border-transparent transition-all text-sm"
                />
                {errors.name && <p className="text-xs text-red-300 md:text-red-500">{String(errors.name.message ?? "")}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 md:text-gray-600 uppercase tracking-wide">Email address</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 md:focus:ring-indigo-500/40 focus:border-transparent transition-all text-sm"
                />
                {errors.email && <p className="text-xs text-red-300 md:text-red-500">{String(errors.email.message ?? "")}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 md:text-gray-600 uppercase tracking-wide">
                  Phone <span className="normal-case font-normal text-white/40 md:text-gray-400">(optional)</span>
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+234 800 000 0000"
                  autoComplete="tel"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 md:focus:ring-indigo-500/40 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Responder location fields */}
              {selectedRole === "RESPONDER" && (
                <div className="space-y-3 p-4 rounded-xl bg-indigo-600/10 border border-indigo-400/20">
                  <p className="text-xs font-semibold text-indigo-300 md:text-indigo-600 uppercase tracking-wide">
                    Your service area — you&apos;ll only see incidents from here
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 md:text-gray-500">City / Town</label>
                      <input
                        {...register("city")}
                        type="text"
                        placeholder="e.g. Lagos"
                        className="w-full h-10 px-3 rounded-lg bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 md:text-gray-500">Community / Estate</label>
                      <input
                        {...register("community")}
                        type="text"
                        placeholder="e.g. Lekki Phase 1"
                        className="w-full h-10 px-3 rounded-lg bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 md:text-gray-500">State</label>
                      <input
                        {...register("state")}
                        type="text"
                        placeholder="e.g. Lagos State"
                        className="w-full h-10 px-3 rounded-lg bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 md:text-gray-500">Country</label>
                      <input
                        {...register("country")}
                        type="text"
                        placeholder="e.g. Nigeria"
                        className="w-full h-10 px-3 rounded-lg bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 md:text-gray-600 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    autoComplete="new-password"
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 md:focus:ring-indigo-500/40 focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 md:text-gray-400 hover:text-white md:hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-300 md:text-red-500">{String(errors.password.message ?? "")}</p>}
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all mt-2"
              >
                Create my account
              </Button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10 md:bg-gray-200" />
              <span className="text-xs text-white/40 md:text-gray-400">or</span>
              <div className="flex-1 h-px bg-white/10 md:bg-gray-200" />
            </div>

            <p className="text-center text-white/60 md:text-gray-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-300 md:text-indigo-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-white/40 md:text-gray-400 text-xs mt-5">
            Just browsing?{" "}
            <Link href="/map" className="underline text-white/60 md:text-gray-500 hover:text-white md:hover:text-gray-700 transition-colors">
              View the public incident map →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
