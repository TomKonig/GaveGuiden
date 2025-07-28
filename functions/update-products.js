const { Octokit } = require("@octokit/rest");
const { requireAuth } = require('./utils/auth-middleware');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const REPO_NAME = process.env.GITHUB_REPO_NAME;
const FILE_PATH = 'assets/products.json';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { content } = JSON.parse(event.body);
        if (!content) {
            return { statusCode: 400, body: 'Bad Request: Missing content.' };
        }

        // --- Stricter Validation ---
        try {
            JSON.parse(content);
        } catch (e) {
            return { statusCode: 400, body: 'Bad Request: Content is not valid JSON.' };
        }

        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

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

exports.handler = requireAuth(handler);
