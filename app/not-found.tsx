export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--garden-night)] px-6 text-center text-[var(--garden-ivory)]">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.6em] text-white/60 font-display">
          Page Not Found
        </p>
        <h1 className="text-2xl font-display text-[var(--garden-ivory)] md:text-3xl">
          Page Not Found
        </h1>
        <p className="text-sm text-white/70">
          Halaman ini tidak tersedia.
        </p>
      </div>
    </div>
  );
}
