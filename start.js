import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function startProcess(name, cmd, args, cwd, color) {
  const proc = spawn(cmd, args, {
    cwd: path.resolve(__dirname, cwd),
    stdio: 'inherit',
    shell: false,
    env: { ...process.env }
  });
  proc.on('error', (err) => console.error(`[${name}] Error:`, err.message));
  proc.on('exit', (code) => {
    if (code !== 0) console.error(`[${name}] exited with code ${code}`);
  });
  return proc;
}

const nodeBin = process.execPath;

const server = startProcess(
  'server',
  nodeBin,
  [path.resolve(__dirname, 'node_modules/nodemon/bin/nodemon.js'), 'src/server.js'],
  'server'
);

const client = startProcess(
  'client',
  nodeBin,
  [path.resolve(__dirname, 'node_modules/vite/bin/vite.js'), '--host', '0.0.0.0', '--config', path.resolve(__dirname, 'client/vite.config.js')],
  'client'
);

process.on('SIGTERM', () => { server.kill(); client.kill(); });
process.on('SIGINT', () => { server.kill(); client.kill(); });
