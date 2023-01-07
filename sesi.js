const { default: sessionMdByZeeoneOfc, useMultiFileAuthState,
DisconnectReason,
downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require("@adiwajshing/baileys")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
qrwa = null
PORT = 5000
const qrcode = require('qrcode')
const express = require('express')
const app = express()
app.enable('trust proxy')
app.set("json spaces",2)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.all('*', async (req, res) => {
    if (!qrwa) return res.send('reload cuy klo qr nya gk muncul"')
      res.type('.jpg').send(qrwa)
})
app.listen(PORT, async() => {
    console.log(`scan qr di bagian web`)
})

async function startSesi() {
  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
  
  const { state, saveCreds } = await useMultiFileAuthState(`session-md`)
    const alpha = sessionMdByZeeoneOfc({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Session Md','Safari','1.0.0'],
        auth: state
    })

    store.bind(alpha.ev)
    
    alpha.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
        mek = chatUpdate.messages[0]
        if (!mek.message) return
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') return
        if (!mek.key.fromMe && chatUpdate.type === 'notify') return
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
        } catch (err) {
            console.log(err)
        }
    })
	
alpha.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr} = update	
  if (qr) {
				let qrkode = await qrcode.toDataURL(qr, {
					scale: 20
				})
				qrwa = Buffer.from(qrkode.split`,` [1], 'base64')
  }
        if (connection === 'close') {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Scan Again`); alpha.logout(); }
            else if (reason === DisconnectReason.connectionClosed) { console.log("Connection closed, reconnecting...."); startSesi(); }
            else if (reason === DisconnectReason.connectionLost) { console.log("Connection Lost from Server, reconnecting..."); startSesi(); }
            else if (reason === DisconnectReason.connectionReplaced) { console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First"); alpha.logout(); }
            else if (reason === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Scan Again And Run.`); alpha.logout(); }
            else if (reason === DisconnectReason.restartRequired) { console.log("Restart Required, Restarting..."); startSesi(); }
            else if (reason === DisconnectReason.timedOut) { console.log("Connection TimedOut, Reconnecting..."); startSesi(); }
            else if (reason === DisconnectReason.Multidevicemismatch) { console.log("Multi device mismatch, please scan again"); alpha.logout(); }
            else alpha.end(`Unknown DisconnectReason: ${reason}|${connection}`)
        }
        console.log('Connected...', update)
    })

    alpha.ev.on('creds.update', saveCreds)

    return alpha
}

startSesi()