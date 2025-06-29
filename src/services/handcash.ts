import { HandCashConnect, Environments } from '@handcash/handcash-connect';

const appId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const appSecret = process.env.HANDCASH_APP_SECRET;

if (!appId) {
  console.warn('Missing NEXT_PUBLIC_HANDCASH_APP_ID environment variable');
  // Use a placeholder to prevent build errors
  // throw new Error('Missing NEXT_PUBLIC_HANDCASH_APP_ID environment variable');
}
// App Secret IS required by the Connect instance for getAccountFromAuthToken
if (!appSecret) {
   console.warn('Missing HANDCASH_APP_SECRET environment variable');
   // Use a placeholder to prevent build errors
   // throw new Error('Missing HANDCASH_APP_SECRET environment variable');
}

// <<< Add debug log here >>>
console.log(`[Debug] Reading HANDCASH_ENVIRONMENT: ${process.env.HANDCASH_ENVIRONMENT}`); 

// Determine the correct environment object from the SDK's Environments export
// Default to production environment instead of IAE
const envString = process.env.HANDCASH_ENVIRONMENT;
const environment = envString === 'iae'
  ? Environments.iae // Use IAE only if explicitly set
  : Environments.prod;  // Default to production environment

// Initialize HandCashConnect
const handCashConnect = new HandCashConnect({
  appId: appId || 'placeholder-app-id',
  // Pass appSecret - it seems to be required for getAccountFromAuthToken
  appSecret: appSecret || 'placeholder-app-secret', 
  env: environment // Pass the environment object
});

console.log(`HandCash Service Initialized for Env: ${envString === 'iae' ? 'IAE' : 'Production'}`);

export { handCashConnect };

// Optional: Export types or interfaces if needed later
// export type { HandCashConnect }; 