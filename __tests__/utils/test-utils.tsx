
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Mock session data
export const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'PARENT',
  },
  expires: '2024-12-31',
}

export const mockVenueAdminSession = {
  user: {
    id: 'venue-admin-123',
    email: 'admin@venue.com',
    name: 'Venue Admin',
    role: 'VENUE_ADMIN',
    venueId: 'venue-123',
  },
  expires: '2024-12-31',
}

export const mockCompanyAdminSession = {
  user: {
    id: 'company-admin-123',
    email: 'admin@company.com',
    name: 'Company Admin',
    role: 'COMPANY_ADMIN',
  },
  expires: '2024-12-31',
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
  theme?: 'light' | 'dark'
}

const AllTheProviders = ({ 
  children, 
  session, 
  theme = 'light' 
}: { 
  children: React.ReactNode
  session?: any
  theme?: 'light' | 'dark'
}) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme={theme} 
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { session, theme, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders session={session} theme={theme}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Test data factories
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg') => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: 1024 })
  return file
}

export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value)
    } else {
      formData.append(key, String(value))
    }
  })
  return formData
}

// Mock API responses
export const mockApiResponse = <T,>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

export const mockApiError = (message: string, status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message }),
})

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  })
  window.IntersectionObserver = mockIntersectionObserver
}

// Mock resize observer
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn()
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  })
  window.ResizeObserver = mockResizeObserver
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }
