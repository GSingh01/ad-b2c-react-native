import React from 'react';
import { WebView } from 'react-native-webview';
import adService from './ADService';
import { RequestType } from './Constants';

export default class EditView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onError = this.onError.bind(this);
    this.onNavigationStateChangeAsync = this.onNavigationStateChangeAsync.bind(
      this,
    );
    this.onShouldStartLoadWithRequest = this.onShouldStartLoadWithRequest.bind(
      this,
    );

    this.webView = null;
    this.state = { uri: adService.getProfileEditURI() };
  }

  onShouldStartLoadWithRequest = navState => {
    const result = adService.getLoginFlowResult(navState.url);
    if (
      result.requestType === RequestType.Ignore ||
      result.requestType === RequestType.Code ||
      result.requestType === RequestType.Cancelled
    ) {
      this.webView.stopLoading();
      return false;
    }

    return true;
  };

  async onNavigationStateChangeAsync(navState) {
    const { url } = navState;
    const { uri: stateUri } = this.state;

    const result = adService.getLoginFlowResult(url);

    if (url.toLowerCase() !== stateUri.toLowerCase()) {
      await this._handleFlowResultAsync(result);
    }
  }

  async _handleFlowResultAsync(result) {
    if (result.requestType === RequestType.Cancelled) {
      this.props.onSuccess();
    }

    if (result.requestType === RequestType.Code) {
      const reqResult = await adService.fetchAndSetTokenAsync(
        result.data,
        adService.profileEditPolicy,
      );
      if (reqResult.isValid) {
        this.props.onSuccess();
      } else {
        this.props.onFail(reqResult.data);
      }
    }
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
        onNavigationStateChange={this.onNavigationStateChangeAsync}
        onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
        renderLoading={renderLoading}
        startInLoadingState
        onError={this.onError}
        ref={c => {
          this.webView = c;
        }}
      />
    );
  }
}
