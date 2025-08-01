import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Eye } from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  description: string;
  coverage_amount: number;
  premium_amount: number;
  duration_months: number;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  created_at: string;
}

interface PoliciesListProps {
  policies: Policy[];
  onUpdate: () => void;
}

export const PoliciesList = ({ policies, onUpdate }: PoliciesListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'expired':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (policies.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          <h3 className="text-lg font-semibold">No policies created yet</h3>
          <p className="text-sm mt-1">Create your first insurance policy to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {policies.map((policy) => (
        <Card key={policy.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{policy.name}</CardTitle>
              <Badge variant={getStatusColor(policy.status)}>
                {policy.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policy.description && (
                <p className="text-sm text-muted-foreground">{policy.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Coverage:</span> ${Number(policy.coverage_amount).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Premium:</span> ${Number(policy.premium_amount).toLocaleString()}/month
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {policy.duration_months} months
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  Created: {new Date(policy.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};