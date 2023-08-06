import {InstanceOptions} from "./interfaces/InstanceOptions.js";
import {RequestOptions} from "./interfaces/RequestOptions.js";
import {HeadersInitOrUndefined} from "./utilities/type-aliases.js";

export class FetchHooks {
    private instanceOptions?: InstanceOptions;

    constructor(instanceOptions?: InstanceOptions) {
        if (instanceOptions) {
            this.instanceOptions = instanceOptions;
        }
    }

    private buildRequestInit(userRequestOptions?: RequestOptions): RequestInit {
        // Exclude UnifiedFetch specific options and extract headers
        const {json, queryString, headers, ...userRequestOptionsDestructured} = {...userRequestOptions};
        const requestInit: RequestInit = {...userRequestOptionsDestructured};

        // Normalize method case
        requestInit.method = requestInit.method?.toUpperCase();

        // Merge headers
        requestInit.headers = FetchHooks.mergeHeaders(this.instanceOptions?.headers, headers);

        // JWT token
        if (this.instanceOptions?.jwtToken) {
            requestInit.headers = FetchHooks.mergeHeaders(requestInit.headers, {
                "Authorization": `Bearer ${this.instanceOptions.jwtToken}`
            });
        }

        // FetchHooks json option
        if (json) {
            requestInit.headers.append("Content-Type", "application/json");
            requestInit.body = JSON.stringify(json);
        }

        return requestInit;
    }

    private async performFetch(requestInfo: RequestInfo, requestInit: RequestInit): Promise<Response> {
        // beforeRequestHook
        if (this.instanceOptions?.beforeRequestHook) {
            await this.instanceOptions.beforeRequestHook(requestInfo, requestInit);
        }

        // Fetch
        let response = await fetch(requestInfo, requestInit);

        // afterResponseHook
        if (this.instanceOptions?.afterResponseHook) {
            response = await this.instanceOptions.afterResponseHook(response, requestInfo, requestInit);
        }

        return response;
    }

    fetch(input: RequestInfo, init?: RequestOptions): Promise<Response> {
        const requestInit = this.buildRequestInit(init);

        if (typeof input === "string") {
            // prefixUrl?
            if (this.instanceOptions?.prefixUrl) {
                // Normalize url
                input = `${this.instanceOptions.prefixUrl}/${input}`.replace(/([^:]\/)\/+/g, "$1");
            }

            // UnifiedFetch queryStringParams option
            const queryStringObject = init?.queryString;
            if (queryStringObject) {
                const queryString = Object.keys(queryStringObject)
                    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryStringObject[key])}`)
                    .join("&");
                input = `${input}?${queryString}`;
            }
        }

        // Fetch
        return this.performFetch(input, requestInit);
    }

    // Add shortcuts
    get(request: RequestInfo, options?: RequestOptions): Promise<Response> {
        return this.fetch(request, {
            ...options,
            method: "GET"
        });
    }

    post(request: RequestInfo, options?: RequestOptions): Promise<Response> {
        return this.fetch(request, {
            ...options,
            method: "POST"
        });
    }

    put(request: RequestInfo, options?: RequestOptions): Promise<Response> {
        return this.fetch(request, {
            ...options,
            method: "PUT"
        });
    }

    delete(request: RequestInfo, options?: RequestOptions): Promise<Response> {
        return this.fetch(request, {
            ...options,
            method: "DELETE"
        });
    }

    static mergeHeaders(...sources: HeadersInitOrUndefined[]): Headers {
        const result = new Headers();

        for (const source of sources) {
            if (!source) {
                continue;
            }

            const headers = source.constructor === Headers ? source : new Headers(source);
            headers.forEach((value, key, parent) => {
                if (!value) {
                    result.delete(key);
                } else {
                    result.set(key, value);
                }
            });
        }

        return result;
    }
}
