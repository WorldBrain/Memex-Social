# Memex Social web UI

Memex Social features span across the Memex browser extension, and the web UI allowing users without the extension installed interact with shared content. This is the web UI.

## Getting started

```
$ git clone git clone git@github.com:WorldBrain/Memex-Social
$ cd Memex-Social
$ yarn bootstrap
$ cd frontend
$ REACT_APP_BACKEND=memory yarn start
```

## Architecture overview

When viewing a page, the code in `src/main.ts` gets triggered and decides whether to start the main UI, or the meta UI (more below.) The main UI setup (`src/setup/main.ts`) creates the services and storage it needs, and kicks off the UI. These services and storage abstract the edge of the system (backend communication, browser APIs, etc.) so they can have different implementations, most notably an in-memory one during development. The storage layer is handled by Storex, allowing us to have both an in-memory database during development, and a Firestore database during production. The main UI uses React in combination with a modified version of [UILogic](https://github.com/ShishKabab/ui-logic/), decoupling the UI logic from React, leaving React only with the responsibilities of rendering state and collecting events.

... more docs TBD ...
