'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, Loader2 } from 'lucide-react';
import { regenerateAssignment } from '@/lib/api';

export default function RegenerateButton({ id }: { id: string }): JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async (): Promise<void> => {
    setBusy(true);
    try {
      await regenerateAssignment(id);
      router.push(`/assignments/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to regenerate');
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[13px] font-medium hover:bg-white/15 disabled:opacity-60"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
      Regenerate
    </button>
  );
}
