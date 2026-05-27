'use client';

import { useEffect, useState } from 'react';
import { listAssignments } from '@/lib/api';
import AssignmentsView from '@/components/AssignmentsView';
import type { AssignmentSummary } from '@/types';

export default function AssignmentsPage(): JSX.Element {
  const [items, setItems] = useState<AssignmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await listAssignments();
        if (mounted) setItems(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (items === null && !error) {
    return (
      <div className="bg-brand-card rounded-card shadow-card p-10 text-center text-sm text-brand-subtext">
        Loading assignments...
      </div>
    );
  }
  return <AssignmentsView initial={items ?? []} loadError={error} />;
}
