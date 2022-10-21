import t from "tap";
import {FetchHooks} from "../src/FetchHooks.js";
import {IsValid, MetaValidator} from "meta-validator";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {Body, JsonController, MetaController, Route} from "meta-controller";
import {HttpStatus, HttpMethod} from "http-status-ts";

const fetchHooks: FetchHooks = new FetchHooks();
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

    @JsonController("/basic")
    class WidgetController {

        @Route(HttpMethod.GET)
        get(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.POST)
        post(@Body() widget: Widget): Widget {
            t.type(widget, Widget);
            t.match(widget, testWidget);
            return testWidget;
        }

        @Route(HttpMethod.PUT)
        put(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.DELETE)
        delete(): Widget {
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
    apiServer.listen(4500);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("get by option", async t => {
    const response = await fetchHooks.fetch("http://localhost:4500/basic", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("get by method", async t => {
    const response = await fetchHooks.get("http://localhost:4500/basic");
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("post by option", async t => {
    const response = await fetchHooks.fetch("http://localhost:4500/basic", {
        method: HttpMethod.POST,
        body: JSON.stringify(testWidget),
        headers: {"Content-Type": "application/json"}
    });
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("post by method", async t => {
    const response = await fetchHooks.post("http://localhost:4500/basic", {
        body: JSON.stringify(testWidget),
        headers: {"Content-Type": "application/json"}
    });
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("put by option", async t => {
    const response = await fetchHooks.fetch("http://localhost:4500/basic", {method: HttpMethod.PUT});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("put by method", async t => {
    const response = await fetchHooks.put("http://localhost:4500/basic");
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("delete by option", async t => {
    const response = await fetchHooks.fetch("http://localhost:4500/basic", {method: HttpMethod.DELETE});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});

void t.test("delete by method", async t => {
    const response = await fetchHooks.delete("http://localhost:4500/basic");
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.match(result, testWidget);
});
