import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Loader2, ArrowRight } from 'lucide-react';
import {
  COURSE_COUNSELLING,
  type MedicalCourse,
  ExamTrack,
  findCourseByCode,
} from '../lib/courses';
import { FieldCourseSelector } from './ui/FieldCourseSelector';

const FIELDS: { id: ExamTrack; label: string; sub: string; exam: string }[] = [
  { id: 'MBBS_BDS', label: '🏥 MBBS / BDS', sub: 'NEET UG', exam: 'NEET UG' },
  { id: 'NEET_PG',  label: '🩺 MD / MS / Diploma', sub: 'NEET PG', exam: 'NEET PG' },
  { id: 'AYUSH',    label: '🌿 AYUSH', sub: 'BAMS/BHMS', exam: 'NEET UG' },
];

const CATEGORIES = ['General', 'OBC', 'EWS', 'SC', 'ST'];

export default function ChoiceFinder({ embedded = false }: { embedded?: boolean }) {
  const [field, setField] = useState<ExamTrack>('MBBS_BDS');
  const [course, setCourse] = useState<string>('MBBS');
  const [category, setCategory] = useState('General');
  const [rank, setRank] = useState('15000');
  const [choices, setChoices] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentExam = field === 'NEET_PG' ? 'NEET PG' : 'NEET UG';

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!rank || Number(rank) < 1) {
        setChoices(null);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const medicalCourse = (course !== 'All' ? course : (field === 'AYUSH' ? 'BAMS' : field === 'NEET_PG' ? 'MD' : 'MBBS')) as MedicalCourse;
        const counselling =
          currentExam === 'NEET UG'
            ? COURSE_COUNSELLING[medicalCourse]?.authorities[0] || 'All India UG - Medical & Dental'
            : 'All India PG';

        const res = await fetch('/api/choices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam: currentExam,
            course: course !== 'All' ? course : undefined,
            counselling,
            quota: 'All',
            category,
            rank: Number(rank),
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setChoices(data.choices);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError('Could not estimate');
        setChoices(null);
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [field, course, category, rank, currentExam]);

  return (
    <div
      className={
        embedded
          ? 'choice-finder-panel w-full rounded-[1.35rem] sm:rounded-[1.75rem] bg-[#171B24] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-4 sm:p-6 md:p-8 text-white'
          : 'choice-finder-panel w-full max-w-2xl mx-auto rounded-[1.35rem] sm:rounded-[1.75rem] bg-[#171B24] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-4 sm:p-6 md:p-8 text-white'
      }
    >
      {/* Field selection tabs */}
      <div className="flex p-1 rounded-full bg-white/[0.06] mb-4">
        {FIELDS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setField(f.id);
              if (f.id === 'MBBS_BDS') setCourse('MBBS');
              else if (f.id === 'AYUSH') setCourse('BAMS');
              else setCourse('MD General Medicine');
            }}
            className={`flex-1 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col items-center gap-0.5 ${
              field === f.id
                ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/25'
                : 'text-white/75 hover:text-white'
            }`}
          >
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Course & Speciality selector inside selected field */}
      <div className="mb-5">
        <FieldCourseSelector
          field={field}
          selectedCourse={course}
          onChange={(newCourse) => setCourse(newCourse)}
          dark={true}
          compact={true}
          label="Select Course in Selected Field"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <label className="flex flex-col gap-2 text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
            Category
          </span>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none border border-white/12 rounded-2xl px-4 py-3.5 pr-10 font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]/35 focus:border-[#F97316]/40 transition-all"
              style={{ backgroundColor: '#0F1218', color: '#ffffff' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: '#171B24', color: '#ffffff' }}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </label>

        <label className="flex flex-col gap-2 text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
            {field === 'NEET_PG' ? 'NEET PG AIR' : 'NEET UG AIR'}
          </span>
          <input
            type="number"
            min={1}
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="w-full border border-white/12 rounded-2xl px-4 py-3.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]/35 focus:border-[#F97316]/40 transition-all placeholder:text-white/30"
            placeholder={field === 'NEET_PG' ? 'e.g. 5200' : 'e.g. 15000'}
            style={{ backgroundColor: '#0F1218', color: '#ffffff' }}
          />
        </label>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-white/10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">
            Estimated {course && course !== 'All' ? course : field} Options
          </p>
          <p className="text-4xl font-black tracking-tight text-white flex items-baseline gap-2 min-h-[2.5rem]">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
            ) : error ? (
              <span className="text-base font-semibold text-red-400">{error}</span>
            ) : (
              <>
                {(choices ?? 0).toLocaleString()}
                <span className="text-base font-semibold text-white/40">colleges*</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link
            to={`/login`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full border border-white/15 text-white font-bold text-sm hover:bg-white/5 w-full sm:w-auto"
          >
            Full predictor
          </Link>
          <Link
            to={`/colleges`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#F97316] text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 w-full sm:w-auto"
          >
            Explore choices <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <p className="text-[10px] text-white/30 mt-4 text-center">
        *Based on official closing rank matrices from MCC, AACCC, and state counselling authorities.
      </p>
    </div>
  );
}
