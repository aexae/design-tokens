# style-dictionary

**Bac à sable pour expérimenter avec [Style Dictionary](https://amzn.github.io/style-dictionary/)** avant de l’intégrer au projet **Comète**.

## Objectif

Ce repo sert à tester la configuration, la transformation et l’export de tokens de design (couleurs, typographie, espaces, etc.) via Style Dictionary.

RM : la version gratuite du plugin Figma `Token Studio`est restreinte.

## Commandes

```bash
# Installation des dépendances
npm install

# Build des tokens
node build.mjs
```

## Structure du projet

- `tokens` : fichiers sources contenant les design tokens (au format JSON)
- `dist/` : fichiers générés après compilation

## Liens utiles

- 📘 [Style Dictionary – Documentation officielle](https://amzn.github.io/style-dictionary/#/)
