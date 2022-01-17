import React from "react";
//import { render, fireEvent } from "../__test-utils";
import AuthProvider from "./AuthProvider";
import AuthService from "../services/Auth";

jest.mock("../services/Auth");

describe("AuthProvider", () => {
  beforeEach(() => {
    AuthService.mockClear();
  });

  it("initializes authService only once", async () => {
    //const comp = render(<AuthProvider />);
    //expect(AuthService).toBeCalledTimes(0);
  });
});
