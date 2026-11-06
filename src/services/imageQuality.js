/**
 * Image Quality Assessment for Leaf Diagnosis
 * Checks blurriness using Laplacian operator variance and illumination using average luminance.
 */
export async function checkImageQuality(imageSource) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = 256;
        const height = Math.round((img.height / img.width) * 256);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ isPass: true, variance: 100, brightness: 128 });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 1. Grayscale & Luminance calculation
        const gray = new Float32Array(width * height);
        let totalBrightness = 0;
        let totalBrightnessSq = 0;

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          gray[j] = lum;
          totalBrightness += lum;
          totalBrightnessSq += lum * lum;
        }

        const totalPixels = width * height;
        const avgBrightness = totalBrightness / totalPixels;
        const brightnessVariance = Math.max(0, (totalBrightnessSq / totalPixels) - (avgBrightness * avgBrightness));
        const contrast = Math.sqrt(brightnessVariance);

        // 2. Laplacian operator for sharpness detection
        // Kernel:
        //  0  1  0
        //  1 -4  1
        //  0  1  0
        let laplacianSum = 0;
        let laplacianSumSq = 0;
        let count = 0;

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const lapVal =
              gray[idx - width] + // top
              gray[idx - 1] +     // left
              gray[idx + 1] +     // right
              gray[idx + width] - // bottom
              4 * gray[idx];      // center

            laplacianSum += lapVal;
            laplacianSumSq += lapVal * lapVal;
            count++;
          }
        }

        const mean = laplacianSum / count;
        const variance = Math.max(0, laplacianSumSq / count - mean * mean);

        // Threshold checks
        // Laplacian variance < 45 indicates motion or focal blur
        const isBlurry = variance < 45;
        // Average brightness < 42 is too dim to detect fungal spots
        const isDark = avgBrightness < 42;
        // Average brightness > 235 is washed out with flash glare
        const isBright = avgBrightness > 235;
        // Low contrast (< 18) indicates washed out, foggy or uniform gray background
        const isLowContrast = contrast < 18;

        let reason = null;
        if (isBlurry) {
          reason = 'blurry';
        } else if (isDark) {
          reason = 'dark';
        } else if (isBright) {
          reason = 'bright';
        } else if (isLowContrast) {
          reason = 'low_contrast';
        }

        resolve({
          isPass: !isDark && !isBright && !isBlurry && !isLowContrast,
          reason,
          variance: Math.round(variance),
          brightness: Math.round(avgBrightness),
          contrast: Math.round(contrast),
          thumbnail: canvas.toDataURL('image/jpeg', 0.8)
        });
      } catch (err) {
        console.warn('Image quality check failed, bypassing:', err);
        resolve({ isPass: true, variance: 100, brightness: 120 });
      }
    };

    img.onerror = () => {
      resolve({ isPass: true, variance: 100, brightness: 120 });
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      resolve({ isPass: true, variance: 100, brightness: 120 });
    }
  });
}
