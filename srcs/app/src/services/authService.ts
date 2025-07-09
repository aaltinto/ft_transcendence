export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
}

const API_BASE_URL = 'https://localhost:8443';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async getUserProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  },

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  },

  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  removeToken(): void {
    localStorage.removeItem('authToken');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
