import { listAssignments } from '@/lib/api';
import AssignmentsView from '@/components/AssignmentsView';
import type { AssignmentSummary } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage(): Promise<JSX.Element> {
  let assignments: AssignmentSummary[] = [];
  let loadError: string | null = null;
  try {
    assignments = await listAssignments();
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load assignments';
  }
  return <AssignmentsView initial={assignments} loadError={loadError} />;
}
