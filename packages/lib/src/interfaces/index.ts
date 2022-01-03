import * as WebBrowser from "expo-web-browser";

export interface ISecureStore {
  deleteItemAsync: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string>;
  setItemAsync: (key: string, data: string) => Promise<void>;
}

export interface IAuth {
  getTokensAsync: () => Promise<{
    access: string;
    id: string;
    expiresOn: number;
  }>;
  logOutAsync: () => Promise<WebBrowser.WebBrowserAuthSessionResult>;
  editProfileAsync: () => Promise<WebBrowser.WebBrowserAuthSessionResult>;
  signInAsync: () => Promise<WebBrowser.WebBrowserAuthSessionResult>;
  resetPasswordAsync: () => Promise<WebBrowser.WebBrowserAuthSessionResult>;
  handleRedirectAsync: (
    code: string,
    state: string
  ) => Promise<WebBrowser.WebBrowserCompleteAuthSessionResult>;
  isAuthentic: boolean;
}
