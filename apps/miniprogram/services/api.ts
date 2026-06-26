const TOKEN_KEY = "buddy_token";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
const REQUEST_TIMEOUT_MS = 10000;

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
  return DEFAULT_API_BASE_URL;
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
  const url = `${getApiBaseUrl()}${path}`;

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      timeout: REQUEST_TIMEOUT_MS,
      header: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success(response) {
        const body = response.data as ApiResult<T> | undefined;
        if (response.statusCode >= 400 || !body || !body.ok) {
          const message = body && !body.ok ? body.error.message : "网络开小差了，请稍后再试。";
          reject(new Error(message));
          return;
        }

        resolve(body.data);
      },
      fail(error: WechatMiniprogram.GeneralCallbackResult) {
        reject(new Error(`无法连接服务器，请检查网络后重试。${url} ${error.errMsg}`));
      }
    });
  });
}
