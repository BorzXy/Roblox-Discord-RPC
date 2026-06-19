const RPC = require("discord-rpc");
const axios = require("axios");
const {
    execSync
} = require("child_process");
const fs = require("fs");
const path = require("path");

const client_id = "1517367902796386454"; // if error, you can change this to yours
const updaterpcitime = 5_000;            // and there is a assest folder for images
const idle_img = "idle_logo";

const cap = (msg) => msg.charAt(0).toUpperCase() + msg.slice(1);

const green = (msg) => `\x1b[32m[INFORMATION]\x1b[0m ${cap(msg)}`;
const yellow = (msg) => `\x1b[33m[DEBUG]\x1b[0m ${cap(msg)}`;
const red = (msg) => `\x1b[31m[ERROR]\x1b[0m ${cap(msg)}`;
const clientupdate = (msg) => `\x1b[33m[DEBUG]\x1b[0m ${cap(msg)}`;

const client = new RPC.Client({
    transport: "ipc"
});
let start_timestamp = null;
let current_place_id = null;

function get_roblox_process() {
    try {
        if (process.platform === "win32") {
            const out = execSync('tasklist /FI "IMAGENAME eq RobloxPlayerBeta.exe" /NH', {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "ignore"],
            });
            if (out.includes("RobloxPlayerBeta.exe")) return true;

            const out2 = execSync('tasklist /FI "IMAGENAME eq RobloxPlayer.exe" /NH', {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "ignore"],
            });
            return out2.includes("RobloxPlayer.exe");

        } else if (process.platform === "linux") {
            const out = execSync("pgrep -x RobloxPlayerBeta || pgrep -x RobloxPlayer", {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "ignore"],
            });
            return out.trim().length > 0;

        } else if (process.platform === "darwin") {
            const out = execSync("pgrep -x RobloxPlayer", {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "ignore"],
            });
            return out.trim().length > 0;
        }
    } catch {
        return false;
    }
    return false;
}

function get_log_data() {
    const log_paths = [];

    if (process.platform === "win32") {
        log_paths.push(
            `${process.env.LOCALAPPDATA}\\Roblox\\logs`,
            `${process.env.APPDATA}\\Roblox\\logs`
        );
    } else if (process.platform === "darwin") {
        log_paths.push(`${process.env.HOME}/Library/Logs/Roblox`);
    } else {
        log_paths.push(
            `${process.env.HOME}/.wine/drive_c/users/${process.env.USER}/AppData/Local/Roblox/logs`,
            `${process.env.HOME}/.var/app/org.winehq.Wine/data/wine/drive_c/users/${process.env.USER}/AppData/Local/Roblox/logs`
        );
    }

    for (const log_path of log_paths) {
        try {
            if (!fs.existsSync(log_path)) continue;
            const files = fs.readdirSync(log_path)
                .filter((f) => f.endsWith(".log"))
                .map((f) => ({ name: f, mtime: fs.statSync(path.join(log_path, f)).mtime }))
                .sort((a, b) => b.mtime - a.mtime);

            if (!files.length) continue;
            let content = null;
            let content_file = null;
            for (const file of files) {
                const c = fs.readFileSync(path.join(log_path, file.name), "utf8");
                if (/placeid:/i.test(c) || /"PlaceId"%3a/.test(c)) {
                    content = c;
                    content_file = file;
                    break;
                }
            }

            if (!content) continue;
            const file_age_minutes = (Date.now() - content_file.mtime) / 1000 / 60;
            if (file_age_minutes > 30) return null;

            for (const file of files) {
                // console.log(yellow(`Checking: ${file.name}`));
                const c = fs.readFileSync(path.join(log_path, file.name), "utf8");
                if (/placeid:/i.test(c) || /"PlaceId"%3a/.test(c)) {
                    content = c;
                    break;
                }
            }

            if (!content) continue;
            const all_matches = [];

            for (const m of content.matchAll(/\bplaceid:(\d+)/gi)) {
                all_matches.push({ index: m.index, id: m[1] });
            }
            for (const m of content.matchAll(/"PlaceId"%3a(\d+)/g)) {
                all_matches.push({ index: m.index, id: m[1] });
            }

            if (!all_matches.length) continue;
            all_matches.sort((a, b) => a.index - b.index);
            const last_place = all_matches[all_matches.length - 1].id;
            const user_match = content.match(/\buserid:(\d+)/i);
            return {
                place_id: last_place,
                user_id: user_match ? user_match[1] : null,
            };
        } catch (e) {
            console.log(red(`log read failed at ${log_path}: ${e.message}`));
            continue;
        }
    }
    return null;
}

