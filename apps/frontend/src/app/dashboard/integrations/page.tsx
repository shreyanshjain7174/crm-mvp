'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Mail, 
  Calendar, 
  Database, 
  Phone, 
  FileText, 
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  Link2
} from 'lucide-react';
import { useUserProgressStore, useCanAccessFeature } from '@/stores/userProgress';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'messaging' | 'email' | 'calendar' | 'data' | 'automation';
  status: 'connected' | 'available' | 'premium';
  featured: boolean;
  setupComplexity: 'easy' | 'medium' | 'advanced';
}

// Icon mapping for integrations
const iconMap: Record<string, any> = {
  whatsapp: MessageSquare,
  gmail: Mail,
  'google-calendar': Calendar,
  'csv-import': FileText,
  zapier: Zap,
  voip: Phone,
};

const categoryIcons = {
  messaging: MessageSquare,
  email: Mail,
  calendar: Calendar,
  data: Database,
  automation: Zap,
};

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [summary, setSummary] = useState({ total: 0, connected: 0, available: 0, premium: 0 });
  const canAccessIntegrations = useCanAccessFeature()('integrations:view');
  const { toast } = useToast();

  // Fetch integrations from API
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getIntegrations();
        if (response) {
          setIntegrations(response.integrations.map((integration: any) => ({
            id: integration.id,
            name: integration.name,
            description: integration.description,
            icon: iconMap[integration.id] || Link2,
            category: integration.category as 'messaging' | 'email' | 'calendar' | 'data' | 'automation',
            status: integration.status as 'connected' | 'available' | 'premium',
            featured: integration.featured,
            setupComplexity: integration.setupComplexity as 'easy' | 'medium' | 'advanced'
          })));
          setSummary(response.summary);
        }
      } catch (error) {
        console.error('Failed to fetch integrations:', error);
        toast({
          title: "Error",
          description: "Failed to load integrations. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (canAccessIntegrations) {
      fetchIntegrations();
    }
  }, [canAccessIntegrations, toast]);

  // Handle integration connection
  const handleConnect = async (integrationId: string) => {
    try {
      setConnectingId(integrationId);
      await apiClient.connectIntegration({ integrationId });
      
      // Update local state
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'connected' as const }
          : integration
      ));
      
      toast({
        title: "Success",
        description: `${integrations.find(i => i.id === integrationId)?.name} connected successfully!`
      });
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect integration",
        variant: "destructive"
      });
    } finally {
      setConnectingId(null);
    }
  };

  // Handle integration disconnection
  const handleDisconnect = async (integrationId: string) => {
    try {
      await apiClient.disconnectIntegration(integrationId);
      
      // Update local state
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'available' as const }
          : integration
      ));
      
      toast({
        title: "Disconnected",
        description: `${integrations.find(i => i.id === integrationId)?.name} disconnected successfully.`
      });
    } catch (error) {
      console.error('Disconnection failed:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect integration",
        variant: "destructive"
      });
    }
  };

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrations.length },
    { id: 'messaging', name: 'Messaging', count: integrations.filter(i => i.category === 'messaging').length },
    { id: 'email', name: 'Email', count: integrations.filter(i => i.category === 'email').length },
    { id: 'calendar', name: 'Calendar', count: integrations.filter(i => i.category === 'calendar').length },
    { id: 'data', name: 'Data', count: integrations.filter(i => i.category === 'data').length },
    { id: 'automation', name: 'Automation', count: integrations.filter(i => i.category === 'automation').length },
  ];

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'available': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'available': return <Plus className="h-4 w-4" />;
      case 'premium': return <Zap className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!canAccessIntegrations) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Link2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Integrations Coming Soon</h2>
          <p className="text-muted-foreground mb-6">
            Connect your CRM with your favorite apps and services. Unlock this feature by using more CRM functions.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your CRM with external services to streamline your workflow
          </p>
        </div>
        <Button>
          <ExternalLink className="h-4 w-4 mr-2" />
          Browse All Integrations
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.connected}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.available}
                </p>
              </div>
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.premium}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            {category.id !== 'all' && React.createElement(categoryIcons[category.id as keyof typeof categoryIcons], { className: "h-4 w-4" })}
            {category.name}
            <Badge variant="secondary" className="ml-1">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading integrations...</span>
        </div>
      ) : (
        <>
          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => {
          const IconComponent = integration.icon;
          return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      {integration.featured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(integration.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(integration.status)}
                      <span className="capitalize">{integration.status}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Setup:</span>
                    <Badge variant="outline" className="text-xs">
                      {integration.setupComplexity}
                    </Badge>
                  </div>
                  
                  {integration.status === 'connected' ? (
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={true} 
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            handleDisconnect(integration.id);
                          }
                        }}
                      />
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant={integration.status === 'premium' ? 'default' : 'outline'}
                      onClick={() => handleConnect(integration.id)}
                      disabled={connectingId === integration.id}
                    >
                      {connectingId === integration.id ? (
                        'Connecting...'
                      ) : (
                        integration.status === 'premium' ? 'Upgrade' : 'Connect'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
            })}
          </div>
        </>
      )}

      {/* CSV Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Sample CRM Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Get started quickly with sample CRM data. Import contacts, leads, and sales data to test the system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Customer Data (100-2M records)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Includes: Customer ID, Name, Company, Contact Info, Location
              </p>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Download Sample
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Sales Leads Data</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Includes: Lead Owner, Contact Info, Source, Deal Stage, Notes
              </p>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Download Sample
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}