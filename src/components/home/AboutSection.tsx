import React from "react";
import { Container } from "@/components/ui/Container";
import { Cpu, Lightbulb, Users2, GraduationCap } from "lucide-react";

export function AboutSection() {
  const pillars = [
    {
      icon: Cpu,
      title: "Technical Skills",
      description:
        "Explore technical challenges that encourage logical thinking, programming skills, and engineering problem-solving.",
    },
    {
      icon: Lightbulb,
      title: "Innovation & Projects",
      description:
        "Develop and present projects, prototypes, and ideas that demonstrate creativity and practical application.",
    },
    {
      icon: Users2,
      title: "Collaboration & Learning",
      description:
        "Exchange ideas, learn from fellow students, and collaborate on technical and research-oriented activities.",
    },
    {
      icon: GraduationCap,
      title: "Student Development",
      description:
        "Build technical confidence, strengthen presentation skills, and gain experience by participating in innovation-focused activities.",
    },
  ];

  return (
    <section id="about" className="py-10 sm:py-12 lg:py-14 bg-[#F8FAFC]/70 border-b border-[#D9E4F2]">
      <Container>
        <div className="max-w-4xl mx-auto text-center space-y-2.5 mb-7 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#174789] text-[11px] font-semibold uppercase tracking-wider border border-[#D9E4F2]">
            ABOUT AVISHKAR
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#174789] tracking-tight leading-snug">
            A Platform for Innovation and Technical Excellence
          </h2>
          <div className="space-y-2 text-[15px] sm:text-base text-[#475569] leading-relaxed max-w-3xl mx-auto">
            <p>
              AVISHKAR is the Center of Innovation and Entrepreneurship at GD Goenka University. It provides students with opportunities to explore new ideas, apply their technical knowledge, and present their work through innovation-focused activities and competitions.
            </p>
            <p>
              The initiative encourages practical learning, creative problem-solving, and collaboration, helping students connect academic concepts with real-world applications.
            </p>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5 lg:gap-5">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="flex flex-col text-left bg-white border border-[#D9E4F2] rounded-lg p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-md bg-[#EFF6FF] text-[#174789] flex items-center justify-center mb-3 border border-[#D9E4F2] shrink-0">
                  <Icon className="w-5 h-5 text-[#0D9488]" />
                </div>
                <h3 className="text-base sm:text-[17px] font-bold text-[#174789] mb-1.5 leading-snug">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#475569] leading-relaxed flex-1">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}


