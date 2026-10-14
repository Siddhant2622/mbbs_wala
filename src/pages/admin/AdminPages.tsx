import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminRole } from '../../components/admin/AdminLayout';
import {
  Users,
  UserCheck,
  PhoneCall,
  Trophy,
  Clock,
  Search,
  Plus,
  Check,
  X,
  Send,
  MessageSquare,
  FileText,
  Activity,
  Shield,
  Loader2,
  ArrowUpRight,
  ShoppingBag,
  Bell,
  UserPlus,
  Sparkles,
  TrendingUp,
  AlertCircle,
  IndianRupee,
  History,
  RefreshCw,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  Megaphone,
  Newspaper,
} from 'lucide-react';
import { apiJson } from '../../lib/api';

/* ───────── shared UI (theme-safe via admin-shell CSS vars + classes) ───────── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`admin-card rounded-[1.35rem] border backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = 'orange',
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'orange' | 'blue' | 'green' | 'purple' | 'rose' | 'teal';
  hint?: string;
}) {
  const tones: Record<string, string> = {
    orange: 'from-[#FF7A1A] to-[#FF4D8D]',
    blue: 'from-[#2B8CFF] to-[#6366F1]',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-violet-500 to-fuchsia-500',
    rose: 'from-rose-500 to-pink-500',
    teal: 'from-teal-500 to-cyan-500',
  };
  return (
    <Card className="p-5 relative overflow-hidden group admin-card-hover transition-shadow">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${tones[tone]} opacity-[0.14] group-hover:opacity-25 transition-opacity`} />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] admin-muted mb-1.5">{label}</p>
          <p className="text-3xl font-black tracking-tight admin-text tabular-nums">{value}</p>
          {hint && <p className="text-[11px] font-medium admin-muted mt-1">{hint}</p>}
        </div>
        <span className={`w-11 h-11 rounded-2xl grid place-items-center text-white bg-gradient-to-br ${tones[tone]} shadow-lg`}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
    </Card>
  );
}

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`admin-badge admin-badge-${tone || 'slate'} inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold capitalize`}>
      {children}
    </span>
  );
}

function statusTone(s: string) {
  if (['completed', 'admitted', 'paid', 'approved', 'done', 'online', 'active'].includes(s)) return 'green';
  if (['pending', 'follow_up', 'new', 'assigned'].includes(s)) return 'orange';
  if (['in_progress'].includes(s)) return 'blue';
  if (['rejected', 'offline', 'unassigned', 'inactive'].includes(s)) return 'red';
  return 'slate';
}

function fmt(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d;
  }
}

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function Loader() {
  return (
    <div className="py-20 grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-xs font-bold uppercase tracking-wider admin-muted">Loading</p>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="admin-error rounded-2xl border p-6 font-semibold flex gap-3 items-start">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

function Toast({ text, tone = 'ok' }: { text: string; tone?: 'ok' | 'err' }) {
  if (!text) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-sm font-semibold px-4 py-2.5 rounded-xl border ${
        tone === 'ok' ? 'admin-toast-ok' : 'admin-toast-err'
      }`}
    >
      {text}
    </motion.p>
  );
}

/* ───────── Overview ───────── */

