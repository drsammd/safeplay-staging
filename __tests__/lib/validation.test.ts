
import { z } from 'zod'

// Test validation schemas
const childSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().refine(date => {
    const birthDate = new Date(date)
    const today = new Date()
    return birthDate < today
  }, 'Date of birth must be in the past'),
  allergies: z.array(z.string()).optional(),
})

const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['PARENT', 'VENUE_ADMIN', 'SUPER_ADMIN']),
})

describe('Validation Tests', () => {
  describe('Child validation', () => {
    it('should validate a valid child', () => {
      const validChild = {
        firstName: 'Alice',
        lastName: 'Johnson',
        dateOfBirth: '2015-06-15',
        allergies: ['Peanuts']
      }

      const result = childSchema.safeParse(validChild)
      expect(result.success).toBe(true)
    })

    it('should reject child with missing first name', () => {
      const invalidChild = {
        firstName: '',
        lastName: 'Johnson',
        dateOfBirth: '2015-06-15'
      }

      const result = childSchema.safeParse(invalidChild)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name is required')
      }
    })

    it('should reject child with future birth date', () => {
      const invalidChild = {
        firstName: 'Alice',
        lastName: 'Johnson',
        dateOfBirth: '2030-01-01'
      }

      const result = childSchema.safeParse(invalidChild)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Date of birth must be in the past')
      }
    })
  })

  describe('User validation', () => {
    it('should validate a valid user', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'John Doe',
        role: 'PARENT' as const
      }

      const result = userSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'John Doe',
        role: 'PARENT' as const
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format')
      }
    })

    it('should reject invalid role', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'John Doe',
        role: 'INVALID_ROLE'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })
})
