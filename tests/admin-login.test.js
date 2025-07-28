// tests/admin-login.test.js
const { handler } = require('../functions/admin-login');

describe('Admin Login Function', () => {

    // Set up mock environment variables before each test
    beforeEach(() => {
        process.env.ADMIN_PASSWORD = 'test-password';
        process.env.JWT_SECRET = 'test-secret';
    });

    // Clean up mock environment variables after each test
    afterEach(() => {
        delete process.env.ADMIN_PASSWORD;
        delete process.env.JWT_SECRET;
    });

    test('should return 200 and set a cookie for a correct password', async () => {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ password: 'test-password' }),
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        expect(response.headers['Set-Cookie']).toBeDefined();
        expect(response.headers['Set-Cookie']).toContain('auth_token=');
    });

    test('should return 401 for an incorrect password', async () => {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ password: 'wrong-password' }),
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(401);
        expect(response.body).toBe('Invalid password');
    });

    test('should return 405 for a non-POST method', async () => {
        const event = {
            httpMethod: 'GET',
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(405);
    });

    test('should return 500 if environment variables are not set', async () => {
        delete process.env.ADMIN_PASSWORD;

        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ password: 'test-password' }),
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(500);
        expect(response.body).toBe('Server configuration error.');
    });
});
