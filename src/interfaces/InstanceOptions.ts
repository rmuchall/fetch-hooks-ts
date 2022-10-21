import {AfterResponseHook, BeforeRequestHook} from "../utilities/type-aliases.js";

export interface InstanceOptions {
    prefixUrl?: string;
    jwtToken?: string;
    beforeRequestHook?: BeforeRequestHook;
    afterResponseHook?: AfterResponseHook;
    headers?: HeadersInit;
}
