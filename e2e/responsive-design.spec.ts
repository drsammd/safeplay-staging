
import { test, expect } from '@playwright/test'

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1200, height: 800 },
  { name: 'Large Desktop', width: 1920, height: 1080 },
]

test.describe('Responsive Design', () => {
  viewports.forEach(({ name, width, height }) => {
    test(`should display correctly on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      
      // Check header responsiveness
      await expect(page.getByRole('banner')).toBeVisible()
      
      // Check main content
      await expect(page.getByRole('main')).toBeVisible()
      
      // Check footer
      await expect(page.getByRole('contentinfo')).toBeVisible()
      
      // Check if content fits viewport
      const body = await page.locator('body').boundingBox()
      expect(body?.width).toBeLessThanOrEqual(width)
    })
  })

  test('should handle mobile menu toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const menuButton = page.getByRole('button', { name: /menu|hamburger/i })
    
    if (await menuButton.isVisible()) {
      // Menu should be hidden initially
      const mobileMenu = page.getByRole('navigation', { name: /mobile|main/i })
      
      // Toggle menu
      await menuButton.click()
      await expect(mobileMenu).toBeVisible()
      
      // Toggle again to close
      await menuButton.click()
      await expect(mobileMenu).not.toBeVisible()
    }
  })

  test('should adapt form layouts for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth/signup')
    
    // Check form responsiveness
    const form = page.getByRole('form')
    await expect(form).toBeVisible()
    
    // Form fields should stack vertically on mobile
    const formFields = page.getByRole('textbox')
    const firstFieldBox = await formFields.first().boundingBox()
    const lastFieldBox = await formFields.last().boundingBox()
    
    if (firstFieldBox && lastFieldBox) {
      // Fields should be stacked (different Y positions)
      expect(firstFieldBox.y).not.toEqual(lastFieldBox.y)
    }
  })

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check button sizes for touch targets
    const buttons = page.getByRole('button')
    
    for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
      const button = buttons.nth(i)
      const boundingBox = await button.boundingBox()
      
      if (boundingBox) {
        // Touch targets should be at least 44px (recommended minimum)
        expect(boundingBox.height).toBeGreaterThanOrEqual(40)
        expect(boundingBox.width).toBeGreaterThanOrEqual(40)
      }
    }
  })

  test('should hide/show elements based on screen size', async ({ page }) => {
    // Test on desktop
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/')
    
    // Desktop navigation should be visible
    const desktopNav = page.getByRole('navigation').first()
    await expect(desktopNav).toBeVisible()
    
    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if layout changes appropriately
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      // Mobile menu button should be visible on small screens
      await expect(mobileMenuButton).toBeVisible()
    }
  })

  test('should maintain functionality across viewports', async ({ page }) => {
    // Test signup functionality on different screen sizes
    const testSignup = async (viewport: { width: number, height: number }) => {
      await page.setViewportSize(viewport)
      await page.goto('/auth/signup')
      
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByLabel(/name/i).fill('Test User')
      
      // Form should work regardless of screen size
      const submitButton = page.getByRole('button', { name: /create account/i })
      await expect(submitButton).toBeEnabled()
    }
    
    // Test on different viewports
    await testSignup({ width: 375, height: 667 }) // Mobile
    await testSignup({ width: 768, height: 1024 }) // Tablet
    await testSignup({ width: 1200, height: 800 }) // Desktop
  })

  test('should handle image responsiveness', async ({ page }) => {
    await page.goto('/')
    
    const testImageResponsiveness = async (viewport: { width: number, height: number }) => {
      await page.setViewportSize(viewport)
      
      // Find images on the page
      const images = page.locator('img')
      const imageCount = await images.count()
      
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const image = images.nth(i)
        const boundingBox = await image.boundingBox()
        
        if (boundingBox) {
          // Images shouldn't overflow the viewport
          expect(boundingBox.width).toBeLessThanOrEqual(viewport.width)
          expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width)
        }
      }
    }
    
    await testImageResponsiveness({ width: 375, height: 667 })
    await testImageResponsiveness({ width: 1200, height: 800 })
  })

  test('should handle text readability on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check main heading
    const mainHeading = page.getByRole('heading', { level: 1 }).first()
    if (await mainHeading.isVisible()) {
      const fontSize = await mainHeading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      )
      
      // Font size should be reasonable for mobile (at least 16px)
      const fontSizeValue = parseInt(fontSize.replace('px', ''))
      expect(fontSizeValue).toBeGreaterThanOrEqual(16)
    }
  })

  test('should handle horizontal scrolling prevention', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check if there's any horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = 375
    
    // Body scroll width should not exceed viewport width significantly
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 20) // Allow small margin
  })
})
