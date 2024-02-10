//@ts-check
// Tx types

import {
	config
} from "./config.js";

import {
    assert,
    assertDefined,
    bigIntToBytes,
	bigIntToLe32Bytes,
	leBytesToBigInt,
    BitWriter,
    bytesToHex,
    eq,
    hexToBytes,
	padZeroes
} from "./utils.js";

import {
	RuntimeError,
    Site,
    UserError
} from "./tokens.js";

import {
	BIP39_DICT_EN,
    Crypto,
	Ed25519,
	randomBytes
} from "./crypto.js";

/**
 * @typedef {import("./crypto.js").NumberGenerator} NumberGenerator
 */

import {
    CborData,
	Cbor
} from "./cbor.js";

import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    MapData,
    UplcData
} from "./uplc-data.js";

import {
	Address,
	Assets,
	ByteArray,
    DatumHash,
	HeliosData,
	HInt,
    MintingPolicyHash,
	PubKey,
    PubKeyHash,
    StakingValidatorHash,
    TxId,
	TxOutputId,
	ValidatorHash,
	Value
} from "./helios-data.js";

/**
 * @typedef {import("./helios-data.js").ByteArrayProps} ByteArrayProps
 */

/**
 * @typedef {import("./helios-data.js").HIntProps} HIntProps
 */

/**
 * @typedef {import("./helios-data.js").MintingPolicyHashProps} MintingPolicyHashProps
 */

/**
 * @typedef {import("./uplc-costmodels.js").Cost} Cost
 */

import {
    Hash
} from "./helios-data.js";

import {
    NetworkParams
} from "./uplc-costmodels.js";

import {
    UplcDataValue
} from "./uplc-ast.js";

/**
 * @typedef {import("./uplc-program.js").Profile} Profile
 */

import {
    UplcProgram
} from "./uplc-program.js";

import {
	NativeContext,
	NativeScript
} from "./native.js";

/**
 * Represents a Cardano transaction. Can also be used as a transaction builder.
 */
export class Tx extends CborData {
	/**
	 * @type {TxBody}
	 */
	#body;

	/**
	 * @type {TxWitnesses}
	 */
	#witnesses;

	/**
	 * @type {boolean}
	 */
	#valid;

	/** 
	 * @type {null | TxMetadata} 
	 */
	#metadata;

	// the following field(s) aren't used by the serialization (only for building)
	/**
	 * Upon finalization the slot is calculated and stored in the body
	 * @type {null | bigint | Date} 
	 */
	#validTo;

	/**
	 * Upon finalization the slot is calculated and stored in the body 
	 *  @type {null | bigint | Date} 
	 */
	#validFrom;

	/**
	 * Use `Tx.new()` instead of this constructor for creating a new Tx builder.
	 * @param {TxBody} body
	 * @param {TxWitnesses} witnesses
	 * @param {boolean} valid
	 * @param {null | TxMetadata} metadata
	 * @param {null | bigint | Date} validTo
	 * @param {null | bigint | Date} validFrom
	 */
	constructor(
		body = new TxBody(), 
		witnesses = new TxWitnesses(), 
		valid = false, 
		metadata = null, 
		validTo = null,
		validFrom = null
	) {
		super();
		this.#body = body;
		this.#witnesses = witnesses;
		this.#valid = valid; // building is only possible if valid==false
		this.#metadata = metadata;
		this.#validTo = validTo;
		this.#validFrom = validFrom;
	}

	/**
	 * Create a new Tx builder.
	 * @returns {Tx}
	 */
	static new() {
		return new Tx();
	}

	/**
	 * @type {TxBody}
	 */
	get body() {
		return this.#body;
	}

	/**
	 * @type {number[]}
	 */
	get bodyHash() {
		return this.#body.hash();
	}

	/**
	 * @type {TxWitnesses}
	 */
	get witnesses() {
		return this.#witnesses;
	}

	/**
	 * Used by emulator to check if tx is valid.
	 * @param {bigint} slot
	 * @returns {boolean}
	 */
	isValid(slot) {
		if (!this.#valid) {
			return false;
		} else {
			return this.#body.isValid(slot);
		}
	}

