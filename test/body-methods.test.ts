import t from "tap";
import {FetchHooks} from "../src/index.js";
import {IsValid, MetaValidator} from "meta-validator";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {JsonController, MetaController, Route} from "meta-controller";
import {HttpMethod} from "http-status-ts";
import {TextDecoder} from "util";

const fetchHooks: FetchHooks = new FetchHooks({
    afterResponseHook: (response: Response, request: Request | string, options: RequestInit) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        return Promise.resolve(response);
    }
});

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

    @JsonController("/body-methods")
    class WidgetController {

        @Route(HttpMethod.GET, "/json")
        getJson(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.GET, "/buffer")
        getBuffer(): Buffer {
            return Buffer.from(JSON.stringify(testWidget), "ascii");
        }

        /*
        // TODO: FIXME
        @Route(HttpMethod.GET, "/form-data")
        getFormData(): FormData {
            const formData = new FormData();
            formData.append("widget-name", testWidget.name);
            return formData;
        }
        */

        @Route(HttpMethod.GET, "/text")
        getText(): string {
            return "Hello world!";
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
    apiServer.listen(4501);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("arrayBuffer()", async t => {
    const response = await fetchHooks.fetch("http://localhost:4501/body-methods/buffer", {method: HttpMethod.GET});
    const result = await response.arrayBuffer();
    const decoder = new TextDecoder();
    t.match(JSON.parse(decoder.decode(result)), testWidget);
});

void t.test("blob()", async () => {
    const response = await fetchHooks.fetch("http://localhost:4501/body-methods/buffer", {method: HttpMethod.GET});
    const result = await response.blob();
    const decoder = new TextDecoder();
    t.match(JSON.parse(decoder.decode(await result.arrayBuffer())), testWidget);
});

/*
// TODO: FIXME
t.test("formData()", async t => {
    const response = await fetchHooks.fetch("http://localhost:4501/body-methods/form-data", {method: HttpMethod.GET});
    const result = await response.formData()
    t.equal(result.get("widget-name"), "Doodad");
});
*/

void t.test("json()", async t => {
    const response = await fetchHooks.fetch("http://localhost:4501/body-methods/json", {method: HttpMethod.GET});
    const result = await response.json() as Widget;
    t.match(result, testWidget);
});

void t.test("text()", async t => {
    const response = await fetchHooks.fetch("http://localhost:4501/body-methods/text", {method: HttpMethod.GET});
    const result = await response.text();
    t.equal(result, "Hello world!");
});
