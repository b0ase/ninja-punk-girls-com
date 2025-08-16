# Dependency Analysis Report

## 1. Introduction

This report details the analysis of the project's dependencies. The goal of this analysis is to identify unused dependencies that can be removed to reduce the size of the `node_modules` directory, decrease build times, and improve security.

## 2. Methodology

The analysis was performed using the `depcheck` tool, which scans the project's code to identify which dependencies are being used.

## 3. `depcheck` Output

```
Unused dependencies
* @handcash/handcash-sdk
* @solana/wallet-adapter-base
* @solana/wallet-adapter-react
* @solana/wallet-adapter-react-ui
* @solana/wallet-adapter-wallets
* @solana/web3.js
* @tanstack/react-query
* @types/bitcoinjs-lib
* bitcoinjs-lib
* bsv
* is-node-process
* tiny-secp256k1
* viem
* wagmi
Unused devDependencies
* @types/react-dom
* autoprefixer
* depcheck
* eslint
* eslint-config-next
* pino-pretty
* postcss
* tailwindcss
* typescript
Missing dependencies
* jsr:@supabase/supabase-js: ./supabase/functions/handcash-auth/index.ts
* djwt: ./supabase/functions/handcash-auth/index.ts
* bidi-js: ./src/lib/shims/bidi-js.js
* webgl-sdf-generator: ./src/lib/shims/webgl-sdf-generator.js
* three-stdlib: ./src/components/Studio3DTab.tsx
* qrcode: ./src/app/api/generate-nft-image/route.ts
```

## 4. Analysis

*   **Unused Dependencies:** The list of unused dependencies is quite long and includes several packages related to cryptocurrencies (`@handcash`, `@solana`, `bitcoinjs-lib`, `bsv`, `viem`, `wagmi`). This strongly suggests that these are remnants from the original Python version of the project or from features that have been removed.
*   **Unused devDependencies:** The list of unused devDependencies includes some surprising items like `typescript`, `eslint`, and `tailwindcss`. This is likely because `depcheck` is not correctly identifying their usage in the project's configuration files. These will be ignored for now.
*   **Missing Dependencies:** The list of missing dependencies is also very important. These are packages that are being used in the code but are not listed in `package.json`. This can lead to build failures and other issues.

## 5. Recommendations

1.  **Install the missing dependencies:** The missing dependencies should be installed using `npm`.
2.  **Remove the unused dependencies:** The unused dependencies should be removed using `npm`.
