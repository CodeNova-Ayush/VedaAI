import { notFound } from 'next/navigation';
import { getAssignmentResult } from '@/lib/api';
import DownloadPdfButton from '@/components/DownloadPdfButton';
import RegenerateButton from '@/components/RegenerateButton';

export const dynamic = 'force-dynamic';

interface Params {
  params: { id: string };
}

export default async function AssignmentOutputPage({ params }: Params): Promise<JSX.Element> {
  const result = await getAssignmentResult(params.id).catch(() => null);
  if (!result) notFound();
  if (result.status !== 'complete' || !result.paper) {
    return (
      <div className="bg-brand-card rounded-card shadow-card p-10 max-w-2xl mx-auto text-center">
        <p className="text-sm">
          This paper is still {result.status}. Please go back and wait for it to finish.
        </p>
      </div>
    );
  }

  const paper = result.paper;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-brand-dark text-white rounded-card p-6 md:p-7">
        <p className="text-[14px] leading-relaxed font-medium">
          Certainly, Lakshya! Here are customized Question Papers for your{' '}
          <span className="font-semibold">{paper.className}</span>{' '}
          <span className="font-semibold">{paper.subject}</span> classes:
        </p>
        <div className="mt-5 flex items-center gap-2.5">
          <DownloadPdfButton paper={paper} />
          <RegenerateButton id={params.id} />
        </div>
      </div>

      <article className="bg-brand-card rounded-card shadow-card p-7 md:p-10 space-y-5">
        <header className="text-center space-y-1.5">
          <h1 className="text-[20px] font-bold">{paper.schoolName}</h1>
          <p className="text-[14px] font-bold">Subject: {paper.subject}</p>
          <p className="text-[14px] font-bold">Class: {paper.className}</p>
        </header>

        <div className="flex justify-between text-[13px] pt-3">
          <span>
            <span className="font-bold">Time Allowed:</span> {paper.timeAllowed} minutes
          </span>
          <span>
            <span className="font-bold">Maximum Marks:</span> {paper.totalMarks}
          </span>
        </div>
        <p className="font-bold text-[13px]">
          All questions are compulsory unless stated otherwise.
        </p>

        <div className="space-y-1 text-[13px] pt-2">
          <p>Name: ____________________</p>
          <p>Roll Number: _______________</p>
          <p>Class: {paper.className} Section: ________</p>
        </div>

        {paper.sections.map((s, si) => (
          <section key={si} className="space-y-3 pt-2">
            <h2 className="text-[16px] font-bold text-center pt-4">{s.title}</h2>
            <h3 className="font-bold text-[14px]">{s.questionType}</h3>
            <p className="italic text-[12.5px] text-brand-subtext">{s.instruction}</p>
            <ol className="space-y-2.5 list-decimal pl-5 marker:font-medium marker:text-brand-text">
              {s.questions.map((q) => (
                <li key={q.number} className="text-[13px] leading-relaxed">
                  [{capitalize(q.difficulty)}] {q.text} [{q.marks} Marks]
                </li>
              ))}
            </ol>
          </section>
        ))}

        <p className="font-bold pt-3 text-[13px]">End of Question Paper</p>
      </article>

      <article className="bg-brand-card rounded-card shadow-card p-7 md:p-10">
        <h2 className="text-[15px] font-bold mb-4">Answer Key:</h2>
        <ol className="space-y-3 list-decimal pl-5 text-[13px] leading-relaxed">
          {paper.answerKey.map((a) => (
            <li key={a.number}>{a.answer}</li>
          ))}
        </ol>
      </article>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
