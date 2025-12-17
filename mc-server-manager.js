import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const app = express();
const port = 3000;

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Server Configurations ---
// Use placeholders for dynamic values: $NAME, $PORT, $PROTOCOL
const SERVER_CONFIGS = {
    // Standard Java Edition Minecraft Server: Default port 25565
    'minecraft-java': {
        image: 'itzg/minecraft-server',
        containerPort: 25565,
        protocol: '', // TCP is default
        command: 'docker run -d --name $NAME -p $PORT:$CONTAINER_PORT $EULA_ENV $IMAGE'
    },
    // Bedrock Edition Minecraft Server: Default port 19132 (UDP)
    'minecraft-bedrock': {
        image: 'itzg/minecraft-bedrock-server',
        containerPort: 19132,
        protocol: '/udp',
        command: 'docker run -d --name $NAME -p $PORT:$CONTAINER_PORT$PROTOCOL $EULA_ENV -v mc-bedrock-data:/data $IMAGE'
    }
};

// Middleware to serve static files (like your HTML)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * Executes a Docker command and returns a JSON response.
 * @param {string} command The full Docker command to execute.
 * @param {object} res The Express response object.
 */
async function executeDockerCommand(command, res) {
    console.log(`Executing command: ${command}`);
    try {
        const { stdout, stderr } = await execPromise(command);

        if (stderr && command.includes('ps') === false) {
             console.log(`Docker Status (via stderr): ${stderr.trim()}`);
        }
        
        return res.json({
            success: true,
            command: command,
            stdout: stdout.trim(),
            stderr: stderr.trim()
        });
    } catch (error) {
        console.error(`Error executing ${command}:`, error.message);
        return res.status(500).json({
            success: false,
            command: command,
            message: `Docker command failed: ${error.message}`,
            details: error.stderr ? error.stderr.trim() : 'N/A'
        });
    }
}

// --- API Endpoints ---

// 1. List running containers (UPDATED FILTER)
app.get('/api/containers', (req, res) => {
    // Filter by image name to show only Minecraft servers (Java or Bedrock).
    // The '--filter' flag can be repeated for an OR condition.
    // However, if we filter for specific images, we must also ensure the manager 
    // container (node:alpine) is included in the output so the client can disable its buttons.
    
    // Simplest approach: Filter for the two target images explicitly.
    // Since the manager container uses 'node:alpine', it won't be included,
    // which is what we want for this API call. The client-side logic will 
    // need to adjust to look for the manager container in ALL docker ps output
    // if it were to be included, but for now, we only show the managed servers.
    // If you need the manager container in the list, you would run 'docker ps -a' 
    // and let the client filter. Sticking to management for now:

    const filterCommand = 
        `docker ps -a --filter "ancestor=${SERVER_CONFIGS['minecraft-java'].image}" ` +
        `--filter "ancestor=${SERVER_CONFIGS['minecraft-bedrock'].image}"`;
        
    executeDockerCommand(filterCommand, res);
});

// 2. Create a new server container (UPDATED to use image from config)
app.post('/api/create', (req, res) => {
    const { type, name, port } = req.body;
    const config = SERVER_CONFIGS[type];
    
    if (!config) return res.status(400).json({ success: false, message: 'Invalid server type specified.' });
    if (!name || !port) return res.status(400).json({ success: false, message: 'Container name and port are required.' });
    
    // Validate port is a number
    const hostPort = parseInt(port);
    if (isNaN(hostPort) || hostPort <= 0 || hostPort > 65535) {
        return res.status(400).json({ success: false, message: 'Invalid host port number specified.' });
    }
    
    // Construct the command using template literals and replacements
    let command = config.command
        .replace('$NAME', name)
        .replace('$PORT', hostPort)
        .replace('$CONTAINER_PORT', config.containerPort)
        .replace('$PROTOCOL', config.protocol)
        .replace('$EULA_ENV', '-e EULA=TRUE')
        .replace('$IMAGE', config.image);

    // Execute the constructed command
    executeDockerCommand(command, res);
});

// 3. Remove a container (same as before)
app.post('/api/remove', (req, res) => {
    const containerId = req.body.id;
    if (!containerId) return res.status(400).json({ success: false, message: 'Container ID is required.' });
    executeDockerCommand(`docker rm -f ${containerId}`, res);
});

// 4. Stop a container (same as before)
app.post('/api/stop', (req, res) => {
    const containerId = req.body.id;
    if (!containerId) return res.status(400).json({ success: false, message: 'Container ID is required.' });
    executeDockerCommand(`docker stop ${containerId}`, res);
});

// 5. Start a container (same as before)
app.post('/api/start', (req, res) => {
    const containerId = req.body.id;
    if (!containerId) return res.status(400).json({ success: false, message: 'Container ID is required.' });
    executeDockerCommand(`docker start ${containerId}`, res);
});

// 6. Restart a container (same as before)
app.post('/api/restart', (req, res) => {
    const containerId = req.body.id;
    if (!containerId) return res.status(400).json({ success: false, message: 'Container ID is required.' });
    executeDockerCommand(`docker restart ${containerId}`, res);
});


// Start the server (same as before)
app.listen(port, () => {
    console.log(`\n🚀 Docker Manager Web Server running at http://localhost:${port}`);
    console.log('Mount the socket and expose port 3000 to access the UI.');
});