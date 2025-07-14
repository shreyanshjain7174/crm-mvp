'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, MessageCircle, Target, DollarSign, Calendar, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-600">Performance insights and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹2,45,000</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 ml-1">+15.3%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">24.8%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 ml-1">+2.1%</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">2.4 min</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 ml-1">-18%</span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Leads</p>
                <p className="text-2xl font-bold">1,234</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 ml-1">+8.2%</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { source: 'WhatsApp', count: 1250, percentage: 45, color: 'bg-green-500' },
                { source: 'Website', count: 890, percentage: 32, color: 'bg-blue-500' },
                { source: 'Referral', count: 456, percentage: 16, color: 'bg-purple-500' },
                { source: 'Social Media', count: 234, percentage: 7, color: 'bg-pink-500' },
              ].map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium">{item.source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'January', leads: 245, converted: 59, rate: 24.1 },
                { month: 'February', leads: 289, converted: 73, rate: 25.3 },
                { month: 'March', leads: 321, converted: 87, rate: 27.1 },
                { month: 'April', leads: 298, converted: 74, rate: 24.8 },
              ].map((item) => (
                <div key={item.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.month}</p>
                    <p className="text-sm text-gray-600">{item.leads} leads</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{item.converted} converted</p>
                    <p className="text-sm text-gray-600">{item.rate}% rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">Response Accuracy</h3>
              <p className="text-3xl font-bold text-primary mt-2">89.5%</p>
              <p className="text-sm text-gray-600 mt-1">+3.2% this month</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">Messages Generated</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">2,847</p>
              <p className="text-sm text-gray-600 mt-1">+12% this month</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">Approval Rate</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">92.3%</p>
              <p className="text-sm text-gray-600 mt-1">+1.8% this month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Response Time Optimization</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Leads who receive responses within 5 minutes have 3x higher conversion rates.
                  Consider enabling auto-responses for common queries.
                </p>
                <Badge className="mt-2 bg-blue-100 text-blue-800">High Impact</Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Lead Scoring Accuracy</h4>
                <p className="text-sm text-green-700 mt-1">
                  AI-scored leads above 80% have a 45% conversion rate vs 12% for manual scoring.
                  Trust the AI recommendations more.
                </p>
                <Badge className="mt-2 bg-green-100 text-green-800">Proven</Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <MessageCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Follow-up Timing</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Leads from WhatsApp respond best to follow-ups between 10-11 AM and 4-5 PM.
                  Schedule your outreach accordingly.
                </p>
                <Badge className="mt-2 bg-yellow-100 text-yellow-800">Timing</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}