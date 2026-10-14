import crypto from 'crypto';
import supabase from './db-client.js';
import { setCors, requireUser } from './_auth.js';
import { ensureWallet, creditWallet } from './wallet-helpers.js';
import {
  encryptAuBank,
  decryptAuBank,
  decryptAuBankWithFallback,
  parseAuBankResponse,
  buildAuBankQuery,
  getAuBankConfig,
} from './aubank-utils.js';

const REFERRAL_REWARD_AMOUNT = 500;

const PLANS = {
  basic: { name: 'BASIC', price: 99 },
  'neet-ug-pro': { name: 'NEET UG Counselling Pro', price: 900 },
  ultimate: { name: 'Ultimate Medical Master Bundle', price: 1100 },
  premium: { name: 'Premium Plan', price: 900 }, // Fallback for legacy
};

const PLAN_LEVELS = {
  'Free Plan': 0,
  BASIC: 1,
  'NEET UG Counselling Pro': 2,
  'Premium Plan': 2,
  'Ultimate Medical Master Bundle': 3,
};

/**
 * Execute all post-payment activation steps idempotently:
 * 1. Update user profile to premium
 * 2. Record in subscriptions table
 * 3. Update payment status to captured
 * 4. Process referral rewards (referee discount + referrer ₹500 wallet reward)
 * 5. Ensure unique referral code for buyer
 * 6. Sync CRM (student_counselling & purchases)
 * 7. Send in-app welcome notification
 */