export function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const roleOverride = useAdminRole();

  useEffect(() => {
    apiJson('/api/admin-overview', {}, true)
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (err) return <ErrorBox msg={err} />;

  const s = data.stats || {};
  // Use roleOverride so Super Admin in 'Counsellor View' sees counsellor content
  const isSuper = roleOverride === 'super_admin';
  const pipeline = data.pipeline || [];
  const maxPipe = Math.max(1, ...pipeline.map((p: any) => p.count));
  const firstName = data.staff?.name?.split(' ')[0] || (isSuper ? 'Admin' : 'Counsellor');

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 min-h-[200px] shadow-2xl">
        <img
          src={isSuper ? '/images/mbbswala/india-gmc.jpg' : '/images/mbbswala/india-family-consult.jpg'}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/96 via-[#0B1220]/88 to-[#0B1220]/40" />
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-orange-500/25 blur-3xl rounded-full" />
        <div className="relative z-10 p-6 md:p-8 flex flex-wrap items-end justify-between gap-4 text-white">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300 mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              {isSuper ? 'Super Admin · full control' : 'Counsellor · your students only'}
            </p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              {isSuper ? 'Command center for paid packages & assignments' : `Welcome back, ${firstName}`}
            </h2>
            <p className="text-sm text-white/70 mt-2 font-medium leading-relaxed">
              {isSuper
                ? 'See revenue, unassigned paid students, counsellor load — then assign in one click. Student + counsellor both get notified.'
                : 'Work your assigned pipeline: update status, add notes, schedule follow-ups, and message families.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/students" className="px-4 py-2.5 rounded-full bg-white text-slate-900 text-sm font-bold shadow-lg">
              {isSuper ? 'All students' : 'My students'}
            </Link>
            {isSuper ? (
              <Link to="/admin/purchases" className="px-4 py-2.5 rounded-full bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/30">
                Assign packages
              </Link>
            ) : (
              <Link to="/admin/followups" className="px-4 py-2.5 rounded-full bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/30">
                Follow-ups due
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Easy next steps */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(isSuper
          ? [
              { to: '/admin/purchases', t: '1. Packages sold', d: 'Mark paid & assign counsellor', img: '/images/mbbswala/india-college-1.jpg', icon: ShoppingBag },
              { to: '/admin/students', t: '2. Assign students', d: 'Match counsellor to each case', img: '/images/mbbswala/india-students.jpg', icon: Users },
              { to: '/admin/staff', t: '3. Manage team', d: 'Add / pause counsellors', img: '/images/mbbswala/india-doctors-group.jpg', icon: Shield },
              { to: '/admin/notifications', t: '4. Broadcast', d: 'Alert staff or students', img: '/images/mbbswala/india-doctor.jpg', icon: Bell },
            ]
          : [
              { to: '/admin/students', t: '1. Open a student', d: 'See rank, package, history', img: '/images/mbbswala/india-students.jpg', icon: Users },
              { to: '/admin/followups', t: '2. Call follow-ups', d: 'Clear due reminders', img: '/images/mbbswala/india-counsel-meet.jpg', icon: PhoneCall },
              { to: '/admin/purchases', t: '3. My packages', d: 'Paid cases on your desk', img: '/images/mbbswala/india-college-2.jpg', icon: ShoppingBag },
              { to: '/admin/activity', t: '4. My activity', d: 'What you did today', img: '/images/mbbswala/dash-insights.png', icon: Activity },
            ]
        ).map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="admin-card group overflow-hidden rounded-2xl border hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-24 relative overflow-hidden">
              <img src={q.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-2 w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 grid place-items-center text-white shadow-lg">
                <q.icon className="w-4 h-4" />
              </span>
            </div>
            <div className="p-3.5">
              <p className="font-black text-sm admin-text">{q.t}</p>
              <p className="text-[11px] admin-muted font-medium mt-0.5">{q.d}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Students" value={s.total_students} icon={Users} tone="blue" hint={`${s.paid_students || 0} paid packages`} />
        <Stat label="Active pipeline" value={s.pending} icon={Clock} tone="orange" hint={`${s.in_progress || 0} in progress`} />
        <Stat label="Admitted" value={s.admitted} icon={Trophy} tone="green" hint={`${s.conversion_rate || 0}% conversion`} />
        <Stat
          label={isSuper ? 'Unassigned paid' : 'Follow-ups due'}
          value={isSuper ? s.unassigned_paid : s.pending_followups}
          icon={isSuper ? AlertCircle : PhoneCall}
          tone={isSuper ? 'rose' : 'purple'}
          hint={isSuper ? 'Needs counsellor' : 'Pending today'}
        />
      </div>

      {isSuper && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Stat label="Tracked revenue" value={money(s.revenue)} icon={IndianRupee} tone="teal" />
          <Stat label="This month" value={money(s.month_revenue)} icon={TrendingUp} tone="orange" />
          <Stat label="Online counsellors" value={`${s.online_staff}/${s.total_staff}`} icon={Shield} tone="purple" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-lg text-slate-900">Counselling pipeline</h3>
              <p className="text-xs text-slate-400 font-medium">Where every student stands right now</p>
            </div>
          </div>
          <div className="space-y-3">
            {pipeline.map((p: any) => {
              const pct = maxPipe > 0 && p.count > 0 ? Math.round((p.count / maxPipe) * 100) : 0;
              return (
                <div key={p.key} className="grid grid-cols-[120px_1fr_40px] sm:grid-cols-[140px_1fr_48px] items-center gap-3">
                  <p className="text-xs font-bold text-slate-600 admin-text">{p.label}</p>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-300 ${
                        p.count === 0 ? 'opacity-0' : 'opacity-100'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-sm font-black text-slate-900 admin-text text-right tabular-nums">{p.count}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <h3 className="font-black text-lg mb-4">Live activity</h3>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {(data.todayActivity || []).length === 0 && (
              <p className="text-sm text-slate-400 font-medium">No activity yet today.</p>
            )}
            {(data.todayActivity || []).map((a: any) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">{a.action}</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {a.staff_name} · {fmt(a.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg">Recent students</h3>
            <Link to="/admin/students" className="text-sm font-bold text-orange-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(data.students || []).map((st: any) => (
              <Link
                key={st.id}
                to={`/admin/students/${st.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{st.name}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    AIR {st.neet_rank?.toLocaleString() || '—'} · {st.state || '—'} · {st.purchased_counselling || st.purchased_course || 'No package'}
                  </p>
                </div>
                <Badge tone={statusTone(st.counselling_status)}>{st.counselling_status}</Badge>
              </Link>
            ))}
          </div>
        </Card>

        {isSuper ? (
          <Card className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg">Counsellor board</h3>
              <Link to="/admin/staff" className="text-sm font-bold text-orange-600 hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {(data.staffList || []).map((c: any, idx: number) => (
                <div key={c.user_id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80">
                  <img
                    src={c.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.email)}&background=FF7A1A&color=fff&bold=true&size=88`}
                    alt=""
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.email)}&background=FF7A1A&color=fff&bold=true&size=88`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-slate-900">{c.name}</p>
                      <Badge tone={statusTone(c.presence || 'offline')}>{c.presence || 'offline'}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {c.assigned_count || 0} students · {c.pending_count || 0} pending · {c.admitted_count || 0} admitted
                    </p>
                  </div>
                </div>
              ))}
              {!(data.staffList || []).length && <p className="text-sm text-slate-400">No active counsellors</p>}
            </div>
          </Card>
        ) : (
          <Card className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg">Pending follow-ups</h3>
              <Link to="/admin/followups" className="text-sm font-bold text-orange-600 hover:underline">
                Open
              </Link>
            </div>
            <div className="space-y-2">
              {(data.followups || []).slice(0, 6).map((f: any) => (
                <div key={f.id} className="p-3 rounded-2xl border border-slate-100">
                  <p className="font-bold text-sm">Student #{f.student_id}</p>
                  <p className="text-xs text-slate-500">{f.note || '—'}</p>
                  <p className="text-[11px] text-orange-600 font-bold mt-1">Due {fmt(f.due_at)}</p>
                </div>
              ))}
              {!(data.followups || []).length && <p className="text-sm text-slate-400 font-medium">All caught up 🎉</p>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ───────── Staff ───────── */

export function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', employee_id: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiJson<any[]>('/api/admin-staff', {}, true)
      .then(data => setStaff(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await apiJson('/api/admin-staff', { method: 'POST', body: JSON.stringify(form) }, true);
      setMsg('Sub-admin created successfully');
      setShowForm(false);
      setForm({ full_name: '', email: '', password: '', phone: '', employee_id: '' });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (s: any) => {
    await apiJson(
      '/api/admin-staff',
      { method: 'PUT', body: JSON.stringify({ user_id: s.user_id, is_active: !s.is_active }) },
      true
    );
    load();
  };

  const remove = async (s: any) => {
    if (!confirm(`Delete counsellor ${s.name}?`)) return;
    await apiJson('/api/admin-staff', { method: 'DELETE', body: JSON.stringify({ user_id: s.user_id }) }, true);
    load();
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight">Sub-admin / Counsellors</h2>
          <p className="text-sm text-slate-500 font-medium">Create accounts, monitor load & presence</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold shadow-lg"
        >
          <Plus className="w-4 h-4" /> New counsellor
        </button>
      </div>

      <Toast text={msg} />
      {err && <Toast text={err} tone="err" />}

      {showForm && (
        <Card className="p-5 md:p-6">
          <form onSubmit={create} className="grid sm:grid-cols-2 gap-3">
            {[
              ['full_name', 'Full name'],
              ['email', 'Login email'],
              ['password', 'Temp password'],
              ['phone', 'Phone'],
              ['employee_id', 'Employee ID (optional)'],
            ].map(([k, label]) => (
              <label key={k} className="text-sm font-semibold text-slate-600">
                {label}
                <input
                  required={k !== 'employee_id' && k !== 'phone'}
                  type={k === 'password' ? 'password' : k === 'email' ? 'email' : 'text'}
                  value={(form as any)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </label>
            ))}
            <div className="sm:col-span-2 flex gap-2 pt-1">
              <button
                disabled={busy}
                type="submit"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-sm disabled:opacity-60"
              >
                {busy ? 'Creating…' : 'Create sub-admin'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full border border-slate-200 font-bold text-sm">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {staff.map((s, idx) => (
          <Card key={s.user_id} className="p-5">
            <div className="flex items-start gap-4">
              <img
                src={s.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || s.email)}&background=FF7A1A&color=fff&bold=true&size=128`}
                alt={s.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-orange-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || s.email)}&background=FF7A1A&color=fff&bold=true&size=128`;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-slate-900">{s.name}</h3>
                  <Badge tone={s.role === 'super_admin' ? 'purple' : 'orange'}>
                    {s.role === 'super_admin' ? 'Super Admin' : 'Counsellor'}
                  </Badge>
                  <Badge tone={statusTone(s.presence || 'offline')}>{s.presence || 'offline'}</Badge>
                  <Badge tone={s.is_active ? 'green' : 'red'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-3">
                  {s.employee_id} · {s.email} · {s.phone || 'No phone'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
                  {[
                    ['Assigned', s.assigned_count ?? 0],
                    ['Pending', s.pending_count ?? 0],
                    ['Today', s.contacted_today ?? 0],
                    ['Rating', s.student_rating ?? '—'],
                  ].map(([l, v]) => (
                    <div key={l as string} className="rounded-xl bg-slate-50 py-2.5">
                      <p className="text-base font-black text-slate-900">{v as any}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{l as string}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  <span className="font-bold">Now:</span> {s.current_activity || '—'}
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Last login {fmt(s.last_login)} · Activity {fmt(s.last_activity)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggleActive(s)} className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 hover:bg-slate-50">
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => remove(s)} className="px-3 py-1.5 rounded-full text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ───────── Students list ───────── */

export function AdminStudentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();
  const roleOverride = useAdminRole();
  const role = roleOverride;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const data = await apiJson<any[]>(`/api/admin-students?${params}`, {}, true);
      setRows(data);
      if (role === 'super_admin') {
        const s = await apiJson<any[]>('/api/admin-staff', {}, true);
        setStaff(s.filter((x) => x.is_active));
      }
    } finally {
      setLoading(false);
    }
  }, [q, status, role]);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (studentId: number, staffId: string) => {
    await apiJson(
      '/api/admin-students',
      {
        method: 'PUT',
        body: JSON.stringify({
          id: studentId,
          assigned_to: staffId || null,
          counselling_status: staffId ? 'assigned' : 'unassigned',
        }),
      },
      true
    );
    setToast(staffId ? 'Counsellor assigned — student & sub-admin notified' : 'Student unassigned');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">{role === 'super_admin' ? 'All students' : 'My assigned students'}</h2>
          <p className="text-sm text-slate-500 font-medium">
            {role === 'super_admin' ? 'Assign paid packages to counsellors (dual notification)' : 'Your counselling pipeline'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone"
              className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium w-56 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold">
            <option value="">All statuses</option>
            {['new', 'assigned', 'in_progress', 'follow_up', 'completed', 'admitted', 'unassigned'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Toast text={toast} />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-10">
            <Loader />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left p-4 font-bold">Student</th>
                  <th className="text-left p-4 font-bold">Rank / State</th>
                  <th className="text-left p-4 font-bold">Package</th>
                  <th className="text-left p-4 font-bold">Status</th>
                  {role === 'super_admin' && <th className="text-left p-4 font-bold">Assign counsellor</th>}
                  <th className="text-left p-4 font-bold">Last contact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-orange-50/40 cursor-pointer transition-colors" onClick={() => navigate(`/admin/students/${r.id}`)}>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{r.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {r.email} · {r.phone}
                      </p>
                      {r.user_id ? (
                        <span className="inline-flex mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Portal linked</span>
                      ) : (
                        <span className="inline-flex mt-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">No portal login</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{r.neet_rank?.toLocaleString() || '—'}</p>
                      <p className="text-xs text-slate-400">
                        {r.category} · {r.state}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{r.purchased_counselling || r.purchased_course || '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge tone={statusTone(r.payment_status)}>{r.payment_status}</Badge>
                        {r.payment_amount > 0 && <span className="text-xs font-bold text-slate-500">{money(r.payment_amount)}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge tone={statusTone(r.counselling_status)}>{r.counselling_status}</Badge>
                    </td>
                    {role === 'super_admin' && (
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={r.assigned_to || ''}
                          onChange={(e) => assign(r.id, e.target.value)}
                          className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold max-w-[180px] bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                        >
                          <option value="">Unassigned</option>
                          {staff.map((s) => (
                            <option key={s.user_id} value={s.user_id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="p-4 text-xs text-slate-500 font-medium">{fmt(r.last_contact_at || r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="p-10 text-center text-slate-400 font-medium">No students found</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ───────── Student detail ───────── */

export function AdminStudentDetailPage() {
  const { id } = useParams();
  const [pack, setPack] = useState<any>(null);
  const role = useAdminRole();
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [followNote, setFollowNote] = useState('');
  const [followDate, setFollowDate] = useState('');
  const [followTime, setFollowTime] = useState('10:00');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [staff, setStaff] = useState<any[]>([]);

  const load = useCallback(async () => {
    const data = await apiJson<any>(`/api/admin-students?id=${id}`, {}, true);
    setPack(data);
    setStatus(data.student.counselling_status);
    if (role === 'super_admin') {
      const s = await apiJson<any[]>('/api/admin-staff', {}, true);
      setStaff(s.filter((x) => x.is_active));
    }
    // Clear chat notifications since admin is viewing this student
    apiJson('/api/notifications', { method: 'PUT', body: JSON.stringify({ mark_chat: true }) }, true).catch(() => {});
  }, [id, role]);

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [load]);

  useEffect(() => {
    if (!pack?.student?.id) return;
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(async () => {
      try {
        const msgs = await apiJson<any>(`/api/admin-messages?student_id=${pack.student.id}`, {}, true);
        if (!msgs.error) {
          setPack((prev: any) => prev ? { ...prev, messages: msgs } : prev);
        }
      } catch {
        // ignore polling errors
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [pack?.student?.id]);

  if (err) return <ErrorBox msg={err} />;
  if (!pack) return <Loader />;

  const st = pack.student;

  const addNote = async () => {
    if (!note.trim()) {
      setErr('Please enter a note before saving.');
      return;
    }
    setBusy(true);
    try {
      await apiJson('/api/admin-notes', { method: 'POST', body: JSON.stringify({ student_id: st.id, note }) }, true);
      setNote('');
      setToast('Note saved');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendMsg = async () => {
    if (!msg.trim()) {
      setErr('Please enter a message before sending.');
      return;
    }
    setBusy(true);
    try {
      await apiJson('/api/admin-messages', { method: 'POST', body: JSON.stringify({ student_id: st.id, message: msg }) }, true);
      setMsg('');
      setToast('Message sent');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const schedule = async () => {
    if (!followDate) {
      setErr('Please select a date for the follow-up.');
      return;
    }
    const due_at = `${followDate}T${followTime || '10:00'}:00`;
    setBusy(true);
    try {
      await apiJson(
        '/api/admin-followups',
        { method: 'POST', body: JSON.stringify({ student_id: st.id, due_at, note: followNote }) },
        true
      );
      setFollowNote('');
      setFollowDate('');
      setFollowTime('10:00');
      setToast('Follow-up scheduled');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadDoc = async () => {
    if (!docTitle.trim()) {
      setErr('Please provide a title for the document.');
      return;
    }
    setBusy(true);
    try {
      await apiJson(
        '/api/admin-documents',
        { method: 'POST', body: JSON.stringify({ student_id: st.id, title: docTitle, file_url: docUrl }) },
        true
      );
      setDocTitle('');
      setDocUrl('');
      setToast('Document recorded');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteDoc = async (docId: number) => {
    if (!confirm('Delete this document record?')) return;
    setBusy(true);
    try {
      await apiJson(`/api/admin-documents?id=${docId}`, { method: 'DELETE' }, true);
      setToast('Document deleted');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveStatus = async () => {
    setBusy(true);
    try {
      await apiJson('/api/admin-students', { method: 'PUT', body: JSON.stringify({ id: st.id, counselling_status: status, contacted: true }) }, true);
      setToast('Status updated');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const assign = async (staffId: string) => {
    setBusy(true);
    try {
      await apiJson(
        '/api/admin-students',
        {
          method: 'PUT',
          body: JSON.stringify({ id: st.id, assigned_to: staffId || null, counselling_status: staffId ? 'assigned' : 'unassigned' }),
        },
        true
      );
      setToast(staffId ? 'Assigned — student & counsellor notified' : 'Unassigned');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 min-h-[150px]">
        <img src="/images/mbbswala/india-counsel-meet.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/95 via-[#0B1220]/85 to-[#0B1220]/35" />
        <div className="relative z-10 p-5 md:p-6 flex flex-wrap items-end justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <img
              src={st.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.full_name || st.email || 'S')}&background=FF7A1A&color=fff&bold=true&size=128`}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-orange-400/50 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(st.full_name || st.email || 'S')}&background=FF7A1A&color=fff&bold=true&size=128`;
              }}
            />
            <div>
              <Link to="/admin/students" className="text-xs font-bold text-orange-300 hover:underline">
                ← Back to students
              </Link>
              <h2 className="text-2xl font-black tracking-tight mt-1">{st.full_name}</h2>
              <p className="text-sm text-white/70 font-medium">
                {st.email} · {st.phone} · AIR {st.neet_rank?.toLocaleString() || '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(st.counselling_status)}>{st.counselling_status}</Badge>
            <Badge tone={statusTone(st.payment_status)}>{st.payment_status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-semibold admin-muted">
        <p className="admin-card rounded-xl border px-3 py-2">① Update status after each call</p>
        <p className="admin-card rounded-xl border px-3 py-2">② Save notes for the next counsellor</p>
        <p className="admin-card rounded-xl border px-3 py-2">③ Message the family when needed</p>
        <p className="admin-card rounded-xl border px-3 py-2">④ Schedule a follow-up so nothing slips</p>
      </div>

      <Toast text={toast} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Info label="Package" value={st.purchased_counselling || st.purchased_course || '—'} />
        <Info label="Amount" value={money(st.payment_amount)} />
        <Info label="State / Category" value={`${st.state || '—'} · ${st.category || '—'}`} />
        <Info label="Exam" value={st.exam || 'NEET UG'} />
      </div>

      {role === 'super_admin' && (
        <Card className="p-5 flex flex-wrap items-center gap-3">
          <UserPlus className="w-5 h-5 text-orange-500" />
          <p className="font-bold text-sm mr-auto">Assign counsellor</p>
          <select
            value={st.assigned_to || ''}
            onChange={(e) => assign(e.target.value)}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold min-w-[200px]"
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.user_id} value={s.user_id}>
                {s.name}
              </option>
            ))}
          </select>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" /> Update status
          </h3>
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold flex-1 min-w-[160px]">
              {['assigned', 'in_progress', 'follow_up', 'completed', 'admitted', 'new', 'unassigned'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="button" disabled={busy} onClick={saveStatus} className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold disabled:opacity-60">
              Save + mark contacted
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" /> Internal notes
          </h3>
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {(pack.notes || []).map((n: any) => (
              <div key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{n.note}</p>
                <p className="text-[11px] text-slate-400 mt-1">{fmt(n.created_at)}</p>
              </div>
            ))}
            {!(pack.notes || []).length && <p className="text-sm text-slate-400">No notes yet</p>}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add counselling note…" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-2" />
          <button type="button" disabled={busy} onClick={addNote} className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-bold">
            Save note
          </button>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-500" /> Messages
          </h3>
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {(pack.messages || []).map((m: any) => (
              <div key={m.id} className={`rounded-xl p-3 text-sm ${m.sender === 'student' ? 'bg-sky-50' : 'bg-orange-50'}`}>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">{m.sender === 'student' ? 'Student' : 'Counsellor'}</p>
                <p className="font-medium">{m.message}</p>
              </div>
            ))}
            {!(pack.messages || []).length && <p className="text-sm text-slate-400">No messages</p>}
          </div>
          <div className="flex gap-2">
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message…" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button type="button" disabled={busy} onClick={sendMsg} className="px-3 py-2 rounded-xl bg-slate-900 text-white">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-3">Schedule follow-up</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={followDate}
              onChange={(e) => setFollowDate(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={followTime}
              onChange={(e) => setFollowTime(e.target.value)}
              defaultValue="10:00"
              className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <input value={followNote} onChange={(e) => setFollowNote(e.target.value)} placeholder="Follow-up note" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-2" />
          <button type="button" disabled={busy} onClick={schedule} className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold">
            Schedule
          </button>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documents
          </h3>
          <div className="space-y-2 mb-3">
            {(pack.documents || []).map((d: any) => (
              <div key={d.id} className="rounded-xl bg-slate-50 p-3 text-sm flex items-center justify-between gap-2">
                <span className="font-semibold flex-1">{d.file_name || d.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {d.file_url ? (
                    <a href={d.file_url} target="_blank" rel="noreferrer" className="text-orange-600 font-bold text-xs hover:underline">
                      Open
                    </a>
                  ) : (
                    <span className="text-slate-300 text-xs">No file</span>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteDoc(d.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold transition-colors"
                    title="Delete document"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {!(pack.documents || []).length && <p className="text-sm text-slate-400">No documents</p>}
          </div>
          <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Document title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-2" />
          <input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="File URL (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-2" />
          <button type="button" disabled={busy} onClick={uploadDoc} className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold">
            Upload record
          </button>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-3">Purchase history</h3>
          <div className="space-y-2">
            {(pack.purchases || []).map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm border-b border-slate-100 py-2">
                <span className="font-semibold">
                  {p.item_name} <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                </span>
                <span className="font-bold">
                  {money(p.amount)} · {fmt(p.created_at)}
                </span>
              </div>
            ))}
            {!(pack.purchases || []).length && <p className="text-sm text-slate-400">No purchases linked</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card rounded-2xl border p-3.5 shadow-sm">
      <p className="text-[10px] uppercase font-bold admin-muted tracking-wider">{label}</p>
      <p className="font-bold admin-text mt-0.5">{value}</p>
    </div>
  );
}

/* ───────── Activity / Sessions / Followups ───────── */

export function AdminActivityPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiJson<any[]>('/api/admin-activity?limit=150', {}, true)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" /> Activity log
        </h2>
        <p className="text-sm text-slate-500 font-medium">Audit trail of actions taken by counsellors & admins</p>
      </div>
      <Card className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                {(r.staff_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900">{r.action}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{r.staff_name || 'Staff'}</span>
                  {r.staff_email && <span>({r.staff_email})</span>}
                  {r.role && (
                    <Badge tone={r.role === 'super_admin' ? 'purple' : 'orange'}>
                      {r.role === 'super_admin' ? 'Super Admin' : 'Counsellor'}
                    </Badge>
                  )}
                  {r.entity_type && <span className="text-slate-400">· {r.entity_type} {r.entity_id || ''}</span>}
                </div>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500">{fmt(r.created_at)}</p>
          </div>
        ))}
        {!rows.length && <p className="p-8 text-center text-slate-400">No activity recorded yet</p>}
      </Card>
    </div>
  );
}

function formatSessionDuration(seconds: number | null | undefined, isLive: boolean, loginAt?: string) {
  let sec = seconds;
  if (isLive && loginAt) {
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(loginAt).getTime()) / 1000));
    sec = elapsed;
  }

  if (sec == null || isNaN(sec) || sec < 0) {
    return isLive ? 'Active now' : '—';
  }

  const mins = Math.floor(sec / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hrs > 0) {
    return `${hrs}h ${remMins}m${isLive ? ' (Active)' : ''}`;
  }
  if (mins > 0) {
    return `${mins} min${mins > 1 ? 's' : ''}${isLive ? ' (Active)' : ''}`;
  }
  return isLive ? 'Active (< 1m)' : '< 1 min';
}

function formatSessionDate(d?: string | null) {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d;
  }
}

export function AdminSessionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [, setTick] = useState(0);

  const fetchSessions = useCallback((silent = false) => {
    if (!silent) setRefreshing(true);
    return apiJson<any[]>('/api/admin-sessions?limit=100', {}, true)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchSessions();
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 30000);
    // Dynamic timer tick every 10s to update active durations
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [fetchSessions]);

  if (loading) return <Loader />;

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (r.user_name || '').toLowerCase().includes(q) ||
      (r.user_email || '').toLowerCase().includes(q) ||
      (r.role || '').toLowerCase().includes(q) ||
      (r.ip || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <History className="w-5 h-5 text-orange-500" /> Login history & Active sessions
          </h2>
          <p className="text-sm text-slate-500 font-medium">Monitor staff sign-ins, session duration, and live online presence</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, email, or role…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <button
            onClick={() => fetchSessions()}
            disabled={refreshing}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="text-left p-3.5 font-bold">Staff Member</th>
              <th className="text-left p-3.5 font-bold">Status</th>
              <th className="text-left p-3.5 font-bold">Login Time</th>
              <th className="text-left p-3.5 font-bold">Logout Time</th>
              <th className="text-left p-3.5 font-bold">Session Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const isOnline = r.presence === 'online' || !r.logout_at;
              return (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {(r.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 leading-tight">{r.user_name || 'Staff User'}</p>
                          <Badge tone={r.role === 'super_admin' ? 'purple' : 'orange'}>
                            {r.role === 'super_admin' ? 'Super Admin' : 'Counsellor'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{r.user_email || String(r.user_id).slice(0, 12)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {isOnline ? 'Active Now' : 'Signed Out'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">{formatSessionDate(r.login_at)}</td>
                  <td className="p-3.5 text-slate-500">
                    {r.logout_at ? formatSessionDate(r.logout_at) : <span className="text-emerald-600 font-semibold flex items-center gap-1">In progress</span>}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {formatSessionDuration(r.duration_seconds, isOnline, r.login_at)}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No sessions found matching your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminFollowupsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const load = () => {
    setLoading(true);
    apiJson<any[]>('/api/admin-followups?status=pending', {}, true)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const done = async (id: number) => {
    await apiJson('/api/admin-followups', { method: 'PUT', body: JSON.stringify({ id, status: 'done' }) }, true);
    load();
  };

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[1.5rem] min-h-[120px] border border-white/10">
        <img src="/images/mbbswala/india-family-consult.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/92 to-[#0B1220]/40" />
        <div className="relative z-10 p-6 text-white">
          <h2 className="text-xl font-black">Pending follow-ups</h2>
          <p className="text-sm text-white/70 font-medium mt-1">Call or message, then mark Done so your desk stays clean.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((f) => (
          <Card key={f.id} className="p-4 flex items-center justify-between gap-3">
            <button type="button" className="text-left flex-1 min-w-0" onClick={() => navigate(`/admin/students/${f.student_id}`)}>
              <div className="flex items-center gap-3">
                <img
                  src={
                    f.student?.full_name || f.student?.email
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(f.student.full_name || f.student.email)}&background=FF7A1A&color=fff&bold=true&size=128`
                      : `/images/mbbswala/avatar-${(Number(f.student_id) % 5) + 1}.jpg`
                  }
                  alt=""
                  className="w-11 h-11 rounded-xl object-cover"
                />
                <div>
                  <p className="font-bold">{f.student?.full_name || `Student #${f.student_id}`}</p>
                  <p className="text-sm text-slate-500">{f.note || 'Open profile for full context'}</p>
                  <p className="text-xs text-orange-600 font-bold mt-1">Due {fmt(f.due_at)}</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => done(f.id)} className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0">
              Mark done
            </button>
          </Card>
        ))}
        {!rows.length && <p className="text-slate-400 font-medium col-span-2 text-center py-10">All caught up 🎉</p>}
      </div>
    </div>
  );
}

