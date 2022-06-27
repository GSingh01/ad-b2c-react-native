import { useNavigation } from "@react-navigation/core";
import { useAuth, useToken } from "ad-b2c-react-native";
import React, { useEffect, useState } from "react";
import { Button, Text, StyleSheet, View } from "react-native";
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
  const [tokenRes, setTokenRes] = useState({
    access: "",
    id: "",
    expiresOn: 0,
  });

  useEffect(() => {
    getTokensAsync().then((x) => {
      setTokenRes(x);
    });
  }, [isAuthentic]);

  useEffect(() => {
    if (error.includes("AADB2C90118")) {
      setTimeout(() => {
        resetPasswordAsync();
      }, 1);
    }
  }, [error]);

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  const { access, id, expiresOn } = tokenRes;
  return (
    <View style={styles.container}>
      <Button
        title="Logout"
        onPress={() => logOutAsync().then(() => nav.navigate(RouteNames.home))}
      />
      <Button title="Edit profile" onPress={editProfileAsync} />
      <Button title="Reset password" onPress={resetPasswordAsync} />
      <Text>Protected component example </Text>
      <Text>accessToken: {access}</Text>
      <Text>idToken: {id}</Text>
      <Text>expiresOn: {expiresOn} seconds</Text>
    </View>
  );
}
