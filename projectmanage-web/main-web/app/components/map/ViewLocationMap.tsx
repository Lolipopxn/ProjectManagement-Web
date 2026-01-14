"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

type LatLng = { lat: number; lng: number };

export default function ViewLocationMap({ position }: { position: LatLng }) {

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-2xl border">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={position}
        zoom={16}
      >
        <Marker position={position} />
      </GoogleMap>
    </div>
  );
}