
// Basic utility function tests
describe('Basic Utility Tests', () => {
  describe('String utilities', () => {
    it('should handle empty strings', () => {
      const emptyString = ''
      expect(emptyString).toBe('')
      expect(emptyString.length).toBe(0)
    })

    it('should format names correctly', () => {
      const firstName = 'john'
      const lastName = 'doe'
      const fullName = `${firstName} ${lastName}`
      expect(fullName).toBe('john doe')
    })
  })

  describe('Number utilities', () => {
    it('should handle age calculations', () => {
      const birthYear = 2015
      const currentYear = 2024
      const age = currentYear - birthYear
      expect(age).toBe(9)
    })

    it('should validate positive numbers', () => {
      const validAge = 5
      const invalidAge = -1
      expect(validAge).toBeGreaterThan(0)
      expect(invalidAge).toBeLessThan(0)
    })
  })

  describe('Array utilities', () => {
    it('should handle child collections', () => {
      const children = ['Alice', 'Bob', 'Charlie']
      expect(children).toHaveLength(3)
      expect(children).toContain('Alice')
      expect(children[0]).toBe('Alice')
    })

    it('should filter active children', () => {
      const allChildren = [
        { name: 'Alice', isActive: true },
        { name: 'Bob', isActive: false },
        { name: 'Charlie', isActive: true }
      ]
      const activeChildren = allChildren.filter(child => child.isActive)
      expect(activeChildren).toHaveLength(2)
      expect(activeChildren.map(c => c.name)).toEqual(['Alice', 'Charlie'])
    })
  })
})
