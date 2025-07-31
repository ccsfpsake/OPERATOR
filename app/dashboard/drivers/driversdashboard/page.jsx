"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
  TrafficLayer,
} from "@react-google-maps/api";
import {
  collection,
  collectionGroup,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import styles from "../../../../app/ui/dashboard/drivers/driversdashboard.module.css";

const containerStyle = { width: "100%", height: "50vh" };
const center = { lat: 15.05, lng: 120.66 };
const BUS_ICON_SIZE = 45;

const calculateBearing = (prevPos, newPos) => {
  const lat1 = (Math.PI * prevPos.lat) / 180;
  const lat2 = (Math.PI * newPos.lat) / 180;
  const dLng = (Math.PI * (newPos.lng - prevPos.lng)) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const isAtCityCollege = (bus) => {
  const targetLat = 15.06137;
  const targetLng = 120.643928;
  const threshold = 0.0002;
  if (!bus.currentLocation) return false;
  const latDiff = Math.abs(bus.currentLocation.latitude - targetLat);
  const lngDiff = Math.abs(bus.currentLocation.longitude - targetLng);
  return latDiff < threshold && lngDiff < threshold;
};

const formatIdleTime = (idleMinutes) => {
  if (idleMinutes >= 60) {
    const hours = Math.floor(idleMinutes / 60);
    const mins = idleMinutes % 60;
    return `Not moved for ${hours} hour${hours > 1 ? "s" : ""} ${mins} min`;
  }
  return `Not moved for ${idleMinutes} min`;
};

const getIdleTime = (bus) => {
  if (bus.lastUpdated?.toDate) {
    const lastUpdate = bus.lastUpdated.toDate();
    const now = new Date();
    const diffMs = now - lastUpdate;
    const idleMinutes = Math.floor(diffMs / 60000);
    if (idleMinutes >= 0) {
      const baseText = formatIdleTime(idleMinutes);
      if (isAtCityCollege(bus) && idleMinutes >= 10) {
        return `${baseText} (CCSFP-C3)`;
      }
      return baseText;
    }
  }
  return "Moving";
};

export default function BusLocationPage() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const [busLocations, setBusLocations] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(15);
  const [loading, setLoading] = useState(true);

  const hasFitBounds = useRef(false);
  const busRefs = useRef({});
  const companyID = typeof window !== "undefined" ? localStorage.getItem("companyID") : null;

  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocations((prev) => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDriversStatus = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "Drivers"));
    const map = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.companyID && data.driverID) {
        map[data.driverID] = {
          companyID: data.companyID,
          status: data.status || "inactive",
        };
      }
    });
    return map;
  }, []);

  const fetchRoutePlateNumbers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "Route"));
    const map = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.driverID && data.plateNumber) {
        map[data.driverID] = {
          plateNumber: data.plateNumber,
          route: data.route || null,
        };
      }
    });
    return map;
  }, []);

  useEffect(() => {
    if (!companyID) return;

    let unsubBuses = null;
    let unsubStops = null;

    const fetchData = async () => {
      const driverMap = await fetchDriversStatus();
      const routeMap = await fetchRoutePlateNumbers();

      unsubBuses = onSnapshot(collection(db, "BusLocation"), (snapshot) => {
        const buses = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const routeInfo = routeMap[data.driverID] || {};
            const driverInfo = driverMap[data.driverID] || {};
            return {
              id: doc.id,
              ...data,
              plateNumber: routeInfo.plateNumber,
              route: routeInfo.route,
              driverCompanyID: driverInfo.companyID,
              driverStatus: driverInfo.status,
            };
          })
          .filter(
            (bus) =>
              bus.driverCompanyID === companyID &&
              bus.driverStatus === "active"
          );
        setBusLocations(buses);
        setLoading(false);
      });

      unsubStops = onSnapshot(collectionGroup(db, "Stops"), (snapshot) => {
        const stops = snapshot.docs.map((doc) => {
          const data = doc.data();
          const parentDocRef = doc.ref.parent.parent;
          return {
            id: doc.id,
            parentDocId: parentDocRef?.id || "unknown",
            name: data.name,
            locID: data.locID,
            geo: data.geo,
          };
        });
        setBusStops(stops);
      });
    };

    fetchData();

    return () => {
      unsubBuses?.();
      unsubStops?.();
    };
  }, [companyID, fetchDriversStatus, fetchRoutePlateNumbers]);

  useEffect(() => {
    if (map && busLocations.length && !hasFitBounds.current) {
      const bounds = new window.google.maps.LatLngBounds();
      busLocations.forEach((bus) => {
        if (bus.currentLocation) {
          bounds.extend({
            lat: bus.currentLocation.latitude,
            lng: bus.currentLocation.longitude,
          });
        }
      });
      busStops.forEach((stop) => {
        if (stop.geo) {
          bounds.extend({
            lat: stop.geo.latitude,
            lng: stop.geo.longitude,
          });
        }
      });
      map.fitBounds(bounds);
      hasFitBounds.current = true;
    }
  }, [map, busLocations, busStops]);

  const mapOptions = useMemo(() => ({
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
      {
        featureType: "road",
        elementType: "labels",
        stylers: [{ visibility: "simplified" }],
      },
      { featureType: "administrative", stylers: [{ visibility: "off" }] },
      { featureType: "landscape", stylers: [{ color: "#f5f5f5" }] },
      { featureType: "water", stylers: [{ color: "#d6e9f8" }] },
    ],
  }), []);

  if (!isLoaded || loading) return <div className={styles.loading}>Loading map data...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mapContainer}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={(mapInstance) => {
            setMap(mapInstance);
            setZoom(mapInstance.getZoom());
          }}
          onZoomChanged={() => {
            if (map) setZoom(map.getZoom());
          }}
        >
          <TrafficLayer />
          {busLocations.map((bus) => {
            const newPos = {
              lat: bus.currentLocation?.latitude ?? center.lat,
              lng: bus.currentLocation?.longitude ?? center.lng,
            };
            const prevPos = busRefs.current[bus.id] || newPos;
            calculateBearing(prevPos, newPos);
            busRefs.current[bus.id] = newPos;

            return (
              <Marker
                key={bus.id}
                position={newPos}
                icon={
                  typeof window !== "undefined" && window.google
                    ? {
                        url: "/puj.png",
                        scaledSize: new window.google.maps.Size(BUS_ICON_SIZE, BUS_ICON_SIZE),
                        anchor: new window.google.maps.Point(BUS_ICON_SIZE / 2, BUS_ICON_SIZE / 2),
                      }
                    : undefined
                }
                zIndex={2}
                onClick={() => setSelectedBus(bus)}
              />
            );
          })}
          {zoom >= 15 && busStops.map((stop) => (
            <Marker
              key={`${stop.parentDocId}-${stop.id}`}
              position={{ lat: stop.geo.latitude, lng: stop.geo.longitude }}
              icon={{
                url: "/stop-icon.png",
                scaledSize: new window.google.maps.Size(25, 25),
              }}
              zIndex={1}
              onClick={() => setSelectedStop(stop)}
            />
          ))}
          {selectedBus && (
            <InfoWindow
              position={busRefs.current[selectedBus.id]}
              onCloseClick={() => setSelectedBus(null)}
            >
              <div>
                <strong>Driver ID:</strong> {selectedBus.driverID || "N/A"}<br />
                <strong>Plate Number:</strong> {selectedBus.plateNumber || "N/A"}<br />
                <strong>Route:</strong> {selectedBus.route || "N/A"}<br />
                <span style={{ color: "blue" }}>{getIdleTime(selectedBus)}</span>
              </div>
            </InfoWindow>
          )}
          {selectedStop && (
            <InfoWindow
              position={{ lat: selectedStop.geo.latitude, lng: selectedStop.geo.longitude }}
              onCloseClick={() => setSelectedStop(null)}
            >
              <div>
                <strong>Location ID:</strong> {selectedStop.locID}<br />
                <strong>Stop Name:</strong> {selectedStop.name}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