async function get_game_info(place_id, user_id) {
    try {
        const universe_res = await axios.get(
            `https://apis.roblox.com/universes/v1/places/${place_id}/universe`, {
                timeout: 5000
            }
        );
        const universe_id = universe_res.data?.universeId;
        if (!universe_id) return null;

        const game_res = await axios.get(
            `https://games.roblox.com/v1/games?universeIds=${universe_id}`, {
                timeout: 5000
            }
        );
        const game = game_res.data?.data?.[0];
        if (!game) return null;

        const thumb_res = await axios.get(
            `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universe_id}&size=512x512&format=Png&isCircular=false`, {
                timeout: 5000
            }
        );
        const thumbnail = thumb_res.data?.data?.[0]?.imageUrl || null;

        let headshot = null;
        let username = null;

        if (user_id) {
            const head_res = await axios.get(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user_id}&size=150x150&format=Png&isCircular=false`, {
                    timeout: 5000
                }
            );
            headshot = head_res.data?.data?.[0]?.imageUrl || null;

            const user_res = await axios.get(
                `https://users.roblox.com/v1/users/${user_id}`, {
                    timeout: 5000
                }
            );
            username = user_res.data?.displayName || user_res.data?.name || null;
        }
        return {
            name: game.name,
            creator: game.creator?.name || "unknown",
            playing: game.playing || 0,
            place_id,
            universe_id,
            thumbnail,
            headshot,
            username,
        };
    } catch (err) {
        console.log(red(`failed to fetch game info: ${err.message}`));
        return null;
    }
}

async function update_presence() {
    const is_running = get_roblox_process();
    if (!is_running) {
        console.log(yellow("roblox is not running - clearing presence"));
        try {
            await client.clearActivity();
        } catch {}
        start_timestamp = null;
        current_place_id = null;
        return;
    }
    if (!start_timestamp) {
        start_timestamp = new Date();
        console.log(clientupdate("roblox detected - starting tracker"));
    }

    const log_data = get_log_data();
    const place_id = log_data?.place_id || null;
    const user_id = log_data?.user_id || null;
    let game_info = null;

    if (place_id) {
        if (place_id !== current_place_id) {
            console.log(clientupdate(`place id changed: ${place_id} | user id: ${user_id}`));
            current_place_id = place_id;
        }
        game_info = await get_game_info(place_id, user_id);
    }

    const activity = {
        startTimestamp: start_timestamp,
        largeImageKey: idle_img,
        largeImageText: "Main Menu",
        instance: false,
    };

    if (game_info) {
        activity.details = game_info.name;
        activity.state = `by ${game_info.creator} - ${game_info.playing.toLocaleString()} playing`;
        activity.largeImageKey = game_info.thumbnail;
        activity.largeImageText = game_info.name;
        activity.smallImageKey = game_info.headshot;
        activity.smallImageText = game_info.username || "roblox player";
        activity.buttons = [
            {
                label: "Join me !!!",
                url: `https://www.roblox.com/games/${place_id}`,
            },
        ];
        console.log(clientupdate(`presence updated: ${game_info.name} (${game_info.playing} playing)`));
    } else if (place_id) {
        activity.details = "roblox";
        activity.state = `place id: ${place_id}`;
        console.log(clientupdate(`presence updated (no game info): place id ${place_id}`));
    } else {
        // activity.details = "roblox";
        activity.state = "Main Menu";
        console.log(clientupdate("presence updated: roblox (menu)"));
    }

    try {
        await client.setActivity(activity);
    } catch (err) {
        console.log(red(`failed to set activity: ${err.message}`));
    }
}

client.on("ready", () => {
    console.log(green(`connected as: ${client.user?.username}`));
    update_presence();
    setInterval(update_presence, updaterpcitime);
});

client.on("disconnected", () => {
    console.log(red("discord rpc disconnected - retrying in 10 seconds"));
    setTimeout(() => {
        client.login({
            clientId: client_id
        }).catch((err) => console.log(red(err.message)));
    }, 10_000);
});

console.log(green("connecting to discord rpc..."));
client.login({
    clientId: client_id
}).catch((err) => {
    console.log(red(`failed to connect to discord: ${err.message}`));
    console.log(red("make sure discord desktop is open"));
});