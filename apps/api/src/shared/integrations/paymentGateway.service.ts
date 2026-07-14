/**
 * Payment Gateway — Integration Abstraction (Phase 4).
 *
 * Real implementation would call a payment processor (PAYMENT_GATEWAY_API_KEY, see
 * .env.example). Not integrated in this demo — Sales' invoice payment recording stays
 * manual-entry on purpose (see `invoicesService.recordPayment`), this interface only
 * exists so a future "online payment" feature has a real abstraction to call. The fake
 * below always succeeds with a generated fake transaction/refund id and makes no network
 * calls.
 */

export interface ChargeResult {
  success: boolean;
  transactionId: string;
  message: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  message: string;
}

export interface PaymentGatewayService {
  charge(amount: number, currency: string, reference: string): Promise<ChargeResult>;
  refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult>;
}

class FakePaymentGatewayService implements PaymentGatewayService {
  async charge(amount: number, currency: string, reference: string): Promise<ChargeResult> {
    const transactionId = `fake-txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    console.log(
      `[FAKE PAYMENT GATEWAY] charge amount=${amount} ${currency} reference=${reference} -> ${transactionId}`,
    );
    return {
      success: true,
      transactionId,
      message: 'Payment simulated successfully (no real gateway integrated)',
    };
  }

  async refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult> {
    const refundId = `fake-refund-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    console.log(
      `[FAKE PAYMENT GATEWAY] refund transactionId=${transactionId} amount=${amount} reason=${reason ?? 'n/a'} -> ${refundId}`,
    );
    return {
      success: true,
      refundId,
      message: 'Refund simulated successfully (no real gateway integrated)',
    };
  }
}

export const paymentGatewayService: PaymentGatewayService = new FakePaymentGatewayService();
