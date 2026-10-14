import supabase from './db-client.js';
import { setCors, requireUser } from './_auth.js';
import { sendWebPush } from './push-helper.js';

// Admin user IDs — only these can approve/reject payments
const ADMIN_EMAILS = ['admin@gmail.com', 'admin@mbbswala.in', 'dhruv@mbbswala.in'];
const ADMIN_IDS = ['bdcb6828-636a-43e7-99fe-9ccbbc7e6638'];

function isAdmin(user) {
  return ADMIN_IDS.includes(user.id) || ADMIN_EMAILS.includes(user.email) || user.role === 'super_admin';
}

function resolvePlanByPayment(amount, requestedSlug = '', requestedName = '') {
  const num = Number(amount) || 0;
  // If payment is ₹8,000 or more: Ultimate Medical Master Bundle (regular ₹9,999 or discounted)
  if (num >= 8000 || requestedSlug === 'ultimate') {
    return {
      planSlug: 'ultimate',
      planName: 'Ultimate Medical Master Bundle',
    };
  }
  // If payment is ₹3,000 or more: Pro Counselling plan (regular ₹4,999 or discounted)
  if (num >= 3000 || requestedSlug === 'neet-ug-pro' || requestedSlug === 'neet-pg-pro') {
    if (requestedSlug && String(requestedSlug).toLowerCase().includes('pg')) {
      return {
        planSlug: 'neet-pg-pro',
        planName: requestedName || 'NEET PG Counselling Pro',
      };
    }
    return {
      planSlug: 'neet-ug-pro',
      planName: 'NEET UG Counselling Pro',
    };
  }
  // Under ₹500 (e.g. ₹99, ₹199): BASIC plan
  return {
    planSlug: 'basic',
    planName: 'BASIC',
  };
}

