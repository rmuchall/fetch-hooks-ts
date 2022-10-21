import t from "tap";
import {FetchHooks} from "../src/FetchHooks.js";
import {IsValid, MetaValidator} from "meta-validator";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {JsonController, MetaController, Route} from "meta-controller";
import {HttpStatus, HttpMethod} from "http-status-ts";

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

    @JsonController("/error")
    class WidgetController {

        @Route(HttpMethod.GET)
        get(): Widget {
            return testWidget;
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
    apiServer.listen(4502);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("bad path", async t => {
    const fetchHooks: FetchHooks = new FetchHooks();
    const response = await fetchHooks.get("http://localhost:4502/error/bad-path");
    t.equal(response.status, HttpStatus.NOT_FOUND);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.equal(result.message, "Route not found");
});

void t.test("beforeRequestHook", async t => {
    const fetchHooks: FetchHooks = new FetchHooks({
        beforeRequestHook: (requestInfo: Request | string, requestInit: RequestInit) => {
            throw new Error("thrown in beforeRequestHook");
        }
    });

    await t.rejects(fetchHooks.get("http://localhost:4502/error"), new Error("thrown in beforeRequestHook"));
});

void t.test("afterResponseHook", async t => {
    const fetchHooks: FetchHooks = new FetchHooks({
        afterResponseHook: (response: Response, requestInfo: Request | string, requestInit: RequestInit) => {
            throw new Error("thrown in afterResponseHook");
        }
    });

    await t.rejects(fetchHooks.get("http://localhost:4502/error"), new Error("thrown in afterResponseHook"));
});
