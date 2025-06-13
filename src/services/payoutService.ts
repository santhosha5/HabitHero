import { supabase } from '../lib/supabase';
import { WeeklyPool } from '../types/rewards';
import toast from 'react-hot-toast';

interface PaymentProvider {
  name: 'venmo' | 'paypal';
  accountId: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

interface VenmoPaymentResponse {
  data: {
    id: string;
    status: string;
    amount: number;
    recipient: string;
  };
}

interface PayPalPaymentResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

class PayoutService {
  // Maximum number of retry attempts for failed payments
  private readonly MAX_RETRY_ATTEMPTS = 3;
  
  async processWeeklyPayouts(familyId: string): Promise<void> {
    try {
      // Get completed pools that haven't been paid out
      const { data: pools, error } = await supabase
        .from('weekly_pools')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'completed');

      if (error) throw error;
      if (!pools || pools.length === 0) return;

      for (const pool of pools) {
        await this.processSinglePoolPayout(pool);
      }
    } catch (error) {
      console.error('Error processing weekly payouts:', error);
      throw error;
    }
  }

  private async processSinglePoolPayout(pool: WeeklyPool): Promise<void> {
    try {
      // Get payment details for winners
      const winnerIds = pool.winners.map((w: WeeklyPool['winners'][number]) => w.user_id);
      const { data: paymentDetails, error: detailsError } = await supabase
        .from('user_payment_details')
        .select('*')
        .in('user_id', winnerIds);

      if (detailsError) throw detailsError;
      if (!paymentDetails) throw new Error('No payment details found for winners');

      // Process payments for each winner
      for (const winner of pool.winners) {
        const details = paymentDetails.find(d => d.user_id === winner.user_id);
        if (!details) {
          console.warn(`No payment details found for user ${winner.user_id}`);
          continue;
        }

        await this.sendPayment(details.provider, details.account_id, winner.payout_amount);
      }

      // Mark pool as paid out
      const { error: updateError } = await supabase
        .from('weekly_pools')
        .update({ status: 'paid_out' })
        .eq('id', pool.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error processing pool payout:', error);
      throw error;
    }
  }

  private async sendPayment(
    provider: PaymentProvider['name'],
    accountId: string,
    amount: number
  ): Promise<void> {
    try {
      switch (provider) {
        case 'venmo':
          await this.sendVenmoPayment(accountId, amount);
          break;
        case 'paypal':
          await this.sendPayPalPayment(accountId, amount);
          break;
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error('Error sending payment:', error);
      throw error;
    }
  }

  private async sendVenmoPayment(accountId: string, amount: number): Promise<void> {
    const venmoApiKey = process.env.REACT_APP_VENMO_API_KEY;
    
    if (!venmoApiKey) {
      throw new Error('Venmo API key is not configured');
    }

    try {
      // Format amount to 2 decimal places
      const formattedAmount = amount.toFixed(2);
      
      // Make API call to Venmo
      const response = await fetch('https://api.venmo.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${venmoApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: accountId,
          amount: formattedAmount,
          note: 'HabitHero weekly pool reward',
          funding_source: 'balance'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Venmo payment failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const paymentResult: VenmoPaymentResponse = await response.json();
      
      // Log transaction and update database
      await this.logPaymentTransaction({
        provider: 'venmo',
        accountId: accountId,
        amount: amount,
        transactionId: paymentResult.data.id,
        status: paymentResult.data.status
      });

    } catch (error: any) {
      console.error('Venmo payment error:', error);
      
      // Store failed payment for retry
      await this.storeFailedPayment('venmo', accountId, amount, error.message);
      
      throw error;
    }
  }

  private async sendPayPalPayment(accountId: string, amount: number): Promise<void> {
    const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.REACT_APP_PAYPAL_SECRET;
    
    if (!paypalClientId || !paypalSecret) {
      throw new Error('PayPal credentials are not configured');
    }

    try {
      // Get access token
      const tokenResponse = await fetch('https://api.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`PayPal authentication failed: ${tokenData.error_description}`);
      }
      
      // Format amount to 2 decimal places
      const formattedAmount = amount.toFixed(2);
      
      // Make payout
      const payoutResponse = await fetch('https://api.paypal.com/v1/payments/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: `HabitHero_${Date.now()}`,
            email_subject: 'You received a payment from HabitHero'
          },
          items: [
            {
              recipient_type: 'EMAIL',
              amount: {
                value: formattedAmount,
                currency: 'USD'
              },
              note: 'HabitHero weekly pool reward',
              sender_item_id: `reward_${Date.now()}`,
              receiver: accountId
            }
          ]
        })
      });

      if (!payoutResponse.ok) {
        const errorData = await payoutResponse.json();
        throw new Error(`PayPal payout failed: ${errorData.message || 'Unknown error'}`);
      }

      const paymentResult: PayPalPaymentResponse = await payoutResponse.json();
      
      // Log transaction and update database
      await this.logPaymentTransaction({
        provider: 'paypal',
        accountId: accountId,
        amount: amount,
        transactionId: paymentResult.id,
        status: paymentResult.status
      });

    } catch (error: any) {
      console.error('PayPal payment error:', error);
      
      // Store failed payment for retry
      await this.storeFailedPayment('paypal', accountId, amount, error.message);
      
      throw error;
    }
  }
  
  private async logPaymentTransaction(transactionData: {
    provider: 'venmo' | 'paypal';
    accountId: string;
    amount: number;
    transactionId: string;
    status: string;
  }): Promise<void> {
    // Store transaction in database for record keeping
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        provider: transactionData.provider,
        recipient_account: transactionData.accountId,
        amount: transactionData.amount,
        transaction_id: transactionData.transactionId,
        status: transactionData.status,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging payment transaction:', error);
    }
  }
  
  private async storeFailedPayment(
    provider: 'venmo' | 'paypal',
    accountId: string,
    amount: number,
    errorMessage: string
  ): Promise<void> {
    // Store failed payment for retry later
    const { error } = await supabase
      .from('failed_payments')
      .insert({
        provider: provider,
        recipient_account: accountId,
        amount: amount,
        error_message: errorMessage,
        retry_count: 0,
        last_retry: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing failed payment:', error);
    }
  }
  
  // Retry failed payments
  async retryFailedPayments(): Promise<void> {
    try {
      // Get failed payments that haven't exceeded max retry attempts
      const { data: failedPayments, error } = await supabase
        .from('failed_payments')
        .select('*')
        .lt('retry_count', this.MAX_RETRY_ATTEMPTS)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (!failedPayments || failedPayments.length === 0) return;
      
      // Process each failed payment
      for (const payment of failedPayments) {
        try {
          // Attempt to send payment again
          await this.sendPayment(
            payment.provider, 
            payment.recipient_account, 
            payment.amount
          );
          
          // If successful, delete from failed_payments
          await supabase
            .from('failed_payments')
            .delete()
            .eq('id', payment.id);
            
        } catch (retryError) {
          // Update retry count
          await supabase
            .from('failed_payments')
            .update({
              retry_count: payment.retry_count + 1,
              last_retry: new Date().toISOString(),
              error_message: (retryError as Error).message
            })
            .eq('id', payment.id);
        }
      }
    } catch (error) {
      console.error('Error retrying failed payments:', error);
      throw error;
    }
  }
  
  // Get payment statistics for admin dashboard
  async getPaymentStats(): Promise<{
    totalPaidOut: number;
    pendingPayments: number;
    failedPayments: number;
  }> {
    try {
      // Get total paid out
      const { data: transactions, error: transactionError } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'completed');
      
      if (transactionError) throw transactionError;
      
      // Get pending pools
      const { data: pendingPools, error: pendingError } = await supabase
        .from('weekly_pools')
        .select('total_amount')
        .eq('status', 'completed');
      
      if (pendingError) throw pendingError;
      
      // Get failed payments
      const { data: failedPaymentsData, error: failedError } = await supabase
        .from('failed_payments')
        .select('amount');
      
      if (failedError) throw failedError;
      
      // Calculate totals
      const totalPaidOut = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const pendingPayments = pendingPools?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
      const failedPayments = failedPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      
      return {
        totalPaidOut,
        pendingPayments,
        failedPayments
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }
}

export const payoutService = new PayoutService();