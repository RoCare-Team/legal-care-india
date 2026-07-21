/**
 * Per-step validation for the lawyer registration wizard.
 * Pure functions — returns a map of field → error message (empty if valid).
 */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => v.replace(/\D/g, '').length >= 10;

export function validateStep(step, data) {
  const e = {};
  if (step === 0) {
    if (!data.fullName.trim()) e.fullName = 'Full name is required.';
    if (!isEmail(data.email)) e.email = 'Enter a valid email address.';
    if (!isPhone(data.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (data.password.length < 8) e.password = 'Use at least 8 characters.';
    if (data.confirm !== data.password) e.confirm = 'Passwords do not match.';
  }
  if (step === 1) {
    if (!data.barCouncil.trim()) e.barCouncil = 'Bar Council number is required.';
    if (!data.experience || Number(data.experience) < 0) e.experience = 'Enter your years of experience.';
    if (!data.city) e.city = 'Select your city.';
    if (!data.state) e.state = 'Select your state.';
    if ((data.courts || []).length === 0) e.courts = 'Select at least one court you practise in.';
    if (data.services.length === 0) e.services = 'Select at least one legal service.';
    if (data.languages.length === 0) e.languages = 'Select at least one language.';
  }
  if (step === 2) {
    if (!data.officeName.trim()) e.officeName = 'Office name is required.';
    if (!data.officeAddress.trim()) e.officeAddress = 'Office address is required.';
    // Consultation plans are optional, but any row that's started must be valid.
    const plans = data.consultationPlans || [];
    const badPlan = plans.some(
      (p) => (p.minutes || p.price) && (!(Number(p.minutes) > 0) || !(Number(p.price) > 0))
    );
    if (badPlan) e.consultationPlans = 'Each plan needs both a duration and a price.';
    if (data.about.trim().length < 40) e.about = 'About should be at least 40 characters.';
  }
  if (step === 3) {
    if (!data.terms) e.terms = 'Please accept the terms to continue.';
  }
  return e;
}

export const INITIAL_REGISTER_DATA = {
  fullName: '', email: '', phone: '', password: '', confirm: '',
  barCouncil: '', experience: '', city: '', state: '',
  courts: [], practiceCities: [], services: [], subServices: [], languages: [],
  officeName: '', officeAddress: '', fee: '', consultationPlans: [], tagline: '', about: '',
  terms: false,
};
