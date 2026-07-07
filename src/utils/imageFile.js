/**
 * Client-side image helpers for the advocate dashboard.
 *
 * Images are stored inline as compressed JPEG data URLs (no external upload
 * service is wired up). To keep MongoDB documents and page payloads small, we
 * downscale every upload to a sensible max dimension before encoding.
 */

/** Max upload size we accept before downscaling (guards against huge files). */
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Read an image File, downscale it to fit within `maxDim`, and resolve a
 * compressed JPEG data URL. Rejects for non-images or unreadable files.
 *
 * @param {File} file
 * @param {{ maxDim?: number, quality?: number }} [opts]
 * @returns {Promise<string>} data URL
 */
export function fileToResizedDataURL(file, { maxDim = 1024, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, WebP).'));
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      reject(new Error('That image is too large. Please pick one under 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be loaded.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        // White backdrop so transparent PNGs don't turn black when saved as JPEG.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
