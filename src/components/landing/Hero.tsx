import { Button } from "../ui/button";
import { Sparkles, Shield } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Radial gradient spotlight effect */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-100/50 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      <div className="max-w-[800px] mx-auto text-center relative z-10">
        {/* Logo with floating effect */}
        <div className="mb-12 flex justify-center animate-fade-in">
          <div className="relative" style={{ filter: 'drop-shadow(0 8px 24px rgba(76, 111, 255, 0.25))' }}>
            <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28" viewBox="0 0 1024 1024" role="img" aria-label="HomeOps agent logo" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="g2" x1="220" y1="300" x2="820" y2="880" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4C6FFF"/>
                  <stop offset="100%" stopColor="#9C4DFF"/>
                </linearGradient>
              </defs>
              <path d="M256 520 L512 320 L768 520 V740 Q768 776 732 776 H292 Q256 776 256 740 Z"
                    fill="none" stroke="url(#g2)" strokeWidth="44"
                    strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M392 620 Q512 704 632 620"
                    fill="none" stroke="url(#g2)" strokeWidth="40"
                    strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="420" y1="560" x2="470" y2="560"
                    stroke="url(#g2)" strokeWidth="28" strokeLinecap="round"/>
              <line x1="554" y1="560" x2="604" y2="560"
                    stroke="url(#g2)" strokeWidth="28" strokeLinecap="round"/>
              <path d="M256 600 Q216 616 200 648" fill="none"
                    stroke="url(#g2)" strokeWidth="32" strokeLinecap="round"/>
              <path d="M768 600 Q808 616 824 648" fill="none"
                    stroke="url(#g2)" strokeWidth="32" strokeLinecap="round"/>
              <path d="M188 650 q22 22 0 44 q-22 -22 0 -44 Z"
                    fill="none" stroke="url(#g2)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M836 650 q22 22 0 44 q-22 -22 0 -44 Z"
                    fill="none" stroke="url(#g2)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="430" y1="776" x2="430" y2="852"
                    stroke="url(#g2)" strokeWidth="32" strokeLinecap="round"/>
              <line x1="594" y1="776" x2="594" y2="852"
                    stroke="url(#g2)" strokeWidth="32" strokeLinecap="round"/>
              <line x1="388" y1="852" x2="472" y2="852"
                    stroke="url(#g2)" strokeWidth="20" strokeLinecap="round"/>
              <line x1="552" y1="852" x2="636" y2="852"
                    stroke="url(#g2)" strokeWidth="20" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Headline with depth */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight animate-fade-in" 
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.08)' }}>
          Run your home with an intelligent agent.
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-[700px] mx-auto animate-fade-in">
          HomeOps decodes and summarizes important communications, surfaces what matters, schedules it on an AI calendar, and coordinates the plan with your family.
        </p>

        {/* CTA Button with elevated shadow */}
        <div className="mb-8 animate-fade-in">
          <Button
            variant="gradient"
            size="xl"
            className="shadow-[0_12px_32px_rgba(76,111,255,0.4)] hover:shadow-[0_16px_40px_rgba(76,111,255,0.5)] hover:scale-105 transition-all duration-300"
            onClick={() => {
              document.getElementById('signup-form')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }}
          >
            Join the private beta
          </Button>
        </div>

        {/* Badges with glassmorphism */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground animate-fade-in">
          <span className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm bg-white/60 border border-white/20 shadow-sm text-xs sm:text-sm">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            Private by design
          </span>
          <span className="hidden sm:block opacity-30">•</span>
          <span className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm bg-white/60 border border-white/20 shadow-sm text-xs sm:text-sm">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            Read-only Gmail during beta
          </span>
        </div>
      </div>
    </section>
  );
};
