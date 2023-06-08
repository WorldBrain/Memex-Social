export function monkeyPatchGlobals() {
    // Webpack v5 removed node stdlib polyfilling, which included node globals like process.
    // One dep of a dep (react-markdown -> ... -> vfile) assumes `process.cwd` is defined and
    // my attempts at setting that via webpack (ProvidePlugin, DefinePlugin, aliases) failed.
    globalThis['process'] = {
        cwd: () => '/',
        env: { ...process.env }, // This should be defined via webpack's DefinePlugin
    } as any
}
