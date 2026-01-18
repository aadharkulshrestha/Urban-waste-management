
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pathlib import Path
from bson import ObjectId 
from contextlib import asynccontextmanager
import os
import uuid
import hashlib
import jwt
import json
import asyncio
import random
from enum import Enum
import logging
from bson import json_util

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'cleancity_secret_key_change_in_production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    client.close()

# FastAPI app setup
app = FastAPI(title="CleanCity Connect API", version="1.0.0", lifespan=lifespan)
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000"
    ],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User Roles
class UserRole(str, Enum):
    CITIZEN = "citizen"
    WORKER = "worker"
    ADMIN = "admin"

# Bin Status
class BinStatus(str, Enum):
    EMPTY = "empty"
    QUARTER = "quarter"
    HALF = "half"
    THREE_QUARTER = "three_quarter"
    FULL = "full"
    OVERFLOWING = "overflowing"

# Complaint Status
class ComplaintStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

# Route Status
class RouteStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Pydantic Models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None
    reward_points: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class WasteBin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_name: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    status: BinStatus = BinStatus.EMPTY
    fill_level: int = Field(0, ge=0, le=100)  # Percentage
    last_collected: Optional[datetime] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    zone: str = "Zone A"
    capacity: int = 100  # Liters

class Complaint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: str
    status: ComplaintStatus = ComplaintStatus.OPEN
    priority: str = "medium"  # low, medium, high
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    assigned_to: Optional[str] = None  # Worker ID

class CollectionRoute(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    worker_id: str
    bin_ids: List[str]
    route_name: str
    status: RouteStatus = RouteStatus.PENDING
    estimated_duration: int = 240  # minutes
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_distance: Optional[float] = None  # kilometers

class VehicleLocation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vehicle_id: str
    worker_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    heading: Optional[float] = None
    speed: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PickupRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: str
    pickup_date: datetime
    waste_type: str = "general"  # general, recyclable, organic, hazardous
    quantity_estimate: str = "small"  # small, medium, large
    status: str = "requested"  # requested, scheduled, completed, cancelled
    special_instructions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Utility Functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_jwt_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        role = payload.get('role')
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {'user_id': user_id, 'role': role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*allowed_roles: UserRole):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or args[-1]
            if current_user['role'] not in allowed_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Mock location data for demonstration
MOCK_LOCATIONS = {
    "downtown": {"lat": 40.7589, "lng": -73.9851, "name": "Downtown Area"},
    "residential": {"lat": 40.7505, "lng": -73.9934, "name": "Residential District"},
    "industrial": {"lat": 40.7282, "lng": -74.0776, "name": "Industrial Zone"},
    "commercial": {"lat": 40.7614, "lng": -73.9776, "name": "Commercial District"},
    "suburban": {"lat": 40.7831, "lng": -73.9712, "name": "Suburban Area"}
}

# Routes

# Authentication Routes
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user object (without password)
    user_dict = user_data.dict()
    user_dict.pop('password')  # Remove password from user object
    user_obj = User(**user_dict)
    
    # Create database document with password
    db_user_dict = user_obj.dict()
    db_user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(db_user_dict)
    
    # Create JWT token
    token = create_jwt_token(user_obj.id, user_obj.role)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": {"id": user_obj.id, "name": user_obj.name, "email": user_obj.email, "role": user_obj.role}
    }

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    # Create JWT token
    token = create_jwt_token(user['id'], user['role'])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {"id": user['id'], "name": user['name'], "email": user['email'], "role": user['role']}
    }

# User Routes
@api_router.get("/users/workers")
async def get_workers(current_user: dict = Depends(get_current_user)):
    # Only Admin can fetch workers
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can fetch workers")

    workers = await db.users.find({"role": UserRole.WORKER}).to_list(1000)

    # Remove password fields
    for worker in workers:
        worker.pop("password", None)

    return serialize_mongo_document(workers)

@api_router.get("/users/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.pop('password', None)
    return serialize_mongo_document(user)  # ✅ FIX

@api_router.put("/users/profile")
async def update_user_profile(user_data: dict, current_user: dict = Depends(get_current_user)):
    allowed_fields = ['name', 'phone', 'address']
    update_data = {k: v for k, v in user_data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"id": current_user['user_id']}, 
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}

# Waste Bin Routes

class IoTBinUpdate(BaseModel):
    bin_id: str
    distance: int
    fill_percentage: int
    device_id: str = "esp32_001"


