'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Mic,
  Minus,
  Plus,
  UploadCloud,
  X,
  ChevronDown,
} from 'lucide-react';
import { createAssignment } from '@/lib/api';
import { createAssignmentSchema, type CreateAssignmentForm } from '@/lib/schemas';

const DEFAULT_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Answer Questions',
  'True or False',
];

export default function CreateAssignmentPage(): JSX.Element {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateAssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      dueDate: '',
      additionalInstructions: '',
      questionTypes: [
        { type: 'Multiple Choice Questions', count: 4, marks: 1 },
        { type: 'Short Questions', count: 3, marks: 2 },
        { type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
        { type: 'Numerical Problems', count: 5, marks: 5 },
      ],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questionTypes' });

  const watched = watch('questionTypes');
  const totals = useMemo(() => {
    const tq = watched.reduce((s, r) => s + (Number(r.count) || 0), 0);
    const tm = watched.reduce((s, r) => s + (Number(r.count) || 0) * (Number(r.marks) || 0), 0);
    return { tq, tm };
  }, [watched]);

  const onPickFile = (f: File | null): void => {
    if (!f) return setFile(null);
    if (f.size > 10 * 1024 * 1024) {
      alert('File too large (max 10MB)');
      return;
    }
    setFile(f);
  };

  const onSubmit = async (values: CreateAssignmentForm): Promise<void> => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createAssignment({
        file,
        dueDate: values.dueDate,
        questionTypes: values.questionTypes,
        additionalInstructions: values.additionalInstructions ?? '',
      });
      router.push(`/assignments/${res.assignmentId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create assignment');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-online" />
          <h1 className="text-[18px] font-bold leading-none">Create Assignment</h1>
        </div>
        <p className="text-[13px] text-brand-subtext ml-5">
          Set up a new assignment for your students
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="h-1 rounded-full bg-brand-dark" />
          <div className="h-1 rounded-full bg-brand-border" />
        </div>

        <div className="bg-brand-card rounded-card shadow-card p-6 md:p-7 space-y-7">
          <div>
            <h2 className="text-[15px] font-bold">Assignment Details</h2>
            <p className="text-[12.5px] text-brand-subtext">
              Basic information about your assignment
            </p>
          </div>

          <div>
            <div
              className="border-2 border-dashed border-brand-border rounded-card px-6 py-8 flex flex-col items-center text-center cursor-pointer hover:border-brand-orange/60 transition"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPickFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <UploadCloud size={28} className="text-brand-subtext mb-3" />
              <p className="text-[14px] font-bold">Choose a file or drag &amp; drop it here</p>
              <p className="text-[11.5px] text-brand-subtext mt-0.5">JPEG, PNG, upto 10MB</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-5 py-1.5 text-[12.5px] rounded-full border border-brand-border bg-brand-card hover:bg-brand-page shadow-sm"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="mt-3 text-xs text-brand-text">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>
            <p className="text-[11.5px] text-brand-subtext mt-2 text-center">
              Upload images of your preferred document/image
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold mb-1.5">Due Date</label>
            <div className="relative">
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                {...register('dueDate')}
                className="w-full px-4 py-3 pr-11 rounded-full border border-brand-border bg-brand-card text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
              <Calendar
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none"
              />
            </div>
            {errors.dueDate && (
              <p className="text-xs text-red-600 mt-1">{errors.dueDate.message}</p>
            )}
          </div>

          <div>
            <div className="grid grid-cols-12 gap-3 px-1 mb-2 text-[12.5px] font-bold">
              <div className="col-span-7">Question Type</div>
              <div className="col-span-2 text-center">No. of Questions</div>
              <div className="col-span-3 text-center">Marks</div>
            </div>

            <div className="space-y-2.5">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-6">
                    <div className="relative">
                      <select
                        {...register(`questionTypes.${idx}.type` as const)}
                        className="w-full appearance-none px-4 py-2.5 pr-9 rounded-full border border-brand-border bg-brand-card text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                      >
                        {DEFAULT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none"
                      />
                    </div>
                    {errors.questionTypes?.[idx]?.type && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.questionTypes[idx]?.type?.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-1.5 rounded hover:bg-brand-page text-brand-subtext"
                      aria-label="Remove row"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="col-span-2">
                    <Controller
                      control={control}
                      name={`questionTypes.${idx}.count` as const}
                      render={({ field: f }) => (
                        <Stepper
                          value={Number(f.value) || 0}
                          onChange={f.onChange}
                          min={1}
                          max={50}
                        />
                      )}
                    />
                    {errors.questionTypes?.[idx]?.count && (
                      <p className="text-xs text-red-600 mt-1 text-center">
                        {errors.questionTypes[idx]?.count?.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-3">
                    <Controller
                      control={control}
                      name={`questionTypes.${idx}.marks` as const}
                      render={({ field: f }) => (
                        <Stepper
                          value={Number(f.value) || 0}
                          onChange={f.onChange}
                          min={1}
                          max={100}
                        />
                      )}
                    />
                    {errors.questionTypes?.[idx]?.marks && (
                      <p className="text-xs text-red-600 mt-1 text-center">
                        {errors.questionTypes[idx]?.marks?.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start justify-between mt-5 gap-4">
              <button
                type="button"
                onClick={() => append({ type: DEFAULT_TYPES[0], count: 1, marks: 1 })}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-brand-text"
              >
                <span className="w-7 h-7 rounded-full bg-brand-dark text-white flex items-center justify-center">
                  <Plus size={14} strokeWidth={3} />
                </span>
                Add Question Type
              </button>
              <div className="text-right text-[13px] space-y-0.5">
                <p>
                  <span className="font-semibold">Total Questions :</span>{' '}
                  <span className="font-bold">{totals.tq}</span>
                </p>
                <p>
                  <span className="font-semibold">Total Marks :</span>{' '}
                  <span className="font-bold">{totals.tm}</span>
                </p>
              </div>
            </div>

            {errors.questionTypes && typeof errors.questionTypes.message === 'string' && (
              <p className="text-xs text-red-600 mt-2">{errors.questionTypes.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-bold mb-1.5">
              Additional Information (For better output)
            </label>
            <div className="relative">
              <textarea
                {...register('additionalInstructions')}
                rows={4}
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                className="w-full px-4 py-3 pr-10 rounded-card border border-brand-border bg-brand-card text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
              />
              <button
                type="button"
                className="absolute right-3 bottom-3 p-1.5 rounded-full hover:bg-brand-page text-brand-subtext"
                aria-label="Voice input"
              >
                <Mic size={15} />
              </button>
            </div>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {submitError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-full border border-brand-border bg-brand-card text-[13.5px] font-medium hover:bg-brand-page shadow-sm"
          >
            ← Previous
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-2.5 rounded-full bg-brand-dark text-white text-[13.5px] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Next →'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface StepperProps {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}

function Stepper({ value, onChange, min, max }: StepperProps): JSX.Element {
  const dec = (): void => onChange(Math.max(min, value - 1));
  const inc = (): void => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center justify-between bg-brand-card border border-brand-border rounded-full px-2 py-1">
      <button
        type="button"
        onClick={dec}
        className="w-6 h-6 rounded-full hover:bg-brand-page flex items-center justify-center text-brand-subtext"
        aria-label="Decrease"
      >
        <Minus size={13} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="flex-1 text-center bg-transparent text-[13px] font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        className="w-6 h-6 rounded-full hover:bg-brand-page flex items-center justify-center text-brand-subtext"
        aria-label="Increase"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
