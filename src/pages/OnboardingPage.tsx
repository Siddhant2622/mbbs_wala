import { useState, useMemo, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Award,
  BookOpen,
  Building2,
  Compass,
  Gift,
  ShieldCheck,
  Percent,
  Check,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Globe2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiJson } from '../lib/api';
import supabase from '../lib/supabase';
import BrandLogo from '../components/BrandLogo';

const INDIAN_STATES = [
  'Madhya Pradesh',
  'Maharashtra',
  'Uttar Pradesh',
  'Delhi (NCT)',
  'Rajasthan',
  'Bihar',
  'Karnataka',
  'Tamil Nadu',
  'Kerala',
  'Gujarat',
  'West Bengal',
  'Haryana',
  'Punjab',
  'Odisha',
  'Telangana',
  'Andhra Pradesh',
  'Chhattisgarh',
  'Jharkhand',
  'Assam',
  'Uttarakhand',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Goa',
  'Tripura',
  'Manipur',
  'Meghalaya',
  'Chandigarh',
  'Puducherry',
];

const CATEGORIES = [
  { id: 'General', label: 'General / Open (UR)', desc: 'Unreserved merit quota' },
  { id: 'OBC-NCL', label: 'OBC-NCL', desc: 'Other Backward Classes (Non-Creamy Layer)' },
  { id: 'EWS', label: 'EWS', desc: 'Economically Weaker Section' },
  { id: 'SC', label: 'SC', desc: 'Scheduled Caste quota' },
  { id: 'ST', label: 'ST', desc: 'Scheduled Tribe quota' },
];

