# Optimisation Framework V2

## Requirements

[Node](https://nodejs.org/en/) - version 21.1.0 or higher recommended

[NPM](https://www.npmjs.com/) - should be installed with Node

## Recommended

**VS Code extensions:**

[Prettier](https://prettier.io/)

[OptiSnippets](https://marketplace.visualstudio.com/items?itemName=DaveBennett.optisnippets)

### Initial install

Clone the directory.

Navigate to the folder.

Install the dependencies using `npm ci`.

Create a config.js from the sample file (config.sample.js) in the root directory and update the `id` and `name` key's value.

### To start developing a new test

In the command line/terminal type `npm run opti`.

Answer the questions and the new folder structure will be set up. The compiler will start automatically.

The folder structure: `{year}/{week_month_year}/{developer_id}/{test}`.

You can optionally create a control variant alongside your test variants.

For QA testing without Git operations, use `npm run qa` instead.

To start the compiler without creating a new project use `npm start`.

The compiler watches for file changes and automatically rebuilds when you save files. Changes to global utilities rebuild all tests, changes to local utils rebuild all variants in that test. Changes in the variant folder will rebuild the specific variant.

Coding should be done in `{test_folder}/{variant}/src/source.ts` and in files from `{test_folder}/utils/` folder for JS/TS code and `{test_folder}/{variant}/src/source.scss` for non-MFE styling.

The `utils/` folder at test level is shared across all variants and contains `constants.ts`, `functions.ts`, and `translations.ts` for test-specific code.

Each variant also contains a `testConfig.js` file in the `src/` folder with test metadata (testID, testName, developerID, developerName, variant) that can be imported and used in your code.

TypeScript files are validated before compilation to catch errors early.

The compiler bundles TypeScript, compiles SCSS, and generates two outputs in the `{variant}/build` folder:

`output.js` - JavaScript with inline CSS injection for browser console/devtools snippets

`output.html` - Combined script and style tags for [Adobe Target](https://experience.adobe.com/#/@tuiukltd/target/activities).

To use the [TUI UI design library](https://web.tui/storybook/?path=/) uncomment the `@tui` import lines in `source.scss`.

### MFE Styling

For styling MFE components, create SCSS files in `{variant}/src/mfeStyles/` folder. Use `addMFEStyling(mfeElement)` in your code - the compiler will automatically inject the corresponding CSS from `mfeStyles/{mfeElement}.scss`.

### Adding code to the framework

All changes should be made in a separate feature branch with a clear naming convention. For simple A/B tests, no code review is needed, but the work should still be implemented on a separate branch. You can merge your changes once the test is live without requiring action from other developers.

For any other changes that would affect the framework's functionality code review is required.

Commits should begin with the test's ID - e.g. `UK1234 Added modal styling`

Prefixes for commits: feature, fix, refactor, removed

Prefixes for feature branches: feature, test, bugfix

### Utility Functions

Commonly used functions are available in `utilities/ts/`, and in its subfolders. They can be included by the use of `import`, for example `import { waitForAll } from '@utils/ts/waitForAll';`

The framework uses `@utils` as an alias for the `utilities/` directory in imports.

Additions and changes to the utility functions **must** be done in a separate branch and a merge request created to be reviewed by other developers.

Any change to these functions will be updated directly in tests using them, so it is important they remain compatible with past tests.

### Sass variables / media query mixins

These are imported by `@use 'base';` at the top of `src/source.scss`. They include the font families for TUI and Ambit fonts, and media queries.

Usage is as follows:

```
.container {
  font-family: $tuiFont;

  @include max(sm) {
    background: blue;
  }

  @include min(xl) {
    background: green;
  }

  @include min-max(sm, lg) {
    color: red;
  }

  h1 {
    font-family: $ambitFont;
  }
}
```

### Use ESLint
There are two possible lint functionality:

1. Use command `npm run lint` to scan the whole framework

2. Navigate to the specific test folder and use `npm run lint:here` to scan your project