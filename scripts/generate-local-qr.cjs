const fs = require("node:fs");
const path = require("node:path");

const QRCode = require(path.join(
  __dirname,
  "../apps/mobile/node_modules/qrcode-terminal/vendor/QRCode",
));
const QRErrorCorrectLevel = require(path.join(
  __dirname,
  "../apps/mobile/node_modules/qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel",
));

const [value, outputPath] = process.argv.slice(2);
if (!value || !outputPath) {
  console.error("Usage: node scripts/generate-local-qr.cjs <value> <output.svg>");
  process.exit(1);
}

const code = new QRCode(-1, QRErrorCorrectLevel.M);
code.addData(value);
code.make();

const quietZone = 4;
const cell = 12;
const modules = code.getModuleCount();
const dimension = (modules + quietZone * 2) * cell;
const blocks = [];

for (let row = 0; row < modules; row += 1) {
  for (let column = 0; column < modules; column += 1) {
    if (!code.isDark(row, column)) continue;
    blocks.push(
      `<rect x="${(column + quietZone) * cell}" y="${(row + quietZone) * cell}" width="${cell}" height="${cell}"/>`,
    );
  }
}

const svg = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}" viewBox="0 0 ${dimension} ${dimension}" role="img" aria-label="Local Expo Go QR code">`,
  `<rect width="100%" height="100%" fill="#ffffff"/>`,
  `<g fill="#020817">`,
  ...blocks,
  `</g>`,
  `</svg>`,
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

if (path.extname(outputPath).toLowerCase() === ".png") {
  const sharp = require("sharp");
  sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath)
    .then(() => console.log(path.resolve(outputPath)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
} else {
  fs.writeFileSync(outputPath, svg, "utf8");
  console.log(path.resolve(outputPath));
}
