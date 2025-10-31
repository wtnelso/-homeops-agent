export const TrustedBy = () => {
  const locations = [
    "Bethesda, MD",
    "Fairfield County, CT",
    "Palo Alto, CA",
    "Westchester, NY",
    "Newton, MA",
    "Marin County, CA",
  ];

  return (
    <section className="py-12 sm:py-16 px-6">
      <div className="max-w-[900px] mx-auto text-center">
        <p className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-4 sm:mb-6 font-medium">
          Trusted by high-performing families in
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3">
          {locations.map((location, index) => (
            <span
              key={index}
              className="text-foreground/70 text-xs sm:text-sm font-medium hover:text-foreground transition-colors"
            >
              {location}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
