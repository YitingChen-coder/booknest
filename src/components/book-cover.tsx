import Image from "next/image";

type Props = {
  coverId: number | null;
  title: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { w: 64, h: 96, img: "S" },
  md: { w: 112, h: 168, img: "M" },
  lg: { w: 180, h: 270, img: "L" },
} as const;

export function BookCover({ coverId, title, size = "md" }: Props) {
  const { w, h, img } = SIZES[size];

  if (!coverId) {
    return (
      <div
        style={{ width: w, height: h }}
        className="flex shrink-0 items-center justify-center rounded-md border border-border bg-accent-soft p-2 text-center font-serif text-xs leading-snug text-muted"
        aria-label={`No cover for ${title}`}
      >
        {title}
      </div>
    );
  }

  return (
    <Image
      src={`https://covers.openlibrary.org/b/id/${coverId}-${img}.jpg`}
      alt={`Cover of ${title}`}
      width={w}
      height={h}
      // Covers are already sized by Open Library; skip Vercel image optimization quota.
      unoptimized
      className="shrink-0 rounded-md border border-border bg-accent-soft object-cover shadow-sm"
      style={{ width: w, height: h }}
    />
  );
}
