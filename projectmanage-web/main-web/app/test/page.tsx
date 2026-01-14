"use client";

import { useState } from "react";
import SelectLocationMap from "../components/map/SelectLocationMap";

export default function TestPage() {
  const [title, setTitle] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");

  const save = async () => {
    if (!title || lat === null || lng === null) {
      alert("กรุณากรอกชื่อ และเลือกสถานที่");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/meeting-places`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            title,
            latitude: lat,
            longitude: lng,
            address,
          },
        }),
      }
    );

    if (!res.ok) {
      alert("บันทึกไม่สำเร็จ");
      return;
    }

    alert("บันทึกสำเร็จ ✅");
  };

  return (
    <div>
        <SelectLocationMap
          isOpen={true}
          onClose={() => {}}
          onSubmit={(data) => {

          }}
          isLoading={false}
        />
    </div>
  );
}
