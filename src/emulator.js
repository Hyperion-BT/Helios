//@ts-check
// Emulator

import {
    assert,
    bigIntToBytes,
    eq
} from "./utils.js";

/**
 * @typedef {import("./crypto.js").NumberGenerator} NumberGenerator
 */

import {
    Crypto
} from "./crypto.js";

import {
    Address,
    Assets,
    PubKey,
    PubKeyHash,
    TxId,
    Value
} from "./helios-data.js";

import {
    NetworkParams
} from "./uplc-costmodels.js";

import {
    PrivateKey,
    Signature,
    Tx,
    TxOutput,
    UTxO
} from "./tx-builder.js";

import {
    DataSignature
} from "./wallet.js";


/**
 * @typedef {import("./wallets.js").Wallet} Wallet
 */

/**
 * @typedef {import("./network.js").Network} Network
 */

/**
 * Single address wallet emulator.
 * @implements {Wallet}
 */
export class WalletEmulator {
    /**
     * @type {Network}
     */
    #network;

    /**
     * @type {PrivateKey}
     */
    #privateKey;

    /**
     * @type {PubKey}
     */
    #pubKey;

    /**
     * @param {Network} network
     * @param {NumberGenerator} random - used to generate the private key
     */
    constructor(network, random) {
        this.#network = network;
        this.#privateKey = PrivateKey.random(random);
        this.#pubKey = this.#privateKey.derivePubKey();

        // TODO: staking credentials
    }

    /**
     * @type {PrivateKey}
     */
    get privateKey() {
        return this.#privateKey;
    }

    /**
     * @type {PubKey}
     */
    get pubKey() {
        return this.#pubKey;
    }

    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash() {
        return this.#pubKey.hash();
    }

    /**
     * @type {Address}
     */
    get address() {
        return Address.fromPubKeyHash(this.pubKeyHash);
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return false;
    }

