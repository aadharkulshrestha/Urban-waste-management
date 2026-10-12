// AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Users,
  Truck,
  MapPin,
  Plus,
  Settings,
  LogOut,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Shield,
  Recycle,
  FileText,
} from "lucide-react";
import { useAuth } from "../App";
import { toast } from "sonner";

import { Navigation } from "lucide-react";
import MapView from "./MapView";
import { API_BASE } from "../config";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState({});
  const [users, setUsers] = useState([]);
  const [bins, setBins] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBinForm, setShowBinForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [binForm, setBinForm] = useState({
    location_name: "",
    zone: "",
    capacity: 100,
  });
  const [routeForm, setRouteForm] = useState({
    route_name: "",
    worker_id: "",
    bin_ids: [],
    estimated_duration: 240,
  });

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraBin, setCameraBin] = useState(null);
  const [cameraResult, setCameraResult] = useState(null);
  const [reuseResult, setReuseResult] = useState(null);
  const [cameraImgUrl, setCameraImgUrl] = useState(null);
  const [cameraKey, setCameraKey] = useState(0);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/workers`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          setWorkers(data);
        } else {
          console.warn("Workers API did not return an array:", data);
          setWorkers([]);
        }
      } catch (error) {
        console.error("Failed to fetch workers:", error);
      }
    };

    fetchWorkers();
  }, []);

  // Mock coordinates for different zones
  const getZoneCoordinates = (zone) => {
    const zones = {
      "Zone A": { lat: 40.7589, lng: -73.9851 },
      "Zone B": { lat: 40.7505, lng: -73.9934 },
      "Zone C": { lat: 40.7282, lng: -74.0776 },
      "Zone D": { lat: 40.7614, lng: -73.9776 },
    };
    return zones[zone] || zones["Zone A"];
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [
        analyticsRes,
        usersRes,
        binsRes,
        routesRes,
        complaintsRes,
        vehiclesRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/analytics/overview`, { headers }),
        fetch(`${API_BASE}/users/profile`, { headers }), // This will need to be expanded to get all users
        fetch(`${API_BASE}/bins`, { headers }),
        fetch(`${API_BASE}/routes`, { headers }),
        fetch(`${API_BASE}/complaints`, { headers }),
        fetch(`${API_BASE}/tracking/vehicles`, { headers }),
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (binsRes.ok) setBins(await binsRes.json());
      if (routesRes.ok) setRoutes(await routesRes.json());
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const initializeMockData = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/init-mock-data`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("Mock data initialized successfully!");
        fetchAllData();
      } else {
        throw new Error("Failed to initialize mock data");
      }
    } catch (error) {
      console.error("Error initializing mock data:", error);
      toast.error("Failed to initialize mock data");
    }
  };

  const handleCreateBin = async (e) => {
    e.preventDefault();
    try {
      const coords = getZoneCoordinates(binForm.zone);
      const binData = {
        ...binForm,
        latitude: coords.lat + (Math.random() - 0.5) * 0.01,
        longitude: coords.lng + (Math.random() - 0.5) * 0.01,
      };

      const response = await fetch(`${API_BASE}/bins`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(binData),
      });

      if (response.ok) {
        toast.success("Bin created successfully!");
        setShowBinForm(false);
        setBinForm({ location_name: "", zone: "", capacity: 100 });
        fetchAllData();
      } else {
        throw new Error("Failed to create bin");
      }
    } catch (error) {
      console.error("Error creating bin:", error);
      toast.error("Failed to create bin");
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/routes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(routeForm),
      });

      if (response.ok) {
        toast.success("Route created successfully!");
        setShowRouteForm(false);
        setRouteForm({
          route_name: "",
          worker_id: "",
          bin_ids: [],
          estimated_duration: 240,
        });
        fetchAllData();
      } else {
        throw new Error("Failed to create route");
      }
    } catch (error) {
      console.error("Error creating route:", error);
      toast.error("Failed to create route");
    }
  };

  const updateBinFillLevel = async (binId, fillLevel) => {
    try {
      const status =
        fillLevel <= 25
          ? "empty"
          : fillLevel <= 50
            ? "quarter"
            : fillLevel <= 75
              ? "half"
              : fillLevel <= 90
                ? "three_quarter"
                : "full";

      const response = await fetch(`${API_BASE}/bins/${binId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, fill_level: fillLevel }),
      });

      if (response.ok) {
        toast.success("Bin status updated!");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error updating bin:", error);
      toast.error("Failed to update bin");
    }
  };

  const CAMERA_URL = process.env.REACT_APP_CAMERA_URL || process.env.CAMERA_URL || "";

  const checkWaste = async (bin) => {
    setCameraBin(bin);
    setReuseResult(null);

    const res = await fetch(`${API_BASE}/camera/violation`, {
      method: "POST",
    });

    const data = await res.json();
    setCameraResult(data);
    setCameraOpen(true);
  };

  const getReuseSuggestion = async () => {
    const res = await fetch(`${API_BASE}/camera/reuse`);
    const data = await res.json();
    setReuseResult(data);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-700";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const refreshBins = async () => {
    try {
      const res = await fetch(`${API_BASE}/bins`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setBins(data);
      toast.success("Bin data refreshed");
    } catch (err) {
      toast.error("Failed to refresh bin data");
      console.error(err);
    }
  };

  const refreshCamera = () => {
    setCameraImgUrl(`${CAMERA_URL}?t=${Date.now()}`);
  };

  const zones = ["Zone A", "Zone B", "Zone C", "Zone D"];
  const openComplaints = complaints.filter((c) => c.status === "open");
  const criticalBins = bins.filter((b) => b.fill_level > 80);
  const activeRoutes = routes.filter((r) => r.status === "in_progress");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50"
      data-testid="admin-dashboard"
    >
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  CleanCity Connect
                </h1>
                <p className="text-sm text-slate-600">
                  Administrator Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={initializeMockData}
                data-testid="init-mock-data-btn"
              >
                <Settings className="h-4 w-4 mr-1" />
                Init Demo Data
              </Button>
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
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Bins
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics.total_bins || bins.length}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {analytics.bin_fill_rate?.toFixed(1) || 0}% avg fill rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Recycle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Open Complaints
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics.open_complaints || openComplaints.length}
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    <CheckCircle className="inline h-3 w-3 mr-1" />
                    {analytics.complaint_resolution_rate?.toFixed(1) || 0}%
                    resolved
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Active Routes
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics.active_routes || activeRoutes.length}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    <Activity className="inline h-3 w-3 mr-1" />
                    {routes.length} total routes
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Active Vehicles
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {vehicles.length}
                  </p>
                  <p className="text-sm text-teal-600 mt-1">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    GPS tracking
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        {(criticalBins.length > 0 || openComplaints.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {criticalBins.length > 0 && (
              <Card className="border-l-4 border-l-red-500 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Critical Bins ({criticalBins.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {criticalBins.slice(0, 3).map((bin) => (
                      <div
                        key={bin.id}
                        className="flex justify-between items-center p-2 bg-red-50 rounded"
                      >
                        <span className="text-sm font-medium">
                          {bin.location_name}
                        </span>
                        <Badge className="bg-red-100 text-red-700">
                          {bin.fill_level}% full
                        </Badge>
                      </div>
                    ))}
                    {criticalBins.length > 3 && (
                      <p className="text-sm text-slate-600">
                        +{criticalBins.length - 3} more require attention
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {openComplaints.length > 0 && (
              <Card className="border-l-4 border-l-orange-500 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-orange-700">
                    <FileText className="h-5 w-5" />
                    <span>Pending Complaints ({openComplaints.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {openComplaints.slice(0, 3).map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex justify-between items-center p-2 bg-orange-50 rounded"
                      >
                        <span className="text-sm font-medium">
                          {complaint.title}
                        </span>
                        <Badge
                          className={`
                          ${
                            complaint.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : ""
                          }
                          ${
                            complaint.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : ""
                          }
                          ${
                            complaint.priority === "low"
                              ? "bg-green-100 text-green-700"
                              : ""
                          }
                        `}
                        >
                          {complaint.priority}
                        </Badge>
                      </div>
                    ))}
                    {openComplaints.length > 3 && (
                      <p className="text-sm text-slate-600">
                        +{openComplaints.length - 3} more pending
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="overview-tab">
              Overview
            </TabsTrigger>
            <TabsTrigger value="bins" data-testid="bins-tab">
              Bins
            </TabsTrigger>
            <TabsTrigger value="routes" data-testid="routes-tab">
              Routes
            </TabsTrigger>
            <TabsTrigger value="complaints" data-testid="complaints-tab">
              Complaints
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* City Map Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>City Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-blue-700 font-medium mb-2">
                      Interactive City Map
                    </p>
                    <p className="text-sm text-blue-600">
                      Real-time view of all bins, routes, and vehicles across
                      the city
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-2 rounded">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                        <p>
                          Normal (
                          {bins.filter((b) => b.fill_level <= 70).length})
                        </p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                        <p>Critical ({criticalBins.length})</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeRoutes.slice(0, 3).map((route, index) => (
                      <div
                        key={route.id}
                        className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {route.route_name}
                          </p>
                          <p className="text-sm text-slate-600">In progress</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          Active
                        </Badge>
                      </div>
                    ))}

                    {complaints.slice(0, 2).map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg"
                      >
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {complaint.title}
                          </p>
                          <p className="text-sm text-slate-600">
                            {complaint.address}
                          </p>
                        </div>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bins Management Tab */}
          <TabsContent value="bins">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Bin Management
                </h2>
                <Button
                  variant="outline"
                  onClick={refreshBins}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  🔄 Refresh Bin Data
                </Button>
                <Dialog open={showBinForm} onOpenChange={setShowBinForm}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="add-bin-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Bin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Waste Bin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateBin} className="space-y-4">
                      <div>
                        <Label htmlFor="location_name">Location Name</Label>
                        <Input
                          id="location_name"
                          placeholder="e.g., Main Street Corner"
                          value={binForm.location_name}
                          onChange={(e) =>
                            setBinForm((prev) => ({
                              ...prev,
                              location_name: e.target.value,
                            }))
                          }
                          required
                          data-testid="bin-location-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zone">Zone</Label>
                        <Select
                          value={binForm.zone}
                          onValueChange={(value) =>
                            setBinForm((prev) => ({ ...prev, zone: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity (Liters)</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={binForm.capacity}
                          onChange={(e) =>
                            setBinForm((prev) => ({
                              ...prev,
                              capacity: parseInt(e.target.value),
                            }))
                          }
                          required
                          data-testid="bin-capacity-input"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        data-testid="create-bin-btn"
                      >
                        Create Bin
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold">
                            Location
                          </th>
                          <th className="text-left p-4 font-semibold">Zone</th>
                          <th className="text-left p-4 font-semibold">
                            Fill Level
                          </th>
                          <th className="text-left p-4 font-semibold">
                            Status
                          </th>
                          <th className="text-left p-4 font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bins.map((bin) => (
                          <tr
                            key={bin.id}
                            className="border-b hover:bg-slate-50"
                          >
                            <td className="p-4 font-medium">
                              {bin.location_name}
                            </td>
                            <td className="p-4 text-slate-600">{bin.zone}</td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-slate-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      bin.fill_level <= 25
                                        ? "bg-green-500"
                                        : bin.fill_level <= 75
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                    style={{ width: `${bin.fill_level}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">
                                  {bin.fill_level}%
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`
                                ${
                                  bin.fill_level <= 25
                                    ? "bg-green-100 text-green-700"
                                    : ""
                                }
                                ${
                                  bin.fill_level > 25 && bin.fill_level <= 75
                                    ? "bg-yellow-100 text-yellow-700"
                                    : ""
                                }
                                ${
                                  bin.fill_level > 75
                                    ? "bg-red-100 text-red-700"
                                    : ""
                                }
                              `}
                              >
                                {bin.status.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBinFillLevel(bin.id, 0)}
                                >
                                  Empty
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateBinFillLevel(bin.id, 100)
                                  }
                                >
                                  Fill
                                </Button>

                                <Button
                                  size="sm"
                                  className="bg-purple-600 text-white hover:bg-purple-700"
                                  onClick={() => checkWaste(bin)}
                                >
                                  📷 Check Waste
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Route Management
                </h2>
                <Dialog open={showRouteForm} onOpenChange={setShowRouteForm}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="add-route-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Route
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Collection Route</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateRoute} className="space-y-4">
                      <div>
                        <Label htmlFor="route_name">Route Name</Label>
                        <Input
                          id="route_name"
                          placeholder="e.g., Downtown Morning Route"
                          value={routeForm.route_name}
                          onChange={(e) =>
                            setRouteForm((prev) => ({
                              ...prev,
                              route_name: e.target.value,
                            }))
                          }
                          required
                          data-testid="route-name-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="worker_id">Select Worker</Label>
                        <select
                          id="worker_id"
                          className="border p-2 rounded w-full"
                          value={routeForm.worker_id}
                          onChange={(e) =>
                            setRouteForm((prev) => ({
                              ...prev,
                              worker_id: e.target.value,
                            }))
                          }
                          required
                        >
                          <option value="">Select a worker</option>
                          {Array.isArray(workers) && workers.length > 0 ? (
                            workers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.name} ({worker.id})
                              </option>
                            ))
                          ) : (
                            <option disabled>No workers found</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="estimated_duration">
                          Estimated Duration (minutes)
                        </Label>
                        <Input
                          id="estimated_duration"
                          type="number"
                          value={routeForm.estimated_duration}
                          onChange={(e) =>
                            setRouteForm((prev) => ({
                              ...prev,
                              estimated_duration: parseInt(e.target.value),
                            }))
                          }
                          required
                          data-testid="route-duration-input"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        data-testid="create-route-btn"
                      >
                        Create Route
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  {routes.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No routes created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {routes.map((route) => (
                        <div
                          key={route.id}
                          className="p-4 border border-slate-200 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {route.route_name}
                              </h3>
                              <p className="text-sm text-slate-600">
                                Worker: {route.worker_id} •{" "}
                                {route.estimated_duration} minutes
                              </p>
                            </div>
                            <Badge className={getStatusColor(route.status)}>
                              {route.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            <p>
                              Collection points: {route.bin_ids?.length || 0}
                            </p>
                            {route.start_time && (
                              <p>
                                Started:{" "}
                                {new Date(
                                  route.start_time,
                                ).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Citizen Complaints Management</CardTitle>
              </CardHeader>
              <CardContent>
                {complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No complaints reported</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="p-4 border border-slate-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {complaint.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {complaint.description}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge
                              className={`
                              ${
                                complaint.priority === "low"
                                  ? "bg-green-100 text-green-700"
                                  : ""
                              }
                              ${
                                complaint.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : ""
                              }
                              ${
                                complaint.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : ""
                              }
                            `}
                            >
                              {complaint.priority}
                            </Badge>
                            <Badge className={getStatusColor(complaint.status)}>
                              {complaint.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {complaint.address}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(
                                complaint.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {complaint.assigned_to && (
                            <span className="text-blue-600">
                              Assigned to: {complaint.assigned_to}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>System Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Collection Efficiency
                      </h3>
                      <p className="text-2xl font-bold text-blue-700">87%</p>
                      <p className="text-sm text-blue-600">
                        Average route completion rate
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">
                        Response Time
                      </h3>
                      <p className="text-2xl font-bold text-green-700">24min</p>
                      <p className="text-sm text-green-600">
                        Average complaint response
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2">
                        Coverage Area
                      </h3>
                      <p className="text-2xl font-bold text-purple-700">95%</p>
                      <p className="text-sm text-purple-600">
                        City area coverage
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-semibold text-orange-900 mb-2">
                        User Engagement
                      </h3>
                      <p className="text-2xl font-bold text-orange-700">
                        {analytics.total_users || "N/A"}
                      </p>
                      <p className="text-sm text-orange-600">
                        Active users this month
                      </p>
                    </div>

                    <div className="p-4 bg-teal-50 rounded-lg">
                      <h3 className="font-semibold text-teal-900 mb-2">
                        Cost Savings
                      </h3>
                      <p className="text-2xl font-bold text-teal-700">23%</p>
                      <p className="text-sm text-teal-600">
                        Reduction in operational costs
                      </p>
                    </div>

                    <div className="p-4 bg-pink-50 rounded-lg">
                      <h3 className="font-semibold text-pink-900 mb-2">
                        Waste Diverted
                      </h3>
                      <p className="text-2xl font-bold text-pink-700">156t</p>
                      <p className="text-sm text-pink-600">
                        Recycled this month
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Performance Trends
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-lg text-center">
                      <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">
                        📊 Interactive Charts & Graphs
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Real-time analytics dashboard with collection trends,
                        efficiency metrics, and predictive insights
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
            <DialogContent className="max-w-xl w-full">
              <DialogHeader>
                <DialogTitle>
                  Smart Camera – {cameraBin?.location_name}
                </DialogTitle>
              </DialogHeader>

              <div className="w-full max-w-[640px] mx-auto aspect-[4/3] bg-black rounded overflow-hidden">
                <iframe
                  key={cameraKey}
                  src="http://192.168.137.142:8080/video"
                  className="w-full h-full transform rotate-360 scale-110 origin-center border-0"
                  title="Smart Camera"
                />
              </div>

              {cameraResult && (
                <div className="mt-4 p-3 rounded bg-slate-50">
                  <p className="font-medium">{cameraResult.message}</p>
                  {cameraResult.warning && (
                    <p className="text-red-600 mt-1">⚠️ Violation Detected</p>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={getReuseSuggestion}>
                  ♻️ Reuse Suggestion
                </Button>

                <Button onClick={() => setCameraKey((k) => k + 1)}>
                  🔄 Refresh Camera
                </Button>

                <Button onClick={() => setCameraOpen(false)}>Close</Button>
              </div>

              {reuseResult && (
                <div className="mt-3 bg-green-50 p-3 rounded">
                  <p className="font-medium">Reuse Ideas:</p>
                  <ul className="list-disc ml-5 text-sm">
                    {reuseResult.suggestions.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
