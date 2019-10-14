import React from 'react';
import {Text} from 'react-native';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json'
import LogoutView from '../src/LogoutView';
import adService from '../src/ADService';

describe('LogoutView',()=>{
    const props = {
        onSuccess: jest.fn(),
        onFail: jest.fn(),
        renderLoading:()=><Text>loading</Text>
    };

    adService.init({
        appId:"testAppId",
        redirectURI:"test//redirectURI",
        tenant:"TestTenant",
        loginPolicy:"testLoginPolicy",
        passwordResetPolicy:"testPasswordReset",
        profileEditPolicy:"testProfileId", 
    });

    test('renders correctly', () => {
        const wrapper = shallow(<LogoutView {...props} />);
            
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    describe('onShouldStartLoadWithRequest', ()=>{
        const wrapper = shallow( <LogoutView {...props} />);
        const instance = wrapper.instance();
        
        describe('RequestType.Ignore', () => {
            adService.getLoginFlowResult = jest.fn();
            
            beforeEach(() => {
                adService.getLoginFlowResult.mockReturnValue({ requestType: 'ignore' });
                instance.webView = {
                    stopLoading: jest.fn()
                };
            });

            test('calls stop Loading', () => {
                instance.onShouldStartLoadWithRequest({url:''})
                expect(instance.webView.stopLoading).toHaveBeenCalledTimes(1);
            });
        });

        describe('RequestType.Other', () => {
            adService.getLoginFlowResult = jest.fn();
            
            beforeEach(() => {
                adService.getLoginFlowResult.mockReturnValue({ requestType: 'other' });
                instance.webView = {
                    stopLoading: jest.fn()
                };
            });

            test('dont call stop Loading', () => {
                instance.onShouldStartLoadWithRequest({url:''})
                expect(instance.webView.stopLoading).not.toHaveBeenCalled();
            });

            test('returns true', () => {
                var result = instance.onShouldStartLoadWithRequest({url:''})
                expect(result).toBe(true);
            });
        });
    });

    describe('onLoadEnd', ()=>{
        const wrapper = shallow( <LogoutView {...props} />);
        const instance = wrapper.instance();
        adService.logoutAsync = jest.fn();
        adService.logoutAsync.mockResolvedValue();

        beforeEach(()=>{
            adService.logoutAsync.mockClear();
            props.onSuccess.mockClear();
        })

        test('calls adService.logoutAsync', async () => {
            
            await instance.onLoadEnd();

            expect(adService.logoutAsync).toHaveBeenCalledTimes(1);
        });

        test('calls props.onSuccess', async () => {

            await instance.onLoadEnd();

            expect(props.onSuccess).toHaveBeenCalledTimes(1);
        });
    });

    describe('onError',() => {
        const wrapper = shallow( <LogoutView {...props} />);
        const instance = wrapper.instance();

        beforeEach(()=>{
            props.onFail.mockClear();
        })

        test('calls props.onFail correctly', async () => {
            const error = 'test error';
            await instance.onError({ description: error });

            expect(props.onFail).toHaveBeenCalledTimes(1);
            expect(props.onFail).toHaveBeenCalledWith(error);
        });
    });
});