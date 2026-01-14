"use client";

import React, { JSX } from "react";
import { LoadScriptNext } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

export default function GoogleMapsProvider({
  children,
}: {
  children: JSX.Element;
}) {
  return (
    <LoadScriptNext
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={libraries}
    >
      {children}
    </LoadScriptNext>
  );
}