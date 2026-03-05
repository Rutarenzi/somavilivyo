import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TokenUsage {
  currentMonthUsage: number;
  monthlyLimit: number;
  percentageUsed: number;
  planName: string;
  tokensRemaining: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  monthly_token_limit: number;
  price_monthly: number;
  features: any; // JSON type from database
  is_active: boolean;
}

export function useTokenUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchTokenUsage();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTokenUsage, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchTokenUsage = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_user_token_usage', {
        target_user_id: user.id
      });

      if (rpcError) {
        console.error('Error fetching token usage:', rpcError);
        setError(rpcError.message);
        return;
      }

      if (data && data.length > 0) {
        setUsage({
          currentMonthUsage: data[0].current_month_usage,
          monthlyLimit: data[0].monthly_limit,
          percentageUsed: Number(data[0].percentage_used),
          planName: data[0].plan_name,
          tokensRemaining: data[0].tokens_remaining,
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching token usage:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refreshUsage = () => {
    fetchTokenUsage();
  };

  return {
    usage,
    loading,
    error,
    refreshUsage,
  };
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (fetchError) {
        console.error('Error fetching subscription plans:', fetchError);
        setError(fetchError.message);
        return;
      }

      setPlans(data || []);
    } catch (err) {
      console.error('Unexpected error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    plans,
    loading,
    error,
  };
}

export function useTokenHistory(limit: number = 50) {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchHistory();
  }, [user, limit]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_token_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        console.error('Error fetching token history:', fetchError);
        setError(fetchError.message);
        return;
      }

      setHistory(data || []);
    } catch (err) {
      console.error('Unexpected error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    history,
    loading,
    error,
    refreshHistory: fetchHistory,
  };
}