	/** 
	 * Serialize a transaction.
	 * @returns {number[]}
	 */
	toCbor() {
		return Cbor.encodeTuple([
			this.#body.toCbor(),
			this.#witnesses.toCbor(),
			Cbor.encodeBool(this.#valid),
			this.#metadata === null ? Cbor.encodeNull() : this.#metadata.toCbor(),
		]);
	}

	/**
	 * Creates a new Tx without the metadata for client-side signing where the client can't know the metadata before tx-submission.
	 * @returns {Tx}
	 */
	withoutMetadata() {
		return new Tx(
			this.#body,
			this.#witnesses,
			this.#valid,
			null, // TODO: try null first, other wise try an empty TxMetadata instance
			this.#validTo,
			this.#validFrom
		)
	}

	/**
	 * Deserialize a CBOR encoded Cardano transaction (input is either an array of bytes, or a hex string).
	 * @param {number[] | string} raw
	 * @returns {Tx}
	 */
	static fromCbor(raw) {
		let bytes = (typeof raw == "string") ? hexToBytes(raw) : raw;

		bytes = bytes.slice();

		let tx = new Tx();

		let n = Cbor.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					tx.#body = TxBody.fromCbor(fieldBytes);
					break;
				case 1:
					tx.#witnesses = TxWitnesses.fromCbor(fieldBytes);
					break;
				case 2:
					tx.#valid = Cbor.decodeBool(fieldBytes);
					break;
				case 3:
					if (Cbor.isNull(fieldBytes)) {
						Cbor.decodeNull(fieldBytes);

						tx.#metadata = null;
					} else {
						tx.#metadata = TxMetadata.fromCbor(fieldBytes);
					}
					break;
				default:
					throw new Error("bad tuple size");
			}
		});

		assert(n == 4);
		assert(bytes.length == 0);

		return tx;
	}

	/**
	 * Used by bundler for macro finalization
	 * @param {UplcData} data
	 * @param {NetworkParams} networkParams
	 * @param {Address} changeAddress
	 * @param {TxInput[]} spareUtxos
	 * @param {{[name: string]: (UplcProgram | (() => UplcProgram))}} scripts UplcPrograms can be lazy
	 * @returns {Promise<Tx>}
	 */
	static async finalizeUplcData(data, networkParams, changeAddress, spareUtxos, scripts) {
		const fields = data.fields;

		assert(fields.length == 12);

		const inputs = fields[0].list.map(d => TxInput.fromUplcData(d));
		const refInputs = fields[1].list.map(d => TxInput.fromUplcData(d));
		const outputs = fields[2].list.map(d => TxOutput.fromUplcData(d));
		//txBody.#fee = Value.fromUplcData(fields[3]).lovelace.value;
		const minted = Value.fromUplcData(fields[4]).assets;
		//txBody.#dcerts = fields[5].list.map(d => DCert.fromUplcData(d));
		//txBody.#withdrawals = new Map(fields[6].map.map(([key, value]) => {
		//	return [Address.fromUplcData(key), value.int];
		//}));
		// validity
		const signers = fields[8].list.map(d => PubKeyHash.fromUplcData(d));
		const redeemers = fields[9].map.map(([key, value]) => {
			if (key.index == 1) {
				assert(key.fields.length == 1);
				const outputId = TxOutputId.fromUplcData(key.fields[0]);
				const i = inputs.findIndex(input => input.txId.eq(outputId.txId) && input.utxoIdx == outputId.utxoIdx);
				assert(i != -1);
				return new SpendingRedeemer(inputs[i], i, value);
			} else if (key.index == 0) {
				assert(key.fields.length == 1);
				const mph = MintingPolicyHash.fromUplcData(key.fields[0]);
				const i = minted.mintingPolicies.findIndex(m => m.eq(mph));
				assert(i != -1);
				return new MintingRedeemer(mph, i, value);
			} else {
				throw new Error("unhandled redeemer constr index");
			}
		});

		// build the tx from scratch
		const tx = new Tx();

		// TODO: automatically added any available scripts
		inputs.forEach((input, i) => {
			const redeemer = redeemers.find(r => (r instanceof SpendingRedeemer) && r.inputIndex == i) ?? null;

			if (redeemer instanceof SpendingRedeemer) {
				tx.addInput(input, redeemer.data);

				if (input.address.validatorHash) {
					if  (input.address.validatorHash.hex in scripts) {
						const uplcProgram = scripts[input.address.validatorHash.hex];

						if (uplcProgram instanceof UplcProgram) {
							tx.attachScript(uplcProgram);
						} else {
							tx.attachScript(uplcProgram());
						}
					} else {
						throw new Error(`script for SpendingRedeemer (vh:${input.address.validatorHash.hex}) not found in [${Object.keys(scripts).join(", ")}]`);
					}
				} else {
					throw new Error("unexpected (expected a validator address");
				}
			} else {
				assert(redeemer === null);
				tx.addInput(input);
			}
		});

		refInputs.forEach(refInput => {
			tx.addRefInput(refInput);
		});

		// filter out spareUtxos that are already used as inputs
		spareUtxos = spareUtxos.filter(utxo => {
			return inputs.every(input => !input.eq(utxo)) && 
				refInputs.every(input => !input.eq(utxo));
		});

		outputs.forEach(output => {
			tx.addOutput(output);
		});

		minted.mintingPolicies.forEach((mph, i) => {
			const redeemer = redeemers.find(r => (r instanceof MintingRedeemer) && r.mphIndex == i) ?? null;

			if (redeemer instanceof MintingRedeemer) {
				tx.mintTokens(mph, minted.getTokens(mph), redeemer.data);

				if (mph.hex in scripts) {
					const uplcProgram = scripts[mph.hex];

					if (uplcProgram instanceof UplcProgram) {
						tx.attachScript(uplcProgram);
					} else {
						tx.attachScript(uplcProgram());
					}
				} else {
					throw new Error(`policy for mph ${mph.hex} not found in ${Object.keys(scripts)}`);
				}
			} else {
				throw new Error("missing MintingRedeemer");
			}
		});

		signers.forEach(pk => {
			tx.addSigner(pk);
		});

		return await tx.finalize(networkParams, changeAddress, spareUtxos);
	}

	/**
	 * @param {NetworkParams} networkParams
	 * @returns {UplcData}
	 */
	toTxData(networkParams) {
		return this.#body.toTxData(networkParams, this.witnesses.redeemers, this.witnesses.datums, this.id());
	}

	/**
	 * A serialized tx throws away input information
	 * This must be refetched from the network if the tx needs to be analyzed
	 * @param {(id: TxOutputId) => Promise<TxOutput>} fn
	 */
	async completeInputData(fn) {
		await this.#body.completeInputData(fn, this.#witnesses);
	}

	/**
	 * @param {null | NetworkParams} params If specified: dump all the runtime details of each redeemer (datum, redeemer, scriptContext)
	 * @returns {Object}
	 */
	dump(params = null) {
		return {
			body: this.#body.dump(),
			witnesses: this.#witnesses.dump(params, this.#body),
			metadata: this.#metadata !== null ? this.#metadata.dump() : null,
			valid: this.#valid,
			id: this.#valid ? this.id().toString() : "invalid"
		};
	}

	/**
	 * Set the start of the valid time range by specifying either a Date or a slot.
	 * 
	 * Mutates the transaction.
	 * Only available during building the transaction. 
	 * Returns the transaction instance so build methods can be chained.
	 * 
	 * > **Note**: since Helios v0.13.29 this is set automatically if any of the Helios validator scripts call `tx.time_range`.
	 * @param {bigint | Date } slotOrTime
	 * @returns {Tx}
	 */
	validFrom(slotOrTime) {
		assert(!this.#valid);

		this.#validFrom = slotOrTime;

		return this;
	}

	/**
	 * Set the end of the valid time range by specifying either a Date or a slot. 
	 * 
	 * Mutates the transaction.
	 * Only available during transaction building. 
	 * Returns the transaction instance so build methods can be chained.
	 * 
	 * > **Note**: since Helios v0.13.29 this is set automatically if any of the Helios validator scripts call `tx.time_range`.
	 * @param {bigint | Date } slotOrTime
	 * @returns {Tx}
	 */
	validTo(slotOrTime) {
		assert(!this.#valid);

		this.#validTo = slotOrTime;

		return this;
	}

	/**
	 * Mint a list of tokens associated with a given `MintingPolicyHash`.
	 * Throws an error if the given `MintingPolicyHash` was already used in a previous call to `mintTokens()`.
	 * The token names can either by a list of bytes or a hexadecimal string.
	 * 
	 * Mutates the transaction. 
	 * Only available during transaction building the transaction.
	 * Returns the transaction instance so build methods can be chained.
	 * 
	 * Also throws an error if the redeemer is `null`, and the minting policy isn't a known `NativeScript`.
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph 
	 * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
	 * @param {UplcDataValue | UplcData | null} redeemer
	 * @returns {Tx}
	 */
	mintTokens(mph, tokens, redeemer) {
		const mph_ = MintingPolicyHash.fromProps(mph);

		assert(!this.#valid);

		this.#body.addMint(mph_, tokens);

		if (!redeemer) {
			if (!this.#witnesses.isNativeScript(mph_)) {
				throw new Error("no redeemer specified for minted tokens (hint: if this policy is a NativeScript, attach that script before calling tx.mintTokens())");
			}
		} else {
			this.#witnesses.addMintingRedeemer(mph_, UplcDataValue.unwrap(redeemer));
		}
		

		return this;
	}

	/**
	 * Add a UTxO instance as an input to the transaction being built.
	 * Throws an error if the UTxO is locked at a script address but a redeemer isn't specified (unless the script is a known `NativeScript`).
	 * 
	 * Mutates the transaction. 
	 * Only available during transaction building.
	 * Returns the transaction instance so build methods can be chained.
	 * @param {TxInput} input
	 * @param {null | UplcDataValue | UplcData | HeliosData} rawRedeemer
	 * @returns {Tx}
	 */
	addInput(input, rawRedeemer = null) {
		assert(!this.#valid);

		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		} else {
			void this.#body.addInput(input);

			if (rawRedeemer !== null) {
				assert(input.origOutput.address.validatorHash !== null, "input isn't locked by a script");

				const redeemer = rawRedeemer instanceof HeliosData ? rawRedeemer._toUplcData() : UplcDataValue.unwrap(rawRedeemer);

				this.#witnesses.addSpendingRedeemer(input, redeemer);

				if (input.origOutput.datum === null) {
					throw new Error("expected non-null datum");
				} else {
					let datum = input.origOutput.datum;

					if (datum instanceof HashedDatum) {
						let datumData = datum.data;
						if (datumData === null) {
							throw new Error("expected non-null datum data");
						} else {
							this.#witnesses.addDatumData(datumData);
						}
					}
				}
			} else {
				if (input.origOutput.address.pubKeyHash === null) {
					if (!this.#witnesses.isNativeScript(assertDefined(input.origOutput.address.validatorHash))) {
						throw new Error("input is locked by a script, but redeemer isn't specified (hint: if this is a NativeScript, attach that script before calling tx.addInput())");
					}
				}
			}
		}

		return this;
	}

	/**
	 * Add multiple UTxO instances as inputs to the transaction being built. 
	 * Throws an error if the UTxOs are locked at a script address but a redeemer isn't specified (unless the script is a known `NativeScript`).
	 * 
	 * Mutates the transaction.
	 * Only available during transaction building. Returns the transaction instance so build methods can be chained.
	 * @param {TxInput[]} inputs
	 * @param {?(UplcDataValue | UplcData | HeliosData)} redeemer
	 * @returns {Tx}
	 */
	addInputs(inputs, redeemer = null) {
		for (let input of inputs) {
			this.addInput(input, redeemer);
		}

		return this;
	}

	/**
	 * Add a `TxInput` instance as a reference input to the transaction being built.
	 * Any associated reference script, as a `UplcProgram` instance, must also be included in the transaction at this point (so the that the execution budget can be calculated correctly).
	 * 
	 * Mutates the transaction.
	 * Only available during transaction building.
	 * Returns the transaction instance so build methods can be chained.
	 * @param {TxInput} input
	 * @param {null | UplcProgram} refScript
	 * @returns {Tx}
	 */
	addRefInput(input, refScript = null) {
		assert(!this.#valid);

		this.#body.addRefInput(input);

		if (refScript !== null) {
			this.#witnesses.attachPlutusScript(refScript, true);
		}

		return this;
	}

	/**
	 * Add multiple `TxInput` instances as reference inputs to the transaction being built.
	 * 
	 * Mutates the transaction.
	 * Only available during transaction building.
	 * Returns the transaction instance so build methods can be chained.
	 * @param {TxInput[]} inputs
	 * @returns {Tx}
	 */
	addRefInputs(inputs) {
		for (let input of inputs) {
			const refScript = input.origOutput.refScript;
			this.addRefInput(input, refScript);
		}

		return this;
	}

	/**
	 * Add a `TxOutput` instance to the transaction being built.
	 * 
	 * Mutates the transaction.
	 * Only available during transaction building.
	 * Returns the transaction instance so build methods can be chained.
	 * @param {TxOutput} output 
	 * @returns {Tx}
	 */
	addOutput(output) {
		assert(!this.#valid);
		
		// min lovelace isn't checked here but during finalize()
		this.#body.addOutput(output);

		return this;
	}

	/**
	 * Add multiple `TxOutput` instances at once.
	 * 
	 * Mutates the transaction.
	 * Only available during transaction building.
	 * Returns the transaction instance so build methods can be chained.
	 * @param {TxOutput[]} outputs 
	 * @returns {Tx}
	 */
	addOutputs(outputs) {
		for (let output of outputs) {
			this.addOutput(output);
		}

		return this;
	}

	/**
	 * Add a signatory `PubKeyHash` to the transaction being built.
	 * The added entry becomes available in the `tx.signatories` field in the Helios script.
	 * 
	 * Mutates the transaction.
	 * Only available during transaction building.
	 * Returns the transaction instance so build methods can be chained.
	 * @param {PubKeyHash} hash
	 * @returns {Tx}
	 */
	addSigner(hash) {
		assert(!this.#valid);

		this.#body.addSigner(hash);

		return this;
	}

	/**
	 * Add a `DCert` to the transactions being built. `DCert` contains information about a staking-related action.
	 * 
	 * TODO: implement all DCert (de)serialization methods.
	 * 
	 * Returns the transaction instance so build methods can be chained.
	 * @param {DCert} dcert
	 * @returns {Tx}
	 */
	addDCert(dcert) {
		this.#body.addDCert(dcert);

		return this;
	}

	/**
	 * Attaches a script witness to the transaction being built.
	 * The script witness can be either a `UplcProgram` or a legacy `NativeScript`.
	 * A `UplcProgram` instance can be created by compiling a Helios `Program`.
	 * A legacy `NativeScript` instance can be created by deserializing its original CBOR representation.
	 * 
	 * Throws an error if script has already been added.
	 * Throws an error if the script isn't used upon finalization.
	 * 
	 * Mutates the transaction. 
	 * Only available during transaction building.
	 * Returns the transaction instance so build methods can be chained.
	 * 
	 * > **Note**: a `NativeScript` must be attached before associated inputs are added or tokens are minted.
	 * @param {UplcProgram | NativeScript} program
	 * @returns {Tx}
	 */
	attachScript(program) {
		assert(!this.#valid);

		if (program instanceof NativeScript) { 
			this.#witnesses.attachNativeScript(program);
		} else {
			this.#witnesses.attachPlutusScript(program);
		}

		return this;
	}

	/**
	 * Add a UTxO instance as collateral to the transaction being built.
	 * Usually adding only one collateral input is enough.
	 * The number of collateral inputs must be greater than 0 if script witnesses are used in the transaction,
	 * and must be less than the limit defined in the `NetworkParams`.
	 * 
	 * Mutates the transaction. 
	 * Only available during transaction building. 
	 * Returns the transaction instance so build methods can be chained.
	 * @param {TxInput} input 
	 * @returns {Tx}
	 */
	addCollateral(input) {
		assert(!this.#valid);

		this.#body.addCollateral(input);

		return this;
	}

	/**
	 * Calculates tx fee (including script execution)
	 * Shouldn't be used directly
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		let [a, b] = networkParams.txFeeParams;

		if (!this.#valid) {
			// add dummy signatures
			let nUniquePubKeyHashes = this.#body.countUniqueSigners();
			
			this.#witnesses.addDummySignatures(nUniquePubKeyHashes);
		}

		let size = this.toCbor().length;

		if (!this.#valid) {
			// clean up the dummy signatures
			this.#witnesses.removeDummySignatures();
		}

		let sizeFee = BigInt(a) + BigInt(size)*BigInt(b);

		let exFee = this.#witnesses.estimateFee(networkParams);

		return sizeFee + exFee;
	}

	/**
	 * Iterates until fee is exact
	 * Shouldn't be used directly
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @param {bigint} fee
	 * @returns {bigint}
	 */
	setFee(networkParams, fee) {
		let oldFee = this.#body.fee;

		while (oldFee != fee) {
			this.#body.setFee(fee);

			oldFee = fee;

			fee = this.estimateFee(networkParams);
		}

		return fee;
	}

	/**
	 * Checks that all necessary scripts are included, and that all included scripts are used
	 * Shouldn't be used directly
	 * @internal
	 */
	checkScripts() {
		let scripts = this.#witnesses.scripts;

		/**
		 * @type {Set<string>}
		 */
		const currentScripts = new Set();

		scripts.forEach(script => {
			currentScripts.add(bytesToHex(script.hash()))
		});

		/** 
		 * @type {Map<string, number>} 
		 */
		let wantedScripts = new Map();

		this.#body.collectScriptHashes(wantedScripts);

		if (wantedScripts.size < scripts.length) {
			throw new Error("too many scripts included, not all are needed");
		} else if (wantedScripts.size > scripts.length) {
			wantedScripts.forEach((value, key) => {
				if (!currentScripts.has(key)) {
					if (value >= 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for input ${value}`);
					} else if (value < 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for minting policy ${-value-1}`);
					}
				}
			});
		}

		currentScripts.forEach((key) => {
			if (!wantedScripts.has(key)) {
				console.log(wantedScripts, currentScripts)
				throw new Error("detected unused script");
			}
		});
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, changeAddress) {
		await this.#witnesses.executeScripts(networkParams, this.#body, changeAddress);
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @returns {Promise<void>}
	 */
	async checkExecutionBudgets(networkParams) {
		await this.#witnesses.checkExecutionBudgets(networkParams, this.#body);
	}

	/**
	 * @internal
	 * @param {Address} changeAddress 
	 */
	balanceAssets(changeAddress) {
		const inputAssets = this.#body.sumInputAndMintedAssets();

		const outputAssets = this.#body.sumOutputAssets();

		if (inputAssets.eq(outputAssets)) {
			return;
		} else if (outputAssets.ge(inputAssets)) {
			throw new Error("not enough input assets");
		} else {
			const diff = inputAssets.sub(outputAssets);

			if (config.MAX_ASSETS_PER_CHANGE_OUTPUT) {
				const maxAssetsPerOutput = config.MAX_ASSETS_PER_CHANGE_OUTPUT;

				let changeAssets = new Assets();
				let tokensAdded = 0;

				diff.mintingPolicies.forEach((mph) => {
					const tokens = diff.getTokens(mph);
					tokens.forEach(([token, quantity], i) => {
						changeAssets.addComponent(mph, token, quantity);
						tokensAdded += 1;
						if (tokensAdded == maxAssetsPerOutput) {
							this.#body.addOutput(new TxOutput(changeAddress, new Value(0n, changeAssets)));
							changeAssets = new Assets();
							tokensAdded = 0;
						}
					});
				});

				// If we are here and have No assets, they we're done
				if (!changeAssets.isZero()) {
					this.#body.addOutput(new TxOutput(changeAddress, new Value(0n, changeAssets)));
				}
			} else {
				const changeOutput = new TxOutput(changeAddress, new Value(0n, diff));
	
				this.#body.addOutput(changeOutput);
			}
		}
	}

	/**
	 * Calculate the base fee which will be multiplied by the required min collateral percentage 
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress 
	 * @param {TxInput[]} spareUtxos 
	 */
	estimateCollateralBaseFee(networkParams, changeAddress, spareUtxos) {
		assert(config.N_DUMMY_INPUTS == 1 || config.N_DUMMY_INPUTS == 2, "expected N_DUMMY_INPUTs == 1 or N_DUMMY_INPUTS == 2");

		// create the collateral return output (might not actually be added if there isn't enough lovelace)
		const dummyOutput = new TxOutput(changeAddress, new Value(0n));
		dummyOutput.correctLovelace(networkParams);

		// some dummy UTxOs on to be able to correctly calculate the collateral (assuming it uses full body fee)
		const dummyCollateral = spareUtxos.map(spare => spare).concat(this.#body.inputs).slice(0, 3);
		dummyCollateral.forEach(input => {
			this.#body.collateral.push(input);
		});

		const dummyInputs = dummyCollateral.slice(0, config.N_DUMMY_INPUTS);

		this.#body.setCollateralReturn(dummyOutput);
		dummyInputs.forEach(dummyInput => this.#body.addInput(dummyInput, false));
		this.#body.addOutput(dummyOutput);

		const baseFee = this.estimateFee(networkParams);

		// remove the dummy inputs and outputs
		while(this.#body.collateral.length) {
			this.#body.collateral.pop();
		}
		this.#body.setCollateralReturn(null);
		dummyInputs.forEach(dummyInput => this.#body.removeInput(dummyInput));
		this.#body.removeOutput(dummyOutput);

		return baseFee;
	}
	
	/**
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @param {Address} changeAddress
	 * @param {TxInput[]} spareUtxos
	 */
	balanceCollateral(networkParams, changeAddress, spareUtxos) {
		// don't do this step if collateral was already added explicitly
		if (this.#body.collateral.length > 0 || !this.isSmart()) {
			return;
		}

		const baseFee = this.estimateCollateralBaseFee(networkParams, changeAddress, spareUtxos);

		const minCollateral = ((baseFee*BigInt(networkParams.minCollateralPct)) + 100n)/100n; // integer division that rounds up

		let collateral = 0n;
		/**
		 * @type {TxInput[]}
		 */
		const collateralInputs = [];

		/**
		 * @param {TxInput[]} inputs 
		 */
		function addCollateralInputs(inputs) {
			// first try using the UTxOs that already form the inputs, but are locked at script
			const cleanInputs = inputs.filter(utxo => (!utxo.address.validatorHash) && utxo.value.assets.isZero()).sort((a, b) => Number(a.value.lovelace - b.value.lovelace));

			for (let input of cleanInputs) {
				if (collateral > minCollateral) {
					break;
				}

				while (collateralInputs.length >= networkParams.maxCollateralInputs) {
					collateralInputs.shift();
				}
	
				collateralInputs.push(input);
				collateral += input.value.lovelace;
			}
		}
		
		addCollateralInputs(this.#body.inputs.slice());

		addCollateralInputs(spareUtxos.map(utxo => utxo));

		// create the collateral return output if there is enough lovelace
		const changeOutput = new TxOutput(changeAddress, new Value(0n));
		changeOutput.correctLovelace(networkParams);

		if (collateral < minCollateral) {
			throw new Error("unable to find enough collateral input");
		} else {
			if (collateral > minCollateral + changeOutput.value.lovelace) {
				changeOutput.setValue(new Value(0n));

				changeOutput.correctLovelace(networkParams);

				if (collateral > minCollateral + changeOutput.value.lovelace) {
					changeOutput.setValue(new Value(collateral - minCollateral));
					this.#body.setCollateralReturn(changeOutput);
				} else {
					console.log(`not setting collateral return: collateral input too low (${collateral})`);
				}
			}
		}

		collateralInputs.forEach(utxo => {
			this.#body.addCollateral(utxo);
		});
	}

	/**
	 * Calculates fee and balances transaction by sending an output back to changeAddress
	 * First assumes that change output isn't needed, and if that assumption doesn't result in a balanced transaction the change output is created.
	 * Iteratively increments the fee because the fee increase the tx size which in turn increases the fee (always converges within two steps though).
	 * Throws error if transaction can't be balanced.
	 * Shouldn't be used directly
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @param {TxInput[]} spareUtxos - used when there are yet enough inputs to cover everything (eg. due to min output lovelace requirements, or fees)
	 * @returns {TxOutput} - changeOutput so the fee can be mutated furthers
	 */
	balanceLovelace(networkParams, changeAddress, spareUtxos) {
		// don't include the changeOutput in this value
		let nonChangeOutputValue = this.#body.sumOutputValue();

		// assume a change output is always needed
		const changeOutput = new TxOutput(changeAddress, new Value(0n));
		
		changeOutput.correctLovelace(networkParams);

		this.#body.addOutput(changeOutput);
		
		const minLovelace = changeOutput.value.lovelace;

		let fee = networkParams.maxTxFee;

		this.#body.setFee(fee);
		
		let inputValue = this.#body.sumInputAndMintedValue();

		let feeValue = new Value(fee);

		nonChangeOutputValue = feeValue.add(nonChangeOutputValue);

		// stake certificates
		const stakeAddrDeposit = new Value(networkParams.stakeAddressDeposit);
		this.#body.dcerts.forEach(dcert => {
			// in case of stake registrations, count stake key deposits as additional output ADA
			if (dcert.certType == 0) nonChangeOutputValue = nonChangeOutputValue.add(stakeAddrDeposit);
			// in case of stake de-registrations, count stake key deposits as additional input ADA
			if (dcert.certType == 1) inputValue = inputValue.add(stakeAddrDeposit);
		});

		// this is quite restrictive, but we really don't want to touch UTxOs containing assets just for balancing purposes
		const spareAssetUTxOs = spareUtxos.filter(utxo => !utxo.value.assets.isZero());
		spareUtxos = spareUtxos.filter(utxo => utxo.value.assets.isZero());
		
		// use some spareUtxos if the inputValue doesn't cover the outputs and fees
		const totalOutputValue = nonChangeOutputValue.add(changeOutput.value);
		while (!inputValue.ge(totalOutputValue)) {
			let spare = spareUtxos.pop();

			if (spare === undefined) {
				if (spareAssetUTxOs.length > 0) {
					spare = spareAssetUTxOs.sort((a, b) => a.output.value.assets.nTokenTypes - b.output.value.assets.nTokenTypes ).pop(); // Should sort so that we get the UTxO with the 'least' number of Assets

					if (!spare){
						throw new Error(`UTxOs too fragmented - or no Spare UTxOs available to fix this mess`);
					}
					
					this.#body.addInput(spare);
					this.balanceAssets(changeAddress);
				} else {
					throw new Error(`need ${totalOutputValue.lovelace} lovelace, but only have ${inputValue.lovelace}`);
				}
			} else {
				this.#body.addInput(spare);

				inputValue = inputValue.add(spare.value);
			}
		}

		// use to the exact diff, which is >= minLovelace
		let diff = inputValue.sub(nonChangeOutputValue);

		assert(diff.assets.isZero(), "unexpected unbalanced assets");
		assert(diff.lovelace >= minLovelace, `diff.lovelace=${diff.lovelace} ${typeof diff.lovelace} vs minLovelace=${minLovelace} ${typeof minLovelace}`);

		changeOutput.setValue(diff);

		// we can mutate the lovelace value of 'changeOutput' until we have a balanced transaction with precisely the right fee

		return changeOutput;
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @param {TxOutput} changeOutput 
	 */
	correctChangeOutput(networkParams, changeOutput) {
		const origFee = this.#body.fee;

		const fee = this.setFee(networkParams, this.estimateFee(networkParams));
		
		const diff = origFee - fee;

		const changeLovelace = changeOutput.value.lovelace + diff;

		changeOutput.value.setLovelace(changeLovelace);
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams
	 */
	checkBalanced(networkParams) {
		const stakeAddrDeposit = new Value(networkParams.stakeAddressDeposit);
		let v = new Value(0n);

		v = this.#body.inputs.reduce((prev, inp) => inp.value.add(prev), v);
		v = this.#body.dcerts.reduce((prev, dcert) => { // add released stakeAddrDeposit
            return dcert.certType === 1 ? prev.add(stakeAddrDeposit) : prev
        }, v);
		v = v.sub(new Value(this.#body.fee));
		v = v.add(new Value(0, this.#body.minted));
		v = this.#body.outputs.reduce((prev, out) => {
			return prev.sub(out.value)
		}, v);
		v = this.#body.dcerts.reduce((prev, dcert) => { // deduct locked stakeAddrDeposit
            return dcert.certType === 0 ? prev.sub(stakeAddrDeposit) : prev
        }, v);

		assert(v.lovelace == 0n, `tx not balanced, net lovelace not zero (${v.lovelace})`);
		assert(v.assets.isZero(), "tx not balanced, net assets not zero");
	}

	/**
	 * Shouldn't be used directly
	 * @internal
	 * @param {NetworkParams} networkParams
	 */
	syncScriptDataHash(networkParams) {
		const hash = this.#witnesses.calcScriptDataHash(networkParams);

		this.#body.setScriptDataHash(hash);
	}

	/**
	 * @internal
	 * @returns {boolean}
	 */
	isSmart() {
		return this.#witnesses.scripts.length > 0;
	}

	/**
	 * Throws an error if there isn't enough collateral
	 * Also throws an error if the script doesn't require collateral, but collateral was actually included
	 * Shouldn't be used directly
	 * @internal
	 * @param {NetworkParams} networkParams 
	 */
	checkCollateral(networkParams) {
		if (this.isSmart()) {
			let minCollateralPct = networkParams.minCollateralPct;

			// only use the exBudget 

			const fee = this.#body.fee;

			this.#body.checkCollateral(networkParams, BigInt(Math.ceil(minCollateralPct*Number(fee)/100.0)));
		} else {
			this.#body.checkCollateral(networkParams, null);
		}
	}

	/**
	 * Throws error if tx is too big
	 * Shouldn't be used directly
	 * @internal
	 * @param {NetworkParams} networkParams 
	 */
	checkSize(networkParams) {
		let size = this.toCbor().length;

		if (size > networkParams.maxTxSize) {
			throw new Error("tx too big");
		}
	}

	/**
	 * Final check that fee is big enough
	 * @internal
	 * @param {NetworkParams} networkParams 
	 */
	checkFee(networkParams) {
		assert(this.estimateFee(networkParams) <= this.#body.fee, `fee too small (${this.#body.fee} < ${this.estimateFee(networkParams)})`);
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams 
	 */
	finalizeValidityTimeRange(networkParams) {
		if (this.#witnesses.anyScriptCallsTxTimeRange() && this.#validFrom === null && this.#validTo === null) {
			const currentSlot = networkParams.liveSlot;
			const now = currentSlot !== null ? new Date(Number(networkParams.slotToTime(currentSlot))) : new Date();

			if (config.VALIDITY_RANGE_START_OFFSET !== null) {
				this.#validFrom = new Date(now.getTime() - 1000*config.VALIDITY_RANGE_START_OFFSET);
			}

			if (config.VALIDITY_RANGE_END_OFFSET !== null) {
				this.#validTo = new Date(now.getTime() + 1000*config.VALIDITY_RANGE_END_OFFSET);
			}

			if (!config.AUTO_SET_VALIDITY_RANGE) {
				console.error("Warning: validity interval is unset but detected usage of tx.time_range in one of the scripts.\nSetting the tx validity interval to a sane default\n(hint: set helios.config.AUTO_SET_VALIDITY_RANGE to true to avoid this warning)");
			}
		}

		if (this.#validTo !== null) {
			this.#body.validTo(
				(typeof this.#validTo === "bigint") ? 
					this.#validTo : 
					networkParams.timeToSlot(BigInt(this.#validTo.getTime()))
			);
		}

		if (this.#validFrom !== null) {
			this.#body.validFrom(
				(typeof this.#validFrom === "bigint") ?
					this.#validFrom :
					networkParams.timeToSlot(BigInt(this.#validFrom.getTime()))
			);
		}
	}

	/**
	 * Executes all the attached scripts with appropriate redeemers and calculates execution budgets.
	 * Balances the transaction, and optionally uses some spare UTxOs if the current inputs don't contain enough lovelace to cover the fees and min output deposits.
	 * 
	 * Inputs, minted assets, and withdrawals are sorted.
	 * 
	 * Sets the validatity range automatically if a call to `tx.time_range` is detected in any of the attached Helios scripts.
	 * @param {NetworkParams} networkParams
	 * @param {Address}       changeAddress
	 * @param {TxInput[]}        spareUtxos - might be used during balancing if there currently aren't enough inputs
	 * @returns {Promise<Tx>}
	 */
	async finalize(networkParams, changeAddress, spareUtxos = []) {
		assert(!this.#valid);

		if (this.#metadata !== null) {
			// Calculate the Metadata hash and add to the TxBody
			this.#body.setMetadataHash(
				new Hash(Crypto.blake2b(this.#metadata.toCbor()))
			);
		}

		// initially dummy for more correct body size, recalculated later
		if (this.#witnesses.redeemers.length > 0) {
			this.#body.setScriptDataHash(new Hash((new Array(32)).fill(0)));
		}

		// auto set the validity time range if the script call tx.time_range
		//  and translate the time range dates to slots
		this.finalizeValidityTimeRange(networkParams);

		// inputs, minted assets, and withdrawals must all be in a particular order
		this.#body.sortInputs();

		// after inputs etc. have been sorted we can calculate the indices of the redeemers referring to those inputs
		this.#witnesses.updateRedeemerIndices(this.#body);

		this.checkScripts();

		// balance the non-ada assets
		this.balanceAssets(changeAddress);

		// sort the assets in the outputs, including the asset change output
		this.#body.sortOutputs();

		// make sure that each output contains the necessary minimum amount of lovelace	
		this.#body.correctOutputs(networkParams);

		// balance the lovelace using maxTxFee as the fee
		const changeOutput = this.balanceLovelace(networkParams, changeAddress, spareUtxos.slice());

		// the scripts executed at this point will not see the correct txHash nor the correct fee
		await this.executeRedeemers(networkParams, changeAddress);

		// balance collateral (if collateral wasn't already set manually)
		this.balanceCollateral(networkParams, changeAddress, spareUtxos.slice());

		// correct the changeOutput now the exact fee is known
		this.correctChangeOutput(networkParams, changeOutput);

		// run updateRedeemerIndices again because new inputs may have been added and sorted
		this.#witnesses.updateRedeemerIndices(this.#body);

		// we can only sync scriptDataHash after the redeemer execution costs have been estimated, and final redeemer indices have been determined
		this.syncScriptDataHash(networkParams);

		// a bunch of checks
		this.#body.checkOutputs(networkParams);

		this.checkCollateral(networkParams);

		await this.checkExecutionBudgets(networkParams);

		this.#witnesses.checkExecutionBudgetLimits(networkParams);

		this.checkSize(networkParams);

		this.checkFee(networkParams);

		this.checkBalanced(networkParams);

		this.#valid = true;

		return this;
	}

	/**
	 * @type {string}
	 */
	get profileReport() {
		return this.#witnesses.profileReport;
	}

	/**
	 * Adds a signature created by a wallet. Only available after the transaction has been finalized.
	 * Optionally verifies that the signature is correct.
	 * @param {Signature} signature 
	 * @param {boolean} verify Defaults to `true`
	 * @returns {Tx}
	 */
	addSignature(signature, verify = true) {
		assert(this.#valid);

		if (verify) {
			signature.verify(this.bodyHash);
		}

		this.#witnesses.addSignature(signature);

		return this;
	}

	/**
	 * Adds multiple signatures at once. Only available after the transaction has been finalized.
	 * Optionally verifies each signature is correct.
	 * @param {Signature[]} signatures 
	 * @param {boolean} verify 
	 * @returns {Tx}
	 */
	addSignatures(signatures, verify = true) {
		for (let s of signatures) {
			this.addSignature(s, verify);
		}

		return this;
	}

	/**
	 * Add metadata to a transaction.
	 * Metadata can be used to store data on-chain,
	 * but can't be consumed by validator scripts.
	 * Metadata can for example be used for [CIP 25](https://cips.cardano.org/cips/cip25/). 
	 * @param {number} tag
	 * @param {Metadata} data
	 * @returns {Tx}
	 */
	addMetadata(tag, data) {
		if (this.#metadata === null) {
			this.#metadata = new TxMetadata();
		}

		this.#metadata.add(tag, data);

		return this;
	}

	/**
	 * @returns {TxId}
	 */
	id() {
		assert(this.#valid, "can't get TxId of unfinalized Tx");
		return new TxId(this.bodyHash);
	}
}

/**
 * inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 */
export class TxBody extends CborData {
	/**
	 * Inputs must be sorted before submitting (first by TxId, then by utxoIndex)
	 * Spending redeemers must point to the sorted inputs
	 * @type {TxInput[]} 
	 */
	#inputs;

	/** @type {TxOutput[]} */
	#outputs;

	/** @type {bigint} in lovelace */
	#fee;

	/** @type {null | bigint} */
	#lastValidSlot;

	/** @type {DCert[]} */
	#dcerts;

	/**
	 * Withdrawals must be sorted by address
	 * Stake rewarding redeemers must point to the sorted withdrawals
	 * @type {Map<Address, bigint>} 
	 */
	#withdrawals;

	/** @type {null | bigint} */
	#firstValidSlot;

	/**
	 * Internally the assets must be sorted by mintingpolicyhash
	 * Minting redeemers must point to the sorted minted assets
	 * @type {Assets} 
	 */
	#minted;

	/** @type {null | Hash} */
	#scriptDataHash;

	/** @type {TxInput[]} */
	#collateral;

	/** @type {PubKeyHash[]} */
	#signers;

	/** @type {null | TxOutput} */
	#collateralReturn;

	/** @type {bigint} */
	#totalCollateral;

	/** @type {TxInput[]} */
	#refInputs;

	/** @type {?Hash} */
	#metadataHash;

	constructor() {
		super();

		this.#inputs = [];
		this.#outputs = [];
		this.#fee = 0n;
		this.#lastValidSlot = null;
		this.#dcerts = [];
		this.#withdrawals = new Map();
		this.#firstValidSlot = null;
		this.#minted = new Assets(); // starts as zero value (i.e. empty map)
		this.#scriptDataHash = null; 
		this.#collateral = [];
		this.#signers = [];
		this.#collateralReturn = null;
		this.#totalCollateral = 0n; // doesn't seem to be used anymore
		this.#refInputs = [];
		this.#metadataHash = null;
	}

	/**
	 * @type {TxInput[]}
	 */
	get inputs() {
		return this.#inputs;
	}

	/**
	 * @type {TxInput[]}
	 */
	get refInputs() {
		return this.#refInputs;
	}

	/**
	 * @type {TxOutput[]}
	 */
	get outputs() {
		return this.#outputs;
	}

	/**
	 * @type {bigint}
	 */
	get fee() {
		return this.#fee;
	}

	/**
	 * @internal
	 * @param {bigint} fee
	 */
	setFee(fee) {
		this.#fee = fee;
	}

	/**
	 * @type {Assets}
	 */
	get minted() {
		return this.#minted;
	}

	/**
	 * @type {TxInput[]}
	 */
	get collateral() {
		return this.#collateral;
	}

	/**
	 * @type {bigint | null}
	 */
	get firstValidSlot() {
		return this.#firstValidSlot;
	}

	/**
	 * @type {bigint | null}
	 */
	get lastValidSlot() {
		return this.#lastValidSlot;
	}

	/**
	 * @type {PubKeyHash[]}
	 */
	get signers() {
		return this.#signers.slice();
	}

	/**
	 * @type {DCert[]}
	 */
	get dcerts() {
		return this.#dcerts.slice();
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		object.set(0, Cbor.encodeDefList(this.#inputs));
		object.set(1, Cbor.encodeDefList(this.#outputs));
		object.set(2, Cbor.encodeInteger(this.#fee));
		
		if (this.#lastValidSlot !== null) {
			object.set(3, Cbor.encodeInteger(this.#lastValidSlot));
		}

		if (this.#dcerts.length != 0) {
			object.set(4, Cbor.encodeDefList(this.#dcerts));
		}

		if (this.#withdrawals.size != 0) {
			throw new Error("not yet implemented");
		}

		if (this.#metadataHash !== null) {
			object.set(7, this.#metadataHash.toCbor());
		}

		if (this.#firstValidSlot !== null) {
			object.set(8, Cbor.encodeInteger(this.#firstValidSlot));
		}

		if (!this.#minted.isZero()) {
			object.set(9, this.#minted.toCbor());
		}

		if (this.#scriptDataHash !== null) {
			object.set(11, this.#scriptDataHash.toCbor());
		}

		if (this.#collateral.length != 0) {
			object.set(13, Cbor.encodeDefList(this.#collateral));
		}

		if (this.#signers.length != 0) {
			object.set(14, Cbor.encodeDefList(this.#signers));
		}

		// what is NetworkId used for, seems a bit useless?
		// object.set(15, Cbor.encodeInteger(2n));

		if (this.#collateralReturn !== null) {
			object.set(16, this.#collateralReturn.toCbor());
		}

		if (this.#totalCollateral > 0n) {
			object.set(17, Cbor.encodeInteger(this.#totalCollateral));
		}

		if (this.#refInputs.length != 0) {
			object.set(18, Cbor.encodeDefList(this.#refInputs));
		}

		return Cbor.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {TxBody}
	 */
	static fromCbor(bytes) {
		const txBody = new TxBody();

		const done = Cbor.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#inputs.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 1:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#outputs.push(TxOutput.fromCbor(itemBytes));
					})
					break;
				case 2:
					txBody.#fee = Cbor.decodeInteger(fieldBytes);
					break;
				case 3:
					txBody.#lastValidSlot = Cbor.decodeInteger(fieldBytes);
					break;
				case 4:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#dcerts.push(DCert.fromCbor(itemBytes));
					});
					break;
				case 5:
					throw new Error("not yet implemented");
				case 6:
					throw new Error("not yet implemented");
				case 7:
					txBody.#metadataHash = Hash.fromCbor(fieldBytes);
					break;
				case 8:
					txBody.#firstValidSlot = Cbor.decodeInteger(fieldBytes);
					break;
				case 9:
					txBody.#minted = Assets.fromCbor(fieldBytes);
					break;
				case 10:
					throw new Error("unhandled field");
				case 11:
					txBody.#scriptDataHash = Hash.fromCbor(fieldBytes);
					break;
				case 12:
					throw new Error("unhandled field");
				case 13:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#collateral.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 14:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#signers.push(PubKeyHash.fromCbor(itemBytes));
					});
					break;
				case 15:
					// ignore the network Id
					void Cbor.decodeInteger(fieldBytes);
					break;
				case 16:
					txBody.#collateralReturn = TxOutput.fromCbor(fieldBytes);
					break;
				case 17:
					txBody.#totalCollateral = Cbor.decodeInteger(fieldBytes);
					break;
				case 18:
					Cbor.decodeList(fieldBytes, itemBytes => {
						txBody.#refInputs.push(TxInput.fromCbor(fieldBytes));
					});
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(done.has(0) && done.has(1) && done.has(2));

		return txBody;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			inputs: this.#inputs.map(input => input.dump()),
			outputs: this.#outputs.map(output => output.dump()),
			fee: this.#fee.toString(),
			lastValidSlot: this.#lastValidSlot === null ? null : this.#lastValidSlot.toString(),
			firstValidSlot: this.#firstValidSlot === null ? null : this.#firstValidSlot.toString(),
			minted: this.#minted.isZero() ? null : this.#minted.dump(),
			metadataHash: this.#metadataHash === null ? null : this.#metadataHash.dump(),
			scriptDataHash: this.#scriptDataHash === null ? null : this.#scriptDataHash.dump(),
			certificates: this.#dcerts.length == 0 ? null : this.#dcerts.map(dc => dc.dump()),
			collateral: this.#collateral.length == 0 ? null : this.#collateral.map(c => c.dump()),
			signers: this.#signers.length == 0 ? null : this.#signers.map(rs => rs.dump()),
			collateralReturn: this.#collateralReturn === null ? null : this.#collateralReturn.dump(),
			//totalCollateral: this.#totalCollateral.toString(), // doesn't seem to be used anymore
			refInputs: this.#refInputs.map(ri => ri.dump()),
		};
	}

	/**
	 * For now simply returns minus infinity to plus infinity (WiP)
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @returns {ConstrData}
	 */
	toValidTimeRangeData(networkParams) {
		return new ConstrData(0, [
			new ConstrData(0, [ // LowerBound
				this.#firstValidSlot === null ? new ConstrData(0, []) : new ConstrData(1, [new IntData(networkParams.slotToTime(this.#firstValidSlot))]), // NegInf
				new ConstrData(1, []), // true
			]),
			new ConstrData(0, [ // UpperBound
				this.#lastValidSlot === null ? new ConstrData(2, []) : new ConstrData(1, [new IntData(networkParams.slotToTime(this.#lastValidSlot))]), // PosInf
				new ConstrData(this.#lastValidSlot === null ? 1 : 0, []), // false if slot is set, true if slot isn't set
			]),
		]);
	}

	/**
	 * A serialized tx throws away input information
	 * This must be refetched from the network if the tx needs to be analyzed
	 * @internal
	 * @param {(id: TxOutputId) => Promise<TxOutput>} fn
	 * @param {TxWitnesses} witnesses
	 */
	async completeInputData(fn, witnesses) {
		const indices = [];
		const ids = [];

		for (let i = 0; i < this.#inputs.length; i++) {
			const input = this.#inputs[i];

			if (!input.hasOrigOutput()) {
				indices.push(i);
				ids.push(input.outputId);
			}
		}

		const offset = this.#inputs.length;

		for (let i = 0; i < this.#refInputs.length; i++) {
			const refInput = this.#refInputs[i];

			if (!refInput.hasOrigOutput()) {
				indices.push(offset + i);
				ids.push(refInput.outputId);
			}
		}

		const outputs = await Promise.all(ids.map(id => fn(id)));

		outputs.forEach((output, j) => {
			const i = indices[j];

			if (output.refScript) {
				witnesses.attachRefScript(output.refScript)
			}
			
			if (i < offset) {
				this.#inputs[i].setOrigOutput(output)
			} else {
				this.#refInputs[i-offset].setOrigOutput(output)
			}
		});
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @param {Redeemer[]} redeemers
	 * @param {ListData} datums 
	 * @param {TxId} txId
	 * @returns {ConstrData}
	 */
	toTxData(networkParams, redeemers, datums, txId) {
		return new ConstrData(0, [
			new ListData(this.#inputs.map(input => input.toData())),
			new ListData(this.#refInputs.map(input => input.toData())),
			new ListData(this.#outputs.map(output => output.toData())),
			(new Value(this.#fee))._toUplcData(),
			// NOTE: all other Value instances in ScriptContext contain some lovelace, but #minted can never contain any lovelace, yet cardano-node always prepends 0 lovelace to the #minted MapData
			(new Value(0n, this.#minted))._toUplcData(true), 
			new ListData(this.#dcerts.map(cert => cert.toData())),
			new MapData(Array.from(this.#withdrawals.entries()).map(w => [w[0].toStakingData(), new IntData(w[1])])),
			this.toValidTimeRangeData(networkParams),
			new ListData(this.#signers.map(rs => new ByteArrayData(rs.bytes))),
			new MapData(redeemers.map(r => [r.toScriptPurposeData(this), r.data])),
			new MapData(datums.list.map(d => [
				new ByteArrayData(Crypto.blake2b(d.toCbor())), 
				d
			])),
			new ConstrData(0, [new ByteArrayData(txId.bytes)])
		]);
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {Redeemer[]} redeemers
	 * @param {ListData} datums
	 * @param {number} redeemerIdx
	 * @param {TxId} txId
	 * @returns {UplcData}
	 */
	toScriptContextData(networkParams, redeemers, datums, redeemerIdx, txId = TxId.dummy()) {		
		return new ConstrData(0, [
			// tx (we can't know the txId right now, because we don't know the execution costs yet, but a dummy txId should be fine)
			this.toTxData(networkParams, redeemers, datums, txId),
			redeemers[redeemerIdx].toScriptPurposeData(this),
		]);
	}

	/**
	 * @returns {Value}
	 */
	sumInputValue() {
		let sum = new Value();

		for (let input of this.#inputs) {
			if (input.origOutput !== null) {
				sum = sum.add(input.origOutput.value);
			}
		}

		return sum;
	}

	/**
	 * Throws error if any part of the sum is negative (i.e. more is burned than input)
	 * @returns {Value}
	 */
	sumInputAndMintedValue() {
		return this.sumInputValue().add(new Value(0n, this.#minted)).assertAllPositive();
	}

	/**
	 * @returns {Assets}
	 */
	sumInputAndMintedAssets() {
		return this.sumInputAndMintedValue().assets;
	}

	/**
	 * @returns {Value}
	 */
	sumOutputValue() {
		let sum = new Value();

		for (let output of this.#outputs) {
			sum = sum.add(output.value);
		}

		return sum;
	}

	/**
	 * @returns {Assets}
	 */
	sumOutputAssets() {
		return this.sumOutputValue().assets;
	}

	/**
	 * @internal
	 * @param {bigint} slot
	 */
	validFrom(slot) {
		this.#firstValidSlot = slot;
	}

	/**
	 * @internal
	 * @param {bigint} slot
	 */
	validTo(slot) {
		this.#lastValidSlot = slot;
	}

	/**
	 * Throws error if this.#minted already contains mph
	 * @internal
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph - minting policy hash
	 * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens
	 */
	addMint(mph, tokens) {
		this.#minted.addTokens(mph, tokens);
	}

	/**
	 * @internal
	 * @param {TxInput} input 
	 * @param {boolean} checkUniqueness
	 */
	addInput(input, checkUniqueness = true) {
		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		}

		input.origOutput.value.assertAllPositive();

		if (checkUniqueness) {
			assert(this.#inputs.every(prevInput => {
				return  !prevInput.txId.eq(input.txId) || prevInput.utxoIdx != input.utxoIdx
			}), "input already added before");
		}

		// push, then sort immediately
		this.#inputs.push(input);
		this.#inputs.sort(TxInput.comp);
	}

	/**
	 * Used to remove dummy inputs
	 * Dummy inputs are needed to be able to correctly estimate fees
	 * Throws an error if input doesn't exist in list of inputs
	 * @internal
	 * @param {TxInput} input
	 */
	removeInput(input) {
		let idx = -1;

		// search from end, so removal is exact inverse of addition
		for (let i = this.#inputs.length - 1; i >= 0; i--) {
			if (this.#inputs[i] == input) {
				idx = i;
				break;
			}
		}

		const n = this.#inputs.length;

		assert(idx != -1, "input not found");

		this.#inputs = this.#inputs.filter((_, i) => i != idx);

		assert(this.#inputs.length == n - 1, "input not removed");
	}

	/**
	 * @internal
	 * @param {TxInput} input 
	 * @param {boolean} checkUniqueness
	 */
	addRefInput(input, checkUniqueness = true) {
		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		}

		input.origOutput.value.assertAllPositive();

		if (checkUniqueness) {
			assert(this.#refInputs.every(prevInput => {
				return  !prevInput.txId.eq(input.txId) || prevInput.utxoIdx != input.utxoIdx
			}), "refInput already added before");
		}

		// push, then sort immediately
		this.#refInputs.push(input);
		this.#refInputs.sort(TxInput.comp);
	}

	/**
	 * @internal
	 * @param {TxOutput} output
	 */
	addOutput(output) {
		output.value.assertAllPositive();

		this.#outputs.push(output);
	}

	/**
	 * Used to remove dummy outputs
	 * Dummy outputs are needed to be able to correctly estimate fees
	 * Throws an error if the output doesn't exist in list of outputs
	 * @internal
	 * @param {TxOutput} output 
	 */
	removeOutput(output) {
		let idx = -1;

		// search from end, so removal is exact inverse of addition
		for (let i = this.#outputs.length - 1; i >= 0; i--) {
			if (this.#outputs[i] == output) {
				idx = i;
				break;
			}
		}

		const n = this.#outputs.length;

		assert(idx != -1, "output not found");

		this.#outputs = this.#outputs.filter((_, i) => i != idx);

		assert(this.#outputs.length == n - 1, "output not removed");
	}

	/**
	 * @internal
	 * @param {PubKeyHash} hash 
	 * @param {boolean} checkUniqueness
	 */
	addSigner(hash, checkUniqueness = true) {
		if (checkUniqueness) {
			assert(this.#signers.every(prevSigner => {
				return  !prevSigner.eq(hash);
			}), "signer already added before");
		}


		this.#signers.push(hash);
		this.#signers.sort(Hash.compare);
	}

	/**
	 * @internal
	 * @param {DCert} dcert 
	 */
	addDCert(dcert) {
		this.#dcerts.push(dcert);

		const reqSigTypes = [1,2]; // stake de-reg, stake deleg
		if (reqSigTypes.includes(dcert.certType)){
			if (dcert.credentialType === 0) { // for address key hash only
				this.addSigner(dcert.stakeHash);
			}
		}
	}

	/**
	 * @internal
	 * @param {TxInput} input 
	 */
	addCollateral(input) {
		this.#collateral.push(input);
	}
	
	/**
	 * @internal
	 * @param {Hash | null} scriptDataHash
	 */
	setScriptDataHash(scriptDataHash) {
		this.#scriptDataHash = scriptDataHash;
	}

	/**
	 * @internal
	 * @param {Hash} metadataHash
	 */
	setMetadataHash(metadataHash) {
		this.#metadataHash = metadataHash;
	}

	/**
	 * @internal
	 * @param {TxOutput | null} output 
	 */
	setCollateralReturn(output) {
		this.#collateralReturn = output;
	}

	/**
	 * Calculates the number of dummy signatures needed to get precisely the right tx size.
	 * @internal
	 * @returns {number}
	 */
	countUniqueSigners() {
		/** @type {Set<PubKeyHash>} */
		let set = new Set();

		const inputs = this.#inputs.concat(this.#collateral);

		for (let input of inputs) {
			let origOutput = input.origOutput;

			if (origOutput !== null) {
				let pubKeyHash = origOutput.address.pubKeyHash;

				if (pubKeyHash !== null) {
					set.add(pubKeyHash);
				}
			}
		}

		for (let rs of this.#signers) {
			set.add(rs);
		}

		return set.size;
	}

	/**
	 * Script hashes are found in addresses of TxInputs and hashes of the minted MultiAsset.
	 * @internal
	 * @param {Map<string, number>} set - hashes in hex format
	 */
	collectScriptHashes(set) {
		for (let i = 0; i < this.#inputs.length; i++) {
			const input = this.#inputs[i];

			if (input.origOutput !== null) {
				let scriptHash = input.origOutput.address.validatorHash;

				if (scriptHash !== null) {
					const hash = bytesToHex(scriptHash.bytes);

					if (!set.has(hash)) { 
						set.set(hash, i);
					}
				}
			}
		}

		let mphs = this.#minted.mintingPolicies;

		for (let i = 0; i < mphs.length; i++) {
			const mph = mphs[i];

			const hash = bytesToHex(mph.bytes);

			if (!set.has(hash)) {
				set.set(hash, -i-1);
			}
		}
	}

	/**
	 * Makes sure each output contains the necessary min lovelace.
	 * @internal
	 * @param {NetworkParams} networkParams
	 */
	correctOutputs(networkParams) {
		for (let output of this.#outputs) {
			output.correctLovelace(networkParams);
		}
	}

	/**
	 * Checks that each output contains enough lovelace
	 * @internal
	 * @param {NetworkParams} networkParams
	 */
	checkOutputs(networkParams) {
		for (let output of this.#outputs) {
			let minLovelace = output.calcMinLovelace(networkParams);

			assert(minLovelace <= output.value.lovelace, `not enough lovelace in output (expected at least ${minLovelace.toString()}, got ${output.value.lovelace})`);

			output.value.assets.assertSorted();
		}
	}
	
	/**
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @param {null | bigint} minCollateral 
	 */
	checkCollateral(networkParams, minCollateral) {
		assert(this.#collateral.length <= networkParams.maxCollateralInputs);

		if (minCollateral === null) {
			assert(this.#collateral.length == 0, "unnecessary collateral included");
		} else {
			let sum = new Value();

			for (let col of this.#collateral) {
				if (col.origOutput === null) {
					throw new Error("expected collateral TxInput.origOutput to be set");
				} else if (!col.origOutput.value.assets.isZero()) {
					throw new Error("collateral can only contain lovelace");
				} else {
					sum = sum.add(col.origOutput.value);
				}
			}

			if (this.#collateralReturn != null) {
				sum = sum.sub(this.#collateralReturn.value);
			}

			assert(sum.lovelace >= minCollateral, "not enough collateral");

			if (sum.lovelace > minCollateral*5n){
				console.error("Warning: way too much collateral");
			}
		}
	}

	/**
	 * Makes sore inputs, withdrawals, and minted assets are in correct order, this is needed for the redeemer indices
	 * Mutates
	 * @internal
	 */
	sortInputs() {
		// inputs should've been added in sorted manner, so this is just a check
		this.#inputs.forEach((input, i) => {
			if (i > 0) {
				const prev = this.#inputs[i-1];

				// can be less than -1 if utxoIds aren't consecutive
				assert(TxInput.comp(prev, input) <= -1, "inputs not sorted");
			}
		});

		// same for ref inputs
		this.#refInputs.forEach((input, i) => {
			if (i > 0) {
				const prev = this.#refInputs[i-1];

				// can be less than -1 if utxoIds aren't consecutive
				assert(TxInput.comp(prev, input) <= -1, "refInputs not sorted");
			}
		});

		// TODO: also add withdrawals in sorted manner
		this.#withdrawals = new Map(Array.from(this.#withdrawals.entries()).sort((a, b) => {
			return Address.compStakingHashes(a[0], b[0]);
		}));

		// minted assets should've been added in sorted manner, so this is just a check
		this.#minted.assertSorted();
	}


	/**
	 * Not done in the same routine as sortInputs(), because balancing of assets happens after redeemer indices are set
	 * @internal
	 */
	sortOutputs() {
		// sort the tokens in the outputs, needed by the flint wallet
		this.#outputs.forEach(output => {
			output.value.assets.sort();
		});
	}

	/**
	 * Used by (indirectly) by emulator to check if slot range is valid.
	 * Note: firstValidSlot == lastValidSlot is allowed
	 * @internal
	 * @param {bigint} slot
	 */
	isValid(slot) {
		if (this.#lastValidSlot != null) {
			if (slot > this.#lastValidSlot) {
				return false;
			}
		}

		if (this.#firstValidSlot != null) {
			if (slot < this.#firstValidSlot) {
				return false;
			}
		}

		return true;
	}

	/**
	 * @internal
	 * @returns {number[]}
	 */
	hash() {
		return Crypto.blake2b(this.toCbor());
	}
}

/**
 * Represents the pubkey signatures, and datums/redeemers/scripts that are witnessing a transaction.
 */
export class TxWitnesses extends CborData {
	/** @type {Signature[]} */
	#signatures;

	/** @type {ListData} */
	#datums;

	/** @type {Redeemer[]} */
	#redeemers;

	/**
	 * @type {number[][]}
	 */
	#v1Scripts;

	/** @type {UplcProgram[]} */
	#scripts;

	/** @type {UplcProgram[]} */
	#refScripts;

	/** @type {NativeScript[]} */
	#nativeScripts;

	constructor() {
		super();
		this.#signatures = [];
		this.#datums = new ListData([]);
		this.#redeemers = [];
		this.#v1Scripts = []; // for backward compatibility with some wallets
		this.#scripts = []; // always plutus v2
		this.#refScripts = [];
		this.#nativeScripts = [];
	}

	/**
	 * Gets the list of `Signature` instances contained in this witness set.
	 * @type {Signature[]}
	 */
	get signatures() {
		return this.#signatures;
	}

	/**
	 * Returns all the scripts, including the reference scripts
	 * @type {(UplcProgram | NativeScript)[]}
	 */
	get scripts() {
		/**
		 * @type {(UplcProgram | NativeScript)[]}
		 */
		let allScripts = this.#scripts.slice().concat(this.#refScripts.slice())
		
		allScripts = allScripts.concat(this.#nativeScripts.slice());

		return allScripts;
	}

	/**
	 * @type {Redeemer[]}
	 */
	get redeemers() {
		return this.#redeemers;
	}

	/**
	 * @type {ListData}
	 */
	get datums() {
		return this.#datums;
	}

	/**
	 * @param {ValidatorHash | MintingPolicyHash} h 
	 * @returns {boolean}
	 */
	isNativeScript(h) {
		return this.#nativeScripts.some(s => eq(s.hash(), h.bytes));
	}

	/**
	 * @internal
	 * @returns {boolean}
	 */
	anyScriptCallsTxTimeRange() {
		return this.scripts.some(s => (s instanceof UplcProgram) && s.properties.callsTxTimeRange);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		if (this.#signatures.length > 0) {
			object.set(0, Cbor.encodeDefList(this.#signatures));
		}
		
		if (this.#nativeScripts.length > 0) {
			object.set(1, Cbor.encodeDefList(this.#nativeScripts));
		}

		if (this.#v1Scripts.length > 0) {
			object.set(3, Cbor.encodeDefList(this.#v1Scripts));
		}

		if (this.#datums.list.length > 0) {
			object.set(4, this.#datums.toCbor());
		}

		if (this.#redeemers.length > 0) {
			object.set(5, Cbor.encodeDefList(this.#redeemers));
		}

		if (this.#scripts.length > 0) {
			/**
			 * @type {number[][]}
			 */
			let scriptBytes = this.#scripts.map(s => s.toCbor());

			object.set(6, Cbor.encodeDefList(scriptBytes));
		}

		return Cbor.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxWitnesses}
	 */
	static fromCbor(bytes) {
		let txWitnesses = new TxWitnesses();

		Cbor.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#signatures.push(Signature.fromCbor(itemBytes));
					});
					break;
				case 1:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#nativeScripts.push(NativeScript.fromCbor(itemBytes));
					});
					break;
				case 2:
					throw new Error(`unhandled TxWitnesses field ${i}`);
				case 3:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#v1Scripts.push(itemBytes);
					});
					break;
				case 4:
					txWitnesses.#datums = ListData.fromCbor(fieldBytes);
					break;
				case 5:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#redeemers.push(Redeemer.fromCbor(itemBytes));
					});
					break;
				case 6:
					Cbor.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#scripts.push(UplcProgram.fromCbor(itemBytes));
					});
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		return txWitnesses;
	}

	/**
	 * Throws error if signatures are incorrect
	 * @internal
	 * @param {number[]} bodyBytes 
	 */
	verifySignatures(bodyBytes) {
		for (let signature of this.#signatures) {
			signature.verify(Crypto.blake2b(bodyBytes));
		}
	}

	/**
	 * @param {null | NetworkParams} params 
	 * @param {null | TxBody} body
	 * @returns {Object}
	 */
	dump(params = null, body = null) {
		return {
			signatures: this.#signatures.map(pkw => pkw.dump()),
			datums: this.#datums.list.map(datum => datum.toString()),
			redeemers: this.#redeemers.map((redeemer, i) => {
				const obj = redeemer.dump()
				if (params && body) {
					const scriptContext = body.toScriptContextData(params, this.#redeemers, this.#datums, i);
					
					obj["ctx"] = scriptContext.toCborHex();

					if (redeemer instanceof SpendingRedeemer) {
						const idx = redeemer.inputIndex;
			
						const origOutput = body.inputs[idx].origOutput;
			
						if (origOutput === null) {
							throw new Error("expected origOutput to be non-null");
						} else {
							const datumData = origOutput.getDatumData();

							obj["datum"] = datumData.toCborHex();
						}
					}
				}

				return obj;
			}),
			nativeScripts: this.#nativeScripts.map(script => script.toJson()),
			scripts: this.#scripts.map(script => bytesToHex(script.toCbor())),
			refScripts: this.#refScripts.map(script => bytesToHex(script.toCbor())),
		};
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		let sum = 0n;

		for (let redeemer of this.#redeemers) {
			sum += redeemer.estimateFee(networkParams);
		}

		return sum;
	}

	/**
	 * @internal
	 * @param {Signature} signature 
	 */
	addSignature(signature) {
		// only add unique signautres
		if (this.#signatures.every(s => !s.isDummy() && !s.pubKeyHash.eq(signature.pubKeyHash))) {
			this.#signatures.push(signature);
		}
	}

	/**
	 * @internal
	 * @param {number} n
	 */
	addDummySignatures(n) {
		for (let i = 0 ; i < n; i++) {
			this.#signatures.push(Signature.dummy());
		}
	}

	/**
	 * @internal
	 */
	removeDummySignatures() {
		this.#signatures = this.#signatures.filter(pkw => !pkw.isDummy());
	}

	/**
	 * Index is calculated later
	 * @internal
	 * @param {TxInput} input
	 * @param {UplcData} redeemerData 
	 */
	addSpendingRedeemer(input, redeemerData) {
		this.#redeemers.push(new SpendingRedeemer(input, -1, redeemerData)); // actual input index is determined later
	}

	/**
	 * @internal
	 * @param {MintingPolicyHash} mph
	 * @param {UplcData} redeemerData
	 */
	addMintingRedeemer(mph, redeemerData) {
		this.#redeemers.push(new MintingRedeemer(mph, -1, redeemerData));
	}

	/**
	 * @internal
	 * @param {UplcData} data 
	 */
	addDatumData(data) {
		// check that it hasn't already been included
		for (let prev of this.#datums.list) {
			if (eq(prev.toCbor(), data.toCbor())) {
				return;
			}
		}

		let lst = this.#datums.list;
		lst.push(data);

		this.#datums = new ListData(lst);
	}

	/**
	 * @internal
	 * @param {NativeScript} script 
	 */
	attachNativeScript(script) {
		const h = script.hash();

		if (this.#nativeScripts.some(other => eq(h, other.hash()))) {
			return;
		} else {
			this.#nativeScripts.push(script);
		}
	}

	/**
	 * @internal
	 * @param {UplcProgram} script 
	 */
	attachRefScript(script) {
		if (this.#refScripts.some(s => eq(s.hash(), script.hash()))) {
			return;
		}

		this.#refScripts.push(script);
	}

	/**
	 * Throws error if script was already added before.
	 * @internal
	 * @param {UplcProgram} program 
	 * @param {boolean} isRef
	 */
	attachPlutusScript(program, isRef = false) {
		const h = program.hash();

		if (isRef) {
			assert(this.#scripts.every(s => !eq(s.hash(), h)));

			if (this.#refScripts.some(s => eq(s.hash(), h))) {
				return;
			} else {
				this.#refScripts.push(program);
			}
		} else {
			assert(this.#refScripts.every(s => !eq(s.hash(), h)));

			if (this.#scripts.some(s => eq(s.hash(), h))) {
				return;
			} else {
				this.#scripts.push(program);
			}
		}
	}

	/**
	 * Retrieves either a regular script or a reference script.
	 * @internal
	 * @param {Hash} scriptHash - can be ValidatorHash or MintingPolicyHash
	 * @returns {UplcProgram}
	 */
	getUplcProgram(scriptHash) {
		const p = this.scripts.find(s => eq(s.hash(), scriptHash.bytes));

		if (!(p instanceof UplcProgram)) {
			throw new Error("not a uplc program");
		}

		return p;
	}

	/**
	 * @internal
	 * @param {TxBody} body
	 */
	updateRedeemerIndices(body) {
		for (let redeemer of this.#redeemers) {
			redeemer.updateIndex(body);
		}
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @returns {Hash | null} - returns null if there are no redeemers
	 */
	calcScriptDataHash(networkParams) {
		if (this.#redeemers.length > 0) {
			let bytes = Cbor.encodeDefList(this.#redeemers);

			if (this.#datums.list.length > 0) {
				bytes = bytes.concat(this.#datums.toCbor());
			}

			// language view encodings?
			let sortedCostParams = networkParams.sortedCostParams;

			bytes = bytes.concat(Cbor.encodeMap([[
				Cbor.encodeInteger(1n), 
				Cbor.encodeDefList(sortedCostParams.map(cp => Cbor.encodeInteger(BigInt(cp)))),
			]]));

			return new Hash(Crypto.blake2b(bytes));
		} else {
			return null;
		}
	}

	/**
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body
	 * @param {Redeemer} redeemer 
	 * @param {UplcData} scriptContext
	 * @returns {Promise<Profile>} 
	 */
	async executeRedeemer(networkParams, body, redeemer, scriptContext) {
		if (redeemer instanceof SpendingRedeemer) {
			const idx = redeemer.inputIndex;

			const origOutput = body.inputs[idx].origOutput;

			if (origOutput === null) {
				throw new Error("expected origOutput to be non-null");
			} else {
				const datumData = origOutput.getDatumData();

				const validatorHash = origOutput.address.validatorHash;

				if (validatorHash === null || validatorHash === undefined) {
					throw new Error("expected validatorHash to be non-null");
				} else {
					const script = this.getUplcProgram(validatorHash);

					if (script.properties.name) {
						redeemer.setProgramName(script.properties.name);
					}

					const args = [
						new UplcDataValue(Site.dummy(), datumData), 
						new UplcDataValue(Site.dummy(), redeemer.data), 
						new UplcDataValue(Site.dummy(), scriptContext),
					];

					const profile = await script.profile(args, networkParams);

					profile.messages?.forEach(m => console.log(m));

					if (profile.result instanceof UserError || profile.result instanceof RuntimeError) {	
						if (script.properties.name) {
							profile.result.context["name"] = script.properties.name;
						}
						profile.result.context["Datum"] = bytesToHex(datumData.toCbor());
						profile.result.context["Redeemer"] = bytesToHex(redeemer.data.toCbor());
						profile.result.context["ScriptContext"] = bytesToHex(scriptContext.toCbor());
						throw profile.result;
					} else {
						return profile;
					}
				}
			}
		} else if (redeemer instanceof MintingRedeemer) {
			const mph = body.minted.mintingPolicies[redeemer.mphIndex];

			const script = this.getUplcProgram(mph);

			if (script.properties.name) {
				redeemer.setProgramName(script.properties.name);
			}

			const args = [
				new UplcDataValue(Site.dummy(), redeemer.data),
				new UplcDataValue(Site.dummy(), scriptContext),
			];

			const profile = await script.profile(args, networkParams);

			profile.messages?.forEach(m => console.log(m));

			if (profile.result instanceof UserError || profile.result instanceof RuntimeError) {
				if (script.properties.name) {
					profile.result.context["name"] = script.properties.name;
				}
				profile.result.context["Redeemer"] = bytesToHex(redeemer.data.toCbor());
				profile.result.context["ScriptContext"] = bytesToHex(scriptContext.toCbor());
				throw profile.result;
			} else {
				return profile;
			}
		} else {
			throw new Error("unhandled redeemer type");
		}
	}

	/**
	 * Executes the redeemers in order to calculate the necessary ex units
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body - needed in order to create correct ScriptContexts
	 * @param {Address} changeAddress - needed for dummy input and dummy output
	 * @returns {Promise<void>}
	 */
	async executeScripts(networkParams, body, changeAddress) {
		await this.executeRedeemers(networkParams, body, changeAddress);

		this.executeNativeScripts(body);
	}
	
	/**
	 * @internal
	 * @param {TxBody} body
	 */
	executeNativeScripts(body) {
		const ctx = new NativeContext(body.firstValidSlot, body.lastValidSlot, body.signers);

		this.#nativeScripts.forEach(s => {
			if (!s.eval(ctx)) {
				throw new Error("native script execution returned false");
			}
		});
	}

	/**
	 * Executes the redeemers in order to calculate the necessary ex units
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body - needed in order to create correct ScriptContexts
	 * @param {Address} changeAddress - needed for dummy input and dummy output
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, body, changeAddress) {
		assert(config.N_DUMMY_INPUTS == 1 || config.N_DUMMY_INPUTS == 2, "expected N_DUMMY_INPUTS==1 or N_DUMMY_INPUTS==2");
		const twoDummyInputs = config.N_DUMMY_INPUTS == 2;

		const fee = networkParams.maxTxFee;

		// Additional 2 dummy inputs and 1 dummy output to compensate for balancing inputs and outputs that might be added later
		// The reason for needing 2 dummy inputs is that one needs to be at the beginning of the body.inputs list (TxId 0000...), and the other needs TxId ffffff (at the end of the list)
		// TxId ffffff overestimates the cost of printing the TxIds, and the dummy TxId 00000 overestimates iterating over body.inputs
		// We can't just prepend a dummy input with TxId ffffff, because some scripts might be relying on the order of the inputs (eg. counting votes in DAOs)

		// 1000 ADA should be enough as a dummy input/output
		const dummyInput1 = new TxInput(
			new TxOutputId(TxId.dummy(0), 0),
			new TxOutput(
				changeAddress,
				new Value(fee + 1000_000_000n)
			)
		);
		
		const dummyInput2 = new TxInput(
			new TxOutputId(TxId.dummy(255), 999),
			new TxOutput(
				changeAddress,
				new Value(1000_000_000n)
			)
		);

		const dummyOutput = new TxOutput(
			changeAddress,
			new Value(twoDummyInputs ? 2000_000_000n : 1000_000_000n)
		);

		body.setFee(fee);
		body.addInput(dummyInput1, false);
		if (twoDummyInputs) {
			body.addInput(dummyInput2, false);
		}
		body.addOutput(dummyOutput);

		this.updateRedeemerIndices(body);

		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];

			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i);

			const cost = await this.executeRedeemer(networkParams, body, redeemer, scriptContext);

			redeemer.setProfile(cost);
		}

		body.removeInput(dummyInput1);
		if (twoDummyInputs) {
			body.removeInput(dummyInput2);
		}
		body.removeOutput(dummyOutput);

		this.updateRedeemerIndices(body);
	}

	/**
	 * Reruns all the redeemers to make sure the ex budgets are still correct (can change due to outputs added during rebalancing)
	 * @internal
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body 
	 */
	async checkExecutionBudgets(networkParams, body) {
		// when check the tx is assumed to be finalized, so we can use the actual txId
		const txId = new TxId(body.hash());

		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];
			
			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i, txId);

			const cost = await this.executeRedeemer(networkParams, body, redeemer, scriptContext);

			if (redeemer.memCost < cost.mem) {
				throw new Error(`internal finalization error, redeemer mem budget too low (${redeemer.memCost} < ${cost.mem})`);
			} else if (redeemer.cpuCost < cost.cpu) {
				throw new Error(`internal finalization error, redeemer cpu budget too low (${redeemer.cpuCost} < ${cost.cpu})`);
			}
		}
	}

	/**
	 * Throws error if execution budget is exceeded
	 * @internal
	 * @param {NetworkParams} networkParams
	 */
	checkExecutionBudgetLimits(networkParams) {
		let totalMem = 0n;
		let totalCpu = 0n;

		for (let redeemer of this.#redeemers) {
			totalMem += redeemer.memCost;
			totalCpu += redeemer.cpuCost;
		}

		let [maxMem, maxCpu] = networkParams.maxTxExecutionBudget;

		if (totalMem > BigInt(maxMem)) {
			throw new Error(`execution budget exceeded for mem (${totalMem.toString()} > ${maxMem.toString()})\n${this.profileReport.split("\n").map(l => "  " + l).join("\n")}`);
		}

		if (totalCpu > BigInt(maxCpu)) {
			throw new Error(`execution budget exceeded for cpu (${totalCpu.toString()} > ${maxCpu.toString()})\n${this.profileReport.split("\n").map(l => "  " + l).join("\n")}`);
		}
	}

	/**
	 * Compiles a report of each redeemer execution.
	 * Only works after the tx has been finalized.
	 * @type {string}
	 */
	get profileReport() {
		/**
		 * @type {string[]}
		 */
		let report = [];

		for (let redeemer of this.#redeemers) {
			let header = "";

			if (redeemer instanceof SpendingRedeemer) {
				header = `SpendingRedeemer ${redeemer.inputIndex.toString()}`;
			} else if (redeemer instanceof MintingRedeemer) {
				header = `MintingRedeemer ${redeemer.mphIndex.toString()}`;
			} else {
				throw new Error("unhandled Redeemer type");
			}

			header += `${redeemer.programName ? ` (${redeemer.programName})` : ""}: mem=${redeemer.memCost.toString()}, cpu=${redeemer.cpuCost.toString()}`;

			report.push(header);

			if (redeemer.profile.builtins) {
				report.push(`  builtins`);

				for (let k in redeemer.profile.builtins) {
					const c = redeemer.profile.builtins[k];
					report.push(`    ${k}: mem=${c.mem}, cpu=${c.cpu}`);
				}
			}

			if (redeemer.profile.terms) {
				report.push(`  terms`);

				for (let k in redeemer.profile.terms) {
					const c = redeemer.profile.terms[k];

					report.push(`    ${k}: mem=${c.mem}, cpu=${c.cpu}`);
				}
			}
		}

		return report.join("\n");
	}
}

/**
 * TxInput base-type
 */
export class TxInput extends CborData {
	/** 
	 * @readonly
	 * @type {TxOutputId} 
	 */
	outputId;

	/** 
	 * @type {null | TxOutput} 
	 */
	#output;

	/**
	 * @param {TxOutputId} outputId 
	 * @param {null | TxOutput} output - used during building, not part of serialization
	 */
	constructor(outputId, output = null) {
		super();
		this.outputId = outputId;
		this.#output = output;
	}
	
	/**
	 * @deprecated
	 * @type {TxId}
	 */
	get txId() {
		return this.outputId.txId;
	}

	/**
	 * @deprecated
	 * @type {number}
	 */
	get utxoIdx() {
		return Number(this.outputId.utxoIdx);
	}

	/**
	 * 
	 * @param {TxInput} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return other.outputId.eq(this.outputId);
	}

	/**
	 * @internal
	 * @returns {boolean}
	 */
	hasOrigOutput() {
		return this.#output !== null;
	}

	/**
	 * @internal
	 * @param {TxOutput} output 
	 */
	setOrigOutput(output) {
		this.#output = output;
	}

	/**
	 * 
	 * @type {TxOutput}
	 */
	get output() {
		if (this.#output === null) {
			throw new Error("underlying output data not set");
		} else {
			return this.#output;
		}
	}

	/**
	 * Backward compatible alias for `TxInput.output`
	 * @type {TxOutput}
	 */
	get origOutput() {
		return this.output
	}

	/**
	 * Shortcut
	 * @type {Value}
	 */
	get value() {
		return assertDefined(this.#output).value;
	}

	/**
	 * Shortcut
	 * @type {Address}
	 */
	get address() {
		return assertDefined(this.#output).address;
	}

	/**
	 * @internal
	 * @returns {ConstrData}
	 */
	toOutputIdData() {
		return this.outputId._toUplcData();
	}

	/**
	 * @internal
	 * @returns {ConstrData}
	 */
	toData() {
		if (this.#output === null) {
			throw new Error("expected to be non-null");
		} else {
			return new ConstrData(0, [
				this.toOutputIdData(),
				this.#output.toData(),
			]);
		}
	}

	/**
	 * @internal
	 * @param {UplcData} data 
	 * @returns {TxInput}
	 */
	static fromUplcData(data) {
		assert(data.index == 0);
		const fields = data.fields;

		const outputId = TxOutputId.fromUplcData(fields[0]);

		return new TxInput(
			outputId,
			TxOutput.fromUplcData(fields[1])
		);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		//return Cbor.encodeTuple([
		return this.outputId.toCbor();//,
		//	this.origOutput.toCbor()
		//]);
	}

	/**
	 * @returns {number[]}
	 */
	toFullCbor() {
		return Cbor.encodeTuple([
			this.outputId.toCbor(),
			this.origOutput.toCbor()
		]);
	}

	/**
	 * Deserializes TxOutput format used by wallet connector
	 * @param {string | number[]} rawBytes
	 * @returns {TxInput}
	 */
	static fromFullCbor(rawBytes) {
		const bytes = Array.isArray(rawBytes) ? rawBytes : hexToBytes(rawBytes);

		/** @type {null | TxOutputId} */
		let outputId = null;

		/** @type {null | TxOutput} */
		let output = null;

		Cbor.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					outputId = TxOutputId.fromCbor(fieldBytes);
					break;
				case 1:
					output = TxOutput.fromCbor(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		if (outputId !== null && output !== null) {
			return new TxInput(outputId, output);
		} else {
			throw new Error("unexpected");
		}
	}

	/**
	 * @param {string | number[]} rawBytes 
	 * @returns {TxInput}
	 */
	static fromCbor(rawBytes) {
		const outputId = TxOutputId.fromCbor(rawBytes);

		return new TxInput(outputId, null);
	}

	/**
	 * Tx inputs must be ordered. 
	 * The following function can be used directly by a js array sort
	 * @internal
	 * @param {TxInput} a
	 * @param {TxInput} b
	 * @returns {number}
	 */
	static comp(a, b) {
		return TxOutputId.comp(a.outputId, b.outputId);
	} 

	/**
	 * @param {TxInput[]} inputs
	 * @returns {Value}
	 */
	static sumValue(inputs) {
		let sum = new Value();

		for (let input of inputs) {
			sum = sum.add(input.value);
		}

		return sum;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			outputId: this.outputId.toString(),
			output: this.#output !== null ? this.#output.dump() : null
		};
	}
}

/**
 * Use TxInput instead
 * @deprecated
 */
export class UTxO extends TxInput {}

/**
 * Use TxInput instead
 * @deprecated
 */
export class TxRefInput extends TxInput {}

/**
 * Represents a transaction output that is used when building a transaction.
 */
export class TxOutput extends CborData {
	/** 
	 * @type {Address} 
	 */
	#address;

	/** 
	 * @type {Value} 
	 */
	#value;

	/** 
	 * @type {null | Datum} 
	 */
	#datum;

	/**
	 * @type {null | UplcProgram} 
	 */
	#refScript;

	/**
	 * Constructs a `TxOutput` instance using an `Address`, a `Value`, an optional `Datum`, and optional `UplcProgram` reference script.
	 * @param {Address} address 
	 * @param {Value} value 
	 * @param {null | Datum} datum 
	 * @param {null | UplcProgram} refScript 
	 */
	constructor(address, value, datum = null, refScript = null) {
		assert(datum === null || datum instanceof Datum); // check this explicitely because caller might be using this constructor without proper type-checking
		super();
		this.#address = address;
		this.#value = value;
		this.#datum = datum;
		this.#refScript = refScript;
	}

	/**
	 * Get the `Address` to which the `TxOutput` will be sent.
	 * @type {Address}
	 */
	get address() {
		return this.#address;
	}

	/**
	 * Mutation is handy when correctin the quantity of lovelace in a utxo
	 * @param {Address} addr
	 */
	setAddress(addr) {
		this.#address = addr;
	}

	/**
	 * Get the `Value` contained in the `TxOutput`.
	 * @type {Value}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * Mutation is handy when correcting the quantity of lovelace in a utxo
	 * @param {Value} val
	 */
	setValue(val) {
		this.#value = val;
	}

	/**
	 * Get the optional `Datum` associated with the `TxOutput`.
	 * @type {null | Datum}
	 */
	get datum() {
		return this.#datum;
	}

	/**
	 * Mutation is handy when correctin the quantity of lovelace in a utxo 
	 * @param {Datum} datum 
	 */
	setDatum(datum) {
		this.#datum = datum;
	}

	/**
	 * @returns {UplcData}
	 */
	getDatumData() {
		if (this.#datum === null) {
			throw new Error("no datum data available");
		} else {
			let data = this.#datum.data;
			if (data === null) {
				throw new Error("no datum data available");
			} else {
				return data;
			}
		}
	}

	/**
	 * @type {null | UplcProgram}
	 */
	get refScript() {
		return this.#refScript;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		if ((this.#datum === null || this.#datum instanceof HashedDatum) && this.#refScript === null && !config.STRICT_BABBAGE) {
			// this is needed to match eternl wallet (de)serialization (annoyingly eternl deserializes the tx and then signs its own serialization)
			// hopefully cardano-cli signs whatever serialization we choose (so we use the eternl variant in order to be compatible with both)

			let fields = [
				this.#address.toCbor(),
				this.#value.toCbor()
			];

			if (this.#datum !== null) {
				if (this.#datum instanceof HashedDatum) {
					fields.push(this.#datum.hash.toCbor());
				} else {
					throw new Error("unexpected");
				}
			}

			return Cbor.encodeTuple(fields);
		} else {
			/** @type {Map<number, number[]>} */
			let object = new Map();

			object.set(0, this.#address.toCbor());
			object.set(1, this.#value.toCbor());

			if (this.#datum !== null) {
				object.set(2, this.#datum.toCbor());
			}

			if (this.#refScript !== null) {
				object.set(3, Cbor.encodeTag(24n).concat(Cbor.encodeBytes(
					Cbor.encodeTuple([
						Cbor.encodeInteger(BigInt(this.#refScript.versionTag())),
						this.#refScript.toCbor()
					])
				)));
			}

			return Cbor.encodeObject(object);
		}
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxOutput}
	 */
	static fromCbor(bytes) {
		/** 
		 * @type {null | Address} 
		 */
		let address = null;

		/** 
		 * @type {null | Value} 
		 */
		let value = null;

		/** 
		 * @type {null | Datum} 
		 */
		let outputDatum = null;

		/** 
		 * @type {null | UplcProgram} 
		 */
		let refScript = null;

		if (Cbor.isObject(bytes)) {
			Cbor.decodeObject(bytes, (i, fieldBytes) => {
				switch(i) { 
					case 0:
						address = Address.fromCbor(fieldBytes);
						break;
					case 1:
						value = Value.fromCbor(fieldBytes);
						break;
					case 2:
						outputDatum = Datum.fromCbor(fieldBytes);
						break;
					case 3:
						assert(Cbor.decodeTag(fieldBytes) == 24n);

						let tupleBytes = Cbor.decodeBytes(fieldBytes);

						let refScriptType = -1;

						Cbor.decodeTuple(tupleBytes, (tupleIdx, innerTupleBytes) => {
							assert(refScript === null);

							switch(tupleIdx) {
								case 0:
									refScriptType = Number(Cbor.decodeInteger(innerTupleBytes));
									break;
								case 1:
									switch(refScriptType) {
										case 0:
											throw new Error("native refScript not handled");
										case 1:
											console.log("Warning: deserializing PlutusV1 refScript as PlutusV2 refScript");
											refScript = UplcProgram.fromCbor(innerTupleBytes);		
											break;
										case 2:
											refScript = UplcProgram.fromCbor(innerTupleBytes);		
											break;
										default:
											throw new Error(`unhandled refScript type ${refScriptType}`);
									}
									break;
								default:
									throw new Error("unhandled refScript format");
							}
						});

						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else if (Cbor.isTuple(bytes)) {
			// this is the pre-vasil format, which is still sometimes returned by wallet connector functions
			Cbor.decodeTuple(bytes, (i, fieldBytes) => {
				switch(i) { 
					case 0:
						address = Address.fromCbor(fieldBytes);
						break;
					case 1:
						value = Value.fromCbor(fieldBytes);
						break;
					case 2:
						outputDatum = new HashedDatum(DatumHash.fromCbor(fieldBytes));
						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else {
			throw new Error("expected object or tuple for TxOutput");
		}

		if (address === null || value === null) {
			throw new Error("unexpected");
		} else {
			return new TxOutput(address, value, outputDatum, refScript);
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			address: this.#address.dump(),
			value: this.#value.dump(),
			datum: this.#datum === null ? null : this.#datum.dump(),
			refScript: this.#refScript === null ? null : bytesToHex(this.#refScript.toCbor()),
		};
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		let datum = new ConstrData(0, []); // none
		if (this.#datum !== null) {
			datum = this.#datum.toData();
		}

		return new ConstrData(0, [
			this.#address._toUplcData(),
			this.#value._toUplcData(),
			datum,
			this.#refScript ? new ConstrData(0, [new ByteArrayData(this.#refScript.hash())]) : new ConstrData(1, [])
		]);
	}

	/**
	 * @param {UplcData} data 
	 * @returns {TxOutput}
	 */
	static fromUplcData(data) {
		assert(data.index == 0);
		assert(data.fields.length == 4);

		return new TxOutput(
			Address.fromUplcData(data.fields[0]),
			Value.fromUplcData(data.fields[1]),
			Datum.fromUplcData(data.fields[2])
		);
	}

	/**
	 * Each UTxO must contain some minimum quantity of lovelace to avoid that the blockchain is used for data storage.
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	calcMinLovelace(networkParams) {
		let lovelacePerByte = networkParams.lovelacePerUTXOByte;

		let correctedSize = this.toCbor().length + 160; // 160 accounts for some database overhead?

		return BigInt(correctedSize)*BigInt(lovelacePerByte);
	}

	/**
	 * Makes sure the `TxOutput` contains the minimum quantity of lovelace.
	 * The network requires this to avoid the creation of unusable dust UTxOs.
	 * 
	 * Optionally an update function can be specified that allows mutating the datum of the `TxOutput` to account for an increase of the lovelace quantity contained in the value.
	 * @param {NetworkParams} networkParams 
	 * @param {null | ((output: TxOutput) => void)} updater
	 */
	correctLovelace(networkParams, updater = null) {
		let minLovelace = this.calcMinLovelace(networkParams);

		while (this.#value.lovelace < minLovelace) {
			this.#value.setLovelace(minLovelace);

			if (updater != null) {
				updater(this);
			}

			minLovelace = this.calcMinLovelace(networkParams);
		}
	}
}

/**
 * A `DCert` represents a staking action (eg. withdrawing rewards, delegating to another pool).
 */
export class DCert extends CborData {
	#certType;

	/**
     * @param {number} certType
     */
	constructor(certType) {
		super();
		this.#certType = certType;
	}

	/**
	 * Get certificate type.
	 * @type {number}
	 */
	get certType() {
		return this.#certType;
	}

	/**
	 * Get stake hash.
	 * @type {PubKeyHash | StakingValidatorHash}
	 */
	get stakeHash() {
		throw new Error("not yet implemented");
	}

	/**
	 * Get stake credential type.
	 * @type {number}
	 */
	get credentialType() {
		throw new Error("not yet implemented");
	}


	/**
     * @returns {number[]}
     */
    typeToCbor() {
        return Cbor.encodeInteger(BigInt(this.#certType));
    }

	/**
	 * @param {string | number[]} raw
	 * @returns {DCert}
	 */
	static fromCbor(raw) {
		const bytes = (typeof raw == "string") ? hexToBytes(raw) : raw;

		if (bytes[0] == 0) {
            bytes.shift();
        }

		let certType = -1;
		let stakeHash, stakeHashType, poolHash;

		/**
         * @type {DCert | null}
         */
        let cert = null;

		Cbor.decodeTuple(bytes, (i, fieldBytes) => {
			if (i == 0) {
                certType = Number(Cbor.decodeInteger(fieldBytes))
            } else {
				switch(certType) {
					case 0: // fall through to case 1
					case 1: // fall through to case 2
					case 2:
						if (i == 1)	{
							Cbor.decodeList(fieldBytes, (i, itemBytes) => {
								if (i == 0){
									stakeHashType = Number(Cbor.decodeInteger(itemBytes));
								} else {
									if (stakeHashType == 0) { stakeHash = PubKeyHash.fromCbor(itemBytes) }
									else if (stakeHashType == 1) { stakeHash = StakingValidatorHash.fromCbor(itemBytes) }
									else { throw new Error("invalid stake credential") }
								}
							});
							if (certType == 0) cert = new DCertRegister(stakeHash);
							if (certType == 1) cert = new DCertDeregister(stakeHash);
						} else if (i == 2){
							poolHash = PubKeyHash.fromCbor(Cbor.decodeBytes(fieldBytes));
							if (certType == 2) cert = new DCertDelegate(stakeHash, poolHash);
						}
						break;
					case 3: // fall through
					case 4: // fall through
					case 5: // fall through
					case 6:
						throw new Error("DCert type not yet implemented");
					default:
						throw new Error("invalid DCert type");
				}
			}
		});

		if (!cert) {
            throw new Error("unable to deserialize certificate");
        } else {
            return cert;
        }
	}

	/**
	 * `DCertProps.type` can be:
	 *     `0` for stake registration
	 *     `1` for stake de-registration
	 *     `2` for stake delegation
	 *     `3` for stake pool registration (not yet implemented)
	 *     `4` for stake pool retirement (not yet implemented)
	 *     `5` for genesis key delegation (not yet implemented)
	 *     `6` for moving instantaneous rewards (not yet implemented)
	 *
	 * `DCertProps.credential.type` can be:
	 *     `0` for staking address key hash
	 *     `1` for staking validator key hash (script hash)
	 *
	 * `DCertProps.poolHash` is needed only for stake delegation.
	 * @typedef {{
	 *   type: 0 | 1 | 2,
	 *   credential: {
	 *     type: 0 | 1,
	 *     hash: string
	 *   },
	 *   poolHash?: string
	 * }} DCertProps
	 */

	/**
	 * Create a DCert from a given json parameter.
     * @param {string | DCertProps} json
     * @returns {DCert}
     */
    static fromJson(json) {
		const obj = (typeof json == "string") ? JSON.parse(json) : json;
        const certType = obj?.type;
		const stakeHashType = obj.credential.type;

		if (typeof certType !== "number") {
            throw new Error("invalid or no certificate type specified");
        }

		let stakeHash, poolHash;

		/**
         * @type {DCert | null}
         */
        let cert = null;

		switch (certType) {
			case 0: // fall through to case 1
			case 1: // fall through to case 2
			case 2:
				stakeHash = stakeHashType === 0
				          ? PubKeyHash.fromHex(obj.credential.hash)
						  : StakingValidatorHash.fromHex(obj.credential.hash);
				if (certType == 0) cert = new DCertRegister(stakeHash);
				if (certType == 1) cert = new DCertDeregister(stakeHash);
				if (certType == 2){
					poolHash = PubKeyHash.fromHex(obj.poolHash)
					cert = new DCertDelegate(stakeHash, poolHash);
				}
				break;
			case 3: // fall through
			case 4: // fall through
			case 5: // fall through
			case 6:
				throw new Error("DCert type not yet implemented");
			default:
				throw new Error("invalid DCert type");
		}

		if (!cert) {
            throw new Error("unable to deserialize certificate");
        } else {
            return cert;
        }
	}

	/**
	 * @param {UplcData} data 
	 * @returns {DCert}
	 */
	static fromUplcData(data) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {}; // placeholder here only, to satisfy call from TxBody.dump (type checking); overwritten by child classes
	}
}

/**
 * @internal
 */
export class DCertRegister extends DCert {
	/**
	 * @type {PubKeyHash | StakingValidatorHash}
	 */
	#stakeHash;

	/**
	 * @type {number}
	 */
	#credentialType;

	/**
     * @param {PubKeyHash | StakingValidatorHash} stakeHash
     */
    constructor(stakeHash) {
        super(0);
        assert(stakeHash instanceof PubKeyHash || stakeHash instanceof StakingValidatorHash);
        this.#stakeHash = stakeHash;
		this.#credentialType = stakeHash instanceof PubKeyHash ? 0 : 1;
    }

	/**
	 * Get stake hash.
	 * @type {PubKeyHash | StakingValidatorHash}
	 */
	get stakeHash() {
		return this.#stakeHash;
	}
	
	/**
	 * Get stake credential type.
	 * @type {number}
	 */
	get credentialType() {
		return this.#credentialType;
	}

	/**
     * @returns {number[]}
     */
    toCbor() {
        return Cbor.encodeTuple([
            this.typeToCbor(),
            Cbor.encodeDefList([
				Cbor.encodeInteger(BigInt(this.#credentialType)),
				this.#stakeHash.toCbor()
			])
        ]);
    }

    /**
	 * @returns {Object}
	 */
	dump() {
		return {
			certType: "stake_registration",
			stakeCredential: {
				type: this.#credentialType,
				hash: this.#stakeHash.dump()
			}
		};
	}
}

/**
 * @internal
 */
export class DCertDeregister extends DCert {
	/**
	 * @type {PubKeyHash | StakingValidatorHash}
	 */
	#stakeHash;

	/**
	 * @type {number}
	 */
	#credentialType;

	/**
     * @param {PubKeyHash | StakingValidatorHash} stakeHash
     */
    constructor(stakeHash) {
        super(1);
        assert(stakeHash instanceof PubKeyHash || stakeHash instanceof StakingValidatorHash);
        this.#stakeHash = stakeHash;
		this.#credentialType = stakeHash instanceof PubKeyHash ? 0 : 1;
    }

	/**
	 * Get stake hash.
	 * @type {PubKeyHash | StakingValidatorHash}
	 */
	get stakeHash() {
		return this.#stakeHash;
	}
	
	/**
	 * Get stake credential type.
	 * @type {number}
	 */
	get credentialType() {
		return this.#credentialType;
	}

	/**
     * @returns {number[]}
     */
    toCbor() {
        return Cbor.encodeTuple([
            this.typeToCbor(),
            Cbor.encodeDefList([
				Cbor.encodeInteger(BigInt(this.#credentialType)),
				this.#stakeHash.toCbor()
			])
        ]);
    }

    /**
	 * @returns {Object}
	 */
	dump() {
		return {
			certType: "stake_deregistration",
			stakeCredential: {
				type: this.#credentialType,
				hash: this.#stakeHash.dump()
			}
		};
	}
}

/**
 * @internal
 */
export class DCertDelegate extends DCert {
	/**
	 * @type {PubKeyHash | StakingValidatorHash}
	 */
	#stakeHash;

	/**
	 * @type {number}
	 */
	#credentialType;

	/**
	 * @type {PubKeyHash}
	 */
	#poolHash;

	/**
     * @param {PubKeyHash | StakingValidatorHash} stakeHash
	 * @param {PubKeyHash} poolHash
     */
    constructor(stakeHash, poolHash) {
        super(2);
        assert(stakeHash instanceof PubKeyHash || stakeHash instanceof StakingValidatorHash);
		assert(poolHash instanceof PubKeyHash);
        this.#stakeHash = stakeHash;
		this.#credentialType = stakeHash instanceof PubKeyHash ? 0 : 1;
		this.#poolHash = poolHash;
    }

	/**
	 * Get stake hash.
	 * @type {PubKeyHash | StakingValidatorHash}
	 */
	get stakeHash() {
		return this.#stakeHash;
	}

	/**
	 * Get stake credential type.
	 * @type {number}
	 */
	get credentialType() {
		return this.#credentialType;
	}

	/**
	 * Get stake pool hash.
	 * @type {PubKeyHash}
	 */
	get poolHash() {
		return this.#poolHash;
	}

	/**
     * @returns {number[]}
     */
    toCbor() {
        return Cbor.encodeTuple([
            this.typeToCbor(),
            Cbor.encodeDefList([
				Cbor.encodeInteger(BigInt(this.#credentialType)),
				this.#stakeHash.toCbor()
			]),
			this.#poolHash.toCbor()
        ]);
    }

    /**
	 * @returns {Object}
	 */
	dump() {
		return {
			certType: "stake_delegation",
			stakeCredential: {
				type: this.#credentialType,
				hash: this.#stakeHash.dump()
			},
			poolHash: this.#poolHash.dump()
		};
	}
}

/**
 * @internal
 */
export class DCertRegisterPool extends DCert {

}

/**
 * @internal
 */
export class DCertRetirePool extends DCert {

}

/**
 * Wrapper for Cardano stake address bytes. An StakeAddress consists of two parts internally:
 *   - Header (1 byte, see CIP 8)
 *   - Staking witness hash (28 bytes that represent the `PubKeyHash` or `StakingValidatorHash`)
 * 
 * Stake addresses are used to query the assets held by given staking credentials.
 */
export class StakeAddress {
	#bytes;

	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		assert(bytes.length == 29);

		this.#bytes = bytes;
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * Returns `true` if the given `StakeAddress` is a testnet address.
	 * @param {StakeAddress} sa
	 * @returns {boolean}
	 */
	static isForTestnet(sa) {
		return Address.isForTestnet(new Address(sa.bytes));
	}

	/**
	 * Convert a regular `Address` into a `StakeAddress`. 
	 * Throws an error if the Address doesn't have a staking credential.
	 * @param {Address} addr 
	 * @returns {StakeAddress}
	 */
	static fromAddress(addr) {
		const sh = addr.stakingHash;

		if (sh === null) {
			throw new Error("address doesn't have a staking part");
		} else {
			return StakeAddress.fromHash(Address.isForTestnet(addr), sh);
		}
	}

	/**
	 * Converts a `StakeAddress` into its CBOR representation.
	 * @returns {number[]}
	 */
	toCbor() {
		return Cbor.encodeBytes(this.#bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {StakeAddress}
	 */
	static fromCbor(bytes) {
		return new StakeAddress(Cbor.decodeBytes(bytes));
	}

	/**
	 * Converts a `StakeAddress` into its Bech32 representation.
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32(
			StakeAddress.isForTestnet(this) ? "stake_test" : "stake",
			this.bytes
		);
	}

	/**
	 * @param {string} str
	 * @returns {StakeAddress}
	 */
	static fromBech32(str) {
		let [prefix, bytes] = Crypto.decodeBech32(str);

		let result = new StakeAddress(bytes);

		assert(prefix == (StakeAddress.isForTestnet(result) ? "stake_test" : "stake"), "invalid StakeAddress prefix");

		return result;
	}

	/**
	 * Converts a `StakeAddress` into its hexadecimal representation.
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * Converts a `StakeAddress` into its hexadecimal representation.
	 * @type {string}
	 */
	get hex() {
		return this.toHex()
	}

	/**
	 * Doesn't check validity
	 * @param {string} hex
	 * @returns {StakeAddress}
	 */
	static fromHex(hex) {
		return new StakeAddress(hexToBytes(hex));
	}

	/**
	 * Address with only staking part (regular PubKeyHash)
	 * @internal
	 * @param {boolean} isTestnet
	 * @param {PubKeyHash} hash
	 * @returns {StakeAddress}
	 */
	static fromPubKeyHash(isTestnet, hash) {
		return new StakeAddress(
			[isTestnet ? 0xe0 : 0xe1].concat(hash.bytes)
		);
	}

	/**
	 * Address with only staking part (script StakingValidatorHash)
	 * @internal
	 * @param {boolean} isTestnet
	 * @param {StakingValidatorHash} hash
	 * @returns {StakeAddress}
	 */
	static fromStakingValidatorHash(isTestnet, hash) {
		return new StakeAddress(
			[isTestnet ? 0xf0 : 0xf1].concat(hash.bytes)
		);
	}

	/**
	 * Converts a `PubKeyHash` or `StakingValidatorHash` into `StakeAddress`.
	 * @param {boolean} isTestnet
	 * @param {PubKeyHash | StakingValidatorHash} hash
	 * @returns {StakeAddress}
	 */
	static fromHash(isTestnet, hash) {
		if (hash instanceof PubKeyHash) {
			return StakeAddress.fromPubKeyHash(isTestnet, hash);
		} else {
			return StakeAddress.fromStakingValidatorHash(isTestnet, hash);
		}
	}

	/**
	 * Returns the underlying `PubKeyHash` or `StakingValidatorHash`.
	 * @returns {PubKeyHash | StakingValidatorHash}
	 */
	get stakingHash() {
		const type = this.bytes[0];

		if (type == 0xe0 || type == 0xe1) {
			return new PubKeyHash(this.bytes.slice(1));
		} else if (type == 0xf0 || type == 0xf1) {
			return new StakingValidatorHash(this.bytes.slice(1));
		} else {
			throw new Error("bad StakeAddress header");
		}
	}
}

/**
 * Represents a Ed25519 signature.
 * 
 * Also contains a reference to the PubKey that did the signing.
 */
export class Signature extends CborData {
	/**
	 * @type {PubKey} 
	 */
	#pubKey;

	/** @type {number[]} */
	#signature;

	/**
	 * @param {number[] | PubKey} pubKey 
	 * @param {number[]} signature 
	 */
	constructor(pubKey, signature) {
		super();
		this.#pubKey = (pubKey instanceof PubKey) ? pubKey : new PubKey(pubKey);
		this.#signature = signature;
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#signature;
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
		return this.#pubKey.pubKeyHash;
	}

	/**
	 * @returns {Signature}
	 */
	static dummy() {
		return new Signature(PubKey.dummy(), (new Array(64)).fill(0));
	}

	/**
	 * @returns {boolean}
	 */
	isDummy() {
		return this.#pubKey.isDummy() && this.#signature.every(b => b == 0);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return Cbor.encodeTuple([
			this.#pubKey.toCbor(),
			Cbor.encodeBytes(this.#signature),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Signature}
	 */
	static fromCbor(bytes) {
		/** @type {null | PubKey} */
		let pubKey = null;

		/** @type {null | number[]} */
		let signature = null;

		let n = Cbor.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					pubKey = PubKey.fromCbor(fieldBytes);
					break;
				case 1:
					signature = Cbor.decodeBytes(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(n == 2);

		if (pubKey === null || signature === null) {
			throw new Error("unexpected");
		} else {
			return new Signature(pubKey, signature);
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			pubKey: this.#pubKey.dump,
			pubKeyHash: this.pubKeyHash.dump(),
			signature: bytesToHex(this.#signature),
		};
	}

	/**
	 * Throws error if incorrect
	 * @param {number[]} msg
	 */
	verify(msg) {
		if (this.#signature === null) {
			throw new Error("signature can't be null");
		} else {
			if (this.#pubKey === null) {
				throw new Error("pubKey can't be null");
			} else {
				if (!Ed25519.verify(this.#signature, msg, this.#pubKey.bytes)) {
					throw new Error("incorrect signature");
				}
			}
		}
	}
}

/**
 * @interface
 * @typedef {object} PrivateKey
 * @property {() => PubKey} derivePubKey Generates the corresponding public key.
 * @property {(msg: number[]) => Signature} sign Signs a byte-array payload, returning the signature.
 */

/**
 * @implements {PrivateKey}
 */
export class Ed25519PrivateKey extends HeliosData {
	/**
	 * @type {number[]}
	 */
	#bytes;

	/**
	 * cache the derived pubKey
	 * @type {null | PubKey}
	 */
	#pubKey

	/**
	 * @param {string | number[]} bytes
	 */
	constructor(bytes) {
		super();
		this.#bytes = Array.isArray(bytes) ? bytes : hexToBytes(bytes);
		this.#pubKey = null;
	}

 	/**
     * Generate a private key from a random number generator.
	 * This is not cryptographically secure, only use this for testing purpose
     * @param {NumberGenerator} random 
     * @returns {Ed25519PrivateKey} - Ed25519 private key is 32 bytes long
     */
	static random(random) {
		return new Ed25519PrivateKey(randomBytes(random, 32));
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @type {string}
	 */
	get hex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * NOT the Ed25519-Bip32 hierarchial extension algorithm (see ExtendedPrivateKey below)
	 * @returns {Ed25519PrivateKey}
	 */
	extend() {
		return new Ed25519PrivateKey(Crypto.sha2_512(this.#bytes));
	}

	/**
	 * @returns {PubKey}
	 */
	derivePubKey() {
		if (this.#pubKey) {
			return this.#pubKey;
		} else {
			this.#pubKey = new PubKey(Ed25519.derivePublicKey(this.#bytes));
			
			return this.#pubKey;
		}
	}

	/**
	 * @param {number[]} message 
	 * @returns {Signature}
	 */
	sign(message) {
		return new Signature(
			this.derivePubKey(),
			Ed25519.sign(message, this.#bytes)
		);
	}
}

/**
 * Used during `Bip32PrivateKey` derivation, to create a new `Bip32PrivateKey` instance with a non-publicly deriveable `PubKey`.
 */
export const BIP32_HARDEN = 0x80000000;

/**
 * Ed25519-Bip32 extendable `PrivateKey`.
 * @implements {PrivateKey}
 */
export class Bip32PrivateKey {
	/**
	 * 96 bytes
	 * @type {number[]}
	 */
	#bytes;

	/**
	 * @type {PubKey | null}
	 */
	#pubKey;

	/**
	 * @param {number[]} bytes
	 */
	constructor(bytes) {
		assert(bytes.length == 96);
		this.#bytes = bytes;
		this.#pubKey = null;
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes.slice();
	}

	/**
	 * @private
	 * @type {number[]}
	 */
	get k() {
		return this.#bytes.slice(0, 64);
	}

	/**
	 * @private
	 * @type {number[]}
	 */
	get kl() {
		return this.#bytes.slice(0, 32);
	}

	/**
	 * @private
	 * @type {number[]}
	 */
	get kr() {
		return this.#bytes.slice(32, 64);
	}

	/**
	 * @private
	 * @type {number[]}
	 */
	get c() {
		return this.#bytes.slice(64, 96);
	}

	/**
     * Generate a Bip32PrivateKey from a random number generator.
	 * This is not cryptographically secure, only use this for testing purpose
     * @param {NumberGenerator} random 
     * @returns {Bip32PrivateKey}
     */
	static random(random = Crypto.rand(Math.random())) {
		return new Bip32PrivateKey(randomBytes(random, 96));
	}

	/**
	 * @param {number[]} entropy
	 * @param {boolean} force
	 */
	static fromBip39Entropy(entropy, force = true) {
		const bytes = Crypto.pbkdf2(Crypto.hmacSha2_512, [], entropy, 4096, 96);

		const kl = bytes.slice(0, 32);
		const kr = bytes.slice(32, 64);

		if (!force) {
			assert((kl[31] & 0b00100000) == 0, "invalid root secret");
		}

		kl[0]  &= 0b11111000;
		kl[31] &= 0b00011111;
		kl[31] |= 0b01000000;

		const c = bytes.slice(64, 96);

		return new Bip32PrivateKey(kl.concat(kr).concat(c));
	}

	/**
	 * @private
	 * @param {number} i - child index
	 */
	calcChildZ(i) {
		const ib = bigIntToBytes(BigInt(i)).reverse();
		while (ib.length < 4) {
			ib.push(0);
		}

		assert(ib.length == 4, "child index too big");
			
		if (i < BIP32_HARDEN) {
			const A = this.derivePubKey().bytes;
			
			return Crypto.hmacSha2_512(this.c, [0x02].concat(A).concat(ib));
		} else {
			return Crypto.hmacSha2_512(this.c, [0x00].concat(this.k).concat(ib));
		}
	}

	/**
	 * @private
	 * @param {number} i 
	 */
	calcChildC(i) {
		const ib = bigIntToBytes(BigInt(i)).reverse();
		while (ib.length < 4) {
			ib.push(0);
		}

		assert(ib.length == 4, "child index too big");
			
		if (i < BIP32_HARDEN) {
			const A = this.derivePubKey().bytes;
			
			return Crypto.hmacSha2_512(this.c, [0x03].concat(A).concat(ib));
		} else {
			return Crypto.hmacSha2_512(this.c, [0x01].concat(this.k).concat(ib));
		}
	}

	/**
	 * @param {number} i
	 * @returns {Bip32PrivateKey}
	 */
	derive(i) {
		const Z = this.calcChildZ(i);

		const kl = bigIntToLe32Bytes(8n*leBytesToBigInt(Z.slice(0, 28)) + leBytesToBigInt(this.kl)).slice(0, 32);
		const kr = bigIntToLe32Bytes(leBytesToBigInt(Z.slice(32, 64)) + (leBytesToBigInt(this.kr)%115792089237316195423570985008687907853269984665640564039457584007913129639936n)).slice(0, 32);

		const c = this.calcChildC(i).slice(32, 64);

		// TODO: discard child key whose public key is the identity point
		return new Bip32PrivateKey(kl.concat(kr).concat(c));
	}

	/**
	 * @param {number[]} path 
	 * @returns {Bip32PrivateKey}
	 */
	derivePath(path) {
		/**
		 * @type {Bip32PrivateKey}
		 */
		let pk = this;

		path.forEach(i => {
			pk = pk.derive(i);
		});

		return pk;
	}

	/**
	 * @returns {PubKey}
	 */ 
	derivePubKey() {
		if (this.#pubKey) {
			return this.#pubKey;
		} else {
			this.#pubKey = new PubKey(Ed25519.deriveBip32PublicKey(this.k));

			return this.#pubKey;
		}
	}

	/**
	 * @example
	 * (new Bip32PrivateKey([0x60, 0xd3, 0x99, 0xda, 0x83, 0xef, 0x80, 0xd8, 0xd4, 0xf8, 0xd2, 0x23, 0x23, 0x9e, 0xfd, 0xc2, 0xb8, 0xfe, 0xf3, 0x87, 0xe1, 0xb5, 0x21, 0x91, 0x37, 0xff, 0xb4, 0xe8, 0xfb, 0xde, 0xa1, 0x5a, 0xdc, 0x93, 0x66, 0xb7, 0xd0, 0x03, 0xaf, 0x37, 0xc1, 0x13, 0x96, 0xde, 0x9a, 0x83, 0x73, 0x4e, 0x30, 0xe0, 0x5e, 0x85, 0x1e, 0xfa, 0x32, 0x74, 0x5c, 0x9c, 0xd7, 0xb4, 0x27, 0x12, 0xc8, 0x90, 0x60, 0x87, 0x63, 0x77, 0x0e, 0xdd, 0xf7, 0x72, 0x48, 0xab, 0x65, 0x29, 0x84, 0xb2, 0x1b, 0x84, 0x97, 0x60, 0xd1, 0xda, 0x74, 0xa6, 0xf5, 0xbd, 0x63, 0x3c, 0xe4, 0x1a, 0xdc, 0xee, 0xf0, 0x7a])).sign(textToBytes("Hello World")).bytes == [0x90, 0x19, 0x4d, 0x57, 0xcd, 0xe4, 0xfd, 0xad, 0xd0, 0x1e, 0xb7, 0xcf, 0x16, 0x17, 0x80, 0xc2, 0x77, 0xe1, 0x29, 0xfc, 0x71, 0x35, 0xb9, 0x77, 0x79, 0xa3, 0x26, 0x88, 0x37, 0xe4, 0xcd, 0x2e, 0x94, 0x44, 0xb9, 0xbb, 0x91, 0xc0, 0xe8, 0x4d, 0x23, 0xbb, 0xa8, 0x70, 0xdf, 0x3c, 0x4b, 0xda, 0x91, 0xa1, 0x10, 0xef, 0x73, 0x56, 0x38, 0xfa, 0x7a, 0x34, 0xea, 0x20, 0x46, 0xd4, 0xbe, 0x04]
	 * @param {number[]} message 
	 * @returns {Signature}
	 */
	sign(message) {
		return new Signature(
			this.derivePubKey(),
			Ed25519.signBip32(message, this.k)
		);
	}
}

/**
 * @implements {PrivateKey}
 */
export class RootPrivateKey {
	#entropy;
	#key;

	/**
	 * @param {number[]} entropy 
	 */
	constructor(entropy) {
		assert(entropy.length == 16 || entropy.length == 20 || entropy.length == 24 || entropy.length == 28 || entropy.length == 32, `expected 16, 20, 24, 28 or 32 bytes for the root entropy, got ${entropy.length}`);
		
		this.#entropy = entropy;
		this.#key = Bip32PrivateKey.fromBip39Entropy(entropy);
	}

	/**
	 * @param {string[]} phrase 
	 * @param {string[]} dict 
	 * @returns {boolean}
	 */
	static isValidPhrase(phrase, dict = BIP39_DICT_EN) {
		if (phrase.length != 12 && phrase.length != 15 && phrase.length != 18 && phrase.length != 21 && phrase.length != 24) {
			return false;
		} else {
			return phrase.every(w => dict.findIndex(dw => dw == w) != -1);
		}
	}

	/**
	 * @param {string[]} phrase 
	 * @param {string[]} dict 
	 * @returns {RootPrivateKey}
	 */
	static fromPhrase(phrase, dict = BIP39_DICT_EN) {
		assert(phrase.length == 12 || phrase.length == 15 || phrase.length == 18 || phrase.length == 21 || phrase.length == 24, `expected phrase with 12, 15, 18, 21 or 24 words, got ${phrase.length} words`);

		const bw = new BitWriter();

		phrase.forEach(w => {
			const i = dict.findIndex(dw => dw == w);
			assert(i != -1, `invalid phrase, ${w} not found in dict`);

			bw.write(padZeroes(i.toString(2), 11));
		});

		const nChecksumBits = phrase.length/3;
		assert(nChecksumBits%1.0 == 0.0, "bad nChecksumBits");
		assert(nChecksumBits >= 4.0 && nChecksumBits <= 8.0, "too many or too few nChecksumBits");

		const checksum = bw.pop(nChecksumBits);

		const bytes = bw.finalize(false);

		assert(padZeroes(Crypto.sha2_256(bytes)[0].toString(2).slice(0, nChecksumBits), nChecksumBits) == checksum, "invalid checksum");

		return new RootPrivateKey(bytes);
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#key.bytes;
	}

	/**
	 * @type {number[]}
	 */
	get entropy() {
		return this.#entropy;
	}

	/**
	 * @param {string[]} dict 
	 * @returns {string[]}
	 */
	toPhrase(dict = BIP39_DICT_EN) {
		const nChecksumBits = this.#entropy.length/4;
		const checksum = padZeroes(Crypto.sha2_256(this.#entropy)[0].toString(2).slice(0, nChecksumBits), nChecksumBits);

		/**
		 * @type {string[]}
		 */
		const parts = [];

		this.#entropy.forEach(b => {
			parts.push(padZeroes(b.toString(2), 8));
		});

		parts.push(checksum);

		let bits = parts.join('');

		assert(bits.length%11 == 0.0);

		/**
		 * @type {string[]}
		 */
		const words = [];

		while (bits.length > 0) {
			const part = bits.slice(0, 11);
			assert(part.length == 11, "didn't slice of exactly 11 bits");

			const i = parseInt(part, 2);

			words.push(assertDefined(dict[i], `dict entry ${i} not found`));

			bits = bits.slice(11);
		}

		assert(RootPrivateKey.isValidPhrase(words, dict), "internal error: invalid phrase");

		return words;
	}

	/**
	 * @param {number} i - childIndex
	 * @returns {Bip32PrivateKey}
	 */
	derive(i) {
		return this.#key.derive(i);
	}

	/**
	 * @param {number[]} path 
	 * @returns {Bip32PrivateKey}
	 */
	derivePath(path) {
		return this.#key.derivePath(path);
	}

	/**
	 * @param {number} accountIndex
	 * @returns {Bip32PrivateKey}
	 */
	deriveSpendingRootKey(accountIndex = 0) {
		return this.derivePath([
			1852 + BIP32_HARDEN,
			1815 + BIP32_HARDEN,
			accountIndex + BIP32_HARDEN,
			0
		]);
	}

	/**
	 * @param {number} accountIndex
	 * @returns {Bip32PrivateKey}
	 */
	deriveStakingRootKey(accountIndex) {
		return this.derivePath([
			1852 + BIP32_HARDEN,
			1815 + BIP32_HARDEN,
			accountIndex + BIP32_HARDEN,
			2
		]);
	}

	/**
	 * @param {number} accountIndex
	 * @param {number} i
	 * @returns {Bip32PrivateKey}
	 */
	deriveSpendingKey(accountIndex = 0, i = 0) {
		return this.deriveSpendingRootKey(accountIndex).derive(i);
	}

	/**
	 * @param {number} accountIndex
	 * @param {number} i
	 * @returns {Bip32PrivateKey}
	 */
	deriveStakingKey(accountIndex = 0, i = 0) {
		return this.deriveStakingRootKey(accountIndex).derive(i);
	}

	/**
	 * @returns {PubKey}
	 */ 
	derivePubKey() {
		return this.#key.derivePubKey();
	}

	/**
	 * @param {number[]} message 
	 * @returns {Signature}
	 */
	sign(message) {
		return this.#key.sign(message);
	}
}

/**
 * Base-type of SpendingRedeemer and MintingRedeemer
 */
export class Redeemer extends CborData {
	/** @type {UplcData} */
	#data;

	/** @type {Profile} */
	#profile;

	/**
	 * @type {null | string}
	 */
	#programName;

	/**
	 * @param {UplcData} data 
	 * @param {Profile} profile 
	 */
	constructor(data, profile = {mem: 0n, cpu: 0n}) {
		super();
		this.#data = data;
		this.#profile = profile;
		this.#programName = null;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * @type {bigint}
	 */
	get memCost() {
		return this.#profile.mem;
	}

	/**
	 * @type {bigint}
	 */
	get cpuCost() {
		return this.#profile.cpu;
	}

	/**
	 * @param {string} name 
	 */
	setProgramName(name) {
		this.#programName = name;
	}

	/**
	 * @type {null | string}
	 */
	get programName() {
		return this.#programName;
	}

	/**
	 * type:
	 *   0 -> spending
	 *   1 -> minting 
	 *   2 -> certifying
	 *   3 -> rewarding
	 * @param {number} type 
	 * @param {number} index 
	 * @returns {number[]}
	 */
	toCborInternal(type, index) {
		return Cbor.encodeTuple([
			Cbor.encodeInteger(BigInt(type)),
			Cbor.encodeInteger(BigInt(index)),
			this.#data.toCbor(),
			Cbor.encodeTuple([
				Cbor.encodeInteger(this.#profile.mem),
				Cbor.encodeInteger(this.#profile.cpu),
			]),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Redeemer}
	 */
	static fromCbor(bytes) {
		/** @type {null | number} */
		let type = null;

		/** @type {null | number} */
		let index = null;

		/** @type {null | UplcData} */
		let data = null;

		/** @type {null | Cost} */
		let cost = null;

		let n = Cbor.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(Cbor.decodeInteger(fieldBytes));
					break;
				case 1:
					index = Number(Cbor.decodeInteger(fieldBytes));
					break;
				case 2:
					data = UplcData.fromCbor(fieldBytes);
					break;
				case 3: 
					/** @type {null | bigint} */
					let mem = null;

					/** @type {null | bigint} */
					let cpu = null;

					let m = Cbor.decodeTuple(fieldBytes, (j, subFieldBytes) => {
						switch (j) {
							case 0:
								mem = Cbor.decodeInteger(subFieldBytes);
								break;
							case 1:
								cpu = Cbor.decodeInteger(subFieldBytes);
								break;
							default:
								throw new Error("unrecognized field");
						}
					});

					assert(m == 2);

					if (mem === null || cpu === null) {
						throw new Error("unexpected");
					} else {
						cost = {mem: mem, cpu: cpu};
					}
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(n == 4);

		if (type === null || index === null || data === null || cost === null) {
			throw new Error("unexpected");
		} else {

			switch(type) {
				case 0:
					return new SpendingRedeemer(null, index, data, cost);
				case 1:
					return new MintingRedeemer(null, index, data, cost);
				default:
					throw new Error("unhandled redeemer type (Todo)");	
			}
		}
	}

	/**
	 * @returns {Object}
	 */
	dumpInternal() {
		return {
			json: this.#data.toSchemaJson(),
			cbor: this.#data.toCborHex(),
			exUnits: {
				mem: this.#profile.mem.toString(),
				cpu: this.#profile.cpu.toString(),
			}
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {TxBody} body 
	 */
	updateIndex(body) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Profile} profile
	 */
	setProfile(profile) {
		this.#profile = profile;
	}

	/**
	 * @type {Profile}
	 */
	get profile() {
		return this.#profile;
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		// this.#exUnits.mem and this.#exUnits can be 0 if we are estimating the fee for an initial balance
		
		let [memFee, cpuFee] = networkParams.exFeeParams;

		return BigInt(Math.ceil(Number(this.#profile.mem)*memFee + Number(this.#profile.cpu)*cpuFee));
	}
}

export class SpendingRedeemer extends Redeemer {
	#input;
	#inputIndex;

	/**
	 * @param {null | TxInput} input
	 * @param {number} inputIndex
	 * @param {UplcData} data 
	 * @param {Cost} exUnits 
	 */
	constructor(input, inputIndex, data, exUnits = {mem: 0n, cpu: 0n}) {
		super(data, exUnits);

		this.#input = input
		this.#inputIndex = inputIndex;
	}

	/**
	 * @type {number}
	 */
	get inputIndex() {
		return this.#inputIndex;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return this.toCborInternal(0, this.#inputIndex);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = super.dumpInternal();

		obj["type"] = 0;
		obj["typeName"] = "spending";
		obj["inputIndex"] = this.#inputIndex;

		return obj;
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		return new ConstrData(1, [
			body.inputs[this.#inputIndex].toOutputIdData(),
		]);
	}

	/**
	 * @param {TxBody} body
	 */
	updateIndex(body) {
		if (this.#input == null) {
			throw new Error("input can't be null");
		} else {
			this.#inputIndex = body.inputs.findIndex(i => {
				return i.txId.eq(assertDefined(this.#input).txId) && (i.utxoIdx == assertDefined(this.#input).utxoIdx)
			});

			assert(this.#inputIndex != -1);
		}
	}
}

export class MintingRedeemer extends Redeemer {
	#mph;
	#mphIndex;

	/**
	 * @param {?MintingPolicyHash} mph
	 * @param {number} mphIndex
	 * @param {UplcData} data
	 * @param {Cost} exUnits
	 */
	constructor(mph, mphIndex, data, exUnits = {mem: 0n, cpu: 0n}) {
		super(data, exUnits);

		this.#mph = mph;
		this.#mphIndex = mphIndex;
	}

	/**
	 * @type {number}
	 */
	get mphIndex() {
		return this.#mphIndex;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return this.toCborInternal(1, this.#mphIndex);
	}

	/** 
	 * @returns {Object}
	 */
	dump() {
		let obj = super.dumpInternal();

		obj["type"] = 1;
		obj["typeName"] = "minting";
		obj["mphIndex"] = this.#mphIndex;

		return obj;
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		let mph = body.minted.mintingPolicies[this.#mphIndex];

		return new ConstrData(0, [
			new ByteArrayData(mph.bytes),
		]);
	}

	/**
	 * @param {TxBody} body 
	 */
	updateIndex(body) {
		if (this.#mph === null) {
			throw new Error("can't have null mph at this point");
		} else {
			this.#mphIndex = body.minted.mintingPolicies.findIndex(mph => mph.eq(assertDefined(this.#mph)));

			assert(this.#mphIndex != -1);
		}
	}
}

/**
 * Represents either an inline datum, or a hashed datum.
 * 
 * Inside the Helios language this type is named `OutputDatum` in order to distinguish it from user defined Datums,
 * But outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum.
 */
export class Datum extends CborData {
	constructor() {
		super();
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Datum}
	 */
	static fromCbor(bytes) {
		/** @type {null | number} */
		let type = null;

		/** @type {null | Datum} */
		let res = null;

		let n = Cbor.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(Cbor.decodeInteger(fieldBytes));
					break;
				case 1:
					if (type == 0) {
						res = new HashedDatum(DatumHash.fromCbor(fieldBytes));
					} else if (type == 1) {
						assert(Cbor.decodeTag(fieldBytes) == 24n);

						let dataBytes = Cbor.decodeBytes(fieldBytes);
						let data = UplcData.fromCbor(dataBytes);

						res = new InlineDatum(data);
					}
					break;
				default:
					throw new Error("unrecognized field label");
			}
		});

		assert(n == 2);

		if (type === null || res === null) {
			throw new Error("unexpected");
		} else {
			return res;
		}
	}

	/**
	 * @param {UplcData} data
	 * @returns {null | Datum}
	 */
	static fromUplcData(data) {
		if (data.index == 0) {
			assert(data.fields.length == 0);
			return null;
		} else if (data.index == 1) {
			assert(data.fields.length == 1);
			return new HashedDatum(DatumHash.fromUplcData(data.fields[0]));
		} else if (data.index == 2) {
			assert(data.fields.length == 1);
			return new InlineDatum(data.fields[0]);
		} else {
			throw new Error("unhandled constr index");
		}
	}

	/**
	 * Constructs a `HashedDatum`. The input data is hashed internally.
	 * @param {UplcDataValue | UplcData | HeliosData} data
	 * @returns {Datum}
	 */
	static hashed(data) {
		if (data instanceof HeliosData) {
			return HashedDatum.fromData(data._toUplcData());
		} else {
			return HashedDatum.fromData(UplcDataValue.unwrap(data));
		}
	}

	/**
	 * @param {UplcDataValue | UplcData | HeliosData} data
	 * @returns {Datum}
	 */
	static inline(data) {
		if (data instanceof HeliosData) {
			return new InlineDatum(data._toUplcData());
		} else {
			return new InlineDatum(UplcDataValue.unwrap(data));
		}
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {?UplcData}
	 */
	get data() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		throw new Error("not yet implemented");
	}
}

/**
 * Inside helios this type is named OutputDatum::Hash in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
export class HashedDatum extends Datum {
	/** @type {DatumHash} */
	#hash;

	/** @type {null | UplcData} */
	#origData;

	/**
	 * @param {DatumHash} hash 
	 * @param {null | UplcData} origData
	 */
	constructor(hash, origData = null) {
		super();
		this.#hash = hash;
		this.#origData = origData;

		if (this.#origData !== null) {
			assert(eq(this.#hash.bytes, Crypto.blake2b(this.#origData.toCbor())));
		}
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		return true;
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		return this.#hash;
	}

	/**
	 * @type {?UplcData}
	 */
	get data() {
		return this.#origData;
	}

	/**
	 * Used by script context emulation
	 * @returns {ConstrData}
	 */
	toData() {
		return new ConstrData(1, [new ByteArrayData(this.#hash.bytes)]);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return Cbor.encodeTuple([
			Cbor.encodeInteger(0n),
			this.#hash.toCbor(),
		]);
	}

	/**
	 * Constructs a `HashedDatum`. The input data is hashed internally.
	 * @param {UplcData} data 
	 * @returns {HashedDatum}
	 */
	static fromData(data) {
		return new HashedDatum(new Hash(Crypto.blake2b(data.toCbor())), data);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			hash: this.#hash.dump(),
			cbor: this.#origData === null ? null : bytesToHex(this.#origData.toCbor()),
			schema: this.#origData === null ? null : JSON.parse(this.#origData.toSchemaJson())
		};
	}
}

/**
 * Inside helios this type is named OutputDatum::Inline in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
class InlineDatum extends Datum {
	/** @type {UplcData} */
	#data;

	/**
	 * @param {UplcData} data
	 */
	constructor(data) {
		super();
		this.#data = data;
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		return false;
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		return new DatumHash(Crypto.blake2b(this.#data.toCbor()));
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * Used by script context emulation
	 * @returns {ConstrData}
	 */
	toData() {
		return new ConstrData(2, [this.#data]);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return Cbor.encodeTuple([
			Cbor.encodeInteger(1n),
			Cbor.encodeTag(24n).concat(Cbor.encodeBytes(this.#data.toCbor()))
		]);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			inlineCbor: bytesToHex(this.#data.toCbor()),
			inlineSchema: JSON.parse(this.#data.toSchemaJson())
		};
	}
}

/**
 * The inner 'any' is also Metadata, but jsdoc doesn't allow declaring recursive types
 * Metadata is essentially a JSON schema object
 * @typedef {{map: [any, any][]} | any[] | string | number} Metadata
 */

/**
 * @param {Metadata} metadata 
 * @returns {number[]}
 */
function encodeMetadata(metadata) {
	if (typeof metadata === 'string') {
		return Cbor.encodeUtf8(metadata, true);
	} else if (typeof metadata === 'number') {
		assert(metadata % 1.0 == 0.0);

		return Cbor.encodeInteger(BigInt(metadata));
	} else if (Array.isArray(metadata)) {
		return Cbor.encodeDefList(metadata.map(item => encodeMetadata(item)));
	} else if (metadata instanceof Object && "map" in metadata && Object.keys(metadata).length == 1) {
		let pairs = metadata["map"];

		if (Array.isArray(pairs)) {
			return Cbor.encodeMap(pairs.map(pair => {
				if (Array.isArray(pair) && pair.length == 2) {
					return [
						encodeMetadata(pair[0]),
						encodeMetadata(pair[1])
					];
				} else {
					throw new Error("invalid metadata schema");		
				}
			}));
		} else {
			throw new Error("invalid metadata schema");
		}
	} else {
		throw new Error("invalid metadata schema");
	}
}

/**
 * Shifts bytes to next Cbor element
 * @param {number[]} bytes 
 * @returns {Metadata}
 */
function decodeMetadata(bytes) {
	if (Cbor.isUtf8(bytes)) {
		return Cbor.decodeUtf8(bytes);
	} else if (Cbor.isList(bytes)) {
		/**
		 * @type {Metadata[]}
		 */
		let items = [];

		Cbor.decodeList(bytes, (_, itemBytes) => {
			items.push(decodeMetadata(itemBytes));
		});

		return items;
	} else if (Cbor.isMap(bytes)) {
		/**
		 * @type {[Metadata, Metadata][]}
		 */
		let pairs = [];

		Cbor.decodeMap(bytes, (_, pairBytes) => {
			pairs.push([
				decodeMetadata(pairBytes),
				decodeMetadata(pairBytes)
			]);
		});

		return {"map": pairs};
	} else {
		return Number(Cbor.decodeInteger(bytes));
	}
}

export class TxMetadata {
	/**
	 * @type {Object.<number, Metadata>} 
	 */
	#metadata;

	constructor() {
		this.#metadata = {};
	}

	/**
	 *
	 * @param {number} tag
	 * @param {Metadata} data
	 */
	add(tag, data) {
		this.#metadata[tag] = data;
	}

	/**
	 * @type {number[]}
	 */
	get keys() {
		return Object.keys(this.#metadata).map(key => parseInt(key)).sort();
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = {};

		for (let key of this.keys) {
			obj[key] =this.#metadata[key];
		}

		return obj;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {[number[], number[]][]}
		 */
		const pairs = this.keys.map(key => [
			Cbor.encodeInteger(BigInt(key)),
			encodeMetadata(this.#metadata[key])
		]);
		
		return Cbor.encodeMap(pairs);
	}

	/**
	* Decodes a TxMetadata instance from Cbor
	* @param {number[]} data
	* @returns {TxMetadata}
	*/
	static fromCbor(data) {
		const txMetadata = new TxMetadata();

		Cbor.decodeMap(data, (_, pairBytes) => {
			txMetadata.add(
				Number(Cbor.decodeInteger(pairBytes)), 
				decodeMetadata(pairBytes)
			);
		});

		return txMetadata;
	}
}
