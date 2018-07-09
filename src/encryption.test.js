const { Encrypt, Decrypt, make_public } = require("./encryption.js");
const { SignatureGenerator, SignatureVerifier, serialize_sig, deserialize_sig, private_sign } = require("./signature.js");
const utils = require("ethereumjs-util");
const crypto = require("crypto");
const assert = require("assert");

const TEST_DATA = "HELLO WORLD!!! I'm a message!";

const accounts = {
    alice: {
        address: "0xd1Cf2F5B1150e1f48971cAe2919e7A15CF0083e1",
        private: "0xe6782affbe46d4744264c484ddf3a29a63b273753bd1a44009f8e83d7c974e96"
    },
    bob: {
        address: "0xADE161fEBA4baF654FC4d677139A38F4b6c731Df",
        private: "0xa861319f4abf9d1cfdc9140216d12f7b91c7e261105e309f5b2d868632b59b95"
    },
    charlie: {
        address: "0xF0eC4837c61C74AA81a0468a4b4855e0e5a8D298",
        private: "0x8b54e3f67dc24516c64824296862827b22c1671740165134164d67de583a1eb8"
    }
};

describe("Encryption Scheme", () => {
    it("should generate the same ECDH secret for two users", () => {
        accounts.alice.public = make_public(accounts.alice.private);
        accounts.bob.public = make_public(accounts.bob.private);

        const alice = crypto.createECDH('secp256k1');
        alice.setPrivateKey(utils.toBuffer(accounts.alice.private));

        const bob = crypto.createECDH('secp256k1');
        bob.setPrivateKey(utils.toBuffer(accounts.bob.private));

        const aliceSecret = alice.computeSecret("04" + accounts.bob.public.slice(2), "hex");
        const bobSecret = bob.computeSecret("04" + accounts.alice.public.slice(2), "hex");

        assert.strictEqual(aliceSecret.toString("hex"), bobSecret.toString("hex"), "Secrets should be equal");
    });

    it("should allow encryption and decryption", () => {
        const alice = crypto.createECDH('secp256k1');
        alice.setPrivateKey(utils.toBuffer(accounts.alice.private));
        const aliceSecret = alice.computeSecret("04" + accounts.bob.public.slice(2), "hex");

        const aliceCipher = crypto.createCipheriv("aes256", aliceSecret, "init vector!1234");
        const encMsg = Buffer.concat([
            aliceCipher.update(TEST_DATA, "utf-8"),
            aliceCipher.final()
        ]);

        const bob = crypto.createECDH('secp256k1');
        bob.setPrivateKey(utils.toBuffer(accounts.bob.private));
        const bobSecret = bob.computeSecret("04" + accounts.alice.public.slice(2), "hex");

        const bobCipher = crypto.createDecipheriv("aes256", bobSecret, "init vector!1234");
        let msg_out = bobCipher.update(encMsg);
        msg_out += bobCipher.final("utf-8");
        assert.strictEqual(msg_out, TEST_DATA, "deciphered message should be correct");

    });

    it("should allow encryption and decryption", () => {
        const alice_priv = accounts.alice.private;
        const bob_pub = make_public(accounts.bob.private);
        const encrypt = new Encrypt(alice_priv, bob_pub);

        const encMsg = encrypt.encrypt(TEST_DATA);

        const alice_pub = make_public(accounts.alice.private);
        const bob_priv = accounts.bob.private;
        const decrypt = new Decrypt(alice_pub, bob_priv);

        const msg_out = decrypt.decrypt(encMsg);

        assert.strictEqual(msg_out, TEST_DATA, "Decrypted Message should match input");
    });
});

describe("Signatures", async () => {
    it("should serialize and deserialise correctly", () => {
        const alice_priv = utils.toBuffer(accounts.alice.private);
        const msg_hash = utils.hashPersonalMessage(utils.toBuffer(TEST_DATA));
        const sig = utils.ecsign(msg_hash, alice_priv);
        const sig_string = serialize_sig(sig);
        const sig_out = deserialize_sig(sig_string);
        assert.ok(sig_out.r.equals(sig.r), "Signature should deserialize correctly");
        assert.ok(sig_out.s.equals(sig.s), "Signature should deserialize correctly");
        assert.equal(sig_out.v, sig.v, "Signature should deserialize correctly");
    });

    it("should be able to be verified with a public key", () => {
        // Make the signature
        const alice_priv = utils.toBuffer(accounts.alice.private);
        const msg_hash = utils.hashPersonalMessage(utils.toBuffer(TEST_DATA));
        const sig = utils.ecsign(msg_hash, alice_priv);

        // Verify it - public key should match
        const alice_pub = utils.ecrecover(msg_hash, sig.v, sig.r, sig.s);
        assert.ok(alice_pub.equals(utils.privateToPublic(alice_priv)));
    });

    it("should work with the classes", async () => {
        const signFunc = private_sign(accounts.alice.private);
        const sigMaker = new SignatureGenerator(signFunc);
        const sig = await sigMaker.sign(TEST_DATA);
        console.log(sig);

        const verifier = new SignatureVerifier(accounts.alice.public);
        assert.ok(verifier.verify(TEST_DATA, sig));
        
    });
});