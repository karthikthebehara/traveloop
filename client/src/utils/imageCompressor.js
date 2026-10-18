/**
 * Compresses an image file selected from the computer using HTML5 Canvas.
 * Generates a clean base64 data URL at max 256x256 resolution and 0.8 JPEG quality,
 * resulting in an extremely lightweight string (~8KB-15KB) ideal for database and local storage.
 *
 * @param {File} file - Browser File object from <input type="file" />
 * @param {number} maxWidth - Maximum width in pixels (default 256)
 * @param {number} maxHeight - Maximum height in pixels (default 256)
 * @param {number} quality - JPEG compression quality (0.0 to 1.0, default 0.8)
 * @returns {Promise<string>} Base64 Data URL
 */
export function compressImageFile(file, maxWidth = 256, maxHeight = 256, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (PNG, JPG, WEBP).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding within maxWidth x maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not initialize canvas context.'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