@api_router.post("/iot/bin-update")
async def iot_bin_update(data: IoTBinUpdate):
    if data.fill_percentage < 25:
        status = BinStatus.EMPTY
    elif data.fill_percentage < 50:
        status = BinStatus.QUARTER
    elif data.fill_percentage < 75:
        status = BinStatus.HALF
    elif data.fill_percentage < 95:
        status = BinStatus.FULL
    else:
        status = BinStatus.OVERFLOWING

    update_data = {
        "fill_level": data.fill_percentage,
        "status": status,
        "last_updated": datetime.now(timezone.utc)
    }

    result = await db.bins.update_one(
        {"id": data.bin_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bin not found")

    await manager.broadcast(json.dumps({
        "type": "bin_update",
        "bin_id": data.bin_id,
        "data": update_data
    }, default=json_util.default))

    return {"message": "Bin updated successfully"}


@api_router.get("/bins")
async def get_all_bins(current_user: dict = Depends(get_current_user)):
    bins = await db.bins.find().to_list(1000)
    return serialize_mongo_document(bins)  # ✅ FIX


@api_router.post("/bins")
async def create_bin(bin_data: WasteBin, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create bins")
    
    await db.bins.insert_one(bin_data.dict())
    return {"message": "Bin created successfully", "bin_id": bin_data.id}

@api_router.put("/bins/{bin_id}/status")
async def update_bin_status(bin_id: str, status_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.ADMIN, UserRole.WORKER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    update_data = {
        "status": status_data.get('status'),
        "fill_level": status_data.get('fill_level', 0),
        "last_updated": datetime.now(timezone.utc)
    }
    
    if current_user['role'] == UserRole.WORKER:
        update_data["last_collected"] = datetime.now(timezone.utc)
    
    await db.bins.update_one({"id": bin_id}, {"$set": update_data})
    
    # Broadcast update to connected clients
    await manager.broadcast(json.dumps({
    "type": "bin_update",
    "bin_id": bin_id,
    "data": update_data
}, default=json_util.default))
    
    return {"message": "Bin status updated successfully"}



# Complaint Routes
@api_router.post("/complaints")
async def create_complaint(complaint_data: dict, current_user: dict = Depends(get_current_user)):
    complaint_dict = complaint_data.copy()
    complaint_dict['user_id'] = current_user['user_id']
    complaint_obj = Complaint(**complaint_dict)
    
    await db.complaints.insert_one(complaint_obj.dict())
    
    # Award points for reporting
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$inc": {"reward_points": 10}}
    )
    
    return {"message": "Complaint submitted successfully", "complaint_id": complaint_obj.id}

@api_router.get("/complaints")
async def get_complaints(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.CITIZEN:
        complaints = await db.complaints.find({"user_id": current_user['user_id']}).to_list(1000)
    else:
        complaints = await db.complaints.find().to_list(1000)
    
    return serialize_mongo_document(complaints)  # ✅ FIX


@api_router.put("/complaints/{complaint_id}/status")
async def update_complaint_status(complaint_id: str, status_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.CITIZEN:
        raise HTTPException(status_code=403, detail="Citizens cannot update complaint status")
    
    update_data = {
        "status": status_data['status'],
        "assigned_to": current_user['user_id'] if current_user['role'] == UserRole.WORKER else status_data.get('assigned_to')
    }
    
    if status_data['status'] in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
        update_data["resolved_at"] = datetime.now(timezone.utc)
    
    await db.complaints.update_one({"id": complaint_id}, {"$set": update_data})
    return {"message": "Complaint status updated successfully"}

# Route Management
@api_router.get("/routes")
async def get_routes(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.WORKER:
        routes = await db.routes.find({"worker_id": current_user['user_id']}).to_list(1000)
    else:
        routes = await db.routes.find().to_list(1000)

    return serialize_mongo_document(routes)  # ✅ FIX


@api_router.post("/routes")
async def create_route(route_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create routes")
    
    route_obj = CollectionRoute(**route_data)
    await db.routes.insert_one(route_obj.dict())
    
    return {"message": "Route created successfully", "route_id": route_obj.id}

@api_router.put("/routes/{route_id}/start")
async def start_route(route_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Only workers can start routes")
    
    route = await db.routes.find_one({"id": route_id, "worker_id": current_user['user_id']})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found or not assigned to you")

    from datetime import datetime, timezone, timedelta
    IST = timezone(timedelta(hours=5, minutes=30))

    await db.routes.update_one(
        {"id": route_id},
        {"$set": {"status": RouteStatus.IN_PROGRESS, "start_time": datetime.now(IST)}}
    )
    
    return {"message": "Route started successfully"}


# Pickup Requests
@api_router.post("/pickup-requests")
async def create_pickup_request(request_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.CITIZEN:
        raise HTTPException(status_code=403, detail="Only citizens can request pickups")
    
    request_dict = request_data.copy()
    request_dict['user_id'] = current_user['user_id']
    pickup_obj = PickupRequest(**request_dict)
    
    await db.pickup_requests.insert_one(pickup_obj.dict())
    
    return {"message": "Pickup request submitted successfully", "request_id": pickup_obj.id}

def serialize_mongo_document(doc):
    from datetime import datetime, timezone

    def convert(value):
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, datetime):
            # Convert to UTC ISO format with Z
            return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        if isinstance(value, list):
            return [convert(i) for i in value]
        if isinstance(value, dict):
            return {k: convert(v) for k, v in value.items()}
        return value

    return convert(doc)

@api_router.get("/pickup-requests")
async def get_pickup_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == UserRole.CITIZEN:
        requests = await db.pickup_requests.find(
            {"user_id": current_user["user_id"]}
        ).to_list(1000)
    else:
        requests = await db.pickup_requests.find().to_list(1000)

    return {
        "count": len(requests),
        "requests": serialize_mongo_document(requests)
    }
# Vehicle Tracking
@api_router.post("/tracking/location")
async def update_vehicle_location(location_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Only workers can update location")
    
    location_dict = location_data.copy()
    location_dict['worker_id'] = current_user['user_id']
    location_dict['vehicle_id'] = location_data.get('vehicle_id', f"vehicle_{current_user['user_id']}")
    
    location_obj = VehicleLocation(**location_dict)
    await db.vehicle_locations.insert_one(location_obj.dict())
    
    # Broadcast location update
    await manager.broadcast(json.dumps({
        "type": "location_update",
        "vehicle_id": location_obj.vehicle_id,
        "data": {
            "latitude": location_obj.latitude,
            "longitude": location_obj.longitude,
            "timestamp": location_obj.timestamp.isoformat()
        }
    }))
    
    return {"message": "Location updated successfully"}

@api_router.get("/tracking/vehicles")
async def get_vehicle_locations(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$sort": {"timestamp": -1}},
        {"$group": {"_id": "$vehicle_id", "latest_location": {"$first": "$$ROOT"}}}
    ]
    
    locations = await db.vehicle_locations.aggregate(pipeline).to_list(1000)
    return serialize_mongo_document([loc["latest_location"] for loc in locations])  # ✅ FIX


# Analytics Routes (Admin only)
@api_router.get("/analytics/overview")
async def get_analytics_overview(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get various statistics
    total_bins = await db.bins.count_documents({})
    full_bins = await db.bins.count_documents({"status": {"$in": [BinStatus.FULL, BinStatus.OVERFLOWING]}})
    total_complaints = await db.complaints.count_documents({})
    open_complaints = await db.complaints.count_documents({"status": ComplaintStatus.OPEN})
    active_routes = await db.routes.count_documents({"status": RouteStatus.IN_PROGRESS})
    total_users = await db.users.count_documents({})
    
    return {
        "total_bins": total_bins,
        "full_bins": full_bins,
        "bin_fill_rate": (full_bins / max(total_bins, 1)) * 100,
        "total_complaints": total_complaints,
        "open_complaints": open_complaints,
        "complaint_resolution_rate": ((total_complaints - open_complaints) / max(total_complaints, 1)) * 100,
        "active_routes": active_routes,
        "total_users": total_users,
        "users_by_role": {
            "citizens": await db.users.count_documents({"role": UserRole.CITIZEN}),
            "workers": await db.users.count_documents({"role": UserRole.WORKER}),
            "admins": await db.users.count_documents({"role": UserRole.ADMIN})
        }
    }

# Mock data initialization
@api_router.post("/admin/init-mock-data")
async def initialize_mock_data(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Create mock bins
    mock_bins = []
    locations = list(MOCK_LOCATIONS.values())
    
    for i in range(20):
        loc = random.choice(locations)
        bin_obj = WasteBin(
            location_name=f"{loc['name']} - Bin {i+1}",
            latitude=loc['lat'] + random.uniform(-0.01, 0.01),
            longitude=loc['lng'] + random.uniform(-0.01, 0.01),
            status=random.choice(list(BinStatus)),
            fill_level=random.randint(0, 100),
            zone=f"Zone {random.choice(['A', 'B', 'C', 'D'])}"
        )
        mock_bins.append(bin_obj.dict())
    
    await db.bins.insert_many(mock_bins)
    
    return {"message": f"Initialized {len(mock_bins)} mock bins successfully"}

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            pass
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Include router
app.include_router(api_router)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8001)
