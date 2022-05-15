import React, { useState } from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

import { AuthProvider } from "ad-b2c-react-native";
import Home from "./src/Home";
import Protected from "./src/Protected";
import { RootStackParamList, RouteNames } from "./src/navTypes";
import Redirect from "./src/Redirect";

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix],
};

export default function App() {
  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
      <AuthProvider
        tenant={Constants?.manifest?.extra?.authTenant}
        appId={Constants?.manifest?.extra?.authAppId}
        loginPolicy="B2C_1_SigupIn"
        passwordResetPolicy="B2C_1_PwdReset"
        profileEditPolicy="B2C_1_ProfleEdit"
        redirectURI={Linking.createURL("redirect")}
      >
        <Stack.Navigator>
          <Stack.Screen name={RouteNames.home} component={Home} />
          <Stack.Screen name={RouteNames.private} component={Protected} />
          <Stack.Screen name={RouteNames.redirect} component={Redirect} />
        </Stack.Navigator>
      </AuthProvider>
    </NavigationContainer>
  );
}
