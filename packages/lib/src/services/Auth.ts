import { ISecureStore } from "../interfaces";

export interface Props {
  tenant: string;
  appId: string;
  loginPolicy: string;
  passwordResetPolicy: string;
  profileEditPolicy: string;
  redirectURI: string;
  scope?: string;
  secureStore?: ISecureStore;
}

interface IAuthFetchResponse {
  token_type: string;
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_on: number;
}
export default class Auth {
  responseMode = "query";
  baseUri: string;
  tenant: string;
  appId: string;
  loginPolicy: string;
  passwordResetPolicy: string;
  profileEditPolicy: string;
  scope: string;
  redirectURI: string;
  tokenResult: {
    accessToken: string;
    tokenType: string;
    idToken: string;
    refreshToken: string;
    expiresOn: number;
  };
  secureStore?: ISecureStore;
  TokenTypeKey: string;
  AccessTokenKey: string;
  IdTokenKey: string;
  RefreshTokenKey: string;
  ExpiresOnKey: string;
  fetchInstance: Promise<any> | null = null;
  origin: { [x: string]: string };

  constructor(props: Props) {
    this.tenant = props.tenant;
    this.appId = props.appId;
    this.loginPolicy = props.loginPolicy;
    this.passwordResetPolicy = props.passwordResetPolicy;
    this.profileEditPolicy = props.profileEditPolicy;
    this.redirectURI = encodeURI(props.redirectURI);
    this.scope = encodeURI(
      props.scope ? props.scope : `${this.appId} offline_access`
    );

    this.responseMode = "query";
    this.tokenResult = {
      accessToken: "",
      idToken: "",
      refreshToken: "",
      expiresOn: 0,
      tokenType: "bearer",
    };
    this.secureStore = props.secureStore;
    this.baseUri = `https://${this.tenant}.b2clogin.com/${this.tenant}.onmicrosoft.com`;

    this.TokenTypeKey = "tokenType";
    this.AccessTokenKey = "accessToken";
    this.IdTokenKey = "idToken";
    this.RefreshTokenKey = "refreshToken";
    this.ExpiresOnKey = "expiresOn";
    this.origin = {
      [this.passwordResetPolicy]: "password",
      [this.loginPolicy]: "",
      [this.profileEditPolicy]: "edit",
    };

    this.getLoginURI = this.getLoginURI.bind(this);
    this.getPasswordResetURI = this.getPasswordResetURI.bind(this);
    this.getProfileEditURI = this.getProfileEditURI.bind(this);
  }

  async loadFromStoreAsync(): Promise<boolean> {
    if (!this.secureStore) {
      return false;
    }
    const [tokenType, accessToken, refreshToken, idToken, expiresOn] =
      await Promise.all([
        this.secureStore.getItemAsync(this.TokenTypeKey),
        this.secureStore.getItemAsync(this.AccessTokenKey),
        this.secureStore.getItemAsync(this.RefreshTokenKey),
        this.secureStore.getItemAsync(this.IdTokenKey),
        this.secureStore.getItemAsync(this.ExpiresOnKey),
      ]);

    this.tokenResult = {
      tokenType,
      accessToken,
      idToken,
      refreshToken,
      expiresOn: parseInt(expiresOn),
    };

    return this.isTokenValid(this.tokenResult.expiresOn);
  }

  async loginAsync(code: string, origin: string) {
    return this.fetchAndSetTokenAsync(
      code,
      this.getPolicyByOrigin(origin),
      false
    );
  }

  async getTokensAsync() {
    if (
      !this.isTokenValid(this.tokenResult.expiresOn) &&
      this.tokenResult.refreshToken
    ) {
      await this.fetchAndSetTokenAsync(
        this.tokenResult.refreshToken,
        this.loginPolicy,
        true
      );
    }

    return {
      access: `${this.tokenResult.tokenType} ${this.tokenResult.accessToken}`,
      id: this.tokenResult.idToken,
      expiresOn: this.tokenResult.expiresOn,
    };
  }

