"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";
import { cn } from "../../lib/utils";

const STICKERS = [
  {
    src: "/mini-kelly.png",
    alt: "",
    // Bottom corners on phones and tablets, either side of the title on desktop.
    position: "bottom-4 left-0 lg:bottom-auto lg:left-[3%] lg:top-[40%]",
    tilt: -6,
  },
  {
    src: "/mini-angelic.png",
    alt: "",
    position: "bottom-4 right-0 lg:bottom-auto lg:right-[4%] lg:top-[16%]",
    tilt: 5,
  },
];

/**
 * Free Fire characters you can drag around the hero, like on Godawari LAN.
 * They stay inside the hero and spring back a little at the edges.
 */
export function HeroStickers() {
  const bounds = useRef<HTMLDivElement>(null);

  return (
    <div ref={bounds} className="pointer-events-none absolute inset-0 z-20">
      {STICKERS.map((sticker) => (
        <motion.div
          key={sticker.src}
          drag
          dragConstraints={bounds}
          dragElastic={0.15}
          dragMomentum={false}
          initial={{ opacity: 0, y: 20, rotate: sticker.tilt }}
          animate={{ opacity: 1, y: 0, rotate: sticker.tilt }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.05 }}
          whileDrag={{ scale: 1.1, rotate: 0, cursor: "grabbing" }}
          className={cn(
            "pointer-events-auto absolute h-36 w-24 cursor-grab touch-none select-none drop-shadow-xl sm:h-40 sm:w-28 lg:h-72 lg:w-44",
            sticker.position,
          )}
        >
          <Image
            src={sticker.src}
            alt={sticker.alt}
            fill
            sizes="(min-width: 1024px) 176px, 112px"
            draggable={false}
            className="pointer-events-none object-contain"
          />
        </motion.div>
      ))}
    </div>
  );
}
