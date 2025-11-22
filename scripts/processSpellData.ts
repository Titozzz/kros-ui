import type {
  JsonSpellLevel,
  JsonSpellVariant,
  SpellClassName,
  SpellElement,
  SpellModel,
} from "../src/lib/types";

const VARIANTS_PATH = "src/assets/spells_variants_full.json";
const LEVELS_PATH = "src/assets/spell_levels_full.json";
const EFFECTS_PATH = "src/assets/effects_full.json";
const OUTPUT_PATH = "src/assets/spells_processed.json";

// Mapping based on Dofus standards and observation
const ELEMENT_MAP: Record<number, SpellElement> = {
  0: "Neutre",
  1: "Terre",
  2: "Feu",
  3: "Eau",
  4: "Air",
};

// Exclude effects that are categorized as Damage (Category 2) but are actually Movement/Utility
const IGNORED_DAMAGE_IDS = new Set([
  4,    // Teleport
  5,    // Push back
  6,    // Attract
  8,    // Switch places
  1041, // Push back (variant)
  1042, // Attract (variant)
  1048, // HP Sacrifice (Immolation, etc) - should not be considered an attack element
  2020, // Heal based on damage taken (Perfusion) - categorized as damage but is a heal
]);

const BREED_ID_MAP: Record<number, SpellClassName> = {
  1: "Feca",
  2: "Osamodas",
  3: "Enutrof",
  4: "Sram",
  5: "Xelor",
  6: "Ecaflip",
  7: "Eniripsa",
  8: "Iop",
  9: "Cra",
  10: "Sadida",
  11: "Sacrier",
  12: "Pandawa",
  13: "Rogue",
  14: "Masqueraider",
  15: "Foggernaut",
  16: "Eliotrope",
  17: "Huppermage",
  18: "Ouginak",
  19: "Commun",
  20: "Forgelance",
};

async function main() {
  console.log("Loading data...");

  const variantsFile = Bun.file(VARIANTS_PATH);
  const levelsFile = Bun.file(LEVELS_PATH);
  const effectsFile = Bun.file(EFFECTS_PATH);

  if (!(await variantsFile.exists()) || !(await levelsFile.exists()) || !(await effectsFile.exists())) {
    console.error(
      "Data files missing. Please ensure spells_variants_full.json, spell_levels_full.json and effects_full.json exist in src/assets/",
    );
    process.exit(1);
  }

  const variantsData = (await variantsFile.json()) as {
    data: JsonSpellVariant[];
  };
  const levelsData = (await levelsFile.json()) as { data: JsonSpellLevel[] };
  const effectsData = (await effectsFile.json()) as { data: { id: number; category: number; elementId: number }[] };

  console.log(
    `Loaded ${variantsData.data.length} variants, ${levelsData.data.length} levels and ${effectsData.data.length} effects.`,
  );

  // Index levels by ID for fast lookup
  const levelsMap = new Map<number, JsonSpellLevel>();
  for (const level of levelsData.data) {
    levelsMap.set(level.id, level);
  }

  // Index effects by ID for fast lookup
  const effectsMap = new Map<number, { category: number; elementId: number }>();
  for (const effect of effectsData.data) {
    effectsMap.set(effect.id, effect);
  }

  const result: SpellModel[] = [];

  // Process Variants
  const spellsByBreed: Record<number, JsonSpellVariant[]> = {};
  for (const variant of variantsData.data) {
    const breedList = spellsByBreed[variant.breedId];
    if (!breedList) {
      spellsByBreed[variant.breedId] = [variant];
    } else {
      breedList.push(variant);
    }
  }

  for (const breedIdStr in spellsByBreed) {
    const breedId = parseInt(breedIdStr, 10);
    const breedVariants = spellsByBreed[breedId];

    if (!breedVariants) continue;

    // Keep sorting variants by ID to maintain deterministic output order
    breedVariants.sort((a, b) => a.id - b.id);

    breedVariants.forEach((variant) => {
      const spellPair = variant.spells;
      // DO NOT sort spells by ID. Rely on raw order (Index 0 = Base, Index 1 = Variant)

      spellPair.forEach((spell, spellIndex) => {
        const isVariant = spellIndex === 1;
        const className = BREED_ID_MAP[breedId];

        const finalClassName = className || "Feca";

        // Determine Unlock Level from Spell Levels
        let unlockLevel = 999;
        if (spell.spellLevels && spell.spellLevels.length > 0) {
          // Check all levels to find the minimum unlock level (just in case they aren't sorted)
          for (const levelId of spell.spellLevels) {
            const levelData = levelsMap.get(levelId);
            if (levelData) {
                const lvl = levelData.minPlayerLevel || 1;
                if (lvl < unlockLevel) {
                    unlockLevel = lvl;
                }
            }
          }
        }
        if (unlockLevel === 999) {
             unlockLevel = 1; 
        }

        // Determine Element
        const elementsFound = new Set<SpellElement>();

        // Check the highest spell level for effects
        if (spell.spellLevels?.length > 0) {
          const lastLevelId = spell.spellLevels[spell.spellLevels.length - 1];
          if (lastLevelId !== undefined) {
            const levelData = levelsMap.get(lastLevelId);

            if (levelData?.effects) {
              for (const effect of levelData.effects) {
                // Check effect definition for Category 2 (Damage)
                const effectDef = effectsMap.get(effect.effectId);
                
                if (effectDef && effectDef.category === 2 && !IGNORED_DAMAGE_IDS.has(effect.effectId)) {
                    // It's a damage/offensive effect. Use its element.
                    const elId = effect.effectElement;
                    
                    if (elId === -1) {
                        // If Damage Effect has -1, it means "Best Element"
                        elementsFound.add("Best");
                    } else {
                         const el = ELEMENT_MAP[elId];
                         if (el) elementsFound.add(el);
                    }
                }
              }
            }
          }
        }

        // Fallback to description if no elements found in effects
        if (elementsFound.size === 0) {
          const lowerDesc = (spell.description?.fr || "").toLowerCase();
          
           if (lowerDesc.includes("meilleur élément")) {
            elementsFound.add("Best");
          } else if (
            lowerDesc.includes("dommages terre") ||
            lowerDesc.includes("vol de vie terre")
          )
            elementsFound.add("Terre");
          else if (
            lowerDesc.includes("dommages feu") ||
            lowerDesc.includes("vol de vie feu")
          )
            elementsFound.add("Feu");
          else if (
            lowerDesc.includes("dommages eau") ||
            lowerDesc.includes("vol de vie eau")
          )
            elementsFound.add("Eau");
          else if (
            lowerDesc.includes("dommages air") ||
            lowerDesc.includes("vol de vie air")
          )
            elementsFound.add("Air");
          else if (
            lowerDesc.includes("dommages neutre") ||
            lowerDesc.includes("vol de vie neutre") ||
            lowerDesc.includes("poison neutre")
          )
            elementsFound.add("Neutre");
        }
        
        const finalElements = Array.from(elementsFound);
        // if (finalElements.length === 0) {
        //     finalElements.push("Aucun");
        // }

        result.push({
          id: spell.id,
          class: finalClassName,
          name: spell.name?.fr || "Unknown",
          element: finalElements,
          unlockLevel,
          description: spell.description?.fr || "",
          iconId: spell.iconId,
          isVariant,
        });
      });
    });
  }

  await Bun.write(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`Processed ${result.length} spells. Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