    /**
     * Assumed wallet was initiated with at least 1 UTxO at the pubkeyhash address.
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return new Promise((resolve, _) => {
            resolve([this.address])
        });
    }

    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return new Promise((resolve, _) => {
            resolve([])
        });
    }

    /**
     * @type {Promise<UTxO[]>}
     */
    get utxos() {
        return new Promise((resolve, _) => {
            resolve(this.#network.getUtxos(this.address));
        });
    }

    /**
     * @param {Address} address
     * @param {string} data
     * @returns {Promise<DataSignature>}
     */
    async signData(address, data) {
        throw new Error("not yet implemented");
    }

    /**
     * Simply assumed the tx needs to by signed by this wallet without checking.
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        return [
            this.#privateKey.sign(tx.bodyHash)
        ];
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        return await this.#network.submitTx(tx);
    }
}

/**
 * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
 * @typedef {{
 *     id(): TxId,
 *     consumes(txId: TxId, utxoIdx: bigint): boolean,
 *     collectUtxos(address: Address, utxos: UTxO[]): UTxO[]
 * }} EmulatorTx
 */

/**
 * @implements {EmulatorTx}
 */
class GenesisTx {
    #id;
    #address;
    #lovelace;
    #assets;

    /**
     * @param {number} id
     * @param {Address} address
     * @param {bigint} lovelace
     * @param {Assets} assets
     */
    constructor(id, address, lovelace, assets) {
        this.#id = id;
        this.#address = address;
        this.#lovelace = lovelace;
        this.#assets = assets;
    }

    /**
     * Simple incremental txId for genesis transactions.
     * It's very unlikely that regular transactions have the same hash.
     * @return {TxId}
     */
    id() {
        let bytes = bigIntToBytes(BigInt(this.#id));

        if (bytes.length < 32) {
            bytes = (new Array(32 - bytes.length)).fill(0).concat(bytes);
        }

        return new TxId(bytes);
    }

    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @returns
     */
    consumes(txId, utxoIdx) {
        return false;
    }

    /**
     * @param {Address} address
     * @param {UTxO[]} utxos
     * @returns {UTxO[]}
     */
    collectUtxos(address, utxos) {
        if (eq(this.#address.bytes, address.bytes)) {
            utxos = utxos.slice();

            utxos.push(new UTxO(
                this.id(),
                0n,
                new TxOutput(
                    this.#address,
                    new Value(this.#lovelace, this.#assets)
                )
            ));

            return utxos;
        } else {
            return utxos;
        }
    }
}

/**
 * @implements {EmulatorTx}
 */
class RegularTx {
    #tx;

    /**
     * @param {Tx} tx
     */
    constructor(tx) {
        this.#tx = tx;
    }

    /**
     * @returns {TxId}
     */
    id() {
        return this.#tx.id();
    }

    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @returns {boolean}
     */
    consumes(txId, utxoIdx) {
        const txInputs = this.#tx.body.inputs;

        return txInputs.some(txInput => {
            return txInput.txId.hex == txId.hex && txInput.utxoIdx == utxoIdx;
        });
    }

    /**
     * @param {Address} address
     * @param {UTxO[]} utxos
     * @returns {UTxO[]}
     */
    collectUtxos(address, utxos) {
        utxos = utxos.filter(utxo => !this.consumes(utxo.txId, utxo.utxoIdx));

        const txOutputs = this.#tx.body.outputs;

        txOutputs.forEach((txOutput, utxoId) => {
            if (eq(txOutput.address.bytes, address.bytes)) {
                utxos.push(new UTxO(
                    this.id(),
                    BigInt(utxoId),
                    txOutput
                ));
            }
        });

        return utxos;
    }
}

/**
 * @implements {Network}
 */
export class NetworkEmulator {
    /**
     * @type {bigint}
     */
    #slot;

    /**
     * @type {NumberGenerator}
     */
    #random;

    /**
     * @type {GenesisTx[]}
     */
    #genesis;

    /**
     * @type {EmulatorTx[]}
     */
    #mempool;

    /**
     * @type {EmulatorTx[][]}
     */
    #blocks;

    /**
     * @param {number} seed
     */
    constructor(seed = 0) {
        this.#slot = 0n;
        this.#random = Crypto.mulberry32(seed);
        this.#genesis = [];
        this.#mempool = [];
        this.#blocks = [];
    }

    /**
     * Create a copy of networkParams that always has access to the current slot
     *  (for setting the validity range automatically)
     * @param {NetworkParams} networkParams
     * @returns {NetworkParams}
     */
    initNetworkParams(networkParams) {
        return new NetworkParams(
            networkParams.raw,
            () => {
                return this.#slot;
            }
        );
    }

    /**
     * Creates a WalletEmulator and adds a block with a single fake unbalanced Tx
     * @param {bigint} lovelace
     * @param {Assets} assets
     * @returns {WalletEmulator}
     */
    createWallet(lovelace = 0n, assets = new Assets([])) {
        const wallet = new WalletEmulator(this, this.#random);

        this.createUtxo(wallet, lovelace, assets);

        return wallet;
    }

    /**
     * Creates a UTxO using a GenesisTx.
     * @param {WalletEmulator} wallet
     * @param {bigint} lovelace
     * @param {Assets} assets
     */
    createUtxo(wallet, lovelace, assets = new Assets([])) {
        if (lovelace != 0n || !assets.isZero()) {
            const tx = new GenesisTx(
                this.#genesis.length,
                wallet.address,
                lovelace,
                assets
            );

            this.#genesis.push(tx);
            this.#mempool.push(tx);
        }
    }

    /**
     * Mint a block with the current mempool, and advance the slot.
     * @param {bigint} nSlots
     */
    tick(nSlots) {
        if (this.#mempool.length > 0) {
            this.#blocks.push(this.#mempool);

            this.#mempool = [];
        }

        this.#slot += nSlots;
    }

    /**
     * @param {Address} address
     * @returns {Promise<UTxO[]>}
     */
    async getUtxos(address) {
        /**
         * @type {UTxO[]}
         */
        let utxos = [];

        for (let block of this.#blocks) {
            for (let tx of block) {
                utxos = tx.collectUtxos(address, utxos);
            }
        }

        return utxos;
    }

    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @returns {boolean}
     */
    isConsumed(txId, utxoIdx) {
        return this.#blocks.some(b => {
            return b.some(tx => {
                return tx.consumes(txId, utxoIdx)
            })
        }) || this.#mempool.some(tx => {
            return tx.consumes(txId, utxoIdx);
        })
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        assert(tx.isValid(this.#slot), "tx invalid (not finalized or slot out of range)");

        // make sure that none of the inputs have been consumed before
        assert(tx.body.inputs.every(input => !this.isConsumed(input.txId, input.utxoIdx)), "input already consumed before");

        this.#mempool.push(new RegularTx(tx));

        return tx.id();
    }
}
