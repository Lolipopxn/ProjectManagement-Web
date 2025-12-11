"use client";

import {
  RiProgress1Line,
  RiProgress2Line,
  RiProgress3Line,
  RiProgress4Line,
  RiProgress5Line,
  RiProgress6Line,
  RiProgress7Line,
  RiProgress8Line,
} from "react-icons/ri";

const progressFrames = [
  RiProgress1Line,
  RiProgress2Line,
  RiProgress3Line,
  RiProgress4Line,
  RiProgress5Line,
  RiProgress6Line,
  RiProgress7Line,
  RiProgress8Line,
];

import { useState, useEffect } from "react";

export default function ProgressAnimation({
  size = 28,
  speed = 120, // ms:frame
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % progressFrames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [speed]);

  const Icon = progressFrames[frame];

  return <Icon size={size} className="text-[#6E8CFB]" />;
}
