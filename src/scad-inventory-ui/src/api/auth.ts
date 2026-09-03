import { apiRequest } from './client'

export interface LoginUser {
  username: string
  warehouseCode: string
}

export interface LoginResponse {
  accessToken: string
  expiresAt: string
  user: LoginUser
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}
