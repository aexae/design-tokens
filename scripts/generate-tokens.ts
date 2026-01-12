/**
 * Script de génération automatique des tokens TypeScript à partir des fichiers SCSS
 *
 * Usage: npx tsx scripts/generate-tokens.ts
 * Ou via npm script: pnpm generate:tokens
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DESIGN_TOKENS_DIR = path.resolve(__dirname, "../build/scss");
const OUTPUT_DIR = path.resolve(__dirname, "../build/ts");

interface TokenValue {
  [key: string]: TokenValue | string | number;
}

/**
 * Parse une valeur SCSS en valeur TypeScript
 */
function parseValue(value: string): string | number {
  const trimmed = value.trim().replace(/;$/, "");

  // Si c'est un nombre sans unité
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // Si c'est un nombre décimal
  if (/^\d+\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Sinon c'est une string (couleur, etc.)
  return trimmed;
}

/**
 * Parse le nom d'une variable SCSS en chemin d'objet
 * Ex: $button-color-contained-default-background-default -> ["color", "contained", "default", "background", "default"]
 */
function parseVariableName(varName: string, componentName: string): string[] {
  // Enlever le $ et le préfixe du composant
  const withoutPrefix = varName
    .replace(/^\$/, "")
    .replace(new RegExp(`^${componentName}-`), "");

  return withoutPrefix.split("-");
}

/**
 * Insère une valeur dans un objet imbriqué selon un chemin
 */
function setNestedValue(obj: TokenValue, path: string[], value: string | number): void {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    } else if (typeof current[key] !== "object") {
      // Si la valeur existante n'est pas un objet, on la convertit
      // en gardant la valeur sous la clé "_value"
      current[key] = { _value: current[key] };
    }
    current = current[key] as TokenValue;
  }

  const lastKey = path[path.length - 1];
  if (lastKey in current && typeof current[lastKey] === "object") {
    // Si c'est déjà un objet, on ajoute la valeur sous "_value"
    (current[lastKey] as TokenValue)._value = value;
  } else {
    current[lastKey] = value;
  }
}

/**
 * Parse un fichier SCSS et retourne un objet de tokens
 */
function parseScssFile(filePath: string, componentName: string): TokenValue {
  const content = fs.readFileSync(filePath, "utf-8");
  const tokens: TokenValue = {};

  // Regex pour matcher les variables SCSS: $var-name: value;
  const variableRegex = /^\$([a-zA-Z0-9-]+):\s*(.+);?\s*$/gm;

  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    const varName = `$${match[1]}`;
    const value = match[2];

    const path = parseVariableName(varName, componentName);
    const parsedValue = parseValue(value);

    setNestedValue(tokens, path, parsedValue);
  }

  return tokens;
}

/**
 * Génère le contenu TypeScript pour les tokens
 */
function generateTypeScriptContent(tokens: TokenValue, componentName: string): string {
  const camelName = toCamelCase(componentName);
  const pascalName = toPascalCase(componentName);
  const tokensVarName = `${camelName}Tokens`;

  const jsonContent = JSON.stringify(tokens, null, 2)
    // Garder les couleurs hex comme strings
    .replace(/: (#[a-fA-F0-9]+)/g, ': "$1"');

  return `/**
 * ${pascalName} Design Tokens
 * Auto-generated from design-tokens/dist/${componentName}.light.scss
 * 
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Run: pnpm generate:tokens
 */

export const ${tokensVarName} = ${jsonContent} as const;

export type ${pascalName}Tokens = typeof ${tokensVarName};
`;
}

/**
 * Convertit un nom avec tirets en camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convertit un nom avec tirets en PascalCase
 */
function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Met à jour le fichier index.ts des tokens
 */
function updateIndexFile(componentNames: string[]): void {
  const exports = componentNames
    .map((name) => {
      const camelName = toCamelCase(name);
      const pascalName = toPascalCase(name);
      return `export { ${camelName}Tokens } from "./${name}.tokens";
export type { ${pascalName}Tokens } from "./${name}.tokens";`;
    })
    .join("\n");

  const content = `/**
 * Design Tokens Index
 * Auto-generated - DO NOT EDIT MANUALLY
 */

${exports}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), content);
  console.log("✅ Updated src/styles/tokens/index.ts");
}

/**
 * Fonction principale
 */
export function generateTokens(): void {
  console.log("🚀 Generating design tokens...\n");

  // Créer le dossier output s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Lister les fichiers SCSS light (on utilise light comme référence)
  const scssFiles = fs
    .readdirSync(DESIGN_TOKENS_DIR)
    .filter((file) => file.endsWith(".light.scss"));

  const generatedComponents: string[] = [];

  for (const file of scssFiles) {
    const componentName = file.replace(".light.scss", "");
    const filePath = path.join(DESIGN_TOKENS_DIR, file);

    console.log(`📦 Processing ${componentName}...`);

    try {
      const tokens = parseScssFile(filePath, componentName);
      const tsContent = generateTypeScriptContent(tokens, componentName);

      const outputPath = path.join(OUTPUT_DIR, `${componentName}.tokens.ts`);
      fs.writeFileSync(outputPath, tsContent);

      generatedComponents.push(componentName);
      console.log(`   ✅ Generated ${componentName}.tokens.ts`);
    } catch (error) {
      console.error(`   ❌ Error processing ${componentName}:`, error);
    }
  }

  // Mettre à jour le fichier index
  if (generatedComponents.length > 0) {
    updateIndexFile(generatedComponents);
  }

  console.log(`\n✨ Done! Generated ${generatedComponents.length} token files.`);
}

