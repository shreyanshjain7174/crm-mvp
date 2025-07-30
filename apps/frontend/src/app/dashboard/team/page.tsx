'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  joinedAt: string;
  lastActive: string;
  permissions: string[];
  stats: {
    leadsAssigned: number;
    leadsConverted: number;
    messagesHandled: number;
    callsMade: number;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  department: string;
  invitedBy: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState<string | null>(null);
  
  // Mock data - in production this would come from API
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@company.com',
      phone: '+91 98765 43210',
      role: 'owner',
      department: 'Management',
      status: 'active',
      joinedAt: '2024-01-15',
      lastActive: '2 minutes ago',
      permissions: ['all'],
      stats: {
        leadsAssigned: 0,
        leadsConverted: 0,
        messagesHandled: 0,
        callsMade: 0
      }
    },
    {
      id: '2',
      name: 'Priya Patel',
      email: 'priya.patel@company.com',
      phone: '+91 98765 43211',
      role: 'manager',
      department: 'Sales',
      status: 'active',
      joinedAt: '2024-02-01',
      lastActive: '15 minutes ago',
      permissions: ['leads:manage', 'messages:send', 'reports:view'],
      stats: {
        leadsAssigned: 45,
        leadsConverted: 12,
        messagesHandled: 156,
        callsMade: 34
      }
    },
    {
      id: '3',
      name: 'Amit Kumar',
      email: 'amit.kumar@company.com',
      phone: '+91 98765 43212',
      role: 'agent',
      department: 'Sales',
      status: 'active',
      joinedAt: '2024-02-15',
      lastActive: '1 hour ago',
      permissions: ['leads:view', 'messages:send', 'contacts:edit'],
      stats: {
        leadsAssigned: 32,
        leadsConverted: 8,
        messagesHandled: 89,
        callsMade: 23
      }
    },
    {
      id: '4',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@company.com',
      role: 'agent',
      department: 'Support',
      status: 'inactive',
      joinedAt: '2024-03-01',
      lastActive: '2 days ago',
      permissions: ['leads:view', 'messages:send'],
      stats: {
        leadsAssigned: 28,
        leadsConverted: 6,
        messagesHandled: 67,
        callsMade: 15
      }
    },
    {
      id: '5',
      name: 'Vikram Singh',
      email: 'vikram.singh@company.com',
      role: 'viewer',
      department: 'Analytics',
      status: 'pending',
      joinedAt: '2024-03-15',
      lastActive: 'Never',
      permissions: ['reports:view'],
      stats: {
        leadsAssigned: 0,
        leadsConverted: 0,
        messagesHandled: 0,
        callsMade: 0
      }
    }
  ]);

  const [invitations, setInvitations] = useState<TeamInvitation[]>([
    {
      id: '1',
      email: 'new.member@company.com',
      role: 'agent',
      department: 'Sales',
      invitedBy: 'Rahul Sharma',
      invitedAt: '2024-03-20',
      status: 'pending'
    }
  ]);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />;
      case 'manager': return <Users className="w-4 h-4 text-blue-600" />;
      case 'agent': return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'agent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleInviteMember = () => {
    // Mock invite functionality
    console.log('Opening invite modal');
    setShowInviteModal(true);
  };

  const handleResendInvitation = (invitationId: string) => {
    console.log('Resending invitation:', invitationId);
    // Mock resend logic
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    }
  };

  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const pendingInvitations = invitations.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members, roles, and permissions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Team Settings
          </Button>
          <Button onClick={handleInviteMember}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-foreground">{activeMembers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invitations</p>
                <p className="text-2xl font-bold text-foreground">{pendingInvitations}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(teamMembers.map(m => m.department)).size}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.phone && (
                      <p className="text-sm text-muted-foreground">{member.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={cn('text-xs', getRoleColor(member.role))}>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </div>
                </Badge>
                <Badge className={cn('text-xs', getStatusColor(member.status))}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(member.status)}
                    <span className="capitalize">{member.status}</span>
                  </div>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {member.department}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Leads Assigned</p>
                  <p className="font-medium text-foreground">{member.stats.leadsAssigned}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Converted</p>
                  <p className="font-medium text-foreground">{member.stats.leadsConverted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Messages</p>
                  <p className="font-medium text-foreground">{member.stats.messagesHandled}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Calls</p>
                  <p className="font-medium text-foreground">{member.stats.callsMade}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                <span>Last active: {member.lastActive}</span>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {member.role !== 'owner' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited as {invitation.role} • {invitation.department} • 
                        by {invitation.invitedBy} on {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={cn('text-xs', getStatusColor(invitation.status))}>
                      {invitation.status}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleResendInvitation(invitation.id)}>
                      <Send className="w-4 h-4 mr-2" />
                      Resend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No team members found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Invite your first team member to get started'
              }
            </p>
            {(!searchQuery && selectedRole === 'all' && selectedStatus === 'all') && (
              <Button onClick={handleInviteMember}>
                <Plus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Modal Placeholder */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input placeholder="member@company.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Department</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Mock invite logic
                  console.log('Sending invitation...');
                  setShowInviteModal(false);
                }}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}