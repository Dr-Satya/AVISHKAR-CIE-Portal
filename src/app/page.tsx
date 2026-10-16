import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { HighlightsSection } from "@/components/home/HighlightsSection";
import { GuidelinesSection } from "@/components/home/GuidelinesSection";
import { ContactSection } from "@/components/home/ContactSection";
import { CtaSection } from "@/components/home/CtaSection";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <AboutSection />
      <HighlightsSection />
      <GuidelinesSection />
      <ContactSection />
      <CtaSection />
    </div>
  );
}
