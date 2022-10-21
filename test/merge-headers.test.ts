import t from "tap";
import {FetchHooks} from "../src/index.js";

void t.test("merge two different sources", t => {
    const sourceA: Record<string, string> = {
        "A-1": "A-1",
        "A-2": "A-2",
        "A-3": "A-3"
    };
    const sourceB: Record<string, string> = {
        "B-1": "B-1",
        "B-2": "B-2",
        "B-3": "B-3"
    };
    const mergedHeaders = FetchHooks.mergeHeaders(sourceA, sourceB);
    const mergedObject = {...sourceA, ...sourceB};

    t.type(mergedHeaders, Headers);
    t.match(mergedHeaders, new Headers(mergedObject));
    t.end();
});

void t.test("override duplicate header", t => {
    const sourceA: Record<string, string> = {"My-Header": "One"};
    const sourceB: Record<string, string> = {"My-Header": "Two"};
    const mergedHeaders = FetchHooks.mergeHeaders(sourceA, sourceB);
    t.type(mergedHeaders, Headers);
    t.equal(mergedHeaders.get("My-Header"), "Two");
    t.end();
});

void t.test("undefined source", t => {
    const mergedHeaders = FetchHooks.mergeHeaders(undefined, {
        "My-Header": "One"
    });
    t.type(mergedHeaders, Headers);
    t.equal(mergedHeaders.get("My-Header"), "One");
    t.end();
});
