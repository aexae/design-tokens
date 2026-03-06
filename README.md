#design-tokens

Génération des design tokens du Design System Comète en TypeScript à partir des tokens exportés depuis Token Studio for Figma, via Style Dictionary.
Le dépôt ne contient aucune logique UI, uniquement la transformation de tokens.

##Source
Les tokens sont exportés depuis Figma au format JSON : `/tokens/*.json`
Ils constituent la source utilisée par [Style Dictionary](https://amzn.github.io/style-dictionary/)** pour le build.

##Installation et build

```bash
# Installation des dépendances
pnpm i

# Build des tokens
pnpm build
```

## Structure du projet

- `tokens` : fichiers JSON sources contenant les design tokens
- `build/` : fichiers SCSS générés uniquement pour compilation
- `dist/` : fichiers TS générés après compilation et archive TGZ versionnée

##Sortie
`design-tokens-x.x.x.tgz`

Ce package peut ensuite être utilisé comme dépendance dans les projets du Design System Comète.

