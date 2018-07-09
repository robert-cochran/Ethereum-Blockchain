const utils = require("ethereumjs-util");
const crypto = require("crypto");

const IV_constant = "changethis!!1234";

const make_public = priv => {
    const privBuf = utils.toBuffer(priv);
    const pubBuf = utils.privateToPublic(privBuf);
    // Cut off 0x and put on 04
    return "04" + utils.bufferToHex(pubBuf).slice(2);
}

class Encrypt {
    constructor(from_private, to_public) {
        this.from = crypto.createECDH('secp256k1');
        this.from.setPrivateKey(utils.toBuffer(from_private));
        if (to_public.startsWith("0x")) {
            to_public = to_public.slice(2);
        }
        if (!to_public.startsWith("04")) {
            to_public = "04" + to_public
        }
        this.to = to_public;
        this.secret = this.from.computeSecret(this.to, "hex");
    }

    encrypt(data) {
        const cipher = crypto.createCipheriv("aes256", this.secret, IV_constant);
        const out_buf = Buffer.concat([
            cipher.update(data, "utf-8"),
            cipher.final()
        ]);
        return out_buf.toString("base64");
    }
}

class Decrypt {
    constructor(from_public, to_private) {
        this.to = crypto.createECDH('secp256k1');
        this.to.setPrivateKey(utils.toBuffer(to_private));
        if (from_public.startsWith("0x")) {
            from_public = from_public.slice(2);
        }
        if (!from_public.startsWith("04")) {
            from_public = "04" + from_public
        }
        this.from = from_public;
        this.secret = this.to.computeSecret(from_public, "hex");
        console.log("secret", this.secret.toString("hex"));
    }

    decrypt(data) {
        const data_buf = Buffer.from(data, 'base64');
        const cipher = crypto.createDecipheriv("aes256", this.secret, IV_constant);
        const out_buf = Buffer.concat([
            cipher.update(data_buf),
            cipher.final()
        ]);
        return out_buf.toString("utf-8");
    }
}

module.exports = {
    Encrypt, Decrypt, make_public
}