/* ───────── Purchases (premium assign flow) ───────── */

export function AdminPurchasesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    neet_rank: '',
    state: 'Madhya Pradesh',
    item_name: 'NEET UG Counselling',
    amount: '2499',
    assigned_staff_id: '',
    item_type: 'counselling',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        apiJson<any[]>('/api/admin-purchases', {}, true),
        apiJson<any[]>('/api/admin-staff', {}, true).catch(() => []),
      ]);
      setRows(p);
      setStaff((s || []).filter((x: any) => x.is_active !== false && x.role !== 'super_admin'));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => rows.filter((r) => r.status === 'paid').reduce((s, r) => s + (r.amount || 0), 0), [rows]);
  const unassigned = useMemo(() => rows.filter((r) => r.status === 'paid' && !r.assigned_staff_id).length, [rows]);

  const assign = async (purchaseId: number, staffId: string) => {
    setBusy(true);
    setErr('');
    try {
      await apiJson(
        '/api/admin-purchases',
        { method: 'PUT', body: JSON.stringify({ id: purchaseId, assigned_staff_id: staffId || null }) },
        true
      );
      setToast(staffId ? 'Counsellor assigned — both student & sub-admin notified' : 'Assignment cleared');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const createPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await apiJson(
        '/api/admin-purchases',
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            neet_rank: form.neet_rank ? Number(form.neet_rank) : null,
            state: form.state,
            item_name: form.item_name,
            item_type: form.item_type,
            amount: Number(form.amount) || 0,
            assigned_staff_id: form.assigned_staff_id || null,
            status: 'paid',
          }),
        },
        true
      );
      setToast(
        form.assigned_staff_id
          ? 'Purchase recorded & counsellor assigned — dual notifications sent'
          : 'Purchase recorded. Assign a counsellor when ready.'
      );
      setShowForm(false);
      setForm({
        full_name: '',
        email: '',
        phone: '',
        neet_rank: '',
        state: 'Madhya Pradesh',
        item_name: 'NEET UG Counselling',
        amount: '2499',
        assigned_staff_id: '',
        item_type: 'counselling',
      });
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" /> Purchases & assignments
          </h2>
          <p className="text-sm text-slate-500 font-medium">When you assign a counsellor, both student and sub-admin get a notification</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-bold shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-4 h-4" /> Record purchase
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Paid revenue" value={money(total)} icon={IndianRupee} tone="green" />
        <Stat label="Total purchases" value={rows.length} icon={ShoppingBag} tone="blue" />
        <Stat label="Awaiting assign" value={unassigned} icon={UserPlus} tone="rose" hint="Paid but no counsellor" />
      </div>

      <Toast text={toast} />
      {err && <Toast text={err} tone="err" />}

      {showForm && (
        <Card className="p-5 md:p-6">
          <h3 className="font-black mb-4">New paid package</h3>
          <form onSubmit={createPurchase} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ['full_name', 'Student name', 'text'],
              ['email', 'Email', 'email'],
              ['phone', 'Phone', 'tel'],
              ['neet_rank', 'NEET rank', 'number'],
              ['state', 'State', 'text'],
              ['item_name', 'Package name', 'text'],
              ['amount', 'Amount (₹)', 'number'],
            ].map(([k, label, type]) => (
              <label key={k} className="text-sm font-semibold text-slate-600">
                {label}
                <input
                  required={k === 'full_name' || k === 'item_name'}
                  type={type}
                  value={(form as any)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium"
                />
              </label>
            ))}
            <label className="text-sm font-semibold text-slate-600">
              Package type
              <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium">
                <option value="counselling">Counselling</option>
                <option value="course">Course</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Assign counsellor now
              <select
                value={form.assigned_staff_id}
                onChange={(e) => setForm({ ...form, assigned_staff_id: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium"
              >
                <option value="">Assign later</option>
                {staff.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
              <button disabled={busy} type="submit" className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm disabled:opacity-60">
                {busy ? 'Saving…' : 'Save purchase'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full border border-slate-200 font-bold text-sm">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left p-4 font-bold">Package</th>
                <th className="text-left p-4 font-bold">Student</th>
                <th className="text-left p-4 font-bold">Amount</th>
                <th className="text-left p-4 font-bold">Status</th>
                <th className="text-left p-4 font-bold">Counsellor</th>
                <th className="text-left p-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{r.item_name}</p>
                    <p className="text-[11px] text-slate-400 font-medium capitalize">{r.item_type}</p>
                  </td>
                  <td className="p-4">
                    {r.student ? (
                      <>
                        <Link to={`/admin/students/${r.student.id}`} className="font-bold text-slate-900 hover:text-orange-600">
                          {r.student.full_name}
                        </Link>
                        <p className="text-xs text-slate-400">
                          AIR {r.student.neet_rank?.toLocaleString() || '—'} · {r.student.state || '—'}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-400">#{r.student_id || '—'}</span>
                    )}
                  </td>
                  <td className="p-4 font-black text-slate-900">{money(r.amount)}</td>
                  <td className="p-4">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="p-4">
                    <select
                      disabled={busy || r.status !== 'paid'}
                      value={r.assigned_staff_id || ''}
                      onChange={(e) => assign(r.id, e.target.value)}
                      className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold max-w-[180px] bg-white disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((s) => (
                        <option key={s.user_id} value={s.user_id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {r.counsellor && (
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {r.counsellor.presence === 'online' ? '● Online' : '○ Offline'}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-500">{fmt(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-10 text-center text-slate-400 font-medium">No purchases yet</p>}
        </div>
      </Card>
    </div>
  );
}

export function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  const load = () => {
    setLoading(true);
    apiJson<any[]>('/api/admin-withdrawals', {}, true)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (id: number, status: 'approved' | 'rejected') => {
    await apiJson(
      '/api/admin-withdrawals',
      { method: 'PUT', body: JSON.stringify({ id, status, remarks: remarks[id] || '' }) },
      true
    );
    load();
  };

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Withdrawal requests</h2>
      <div className="space-y-3">
        {rows.map((w) => (
          <Card key={w.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">
                  {money(w.amount)} · {w.method}
                </p>
                <p className="text-xs text-slate-500 font-mono">{w.account_detail}</p>
                <p className="text-xs text-slate-400 mt-1">
                  User {String(w.user_id).slice(0, 10)}… · {fmt(w.created_at)}
                </p>
              </div>
              <Badge tone={statusTone(w.status)}>{w.status}</Badge>
            </div>
            {w.status === 'pending' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={remarks[w.id] || ''}
                  onChange={(e) => setRemarks({ ...remarks, [w.id]: e.target.value })}
                  placeholder="Remarks"
                  className="flex-1 min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => act(w.id, 'approved')} className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-bold">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button type="button" onClick={() => act(w.id, 'rejected')} className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-rose-500 text-white text-sm font-bold">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </Card>
        ))}
        {!rows.length && <p className="text-slate-400 font-medium text-center py-12">No withdrawal requests</p>}
      </div>
    </div>
  );
}

interface SentNotificationItem {
  id: string;
  ids: string[];
  title: string;
  body: string;
  description: string;
  type: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string | null;
  recipient_count: number;
  is_broadcast: boolean;
}

export function AdminNotifyPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'students' | 'staff' | 'all'>('students');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // History state
  const [items, setItems] = useState<SentNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAudience, setFilterAudience] = useState<'all' | 'broadcast' | 'targeted'>('all');

  // Edit state
  const [editingItem, setEditingItem] = useState<{
    id: string;
    ids: string[];
    title: string;
    body: string;
    type: string;
  } | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiJson<SentNotificationItem[]>('/api/admin-notify', {}, true);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // Fallback empty
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await apiJson<{ sent: number }>('/api/admin-notify', {
        method: 'POST',
        body: JSON.stringify({ title, body, audience }),
      }, true);
      setMsg(`Notification broadcasted to ${res.sent} recipient(s) successfully!`);
      setTitle('');
      setBody('');
      fetchNotifications();
    } catch (e: any) {
      setErr(e.message || 'Failed to send notification');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim() || !editingItem.body.trim()) return;
    setEditBusy(true);
    try {
      await apiJson('/api/admin-notify', {
        method: 'PUT',
        body: JSON.stringify({
          ids: editingItem.ids,
          title: editingItem.title.trim(),
          body: editingItem.body.trim(),
          type: editingItem.type,
        }),
      }, true);

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id || (item.ids && item.ids.some((id) => editingItem.ids.includes(id)))
            ? {
                ...item,
                title: editingItem.title.trim(),
                body: editingItem.body.trim(),
                description: editingItem.body.trim(),
                type: editingItem.type,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      setEditingItem(null);
      setMsg('Notification updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update notification');
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async (item: SentNotificationItem) => {
    const isBroadcast = item.recipient_count > 1 || item.is_broadcast;
    const confirmMsg = isBroadcast
      ? `Delete broadcast notification "${item.title}" for all ${item.recipient_count} recipients?`
      : `Delete notification "${item.title}"?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(item.id);
    try {
      await apiJson('/api/admin-notify', {
        method: 'DELETE',
        body: JSON.stringify({ ids: item.ids && item.ids.length ? item.ids : [item.id] }),
      }, true);

      setItems((prev) => prev.filter((n) => n.id !== item.id));
      setMsg('Notification removed permanently.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.body.toLowerCase().includes(search.toLowerCase());

      const matchAudience =
        filterAudience === 'all' ||
        (filterAudience === 'broadcast' && (item.is_broadcast || item.recipient_count > 1)) ||
        (filterAudience === 'targeted' && !item.is_broadcast && item.recipient_count === 1);

      return matchSearch && matchAudience;
    });
  }, [items, search, filterAudience]);

  const formatTime = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today at ${timeStr}`;
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20 mb-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Super Admin Control
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-orange-500" /> Notifications & Broadcasts
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Send in-app alerts, review sent history, and edit or delete notifications for students & counsellors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {msg && <Toast text={msg} />}
      {err && <Toast text={err} tone="err" />}

      {/* Main Grid: Send Form (Left) & Sent History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Broadcast Notification */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 md:p-6 space-y-4 border-orange-500/20 bg-gradient-to-b from-orange-500/[0.02] to-transparent shadow-xl shadow-orange-500/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-500" /> Push New Notification
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                In-App
              </span>
            </div>

            <form onSubmit={send} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                >
                  <option value="students">🎓 All Students (Portal Accounts)</option>
                  <option value="staff">👔 Active Counsellors & Sub-Admins</option>
                  <option value="all">🌍 Everyone (Students + Counsellors)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Title / Subject
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">{title.length}/100</span>
                </div>
                <input
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  placeholder="e.g. Choice filling starts tomorrow"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Message Body
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">{body.length} chars</span>
                </div>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition leading-relaxed"
                  placeholder="Type clear, actionable announcement for recipients…"
                />
              </div>

              {/* Live Preview Card */}
              {(title || body) && (
                <div className="p-3.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-orange-600 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Preview
                  </div>
                  <p className="text-xs font-bold text-slate-800">{title || 'Your Title'}</p>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {body || 'Your message will appear here…'}
                  </p>
                </div>
              )}

              <button
                disabled={busy || !title.trim() || !body.trim()}
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-black text-sm disabled:opacity-50 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Notification
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* Right Section: Sent Notifications List & Manage Controls */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 md:p-6 space-y-4 shadow-xl shadow-slate-900/5">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-500" /> Sent Notifications ({items.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Edit messages or delete notifications anytime
                </p>
              </div>

              {/* Audience Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterAudience('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    filterAudience === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAudience('broadcast')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    filterAudience === 'broadcast'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Broadcasts
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sent notifications by keyword…"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <p className="text-xs font-bold">Loading sent notifications…</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">No sent notifications found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {search ? 'Try adjusting your search query' : 'Broadcast your first alert using the form on the left.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:shadow-md transition-all space-y-2.5 relative group"
                  >
                    {/* Top Meta Bar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            item.recipient_count > 1 || item.is_broadcast
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.recipient_count > 1
                            ? `📢 ${item.recipient_count} Recipients`
                            : item.is_broadcast
                            ? '📢 Broadcast'
                            : '👤 Single Alert'}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(item.created_at)}
                        </span>
                        {item.updated_at && item.updated_at !== item.created_at && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            Edited
                          </span>
                        )}
                      </div>

                      {/* Action Buttons: Edit & Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            setEditingItem({
                              id: item.id,
                              ids: item.ids && item.ids.length ? item.ids : [item.id],
                              title: item.title,
                              body: item.body || item.description,
                              type: item.type || 'info',
                            })
                          }
                          title="Edit Notification"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition text-xs flex items-center gap-1 font-bold"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                          <span className="hidden sm:inline text-[11px]">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          title="Delete Notification"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition text-xs flex items-center gap-1 font-bold disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span className="hidden sm:inline text-[11px]">Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap line-clamp-4 font-normal">
                        {item.body || item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Notification Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Notification</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Updates will sync across all {editingItem.ids.length} recipient(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notification Title
                </label>
                <input
                  required
                  value={editingItem.title}
                  onChange={(e) =>
                    setEditingItem((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Message Body
                </label>
                <textarea
                  required
                  rows={4}
                  value={editingItem.body}
                  onChange={(e) =>
                    setEditingItem((prev) => (prev ? { ...prev, body: e.target.value } : null))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editBusy || !editingItem.title.trim() || !editingItem.body.trim()}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50 transition"
                >
                  {editBusy ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const STATIC_NEWS = [
  {
    title: 'NEET UG 2026 — Exam Date Announced',
    description: 'National Testing Agency (NTA) has officially announced the NEET UG 2026 exam date. Students should begin preparations immediately.',
    link: 'https://nta.ac.in',
    source_id: 'NTA Official',
    pubDate: new Date().toISOString(),
    image_url: null,
  },
  {
    title: 'All India Counselling — Registration Open',
    description: 'MCC has opened registrations for the All India Quota MBBS/BDS counselling. Eligible candidates can apply on the official MCC portal.',
    link: 'https://mcc.nic.in',
    source_id: 'MCC',
    pubDate: new Date().toISOString(),
    image_url: null,
  },
  {
    title: 'AIIMS Delhi — MBBS 2025 Closing Ranks Published',
    description: 'AIIMS Delhi has published closing ranks for MBBS admissions. General category closing rank stood at 52 in Round 1.',
    link: 'https://aiimsexams.ac.in',
    source_id: 'AIIMS',
    pubDate: new Date().toISOString(),
    image_url: null,
  },
  {
    title: 'MP State Quota Counselling Schedule Released',
    description: 'DMET Madhya Pradesh has released the state counselling schedule for MBBS/BDS seats under 85% state quota.',
    link: 'https://dme.mponline.gov.in',
    source_id: 'DMET MP',
    pubDate: new Date().toISOString(),
    image_url: null,
  },
  {
    title: 'NEET PG 2025 Results Declared by NBE',
    description: 'National Board of Examinations (NBE) has declared NEET PG 2025 results. Candidates can check their scorecards on the official NBE portal.',
    link: 'https://nbe.edu.in',
    source_id: 'NBE',
    pubDate: new Date().toISOString(),
    image_url: null,
  },
  {
    title: 'NEET UG 2025 — Stray Vacancy Round Details',
    description: 'MCC has announced stray vacancy round schedule for NEET UG 2025. Candidates who have not been allotted a seat can participate.',
    link: 'https://mcc.nic.in',
    source_id: 'MCC',
    pubDate: new Date().toISOString(),
    image_url: null,
  },
];

export function AdminAlertsPage() {
  const [items, setItems] = useState<
    Array<{ id: number; title: string; body: string; read: boolean; created_at: string }>
  >([]);
  const [news, setNews] = useState<any[]>(STATIC_NEWS);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await apiJson('/api/notifications', {}, true));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const MEDICAL_KEYWORDS = [
    'neet', 'mbbs', 'bds', 'ayush', 'ayurveda', 'mcc', 'medical college',
    'medical admission', 'medical seat', 'counselling', 'counseling',
    'medical entrance', 'pg medical', 'ug medical', 'medical cutoff',
    'aiims', 'medical student', 'medical exam', 'medical university',
    'state quota', 'all india quota', 'merit list', 'mbbs seat', 'neet ug',
    'neet pg', 'dnb', 'md ms admission', 'medical counselling'
  ];

  const loadNews = useCallback(async () => {
    try {
      const res = await fetch('https://newsdata.io/api/1/news?apikey=pub_8e7f2b8fe15c4a13bb444bf2e8b0c195&q=NEET%20OR%20MBBS%20OR%20%22medical%20college%22&country=in&language=en&category=health');
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const filtered = data.results.filter((item: any) => {
          const text = ((item.title || '') + ' ' + (item.description || '')).toLowerCase();
          return MEDICAL_KEYWORDS.some(kw => text.includes(kw));
        });
        if (filtered.length > 0) setNews(filtered.slice(0, 10));
      }
    } catch (e) {
      console.error('News fetch failed, showing static news', e);
    }
  }, []);

  useEffect(() => {
    load();
    loadNews();
  }, [load, loadNews]);

  const mark = async (id: number) => {
    try {
      const updated = await apiJson<{ id: number; read: boolean }>(
        '/api/notifications',
        { method: 'PUT', body: JSON.stringify({ id, read: true }) },
        true
      );
      setItems((prev) => prev.map((n) => (n.id === updated.id ? { ...n, read: true } : n)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const markAll = async () => {
    try {
      await apiJson('/api/notifications', { method: 'PUT', body: JSON.stringify({ mark_all: true }) }, true);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Personal Notifications */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" /> Alerts
              </h2>
              <p className="text-sm text-slate-500 font-medium">Your personal notifications</p>
            </div>
            <button type="button" onClick={markAll} className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold hover:bg-slate-50 transition bg-white text-slate-700">
              Mark all read
            </button>
          </div>
          {error && <Toast text={error} tone="err" />}
          {loading ? (
            <div className="h-32 rounded-2xl animate-pulse bg-slate-100" />
          ) : items.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="font-bold">No new alerts</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && mark(n.id)}
                  className={`w-full rounded-2xl border p-4 flex gap-3 text-left transition-all bg-white ${
                    !n.read ? 'ring-1 ring-orange-500/30 bg-orange-50/50' : 'hover:-translate-y-0.5'
                  }`}
                >
                  <Bell className={`w-5 h-5 shrink-0 mt-0.5 ${!n.read ? 'text-orange-600' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${!n.read ? 'font-extrabold text-orange-600' : 'font-bold text-slate-800'}`}>{n.title}</p>
                    <p className="text-xs mt-1 leading-relaxed text-slate-500 font-medium">{n.body}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${!n.read ? 'text-orange-600' : 'text-slate-400'}`}>
                    {n.read ? 'Read' : 'New'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Medical News */}
        <div>
          <div className="mb-5">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-orange-500" /> Live Updates
            </h2>
            <p className="text-sm text-slate-500 font-medium">Latest NEET & Medical Education News</p>
          </div>
          {newsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse bg-slate-100" />)}
            </div>
          ) : news.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              <Newspaper className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="font-bold">No news available right now</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl border bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex gap-4 items-start">
                    {item.image_url && (
                      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 hidden sm:block">
                        <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                          {item.source_id || 'News'}
                        </span>
                        {item.pubDate && (
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm leading-tight mb-1 text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs line-clamp-2 text-slate-500 font-medium">
                        {item.description || item.content}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AdminPaymentRequestsPage — UPI Payment Requests Management
   ═══════════════════════════════════════════════════════════════════════════ */

const PLAN_OPTIONS = [
  { slug: 'basic', name: 'BASIC Plan', price: 99 },
  { slug: 'neet-ug-pro', name: 'NEET UG Counselling Pro', price: 900 },
  { slug: 'ultimate', name: 'Ultimate Medical Master Bundle', price: 1100 },
];

export function AdminPaymentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Record<number, string>>({});
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [newRequestAlert, setNewRequestAlert] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await apiJson<any[]>('/api/upi-payment', {}, true);
      setRequests(data || []);
    } catch (err: any) {
      console.error('Failed to load payment requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Supabase Realtime subscription for new payment requests
  useEffect(() => {
    loadRequests();

    // Subscribe to real-time inserts on upi_payment_requests
    let realtimeChannel: any = null;
    const setupRealtime = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL || 'https://hbzzamezfhzsdupdhcin.supabase.co',
          import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5D517PLNdF92v3Q1s6Dp_w_WaZtsrPo'
        );

        realtimeChannel = supabase
          .channel('upi-payment-requests-admin')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'upi_payment_requests',
          }, (payload) => {
            console.log('[Admin] New payment request received:', payload.new);
            setNewRequestAlert(true);
            loadRequests();
            // Play notification sound
            playAdminSound();
            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification('💰 New Payment Request — MBBSWala', {
                body: `₹${payload.new.amount} for ${payload.new.plan_name}. UTR: ${payload.new.utr_number}`,
                icon: '/images/mbbswala/logo.png',
                requireInteraction: true,
              });
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'upi_payment_requests',
          }, () => {
            loadRequests();
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime setup failed:', err);
      }
    };

    setupRealtime();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      realtimeChannel?.unsubscribe?.();
    };
  }, []);

  function playAdminSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Play a distinctive 3-tone alert
      const times = [0, 0.2, 0.4];
      const freqs = [880, 1100, 880];
      times.forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freqs[i];
        gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.18);
      });
    } catch (e) {}
  }

  const handleApprove = async (req: any) => {
    const planSlug = selectedPlan[req.id] || req.plan_slug;
    const planObj = PLAN_OPTIONS.find(p => p.slug === planSlug) || PLAN_OPTIONS[0];

    if (!confirm(`Approve ₹${req.amount} payment for ${planObj.name}?\n\nThis will activate premium for: ${req.profile?.email || req.user_id}`)) return;

    setProcessingId(req.id);
    try {
      await apiJson('/api/upi-payment', {
        method: 'POST',
        body: JSON.stringify({
          action: 'approve',
          request_id: req.id,
          plan_slug: planSlug,
          plan_name: planObj.name,
          admin_note: adminNote[req.id] || '',
        }),
      }, true);
      await loadRequests();
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: any) => {
    const note = adminNote[req.id] || prompt('Reason for rejection (optional):') || 'Payment could not be verified.';
    if (!confirm(`Reject this payment request from ${req.profile?.email || req.user_id}?`)) return;

    setProcessingId(req.id);
    try {
      await apiJson('/api/upi-payment', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject',
          request_id: req.id,
          admin_note: note,
        }),
      }, true);
      await loadRequests();
    } catch (err: any) {
      alert('Rejection failed: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-orange-500" />
            UPI Payment Requests
            {pendingCount > 0 && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-black animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Audit UPI payments from students (Payments are automatically approved upon completion)</p>
        </div>
        <button
          onClick={loadRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm hover:bg-orange-100 transition-colors border border-orange-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* New Request Alert */}
      {newRequestAlert && (
        <div className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-300 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-orange-600 shrink-0" />
            <span className="text-sm font-bold text-orange-700">New payment request received!</span>
          </div>
          <button
            onClick={() => { setFilter('pending'); setNewRequestAlert(false); }}
            className="text-xs font-bold text-orange-600 hover:text-orange-800 underline"
          >
            View Now
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize border ${
              filter === f
                ? f === 'pending' ? 'bg-amber-500 text-white border-amber-500'
                  : f === 'approved' ? 'bg-emerald-500 text-white border-emerald-500'
                  : f === 'rejected' ? 'bg-red-500 text-white border-red-500'
                  : 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {f} {f !== 'all' && `(${requests.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setScreenshotModal(null)}
              className="absolute -top-10 right-0 text-white font-bold flex items-center gap-1 hover:text-red-400"
            >
              <X className="w-5 h-5" /> Close
            </button>
            <img src={screenshotModal} alt="Payment screenshot" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Requests Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No {filter === 'all' ? '' : filter} payment requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => (
            <Card key={req.id} className="p-5">
              <div className="flex flex-col gap-4">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-700'
                        : req.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status === 'approved' && req.approved_by === 'auto_approved' ? '⚡ Auto-Approved' : req.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(req.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="font-black text-slate-800 text-base">
                      {req.profile?.full_name || 'Unknown Student'}
                    </p>
                    <p className="text-xs text-slate-500">{req.profile?.email || req.user_id}</p>
                    {req.profile?.phone && <p className="text-xs text-slate-500">📱 {req.profile.phone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-800">₹{Number(req.amount).toLocaleString('en-IN')}</p>
                    <p className="text-xs font-bold text-slate-500">{req.plan_name}</p>
                  </div>
                </div>

                {/* UTR & Screenshot */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium mb-0.5">UTR / Reference Number</p>
                    <p className="font-mono font-black text-slate-800 text-sm">{req.utr_number}</p>
                  </div>
                  {req.screenshot_url && (
                    <button
                      onClick={() => setScreenshotModal(req.screenshot_url)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 font-bold text-sm hover:bg-blue-100 transition-colors shrink-0"
                    >
                      <FileText className="w-4 h-4" />
                      View Screenshot
                    </button>
                  )}
                </div>

                {/* Admin note */}
                {req.status !== 'pending' && req.admin_note && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="font-bold">Admin Note:</span> {req.admin_note}
                  </div>
                )}

                {/* Approve/Reject Controls (only for pending) */}
                {req.status === 'pending' && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                    {/* Plan Override */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Allot Package
                      </label>
                      <select
                        value={selectedPlan[req.id] || req.plan_slug}
                        onChange={e => setSelectedPlan(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      >
                        {PLAN_OPTIONS.map(p => (
                          <option key={p.slug} value={p.slug}>
                            {p.name} — ₹{p.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Admin Note */}
                    <input
                      type="text"
                      placeholder="Admin note (optional)"
                      value={adminNote[req.id] || ''}
                      onChange={e => setAdminNote(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={processingId === req.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Approve & Activate
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        disabled={processingId === req.id}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 border border-red-200 font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
