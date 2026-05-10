// Server entrypoint - delegate to the application in ./src
// The real app and server start-up lives in `./src/index.ts` which
// configures routes, middleware and starts the Deno server.
import "./src/index.ts";

// Note: importing `./src/index.ts` triggers its top-level code which
// starts the server (it calls `Deno.serve`). Keeping this small
// wrapper makes it easy for some deployment setups that expect a
// single `main.ts` at the project root.
