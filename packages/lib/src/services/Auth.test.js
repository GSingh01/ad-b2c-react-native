import AuthService from "./Auth";
import fetchMock from "jest-fetch-mock";

const props = {
  tenant: "testtenant",
  appId: "testId",
  loginPolicy: "testloginPolicy",
  passwordResetPolicy: "testPasswordResetPolicy",
  profileEditPolicy: "testProfileEditPolicy",
  redirectURI: "test redirectURI",
  scope: "test scope",
  secureStore: {
    deleteItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
  },
};

const authService = new AuthService(props);

beforeEach(() => {
  fetchMock.resetMocks();
  jest.clearAllMocks();
});

//helpers
function getBaseURI(tenant) {
  return `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com`;
}

// private methods
const setTokenDataAsync = {
  setsTokenResult: {
    name: "sets token result correctly",
    test: async (
      fn,
      fetchCallsSofar = 0,
      authService,
      { tokenType, accessToken, idToken, refreshToken, expiresOn }
    ) => {
      if (fn) {
        await fn();
      }

      const {
        access,
        id,
        expiresOn: expiry,
      } = await authService.getTokensAsync();

      expect(access).toBe(`${tokenType} ${accessToken}`);
      expect(id).toBe(idToken);
      expect(expiry).toBe(expiresOn);
      expect(fetchMock).toHaveBeenCalledTimes(fetchCallsSofar);
    },
  },

  setsSecureStoreCorrectly: {
    name: "sets secure store correctly",
    test: async (
      fn,
      storeSetItemAsyncMock,
      { tokenType, accessToken, idToken, refreshToken, expiresOn }
    ) => {
      if (fn) {
        await fn();
      }

      expect(storeSetItemAsyncMock).toBeCalledTimes(5);
      expect(storeSetItemAsyncMock).toBeCalledWith("tokenType", tokenType);
      expect(storeSetItemAsyncMock).toBeCalledWith("accessToken", accessToken);
      expect(storeSetItemAsyncMock).toBeCalledWith("idToken", idToken);
      expect(storeSetItemAsyncMock).toBeCalledWith(
        "refreshToken",
        refreshToken
      );
      expect(storeSetItemAsyncMock).toBeCalledWith(
        "expiresOn",
        expiresOn.toString()
      );
    },
  },
};

