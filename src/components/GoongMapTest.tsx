import { useEffect, useRef} from "react";
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";

const GOONG_MAPTILES_KEY = "5vK5FP9YBLeh6EikGpOruH8j3tAT7b4IJrs88Jqy";
const GOONG_API_KEY = "Mwoh6BRSxMHJSJNxD2X02CtrmnMKUatdnP1vngPU";

type GoongMap = any;
type GoongMarker = any;
type GoongPopup = any;

interface MarkedPoint {
  id: number;
  lat: number;
  lng: number;
  address: string;
}

interface GoongReverseResponse {
  results?: {
    formatted_address?: string;
  }[];
}

export default function GoongMapTest() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMap | null>(null);
  const markersRef = useRef<Record<number, GoongMarker>>({});
//   const [points, setPoints] = useState<MarkedPoint[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    goongjs.accessToken = GOONG_MAPTILES_KEY;

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`,
      center: [106.700806, 10.776889],
      zoom: 16,
    });

    mapRef.current = map;

    map.addControl(new goongjs.NavigationControl(), "top-right");

    map.on("click", async (e: any) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      const id = Date.now();

      const point: MarkedPoint = {
        id,
        lat,
        lng,
        address: "Đang tải dữ liệu từ Goong...",
      };

    //   setPoints((prev) => [...prev, point]);

      const popup: GoongPopup = new goongjs.Popup({
        closeOnClick: false,
        closeButton: true,
      }).setHTML(renderPopupHTML(point));

      const marker: GoongMarker = new goongjs.Marker()
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current[id] = marker;
      marker.togglePopup();

      marker.getElement().addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();

        marker.remove();
        delete markersRef.current[id];

        // setPoints((prev) => prev.filter((item) => item.id !== id));
      });

      try {
        const url = `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOONG_API_KEY}`;

        const response = await fetch(url);
        const data: GoongReverseResponse = await response.json();

        const address =
          data.results?.[0]?.formatted_address || "Không tìm thấy địa chỉ";

        const updatedPoint: MarkedPoint = {
          ...point,
          address,
        };

        // setPoints((prev) =>
        //   prev.map((item) => (item.id === id ? updatedPoint : item))
        // );

        popup.setHTML(renderPopupHTML(updatedPoint));
        marker.setPopup(popup);
        marker.togglePopup();
      } catch {
        const errorPoint: MarkedPoint = {
          ...point,
          address: "Không thể tải dữ liệu từ Goong",
        };

        popup.setHTML(renderPopupHTML(errorPoint));
      }
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          zIndex: 1,
          background: "white",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        {/* Số điểm đã đánh dấu: {points.length} */}
      </div>
    </div>
  );
}

function renderPopupHTML(point: MarkedPoint): string {
  return `
    <div style="min-width:220px">
    
      <p>
        <strong>Địa chỉ:</strong><br/>
        ${point.address}
      </p>

      <hr/>

      <small>
        Lat: ${point.lat}<br/>
        Lng: ${point.lng}
      </small>

      <hr/>

    </div>
  `;
}