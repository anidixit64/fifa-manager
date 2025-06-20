export interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export const extractColorsFromImage = async (imageUrl: string): Promise<ColorTheme> => {
  // Create a canvas to analyze the image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Create a color frequency map
      const colorMap = new Map<string, number>();
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Quantize colors to reduce the number of unique colors
        const quantizedR = Math.round(r / 32) * 32;
        const quantizedG = Math.round(g / 32) * 32;
        const quantizedB = Math.round(b / 32) * 32;
        const color = `rgb(${quantizedR},${quantizedG},${quantizedB})`;

        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }

      // Sort colors by frequency
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color);

      // Create theme from top 4 colors
      const theme: ColorTheme = {
        primary: sortedColors[0] || '#000000',
        secondary: sortedColors[1] || '#333333',
        accent: sortedColors[2] || '#666666',
        background: sortedColors[3] || '#ffffff'
      };

      resolve(theme);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
};

export const generateTailwindTheme = (theme: ColorTheme) => {
  return {
    primary: {
      DEFAULT: theme.primary,
      light: adjustColor(theme.primary, 20),
      dark: adjustColor(theme.primary, -20)
    },
    secondary: {
      DEFAULT: theme.secondary,
      light: adjustColor(theme.secondary, 20),
      dark: adjustColor(theme.secondary, -20)
    },
    accent: {
      DEFAULT: theme.accent,
      light: adjustColor(theme.accent, 20),
      dark: adjustColor(theme.accent, -20)
    },
    background: {
      DEFAULT: theme.background,
      light: adjustColor(theme.background, 20),
      dark: adjustColor(theme.background, -20)
    }
  };
};

const adjustColor = (color: string, amount: number): string => {
  const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
  return `rgb(${rgb.map(c => Math.max(0, Math.min(255, c + amount))).join(',')})`;
}; 