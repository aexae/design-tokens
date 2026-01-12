import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
import { transformGroups, formats } from "style-dictionary/enums";
import fs from "node:fs";
import { generateTokens } from "./scripts/generate-tokens";

// Enregistre tous les transforms/format du plugin Tokens Studio
register(StyleDictionary);

// ✅ Génère les tokens de base
const baseSD = new StyleDictionary(
  {
    log: {
      verbosity: "verbose",
      warnings: "warn",
    },
    source: ["tokens/base/**/*.json"],
    platforms: {
      scss: {
        transformGroup: transformGroups.scss,
        buildPath: "./build/scss/",
        files: [
          {
            destination: "base.scss",
            format: formats.scssVariables,
          },
        ],
      },
    },
  },
  { verbosity: "verbose" }
);

await baseSD.cleanAllPlatforms();
await baseSD.buildAllPlatforms();

// 🔍 Charge le fichier de composants
const componentTokens = JSON.parse(
  fs.readFileSync("./tokens/components/tokens.json", "utf-8")
);

// 🧩 Récupère les noms de composants de premier niveau (ex: button, avatar...)
const components = Object.keys(componentTokens);

// Pour chaque thème et chaque composant, génère un fichier SCSS filtré
for (const theme of ["light", "dark"]) {
  for (const component of components) {
    const sd = new StyleDictionary({
      log: {
        verbosity: "verbose",
        warnings: "warn",
      },
      source: [
        "tokens/base/**/*.json",
        `tokens/theme/${theme}.json`,
        "tokens/components/tokens.json",
      ],
      platforms: {
        scss: {
          transformGroup: transformGroups.scss,
          buildPath: "./build/scss/",
          files: components.map((component) => ({
            destination: `${component}.${theme}.scss`,
            format: formats.scssVariables,
            // filtre composant + thème pour éviter les collisions
            filter: (t) =>
              t.path[0] === component &&
              // Tokens Studio exporte souvent un marqueur de mode
              (t.$extensions?.mode === theme || !t.$extensions?.mode),
          })),
        },
      },
    });

    await sd.cleanAllPlatforms();
    await sd.buildAllPlatforms();
  }
}
// transform SCSS to TS
generateTokens();

