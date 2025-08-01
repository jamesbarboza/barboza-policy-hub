import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { Navbar } from '@/components/layout/Navbar';

export const Dashboard = () => {
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />}
      </main>
    </div>
  );
};