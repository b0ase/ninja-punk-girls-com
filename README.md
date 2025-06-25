# Ninja Punk Girls NFT Generator - Next.js Version

This is a Next.js implementation of the Ninja Punk Girls NFT generator, converted from the original Python-based application.

## Architecture Overview

### Original Python Architecture
The original Python application consisted of:
- `generator.py`: Main entry point
- `image_processor.py`: Image processing and layer management
- `html_utils.py`: HTML generation for the interface
- `japanese_names.py`: Random Japanese name generation
- `keypair_generator.py`: Wallet keypair management

### Next.js Architecture
The Next.js application is structured as follows:

```
next-app/
├── public/
│   ├── assets/            # NFT assets (same folder structure as Python)
│   └── ...
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Home page
│   │   ├── studio/        # NFT Studio page
│   │   └── layout.tsx     # Main layout
│   ├── components/        # React components
│   │   ├── NFTCanvas.tsx  # Main NFT image renderer
│   │   ├── StatsCard.tsx  # NFT stats display
│   │   └── ...
│   ├── hooks/             # React hooks
│   │   ├── useNFTGenerator.ts # NFT generation hook
│   │   └── useKeypair.ts  # Keypair management
│   ├── data/              # Static data
│   │   ├── layer-config.ts # Layer configuration
│   │   └── japanese-names.ts # Japanese names
│   └── types/             # TypeScript type definitions
│       └── index.ts       # Type definitions
└── ...
```

## Feature Mapping

| Python Feature | Next.js Implementation |
|----------------|------------------------|
| Layer compositing | Client-side compositing using `<Image>` components with absolute positioning |
| Random generation | `useNFTGenerator` hook with random layer selection |
| Stats calculation | Client-side calculation in `useNFTGenerator` hook |
| HTML interface | React components with TailwindCSS styling |
| Japanese name generation | Imported from `japanese-names.ts` |
| Keypair generation | Web3 integration via hooks |

## Implementation Strategy

1. **Data Layer**:
   - Convert Python data structures to TypeScript
   - Move static data to appropriate modules

2. **Business Logic**:
   - Move image processing to client-side hooks and utilities
   - Implement asset loading with Next.js optimizations

3. **UI Layer**:
   - Convert HTML templates to React components
   - Implement responsive design with TailwindCSS

4. **Web3 Integration**:
   - Implement keypair functionality using Web3 libraries
   - Add wallet connection features

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Asset Organization

Assets are organized in the `public/assets` directory using the same folder structure as the Python version:

- Character elements (BODY, FACE, HAIR, etc.)
- Background elements (BACK, SPECIAL-EFFECTS, etc.)
- Interface elements (INTERFACE, COPYRIGHT, etc.)

## License

Copyright © Ninja Punk Girls 2024
