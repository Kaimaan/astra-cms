/**
 * Outbound Webhook Sender
 *
 * Delivers signed webhook payloads to configured endpoints.
 * Uses HMAC-SHA256 for payload signing (same pattern as GitHub/Stripe webhooks).
 * Errors are caught and logged — never thrown to callers.
 */

import { createHmac } from 'crypto';
import { generateId } from '@/core/content/types';

// =============================================================================
// TYPES
// =============================================================================

export interface WebhookEnvelope<T = unknown> {
  /** Unique event ID (for receiver-side idempotency) */
  id: string;
  /** Event type */
  event: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Source CMS instance */
  source: {
    siteUrl: string;
  };
  /** Event-specific payload */
  data: T;
}

// =============================================================================
// SIGNING
// =============================================================================

function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

// =============================================================================
// SENDER
// =============================================================================

/**
 * Send a signed webhook payload to a URL.
 * Returns true if delivery succeeded, false otherwise.
 * Never throws — errors are logged.
 */
export async function sendWebhook<T>(
  url: string,
  secret: string,
  event: string,
  data: T,
  siteUrl: string
): Promise<boolean> {
  const envelope: WebhookEnvelope<T> = {
    id: generateId('evt'),
    event,
    timestamp: new Date().toISOString(),
    source: { siteUrl },
    data,
  };

  const body = JSON.stringify(envelope);
  const signature = signPayload(secret, body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Astra-Signature': signature,
        'X-Astra-Event': event,
        'X-Astra-Delivery': envelope.id,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `[Astra Webhook] Failed to deliver ${envelope.id}: ${response.status} ${response.statusText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Astra Webhook] Error delivering ${envelope.id}:`, error);
    return false;
  }
}
