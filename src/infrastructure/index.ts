/**
 * Infrastructure - Content Provider Configuration
 *
 * This file configures which content provider Astra CMS uses.
 * By default, it uses local file-based storage (JSON files in /content).
 *
 * =============================================================================
 * SWITCHING TO FIREBASE (or other providers)
 * =============================================================================
 *
 * When you're ready for production, you'll need to:
 *
 * 1. Create a Firebase project at https://console.firebase.google.com
 *
 * 2. Copy .env.example to .env.local and fill in your Firebase credentials:
 *    NEXT_PUBLIC_FIREBASE_API_KEY=...
 *    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
 *    (etc.)
 *
 * 3. Create a Firebase content provider that implements ContentProvider interface
 *    See /src/core/content/provider.ts for the interface definition
 *    See /src/infrastructure/local/content-provider.ts for reference implementation
 *
 * 4. Update this file to use your Firebase provider:
 *
 *    import { firebaseContentProvider } from './firebase';
 *    setContentProvider(firebaseContentProvider);
 *
 * The ContentProvider interface ensures any backend can be used:
 * - Firebase Firestore
 * - Supabase
 * - PostgreSQL
 * - MongoDB
 * - Any other database
 *
 * =============================================================================
 */

import { setContentProvider, getContentProvider } from '@/core/content/provider';
import { setAuthProvider, getAuthProvider, isAuthEnabled } from '@/core/auth/provider';
import { registerHooks } from '@/core/hooks';
import { localContentProvider } from './local';
import config from '../../astra.config';

// -----------------------------------------------------------------------------
// CURRENT PROVIDER: Local (JSON files in /content directory)
// -----------------------------------------------------------------------------
// Content is stored in:
//   /content/pages/{locale}/{slug}.json  - Page data
//   /content/site.json                   - Site globals (header, footer)
//
// This works great for:
//   - Local development
//   - Trying out the CMS
//   - Simple sites that don't need real-time updates
// -----------------------------------------------------------------------------

setContentProvider(localContentProvider);

// Register lifecycle hooks (if configured in astra.config.ts)
if (config.hooks) {
  registerHooks(config.hooks);
}

// -----------------------------------------------------------------------------
// AUTH PROVIDER: None (open access for local dev)
// -----------------------------------------------------------------------------
// To enable authentication, create an AuthProvider and register it here:
//
//   import { myAuthProvider } from './my-auth';
//   setAuthProvider(myAuthProvider);
//
// An AuthProvider implements verifyRequest(request) which extracts and verifies
// a token/session from the request and returns a User with their role.
// See /src/core/auth/provider.ts for the interface definition.
//
// Example with custom JWT:
//
//   const jwtAuthProvider: AuthProvider = {
//     async verifyRequest(request) {
//       const token = request.headers.get('authorization')?.replace('Bearer ', '');
//       if (!token) return null;
//       const payload = await verifyJWT(token);
//       return { id: payload.sub, email: payload.email, role: payload.role, createdAt: new Date() };
//     },
//   };
//   setAuthProvider(jwtAuthProvider);
//
// When no auth provider is set, all admin routes are open (zero-config local dev).
// -----------------------------------------------------------------------------

export { getContentProvider };
export { setAuthProvider, getAuthProvider, isAuthEnabled };
