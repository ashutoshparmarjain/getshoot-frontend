import React from "react";
import { render, screen } from "@testing-library/react";
import SignupPage from "./page";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SignupPage", () => {
  it("renders title and form inputs", () => {
    render(<SignupPage />);

    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm your password")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your display name")
    ).toBeInTheDocument();
  });
});
