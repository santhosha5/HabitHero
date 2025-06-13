import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface PaymentMethod {
  id?: string;
  user_id: string;
  provider: 'venmo' | 'paypal';
  account_id: string;
  is_primary: boolean;
  created_at?: string;
}

export default function PaymentMethodForm() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newMethod, setNewMethod] = useState<Omit<PaymentMethod, 'user_id'>>({
    provider: 'venmo',
    account_id: '',
    is_primary: true,
  });

  // Fetch user's payment methods on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchPaymentMethods = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_payment_details')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setPaymentMethods(data || []);
        
        // If no primary payment method exists, make new one primary by default
        if (data && !data.some(method => method.is_primary)) {
          setNewMethod(prev => ({ ...prev, is_primary: true }));
        } else {
          setNewMethod(prev => ({ ...prev, is_primary: false }));
        }
      } catch (error: any) {
        console.error('Error fetching payment methods:', error);
        toast.error('Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentMethods();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      // If making this method primary, update all others to non-primary
      if (newMethod.is_primary && paymentMethods.length > 0) {
        const updates = paymentMethods
          .filter(method => method.is_primary)
          .map(method => ({
            ...method,
            is_primary: false
          }));
          
        if (updates.length > 0) {
          const { error } = await supabase
            .from('user_payment_details')
            .upsert(updates);
            
          if (error) throw error;
        }
      }
      
      // Add new payment method
      const { data, error } = await supabase
        .from('user_payment_details')
        .insert({
          user_id: user.id,
          provider: newMethod.provider,
          account_id: newMethod.account_id,
          is_primary: newMethod.is_primary
        })
        .select();
        
      if (error) throw error;
      
      // Update state with new payment method
      setPaymentMethods([...paymentMethods, data[0]]);
      
      // Reset form
      setNewMethod({
        provider: 'venmo',
        account_id: '',
        is_primary: false
      });
      
      toast.success('Payment method added successfully');
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast.error(error.message || 'Failed to add payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_payment_details')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security check
        
      if (error) throw error;
      
      // Update state by removing deleted method
      setPaymentMethods(paymentMethods.filter(method => method.id !== id));
      
      toast.success('Payment method removed successfully');
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      toast.error(error.message || 'Failed to remove payment method');
    }
  };

  const handleSetPrimary = async (id: string) => {
    if (!user) return;
    
    try {
      // Update all payment methods
      const updates = paymentMethods.map(method => ({
        ...method,
        is_primary: method.id === id
      }));
      
      const { error } = await supabase
        .from('user_payment_details')
        .upsert(updates);
        
      if (error) throw error;
      
      // Update state
      setPaymentMethods(updates);
      
      toast.success('Primary payment method updated');
    } catch (error: any) {
      console.error('Error updating primary payment method:', error);
      toast.error(error.message || 'Failed to update primary payment method');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-6">Payment Methods</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Existing Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Your Payment Methods</h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      method.is_primary ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <span className="font-medium capitalize">{method.provider}:</span>
                      <span className="ml-2">{method.account_id}</span>
                      {method.is_primary && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {!method.is_primary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(method.id!)}
                          className="px-2 py-1 text-xs text-primary-600 hover:text-primary-800 focus:outline-none"
                        >
                          Set as Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(method.id!)}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Payment Method Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium mb-3">Add Payment Method</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Provider
              </label>
              <select
                value={newMethod.provider}
                onChange={(e) => setNewMethod({ 
                  ...newMethod, 
                  provider: e.target.value as 'venmo' | 'paypal' 
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="venmo">Venmo</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {newMethod.provider === 'venmo' 
                  ? 'Venmo Username' 
                  : 'PayPal Email Address'}
              </label>
              <input
                type={newMethod.provider === 'paypal' ? 'email' : 'text'}
                value={newMethod.account_id}
                onChange={(e) => setNewMethod({ ...newMethod, account_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder={newMethod.provider === 'venmo' 
                  ? 'Your Venmo username' 
                  : 'your-email@example.com'}
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is-primary"
                checked={newMethod.is_primary}
                onChange={(e) => setNewMethod({ ...newMethod, is_primary: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is-primary" className="ml-2 block text-sm text-gray-700">
                Set as primary payment method
              </label>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isSaving ? 'Adding...' : 'Add Payment Method'}
              </button>
            </div>
          </form>
        </>
      )}
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          Your primary payment method will be used to receive weekly pool rewards.
          HabitHero uses secure connections to process all payments through Venmo and PayPal.
        </p>
      </div>
    </div>
  );
}