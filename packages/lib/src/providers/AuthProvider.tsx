import React, {
  ReactNode,
  useRef,
  createContext,
  useEffect,
  useState,
} from "react";

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
  handleRedirectAsync: async (code: string) =>
    ({} as WebBrowser.WebBrowserCompleteAuthSessionResult),
  isAuthentic: false,
};

export const AuthContext = createContext(initialState);

interface IAuthProviderProps extends AuthServiceProps {
  children: ReactNode;
  loadingElement: React.ReactElement;
}

class AuthNotInitError extends Error {
  constructor() {
    super("Auth service not initialized");
  }
}

export default function AuthProvider({
  children,
  loadingElement,
  ...rest
}: IAuthProviderProps) {
  const signinInProgress =
    useRef<null | Promise<WebBrowser.WebBrowserAuthSessionResult>>(null);

  const authServiceRef = useRef<AuthService>();
  useEffect(() => {
    authServiceRef.current = new AuthService(rest);
  }, []);

  const [isAuthentic, setIsAuthentic] = useState(false);

  const signInAsync = async () => {
    if (!signinInProgress.current) {
      signinInProgress.current = func();
    }

    const res = await signinInProgress.current;
    signinInProgress.current = null;
    return res;

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

      return WebBrowser.openAuthSessionAsync(
        authServiceRef.current.getLoginURI(),
        rest.redirectURI,
        {
          showInRecents: true,
        }
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
    const res = await WebBrowser.openAuthSessionAsync(
      authServiceRef.current.getProfileEditURI(),
      rest.redirectURI
    );
    return res;
  };

  const resetPasswordAsync = async () => {
    if (!authServiceRef.current) {
      throw new AuthNotInitError();
    }

    const res = WebBrowser.openAuthSessionAsync(
      authServiceRef.current.getPasswordResetURI(),
      rest.redirectURI
    );

    return res;
  };
  const handleRedirectAsync = async (authCode?: string) => {
    if (!authServiceRef.current) {
      throw new AuthNotInitError();
    }

    const res = WebBrowser.maybeCompleteAuthSession();
    if (authCode) {
      await authServiceRef.current.loginAsync(authCode);
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
