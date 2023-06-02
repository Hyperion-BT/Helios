//@ts-check
// Wallets

import {
    assertDefined,
    bytesToHex,
    hexToBytes
} from "./utils.js";

import {
    Address,
    PubKeyHash,
    TxId,
    Value
} from "./helios-data.js";

import {
    Signature,
    Tx,
    TxWitnesses,
    UTxO
} from "./tx-builder.js";

import {
    CoinSelection
} from "./coinselection.js";

// Where best to put this?
/**
 * @typedef {{
 *     signature: string,
 *     key: string,
 * }} DataSignature
 */

/**
 * @typedef {{
 *     isMainnet(): Promise<boolean>,
 *     usedAddresses: Promise<Address[]>,
 *     unusedAddresses: Promise<Address[]>,
 *     utxos: Promise<UTxO[]>,
 *     signData(address: Address, data: string): Promise<DataSignature>,
 *     signTx(tx: Tx): Promise<Signature[]>,
 *     submitTx(tx: Tx): Promise<TxId>
 * }} Wallet
 */

/**
 * @typedef {{
 *     getNetworkId(): Promise<number>,
 *     getUsedAddresses(): Promise<string[]>,
 *     getUnusedAddresses(): Promise<string[]>,
 *     getUtxos(): Promise<string[]>,
 *     signData(address: string, data: string): Promise<DataSignature>,
 *     signTx(txHex: string, partialSign: boolean): Promise<string>,
 *     submitTx(txHex: string): Promise<string>
 * }} Cip30Handle
 */

/**
 * @implements {Wallet}
 */
export class Cip30Wallet {
    #handle;

    /**
     * @param {Cip30Handle} handle
     */
    constructor(handle) {
        this.#handle = handle;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return (await this.#handle.getNetworkId()) == 1;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return this.#handle.getUsedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return this.#handle.getUnusedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<UTxO[]>}
     */
    get utxos() {
        return this.#handle.getUtxos().then(utxos => utxos.map(u => UTxO.fromCbor(hexToBytes(u))));
    }

    /**
     * @param {Address} address
     * @param {string} data
     * @returns {Promise<DataSignature>}
     */
    async signData(address, data) {
        return this.#handle.signData(address.toHex(), data);
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        const res = await this.#handle.signTx(bytesToHex(tx.toCbor()), true);

        return TxWitnesses.fromCbor(hexToBytes(res)).signatures;
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const responseText = await this.#handle.submitTx(bytesToHex(tx.toCbor()));

        return new TxId(responseText);
    }
}

export class WalletHelper {
    #wallet;

    /**
     * @param {Wallet} wallet
     */
    constructor(wallet) {
        this.#wallet = wallet;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get allAddresses() {
        return this.#wallet.usedAddresses.then(usedAddress => this.#wallet.unusedAddresses.then(unusedAddresses => usedAddress.concat(unusedAddresses)));
    }

    /**
     * @returns {Promise<Value>}
     */
    async calcBalance() {
        let sum = new Value();

        const utxos = await this.#wallet.utxos;

        for (const utxo of utxos) {
            sum = sum.add(utxo.value);
        }

        return sum;
    }

    /**
     * @type {Promise<Address>}
     */
    get baseAddress() {
        return this.allAddresses.then(addresses => assertDefined(addresses[0]));
    }

    /**
     * @type {Promise<Address>}
     */
    get changeAddress() {
        return this.#wallet.unusedAddresses.then(addresses => {
            if (addresses.length == 0) {
                return this.#wallet.usedAddresses.then(addresses => {
                    if (addresses.length == 0) {
                        throw new Error("no addresses found")
                    } else {
                        return addresses[addresses.length-1];
                    }
                })
            } else {
                return addresses[0];
            }
        });
    }

    /**
     * Returns the first UTxO, so the caller can check precisely which network the user is connected to (eg. preview or preprod)
     * @type {Promise<?UTxO>}
     */
    get refUtxo() {
        return this.#wallet.utxos.then(utxos => {
            if(utxos.length == 0) {
                return null;
            } else {
                return assertDefined(utxos[0])
            }
        });
    }

    /**
     * @param {Value} amount
     * @param {(allUtxos: UTxO[], anount: Value) => [UTxO[], UTxO[]]} algorithm
     * @returns {Promise<[UTxO[], UTxO[]]>} - [picked, not picked that can be used as spares]
     */
    async pickUtxos(amount, algorithm = CoinSelection.selectSmallestFirst) {
        return algorithm(await this.#wallet.utxos, amount);
    }

    /**
     * Returned collateral can't contain an native assets (pure lovelace)
     * TODO: combine UTxOs if a single UTxO isn't enough
     * @param {bigint} amount - 2 Ada should cover most things
     * @returns {Promise<UTxO>}
     */
    async pickCollateral(amount = 2000000n) {
        const pureUtxos = (await this.#wallet.utxos).filter(utxo => utxo.value.assets.isZero());

        if (pureUtxos.length == 0) {
            throw new Error("no pure UTxOs in wallet (needed for collateral)");
        }

        const bigEnough = pureUtxos.filter(utxo => utxo.value.lovelace >= amount);

        if (bigEnough.length == 0) {
            throw new Error("no UTxO in wallet that is big enough to cover collateral");
        }

        bigEnough.sort((a,b) => Number(a.value.lovelace - b.value.lovelace));

        return bigEnough[0];
    }

    /**
     * @param {Address} addr
     * @returns {Promise<boolean>}
     */
    async isOwnAddress(addr) {
        const pkh = addr.pubKeyHash;

        if (pkh === null) {
            return false;
        } else {
            return this.isOwnPubKeyHash(pkh);
        }
    }

        /**
     * @param {PubKeyHash} pkh
     * @returns {Promise<boolean>}
     */
    async isOwnPubKeyHash(pkh) {
        const addresses = await this.allAddresses;

        for (const addr of addresses) {
            const aPkh = addr.pubKeyHash;

            if (aPkh !== null && aPkh.eq(pkh)) {
                return true;
            }
        }

        return false;
    }
}
