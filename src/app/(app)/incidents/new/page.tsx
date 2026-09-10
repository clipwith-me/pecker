"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Camera, X, Loader2, CheckCircle2, Video, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TopBar } from "@/components/layout/top-bar";
import { createIncidentSchema, type CreateIncidentInput } from "@/lib/validations";
import { ALL_CATEGORIES, ALL_SEVERITIES, CATEGORY_LABELS, CATEGORY_ICONS, SEVERITY_LABELS, suggestCategory } from "@/lib/types";
import { EyeOff } from "lucide-react";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

type Step = "category" | "details" | "location" | "photos" | "review";

export default function NewIncidentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [images, setImages] = useState<{ url: string; file: File; mediaType: "image" | "video" }[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({ resolver: zodResolver(createIncidentSchema) as any });

  const locationText = watch("locationText");

  const steps: Step[] = ["category", "details", "location", "photos", "review"];
  const stepIndex = steps.indexOf(step);

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setValue("category", cat as CreateIncidentInput["category"]);
    setStep("details");
  };

  const getLocation = useCallback(() => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setValue("locationLat", latitude);
        setValue("locationLng", longitude);
        // Reverse geocode to human-readable address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const geo = await res.json();
          const a = geo.address ?? {};
          // Structured location fields for geo-scoping
          const city = a.city || a.town || a.municipality || a.county || null;
          const community = a.neighbourhood || a.suburb || a.village || a.hamlet || a.quarter || null;
          const state = a.state || a.region || null;
          const country = a.country || null;
          if (city) setValue("city", city);
          if (community) setValue("community", community);
          if (state) setValue("state", state);
          if (country) setValue("country", country);
          const parts = [
            a.road || a.pedestrian || a.footway,
            community,
            city,
            state,
          ].filter(Boolean);
          setValue("locationText", parts.length > 0 ? parts.join(", ") : geo.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setValue("locationText", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLocationLoading(false);
      },
      () => {
        toast({ title: "Location unavailable", description: "Please enter your location manually", variant: "destructive" });
        setLocationLoading(false);
      }
    );
  }, [setValue]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 3 - images.length).forEach((file) => {
      const url = URL.createObjectURL(file);
      setImages((prev) => [...prev, { url, file, mediaType: "image" }]);
    });
  };

  const startRecording = async () => {
    if (images.some((m) => m.mediaType === "video")) {
      toast({ title: "Only one video allowed per report", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      // Low bitrate keeps 30s clip under ~2 MB for fast upload
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 400_000,
        audioBitsPerSecond: 64_000,
      });
      videoChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
        const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
        const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setImages((prev) => [...prev, { url, file, mediaType: "video" }]);
        setRecording(false);
        setRecordingSeconds(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 30) { stopRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast({ title: "Camera access denied", description: "Allow camera permission to record video", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const removeMedia = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateIncidentInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isAnonymous }),
      });
      const result = await res.json();

      if (!result.success) throw new Error(result.error);

      const incidentId = result.data.id;

      if (images.length > 0) {
        await Promise.all(
          images.map(async ({ file }) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("incidentId", incidentId);
            await fetch("/api/upload", { method: "POST", body: formData });
          })
        );
      }


      setSuccess(true);
      setTimeout(() => router.push(`/incidents/${incidentId}`), 2000);
    } catch {
      toast({ title: "Submission failed", description: "Please try again", variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Incident Reported!</h2>
          <p className="text-muted-foreground">Your report has been submitted. The response team will review it shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Report Incident" showBack />

      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-1">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i <= stepIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-right">Step {stepIndex + 1} of {steps.length}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-4">
        {step === "category" && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-1">What&apos;s the issue?</h2>
            <p className="text-muted-foreground text-sm mb-4">Select the incident category</p>
            <div className="grid grid-cols-2 gap-3">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all touch-target",
                    selectedCategory === cat
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className="text-3xl">{CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]}</span>
                  <span className="text-xs font-medium text-center leading-tight">{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="animate-fade-in space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Describe the issue</h2>
              <p className="text-muted-foreground text-sm mb-4">Brief title + optional details</p>
            </div>
            <div>
              <Input
                {...register("title")}
                label="Title *"
                placeholder="e.g., Streetlight out on Main St"
                error={String(errors.title?.message ?? "") || undefined}
                onChange={(e) => {
                  register("title").onChange(e);
                  const suggestion = suggestCategory(e.target.value);
                  setSuggestedCategory(suggestion);
                }}
              />
              {suggestedCategory && suggestedCategory !== selectedCategory && (
                <button
                  type="button"
                  onClick={() => { selectCategory(suggestedCategory); setSuggestedCategory(null); }}
                  className="mt-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl w-full hover:bg-blue-100 transition-colors"
                >
                  <span>💡</span>
                  <span>Suggested: <strong>{CATEGORY_LABELS[suggestedCategory as keyof typeof CATEGORY_LABELS]}</strong> — tap to use</span>
                </button>
              )}
            </div>
            <Textarea
              {...register("description")}
              label="Description (optional)"
              placeholder="Additional details about the incident..."
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_SEVERITIES.map((sev) => {
                  const colors = {
                    LOW: "border-emerald-300 bg-emerald-50 text-emerald-700",
                    MEDIUM: "border-amber-300 bg-amber-50 text-amber-700",
                    HIGH: "border-orange-300 bg-orange-50 text-orange-700",
                    CRITICAL: "border-red-300 bg-red-50 text-red-700",
                  };
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setValue("severity", sev)}
                      className={cn(
                        "py-2 rounded-xl border-2 text-xs font-semibold transition-all",
                        watch("severity") === sev ? colors[sev] : "border-border bg-card text-muted-foreground"
                      )}
                    >
                      {SEVERITY_LABELS[sev]}
                    </button>
                  );
                })}
              </div>
              {errors.severity && <p className="mt-1 text-sm text-destructive">{String(errors.severity.message ?? "")}</p>}
            </div>
            {/* Anonymous toggle */}
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left",
                isAnonymous ? "border-slate-400 bg-slate-50 text-slate-700" : "border-border text-muted-foreground hover:border-slate-300"
              )}
            >
              <EyeOff className={cn("h-4 w-4 shrink-0", isAnonymous ? "text-slate-600" : "text-muted-foreground")} />
              <div>
                <p className="text-sm font-medium">{isAnonymous ? "Submitting anonymously" : "Submit anonymously"}</p>
                <p className="text-xs opacity-70">Your name won&apos;t appear on this report</p>
              </div>
              <div className={cn("ml-auto w-4 h-4 rounded-full border-2 shrink-0", isAnonymous ? "bg-slate-600 border-slate-600" : "border-border")} />
            </button>

            <Button type="button" size="lg" className="w-full" onClick={() => setStep("location")}>
              Continue
            </Button>
          </div>
        )}

        {step === "location" && (
          <div className="animate-fade-in space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Where is this happening?</h2>
              <p className="text-muted-foreground text-sm mb-4">Add location to help responders find it</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={getLocation}
              disabled={locationLoading}
            >
              {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {locationLoading ? "Getting location..." : "Use my current location"}
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or enter manually</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Input
              {...register("locationText")}
              label="Location description"
              placeholder="e.g., Corner of Oak Ave & 3rd Street"
              error={String(errors.locationText?.message ?? "") || undefined}
            />
            {locationText && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                <MapPin className="h-4 w-4 shrink-0" />
                {locationText}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button type="button" size="lg" className="flex-1" onClick={() => setStep("photos")}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "photos" && (
          <div className="animate-fade-in space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Add photos or video</h2>
              <p className="text-muted-foreground text-sm mb-4">Up to 3 photos or 1 video clip (max 30s) — optional</p>
            </div>

            {/* Media grid */}
            <div className="grid grid-cols-3 gap-3">
              {images.map((media, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-black">
                  {media.mediaType === "video" ? (
                    <video src={media.url} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.url} alt="" className="w-full h-full object-cover" />
                  )}
                  {media.mediaType === "video" && (
                    <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1">
                      <Video className="h-3 w-3 text-white inline" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}

              {/* Add photo slot */}
              {images.filter((m) => m.mediaType === "image").length < 3 && !recording && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            {/* Video recording controls */}
            {!images.some((m) => m.mediaType === "video") && (
              <div className="rounded-xl border border-border overflow-hidden">
                {recording && (
                  <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      ref={liveVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* REC badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-semibold text-white">REC {recordingSeconds}s / 30s</span>
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${(recordingSeconds / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="p-3">
                  {recording ? (
                    <Button type="button" size="sm" variant="destructive" onClick={stopRecording} className="w-full gap-1.5">
                      <StopCircle className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Video className="h-5 w-5" />
                      Record a video clip (up to 30s)
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep("location")}>
                Back
              </Button>
              <Button type="button" size="lg" className="flex-1" onClick={() => setStep("review")}>
                {images.length === 0 ? "Skip" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="animate-fade-in space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Review & Submit</h2>
              <p className="text-muted-foreground text-sm mb-4">Confirm your incident report</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-800 mb-0.5">⚠️ Accuracy matters</p>
              <p className="text-xs text-amber-700">Submitting a false or misleading report wastes emergency resources and erodes community trust. Community members can dispute reports — repeatedly flagged reports may result in account suspension.</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_ICONS[selectedCategory as keyof typeof CATEGORY_ICONS]}</span>
                <div>
                  <p className="font-semibold">{watch("title")}</p>
                  <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS]}</p>
                </div>
              </div>
              {watch("description") && (
                <p className="text-sm text-muted-foreground border-t border-border pt-3">{watch("description")}</p>
              )}
              {locationText && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-border pt-3">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {locationText}
                </div>
              )}
              {images.length > 0 && (
                <div className="flex gap-2 border-t border-border pt-3">
                  {images.map((media, i) =>
                    media.mediaType === "video" ? (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-black">
                        <video src={media.url} className="w-full h-full object-cover" muted playsInline />
                        <Video className="absolute bottom-1 right-1 h-3 w-3 text-white" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={media.url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    )
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep("photos")}>
                Back
              </Button>
              <Button type="submit" size="lg" className="flex-1" loading={submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
