/* eslint-disable camelcase */
import { RequestType } from './Constants';
import Result from './Result';

class ADService {
  
  init = (props)=> {
    this.tenant = props.tenant;
    this.appId = props.appId;
    this.loginPolicy = props.loginPolicy;
    this.passwordResetPolicy = props.passwordResetPolicy;
    this.redirectURI = encodeURI(props.redirectURI);
    this.scope = encodeURI(`${this.appId} offline_access`);
    this.response_mode = 'query';
    this.tokenResult = {};
    this.secureStore = props.secureStore;
    this.baseUri = `https://${this.tenant}.b2clogin.com/${this.tenant}.onmicrosoft.com`;
    
    this.TokenTypeKey = "tokenType";
    this.AccessTokenKey ="accessToken";
    this.IdTokenKey = "idToken";
    this.RefreshTokenKey = "refreshToken";
    this.ExpiresOnKey = "expiresOn";
  };

  logoutAsync = async () => {
    this.tokenResult = {};
    await Promise.all([
      this.secureStore.deleteItemAsync(this.TokenTypeKey),
      this.secureStore.deleteItemAsync(this.AccessTokenKey),
      this.secureStore.deleteItemAsync(this.IdTokenKey),
      this.secureStore.deleteItemAsync(this.RefreshTokenKey),
      this.secureStore.deleteItemAsync(this.ExpiresOnKey),
    ]);
  };

  isAuthenticAsync = async () => {
    let [tokenType, accessToken, refreshToken, idToken, expiresOn] = await Promise.all([
      this.secureStore.getItemAsync(this.TokenTypeKey),
      this.secureStore.getItemAsync(this.AccessTokenKey),
      this.secureStore.getItemAsync(this.RefreshTokenKey),
      this.secureStore.getItemAsync(this.IdTokenKey),
      this.secureStore.getItemAsync(this.ExpiresOnKey)
    ]);

    this.tokenResult = {
      tokenType: tokenType,
      accessToken: accessToken,
      idToken: idToken,
      refreshToken: refreshToken,
      expiresOn: expiresOn,
    };
    
    return this._isTokenValid(this.tokenResult);
  };

  _isTokenValid = tokenResult =>
    tokenResult && new Date().getTime() < tokenResult.expiresOn;

  getAccessTokenAsync = async () => {
    if (!this._isTokenValid(this.tokenResult)) {
      const result = await this.fetchAndSetTokenAsync(
        this.tokenResult.refreshToken,
      );

      if (!result.isValid) {
        return result;
      }
    }
    
    return Result(
      true,
      `${this.tokenResult.tokenType} ${this.tokenResult.accessToken}`,
    );
  };

  fetchAndSetTokenAsync = async authCode => {
    if(!authCode){
      return Result(false, "Empty auth code");
    }
    try {
      const params = {
        grant_type: 'authorization_code',
        client_id: this.appId,
        scope: `${this.appId} offline_access`,
        code: authCode,
        redirect_uri: this.redirectURI,
      };
      const body = this.getFormUrlEncoded(params);
      const url = this._getStaticURI(this.loginPolicy, 'token');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(response.body);
      }
      
      await this._setTokenDataAsync(response);
      return Result(true);
    } catch (error) {
      return Result(false, error.message);
    }
  };

  _setTokenDataAsync = async response => {
    const res = await response.json();
    this.tokenResult = {
      tokenType: res.token_type,
      accessToken: res.access_token,
      idToken: res.id_token,
      refreshToken: res.refresh_token,
      expiresOn: res.expires_on,
    };

    await Promise.all(
      this.secureStore.setItemAsync(this.TokenTypeKey, res.token_type),
      this.secureStore.setItemAsync(this.AccessTokenKey, res.access_token),
      this.secureStore.setItemAsync(this.RefreshTokenKey, res.refresh_token),
      this.secureStore.setItemAsync(this.IdTokenKey, res.id_token),
      this.secureStore.setItemAsync(this.ExpiresOnKey, res.expires_on),
    );
  };
  
  getFormUrlEncoded = params =>
    Object.keys(params)
      .map(
        key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join('&');

  _getStaticURI = (policy, endPoint) => {
    let uri = `${this.baseUri}/${policy}/oauth2/v2.0/${endPoint}?`;
    if (endPoint === 'authorize') {
      uri += `client_id=${this.appId}&response_type=code`;
      uri += `&redirect_uri=${this.redirectURI}`;
      uri += '&response_mode=query';
      uri += `&scope=${this.scope}`;
    }
    return uri;
  };

  getLoginURI = () => this._getStaticURI(this.loginPolicy, 'authorize');

  getLogoutURI = () =>
    `${this.baseUri}/${this.loginPolicy}/oauth2/v2.0/logout?post_logout_redirect_uri=${this.redirectURI}`;

  getPasswordResetURI = () => `${this._getStaticURI(this.passwordResetPolicy, 'authorize')}`;

  getLoginFlowResult = url => {
    const params = this._getQueryParams(url);
    const { error_description, code } = params;

    let data = '';
    if (code) {
      data = code;
    } else {
      data = error_description;
    }

    return {
      requestType: this._getRequestType(url, params),
      data,
    };
  };

  _getRequestType = (
    url,
    { error_description, code, post_logout_redirect_uri },
  ) => {
    if (code) {
      return RequestType.Code;
    }

    if (post_logout_redirect_uri === this.redirectURI) {
      return RequestType.Logout;
    }
    if (error_description) {
      if (error_description.indexOf('AADB2C90118') !== -1) {
        return RequestType.PasswordReset;
      }

      if (error_description.indexOf('AADB2C90091') !== -1) {
        return RequestType.Cancelled;
      }
    }

    // always keep this check last
    if (url.indexOf(this.redirectURI) === 0) {
      return RequestType.Ignore;
    }

    return RequestType.Other;
  };

  _getQueryParams = url => {
    const regex = /[?&]([^=#]+)=([^&#]*)/g;
    const params = {};
    let match;
    while ((match = regex.exec(url))) {
      params[match[1]] = match[2];
    }
    return params;
  };

  // source: https://gist.github.com/nawariwairtasagsam/27ad2d34e77e0ce7dbc556d019da02c7
  base64Decode = string => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';

    let i = 0;
    do {
      const b1 = characters.indexOf(string.charAt(i++));
      const b2 = characters.indexOf(string.charAt(i++));
      const b3 = characters.indexOf(string.charAt(i++));
      const b4 = characters.indexOf(string.charAt(i++));

      const a = ((b1 & 0x3f) << 2) | ((b2 >> 4) & 0x3);
      const b = ((b2 & 0xf) << 4) | ((b3 >> 2) & 0xf);
      const c = ((b3 & 0x3) << 6) | (b4 & 0x3f);

      result +=
        String.fromCharCode(a) +
        (b ? String.fromCharCode(b) : '') +
        (c ? String.fromCharCode(c) : '');
    } while (i < string.length);

    return result;
  };
}

const adService = new ADService();
export default adService;
export {ADService};
