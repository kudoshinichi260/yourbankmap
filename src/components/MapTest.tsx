import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MarkedPoint {
  id: number;
  lat: number;
  lng: number;
  displayName: string;
  road?: string;
  city?: string;
  country?: string;
  type?: string;
}

interface NominatimResponse {
  display_name?: string;
  type?: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

function AutoOpenMarker({ point }: { point: MarkedPoint }) {
  return (
    <Marker
      position={[point.lat, point.lng]}
      eventHandlers={{
        add: (e) => {
          e.target.openPopup();
        },
      }}
    >
      <Popup autoClose={false} closeOnClick={false}>
        <div style={{ minWidth: 220 }}>
          <p>
            <strong>Địa chỉ:</strong>
            <br />
            {point.displayName}
          </p>

          
          <small>
            Lat: {point.lat}
            <br />
            Lng: {point.lng}
          </small>
        </div>
      </Popup>
    </Marker>
  );
}

function ClickMarkerLayer() {
  const [points, setPoints] = useState<MarkedPoint[]>([]);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const id = Date.now();

      const newPoint: MarkedPoint = {
        id,
        lat,
        lng,
        displayName: "Đang tải dữ liệu từ OSM...",
      };

      setPoints((prev) => [...prev, newPoint]);

      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const response = await fetch(url);
        const data: NominatimResponse = await response.json();

        setPoints((prev) =>
          prev.map((point) =>
            point.id === id
              ? {
                  ...point,
                  displayName: data.display_name ?? "Không tìm thấy địa chỉ",
                  road: data.address?.road,
                  city:
                    data.address?.city ||
                    data.address?.town ||
                    data.address?.village,
                  country: data.address?.country,
                  type: data.type,
                }
              : point
          )
        );
      } catch {
        setPoints((prev) =>
          prev.map((point) =>
            point.id === id
              ? { ...point, displayName: "Không thể tải dữ liệu từ OSM" }
              : point
          )
        );
      }
    },
  });

  return (
    <>
      {points.map((point) => (
        <AutoOpenMarker key={point.id} point={point} />
      ))}
    </>
  );
}

export default function MapTest() {
  return (
    <MapContainer
      center={[10.776889, 106.700806]}
      zoom={16}
      style={{ width: "100%", height: "100vh" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickMarkerLayer />
    </MapContainer>
  );
}