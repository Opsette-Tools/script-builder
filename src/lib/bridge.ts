const TRUSTED_ORIGINS = ['https://opsette.io', 'http://localhost:8081'] as const;
const PROTOCOL_SOURCE = 'opsette';
const PROTOCOL_VERSION = 1;
const HANDSHAKE_TIMEOUT_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;

export interface InitItem {
  data_id: string;
  value: unknown;
}

export interface InitPayload {
  presets: Record<string, unknown>;
  items: InitItem[];
}

export interface Bridge {
  init: InitPayload;
  save: (data_id: string, value: unknown) => Promise<{ updated_at?: string }>;
  savePresets: (presets: Record<string, unknown>) => Promise<{ updated_at?: string }>;
  delete: (data_id: string) => Promise<void>;
  onTimeout: (handler: () => void) => () => void;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
  timeoutId: number;
}

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function isTrustedOrigin(origin: string): boolean {
  return (TRUSTED_ORIGINS as readonly string[]).includes(origin);
}

function isValidEnvelope(msg: unknown): msg is { source: string; version: number; type: string; [k: string]: unknown } {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  return m.source === PROTOCOL_SOURCE && m.version === PROTOCOL_VERSION && typeof m.type === 'string';
}

function postToAllowedOrigins(message: Record<string, unknown>): void {
  for (const origin of TRUSTED_ORIGINS) {
    try {
      window.parent.postMessage(message, origin);
    } catch {
      // Browser drops wrong-origin deliveries silently; ignore thrown errors.
    }
  }
}

export function connectBridge(): Promise<Bridge | null> {
  if (typeof window === 'undefined' || window.parent === window) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const pending = new Map<string, PendingRequest>();
    const timeoutHandlers = new Set<() => void>();
    let handshakeSettled = false;
    let handshakeTimeoutId: number;

    const handleMessage = (event: MessageEvent) => {
      if (!isTrustedOrigin(event.origin)) return;
      if (!isValidEnvelope(event.data)) return;

      const msg = event.data;

      if (!handshakeSettled && msg.type === 'init') {
        handshakeSettled = true;
        window.clearTimeout(handshakeTimeoutId);

        const presets = (msg.presets && typeof msg.presets === 'object')
          ? msg.presets as Record<string, unknown>
          : {};
        const items = Array.isArray(msg.items) ? msg.items as InitItem[] : [];

        resolve(buildBridge({ presets, items }, pending, timeoutHandlers));
        return;
      }

      if (!handshakeSettled) return;

      const requestId = typeof msg.request_id === 'string' ? msg.request_id : null;
      if (!requestId) return;

      const req = pending.get(requestId);
      if (!req) return;

      window.clearTimeout(req.timeoutId);
      pending.delete(requestId);

      if (msg.type === 'saved') {
        req.resolve({ updated_at: msg.updated_at });
      } else if (msg.type === 'presets_saved') {
        req.resolve({ updated_at: msg.updated_at });
      } else if (msg.type === 'deleted') {
        req.resolve(undefined);
      } else if (msg.type === 'error') {
        const message = typeof msg.message === 'string' ? msg.message : 'Unknown bridge error';
        req.reject(new Error(message));
      }
    };

    window.addEventListener('message', handleMessage);

    handshakeTimeoutId = window.setTimeout(() => {
      if (handshakeSettled) return;
      handshakeSettled = true;
      window.removeEventListener('message', handleMessage);
      resolve(null);
    }, HANDSHAKE_TIMEOUT_MS);

    postToAllowedOrigins({
      source: PROTOCOL_SOURCE,
      version: PROTOCOL_VERSION,
      type: 'ready',
    });
  });
}

function buildBridge(
  init: InitPayload,
  pending: Map<string, PendingRequest>,
  timeoutHandlers: Set<() => void>
): Bridge {
  const sendRequest = <T>(payload: Record<string, unknown>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const requestId = newRequestId();

      const timeoutId = window.setTimeout(() => {
        if (!pending.has(requestId)) return;
        pending.delete(requestId);
        timeoutHandlers.forEach(h => {
          try { h(); } catch {}
        });
        reject(new Error('Request timed out'));
      }, REQUEST_TIMEOUT_MS);

      pending.set(requestId, { resolve, reject, timeoutId });

      postToAllowedOrigins({
        source: PROTOCOL_SOURCE,
        version: PROTOCOL_VERSION,
        request_id: requestId,
        ...payload,
      });
    });
  };

  return {
    init,
    save: (data_id, value) => sendRequest({ type: 'save', data_id, value }),
    savePresets: (presets) => sendRequest({ type: 'save_presets', presets }),
    delete: (data_id) => sendRequest({ type: 'delete', data_id }),
    onTimeout: (handler) => {
      timeoutHandlers.add(handler);
      return () => { timeoutHandlers.delete(handler); };
    },
  };
}
