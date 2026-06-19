# Roblox-Discord-RPC

Connect your Roblox activity to Discord Rich Presence — no injection, no cookies, just your log files.

## Features

- Detects which game you are currently playing
- Shows game thumbnail as large image
- Shows your Roblox avatar as small image
- Displays game name, creator, and player count
- Join button that links directly to the game page
- Automatically clears presence when Roblox is closed
- No injection, no exploits, no cookies — TOS safe

## Requirements

- [Node.js](https://nodejs.org) v16 or higher
- [Discord Desktop](https://discord.com/download)
- Roblox installed on Windows, macOS, or Linux (Wine)

## Setup

### 1. Create a Discord Application (Optional)

1. Go to https://discord.com/developers/applications
2. Click **New Application** and give it a name (e.g. "Roblox")
3. Copy the **Application ID** from the General Information page
4. Upload a Roblox logo under **Rich Presence → Art Assets** with the key `idle_logo` — this shows when you are in the menu

### 2. Configure (Optional)

Open `main.js` and replace the client ID:

```js
const client_id = "YOUR_APPLICATION_ID";
```

### 3. Install and Run

```bash
npm install
node src/main.js
```

## What It Shows

| Field | Content |
|---|---|
| Large image | Game thumbnail |
| Small image | Your Roblox avatar |
| Details | Game name |
| State | Creator and player count |
| Button | Direct link to the game page |
| Timer | Time elapsed since Roblox opened |

## How It Works

1. Detects if `RobloxPlayerBeta.exe` is running
2. Reads the latest Roblox log file to extract the current Place ID and User ID
3. Fetches game info, thumbnail, and avatar from the Roblox API
4. Updates Discord Rich Presence via IPC every 15 seconds

No data is sent anywhere other than the official Roblox API and your local Discord client.

## FAQ

**Is this safe to use?**
Yes. Nothing is injected into Roblox. The program only reads log files and makes requests to the official Roblox API.

**Does it work on Linux?**
Yes, via Wine. The log path may need to be adjusted in `main.js` depending on your setup.

**Why does it still show the last game when I am in the menu?**
Roblox does not write to the log file while you are in the menu, so there is no way to detect that state without injection. Presence will clear correctly when Roblox is fully closed.

**The presence is not showing up.**
Make sure Discord is open and that "Display current activity as a status message" is enabled under Discord Settings → Activity Privacy.

## Roadmap

- [ ] Roblox Studio presence (shows current place name and studio activity)

## License

MIT
