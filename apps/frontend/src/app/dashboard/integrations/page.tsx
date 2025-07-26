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
  Link2,
  Upload
} from 'lucide-react';
import { useCanAccessFeature } from '@/stores/userProgress';
import { useIntegrations } from '@/hooks/use-integrations';
import { useToast } from '@/hooks/use-toast';

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
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const canAccessIntegrations = useCanAccessFeature()('integrations:view');
  const { toast } = useToast();
  
  // Use the new integrations hook
  const {
    integrations: rawIntegrations,
    stats,
    loading,
    error,
    connectIntegration: connectIntegrationAPI,
    disconnectIntegration: disconnectIntegrationAPI,
    refetch
  } = useIntegrations();

  // Map API integrations to component format
  const integrations = rawIntegrations.map((integration: any) => ({
    id: integration.id,
    name: integration.name,
    description: integration.description,
    icon: iconMap[integration.id] || Link2,
    category: integration.category as 'messaging' | 'email' | 'calendar' | 'data' | 'automation',
    status: integration.pricing === 'premium' ? 'premium' : integration.status as 'connected' | 'available' | 'premium',
    featured: integration.featured,
    setupComplexity: integration.setupComplexity as 'easy' | 'medium' | 'advanced'
  }));

  // Show error toast if there's an API error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load integrations. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Handle integration connection
  const handleConnect = async (integrationId: string) => {
    try {
      setConnectingId(integrationId);
      await connectIntegrationAPI({ integrationId });
      
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
      setDisconnectingId(integrationId);
      await disconnectIntegrationAPI(integrationId);
      
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
    } finally {
      setDisconnectingId(null);
    }
  };

  // Handle sample data import
  const handleSampleImport = async (dataType: 'customers' | 'leads') => {
    try {
      // Generate sample CSV data
      let sampleData = '';
      
      if (dataType === 'customers') {
        sampleData = `name,phone,email,company
John Smith,+1-555-0101,john.smith@example.com,Acme Corp
Jane Doe,+1-555-0102,jane.doe@techstart.io,TechStart
Michael Brown,+1-555-0103,m.brown@innovate.com,Innovate Inc
Sarah Wilson,+1-555-0104,sarah.w@digitalfirm.net,Digital Firm
David Chen,+1-555-0105,d.chen@globaltech.org,GlobalTech`;
      } else {
        sampleData = `name,phone,email,source,notes
Alex Johnson,+1-555-0201,alex.j@prospect.com,website,"Interested in premium package"
Lisa Martinez,+1-555-0202,lisa.m@potential.net,referral,"Referred by existing customer"
Robert Taylor,+1-555-0203,rob.taylor@leadgen.io,social media,"Found us on LinkedIn"
Emily Davis,+1-555-0204,emily.d@hotlead.com,trade show,"Met at Tech Conference 2024"
Thomas Anderson,+1-555-0205,t.anderson@matrix.com,email campaign,"Responded to newsletter"`;
      }

      // Convert to base64 for API
      const base64Data = btoa(sampleData);
      
      // Import via CSV integration
      const response = await fetch('/api/integrations/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          integrationId: 'csv-import',
          fileData: base64Data,
          fileName: `sample_${dataType}.csv`,
          mapping: {}
        })
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.data.imported} ${dataType} records successfully!`
      });

      // Refresh integrations data
      refetch();
    } catch (error) {
      console.error('Sample import failed:', error);
      toast({
        title: "Import Failed",
        description: `Failed to import sample ${dataType} data`,
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
                  {stats.connected}
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
                  {stats.available}
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
                  {stats.premium}
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
                        onCheckedChange={async (checked) => {
                          if (!checked && disconnectingId !== integration.id) {
                            await handleDisconnect(integration.id);
                          }
                        }}
                        disabled={disconnectingId === integration.id}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={disconnectingId === integration.id}
                      >
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
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSampleImport('customers')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Sample
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Sales Leads Data</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Includes: Lead Owner, Contact Info, Source, Deal Stage, Notes
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSampleImport('leads')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Sample
              </Button>
            </div>
          </div>
          
          {/* External Data Sources */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">External CRM Data Sources</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Download larger datasets from these trusted sources for comprehensive testing:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <a 
                href="https://www.datablist.com/learn/csv/download-sample-csv-files" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Datablist</p>
                  <p className="text-xs text-muted-foreground">100-2M customer records</p>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </a>
              
              <a 
                href="https://www.kaggle.com/datasets/kyanyoga/sample-sales-data" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Kaggle</p>
                  <p className="text-xs text-muted-foreground">Sales data (226k+ downloads)</p>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </a>
              
              <a 
                href="https://excelbianalytics.com/wp/downloads-sample-csv-files-data-sets-for-testing-sales/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Excel BI</p>
                  <p className="text-xs text-muted-foreground">Up to 5M sales records</p>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </a>
              
              <a 
                href="https://support.zendesk.com/hc/en-us/articles/4408828232986-Importing-bulk-CSV-data" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Zendesk</p>
                  <p className="text-xs text-muted-foreground">CSV templates</p>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </a>
              
              <a 
                href="https://www.briandunning.com/sample-data/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Brian Dunning</p>
                  <p className="text-xs text-muted-foreground">Quality test data</p>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}