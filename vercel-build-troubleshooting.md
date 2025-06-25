# Vercel Build Troubleshooting Log

This document logs the issues encountered during Vercel deployments for the NPG project and the steps taken to mitigate them.

## Initial Build Failures (Series of "Module not found" errors)

**Symptoms:**
- Local build would fail, and consequently, Vercel deployments also failed.
- Error messages indicated various modules could not be resolved (e.g., `@supabase/auth-helpers-nextjs`, `react-hot-toast`, `@mui/material`, `react-chartjs-2`, `chart.js`, `node-fetch`, `image-size`).

**Mitigation Steps:**
1.  **Iterative Dependency Installation:**
    -   Initially, missing dependencies were installed one by one or in small groups using `npm install <package-name>`.
    -   It was discovered that some `npm install` commands were unintentionally run in the root project directory (`npgpythongenerator`) instead of the Next.js project directory (`npgpythongenerator/next-app`).
    -   Ensured subsequent `npm install` commands were run from within the `next-app` directory.
2.  **Clean Installation of Dependencies:**
    -   Due to persistent "Module not found" errors even after targeted installs, it was suspected that `node_modules` or `package-lock.json` in the `next-app` directory were in an inconsistent state.
    -   Action: Deleted `next-app/node_modules` and `next-app/package-lock.json`.
    -   Action: Ran `npm install` from within the `next-app` directory to rebuild dependencies from scratch.
    -   **Outcome:** This resolved the local "Module not found" errors, and the local `npm run build` started completing successfully.

## Vercel Deployment Failure: "Maximum call stack size exceeded"

**Symptoms:**
-   After fixing local "Module not found" errors, the local build (`npm run build` in `next-app`) succeeded.
-   However, deployment to Vercel still failed with `Error: Command "next build" exited with 1`.
-   Vercel logs showed:
    -   Warnings:
        -   `Attempted import error: 'webgl-sdf-generator' does not contain a default export (imported as 'createSDFGenerator').` (from `troika-three-text` via `src/app/characters/page.tsx`)
        -   `Attempted import error: 'bidi-js' does not contain a default export (imported as 'bidiFactory').` (from `troika-three-text` via `src/app/characters/page.tsx`)
        -   Dynamic server usage warning for `api/handcash/connect/route.ts` due to `request.url`.
    -   Critical Error: `RangeError: Maximum call stack size exceeded` originating from `micromatch` (a Next.js dependency).

**Mitigation Steps & Investigation:**

1.  **Address Dynamic Server Usage Warning:**
    -   Identified that `next-app/src/app/api/handcash/connect/route.ts` was using `request.url`, making it dynamic.
    -   Action: Added `export const dynamic = 'force-dynamic';` to the top of this file to explicitly mark the route as dynamic.

2.  **Investigate `troika-three-text` Warnings / `RangeError`:**
    -   The `RangeError` in `micromatch` is often related to file system scanning issues (e.g., symlink loops, complex glob patterns, or issues in Next.js file discovery).
    -   The `troika-three-text` warnings were initially considered less critical but could be a contributing factor or mask other issues in the Vercel environment.
    -   **Hypothesis:** The complex components or their dependencies might be triggering the `micromatch` error during Vercel's build process.

3.  **Isolate Problematic Pages by Simplification:**
    -   **`next-app/src/app/studio/page.tsx`:**
        -   This page was identified as a potential source of earlier build errors ("Cannot redefine property: default", then JSX syntax errors locally).
        -   Action: The entire content of `studio/page.tsx` was replaced with a minimal placeholder component. This resolved local build errors related to this page.
    -   **`next-app/src/app/characters/page.tsx`:**
        -   This page was the source of the `troika-three-text` warnings (likely via its child component `CharacterPreview3D` which uses `@react-three/drei`'s `<Text>` component).
        -   Action: The entire content of `characters/page.tsx` was replaced with a minimal placeholder component. This eliminated the `troika-three-text` warnings from the local build.

**Current Status (after simplifying `studio` and `characters` pages):**
-   Local build (`npm run build` in `next-app`) completes successfully without the `troika-three-text` warnings.
-   The next step is to attempt another Vercel deployment to see if simplifying these two potentially complex pages has resolved the `RangeError: Maximum call stack size exceeded` in the Vercel environment.

## Further Potential Issues & Checks (If RangeError Persists on Vercel):

-   **`next.config.js` Review:**
    -   Current `next.config.js` includes `asyncWebAssembly: true` and `output: 'standalone'`. While seemingly okay, complex Webpack or output configurations can sometimes have subtle interactions. No immediate red flags were identified that directly point to `micromatch` issues.
-   **Symbolic Links:** Verify no symlinks within `next-app` are creating recursive file scanning paths.
-   **File/Directory Names:** Check for excessively long or unusually named files/folders.
-   **Vercel Project Settings:**
    -   Confirm "Root Directory" in Vercel settings is correctly pointing to `next-app` (or is blank if the Vercel project is linked from the `next-app` folder itself).
    -   The Vercel CLI error `The provided path "~/NPGClaude2/npgpythongenerator/next-app/next-app" does not exist` seen earlier suggests a potential path issue in how Vercel is locating the project or its build output. This needs to be double-checked in the Vercel project settings.
-   **Node.js Version on Vercel:** Ensure Vercel is using a compatible Node.js version (configurable in project settings).
-   **Incrementally Restore Pages:** If the Vercel build succeeds with the simplified pages, restore the original content of `studio/page.tsx` and `characters/page.tsx` incrementally, deploying after each significant addition, to pinpoint the exact part causing the `RangeError`. 