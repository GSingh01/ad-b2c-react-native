import {ADService} from "./ADService";

let adService;
const props = {
    tenant:"testtenant",
    appId:"testId",
    loginPolicy:"testloginPolicy",
    passwordResetPolicy:"testPasswordResetPolicy",
    redirectURI:"test redirectURI",
    secureStore:{
        "deleteItemAsync": jest.fn(),
        "getItemAsync":jest.fn(),
        "setItemAsync":jest.fn(),
    }
}

beforeEach(()=>{
    adService = new ADService();
    adService.init(props);
    fetch.resetMocks();
});

describe('ADService', ()=>{
    describe('logoutAsync', () => {

        test("calls secureStore.deleteItemAsync",async () => {
            await adService.logoutAsync();

            expect(props.secureStore.deleteItemAsync.mock.calls.length).toBe(5);
            expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith("tokenType");            
            expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith("accessToken");
            expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith("idToken");
            expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith("refreshToken");
            expect(props.secureStore.deleteItemAsync).toHaveBeenCalledWith("expiresOn");
        });
        
        test("when getAccessTokenAsync is called then fetchAndSetToken is called with undefined", async () => {
            await adService.logoutAsync();
            
            const result = await adService.getAccessTokenAsync();

            expect(result.isValid).toBe(false);
            expect(result.data).toBe("Empty auth code");
        });
    });
    
    describe('isAuthenticAsync', () => {

        test("calls secureStore.getItemAsync",async () => {
            await adService.isAuthenticAsync();

            expect(props.secureStore.getItemAsync).toHaveBeenCalledTimes(5);
            expect(props.secureStore.getItemAsync).toHaveBeenCalledWith("tokenType");            
            expect(props.secureStore.getItemAsync).toHaveBeenCalledWith("accessToken");
            expect(props.secureStore.getItemAsync).toHaveBeenCalledWith("idToken");
            expect(props.secureStore.getItemAsync).toHaveBeenCalledWith("refreshToken");
            expect(props.secureStore.getItemAsync).toHaveBeenCalledWith("expiresOn");
        });
        
        test("returns false when token is expired", async () => {
            const tokenResult = {
                tokenType:"testType",
                accessToken:"testAccessToken",
                idToken:"test id token",
                refreshToken:"refresh token",
                expiresOn : new Date().getTime()
            };
            props.secureStore.getItemAsync.mockImplementation(key => {
                let result = "";
                if(key==="tokenType"){
                    result = tokenResult.tokenType;
                }
                if(key === "accessToken"){
                    result = tokenResult.accessToken;
                }
                if(key === "idToken"){
                    result = tokenResult.idToken;
                }
                if(key === "refreshToken"){
                    result = tokenResult.refreshToken;
                }
                if(key === "expiresOn"){
                    result = tokenResult.expiresOn;
                }

                return Promise.resolve(result);
            });

            const result = await adService.isAuthenticAsync();

            expect(result).toBe(false);
        });

        test("returns false when token is expired", async () => {
            const tokenResult = {
                tokenType:"testType",
                accessToken:"testAccessToken",
                idToken:"test id token",
                refreshToken:"refresh token",
                expiresOn : new Date().getTime() + 60000
            };
            props.secureStore.getItemAsync.mockImplementation(key => {
                let result = "";
                if(key==="tokenType"){
                    result = tokenResult.tokenType;
                }
                if(key === "accessToken"){
                    result = tokenResult.accessToken;
                }
                if(key === "idToken"){
                    result = tokenResult.idToken;
                }
                if(key === "refreshToken"){
                    result = tokenResult.refreshToken;
                }
                if(key === "expiresOn"){
                    result = tokenResult.expiresOn;
                }
                return Promise.resolve(result);
            });

            const result = await adService.isAuthenticAsync();

            expect(result).toBe(true);
        });
    });

    describe('getAccessTokenAsync', () => {

        test("returns access token when token is valid", async ()=>{
            const tokenResult = {
                tokenType:"testType",
                accessToken:"testAccessToken",
                idToken:"test id token",
                refreshToken:"refresh token",
                expiresOn : new Date().getTime() + 60000
            };
            props.secureStore.getItemAsync.mockImplementation(key => {
                let result = "";
                if(key==="tokenType"){
                    result = tokenResult.tokenType;
                }
                if(key === "accessToken"){
                    result = tokenResult.accessToken;
                }
                if(key === "idToken"){
                    result = tokenResult.idToken;
                }
                if(key === "refreshToken"){
                    result = tokenResult.refreshToken;
                }
                if(key === "expiresOn"){
                    result = tokenResult.expiresOn;
                }

                return Promise.resolve(result);  
            });
            await adService.isAuthenticAsync();

            const result = await adService.getAccessTokenAsync();

            expect(result.isValid).toBe(true);
            expect(result.data).toBe(`${tokenResult.tokenType} ${tokenResult.accessToken}`);
        });

        test("calls fetch with correct parms when token is expired", async ()=>{
            const tokenResult = {
                tokenType:"testType",
                accessToken:"testAccessToken",
                refreshToken:"testRefreshToken",
                expiresOn : new Date().getTime() - 10000
            };
            props.secureStore.getItemAsync.mockImplementation(key => {
                let result = "";
                if(key==="tokenType"){
                    result = tokenResult.tokenType;
                }
                if(key === "accessToken"){
                    result = tokenResult.accessToken;
                }
                if(key === "idToken"){
                    result = tokenResult.idToken;
                }
                if(key === "refreshToken"){
                    result = tokenResult.refreshToken;
                }
                if(key === "expiresOn"){
                    result = tokenResult.expiresOn;
                }
                return Promise.resolve(result);
            });
            await adService.isAuthenticAsync();

            await adService.getAccessTokenAsync();

            const expectedUrl = "https://testtenant.b2clogin.com/testtenant.onmicrosoft.com/testloginPolicy/oauth2/v2.0/token?";
            const expectedArg2 = {"body": "grant_type=authorization_code&client_id=testId&scope=testId%20offline_access&code=testRefreshToken&redirect_uri=test%2520redirectURI", "headers": {"Content-Type": "application/x-www-form-urlencoded"}, "method": "POST"}
            
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(expectedUrl,expectedArg2);
        });

        test("returns invalid result when auth code is empty", async ()=>{
            const result = await adService.getAccessTokenAsync();
 
            expect(result.isValid).toBe(false);
            expect(result.data).toBe("Empty auth code");
        });
    });

    describe('fetchAndSetTokenAsync', ()=>{
        const testInvalidAuthCode = async val => {
            const result = await adService.fetchAndSetTokenAsync(val);
            
            expect(result.isValid).toBe(false);
            expect(result.data).toBe('Empty auth code');
        };

        test('on undefined authCode returns invalid', async ()=>{
            await testInvalidAuthCode();
        });
        
        test('on empty authCode returns invalid', async ()=>{
            await testInvalidAuthCode('');
        });

        test('on null authCode returns invalid', async ()=>{
            await testInvalidAuthCode(null);
        });

        test('calls fetch with correct parms', async ()=>{
            await adService.fetchAndSetTokenAsync("testCode");

            const expectedUrl = "https://testtenant.b2clogin.com/testtenant.onmicrosoft.com/testloginPolicy/oauth2/v2.0/token?";
            const expectedArg2 = {"body": "grant_type=authorization_code&client_id=testId&scope=testId%20offline_access&code=testCode&redirect_uri=test%2520redirectURI", "headers": {"Content-Type": "application/x-www-form-urlencoded"}, "method": "POST"}
            
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(expectedUrl,expectedArg2);
        });

        test('calls secureStore.setItemAsync with correct params', async ()=>{
            const fetchResult = {
                token_type:"testType",
                access_token:"testAccessToken",
                id_token:"test id token",
                refresh_token:"refresh token",
                expires_on : new Date().getTime() + 60000
            };
            fetch.mockResponse(JSON.stringify(fetchResult));

            await adService.fetchAndSetTokenAsync("testCode");

            expect(props.secureStore.setItemAsync).toHaveBeenCalledTimes(5);
            expect(props.secureStore.setItemAsync).toHaveBeenCalledWith("tokenType",fetchResult.token_type);            
            expect(props.secureStore.setItemAsync).toHaveBeenCalledWith("accessToken", fetchResult.access_token);
            expect(props.secureStore.setItemAsync).toHaveBeenCalledWith("idToken", fetchResult.id_token);
            expect(props.secureStore.setItemAsync).toHaveBeenCalledWith("refreshToken", fetchResult.refresh_token);
            expect(props.secureStore.setItemAsync).toHaveBeenCalledWith("expiresOn", fetchResult.expires_on);
        });

        test('returns invalid when exception occurs', async ()=>{
            const error = "Exception test";
            fetch.mockResponse(() => {throw new Error(error);});

            const result = await adService.fetchAndSetTokenAsync("testCode");

            expect(result.isValid).toBe(false);
            expect(result.data).toBe(error);
        });

        test('returns invalid when fetch response is not ok', async ()=>{
            const error = "Not ok test";
            fetch.mockResolvedValue(fetch.Response(error,{ status: 400 } ));

            const result = await adService.fetchAndSetTokenAsync("testCode");

            expect(result.isValid).toBe(false);
            expect(result.data).toBe(error);
        });
    });

    describe('getLoginURI',()=>{
        test('returns correct value', ()=>{
            const expectedUri = "https://testtenant.b2clogin.com/testtenant.onmicrosoft.com/testloginPolicy/oauth2/v2.0/authorize?client_id=testId&response_type=code&redirect_uri=test%20redirectURI&response_mode=query&scope=testId%20offline_access";
            
            expect(adService.getLoginURI()).toBe(expectedUri);
        });
    });

    describe('getLogoutURI',()=>{
        test('returns correct value', ()=>{
            const expectedUri = "https://testtenant.b2clogin.com/testtenant.onmicrosoft.com/testloginPolicy/oauth2/v2.0/logout?post_logout_redirect_uri=test%20redirectURI";
            
            expect(adService.getLogoutURI()).toBe(expectedUri);
        });
    });

    describe('getPasswordResetURI',()=>{
        test('returns correct value', ()=>{
            const expectedUri = "https://testtenant.b2clogin.com/testtenant.onmicrosoft.com/testPasswordResetPolicy/oauth2/v2.0/authorize?client_id=testId&response_type=code&redirect_uri=test%20redirectURI&response_mode=query&scope=testId%20offline_access";
            
            expect(adService.getPasswordResetURI()).toBe(expectedUri);
        });
    });

    describe('getLoginFlowResult',()=>{
        test('returns correct value when query param is code', ()=>{
            const {requestType, data } = adService.getLoginFlowResult("testUrl?code=testCode")
            
            expect(requestType).toBe('code');
            expect(data).toBe('testCode');
        });

        test('returns correct value when query param is code', ()=>{
            const {requestType, data } = adService.getLoginFlowResult("testUrl?code=testCode")
            
            expect(requestType).toBe('code');
            expect(data).toBe('testCode');
        });

        test('returns correct value when called with logout url ', ()=>{
            const {requestType, data } = adService.getLoginFlowResult(`testUrl?post_logout_redirect_uri=${encodeURI(props.redirectURI)}`);
            
            expect(requestType).toBe('logout');
            expect(typeof data).toBe('undefined');
        });

        test('returns correct value when called with password reset url ', ()=>{
            const {requestType, data } = adService.getLoginFlowResult(`testUrl?error_description=errorcodeAADB2C90118forPasswordReset`);
            
            expect(requestType).toBe('passwordReset');
            expect(data).toBe('errorcodeAADB2C90118forPasswordReset');
        });

        test('returns correct value when called with cancelled url ', ()=>{
            const {requestType, data } = adService.getLoginFlowResult(`testUrl?error_description=errorcodeAADB2C90091forCancelledRequest`);
            
            expect(requestType).toBe('cancelled');
            expect(data).toBe('errorcodeAADB2C90091forCancelledRequest');
        });

        test('returns correct value when called with redirect uri', ()=>{
            const {requestType, data } = adService.getLoginFlowResult(encodeURI(props.redirectURI));
            
            expect(requestType).toBe('ignore');
            expect(typeof data).toBe('undefined');
        });

        test('returns correct value when called with other request uri', ()=>{
            const {requestType, data } = adService.getLoginFlowResult('testForOtherRequestUrl');
            
            expect(requestType).toBe('other');
            expect(typeof data).toBe('undefined');
        });
    });

    describe('getIdToken', ()=>{
        
        test('return idToken', async ()=>{

            const tokenResult = {
                tokenType:"testType",
                accessToken:"testAccessToken",
                refreshToken:"testRefreshToken",
                idToken:"testIdToken",
                expiresOn : new Date().getTime() - 10000
            };
            props.secureStore.getItemAsync.mockImplementation(key => {
                let result = "";
                if(key==="tokenType"){
                    result = tokenResult.tokenType;
                }
                if(key === "accessToken"){
                    result = tokenResult.accessToken;
                }
                if(key === "idToken"){
                    result = tokenResult.idToken;
                }
                if(key === "refreshToken"){
                    result = tokenResult.refreshToken;
                }
                if(key === "expiresOn"){
                    result = tokenResult.expiresOn;
                }
                return Promise.resolve(result);
            });
            await adService.isAuthenticAsync();

            const result = adService.getIdToken();

            expect(result).toBe(tokenResult.idToken);
        });
    });
});