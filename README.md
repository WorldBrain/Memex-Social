# Memex Social web UI

Memex Social features span across the Memex browser extension, and the web UI allowing users without the extension installed interact with shared content. This is the web UI.

## Getting started

```
$ git clone --recurse git@github.com:WorldBrain/Memex-Social
$ cd Memex-Social
$ git checkout <branch-to-work on>
$ yarn bootstrap
$ cd frontend
$ REACT_APP_BACKEND=memory yarn start
```

You can then access development scenarios using the instructions in [Scenarios and the Meta UI](#scenarios).

## Architecture overview

When viewing a page, the code in `frontend/src/main.ts` gets triggered and decides whether to start the main UI, or the Meta UI (more below.) The main UI setup (`frontend/src/setup/main.ts`) creates the services and storage it needs, and kicks off the UI. These services and storage abstract the edge of the system (backend communication, browser APIs, etc.) so they can have different implementations, most notably an in-memory one during development. The storage layer is handled by Storex, allowing us to have both an in-memory database during development, and a Firestore database during production. The main UI uses React in combination with a modified version of [UILogic](https://github.com/ShishKabab/ui-logic/), decoupling the UI logic from React, leaving React only with the responsibilities of rendering state and collecting events.

The storage layer setup and modules that cannot be linked to a specific feature area are located in `frontend/src/storage/`, of which the setup is done in `frontend/src/storage/index.ts:createStorage()`. Also in here should be schema migrations, a centralized list of schema versions, and checks that validate the data schema.

The services get created after the storage layer in `frontend/src/services` and abstract the rest of the edge of the system including:

-   `auth`: signal a login is needed, keep track of the currently authenticated user, etc.
-   `fixtures`: load pre-filled databases for development
-   `logic-registry`: keep track of all currently visible stateful components to control them from outside the UI (automated tests, etc.)
-   `device`: keep track of device info like screen width
-   `router`: go to different application routes, reverse route URLs, get route parameters
-   `scenarios`: replay scenarios composed of a series of user interactions for testing purposes

### <a name='scenarios'></a>Scenarios and the Meta UI

There are two common, time-consuming tasks during UI development:

-   Working on logic or application state that only occurs after a series of actions (e.g. the form at the end of a checkout procedure)
-   Making UI changes and seeing how this change visually affects many places in the program

For these two reasons we have scenarios, which are essentially scripts that pre-load the database with pre-defined data, and replay certain user interactions in a linear way. This way you can say things like 'take me to the point in the registration flow where the user is just about to click the submit button'. How it works:

-   You tell what the user should do in every step (e.g. fill in the e-mail address in a form) of a particular scenario
-   You go to a special URL (e.g. `http://localhost:3000/?scenario=landing-page.new-user`)
-   The main set up procedure detects you want to replay a scenario
-   The `ScenarioService` uses the `FixtureService` to pre-load the database with the fixture attached with that scenario
-   For each step `ScenarioService` waits for the stateful element you want to interact with (like `SignupForm`) and once it's mounted, trigger the desired event (like `changeFullName`), waiting for any promise it might return.

Because of the way the edge of the system is isolated, we can also show a scenario replay in the Meta UI. In the Meta UI, you can see all the steps the user goes through next to each other just like in a design spec. This is done by giving each steps its own mount point, in-memory database and services (like the `RouterService`), and replaying the choosen scenario up until the step that panel represents. For now, only replaying single scenarios is supported, but one could imagine wanting to display multiple scenarios next to each other, or for example light and dark mode next to each other, which is technically not hard to implement.

## Coding guides

As part of WorldBrain, this project adheres to the coding guidelines outline in the [WorldBrain engineering documentation](https://worldbrain.github.io/WorldBrain-Engineering/#/), where we explain things like Styled Component usage, having no mercy for any global or implicitly shared state, etc.

## Some things to know about the Lerna setup

This project uses Lerna to manage multiple packages and make development across them easier. Lerna takes care of creating symlinks between all `node_modules` directories so you don't have to. However, there are some things to keep in mind.

### Adding a new NPM package to one of the modules

When you do `yarn add <package>` in one of the modules, the `node_modules` directory is automatically cleaned of any symlinks and it start to download old versions of the packages in `external/` from NPM. This will cause errors, because in order for things to work, we need the symlinks between packages to be preserved.

Instead, edit the `package.json` of the module you want to install the new dependency by hand to include the new dependency (Visual Studio code autocompletes package names and version) and then in the root `Memex-Social` directory run this:

```
$ yarn lerna bootstrap --force-local --ignore-scripts
```

### Updating and/or editing modules

If you want to use a later version and/or edit a module, you'll first have to check out a branch instead of a specific commit which may have happened though either the `git clone --recurse` or `git submodule update` commands. That means going to the module and running `git checkout develop` or `git checkout` master (or creating your own branch off of one of those) and running `yarn prepare`. That way, once you commit changes, you won't be commiting them outside of a branch.

Typically, all submodules use the `develop` branch. But some don't have them yet at time of writing, such as `@worldbrain/memex-common`, so use the `master` branch instead.

### Working across multiple modules

Lerna works by creating symlinks between the modules in their `node_modules`. This means when you requires `@worldbrain/memex-common`, it looks inside its `lib/` directory for the compiled code, not the original TypesScript code. This means that if you're editing a module, like `@worldbrain/memex-common`, you'll have to start the TypeScript watching compiler for that module (typically by going to that directory in another terminal, then running `yarn prepare:watch`.)

### Switching branches

After switching branches, you'll also have to update the submodules and recompile them. Do this by running this in the top-level directory:

```
$ git submodule update
$ yarn bootstrap
```
