export interface ApiErrorBody {
  code: string
  message: string
  errors?: Record<string, string[]>
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: Record<string, string[]>

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

interface ApiRequestOptions extends RequestInit {
  token?: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body) headers.set('Content-Type', 'application/json')
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })

  if (!response.ok) {
    let body: Partial<ApiErrorBody> = {}

    try {
      body = (await response.json()) as Partial<ApiErrorBody>
    } catch {
      // Empty authentication challenges and non-JSON proxy errors use the fallback below.
    }

    throw new ApiRequestError(
      response.status,
      body.code ?? 'REQUEST_FAILED',
      body.message ?? 'The request could not be completed.',
      body.errors,
    )
  }

  return (await response.json()) as T
}
