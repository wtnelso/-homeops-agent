import { CalendarPlus, CheckSquare, Share2, Clock } from "lucide-react";
import { Button } from "../ui/button";

const inboxItems = [
  {
    title: "School half-day Friday",
    detail: "Early dismissal at 11:30 AM",
    action: "Add to calendar",
    icon: CalendarPlus,
    actionVariant: "default" as const,
  },
  {
    title: "Dentist confirms Oct 12 at 9:30",
    detail: "Dr. Smith's office on Main St",
    action: "Confirm time",
    icon: CheckSquare,
    actionVariant: "default" as const,
  },
  {
    title: "Soccer schedule released",
    detail: "8 practices + 4 games through November",
    action: "Add & share with partner",
    icon: Share2,
    actionVariant: "default" as const,
  },
  {
    title: "Flight moved 40 minutes earlier",
    detail: "Departs 2:20 PM instead of 3:00 PM",
    action: "Update ride & childcare",
    icon: Clock,
    actionVariant: "default" as const,
  },
];

export const PriorityInbox = () => {
  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight"
              style={{ textShadow: '0 2px 16px rgba(0, 0, 0, 0.06)' }}>
            Priority Inbox
          </h2>
          <p className="text-lg text-muted-foreground max-w-[700px] mx-auto">
            HomeOps reads for intent. It pulls out dates, times, locations, and asks you to confirm the plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inboxItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4C6FFF] to-[#9C4DFF] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(76,111,255,0.3)]">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
                <Button 
                  variant={item.actionVariant}
                  className="w-full shadow-sm hover:shadow-md transition-shadow"
                >
                  {item.action}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
