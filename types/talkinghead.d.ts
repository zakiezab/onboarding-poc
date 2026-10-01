// @met4citizen/talkinghead ships no type declarations (plain .mjs source).
// TalkingAvatar.tsx already treats the loaded module as `any` and verifies
// the real API by reading node_modules directly rather than guessing types,
// so this just satisfies the compiler's module-resolution check.
declare module '@met4citizen/talkinghead';

// Resolved at runtime via the browser import map in app/layout.tsx, not by
// the bundler (see the webpackIgnore comment in TalkingAvatar.tsx) — this
// only exists so `tsc` doesn't also try to resolve the bare specifier.
declare module 'talkinghead';
