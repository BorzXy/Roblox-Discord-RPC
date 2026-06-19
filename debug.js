const fs = require("fs");
const path = require("path");

const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m[ERROR] ${msg}\x1b[0m`;

const log_path = `${process.env.LOCALAPPDATA}\\Roblox\\logs`;

if (!fs.existsSync(log_path)) {
    console.log(red(`log folder not found: ${log_path}`));
    process.exit(1);
}

const files = fs.readdirSync(log_path).filter((f) => f.endsWith(".log"));

console.log(yellow(`scanning ${files.length} log files in ${log_path}`));
console.log(yellow("---"));

let found = 0;

for (const f of files) {
    const content = fs.readFileSync(path.join(log_path, f), "utf8");
    const has_place_id =
        content.toLowerCase().includes("placeid") ||
        content.includes("place_id");

    if (has_place_id) {
        found++;
        console.log(yellow(`found in: ${f}`));

        const lines = content
            .split("\n")
            .filter((l) => l.toLowerCase().includes("placeid") || l.includes("place_id"));

        console.log(yellow(`matching lines (first 5):`));
        lines.slice(0, 5).forEach((l) => console.log("  " + l.trim()));
        console.log(yellow("---"));
    }
}

if (found === 0) {
    console.log(red("no log files containing place id were found"));
    console.log(red("make sure roblox is running and you are in a game"));
}