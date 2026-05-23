"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface AntigravityCatToggleProps {
  className?: string;
}

interface CatRoute {
  id: number;
  duration: number;
  top: number[];
  left: number[];
  scaleX: number[];
  y: number[];
  times: number[];
}

const CAT_ROUTE_PAUSE_MS = 2800;
const CAT_INITIAL_CENTER_PAUSE_MS = 1200;
const CAT_CENTER_ROUTE_EXIT_MS = 2600;
const CAT_TRACK_WIDTH = 76;
const CAT_ROUTE_TIMES = [0, 0.015, 0.33, 0.39, 0.55, 0.61, 0.82, 1];
const CAT_FALL_DISTANCE = 220;
const CAT_FALL_DURATION = 1.05;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createCatRoute(startsAtCenter = false): CatRoute {
  const viewportWidth = window.innerWidth;
  const startsFromLeft = Math.random() > 0.5;
  const firstTurn = startsFromLeft ? randomBetween(30, 58) : randomBetween(42, 70);
  const recoilTurn = startsFromLeft
    ? Math.max(12, firstTurn - randomBetween(12, 24))
    : Math.min(88, firstTurn + randomBetween(12, 24));
  const finalPush = startsFromLeft
    ? randomBetween(Math.max(firstTurn + 14, 62), 84)
    : randomBetween(16, Math.min(firstTurn - 14, 38));
  const routeTop = randomBetween(7, 13);
  const normalLeft = startsFromLeft
    ? [
        -92,
        12,
        (viewportWidth * firstTurn) / 100,
        (viewportWidth * firstTurn) / 100,
        (viewportWidth * recoilTurn) / 100,
        (viewportWidth * recoilTurn) / 100,
        (viewportWidth * finalPush) / 100,
        viewportWidth + 16,
      ]
    : [
        viewportWidth + 16,
        viewportWidth - 88,
        (viewportWidth * firstTurn) / 100,
        (viewportWidth * firstTurn) / 100,
        (viewportWidth * recoilTurn) / 100,
        (viewportWidth * recoilTurn) / 100,
        (viewportWidth * finalPush) / 100,
        -92,
      ];
  const normalScaleX = startsFromLeft
    ? [1, 1, 1, -1, -1, 1, 1, 1]
    : [-1, -1, -1, 1, 1, -1, -1, -1];
  const normalY = [
    0,
    randomBetween(-1, 1),
    randomBetween(-2, 1),
    0,
    randomBetween(-1, 2),
    0,
    randomBetween(-2, 1),
    0,
  ];

  if (startsAtCenter) {
    const normalDuration = randomBetween(82, 112);
    const initialPauseSeconds = CAT_INITIAL_CENTER_PAUSE_MS / 1000;
    const centerExitSeconds = CAT_CENTER_ROUTE_EXIT_MS / 1000;
    const totalDuration = normalDuration + initialPauseSeconds + centerExitSeconds;
    const firstVisibleRouteTime = CAT_ROUTE_TIMES[1];
    const normalizedRouteTime = (time: number) =>
      (
        initialPauseSeconds +
        centerExitSeconds +
        ((time - firstVisibleRouteTime) / (1 - firstVisibleRouteTime)) * normalDuration
      ) / totalDuration;

    return {
      id: Date.now() + Math.random(),
      duration: totalDuration,
      top: [
        routeTop,
        routeTop,
        ...normalLeft.slice(1).map(() => routeTop),
      ],
      left: [
        viewportWidth / 2 - CAT_TRACK_WIDTH / 2,
        viewportWidth / 2 - CAT_TRACK_WIDTH / 2,
        ...normalLeft.slice(1),
      ],
      scaleX: [1, 1, ...normalScaleX.slice(1)],
      y: [0, 0, ...normalY.slice(1)],
      times: [
        0,
        initialPauseSeconds / totalDuration,
        (initialPauseSeconds + centerExitSeconds) / totalDuration,
        ...CAT_ROUTE_TIMES.slice(2).map(normalizedRouteTime),
      ],
    };
  }

  return {
    id: Date.now() + Math.random(),
    duration: randomBetween(82, 112),
    top: normalLeft.map(() => routeTop),
    left: normalLeft,
    scaleX: normalScaleX,
    y: normalY,
    times: CAT_ROUTE_TIMES,
  };
}

