const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { password } = JSON.parse(event.body);
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        console.error('ADMIN_PASSWORD environment variable not set.');
        return { statusCode: 500, body: 'Server configuration error.' };
    }

    if (password === adminPassword) {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
      return {
        statusCode: 200,
        body: JSON.stringify({ token }),
        headers: { 'Content-Type': 'application/json' },
      };
    } else {
      return { statusCode: 401, body: 'Invalid password' };
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
