import React from 'react';
import { WebView } from 'react-native-webview';
import adService from './ADService';
import { RequestType } from './Constants';

export default class LogoutView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onLoadEnd = this.onLoadEnd.bind(this);
    this.onError = this.onError.bind(this);
    this.onShouldStartLoadWithRequest = this.onShouldStartLoadWithRequest.bind(
      this,
    );

    this.webView = null;
    this.state = { uri: adService.getLogoutURI() };
  }

  onShouldStartLoadWithRequest = navState => {
    const result = adService.getLoginFlowResult(navState.url);
    if (result.requestType === RequestType.Ignore) {
      this.webView.stopLoading();
      return false;
    }

    return true;
  };

  async onLoadEnd() {
    await adService.logoutAsync();
    this.props.onSuccess();
  }

  onError(e) {
    this.props.onFail(e.description);
  }

  render() {
    const { renderLoading, ...rest } = this.props;
    return (
      <WebView
        {...rest}
        originWhitelist={['*']} // refer: https://github.com/facebook/react-native/issues/20917
        source={{ uri: this.state.uri }}
        onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
        renderLoading={renderLoading}
        startInLoadingState
        onLoadEnd={this.onLoadEnd}
        onError={this.onError}
        ref={c => {
          this.webView = c;
        }}
      />
    );
  }
}
