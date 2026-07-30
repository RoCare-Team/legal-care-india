/**
 * Languages an advocate may offer consultations in.
 * Used by registration and dashboard multi-selects.
 */
export const LANGUAGES = [
  'Hindi', 'English', 'Marathi', 'Bengali', 'Telugu', 'Tamil', 'Gujarati',
  'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Urdu', 'Assamese', 'Konkani',
];

/** Indian states & union territories, for office/location selects. */
/**
 * Every state and union territory, alphabetically.
 *
 * The list had 23 entries and was missing thirteen — Puducherry, Ladakh, Jammu
 * & Kashmir, all eight north-eastern states and the island territories. Cities
 * exist on the platform in most of them, so a lawyer registering in Karaikal or
 * Shillong had no state to pick and left the field blank, which then made the
 * city and state on their profile disagree.
 *
 * The strings must match the `state` on city records exactly — the registration
 * wizard filters its city list by them.
 */
export const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];
