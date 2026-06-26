import { request, setToken } from "./api";

interface PhoneLoginResponse {
  token: string;
  nextAction: "enter_game" | "complete_profile";
  playerComplete: boolean;
}

export async function loginWithWechatPhone(phoneCode?: string): Promise<PhoneLoginResponse> {
  const data = await request<PhoneLoginResponse>("POST", "/auth/wechat-phone", {
    phoneCode: phoneCode || "mock-phone-code-13800138000",
    nickname: "竹林斗士"
  });
  setToken(data.token);
  return data;
}
