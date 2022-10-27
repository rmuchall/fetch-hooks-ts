import t from "tap";
import {FetchHooks} from "../src/index.js";
import {IsValid, MetaValidator} from "meta-validator";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {Body, JsonController, MetaController, QueryParam, Route} from "meta-controller";
import {HttpMethod} from "http-status-ts";

const fetchHooks: FetchHooks = new FetchHooks({
    afterResponseHook: (response: Response, request: Request | string, options: RequestInit) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        return response;
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

    @JsonController("/request-options")
    class WidgetController {

        @Route(HttpMethod.POST, "/json")
        postJson(@Body() widget: Widget): Widget {
            t.type(widget, Widget);
            t.same(widget, testWidget);
            return widget;
        }

        @Route(HttpMethod.POST, "/query-string")
        postQueryString(@QueryParam("singleWord") singleWord: string, @QueryParam("multipleWords") multipleWords: string): boolean {
            t.equal(singleWord, "myParameter");
            t.equal(multipleWords, "my parameter");
            return true;
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
    apiServer.listen(4504);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("json", async t => {
    const response = await fetchHooks.fetch("http://localhost:4504/request-options/json", {
        method: "POST",
        json: testWidget
    });
    const result = await response.json() as Widget;
    t.same(result, testWidget);
});

void t.test("queryString", async t => {
    const result = await fetchHooks.fetch("http://localhost:4504/request-options/query-string", {
        method: "POST",
        queryString: {
            singleWord: "myParameter",
            multipleWords: "my parameter"
        }
    });
    t.ok(result);
});
