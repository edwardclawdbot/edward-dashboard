const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

let currentStatus = {
    working: { title: "Initializing...", detail: "Setting up dashboard" },
    lastUpdated: new Date().toISOString(),
    lastActivity: new Date().toISOString()
};

function loadTasks() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'tasks.json'), 'utf8'));
    } catch (e) {
        return { working: {}, todo: [], queue: [], done: [] };
    }
}

function saveTasks(data) {
    fs.writeFileSync(path.join(__dirname, 'tasks.json'), JSON.stringify(data, null, 2));
}

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css'
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // SSE endpoint for real-time updates
    if (url.pathname === '/stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
        const interval = setInterval(() => {
            res.write(`: heartbeat\n\n`);
        }, 30000);
        req.on('close', () => clearInterval(interval));
        return;
    }
    
    // API to update current status
    if (url.pathname === '/api/status' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                currentStatus = {
                    ...currentStatus,
                    ...data,
                    lastUpdated: new Date().toISOString(),
                    lastActivity: new Date().toISOString()
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    
    // API to update tasks
    if (url.pathname === '/api/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                saveTasks(data);
                currentStatus.lastActivity = new Date().toISOString();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    
    // API to get current status
    if (url.pathname === '/api/status') {
        const tasks = loadTasks();
        currentStatus.working = tasks.working || currentStatus.working;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(currentStatus));
        return;
    }
    
    // Serve static files
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🌐 Dashboard running at http://localhost:${PORT}`);
});
