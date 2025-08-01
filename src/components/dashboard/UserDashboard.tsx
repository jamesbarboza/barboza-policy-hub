import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Shield, Calendar, DollarSign } from 'lucide-react';
import { PoliciesMarketplace } from '@/components/policies/PoliciesMarketplace';
import { toast } from '@/hooks/use-toast';

export const UserDashboard = () => {
  const { user } = useAuth();
  const [userPolicies, setUserPolicies] = useState([]);
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user's purchased policies
      const { data: userPoliciesData, error: userPoliciesError } = await supabase
        .from('user_policies')
        .select(`
          *,
          policy:policies(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (userPoliciesError) throw userPoliciesError;
      setUserPolicies(userPoliciesData || []);

      // Fetch available policies
      const { data: availablePoliciesData, error: availablePoliciesError } = await supabase
        .from('policies')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (availablePoliciesError) throw availablePoliciesError;
      setAvailablePolicies(availablePoliciesData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyPurchased = () => {
    fetchUserData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'expired':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">Manage your insurance policies and explore new coverage options</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPolicies.length}</div>
            <p className="text-xs text-muted-foreground">
              {userPolicies.filter(up => up.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userPolicies
                .filter(up => up.status === 'active')
                .reduce((sum, up) => sum + Number(up.policy?.coverage_amount || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined coverage amount
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Premium</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userPolicies
                .filter(up => up.status === 'active')
                .reduce((sum, up) => sum + Number(up.premium_paid || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total monthly payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Policies */}
      <Card>
        <CardHeader>
          <CardTitle>My Policies</CardTitle>
          <CardDescription>
            View and manage your current insurance policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userPolicies.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No policies yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by purchasing your first insurance policy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPolicies.map((userPolicy) => (
                <div key={userPolicy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{userPolicy.policy?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Coverage: ${Number(userPolicy.policy?.coverage_amount || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Premium: ${Number(userPolicy.premium_paid || 0).toLocaleString()}/month
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userPolicy.start_date} - {userPolicy.end_date}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(userPolicy.status)}>
                    {userPolicy.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Available Policies</CardTitle>
          <CardDescription>
            Explore new insurance options to protect what matters most
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PoliciesMarketplace 
            policies={availablePolicies} 
            onPolicyPurchased={handlePolicyPurchased}
          />
        </CardContent>
      </Card>
    </div>
  );
};