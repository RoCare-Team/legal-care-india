/**
 * Per-step validation for the advocate registration wizard.
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
    if (data.services.length === 0) e.services = 'Select at least one legal service.';
    if (data.languages.length === 0) e.languages = 'Select at least one language.';
  }
  if (step === 2) {
    if (!data.officeName.trim()) e.officeName = 'Office name is required.';
    if (!data.officeAddress.trim()) e.officeAddress = 'Office address is required.';
    if (!data.fee || Number(data.fee) < 0) e.fee = 'Enter a consultation fee.';
    if (data.about.trim().length < 40) e.about = 'About should be at least 40 characters.';
  }
  if (step === 3) {
    if (!data.terms) e.terms = 'Please accept the terms to continue.';
  }
  return e;
}

export const INITIAL_REGISTER_DATA = {
  fullName: '', email: '', phone: '', password: '', confirm: '',
  barCouncil: '', experience: '', city: '', state: '', services: [], subServices: [], languages: [],
  officeName: '', officeAddress: '', fee: '', tagline: '', about: '',
  terms: false,
};
