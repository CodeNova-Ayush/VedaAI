import Link from 'next/link';
import { ClipboardList, Plus, Sparkles, BookOpen } from 'lucide-react';

export default function HomePage(): JSX.Element {
  const quickLinks = [
    {
      href: '/assignments',
      icon: ClipboardList,
      title: 'Assignments',
      description: 'View and manage all your assignments.',
    },
    {
      href: '/assignments/create',
      icon: Plus,
      title: 'Create Assignment',
      description: 'Spin up a new AI-generated question paper.',
    },
    {
      href: '/toolkit',
      icon: Sparkles,
      title: "Teacher's Toolkit",
      description: 'AI helpers for lesson plans and rubrics.',
    },
    {
      href: '/library',
      icon: BookOpen,
      title: 'My Library',
      description: 'Reusable papers, rubrics, and templates.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-brand-card rounded-card shadow-card p-6 md:p-8">
        <h1 className="text-xl font-bold mb-1">Welcome back, John 👋</h1>
        <p className="text-sm text-brand-subtext">
          Pick up where you left off, or start something new.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {quickLinks.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="bg-brand-card rounded-card shadow-card p-5 hover:shadow-md transition flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
              <Icon size={20} className="text-brand-orange" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base mb-0.5 hover:underline underline-offset-4">
                {title}
              </p>
              <p className="text-sm text-brand-subtext">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
