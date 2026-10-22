import fs from 'node:fs';
import path from 'node:path';

const logDirectory = path.resolve(__dirname, '..', '..', 'logs');
fs.mkdirSync(logDirectory, { recursive: true });

const logFile = path.join(logDirectory, 'server.log');
const fileStream = fs.createWriteStream(logFile, { flags: 'a' });

export const accessLogStream = {
    write(message: string) {
        process.stdout.write(message);
        fileStream.write(message);
    },
};

function write(level: string, message: string, error?: unknown) {
    const suffix = error instanceof Error
        ? ` ${error.stack || error.message}`
        : error === undefined
            ? ''
            : ` ${String(error)}`;
    const line = `${new Date().toISOString()} [${level}] ${message}${suffix}\n`;

    process.stdout.write(line);
    fileStream.write(line);
}

export const logger = {
    info: (message: string) => write('INFO', message),
    error: (message: string, error?: unknown) => write('ERROR', message, error),
};
