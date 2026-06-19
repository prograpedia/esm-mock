import {register, registerHooks} from "node:module";
import {fileURLToPath, pathToFileURL} from "node:url";
import ts from "typescript";

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (context.parentURL?.startsWith('file:')) {
            let extra;
            [specifier, extra] = specifier.split('?')
            const { resolvedModule } = ts.resolveModuleName(specifier, context.parentURL ? fileURLToPath(context.parentURL) : '', ts.getDefaultCompilerOptions(), ts.sys);
            if (!resolvedModule?.isExternalLibraryImport && resolvedModule?.resolvedFileName) {
                specifier = pathToFileURL(resolvedModule.resolvedFileName).href + `?${extra}`
            }
            return nextResolve(specifier, context);
        }
        return nextResolve(specifier, context);
    }
})

register("ts-node/esm", pathToFileURL("./"));