import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Extract the original emblem only; preserve its transparent pixels and geometry.
const crop = await sharp("public/auis-logo.png")
  .extract({ left: 0, top: 0, width: 230, height: 226 })
  .png()
  .toBuffer();
const emblem = await sharp(crop).trim().png().toBuffer();
for (const [file, size] of [
  ["src/app/icon.png", 512],
  ["src/app/apple-icon.png", 180],
]) {
  const pad = Math.round(size * 0.035);
  await sharp(emblem)
    .resize(size - pad * 2, size - pad * 2, {
      fit: "contain",
      background: "#00000000",
    })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: "#00000000",
    })
    .png()
    .toFile(file);
}
const images = await Promise.all(
  [16, 32, 48].map((size) =>
    sharp(emblem)
      .resize(size, size, { fit: "contain", background: "#00000000" })
      .png()
      .toBuffer(),
  ),
);
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const start = 6 + index * 16;
  const size = [16, 32, 48][index];
  header[start] = size;
  header[start + 1] = size;
  header.writeUInt16LE(1, start + 4);
  header.writeUInt16LE(32, start + 6);
  header.writeUInt32LE(image.length, start + 8);
  header.writeUInt32LE(offset, start + 12);
  offset += image.length;
});
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...images]));
console.log(
  "Generated transparent AUIS icons and multi-size favicon from the official emblem.",
);
