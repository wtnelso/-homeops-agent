import { Mail, Zap, Users } from "lucide-react";

const steps = [
  {
    icon: Mail,
    number: "01",
    title: "Connect Gmail",
    description: "HomeOps scans only the subject, sender, and essential details to detect school updates, event invites, medical appointments, travel, and bills.",
  },
  {
    icon: Zap,
    number: "02",
    title: "Turn insight into a plan",
    description: "The agent creates clean tasks and calendar events with the right people, place, and time. You approve with one tap.",
  },
  {
    icon: Users,
    number: "03",
    title: "Coordinate the family",
    description: "Share a weekly plan that everyone can see. Delegate without being the bottleneck.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1000px] mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center leading-tight tracking-tight"
            style={{ textShadow: '0 2px 16px rgba(0, 0, 0, 0.06)' }}>
          How it works
        </h2>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 transition-all duration-300 hover:bg-white/80 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <span className="absolute -top-3 -left-3 text-6xl font-bold text-primary/5 leading-none">
                        {step.number}
                      </span>
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#4C6FFF] to-[#9C4DFF] flex items-center justify-center shadow-[0_4px_12px_rgba(76,111,255,0.25)]">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