  async localLogOutAsync() {
    this.tokenResult = {
      accessToken: "",
      idToken: "",
      refreshToken: "",
      expiresOn: 0,
      tokenType: "",
    };
    if (this.secureStore) {
      await Promise.all([
        this.secureStore.deleteItemAsync(this.TokenTypeKey),
        this.secureStore.deleteItemAsync(this.AccessTokenKey),
        this.secureStore.deleteItemAsync(this.IdTokenKey),
        this.secureStore.deleteItemAsync(this.RefreshTokenKey),
        this.secureStore.deleteItemAsync(this.ExpiresOnKey),
      ]);
    }
  }

  getLoginURI() {
    return this.getStaticURI(this.loginPolicy, "authorize");
  }

  getLogoutURI() {
    return `${this.baseUri}/${this.loginPolicy}/oauth2/v2.0/logout?post_logout_redirect_uri=${this.redirectURI}`;
  }

  getPasswordResetURI() {
    return `${this.getStaticURI(this.passwordResetPolicy, "authorize")}`;
  }

  getProfileEditURI() {
    return `${this.getStaticURI(this.profileEditPolicy, "authorize")}`;
  }

  //Helpers

  private getStaticURI(policy: string, endPoint: string) {
    let uri = `${this.baseUri}/${policy}/oauth2/v2.0/${endPoint}?`;
    if (endPoint === "authorize") {
      uri += `client_id=${this.appId}&response_type=code`;
      uri += `&redirect_uri=${this.redirectURI}`;
      uri += "&response_mode=query";
      uri += `&scope=${this.scope}`;
      uri += this.origin[policy] ? `&state=${this.origin[policy]}` : "";
    }
    return uri;
  }

  private isTokenValid(expiry: number): boolean {
    if (!expiry) {
      return false;
    }
    return new Date().getTime() <= expiry * 1000;
  }

  private getPolicyByOrigin(state: string) {
    switch (state) {
      case this.origin[this.passwordResetPolicy]:
        return this.passwordResetPolicy;
      case this.origin[this.profileEditPolicy]:
        return this.profileEditPolicy;
      default:
        return this.loginPolicy;
    }
  }
  private async fetchAndSetTokenAsync(
    code: string,
    policy: string,
    isRefreshTokenGrant: boolean
  ) {
    if (!this.fetchInstance) {
      this.fetchInstance = func(
        this.appId,
        this.scope,
        this.redirectURI,
        this.getStaticURI(policy, "token"),
        code
      );
    }

    try {
      const res = (await this.fetchInstance) as unknown as IAuthFetchResponse;

      await this.setTokenDataAsync({
        tokenType: res.token_type,
        accessToken: res.access_token,
        idToken: res.id_token,
        refreshToken: res.refresh_token,
        expiresOn: res.expires_on,
      });
    } catch (ex: any) {
      await this.setTokenDataAsync({
        tokenType: "",
        accessToken: "",
        idToken: "",
        refreshToken: "",
        expiresOn: 0,
      });
      throw ex;
    } finally {
      this.fetchInstance = null;
    }

    async function func(
      appId: string,
      scope: string,
      redirectURI: string,
      url: string,
      authCode: string
    ) {
      if (!authCode) {
        throw new Error(
          `Empty ${
            isRefreshTokenGrant
              ? "refresh token or user not logged in"
              : "auth code"
          }`
        );
      }

      let body = `client_id=${appId}&scope=${scope}&redirect_uri=${redirectURI}`;

      if (isRefreshTokenGrant) {
        body += "&grant_type=refresh_token";
        body += `&refresh_token=${authCode}`;
      } else {
        body += "&grant_type=authorization_code";
        body += `&code=${authCode}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
        body,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error_description ?? JSON.stringify(data));
      }

      return data;
    }
  }

  private async setTokenDataAsync({
    tokenType,
    accessToken,
    idToken,
    refreshToken,
    expiresOn,
  }: typeof this.tokenResult) {
    this.tokenResult = {
      tokenType,
      accessToken,
      idToken,
      refreshToken,
      expiresOn,
    };

    if (this.secureStore) {
      await Promise.all([
        this.secureStore.setItemAsync(this.TokenTypeKey, tokenType),
        this.secureStore.setItemAsync(this.AccessTokenKey, accessToken),
        this.secureStore.setItemAsync(this.RefreshTokenKey, refreshToken),
        this.secureStore.setItemAsync(this.IdTokenKey, idToken),
        this.secureStore.setItemAsync(this.ExpiresOnKey, expiresOn.toString()),
      ]);
    }
  }
}
