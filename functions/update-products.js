const jwt = require('jsonwebtoken');
const { Octokit } = require("@octokit/rest");

const JWT_SECRET = process.env.JWT_SECRET;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const REPO_NAME = process.env.GITHUB_REPO_NAME;
const FILE_PATH = 'assets/products.json';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

exports.handler = async (event) => {
    // 1. Authentication and Authorization
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return { statusCode: 401, body: 'Invalid token' };
    }

    // 2. Get the new file content from the request
    const { content } = JSON.parse(event.body);
    if (!content) {
        return { statusCode: 400, body: 'Bad Request: Missing content.' };
    }

    try {
        // 3. Get the current file from GitHub to get its SHA hash
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

        // 4. Commit the updated file to the repository
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: `feat: Update products.json via admin panel [skip ci]`,
            content: Buffer.from(content).toString('base64'),
            sha: fileData.sha,
            committer: {
                name: 'GaveGuiden Bot',
                email: 'bot@gaveguiden.dk'
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Products updated successfully! Changes will be live in a minute.' }),
        };
    } catch (error) {
        console.error('GitHub API Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to update products.json on GitHub.' }),
        };
    }
};
