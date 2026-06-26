const API_BASE_URL_KEY = "buddy_api_base_url";
const TOKEN_KEY = "buddy_token";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";

type HttpMethod = "GET" | "POST";

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function getApiBaseUrl(): string {
  return wx.getStorageSync(API_BASE_URL_KEY) || DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(baseUrl: string): void {
  wx.setStorageSync(API_BASE_URL_KEY, baseUrl.trim() || DEFAULT_API_BASE_URL);
}

export function getToken(): string {
  return wx.getStorageSync(TOKEN_KEY) || "";
}

export function setToken(token: string): void {
  wx.setStorageSync(TOKEN_KEY, token);
}

export function clearToken(): void {
  wx.removeStorageSync(TOKEN_KEY);
}

export function request<T>(method: HttpMethod, path: string, data?: unknown): Promise<T> {
  const token = getToken();

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}${path}`,
      method,
      data,
      header: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {},
      success(response) {
        const body = response.data as ApiResult<T> | undefined;
        if (response.statusCode >= 400 || !body || !body.ok) {
          const message = body && !body.ok ? body.error.message : `HTTP ${response.statusCode}`;
          reject(new Error(message));
          return;
        }

        resolve(body.data);
      },
      fail(error) {
        reject(new Error(error.errMsg));
      }
    });
  });
}

export async function devLogin() {
  const data = await request<{ token: string }>("POST", "/auth/dev-login", {
    devOpenId: "miniprogram-local-dev",
    nickname: "Mini Debugger"
  });
  setToken(data.token);
  return data;
}
