
import { clsx } from 'clsx'

// Mock utility functions for testing
const formatName = (firstName: string, lastName: string) => {
  return `${firstName} ${lastName}`.trim()
}

const calculateAge = (dateOfBirth: string) => {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const generateInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

describe('Utility Functions', () => {
  describe('formatName', () => {
    it('should format name correctly', () => {
      expect(formatName('John', 'Doe')).toBe('John Doe')
    })

    it('should handle empty strings', () => {
      expect(formatName('', 'Doe')).toBe('Doe')
      expect(formatName('John', '')).toBe('John')
      expect(formatName('', '')).toBe('')
    })

    it('should trim whitespace', () => {
      expect(formatName(' John ', ' Doe ')).toBe('John   Doe')
    })
  })

  describe('calculateAge', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should calculate age correctly', () => {
      // Set system time to January 1, 2024
      jest.setSystemTime(new Date('2024-01-01'))

      const age = calculateAge('2015-01-01')
      expect(age).toBe(9)
    })

    it('should handle birthday not yet reached this year', () => {
      // Set system time to June 1, 2024
      jest.setSystemTime(new Date('2024-06-01'))

      const age = calculateAge('2015-07-01')
      expect(age).toBe(8) // Birthday hasn't happened yet
    })

    it('should handle same day birthday', () => {
      // Set system time to July 1, 2024
      jest.setSystemTime(new Date('2024-07-01'))

      const age = calculateAge('2015-07-01')
      expect(age).toBe(9) // Birthday is today
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test@.com')).toBe(false)
    })
  })

  describe('generateInitials', () => {
    it('should generate initials correctly', () => {
      expect(generateInitials('John Doe')).toBe('JD')
      expect(generateInitials('Alice Marie Johnson')).toBe('AM')
      expect(generateInitials('Bob')).toBe('B')
    })

    it('should handle edge cases', () => {
      expect(generateInitials('')).toBe('')
      expect(generateInitials('a')).toBe('A')
      expect(generateInitials('a b c d e')).toBe('AB')
    })
  })

  describe('clsx integration', () => {
    it('should combine classes correctly', () => {
      const className = clsx('base-class', { 'active': true, 'disabled': false })
      expect(className).toBe('base-class active')
    })

    it('should handle conditional classes', () => {
      const isActive = false
      const className = clsx('btn', { 'btn-active': isActive })
      expect(className).toBe('btn')
    })
  })
})
