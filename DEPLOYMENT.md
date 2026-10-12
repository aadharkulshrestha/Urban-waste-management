# Deploying CleanCity Connect to Railway

This project is structured as a fullstack application with a FastAPI backend (`backend/`), a React frontend (`frontend/`), and a MongoDB database.

---

## Architecture on Railway

To deploy successfully on Railway, you will create **3 services** inside one Railway Project:
1. **MongoDB Service** (Database)
2. **Backend Service** (FastAPI)
3. **Frontend Service** (React)

---

## Step 1: Create a Railway Project & Add MongoDB

1. Go to [railway.com](https://railway.com) and log in.
2. Click **New Project** -> **Provision MongoDB** (or use an existing MongoDB Atlas cluster).
3. Once created, click on the **MongoDB** service, go to the **Variables** tab, and copy `MONGO_URL` (or `MONGO_PUBLIC_URL`).

---

## Step 2: Deploy the Backend Service

1. In the same Railway Project canvas, click **Create** -> **GitHub Repo** (or **Add Service** -> **GitHub Repo**).
2. Select your `Urban-waste-management` repository.
3. Once added, click the service card and go to **Settings**:
   - Under **General** -> **Service Name**: Rename to `backend`.
   - Under **Build** -> **Root Directory**: Set to `/backend` *(Important!)*
4. Go to the **Variables** tab and add the following environment variables:
   - `MONGO_URL`: *Paste the connection string from Step 1*
   - `DB_NAME`: `cleancitydatabase`
   - `JWT_SECRET`: *A secure random string (e.g. `c7e8a9f02b1c4d...`)*
   - `CORS_ORIGINS`: `*` *(or your frontend URL once generated in Step 3)*
5. Go to the **Settings** tab -> **Networking**:
   - Click **Generate Domain** (e.g., `https://backend-production-xxxx.up.railway.app`).
   - Copy this URL.

---

## Step 3: Deploy the Frontend Service

1. In the same Railway Project canvas, click **Create** -> **GitHub Repo**.
2. Select the same `Urban-waste-management` repository again.
3. Click this new service card and go to **Settings**:
   - Under **General** -> **Service Name**: Rename to `frontend`.
   - Under **Build** -> **Root Directory**: Set to `/frontend` *(Important!)*
4. Go to the **Variables** tab and add the following variable:
   - `REACT_APP_BACKEND_URL`: *The backend URL from Step 2 (e.g., `https://backend-production-xxxx.up.railway.app` without trailing slash)*
   > **Note**: In React, `REACT_APP_*` variables are baked into the build at compile time, so make sure this variable is set before deploying/building.
5. Go to **Settings** -> **Networking**:
   - Click **Generate Domain** (e.g., `https://frontend-production-xxxx.up.railway.app`).

---

## Step 4: Verification

1. **Backend Health Check**:
   Visit `https://<your-backend-domain>/health` in your browser. You should receive:
   ```json
   {"status": "healthy"}
   ```
2. **Interactive API Docs**:
   Visit `https://<your-backend-domain>/docs`.
3. **Frontend Application**:
   Open `https://<your-frontend-domain>/` in your browser. Test citizen registration/login and verify network requests route smoothly to your backend.

---

## Optional: Camera & Hardware Integration
- By default in cloud deployments, the API gracefully falls back to a simulated test camera if no physical ESP32 IP webcam is reachable on the local network.
- To link a physical camera stream, forward your local camera port or set up a secure tunnel (e.g., Cloudflare Tunnel / ngrok) and set `CAMERA_URL` in the Backend environment variables.
