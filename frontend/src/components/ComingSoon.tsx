import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: Props): JSX.Element {
  return (
    <div className="bg-brand-card rounded-card shadow-card p-10 max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-orange/10 flex items-center justify-center">
        <Sparkles size={28} className="text-brand-orange" />
      </div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-brand-subtext mb-6">
        {description ?? 'This area is coming soon. For now, head over to your assignments.'}
      </p>
      <Link
        href="/assignments"
        className="inline-flex items-center gap-2 bg-brand-dark text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90"
      >
        Go to Assignments
      </Link>
    </div>
  );
}
