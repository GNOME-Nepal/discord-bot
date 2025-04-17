/**
 * GNOME Nepal Discord Bot - Logger Utility
 * =======================================
 * This file provides a centralized logging utility for the bot.
 */

/**
 * Log an informational message
 * @param {string} msg - The message to log
 */
function log(msg) {
    console.log('[INFO]', msg);
}

/**
 * Log a warning message
 * @param {string} msg - The message to log
 */
function warn(msg) {
    console.warn('[WARN]', msg);
}

/**
 * Log an error message
 * @param {string} msg - The message to log
 */
function error(msg) {
    console.error('[ERROR]', msg);
}

/**
 * Log a success message
 * @param {string} msg - The message to log
 */
function success(msg) {
    console.log('[OK]', msg);
}

/**
 * Log a debug message (only in development)
 * @param {string} msg - The message to log
 */
function debug(msg) {
    if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG]', msg);
    }
}

module.exports = {
    log,
    warn,
    error,
    success,
    debug
};
