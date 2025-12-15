import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
import { transformGroups, formats } from "style-dictionary/enums";
import fs from "node:fs";

// 🔁 Enregistre tous les transforms/format du plugin Tokens Studio
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
        buildPath: "./dist/",
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

// 🔁 Pour chaque thème et chaque composant, génère un fichier SCSS filtré
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
          buildPath: "./dist/",
          files: [
            {
              destination: `${component}.${theme}.scss`,
              format: formats.scssVariables,
              // 🔍 Filtre uniquement les tokens commençant par le nom du composant
              filter: (token) => token.path[0] === component,
            },
          ],
        },
      },
    });

    await sd.cleanAllPlatforms();
    await sd.buildAllPlatforms();
  }
}
