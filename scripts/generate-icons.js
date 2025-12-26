import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_SIZES = [
  16, 32, 48, 72, 96, 120, 128, 144, 152, 180, 192, 256, 384, 512
];

const SPLASH_SIZES = [
  // Legacy iPhones
  { width: 640, height: 1136, name: 'splash-640x1136' },    // iPhone 5/SE 1st gen
  { width: 750, height: 1334, name: 'splash-750x1334' },    // iPhone 6/7/8/SE 2nd/3rd
  { width: 1242, height: 2208, name: 'splash-1242x2208' },  // iPhone 6+/7+/8+
  { width: 1125, height: 2436, name: 'splash-1125x2436' },  // iPhone X/XS/11 Pro
  { width: 1242, height: 2688, name: 'splash-1242x2688' },  // iPhone XS Max/11 Pro Max
  { width: 828, height: 1792, name: 'splash-828x1792' },    // iPhone XR/11

  // iPhone 12/13/14 series
  { width: 1170, height: 2532, name: 'splash-1170x2532' },  // iPhone 12/13/14
  { width: 1284, height: 2778, name: 'splash-1284x2778' },  // iPhone 12/13/14 Pro Max
  { width: 1179, height: 2556, name: 'splash-1179x2556' },  // iPhone 14 Pro
  { width: 1290, height: 2796, name: 'splash-1290x2796' },  // iPhone 14 Pro Max

  // iPhone 15/16/17 series (latest)
  { width: 1179, height: 2556, name: 'splash-1179x2556-15pro' },  // iPhone 15 Pro
  { width: 1290, height: 2796, name: 'splash-1290x2796-15promax' }, // iPhone 15 Pro Max
  { width: 1206, height: 2622, name: 'splash-1206x2622' },  // iPhone 16 Pro
  { width: 1320, height: 2868, name: 'splash-1320x2868' },  // iPhone 16 Pro Max / 17 Pro Max

  // Samsung Galaxy S series
  { width: 1080, height: 2340, name: 'splash-1080x2340' },  // Galaxy S21/S22/S23
  { width: 1080, height: 2400, name: 'splash-1080x2400' },  // Galaxy S21+/S22+/S23+
  { width: 1440, height: 3088, name: 'splash-1440x3088' },  // Galaxy S22 Ultra
  { width: 1440, height: 3120, name: 'splash-1440x3120' },  // Galaxy S23 Ultra/S24 Ultra/S25 Ultra
  { width: 1080, height: 2340, name: 'splash-samsung-s24' }, // Galaxy S24
  { width: 1440, height: 3120, name: 'splash-samsung-s25-ultra' }, // Galaxy S25 Ultra

  // Samsung Galaxy Z Fold/Flip
  { width: 1812, height: 2176, name: 'splash-zfold-inner' },  // Z Fold inner display
  { width: 904, height: 2316, name: 'splash-zfold-outer' },   // Z Fold outer display
  { width: 1080, height: 2640, name: 'splash-zflip' },        // Z Flip

  // iPads
  { width: 1536, height: 2048, name: 'splash-1536x2048' },  // iPad mini/Air
  { width: 1668, height: 2224, name: 'splash-1668x2224' },  // iPad Pro 10.5
  { width: 1668, height: 2388, name: 'splash-1668x2388' },  // iPad Pro 11
  { width: 2048, height: 2732, name: 'splash-2048x2732' },  // iPad Pro 12.9
];

async function generateIcons() {
  const publicDir = join(__dirname, '..', 'public');
  const iconsDir = join(publicDir, 'icons');
  const splashDir = join(publicDir, 'splash');

  // Create directories if they don't exist
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }
  if (!existsSync(splashDir)) {
    mkdirSync(splashDir, { recursive: true });
  }

  // Read the SVG file
  const svgPath = join(publicDir, 'favicon.svg');
  const svgBuffer = readFileSync(svgPath);

  console.log('Generating PNG icons...\n');

  // Generate icons for each size
  for (const size of ICON_SIZES) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  Created: icons/icon-${size}x${size}.png`);
  }

  // Generate apple touch icon
  const appleTouchPath = join(publicDir, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('  Created: apple-touch-icon.png');

  // Generate favicon.ico (using 32x32)
  // Note: sharp doesn't support ICO, so we'll use PNG as fallback
  const faviconPath = join(publicDir, 'favicon.png');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconPath);
  console.log('  Created: favicon.png');

  console.log('\nGenerating splash screens...\n');

  // Generate splash screens with Ghana green background and centered logo
  for (const splash of SPLASH_SIZES) {
    const outputPath = join(splashDir, `${splash.name}.png`);

    // Calculate logo size (about 20% of the smaller dimension)
    const logoSize = Math.min(splash.width, splash.height) * 0.25;

    // Create the splash screen with Ghana green background
    const background = Buffer.from(
      `<svg width="${splash.width}" height="${splash.height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#006B3F"/>
            <stop offset="100%" style="stop-color:#004d2e"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
      </svg>`
    );

    // Resize the logo
    const logo = await sharp(svgBuffer)
      .resize(Math.round(logoSize), Math.round(logoSize))
      .png()
      .toBuffer();

    // Composite logo onto background
    await sharp(background)
      .composite([{
        input: logo,
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);

    console.log(`  Created: splash/${splash.name}.png`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
