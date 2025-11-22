import { existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";

const INPUT_FILE = join(import.meta.dir, "../src/assets/spells_full.json");
const OUTPUT_DIR = join(import.meta.dir, "../src/assets/spell_images");
const CONCURRENCY_LIMIT = 20;

type Spell = {
  img?: string;
  [key: string]: unknown;
};

type SpellVariant = {
  spells: Spell[];
  [key: string]: unknown;
};

type SpellsData = {
  data: SpellVariant[];
  [key: string]: unknown;
};

async function downloadImage(url: string, dest: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.statusText}`);
      return;
    }
    const buffer = await response.arrayBuffer();
    await Bun.write(dest, buffer);
    // console.log(`Saved ${dest}`);
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
  }
}

async function main() {
  if (!existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  console.log(`Reading spells from ${INPUT_FILE}...`);
  const fileContent = await Bun.file(INPUT_FILE).text();
  const data: SpellsData = JSON.parse(fileContent);

  if (!existsSync(OUTPUT_DIR)) {
    console.log(`Creating output directory: ${OUTPUT_DIR}`);
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const urls = new Set<string>();
  for (const variant of data.data) {
    for (const spell of variant.spells) {
      if (spell.img) {
        urls.add(spell.img);
      }
    }
  }

  console.log(`Found ${urls.size} unique images to download.`);

  const queue = Array.from(urls);
  let completed = 0;
  const total = queue.length;

  const workers = Array(CONCURRENCY_LIMIT)
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) break;

        const filename = basename(url);
        const dest = join(OUTPUT_DIR, filename);

        if (existsSync(dest)) {
          // console.log(`Skipping existing file: ${filename}`);
        } else {
          await downloadImage(url, dest);
        }

        completed++;
        if (completed % 10 === 0 || completed === total) {
          process.stdout.write(`\rProgress: ${completed}/${total}`);
        }
      }
    });

  await Promise.all(workers);
  console.log("\nDownload complete!");
}

main().catch(console.error);
