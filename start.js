#!/usr/bin/env node

// 启动脚本 - 用于启动TypeScript版本的MCP服务器
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 启动编译后的服务器
const serverPath = join(__dirname, 'dist', 'server.js');
const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('error', (error) => {
  console.error('启动失败:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
