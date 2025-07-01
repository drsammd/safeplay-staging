
import { test, expect } from '@playwright/test'

test.describe('Navigation and Routing', () => {
  test('should navigate through public pages', async ({ page }) => {
    await page.goto('/')
    
    // Test homepage
    await expect(page.getByRole('heading', { name: /safeplay/i })).toBeVisible()
    
    // Navigate to testimonials
    await page.getByRole('link', { name: /testimonials/i }).click()
    await page.waitForURL('/testimonials')
    await expect(page.getByRole('heading', { name: /testimonials/i })).toBeVisible()
    
    // Navigate to FAQ
    await page.getByRole('link', { name: /faq/i }).click()
    await page.waitForURL('/faq')
    await expect(page.getByRole('heading', { name: /frequently asked questions/i })).toBeVisible()
    
    // Navigate to contact
    await page.getByRole('link', { name: /contact/i }).click()
    await page.waitForURL('/contact')
    await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible()
  })

  test('should handle protected route access', async ({ page }) => {
    // Try to access parent dashboard without login
    await page.goto('/parent')
    
    // Should redirect to signin
    await page.waitForURL('/auth/signin')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('should navigate authenticated parent routes', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
    
    // Test parent navigation
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /children/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /memories/i })).toBeVisible()
    
    // Navigate to children
    await page.getByRole('link', { name: /children/i }).click()
    await page.waitForURL('/parent/children')
    await expect(page.getByRole('heading', { name: /children/i })).toBeVisible()
    
    // Navigate to memories
    await page.getByRole('link', { name: /memories/i }).click()
    await page.waitForURL('/parent/memories')
    await expect(page.getByRole('heading', { name: /memories/i })).toBeVisible()
  })

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check if mobile menu trigger is visible
    const menuButton = page.getByRole('button', { name: /menu/i })
    if (await menuButton.isVisible()) {
      await menuButton.click()
      
      // Check if navigation items are visible in mobile menu
      await expect(page.getByRole('link', { name: /testimonials/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /faq/i })).toBeVisible()
    }
  })

  test('should show 404 for invalid routes', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    await expect(page.getByText(/404/i)).toBeVisible()
    await expect(page.getByText(/page not found/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible()
  })

  test('should handle role-based navigation', async ({ page }) => {
    // Login as parent
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
    
    // Try to access venue admin route
    await page.goto('/venue-admin')
    
    // Should be redirected or show unauthorized
    await expect(page.getByText(/unauthorized|not authorized/i)).toBeVisible()
  })

  test('should maintain navigation state on page refresh', async ({ page }) => {
    // Login and navigate to children page
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
    
    await page.getByRole('link', { name: /children/i }).click()
    await page.waitForURL('/parent/children')
    
    // Refresh page
    await page.reload()
    
    // Should stay on children page and remain authenticated
    await expect(page.url()).toContain('/parent/children')
    await expect(page.getByRole('heading', { name: /children/i })).toBeVisible()
  })

  test('should handle breadcrumb navigation', async ({ page }) => {
    // Login and navigate to nested page
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
    
    await page.getByRole('link', { name: /children/i }).click()
    await page.waitForURL('/parent/children')
    
    // Check for breadcrumbs (if implemented)
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb.getByText(/parent/i)).toBeVisible()
      await expect(breadcrumb.getByText(/children/i)).toBeVisible()
    }
  })

  test('should handle external link behavior', async ({ page }) => {
    await page.goto('/')
    
    // Look for external links (if any)
    const externalLinks = page.getByRole('link', { name: /learn more|documentation/i })
    if (await externalLinks.first().isVisible()) {
      // External links should have proper attributes
      await expect(externalLinks.first()).toHaveAttribute('target', '_blank')
      await expect(externalLinks.first()).toHaveAttribute('rel', /noopener/)
    }
  })
})
