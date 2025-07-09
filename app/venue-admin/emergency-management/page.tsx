
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Phone, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle,
  Siren,
  Route,
  Radio
} from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isOnDuty: boolean;
  responseTime: number;
}

interface EmergencyProcedure {
  id: string;
  type: string;
  title: string;
  description: string;
  steps: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
}

interface EvacuationRoute {
  id: string;
  name: string;
  fromZone: string;
  toExit: string;
  capacity: number;
  isActive: boolean;
  estimatedTime: number;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Safety Manager',
    phone: '+1 (555) 123-4567',
    email: 'sarah.johnson@safeplay.com',
    isOnDuty: true,
    responseTime: 2
  },
  {
    id: '2',
    name: 'Mike Chen',
    role: 'Security Lead',
    phone: '+1 (555) 234-5678',
    email: 'mike.chen@safeplay.com',
    isOnDuty: true,
    responseTime: 3
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    role: 'Medical Officer',
    phone: '+1 (555) 345-6789',
    email: 'emily.rodriguez@safeplay.com',
    isOnDuty: false,
    responseTime: 5
  }
];

const EMERGENCY_PROCEDURES: EmergencyProcedure[] = [
  {
    id: '1',
    type: 'FIRE',
    title: 'Fire Emergency Response',
    description: 'Immediate response protocol for fire incidents',
    steps: [
      'Activate fire alarm system',
      'Evacuate all patrons to designated areas',
      'Contact emergency services (911)',
      'Perform headcount at assembly points',
      'Provide assistance to emergency responders'
    ],
    priority: 'high',
    estimatedTime: 10
  },
  {
    id: '2',
    type: 'MEDICAL',
    title: 'Medical Emergency Response',
    description: 'Protocol for medical emergencies and injuries',
    steps: [
      'Assess the situation and ensure scene safety',
      'Provide immediate first aid if trained',
      'Contact emergency medical services',
      'Notify parents/guardians',
      'Document incident details'
    ],
    priority: 'high',
    estimatedTime: 5
  },
  {
    id: '3',
    type: 'MISSING_CHILD',
    title: 'Missing Child Protocol',
    description: 'Systematic approach to locate missing children',
    steps: [
      'Immediately secure all exits',
      'Conduct systematic search of all areas',
      'Review security footage',
      'Contact local authorities if not found within 10 minutes',
      'Coordinate with emergency services'
    ],
    priority: 'high',
    estimatedTime: 15
  }
];

const EVACUATION_ROUTES: EvacuationRoute[] = [
  {
    id: '1',
    name: 'Main Exit Route',
    fromZone: 'Main Play Area',
    toExit: 'Main Entrance',
    capacity: 200,
    isActive: true,
    estimatedTime: 3
  },
  {
    id: '2',
    name: 'Emergency Exit A',
    fromZone: 'Toddler Zone',
    toExit: 'Side Exit A',
    capacity: 50,
    isActive: true,
    estimatedTime: 2
  },
  {
    id: '3',
    name: 'Emergency Exit B',
    fromZone: 'Party Rooms',
    toExit: 'Back Exit',
    capacity: 80,
    isActive: false,
    estimatedTime: 4
  }
];

export default function EmergencyManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Authorization check
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (!['VENUE_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role)) {
      router.push('/unauthorized');
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading emergency management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Management</h1>
          <p className="text-gray-600">Emergency procedures, contacts, and evacuation planning</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="destructive" 
            onClick={() => alert('Emergency alert would be triggered')}
          >
            <Siren className="h-4 w-4 mr-2" />
            Emergency Alert
          </Button>
        </div>
      </div>

      {/* Emergency Status */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Status:</strong> All emergency systems are operational. Last drill: 3 days ago. 
          Next scheduled drill: In 4 days.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Staff On Duty</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Active Routes</p>
                <p className="text-2xl font-bold text-green-600">2/3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Response Time</p>
                <p className="text-2xl font-bold text-purple-600">3min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">System Status</p>
                <p className="text-2xl font-bold text-green-600">OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="evacuation">Evacuation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>Key personnel for emergency response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {EMERGENCY_CONTACTS.slice(0, 3).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${contact.isOnDuty ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{contact.phone}</p>
                        <p className="text-xs text-gray-500">{contact.responseTime}min response</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Drills</CardTitle>
                <CardDescription>Emergency preparedness training history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Fire Evacuation Drill</p>
                      <p className="text-sm text-gray-600">3 days ago</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Passed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Medical Emergency Drill</p>
                      <p className="text-sm text-gray-600">1 week ago</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Passed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Missing Child Drill</p>
                      <p className="text-sm text-gray-600">2 weeks ago</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="procedures" className="mt-6">
          <div className="space-y-6">
            {EMERGENCY_PROCEDURES.map((procedure) => (
              <Card key={procedure.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {procedure.title}
                      </CardTitle>
                      <CardDescription>{procedure.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className={getPriorityColor(procedure.priority)}>
                        {procedure.priority.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        Est. {procedure.estimatedTime} min
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Response Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {procedure.steps.map((step, index) => (
                        <li key={index} className="text-gray-700">{step}</li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {EMERGENCY_CONTACTS.map((contact) => (
              <Card key={contact.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${contact.isOnDuty ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {contact.name}
                    </CardTitle>
                    <Badge variant="outline">{contact.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {contact.responseTime} minute response time
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {contact.isOnDuty ? 'Currently on duty' : 'Off duty'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evacuation" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evacuation Routes</CardTitle>
                <CardDescription>Planned evacuation paths and capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {EVACUATION_ROUTES.map((route) => (
                    <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${route.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">{route.name}</p>
                          <p className="text-sm text-gray-600">
                            {route.fromZone} → {route.toExit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Capacity: {route.capacity} people
                        </p>
                        <p className="text-xs text-gray-500">
                          {route.estimatedTime} min evacuation time
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
