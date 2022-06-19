import { WebBrowserAuthSessionResult } from "expo-web-browser";
import { useContext, useReducer } from "react";
import { AuthContext } from "../providers/AuthProvider";

interface IUseAuth {
  isLoading: boolean;
  error: string;
}

interface IAuthState extends IUseAuth {}
export default function useToken() {
  const {
    signInAsync,
    getTokensAsync: getTokenAsyncOrig,
    isAuthentic,
  } = useContext(AuthContext);
  const [state, setState] = useReducer(
    (state: IAuthState, newState: Partial<IAuthState>) => ({
      ...state,
      ...newState,
    }),
    {
      isLoading: true,
      error: "",
    }
  );

  const { isLoading, error } = state;

  async function getTokensAsync(): Promise<{
    access: string;
    id: string;
    //time in seconds at which token is expiring
    expiresOn: number;
    error: Error | null | WebBrowserAuthSessionResult;
    isAuthentic: boolean;
  }> {
    if (!isAuthentic) {
      return handleSignInAsync();
    }

    setState({ isLoading: true, error: "" });
    return getTokenAsyncOrig()
      .then((data) => {
        setState({ isLoading: false, error: "" });
        return { ...data, error: null, isAuthentic };
      })
      .catch((ex) => {
        setState({
          isLoading: false,
          error: ex?.message ?? JSON.stringify(ex),
        });
        return { expiresOn: 0, access: "", id: "", error: ex, isAuthentic };
      });
  }

  async function handleSignInAsync() {
    let error: any = null;
    try {
      setState({ error: "", isLoading: true });
      if (!isAuthentic) {
        const siginRes = await signInAsync();

        if (siginRes?.type === "success") {
          error = siginRes.url?.includes("AADB2C90118")
            ? "Resetting password AADB2C90118"
            : "";
          setState({
            error,
            isLoading: false,
          });
        } else {
          error = siginRes?.type;
          setState({
            error,
            isLoading: false,
          });
        }
      }
    } catch (ex: any) {
      error = ex;
      setState({
        error: (error as Error).message ?? JSON.stringify(error),
        isLoading: false,
      });
    }

    return { expiresOn: 0, access: "", id: "", error, isAuthentic };
  }
  return { isLoading, error, getTokensAsync, isAuthentic };
}
