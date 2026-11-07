import { connection } from "next/server";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Hero } from "./components/landing/Hero";
import { Stats } from "./components/landing/Stats";
import { Format } from "./components/landing/Format";
import { Points } from "./components/landing/Points";
import { Eligibility } from "./components/landing/Eligibility";
import { RulesSection } from "./components/landing/RulesSection";
import { HowToRegister } from "./components/landing/HowToRegister";
import { CallToAction } from "./components/landing/CallToAction";
import { isRegistrationOpen } from "./lib/supabase/server";

export default async function Home() {
  // Render per request so the dashboard's open/closed switch shows up live.
  await connection();
  const open = await isRegistrationOpen();

  return (
    <div className="w-full bg-white">
      <Navbar showRegister={open} />
      <main>
        <Hero isRegistrationOpen={open} />
        <Stats />
        <Format />
        <Points />
        <Eligibility />
        <RulesSection />
        <HowToRegister />
        <CallToAction isRegistrationOpen={open} />
      </main>
      <Footer />
    </div>
  );
}
