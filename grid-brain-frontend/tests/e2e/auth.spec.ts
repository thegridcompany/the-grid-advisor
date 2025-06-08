import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should redirect to login when accessing protected route", async ({
    page,
  }) => {
    // Try to access a protected route
    await page.goto("/projects");

    // Should be redirected to login with redirect parameter
    await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fprojects/);

    // Login page should be visible
    await expect(
      page.getByRole("heading", { name: "Grid Brain" })
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("nome.cognome@thegridcompany.it")
    ).toBeVisible();
  });

  test("should show error for invalid email domain", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to login with non-company email
    await page.fill('input[type="email"]', "test@gmail.com");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.getByText("Utilizza un indirizzo email valido @thegridcompany.it")
    ).toBeVisible();
  });

  test("should send magic link for valid email", async ({ page }) => {
    await page.goto("/auth/login");

    // Enter valid company email
    await page.fill('input[type="email"]', "test.user@thegridcompany.it");

    // Submit button should be enabled
    const submitButton = page.getByRole("button", {
      name: /Invia Magic Link/i,
    });
    await expect(submitButton).toBeEnabled();

    // Click submit (this will make a real API call in e2e test)
    await submitButton.click();

    // Should show success state (if API is mocked or backend is running)
    // await expect(page.getByText('Email inviata!')).toBeVisible();
  });

  test("should redirect logged-in user away from login page", async ({
    page,
    context,
  }) => {
    // Set a mock JWT token in cookies
    await context.addCookies([
      {
        name: "token",
        value:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IkRFVkVMT1BFUiIsImV4cCI6OTk5OTk5OTk5OX0.mock",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Try to access login page
    await page.goto("/auth/login");

    // Should be redirected to home
    await expect(page).toHaveURL("/");
  });

  test("should handle role-based access control", async ({ page, context }) => {
    // Set a token with DEVELOPER role
    await context.addCookies([
      {
        name: "token",
        value:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IkRFVkVMT1BFUiIsImV4cCI6OTk5OTk5OTk5OX0.mock",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Developer can access /dev
    await page.goto("/dev");
    await expect(page).toHaveURL("/dev");

    // But not /admin
    await page.goto("/admin");
    await expect(page).toHaveURL("/?error=Unauthorized");
  });
});
