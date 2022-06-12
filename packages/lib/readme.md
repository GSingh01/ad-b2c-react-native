## API

**Notes**

> Any **code** below is just **a sample implementation** to just demonstrate the API of the components. As-Is **copy paste** of below **will not work**.

### AuthProvider

Wrap root navigation routes with <strong>AppProvider<strong>

```
import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";

import { AuthProvider } from 'ad-b2c-react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix],
};

export default function App() {
  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
      <AuthProvider
            tenant= "<B2CAuthTenant>"
            appId="<B2CAppID>"
            loginPolicy="<B2CSignInPolicy>"
            passwordResetPolicy="<B2CPasswordResetPolicy>"
            profileEditPolicy="<B2CProfleEditPolicy"
            redirectURI={Linking.createURL("redirect")} //redirect uri
          >
          <Routes/>
      </AuthProvider>
    </NavigationContainer>
  );
}

// See packages/b2c-samples/App.tsx for more
```

### Hooks

<details>
<summary>useToken</summary>

```
const { getTokensAsync, isLoading, error, isAuthentic } = useToken();
```

##### isLoading

Boolean whether request is in progress or not

##### isAuthentic

Boolean whether user is authenticated or not

##### error

if an error occured in last request then returns error string else empty

##### getTokensAsync:

Log the user in(if not already) and returns following

```
{
  access: string;
  id: string;
  //time in seconds at which token is expiring
  expiresOn: number;
  error: Error | null | WebBrowserAuthSessionResult;
  isAuthentic: boolean;
}
```

</details>

<details>
<summary>useAuth</summary>

```
const { logOutAsync, editProfileAsync, resetPasswordAsync, handleRedirectAsync } = useAuth();
```

##### logOutAsync:

Logs user out and clear tokens

##### editProfileAsync:

starts profile edit workflow

##### resetPasswordAsync:

starts reset password workflow

##### handleRedirectAsync:

This hook is used to handle redirects from login, logout, editprofile, resetPassword etc.(_see packages/b2c-sample/src/Redirect.tsx_)

</details>
