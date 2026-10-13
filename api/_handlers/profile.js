import supabaseGlobal from './db-client.js';
import { setCors, requireUser } from './_auth.js';
import { ensureWallet } from './wallet-helpers.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://hbzzamezfhzsdupdhcin.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5D517PLNdF92v3Q1s6Dp_w_WaZtsrPo';

function getUserClient(token) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return supabaseGlobal;
  if (!token) return supabaseGlobal;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

function computeProfileCompletion(p) {
  const fields = [
    'full_name',
    'phone',
    'category',
    'state',
    'domicile',
    'date_of_birth',
    'gender',
    'neet_rank',
    'neet_score',
    'pcb_percentage',
    'twelfth_percentage',
    'passing_year',
    'preferred_course',
    'college_preference',
  ];
  let filled = 0;
  for (const f of fields) {
    if (p[f] !== null && p[f] !== undefined && String(p[f]).trim() !== '') {
      filled++;
    }
  }
  return Math.round((filled / fields.length) * 100);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const supabase = getUserClient(token);

    if (req.method === 'GET') {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch error, checking by email:', error.message);
        const byEmail = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email || '')
          .maybeSingle();
        if (byEmail.data) data = byEmail.data;
      }
      
      // Ensure wallet exists & get referral code
      let wallet = null;
      try {
        wallet = await ensureWallet(user);
      } catch (wErr) {
        console.warn('Wallet error in profile GET:', wErr.message);
      }

      if (!data) {
        const seed = {
          id: user.id,
          email: user.email || '',
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            (user.email ? user.email.split('@')[0] : 'Student'),
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            (user.email ? user.email.split('@')[0] : 'Student'),
          phone: user.user_metadata?.phone || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          category: 'General',
          domicile: 'Madhya Pradesh',
          exam: 'NEET UG',
          role: 'student',
          is_premium: false,
          subscription_status: 'free',
          subscription_plan: 'Free Plan',
          payment_status: 'Unpaid',
          referral_code: wallet?.referral_code || '',
          profile_completed: false,
          onboarding_done: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const inserted = await supabase
          .from('profiles')
          .upsert(seed, { onConflict: 'id' })
          .select()
          .single();

        if (inserted.error) {
          console.error('Profile insert fallback error:', inserted.error);
          data = seed;
        } else {
          data = inserted.data;
        }
      }

      // Sync referral_code from wallet if missing in profile
      if (!data.referral_code && wallet?.referral_code) {
        data.referral_code = wallet.referral_code;
        await supabase
          .from('profiles')
          .update({ referral_code: wallet.referral_code })
          .eq('id', user.id);
      }

      // ── Strict & Accurate Premium Verification across all linked tables ──
      let isPremium = false;
      let planName = 'Free Plan';
      let subStatus = 'free';
      let endDate = null;

      // 1. Check subscriptions table with strict 'active' status and non-expired date
      try {
        let subQuery = supabase
          .from('subscriptions')
          .select('*')
          .eq('status', 'active')
          .eq('user_id', user.id);

        const { data: subData } = await subQuery.order('id', { ascending: false }).limit(1);

        if (subData && subData.length > 0) {
          const sub = subData[0];
          const isExpired = sub.end_date && new Date(sub.end_date).getTime() < Date.now();
          if (!isExpired) {
            isPremium = true;
            subStatus = 'active';
            planName = sub.plan_name || sub.plan_slug || 'NEET Counselling Pro';
            endDate = sub.end_date || null;
          }
        }
      } catch (subErr) {
        console.warn('Subscriptions check error:', subErr.message);
      }

      // 2. Check payments table strictly for captured / paid transactions
      if (!isPremium) {
        try {
          let payQuery = supabase
            .from('payments')
            .select('*')
            .in('status', ['captured', 'success', 'paid', 'complete'])
            .eq('user_id', user.id);

          const { data: payData } = await payQuery.order('id', { ascending: false }).limit(1);

          if (payData && payData.length > 0) {
            const pay = payData[0];
            isPremium = true;
            subStatus = 'active';
            planName = pay.meta?.plan_name || pay.plan_slug || 'NEET Counselling Pro';
          }
        } catch (payErr) {
          console.warn('Payments check error:', payErr.message);
        }
      }

      // 3. Check student_counselling table strictly for confirmed payment
      if (!isPremium) {
        try {
          let scQuery = supabase
            .from('student_counselling')
            .select('*')
            .in('payment_status', ['paid', 'Paid', 'PAID']);

          if (user.email && user.email.trim()) {
            scQuery = scQuery.or(`user_id.eq.${user.id},email.eq.${user.email.trim()}`);
          } else {
            scQuery = scQuery.eq('user_id', user.id);
          }

          const { data: scData } = await scQuery.limit(1);

          if (scData && scData.length > 0) {
            isPremium = true;
            subStatus = 'active';
            planName = scData[0].purchased_counselling || scData[0].purchased_course || 'NEET Counselling Pro';
          }
        } catch (scErr) {
          console.warn('Student counselling payment check error:', scErr.message);
        }
      }

      // 4. Fallback to profile table flags if explicitly active and not expired
      if (!isPremium && Boolean(data?.is_premium) && data?.subscription_status === 'active') {
        const isExpired = data.premium_end_date && new Date(data.premium_end_date).getTime() < Date.now();
        if (!isExpired) {
          isPremium = true;
          subStatus = 'active';
          planName = (data.subscription_plan && data.subscription_plan !== 'Free Plan') ? data.subscription_plan : 'NEET Counselling Pro';
          endDate = data.premium_end_date || null;
        }
      }

      // Sync and enforce state
      if (isPremium) {
        data.is_premium = true;
        data.subscription_status = 'active';
        data.subscription_plan = planName;
        data.payment_status = 'Paid';
        data.premium_end_date = endDate;
        
        // Auto-heal profile row in DB
        try {
          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              subscription_status: 'active',
              subscription_plan: planName,
              payment_status: 'Paid',
              premium_end_date: endDate,
            })
            .eq('id', user.id);
        } catch (healErr) {
          console.warn('Profile auto-heal update warning:', healErr.message);
        }
      } else {
        data.is_premium = false;
        data.subscription_status = 'free';
        data.subscription_plan = 'Free Plan';
        data.payment_status = data.payment_status === 'Paid' ? 'Unpaid' : (data.payment_status || 'Unpaid');
      }

      // Attach wallet summary & saved colleges count
      const savedCount = await supabase
        .from('saved_colleges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then((r) => r.count || 0)
        .catch(() => 0);

      const bookmarksCount = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then((r) => r.count || 0)
        .catch(() => 0);

      const completion = computeProfileCompletion(data);

      return res.status(200).json({
        ...data,
        is_premium: Boolean(isPremium),
        subscription_status: isPremium ? 'active' : (data.subscription_status || 'free'),
        subscription_plan: isPremium ? (data.subscription_plan || planName) : 'Free Plan',
        payment_status: isPremium ? 'Paid' : (data.payment_status || 'Unpaid'),
        premium_end_date: data.premium_end_date || endDate,
        full_name: data.full_name || data.name || user.user_metadata?.full_name || '',
        name: data.name || data.full_name || '',
        email: data.email || user.email || '',
        neet_rank: data.neet_rank ?? (data.rank ? Number(data.rank) : null),
        neet_score: data.neet_score ?? (data.score ?? (data.marks ? Number(data.marks) : null)),
        wallet: wallet
          ? {
              balance: wallet.balance || 0,
              lifetime_earned: wallet.lifetime_earned || 0,
              lifetime_withdrawn: wallet.lifetime_withdrawn || 0,
              referral_code: wallet.referral_code,
            }
          : null,
        saved_colleges_count: savedCount || 0,
        bookmarks_count: bookmarksCount || 0,
        completion_percentage: completion,
        profile_completed: Boolean(data.profile_completed || data.onboarding_done || user.user_metadata?.profile_completed || user.user_metadata?.onboarding_done),
        onboarding_done: Boolean(data.profile_completed || data.onboarding_done || user.user_metadata?.profile_completed || user.user_metadata?.onboarding_done),
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = req.body || {};

      const patch = {
        // Personal
        full_name: body.full_name !== undefined ? String(body.full_name).trim() : undefined,
        name: body.full_name !== undefined ? String(body.full_name).trim() : (body.name !== undefined ? String(body.name).trim() : undefined),
        phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
        annual_income: body.annual_income !== undefined ? (body.annual_income === null ? null : Number(body.annual_income)) : undefined,
        avatar_url: body.avatar_url !== undefined ? String(body.avatar_url).trim() : undefined,
        date_of_birth: body.date_of_birth !== undefined ? body.date_of_birth || null : undefined,
        gender: body.gender !== undefined ? String(body.gender) : undefined,
        state: body.state !== undefined ? String(body.state).trim() : undefined,
        district: body.district !== undefined ? String(body.district).trim() : undefined,
        category: body.category !== undefined ? String(body.category) : undefined,
        sub_category: body.sub_category !== undefined ? String(body.sub_category).trim() : undefined,
        domicile: body.domicile !== undefined ? String(body.domicile).trim() : undefined,
        domicile_state: body.domicile_state !== undefined ? String(body.domicile_state).trim() : (body.domicile !== undefined ? String(body.domicile).trim() : undefined),

        // Academic
        exam: body.exam !== undefined ? String(body.exam) : undefined,
        neet_roll_number: body.neet_roll_number !== undefined ? String(body.neet_roll_number).trim() : undefined,
        neet_rank: body.neet_rank != null && body.neet_rank !== '' ? Number(body.neet_rank) : (body.rank != null && body.rank !== '' ? Number(body.rank) : undefined),
        rank: body.neet_rank != null && body.neet_rank !== '' ? String(body.neet_rank) : (body.rank != null && body.rank !== '' ? String(body.rank) : undefined),
        neet_score: body.neet_score != null && body.neet_score !== '' ? Number(body.neet_score) : (body.score != null && body.score !== '' ? Number(body.score) : (body.marks != null && body.marks !== '' ? Number(body.marks) : undefined)),
        score: body.neet_score != null && body.neet_score !== '' ? Number(body.neet_score) : (body.score != null && body.score !== '' ? Number(body.score) : (body.marks != null && body.marks !== '' ? Number(body.marks) : undefined)),
        marks: body.neet_score != null && body.neet_score !== '' ? String(body.neet_score) : (body.marks != null && body.marks !== '' ? String(body.marks) : undefined),
        neet_percentile: body.neet_percentile != null && body.neet_percentile !== '' ? Number(body.neet_percentile) : (body.percentile != null && body.percentile !== '' ? Number(body.percentile) : undefined),
        percentile: body.neet_percentile != null && body.neet_percentile !== '' ? Number(body.neet_percentile) : (body.percentile != null && body.percentile !== '' ? Number(body.percentile) : undefined),
        pcb_percentage: body.pcb_percentage != null && body.pcb_percentage !== '' ? Number(body.pcb_percentage) : undefined,
        twelfth_percentage: body.twelfth_percentage != null && body.twelfth_percentage !== '' ? Number(body.twelfth_percentage) : undefined,
        passing_year: body.passing_year != null && body.passing_year !== '' ? Number(body.passing_year) : undefined,
        attempt_number: body.attempt_number != null && body.attempt_number !== '' ? Number(body.attempt_number) : undefined,
        predicted_rank_min: body.predicted_rank_min != null && body.predicted_rank_min !== '' ? Number(body.predicted_rank_min) : undefined,
        predicted_rank_max: body.predicted_rank_max != null && body.predicted_rank_max !== '' ? Number(body.predicted_rank_max) : undefined,

        // Reservation
        pwd_status: body.pwd_status !== undefined ? Boolean(body.pwd_status) : undefined,
        ews_status: body.ews_status !== undefined ? Boolean(body.ews_status) : undefined,
        defence_quota: body.defence_quota !== undefined ? Boolean(body.defence_quota) : undefined,
        freedom_fighter_quota: body.freedom_fighter_quota !== undefined ? Boolean(body.freedom_fighter_quota) : undefined,
        has_sambal_card: body.has_sambal_card !== undefined ? Boolean(body.has_sambal_card) : undefined,
        studied_in_govt_school: body.studied_in_govt_school !== undefined ? Boolean(body.studied_in_govt_school) : undefined,
        minority_status: body.minority_status !== undefined ? String(body.minority_status).trim() : undefined,
        other_reservations: body.other_reservations !== undefined ? String(body.other_reservations).trim() : undefined,

        // Preferences
        preferred_states: body.preferred_states !== undefined ? body.preferred_states : undefined,
        preferred_course: body.preferred_course !== undefined ? String(body.preferred_course).trim() : undefined,
        college_preference: body.college_preference !== undefined ? String(body.college_preference) : undefined,
        tuition_budget: body.tuition_budget !== undefined ? String(body.tuition_budget).trim() : undefined,
        hostel_required: body.hostel_required !== undefined ? Boolean(body.hostel_required) : undefined,
        language_preference: body.language_preference !== undefined ? String(body.language_preference).trim() : undefined,

        // Onboarding
        profile_completed: body.profile_completed !== undefined ? Boolean(body.profile_completed) : undefined,
        onboarding_done: body.onboarding_done !== undefined ? Boolean(body.onboarding_done) : undefined,

        updated_at: new Date().toISOString(),
      };

      Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

      let upsertPayload = { id: user.id, email: user.email || '', ...patch };

      // ── Pre-emptively sync student_counselling to prevent duplicate key trigger errors ──
      // The DB trigger fires on profiles upsert and can fail if there's a user_id unique
      // constraint violation. We handle this sync here in code first so the trigger is a no-op.
      try {
        const { data: existingSc } = await supabase
          .from('student_counselling')
          .select('id')
          .or(`user_id.eq.${user.id},email.eq.${user.email || 'nonexistent@mbbswala.in'}`)
          .order('id', { ascending: true })
          .limit(1);

        if (existingSc && existingSc.length > 0) {
          // Update existing row — this will NOT cause a duplicate key
          await supabase
            .from('student_counselling')
            .update({
              user_id: user.id, // ensure user_id is set on the canonical row
              full_name: patch.full_name || undefined,
              email: user.email || undefined,
              phone: patch.phone || undefined,
              neet_rank: patch.neet_rank || undefined,
              score: patch.neet_score || undefined,
              state: patch.domicile || patch.domicile_state || patch.state || undefined,
              category: patch.category || undefined,
              exam: patch.exam || undefined,
              purchased_course: patch.preferred_course || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSc[0].id);
        }
        // If no row exists, the trigger will create one — that's fine
      } catch (scPreErr) {
        console.warn('Pre-sync student_counselling warning:', scPreErr?.message);
      }

      // ── Perform profile upsert ──
      let { data, error } = await supabase
        .from('profiles')
        .upsert(upsertPayload, { onConflict: 'id' })
        .select()
        .single();

      // ── Retry loop: strip unknown columns ──
      let maxRetries = 10;
      while (error && (error.code === 'PGRST204' || error.code === '42703') && maxRetries > 0) {
        const colMatch = error.message?.match(/Could not find the '(\w+)' column/) || error.message?.match(/column ["'](\w+)["'] of relation/);
        if (colMatch && colMatch[1]) {
          const badCol = colMatch[1];
          console.warn('Stripping unknown column from profile update:', badCol);
          delete upsertPayload[badCol];
          delete patch[badCol];
          const retry = await supabase
            .from('profiles')
            .upsert(upsertPayload, { onConflict: 'id' })
            .select()
            .single();
          data = retry.data;
          error = retry.error;
          maxRetries--;
        } else {
          break;
        }
      }

      // ── Handle RLS 'no rows returned' error silently ──
      if (error && error.code === 'PGRST116') {
        console.warn('Profile upsert succeeded but RLS prevented SELECT. Continuing.');
        data = upsertPayload;
        error = null;
      }

      // ── Handle Unique Violation: duplicate key (likely from trigger) ──
      // Fallback: retry using plain UPDATE instead of UPSERT to avoid INSERT path in trigger
      if (error && error.code === '23505') {
        console.warn('Duplicate key on upsert (trigger conflict). Retrying with plain UPDATE:', error.message);
        const updatePayload = { ...upsertPayload };
        delete updatePayload.id;
        if (!updatePayload.email) delete updatePayload.email;
        const updateRetry = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.id)
          .select()
          .single();
        data = updateRetry.data || upsertPayload;
        error = updateRetry.error;
        if (error && error.code === 'PGRST116') { data = upsertPayload; error = null; }
      }

      if (error) {
        console.error('profile PUT error:', error);
        return res.status(400).json({ error: error.message || 'Failed to update profile database record.' });
      }

      // Automatically sync to student_counselling table (for Admin CRM & counsellors)
      try {
        const studentRow = {
          user_id: user.id,
          full_name: data.full_name || data.name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Student'),
          email: user.email || data.email || '',
          phone: data.phone || user.user_metadata?.phone || '',
          neet_rank: data.neet_rank ?? (data.rank ? Number(data.rank) : null),
          score: data.neet_score ?? (data.score ?? (data.marks ? Number(data.marks) : null)),
          state: data.domicile_state || data.state || data.domicile || '',
          category: data.category || 'General',
          exam: data.exam || 'NEET UG',
          purchased_course: data.preferred_course || 'MBBS',
          updated_at: new Date().toISOString(),
        };

        let existingId = null;
        const { data: existingList } = await supabase
          .from('student_counselling')
          .select('id')
          .or(`user_id.eq.${user.id},email.eq.${user.email || 'nonexistent@mbbswala.in'}`)
          .limit(1);

        if (existingList && existingList.length > 0) {
          existingId = existingList[0].id;
        }

        if (existingId) {
          await supabase
            .from('student_counselling')
            .update(studentRow)
            .eq('id', existingId);
        } else {
          await supabase
            .from('student_counselling')
            .insert({
              ...studentRow,
              counselling_status: 'new',
              payment_status: data.payment_status || 'pending',
              created_at: new Date().toISOString(),
            });
        }
      } catch (sErr) {
        console.warn('Sync to student_counselling info:', sErr?.message);
      }

      // Automatically sync to students table (if exists)
      try {
        await supabase.from('students').upsert(
          {
            id: user.id,
            user_id: user.id,
            name: data.full_name || data.name || '',
            full_name: data.full_name || data.name || '',
            email: user.email || data.email || '',
            phone: data.phone || '',
            neet_score: data.neet_score ?? data.score,
            score: data.neet_score ?? data.score,
            neet_rank: data.neet_rank,
            category: data.category || 'General',
            domicile_state: data.domicile_state || data.domicile || 'Madhya Pradesh',
            state: data.state || '',
            preferred_course: data.preferred_course || 'MBBS',
            profile_completed: Boolean(data.profile_completed || data.onboarding_done),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (stErr) {
        /* students table fallback */
      }

      const completion = computeProfileCompletion(data || {});
      return res.status(200).json({ 
        ...data, 
        completion_percentage: completion,
        profile_completed: patch.profile_completed ?? data.profile_completed,
        onboarding_done: patch.onboarding_done ?? data.onboarding_done
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile API error:', err);
    res.status(500).json({ error: err.message });
  }
}
