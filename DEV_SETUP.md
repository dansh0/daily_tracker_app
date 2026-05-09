# Development Setup

## Environment

- **OS:** WSL2 (Ubuntu) on Windows
- **Device:** Physical Android, connected via USB or same WiFi network
- **Dev client:** Expo Go (Alpha); EAS APK sideload to follow

---

## Starting the Dev Server

```bash
npm start          # expo start --tunnel (wireless, requires ngrok auth)
npx expo start --clear   # same but clears Metro cache (use if you see cache errors)
```

---

## Tunnel Setup (ngrok)

`npm start` uses `--tunnel` mode via ngrok. ngrok requires a free account auth token.

**First-time setup:**
1. Sign up at ngrok.com (free)
2. Copy your authtoken from the dashboard
3. Run once: `npx ngrok authtoken YOUR_TOKEN`

After that, `npm start` works as normal.

**Common errors:**

| Error | Cause | Fix |
|---|---|---|
| `Cannot read properties of undefined (reading 'body')` | ngrok auth token not set, or ngrok outage | Set auth token (above) or check status.ngrok.com |
| `Error while reading cache... invalid or unsupported version` | Stale Metro cache | Run `npx expo start --clear` |
| `failed to start tunnel / remote gone away` | Transient ngrok connectivity issue | Retry; check status.ngrok.com |

---

## Alternative: USB + ADB (more reliable on WSL2)

If ngrok is flaky, ADB over USB is faster and more stable.

### First-time WSL2 USB setup (usbipd)

WSL2 doesn't see USB devices by default. One-time setup:

1. Install [usbipd-win](https://github.com/dorssel/usbipd-win/releases) on Windows
3. On phone: enable Developer Options, turn on USB debugging, set USB mode to File Transfer
4. Plug in phone, unlock screen
5. In **admin PowerShell on Windows**:
   ```powershell
   usbipd list                        # find your phone's busid (e.g. 2-1)
   usbipd bind --busid 2-1            # one-time bind (persists across reboots)
   usbipd attach --wsl --busid 2-1
   ```
6. In WSL — watch the phone for "Allow USB debugging?" dialog, then:
   ```bash
   adb kill-server && adb start-server && adb devices
   ```
   Phone should appear as `device`.

**Notes:**
- If attach fails with "device busy", kill Windows ADB first: run `usbipd bind --force --busid 2-1` and then restart computer
- Re-run `usbipd attach --wsl --busid 2-1` each time you replug the cable (bind persists, attach does not)
- Dialog won't appear on lock screen — unlock phone first

### Every session

```bash
# Admin PowerShell (if not already attached)
usbipd attach --wsl --busid 2-1

# WSL
adb reverse tcp:8081 tcp:8081
npx expo start --localhost --clear
```

---

## EAS Build (APK sideload)

Once the survey flow is stable and notifications are wired up, build an APK:

```bash
npx eas build --platform android --profile preview
```

Requires EAS CLI and an Expo account:
```bash
npm install -g eas-cli
eas login
eas build:configure   # first time only
```

The `preview` profile produces an APK (not AAB) suitable for direct sideloading.

---

## Useful Commands

```bash
npm start                        # start dev server with tunnel
npx expo start --clear           # start with cleared Metro cache
npx expo start --localhost       # start without tunnel (use with adb reverse)
npx tsc --noEmit                 # type check without building
```
