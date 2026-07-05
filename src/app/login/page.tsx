"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, MapPin, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeckerLogo } from "@/components/ui/pecker-logo";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { toast } from "@/hooks/useToast";
import Link from "next/link";

const features = [
  { icon: MapPin, text: "Report incidents in under 60 seconds" },
  { icon: Shield, text: "Real-time response from your community team" },
  { icon: Bell, text: "Track every report from open to resolved" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Left panel — brand (desktop only) ── */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-[#0D1F52]">
        {/* Background geometry */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-blue-400/10 blur-2xl" />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <PeckerLogo variant="white" size="lg" showTagline className="flex-col items-start" />
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-6">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Why communities trust Pecker</p>
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-indigo-300" />
              </div>
              <p className="text-white/80 text-sm leading-relaxed pt-1.5">{text}</p>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-white/30 text-xs">
          © 2026 Pecker · Community Incident Platform
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1535] to-[#0D1F52] md:bg-none md:bg-gray-50 min-h-screen md:min-h-0">

        {/* Mobile logo */}
        <div className="md:hidden mb-10 flex flex-col items-center">
          <PeckerLogo variant="white" size="xl" showTagline className="flex-col items-center" />
        </div>

        <div className="w-full max-w-sm md:max-w-md">
          {/* Card */}
          <div className="bg-white/10 md:bg-white backdrop-blur-md md:backdrop-blur-none rounded-3xl p-8 border border-white/20 md:border-gray-200 shadow-2xl md:shadow-lg">

            <div className="mb-7">
              <h1 className="text-2xl font-bold text-white md:text-gray-900">Welcome back</h1>
              <p className="text-white/60 md:text-gray-500 text-sm mt-1">Sign in to your community dashboard</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 md:text-gray-600 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 md:bg-gray-50 border border-white/20 md:border-gray-200 text-white md:text-gray-900 placeholder:text-white/30 md:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 md:focus:ring-indigo-500/40 focus:border-transparent transition-all text-sm"
                />
                {errors.email && <p className="text-xs text-red-300 md:text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 md:text-gray-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
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
                {errors.password && <p className="text-xs text-red-300 md:text-red-500">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all mt-2"
              >
                Sign in
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10 md:bg-gray-200" />
              <span className="text-xs text-white/40 md:text-gray-400">or</span>
              <div className="flex-1 h-px bg-white/10 md:bg-gray-200" />
            </div>

            <p className="text-center text-white/60 md:text-gray-500 text-sm">
              New to Pecker?{" "}
              <Link href="/register" className="text-indigo-300 md:text-indigo-600 font-semibold hover:underline">
                Create a free account
              </Link>
            </p>
          </div>

          {/* Public map link */}
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
