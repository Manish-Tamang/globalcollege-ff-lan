import Image from "next/image";
import { ArrowRight, Button } from "../ui/button";
import { GridSection } from "../ui/grid-section";
import { EVENT } from "../../data/event";

/** Closing band, Alfsight layout: copy in the middle, characters either side. */
export function CallToAction({ isRegistrationOpen }: { isRegistrationOpen: boolean }) {
  return (
    <GridSection innerClassName="grid min-h-[380px] grid-cols-1 lg:grid-cols-[1fr_minmax(0,460px)_1fr]">
      <Side src="/mini-angelic.png" align="right" />

      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <h2 className="section-title text-3xl sm:text-[32px] sm:leading-tight">
          Get your squad <span className="hl">on the LAN</span>
        </h2>
        <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-neutral-600">
          Four players, one team name, NPR {EVENT.feeNpr}. Slots are confirmed once your
          payment is verified.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href={isRegistrationOpen ? "/register" : "#rules"} disabled={!isRegistrationOpen}>
            {isRegistrationOpen ? "Register your squad" : "Registration closed"}
            <ArrowRight />
          </Button>
          <Button href="#rules" variant="secondary">
            Read the rules
          </Button>
        </div>
      </div>

      <Side src="/mini-kelly.png" align="left" />
    </GridSection>
  );
}

function Side({ src, align }: { src: string; align: "left" | "right" }) {
  return (
    <div className="relative hidden overflow-hidden lg:block" aria-hidden="true">
      <span className={`dots-y absolute inset-y-0 ${align === "right" ? "right-0" : "left-0"}`} />
      <div className="sky-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <Image
        src={src}
        alt=""
        width={272}
        height={480}
        sizes="150px"
        className="absolute bottom-0 left-1/2 h-[260px] w-auto -translate-x-1/2 drop-shadow-xl"
      />
    </div>
  );
}
