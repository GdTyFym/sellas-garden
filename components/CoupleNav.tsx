import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

const navLinkClasses =
  'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white';

export default function CoupleNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-4 pt-4">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-black/40 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <span className="font-display text-base text-white">Couple HQ</span>
          <span className="hidden text-xs text-white/40 sm:inline">private space for us</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link className={navLinkClasses} href="/us">
            HQ
          </Link>
          <Link className={navLinkClasses} href="/roadmap">
            Roadmap
          </Link>
          <Link className={navLinkClasses} href="/garden">
            Garden
          </Link>
        </nav>
        <LogoutButton />
      </div>
    </header>
  );
}
