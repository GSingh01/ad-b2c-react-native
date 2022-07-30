import { renderHook } from "@testing-library/react-hooks";
import { useContext } from "react";
import { useToken } from "../../index";
import { AuthContext } from "../providers/AuthProvider";
import { waitFor } from "@testing-library/react-native";

jest.mock("../providers/AuthProvider");

describe("useToken", () => {
  describe("getTokensAsync", () => {
    beforeEach(() => {
      const { result: contextRes } = renderHook(() => useContext(AuthContext));
      contextRes.current.signInAsync.mockClear();
    });

    describe("When isAuthentic false", () => {
      it("sets isLoading true and reset error msg", async () => {
        const { result } = renderHook(() => useToken());

        waitFor(result.current.getTokensAsync);

        expect(result.current.isAuthentic).toBe(false);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBe("");
      });

      it("calls provider.signInAsync", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );

        await waitFor(result.current.getTokensAsync);

        expect(contextRes.current.signInAsync).toBeCalledTimes(1);
      });

      it("sets isLoading false and error to undefined when signInAsync returns success but no type", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        contextRes.current.signInAsync.mockResolvedValueOnce();

        await waitFor(result.current.getTokensAsync);

        expect(result.current.error).toBe(undefined);
        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading false and error to empty when signInAsync returns success", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        contextRes.current.signInAsync.mockResolvedValueOnce({
          type: "success",
        });

        const expectedRes = {
          expiresOn: 0,
          access: "",
          id: "",
          error: null,
          isAuthentic: false,
          url: undefined,
        };

        await waitFor(() =>
          expect(result.current.getTokensAsync()).resolves.toStrictEqual(
            expectedRes
          )
        );
        expect(result.current.error).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading false and url correctly when signInAsync receives password reset redirect", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        const signInResult = {
          type: "success",
          url: "https://AADB2C90118",
        };
        contextRes.current.signInAsync.mockResolvedValueOnce(signInResult);

        const expectedRes = {
          expiresOn: 0,
          access: "",
          id: "",
          error: null,
          isAuthentic: false,
          url: signInResult.url,
        };

        await waitFor(() =>
          expect(result.current.getTokensAsync()).resolves.toStrictEqual(
            expectedRes
          )
        );

        expect(result.current.error).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading false and error correctly when signInAsync returns type is not success", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        const type = "notsuccess";
        contextRes.current.signInAsync.mockResolvedValueOnce({
          type,
        });

        await waitFor(result.current.getTokensAsync);

        expect(result.current.error).toBe(type);
        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading false and error correctly when signInAsync throws", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        const error = "exception msg";
        contextRes.current.signInAsync.mockRejectedValueOnce(new Error(error));

        await waitFor(result.current.getTokensAsync);

        expect(result.current.error).toBe(error);
        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading false and error correctly when signInAsync throws non standard error ", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        const error = { error: "exception msg" };
        contextRes.current.signInAsync.mockRejectedValueOnce(error);

        await waitFor(result.current.getTokensAsync);

        expect(result.current.error).toBe(JSON.stringify(error));
        expect(result.current.isLoading).toBe(false);
      });

      it("returns handleSignInAsync result", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        const signInResult = {
          type: "success",
          url: "testUrl",
        };
        contextRes.current.signInAsync.mockResolvedValueOnce(signInResult);

        const expectedRes = {
          expiresOn: 0,
          access: "",
          id: "",
          error: null,
          isAuthentic: false,
          url: signInResult.url,
        };
        await waitFor(() =>
          expect(result.current.getTokensAsync()).resolves.toStrictEqual(
            expectedRes
          )
        );
      });

      it("returns handleSignInAsync result when signInResponse.url is not defined", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        const signInResult = {
          type: "success",
        };
        contextRes.current.signInAsync.mockResolvedValueOnce(signInResult);

        const expectedRes = {
          expiresOn: 0,
          access: "",
          id: "",
          error: null,
          isAuthentic: false,
          url: undefined,
        };
        await waitFor(() =>
          expect(result.current.getTokensAsync()).resolves.toStrictEqual(
            expectedRes
          )
        );
      });
    });

    describe("When isAuthentic", () => {
      beforeEach(() => {
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        contextRes.current.isAuthentic = true;
      });

      afterAll(() => {
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        contextRes.current.isAuthentic = false;
      });

      it("Sets isLoading true and error to empty", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        contextRes.current.getTokensAsync.mockResolvedValueOnce({
          token: "data",
        });

        waitFor(result.current.getTokensAsync);

        expect(contextRes.current.signInAsync).not.toBeCalled();
        expect(result.current.isAuthentic).toBe(true);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBe("");
      });

      it("Sets isLoading false and error to empty", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );
        contextRes.current.getTokensAsync.mockResolvedValueOnce({
          token: "data",
        });

        await waitFor(result.current.getTokensAsync);

        expect(contextRes.current.signInAsync).not.toBeCalled();
        expect(result.current.isAuthentic).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe("");
      });

      it("Sets isLoading false and error correctly when getTokenAsyncOrig throws", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );

        const error = "exception message";
        contextRes.current.getTokensAsync.mockRejectedValueOnce(
          new Error(error)
        );

        await waitFor(result.current.getTokensAsync);

        expect(contextRes.current.signInAsync).not.toBeCalled();
        expect(result.current.isAuthentic).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(error);
      });

      it("Sets isLoading false and error correctly stringfied when getTokenAsyncOrig throws non standard error", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );

        const error = { error: "exception message" };
        contextRes.current.getTokensAsync.mockRejectedValueOnce(error);

        await waitFor(result.current.getTokensAsync);

        expect(contextRes.current.signInAsync).not.toBeCalled();
        expect(result.current.isAuthentic).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(JSON.stringify(error));
      });

      it("returns getTokenAsync result", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );

        const data = {
          token: "data",
        };
        contextRes.current.getTokensAsync.mockResolvedValueOnce(data);

        const expectedRes = {
          ...data,
          error: null,
          isAuthentic: true,
          url: "",
        };
        await waitFor(() =>
          expect(result.current.getTokensAsync()).resolves.toStrictEqual(
            expectedRes
          )
        );
      });

      it("returns getTokenAsync result on exception", async () => {
        const { result } = renderHook(() => useToken());
        const { result: contextRes } = renderHook(() =>
          useContext(AuthContext)
        );

        const error = "exception message";
        contextRes.current.getTokensAsync.mockRejectedValueOnce(error);

        const data = {
          expiresOn: 0,
          access: "",
          id: "",
          error,
          isAuthentic: true, //because exception doesnot mean current token is invalid
          url: "",
        };
        await waitFor(() =>
          expect(result.current.getTokensAsync()).resolves.toStrictEqual(data)
        );
      });
    });
  });
});