const fetchAndSetTokenTests = {
  throwsOnEmptyAuthCode: {
    name: "throws when authcode is empty and grant is not refreshToken",
    test: async (fn, isForRefreshGrant, secureStoreSetItemAsyncMock) => {
      const msg = isForRefreshGrant
        ? "Empty refresh token or user not logged in"
        : "Empty auth code";
      await expect(fn()).rejects.toThrow(msg);
      expect(fetchMock).toBeCalledTimes(0);

      await setTokenDataAsync.setsTokenResult.test(null, 0, authService, {
        tokenType: "",
        accessToken: "",
        idToken: "",
        expiresOn: 0,
        refreshToken: "",
      });

      if (secureStoreSetItemAsyncMock) {
        await setTokenDataAsync.setsSecureStoreCorrectly.test(
          null,
          secureStoreSetItemAsyncMock,
          {
            tokenType: "",
            accessToken: "",
            idToken: "",
            expiresOn: 0,
            refreshToken: "",
          }
        );
      }
    },
  },

  callsFetchCorrectly: {
    name: "Calls fetch correctly",
    test: async (
      fn,
      { appId, scope, redirectURI, url, authCode, isRefreshTokenGrant },
      secureStoreSetItemAsyncMock
    ) => {
      const fetchResult = {
        token_type: "testTokenType",
        access_token: "accessToken",
        id_token: "testIdToken",
        refresh_token: "testRefreshToken",
        expires_on: Math.ceil(new Date().getTime() / 1000) + 100,
      };
      fetchMock.mockResponseOnce(JSON.stringify(fetchResult));

      let body = `client_id=${appId}&scope=${scope}&redirect_uri=${redirectURI}`;
      if (isRefreshTokenGrant) {
        body += "&grant_type=refresh_token";
        body += `&refresh_token=${authCode}`;
      } else {
        body += "&grant_type=authorization_code";
        body += `&code=${authCode}`;
      }

      await fn();

      expect(fetchMock).toBeCalledTimes(1);
      expect(fetchMock).toBeCalledWith(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
        body,
      });

      await setTokenDataAsync.setsTokenResult.test(null, 1, authService, {
        tokenType: fetchResult.token_type,
        accessToken: fetchResult.access_token,
        idToken: fetchResult.id_token,
        expiresOn: fetchResult.expires_on,
        refreshToken: fetchResult.refresh_token,
      });

      if (secureStoreSetItemAsyncMock) {
        await setTokenDataAsync.setsSecureStoreCorrectly.test(
          null,
          secureStoreSetItemAsyncMock,
          {
            tokenType: fetchResult.token_type,
            accessToken: fetchResult.access_token,
            idToken: fetchResult.id_token,
            expiresOn: fetchResult.expires_on,
            refreshToken: fetchResult.refresh_token,
          }
        );
      }
    },
  },

  throwsWhenFetchErrors: {
    name: "throws when fetch errors out",
    test: async (fn, secureStoreSetItemAsyncMock) => {
      const msg = "error occured";
      fetchMock.mockRejectedValueOnce(msg);

      await expect(fn()).rejects.toBe(msg);
      await setTokenDataAsync.setsTokenResult.test(null, 1, authService, {
        tokenType: "",
        accessToken: "",
        idToken: "",
        expiresOn: 0,
        refreshToken: "",
      });

      if (secureStoreSetItemAsyncMock) {
        await setTokenDataAsync.setsSecureStoreCorrectly.test(
          null,
          secureStoreSetItemAsyncMock,
          {
            tokenType: "",
            accessToken: "",
            idToken: "",
            expiresOn: 0,
            refreshToken: "",
          }
        );
      }
    },
  },

  throwsWhenNotOkResponse: {
    name: "throws when not ok response",
    test: async (fn, secureStoreSetItemAsyncMock) => {
      const msg = "Not ok response";
      fetchMock.mockResponseOnce(JSON.stringify({ error_description: msg }), {
        ok: false,
        status: 400,
      });

      await expect(fn()).rejects.toThrow(msg);

      await setTokenDataAsync.setsTokenResult.test(null, 1, authService, {
        tokenType: "",
        accessToken: "",
        idToken: "",
        expiresOn: 0,
        refreshToken: "",
      });

      if (secureStoreSetItemAsyncMock) {
        await setTokenDataAsync.setsSecureStoreCorrectly.test(
          null,
          secureStoreSetItemAsyncMock,
          {
            tokenType: "",
            accessToken: "",
            idToken: "",
            expiresOn: 0,
            refreshToken: "",
          }
        );
      }
    },
  },

  throwsWhenNotOkResponseWithoutErrorDescription: {
    name: "throws when not ok response without error_description field",
    test: async (fn, secureStoreSetItemAsyncMock) => {
      const msg = JSON.stringify({
        message: "Not ok response without error_description field",
      });
      fetchMock.mockResponseOnce(msg, {
        ok: false,
        status: 400,
      });

      await expect(fn()).rejects.toThrow(msg);

      await setTokenDataAsync.setsTokenResult.test(null, 1, authService, {
        tokenType: "",
        accessToken: "",
        idToken: "",
        expiresOn: 0,
        refreshToken: "",
      });

      if (secureStoreSetItemAsyncMock) {
        await setTokenDataAsync.setsSecureStoreCorrectly.test(
          null,
          secureStoreSetItemAsyncMock,
          {
            tokenType: "",
            accessToken: "",
            idToken: "",
            expiresOn: 0,
            refreshToken: "",
          }
        );
      }
    },
  },
  callsFetchOnlyOnceForMultipleParallelCalls: {
    name: "calls fetch only once for multiple parallel calls",
    test: async (fnCallingFetch) => {
      fetchMock.resetMocks();

      const fetchResult = {
        token_type: "testTokenType",
        access_token: "accessToken",
        id_token: "testIdToken",
        refresh_token: "testRefreshToken",
        expires_on: Math.ceil(new Date().getTime() / 1000) + 100,
      };
      fetchMock.mockResponseOnce(JSON.stringify(fetchResult));

      await Promise.all([fnCallingFetch(), fnCallingFetch(), fnCallingFetch()]);

      expect(fetchMock).toBeCalledTimes(1);
    },
  },
};

