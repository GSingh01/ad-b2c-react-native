import React, { useContext, useEffect } from "react";
import { View } from "react-native";
import { render, waitFor } from "@testing-library/react-native";
import AuthProvider, { AuthContext } from "./AuthProvider";
import AuthService from "../services/Auth";
import * as WebBrowser from "expo-web-browser";

jest.mock("../services/Auth");
jest.mock("expo-web-browser");

describe("AuthProvider", () => {
  beforeEach(() => {
    AuthService.mockClear();
    WebBrowser.openAuthSessionAsync.mockClear();
  });

  const provider = ({ children }) => {
    return <AuthProvider>{children}</AuthProvider>;
  };

  describe("component", () => {
    it("initializes authService only once upon rerender", async () => {
      //render already wraps AuthProvider so not passing it in
      const { rerender } = render(<AuthProvider />);
      const render2 = rerender(<AuthProvider />);

      expect(AuthService).toBeCalledTimes(1);
    });

    it("renders the children", async () => {
      const { getByTestId, debug } = render(<View testID="elem">elem</View>);

      expect(getByTestId("elem")).toHaveTextContent("elem");
    });
  });

  describe("signInAsync", () => {
    it("calls loadFromStoreAsync", async () => {
      const Comp = () => {
        const { signInAsync } = useContext(AuthContext);
        useEffect(() => signInAsync());
        return <View>test</View>;
      };
      render(
        <AuthProvider>
          <Comp />
        </AuthProvider>
      );

      const authServiceInstance = AuthService.mock.instances[0];
      expect(authServiceInstance.loadFromStoreAsync).toBeCalledTimes(1);
    });

    it.each([
      { showInRecents: true, createNewTask: true },
      { showInRecents: true, createNewTask: false },
      { showInRecents: false, createNewTask: true },
    ])(
      "opens authSession with showRecents: $showInRecents & createNewTask: $createNewTask",
      async ({ showInRecents, createNewTask }) => {
        const loginUri = "protocol://loginUrl";
        let signInPromise = null;
        const Comp = () => {
          const { signInAsync } = useContext(AuthContext);
          useEffect(() => {
            const authServiceInstance = AuthService.mock.instances[0];
            authServiceInstance.loadFromStoreAsync.mockResolvedValueOnce(false);
            authServiceInstance.getLoginURI.mockReturnValueOnce(loginUri);

            signInPromise = signInAsync();
          });
          return <View>test</View>;
        };

        const redirectURI = "protocol://redirectUri";

        render(
          <AuthProvider
            redirectURI={redirectURI}
            showInRecents={showInRecents}
            createNewTask={createNewTask}
          >
            <Comp />
          </AuthProvider>
        );

        await signInPromise;

        expect(WebBrowser.openAuthSessionAsync).toBeCalledTimes(1);
        expect(WebBrowser.openAuthSessionAsync).toBeCalledWith(
          loginUri,
          redirectURI,
          {
            showInRecents,
            createTask: createNewTask,
          }
        );
      }
    );

    it("opens authSession once when parallel calls made", async () => {
      const loginUri = "protocol://loginUrl";
      let signInPromises = [];
      const Comp = () => {
        const { signInAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.loadFromStoreAsync.mockResolvedValueOnce(false);
          authServiceInstance.getLoginURI.mockReturnValueOnce(loginUri);

          signInPromises.push(signInAsync());
          signInPromises.push(signInAsync());
          signInPromises.push(signInAsync());
        }, []);
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await Promise.all(signInPromises);

      expect(WebBrowser.openAuthSessionAsync).toBeCalledTimes(1);
    });

    it("If user is cached then, openAuthSession is not called", async () => {
      const loginUri = "protocol://loginUrl";
      let signInPromise = null;
      const Comp = () => {
        const { signInAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.loadFromStoreAsync.mockResolvedValueOnce(true);
          authServiceInstance.getLoginURI.mockReturnValueOnce(loginUri);

          signInPromise = signInAsync();
        });
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await signInPromise;

      expect(WebBrowser.openAuthSessionAsync).not.toBeCalled();
    });
  });

  describe("getTokensAsync", () => {
    it("when token is valid, keeps isAuthentic to true  & returns authService.getTokenAsync result", async () => {
      const tokenRes = { access: "testAccess", id: "testId", expiresOn: 1 };

      let tokenResPromise;
      const Comp = () => {
        const { getTokensAsync, handleRedirectAsync, isAuthentic } =
          useContext(AuthContext);
        isAuthenticVal = isAuthentic;
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.getTokensAsync.mockReturnValueOnce(tokenRes);
          authServiceInstance.loginAsync.mockResolvedValueOnce();
          tokenResPromise = handleRedirectAsync("testAUthCode").then(() => {
            return getTokensAsync();
          });
        }, []);
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() => expect(tokenResPromise).resolves.toBe(tokenRes));
      const authServiceInstance = AuthService.mock.instances[0];
      expect(authServiceInstance.getTokensAsync).toBeCalledTimes(1);
      expect(isAuthenticVal).toBe(true);
    });

    it("when token is expired, sets isAuthentic to false  & returns authService.getTokenAsync result", async () => {
      const tokenRes = { access: "testAccess", id: "testId", expiresOn: 0 };

      let tokenResPromise;
      const Comp = () => {
        const { getTokensAsync, handleRedirectAsync, isAuthentic } =
          useContext(AuthContext);
        isAuthenticVal = isAuthentic;
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.getTokensAsync.mockReturnValueOnce(tokenRes);
          authServiceInstance.loginAsync.mockResolvedValueOnce();
          tokenResPromise = handleRedirectAsync("testAUthCode").then(() => {
            return getTokensAsync();
          });
        }, []);
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() => expect(tokenResPromise).resolves.toBe(tokenRes));
      const authServiceInstance = AuthService.mock.instances[0];
      expect(authServiceInstance.getTokensAsync).toBeCalledTimes(1);
      expect(isAuthenticVal).toBe(false);
    });

    it("when exception, throws & sets isAuthentic false", async () => {
      const tokenRes = { access: "testAccess", id: "testId", expiresOn: 1 };

      let tokenResPromise;
      let error = "test error";
      const Comp = () => {
        const { getTokensAsync, handleRedirectAsync, isAuthentic } =
          useContext(AuthContext);
        isAuthenticVal = isAuthentic;
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.getTokensAsync.mockImplementationOnce(() => {
            throw new Error(error);
          });
          authServiceInstance.loginAsync.mockResolvedValueOnce();
          tokenResPromise = handleRedirectAsync("testAUthCode").then(() => {
            return getTokensAsync();
          });
        }, []);
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() =>
        expect(tokenResPromise).rejects.toThrow(new Error(error))
      );
      const authServiceInstance = AuthService.mock.instances[0];
      expect(authServiceInstance.getTokensAsync).toBeCalledTimes(1);
      expect(isAuthenticVal).toBe(false);
    });
  });

  describe("logOutAsync", () => {
    beforeEach(() => {
      WebBrowser.openBrowserAsync.mockClear();
    });

    it("calls authService.localLogOutAsync & sets isAuthentic false", async () => {
      let logOutResPromise;
      const Comp = () => {
        const { logOutAsync, handleRedirectAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.localLogOutAsync.mockResolvedValueOnce();
          authServiceInstance.loginAsync.mockResolvedValueOnce();
          logOutResPromise = handleRedirectAsync("testAUthCode").then(() => {
            return logOutAsync();
          });
        }, []);
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() => logOutResPromise);
      const authServiceInstance = AuthService.mock.instances[0];
      expect(authServiceInstance.localLogOutAsync).toBeCalledTimes(1);
      expect(isAuthenticVal).toBe(false);
    });

    it("calls WebBrowser.OpenBrowserAsyn correctly & sets isAuthentic false & returns browser result", async () => {
      let logOutResPromise;
      const logoutUri = "testLogoutUri";
      const browserRes = "mockedBrowserResult";
      WebBrowser.openBrowserAsync.mockResolvedValueOnce(browserRes);
      const Comp = () => {
        const { logOutAsync, handleRedirectAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.localLogOutAsync.mockResolvedValueOnce();
          authServiceInstance.getLogoutURI.mockReturnValueOnce(logoutUri);
          authServiceInstance.loginAsync.mockResolvedValueOnce();
          logOutResPromise = handleRedirectAsync("testAuthCode").then(() => {
            return logOutAsync();
          });
        }, []);
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() => expect(logOutResPromise).resolves.toBe(browserRes));
      expect(WebBrowser.openBrowserAsync).toBeCalledTimes(1);
      expect(WebBrowser.openBrowserAsync).toBeCalledWith(logoutUri);
      expect(isAuthenticVal).toBe(false);
    });

    it("sets isAuthenticate to false even when exception occurs", async () => {
      let logOutResPromise;
      const logoutUri = "testLogoutUri";
      const error = "test Error";
      WebBrowser.openBrowserAsync.mockImplementationOnce(() => {
        throw new Error(error);
      });
      const Comp = () => {
        const { logOutAsync, handleRedirectAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.localLogOutAsync.mockResolvedValueOnce();
          authServiceInstance.getLogoutURI.mockReturnValueOnce(logoutUri);
          authServiceInstance.loginAsync.mockResolvedValueOnce();
          logOutResPromise = handleRedirectAsync("testAuthCode").then(() => {
            return logOutAsync();
          });
        }, []);
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() => expect(logOutResPromise).rejects.toThrowError(error));
      expect(WebBrowser.openBrowserAsync).toBeCalledTimes(1);
      expect(isAuthenticVal).toBe(false);
    });
  });

  describe("editProfileAsync", () => {
    it("calls openAuthSessionAsync correctly and returns its result", async () => {
      const authSessionRes = "testSessionResult";
      const editUri = "protocol://editUrl";
      let editPromise = null;
      const showInRecents = true;
      const createNewTask = true;

      WebBrowser.openAuthSessionAsync.mockReturnValueOnce(authSessionRes);
      const Comp = () => {
        const { editProfileAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.getProfileEditURI.mockReturnValueOnce(editUri);

          editPromise = editProfileAsync();
        });
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={showInRecents}
          createNewTask={createNewTask}
        >
          <Comp />
        </AuthProvider>
      );

      const res = await editPromise;

      expect(WebBrowser.openAuthSessionAsync).toBeCalledTimes(1);
      expect(WebBrowser.openAuthSessionAsync).toBeCalledWith(
        editUri,
        redirectURI,
        {
          showInRecents,
          createTask: createNewTask,
        }
      );
      expect(res).toBe(authSessionRes);
    });
  });

  describe("resetPasswordAsync", () => {
    it("calls openAuthSessionAsync correctly and returns its result", async () => {
      const authSessionRes = "testPassResetResult";
      const passwordResetUri = "protocol://passwordResetUrl";
      let resetPassPromise = null;
      const showInRecents = true;
      const createNewTask = true;

      WebBrowser.openAuthSessionAsync.mockReturnValueOnce(authSessionRes);
      const Comp = () => {
        const { resetPasswordAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.getPasswordResetURI.mockReturnValueOnce(
            passwordResetUri
          );

          resetPassPromise = resetPasswordAsync();
        });
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={showInRecents}
          createNewTask={createNewTask}
        >
          <Comp />
        </AuthProvider>
      );

      const res = await resetPassPromise;

      expect(WebBrowser.openAuthSessionAsync).toBeCalledTimes(1);
      expect(WebBrowser.openAuthSessionAsync).toBeCalledWith(
        passwordResetUri,
        redirectURI,
        {
          showInRecents,
          createTask: createNewTask,
        }
      );
      expect(res).toBe(authSessionRes);
    });
  });

  describe("handleRedirectAsync", () => {
    beforeEach(() => {
      WebBrowser.maybeCompleteAuthSession.mockClear();
    });

    it("calls WebBrowser.maybeCompleteAuthSession and returns its result", async () => {
      const browserRes = "authCompleteResult";
      WebBrowser.maybeCompleteAuthSession.mockReturnValueOnce(browserRes);
      let redirectRes = null;
      const Comp = () => {
        const { handleRedirectAsync } = useContext(AuthContext);
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.loginAsync.mockReturnValueOnce();
          redirectRes = handleRedirectAsync(null, null);
        });
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      const res = await redirectRes;

      expect(WebBrowser.maybeCompleteAuthSession).toBeCalledTimes(1);
      expect(res).toBe(browserRes);
    });

    it("calls authService.loginAsync with correct param when authcode provided", async () => {
      const browserRes = "authCompleteResult";
      WebBrowser.maybeCompleteAuthSession.mockReturnValueOnce(browserRes);
      let redirectRes = null;
      let isAuthenticVal = false;

      const authCode = "testAuthcode";
      const state = "testState";

      const Comp = () => {
        const { handleRedirectAsync, isAuthentic } = useContext(AuthContext);
        isAuthenticVal = isAuthentic;
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.loginAsync.mockClear();
          authServiceInstance.loginAsync.mockReturnValueOnce();
          redirectRes = handleRedirectAsync(authCode, state);
        });
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() => expect(redirectRes).resolves.toBe(browserRes));
      const authServiceInstance = AuthService.mock.instances[0];
      expect(authServiceInstance.loginAsync).toBeCalledTimes(1);
      expect(authServiceInstance.loginAsync).toBeCalledWith(authCode, state);
      expect(isAuthenticVal).toBe(true);
    });

    it("doesnot calls authService.loginAsync when no authcode", async () => {
      const browserRes = "authCompleteResult";
      WebBrowser.maybeCompleteAuthSession.mockReturnValueOnce(browserRes);
      let redirectRes = null;
      let isAuthenticVal = false;

      const authCode = null;
      const state = null;

      const Comp = () => {
        const { handleRedirectAsync, isAuthentic } = useContext(AuthContext);
        isAuthenticVal = isAuthentic;
        useEffect(() => {
          const authServiceInstance = AuthService.mock.instances[0];
          authServiceInstance.loginAsync.mockClear();
          authServiceInstance.loginAsync.mockReturnValueOnce();
          redirectRes = handleRedirectAsync(authCode, state);
        });
        return <View>test</View>;
      };

      const redirectURI = "protocol://redirectUri";

      render(
        <AuthProvider
          redirectURI={redirectURI}
          showInRecents={true}
          createNewTask={true}
        >
          <Comp />
        </AuthProvider>
      );

      await waitFor(() => expect(redirectRes).resolves.toBe(browserRes));
      const authServiceInstance = AuthService.mock.instances[0];
      expect(authServiceInstance.loginAsync).toBeCalledTimes(0);
      expect(isAuthenticVal).toBe(false);
    });
  });
});
