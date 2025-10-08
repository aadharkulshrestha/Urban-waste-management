// CitizenDashboard.jsx
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
  MapPin,
  Plus,
  Truck,
  Award,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut,
  User,
  Calendar,
  Camera,
  Star,
  Recycle,
} from "lucide-react";
import { useAuth } from "../App";
import { toast } from "sonner";

const CitizenDashboard = () => {
  const { user, logout } = useAuth();
  const [bins, setBins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    title: "",
    description: "",
    address: "",
    priority: "medium",
  });
  const [pickupForm, setPickupForm] = useState({
    address: "",
    pickup_date: "",
    waste_type: "general",
    quantity_estimate: "medium",
    special_instructions: "",
  });

  const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  // Mock coordinates for different locations
  const getMockCoordinates = (address) => {
    const locations = {
      downtown: { lat: 40.7589, lng: -73.9851 },
      residential: { lat: 40.7505, lng: -73.9934 },
      industrial: { lat: 40.7282, lng: -74.0776 },
      commercial: { lat: 40.7614, lng: -73.9776 },
    };

    // Simple mapping based on address keywords
    const lowerAddress = address.toLowerCase();
    for (const [key, coords] of Object.entries(locations)) {
      if (lowerAddress.includes(key)) {
        return coords;
      }
    }

    // Default location with some randomness
    return {
      lat: 40.7505 + (Math.random() - 0.5) * 0.02,
      lng: -73.9934 + (Math.random() - 0.5) * 0.02,
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [binsRes, complaintsRes, pickupRes, vehiclesRes] =
        await Promise.all([
          fetch(`${API_BASE}/bins`, { headers }),
          fetch(`${API_BASE}/complaints`, { headers }),
          fetch(`${API_BASE}/pickup-requests`, { headers }),
          fetch(`${API_BASE}/tracking/vehicles`, { headers }),
        ]);

      if (binsRes.ok) setBins(await binsRes.json());
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());

      if (pickupRes.ok) {
        const data = await pickupRes.json();
        // Safely extract array
        setPickupRequests(Array.isArray(data) ? data : data.requests || []);
      }

      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      const coords = getMockCoordinates(complaintForm.address);
      const complaintData = {
        ...complaintForm,
        latitude: coords.lat,
        longitude: coords.lng,
      };

      const response = await fetch(`${API_BASE}/complaints`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(complaintData),
      });

      if (response.ok) {
        toast.success(
          "Complaint submitted successfully! You earned 10 points."
        );
        setShowComplaintForm(false);
        setComplaintForm({
          title: "",
          description: "",
          address: "",
          priority: "medium",
        });
        fetchData();
      } else {
        throw new Error("Failed to submit complaint");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint");
    }
  };

  const handleSubmitPickupRequest = async (e) => {
    e.preventDefault();
    try {
      const coords = getMockCoordinates(pickupForm.address);
      const requestData = {
        ...pickupForm,
        latitude: coords.lat,
        longitude: coords.lng,
        pickup_date: new Date(pickupForm.pickup_date).toISOString(),
      };

      const response = await fetch(`${API_BASE}/pickup-requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success("Pickup request submitted successfully!");
        setShowPickupForm(false);
        setPickupForm({
          address: "",
          pickup_date: "",
          waste_type: "general",
          quantity_estimate: "medium",
          special_instructions: "",
        });
        fetchData();
      } else {
        throw new Error("Failed to submit pickup request");
      }
    } catch (error) {
      console.error("Error submitting pickup request:", error);
      toast.error("Failed to submit pickup request");
    }
  };

  const getBinStatusColor = (status) => {
    switch (status) {
      case "empty":
        return "bg-green-100 text-green-700";
      case "quarter":
        return "bg-yellow-100 text-yellow-700";
      case "half":
        return "bg-orange-100 text-orange-700";
      case "three_quarter":
        return "bg-red-100 text-red-700";
      case "full":
        return "bg-red-100 text-red-700";
      case "overflowing":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getComplaintStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const nearbyBins = bins.slice(0, 6); // Show first 6 bins as "nearby"
  const userRewardPoints = user?.reward_points || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50"
      data-testid="citizen-dashboard"
    >
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Recycle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  CleanCity Connect
                </h1>
                <p className="text-sm text-slate-600">Citizen Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-full">
                <Star className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-700">
                  {userRewardPoints} Points
                </span>
              </div>
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
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Reward Points
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {userRewardPoints}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    My Reports
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {complaints.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Pickup Requests
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {pickupRequests.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Active Vehicles
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {vehicles.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="overview-tab">
              Overview
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="reports-tab">
              My Reports
            </TabsTrigger>
            <TabsTrigger value="pickups" data-testid="pickups-tab">
              Pickups
            </TabsTrigger>
            <TabsTrigger value="tracking" data-testid="tracking-tab">
              Live Tracking
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-emerald-600" />
                    <span>Report an Issue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Report illegal dumping, overflowing bins, or other
                    waste-related issues in your area.
                  </p>
                  <Dialog
                    open={showComplaintForm}
                    onOpenChange={setShowComplaintForm}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        data-testid="report-issue-btn"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Report an Issue</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={handleSubmitComplaint}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="title">Issue Title</Label>
                          <Input
                            id="title"
                            placeholder="Brief description of the issue"
                            value={complaintForm.title}
                            onChange={(e) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            required
                            data-testid="complaint-title-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Detailed description of the issue"
                            value={complaintForm.description}
                            onChange={(e) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            required
                            data-testid="complaint-description-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Location</Label>
                          <Input
                            id="address"
                            placeholder="Street address or landmark"
                            value={complaintForm.address}
                            onChange={(e) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            required
                            data-testid="complaint-address-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={complaintForm.priority}
                            onValueChange={(value) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                priority: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          data-testid="submit-complaint-btn"
                        >
                          Submit Report
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-teal-600" />
                    <span>Request Pickup</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Schedule a special waste pickup for large items, yard waste,
                    or bulk collection.
                  </p>
                  <Dialog
                    open={showPickupForm}
                    onOpenChange={setShowPickupForm}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        data-testid="request-pickup-btn"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Request Pickup
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Request Special Pickup</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={handleSubmitPickupRequest}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="pickup-address">Pickup Address</Label>
                          <Input
                            id="pickup-address"
                            placeholder="Street address"
                            value={pickupForm.address}
                            onChange={(e) =>
                              setPickupForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            required
                            data-testid="pickup-address-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pickup-date">Preferred Date</Label>
                          <Input
                            id="pickup-date"
                            type="datetime-local"
                            value={pickupForm.pickup_date}
                            onChange={(e) =>
                              setPickupForm((prev) => ({
                                ...prev,
                                pickup_date: e.target.value,
                              }))
                            }
                            required
                            data-testid="pickup-date-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="waste-type">Waste Type</Label>
                          <Select
                            value={pickupForm.waste_type}
                            onValueChange={(value) =>
                              setPickupForm((prev) => ({
                                ...prev,
                                waste_type: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">
                                General Waste
                              </SelectItem>
                              <SelectItem value="recyclable">
                                Recyclables
                              </SelectItem>
                              <SelectItem value="organic">
                                Organic/Compost
                              </SelectItem>
                              <SelectItem value="hazardous">
                                Hazardous Materials
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="quantity">Quantity Estimate</Label>
                          <Select
                            value={pickupForm.quantity_estimate}
                            onValueChange={(value) =>
                              setPickupForm((prev) => ({
                                ...prev,
                                quantity_estimate: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">
                                Small (1-2 bags)
                              </SelectItem>
                              <SelectItem value="medium">
                                Medium (3-5 bags)
                              </SelectItem>
                              <SelectItem value="large">
                                Large (6+ bags)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="instructions">
                            Special Instructions
                          </Label>
                          <Textarea
                            id="instructions"
                            placeholder="Any special handling instructions..."
                            value={pickupForm.special_instructions}
                            onChange={(e) =>
                              setPickupForm((prev) => ({
                                ...prev,
                                special_instructions: e.target.value,
                              }))
                            }
                            data-testid="pickup-instructions-input"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          data-testid="submit-pickup-btn"
                        >
                          Submit Request
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            {/* Nearby Bins */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <span>Nearby Waste Bins</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nearbyBins.map((bin) => (
                    <div
                      key={bin.id}
                      className="p-4 border border-slate-200 rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-slate-900">
                          {bin.location_name}
                        </h3>
                        <Badge className={getBinStatusColor(bin.status)}>
                          {bin.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{bin.zone}</p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${bin.fill_level}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500">
                        {bin.fill_level}% full
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No reports submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="p-4 border border-slate-200 rounded-lg space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-slate-900">
                            {complaint.title}
                          </h3>
                          <Badge
                            className={getComplaintStatusColor(
                              complaint.status
                            )}
                          >
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {complaint.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {complaint.address}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(
                              complaint.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pickups Tab */}
          <TabsContent value="pickups">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Pickup Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pickupRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No pickup requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(pickupRequests) &&
                    pickupRequests.length > 0 ? (
                      pickupRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 border border-slate-200 rounded-lg space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-slate-900 capitalize">
                              {request.waste_type} Waste
                            </h3>
                            <Badge
                              className={`
          ${
            request.status === "requested"
              ? "bg-yellow-100 text-yellow-700"
              : ""
          }
          ${request.status === "scheduled" ? "bg-blue-100 text-blue-700" : ""}
          ${request.status === "completed" ? "bg-green-100 text-green-700" : ""}
          ${request.status === "cancelled" ? "bg-red-100 text-red-700" : ""}
        `}
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 capitalize">
                            {request.quantity_estimate} quantity
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {request.address}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(
                                request.pickup_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {request.special_instructions && (
                            <p className="text-xs text-slate-600 mt-2">
                              <strong>Instructions:</strong>{" "}
                              {request.special_instructions}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">No pickup requests yet</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <span>Live Vehicle Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">
                      No vehicles currently active
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-slate-600 mb-2">
                        🗺️ Interactive Map (Mock Implementation)
                      </p>
                      <div className="bg-emerald-100 p-6 rounded-lg text-center">
                        <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-emerald-700 font-medium">
                          Live Map View
                        </p>
                        <p className="text-sm text-emerald-600 mt-2">
                          This would show real-time vehicle locations with
                          Google Maps integration
                        </p>
                      </div>
                    </div>

                    <h3 className="font-medium text-slate-900 mb-4">
                      Active Vehicles
                    </h3>
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="p-4 border border-slate-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-900">
                            Vehicle {vehicle.vehicle_id}
                          </h4>
                          <Badge className="bg-green-100 text-green-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Active
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Location:</span>
                            <br />
                            {vehicle.latitude?.toFixed(4)},{" "}
                            {vehicle.longitude?.toFixed(4)}
                          </div>
                          <div>
                            <span className="font-medium">Last Update:</span>
                            <br />
                            {new Date(vehicle.timestamp).toLocaleTimeString()}
                          </div>
                          {vehicle.speed && (
                            <div>
                              <span className="font-medium">Speed:</span>
                              <br />
                              {vehicle.speed} km/h
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CitizenDashboard;