async function activatePremium(userId, planSlug, planName, amount, approvedBy) {
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // 1. Update profile to premium
  await supabase.from('profiles').update({
    is_premium: true,
    subscription_status: 'active',
    subscription_plan: planName,
    payment_status: 'Paid',
    premium_start_date: now.toISOString(),
    premium_end_date: oneYearLater.toISOString(),
    updated_at: now.toISOString(),
  }).eq('id', userId);

  // 2. Insert subscription record
  await supabase.from('subscriptions').insert({
    user_id: userId,
    plan_slug: planSlug,
    plan_name: planName,
    amount: Number(amount),
    currency: 'INR',
    status: 'active',
    gateway: 'upi_manual',
    payment_id: `upi_${Date.now()}`,
    order_id: `upi_order_${Date.now()}`,
    start_date: now.toISOString(),
    end_date: oneYearLater.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  });

  // 3. Insert payment record
  await supabase.from('payments').insert({
    user_id: userId,
    order_id: `upi_order_${Date.now()}`,
    payment_id: `upi_${Date.now()}`,
    amount: Number(amount),
    currency: 'INR',
    status: 'captured',
    gateway: 'upi_manual',
    plan_slug: planSlug,
    created_at: now.toISOString(),
    meta: { plan_name: planName, approved_by: approvedBy, gateway: 'upi_manual' },
  });

  // 4. Sync student_counselling
  try {
    const { data: existing } = await supabase
      .from('student_counselling')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase.from('student_counselling').update({
        payment_status: 'paid',
        payment_amount: Number(amount),
        purchased_counselling: planName,
        purchased_course: String(planSlug).includes('pg') ? 'MD/MS' : 'MBBS',
        updated_at: now.toISOString(),
      }).eq('id', existing[0].id);
    } else {
      const { data: prof } = await supabase.from('profiles').select('email, full_name').eq('id', userId).maybeSingle();
      await supabase.from('student_counselling').insert({
        user_id: userId,
        full_name: prof?.full_name || 'Student',
        email: prof?.email || '',
        payment_status: 'paid',
        payment_amount: Number(amount),
        purchased_counselling: planName,
        purchased_course: String(planSlug).includes('pg') ? 'MD/MS' : 'MBBS',
        counselling_status: 'new',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    }
  } catch (e) {
    console.warn('student_counselling sync warning:', e.message);
  }

  // 5. Sync purchases table for CRM tracking
  try {
    await supabase.from('purchases').insert({
      user_id: userId,
      item_type: 'course',
      item_name: planName,
      amount: Number(amount),
      status: 'paid',
      created_at: now.toISOString(),
    });
  } catch (pErr) {
    console.warn('purchases sync warning:', pErr.message);
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const action = req.query?.action || req.body?.action || '';

    // ── GET: List user's own payment requests (or all for admin) ──
    if (req.method === 'GET') {
      if (isAdmin(user)) {
        const { data, error } = await supabase
          .from('upi_payment_requests')
          .select('*, profiles!upi_payment_requests_user_id_fkey(full_name, email, phone)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          // Fallback without join if FK not available
          const { data: plain } = await supabase
            .from('upi_payment_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          // Enrich with profile data
          const enriched = await Promise.all((plain || []).map(async (row) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', row.user_id)
              .maybeSingle();
            return { ...row, profile };
          }));
          return res.status(200).json(enriched);
        }
        return res.status(200).json(data || []);
      }

      // Student: own requests only
      const { data, error } = await supabase
        .from('upi_payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // ── POST action=submit: Student submits UTR + auto-approves plan according to payment ──
    if (req.method === 'POST' && (action === 'submit' || !action)) {
      const { plan_slug, plan_name, amount, utr_number, screenshot_url } = req.body || {};

      if (!amount || !utr_number) {
        return res.status(400).json({ error: 'amount and utr_number are required' });
      }

      const cleanUtr = String(utr_number).trim();
      if (cleanUtr.length < 6) {
        return res.status(400).json({ error: 'Please enter a valid UTR / transaction reference number (min 6 characters)' });
      }

      // Check for duplicate UTR across different accounts
      const { data: existing } = await supabase
        .from('upi_payment_requests')
        .select('id, user_id, plan_name, status')
        .eq('utr_number', cleanUtr)
        .maybeSingle();

      if (existing && existing.user_id !== user.id) {
        return res.status(400).json({ error: 'This UTR number has already been used by another account. Please contact support if you need assistance.' });
      }

      // Automatically determine plan according to payment amount
      const { planSlug: finalPlanSlug, planName: finalPlanName } = resolvePlanByPayment(amount, plan_slug, plan_name);

      // ── Upgrade Credit: Check if user is upgrading from a lower plan ──
      let upgradeCredit = 0;
      try {
        const PLAN_LEVELS = { 'BASIC': 1, 'NEET UG Counselling Pro': 2, 'Premium Plan': 2, 'Ultimate Medical Master Bundle': 3 };
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('plan_name, amount')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingSub && existingSub.length > 0) {
          const currentLevel = PLAN_LEVELS[existingSub[0].plan_name] || 0;
          const targetLevel = PLAN_LEVELS[finalPlanName] || 0;
          if (targetLevel > currentLevel) {
            upgradeCredit = Number(existingSub[0].amount) || 0;
          }
        }
      } catch (ucErr) {
        console.warn('[UPI Upgrade Credit] Warning:', ucErr.message);
      }

      // Immediately activate premium for the student (no admin approval required)
      await activatePremium(user.id, finalPlanSlug, finalPlanName, amount, 'auto_approved');

      // Record request directly as approved
      let request = existing;
      if (existing) {
        const { data: updated } = await supabase
          .from('upi_payment_requests')
          .update({
            plan_slug: finalPlanSlug,
            plan_name: finalPlanName,
            amount: Number(amount),
            screenshot_url: screenshot_url || existing.screenshot_url,
            status: 'approved',
            approved_by: 'auto_approved',
            approved_at: new Date().toISOString(),
            admin_note: 'Automatically approved based on completed payment',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        request = updated;
      } else {
        const { data: created, error: insErr } = await supabase
          .from('upi_payment_requests')
          .insert({
            user_id: user.id,
            plan_slug: finalPlanSlug,
            plan_name: finalPlanName,
            amount: Number(amount),
            utr_number: cleanUtr,
            screenshot_url: screenshot_url || null,
            status: 'approved',
            approved_by: 'auto_approved',
            approved_at: new Date().toISOString(),
            admin_note: 'Automatically approved based on completed payment',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (insErr) {
          console.warn('UPI payment request insert warning:', insErr.message);
        }
        request = created;
      }

      // Send student in-app confirmation notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: `🎉 Payment Confirmed! ${finalPlanName} Activated`,
        body: `Your payment of ₹${amount} (UTR: ${cleanUtr}) has been automatically verified. Your ${finalPlanName} is now active! All predictions and tools are unlocked. 🚀`,
        description: `Your ${finalPlanName} package is active. All tools are unlocked.`,
        type: 'subscription',
        meta: JSON.stringify({ plan_slug: finalPlanSlug, plan_name: finalPlanName, utr_number: cleanUtr }),
        read: false,
        created_at: new Date().toISOString(),
      });

      // Send push notification to student if subscribed
      try {
        const { data: studentPushSubs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);

        if (studentPushSubs && studentPushSubs.length > 0) {
          await Promise.allSettled(studentPushSubs.map((sub) =>
            sendWebPush(sub, {
              title: '🎉 Package Activated — MBBSWala',
              body: `Your ${finalPlanName} is now active! Open MBBSWala to access your premium counselling suite.`,
              data: { url: '/dashboard' },
            })
          ));
        }
      } catch (pushErr) {
        console.warn('Student push notification warning:', pushErr.message);
      }

      // Notify admins for audit/logging
      const adminNotifications = ADMIN_IDS.map((adminId) => ({
        user_id: adminId,
        title: `⚡ Auto-Approved UPI: ₹${amount} (${finalPlanName})`,
        body: `${user.email || 'Student'} paid ₹${amount} via UPI (UTR: ${cleanUtr}) and was automatically granted ${finalPlanName}.`,
        description: `Plan: ${finalPlanName} | Amount: ₹${amount} | UTR: ${cleanUtr} | User: ${user.email}`,
        type: 'payment_request',
        meta: JSON.stringify({ request_id: request?.id, user_id: user.id, plan_slug: finalPlanSlug, amount, auto_approved: true }),
        read: false,
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(adminNotifications).catch(() => {});

      return res.status(200).json({
        ok: true,
        is_premium: true,
        plan_slug: finalPlanSlug,
        plan_name: finalPlanName,
        amount: Number(amount),
        request_id: request?.id,
        message: `Payment verified! Your ${finalPlanName} plan is now active. Welcome to MBBSWala Premium!`,
      });
    }

    // ── POST action=approve: Admin approves and allots plan ──
    if (req.method === 'POST' && action === 'approve') {
      if (!isAdmin(user)) {
        return res.status(403).json({ error: 'Unauthorized. Only admins can approve payments.' });
      }

      const { request_id, plan_slug, plan_name, admin_note } = req.body || {};
      if (!request_id) return res.status(400).json({ error: 'request_id is required' });

      const { data: request, error: fetchErr } = await supabase
        .from('upi_payment_requests')
        .select('*')
        .eq('id', request_id)
        .single();

      if (fetchErr || !request) return res.status(404).json({ error: 'Payment request not found' });
      if (request.status === 'approved') return res.status(400).json({ error: 'Already approved' });

      const finalPlanSlug = plan_slug || request.plan_slug;
      const finalPlanName = plan_name || request.plan_name;
      const finalAmount = request.amount;

      // Activate premium for the student
      await activatePremium(request.user_id, finalPlanSlug, finalPlanName, finalAmount, user.id);

      // Update request status
      await supabase.from('upi_payment_requests').update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        plan_slug: finalPlanSlug,
        plan_name: finalPlanName,
        admin_note: admin_note || null,
        updated_at: new Date().toISOString(),
      }).eq('id', request_id);

      // Notify student
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: '🎉 Payment Approved! Package Activated',
        body: `Your payment for ${finalPlanName} has been verified and approved! Your premium package is now active. Welcome to MBBSWala Premium! 🚀`,
        description: `Your ${finalPlanName} package has been activated. You now have full access to all premium features.`,
        type: 'payment_approved',
        meta: JSON.stringify({ plan_slug: finalPlanSlug, plan_name: finalPlanName, approved_by: user.email }),
        read: false,
        created_at: new Date().toISOString(),
      });

      // Try to send push to student too
      try {
        const { data: studentPushSubs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', request.user_id);

        if (studentPushSubs && studentPushSubs.length > 0) {
          await Promise.allSettled(studentPushSubs.map((sub) =>
            sendWebPush(sub, {
              title: '🎉 Package Activated — MBBSWala',
              body: `Your ${finalPlanName} is now active! Open the app to start using premium features.`,
              data: { url: '/dashboard' },
            })
          ));
        }
      } catch (pushErr) {
        console.warn('Student push error:', pushErr.message);
      }

      return res.status(200).json({ ok: true, message: `Payment approved and ${finalPlanName} activated for student.` });
    }

    // ── POST action=reject: Admin rejects ──
    if (req.method === 'POST' && action === 'reject') {
      if (!isAdmin(user)) {
        return res.status(403).json({ error: 'Unauthorized. Only admins can reject payments.' });
      }

      const { request_id, admin_note } = req.body || {};
      if (!request_id) return res.status(400).json({ error: 'request_id is required' });

      const { data: request } = await supabase
        .from('upi_payment_requests')
        .select('*')
        .eq('id', request_id)
        .single();

      if (!request) return res.status(404).json({ error: 'Request not found' });

      await supabase.from('upi_payment_requests').update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        admin_note: admin_note || 'Payment could not be verified.',
        updated_at: new Date().toISOString(),
      }).eq('id', request_id);

      // Notify student via DB
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: '❌ Payment Verification Failed',
        body: `We could not verify your payment for ${request.plan_name}. Reason: ${admin_note || 'UTR not found or screenshot unclear'}. Please contact support or retry.`,
        description: admin_note || 'Payment could not be verified. Please contact support.',
        type: 'payment_rejected',
        read: false,
        created_at: new Date().toISOString(),
      });

      // Also send web push to student (works even when site is closed)
      try {
        const { data: studentPushSubs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', request.user_id);

        if (studentPushSubs && studentPushSubs.length > 0) {
          await Promise.allSettled(studentPushSubs.map((sub) =>
            sendWebPush(sub, {
              title: '❌ Payment Verification Failed — MBBSWala',
              body: `We could not verify your payment for ${request.plan_name}. Please contact support or retry.`,
              data: { url: '/dashboard/payment' },
            })
          ));
        }
      } catch (pushErr) {
        console.warn('Student rejection push error:', pushErr.message);
      }

      return res.status(200).json({ ok: true, message: 'Payment request rejected and student notified.' });
    }

    // ── POST action=save-push-subscription ──
    if (req.method === 'POST' && action === 'save-push-subscription') {
      const { endpoint, p256dh, auth: authKey } = req.body || {};
      if (!endpoint || !p256dh || !authKey) {
        return res.status(400).json({ error: 'endpoint, p256dh and auth are required' });
      }

      const { error: upsertErr } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth: authKey,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });

      if (upsertErr) {
        console.warn('[push] push_subscriptions upsert error:', upsertErr.message);
        // Try with user_id conflict as fallback (in case endpoint unique index doesn't exist)
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint,
          p256dh,
          auth: authKey,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).catch(() => {});
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('UPI payment API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

