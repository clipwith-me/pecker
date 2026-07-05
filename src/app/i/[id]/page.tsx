import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, ThumbsUp, ArrowLeft, ExternalLink } from "lucide-react";
import { PeckerLogo } from "@/components/ui/pecker-logo";
import { StatusBadge, SeverityBadge } from "@/components/incidents/status-badge";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import type { IncidentStatus, Severity } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      reportedBy: { select: { name: true } },
      images: true,
      _count: { select: { votes: true } },
    },
  });

  if (!incident) notFound();

  const icon = CATEGORY_ICONS[incident.category as keyof typeof CATEGORY_ICONS] ?? "📋";
  const label = CATEGORY_LABELS[incident.category as keyof typeof CATEGORY_LABELS] ?? incident.category;
  const reporter = incident.isAnonymous
    ? (incident.guestName ? `${incident.guestName} (anonymous)` : "Anonymous")
    : incident.reportedBy.name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/map" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to map
        </Link>
        <PeckerLogo variant="default" size="sm" />
        <Link
          href="/login"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          Sign in <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Category + title */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{incident.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={incident.status as IncidentStatus} />
            <SeverityBadge severity={incident.severity as Severity} />
          </div>

          {incident.description && (
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
              {incident.description}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2.5 text-sm text-gray-600">
          {incident.locationText && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
              <span>{incident.locationText}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            <span>Reported {formatDateTime(incident.createdAt.toISOString())}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 shrink-0 text-gray-400" />
            <span>{incident._count.votes} {incident._count.votes === 1 ? "person" : "people"} affected</span>
          </div>
          <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5">
            <span className="text-xs text-gray-400">Reported by</span>
            <span className="text-xs font-medium text-gray-700">{reporter}</span>
          </div>
        </div>

        {/* Photos / videos */}
        {incident.images.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Attached media</p>
            <div className="grid grid-cols-2 gap-2">
              {incident.images.map((img) => (
                <div key={img.id} className="rounded-xl overflow-hidden aspect-video bg-black">
                  {img.mediaType === "video" ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={img.url} controls className="w-full h-full object-cover" playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA for logged-out users */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-sm font-semibold text-blue-800">Want to help?</p>
          <p className="text-xs text-blue-600">Sign in to upvote this incident, add a note, or report a new one in your area.</p>
          <div className="flex gap-2 justify-center pt-1">
            <Link href="/login" className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="px-4 py-2 text-xs font-semibold border border-blue-300 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
