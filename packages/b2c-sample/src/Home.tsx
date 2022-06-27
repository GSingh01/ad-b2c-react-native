import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
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
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
      <Button
        title="Login"
        onPress={() => navigation.navigate(RouteNames.private)}
      />
    </View>
  );
}