const getStaticURITests = {
  returnsCorrectURI: {
    name: "returns correct URI",
    test: async (
      fn,
      { policy, endPoint, tenant, appId, redirectURI, scope, state }
    ) => {
      const baseUri = getBaseURI(tenant);

      const res = await fn();

      let uri = `${baseUri}/${policy}/oauth2/v2.0/${endPoint}?`;
      if (endPoint === "authorize") {
        uri += `client_id=${appId}&response_type=code`;
        uri += `&redirect_uri=${encodeURI(redirectURI)}`;
        uri += "&response_mode=query";
        uri += `&scope=${encodeURI(scope)}`;
        uri += state ? `&state=${state}` : "";
      }

      expect(res).toBe(uri);
    },
  },
};

//public methods
describe("AuthService", () => {
  describe("loadFromStoreAsync", () => {
    test("when secureStore is not provided returns false", async () => {
      const { secureStore, ...rest } = props;
      const authService = new AuthService(rest);

      const res = await authService.loadFromStoreAsync();

      expect(res).toBe(false);
    });

    test("When secureStore provided calls it correctly", async () => {
      const mockResult = {
        tokenType: "tType",
        accessToken: "access",
        idToken: "id",
        refreshToken: "refresh",
        expiresOn: Math.ceil(new Date().getTime() / 1000) + 1000,
      };
      props.secureStore.getItemAsync.mockImplementation(async (key) => {
        switch (key) {
          case "tokenType":
            return mockResult.tokenType;
          case "accessToken":
            return mockResult.accessToken;
          case "idToken":
            return mockResult.idToken;
          case "refreshToken":
            return mockResult.refreshToken;
          case "expiresOn":
            return mockResult.expiresOn.toString();
          default:
            "invalid";
        }
      });

      const res = await authService.loadFromStoreAsync();

      expect(props.secureStore.getItemAsync).toBeCalledTimes(5);

      expect(props.secureStore.getItemAsync).toBeCalledWith("tokenType");
      expect(props.secureStore.getItemAsync).toBeCalledWith("accessToken");
      expect(props.secureStore.getItemAsync).toBeCalledWith("idToken");
      expect(props.secureStore.getItemAsync).toBeCalledWith("refreshToken");
      expect(props.secureStore.getItemAsync).toBeCalledWith("expiresOn");

      expect(res).toBe(true);
      expect(await authService.getTokensAsync()).toStrictEqual({
        access: `${mockResult.tokenType} ${mockResult.accessToken}`,
        id: mockResult.idToken,
        expiresOn: mockResult.expiresOn,
      });

      props.secureStore.getItemAsync.mockClear();
    });

    test("When secureStore has expired token returns false", async () => {
      const mockResult = {
        tokenType: "tType",
        accessToken: "access",
        idToken: "id",
        refreshToken: "refresh",
        expiresOn: Math.ceil(new Date().getTime() / 1000) - 1000,
      };
      props.secureStore.getItemAsync.mockImplementation(async (key) => {
        if (key === "expiresOn") {
          return mockResult.expiresOn.toString();
        }

        return "not mocked";
      });

      const res = await authService.loadFromStoreAsync();

      expect(res).toBe(false);
    });
  });

  describe("loginAsync", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    describe.each([
      { origin: "other", expectedPolicy: props.loginPolicy },
      { origin: "password", expectedPolicy: props.passwordResetPolicy },
      { origin: "edit", expectedPolicy: props.profileEditPolicy },
    ])("with origin $origin", ({ origin, expectedPolicy }) => {
      it(`${fetchAndSetTokenTests.throwsOnEmptyAuthCode.name}`, async () =>
        fetchAndSetTokenTests.throwsOnEmptyAuthCode.test(
          async () => {
            return authService.loginAsync("", origin);
          },
          false,
          props.secureStore.setItemAsync
        ));

      it(`${fetchAndSetTokenTests.callsFetchCorrectly.name}`, async () =>
        fetchAndSetTokenTests.callsFetchCorrectly.test(
          async () => {
            return authService.loginAsync("testAuthCode", origin);
          },
          {
            appId: props.appId,
            redirectURI: encodeURI(props.redirectURI),
            scope: encodeURI(props.scope),
            url: `https://${props.tenant}.b2clogin.com/${props.tenant}.onmicrosoft.com/${expectedPolicy}/oauth2/v2.0/token?`,
            authCode: "testAuthCode",
            isRefreshTokenGrant: false,
          },
          props.secureStore.setItemAsync
        ));

      it(`${fetchAndSetTokenTests.throwsWhenFetchErrors.name}`, async () =>
        fetchAndSetTokenTests.throwsWhenFetchErrors.test(async () => {
          return authService.loginAsync("testAuthCode", origin);
        }, props.secureStore.setItemAsync));

      it(`${fetchAndSetTokenTests.throwsWhenNotOkResponse.name}`, async () =>
        fetchAndSetTokenTests.throwsWhenNotOkResponse.test(async () => {
          return authService.loginAsync("testAuthCode", origin);
        }, props.secureStore.setItemAsync));

      it(`${fetchAndSetTokenTests.throwsWhenNotOkResponseWithoutErrorDescription.name}`, async () =>
        fetchAndSetTokenTests.throwsWhenNotOkResponseWithoutErrorDescription.test(
          async () => {
            return authService.loginAsync("testAuthCode", origin);
          },
          props.secureStore.setItemAsync
        ));

      it(`${fetchAndSetTokenTests.callsFetchOnlyOnceForMultipleParallelCalls.name}`, async () =>
        fetchAndSetTokenTests.callsFetchOnlyOnceForMultipleParallelCalls.test(
          async () => {
            return authService.loginAsync("testAuthCode", origin);
          }
        ));
    });
  });

  describe("getTokensAsync", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    describe("calls api when token is expired and refresh token is set", () => {
      const fetchResult = {
        token_type: "testTokenType",
        access_token: "accessToken",
        id_token: "testIdToken",
        refresh_token: "testRefreshToken",
        expires_on: Math.ceil(new Date().getTime() / 1000) - 100,
      };

      beforeEach(async () => {
        fetchMock.mockResponseOnce(JSON.stringify(fetchResult));

        await authService.loginAsync("testcode", "");

        fetchMock.resetMocks();
        props.secureStore.setItemAsync.mockClear();
      });

      it(`${fetchAndSetTokenTests.callsFetchCorrectly.name}`, async () => {
        await fetchAndSetTokenTests.callsFetchCorrectly.test(
          async () => {
            return authService.getTokensAsync();
          },
          {
            appId: props.appId,
            redirectURI: encodeURI(props.redirectURI),
            scope: encodeURI(props.scope),
            url: `https://${props.tenant}.b2clogin.com/${props.tenant}.onmicrosoft.com/${props.loginPolicy}/oauth2/v2.0/token?`,
            authCode: fetchResult.refresh_token,
            isRefreshTokenGrant: true,
          }
        );
      });

      it(`${fetchAndSetTokenTests.throwsWhenFetchErrors.name}`, async () =>
        fetchAndSetTokenTests.throwsWhenFetchErrors.test(async () => {
          return authService.getTokensAsync();
        }, props.secureStore.setItemAsync));

      it(`${fetchAndSetTokenTests.throwsWhenNotOkResponse.name}`, async () =>
        fetchAndSetTokenTests.throwsWhenNotOkResponse.test(async () => {
          return authService.getTokensAsync();
        }, props.secureStore.setItemAsync));

      it(`${fetchAndSetTokenTests.throwsWhenNotOkResponseWithoutErrorDescription.name}`, async () =>
        fetchAndSetTokenTests.throwsWhenNotOkResponseWithoutErrorDescription.test(
          async () => {
            return authService.getTokensAsync();
          },
          props.secureStore.setItemAsync
        ));

      it(`${fetchAndSetTokenTests.callsFetchOnlyOnceForMultipleParallelCalls.name}`, async () =>
        fetchAndSetTokenTests.callsFetchOnlyOnceForMultipleParallelCalls.test(
          async () => {
            return authService.getTokensAsync();
          }
        ));
    });

    it("returns cached tokens when refresh token is not set and token is expired", async () => {
      const fetchResult = {
        token_type: "testTokenType",
        access_token: "accessToken",
        id_token: "testIdToken",
        refresh_token: "",
        expires_on: Math.ceil(new Date().getTime() / 1000) - 100,
      };
      fetchMock.mockResponseOnce(JSON.stringify(fetchResult));

      const service = new AuthService(props);
      await service.loginAsync("testcode", "");
      fetchMock.mockClear();
      props.secureStore.setItemAsync.mockClear();

      const res = await service.getTokensAsync();

      expect(res.access).toBe(
        `${fetchResult.token_type} ${fetchResult.access_token}`
      );
      expect(res.expiresOn).toBe(fetchResult.expires_on);
      expect(res.id).toBe(fetchResult.id_token);
      expect(fetchMock).not.toBeCalled();
      expect(props.secureStore.setItemAsync).not.toBeCalled();
    });

    it("returns cached tokens when token is not expired", async () => {
      const fetchResult = {
        token_type: "testTokenType",
        access_token: "accessToken",
        id_token: "testIdToken",
        refresh_token: "testRefreshToken",
        expires_on: Math.ceil(new Date().getTime() / 1000) + 1000,
      };
      fetchMock.mockResponseOnce(JSON.stringify(fetchResult));

      const service = new AuthService(props);
      await service.loginAsync("testcode", "");
      fetchMock.mockClear();
      props.secureStore.setItemAsync.mockClear();

      const res = await service.getTokensAsync();

      expect(res.access).toBe(
        `${fetchResult.token_type} ${fetchResult.access_token}`
      );
      expect(res.expiresOn).toBe(fetchResult.expires_on);
      expect(res.id).toBe(fetchResult.id_token);
      expect(fetchMock).not.toBeCalled();
      expect(props.secureStore.setItemAsync).not.toBeCalled();
    });
  });

  describe("localLogOutAsync", () => {
    beforeEach(async () => {
      const fetchResult = {
        token_type: "testTokenType",
        access_token: "accessToken",
        id_token: "testIdToken",
        refresh_token: "testRefreshToken",
        expires_on: Math.ceil(new Date().getTime() / 1000) + 1000,
      };

      fetchMock.mockResponseOnce(JSON.stringify(fetchResult));

      await authService.loginAsync("testcode", "");

      await setTokenDataAsync.setsTokenResult.test(null, 1, authService, {
        tokenType: fetchResult.token_type,
        accessToken: fetchResult.access_token,
        idToken: fetchResult.id_token,
        refreshToken: fetchResult.refresh_token,
        expiresOn: fetchResult.expires_on,
      });

      fetchMock.resetMocks();
      props.secureStore.setItemAsync.mockClear();
    });

    test("clears token cache", async () => {
      await authService.localLogOutAsync();

      await setTokenDataAsync.setsTokenResult.test(null, 0, authService, {
        tokenType: "",
        accessToken: "",
        idToken: "",
        refreshToken: "",
        expiresOn: 0,
      });
    });

    test("calls secureStore.deleteItemAsync", async () => {
      await authService.localLogOutAsync();

      expect(props.secureStore.deleteItemAsync.mock.calls.length).toBe(5);
      expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith(
        "tokenType"
      );
      expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith(
        "accessToken"
      );
      expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith("idToken");
      expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith(
        "refreshToken"
      );
      expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith(
        "expiresOn"
      );
    });
  });

  describe("getLoginURI", () => {
    it(`${getStaticURITests.returnsCorrectURI.name}`, async () =>
      getStaticURITests.returnsCorrectURI.test(authService.getLoginURI, {
        policy: props.loginPolicy,
        endPoint: "authorize",
        tenant: props.tenant,
        appId: props.appId,
        redirectURI: props.redirectURI,
        scope: props.scope,
        state: "",
      }));
  });

  describe("getLogoutURI", () => {
    it("return correct URI", async () => {
      const res = await authService.getLogoutURI();

      expect(res).toBe(
        `${getBaseURI(props.tenant)}/${
          props.loginPolicy
        }/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURI(
          props.redirectURI
        )}`
      );
    });
  });

  describe("getPasswordResetURI", () => {
    it(`${getStaticURITests.returnsCorrectURI.name}`, async () =>
      getStaticURITests.returnsCorrectURI.test(
        authService.getPasswordResetURI,
        {
          policy: props.passwordResetPolicy,
          endPoint: "authorize",
          tenant: props.tenant,
          appId: props.appId,
          redirectURI: props.redirectURI,
          scope: props.scope,
          state: "password",
        }
      ));
  });

  describe("getProfileEditURI", () => {
    it(`${getStaticURITests.returnsCorrectURI.name}`, async () =>
      getStaticURITests.returnsCorrectURI.test(authService.getProfileEditURI, {
        policy: props.profileEditPolicy,
        endPoint: "authorize",
        tenant: props.tenant,
        appId: props.appId,
        redirectURI: props.redirectURI,
        scope: props.scope,
        state: "edit",
      }));
  });
});
