import { cn } from "@/lib/utils";

const PALETTES: Array<[string, string]> = [
  ["#26251e", "#4d4938"],
  ["#8a3b12", "#f54e00"],
  ["#5c4a1e", "#b08a3f"],
  ["#3f4a2a", "#7a8f4a"],
  ["#1e3a4a", "#3f7a99"],
  ["#4a1e2e", "#a6475c"],
];

function hashSlug(slug: string) {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 33) ^ slug.charCodeAt(i);
  }
  return Math.abs(h);
}

export function PackCover({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const hash = hashSlug(slug);
  const [from, to] = PALETTES[hash % PALETTES.length];
  const monogram = slug.charAt(0).toUpperCase();
  const patternId = `dots-${slug}`;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-20"
        aria-hidden
      >
        <defs>
          <pattern
            id={patternId}
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
      <span className="relative font-sans text-7xl font-medium tracking-tight text-white/95">
        {monogram}
      </span>
      <span className="absolute bottom-3 right-4 rounded-md bg-black/25 px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/90">
        {slug}
      </span>
    </div>
  );
}
