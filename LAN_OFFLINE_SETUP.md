# LAN / Offline Deployment Guide

This document explains how to set up and run the ELMS application on a
head‑teacher's desktop (or any machine) connected to a local network.  It's
meant for classrooms or offices that may have intermittent or no internet
access; once the link is restored the data can be pushed up to the cloud so
students outside can see it.

---

## 1. Prerequisites

* A machine running Linux/macOS/Windows with Docker installed.  We use
  Laravel Sail, so Docker desktop is fine.
* The ELMS repository cloned onto that machine.
* An up‑to‑date `.env` file (copy `.env.example`).  You'll set a few LAN‑specific
  values below.
* Ensure the desktop and any client devices (phones, tablets) are on the same
  network (e.g. the same Wi‑Fi SSID).  No internet connectivity is required.

## 2. Configure environment for LAN

Edit `.env` as follows (only the relevant portions shown):

```env
APP_URL=http://192.168.1.100       # replace with desktop's LAN IP
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=local
PUSHER_APP_KEY=local
PUSHER_APP_SECRET=local
PUSHER_HOST=0.0.0.0                # bind socket to all addresses
PUSHER_PORT=6001
PUSHER_SCHEME=http

# optional: URL of cloud instance used by the sync command
SYNC_CLOUD_URL=https://app.yourschool.com
```

You do **not** need a Pusher account; the application uses the local
[`beyondcode/laravel-websockets`](https://github.com/beyondcode/laravel-websockets)
server which emulates the Pusher protocol.

## 3. Start the application

```bash
# from repo root
vendor/bin/sail up -d           # bring up PHP, MySQL, etc.
vendor/bin/sail artisan migrate --seed  # create & seed the database
```

Once the container suite is running you can open a browser on the desktop
itself at `http://localhost` or `http://192.168.1.100` (adjust for your IP).

## 4. Start the websocket server

In a separate terminal run:

```bash
vendor/bin/sail artisan websockets:serve
```

This process listens on port `6001` and handles real‑time broadcasts.  It
must be running for events to propagate between clients on the LAN.

You can also run the downloader command in the background or use a process
supervisor if you expect to leave the machine unattended:

```bash
vendor/bin/sail artisan websockets:serve --daemon
```

### Optional alternative: standalone Node/socket.io server

If installing the `laravel-websockets` package on Laravel 12 proves difficult
(or you prefer a lightweight JavaScript service), you can use the included
`socket-server.js` script instead.  it does not require any composer
dependencies – only Node.

1. Make sure you have Node.js installed on the desktop.
2. From the project root run:

   ```bash
   npm install           # already done for frontend; ensures express/socket.io
   node socket-server.js # will listen on port 6001 by default
   ```

   The script is now written as an ES module (`package.json` sets
   `"type":"module"`), so you cannot use `require`.  simply execute it with
   `node socket-server.js` as shown; the file already uses `import`.
   (If you prefer you may alternatively rename it to `socket-server.cjs` and
   keep the CommonJS code.)

3. The Laravel event listener (`App\Listeners\EmitToSocketServer`) will
   deliver broadcast payloads to `http://localhost:6001/event`, and the
   Node process forwards them to every connected browser using socket.io.
4. Clients (phones, tablets) simply connect to `http://<desktop-ip>:6001`
   using the socket.io client (the frontend code is already wired up).

This approach is the one used in the real‑time examples above and works
perfectly on a LAN without any composer quirks.

## 5. Access from other devices

On any phone/tablet/PC connected to the same LAN, open a browser and browse to
`http://<desktop-ip>` (e.g. `http://192.168.1.100`).  You should see the ELMS
login screen.  Logging in as a registrar/head–teacher allows you to perform
registrations, record payments, etc.  Real‑time events (like a payment being
recorded) are broadcast over the LAN via the websocket server – you do not need
an internet connection for them to work.

## 6. Syncing to the cloud (optional)

When the desktop regains internet connectivity you can export the locally
recorded changes and send them up to the public cloud instance so remote
students/teachers can see them.

The application includes a scheduled command that runs every minute.  it
reads `sync_logs` (changes recorded while offline) and POSTs them to the
`/api/sync` endpoint on whatever URL you configured in
`SYNC_CLOUD_URL`.

You can trigger the same behaviour manually with:

```bash
vendor/bin/sail artisan sync:push
```

If the cloud already has a record matching the same UUID (payments and other
models generate a UUID on creation) the push job will update the existing row
rather than creating a duplicate.

**Important:** the LAN copy never pulls changes from the cloud; it only pushes
its own edits.  the cloud instance remains authoritative for any users who are
working online.

## 7. Troubleshooting

* **Cannot reach the desktop from phone?** verify both devices are on the same
  subnet and that no firewall is blocking port 80 or 6001.
* **Socket connection failing?** make sure `websockets:serve` is running and
  that the `.env` values match the host/port.  You can inspect websocket
  activity by opening the browser console.
* **Sync command reports errors?** check that `SYNC_CLOUD_URL` is reachable and
  that the cloud API has the `/api/sync` route (see code in
  `CloudSyncController`).  The command will retry automatically on failure.

---

With the above setup the head‑teacher’s desktop functions as a complete
LAN‑server; students on the same network can perform registrations/payments in
real time, and the data will be safely backed up to the cloud whenever an
internet connection becomes available.