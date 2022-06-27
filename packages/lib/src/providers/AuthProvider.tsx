import React, { ReactNode, useRef, createContext, useState } from "react";

import * as WebBrowser from "expo-web-browser";
import { IAuth } from "../interfaces";
import AuthService, { Props as AuthServiceProps } from "../services/Auth";

const initialState: IAuth = {
  getTokensAsync: async () => ({ access: "", id: "", expiresOn: 0 }),
  logOutAsync: async () => ({} as WebBrowser.WebBrowserAuthSessionResult),
  editProfileAsync: async () => ({} as WebBrowser.WebBrowserAuthSessionResult),
  signInAsync: async () => ({} as WebBrowser.WebBrowserAuthSessionResult),
  resetPasswordAsync: async () =>
    ({} as WebBrowser.WebBrowserAuthSessionResult),
  handleRedirectAsync: async (code: string, state: string) =>
    ({} as WebBrowser.WebBrowserCompleteAuthSessionResult),
  isAuthentic: false,
};

export const AuthContext = createContext(initialState);

interface IAuthProviderProps extends AuthServiceProps {
  children: ReactNode;
  createNewTask?: boolean;
  showInRecents?: boolean;
  scope?: string;
}

class AuthNotInitError extends Error {
  constructor() {
    super("Auth service not initialized");
  }
}

const openAuthSessionAsync = async (
  url: string,
  redirectUri: string,
  showInRecents: boolean,
  createTask: boolean
) =>
  WebBrowser.openAuthSessionAsync(url, redirectUri, {
    showInRecents: showInRecents,
    createTask: createTask,
  });

export default function AuthProvider({
  children,
  showInRecents = false,
  createNewTask = false,
  ...rest
}: IAuthProviderProps) {
  const signinInProgress =
    useRef<null | Promise<WebBrowser.WebBrowserAuthSessionResult>>(null);

  const [isAuthentic, setIsAuthentic] = useState(false);

  const authServiceRef = useRef<AuthService>();
  if (!authServiceRef.current) {
    authServiceRef.current = new AuthService(rest);
  }

  const signInAsync = async () => {
    if (!signinInProgress.current) {
      signinInProgress.current = func();
    }

    return await signinInProgress.current.finally(
      () => (signinInProgress.current = null)
    );

    async function func() {
      if (!authServiceRef.current) {
        throw new AuthNotInitError();
      }

      const isValid = await authServiceRef.current.loadFromStoreAsync();

      if (isValid) {
        return {
          type: "success",
          url: "",
        } as WebBrowser.WebBrowserAuthSessionResult;
      }
      const loginUrl = authServiceRef.current.getLoginURI();
      return openAuthSessionAsync(
        loginUrl,
        rest.redirectURI,
        showInRecents,
        createNewTask
      );
    }
  };

  const getTokensAsync = async () => {
    if (!authServiceRef.current) {
      throw new AuthNotInitError();
    }

    try {
      const res = await authServiceRef.current.getTokensAsync();
      if (res.expiresOn === 0) {
        setIsAuthentic(false);
      }
      return res;
    } catch (ex: any) {
      setIsAuthentic(false);
      throw ex;
    }
  };

  const logOutAsync = async () => {
    if (!authServiceRef.current) {
      throw new AuthNotInitError();
    }
    try {
      await authServiceRef.current.localLogOutAsync();
      const res = await WebBrowser.openBrowserAsync(
        authServiceRef.current.getLogoutURI()
      );
      return res;
    } finally {
      setIsAuthentic(false);
    }
  };

  const editProfileAsync = async () => {
    if (!authServiceRef.current) {
      throw new AuthNotInitError();
    }
    const res = await openAuthSessionAsync(
      authServiceRef.current.getProfileEditURI(),
      rest.redirectURI,
      showInRecents,
      createNewTask
    );
    return res;
  };

  const resetPasswordAsync = async () => {
    if (!authServiceRef.current) {
      throw new AuthNotInitError();
    }

    const res = openAuthSessionAsync(
      authServiceRef.current.getPasswordResetURI(),
      rest.redirectURI,
      showInRecents,
      createNewTask
    );

    return res;
  };
  const handleRedirectAsync = async (authCode?: string, state?: string) => {
    if (!authServiceRef.current) {
      throw new AuthNotInitError();
    }
    const res = WebBrowser.maybeCompleteAuthSession();
    if (authCode) {
      await authServiceRef.current.loginAsync(authCode, state ?? "");
      setIsAuthentic(true);
    }

    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        getTokensAsync,
        logOutAsync,
        editProfileAsync,
        signInAsync,
        resetPasswordAsync,
        handleRedirectAsync,
        isAuthentic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
