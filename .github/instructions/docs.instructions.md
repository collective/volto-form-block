---
name: "Instructions: Frontend addon documentation"
description: "Standards and guidelines for frontend addon documentation files."
applyTo: "README.md,docs/docs/**/*.md,docs/README.md,packages/**/README.md"
---

# Frontend addon documentation standards

## 0. General guidelines

Always read the general rules for Plone documentation in ./general/docs.md

## 1. All files

- ALWAYS use emojis in section titles for a friendly tone.
- ALWAYS recommend using `make` commands for installation and starting the project:
    - ALWAYS recommend using `make install` to install the project, as this handles all dependencies and setup.
    - ALWAYS recommend using `make start` to start the Volto process, as this ensures proper configuration.
- NEVER recomend using `pnpm install` or `pnpm start` directly.
- NEVER edit the paragraph refering to `cookieplone`. Usually starting with **Generated using**.

## 2. README.md at the top level of the repository

- Must provide a clear overview of the addon
- Will be viewed on GitHub
- Will be viewed also on NPM
- Must provide installation instructions for end users.
- Must provide installation for developers willing to contribute to this add-on.
- Must describe the features.
    - Example:
        - ✅: `- Crops the image. Supports many aspect ratios` .
        - ❌: `- Crop` .
    - Review the code if necessary to explain it.
- ADDING THIS ADD-ON TO YOUR PROJECT:
    - NEVER recommend editing the top-level `package.json` manually
    - ALWAYS recommend editing the 'policy package' `package.json` instead.
    - THIS 'policy package' will always be available under `packages` folder.
    - ALWAYS recommend adding this add-on to the "addons" array in package.json


## 3. docs/README.md
- Must provide detailed documentation for developers **documenting** the project
