'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Video, Phone, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProgressStore } from '@/stores/userProgress';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'meeting' | 'call' | 'demo' | 'follow-up' | 'internal';
  attendees: { name: string; avatar?: string }[];
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Product Demo - Priya Sharma',
    description: 'CRM platform demonstration and Q&A session',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    date: '2024-01-15',
    type: 'demo',
    attendees: [
      { name: 'Priya Sharma' },
      { name: 'You' }
    ],
    isOnline: true,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    status: 'confirmed',
  },
  {
    id: '2',
    title: 'Follow-up Call - Rajesh Kumar',
    description: 'Discuss pricing and implementation timeline',
    startTime: '2:30 PM',
    endTime: '3:00 PM',
    date: '2024-01-15',
    type: 'follow-up',
    attendees: [
      { name: 'Rajesh Kumar' },
      { name: 'You' }
    ],
    isOnline: false,
    location: 'Phone Call',
    status: 'confirmed',
  },
  {
    id: '3',
    title: 'Team Standup',
    description: 'Daily team sync and updates',
    startTime: '9:00 AM',
    endTime: '9:30 AM',
    date: '2024-01-16',
    type: 'internal',
    attendees: [
      { name: 'Team Lead' },
      { name: 'Dev Team' },
      { name: 'You' }
    ],
    isOnline: true,
    status: 'confirmed',
  },
  {
    id: '4',
    title: 'Client Onboarding - Anita Patel',
    description: 'Setup and configuration walkthrough',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    date: '2024-01-16',
    type: 'meeting',
    attendees: [
      { name: 'Anita Patel' },
      { name: 'Technical Team' },
      { name: 'You' }
    ],
    isOnline: true,
    meetingLink: 'https://zoom.us/j/123456789',
    status: 'pending',
  },
];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const canAccessFeature = useUserProgressStore(state => state.canAccessFeature);
  const hasCalendarAccess = canAccessFeature('calendar:view');

  if (!hasCalendarAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Schedule and manage meetings, calls, and appointments</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Calendar Feature Locked
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Schedule meetings and track appointments. This feature unlocks after you've engaged with leads and started building your pipeline.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/pipeline'}>
              View Your Pipeline
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: string) => {
    return mockEvents.filter(event => event.date === date);
  };

  const todayEvents = getEventsForDate(formatDate(new Date()));
  const upcomingEvents = mockEvents.slice(0, 3);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    const colors = {
      meeting: 'bg-blue-500',
      call: 'bg-green-500',
      demo: 'bg-purple-500',
      'follow-up': 'bg-orange-500',
      internal: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3 h-3" />;
      case 'demo':
        return <Video className="w-3 h-3" />;
      case 'meeting':
        return <Users className="w-3 h-3" />;
      default:
        return <CalendarIcon className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and appointments</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                  <TabsList>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="day">Day</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'month' && (
                <div className="grid grid-cols-7 gap-1">
                  {/* Week headers */}
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {getDaysInMonth().map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-2 h-20"></div>;
                    }
                    
                    const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                    const dayEvents = getEventsForDate(dateStr);
                    const isToday = dateStr === formatDate(new Date());
                    const isSelected = dateStr === formatDate(selectedDate);
                    
                    return (
                      <motion.div
                        key={day}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                        className={`
                          p-2 h-20 border border-border rounded-lg cursor-pointer transition-colors
                          ${isToday ? 'bg-primary text-primary-foreground' : ''}
                          ${isSelected && !isToday ? 'bg-accent' : ''}
                          hover:bg-accent/50
                        `}
                      >
                        <div className="text-sm font-medium mb-1">{day}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`
                                text-xs px-1 py-0.5 rounded truncate
                                ${getEventTypeColor(event.type)} text-white
                              `}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map(event => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getEventTypeColor(event.type)}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{event.title}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.isOnline && event.meetingLink && (
                            <div className="flex items-center space-x-2 text-sm text-primary mt-1">
                              <Video className="w-3 h-3" />
                              <span>Online Meeting</span>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No events today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50">
                    <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date} at {event.startTime}</p>
                    </div>
                    <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                      {event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Video className="w-4 h-4 mr-2" />
                Schedule Demo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="w-4 h-4 mr-2" />
                Book Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Team Meeting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}