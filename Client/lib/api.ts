export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiFieldError[];
}

/** Error thrown for any non-2xx API response. `code` matches the backend error codes. */
export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: ApiFieldError[];

  constructor(status: number, error: ApiErrorBody) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiEnvelope<T, M> {
  success: boolean;
  data?: T;
  meta?: M;
  error?: ApiErrorBody;
}

async function fetchEnvelope<T, M>(
  path: string,
  init: RequestInit = {}
): Promise<{ data: T; meta?: M }> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...init,
  });

  const body = (await res
    .json()
    .catch(() => null)) as ApiEnvelope<T, M> | null;

  if (!res.ok || !body?.success) {
    throw new ApiRequestError(
      res.status,
      body?.error ?? {
        code: "UNKNOWN_ERROR",
        message: "Something went wrong. Please try again.",
      }
    );
  }

  return { data: body.data as T, meta: body.meta };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await fetchEnvelope<T, never>(path, init);
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getWithMeta: <T, M = Record<string, unknown>>(path: string) =>
    fetchEnvelope<T, M>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
