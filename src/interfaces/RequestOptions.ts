export interface RequestOptions extends RequestInit {
    json?: Record<string, any>;
    queryString?: Record<string, any>;
}
