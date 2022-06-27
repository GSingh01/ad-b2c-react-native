import React from "react";
import { render } from "@testing-library/react-native";
import AuthProvider from "../providers/AuthProvider";

const AllTheProviders = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from "@testing-library/react-native";

// override render method
export { customRender as render };
