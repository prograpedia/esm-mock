export declare const mocksFor: Map<string, Map<string, any>>;
export declare function mock(modules?: Record<string, any>): {
    for<T = any>(specifier: string, keep?: boolean): Promise<T>;
};
