import Image from "next/image";
import { ArrowRight, Button } from "../ui/button";
import { HeroStickers } from "./HeroStickers";
import { EVENT, SPONSORS } from "../../data/event";

const REVEAL = "animate-slide-up-fade motion-reduce:animate-fade-in";

export function Hero({ isRegistrationOpen }: { isRegistrationOpen: boolean }) {
  return (
    <section className="relative overflow-hidden px-4">
      {/* Soft brand sky that fades into the page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px]" aria-hidden="true">
        <div className="sky absolute inset-0" />
        <div className="sky-dots absolute inset-0" />
      </div>

      <div className="frame px-4 pb-44 pt-32 sm:pt-40 lg:pb-16">
        <HeroStickers />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p
            className={`inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-neutral-700 shadow-sm shadow-black/5 ring-1 ring-black/5 [--offset:10px] ${REVEAL}`}
          >
            <span
              className={`size-1.5 rounded-full ${isRegistrationOpen ? "bg-emerald-500" : "bg-neutral-400"}`}
              aria-hidden="true"
            />
            {isRegistrationOpen ? "Registration open" : "Registration closed"} · NPR {EVENT.feeNpr} per team
          </p>

          <h1
            className={`section-title mt-6 text-[2.5rem] leading-[1.1] [--offset:20px] [animation-delay:50ms] sm:text-5xl md:text-6xl ${REVEAL}`}
          >
            GSS Free Fire <span className="hl">LAN tournament</span>
          </h1>

          <p
            className={`mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-neutral-700 [animation-delay:100ms] sm:text-lg ${REVEAL}`}
          >
            An inter-college squad tournament for Grade 11 and 12 students.
            Four players from one college, three maps, played on the LAN.
          </p>

          <div className={`mt-8 flex flex-col justify-center gap-3 [animation-delay:150ms] sm:flex-row ${REVEAL}`}>
            <Button href={isRegistrationOpen ? "/register" : "#rules"} disabled={!isRegistrationOpen}>
              {isRegistrationOpen ? "Register your squad" : "Registration closed"}
              <ArrowRight />
            </Button>
            <Button href="#rules" variant="secondary">
              Read the rules
            </Button>
          </div>

          <p className={`mt-6 text-sm text-neutral-500 [animation-delay:200ms] ${REVEAL}`}>
            {EVENT.dateLabel} · {EVENT.venue}
          </p>
        </div>

        <dl
          className={`relative z-10 mx-auto mt-14 flex max-w-md flex-col items-center gap-8 [animation-delay:300ms] sm:flex-row sm:justify-center sm:gap-12 ${REVEAL}`}
        >
          {[SPONSORS.title, SPONSORS.poweredBy].map((sponsor) => (
            <div key={sponsor.short} className="flex flex-col items-center gap-3">
              <dt className="text-sm font-medium text-neutral-800">{sponsor.role}</dt>
              <dd>
                <Image
                  src={sponsor.logo.src}
                  alt={sponsor.name}
                  width={sponsor.logo.width}
                  height={sponsor.logo.height}
                  sizes="220px"
                  className="h-8 w-auto"
                />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="frame" aria-hidden="true">
        <div className="dots-x mx-2" />
      </div>
    </section>
  );
}
