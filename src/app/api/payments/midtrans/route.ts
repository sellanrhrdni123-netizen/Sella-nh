import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { store } from '@/lib/storage';

/**
 * Midtrans Payment Notification Webhook Endpoint
 * Handles HTTP POST notifications from Midtrans payment gateway,
 * performs signature verification, and automatically upgrades user subscription to Pro.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type
    } = body;

    if (!order_id) {
      return NextResponse.json({ ok: false, error: 'order_id is required' }, { status: 400 });
    }

    // 1. Signature Verification (if signature_key and server key are provided)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (signature_key && serverKey && status_code && gross_amount) {
      const payloadString = `${order_id}${status_code}${gross_amount}${serverKey}`;
      const calculatedHash = crypto.createHash('sha512').update(payloadString).digest('hex');
      if (calculatedHash !== signature_key) {
        return NextResponse.json(
          { ok: false, error: 'Invalid Midtrans payment signature' },
          { status: 401 }
        );
      }
    }

    // 2. Determine Settlement Status
    let status: 'settled' | 'pending' | 'rejected' | 'expired' = 'pending';

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        status = 'pending';
      } else if (fraud_status === 'accept') {
        status = 'settled';
      } else {
        status = 'pending';
      }
    } else if (transaction_status === 'settlement') {
      status = 'settled';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
      status = 'rejected';
    } else if (transaction_status === 'expire') {
      status = 'expired';
    } else if (transaction_status === 'pending') {
      status = 'pending';
    }

    // 3. Find and update payment record in store
    const payments = store.getPayments();
    const payment = payments.find(p => p.orderId === order_id);

    if (payment) {
      store.updatePaymentStatus(
        payment.id,
        status,
        `Midtrans Webhook: ${transaction_status} (Method: ${payment_type || payment.paymentMethod})`
      );

      // Audit log entry for payment settlement
      const admin = store.getAdminUser();
      store.addAuditLog({
        adminId: admin.id,
        adminEmail: 'system@midtrans.tatadana.id',
        targetUserId: payment.userId,
        action: 'PAYMENT_SETTLED_MIDTRANS',
        details: {
          orderId: order_id,
          amount: payment.amount,
          plan: payment.plan,
          status,
          paymentType: payment_type || payment.paymentMethod
        }
      });
    }

    return NextResponse.json({
      ok: true,
      status,
      order_id,
      message: 'Midtrans notification handled successfully'
    });
  } catch (error: any) {
    console.error('Midtrans webhook processing error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
