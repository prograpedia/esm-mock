# node-esm-mock

Mock ES modules in Node.js using `registerHooks` (Node >=22.7.0).

No loader flags, no `--experimental-loader`.

## Install

```sh
npm install node-esm-mock
```

## Usage

```ts
import { mock } from 'node-esm-mock';
import assert from 'node:assert';
import sinon from 'sinon';

const handler = sinon.stub().returns('mocked!');

const mod = await mock({
    './module.ts': { greet: handler },
}).for<typeof import('./module.ts')>('./module.ts');

mod.greet();
assert.equal(handler.callCount, 1);
```

Without mocks, `for()` imports the module cleanly (cache-busted):

```ts
const mod = await mock().for('./module.ts');
```

### API

#### `mock(mocks?)`

| Param | Type | Default | Description |
|---|---|---|---|
| `mocks` | `Record<string, Record<string, unknown>>` | `{}` | A map of module specifiers to their replacement exports |

Returns an object with a `for()` method.

#### `mock(mocks).for<T>(specifier): Promise<T>`

| Param | Type | Description |
|---|---|---|
| `specifier` | `string` | Module specifier to import (cache-busted with a timestamp query) |
| `T` (generic) | — | Type of the imported module (optional) |

Imports the given specifier with the configured mocks active. After the import resolves, mock registrations are automatically cleaned up.

### Examples

**Mock a built-in module:**

```ts
const { Worker } = await mock({
    'node:worker_threads': { Worker: FakeWorker },
}).for<typeof import('../worker.js')>('../worker.js');
```

**No mocks (plain import with cache busting):**

```ts
const { Worker } = await mock().for('../worker.js');
assert.ok(Worker instanceof worker_threads.Worker);
```

## How it works

`node-esm-mock` registers a [`registerHooks`](https://nodejs.org/api/module.html#moduleregisterhooksoptions) instance at module scope that intercepts `resolve` and `load` for any module URL registered via `add()`. When a mocked module is requested, resolution short-circuits to a synthetic `mock-facade:` URL and `load` serves auto-generated ES module source that re-exports the replacement values.

Each `mock(mocks).for(specifier)` call:
1. Registers each mock entry via the internal `add()` function.
2. Dynamically imports the specifier with a cache-busting query parameter.
3. Cleans up all mock registrations after the import resolves.

## Requirements

- **Node.js >= 22.7.0** (for `module.registerHooks`)