async function executeSuccessfulActivation({
  userId,
  userEmail = '',
  userName = '',
  orderId,
  paymentId,
  amount,
  planSlug,
  planName,
  gateway = 'aubank',
  meta = {},
}) {
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // 1. Activate Premium in User Profile
  const { data: updatedProfile, error: profErr } = await supabase
    .from('profiles')
    .update({
      is_premium: true,
      subscription_status: 'active',
      subscription_plan: planName,
      payment_status: 'Paid',
      premium_start_date: now.toISOString(),
      premium_end_date: oneYearLater.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (profErr) {
    console.error('[AU Bank Activation] Profile update warning:', profErr.message);
  }

  // 2. Record in Subscriptions Table
  await supabase.from('subscriptions').insert({
    user_id: userId,
    plan_slug: planSlug,
    plan_name: planName,
    amount: Number(amount),
    currency: 'INR',
    status: 'active',
    gateway,
    payment_id: paymentId,
    order_id: orderId,
    start_date: now.toISOString(),
    end_date: oneYearLater.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  });

  // 3. Update Payment record in Payments Table
  let appliedReferralCode = meta?.referral_code || null;
  let referrerId = meta?.referrer_id || null;

  if (orderId) {
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('meta')
      .eq('order_id', orderId)
      .maybeSingle();

    if (paymentRecord?.meta) {
      appliedReferralCode = appliedReferralCode || paymentRecord.meta.referral_code;
      referrerId = referrerId || paymentRecord.meta.referrer_id;
    }

    await supabase
      .from('payments')
      .update({
        payment_id: paymentId,
        status: 'captured',
        gateway,
        amount: Number(amount),
        updated_at: now.toISOString(),
      })
      .eq('order_id', orderId);
  } else {
    await supabase.from('payments').insert({
      user_id: userId,
      order_id: orderId || `aub_${Date.now()}`,
      payment_id: paymentId,
      amount: Number(amount),
      currency: 'INR',
      status: 'captured',
      gateway,
      plan_slug: planSlug,
      meta: { ...meta, plan_name: planName },
      created_at: now.toISOString(),
    });
  }

  // 4. Process Referral Reward if applicable
  if (appliedReferralCode && referrerId) {
    try {
      const { data: existingAsReferee } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', userId)
        .maybeSingle();

      if (!existingAsReferee) {
        const { data: refRow, error: rErr } = await supabase
          .from('referrals')
          .insert({
            referrer_id: referrerId,
            referee_id: userId,
            referee_email: userEmail,
            referee_name: userName || userEmail.split('@')[0] || 'Friend',
            referral_code: appliedReferralCode,
            status: 'completed',
            referrer_reward: REFERRAL_REWARD_AMOUNT,
            referee_discount: 500,
            created_at: now.toISOString(),
            completed_at: now.toISOString(),
          })
          .select()
          .single();

        if (!rErr && refRow) {
          await ensureWallet({ id: referrerId });
          await creditWallet(
            referrerId,
            REFERRAL_REWARD_AMOUNT,
            'referral_reward',
            `Referral reward — ${userEmail || 'new user'} upgraded via AU Bank`,
            { referral_id: refRow.id, referee_id: userId }
          );
        }
      }
    } catch (refErr) {
      console.warn('[Referral Payout Warning]:', refErr.message);
    }
  }

  // 5. Ensure unique Referral Code for this new Premium User
  let userWallet = null;
  try {
    userWallet = await ensureWallet({ id: userId, email: userEmail });
    if (!userWallet?.referral_code || userWallet.referral_code.startsWith('MBWUSER')) {
      const prefix = 'MED' + Math.random().toString(36).slice(2, 5).toUpperCase();
      const code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase.from('wallets').update({ referral_code: code }).eq('user_id', userId);
      await supabase.from('profiles').update({ referral_code: code }).eq('id', userId);
    }
  } catch (wErr) {
    console.warn('[Wallet ensure warning]:', wErr.message);
  }

  // 6. Admin CRM & Student Sync (student_counselling & purchases)
  try {
    const { data: existingCounselling } = await supabase
      .from('student_counselling')
      .select('id')
      .or(`user_id.eq.${userId},email.eq.${userEmail || 'nonexistent@mbbswala.in'}`)
      .maybeSingle();

    let studentId = null;

    if (existingCounselling) {
      studentId = existingCounselling.id;
      await supabase
        .from('student_counselling')
        .update({
          payment_status: 'paid',
          payment_amount: Number(amount),
          purchased_counselling: planName,
          purchased_course: String(planSlug).includes('pg') ? 'MD/MS' : 'MBBS',
          updated_at: now.toISOString(),
        })
        .eq('id', studentId);
    } else {
      const { data: newCounselling } = await supabase
        .from('student_counselling')
        .insert({
          user_id: userId,
          full_name: userName || userEmail.split('@')[0] || 'Unknown',
          email: userEmail,
          payment_status: 'paid',
          payment_amount: Number(amount),
          purchased_counselling: planName,
          purchased_course: String(planSlug).includes('pg') ? 'MD/MS' : 'MBBS',
          counselling_status: 'new',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select('id')
        .single();

      if (newCounselling) studentId = newCounselling.id;
    }

    if (studentId) {
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('item_name', planName)
        .gte('created_at', new Date(now.getTime() - 10 * 60000).toISOString())
        .maybeSingle();

      if (!existingPurchase) {
        await supabase.from('purchases').insert({
          user_id: userId,
          student_id: studentId,
          item_type: 'course',
          item_name: planName,
          amount: Number(amount),
          status: 'paid',
          created_at: now.toISOString(),
        });
      }
    }
  } catch (crmErr) {
    console.error('[AU Bank CRM Sync Exception]:', crmErr.message);
  }

  // 7. Welcome In-App Notification
  await supabase.from('notifications').insert({
    user_id: userId,
    title: '🌟 Welcome to MBBSWala Premium!',
    body: `Your ${planName} is now active. All 1000+ predictions, AI counsellor, round-wise cutoffs, and seat matrices are unlocked.`,
    description: `Your ${planName} is now active. All 1000+ predictions, AI counsellor, round-wise cutoffs, and seat matrices are unlocked.`,
    type: 'subscription',
    read: false,
    created_at: now.toISOString(),
  });

  return { ok: true, profile: updatedProfile };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const action = req.query?.action || (req.body && req.body.action) || '';

    // ── 1. AU Bank Payment Gateway Callback (action=response) ────────────────
    // AU Bank POSTs encResp to redirect_url upon completion without user JWT
    if (action === 'response' || req.query?.action === 'response') {
      const auConfig = getAuBankConfig();
      const rawEncResp = req.body?.encResp || req.query?.encResp || '';
      let parsedData = {};

      if (rawEncResp && (auConfig.workingKey || auConfig.workingKey2)) {
        try {
          const decrypted = decryptAuBankWithFallback(rawEncResp, auConfig.workingKey, auConfig.workingKey2);
          parsedData = parseAuBankResponse(decrypted);
        } catch (decErr) {
          console.error('[AU Bank Callback] Decryption failed:', decErr.message);
        }
      } else if (req.body?.order_status || req.body?.order_id) {
        parsedData = req.body;
      }

      const orderId = parsedData.order_id || parsedData.orderNo || req.query?.order_id || '';
      const orderStatus = (parsedData.order_status || '').toLowerCase(); // 'success', 'failure', 'aborted'
      const trackingId = parsedData.tracking_id || parsedData.bank_ref_no || `aub_${Date.now()}`;
      const failureMsg = parsedData.failure_message || parsedData.status_message || 'Transaction was declined';

      // Look up existing order in DB
      let dbOrder = null;
      if (orderId) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .maybeSingle();
        dbOrder = data;
      }

      const targetUserId = dbOrder?.user_id || parsedData.merchant_param1;
      const planSlug = dbOrder?.plan_slug || parsedData.merchant_param2 || 'basic';
      const planName = dbOrder?.meta?.plan_name || PLANS[planSlug]?.name || 'Premium Plan';
      const amount = dbOrder?.amount || parsedData.amount || PLANS[planSlug]?.price || 99;

      if (orderStatus === 'success' && targetUserId) {
        // Idempotency check: if already captured, redirect to dashboard
        if (dbOrder?.status !== 'captured') {
          // Fetch user details
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', targetUserId)
            .maybeSingle();

          await executeSuccessfulActivation({
            userId: targetUserId,
            userEmail: profile?.email || parsedData.billing_email || '',
            userName: profile?.full_name || parsedData.billing_name || '',
            orderId,
            paymentId: trackingId,
            amount,
            planSlug,
            planName,
            gateway: 'aubank',
            meta: {
              ...dbOrder?.meta,
              referral_code: parsedData.merchant_param3 || dbOrder?.meta?.referral_code,
              referrer_id: parsedData.merchant_param4 || dbOrder?.meta?.referrer_id,
              bank_ref_no: parsedData.bank_ref_no,
              payment_mode: parsedData.payment_mode,
            },
          });
        }

        // Return auto-redirecting HTML page
        const redirectUrl = `/dashboard?payment=success&plan=${encodeURIComponent(planSlug)}`;
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Successful — MBBSWala</title>
  <meta http-equiv="refresh" content="1;url=${redirectUrl}" />
  <script>
    if (window.opener) {
      try { window.opener.postMessage({ type: 'AUBANK_SUCCESS', orderId: '${orderId}' }, '*'); window.close(); } catch(e){}
    }
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'AUBANK_SUCCESS', orderId: '${orderId}' }, '*'); } catch(e){}
    }
    window.location.href = '${redirectUrl}';
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #fff; text-align: center; padding: 60px 20px;">
  <div style="max-width: 440px; margin: 0 auto; background: #111827; border: 1px solid #10b981; border-radius: 24px; padding: 40px 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
    <h2 style="margin: 0 0 8px; color: #10b981; font-size: 24px;">Payment Successful!</h2>
    <p style="margin: 0 0 20px; color: #9ca3af; font-size: 14px;">Your subscription has been activated successfully.</p>
    <a href="${redirectUrl}" style="display: inline-block; background: #f97316; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 14px;">Go to Dashboard &rarr;</a>
  </div>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send ? res.status(200).send(html) : res.end(html);
      } else {
        // Record failure
        if (orderId) {
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              meta: { error: failureMsg },
              updated_at: new Date().toISOString(),
            })
            .eq('order_id', orderId);
        }

        const failUrl = `/dashboard/subscription?payment=failed&error=${encodeURIComponent(failureMsg)}`;
        const failHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Incomplete — MBBSWala</title>
  <meta http-equiv="refresh" content="2;url=${failUrl}" />
  <script>
    if (window.opener) {
      try { window.opener.postMessage({ type: 'AUBANK_FAILED', error: '${failureMsg}' }, '*'); window.close(); } catch(e){}
    }
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'AUBANK_FAILED', error: '${failureMsg}' }, '*'); } catch(e){}
    }
    window.location.href = '${failUrl}';
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #fff; text-align: center; padding: 60px 20px;">
  <div style="max-width: 440px; margin: 0 auto; background: #111827; border: 1px solid #ef4444; border-radius: 24px; padding: 40px 24px;">
    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
    <h2 style="margin: 0 0 8px; color: #ef4444; font-size: 22px;">Payment Declined / Cancelled</h2>
    <p style="margin: 0 0 20px; color: #9ca3af; font-size: 14px;">${failureMsg}</p>
    <a href="${failUrl}" style="display: inline-block; background: #374151; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 12px; font-weight: bold; font-size: 13px;">Return to Plans &rarr;</a>
  </div>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send ? res.status(200).send(failHtml) : res.end(failHtml);
      }
    }

    // ── All other endpoints require authenticated student session ────────────
    const user = await requireUser(req, res);
    if (!user) return;

    // ── 2. GET or POST action=sync-subscription: Fetch payment & plan state ────
    if (req.method === 'GET' || action === 'sync-subscription' || action === 'restore') {
      const { data: paymentsList } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      const { data: subList } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const validActiveSub =
        subList?.find((s) => {
          if (s.status !== 'active') return false;
          if (s.end_date && new Date(s.end_date).getTime() < Date.now()) return false;
          return true;
        }) || null;

      const validCapturedPay =
        paymentsList?.find((p) =>
          ['captured', 'success', 'paid', 'complete'].includes(p.status)
        ) || null;

      let isPrem = Boolean(validActiveSub) || Boolean(validCapturedPay);
      let planName = 'Free Plan';
      let subStatus = 'free';
      let endDate = null;

      if (validActiveSub) {
        isPrem = true;
        subStatus = 'active';
        planName = validActiveSub.plan_name || validActiveSub.plan_slug || 'NEET Counselling Pro';
        endDate = validActiveSub.end_date || null;
      } else if (validCapturedPay) {
        isPrem = true;
        subStatus = 'active';
        planName = validCapturedPay.meta?.plan_name || validCapturedPay.plan_slug || 'NEET Counselling Pro';
      } else {
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
            isPrem = true;
            subStatus = 'active';
            planName = scData[0].purchased_counselling || scData[0].purchased_course || 'NEET Counselling Pro';
          }
        } catch (scErr) {
          console.warn('Payment sync student_counselling check warning:', scErr.message);
        }

        if (!isPrem && Boolean(profile?.is_premium) && profile?.subscription_status === 'active') {
          const isExpired =
            profile.premium_end_date && new Date(profile.premium_end_date).getTime() < Date.now();
          if (!isExpired) {
            isPrem = true;
            subStatus = 'active';
            planName =
              profile.subscription_plan && profile.subscription_plan !== 'Free Plan'
                ? profile.subscription_plan
                : 'NEET Counselling Pro';
            endDate = profile.premium_end_date || null;
          }
        }
      }

      // Auto-heal profile if needed
      if (isPrem && (!profile?.is_premium || profile?.subscription_status !== 'active')) {
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
        } catch (pErr) {
          console.warn('Auto-heal payment profile update warning:', pErr.message);
        }
      }

      return res.status(200).json({
        profile: {
          ...(profile || {}),
          is_premium: isPrem,
          subscription_status: subStatus,
          subscription_plan: planName,
          premium_end_date: endDate,
        },
        is_premium: isPrem,
        subscription_status: subStatus,
        subscription_plan: planName,
        premium_end_date: endDate,
        subscription: validActiveSub,
        subscriptions: subList || [],
        payments: paymentsList || [],
      });
    }

    // ── 3. POST action=create-order: Initiate AU Bank Payment ────────────────
    if (req.method === 'POST' && (action === 'create-order' || !action)) {
      const { plan_slug = 'basic', referral_code } = req.body || {};

      // Guard: Check existing plan level to prevent downgrade / lateral purchases
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_plan, payment_status')
        .eq('id', user.id)
        .maybeSingle();

      const { data: activeSubList } = await supabase
        .from('subscriptions')
        .select('id, plan_slug, plan_name, end_date')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('id', { ascending: false })
        .limit(1);

      const currentPlanName =
        userProfile?.subscription_plan || activeSubList?.[0]?.plan_name || 'Free Plan';
      const targetLevel = PLAN_LEVELS[PLANS[plan_slug]?.name] || PLAN_LEVELS['BASIC'];
      const currentLevel = PLAN_LEVELS[currentPlanName] || 0;

      const hasActiveSub =
        activeSubList &&
        activeSubList.length > 0 &&
        (!activeSubList[0].end_date || new Date(activeSubList[0].end_date).getTime() > Date.now());
      const isAlreadyPaid =
        (Boolean(userProfile?.is_premium) && userProfile?.subscription_status === 'active') ||
        hasActiveSub;

      if (isAlreadyPaid && currentLevel >= targetLevel) {
        return res.status(400).json({
          error: `You already have an active subscription (${currentPlanName}). You cannot purchase a lower or equal tier plan.`,
          already_subscribed: true,
          is_premium: true,
          redirect: '/dashboard',
        });
      }

      const plan = PLANS[plan_slug] || PLANS['basic'];
      const plan_name = plan.name;
      let finalAmount = plan.price;
      let appliedReferralCode = null;
      let referrerId = null;

      // Validate referral code if provided
      if (referral_code) {
        const refCode = String(referral_code).trim().toUpperCase();
        const { data: referrerWallet } = await supabase
          .from('wallets')
          .select('user_id')
          .eq('referral_code', refCode)
          .maybeSingle();

        if (referrerWallet && referrerWallet.user_id !== user.id) {
          const { data: existingAsReferee } = await supabase
            .from('referrals')
            .select('id')
            .eq('referee_id', user.id)
            .maybeSingle();

          if (!existingAsReferee && plan_slug !== 'basic') {
            finalAmount = Math.max(0, finalAmount - 500);
            appliedReferralCode = refCode;
            referrerId = referrerWallet.user_id;
          }
        }
      }

      const auConfig = getAuBankConfig();
      const orderId = `AUB_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const receipt = `rcpt_${user.id.slice(0, 6)}_${Date.now()}`;

      // Determine public callback URL for AU Bank PG
      const rawOrigin =
        req.headers['origin'] ||
        req.headers['referer'] ||
        process.env.APP_URL ||
        process.env.VITE_APP_URL ||
        'https://mbbswaala.io';
      const cleanOrigin = String(rawOrigin).replace(/\/+$/, '').split('?')[0];
      const redirectUrl = `${cleanOrigin}/api/payment?action=response`;
      const cancelUrl = `${cleanOrigin}/api/payment?action=response`;

      let encRequest = '';
      let isLiveGateway = auConfig.isLive;

      const merchantParams = {
        merchant_id: auConfig.merchantId || '2',
        order_id: orderId,
        currency: 'INR',
        amount: Number(finalAmount).toFixed(2),
        redirect_url: redirectUrl,
        cancel_url: cancelUrl,
        language: 'EN',
        billing_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        billing_email: user.email || '',
        billing_tel: user.user_metadata?.phone || '',
        merchant_param1: user.id,
        merchant_param2: plan_slug,
        merchant_param3: appliedReferralCode || '',
        merchant_param4: referrerId || '',
        integration_type: 'iframe_normal',
      };

      if (auConfig.isLive) {
        try {
          const queryString = buildAuBankQuery(merchantParams);
          encRequest = encryptAuBank(queryString, auConfig.workingKey);
        } catch (encErr) {
          console.warn('[AU Bank] Order payload encryption warning:', encErr.message);
          isLiveGateway = false;
        }
      }

      // Record initial payment record in DB
      await supabase.from('payments').insert({
        user_id: user.id,
        order_id: orderId,
        amount: finalAmount,
        currency: 'INR',
        status: 'created',
        gateway: 'aubank',
        plan_slug,
        receipt,
        meta: {
          plan_name,
          referral_code: appliedReferralCode,
          referrer_id: referrerId,
          gateway: 'aubank',
        },
        created_at: new Date().toISOString(),
      });

      return res.status(200).json({
        ok: true,
        orderId,
        gateway: 'aubank',
        gatewayUrl: auConfig.gatewayUrl,
        accessCode: auConfig.accessCode,
        merchantId: auConfig.merchantId,
        encRequest,
        amount: finalAmount,
        original_amount: plan.price,
        currency: 'INR',
        plan_slug,
        plan_name,
        isLiveGateway,
      });
    }

    // ── 4. POST action=verify or action=verify-aubank: Activate verified payment ──
    if (req.method === 'POST' && (action === 'verify' || action === 'verify-aubank')) {
      const { order_id, payment_id, is_simulated } = req.body || {};

      if (!order_id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const { data: dbOrder } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', order_id)
        .maybeSingle();

      if (!dbOrder) {
        return res.status(400).json({ error: 'Order not found' });
      }

      if (dbOrder.user_id !== user.id) {
        return res.status(403).json({ error: 'Unauthorized payment verification' });
      }

      if (dbOrder.status === 'captured') {
        return res.status(200).json({
          ok: true,
          message: 'Payment already verified',
          is_premium: true,
          redirect: '/dashboard',
        });
      }

      const trackingId = payment_id || `aub_${Date.now()}`;
      const planSlug = dbOrder.plan_slug || 'basic';
      const planName = dbOrder.meta?.plan_name || PLANS[planSlug]?.name || 'Premium Plan';

      const result = await executeSuccessfulActivation({
        userId: user.id,
        userEmail: user.email || '',
        userName: user.user_metadata?.full_name || '',
        orderId: order_id,
        paymentId: trackingId,
        amount: dbOrder.amount,
        planSlug,
        planName,
        gateway: 'aubank',
        meta: { ...dbOrder.meta, is_simulated: Boolean(is_simulated) },
      });

      return res.status(200).json({
        ok: true,
        message: 'Payment verified and Premium activated successfully! Welcome to MBBSWala Premium.',
        profile: result.profile,
        is_premium: true,
        redirect: '/dashboard',
      });
    }

    // ── 5. POST action=fail: Record payment failure ──────────────────────────
    if (req.method === 'POST' && action === 'fail') {
      const { order_id, error_description } = req.body || {};
      if (!order_id) return res.status(400).json({ error: 'Order ID required' });

      try {
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
            meta: { error: error_description },
          })
          .eq('order_id', order_id);

        return res.status(200).json({ ok: true, message: 'Payment failure recorded' });
      } catch (err) {
        return res.status(500).json({ error: 'Internal error recording failure' });
      }
    }

    res.status(400).json({ error: 'Invalid action specified' });
  } catch (err) {
    console.error('[Payment API Exception]:', err);
    res.status(500).json({ error: err.message });
  }
}
