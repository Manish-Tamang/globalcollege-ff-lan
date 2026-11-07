import type { Metadata } from "next";
import { connection } from "next/server";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PageHero } from "../components/ui/page-hero";
import { GridSection } from "../components/ui/grid-section";
import { Button } from "../components/ui/button";
import { EVENT } from "../data/event";
import { isRegistrationOpen } from "../lib/supabase/server";
import { RegistrationForm } from "./RegistrationForm";

export const metadata: Metadata = {
  title: "Register your squad",
  description: `Register a team of four for ${EVENT.name}. NPR ${EVENT.feeNpr} per team.`,
};

export default async function RegisterPage() {
  await connection();
  const open = await isRegistrationOpen();

  return (
    <div className="w-full bg-white">
      <Navbar showRegister={false} />
      <main>
        <PageHero
          align="center"
          title={
            <>
              Register your <span className="hl">squad</span>
            </>
          }
          description={
            <p>
              Four players, one team name, NPR {EVENT.feeNpr}. Every player
              reads the rules and agrees before payment.
            </p>
          }
        />
        {open ? (
          <RegistrationForm />
        ) : (
          <GridSection innerClassName="flex flex-col items-center px-5 py-20 text-center">
            <h2 className="section-title text-2xl">
              Registration is closed
            </h2>
            <p className="mt-3 max-w-md text-neutral-500">
              We are not taking new teams right now. Keep an eye on the GSS IT
              Club pages for updates.
            </p>
            <Button href="/" variant="secondary" className="mt-8">
              Back to home
            </Button>
          </GridSection>
        )}
      </main>
      <Footer />
    </div>
  );
}
