import type { Difficulty } from '@/types';

const STYLES: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
  challenging: 'bg-red-100 text-red-700',
};

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  challenging: 'Challenging',
};

export default function DifficultyBadge({ value }: { value: Difficulty }): JSX.Element {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${STYLES[value]}`}>
      [{LABELS[value]}]
    </span>
  );
}
