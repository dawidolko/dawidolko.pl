const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Function to find all image files recursively
function findImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findImages(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Function to convert image to WebP
async function convertToWebP(imagePath) {
  try {
    const dir = path.dirname(imagePath);
    const ext = path.extname(imagePath);
    const baseName = path.basename(imagePath, ext);
    const outputPath = path.join(dir, `${baseName}.webp`);

    // Skip if WebP already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Skipping (already exists): ${outputPath}`);
      return;
    }

    await sharp(imagePath)
      .webp({ quality: 95, effort: 6 }) // High quality, maximum compression effort
      .toFile(outputPath);

    console.log(`Converted: ${imagePath} -> ${outputPath}`);
  } catch (error) {
    console.error(`Error converting ${imagePath}:`, error.message);
  }
}

// Main function
async function main() {
  const imagesDir = path.join(__dirname, "src", "assets", "img");
  console.log(`Searching for images in: ${imagesDir}`);

  const images = findImages(imagesDir);
  console.log(`Found ${images.length} images to convert`);

  for (const imagePath of images) {
    await convertToWebP(imagePath);
  }

  console.log("Conversion complete!");
}

main().catch(console.error);
