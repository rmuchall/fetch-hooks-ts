// Used by mergeHeaders()
export type HeadersInitOrUndefined = HeadersInit | undefined;

// Hooks
export type BeforeRequestHook = (requestInfo: RequestInfo, requestInit: RequestInit) => void | Promise<void>;
export type AfterResponseHook = (response: Response, requestInfo: RequestInfo, requestInit: RequestInit) => Response | Promise<Response>;
