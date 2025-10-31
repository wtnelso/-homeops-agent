import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export const FormSection = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consent: false,
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    consent: "",
  });

  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields first
    const newErrors: typeof errors = {
      firstName: "",
      lastName: "",
      email: "",
      consent: "",
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.consent) {
      newErrors.consent = "You must agree to receive communications";
    }

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== "");

    if (hasErrors) {
      setShowErrors(true);
      setErrors(newErrors);
      return;
    }

    // If no errors, proceed with submission
    setShowErrors(false);
    setErrors({
      firstName: "",
      lastName: "",
      email: "",
      consent: "",
    });

    setIsSubmitting(true);

    try {
      // Save to Supabase beta_sign_ups table
      const { data, error } = await supabase
        .from('beta_sign_ups')
        .insert([
          {
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || null,
          }
        ]);

      if (error) {
        console.error("Error saving to Supabase:", error);
        setErrors({
          firstName: "",
          lastName: "",
          email: "Something went wrong. Please try again.",
          consent: "",
        });
        setShowErrors(true);
      } else {
        console.log("Successfully saved to Supabase:", data);
        setIsSuccess(true);
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          consent: false,
        });
      }
    } catch (err) {
      console.error("Network error:", err);
      setErrors({
        firstName: "",
        lastName: "",
        email: "Network error. Please check your connection and try again.",
        consent: "",
      });
      setShowErrors(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="signup-form" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-purple-900/90 to-blue-900/80 relative overflow-hidden">
      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-[500px] mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight text-white">
            {isSuccess ? "Welcome to the beta!" : "Join the private beta"}
          </h2>
          <p className="text-white/70 text-xs sm:text-sm">
            {isSuccess ? "Thank you for joining! We'll be in touch soon." : "Limited spots available. Join the waitlist today."}
          </p>
        </div>
        
        {/* Premium form container */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Input
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`h-10 sm:h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all backdrop-blur-sm text-sm ${
                  showErrors && errors.firstName ? 'border-red-400 focus:border-red-400' : ''
                }`}
              />
              {showErrors && errors.firstName && (
                <p className="text-red-300 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Input
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`h-10 sm:h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all backdrop-blur-sm text-sm ${
                  showErrors && errors.lastName ? 'border-red-400 focus:border-red-400' : ''
                }`}
              />
              {showErrors && errors.lastName && (
                <p className="text-red-300 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
          <div>
            <Input
              type="text"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`h-10 sm:h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all backdrop-blur-sm text-sm ${
                showErrors && errors.email ? 'border-red-400 focus:border-red-400' : ''
              }`}
            />
            {showErrors && errors.email && (
              <p className="text-red-300 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <Input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="h-10 sm:h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all backdrop-blur-sm text-sm"
          />
          <div className="flex items-start gap-3 pt-1 sm:pt-2">
            <Checkbox
              id="consent"
              checked={formData.consent}
              onCheckedChange={(checked) => setFormData({ ...formData, consent: checked as boolean })}
              className={`border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary mt-1 ${
                showErrors && errors.consent ? 'border-red-400' : ''
              }`}
            />
            <div className="flex-1">
              <label htmlFor="consent" className="text-xs text-white/70 leading-relaxed cursor-pointer">
                I agree to receive communications from HomeOps and understand that my information will be handled in accordance with the privacy policy.
              </label>
              {showErrors && errors.consent && (
                <p className="text-red-300 text-xs mt-1">{errors.consent}</p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={isSubmitting || isSuccess}
            className="w-full h-10 sm:h-12 bg-white text-primary hover:bg-white/90 shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_24px_rgba(255,255,255,0.3)] transition-all duration-300 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Joining..." : isSuccess ? "Successfully joined!" : "Join the waitlist"}
          </Button>
        </form>
      </div>
    </section>
  );
};
