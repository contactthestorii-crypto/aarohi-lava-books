// file:///d:/New%20folder/src/pages/api/razorpay/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

const RAZORPAY_SECRET = process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const signature = req.headers['x-razorpay-signature'] as string;
  const body = JSON.stringify(req.body);
  const generated = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(body)
    .digest('hex');

  if (generated !== signature) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;
  if (event.event === 'payment.captured') {
    const orderId = event.payload.payment.entity.notes?.order_id;
    if (orderId) {
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
    }
  }

  res.json({ received: true });
}

