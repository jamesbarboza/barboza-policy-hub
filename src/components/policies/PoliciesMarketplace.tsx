import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Shield, Clock, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Policy {
  id: string;
  name: string;
  description: string;
  coverage_amount: number;
  premium_amount: number;
  duration_months: number;
  status: string;
}

interface PoliciesMarketplaceProps {
  policies: Policy[];
  onPolicyPurchased: () => void;
}

export const PoliciesMarketplace = ({ policies, onPolicyPurchased }: PoliciesMarketplaceProps) => {
  const { user } = useAuth();
  const [purchasingPolicy, setPurchasingPolicy] = useState<string | null>(null);

  const handlePurchasePolicy = async (policy: Policy) => {
    if (!user) return;

    setPurchasingPolicy(policy.id);
    try {
      // Calculate end date based on duration
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + policy.duration_months);

      const { error } = await supabase.from('user_policies').insert({
        user_id: user.id,
        policy_id: policy.id,
        status: 'pending',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        premium_paid: policy.premium_amount,
      });

      if (error) throw error;

      toast({
        title: 'Policy Purchased!',
        description: `You have successfully purchased ${policy.name}. Your policy is now pending activation.`,
      });

      onPolicyPurchased();
    } catch (error) {
      console.error('Error purchasing policy:', error);
      toast({
        title: 'Purchase Failed',
        description: 'There was an error purchasing this policy. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchasingPolicy(null);
    }
  };

  if (policies.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">No policies available</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          There are currently no insurance policies available for purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {policies.map((policy) => (
        <Card key={policy.id} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{policy.name}</CardTitle>
              <Badge variant="default">Available</Badge>
            </div>
            {policy.description && (
              <CardDescription>{policy.description}</CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Coverage</span>
                </div>
                <span className="text-lg font-bold">
                  ${Number(policy.coverage_amount).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Monthly Premium</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  ${Number(policy.premium_amount).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <span className="text-sm">
                  {policy.duration_months} months
                </span>
              </div>
            </div>
            
            <Button
              className="w-full"
              onClick={() => handlePurchasePolicy(policy)}
              disabled={purchasingPolicy === policy.id}
            >
              {purchasingPolicy === policy.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase Policy
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};