"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { EVENT } from "../data/event";

type NavigationLink = { name: string; link: string };

const navigationLinks: readonly NavigationLink[] = [
  { name: "Format", link: "#format" },
  { name: "Points", link: "#points" },
  { name: "Rules", link: "#rules" },
  { name: "Register", link: "#how-to-register" },
];

/** Floating rounded bar, like Alfsight: logo left, links centred, CTA right. */
export default function Navbar({ showRegister = true }: { showRegister?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-4 top-4 z-50 mx-auto max-w-3xl md:top-6">
      <div className="relative flex items-center justify-between rounded-2xl bg-white/90 p-2 shadow-sm shadow-black/5 ring-1 ring-black/5 backdrop-blur">
        <Link href="/" aria-label="Home" className="flex items-center gap-2 pl-1 md:pl-2">
          <Image src="/gss-it-club-logo.png" alt="" width={64} height={64} priority className="size-7 rounded-full" />
          <span className="text-[17px] font-semibold tracking-tight text-neutral-800">{EVENT.organiser}</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 md:flex">
          {navigationLinks.map((link, i) => (
            <Fragment key={link.name}>
              {i > 0 && <span className="size-1 rounded-full bg-brand-500" aria-hidden="true" />}
              <NavLink {...link} className="text-sm font-medium text-neutral-800 transition-colors hover:text-brand-700" />
            </Fragment>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {showRegister && (
            <Button href="/register" size="sm">
              Register
            </Button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex size-9 flex-col items-center justify-center rounded-[10px] transition-colors hover:bg-neutral-100 md:hidden"
          >
            <span className={cn("block h-0.5 w-4 bg-neutral-800 transition-transform duration-200", open && "translate-y-[3px] rotate-45")} />
            <span className={cn("mt-1 block h-0.5 w-4 bg-neutral-800 transition-transform duration-200", open && "-translate-y-[3px] -rotate-45")} />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="mt-2 flex flex-col rounded-2xl bg-white p-2 shadow-lg shadow-black/5 ring-1 ring-black/5 md:hidden">
          {navigationLinks.map((link) => (
            <NavLink
              key={link.name}
              {...link}
              onNavigate={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50"
            />
          ))}
        </div>
      )}
    </nav>
  );
}

/** Section links scroll on the homepage and navigate there from elsewhere. */
function NavLink({ name, link, className, onNavigate }: NavigationLink & { className: string; onNavigate?: () => void }) {
  const path = usePathname();

  return (
    <Link
      href={`/${link}`}
      prefetch={false}
      onClick={(e) => {
        onNavigate?.();
        if (path !== "/") return;
        e.preventDefault();
        document.querySelector(link)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className={className}
    >
      {name}
    </Link>
  );
}
