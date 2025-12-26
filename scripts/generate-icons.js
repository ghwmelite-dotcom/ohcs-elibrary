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
  { width: 640, height: 1136, name: 'splash-640x1136' },
  { width: 750, height: 1334, name: 'splash-750x1334' },
  { width: 1242, height: 2208, name: 'splash-1242x2208' },
  { width: 1125, height: 2436, name: 'splash-1125x2436' },
  { width: 1536, height: 2048, name: 'splash-1536x2048' },
  { width: 1668, height: 2224, name: 'splash-1668x2224' },
  { width: 2048, height: 2732, name: 'splash-2048x2732' },
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
