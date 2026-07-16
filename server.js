const express = require("express")
// Ensure `globalThis.crypto` (Web Crypto) is available for newer MongoDB drivers
try {
    if (typeof globalThis.crypto === 'undefined') {
        // Prefer the built-in Node webcrypto if available
        const nodeCrypto = require('crypto');
        if (nodeCrypto && nodeCrypto.webcrypto) {
            globalThis.crypto = nodeCrypto.webcrypto;
        }
    }
} catch (e) {
    // ignore — fallback behavior will surface an error from the driver if unsupported
}

const db = require("./backend/config/db")
const dotenv = require("dotenv")
const app = require("./backend/app")

dotenv.config()
db()


app.listen(process.env.PORT || 7777, ()=> {
    console.log(`Server is running on port:  ${process.env.PORT}`)  
})

