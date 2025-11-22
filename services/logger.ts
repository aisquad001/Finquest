
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: any;
}

const LOG_STORAGE_KEY = 'racked_app_logs';
const MAX_LOGS = 100; // Keep size limited

class LoggerService {
    private logs: LogEntry[] = [];

    constructor() {
        this.loadLogs();
        
        // Capture global errors
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.error('Global Error', { message: event.message, filename: event.filename, lineno: event.lineno });
            });
            window.addEventListener('unhandledrejection', (event) => {
                this.error('Unhandled Promise Rejection', { reason: event.reason });
            });
        }
    }

    private loadLogs() {
        try {
            const stored = localStorage.getItem(LOG_STORAGE_KEY);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (e) {
            console.warn("Failed to load logs", e);
            this.logs = [];
        }
    }

    private saveLogs() {
        try {
            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            // If storage is full, clear half
            if (this.logs.length > 10) {
                this.logs = this.logs.slice(this.logs.length / 2);
                try {
                    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
                } catch (e2) {
                    console.error("Failed to save logs even after cleanup", e2);
                }
            }
        }
    }

    private addEntry(level: 'info' | 'warn' | 'error', message: string, details?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details: details ? (typeof details === 'object' ? JSON.stringify(details, Object.getOwnPropertyNames(details)) : String(details)) : undefined
        };

        this.logs.push(entry);
        
        // Rotation logic: overwrite oldest
        if (this.logs.length > MAX_LOGS) {
            this.logs.shift(); 
        }
        
        // Print to console for dev debugging
        const prefix = `[${level.toUpperCase()}]`;
        const style = level === 'error' ? 'color: red; font-weight: bold' : level === 'warn' ? 'color: orange' : 'color: #00C2FF';
        console.log(`%c${prefix} ${message}`, style, details || '');

        this.saveLogs();
    }

    info(message: string, details?: any) { this.addEntry('info', message, details); }
    warn(message: string, details?: any) { this.addEntry('warn', message, details); }
    error(message: string, details?: any) { this.addEntry('error', message, details); }

    getLogs() { 
        return [...this.logs].reverse(); // Newest first for UI
    }
    
    clearLogs() { 
        this.logs = []; 
        this.saveLogs(); 
    }
}

export const logger = new LoggerService();
