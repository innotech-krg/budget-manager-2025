#!/usr/bin/env node

/**
 * Budget Manager 2025 - Development Manager
 * Robuste Lösung für Terminal-Hänger und Prozess-Management
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class DevManager {
    constructor() {
        this.processes = new Map();
        this.isShuttingDown = false;
        this.setupSignalHandlers();
    }

    setupSignalHandlers() {
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
        process.on('uncaughtException', (error) => {
            console.error('🔥 Uncaught Exception:', error);
            this.shutdown();
        });
    }

    async killExistingProcesses() {
        console.log('🧹 Cleaning up existing processes...');
        
        try {
            // Kill all node processes related to our project
            await execAsync('pkill -f "node.*server.js" || true');
            await execAsync('pkill -f "npm.*run.*dev" || true');
            await execAsync('pkill -f "vite" || true');
            await execAsync('pkill -f "pdftocairo" || true');
            
            // Wait for processes to die
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.warn('⚠️ Cleanup warning:', error.message);
        }
    }

    async checkPorts() {
        const ports = [3000, 3001];
        const busyPorts = [];
        
        for (const port of ports) {
            try {
                const { stdout } = await execAsync(`lsof -ti:${port}`);
                if (stdout.trim()) {
                    busyPorts.push(port);
                    await execAsync(`kill -9 ${stdout.trim()}`);
                }
            } catch (error) {
                // Port is free
            }
        }
        
        if (busyPorts.length > 0) {
            console.log(`🔧 Freed ports: ${busyPorts.join(', ')}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    startProcess(name, command, args, cwd, timeout = 30000) {
        return new Promise((resolve, reject) => {
            console.log(`🚀 Starting ${name}...`);
            
            const child = spawn(command, args, {
                cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, FORCE_COLOR: '1' }
            });

            let output = '';
            let hasStarted = false;
            
            const timeoutId = setTimeout(() => {
                if (!hasStarted) {
                    console.error(`❌ ${name} timeout after ${timeout}ms`);
                    child.kill('SIGKILL');
                    reject(new Error(`${name} startup timeout`));
                }
            }, timeout);

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                // Backend ready indicators
                if (name === 'Backend' && (
                    text.includes('Server läuft auf Port') ||
                    text.includes('Budget Manager 2025 API ist betriebsbereit')
                )) {
                    hasStarted = true;
                    clearTimeout(timeoutId);
                    console.log(`✅ ${name} started successfully`);
                    resolve(child);
                }
                
                // Frontend ready indicators
                if (name === 'Frontend' && (
                    text.includes('Local:') ||
                    text.includes('ready in')
                )) {
                    hasStarted = true;
                    clearTimeout(timeoutId);
                    console.log(`✅ ${name} started successfully`);
                    resolve(child);
                }
                
                // Log important messages
                if (text.includes('error') || text.includes('Error')) {
                    console.error(`🔥 ${name}:`, text.trim());
                }
            });

            child.stderr.on('data', (data) => {
                const text = data.toString();
                console.error(`🔥 ${name} Error:`, text.trim());
            });

            child.on('exit', (code) => {
                if (!hasStarted) {
                    clearTimeout(timeoutId);
                    reject(new Error(`${name} exited with code ${code}`));
                }
                console.log(`💀 ${name} exited with code ${code}`);
                this.processes.delete(name);
            });

            this.processes.set(name, child);
        });
    }

    async start() {
        try {
            console.log('🎯 Budget Manager 2025 - Development Manager');
            console.log('================================================');
            
            // Step 1: Cleanup
            await this.killExistingProcesses();
            await this.checkPorts();
            
            // Step 2: Start Backend
            const backendProcess = await this.startProcess(
                'Backend',
                'node',
                ['src/server.js'],
                '/Users/krg/projects/innotech/bdgt/backend'
            );
            
            // Step 3: Wait a bit and test backend
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
                const { stdout } = await execAsync('curl -s http://localhost:3001/health');
                if (stdout.includes('"status":"OK"')) {
                    console.log('✅ Backend health check passed');
                } else {
                    throw new Error('Backend health check failed');
                }
            } catch (error) {
                console.error('❌ Backend health check failed:', error.message);
                throw error;
            }
            
            // Step 4: Start Frontend
            const frontendProcess = await this.startProcess(
                'Frontend',
                'npm',
                ['run', 'dev'],
                '/Users/krg/projects/innotech/bdgt/frontend'
            );
            
            console.log('🎉 All services started successfully!');
            console.log('📱 Frontend: http://localhost:3000');
            console.log('🔧 Backend: http://localhost:3001');
            console.log('');
            console.log('Press Ctrl+C to stop all services');
            
            // Keep alive
            return new Promise(() => {});
            
        } catch (error) {
            console.error('💥 Startup failed:', error.message);
            await this.shutdown();
            process.exit(1);
        }
    }

    async shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        console.log('\n🛑 Shutting down services...');
        
        for (const [name, process] of this.processes) {
            console.log(`💀 Stopping ${name}...`);
            process.kill('SIGTERM');
            
            // Force kill after 5 seconds
            setTimeout(() => {
                if (!process.killed) {
                    process.kill('SIGKILL');
                }
            }, 5000);
        }
        
        // Final cleanup
        await this.killExistingProcesses();
        console.log('✅ Shutdown complete');
        process.exit(0);
    }

    async status() {
        console.log('📊 Service Status Check');
        console.log('======================');
        
        // Check Backend
        try {
            const { stdout } = await execAsync('curl -s http://localhost:3001/health');
            if (stdout.includes('"status":"OK"')) {
                console.log('✅ Backend: Running (Port 3001)');
            } else {
                console.log('❌ Backend: Not responding');
            }
        } catch (error) {
            console.log('❌ Backend: Not running');
        }
        
        // Check Frontend
        try {
            const { stdout } = await execAsync('curl -s http://localhost:3000');
            if (stdout.includes('<title>')) {
                console.log('✅ Frontend: Running (Port 3000)');
            } else {
                console.log('❌ Frontend: Not responding');
            }
        } catch (error) {
            console.log('❌ Frontend: Not running');
        }
        
        // Check processes
        try {
            const { stdout } = await execAsync('ps aux | grep -E "(node.*server|npm.*dev|vite)" | grep -v grep');
            if (stdout.trim()) {
                console.log('\n🔍 Running processes:');
                console.log(stdout.trim());
            }
        } catch (error) {
            console.log('\n🔍 No development processes found');
        }
    }
}

// CLI Interface
const command = process.argv[2] || 'start';
const manager = new DevManager();

switch (command) {
    case 'start':
        manager.start();
        break;
    case 'stop':
        manager.killExistingProcesses().then(() => process.exit(0));
        break;
    case 'status':
        manager.status().then(() => process.exit(0));
        break;
    case 'restart':
        manager.killExistingProcesses()
            .then(() => new Promise(resolve => setTimeout(resolve, 2000)))
            .then(() => manager.start());
        break;
    default:
        console.log('Usage: node dev-manager.js [start|stop|status|restart]');
        process.exit(1);
}






