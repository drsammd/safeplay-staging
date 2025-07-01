
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login and signup options on homepage', async ({ page }) => {
    // Check if navigation contains auth links
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click()
    await page.waitForURL('/auth/signup')
    
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
  })

  test('should validate signup form', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create account/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
    await expect(page.getByText(/name is required/i)).toBeVisible()
  })

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/auth/signup')
    
    const passwordField = page.getByLabel(/password/i)
    
    // Test weak password
    await passwordField.fill('123')
    await expect(page.getByText(/weak/i)).toBeVisible()
    
    // Test strong password
    await passwordField.fill('StrongPassword123!')
    await expect(page.getByText(/strong/i)).toBeVisible()
  })

  test('should navigate to signin page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click()
    await page.waitForURL('/auth/signin')
    
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should validate signin form', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test('should successfully login with demo account', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Use demo account credentials
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should redirect to dashboard
    await page.waitForURL('/parent')
    await expect(page.getByText(/welcome/i)).toBeVisible()
  })

  test('should show user menu when logged in', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
    
    // Check for user menu
    await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
    
    // Logout
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    
    // Should redirect to homepage
    await page.waitForURL('/')
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('should handle session persistence', async ({ page, context }) => {
    // Login
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
    
    // Open new tab
    const newPage = await context.newPage()
    await newPage.goto('/parent')
    
    // Should remain logged in
    await expect(newPage.getByText(/welcome/i)).toBeVisible()
  })
})
