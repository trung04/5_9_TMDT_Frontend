const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api";
const DEFAULT_NETWORK_ERROR_MESSAGE =
    "Khong the ket noi backend. Kiem tra VITE_API_BASE_URL va Laravel server.";

export interface ApiRequestOptions {
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
    token?: string | null;
    signal?: AbortSignal;
}

interface ApiErrorPayload {
    message?: string;
    errors?: Record<string, string[]>;
}

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]> | null;
    payload: unknown;

    constructor(status: number, message: string, errors?: Record<string, string[]>, payload?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors ?? null;
        this.payload = payload;
    }
}

export function isUnauthorizedApiError(error: unknown) {
    return error instanceof ApiError && error.status === 401;
}

export function getApiBaseUrl() {
    return (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

export function buildApiUrl(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
    const headers = new Headers(options.headers);

    if (options.body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (options.token) {
        headers.set("Authorization", `Bearer ${options.token}`);
    }

    let response: Response;

    try {
        response = await fetch(buildApiUrl(path), {
            method: options.method ?? "GET",
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: options.signal,
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
        }

        throw new ApiError(
            0,
            error instanceof Error && error.message
                ? `${DEFAULT_NETWORK_ERROR_MESSAGE} (${error.message})`
                : DEFAULT_NETWORK_ERROR_MESSAGE,
            undefined,
            error,
        );
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json().catch(() => null) : await response.text();

    if (!response.ok) {
        const errorPayload = (payload ?? {}) as ApiErrorPayload;

        throw new ApiError(
            response.status,
            errorPayload.message ?? response.statusText ?? "Request failed.",
            errorPayload.errors,
            payload,
        );
    }

    return payload as T;
}
