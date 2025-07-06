
export function validateBasicAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')

  const validUsername = process.env.BASIC_AUTH_USER || 'stakeholder'
  const validPassword = process.env.BASIC_AUTH_PASS || 'SafePlay2025Stakeholder!'

  return username === validUsername && password === validPassword
}

export function createAuthResponse(): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="mySafePlay Stakeholder Access"',
    },
  })
}
