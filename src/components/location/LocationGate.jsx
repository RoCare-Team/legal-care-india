'use client';

import { useLocation } from './LocationProvider';
import LocationModal from './LocationModal';

/**
 * Mounts the one location chooser for the whole app.
 *
 * It used to live inside LocationPicker, which the header and the mobile drawer
 * both render — two buttons meant two dialogs, and neither could be opened by
 * anything other than its own button. Hoisting it here gives a single instance
 * driven by the provider, so arriving at the site can open it too.
 *
 * Kept separate from LocationProvider so the provider never imports the modal
 * that reads its context.
 */
export default function LocationGate() {
  const { pickerOpen, closePicker } = useLocation();
  return <LocationModal open={pickerOpen} onClose={closePicker} />;
}
