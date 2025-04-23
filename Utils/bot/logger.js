/**
 * GNOME Nepal Discord Bot - Logger Utility
 * =======================================
 * This file provides a centralized logging utility for the bot.
 */
const { WebhookClient, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load config
let config = {};
try {
    const configPath = path.join(__dirname, '../../config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
} catch (err) {
    console.error('Failed to load config for logger:', err);
}

// Store original console methods
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
};

// Initialize webhook client if URL is available
let webhook = null;
try {
    if (config.Bot_DevLog_Webhook_URL) {
        webhook = new WebhookClient({ url: config.Bot_DevLog_Webhook_URL });
    }
} catch (err) {
    originalConsole.error('Failed to initialize Discord webhook:', err);
}

// Buffer to collect logs before sending
const logBuffer = {
    messages: [],
    lastSent: Date.now()
};

// Store recent message hashes to prevent duplicates
const recentMessageHashes = new Set();
const MAX_RECENT_MESSAGES = 100;

/**
 * Creates a simple hash for a message to identify duplicates
 * @param {string} msg - The message to hash
 * @returns {string} A string hash
 */
function createMessageHash(msg) {
    if (typeof msg !== 'string') return '';
    
    // Create a basic hash from the message content
    // Focus on the core content by trimming and removing timestamps
   const cleanMsg = msg.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '')
                     .replace(/\x1B\[\d+m/g, '')
                        .trim();
    
    // For large messages, just use a portion to avoid expensive operations
    const hashContent = cleanMsg.length > 100 
        ? cleanMsg.substring(0, 50) + cleanMsg.substring(cleanMsg.length - 50)
        : cleanMsg;
    
    // Simple string-based hash
    let hash = 0;
    for (let i = 0; i < hashContent.length; i++) {
        hash = ((hash << 5) - hash) + hashContent.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return `${hash}`;
}

/**
 * Clean out expired message hashes periodically
 */
function cleanupMessageHashes() {
    // If we have too many hashes, clear some of the oldest
    if (recentMessageHashes.size > MAX_RECENT_MESSAGES) {
        // Just reset it entirely after it gets too large
        recentMessageHashes.clear();
    }
}

// Set up periodic hash cleanup
setInterval(cleanupMessageHashes, 60000);

/**
 * Determines if a message is likely a large formatted table output
 * @param {string} message - Message to check
 * @returns {boolean} True if it seems to be a large formatted table
 */
function isLargeFormattedOutput(message) {
    if (typeof message !== 'string') return false;
    
    // Check for common table patterns
    return (
        (message.includes('┌─') && message.includes('┬─') && message.includes('┐')) ||
        (message.includes('│') && message.includes('├─') && message.includes('┤')) ||
        (message.includes('└─') && message.includes('┴─') && message.includes('┘'))
    );
}

/**
 * Create a more compact representation of table data for Discord
 * @param {string} tableString - The table string to format
 * @returns {string} A Discord-friendly representation
 */
function formatTableForDiscord(tableString) {
    // If it's not actually a table or it's small enough, return as is
    if (!isLargeFormattedOutput(tableString) || tableString.length < 1500) {
        return tableString;
    }
    
    try {
        // Extract meaningful data from the table and format as compact JSON/list
        const lines = tableString.split('\n');
        const relevantData = lines
            .filter(line => !line.includes('─') && !line.includes('┌') && !line.includes('┐') && 
                    !line.includes('└') && !line.includes('┘') && line.includes('│'))
            .map(line => {
                // Extract actual content from the table cells
                return line.split('│')
                    .map(cell => cell.trim())
                    .filter(cell => cell.length > 0)
                    .join(' | ');
            })
            .join('\n');
            
        return `[Table Summary]\n${relevantData}`;
    } catch (err) {
        originalConsole.error('Failed to format table for Discord:', err);
        return `[Large Table - ${tableString.length} chars]`;
    }
}

/**
 * Process and send buffered logs to Discord
 */
async function processLogBuffer() {
    if (!webhook || logBuffer.messages.length === 0) return;

    try {
        const now = Date.now();
        const timeSinceLastSend = now - logBuffer.lastSent;

        // Only send if buffer has entries and either enough time has passed or buffer is getting large
        if (logBuffer.messages.length > 0 && (timeSinceLastSend >= 60000 || logBuffer.messages.length >= 15)) {
            // Combine messages into chunks of max 1900 chars
            const chunks = [];
            let currentChunk = "";

            for (const msg of logBuffer.messages) {
                let processedMsg = msg;
                
                // Check if this is a large formatted output and handle specially
                if (msg.length > 1000 && isLargeFormattedOutput(msg)) {
                    processedMsg = formatTableForDiscord(msg);
                }
                
                // If adding this message would exceed the limit, start a new chunk
                if ((currentChunk + processedMsg).length > 1900) {
                    if (currentChunk) chunks.push(currentChunk);
                    currentChunk = processedMsg;
                } else {
                    currentChunk += (currentChunk ? "\n" : "") + processedMsg;
                }
            }

            // Add the last chunk if it has content
            if (currentChunk) chunks.push(currentChunk);

            // Send each chunk
            for (const chunk of chunks) {
                if (chunk.length > 2000) {
                    // If still too large, break it down further or truncate
                    const truncatedChunk = chunk.substring(0, 1950) + "\n... [content truncated]";
                    await webhook.send({
                        content: '```yaml\n' + truncatedChunk + '\n```',
                    });
                } else {
                    await webhook.send({
                        content: '```prolog\n' + chunk + '\n```',
                        username: 'Bot Logger'
                    });
                }

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Reset buffer after sending
            logBuffer.messages = [];
            logBuffer.lastSent = now;
        }
    } catch (err) {
        // Use original console to avoid infinite loops
        originalConsole.error('Failed to process log buffer:', err);
    }
}

// Set up periodic processing
setInterval(processLogBuffer, 15000);

/**
 * Add a log message to the buffer
 * @param {string} level - Log level
 * @param {string} message - Message to send
 */
function addToBuffer(level, message) {
    const timestamp = new Date().toISOString();

    // Clean ANSI color codes if present
    let cleanMessage = message;
    if (typeof message === 'string') {
        cleanMessage = message.replace(/\x1B\[\d+m/g, '');
    }

    // Format the full log entry
    const logEntry = `[${timestamp}] [${level}] ${cleanMessage}`;
    
    // Check for duplicates
    const msgHash = createMessageHash(logEntry);
    if (msgHash && recentMessageHashes.has(msgHash)) {
        // Skip duplicate message
        return;
    }
    
    // Add hash to recent set
    if (msgHash) {
        recentMessageHashes.add(msgHash);
    }
    
    logBuffer.messages.push(logEntry);

    // Process immediately for errors
    if (level === 'ERROR') {
        processLogBuffer();
    }
}

/**
 * Send a special formatted message directly (for important events)
 * @param {string} title - Title of the embed
 * @param {string} description - Description text
 * @param {string} color - Color hex code
 */
async function sendEmbed(title, description, color = '#0099ff') {
    if (!webhook) return;

    try {
        // Create a hash to check for duplicates
        const embedHash = createMessageHash(`${title}:${description.substring(0, 100)}`);
        
        // Skip if this is a duplicate embed
        if (embedHash && recentMessageHashes.has(embedHash)) {
            return;
        }
        
        // Add hash to prevent duplicates
        if (embedHash) {
            recentMessageHashes.add(embedHash);
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description.length > 4000 ? description.substring(0, 4000) + '...' : description)
            .setColor(color)
            .setTimestamp();

        await webhook.send({ embeds: [embed] });
    } catch (err) {
        originalConsole.error('Failed to send embed to Discord:', err);
    }
}

/**
 * Log an informational message
 * @param {string} msg - The message to log
 */
function log(msg) {
    originalConsole.log('[INFO]', msg);
    addToBuffer('INFO', msg);
}

/**
 * Log a warning message
 * @param {string} msg - The message to log
 */
function warn(msg) {
    originalConsole.warn('[WARN]', msg);
    addToBuffer('WARN', msg);
}

/**
 * Log an error message
 * @param {string} msg - The message to log
 */
function error(msg) {
    originalConsole.error('[ERROR]', msg);
    addToBuffer('ERROR', msg);
}

/**
 * Log a success message
 * @param {string} msg - The message to log
 */
function success(msg) {
    originalConsole.log('[OK]', msg);
    addToBuffer('OK', msg);
}

/**
 * Log a debug message (only in development)
 * @param {string} msg - The message to log
 */
function debug(msg) {
    if (process.env.NODE_ENV === 'development') {
        originalConsole.log('[DEBUG]', msg);
        addToBuffer('DEBUG', msg);
    }
}

// Initialize by overriding global console methods to capture all output
function initGlobalCapture() {
    console.log = (message, ...args) => {
        originalConsole.log(message, ...args);
        addToBuffer('LOG', [message, ...args].join(' '));
    };

    console.warn = (message, ...args) => {
        originalConsole.warn(message, ...args);
        addToBuffer('WARN', [message, ...args].join(' '));
    };

    console.error = (message, ...args) => {
        originalConsole.error(message, ...args);
        addToBuffer('ERROR', [message, ...args].join(' '));
    };

    console.info = (message, ...args) => {
        originalConsole.info(message, ...args);
        addToBuffer('INFO', [message, ...args].join(' '));
    };

    console.debug = (message, ...args) => {
        originalConsole.debug(message, ...args);
        if (process.env.NODE_ENV === 'development') {
            addToBuffer('DEBUG', [message, ...args].join(' '));
        }
    };
}

module.exports = {
    log,
    warn,
    error,
    success,
    debug,
    sendEmbed,
    initGlobalCapture
};