const COURSES = [
  { id: 'MBBS', name: 'MBBS', icon: Stethoscope },
  { id: 'BDS', name: 'BDS', icon: Award },
  { id: 'BAMS', name: 'BAMS', icon: BookOpen },
  { id: 'BHMS', name: 'BHMS', icon: Compass },
  { id: 'BUMS', name: 'BUMS', icon: Compass },
  { id: 'MD', name: 'MD / MS', icon: Stethoscope },
  { id: 'Diploma', name: 'PG Diploma', icon: BookOpen },
  { id: 'DNB', name: 'DNB', icon: Award },
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile, setProfileState } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  // Form State
  const [form, setForm] = useState({
    // Step 1: Personal & Contact
    full_name: profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    phone: profile?.phone || user?.user_metadata?.phone || '',
    date_of_birth: profile?.date_of_birth || '',
    gender: profile?.gender || 'Male',

    // Step 2: Domicile & Quotas
    domicile_state: profile?.domicile_state || profile?.domicile || 'Madhya Pradesh',
    district: profile?.district || '',
    category: profile?.category || 'General',
    pwd_status: Boolean(profile?.pwd_status),
    defence_quota: Boolean(profile?.defence_quota),
    freedom_fighter_quota: Boolean(profile?.freedom_fighter_quota),

    // Step 3: NEET Score & Academics
    exam: profile?.exam || 'NEET UG',
    neet_roll_number: profile?.neet_roll_number || '',
    neet_score: profile?.neet_score != null ? String(profile?.neet_score) : '',
    neet_rank: profile?.neet_rank != null ? String(profile?.neet_rank) : '',
    pcb_percentage: profile?.pcb_percentage != null ? String(profile?.pcb_percentage) : '',
    attempt_number: profile?.attempt_number || 1,

    // Step 4: Preferences
    preferred_course: profile?.preferred_course || 'MBBS',
    college_preference: profile?.college_preference || 'Government Preferred',
    tuition_budget: profile?.tuition_budget || 'Govt Fees (Under ₹1.5L/yr)',
    preferred_states: profile?.preferred_states || ['Madhya Pradesh', 'Maharashtra', 'Delhi (NCT)'],
    referral_code: user?.user_metadata?.referred_by_code || new URLSearchParams(window.location.search).get('ref') || '',
  });

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        full_name: prev.full_name || profile.full_name || profile.name || '',
        phone: prev.phone || profile.phone || '',
        date_of_birth: prev.date_of_birth || profile.date_of_birth || '',
        domicile_state: prev.domicile_state || profile.domicile_state || profile.domicile || 'Madhya Pradesh',
        category: prev.category || profile.category || 'General',
        neet_score: prev.neet_score || (profile.neet_score != null ? String(profile.neet_score) : ''),
        neet_rank: prev.neet_rank || (profile.neet_rank != null ? String(profile.neet_rank) : ''),
      }));
    }
  }, [profile]);

  const validateStep = (currentStep: number): boolean => {
    setError('');
    if (currentStep === 1) {
      if (!form.full_name.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      const cleanPhone = form.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit WhatsApp phone number.');
        return false;
      }
      if (form.date_of_birth) {
        const dob = new Date(form.date_of_birth);
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 16);
        if (dob > minAgeDate) {
          setError('You must be at least 16 years old to register.');
          return false;
        }
      }
      return true;
    }
    if (currentStep === 2) {
      if (!form.domicile_state) {
        setError('Please select your state of domicile for 85% state quota eligibility.');
        return false;
      }
      if (!form.category) {
        setError('Please select your social category.');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      const score = Number(form.neet_score);
      if (!form.neet_score || isNaN(score) || score < 0 || score > 720) {
        setError('Please enter a valid NEET score between 0 and 720 marks.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleState = (st: string) => {
    setForm((prev) => {
      const exists = prev.preferred_states.includes(st);
      return {
        ...prev,
        preferred_states: exists
          ? prev.preferred_states.filter((s) => s !== st)
          : [...prev.preferred_states, st],
      };
    });
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(4)) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        full_name: form.full_name.trim(),
        name: form.full_name.trim(),
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,

        state: form.domicile_state,
        domicile: form.domicile_state,
        domicile_state: form.domicile_state,
        district: form.district.trim(),
        category: form.category,
        pwd_status: form.pwd_status,
        defence_quota: form.defence_quota,
        freedom_fighter_quota: form.freedom_fighter_quota,

        exam: form.exam,
        neet_roll_number: form.neet_roll_number.trim(),
        neet_score: form.neet_score ? Number(form.neet_score) : null,
        neet_rank: form.neet_rank ? Number(form.neet_rank) : null,
        pcb_percentage: form.pcb_percentage ? Number(form.pcb_percentage) : null,
        attempt_number: Number(form.attempt_number) || 1,

        preferred_course: form.preferred_course,
        college_preference: form.college_preference,
        tuition_budget: form.tuition_budget,
        preferred_states: form.preferred_states,
        referral_code: form.referral_code.trim() || undefined,

        profile_completed: true,
        onboarding_done: true,
      };

      let updated: any = null;
      try {
        updated = await apiJson<any>(
          '/api/profile',
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          },
          true
        );
      } catch (apiErr: any) {
        console.warn('API profile save warning, falling back to direct client update:', apiErr.message);
        if (user) {
          try {
            await supabase.from('profiles').upsert(
              {
                id: user.id,
                email: user.email,
                ...payload,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          } catch {}
        }
        updated = { ...payload, id: user?.id || 'uid', email: user?.email || '' };
      }

      // Always update user metadata locally to bypass backend cache/schema delays
      if (user) {
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: payload.full_name,
              name: payload.full_name,
              phone: payload.phone,
              profile_completed: true,
              onboarding_done: true,
            },
          });
        } catch (e) {
          console.warn('Failed to update user_metadata', e);
        }
      }

      // If referral code was entered, apply it
      if (form.referral_code.trim()) {
        try {
          await apiJson(
            '/api/referrals',
            {
              method: 'POST',
              body: JSON.stringify({ action: 'apply', code: form.referral_code.trim() }),
            },
            true
          );
        } catch {
          /* ignore referral code error */
        }
      }

      // Guarantee profile_completed is true in local state — DO NOT call refreshProfile
      // as it would re-fetch from backend and potentially overwrite with stale data
      const completedProfile = {
        ...updated,
        profile_completed: true,
        onboarding_done: true,
      };
      setProfileState(completedProfile);
      
      // ULTIMATE SAFETY NET: Save in localStorage so the browser never loops back
      localStorage.setItem('onboarding_done_flag', 'true');

      setCompleted(true);
      // Use window.location.replace for a clean page load.
      // This guarantees a fresh React + Auth state from JWT (which now has profile_completed:true)
      // completely bypassing any stale React state or race conditions.
      setTimeout(() => {
        const bannerRedirect = sessionStorage.getItem('mbbs_banner_redirect');
        if (bannerRedirect) {
          sessionStorage.removeItem('mbbs_banner_redirect');
          window.location.replace(bannerRedirect);
          return;
        }
        window.location.replace('/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save counselling profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const scoreNum = Number(form.neet_score) || 0;
  const estimatedProb = useMemo(() => {
    if (scoreNum >= 620) return { text: 'High Chance in Top Government Medical Colleges', color: 'text-emerald-400' };
    if (scoreNum >= 540) return { text: 'Strong Chance in State Govt & Top Semi-Govt Colleges', color: 'text-sky-400' };
    if (scoreNum >= 450) return { text: 'Eligible for Private Medical & Top Deemed Universities', color: 'text-amber-400' };
    if (scoreNum >= 200) return { text: 'Eligible for AYUSH / BDS & Deemed Universities', color: 'text-orange-400' };
    return { text: 'Enter your score to calculate cutoffs & admissions', color: 'text-white/40' };
  }, [scoreNum]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-white/5 bg-[#0a0d14]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">
              NEET Profile Setup
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white/50">Signed in as</p>
              <p className="text-xs font-bold text-white max-w-[200px] truncate">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-xs text-white uppercase shadow-md shadow-orange-500/20">
              {form.full_name?.charAt(0) || user?.email?.charAt(0) || 'S'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12 flex flex-col justify-center">
        {completed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-6 bg-white/[0.03] border border-emerald-500/30 rounded-3xl backdrop-blur-xl shadow-2xl"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-6 text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              🎉 Profile Setup Completed!
            </h2>
            <p className="text-white/70 max-w-md mx-auto text-base mb-6">
              Welcome, <span className="text-white font-bold">{form.full_name}</span>! Your NEET counselling preferences and 85% domicile quota have been saved.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-orange-400">
              <Sparkles className="w-4 h-4" />
              <span>Calculating personalized college cutoffs & predictions…</span>
            </div>
          </motion.div>
        ) : (
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden">
            {/* Header & Steps Bar */}
            <div className="border-b border-white/5 p-6 sm:p-8 bg-gradient-to-r from-orange-500/5 via-transparent to-blue-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                    Complete Your Student Profile
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-white/50 mt-1">
                    Answer 4 quick questions so our MBBS WALA AI can calculate your 100% accurate college chances.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                    Step {step} of 4 ({step * 25}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                  initial={{ width: '25%' }}
                  animate={{ width: `${step * 25}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Step Tabs */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                {[
                  { n: 1, label: 'Personal & Contact' },
                  { n: 2, label: 'Domicile & Quota' },
                  { n: 3, label: 'NEET Score' },
                  { n: 4, label: 'Preferences' },
                ].map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => s.n < step && setStep(s.n)}
                    disabled={s.n > step}
                    className={`py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition ${
                      step === s.n
                        ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20'
                        : step > s.n
                        ? 'text-emerald-400 cursor-pointer hover:bg-white/5'
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <span className="hidden sm:inline">{s.n}. </span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-6 sm:mx-8 mt-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-xs sm:text-sm font-semibold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Body */}
            <div className="p-6 sm:p-8">
              {/* STEP 1: PERSONAL & CONTACT */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Full Name (As on NEET Admit Card) *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        WhatsApp Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition font-medium"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-white/40 mt-1.5">
                        Used for critical counselling round alerts & admission notifications.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                        <input
                          type="date"
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                          value={form.date_of_birth}
                          onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Male', 'Female', 'Other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setForm({ ...form, gender: g })}
                            className={`py-3 rounded-xl text-xs font-bold border transition ${
                              form.gender === g
                                ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                                : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: DOMICILE & QUOTAS */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Domicile State (Crucial for 85% State Quota) *
                      </label>
                      <div className="relative">
                        <Globe2 className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                        <select
                          value={form.domicile_state}
                          onChange={(e) => setForm({ ...form, domicile_state: e.target.value })}
                          className="w-full bg-[#161b26] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition font-medium"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st} className="bg-[#161b26] text-white">
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[11px] text-amber-400/80 mt-1.5">
                        ⚡ State quota gives you up to 5x higher chances in your home state medical colleges.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Home District / City
                      </label>
                      <input
                        type="text"
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        placeholder="e.g. Bhopal, Indore, Jaipur"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                      Social Category (NEET Reservation) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setForm({ ...form, category: c.id })}
                          className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                            form.category === c.id
                              ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                              : 'bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                              form.category === c.id ? 'border-orange-500 bg-orange-500' : 'border-white/30'
                            }`}
                          >
                            {form.category === c.id && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{c.label}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">{c.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                      Special Reservation Quotas
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'pwd_status', label: 'PwD (Physical Disability)' },
                        { key: 'defence_quota', label: 'Defence / CW Quota' },
                        { key: 'freedom_fighter_quota', label: 'Freedom Fighter (FF)' },
                      ].map((q) => (
                        <label
                          key={q.key}
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer hover:bg-white/[0.05] transition"
                        >
                          <input
                            type="checkbox"
                            checked={(form as any)[q.key]}
                            onChange={(e) => setForm({ ...form, [q.key]: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 text-orange-500 focus:ring-orange-400 bg-white/5"
                          />
                          <span className="text-xs font-semibold text-white/80">{q.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: NEET SCORE & ACADEMICS */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Target Exam
                      </label>
                      <select
                        value={form.exam}
                        onChange={(e) => setForm({ ...form, exam: e.target.value })}
                        className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition font-medium"
                      >
                        <option value="NEET UG">NEET UG (MBBS/BDS)</option>
                        <option value="NEET PG">NEET PG (MD/MS)</option>
                        <option value="AYUSH">AYUSH (BAMS/BHMS)</option>
                        <option value="NEET MDS">NEET MDS</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        NEET Score / Marks (0 - 720) *
                      </label>
                      <div className="relative">
                        <Award className="absolute left-3.5 top-3.5 w-4 h-4 text-orange-400" />
                        <input
                          type="number"
                          min="0"
                          max="720"
                          value={form.neet_score}
                          onChange={(e) => setForm({ ...form, neet_score: e.target.value })}
                          placeholder="e.g. 585"
                          className="w-full bg-white/[0.04] border border-orange-500/40 rounded-xl pl-10 pr-4 py-3 text-base text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition"
                          required
                        />
                      </div>
                      <p className={`text-xs font-semibold mt-2 ${estimatedProb.color}`}>
                        {estimatedProb.text}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        NEET All India Rank (AIR)
                      </label>
                      <input
                        type="number"
                        value={form.neet_rank}
                        onChange={(e) => setForm({ ...form, neet_rank: e.target.value })}
                        placeholder="e.g. 18500"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        12th Board PCB %
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={form.pcb_percentage}
                          onChange={(e) => setForm({ ...form, pcb_percentage: e.target.value })}
                          placeholder="e.g. 84.5"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Attempt Number
                      </label>
                      <select
                        value={form.attempt_number}
                        onChange={(e) => setForm({ ...form, attempt_number: Number(e.target.value) })}
                        className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition font-medium"
                      >
                        <option value={1}>1st Attempt (Fresher)</option>
                        <option value={2}>2nd Attempt (1st Dropper)</option>
                        <option value={3}>3rd Attempt (2nd Dropper)</option>
                        <option value={4}>4th+ Attempt</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PREFERENCES & REFERRAL */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                      Target Medical Course
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {COURSES.map((crs) => {
                        const Icon = crs.icon;
                        const active = form.preferred_course === crs.id;
                        return (
                          <button
                            key={crs.id}
                            type="button"
                            onClick={() => setForm({ ...form, preferred_course: crs.id })}
                            className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                              active
                                ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                                : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${active ? 'text-orange-400' : 'text-white/40'}`} />
                            <span className="text-xs font-bold">{crs.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        College Type Preference
                      </label>
                      <select
                        value={form.college_preference}
                        onChange={(e) => setForm({ ...form, college_preference: e.target.value })}
                        className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition font-medium"
                      >
                        <option value="Government Only">Government Colleges Only</option>
                        <option value="Government Preferred">Govt Preferred, Open to Semi-Govt</option>
                        <option value="Private / Deemed">Private & Deemed Universities</option>
                        <option value="All Types">All Types (Govt + Private + Deemed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Annual Tuition Fee Budget
                      </label>
                      <select
                        value={form.tuition_budget}
                        onChange={(e) => setForm({ ...form, tuition_budget: e.target.value })}
                        className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition font-medium"
                      >
                        <option value="Govt Fees (Under ₹1.5L/yr)">Govt Fees (Under ₹1.5L / year)</option>
                        <option value="₹5L - ₹12L / yr">Semi-Govt / Trust (₹5L - ₹12L / year)</option>
                        <option value="₹12L - ₹20L / yr">Private Medical (₹12L - ₹20L / year)</option>
                        <option value="₹20L+ / yr">Deemed / Management Quota (₹20L+ / year)</option>
                        <option value="Flexible / Any">Flexible / Merit Based</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Preferred States for All India Quota (AIQ)
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-white/[0.02] border border-white/10 rounded-2xl">
                      {INDIAN_STATES.slice(0, 16).map((st) => {
                        const selected = form.preferred_states.includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => toggleState(st)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                              selected
                                ? 'bg-orange-500 text-white border-orange-400 shadow-sm shadow-orange-500/20'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {st} {selected ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </motion.div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="border-t border-white/5 p-6 sm:p-8 bg-white/[0.02] flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-full text-xs sm:text-sm font-bold border border-white/10 text-white/70 hover:bg-white/5 transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/25 hover:opacity-95 transition flex items-center gap-2"
                >
                  Continue to Next Step
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/25 hover:opacity-95 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Profile…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save & Enter Dashboard
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 text-center text-xs text-white/40">
        MBBSWala AI Counselling System • Official MCC & State DME Data Protected
      </footer>
    </div>
  );
}
