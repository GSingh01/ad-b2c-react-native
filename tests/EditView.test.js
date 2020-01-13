import React from 'react';
import {Text} from 'react-native';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json'
import EditView from '../src/EditView';
import adService from '../src/ADService';

describe('EditView',()=>{
    const props = {
        appId:"testAppId",
        redirectURI:"test//redirectURI",
        tenant:"TestTenant",
        loginPolicy:"testLoginPolicy",
        passwordResetPolicy:"testPasswordReset",
        profileEditPolicy:"testProfileEditPolicy", 
        onSuccess: jest.fn(),
        onFail: jest.fn(),
        renderLoading:()=><Text>loading</Text>
    };

    adService.init(props);

    test('renders correctly', () => {
        const wrapper = shallow(<EditView {...props} />);
            
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    describe('onShouldStartLoadWithRequest', ()=>{
        const wrapper = shallow( <EditView {...props} />);
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

        describe('RequestType.Code', () => {
            adService.getLoginFlowResult = jest.fn();
            
            beforeEach(() => {
                adService.getLoginFlowResult.mockReturnValue({ requestType: 'code' });
                instance.webView = {
                    stopLoading: jest.fn()
                };
            });

            test('calls stop Loading', () => {
                instance.onShouldStartLoadWithRequest({url:''})
                expect(instance.webView.stopLoading).toHaveBeenCalledTimes(1);
            });
        });

        describe('RequestType.Cancelled', () => {
            adService.getLoginFlowResult = jest.fn();
            
            beforeEach(() => {
                adService.getLoginFlowResult.mockReturnValue({ requestType: 'cancelled' });
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

    describe('onNavigationStateChangeAsync', () => {
        test('calls getLoginFlowResult correctly', async () => {
            adService.getLoginFlowResult = jest.fn();
            adService.getLoginFlowResult.mockResolvedValue({requestType:'Other'});
            const wrapper = shallow( <EditView {...props} />);
            
            const url = "testUrl"
            await wrapper.instance().onNavigationStateChangeAsync({ url });

            expect(adService.getLoginFlowResult).toHaveBeenCalledTimes(1);
            expect(adService.getLoginFlowResult).toHaveBeenCalledWith(url);
        });

        test('doesnot calls _handleFlowResultAsync when state.url is same as navstate.uri', async () => {
            adService.getLoginFlowResult = jest.fn();

            const wrapper = shallow( <EditView {...props} />);
            const instance = wrapper.instance();
            jest.spyOn(instance, '_handleFlowResultAsync');
            const uri = "testUri";
            
            instance.state.uri = uri;
            await instance.onNavigationStateChangeAsync({ url:uri });
            
            expect(instance._handleFlowResultAsync).not.toHaveBeenCalled();
        });

        const wrapper = shallow( <EditView {...props} />);
        const instance = wrapper.instance();
        Test_HandleFlowResultAsync(instance.onNavigationStateChangeAsync, instance);

    });

    describe('onError',() => {
        const wrapper = shallow( <EditView {...props} />);
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

    //Helpers
    function Test_HandleFlowResultAsync(callbackAsync, instance){
        describe('RequestType.Cancelled',() => {

            beforeEach(()=>{
                adService.getLoginFlowResult.mockReturnValue({requestType:'cancelled'});
            });

            test('calls props.onSuccess', async ()=>{
                props.onSuccess.mockClear();

                await callbackAsync({url:"doesnotMatter"});

                expect(props.onSuccess).toHaveBeenCalledTimes(1);
            });
        });

        describe('RequestType.Code',() => {
            const expectedResult = {requestType:'code', data:'testData'}
            
            beforeEach( () => {
                adService.getLoginFlowResult.mockReturnValue(expectedResult);
            });

            test('calls fetchAndSetTokenAsync correctly', async ()=> {
                adService.fetchAndSetTokenAsync = jest.fn();
                adService.fetchAndSetTokenAsync.mockResolvedValue({isValid:true});

                await callbackAsync({url:"doesNotMatter"});

                expect(adService.fetchAndSetTokenAsync).toHaveBeenCalledTimes(1);
                expect(adService.fetchAndSetTokenAsync).toHaveBeenCalledWith(expectedResult.data, props.profileEditPolicy);
            });

            test('calls props.success correctly when fetchAndSetTokenAsync returns valid', async ()=> {
                props.onSuccess.mockClear();
                adService.fetchAndSetTokenAsync = jest.fn();
                adService.fetchAndSetTokenAsync.mockResolvedValue({isValid:true})
                
                await callbackAsync({url:"doesNotMatter"});

                expect(props.onSuccess).toHaveBeenCalledTimes(1);
            });

            test('calls props.onFail correctly when fetchAndSetTokenAsync returns inValid', async ()=> {
                props.onFail.mockClear();
                adService.fetchAndSetTokenAsync = jest.fn();
                const error = "test invalid message";
                adService.fetchAndSetTokenAsync.mockResolvedValue({isValid:false, data:error})
                
                await callbackAsync({url:"doesNotMatter"});

                expect(props.onFail).toHaveBeenCalledTimes(1);
                expect(props.onFail).toHaveBeenCalledWith(error);
            });
        });
    }
});