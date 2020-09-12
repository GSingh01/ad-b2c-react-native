import React from "react";
import { Text } from "react-native";
import { shallow } from "enzyme";
import toJson from "enzyme-to-json";
import LoginView from "../src/LoginView";
import adService from "../src/ADService";

describe("LoginView", () => {
  const props = {
    appId: "testAppId",
    redirectURI: "test//redirectURI",
    tenant: "TestTenant",
    loginPolicy: "testLoginPolicy",
    passwordResetPolicy: "testPasswordReset",
    profileEditPolicy: "testProfileId",
    onSuccess: jest.fn(),
    onFail: jest.fn(),
    secureStore: jest.fn(),
    renderLoading: () => <Text>loading</Text>,
  };

  test("renders correctly when loading", () => {
    const wrapper = shallow(<LoginView {...props} />);

    expect(toJson(wrapper)).toMatchSnapshot();
  });

  test("renders correctly when loaded", async () => {
    const wrapper = shallow(<LoginView {...props} />);

    //forced the set state since cant await on async componentDidMount
    wrapper.instance().setState({ loaded: true });

    expect(toJson(wrapper)).toMatchSnapshot();
  });

  test("Calls adService.init correctly", async () => {
    adService.init = jest.fn();

    const wrapper = shallow(<LoginView {...props} />);

    expect(adService.init).toHaveBeenCalledTimes(1);
    expect(adService.init).toHaveBeenCalledWith(props);
  });

  describe("componentDidMount", () => {
    test("calls adService.isAuthenticAsync", async () => {
      adService.isAuthenticAsync = jest.fn();
      adService.isAuthenticAsync.mockResolvedValue();

      const wrapper = shallow(<LoginView {...props} />);

      adService.isAuthenticAsync.mockClear();
      await wrapper.instance().componentDidMount();

      expect(adService.isAuthenticAsync).toHaveBeenCalledTimes(1);
    });

    test("calls props.Success and loaded state is false when isAuthenticAsync returns true", async () => {
      adService.isAuthenticAsync = jest.fn();
      adService.isAuthenticAsync.mockResolvedValue(true);

      const wrapper = shallow(<LoginView {...props} />);
      const instance = wrapper.instance();

      await instance.componentDidMount();
      props.onSuccess.mockClear(); // had to do a fake run and mockclear due to async componentdid mount

      jest.spyOn(instance, "setState");

      await instance.componentDidMount();

      expect(props.onSuccess).toHaveBeenCalledTimes(1);
      expect(instance.setState).not.toHaveBeenCalled();
    });

    test("donot calls props.onSuccess when isAuthenticAsync returns false and sets loaded state to true;", async () => {
      adService.isAuthenticAsync = jest.fn();
      adService.isAuthenticAsync.mockResolvedValue(false);

      const wrapper = shallow(<LoginView {...props} />);
      const instance = wrapper.instance();

      await instance.componentDidMount();
      props.onSuccess.mockClear(); // had to do a fake run and mockclear due to async componentdid mount

      jest.spyOn(instance, "setState");

      await instance.componentDidMount();

      expect(props.onSuccess).not.toHaveBeenCalled();
      expect(instance.setState).toHaveBeenCalledTimes(1);
      expect(instance.setState).toHaveBeenCalledWith({ loaded: true });
    });

    test("sets loaded state", async () => {
      adService.isAuthenticAsync = jest.fn();
      adService.isAuthenticAsync.mockResolvedValue();

      const wrapper = shallow(<LoginView {...props} />);

      adService.isAuthenticAsync.mockClear();
      const instance = wrapper.instance();

      await instance.componentDidMount();

      expect(instance.state.loaded).toBe(true);
    });
  });

  describe("onNavigationStateChangeAsync", () => {
    test("When navState.loading is true doesnot calls getLoginFlowResult and _handleFlowResultAsync", async () => {
      adService.getLoginFlowResult = jest.fn();
      adService.getLoginFlowResult.mockResolvedValue({ requestType: "Other" });
      const wrapper = shallow(<LoginView {...props} />);

      const url = "testUrl";
      const instance = wrapper.instance();
      jest.spyOn(instance, "_handleFlowResultAsync");

      await instance.onNavigationStateChangeAsync({ url, loading: true });

      expect(adService.getLoginFlowResult).not.toHaveBeenCalled();
      expect(instance._handleFlowResultAsync).not.toHaveBeenCalled();
    });

    test("calls getLoginFlowResult correctly", async () => {
      adService.getLoginFlowResult = jest.fn();
      adService.getLoginFlowResult.mockResolvedValue({ requestType: "Other" });
      const wrapper = shallow(<LoginView {...props} />);

      const url = "testUrl";
      await wrapper.instance().onNavigationStateChangeAsync({ url });

      expect(adService.getLoginFlowResult).toHaveBeenCalledTimes(1);
      expect(adService.getLoginFlowResult).toHaveBeenCalledWith(url);
    });

    test("doesnot calls _handleFlowResultAsync when state.url is same as navstate.uri", async () => {
      adService.getLoginFlowResult = jest.fn();

      const wrapper = shallow(<LoginView {...props} />);
      const instance = wrapper.instance();
      jest.spyOn(instance, "_handleFlowResultAsync");
      const uri = "testUri";

      instance.state.uri = uri;
      await instance.onNavigationStateChangeAsync({ url: uri });

      expect(instance._handleFlowResultAsync).not.toHaveBeenCalled();
    });

    const wrapper = shallow(<LoginView {...props} />);
    const instance = wrapper.instance();
    Test_HandleFlowResultAsync(instance.onNavigationStateChangeAsync, instance);
  });

  describe("onShouldStartLoadWithRequest", () => {
    const wrapper = shallow(<LoginView {...props} />);
    const instance = wrapper.instance();

    describe("RequestType.Ignore", () => {
      adService.getLoginFlowResult = jest.fn();

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue({ requestType: "ignore" });
        instance.webView = {
          stopLoading: jest.fn(),
        };
      });

      test("calls stop Loading", () => {
        instance.onShouldStartLoadWithRequest({ url: "" });
        expect(instance.webView.stopLoading).toHaveBeenCalledTimes(1);
      });

      test("returns false", () => {
        var result = instance.onShouldStartLoadWithRequest({ url: "" });
        expect(result).toBe(false);
      });
    });

    describe("RequestType.Code", () => {
      adService.getLoginFlowResult = jest.fn();

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue({ requestType: "code" });
        instance.webView = {
          stopLoading: jest.fn(),
        };
      });

      test("calls stop Loading", () => {
        instance.onShouldStartLoadWithRequest({ url: "" });
        expect(instance.webView.stopLoading).toHaveBeenCalledTimes(1);
      });

      test("returns false", () => {
        var result = instance.onShouldStartLoadWithRequest({ url: "" });
        expect(result).toBe(false);
      });
      
      test("returns true", () => {
        var result = instance.onShouldStartLoadWithRequest({ url: "", loading: true });
        expect(result).toBe(true);
      });
    });

    describe("RequestType.PasswordReset", () => {
      adService.getLoginFlowResult = jest.fn();

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue({
          requestType: "passwordReset",
        });
        instance.webView = {
          stopLoading: jest.fn(),
        };
      });

      test("calls stop Loading", () => {
        instance.onShouldStartLoadWithRequest({ url: "" });
        expect(instance.webView.stopLoading).toHaveBeenCalledTimes(1);
      });

      test("returns false", () => {
        var result = instance.onShouldStartLoadWithRequest({ url: "" });
        expect(result).toBe(false);
      });
    });

    describe("RequestType.Cancelled", () => {
      adService.getLoginFlowResult = jest.fn();

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue({
          requestType: "cancelled",
        });
        instance.webView = {
          stopLoading: jest.fn(),
        };
      });

      test("calls stop Loading", () => {
        instance.onShouldStartLoadWithRequest({ url: "" });
        expect(instance.webView.stopLoading).toHaveBeenCalledTimes(1);
      });

      test("returns false", () => {
        var result = instance.onShouldStartLoadWithRequest({ url: "" });
        expect(result).toBe(false);
      });
    });

    describe("RequestType.Other", () => {
      adService.getLoginFlowResult = jest.fn();

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue({ requestType: "other" });
        instance.webView = {
          stopLoading: jest.fn(),
        };
      });

      test("dont call stop Loading", () => {
        instance.onShouldStartLoadWithRequest({ url: "" });
        expect(instance.webView.stopLoading).not.toHaveBeenCalled();
      });

      test("returns true", () => {
        var result = instance.onShouldStartLoadWithRequest({ url: "" });
        expect(result).toBe(true);
      });
    });
  });

  //Helpers
  function Test_HandleFlowResultAsync(callbackAsync, instance) {
    describe("RequestType.PasswordReset", () => {
      jest.spyOn(instance, "setState");

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue({
          requestType: "passwordReset",
        });
        instance.setState.mockClear();
      });

      test("calls adService.getPasswordResetURI", async () => {
        adService.getPasswordResetURI = jest.fn();
        adService.getPasswordResetURI.mockReturnValue("");

        await callbackAsync({ url: "passwordResetTestUrl" });

        expect(adService.getPasswordResetURI).toHaveBeenCalledTimes(1);
      });

      test("Sets URI when it is new", async () => {
        adService.getPasswordResetURI = jest.fn();
        const expectedURI = "test1";
        adService.getPasswordResetURI.mockReturnValue(expectedURI);

        await callbackAsync({ url: "passwordResetTestUrl" });

        expect(instance.setState).toHaveBeenCalledTimes(1);
        expect(instance.setState).toHaveBeenCalledWith({ uri: expectedURI });
      });

      test("Dont sets URI when it is same", async () => {
        adService.getPasswordResetURI = jest.fn();
        const uri = "testURI2";
        adService.getPasswordResetURI.mockReturnValue(uri);
        instance.state.uri = uri;

        await callbackAsync({ url: uri });

        expect(instance.setState).not.toHaveBeenCalled();
      });
    });

    describe("RequestType.Cancelled", () => {
      jest.spyOn(instance, "setState");

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue({
          requestType: "cancelled",
        });
        instance.setState.mockClear();
      });

      test("calls adService.getLoginURI", async () => {
        adService.getLoginURI = jest.fn();
        adService.getLoginURI.mockReturnValueOnce("");

        await callbackAsync({ url: "doesnotMatter" });

        expect(adService.getLoginURI).toHaveBeenCalledTimes(1);
      });

      test("Sets URI when it is new", async () => {
        adService.getLoginURI = jest.fn();
        const expectedURI = "testLoginUri1";
        adService.getLoginURI.mockReturnValueOnce(expectedURI);

        await callbackAsync({ url: "doesnotMatter" });

        expect(instance.setState).toHaveBeenCalledTimes(1);
        expect(instance.setState).toHaveBeenCalledWith({ uri: expectedURI });
      });

      test("Sets URI with different uri when current URI is same as new", async () => {
        const uri = "testLoginURI2";
        instance.state.uri = uri;
        adService.getLoginURI = jest.fn();
        adService.getLoginURI.mockReturnValue(uri);

        await callbackAsync({ url: "doesnotMatter" });

        expect(instance.setState).toHaveBeenCalledTimes(1);

        const setStateArg1 = instance.setState.mock.calls[0][0];

        expect(setStateArg1.uri).toMatch(new RegExp(uri));
        expect(setStateArg1.uri).not.toBe(uri);

        instance.setState.mockClear();

        await callbackAsync({ url: "doesnotMatter" });

        expect(instance.setState).toHaveBeenCalledTimes(1);

        const setStateArg2 = instance.setState.mock.calls[0][0];
        expect(setStateArg2.uri).toMatch(new RegExp(uri));
        expect(setStateArg2.uri).not.toBe(setStateArg1.uri);
      });
    });

    describe("RequestType.Code", () => {
      const expectedResult = { requestType: "code", data: "testData" };

      beforeEach(() => {
        adService.getLoginFlowResult.mockReturnValue(expectedResult);
      });

      test("calls fetchAndSetTokenAsync correctly when login uri", async () => {
        adService.fetchAndSetTokenAsync = jest.fn();
        adService.fetchAndSetTokenAsync.mockResolvedValue({ isValid: true });
        instance.state.uri = props.loginPolicy;

        await callbackAsync({ url: "doesNotMatter" });

        expect(adService.fetchAndSetTokenAsync).toHaveBeenCalledTimes(1);
        expect(adService.fetchAndSetTokenAsync).toHaveBeenCalledWith(
          expectedResult.data,
          props.loginPolicy
        );
      });

      test("calls fetchAndSetTokenAsync correctly when password reset uri", async () => {
        adService.fetchAndSetTokenAsync = jest.fn();
        adService.fetchAndSetTokenAsync.mockResolvedValue({ isValid: true });
        instance.state.uri = props.passwordResetPolicy;

        await callbackAsync({ url: "doesNotMatter" });

        expect(adService.fetchAndSetTokenAsync).toHaveBeenCalledTimes(1);
        expect(adService.fetchAndSetTokenAsync).toHaveBeenCalledWith(
          expectedResult.data,
          props.passwordResetPolicy
        );
      });
      test("calls props.success correctly when fetchAndSetTokenAsync returns valid", async () => {
        props.onSuccess.mockClear();
        adService.fetchAndSetTokenAsync = jest.fn();
        adService.fetchAndSetTokenAsync.mockResolvedValue({ isValid: true });

        await callbackAsync({ url: "doesNotMatter" });

        expect(props.onSuccess).toHaveBeenCalledTimes(1);
      });

      test("calls props.onFail correctly when fetchAndSetTokenAsync returns inValid", async () => {
        props.onFail.mockClear();
        adService.fetchAndSetTokenAsync = jest.fn();
        const error = "test invalid message";
        adService.fetchAndSetTokenAsync.mockResolvedValue({
          isValid: false,
          data: error,
        });

        await callbackAsync({ url: "doesNotMatter" });

        expect(props.onFail).toHaveBeenCalledTimes(1);
        expect(props.onFail).toHaveBeenCalledWith(error);
      });
    });
  }
});
