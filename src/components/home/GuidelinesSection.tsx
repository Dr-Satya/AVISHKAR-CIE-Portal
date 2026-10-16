import React from "react";
import { Container } from "@/components/ui/Container";
import { UserCheck, FileCheck, ShieldCheck, Scale, CheckCircle2 } from "lucide-react";

export function GuidelinesSection() {
  const policySections = [
    {
      icon: UserCheck,
      title: "Eligibility & Participation",
      points: [
        "Participation is open to eligible students in accordance with the requirements specified for each event.",
        "Participants must provide accurate academic and identification details during registration.",
        "A valid student identity card may be required for identity verification and campus entry.",
        "Interdisciplinary participation and team composition are subject to the rules of the respective event.",
        "Participants must comply with applicable university policies and instructions issued by the organizing committee.",
      ],
    },
    {
      icon: FileCheck,
      title: "Registration & Payment Verification",
      points: [
        "Participants must complete the official registration process through the designated AVISHKAR registration portal.",
        "Registration details must be accurate, complete, and submitted within the applicable registration period.",
        "Registration fees, where applicable, are determined by the respective event's published registration requirements.",
        "Payment confirmation is subject to verification by the authorized administration team.",
        "Submission of a payment receipt or screenshot does not, by itself, constitute payment approval.",
        "Registration or participation confirmation will be issued only after the applicable verification and approval requirements have been satisfied.",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Academic Integrity & Professional Conduct",
      points: [
        "All submissions must comply with the originality, attribution, and intellectual property requirements specified for the event.",
        "Plagiarism, misrepresentation of authorship, unauthorized use of others' work, and other forms of academic misconduct may result in disqualification.",
        "Participants must follow event-specific rules regarding permitted tools, software, datasets, external assistance, and AI-generated content.",
        "Participants must treat fellow participants, faculty members, judges, volunteers, and organizers with professionalism and respect.",
        "The organizing committee may review reported violations and apply appropriate measures in accordance with the published event rules.",
      ],
    },
    {
      icon: Scale,
      title: "Event Administration & Decisions",
      points: [
        "Participants must follow the official event schedule, submission deadlines, venue instructions, and competition procedures.",
        "Any changes to schedules, eligibility criteria, or participation requirements will be communicated through official channels where applicable.",
        "Judging criteria and evaluation procedures will be governed by the rules published for the respective event.",
        "Decisions will be handled by the authorized judging panel or organizing committee in accordance with the applicable event rules.",
        "Questions or concerns regarding registration, payments, eligibility, or event procedures should be directed to the designated organizing team.",
      ],
    },
  ];

  return (
    <section id="guidelines" className="py-14 sm:py-16 lg:py-20 bg-[#F8FAFC]/70 border-b border-[#D9E4F2]">
      <Container>
        {/* Section Header */}
        <div className="max-w-4xl mx-auto text-center space-y-3 mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EFF6FF] text-[#174789] text-xs font-semibold uppercase tracking-wider border border-[#D9E4F2]">
            OFFICIAL EVENT POLICY
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#174789] tracking-tight leading-snug">
            Event Guidelines &amp; Participation Policies
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#475569] leading-relaxed max-w-3xl mx-auto">
            These guidelines establish the requirements for participant eligibility, registration, verification, academic integrity, and professional conduct for AVISHKAR events organized by GD Goenka University. All participants are expected to review and comply with the applicable event requirements.
          </p>
        </div>

        {/* 4 Policy Cards Grid (2x2 on desktop, 1-col on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {policySections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="flex flex-col text-left bg-white border border-[#D9E4F2] rounded-xl p-6 sm:p-7 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all duration-200"
              >
                {/* Header with Icon & Title */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] text-[#174789] flex items-center justify-center border border-[#D9E4F2] shrink-0">
                    <Icon className="w-5 h-5 text-[#0D9488]" />
                  </div>
                  <h3 className="text-lg sm:text-[19px] font-bold text-[#174789] leading-snug">
                    {section.title}
                  </h3>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-3 text-[13.5px] text-[#475569] leading-relaxed flex-1">
                  {section.points.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Participant Acknowledgement Notice */}
        <div className="mt-8 sm:mt-10 bg-white border border-[#D9E4F2] rounded-xl p-6 sm:p-7 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] border border-[#D9E4F2] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-base font-bold text-[#174789]">
                Participant Acknowledgement
              </h4>
              <p className="text-[13.5px] text-[#475569] leading-relaxed">
                By registering for an AVISHKAR event, participants acknowledge that they have reviewed the applicable event guidelines and agree to comply with the published requirements. Participants are responsible for ensuring the accuracy of their submitted information and meeting all applicable deadlines and participation conditions.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
