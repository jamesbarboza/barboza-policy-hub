import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, FileText, Shield, Search, User, Calendar, DollarSign } from 'lucide-react';
import { CreatePolicyDialog } from '@/components/policies/CreatePolicyDialog';
import { PoliciesList } from '@/components/policies/PoliciesList';
import { toast } from '@/hooks/use-toast';

export const AdminDashboard = () => {
  const [policies, setPolicies] = useState([]);
  const [users, setUsers] = useState([]);
  const [userPolicies, setUserPolicies] = useState([]);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Search functionality
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Test function to check available data
    testDatabaseData();
  }, []);

  const testDatabaseData = async () => {
    try {
      console.log('Testing database data...');
      
      // Test profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);
      
      console.log('Available profiles:', profiles);
      console.log('Profiles error:', profilesError);
      
      // Test user_policies table
      const { data: userPolicies, error: userPoliciesError } = await supabase
        .from('user_policies')
        .select('*')
        .limit(3);
      
      console.log('Available user policies:', userPolicies);
      console.log('User policies error:', userPoliciesError);
      
      // Test the specific user ID that's not being found
      const testUserId = 'a1816883-7a80-453f-8eb6-15b2dd91a083';
      console.log('Testing specific user ID:', testUserId);
      
      const { data: testProfile, error: testProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', testUserId)
        .maybeSingle();
      
      console.log('Test profile result:', { testProfile, testProfileError });
      
      const { data: testUserPolicy, error: testUserPolicyError } = await supabase
        .from('user_policies')
        .select('*')
        .eq('user_id', testUserId)
        .limit(1);
      
      console.log('Test user policy result:', { testUserPolicy, testUserPolicyError });
      
    } catch (error) {
      console.error('Error testing database:', error);
    }
  };

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

      // Fetch user policies with correct relationships
      const { data: userPoliciesData, error: userPoliciesError } = await supabase
        .from('user_policies')
        .select(`
          *,
          policy:policies(name, description, coverage_amount, premium_amount, duration_months)
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

  const searchUserByEmail = async () => {
    console.log('Search function called with:', searchEmail);
    
    if (!searchEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address or user ID',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    try {
      // Check if the input looks like a UUID (user ID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchEmail);
      console.log('Is UUID:', isUUID);
      
      let user = null;
      let profile = null;

      if (isUUID) {
        console.log('Searching by User ID:', searchEmail);
        // Search by user ID - try both profiles and user_policies tables
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', searchEmail)
          .maybeSingle();

        console.log('Profile search result:', { profileData, profileError });

        if (profileError) {
          console.error('Profile search error:', profileError);
          throw profileError;
        }
        
        if (profileData) {
          user = { id: searchEmail, email: searchEmail }; // Use searchEmail as placeholder
          profile = profileData;
          console.log('Found user by ID in profiles:', user);
        } else {
          // If not found in profiles, check if user exists in user_policies
          console.log('User not found in profiles, checking user_policies...');
          const { data: userPolicyData, error: userPolicyError } = await supabase
            .from('user_policies')
            .select('user_id')
            .eq('user_id', searchEmail)
            .limit(1);

          console.log('User policy check result:', { userPolicyData, userPolicyError });

          if (userPolicyData && userPolicyData.length > 0) {
            // User exists but no profile, create a minimal user object
            user = { id: searchEmail, email: 'No email available' };
            profile = { 
              user_id: searchEmail, 
              full_name: 'User (No Profile)', 
              created_at: new Date().toISOString() 
            };
            console.log('Found user by ID in user_policies:', user);
          }
        }
      } else {
        console.log('Searching by name/phone:', searchEmail);
        // Search by email pattern in profiles (partial match)
        // Since profiles table doesn't have email, we'll search by name/phone
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${searchEmail}%,phone.ilike.%${searchEmail}%`)
          .limit(5);

        console.log('Profiles search result:', { profiles, profilesError });

        if (profilesError) throw profilesError;

        if (profiles && profiles.length > 0) {
          // Use the first match
          user = { id: profiles[0].user_id, email: searchEmail };
          profile = profiles[0];
          console.log('Found user by name/phone:', user);
        }
      }

      if (!user) {
        console.log('No user found');
        toast({
          title: 'User Not Found',
          description: 'No user found. Try searching by User ID or name.',
          variant: 'destructive',
        });
        setSearching(false);
        return;
      }

      console.log('Fetching policies for user:', user.id);
      // Get user policies
      const { data: userPoliciesData, error: policiesError } = await supabase
        .from('user_policies')
        .select(`
          *,
          policy:policies(name, description, coverage_amount, premium_amount, duration_months)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Policies search result:', { userPoliciesData, policiesError });

      if (policiesError) throw policiesError;

      // Create the search results object
      const searchResultsData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: profile?.created_at || new Date().toISOString()
        },
        profile: {
          full_name: profile?.full_name || 'User (No Profile)',
          phone: profile?.phone || null,
          address: profile?.address || null,
          created_at: profile?.created_at || new Date().toISOString()
        },
        policies: userPoliciesData || []
      };

      console.log('Setting search results:', searchResultsData);
      setSearchResults(searchResultsData);

      console.log('Search completed successfully');
      toast({
        title: 'User Found',
        description: `Found user: ${searchResultsData.profile.full_name} with ${searchResultsData.policies.length} policies`,
      });

    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for user',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
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

      {/* User Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search User
          </CardTitle>
          <CardDescription>
            Search for a user by User ID or name and view all their policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-email">User ID or Name</Label>
              <Input
                id="search-email"
                type="text"
                placeholder="Enter User ID (UUID) or search by name/phone"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUserByEmail()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can search by User ID (UUID format) or by name/phone number
              </p>
            </div>
            <div className="flex items-end">
              <Button
                id='search-user-button'  
                onClick={searchUserByEmail} 
                disabled={searching || !searchEmail.trim()}
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle id="searched-user-details" className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details & Policies
            </CardTitle>
            <CardDescription>
              User information and all associated policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Debug info */}
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <strong>Debug Info:</strong> searchResults = {JSON.stringify(searchResults, null, 2)}
            </div>
            
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>User ID:</strong> {searchResults.user?.id || 'N/A'}</div>
                    <div><strong>Email:</strong> {searchResults.user?.email || 'N/A'}</div>
                    {searchResults.profile && (
                      <>
                        <div><strong>Full Name:</strong> {searchResults.profile.full_name || 'N/A'}</div>
                        {searchResults.profile.phone && (
                          <div><strong>Phone:</strong> {searchResults.profile.phone}</div>
                        )}
                        {searchResults.profile.address && (
                          <div><strong>Address:</strong> {searchResults.profile.address}</div>
                        )}
                        <div><strong>Profile Created:</strong> {searchResults.profile.created_at ? new Date(searchResults.profile.created_at).toLocaleDateString() : 'N/A'}</div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Policy Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Total Policies:</strong> {searchResults.policies?.length || 0}</div>
                    <div><strong>Active Policies:</strong> {searchResults.policies?.filter(p => p.status === 'active').length || 0}</div>
                    <div><strong>Pending Policies:</strong> {searchResults.policies?.filter(p => p.status === 'pending').length || 0}</div>
                    <div><strong>Total Coverage:</strong> ${searchResults.policies
                      ?.filter(p => p.status === 'active')
                      .reduce((sum, p) => sum + Number(p.policy?.coverage_amount || 0), 0)
                      .toLocaleString() || 0}</div>
                    <div><strong>Monthly Premium:</strong> ${searchResults.policies
                      ?.filter(p => p.status === 'active')
                      .reduce((sum, p) => sum + Number(p.premium_paid || 0), 0)
                      .toLocaleString() || 0}</div>
                  </div>
                </div>
              </div>

              {/* User Policies */}
              <div>
                <h4 className="font-semibold mb-4">User Policies</h4>
                {!searchResults.policies || searchResults.policies.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No policies found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This user hasn't purchased any policies yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchResults.policies.map((userPolicy) => (
                      <div key={userPolicy.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold">{userPolicy.policy?.name || 'Unknown Policy'}</h5>
                              <Badge variant={getStatusColor(userPolicy.status)}>
                                {userPolicy.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {userPolicy.policy?.description || 'No description available'}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="flex items-center gap-1">
                                  <Shield className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Coverage</span>
                                </div>
                                <div>${Number(userPolicy.policy?.coverage_amount || 0).toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Premium</span>
                                </div>
                                <div>${Number(userPolicy.premium_paid || 0).toLocaleString()}/month</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Duration</span>
                                </div>
                                <div>{userPolicy.policy?.duration_months || 12} months</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Period</span>
                                </div>
                                <div>{userPolicy.start_date} - {userPolicy.end_date}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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