import { useContext } from "react";
import { AuthContext } from "../providers/AuthProvider";

export default function useAuth() {
  const {
    logOutAsync,
    editProfileAsync,
    resetPasswordAsync,
    handleRedirectAsync,
  } = useContext(AuthContext);

  return {
    logOutAsync,
    editProfileAsync,
    resetPasswordAsync,
    handleRedirectAsync,
  };
}
