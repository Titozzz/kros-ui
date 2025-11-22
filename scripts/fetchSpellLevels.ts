const API_URL = "https://api.dofusdb.fr/spell-levels";
const DEFAULT_PAGE_LIMIT = 10;
const OUTPUT_FILE = new URL(
  "../src/assets/spell_levels_full.json",
  import.meta.url,
);

type SpellLevelResponse = {
  total: number;
  limit: number;
  skip: number;
  data: unknown[];
};

async function fetchPage(skip: number): Promise<SpellLevelResponse> {
  console.log(`Requesting spell levels (skip=${skip})`);
  const url = new URL(API_URL);
  url.searchParams.set("$skip", skip.toString());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch spell levels (${response.status} ${response.statusText})`,
    );
  }

  return (await response.json()) as SpellLevelResponse;
}

async function collectSpellLevels(): Promise<SpellLevelResponse> {
  const aggregatedData: unknown[] = [];
  let total = 0;
  let fetched = 0;
  let limit = DEFAULT_PAGE_LIMIT;

  while (total === 0 || fetched < total) {
    const page = await fetchPage(fetched);

    if (total === 0) {
      total = page.total;
      limit = page.limit;
      console.log(`Discovered total count=${total}, page size=${limit}`);
    }

    aggregatedData.push(...page.data);
    fetched += page.data.length;
    console.log(
      `Fetched ${page.data.length} records (progress ${fetched}/${total})`,
    );
  }

  return {
    total,
    limit,
    skip: 0,
    data: aggregatedData,
  };
}

async function main(): Promise<void> {
  const payload = await collectSpellLevels();
  await Bun.write(OUTPUT_FILE, JSON.stringify(payload, null, 4));

  console.log(
    `Fetched ${payload.data.length} spell levels (total=${payload.total}) into ${OUTPUT_FILE.pathname}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
