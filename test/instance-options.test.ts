import t from "tap";
import {FetchHooks} from "../src/index.js";
import {IsValid, MetaValidator} from "meta-validator";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {HeaderParam, JsonController, MetaController, Route} from "meta-controller";
import {HttpMethod, HttpStatus} from "http-status-ts";

MetaValidator.clearMetadata();

class Widget {
    @IsValid()
    name: string;

    @IsValid()
    model: number;

    @IsValid()
    isBlue: boolean;
}

const testWidget: Widget = Object.assign<Widget, Widget>(new Widget(), {
    name: "Doodad",
    model: 1234,
    isBlue: true
});

let expressApp: Application;
let apiServer: HttpServer;

t.before(() => {
    MetaController.clearMetadata();

    @JsonController("/instance-options")
    class WidgetController {
        @Route(HttpMethod.GET, "/prefix-url")
        prefixUrl(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.GET, "/jwt-token")
        jwtToken(@HeaderParam("Authorization") authorizationHeader: string): string {
            return authorizationHeader;
        }

        @Route(HttpMethod.GET, "/before-request-hook")
        beforeRequestHook(@HeaderParam("Request-Hook-Header") requestHookHeader: string): string {
            return requestHookHeader;
        }

        @Route(HttpMethod.GET, "/after-response-hook")
        afterResponseHook(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.GET, "/headers")
        headers(@HeaderParam("Test-Header") testHeader: string): string {
            return testHeader;
        }

        @Route(HttpMethod.GET, "/jwt-token-and-headers")
        jwtTokenAndHeaders(@HeaderParam("Authorization") authorizationHeader: string,
            @HeaderParam("Test-Header") testHeader: string): string[] {
            const headers: string[] = [];
            headers.push(authorizationHeader);
            headers.push(testHeader);
            return headers;
        }
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        isDebug: true,
        isUseCors: true,
        controllerClassTypes: [
            WidgetController
        ]
    });
    apiServer = http.createServer(expressApp);
    apiServer.listen(4503);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("prefixUrl", async () => {
    const fetchHooks: FetchHooks = new FetchHooks({
        prefixUrl: "http://localhost:4503/"
    });

    const response = await fetchHooks.fetch("/instance-options/prefix-url", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("jwtToken", async () => {
    const fetchHooks: FetchHooks = new FetchHooks({
        jwtToken: "this-is-a-test-jwt-token"
    });

    const response = await fetchHooks.fetch("http://localhost:4503/instance-options/jwt-token", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    const result = await response.text();
    t.equal(result, "Bearer this-is-a-test-jwt-token");
});

void t.test("beforeRequestHook", async t => {
    const fetchHooks: FetchHooks = new FetchHooks({
        beforeRequestHook: (requestInfo: Request | string, requestInit: RequestInit) => {
            requestInit.headers = new Headers({
                "Request-Hook-Header": "this-header-was-set-in-before-request-hook"
            });
        }
    });

    const response = await fetchHooks.fetch("http://localhost:4503/instance-options/before-request-hook", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    const result = await response.text();
    t.equal(result, "this-header-was-set-in-before-request-hook");
});

void t.test("afterResponseHook", async t => {
    const fetchHooks: FetchHooks = new FetchHooks({
        afterResponseHook: (response: Response, requestInfo: Request | string, requestInit: RequestInit) => {
            (response as any).testAfterResponseHook = "this-was-set-in-after-response-hook";
            return response;
        }
    });

    const response = await fetchHooks.fetch("http://localhost:4503/instance-options/after-response-hook", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    t.equal((response as any).testAfterResponseHook, "this-was-set-in-after-response-hook");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("headers", async () => {
    const fetchHooks: FetchHooks = new FetchHooks({
        headers: {
            "Test-Header": "this-header-was-set-in-options"
        }
    });

    const response = await fetchHooks.fetch("http://localhost:4503/instance-options/headers", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    const result = await response.text();
    t.equal(result, "this-header-was-set-in-options");
});

void t.test("jwtToken AND headers", async () => {
    const fetchHooks: FetchHooks = new FetchHooks({
        jwtToken: "this-is-a-test-jwt-token",
        headers: {
            "Test-Header": "this-header-was-set-in-options"
        }
    });

    const response = await fetchHooks.fetch("http://localhost:4503/instance-options/jwt-token-and-headers", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json() as string[];
    t.equal(result[0], "Bearer this-is-a-test-jwt-token");
    t.equal(result[1], "this-header-was-set-in-options");
});
