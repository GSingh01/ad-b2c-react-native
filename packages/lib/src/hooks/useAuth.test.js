import { renderHook } from "@testing-library/react-hooks";
import { useContext } from "react";
import { useAuth } from "../../index";
import { AuthContext } from "../providers/AuthProvider";

let context;
describe("useAuth", () => {
  beforeAll(() => {
    const { result: contextRes } = renderHook(() => useContext(AuthContext));
    context = contextRes.current;
  });

  it("returns logOutAsync", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.logOutAsync).toBe(context.logOutAsync);
  });

  it("returns editProfileAsync", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.editProfileAsync).toBe(context.editProfileAsync);
  });

  it("returns resetPasswordAsync", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.resetPasswordAsync).toBe(context.resetPasswordAsync);
  });

  it("returns handleRedirectAsync", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.handleRedirectAsync).toBe(
      context.handleRedirectAsync
    );
  });
});
