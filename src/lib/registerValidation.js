/**
 * Per-step validation for the lawyer registration wizard.
 * Pure functions — returns a map of field → error message (empty if valid).
 *
 * The wizard runs in five steps:
 *   0  Personal      who they are, and where they are
 *   1  Professional  enrolment, standing, and the office clients come to
 *   2  Practice      the courts, areas and matters they take
 *   3  Consultation  what they charge, when they sit, and their write-up
 *   4  Review        read it back, accept the terms
 *
 * The rules below are the same ones the four-step version enforced, only
 * redistributed. Everything added in the redesign — gender, date of birth,
 * enrolment date, designation, chamber, practice mode, PIN code, personal
 * address, bar council state — is deliberately optional: none of it decides
 * whether someone is a practising advocate, and a form that refuses to move on
 * over a date of birth is a form people abandon.
 */
import { MIN_RATE, MAX_RATE } from '@/constants/callRates';

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => v.replace(/\D/g, '').length >= 10;
/** Indian PIN codes are six digits and never start with zero. */
const isPincode = (v) => /^[1-9][0-9]{5}$/.test(v);

export function validateStep(step, data) {
  const e = {};

  // ── 0 · Personal ────────────────────────────────────────────────────
  if (step === 0) {
    if (!data.fullName.trim()) e.fullName = 'Full name is required.';
    if (!isEmail(data.email)) e.email = 'Enter a valid email address.';
    if (!isPhone(data.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (data.password.length < 8) e.password = 'Use at least 8 characters.';
    if (data.confirm !== data.password) e.confirm = 'Passwords do not match.';
    if (!data.state) e.state = 'Select your state.';
    if (!data.city) e.city = 'Select your city.';
    if (data.languages.length === 0) e.languages = 'Select at least one language.';
    // Optional — the state and city can still be picked by hand — but a PIN
    // that was typed has to be a real one.
    if (data.pincode && !isPincode(data.pincode)) {
      e.pincode = 'Enter a valid 6-digit PIN code.';
    }
  }

  // ── 1 · Professional ────────────────────────────────────────────────
  if (step === 1) {
    if (!data.barCouncil.trim()) e.barCouncil = 'Bar Council number is required.';
    if (!data.experience || Number(data.experience) < 0) {
      e.experience = 'Enter your years of experience.';
    }
    if (!data.officeName.trim()) e.officeName = 'Office name is required.';
    if (!data.officeAddress.trim()) e.officeAddress = 'Office address is required.';
    // Same for the residence, and only while that toggle is on — a PIN left
    // behind by a toggle since switched off must not block the step.
    if (data.practiceFromResidence && data.residencePincode && !isPincode(data.residencePincode)) {
      e.residencePincode = 'Enter a valid 6-digit PIN code.';
    }
  }

  // ── 2 · Practice ────────────────────────────────────────────────────
  if (step === 2) {
    if ((data.courts || []).length === 0) e.courts = 'Select at least one court you practise in.';
    if (data.services.length === 0) e.services = 'Select at least one practice area.';
  }

  // ── 3 · Consultation ────────────────────────────────────────────────
  if (step === 3) {
    // Rates are optional — a blank one means the advocate does not offer that
    // channel — but a rate that was typed has to be a usable number.
    for (const field of ['chatRate', 'audioRate', 'videoRate']) {
      const raw = String(data[field] ?? '').trim();
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < MIN_RATE || n > MAX_RATE) {
        e[field] = `Enter a rate between ₹${MIN_RATE} and ₹${MAX_RATE} per minute.`;
      }
    }
    if (data.about.trim().length < 40) e.about = 'About should be at least 40 characters.';
  }

  // ── 4 · Review ──────────────────────────────────────────────────────
  if (step === 4) {
    if (!data.terms) e.terms = 'Please accept the terms to continue.';
  }

  return e;
}

export const INITIAL_REGISTER_DATA = {
  // Personal
  photo: '',
  fullName: '', email: '', phone: '', password: '', confirm: '',
  gender: '', dob: '',
  state: '', city: '', pincode: '',
  languages: [],

  // Professional
  barCouncil: '', enrollmentDate: '',
  experience: '', designation: '', chamberName: '', practiceMode: '',
  officeName: '', officeAddress: '',
  // Optional second place clients are seen, revealed by a toggle on step 2.
  practiceFromResidence: false, residenceAddress: '', residencePincode: '',

  // Practice
  courts: [], services: [], subServices: [], practiceCities: [],

  // Consultation — ₹ per minute, one per channel. Blank ⇒ not offered.
  chatRate: '', audioRate: '', videoRate: '',
  fee: '', officeTiming: '', tagline: '', about: '',

  // Review
  terms: false,
};
