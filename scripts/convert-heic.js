const heicConvert = require("heic-convert");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

async function convertHeicToWebp(heicPath) {
  try {
    const inputBuffer = await fs.readFile(heicPath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: "PNG",
      quality: 1,
    });

    const dir = path.dirname(heicPath);
    const baseName = path.basename(heicPath, path.extname(heicPath));
    const webpPath = path.join(dir, `${baseName}.webp`);

    await sharp(outputBuffer).webp({ quality: 95, effort: 6 }).toFile(webpPath);

    console.log(`Converted: ${heicPath} -> ${webpPath}`);
  } catch (error) {
    console.error(`Error converting ${heicPath}:`, error.message);
  }
}

async function main() {
  const blogDir = path.join(__dirname, "src", "assets", "img", "Blog");

  await convertHeicToWebp(path.join(blogDir, "egipt3.HEIC"));
  await convertHeicToWebp(path.join(blogDir, "egpit4.HEIC"));

  console.log("HEIC conversion complete!");
}

main().catch(console.error);
