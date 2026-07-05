import { cn } from "@/lib/utils";

interface PeckerLogoProps {
  variant?: "default" | "white" | "icon-only";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

const sizes = {
  sm: { icon: "w-7 h-7", text: "text-lg", tagline: "text-[9px]" },
  md: { icon: "w-9 h-9", text: "text-xl", tagline: "text-[10px]" },
  lg: { icon: "w-14 h-14", text: "text-3xl", tagline: "text-xs" },
  xl: { icon: "w-20 h-20", text: "text-5xl", tagline: "text-sm" },
};

export function PeckerLogo({ variant = "default", size = "md", className, showTagline }: PeckerLogoProps) {
  const s = sizes[size];
  const isWhite = variant === "white";

  // Dark vs light variants match the logo image exactly
  const pinFill   = isWhite ? "white"    : "#0D1F52";
  const checkFill = "#4F46E5"; // indigo — same in both variants
  const arcColor  = "#4F46E5";
  const textColor    = isWhite ? "text-white"    : "text-[#0D1F52]";
  const taglineColor = isWhite ? "text-white/70" : "text-[#0D1F52]/60";

  // ViewBox: 110 wide × 122 tall
  // Pin outer circle: center (50, 56), r=38  → top y=18, bottom of circle y=94
  // Pin inner circle (hole): center (50, 56), r=24
  // Pin tail: circle bottom → point at (50, 114)
  // Signal arc source: (76, 24) — upper-right, outside pin boundary
  // Arcs sweep from 200° to 300° clockwise (100° arc, concave facing lower-left toward pin)

  const IconSVG = (
    <svg
      viewBox="0 0 110 122"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(s.icon, "shrink-0")}
      aria-hidden="true"
    >
      {/*
        Signal arcs — drawn FIRST (behind pin).
        Source center (76, 24) is outside the pin outer circle.
        100° arcs from 200° to 300° clockwise through 270° (topmost point).
        Concave side faces lower-left (toward pin).

        cos200°=-0.940  sin200°=-0.342  (upper-left of center in SVG)
        cos300°= 0.500  sin300°=-0.866  (upper-right of center in SVG)
        cos270°= 0.000  sin270°=-1.000  (directly above center)
      */}

      {/* Arc 1 — innermost, r=9 */}
      <path
        d="M 67.6,21.1 A 9,9 0 0,1 80.5,16.2"
        stroke={arcColor}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arc 2 — middle, r=14 */}
      <path
        d="M 62.8,19.2 A 14,14 0 0,1 83.0,11.9"
        stroke={arcColor}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.72"
      />
      {/* Arc 3 — outermost, r=19 */}
      <path
        d="M 58.1,17.5 A 19,19 0 0,1 85.5,7.5"
        stroke={arcColor}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.44"
      />

      {/*
        Pin shape — drawn on top of arcs so arcs "emerge" from pin edge.
        Outer teardrop + inner circle hole using fill-rule=evenodd.
        Outer: circle center (50,56) r=38, tail to (50,114).
        Inner circle hole: center (50,56) r=24.
      */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={[
          // Outer teardrop (circle top + tapered tail)
          "M 50 18",
          "C 29 18  12 35  12 56",
          "C 12 77  30 96  50 114",
          "C 70 96  88 77  88 56",
          "C 88 35  71 18  50 18 Z",
          // Inner circle hole (clockwise so evenodd cuts it out)
          "M 50 32",
          "C 37 32  26 43  26 56",
          "C 26 69  37 80  50 80",
          "C 63 80  74 69  74 56",
          "C 74 43  63 32  50 32 Z",
        ].join(" ")}
        fill={pinFill}
      />

      {/*
        Checkmark — drawn last (on top of pin ring, inside the hole).
        The hole center is (50,56). Checkmark spans nicely inside the hole.
        Left leg: (33,56) → (45,68)
        Right leg: (45,68) → (69,38)
      */}
      <path
        d="M 33 56 L 45 68 L 69 38"
        stroke={checkFill}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "icon-only") return IconSVG;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {IconSVG}
      <div className="flex flex-col leading-none">
        <span className={cn("font-bold tracking-widest uppercase", s.text, textColor)}>
          PECKER
        </span>
        {showTagline && (
          <span className={cn("font-medium tracking-widest uppercase mt-0.5", s.tagline, taglineColor)}>
            Report. Resolve. Improve.
          </span>
        )}
      </div>
    </div>
  );
}
