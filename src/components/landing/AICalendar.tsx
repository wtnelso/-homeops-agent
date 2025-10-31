import { Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";

const upcomingItems = [
  { day: "Today", time: "2:30 PM", title: "School pickup", location: "Lincoln Elementary", type: "commitment" },
  { day: "Today", time: "4:00 PM", title: "Soccer practice", location: "Riverside Park", type: "commitment" },
  { day: "Tomorrow", time: "9:00 AM", title: "Dentist appointment", location: "Main St Dental", type: "appointment" },
  { day: "Wednesday", time: "—", title: "Permission slip due", location: "Field trip form", type: "deadline" },
  { day: "Friday", time: "11:30 AM", title: "School half-day", location: "Early dismissal", type: "event" },
];

export const AICalendar = () => {
  return (
    <section className="py-24 px-6 border-t border-border bg-gradient-to-br from-purple-50/40 to-blue-50/30">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight"
              style={{ textShadow: '0 2px 16px rgba(0, 0, 0, 0.06)' }}>
            This Week
          </h2>
          <p className="text-lg text-muted-foreground max-w-[700px] mx-auto">
            Your calendar, upgraded. HomeOps extracts dates and details from email, fills gaps, and keeps you a step ahead.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-border"
             style={{ boxShadow: '0 20px 64px rgba(0, 0, 0, 0.12)' }}>
          
          {/* Header with CTA */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4C6FFF] to-[#9C4DFF] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">AI Calendar</h3>
                <p className="text-sm text-muted-foreground">Next 7 days</p>
              </div>
            </div>
            <Button variant="gradient" size="lg" className="shadow-[0_4px_16px_rgba(76,111,255,0.3)]">
              Approve 4 new events
            </Button>
          </div>

          {/* Calendar items */}
          <div className="space-y-4">
            {upcomingItems.map((item, index) => (
              <div
                key={index}
                className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50 transition-all duration-200"
              >
                <div className="flex-shrink-0 w-20 text-sm">
                  <div className="font-semibold">{item.day}</div>
                  {item.time !== "—" && (
                    <div className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">{item.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-primary">
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Agent forecast */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-primary">Agent forecast:</span>
                <span className="text-muted-foreground ml-2">
                  Friday's permission slip needs attention. Suggested time: Wednesday evening after soccer.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
