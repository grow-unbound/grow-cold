import { z } from 'zod';
import type { ApiError } from './types';

export interface ApiRequestOptions<TBody> {
  baseUrl?: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  headers?: HeadersInit;
  getAccessToken?: () => Promise<string | null>;
  parseAs?: 'json' | 'text';
  signal?: AbortSignal;
  responseSchema?: z.ZodTypeAny;
}

export interface ApiSuccess<TData> {
  ok: true;
  status: number;
  data: TData;
}

export interface ApiFailure {
  ok: false;
  status: number;
  error: ApiError;
}

export type ApiResult<TData> = ApiSuccess<TData> | ApiFailure;

export interface ApiClientLogger {
  (event: 'request' | 'response' | 'error', detail: Record<string, unknown>): void;
}

export interface CreateApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
  log?: ApiClientLogger;
}

function buildUrl(baseUrl: string | undefined, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (!baseUrl) return path;

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function toApiError(code: string, message: string, details?: string): ApiError {
  return { code, message, details };
}

export async function apiRequest<TBody = unknown, TData = unknown>(
  options: ApiRequestOptions<TBody>,
): Promise<ApiResult<TData>> {
  const method = options.method ?? 'GET';
  const token = await options.getAccessToken?.();
  const requestHeaders = new Headers(options.headers);

  if (!requestHeaders.has('content-type') && options.body !== undefined) {
    requestHeaders.set('content-type', 'application/json');
  }
  if (token) requestHeaders.set('authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(options.baseUrl, options.path), {
    method,
    headers: requestHeaders,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  const rawResponse =
    options.parseAs === 'text' ? await response.text() : await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: toApiError(
        'REQUEST_FAILED',
        response.statusText || 'Request failed',
        typeof rawResponse === 'string' ? rawResponse : undefined,
      ),
    };
  }

  if (!options.responseSchema) {
    return {
      ok: true,
      status: response.status,
      data: rawResponse as TData,
    };
  }

  const parsed = options.responseSchema.safeParse(rawResponse);
  if (!parsed.success) {
    return {
      ok: false,
      status: response.status,
      error: toApiError('INVALID_RESPONSE', 'Response validation failed', parsed.error.issues[0]?.message),
    };
  }

  return {
    ok: true,
    status: response.status,
    data: parsed.data as TData,
  };
}

export function createApiClient(options: CreateApiClientOptions) {
  return {
    async request<TBody = unknown, TData = unknown>(
      requestOptions: Omit<ApiRequestOptions<TBody>, 'baseUrl' | 'getAccessToken'>,
    ): Promise<ApiResult<TData>> {
      options.log?.('request', {
        path: requestOptions.path,
        method: requestOptions.method ?? 'GET',
      });

      const result = await apiRequest<TBody, TData>({
        ...requestOptions,
        baseUrl: options.baseUrl,
        getAccessToken: options.getAccessToken,
      });

      if (result.ok) {
        options.log?.('response', {
          path: requestOptions.path,
          status: result.status,
        });
      } else {
        const errorResult = result as ApiFailure;
        options.log?.('error', {
          path: requestOptions.path,
          status: errorResult.status,
          code: errorResult.error.code,
        });
      }

      return result;
    },
  };
}
