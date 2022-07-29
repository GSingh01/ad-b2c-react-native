import { useNavigation, useRoute } from "@react-navigation/core";
import { useAuth } from "ad-b2c-react-native";
import React, { useEffect } from "react";
import { Text } from "react-native";
import {
  AuthScreenRouteProp,
  RootStackNavigationProp,
  RouteNames,
} from "./navTypes";

export default function () {
  const { handleRedirectAsync } = useAuth();
  const nav = useNavigation<RootStackNavigationProp>();
  const route = useRoute<AuthScreenRouteProp>();
  useEffect(() => {
    const params = route.params;
    handleRedirectAsync(params?.code, params?.state)
      .then(() => {
        if (nav.canGoBack()) {
          nav.goBack();
        } else {
          nav.replace(RouteNames.home);
        }
      })
      .catch((ex: any) => {
        console.log(ex);
        nav.replace(RouteNames.home);
      });
  }, [route.params]);
  return <Text>Authenticating</Text>;
}
