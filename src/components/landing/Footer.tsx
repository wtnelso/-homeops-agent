export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-[800px] mx-auto text-center">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <span className="opacity-30">•</span>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
          <span className="opacity-30">•</span>
          <a href="mailto:hello@homeops.ai" className="hover:text-foreground transition-colors">
            Contact Us
          </a>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">© 2025 HomeOps.ai. All rights reserved.</p>
      </div>
    </footer>
  );
};
