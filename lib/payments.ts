import crypto from 'crypto';

interface InitializePaymentParams {
  email: string;
  amountGhs: number;
  reference: string;
  callbackUrl: string;
  channels: ('momo' | 'card')[];
  phone?: string;
  metadata?: Record<string, unknown>;
}

interface PaystackInitResult {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  error?: string;
}

/**
 * Generates a unique, cryptographically random reference for payment gateways.
 */
export function generatePaymentReference(prefix = 'HSTL'): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Initializes a transaction on Paystack for Ghana Cedi (GHS)
 * Supports Mobile Money (MTN, Telecel, AirtelTigo) and Bank Cards.
 */
export async function initializePaystackPayment(
  params: InitializePaymentParams
): Promise<PaystackInitResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return {
      success: false,
      reference: params.reference,
      error: 'PAYSTACK_SECRET_KEY is not configured in environment variables.',
    };
  }

  // Paystack expects amount in Pesewas (1 GHS = 100 Pesewas)
  const amountInPesewas = Math.round(params.amountGhs * 100);

  // Map channels to Paystack channel names
  const paystackChannels: string[] = [];
  if (params.channels.includes('momo')) paystackChannels.push('mobile_money');
  if (params.channels.includes('card')) paystackChannels.push('card');

  const payload = {
    email: params.email,
    amount: amountInPesewas,
    currency: 'GHS',
    reference: params.reference,
    callback_url: params.callbackUrl,
    channels: paystackChannels.length > 0 ? paystackChannels : ['mobile_money', 'card'],
    metadata: {
      phone: params.phone,
      ...params.metadata,
    },
  };

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return {
        success: false,
        reference: params.reference,
        error: data.message || 'Failed to initialize payment with Paystack.',
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown network error';
    return {
      success: false,
      reference: params.reference,
      error: `Paystack API network error: ${errorMessage}`,
    };
  }
}

/**
 * Cryptographically verifies that incoming webhook payloads originate from Paystack.
 * Paystack signs the request body using HMAC SHA-512 with your secret key.
 */
export function verifyPaystackSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  try {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'utf8'),
      Buffer.from(signatureHeader, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Verifies Flutterwave webhook secret hash header.
 */
export function verifyFlutterwaveSignature(secretHashHeader: string | null): boolean {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secretHash || !secretHashHeader) return false;
  return secretHash === secretHashHeader;
}
