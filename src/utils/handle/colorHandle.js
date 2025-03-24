export const parseColor = color => {
  // 处理hex格式 (#fff, #ffffff)
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(
      hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2),
      16,
    );
    const g = parseInt(
      hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4),
      16,
    );
    const b = parseInt(
      hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6),
      16,
    );
    return {r, g, b};
  }

  // 处理rgb/rgba格式 (rgb(255,255,255))
  if (color.startsWith('rgb')) {
    const parts = color.match(/\d+/g);
    return {
      r: parseInt(parts[0], 10),
      g: parseInt(parts[1], 10),
      b: parseInt(parts[2], 10),
    };
  }

  // 其他格式可以继续扩展...
  throw new Error('Unsupported color format');
};

export const rgbToHsl = (r, g, b) => {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
};

export const getWhitenessScoreByHsl = color => {
  const rgb = parseColor(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // 主要考虑亮度(L)和饱和度(S)
  // 亮度越高、饱和度越低，颜色越接近白色
  return hsl[2] * 100 - hsl[1] * 50;
};

export const getWhitenessScore = color => {
  // 将颜色转换为RGB格式
  const rgb = parseColor(color);

  // 计算与白色(255,255,255)的欧几里得距离
  const distance = Math.sqrt(
    Math.pow(255 - rgb.r, 2) +
      Math.pow(255 - rgb.g, 2) +
      Math.pow(255 - rgb.b, 2),
  );

  // 最大可能距离是√(3×255²) ≈ 441.67
  // 转换为接近程度百分比 (0% = 黑色, 100% = 白色)
  return 100 - (distance / 441.67) * 100;
};

export const getWhitenessScoreByLuminance = color => {
  const rgb = parseColor(color);

  // 计算相对亮度 (公式来自WCAG标准)
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;

  // 直接返回亮度值 (0-1范围)
  return luminance * 100;
};
