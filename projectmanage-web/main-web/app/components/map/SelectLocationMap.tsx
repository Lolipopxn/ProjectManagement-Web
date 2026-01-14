"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";

import { IoMdArrowRoundBack } from "react-icons/io";
import { FaPlus, FaSearch  } from "react-icons/fa";

import {
  GoogleMap,
  Marker,
  Autocomplete,
  useLoadScript,
} from "@react-google-maps/api";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    taskName: string;
    description: string;
    dueDate: string;
    dueTime: string;
    beginDate: string;
    beginTime: string;
    color: string;
    assignedUserId: number | null;
    latitude: number | null;
    longitude: number | null;
    address: string;

  }) => void;
  isLoading: boolean;
}

type LatLng = { lat: number; lng: number };

const libraries: "places"[] = ["places"];

export default function SelectLocationMap({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateTaskModalProps) {

  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('00:00');
  const [beginDate, setBeginDate] = useState('');
  const [beginTime, setBeginTime] = useState('00:00');
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("white");

  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string>("");
  const defaultCenter = { lat: 13.7563, lng: 100.5018 }; // Bangkok

  const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const center = useMemo(
    () => markerPos ?? defaultCenter,
    [markerPos, defaultCenter]
  );

  const handlePlaceChanged = () => {
    const place = autoCompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formatted = place.formatted_address || place.name || "";

    setMarkerPos({ lat, lng });
    setAddress(formatted);
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit({
        taskName: taskName.trim(),
        description: description.trim(),
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        dueTime,
        beginDate: beginDate || new Date().toISOString().split('T')[0],
        beginTime,
        assignedUserId,
        color: selectedColor,
        latitude: markerPos?.lat || null,
        longitude: markerPos?.lng || null,  
        address: address || '',     
      });

    } catch (err) {
        console.error("submit failed", err);
    }
    finally{
      resetForm();

    }
  };

  const resetForm = () => {
    setTaskName('');
    setDescription('');
    setDueDate('');
    setDueTime('00:00');
    setBeginDate('');
    setBeginTime('00:00');
    setAssignedUserId(null);
    setSelectedColor('white')
    setMarkerPos(null);
    setAddress('');
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 shadow-lg bg-white z-99 flex flex-col items-center justify-center transform animate-in slide-in-from-bottom-4 duration-200 space-y-3">
      <div className="grid grid-cols-2 gap-4 w-full h-full p-6">
        {/* left */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* close */}
          <div className="w-full">
            <button className="flex flex-row items-center gap-2 hover:bg-gray-200 rounded-full py-2 px-4">
              <IoMdArrowRoundBack className="size-4" />
              <span
                className="cursor-pointer text-lg font-medium"
                onClick={resetForm}
              >
                กลับ
              </span>
            </button>
          </div>
          {/* title */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 truncate">
            <span className="text-2xl font-semibold">เพิ่มการนัดหมาย</span>
            <p className="text-gray-600">
              สามารถนัดหมายการประชุมผ่านฟอร์มนี้
              เเละสามารถเลือกสถานที่นัดหมายจากแผนที่ด้านขวา
            </p>

            {/* input details */}
            <div className="flex flex-col rounded-lg border-2 gap-2 p-2 border-gray-200 hover:border-[#636CCB] truncate">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="p-2 outline-none text-lg"
                  placeholder="หัวข้อการนัดหมาย"
                />
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-md p-2 outline-2 min-h-15 h-40 max-h-40 outline-none"  placeholder="รายละเอียดเพิ่มเติม..." 
                />
              </div>
              
               <div className="border w-full border-gray-200"></div>

               <div className="flex flex-col gap-2 px-2 py-4">
                {/* date & time begin */}
                <div className="flex flex-row items-center justify-start gap-4">              
                  <div className="flex flex-col flex-2 gap-2">
                    <label className="text-sm">วันนัดหมาย</label>
                    <input 
                      type="date"
                      value={beginDate} 
                      onChange={(e) => setBeginDate(e.target.value)}
                      className="ml-1 outline-1 rounded-lg bg-gray-100 outline-gray-300 py-1 px-4 focus:outline-2 focus:outline-[#636CCB]"/>
                  </div>
                  
                  <div className="flex gap-2 flex-col flex-1">
                    <label className="text-sm">ตั้งเเต่</label>
                  <input 
                    type="time" 
                    value={beginTime}
                    onChange={(e) => setBeginTime(e.target.value)}
                    className="ml-1 outline-1 rounded-lg bg-gray-100 outline-gray-300 py-1 px-4 focus:outline-2 focus:outline-[#636CCB]"/>
                  </div>                
                </div>

                {/* date & time end */}
                <div className="flex flex-row items-center justify-start gap-4">              
                  <div className="flex flex-col flex-2 gap-2">
                    <label className="text-sm">วันที่สิ้นสุด</label>
                    <input 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      type="date" 
                      className="ml-1 outline-1 rounded-lg bg-gray-100 outline-gray-300 py-1 px-4 focus:outline-2 focus:outline-[#636CCB]"/>
                  </div>
                  
                  <div className="flex gap-2 flex-col flex-1">
                    <label className="text-sm">จนถึง</label>
                  <input 
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    type="time" 
                    className="ml-1 outline-1 rounded-lg bg-gray-100 outline-gray-300 py-1 px-4 focus:outline-2 focus:outline-[#636CCB]"/>
                  </div>                
                </div>
             
               </div>        
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit" 
                disabled={isLoading}
                className="py-3 px-4 border-1 border-[#636CCB] shadow-md rounded-lg flex flex-row items-center gap-2 text-sm text-white bg-[#636CCB]/80 hover:bg-[#636CCB] disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </>
                ) : (
                  <>
                    <FaPlus className="size-3"/>
                    เพิ่มการนัดหมาย
                  </>
                )}
                
              </button>
            </div>

          </form>
          
        </div>

        {/* right */}
        <div className="col-span-1 flex flex-col gap-2 border-l border-gray-300 px-4 py-2">
          {/* Search Input */}
          <div className=" bg-white py-2">
            <Autocomplete
              onLoad={(ac) => (autoCompleteRef.current = ac)}
              onPlaceChanged={handlePlaceChanged}
            >
               <div className="relative w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />

                  <input
                    className="w-full rounded-full border-2 border-gray-400 px-10 py-2 outline-none"
                    placeholder="พิมพ์ชื่อสถานที่ เช่น มหาวิทยาลัยสงขลานครินทร์"
                  />
              </div>
            </Autocomplete>

            {address && (
              <div className="mt-2 text-sm text-gray-600">
                <b>เลือกแล้ว:</b> {address}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="h-full w-full overflow-hidden rounded-2xl border border-gray-200 shadow-md">
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={center}
              zoom={16}
              onClick={(e) => {
                if (!e.latLng) return;
                const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                setMarkerPos(pos);
              }}
            >
              {markerPos && <Marker position={markerPos} />}
            </GoogleMap>
          </div>
        </div>
      </div>
    </div>
  );
}
