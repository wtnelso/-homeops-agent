import { Brain, Calendar, Users, Shield } from "lucide-react";

const pillars = [
  {
    icon: Brain,
    title: "Agentic Email Intelligence",
    features: [
      "Detects invites, deadlines, instructions, forms, payments, and key logistics",
      "Extracts time, place, people, and actions",
      "Creates a proposed task or event that you approve",
      "Learns patterns over time—which school emails matter and which newsletters don't",
    ],
  },
  {
    icon: Calendar,
    title: "AI Calendar",
    features: [
      "Creates events from emails with correct duration and location",
      "Suggests time slots that avoid conflicts",
      "Auto-adds travel buffers and prep blocks",
      "Flags missing info and asks a clear question to fill it",
    ],
  },
  {
    icon: Users,
    title: "Family Coordination",
    features: [
      "Share events and tasks to a partner view",
      "Assign ownership and due dates",
      "Weekly digest every Sunday morning with what's ahead",
      "Clear accountability that's simple and stress-free",
    ],
  },
  {
    icon: Shield,
    title: "Privacy and Control",
    features: [
      "Read-only Gmail during beta",
      "Principle of least access",
      "Clear approvals before anything is added or shared",
      "Data encryption at rest and in transit",
    ],
  },
];

export const ProductPillars = () => {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 border-t border-border">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-12 sm:mb-16 text-center leading-tight tracking-tight"
            style={{ textShadow: '0 2px 16px rgba(0, 0, 0, 0.06)' }}>
          Core product pillars
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="flex items-start gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#4C6FFF] to-[#9C4DFF] flex items-center justify-center shadow-[0_4px_12px_rgba(76,111,255,0.3)] flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold">{pillar.title}</h3>
                </div>
                <ul className="space-y-3">
                  {pillar.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-r from-[#4C6FFF] to-[#9C4DFF] mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground leading-relaxed text-sm sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
