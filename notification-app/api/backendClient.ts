const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function buildHeaders() {
  if (!API_KEY) {
    return {};
  }

  return { 'x-api-key': API_KEY };
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  if (!API_BASE_URL) {
    return { ok: false, error: 'Missing EXPO_PUBLIC_API_BASE_URL.' };
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: text || 'Request failed.' };
  }

  const data = (await response.json().catch(() => ({}))) as T;
  return { ok: true, data };
}

export async function registerPushToken(payload: {
  token: string;
  deviceId: string;
  platform: string;
}) {
  return postJson<{ count: number }>('/tokens', payload);
}

export async function sendRemoteNotification(payload: {
  to: string;
  title: string;
  body: string;
  orderId?: string;
}) {
  return postJson<{ receipt: unknown }>('/notify', {
    ...payload,
    data: payload.orderId ? { orderId: payload.orderId } : undefined,
  });
}
