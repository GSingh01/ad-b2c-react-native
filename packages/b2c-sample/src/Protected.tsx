import { useNavigation } from "@react-navigation/core";
import { useFocusEffect, useNavigationState } from "@react-navigation/native";
import { useAuth, useToken } from "ad-b2c-react-native";
import { WebBrowserAuthSessionResult } from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Text, StyleSheet, View, Platform } from "react-native";
import { RootStackNavigationProp, RouteNames } from "./navTypes";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
});

export default function () {
  const { getTokensAsync, isLoading, error, isAuthentic } = useToken();
  const { logOutAsync, editProfileAsync, resetPasswordAsync } = useAuth();
  const nav = useNavigation<RootStackNavigationProp>();
  const [newUrl, setNewUrl] = useState("");
  const [tokenRes, setTokenRes] = useState<
    Awaited<ReturnType<typeof getTokensAsync>>
  >({
    access: "",
    id: "",
    expiresOn: 0,
    url: "",
    error: "",
    isAuthentic: false,
  });
  const routesLength = useNavigationState((state) => {
    return state.routes.length;
  });

  useFocusEffect(
    useCallback(() => {
      setResetPasswordError("");
      setNewUrl("");
      getTokensAsync().then((x) => {
        if (x.error) {
          nav.replace(RouteNames.home);
        }
        setTokenRes(x);
        if (x.url) {
          setNewUrl(x.url);
        }
      });
    }, [isAuthentic, routesLength])
  );

  function browserResultHandler(x: WebBrowserAuthSessionResult) {
    if (x.type === "success") {
      setNewUrl(x.url);
    }
  }

  const [resetPasswordError, setResetPasswordError] = useState("");
  useEffect(() => {
    if (newUrl) {
      if (newUrl.includes("AADB2C90118")) {
        setTimeout(() => {
          resetPasswordAsync().catch((ex) => {
            setResetPasswordError(ex.toString());
          });
        }, 1);
      }

      if (Platform.OS === "web") {
        const url = new URL(newUrl);
        const searchParams = url.searchParams;
        const code = searchParams.get("code");
        if (code) {
          nav.navigate(RouteNames.redirect, {
            code: code,
            state: searchParams.get("state") || "",
            error: "",
            error_description: "",
          });
        }
      }
    }
  }, [newUrl]);

  if (resetPasswordError) {
    return (
      <View style={styles.container}>
        <Text>Please manually press reset password</Text>
        <Button
          title="Reset password"
          onPress={() => resetPasswordAsync().then(browserResultHandler)}
        />
        <Text>
          Reason:
          {resetPasswordError}
        </Text>
      </View>
    );
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!isAuthentic) {
    return <Text>Could not authenticate</Text>;
  }

  const { access, id, expiresOn } = tokenRes;
  return (
    <View style={styles.container}>
      <Button
        title="Logout"
        onPress={() => logOutAsync().then(() => nav.navigate(RouteNames.home))}
      />
      <Button
        title="Reset password"
        onPress={() => resetPasswordAsync().then(browserResultHandler)}
      />
      <Button
        title="Edit profile"
        onPress={() => editProfileAsync().then(browserResultHandler)}
      />
      <Text>Protected component example </Text>
      <Text>accessToken: {access}</Text>
      <Text>idToken: {id}</Text>
      <Text>expiresOn: {expiresOn} seconds</Text>
    </View>
  );
}
