export declare const mockedModules: Map<any, any>;
export declare function mock(mocks?: Record<string, Record<string, unknown>>): {
    for<T = any>(specifier: string): Promise<T>;
};
