import CoupleNav from '@/components/CoupleNav';

export default function CoupleLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen overflow-y-auto">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-amber-200/10 blur-[120px]" />
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-emerald-300/10 blur-[120px]" />
        <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-rose-300/10 blur-[120px]" />
      </div>
      <CoupleNav />
      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-24">
        {children}
      </main>
    </div>
  );
}
