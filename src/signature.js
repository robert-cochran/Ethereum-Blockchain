const utils = require("ethereumjs-util");

const serialize_sig = (sig) => {
    return JSON.stringify({
        r: utils.bufferToHex(sig.r),
        s: utils.bufferToHex(sig.s),
        v: utils.bufferToHex(sig.v)
    });
}

const deserialize_sig = (sig_string) => {
    const sig = JSON.parse(sig_string);
    return {
        r: utils.toBuffer(sig.r),
        s: utils.toBuffer(sig.s),
        v: sig.v
    }
}

const web3_sign = (account) => {
    return (msg) => {
        return new Promise((res, rej) => {
            const w3 = window.web3;
            if (w3 == null) {
                rej();
            }
            msg = "0x" + msg.toString("hex");
            w3.eth.sign(account, msg, (err, result) => {
                if (err) {
                    rej(err);
                }
                res({
                    r: utils.toBuffer(result.slice(0,66)),
                    s: utils.toBuffer('0x' + result.slice(66,130)),
                    v: utils.toBuffer('0x' + result.slice(130,132))
                });
            })
        });
    };
};

const private_sign = (key) => {
    key = utils.toBuffer(key);
    return (msg) => {
        return new Promise((res, rej) => res(utils.ecsign(msg, key)));
    };
}

const get_web3_public_key = () => {
    const data = utils.hashPersonalMessage(utils.toBuffer("DOESN'T MATTER"));
    return web3_sign(window.web3.eth.accounts[0])(data).then((sig) => {
        const key_out = utils.ecrecover(data, utils.bufferToInt(sig.v), sig.r, sig.s);
        return key_out;
    });
}

class SignatureGenerator {
    constructor(signFunc) {
        this.signFunc = signFunc;
    }

    sign(message) {
        const msg_hash = utils.hashPersonalMessage(utils.toBuffer(message));
        return this.signFunc(msg_hash).then(serialize_sig);
    }
}

class SignatureVerifier {
    constructor(public_key) {
        this.key = new Buffer(public_key.slice(2), "hex");
    }

    verify(message, signature) {
        const sig = deserialize_sig(signature);
        const msg_hash = utils.hashPersonalMessage(utils.toBuffer(message));
        const key_out = utils.ecrecover(msg_hash, sig.v, sig.r, sig.s);
        return key_out.equals(this.key);
    }
}

module.exports = {
    SignatureGenerator, SignatureVerifier, serialize_sig, deserialize_sig,
    web3_sign, private_sign, get_web3_public_key
}
