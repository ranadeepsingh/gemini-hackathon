"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function MouseSpotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Set up springs to create a smooth, organic trailing effect
  const springConfigSlow = { stiffness: 45, damping: 25, mass: 1.5 };
  const springConfigMedium = { stiffness: 75, damping: 28, mass: 1 };
  const springConfigFast = { stiffness: 120, damping: 30, mass: 0.8 };

  const shadowX1 = useSpring(mouseX, springConfigSlow);
  const shadowY1 = useSpring(mouseY, springConfigSlow);

  const shadowX2 = useSpring(mouseX, springConfigMedium);
  const shadowY2 = useSpring(mouseY, springConfigMedium);

  const shadowX3 = useSpring(mouseX, springConfigFast);
  const shadowY3 = useSpring(mouseY, springConfigFast);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Dynamic Ambient Spotlights that follow the mouse with different lag speeds */}
      
      {/* 1. Nebula Indigo Orb (Slow trailing, large blur) */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px]"
        style={{
          x: shadowX1,
          y: shadowY1,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* 2. Starlight Violet Orb (Medium trailing, medium blur) */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full bg-purple-600/10 blur-[100px]"
        style={{
          x: shadowX2,
          y: shadowY2,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* 3. Antigravity Cyan Orb (Fast trailing, tight bright focus) */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full bg-cyan-400/10 blur-[75px]"
        style={{
          x: shadowX3,
          y: shadowY3,
          translateX: "-50%",
          translateY: "-50%",
         }}
      />

      {/* 4. Fine cursor reflection point (Instant tracking, very subtle) */}
      <motion.div
        className="absolute w-[120px] h-[120px] rounded-full bg-white/[0.03] blur-[30px]"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </div>
  );
}
