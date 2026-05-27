'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import { subscribeToJob } from '@/lib/socket';
import { getAssignmentResult, regenerateAssignment } from '@/lib/api';

export default function AssignmentLoadingPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [progress, setProgress] = useState(5);
  const [message, setMessage] = useState('Connecting...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let teardown: (() => void) | undefined;

    void (async () => {
      teardown = await subscribeToJob(id, {
        onProgress: (p) => {
          if (!mounted) return;
          setProgress(p.progress);
          setMessage(p.message);
        },
        onComplete: () => {
          if (!mounted) return;
          router.replace(`/assignments/${id}/output`);
        },
        onError: (e) => {
          if (!mounted) return;
          setError(e.error);
        },
      });

      try {
        const r = await getAssignmentResult(id);
        if (!mounted) return;
        if (r.status === 'complete') router.replace(`/assignments/${id}/output`);
        else if (r.status === 'failed')
          setError('Generation previously failed. Try regenerating.');
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to fetch result');
      }
    })();

    return () => {
      mounted = false;
      teardown?.();
    };
  }, [id, router]);

  const onRetry = async (): Promise<void> => {
    setError(null);
    setProgress(5);
    setMessage('Re-queuing...');
    try {
      await regenerateAssignment(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to retry');
    }
  };

  return (
    <div className="bg-brand-card rounded-card shadow-card p-10 max-w-2xl mx-auto text-center">
      {error ? (
        <>
          <AlertTriangle size={36} className="mx-auto text-red-600 mb-3" />
          <h2 className="text-lg font-bold mb-1">Generation failed</h2>
          <p className="text-sm text-brand-subtext mb-5">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-brand-dark text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
          >
            <RotateCw size={14} className="text-brand-orange" /> Retry
          </button>
        </>
      ) : (
        <>
          <Loader2 size={36} className="mx-auto text-brand-orange animate-spin mb-3" />
          <h2 className="text-lg font-bold mb-1">Generating your question paper...</h2>
          <p className="text-sm text-brand-subtext mb-5">{message}</p>
          <div className="h-2 bg-brand-page rounded-full overflow-hidden max-w-md mx-auto">
            <div
              className="h-full bg-brand-orange transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-brand-subtext mt-2">{progress}%</p>
        </>
      )}
    </div>
  );
}
