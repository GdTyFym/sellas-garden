'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface CoupleRecord {
  id: string;
  invite_code: string;
  created_at: string;
}

interface PlanRecord {
  id: string;
  title: string;
  notes: string | null;
  target_date: string | null;
  status: string;
  created_at: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Tanpa tanggal';
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString('id-ID', {
    dateStyle: 'medium',
    timeZone: 'UTC'
  });
};

const generateInviteCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => alphabet[value % alphabet.length])
    .join('');
};

export default function CoupleHQClient({
  userId,
  initialCouple,
  initialPlans
}: {
  userId: string;
  initialCouple: CoupleRecord | null;
  initialPlans: PlanRecord[];
}) {
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };
  const [couple, setCouple] = useState<CoupleRecord | null>(initialCouple);
  const [plans, setPlans] = useState<PlanRecord[]>(initialPlans);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: '',
    notes: '',
    target_date: ''
  });

  const refreshPlans = async (coupleId: string) => {
    const { data } = await getSupabase()
      .from('plans')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });
    setPlans(data ?? []);
  };

  const handleCreateCouple = async () => {
    setSaving(true);
    setError(null);
    setStatusMessage(null);

    const inviteCode = generateInviteCode();
    const { data: coupleData, error: coupleError } = await getSupabase()
      .from('couples')
      .insert({ invite_code: inviteCode })
      .select('*')
      .single();

    if (coupleError || !coupleData) {
      setError(coupleError?.message || 'Gagal membuat couple.');
      setSaving(false);
      return;
    }

    const { error: memberError } = await getSupabase().from('couple_members').insert({
      couple_id: coupleData.id,
      user_id: userId
    });

    if (memberError) {
      setError(memberError.message);
      setSaving(false);
      return;
    }

    setCouple(coupleData as CoupleRecord);
    await refreshPlans(coupleData.id);
    setStatusMessage('Invite code siap dibagikan ke pasangan.');
    setSaving(false);
  };

  const handleJoinCouple = async () => {
    setSaving(true);
    setError(null);
    setStatusMessage(null);

    const normalized = joinCode.trim().toUpperCase();
    if (!normalized) {
      setError('Masukkan invite code.');
      setSaving(false);
      return;
    }

    const { data: coupleData, error: coupleError } = await getSupabase()
      .from('couples')
      .select('*')
      .eq('invite_code', normalized)
      .single();

    if (coupleError || !coupleData) {
      setError('Invite code tidak ditemukan.');
      setSaving(false);
      return;
    }

    const { error: memberError } = await getSupabase().from('couple_members').insert({
      couple_id: coupleData.id,
      user_id: userId
    });

    if (memberError) {
      setError(memberError.message);
      setSaving(false);
      return;
    }

    setCouple(coupleData as CoupleRecord);
    await refreshPlans(coupleData.id);
    setStatusMessage('Joined! Semua rencana bisa diakses bersama.');
    setSaving(false);
  };

  const handleAddPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!couple) return;
    setSaving(true);
    setError(null);

    const { data, error: planError } = await getSupabase()
      .from('plans')
      .insert({
        couple_id: couple.id,
        title,
        notes: notes || null,
        target_date: targetDate || null,
        status: 'active',
        created_by: userId
      })
      .select('*')
      .single();

    if (planError || !data) {
      setError(planError?.message || 'Gagal menambahkan plan.');
      setSaving(false);
      return;
    }

    setPlans((prev) => [data as PlanRecord, ...prev]);
    setTitle('');
    setNotes('');
    setTargetDate('');
    setSaving(false);
  };

  const handleToggleStatus = async (plan: PlanRecord) => {
    const nextStatus = plan.status === 'done' ? 'active' : 'done';
    const { data, error: updateError } = await getSupabase()
      .from('plans')
      .update({ status: nextStatus })
      .eq('id', plan.id)
      .select('*')
      .single();

    if (updateError || !data) {
      setError(updateError?.message || 'Gagal mengubah status.');
      return;
    }

    setPlans((prev) => prev.map((item) => (item.id === plan.id ? (data as PlanRecord) : item)));
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Hapus plan ini?')) return;
    const { error: deleteError } = await getSupabase().from('plans').delete().eq('id', planId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setPlans((prev) => prev.filter((plan) => plan.id !== planId));
  };

  const startEdit = (plan: PlanRecord) => {
    setEditingId(plan.id);
    setEditDraft({
      title: plan.title,
      notes: plan.notes ?? '',
      target_date: plan.target_date ?? ''
    });
  };

  const saveEdit = async (planId: string) => {
    const { data, error: updateError } = await getSupabase()
      .from('plans')
      .update({
        title: editDraft.title,
        notes: editDraft.notes || null,
        target_date: editDraft.target_date || null
      })
      .eq('id', planId)
      .select('*')
      .single();

    if (updateError || !data) {
      setError(updateError?.message || 'Gagal menyimpan perubahan.');
      return;
    }

    setPlans((prev) => prev.map((item) => (item.id === planId ? (data as PlanRecord) : item)));
    setEditingId(null);
  };

  const activeCount = plans.filter((plan) => plan.status !== 'done').length;
  const doneCount = plans.filter((plan) => plan.status === 'done').length;

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Couple HQ</p>
            <h1 className="font-display text-3xl text-white">Our shared dashboard</h1>
            <p className="mt-2 text-sm text-white/60">Simpan rencana, update status, dan tetap sinkron di dua device.</p>
          </div>
          <Link
            href="/roadmap"
            className="inline-flex items-center justify-center rounded-full bg-amber-200/90 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-100"
          >
            Buka Roadmap Trip
          </Link>
        </div>

        {couple ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Invite code</p>
              <p className="mt-2 text-lg font-semibold text-white">{couple.invite_code}</p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(couple.invite_code);
                  setStatusMessage('Invite code disalin.');
                }}
                className="mt-3 text-xs text-amber-200 hover:text-amber-100"
              >
                Salin
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Plan aktif</p>
              <p className="mt-2 text-2xl font-semibold text-white">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Plan selesai</p>
              <p className="mt-2 text-2xl font-semibold text-white">{doneCount}</p>
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {statusMessage}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      {!couple ? (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur">
            <h2 className="font-display text-2xl text-white">Create couple</h2>
            <p className="mt-2 text-sm text-white/60">Buat ruang baru dan kirim invite code ke pasangan.</p>
            <button
              type="button"
              onClick={handleCreateCouple}
              disabled={saving}
              className="mt-6 rounded-full bg-amber-200/90 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create Couple'}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur">
            <h2 className="font-display text-2xl text-white">Join couple</h2>
            <p className="mt-2 text-sm text-white/60">Masukkan invite code dari pasanganmu.</p>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="8-char code"
              className="mt-4 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none transition focus:border-white/40"
            />
            <button
              type="button"
              onClick={handleJoinCouple}
              disabled={saving}
              className="mt-4 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Joining...' : 'Join Couple'}
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1">
              <h2 className="font-display text-2xl text-white">Plans list</h2>
              <p className="mt-2 text-sm text-white/60">Semua plan aktif dan selesai ada di sini.</p>

              <div className="mt-6 space-y-4">
                {plans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/50">
                    Belum ada plan. Tambahkan yang pertama di sebelah kanan.
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/30"
                    >
                      {editingId === plan.id ? (
                        <div className="space-y-3">
                          <input
                            value={editDraft.title}
                            onChange={(event) => setEditDraft((prev) => ({ ...prev, title: event.target.value }))}
                            className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2 text-white outline-none"
                          />
                          <input
                            type="date"
                            value={editDraft.target_date}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, target_date: event.target.value }))
                            }
                            className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2 text-white outline-none"
                          />
                          <textarea
                            value={editDraft.notes}
                            onChange={(event) => setEditDraft((prev) => ({ ...prev, notes: event.target.value }))}
                            rows={3}
                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none"
                          />
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => saveEdit(plan.id)}
                              className="rounded-full bg-amber-200/90 px-4 py-2 text-xs font-semibold text-black"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-white">{plan.title}</p>
                              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                                {formatDate(plan.target_date)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                                plan.status === 'done'
                                  ? 'bg-emerald-400/20 text-emerald-100'
                                  : 'bg-amber-400/20 text-amber-100'
                              }`}
                            >
                              {plan.status === 'done' ? 'Done' : 'Active'}
                            </span>
                          </div>
                          {plan.notes ? <p className="text-sm text-white/60">{plan.notes}</p> : null}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(plan)}
                              className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 transition hover:border-white/40"
                            >
                              {plan.status === 'done' ? 'Mark Active' : 'Mark Done'}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(plan)}
                              className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 transition hover:border-white/40"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="rounded-full border border-rose-300/30 px-4 py-2 text-xs text-rose-100 transition hover:border-rose-300/60"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleAddPlan} className="w-full max-w-sm space-y-4">
              <h3 className="font-display text-xl text-white">Add plan</h3>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Judul plan"
                required
                className="w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none transition focus:border-white/40"
              />
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none transition focus:border-white/40"
              />
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes (opsional)"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-white outline-none transition focus:border-white/40"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-amber-200/90 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Add Plan'}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
