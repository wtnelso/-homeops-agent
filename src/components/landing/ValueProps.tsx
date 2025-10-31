import { Zap, Calendar as CalendarIcon, Users } from "lucide-react";

const props = [
  {
    icon: Zap,
    title: "From email to plan in one tap",
    description: "HomeOps turns messy threads into clean next steps. Confirm the time, assign the owner, move on.",
  },
  {
    icon: CalendarIcon,
    title: "A calendar that thinks",
    description: "Not just blocks on a grid. HomeOps adds travel buffers, prep time, and follow-ups so you don't get surprised.",
  },
  {
    icon: Users,
    title: "A family that moves together",
    description: "Everyone sees the same plan. Delegation becomes simple. Accountability is clear and kind.",
  },
];

export const ValueProps = () => {
  return (
    <section className="py-24 px-6 border-t border-border bg-gradient-to-br from-slate-50/50 to-blue-50/30">
      <div className="max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {props.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <div
                key={index}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4C6FFF] to-[#9C4DFF] mb-6 shadow-[0_4px_16px_rgba(76,111,255,0.3)]">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{prop.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
