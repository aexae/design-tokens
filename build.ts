import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
import { transformGroups } from "style-dictionary/enums";
import { existsSync, readFileSync, mkdirSync } from "fs";

// Enregistre les transforms Tokens Studio
register(StyleDictionary);

// Ajoute un format TypeScript personnalisé
StyleDictionary.registerFormat({
  name: "typescript/es6",
  format: ({ dictionary }) => {
    const tokens = JSON.stringify(dictionary.tokens, null, 2);
    return `export const tokens = ${tokens} as const;\n`;
  },
});

// ✅ Génère les tokens de base (optionnel en TS, mais tu peux l’adapter)
// On le saute ici car on se concentre sur composants + thèmes

// 🔍 Charge le fichier de composants
const componentTokensPath = "./tokens/components/tokens.json";
if (!existsSync(componentTokensPath)) {
  throw new Error(`Fichier de composants introuvable : ${componentTokensPath}`);
}
const componentTokens = JSON.parse(readFileSync(componentTokensPath, "utf-8"));
const components = Object.keys(componentTokens);

// 🎨 Génère un fichier TS par composant + thème
for (const theme of ["light", "dark"]) {
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
      ts: {
        transformGroup: transformGroups.js, // ou `js` selon les tokens, `scss` n’est pas adapté pour TS
        buildPath: "./build/tokens/",
        files: components.map((component) => ({
          destination: `${component}.${theme}.ts`,
          format: "typescript/es6",
          filter: (token) => {
            // Le chemin du token commence par le nom du composant
            if (token.path[0] !== component) return false;
            // Respecte le mode/thème si spécifié
            const mode = token.$extensions?.mode;
            return !mode || mode === theme;
          },
        })),
      },
    },
  });

  // Assure-toi que le dossier de sortie existe
  const buildPath = "./build/tokens/";
  if (!existsSync(buildPath)) {
    mkdirSync(buildPath, { recursive: true });
  }

  await sd.cleanAllPlatforms();
  await sd.buildAllPlatforms();
}

// Optionnel : appeler generateTokens() si c’est un post-processing supplémentaire
// await generateTokens();