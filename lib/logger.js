// lib/logger.js — Cloud Friendly Structured Logger
const chalk = require('chalk');
const util = require('util');

// Helper untuk waktu Jakarta (WIB)
function getTimestamp() {
    return new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

module.exports = {
    info: (tag, msg) => {
        console.log(
            chalk.blue(`[${getTimestamp()}]`), 
            chalk.green.bold(`[${tag}]`), 
            typeof msg === 'object' ? util.format(msg) : msg
        );
    },
    warn: (tag, msg) => {
        console.log(
            chalk.yellow(`[${getTimestamp()}]`), 
            chalk.bgYellow.black(`[${tag}]`), 
            typeof msg === 'object' ? util.format(msg) : msg
        );
    },
    error: (tag, msg) => {
        console.log(
            chalk.red(`[${getTimestamp()}]`), 
            chalk.bgRed.white(`[${tag}]`), 
            typeof msg === 'object' ? util.format(msg) : msg
        );
    }
};