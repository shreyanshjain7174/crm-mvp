'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LeadsPipeline() {
  const pipelineData = [
    { status: 'COLD', count: 1250, color: 'bg-blue-500' },
    { status: 'WARM', count: 890, color: 'bg-yellow-500' },
    { status: 'HOT', count: 456, color: 'bg-red-500' },
    { status: 'CONVERTED', count: 234, color: 'bg-green-500' },
  ];

  const total = pipelineData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pipelineData.map((item) => {
          const percentage = (item.count / total) * 100;
          return (
            <div key={item.status} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium">{item.status}</span>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Leads</span>
            <span className="font-medium">{total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}