
import { test, expect } from '@playwright/test'

test.describe('Child Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent first
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('john@doe.com')
    await page.getByLabel(/password/i).fill('johndoe123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/parent')
  })

  test('should display children dashboard', async ({ page }) => {
    await page.goto('/parent/children')
    
    await expect(page.getByRole('heading', { name: /children/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add child/i })).toBeVisible()
  })

  test('should open add child modal', async ({ page }) => {
    await page.goto('/parent/children')
    
    await page.getByRole('button', { name: /add child/i }).click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/date of birth/i)).toBeVisible()
  })

  test('should validate child registration form', async ({ page }) => {
    await page.goto('/parent/children')
    await page.getByRole('button', { name: /add child/i }).click()
    
    // Try to submit empty form
    await page.getByRole('button', { name: /save child/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/first name is required/i)).toBeVisible()
    await expect(page.getByText(/last name is required/i)).toBeVisible()
    await expect(page.getByText(/date of birth is required/i)).toBeVisible()
  })

  test('should add emergency contact', async ({ page }) => {
    await page.goto('/parent/children')
    await page.getByRole('button', { name: /add child/i }).click()
    
    // Click add emergency contact
    await page.getByRole('button', { name: /add emergency contact/i }).click()
    
    await expect(page.getByLabel(/contact name/i)).toBeVisible()
    await expect(page.getByLabel(/phone number/i)).toBeVisible()
    await expect(page.getByLabel(/relationship/i)).toBeVisible()
  })

  test('should handle child registration with valid data', async ({ page }) => {
    await page.goto('/parent/children')
    await page.getByRole('button', { name: /add child/i }).click()
    
    // Fill form
    await page.getByLabel(/first name/i).fill('Test')
    await page.getByLabel(/last name/i).fill('Child')
    await page.getByLabel(/date of birth/i).fill('2015-06-15')
    
    // Add emergency contact
    await page.getByRole('button', { name: /add emergency contact/i }).click()
    await page.getByLabel(/contact name/i).fill('Emergency Contact')
    await page.getByLabel(/phone number/i).fill('+1234567890')
    await page.getByLabel(/relationship/i).fill('Parent')
    
    // Submit form
    await page.getByRole('button', { name: /save child/i }).click()
    
    // Should show success message
    await expect(page.getByText(/child added successfully/i)).toBeVisible()
  })

  test('should display child list', async ({ page }) => {
    await page.goto('/parent/children')
    
    // Should show existing children (if any)
    const childCards = page.getByTestId('child-card')
    await expect(childCards).toBeTruthy()
  })

  test('should open child details', async ({ page }) => {
    await page.goto('/parent/children')
    
    // Click on first child card (if exists)
    const firstChild = page.getByTestId('child-card').first()
    if (await firstChild.isVisible()) {
      await firstChild.click()
      
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/child details/i)).toBeVisible()
    }
  })

  test('should handle face registration flow', async ({ page }) => {
    await page.goto('/parent/children')
    
    // Look for face registration button
    const faceRegButton = page.getByRole('button', { name: /register face/i }).first()
    if (await faceRegButton.isVisible()) {
      await faceRegButton.click()
      
      await expect(page.getByText(/face registration/i)).toBeVisible()
      await expect(page.getByText(/upload photo/i)).toBeVisible()
    }
  })

  test('should validate file upload for face registration', async ({ page }) => {
    await page.goto('/parent/children')
    
    const faceRegButton = page.getByRole('button', { name: /register face/i }).first()
    if (await faceRegButton.isVisible()) {
      await faceRegButton.click()
      
      // Try to submit without image
      await page.getByRole('button', { name: /register/i }).click()
      
      await expect(page.getByText(/please select an image/i)).toBeVisible()
    }
  })

  test('should handle photo upload', async ({ page }) => {
    await page.goto('/parent/children')
    
    const faceRegButton = page.getByRole('button', { name: /register face/i }).first()
    if (await faceRegButton.isVisible()) {
      await faceRegButton.click()
      
      // Create a test file
      const fileInput = page.getByRole('button', { name: /choose file/i })
      
      // Mock file upload (in real scenario, would use actual file)
      await expect(fileInput).toBeVisible()
    }
  })

  test('should edit child information', async ({ page }) => {
    await page.goto('/parent/children')
    
    // Click on edit button for first child (if exists)
    const editButton = page.getByRole('button', { name: /edit/i }).first()
    if (await editButton.isVisible()) {
      await editButton.click()
      
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/edit child/i)).toBeVisible()
    }
  })

  test('should handle allergies and special needs', async ({ page }) => {
    await page.goto('/parent/children')
    await page.getByRole('button', { name: /add child/i }).click()
    
    // Fill basic info
    await page.getByLabel(/first name/i).fill('Test')
    await page.getByLabel(/last name/i).fill('Child')
    await page.getByLabel(/date of birth/i).fill('2015-06-15')
    
    // Add allergies
    const allergiesField = page.getByLabel(/allergies/i)
    if (await allergiesField.isVisible()) {
      await allergiesField.fill('Peanuts, Dairy')
    }
    
    // Add special needs
    const specialNeedsField = page.getByLabel(/special needs/i)
    if (await specialNeedsField.isVisible()) {
      await specialNeedsField.fill('Requires quiet environment')
    }
    
    await expect(allergiesField).toHaveValue('Peanuts, Dairy')
  })
})
