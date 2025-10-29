import { BaseApiClient, ApiResponse } from './api-client';

interface User {
  id: string;
  email: string;
  displayName: string;
}

class AuthApi extends BaseApiClient {
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.post('/login', { email, password });
  }

  async register(email: string, password: string, displayName: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.post('/register', { email, password, displayName });
  }

  async updateProfile(displayName: string): Promise<ApiResponse<User>> {
    return this.put('/profile', { displayName });
  }
}

export const authApi = new AuthApi();
