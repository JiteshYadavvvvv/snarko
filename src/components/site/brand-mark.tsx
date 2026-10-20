import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`text-foreground inline-flex items-center gap-2 text-lg font-bold tracking-tight ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className="bg-brand-red inline-block size-6 shrink-0"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 25% 100%, 0% 70%)",
        }}
      />
      <span className="uppercase">Snarko</span>
    </Link>
  );
}
