import { Hero } from "../components/landing/Hero";
import { TrustedBy } from "../components/landing/TrustedBy";
import { FormSection } from "../components/landing/FormSection";
import { ProductPillars } from "../components/landing/ProductPillars";
import { Footer } from "../components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40">
      <Hero />
      <TrustedBy />
      <FormSection />
      <ProductPillars />
      <Footer />
    </div>
  );
};

export default Landing;