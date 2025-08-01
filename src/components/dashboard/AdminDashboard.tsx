import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Shield } from 'lucide-react';
import { CreatePolicyDialog } from '@/components/policies/CreatePolicyDialog';
import { PoliciesList } from '@/components/policies/PoliciesList';
import { toast } from '@/hooks/use-toast';

export const AdminDashboard = () => {
  const [policies, setPolicies] = useState([]);
  const [users, setUsers] = useState([]);
  const [userPolicies, setUserPolicies] = useState([]);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch policies
      const { data: policiesData, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;
      setPolicies(policiesData || []);

      // Fetch user profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch user policies
      const { data: userPoliciesData, error: userPoliciesError } = await supabase
        .from('user_policies')
        .select(`
          *,
          policy:policies(name),
          profile:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (userPoliciesError) throw userPoliciesError;
      setUserPolicies(userPoliciesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyCreated = () => {
    setShowCreatePolicy(false);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage policies and monitor user activities</p>
        </div>
        <Button onClick={() => setShowCreatePolicy(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-xs text-muted-foreground">
              Active insurance products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userPolicies.filter(up => up.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active policies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Policies Management */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Policies</CardTitle>
          <CardDescription>
            Manage your insurance products and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PoliciesList policies={policies} onUpdate={fetchDashboardData} />
        </CardContent>
      </Card>

      <CreatePolicyDialog
        open={showCreatePolicy}
        onOpenChange={setShowCreatePolicy}
        onPolicyCreated={handlePolicyCreated}
      />
    </div>
  );
};