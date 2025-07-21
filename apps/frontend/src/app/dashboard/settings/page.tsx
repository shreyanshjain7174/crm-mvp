'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWhatsAppStatus } from '@/hooks/use-whatsapp-status';
import { DeleteAccountDialog } from '@/components/ui/delete-account-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Smartphone, 
  Bot, 
  Bell, 
  Users, 
  Shield, 
  Database,
  Palette,
  Globe,
  Save,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { status: whatsappStatus, loading: whatsappLoading, refresh: refreshWhatsApp } = useWhatsAppStatus();
  
  // WhatsApp form state
  const [whatsappSettings, setWhatsappSettings] = useState({
    businessPhone: '+91 98765 43210',
    displayName: 'CRM Business',
    welcomeMessage: 'Hi! Thanks for reaching out. We\'ll get back to you shortly.',
    businessAccountId: 'your-business-account-id',
    phoneNumberId: 'your-phone-number-id',
    autoReply: true,
    webhookStatus: true
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleWhatsAppSave = async () => {
    try {
      // Basic validation
      if (!whatsappSettings.businessPhone.trim()) {
        alert('Business phone number is required');
        return;
      }
      if (!whatsappSettings.displayName.trim()) {
        alert('Display name is required');
        return;
      }
      if (!whatsappSettings.businessAccountId.trim()) {
        alert('Business Account ID is required');
        return;
      }
      if (!whatsappSettings.phoneNumberId.trim()) {
        alert('Phone Number ID is required');
        return;
      }

      // TODO: Add API call to save WhatsApp settings
      // const response = await apiClient.updateWhatsAppSettings(whatsappSettings);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      alert('Failed to save WhatsApp settings. Please try again.');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: Users },
    { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone },
    { id: 'ai', name: 'AI Assistant', icon: Bot },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'data', name: 'Data & Backup', icon: Database },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'integrations', name: 'Integrations', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your CRM configuration and preferences</p>
        </div>
        {saved && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/5 border-r-2 border-r-primary text-primary'
                        : 'text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-medium">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{user?.name || 'User'}</h3>
                    <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.company || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue=""
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about yourself and your business..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium mb-4">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="bg-primary text-white">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'whatsapp' && (
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  whatsappLoading 
                    ? 'bg-gray-50' 
                    : whatsappStatus.connected 
                      ? 'bg-green-50' 
                      : 'bg-red-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      whatsappLoading 
                        ? 'bg-gray-400' 
                        : whatsappStatus.connected 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className={`font-medium ${
                        whatsappLoading 
                          ? 'text-gray-900' 
                          : whatsappStatus.connected 
                            ? 'text-green-900' 
                            : 'text-red-900'
                      }`}>
                        WhatsApp Business API
                      </p>
                      <p className={`text-sm ${
                        whatsappLoading 
                          ? 'text-gray-700' 
                          : whatsappStatus.connected 
                            ? 'text-green-700' 
                            : 'text-red-700'
                      }`}>
                        {whatsappLoading 
                          ? 'Checking connection...' 
                          : whatsappStatus.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      whatsappLoading 
                        ? 'bg-gray-100 text-gray-800' 
                        : whatsappStatus.connected 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                    }>
                      {whatsappLoading 
                        ? 'Checking...' 
                        : whatsappStatus.connected 
                          ? 'Connected' 
                          : 'Disconnected'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={refreshWhatsApp}>
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone Number
                    </label>
                    <input
                      type="text"
                      value={whatsappSettings.businessPhone}
                      onChange={(e) => setWhatsappSettings(prev => ({ ...prev, businessPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={whatsappSettings.displayName}
                      onChange={(e) => setWhatsappSettings(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    rows={3}
                    value={whatsappSettings.welcomeMessage}
                    onChange={(e) => setWhatsappSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium mb-4">Meta Business Account</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Connected to Meta Business Manager</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Your WhatsApp Business Account is connected and verified. All message templates and webhook endpoints are configured.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Account ID
                      </label>
                      <input
                        type="text"
                        value={whatsappSettings.businessAccountId}
                        onChange={(e) => setWhatsappSettings(prev => ({ ...prev, businessAccountId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={whatsappSettings.phoneNumberId}
                        onChange={(e) => setWhatsappSettings(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="auto-reply" 
                    checked={whatsappSettings.autoReply}
                    onChange={(e) => setWhatsappSettings(prev => ({ ...prev, autoReply: e.target.checked }))}
                  />
                  <label htmlFor="auto-reply" className="text-sm text-gray-700">
                    Enable automatic welcome messages for new conversations
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="webhook-status" 
                    checked={whatsappSettings.webhookStatus}
                    onChange={(e) => setWhatsappSettings(prev => ({ ...prev, webhookStatus: e.target.checked }))}
                  />
                  <label htmlFor="webhook-status" className="text-sm text-gray-700">
                    Real-time message webhook notifications
                  </label>
                </div>

                <Button onClick={handleWhatsAppSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save WhatsApp Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Confidence Threshold
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="70">70% - More responses, less accuracy</option>
                      <option value="80" selected>80% - Balanced (Recommended)</option>
                      <option value="90">90% - Fewer responses, high accuracy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Tone
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="professional">Professional</option>
                      <option value="friendly" selected>Friendly</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Context (helps AI understand your business)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue="We provide CRM solutions for small and medium businesses in India. Our focus is on WhatsApp integration and automated lead nurturing."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="auto-scoring" defaultChecked />
                    <label htmlFor="auto-scoring" className="text-sm text-gray-700">
                      Enable automatic lead scoring
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="auto-suggestions" defaultChecked />
                    <label htmlFor="auto-suggestions" className="text-sm text-gray-700">
                      Generate response suggestions automatically
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="auto-followup" />
                    <label htmlFor="auto-followup" className="text-sm text-gray-700">
                      Schedule automatic follow-ups for inactive leads
                    </label>
                  </div>
                </div>

                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save AI Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">New leads</p>
                        <p className="text-xs text-gray-500">Get notified when new leads are added</p>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">WhatsApp messages</p>
                        <p className="text-xs text-gray-500">Immediate notification for new messages</p>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">AI suggestions</p>
                        <p className="text-xs text-gray-500">When AI generates new suggestions</p>
                      </div>
                      <input type="checkbox" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Urgent leads</p>
                        <p className="text-xs text-gray-500">High-priority lead activities</p>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Follow-up reminders</p>
                        <p className="text-xs text-gray-500">Scheduled follow-up notifications</p>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Team Members</h3>
                    <p className="text-sm text-gray-600">Manage user access and permissions</p>
                  </div>
                  <Button>Add Member</Button>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Admin User', email: 'admin@company.com', role: 'Owner', status: 'Active' },
                    { name: 'Sales Manager', email: 'sales@company.com', role: 'Manager', status: 'Active' },
                    { name: 'Support Agent', email: 'support@company.com', role: 'Agent', status: 'Pending' },
                  ].map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {member.status}
                        </Badge>
                        <span className="text-sm text-gray-600">{member.role}</span>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other tabs content would be similar... */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Account Security Status: Good</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your account has strong security measures in place.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">SMS Authentication</p>
                      <p className="text-sm text-gray-600">Get verification codes via SMS</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Authenticator App</p>
                      <p className="text-sm text-gray-600">Use Google Authenticator or similar apps</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                      <Button variant="outline" size="sm">Setup</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Login Activity</h3>
                  <div className="space-y-3">
                    {[
                      { location: 'Mumbai, India', time: '2 hours ago', device: 'Chrome on Windows', current: true },
                      { location: 'Delhi, India', time: '1 day ago', device: 'Mobile App', current: false },
                      { location: 'Bangalore, India', time: '3 days ago', device: 'Safari on Mac', current: false },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{activity.location}</p>
                          <p className="text-sm text-gray-600">{activity.device} • {activity.time}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {activity.current && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                          {!activity.current && <Button variant="outline" size="sm">Revoke</Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle>Data & Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Last Backup: 2 hours ago</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Your data is automatically backed up every 6 hours.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Backup Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Automatic Backups</p>
                        <p className="text-xs text-gray-500">Create backups every 6 hours</p>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Include Message History</p>
                        <p className="text-xs text-gray-500">Backup all WhatsApp conversations</p>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Include AI Training Data</p>
                        <p className="text-xs text-gray-500">Backup AI model preferences</p>
                      </div>
                      <input type="checkbox" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Data Export</h3>
                  <p className="text-sm text-gray-600">Export your data in various formats for backup or migration purposes.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Export Contacts
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Export Messages
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Export Analytics
                    </Button>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Account
                  </Button>
                </div>

                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Backup Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-2 border-primary rounded-lg p-4 cursor-pointer">
                      <div className="w-full h-20 bg-white border rounded mb-3"></div>
                      <p className="text-sm font-medium text-center">Light Mode</p>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer">
                      <div className="w-full h-20 bg-gray-900 border rounded mb-3"></div>
                      <p className="text-sm font-medium text-center">Dark Mode</p>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer">
                      <div className="w-full h-20 bg-gradient-to-r from-white to-gray-900 border rounded mb-3"></div>
                      <p className="text-sm font-medium text-center">Auto</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Color Scheme</h3>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {[
                      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
                      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
                    ].map((color, index) => (
                      <div 
                        key={index}
                        className={`w-10 h-10 rounded-full cursor-pointer ${color} ${index === 0 ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Display Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Compact Mode</p>
                        <p className="text-xs text-gray-500">Reduce spacing and padding</p>
                      </div>
                      <input type="checkbox" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Show Animations</p>
                        <p className="text-xs text-gray-500">Enable UI animations and transitions</p>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">High Contrast</p>
                        <p className="text-xs text-gray-500">Improve accessibility with higher contrast</p>
                      </div>
                      <input type="checkbox" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>Third-party Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Communication Platforms</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">WhatsApp Business</p>
                          <p className="text-sm text-gray-600">Connected via Meta Cloud API</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Telegram Business</p>
                          <p className="text-sm text-gray-600">Business messaging via Telegram</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">CRM & Sales Tools</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Database className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Google Sheets</p>
                          <p className="text-sm text-gray-600">Export leads and analytics to Google Sheets</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Zapier</p>
                          <p className="text-sm text-gray-600">Connect with 5000+ apps via Zapier</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">AI & Analytics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">OpenAI GPT-4</p>
                          <p className="text-sm text-gray-600">AI-powered response generation</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Google Analytics</p>
                          <p className="text-sm text-gray-600">Track website visitor conversions</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Delete Account Dialog */}
      <DeleteAccountDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
      />
    </div>
  );
}