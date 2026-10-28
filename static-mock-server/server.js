const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const PORT = 7000;
const DATA_FILE_PATH = path.join(__dirname, 'mock-data', 'todos.json');
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { ...JSON_HEADERS, ...CORS_HEADERS });
    res.end(JSON.stringify(payload));
}

function loadDefaultTodos() {
    try {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error('Mock data file must contain an array.');
        }

        return parsed.map((item) => ({
            id: Number(item.id),
            name: typeof item.name === 'string' ? item.name : '',
            date: typeof item.date === 'string' ? item.date : '',
            description: typeof item.description === 'string' ? item.description : '',
        }));
    } catch (error) {
        console.error(`Failed to load mock data from ${DATA_FILE_PATH}:`, error.message);
        return [];
    }
}

function normalizeName(name) {
    return typeof name === 'string' ? name.trim() : '';
}

function normalizeTodoPayload(payload, { requireName }) {
    const normalized = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
        normalized.name = normalizeName(payload.name);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'date')) {
        normalized.date = typeof payload.date === 'string' ? payload.date : '';
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
        normalized.description = typeof payload.description === 'string' ? payload.description.trim() : '';
    }

    if (requireName && !normalized.name) {
        return { error: 'The "name" field is required.' };
    }

    if (Object.prototype.hasOwnProperty.call(normalized, 'name') && !normalized.name) {
        return { error: 'The "name" field cannot be empty.' };
    }

    return { data: normalized };
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1_000_000) {
                reject(new Error('Request body too large.'));
                req.destroy();
            }
        });
        req.on('end', () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error('Invalid JSON payload.'));
            }
        });
        req.on('error', () => reject(new Error('Could not read request body.')));
    });
}

let todos = loadDefaultTodos();
let nextId = todos.reduce((max, todo) => Math.max(max, Number(todo.id) || 0), 0) + 1;

const server = http.createServer(async (req, res) => {
    if (!req.url || !req.method) {
        sendJson(res, 400, { error: 'Invalid request.' });
        return;
    }

    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = requestUrl.pathname;

    if (req.method === 'GET' && pathname === '/todos') {
        sendJson(res, 200, todos);
        return;
    }

    if (req.method === 'POST' && pathname === '/todos') {
        try {
            const payload = await readBody(req);
            const normalizedPayload = normalizeTodoPayload(payload, { requireName: true });

            if (normalizedPayload.error) {
                sendJson(res, 400, { error: normalizedPayload.error });
                return;
            }

            const newTodo = {
                id: nextId++,
                name: normalizedPayload.data.name,
                date: normalizedPayload.data.date || '',
                description: normalizedPayload.data.description || '',
            };

            todos = [newTodo, ...todos];
            sendJson(res, 201, newTodo);
            return;
        } catch (error) {
            sendJson(res, 400, { error: error.message });
            return;
        }
    }

    const todoPathMatch = pathname.match(/^\/todos\/([^/]+)$/);
    if (todoPathMatch) {
        const id = Number(todoPathMatch[1]);
        if (!Number.isFinite(id)) {
            sendJson(res, 400, { error: 'Invalid todo id.' });
            return;
        }

        const todoIndex = todos.findIndex((item) => item.id === id);
        if (todoIndex === -1) {
            sendJson(res, 404, { error: `Todo with id ${id} was not found.` });
            return;
        }

        if (req.method === 'GET') {
            sendJson(res, 200, todos[todoIndex]);
            return;
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
            try {
                const payload = await readBody(req);
                const normalizedPayload = normalizeTodoPayload(payload, { requireName: false });

                if (normalizedPayload.error) {
                    sendJson(res, 400, { error: normalizedPayload.error });
                    return;
                }

                const updatedTodo = {
                    ...todos[todoIndex],
                    ...normalizedPayload.data,
                };

                todos[todoIndex] = updatedTodo;
                sendJson(res, 200, updatedTodo);
                return;
            } catch (error) {
                sendJson(res, 400, { error: error.message });
                return;
            }
        }

        if (req.method === 'DELETE') {
            const [removed] = todos.splice(todoIndex, 1);
            sendJson(res, 200, removed);
            return;
        }
    }

    sendJson(res, 404, { error: 'Route not found.' });
});

server.listen(PORT, () => {
    console.log(`Mock to-do backend is running at http://localhost:${PORT}`);
});