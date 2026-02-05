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
import { localContentProvider } from './local';

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

export { getContentProvider };
