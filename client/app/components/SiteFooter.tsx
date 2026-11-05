import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#284472] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold">Closet Circle</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
            A peer-to-peer marketplace for buying, selling, and renting clothing within a community.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link className="hover:underline" href="/about">About</Link>
          <Link className="hover:underline" href="/explore">Explore</Link>
          <a
            className="hover:underline"
            href="https://github.com/SanjanaNagwekar/closet-circle"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-white/50">Closet Circle</p>
    </footer>
  );
}
