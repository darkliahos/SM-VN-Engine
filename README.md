# Secret Monster Engine

A super simple engine that allows for scripting of Visual novel games.

## A bit of an introduction

This was started as a collaboration project at some point in 2012/2013 and some early progress was done on it, it was decided to revive this project from the dead and create something worthwhile. There are two projects, one is the engine which is written in Electron and typescript, its implemented most of the spec unless marked below. The other project is a metadata generator, this might do a lot more soon and will act as the engine editor.

## Development & Debugging

To run the engine locally for development and debugging:

1. Navigate to the `SM-engine` directory:

   ```bash
   cd SM-engine
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server with Electron launcher:

   ```bash
   npm start
   # or
   npm run dev
   ```

   This compiles TypeScript, bundles the renderer with `esbuild`, copies assets/scenarios into `dist/`, and launches Electron.

4. Run unit tests:

   ```bash
   npm run test:run
   ```

## Distribution & Packaging

To create a packaged distribution of the engine (including Electron binaries, assets, scenarios, and metadata):

1. Navigate to the `SM-engine` directory:

   ```bash
   cd SM-engine
   ```

2. Run the distribution task:

   ```bash
   npm run distribute
   # or
   npm run dist
   ```

   This builds the project and packages the application into the `release/` directory using `electron-builder`.

3. To create an unpacked directory distribution (useful for quick testing):

   ```bash
   npm run distribute:dir
   # or
   npm run pack
   ```

   This creates an executable directory at `release/win-unpacked/`.

## Implementations

| Feature                | Dirty Parser | Basic Instructor |
| ---------------------- | ------------ | ---------------- |
| Writing a line         | ✅            | ✅                |
| Character Add          | ✅            | ✅                |
| Character Remove       | ✅            | ✅                |
| Character Change Sprite| ✅            | ✅                |
| Character Hide         | ✅            | ✅                |
| Character Show         | ✅            | ✅                |
| Character Move         | ✅            | ✅                |
| Character Place        | ✅            | ✅                |
| Jump Scenario          | ✅            | ✅                |
| Change Background      | ✅            | ✅                |
| Forking                | ✅            | ✅                |
| Sound                  | ✅            | ✅                |
| Ending game            | ✅            | ✅                |

## Future of this repo

Very slow progress will be made to get this fully functional to spec 0.07, feel free to contribute by taking a look at help wanted issues or for raising some discussions around this repo.

## Revisions

Originally created by Darkliahos on 22/09/21

Last edited by Darkliahos on 29/07/26
