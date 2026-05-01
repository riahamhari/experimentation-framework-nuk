# Experimentation Framework

## Requirements

[Node](https://nodejs.org/en/) - version 21.1.0 or higher recommended

[NPM](https://www.npmjs.com/) - should be installed with Node

## Recommended

**VS Code extensions:**

[Prettier](https://prettier.io/)

## Initial install

Clone the repository.

Navigate to the folder.

Install the dependencies using `npm ci`.

Create a `config.js` from the sample file (`config.sample.js`) in the root directory and update the `id` and `name` values with your developer details.

## Starting a new experiment

Run `npm run opti` in the terminal, answer the prompts, and the folder structure will be created and the compiler will start automatically.

The folder structure is: `{year}/{week_month_year}/{developer_id}/{test_name}`.

You can optionally create a control variant alongside your test variants.

To start the compiler without creating a new experiment use `npm start`.

## Folder structure

```
{year}/
  {week_month_year}/
    {developer_id}/
      {test_name}/
        utils/
          constants.ts   ← selectors and shared constants
          functions.ts   ← shared helper functions
        {variant}/
          src/
            source.ts    ← main experiment code
            source.scss  ← experiment styles
            testConfig.ts
          build/
            output.js    ← compiled JavaScript for Optimizely
            output.css   ← compiled CSS for Optimizely
            snippet.js   ← JS + inline CSS for browser console testing
```

## Writing experiment code

Each variant's `source.ts` is pre-populated with this template:

```typescript
import { createLogger, createTracker } from '@utils/ts/helpers/Optimizely';
import { SELECTORS } from '../../utils/constants.ts';
import { testID } from './testConfig.ts';

const { waitForElement } = window['optimizely'].get('utils');

if (location.href.includes('cfQA=true')) {
  document.cookie = 'cfQA=true;path=/';
}

const log = createLogger(testID);
const track = createTracker(log);

waitForElement('body').then(() => {
  log('experiment running');

});
```

- `log(msg)` — only prints to console when the `cfQA` cookie is present, prefixed with the experiment ID
- `track(eventName)` — pushes an event to Optimizely and logs it via `log`
- `SELECTORS` — defined in `utils/constants.ts`, shared across all variants
- `waitForElement` — provided by `window['optimizely'].get('utils')`

## QA testing

Add `cfQA=true` to the URL query string on first load to set the QA cookie. All `log()` calls will then print to the browser console.

To test in the browser, paste the contents of `snippet.js` into the browser console or Sources tab. It includes the compiled JS with CSS injected inline.

## Build outputs

The compiler watches for file changes and rebuilds automatically:

- Changes to `utilities/` rebuild all experiments
- Changes to `utils/` at test level rebuild all variants in that experiment
- Changes inside a variant's `src/` rebuild only that variant

Three files are generated in each `{variant}/build/` folder:

| File | Purpose |
|------|---------|
| `output.js` | Compiled JavaScript for Optimizely |
| `output.css` | Compiled CSS for Optimizely |
| `snippet.js` | JS with CSS injected inline, for browser console testing |

## testConfig.ts

Each variant contains a `testConfig.ts` in its `src/` folder with experiment metadata:

```typescript
export const testID = 'ELK-160';
export const testName = 'ELK-160 My Experiment Name';
export const developerID = 'riah';
export const developerName = 'Riah Amhari';
export const variant = 'V1';
```

`testID` is imported directly into `source.ts` and used as the logger prefix.

## Utility functions

Shared utilities live in `utilities/ts/` and are imported using the `@utils` alias:

```typescript
import { createLogger, createTracker } from '@utils/ts/helpers/Optimizely';
import { createHTMLElement, queryAll } from '@utils/ts/helpers/DOM';
import { debounce, requestJson } from '@utils/ts/helpers/Misc';
```

### Optimizely helpers (`@utils/ts/helpers/Optimizely`)

| Function | Description |
|----------|-------------|
| `createLogger(expNo)` | Returns a `log(msg)` function that logs to console only when `cfQA` cookie is present |
| `createTracker(log)` | Returns a `track(eventName)` function that pushes to Optimizely and calls `log` |

### DOM helpers (`@utils/ts/helpers/DOM`)

| Function | Description |
|----------|-------------|
| `createHTMLElement(tag, options)` | Creates an HTML element with classes, attributes, styles, and events |
| `queryAll(root, selector)` | Queries elements including shadow DOM using `::` separator |
| `queryWithAlternative(root, selectors)` | Queries with fallback selectors |
| `getPath(obj, path)` | Gets a nested value using dot-notation |
| `getPathWithAlternative(obj, paths)` | Gets a nested value with fallback paths |
| `updateElementAttribute(element, attr)` | Updates a single attribute, optionally extending existing value |

### Misc helpers (`@utils/ts/helpers/Misc`)

| Function | Description |
|----------|-------------|
| `debounce(fn, wait)` | Debounces a function |
| `compareDate(date1, type, date2)` | Compares two dates |
| `requestJson(options)` | Fetch wrapper returning parsed JSON |
| `createAsyncCache(factory)` | Runs a Promise factory once and caches the result |
| `responseWatch(pattern, callback)` | Watches for specific fetch responses by URL pattern |

## Sass variables and mixins

Base variables and media query mixins are available in `source.scss` via `@use 'base'`:

```scss
.container {
  @include max(sm) {
    background: blue;
  }

  @include min(xl) {
    background: green;
  }

  @include min-max(sm, lg) {
    color: red;
  }
}
```

## ESLint

Two options for linting:

1. `npm run lint` — scans the whole framework
2. Navigate to a specific test folder and run `npm run lint:here` — scans that project only

## Contributing to the framework

Commits should begin with the experiment ID, e.g. `ELK-160 Added modal styling`

Commit prefixes: `feature`, `fix`, `refactor`, `removed`
