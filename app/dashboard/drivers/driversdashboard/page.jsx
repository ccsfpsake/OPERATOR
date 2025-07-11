/* global google */
"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
  MarkerClusterer,
  TrafficLayer,
} from "@react-google-maps/api";
import {
  collection,
  collectionGroup,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

import styles from "../../../ui/dashboard/drivers/driversdashboard.module.css";
import _ from "lodash";
import { db } from "../../../lib/firebaseConfig";

const containerStyle = { width: "100%", height: "50vh" };
const center = { lat: 15.05, lng: 120.66 };

// Bearing calculation (kept in case you want to use it later)
const calculateBearing = (prevPos, newPos) => {
  const lat1 = (Math.PI * prevPos.lat) / 180;
  const lat2 = (Math.PI * newPos.lat) / 180;
  const dLng = (Math.PI * (newPos.lng - prevPos.lng)) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

export default function BusLocationPage() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const [busLocations, setBusLocations] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [map, setMap] = useState(null);
  const busRefs = useRef({});

  const companyID = typeof window !== "undefined" ? localStorage.getItem("companyID") : null;

  const fetchDriversStatus = async () => {
    const snapshot = await getDocs(collection(db, "Drivers"));
    const map = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.companyID && data.driverID) {
        map[data.driverID] = {
          companyID: data.companyID,
          status: data.status || "inactive",
          imageUrl: data.imageUrl || null,
          LName: data.LName || "",
          FName: data.FName || "",
          MName: data.MName || "",
        };
      }
    });
    return map;
  };

  const fetchRoutes = async () => {
    const snapshot = await getDocs(collection(db, "Route"));
    const map = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.driverID) {
        map[data.driverID] = {
          route: data.route || "N/A",
          plateNumber: data.plateNumber || "N/A",
        };
      }
    });
    return map;
  };

  useEffect(() => {
    let unsubBuses = null;
    let unsubStops = null;

    const fetchData = async () => {
      const driverData = await fetchDriversStatus();
      const routeData = await fetchRoutes();

      unsubBuses = onSnapshot(collection(db, "BusLocation"), (snapshot) => {
        const buses = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const driverInfo = driverData[data.driverID] || {};
            const routeInfo = routeData[data.driverID] || {};

            return {
              id: doc.id,
              ...data,
              route: routeInfo.route,
              plateNumber: routeInfo.plateNumber,
              driverCompanyID: driverInfo.companyID,
              driverStatus: driverInfo.status,
              imageUrl: driverInfo.imageUrl,
              FName: driverInfo.FName,
              MName: driverInfo.MName,
            };
          })
          .filter(
            (bus) => bus.driverCompanyID === companyID && bus.driverStatus === "active"
          );

        setBusLocations(buses);
      });

      unsubStops = onSnapshot(collectionGroup(db, "Stops"), (snapshot) => {
        const stops = snapshot.docs.map((doc) => {
          const parentDocRef = doc.ref.parent.parent;
          const parentDocId = parentDocRef ? parentDocRef.id : "unknown";
          const data = doc.data();
          return {
            id: doc.id,
            parentDocId,
            name: data.name,
            locID: data.locID,
            geo: {
              latitude: data.geo.latitude,
              longitude: data.geo.longitude,
            },
          };
        });
        setBusStops(stops);
      });
    };

    fetchData();

    return () => {
      if (unsubBuses) unsubBuses();
      if (unsubStops) unsubStops();
    };
  }, [companyID]);

  useEffect(() => {
    if (map) {
      const handleZoomChange = _.debounce(() => setZoom(map.getZoom()), 200);
      map.addListener("zoom_changed", handleZoomChange);
      return () => google.maps.event.clearListeners(map, "zoom_changed");
    }
  }, [map]);

  useEffect(() => {
    const handleResize = () => {
      if (map) google.maps.event.trigger(map, "resize");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  const getIdleTime = (bus) => {
    if (bus.timestamp?.toDate) {
      const lastUpdate = bus.timestamp.toDate();
      const now = new Date();
      const diffMs = now - lastUpdate;
      if (diffMs > 0) {
        const idleMinutes = Math.floor(diffMs / 60000);
        if (idleMinutes >= 60) {
          const hours = Math.floor(idleMinutes / 60);
          const minutes = idleMinutes % 60;
          return `Not moved for ${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`;
        }
        return idleMinutes > 0 ? `Not moved for ${idleMinutes} min` : "Moving";
      }
    }
    return "Moving";
  };

  const handleBusClick = useCallback((bus) => setSelectedBus(bus), []);
  const handleStopClick = useCallback((stop) => setSelectedStop(stop), []);

  const mapOptions = useMemo(
    () => ({
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
        { featureType: "administrative", stylers: [{ visibility: "off" }] },
        { featureType: "landscape", stylers: [{ color: "#f5f5f5" }] },
        { featureType: "water", stylers: [{ color: "#d6e9f8" }] },
      ],
    }),
    []
  );

  if (!isLoaded) return <div className={styles.loadingHalf}>Loading map...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mapContainer}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={setMap}
        >
          <TrafficLayer />

          <MarkerClusterer options={{ gridSize: 60, maxZoom: 16 }}>
            {(clusterer) =>
              busLocations.map((bus) => {
                const newPos = {
                  lat: bus.currentLocation?.latitude ?? center.lat,
                  lng: bus.currentLocation?.longitude ?? center.lng,
                };
                const prevPos = busRefs.current[bus.id] || newPos;
                busRefs.current[bus.id] = newPos;

                const size = Math.min(70, Math.max(30, zoom * 3.5));

                return (
                  <Marker
                    key={bus.id}
                    position={newPos}
                    icon={{
                      url: "/puj.png",
                      scaledSize: new window.google.maps.Size(size, size),
                      anchor: new window.google.maps.Point(size / 2, size / 2),
                    }}
                    clusterer={clusterer}
                    zIndex={2}
                    onClick={() => handleBusClick(bus)}
                  />
                );
              })
            }
          </MarkerClusterer>

          {zoom >= 15 &&
            busStops.map((stop) => (
              <Marker
                key={`${stop.parentDocId}-${stop.id}`}
                position={{
                  lat: stop.geo.latitude,
                  lng: stop.geo.longitude,
                }}
                icon={{
                  url: "/stop-icon.png",
                  scaledSize: new window.google.maps.Size(25, 25),
                }}
                zIndex={1}
                onClick={() => handleStopClick(stop)}
              />
            ))}

          {selectedBus && (
            <InfoWindow
              position={busRefs.current[selectedBus.id]}
              onCloseClick={() => setSelectedBus(null)}
            >
              <div>
                <strong>Driver ID:</strong> {selectedBus.driverID || "N/A"} <br />
                <strong>Plate Number:</strong> {selectedBus.plateNumber || "N/A"} <br />
                <strong>Route:</strong> {selectedBus.route || "N/A"} <br />
                <span style={{ color: "blue" }}>{getIdleTime(selectedBus)}</span>
              </div>
            </InfoWindow>
          )}

          {selectedStop && (
            <InfoWindow
              position={{
                lat: selectedStop.geo.latitude,
                lng: selectedStop.geo.longitude,
              }}
              onCloseClick={() => setSelectedStop(null)}
            >
              <div>
                <strong>Location ID:</strong> {selectedStop.locID} <br />
                <strong>Stop Name:</strong> {selectedStop.name} <br />
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