function CatGraphic() {
  return (
    <div className="anti-gravity-cat">
      <span className="anti-gravity-cat__tail" />
      <span className="anti-gravity-cat__body" />
      <span className="anti-gravity-cat__head">
        <span className="anti-gravity-cat__eye anti-gravity-cat__eye--left" />
        <span className="anti-gravity-cat__eye anti-gravity-cat__eye--right" />
      </span>
      <span className="anti-gravity-cat__paw anti-gravity-cat__paw--front" />
      <span className="anti-gravity-cat__paw anti-gravity-cat__paw--back" />
    </div>
  );
}

export default function AntigravityCatToggle({ className = "" }: AntigravityCatToggleProps) {
  const [catEnabled, setCatEnabled] = useState(false);
  const [catRoute, setCatRoute] = useState<CatRoute | null>(null);
  const [catFalling, setCatFalling] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const showCatLayer = catEnabled || catFalling;

  useEffect(() => {
    if (!catEnabled || catFalling || shouldReduceMotion) {
      return;
    }

    if (!catRoute) {
      return;
    }

    const routeTimer = window.setTimeout(() => {
      setCatRoute(createCatRoute());
    }, catRoute.duration * 1000 + CAT_ROUTE_PAUSE_MS);

    return () => window.clearTimeout(routeTimer);
  }, [catEnabled, catFalling, catRoute, shouldReduceMotion]);

  const handleToggleClick = () => {
    if (catEnabled) {
      setCatEnabled(false);
      setCatFalling(false);
      setCatRoute(null);
      return;
    }

    setCatRoute(createCatRoute(true));
    setCatFalling(false);
    setCatEnabled(true);
  };

  const handleCatClick = () => {
    setCatEnabled(false);

    if (shouldReduceMotion || !catRoute) {
      setCatFalling(false);
      setCatRoute(null);
      return;
    }

    setCatFalling(true);
  };

  const handleCatFallComplete = () => {
    if (!catFalling) {
      return;
    }

    setCatFalling(false);
    setCatRoute(null);
  };

  const catGraphic = (
    <motion.div
      animate={
        catFalling
          ? { y: CAT_FALL_DISTANCE, rotate: 18, opacity: 0 }
          : { y: 0, rotate: 0, opacity: 1 }
      }
      transition={
        catFalling
          ? { duration: CAT_FALL_DURATION, ease: "easeIn" }
          : { duration: 0.2, ease: "easeOut" }
      }
      onAnimationComplete={handleCatFallComplete}
    >
      <CatGraphic />
    </motion.div>
  );

  return (
    <>
      <button
        type="button"
        aria-pressed={catEnabled}
        aria-label={catEnabled ? "Disable antigravity cat" : "Enable antigravity cat"}
        onClick={handleToggleClick}
        className={`relative z-20 flex items-center gap-2 rounded-full px-1.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
          catEnabled
            ? "text-agy-green"
            : "text-text-muted hover:text-agy-cyan"
        } ${className}`}
      >
        <span aria-hidden="true" className="text-sm leading-none">🐈</span>
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 rounded-full border transition-all duration-300 ${
            catEnabled
              ? "border-agy-green/45 bg-agy-green shadow-[0_0_16px_rgba(0,255,102,0.28)]"
              : "border-slate-700/80 bg-slate-800/90 shadow-inner shadow-black/35"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-all duration-300 ${
              catEnabled ? "left-[1.35rem]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      <AnimatePresence>
        {showCatLayer && (
          <motion.div
            aria-hidden="true"
            className="anti-gravity-cat-layer pointer-events-none fixed inset-0 overflow-visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {shouldReduceMotion || !catRoute ? (
              <div
                className="anti-gravity-cat-track anti-gravity-cat-track--center pointer-events-auto cursor-pointer"
                onClick={handleCatClick}
              >
                {catGraphic}
              </div>
            ) : (
              <motion.div
                key={catRoute.id}
                className="anti-gravity-cat-track pointer-events-auto cursor-pointer"
                onClick={handleCatClick}
                initial={{
                  left: catRoute.left[0],
                  top: catRoute.top[0],
                  scaleX: catRoute.scaleX[0],
                  y: catRoute.y[0],
                }}
                animate={{
                  left: catRoute.left,
                  top: catRoute.top,
                  scaleX: catRoute.scaleX,
                  y: catRoute.y,
                }}
                transition={{
                  duration: catRoute.duration,
                  ease: "easeInOut",
                  times: catRoute.times,
                }}
              >
                {catGraphic}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
