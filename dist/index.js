var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { registerHooks } from 'node:module';
registerHooks({
    resolve(specifier, context, nextResolver) {
        const resolved = nextResolver(specifier, context);
        const mocksForSpecifier = mocksFor.get(specifier);
        if (mocksForSpecifier) {
            mocksFor.set(resolved.url, mocksForSpecifier);
        }
        if (context.parentURL) {
            const mocksForParentURL = mocksFor.get(context.parentURL);
            if (mocksForParentURL) {
                const scope = context.parentURL.split('?')[1];
                const resolvedUrl = `${resolved.url}?${scope}`;
                if (mocksForParentURL.has(resolvedUrl)) {
                    return {
                        url: resolvedUrl, format: 'mocked', importAttributes: {
                            parentURL: context.parentURL,
                        }, shortCircuit: true
                    };
                }
            }
        }
        return resolved;
    }, load(url, context, nextLoader) {
        if (context.format === 'mocked') {
            const source = generateModule(context.importAttributes.parentURL, url);
            return { source, format: 'module', shortCircuit: true };
        }
        return nextLoader(url, context);
    }
});
export const mocksFor = new Map();
function generateModule(parent, url) {
    const body = [
        `import {mocksFor} from ${JSON.stringify(import.meta.url)};`,
        `const exports = mocksFor.get(${JSON.stringify(parent)});`,
    ];
    if (parent) {
        const mocksForParent = mocksFor.get(parent);
        if (mocksForParent) {
            const exports = mocksForParent.get(url);
            if (exports) {
                for (const key in exports) {
                    body.push(`export const ${key} = exports.get(${JSON.stringify(url)})[${JSON.stringify(key)}];`);
                }
            }
        }
    }
    return body.join('\n');
}
let version = 0;
export function mock(modules = {}) {
    return {
        for(specifier_1) {
            return __awaiter(this, arguments, void 0, function* (specifier, keep = false) {
                try {
                    const scope = (version++).toString() + +new Date();
                    specifier = `${specifier}?${scope}`;
                    mocksFor.set(specifier, new Map(Object.entries(modules).map(([k, v]) => [`${k}?${scope}`, v])));
                    return yield import(specifier);
                }
                finally {
                    if (!keep)
                        mocksFor.delete(specifier);
                }
            });
        }
    };
}
