const jwt = require('jsonwebtoken');
const cookie = require('cookie');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { password } = JSON.parse(event.body);
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminPassword || !jwtSecret) {
        console.error('ADMIN_PASSWORD or JWT_SECRET environment variable not set.');
        return { statusCode: 500, body: 'Server configuration error.' };
    }

    if (password === adminPassword) {
      const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '8h' });
      
      const sessionCookie = cookie.serialize('auth_token', token, {
          httpOnly: true, // The cookie is not accessible via JavaScript
          secure: process.env.NODE_ENV === 'production', // Only send over HTTPS
          path: '/',
          maxAge: 60 * 60 * 8 // 8 hours
      });

      return {
        statusCode: 200,
        headers: { 
            'Set-Cookie': sessionCookie,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ message: 'Login successful' }),
      };
    } else {
      return { statusCode: 401, body: 'Invalid password' };
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
