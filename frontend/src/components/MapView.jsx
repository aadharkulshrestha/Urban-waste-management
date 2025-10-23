import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

// Fix missing marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const MapView = () => {
  const [position, setPosition] = useState([13.0827, 80.2707]); // Default: Chennai
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition([latitude, longitude]);
        setAccuracy(accuracy);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={15}
      scrollWheelZoom={true}
      className="h-[300px] w-full rounded-xl z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <Marker position={position}>
        <Popup>
          <b>Your Current Location</b>
          <br />
          Latitude: {position[0].toFixed(4)} <br />
          Longitude: {position[1].toFixed(4)}
        </Popup>
      </Marker>

      {accuracy && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{ color: "blue", fillColor: "#3b82f6", fillOpacity: 0.2 }}
        />
      )}
    </MapContainer>
  );
};

export default MapView;
