import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from "@/components/ui/label";
import { 
  Route, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  LogOut, 
  User, 
  Navigation,
  Truck,
  ClipboardCheck,
  Shield,
  Play,
  Square,
  Recycle,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '../App';
import { toast } from 'sonner';

const WorkerDashboard = () => {
  const { user, logout } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState(null);
  const [checklist, setChecklist] = useState({
    safety_gear: false,
    vehicle_inspection: false,
    equipment_check: false,
    route_reviewed: false
  });
  const [locationTracking, setLocationTracking] = useState(false);

  const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      const [routesRes, complaintsRes, binsRes] = await Promise.all([
        fetch(`${API_BASE}/routes`, { headers }),
        fetch(`${API_BASE}/complaints`, { headers }),
        fetch(`${API_BASE}/bins`, { headers })
      ]);

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData);
        // Find active route
        const active = routesData.find(r => r.status === 'in_progress');
        setActiveRoute(active);
      }
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());
      if (binsRes.ok) setBins(await binsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const startRoute = async (routeId) => {
    try {
      const response = await fetch(`${API_BASE}/routes/${routeId}/start`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Route started successfully!');
        setLocationTracking(true);
        fetchData();
        startLocationTracking();
      } else {
        throw new Error('Failed to start route');
      }
    } catch (error) {
      console.error('Error starting route:', error);
      toast.error('Failed to start route');
    }
  };

  const startLocationTracking = () => {
    // Simulate GPS tracking
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation(position.coords.latitude, position.coords.longitude);
          },
          () => {
            // Fallback to mock coordinates
            const mockLat = 40.7505 + (Math.random() - 0.5) * 0.01;
            const mockLng = -73.9934 + (Math.random() - 0.5) * 0.01;
            updateLocation(mockLat, mockLng);
          }
        );
      }
    }, 30000); // Update every 30 seconds

    // Store interval ID to clear later
    window.locationInterval = interval;
  };

  const updateLocation = async (latitude, longitude) => {
    try {
      await fetch(`${API_BASE}/tracking/location`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const updateBinStatus = async (binId, status, fillLevel) => {
    try {
      const response = await fetch(`${API_BASE}/bins/${binId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status,
          fill_level: fillLevel
        })
      });

      if (response.ok) {
        toast.success('Bin status updated successfully!');
        fetchData();
      } else {
        throw new Error('Failed to update bin status');
      }
    } catch (error) {
      console.error('Error updating bin status:', error);
      toast.error('Failed to update bin status');
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success('Complaint status updated successfully!');
        fetchData();
      } else {
        throw new Error('Failed to update complaint status');
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
      toast.error('Failed to update complaint status');
    }
  };

  const checklistItems = [
    { key: 'safety_gear', label: 'Safety gear equipped (gloves, vest, helmet)' },
    { key: 'vehicle_inspection', label: 'Vehicle safety inspection completed' },
    { key: 'equipment_check', label: 'Collection equipment checked and ready' },
    { key: 'route_reviewed', label: 'Daily route reviewed and understood' }
  ];

  const isChecklistComplete = Object.values(checklist).every(Boolean);
  const openComplaints = complaints.filter(c => c.status === 'open');
  const myRoutes = routes.filter(r => r.worker_id === user.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50" data-testid="worker-dashboard">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">CleanCity Connect</h1>
                <p className="text-sm text-slate-600">Worker Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {locationTracking && (
                <Badge className="bg-green-100 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  GPS Active
                </Badge>
              )}
              <Badge variant="secondary" className="capitalize">
                <User className="h-3 w-3 mr-1" />
                {user.name}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                data-testid="logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Route className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">My Routes</p>
                  <p className="text-2xl font-bold text-slate-900">{myRoutes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Open Issues</p>
                  <p className="text-2xl font-bold text-slate-900">{openComplaints.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Recycle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Bins to Collect</p>
                  <p className="text-2xl font-bold text-slate-900">{bins.filter(b => b.fill_level > 70).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Route</p>
                  <p className="text-lg font-bold text-slate-900">
                    {activeRoute ? 'In Progress' : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Checklist */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-teal-600" />
              <span>Daily Safety Checklist</span>
              {isChecklistComplete && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={item.key}
                    checked={checklist[item.key]}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({...prev, [item.key]: checked}))
                    }
                    data-testid={`checklist-${item.key}`}
                  />
                  <Label htmlFor={item.key} className="text-sm font-medium">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
            {!isChecklistComplete && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-orange-800">
                    Please complete all safety checks before starting your route
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="routes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="routes" data-testid="routes-tab">My Routes</TabsTrigger>
            <TabsTrigger value="collection" data-testid="collection-tab">Collection</TabsTrigger>
            <TabsTrigger value="issues" data-testid="issues-tab">Issues</TabsTrigger>
            <TabsTrigger value="navigation" data-testid="navigation-tab">Navigation</TabsTrigger>
          </TabsList>

          {/* Routes Tab */}
          <TabsContent value="routes">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Collection Routes</CardTitle>
              </CardHeader>
              <CardContent>
                {myRoutes.length === 0 ? (
                  <div className="text-center py-8">
                    <Route className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No routes assigned</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRoutes.map((route) => (
                      <div key={route.id} className="p-6 border border-slate-200 rounded-lg space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">{route.route_name}</h3>
                            <p className="text-sm text-slate-600">
                              {route.bin_ids?.length || 0} collection points • Est. {route.estimated_duration} minutes
                            </p>
                          </div>
                          <Badge className={`
                            ${route.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${route.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                            ${route.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                          `}>
                            {route.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {route.status === 'pending' && (
                          <div className="flex items-center space-x-4">
                            <Button 
                              onClick={() => startRoute(route.id)}
                              disabled={!isChecklistComplete}
                              className="bg-teal-600 hover:bg-teal-700"
                              data-testid={`start-route-${route.id}`}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Route
                            </Button>
                            {!isChecklistComplete && (
                              <p className="text-sm text-orange-600">
                                Complete safety checklist to start
                              </p>
                            )}
                          </div>
                        )}
                        
                        {route.status === 'in_progress' && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <p className="text-blue-800 font-medium">Route in progress</p>
                            </div>
                            <p className="text-sm text-blue-600">
                              Started: {route.start_time ? new Date(route.start_time).toLocaleTimeString() : 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collection Tab */}
          <TabsContent value="collection">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Bin Collection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bins.filter(bin => bin.fill_level > 50).map((bin) => (
                    <div key={bin.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-slate-900">{bin.location_name}</h3>
                          <p className="text-sm text-slate-600">{bin.zone}</p>
                        </div>
                        <Badge className={`
                          ${bin.fill_level <= 25 ? 'bg-green-100 text-green-700' : ''}
                          ${bin.fill_level > 25 && bin.fill_level <= 75 ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${bin.fill_level > 75 ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {bin.fill_level}% full
                        </Badge>
                      </div>
                      
                      <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                        <div 
                          className={`h-3 rounded-full ${
                            bin.fill_level <= 25 ? 'bg-green-500' :
                            bin.fill_level <= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{width: `${bin.fill_level}%`}}
                        ></div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateBinStatus(bin.id, 'empty', 0)}
                          data-testid={`mark-collected-${bin.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Collected
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateBinStatus(bin.id, 'overflowing', 100)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Report Issue
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Reported Issues</CardTitle>
              </CardHeader>
              <CardContent>
                {openComplaints.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-slate-600">No open issues in your area</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {openComplaints.map((complaint) => (
                      <div key={complaint.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-slate-900">{complaint.title}</h3>
                          <Badge className={`
                            ${complaint.priority === 'low' ? 'bg-green-100 text-green-700' : ''}
                            ${complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${complaint.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {complaint.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{complaint.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-slate-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {complaint.address}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                              data-testid={`take-issue-${complaint.id}`}
                            >
                              Take Issue
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                            >
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5 text-teal-600" />
                  <span>GPS Navigation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm text-teal-600 mb-2">🗺️ Interactive Navigation (Mock Implementation)</p>
                    <div className="bg-teal-100 p-6 rounded-lg text-center">
                      <Navigation className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                      <p className="text-teal-700 font-medium">GPS Navigation View</p>
                      <p className="text-sm text-teal-600 mt-2">
                        This would show turn-by-turn navigation with Google Maps integration
                      </p>
                    </div>
                  </div>

                  {activeRoute ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-900">Current Route: {activeRoute.route_name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 mb-1">Progress</p>
                          <p className="text-2xl font-bold text-slate-900">3/8 stops</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 mb-1">Next Stop</p>
                          <p className="font-medium text-slate-900">Downtown Bin #12</p>
                        </div>
                      </div>
                      
                      {locationTracking && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-green-800 font-medium">GPS tracking active</p>
                          </div>
                          <p className="text-sm text-green-600 mt-1">
                            Your location is being shared with dispatch for real-time monitoring
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Navigation className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Start a route to begin navigation</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WorkerDashboard;
