import { registerHooks } from 'node:module';

const mockedModuleExports = new Map();
let mainImportURL = import.meta.url;

registerHooks({
    resolve(specifier, context, nextResolve) {
        const def = nextResolve(specifier, context);
        if (!context.parentURL?.startsWith('mock-facade:')) {
            if (mockedModuleExports.has(def.url)) {
                return {
                    shortCircuit: true, url: `mock-facade:${encodeURIComponent(def.url)}`,
                };
            }
        }
        return def;
    }, load(url, context, nextLoad) {
        if (url.startsWith('mock-facade:')) {
            const encodedTargetURL = url.slice(url.lastIndexOf(':') + 1);
            return {
                shortCircuit: true, source: generateModule(encodedTargetURL), format: 'module',
            };
        }
        return nextLoad(url, context);
    }
});

function generateModule(encodedTargetURL: string) {
    const exports = mockedModuleExports.get(decodeURIComponent(encodedTargetURL));
    const body = [
        `import { mockedModules } from ${JSON.stringify(mainImportURL)};`,
        'export {};',
        'let mapping = {__proto__: null};',
        `const mock = mockedModules.get(${JSON.stringify(encodedTargetURL)});`,
    ];
    for (const [i, name] of Object.entries(exports)) {
        const key = JSON.stringify(name);
        body.push(`var _${i} = mock.namespace[${key}];`);
        body.push(`Object.defineProperty(mapping, ${key}, { enumerable: true, set(v) {_${i} = v;}, get() {return _${i};} });`,);
        body.push(`export {_${i} as ${name}};`);
    }
    body.push(`mock.listeners.push(() => {
        for (var k in mapping) {
            mapping[k] = mock.namespace[k];
        }
    });`);
    return body.join('\n');
}

export const mockedModules = new Map();

function add<T extends Record<string, unknown>>(resolved: string, replacementProperties: T) {
    const exportNames = Object.keys(replacementProperties);
    const namespace = { __proto__: null };
    const listeners: ((name: string) => void)[] = [];
    for (const name of exportNames) {
        let currentValueForPropertyName = replacementProperties[name];
        Object.defineProperty(namespace, name, {
            // @ts-ignore
            __proto__: null,
            enumerable: true,
            get() {
                return currentValueForPropertyName;
            }, set(v) {
                currentValueForPropertyName = v;
                for (const fn of listeners) {
                    try {
                        fn(name);
                    } catch {
                        /* noop */
                    }
                }
            },
        });
    }
    mockedModules.set(encodeURIComponent(resolved), {
        namespace, listeners,
    });
    mockedModuleExports.set(resolved, exportNames);
    return namespace as unknown as T;
}

export function mock(mocks: Record<string, Record<string, unknown>> = {}) {
    const mockedModules = new Map<string, unknown>();
    return {
        for<T = any>(specifier: string): Promise<T> {
            try {
                for (const spec in mocks) {
                    mockedModules.set(spec, add(spec, mocks[spec]));
                }
                return import(`${specifier}?${+new Date()}`);
            } finally {
                mockedModules.forEach((_, mockedModule) => mockedModuleExports.delete(mockedModule));
            }
        }
    }
}