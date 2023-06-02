//@ts-check
//////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////      Helios      /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Author:        Christian Schmitz
// Email:         cschmitz398@gmail.com
// Website:       https://www.hyperion-bt.org
// Repository:    https://github.com/hyperion-bt/helios
// Version:       0.14.0
// Last update:   June 2023
// License type:  BSD-3-Clause
//
//
// About: Helios is a smart contract DSL for Cardano.
//     This Javascript library contains functions to compile Helios sources into Plutus-core.
//     Transactions can also be built using Helios.
//
//
// Dependencies: none
//
//
// Disclaimer: I made Helios available as FOSS so that the Cardano community can test it 
//     extensively. I don't guarantee the library is bug-free, nor do I guarantee
//     backward compatibility with future versions.
//
//
// Example usage:
//     > import * as helios from "helios.js";
//     > console.log(helios.Program.new("spending my_validator ...").compile().serialize());
//     
//
// Documentation: https://www.hyperion-bt.org/helios-book
//
//
// Note: I recommend keeping the Helios library as a single unminified file for optimal 
//     auditability.
//
// 
// License text:
//     Copyright 2023 Christian Schmitz
//     
//     Redistribution and use in source and binary forms, with or without 
//     modification, are permitted provided that the following conditions are met:
//     
//     1. Redistributions of source code must retain the above copyright notice, this 
//     list of conditions and the following disclaimer.
//     
//     2. Redistributions in binary form must reproduce the above copyright notice, 
//     this list of conditions and the following disclaimer in the documentation 
//     and/or other materials provided with the distribution.
//     
//     3. Neither the name of the copyright holder nor the names of its contributors 
//     may be used to endorse or promote products derived from this software without 
//     specific prior written permission.
//     
//     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” 
//     AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
//     IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
//     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE 
//     FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL 
//     DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
//     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER 
//     CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, 
//     OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
//     OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//     
//
//
// Overview of internals:
//     Section 1: Config                     VERSION, TAB, REAL_PRECISION, config
//
//     Section 2: Utilities                  assert, assertDefined, assertClass, assertNonEmpty, 
//                                           assertNumber, reduceNull, reduceNullPairs, eq, 
//                                           assertEq, idiv, ipow2, imask, imod8, bigIntToBytes, 
//                                           bytesToBigInt, padZeroes, byteToBitString, 
//                                           hexToBytes, bytesToHex, textToBytes, bytesToText, 
//                                           replaceTabs, BitReader, BitWriter, Source, hl, 
//                                           deprecationWarning
//
//     Section 3: Tokens                     Site, RuntimeError, Token, assertToken, Word, 
//                                           SymbolToken, Group, PrimitiveLiteral, IntLiteral, 
//                                           RealLiteral, BoolLiteral, ByteArrayLiteral, 
//                                           StringLiteral, RE_IR_PARAMETRIC_NAME, TTPP, FTPP, 
//                                           RE_TEMPLATE_NAME, IRParametricName
//
//     Section 4: Cryptography functions     BLAKE2B_DIGEST_SIZE, setBlake2bDigestSize, imod32, 
//                                           irotr, posMod, UInt64, Crypto
//
//     Section 5: Cbor encoder/decoder       CborData
//
//     Section 6: Uplc data types            UPLC_DATA_NODE_MEM_SIZE, UplcData, IntData, 
//                                           ByteArrayData, ListData, MapData, ConstrData
//
//     Section 7: Helios data objects        HeliosData, HInt, Time, Duration, Bool, HString, 
//                                           ByteArray, HList, HMap, Option, Hash, DatumHash, 
//                                           PubKey, PubKeyHash, ScriptHash, MintingPolicyHash, 
//                                           StakeKeyHash, StakingValidatorHash, ValidatorHash, 
//                                           TxId, TxOutputId, Address, AssetClass, Assets, Value
//
//     Section 8: Uplc cost-models           NetworkParams, CostModel, ConstCost, LinearCost, 
//                                           ArgSizeCost, Arg0SizeCost, Arg1SizeCost, 
//                                           Arg2SizeCost, MinArgSizeCost, MaxArgSizeCost, 
//                                           SumArgSizesCost, ArgSizeDiffCost, ArgSizeProdCost, 
//                                           ArgSizeDiagCost
//
//     Section 9: Uplc built-in functions    UPLC_BUILTINS, dumpCostModels, findUplcBuiltin, 
//                                           isUplcBuiltin
//
//     Section 10: Uplc AST                  ScriptPurpose, getPurposeName, UplcValue, UplcType, 
//                                           DEFAULT_UPLC_RTE_CALLBACKS, UplcRte, UplcStack, 
//                                           UplcAnon, UplcDelayedValue, UplcInt, UplcByteArray, 
//                                           UplcString, UplcUnit, UplcBool, UplcPair, UplcList, 
//                                           UplcDataValue, UplcTerm, UplcVariable, UplcDelay, 
//                                           UplcLambda, UplcCall, UplcConst, UplcForce, 
//                                           UplcError, UplcBuiltin
//
//     Section 11: Uplc program              UPLC_VERSION_COMPONENTS, UPLC_VERSION, 
//                                           PLUTUS_SCRIPT_VERSION, UPLC_TAG_WIDTHS, 
//                                           deserializeUplcBytes, deserializeUplc
//
//     Section 12: Tokenization              Tokenizer, tokenize, tokenizeIR
//
//     Section 13: Eval common types         applyTypes, Common, AllType, AnyType, ErrorType, 
//                                           ArgType, FuncType, GenericType, 
//                                           GenericEnumMemberType, VoidType, DataEntity, 
//                                           ErrorEntity, NamedEntity, FuncEntity, MultiEntity, 
//                                           TypedEntity, VoidEntity, ModuleNamespace
//
//     Section 14: Eval primitive types      genCommonInstanceMembers, genCommonTypeMembers, 
//                                           genCommonEnumTypeMembers, BoolType, ByteArrayType, 
//                                           IntType, RawDataType, RealType, StringType
//
//     Section 15: Eval builtin typeclasses  TypeClassImpl, DataTypeClassImpl, AnyTypeClass, 
//                                           DefaultTypeClass, Parameter, ParametricFunc, 
//                                           AppliedType, ParametricType
//
//     Section 16: Eval builtin functions    BuiltinFunc, AssertFunc, ErrorFunc, PrintFunc
//
//     Section 17: Eval container types      ListType, ListType, MapType, MapType, OptionType, 
//                                           OptionType
//
//     Section 18: Eval time types           DurationType, TimeType, TimeRangeType
//
//     Section 19: Eval hash types           genHashInstanceMembers, genHashTypeMembers, 
//                                           DatumHashType, MintingPolicyHashType, PubKeyType, 
//                                           PubKeyHashType, ScriptHashType, StakeKeyHashType, 
//                                           StakingHashType, StakingHashStakeKeyType, 
//                                           StakingHashValidatorType, StakingValidatorHashType, 
//                                           ValidatorHashType
//
//     Section 20: Eval money types          AssetClassType, ValueType, ValuableTypeClass
//
//     Section 21: Eval tx types             AddressType, DCertType, DCertDelegateType, 
//                                           DCertDeregisterType, DCertRegisterType, 
//                                           DCertRegisterPoolType, DCertRetirePoolType, 
//                                           CredentialType, CredentialPubKeyType, 
//                                           CredentialValidatorType, OutputDatumType, 
//                                           OutputDatumHashType, OutputDatumInlineType, 
//                                           OutputDatumNoneType, ScriptContextType, 
//                                           ScriptPurposeType, ScriptPurposeCertifyingType, 
//                                           ScriptPurposeMintingType, ScriptPurposeTypeRewarding, 
//                                           ScriptPurposeSpendingType, StakingCredentialType, 
//                                           StakingCredentialHashType, StakingCredentialPtrType, 
//                                           StakingPurposeType, StakingPurposeCertifyingType, 
//                                           StakingPurposeRewardingType, TxType, TxIdType, 
//                                           TxInputType, TxOutputType, TxOutputIdType
//
//     Section 22: Scopes                    GlobalScope, Scope, TopScope, ModuleScope
//
//     Section 23: Helios AST expressions    Expr, RefExpr, PathExpr, ValuePathExpr, ListTypeExpr, 
//                                           MapTypeExpr, OptionTypeExpr, VoidTypeExpr, 
//                                           FuncArgTypeExpr, FuncTypeExpr, AssignExpr, VoidExpr, 
//                                           ChainExpr, PrimitiveLiteralExpr, LiteralDataExpr, 
//                                           StructLiteralField, StructLiteralExpr, 
//                                           ListLiteralExpr, MapLiteralExpr, NameTypePair, 
//                                           FuncArg, FuncLiteralExpr, ParametricExpr, UnaryExpr, 
//                                           BinaryExpr, ParensExpr, CallArgExpr, CallExpr, 
//                                           MemberExpr, IfElseExpr, DestructExpr, SwitchCase, 
//                                           UnconstrDataSwitchCase, SwitchDefault, SwitchExpr, 
//                                           EnumSwitchExpr, DataSwitchExpr
//
//     Section 24: Helios AST statements     Statement, ImportFromStatement, 
//                                           ImportModuleStatement, ConstStatement, TypeParameter, 
//                                           TypeParameters, DataField, DataDefinition, 
//                                           StructStatement, FuncStatement, EnumMember, 
//                                           EnumStatement, ImplDefinition
//
//     Section 25: Helios AST building       AUTOMATIC_METHODS, importPathTranslator, 
//                                           setImportPathTranslator, buildProgramStatements, 
//                                           buildScriptPurpose, buildScript, 
//                                           extractScriptPurposeAndName, buildConstStatement, 
//                                           buildTypeClassExpr, buildTypeParameter, 
//                                           buildTypeParameters, splitDataImpl, 
//                                           buildStructStatement, buildDataFields, 
//                                           buildFuncStatement, buildFuncLiteralExpr, 
//                                           buildFuncArgs, buildEnumStatement, 
//                                           buildImportStatements, buildImportModuleStatement, 
//                                           buildImportFromStatements, buildEnumMember, 
//                                           buildImplDefinition, buildImplMembers, buildTypeExpr, 
//                                           buildParametricTypeExpr, buildListTypeExpr, 
//                                           buildMapTypeExpr, buildOptionTypeExpr, 
//                                           buildFuncTypeExpr, buildFuncArgTypeExpr, 
//                                           buildFuncRetTypeExprs, buildTypePathExpr, 
//                                           buildTypeRefExpr, buildValueExpr, 
//                                           buildMaybeAssignOrChainExpr, buildDestructExpr, 
//                                           buildDestructExprs, buildAssignLhs, 
//                                           makeBinaryExprBuilder, makeUnaryExprBuilder, 
//                                           buildChainedValueExpr, buildParametricValueExpr, 
//                                           buildCallExpr, buildChainStartValueExpr, 
//                                           buildParensExpr, buildCallArgs, buildCallArgExpr, 
//                                           buildIfElseExpr, buildSwitchExpr, 
//                                           buildSwitchCaseName, buildSwitchCase, 
//                                           buildSwitchCaseNameType, buildMultiArgSwitchCase, 
//                                           buildSingleArgSwitchCase, buildSwitchCaseBody, 
//                                           buildSwitchDefault, buildListLiteralExpr, 
//                                           buildMapLiteralExpr, buildStructLiteralExpr, 
//                                           buildStructLiteralField, 
//                                           buildStructLiteralNamedField, 
//                                           buildStructLiteralUnnamedField, buildValuePathExpr
//
//     Section 26: IR definitions            onNotifyRawUsage, setRawUsageNotifier, RE_BUILTIN, 
//                                           RawFunc, makeRawFunctions, db, fetchRawGenerics, 
//                                           fetchRawFunctions, wrapWithRawFunctions
//
//     Section 27: IR Context objects        IRScope, ALWAYS_INLINEABLE, IRVariable, IRValue, 
//                                           IRFuncValue, IRLiteralValue, IRDeferredValue, 
//                                           IRCallStack
//
//     Section 28: IR AST objects            IRNameExprRegistry, IRExprRegistry, IRExpr, 
//                                           IRNameExpr, IRLiteralExpr, IRConstExpr, IRFuncExpr, 
//                                           IRCallExpr, IRCoreCallExpr, IRUserCallExpr, 
//                                           IRAnonCallExpr, IRNestedAnonCallExpr, IRFuncDefExpr, 
//                                           IRErrorCallExpr
//
//     Section 29: IR AST build functions    buildIRExpr, buildIRFuncExpr
//
//     Section 30: IR Program                IRProgram, IRParametricProgram
//
//     Section 31: Helios program            Module, MainModule, RedeemerProgram, 
//                                           DatumRedeemerProgram, TestingProgram, 
//                                           SpendingProgram, MintingProgram, StakingProgram
//
//     Section 32: Native scripts            NativeContext, NativeScript, NativeSig, NativeAll, 
//                                           NativeAny, NativeAtLeast, NativeAfter, NativeBefore
//
//     Section 33: Tx types                  Tx, TxBody, TxWitnesses, TxInput, UTxO, TxRefInput, 
//                                           TxOutput, DCert, StakeAddress, Signature, PrivateKey, 
//                                           Redeemer, SpendingRedeemer, MintingRedeemer, Datum, 
//                                           HashedDatum, InlineDatum, encodeMetadata, 
//                                           decodeMetadata, TxMetadata
//
//     Section 34: Highlighting function     SyntaxCategory, highlight
//
//     Section 35: Fuzzy testing framework   FuzzyTest
//
//     Section 36: CoinSelection             CoinSelection
//
//     Section 37: Wallets                   Cip30Wallet, WalletHelper
//
//     Section 38: Network                   BlockfrostV0
//
//     Section 39: Emulator                  WalletEmulator, GenesisTx, RegularTx, NetworkEmulator
//
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////
// Section 1: Config
////////////////////

/**
 * Version of the Helios library.
 */
export const VERSION = "0.14.0";

/**
 * A tab used for indenting of the IR.
 * 2 spaces.
 * @package
 * @type {string}
 */
const TAB = "  ";

/**
 * A Real in Helios is a fixed point number with REAL_PRECISION precision
 * @package
 * @type {number}
 */
const REAL_PRECISION = 6;

/**
 * Modifiable config vars
 * @type {{
 *   DEBUG: boolean,
 *   STRICT_BABBAGE: boolean,
 *   IS_TESTNET: boolean,
 *   N_DUMMY_INPUTS: number,
 *   AUTO_SET_VALIDITY_RANGE: boolean,
 *   VALIDITY_RANGE_START_OFFSET: number | null,
 *   VALIDITY_RANGE_END_OFFSET: number | null
 * }}
 */
export const config = {
    /**
     * Global debug flag. Not currently used for anything though.
     */
    DEBUG: false,

    /**
     * Set this to true if you want to experiment with transactions serialized using the strict babbage cddl format
     */
    STRICT_BABBAGE: false,

    /**
     * Set to false if using the library for mainnet (impacts Addresses)
     */
    IS_TESTNET: true,

    /**
     * Calculating the execution budget during tx building requires knowing all the inputs beforehand,
     *   which is very difficult because balancing is done after the budget is calculated.
     * Instead we use at least 1 dummy input, which should act as a representative balancing input.
     * For increased robustness we use 2 dummy inputs, one with Txid 0 and other with TxId ffff...,
     *   because eg. there are case where the TxId is being printed, and a Txid of ffff... would overestimate the fee
     * This value must be '1' or '2'
     */
    N_DUMMY_INPUTS: 2,

    /**
     * The validatity time range can be set automatically if a call to tx.time_range is detected.
     * Helios defines some reasonable defaults.
     */
    AUTO_SET_VALIDITY_RANGE: false,
    VALIDITY_RANGE_START_OFFSET: 60, // seconds
    VALIDITY_RANGE_END_OFFSET: 300 // seconds
}



///////////////////////
// Section 2: Utilities
///////////////////////

/**
 * Needed by transfer() methods
 * @typedef {{
*   transferByteArrayData: (bytes: number[]) => any,
*   transferConstrData: (index: number, fields: any[]) => any,
*   transferIntData: (value: bigint) => any,
*   transferListData: (items: any[]) => any,
*   transferMapData: (pairs: [any, any][]) => any,
* 	transferSite: (src: any, startPos: number, endPos: number, codeMapSite: null | any) => any,
*   transferSource: (raw: string, fileIndex: null | number) => any,
*   transferUplcBool: (site: any, value: boolean) => any,
*   transferUplcBuiltin: (site: any, name: string | number) => any,
*   transferUplcByteArray: (site: any, bytes: number[]) => any,
*   transferUplcCall: (site: any, a: any, b: any) => any,
*   transferUplcConst: (value: any) => any,
*   transferUplcDataValue: (site: any, data: any) => any,
*   transferUplcDelay: (site: any, expr: any) => any,
*   transferUplcError: (site: any, msg: string) => any,
*   transferUplcForce: (site: any, expr: any) => any,
*   transferUplcInt: (site: any, value: bigint, signed: boolean) => any,
*   transferUplcLambda: (site: any, rhs: any, name: null | string) => any,
*   transferUplcList: (site: any, itemType: any, items: any[]) => any,
*   transferUplcPair: (site: any, first: any, second: any) => any,
*   transferUplcString: (site: any, value: string) => any,
*   transferUplcType: (typeBits: string) => any,
*   transferUplcUnit: (site: any) => any,
*   transferUplcVariable: (site: any, index: any) => any
* }} TransferUplcAst
*/

/**
 * Throws an error if 'cond' is false.
 * @package
 * @param {boolean} cond 
 * @param {string} msg 
 */
function assert(cond, msg = "unexpected") {
	if (!cond) {
		throw new Error(msg);
	}
}

/**
 * Throws an error if 'obj' is undefined. Returns 'obj' itself (for chained application).
 * @package
 * @template T
 * @param {T | undefined | null} obj 
 * @param {string} msg 
 * @returns {T}
 */
function assertDefined(obj, msg = "unexpected undefined value") {
	if (obj === undefined || obj === null ) {
		throw new Error(msg);
	}

	return obj;
}

/**
 * @package
 * @template Tin, Tout
 * @param {Tin} obj
 * @param {{new(...any): Tout}} C
 * @returns {Tout}
 */
function assertClass(obj, C, msg = "unexpected class") {
	if (obj instanceof C) {
		return obj;
	} else {
		throw new Error(msg);
	}
}

/**
 * @package
 * @param {string} str 
 * @param {string} msg 
 * @returns {string}
 */
function assertNonEmpty(str, msg = "empty string") {
	if (str.length == 0) {
		throw new Error(msg);
	} else {
		return str;
	}
}

/**
 * @package
 * @param {any} obj 
 * @param {string} msg 
 * @returns {number}
 */
function assertNumber(obj, msg = "expected a number") {
	if (obj === undefined || obj === null) {
		throw new Error(msg);
	} else if (typeof obj == "number") {
		return obj;
	} else {
		throw new Error(msg);
	}
}

/**
 * @package
 * @template T
 * @param {(T | null)[]} lst
 * @returns {null | (T[])}
 */
function reduceNull(lst) {
	/**
	 * @type {T[]}
	 */
	const nonNullLst = [];

	let someNull = false;

	lst.forEach(item => {
		if (item !== null && !someNull) {
			nonNullLst.push(item);
		} else {
			someNull = true;
		}
	});

	if (someNull) {
		return null;
	} else {
		return nonNullLst;
	}
}

/**
 * @template Ta
 * @template Tb
 * @param {[Ta | null, Tb | null][]} pairs
 * @returns {null | [Ta, Tb][]}
 */
export function reduceNullPairs(pairs) {
	/**
	 * @type {[Ta, Tb][]}
	 */
	const nonNullPairs = [];

	let someNull = false;

	pairs.forEach(([a, b]) => {
		if (a === null || b === null) {
			someNull = true;
		} else if (!someNull) {
			nonNullPairs.push([a, b]);
		}
	});

	if (someNull) {
		return null;
	} else {
		return nonNullPairs;
	}
}

/**
 * Compares two objects (deep recursive comparison)
 * @package
 * @template T
 * @param {T} a 
 * @param {T} b 
 * @returns {boolean}
 */
function eq(a, b) {
	if (a === undefined || b === undefined) {
		throw new Error("one of the args is undefined");
	} else if (typeof a == "string") {
		return a === b;
	} else if (typeof a == "number") {
		return a === b;
	} else if (typeof a == "boolean") {
		return a === b;
	} else if (typeof a == "bigint") {
		return a === b;
	} else if (a instanceof Array && b instanceof Array) {
		if (a.length != b.length) {
			return false;
		}

		for (let i = 0; i < a.length; i++) {
			if (!eq(a[i], b[i])) {
				return false;
			}
		}

		return true;
	} else {
		throw new Error("eq not yet implemented for these types");
	}
}

/**
 * Throws an error if two object aren't equal (deep comparison).
 * Used by unit tests that are autogenerated from JSDoc inline examples.
 * @package
 * @template T
 * @param {T} a
 * @param {T} b
 * @param {string} msg
 */
function assertEq(a, b, msg) {
	if (!eq(a, b)) {
		console.log(a);
		console.log(b);
		throw new Error(msg);
	}
}

/**
 * Divides two integers. Assumes a and b are whole numbers. Rounds down the result.
 * @example
 * idiv(355, 113) => 3
 * @package
 * @param {number} a
 * @param {number} b 
 */
function idiv(a, b) {
	return Math.floor(a / b);
	// alternatively: (a - a%b)/b
}

/**
 * 2 to the power 'p' for bigint.
 * @package
 * @param {bigint} p
 * @returns {bigint}
 */
function ipow2(p) {
	return (p <= 0n) ? 1n : 2n << (p - 1n);
}

/**
 * Masks bits of 'b' by setting bits outside the range ['i0', 'i1') to 0. 
 * 'b' is an 8 bit integer (i.e. number between 0 and 255).
 * The return value is also an 8 bit integer, shift right by 'i1'.
 
 * @example
 * imask(0b11111111, 1, 4) => 0b0111 // (i.e. 7)
 * @package
 * @param {number} b 
 * @param {number} i0 
 * @param {number} i1 
 * @returns {number}
 */
function imask(b, i0, i1) {
	assert(i0 < i1);

	const mask_bits = [
		0b11111111,
		0b01111111,
		0b00111111,
		0b00011111,
		0b00001111,
		0b00000111,
		0b00000011,
		0b00000001,
	];

	return (b & mask_bits[i0]) >> (8 - i1);
}

/**
 * Make sure resulting number fits in uint8
 * @package
 * @param {number} x
 */
function imod8(x) {
	return x & 0xff;
}

/**
 * Converts an unbounded integer into a list of uint8 numbers (big endian)
 * Used by the CBOR encoding of data structures, and by Ed25519
 * @package
 * @param {bigint} x
 * @returns {number[]}
 */
function bigIntToBytes(x) {
	if (x == 0n) {
		return [0];
	} else {
		/**
		 * @type {number[]}
		 */
		const res = [];

		while (x > 0n) {
			res.unshift(Number(x%256n));

			x = x/256n;
		}

		return res;
	}
}

/**
 * Converts a list of uint8 numbers into an unbounded int (big endian)
 * Used by the CBOR decoding of data structures.
 * @package
 * @param {number[]} b
 * @return {bigint}
 */
function bytesToBigInt(b) {
	let s = 1n;
	let total = 0n;

	while (b.length > 0) {
		total += BigInt(assertDefined(b.pop()))*s;

		s *= 256n;
	}

	return total;
}

/**
 * Prepends zeroes to a bit-string so that 'result.length == n'.
 * @example
 * padZeroes("1111", 8) => "00001111"
 * @package
 * @param {string} bits
 * @param {number} n 
 * @returns {string}
 */
function padZeroes(bits, n) {
	// padded to multiple of n
	if (bits.length % n != 0) {
		const nPad = n - bits.length % n;

		bits = (new Array(nPad)).fill('0').join('') + bits;
	}

	return bits;
}

/**
 * Converts a 8 bit integer number into a bit string with an optional "0b" prefix.
 * The result is padded with leading zeroes to become 'n' chars long ('2 + n' chars long if you count the "0b" prefix). 
 * @example
 * byteToBitString(7) => "0b00000111"
 * @package
 * @param {number} b 
 * @param {number} n
 * @param {boolean} prefix
 * @returns {string}
 */
function byteToBitString(b, n = 8, prefix = true) {
	const s = padZeroes(b.toString(2), n);

	if (prefix) {
		return "0b" + s;
	} else {
		return s;
	}
}

/**
 * Converts a hexadecimal representation of bytes into an actual list of uint8 bytes.
 * @example
 * hexToBytes("00ff34") => [0, 255, 52] 
 * @param {string} hex 
 * @returns {number[]}
 */
export function hexToBytes(hex) {
	hex = hex.trim();
	
	const bytes = [];

	for (let i = 0; i < hex.length; i += 2) {
		bytes.push(parseInt(hex.slice(i, i + 2), 16));
	}

	return bytes;
}

/**
 * Converts a list of uint8 bytes into its hexadecimal string representation.
 * @example
 * bytesToHex([0, 255, 52]) => "00ff34"
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
	const parts = [];

	for (let b of bytes) {
		parts.push(padZeroes(b.toString(16), 2));
	}

	return parts.join('');
}

/**
 * Encodes a string into a list of uint8 bytes using UTF-8 encoding.
 * @example
 * textToBytes("hello world") => [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
 * @param {string} str 
 * @returns {number[]}
 */
export function textToBytes(str) {
	return Array.from((new TextEncoder()).encode(str));
}

/**
 * Decodes a list of uint8 bytes into a string using UTF-8 encoding.
 * @example
 * bytesToText([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]) => "hello world"
 * @param {number[]} bytes 
 * @returns {string}
 */
export function bytesToText(bytes) {
	return (new TextDecoder("utf-8", {fatal: true})).decode((new Uint8Array(bytes)).buffer);
}

/**
 * Replaces the tab characters of a string with spaces.
 * This is used to create a prettier IR (which is built-up from many template js strings in this file, which might contain tabs depending on the editor used)
 * @example
 * replaceTabs("\t\t\t") => [TAB, TAB, TAB].join("")
 * @package
 * @param {string} str 
 * @returns {string}
 */
function replaceTabs(str) {
	return str.replace(new RegExp("\t", "g"), TAB);
}

/**
 * Read non-byte aligned numbers
 * @package
 */
class BitReader {
    /**
     * @type {Uint8Array}
     */
	#view;

    /**
     * @type {number}
     */
	#pos;

    /**
     * @type {boolean}
     */
	#truncate;

	/**
	 * @param {number[]} bytes
	 * @param {boolean} truncate - if true then read last bits as low part of number, if false pad with zero bits
	 */
	constructor(bytes, truncate = true) {
		this.#view = new Uint8Array(bytes);
		this.#pos = 0; // bit position, not byte position
		this.#truncate = truncate;
	}

	/**
     * @package
	 * @returns {boolean}
	 */
	eof() {
		return idiv(this.#pos, 8) >= this.#view.length;
	}

	/**
	 * Reads a number of bits (<= 8) and returns the result as an unsigned number
     * @package
	 * @param {number} n - number of bits to read
	 * @returns {number}
	 */
	readBits(n) {
		assert(n <= 8, "reading more than 1 byte");

		let leftShift = 0;
		if (this.#pos + n > this.#view.length * 8) {
			const newN = (this.#view.length*8 - this.#pos);

			if (!this.#truncate) {
				leftShift = n - newN;
			}

			n = newN;
		}

		assert(n > 0, "eof");

		// it is assumed we don't need to be at the byte boundary

		let res = 0;
		let i0 = this.#pos;

		for (let i = this.#pos + 1; i <= this.#pos + n; i++) {
			if (i % 8 == 0) {
				const nPart = i - i0;

				res += imask(this.#view[idiv(i, 8) - 1], i0 % 8, 8) << (n - nPart);

				i0 = i;
			} else if (i == this.#pos + n) {
				res += imask(this.#view[idiv(i, 8)], i0 % 8, i % 8);
			}
		}

		this.#pos += n;
		return res << leftShift;
	}

	/**
	 * Moves position to next byte boundary
     * @package
	 * @param {boolean} force - if true then move to next byte boundary if already at byte boundary
	 */
	moveToByteBoundary(force = false) {
		if (this.#pos % 8 != 0) {
			let n = 8 - this.#pos % 8;

			void this.readBits(n);
		} else if (force) {
			this.readBits(8);
		}
	}

	/**
	 * Reads 8 bits
     * @package
	 * @returns {number}
	 */
	readByte() {
		return this.readBits(8);
	}

	/**
	 * Dumps remaining bits we #pos isn't yet at end.
	 * This is intended for debugging use.
     * @package
	 */
	dumpRemainingBits() {
		if (!this.eof()) {
			console.log("remaining bytes:");
			for (let first = true, i = idiv(this.#pos, 8); i < this.#view.length; first = false, i++) {
				if (first && this.#pos % 8 != 0) {
					console.log(byteToBitString(imask(this.#view[i], this.#pos % 8, 8) << 8 - this.#pos % 7));
				} else {
					console.log(byteToBitString(this.#view[i]));
				}
			}
		} else {
			console.log("eof");
		}
	}
}

/**
 * BitWriter turns a string of '0's and '1's into a list of bytes.
 * Finalization pads the bits using '0*1' if not yet aligned with the byte boundary.
 * @package
 */
class BitWriter {
	/**
	 * Concatenated and padded upon finalization
	 * @type {string[]}
	 */
	#parts;

	/**
	 * Number of bits written so far
	 * @type {number}
	 */
	#n;

	constructor() {
		this.#parts = [];
		this.#n = 0;
	}

	/**
     * @package
	 * @type {number}
	 */
	get length() {
		return this.#n;
	}

	/**
	 * Write a string of '0's and '1's to the BitWriter.
     * @package
	 * @param {string} bitChars
	 */
	write(bitChars) {
		for (let c of bitChars) {
			if (c != '0' && c != '1') {
				throw new Error("bad bit char");
			}
		}

		this.#parts.push(bitChars);
		this.#n += bitChars.length;
	}

	/**
     * @package
	 * @param {number} byte
	 */
	writeByte(byte) {
		this.write(padZeroes(byte.toString(2), 8));
	}

	/**
	 * Add padding to the BitWriter in order to align with the byte boundary.
	 * If 'force == true' then 8 bits are added if the BitWriter is already aligned.
     * @package
	 * @param {boolean} force 
	 */
	padToByteBoundary(force = false) {
		let nPad = 0;
		if (this.#n % 8 != 0) {
			nPad = 8 - this.#n % 8;
		} else if (force) {
			nPad = 8;
		}

		if (nPad != 0) {
			let padding = (new Array(nPad)).fill('0');
			padding[nPad - 1] = '1';

			this.#parts.push(padding.join(''));

			this.#n += nPad;
		}
	}

	/**
	 * Pads the BitWriter to align with the byte boundary and returns the resulting bytes.
     * @package
	 * @param {boolean} force - force padding (will add one byte if already aligned)
	 * @returns {number[]}
	 */
	finalize(force = true) {
		this.padToByteBoundary(force);

		let chars = this.#parts.join('');

		let bytes = [];

		for (let i = 0; i < chars.length; i += 8) {
			let byteChars = chars.slice(i, i + 8);
			let byte = parseInt(byteChars, 2);

			bytes.push(byte);
		}

		return bytes;
	}
}

/**
 * Function that generates a random number between 0 and 1
 * @typedef {() => number} NumberGenerator
 */

/**
 * A Source instance wraps a string so we can use it cheaply as a reference inside a Site.
 * Also used by VSCode plugin
 */
export class Source {
	#raw;
	#fileIndex;
	#errors; // errors are collected into this object

	/**
	 * @param {string} raw 
	 * @param {null | number} fileIndex
	 */
	constructor(raw, fileIndex = null) {
		this.#raw = assertDefined(raw);
		this.#fileIndex = fileIndex;
		this.#errors = [];
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		// errors don't need to be transfered
		return other.transferSource(
			this.#raw,
			this.#fileIndex	
		)
	}

    /**
     * @package
     * @type {string}
     */
	get raw() {
		return this.#raw;
	}

    /**
     * @package
     * @type {?number}
     */
	get fileIndex() {
		return this.#fileIndex;
	}

	/**
	 * @type {Error[]}
	 */
	get errors() {
		return this.#errors;
	}

	throwErrors() {
		if (this.#errors.length > 0) {
			throw this.#errors[0];
		}
	}

	/**
	 * Get char from the underlying string.
	 * Should work fine utf-8 runes.
     * @package
	 * @param {number} pos
	 * @returns {string}
	 */
	getChar(pos) {
		return this.#raw[pos];
	}
	
	/**
	 * Returns word under pos
     * @package
	 * @param {number} pos 
	 * @returns {?string}
	 */
	getWord(pos) {
		/** @type {string[]} */
		const chars = [];

		/**
		 * @param {string | undefined} c 
		 * @returns {boolean}
		 */
		function isWordChar(c) {
			if (c === undefined) {
				return false;
			} else {
				return (c == '_' || (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'));
			}
		}

		let c = this.#raw[pos];
		while (isWordChar(c)) {
			chars.push(c);
			pos += 1;
			c = this.#raw[pos];
		}

		if (chars.length == 0) {
			return null;
		} else {
			return chars.join("");
		}
	}

    /**
     * @package
     * @type {number}
     */
	get length() {
		return this.#raw.length;
	}

	/**
	 * Calculates the line number of the line where the given character is located (0-based).
     * @package
	 * @param {number} pos 
	 * @returns {number}
	 */
	posToLine(pos) {
		let line = 0;
		for (let i = 0; i < pos; i++) {
			if (this.#raw[i] == '\n') {
				line += 1;
			}
		}

		return line;
	}

	/**
	 * Calculates the column and line number where the given character is located (0-based).
     * @package
	 * @param {number} pos
	 * @returns {[number, number]}
	 */
	// returns [col, line]
	posToLineAndCol(pos) {
		let col = 0;
		let line = 0;
		for (let i = 0; i < pos; i++) {
			if (this.#raw[i] == '\n') {
				col = 0;
				line += 1;
			} else {
				col += 1;
			}
		}

		return [line, col];
	}

	/**
	 * Creates a more human-readable version of the source by prepending the line-numbers to each line.
	 * The line-numbers are at least two digits.
	 * @example
	 * (new Source("hello\nworld")).pretty() => "01  hello\n02  world"
     * @package
	 * @returns {string}
	 */
	pretty() {
		const lines = this.#raw.split("\n");

		const nLines = lines.length;
		const nDigits = Math.max(Math.ceil(Math.log10(nLines)), 2); // line-number is at least two digits

		for (let i = 0; i < nLines; i++) {
			lines[i] = String(i + 1).padStart(nDigits, '0') + "  " + lines[i];
		}

		return lines.join("\n");
	}
}

/**
 * A tag function for a helios source.
 * Is just a marker so IDE support can work on literal helios sources inside javascript/typescript files.
 * @example
 * hl`hello ${"world"}!` => "hello world!"
 * @param {string[]} a 
 * @param  {...any} b 
 * @returns {string}
 */
export function hl(a, ...b) {
	return a.map((part, i) => {
		if (i < b.length) {
			return part + b[i].toString();
		} else {
			return part;
		}
	}).join("");
}

/**
 * Display a warning message that a certain feature will be deprecated at some point in the future.
 * @package
 * @param {string} feature
 * @param {string} futureVersion
 * @param {string} alternative
 * @param {string} docUrl
 */
function deprecationWarning(feature, futureVersion, alternative, docUrl = "") {
	let msg = `${feature} is DEPRECATED, and will be removed from version ${futureVersion} onwards!
${alternative}`;

	if (docUrl != "") {
		msg += `\n(for more information: ${docUrl})`;
	}

	console.warn(msg);
}



////////////////////
// Section 3: Tokens
////////////////////
/**
 * Each Token/Expression/Statement has a Site, which encapsulates a position in a Source
 * @package
 */
class Site {
	#src;
	#startPos;
	#endPos;

	/** @type {null | Site} - end of token, exclusive, TODO: replace with endPos */
	#endSite;

	/** @type {null | Site} */
	#codeMapSite;

	/**
	 * @param {Source} src 
	 * @param {number} startPos
	 * @param {number} endPos 
	 */
	constructor(src, startPos, endPos = startPos + 1, codeMapSite = null) {
		this.#src = src;
		this.#startPos = startPos;
		this.#endPos = endPos;
		this.#endSite = null;
		this.#codeMapSite = codeMapSite;
	}

	/**
	 * 
	 * @param {TransferUplcAst} other 
	 */
	transfer(other) {
		return other.transferSite(
			this.#src.transfer(other),
			this.#startPos,
			this.#endPos,
			this.#codeMapSite?.transfer(other) ?? null
		)
	}

	static dummy() {
		return new Site(new Source(""), 0);
	}

	get src() {
		return this.#src;
	}

	get startPos() {
		return this.#startPos;
	}

	get endPos() {
		return this.#endPos;
	}
	
	get endSite() {
		return this.#endSite;
	}

	/**
	 * @param {Site} other 
	 * @returns {Site}
	 */
	merge(other) {
		return new Site(this.#src, this.#startPos, other.#endPos);
	}

	/**
	 * @param {?Site} site
	 */
	setEndSite(site) {
		this.#endSite = site;
	}

	/**
	 * @type {?Site} 
	 */
	get codeMapSite() {
		return this.#codeMapSite;
	}

	/**
	 * @param {Site} site 
	 */
	setCodeMapSite(site) {
		this.#codeMapSite = site;
	}

	/**
	 * Returns a SyntaxError
	 * @param {string} info 
	 * @returns {UserError}
	 */
	syntaxError(info = "") {
		return UserError.syntaxError(this.#src, this.#startPos, this.#endPos, info);
	}

	/**
	 * Returns a TypeError
	 * @param {string} info
	 * @returns {UserError}
	 */
	typeError(info = "") {
		return UserError.typeError(this.#src, this.#startPos, this.#endPos, info);
	}

	/**
	 * Returns a ReferenceError
	 * @param {string} info 
	 * @returns {UserError}
	 */
	referenceError(info = "") {
		return UserError.referenceError(this.#src, this.#startPos, this.#endPos, info);
	}

	/**
	 * Returns a RuntimeError
	 * @param {string} info
	 * @returns {UserError}
	 */
	runtimeError(info = "") {
		if (this.#codeMapSite !== null) {
			let site = this.#codeMapSite;
			return RuntimeError.newRuntimeError(site.#src, site.#startPos, false, info);
		} else {
			return RuntimeError.newRuntimeError(this.#src, this.#startPos, true, info);
		}
	}

	/**
	 * Calculates the column,line position in 'this.#src'
	 * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
	 */
	getFilePos() {
		const [startLine, startCol] = this.#src.posToLineAndCol(this.#startPos);

		const [endLine, endCol] = this.#src.posToLineAndCol(this.#endPos);

		return [startLine, startCol, endLine, endCol];
	}
}


/**
 * UserErrors are generated when the user of Helios makes a mistake (eg. a syntax error),
 * or when the user of Helios throws an explicit error inside a script (eg. division by zero).
 */
 export class UserError extends Error {
	#src;
	#startPos;
	#endPos;

	/**
	 * @type {Object}
	 */
	#context; // additional context

	/**
	 * @param {string} msg
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 */
	constructor(msg, src, startPos, endPos = startPos + 1) {
		super(msg);
		this.#src = src;
		this.#startPos = startPos;
		this.#endPos = endPos;
		this.#context = {};
	}

	/**
	 * @param {string} type
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 */
	static new(type, src, startPos, endPos, info = "") {
		let line = src.posToLine(startPos);

		let msg = `${type} on line ${line + 1}`;
		if (info != "") {
			msg += `: ${info}`;
		}

		return new UserError(msg, src, startPos, endPos);
	}

	/**
	 * @type {Source}
	 */
	get src() {
		return this.#src;
	}

	/**
	 * @type {Object}
	 */
	get context() {
		return this.#context;
	}

	/**
	 * Constructs a SyntaxError
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 * @returns {UserError}
	 */
	static syntaxError(src, startPos, endPos, info = "") {
		const error = UserError.new("SyntaxError", src, startPos, endPos, info);

		src.errors.push(error);

		return error;
	}

	/**
	 * Constructs a TypeError
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 * @returns {UserError}
	 */
	static typeError(src, startPos, endPos, info = "") {
		const error = UserError.new("TypeError", src, startPos, endPos, info);

		src.errors.push(error);

		return error;
	}

	/**
	 * @param {Error} e 
	 * @returns {boolean}
	 */
	static isTypeError(e) {
		return (e instanceof UserError) && e.message.startsWith("TypeError");
	}

	/**
	 * Constructs a ReferenceError (i.e. name undefined, or name unused)
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 * @returns {UserError}
	 */
	static referenceError(src, startPos, endPos, info = "") {
		const error = UserError.new("ReferenceError", src, startPos, endPos, info);

		src.errors.push(error);

		return error;
	}

	/**
	 * @param {Error} e 
	 * @returns {boolean}
	 */
	static isReferenceError(e) {
		return (e instanceof UserError) && e.message.startsWith("ReferenceError");
	}

	get data() {
		throw new Error("is error");
	}

	/**
	 * @type {number}
	 */
	get startPos() {
		return this.#startPos;
	}

	/**
	 * Calculates column/line position in 'this.src'.
	 * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
	 */
	getFilePos() {
		const [startLine, startCol] = this.#src.posToLineAndCol(this.#startPos);
		const [endLine, endCol] = this.#src.posToLineAndCol(this.#endPos);

		return [startLine, startCol, endLine, endCol];
	}

	/**
	 * Dumps the error without throwing.
	 * If 'verbose == true' the Source is also pretty printed with line-numbers.
	 * @param {boolean} verbose 
	 */
	dump(verbose = false) {
		if (verbose) {
			console.error(this.#src.pretty());
		}

		console.error("\n" + this.message);
	}

	/**
	 * Returns the error message (alternative to e.message)
	 * @returns {string}
	 */
	toString() {
		return this.message;
	}

	/**
	 * Catches any UserErrors thrown inside 'fn()`.
	 * Dumps the error
	 * @template T
	 * @param {() => T} fn 
	 * @param {boolean} verbose 
	 * @returns {T | undefined}	
	 */
	static catch(fn, verbose = false) {
		try {
			return fn();
		} catch (error) {
			if (error instanceof UserError) {
				error.dump(verbose);
			} else {
				throw error;
			}
		}
	}
}

/**
 * @typedef {(error: UserError) => void} Throw
 */

/**
 * @package
 */
class RuntimeError extends UserError {
	#isIR; // last trace added

	/**
	 * @param {string} msg 
	 * @param {Source} src 
	 * @param {number} pos 
	 * @param {boolean} isIR 
	 */
	constructor(msg, src, pos, isIR) {
		super(msg, src, pos);
		this.#isIR = isIR;
	}

	/**
	 * @param {Source} src 
	 * @param {number} pos 
	 * @param {boolean} isIR
	 * @param {string} info
	 * @returns {RuntimeError}
	 */
	static newRuntimeError(src, pos, isIR, info = "") {
		let line = src.posToLine(pos);

		let msg = `RuntimeError on line ${line + 1}${isIR ? " of IR" : ""}`;
		if (info != "") {
			msg += `: ${info}`;
		}

		return new RuntimeError(msg, src, pos, isIR);
	}

	/**
	 * @param {Source} src 
	 * @param {number} pos 
	 * @param {boolean} isIR 
	 * @param {string} info 
	 * @returns {RuntimeError}
	 */
	addTrace(src, pos, isIR, info = "") {
		if (isIR && !this.#isIR) {
			return this;
		}

		let line = src.posToLine(pos);

		let msg = `Trace${info == "" ? ":" : ","} line ${line + 1}`;
		if (isIR) {
			msg += " of IR";
		} 

		let word = src.getWord(pos);
		if (word !== null && word !== "print") {
			msg += ` in '${word}'`;
		}

		if (info != "") {
			msg += `: ${info}`;
		}

		
		msg += "\n" + this.message;

		return new RuntimeError(msg, this.src, this.startPos, isIR);
	}
	
	/**
	 * @param {Site} site 
	 * @param {string} info 
	 * @returns {RuntimeError}
	 */
	addTraceSite(site, info = "") {
		if (site.codeMapSite === null) {
			return this.addTrace(site.src, site.startPos, true, info);
		} else {
			return this.addTrace(site.codeMapSite.src, site.codeMapSite.startPos, false, info);
		}
	}
}

/**
 * Token is the base class of all Expressions and Statements
 */
export class Token {
	#site;

	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		this.#site = assertDefined(site); // position in source of start of token
	}

	get site() {
		return this.#site;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns 'true' if 'this' is a literal primitive, a literal struct constructor, or a literal function expression.
	 * @returns {boolean}
	 */
	isLiteral() {
		return false;
	}

	/**
	 * Returns 'true' if 'this' is a Word token.
	 * @param {?(string | string[])} value
	 * @returns {boolean}
	 */
	isWord(value = null) {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isKeyword() {
		return false;
	}

	/**
	 * Returns 'true' if 'this' is a Symbol token (eg. '+', '(' etc.)
	 * @param {?(string | string[])} value
	 * @returns {boolean}
	 */
	isSymbol(value = null) {
		return false;
	}

	/**
	 * Returns 'true' if 'this' is a group (eg. '(...)').
	 * @param {?string} value
	 * @param {number | null} nFields
	 * @returns {boolean}
	 */
	isGroup(value, nFields = null) {
		return false;
	}

	/**
	 * Returns a SyntaxError at the current Site.
	 * @param {string} msg 
	 * @returns {UserError}
	 */
	syntaxError(msg) {
		return this.#site.syntaxError(msg);
	}

	/**
	 * Returns a TypeError at the current Site.
	 * @param {string} msg
	 * @returns {UserError}
	 */
	typeError(msg) {
		return this.#site.typeError(msg);
	}

	/**
	 * Returns a ReferenceError at the current Site.
	 * @param {string} msg
	 * @returns {UserError}
	 */
	referenceError(msg) {
		return this.#site.referenceError(msg);
	}

	/**
	 * Throws a SyntaxError if 'this' isn't a Word.
	 * @param {?(string | string[])} value 
	 * @returns {Word | null}
	 */
	assertWord(value = null) {
		if (value !== null) {
			this.syntaxError(`expected \'${value}\', got \'${this.toString()}\'`);
		} else {
			this.syntaxError(`expected word, got ${this.toString()}`);
		}

		return null;
	}

	/**
	 * Throws a SyntaxError if 'this' isn't a Symbol.
	 * @param {?(string | string[])} value 
	 * @returns {SymbolToken | null}
	 */
	assertSymbol(value = null) {
		if (value !== null) {
			this.syntaxError(`expected '${value}', got '${this.toString()}'`);
		} else {
			this.syntaxError(`expected symbol, got '${this.toString()}'`);
		}

		return null;
	}

	/**
	 * Throws a SyntaxError if 'this' isn't a Group.
	 * @param {?string} type 
	 * @param {?number} nFields
	 * @returns {Group | null}
	 */
	assertGroup(type = null, nFields = null) {
		if (type !== null) {
			this.syntaxError(`invalid syntax: expected '${type}...${Group.matchSymbol(type)}'`);
		} else {
			this.syntaxError(`invalid syntax: expected group`);
		}

		return null;
	}
}

/**
 * @package
 * @param {undefined | null | Token} t
 * @param {Site} site
 * @param {string} msg
 * @returns {null | Token}
 */
function assertToken(t, site, msg = "expected token") {
	if (!t) {
		site.syntaxError(msg);
		return null;
	} else {
		return t;
	}
}

/**
 * A Word token represents a token that matches /[A-Za-z_][A-Za-z_0-9]/
 * @package
 */
class Word extends Token {
	#value;

	/**
	 * @param {Site} site 
	 * @param {string} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	/**
	 * @param {string} value 
	 * @returns {Word}
	 */
	static new(value) {
		return new Word(Site.dummy(), value);
	}

	get value() {
		return this.#value;
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {boolean}
	 */
	isWord(value = null) {
		if (value !== null) {
			if (value instanceof Array) {
				return value.lastIndexOf(this.#value) != -1;
			} else {
				return value == this.#value;
			}
		} else {
			return true;
		}
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {Word}
	 */
	assertWord(value = null) {
		if (!this.isWord(value)) {
			super.assertWord(value);
		}

		return this;
	}

	/**
	 * @returns {Word}
	 */
	assertNotInternal() {
		if (this.#value == "_") {
			throw this.syntaxError("_ is reserved");
		} else if (this.#value.startsWith("__")) {
			throw this.syntaxError("__ prefix is reserved");
		} else if (this.#value.endsWith("__")) {
			throw this.syntaxError("__ suffix is reserved");
		}

		return this;
	}

	/**
	 * @returns {boolean}
	 */
	isKeyword() {
		switch (this.#value) {
			case "const":
			case "func":
			case "struct":
			case "enum":
			case "import":
			case "if":
			case "else":
			case "switch":
			case "self":
				return true;
			default:
				return false;
		}
	}

	/**
	 * @returns {Word | null}
	 */
	assertNotKeyword() {
		this.assertNotInternal();

		if (this.isKeyword()) {
			this.syntaxError(`'${this.#value}' is a reserved word`);
			return null;
		}

		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value;
	}

	/**
	 * Finds the index of the first Word(value) in a list of tokens
	 * Returns -1 if none found
	 * @param {Token[]} ts 
	 * @param {string | string[]} value 
	 * @returns {number}
	 */
	static find(ts, value) {
		return ts.findIndex(item => item.isWord(value));
	}
}

/**
 * Symbol token represent anything non alphanumeric
 * @package
 */
class SymbolToken extends Token {
	#value;

	/**
	 * @param {Site} site
	 * @param {string} value
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {boolean}
	 */
	isSymbol(value = null) {
		if (value !== null) {
			if (value instanceof Array) {
				return value.lastIndexOf(this.#value) != -1;
			} else {
				return value == this.#value;
			}
		} else {
			return true;
		}
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {SymbolToken}
	 */
	assertSymbol(value) {
		if (!this.isSymbol(value)) {
			super.assertSymbol(value);
		}

		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value;
	}

	/**
	 * Finds the index of the first Symbol(value) in a list of tokens.
	 * Returns -1 if none found.
	 * @param {Token[]} ts
	 * @param {string | string[]} value
	 * @returns {number}
	 */
	static find(ts, value) {
		return ts.findIndex(item => item.isSymbol(value));
	}

	/**
	 * Finds the index of the last Symbol(value) in a list of tokens.
	 * Returns -1 if none found.
	 * @param {Token[]} ts 
	 * @param {string | string[]} value 
	 * @returns {number}
	 */
	static findLast(ts, value) {
		for (let i = ts.length - 1; i >= 0; i--) {
			if (ts[i].isSymbol(value)) {
				return i;
			}
		}

		return -1;
	}
}

/**
 * Group token can '(...)', '[...]' or '{...}' and can contain comma separated fields.
 * @package
 */
class Group extends Token {
	#type;
	#fields;
	#firstComma;

	/**
	 * @param {Site} site 
	 * @param {string} type - "(", "[" or "{"
	 * @param {Token[][]} fields 
	 * @param {?SymbolToken} firstComma
	 */
	constructor(site, type, fields, firstComma = null) {
		super(site);
		this.#type = type;
		this.#fields = fields; // list of lists of tokens
		this.#firstComma = firstComma;

		assert(fields.length < 2 || firstComma !== null);
	}

	get fields() {
		return this.#fields.slice(); // copy, so fields_ doesn't get mutated
	}

	/**
	 * @param {?string} type 
	 * @param {number | null} nFields
	 * @returns {boolean}
	 */
	isGroup(type = null, nFields = null) {
		const nFieldsOk = (nFields === null) || (nFields == this.#fields.length);

		if (type !== null) {
			return this.#type == type && nFieldsOk;
		} else {
			return nFieldsOk;
		}
	}

	/**
	 * @param {?string} type 
	 * @param {?number} nFields 
	 * @returns {Group | null}
	 */
	assertGroup(type = null, nFields = null) {
		if (type !== null && this.#type != type) {
			this.syntaxError(`invalid syntax: expected '${type}...${Group.matchSymbol(type)}', got '${this.#type}...${Group.matchSymbol(this.#type)}'`);

			return null;
		} else if (type !== null && nFields !== null && nFields != this.#fields.length) {
			if (this.#fields.length > 1 && nFields <= 1 && this.#firstComma !== null) {
				this.#firstComma.syntaxError(`invalid syntax, unexpected ','`);
			} else {
				this.syntaxError(`invalid syntax: expected '${type}...${Group.matchSymbol(type)}' with ${nFields} field(s), got '${type}...${Group.matchSymbol(type)}' with ${this.#fields.length} fields`);
			}

			return null;
		} else {
			return this;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let s = this.#type;

		let parts = [];
		for (let f of this.#fields) {
			parts.push(f.map(t => t.toString()).join(" "));
		}

		s += parts.join(", ") + Group.matchSymbol(this.#type);

		return s;
	}

	/**
	 * @param {Token} t 
	 * @returns {boolean}
	 */
	static isOpenSymbol(t) {
		return t.isSymbol("{") || t.isSymbol("[") || t.isSymbol("(");
	}

	/**
	 * @param {Token} t 
	 * @returns {boolean}
	 */
	static isCloseSymbol(t) {
		return t.isSymbol("}") || t.isSymbol("]") || t.isSymbol(")");
	}

	/**
	 * Returns the corresponding closing bracket, parenthesis or brace.
	 * Throws an error if not a group symbol.
	 * @example
	 * Group.matchSymbol("(") => ")"
	 * @param {string | SymbolToken} t
	 * @returns {string}
	 */
	static matchSymbol(t) {
		if (t instanceof SymbolToken) {
			t = t.value;
		}

		if (t == "{") {
			return "}";
		} else if (t == "[") {
			return "]";
		} else if (t == "(") {
			return ")";
		} else if (t == "}") {
			return "{";
		} else if (t == "]") {
			return "[";
		} else if (t == ")") {
			return "(";
		} else {
			throw new Error("not a group symbol");
		}
	}

	/**
	 * Finds the index of first Group(type) in list of tokens
	 * Returns -1 if none found.
	 * @param {Token[]} ts 
	 * @param {string} type 
	 * @returns {number}
	 */
	static find(ts, type) {
		return ts.findIndex(item => item.isGroup(type));
	}
}

/**
 * Base class of literal tokens
 * @package
 */
class PrimitiveLiteral extends Token {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}
}

/**
 * Signed int literal token
 * @package
 */
class IntLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {bigint} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}
}

/**
 * Fixed point number literal token
 * @package
 */
class RealLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {bigint} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}
}

/**
 * Bool literal token
 * @package
 */
class BoolLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {boolean} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value ? "true" : "false";
	}
}

/**
 * ByteArray literal token
 * @package
 */
class ByteArrayLiteral extends PrimitiveLiteral {
	#bytes;

	/**
	 * @param {Site} site 
	 * @param {number[]} bytes 
	 */
	constructor(site, bytes) {
		super(site);
		this.#bytes = bytes;
	}

	get bytes() {
		return this.#bytes;
	}

	toString() {
		return `#${bytesToHex(this.#bytes)}`;
	}
}

/**
 * String literal token (utf8)
 * @package
 */
class StringLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {string} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	toString() {
		return `"${this.#value.toString()}"`;
	}
}

/**
 * @package
 * @typedef {[number, Site][]} CodeMap
 */

/**
 * @package
 * @typedef {Map<string, IR>} IRDefinitions
 */

/**
 * The IR class combines a string of intermediate representation sourcecode with an optional site.
 * The site is used for mapping IR code to the original source code.
 * @package
 */
 class IR {
	#content;
	#site;

	/**
	 * @param {string | IR[]} content 
	 * @param {null | Site} site 
	 */
	constructor(content, site = null) {
		assert(!(Array.isArray(content) && content.some(item => item == undefined)), "some items undefined");
		this.#content = content;
		this.#site = site;
	}

    /**
     * @package
     * @type {string | IR[]}
     */
	get content() {
		return this.#content;
	}

    /**
     * @package
     * @type {?Site}
     */
	get site() {
		return this.#site;
	}

	/**
	 * @returns {any}
	 */
	dump() {
		if (typeof this.#content == "string") {
			return this.#content;
		} else {
			return this.#content.map(c => c.dump());
		}
	}

	/**
	 * Returns a list containing IR instances that themselves only contain strings
     * @package
	 * @returns {IR[]}
	 */
	flatten() {
		if (typeof this.#content == "string") {
			return [this];
		} else {
			/**
			 * @type {IR[]}
			 */
			let result = [];

			for (let item of this.#content) {
				result = result.concat(item.flatten());
			}

			return result;
		}
	}

	/**
	 * Intersperse nested IR content with a separator
     * @package
	 * @param {string} sep
	 * @returns {IR}
	 */
	join(sep) {
		if (typeof this.#content == "string") {
			return this;
		} else {
			/** @type {IR[]} */
			const result = [];

			for (let i = 0; i < this.#content.length; i++) {
				result.push(this.#content[i]);

				if (i < this.#content.length - 1) {
					result.push(new IR(sep))
				}
			}

			return new IR(result);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.flatten().map(p => typeof p.content == "string" ? p.content : "").join("");
	}

    /**
     * @package
	 * @returns {[string, CodeMap]}
	 */
	generateSource() {
		const parts = this.flatten();

		/** @type {string[]} */
		const partSrcs = [];

		/** @type {CodeMap} */
		const codeMap = [];

		let pos = 0;
		for (let part of parts) {
			const rawPartSrc = part.content;

			if (typeof rawPartSrc == "string") {
				const origSite = part.site;
				if (origSite !== null) {
					/** @type {[number, Site]} */
					const pair = [pos, origSite];

					codeMap.push(pair);
				}

				const partSrc = replaceTabs(rawPartSrc);

				pos += partSrc.length;
				partSrcs.push(partSrc);
			} else {
				throw new Error("expected IR to contain only strings after flatten");
			}
		}

		return [partSrcs.join(""), codeMap];
	}

	/**
	 * @returns {string}
	 */
	pretty() {
		const [src, _] = this.generateSource();

		return (new Source(src)).pretty();
	}

	/**
	 * @param {string} str 
	 * @returns {boolean}
	 */
	includes(str) {
		if (typeof this.#content == "string") {
			return this.#content.includes(str);
		} else {
			return this.#content.some(ir => ir.includes(str));
		}
	}

	/**
	 * @param {RegExp} re 
	 * @param {string} newStr
	 * @returns {IR}
	 */
	replace(re, newStr) {
		if (typeof this.#content == "string") {
			return new IR(this.#content.replace(re, newStr), this.#site);
		} else {
			return new IR(this.#content.map(ir => ir.replace(re, newStr), this.#site));
		}
	}

	/**
	 * 
	 * @param {RegExp} re 
	 * @param {(match: string) => void} callback 
	 */
	search(re, callback) {
		if (typeof this.#content == "string") {
			const ms = this.#content.match(re);

			if (ms) {
				for (let m of ms) {
					callback(m);
				}
			}
		} else {
			this.#content.forEach(ir => ir.search(re, callback));
		}
	}

	/**
	 * Wraps 'inner' IR source with some definitions (used for top-level statements and for builtins)
     * @package
	 * @param {IR} inner 
	 * @param {IRDefinitions} definitions - name -> definition
	 * @returns {IR}
	 */
	static wrapWithDefinitions(inner, definitions) {
		const keys = Array.from(definitions.keys()).reverse();

		let res = inner;
		for (let key of keys) {
			const definition = definitions.get(key);

			if (definition === undefined) {
				throw new Error("unexpected");
			} else {

				res = new IR([new IR("("), new IR(key), new IR(") -> {\n"),
					res, new IR(`\n}(\n${TAB}/*${key}*/\n${TAB}`), definition,
				new IR("\n)")]);
			}
		}

		return res;
	}
}

/**
 * @package
 */
const RE_IR_PARAMETRIC_NAME = /[a-zA-Z_][a-zA-Z_0-9]*[[][a-zA-Z_0-9@[\]]*/g;


/**
 * Type type parameter prefix
 * @package
 */
const TTPP = "__T";

/**
 * Func type parameter prefix
 * @package
 */
const FTPP = "__F";

const RE_TEMPLATE_NAME = new RegExp(`\\b(${TTPP}|${FTPP})[0-9]*\\b`);

/**
 * @package
 */
class IRParametricName {
	/**
	 * Base type name
	 * @type {string}
	 */
	#base;

	/**
	 * Type type parameters
	 * Note: nested type names can stay strings
	 * Note: can be empty
	 * @type {string[]}
	 */
	#ttp;

	/**
	 * Function name
	 * @type {string}
	 */
	#fn;

	/**
	 * Function type parameters
	 * Note: can be empty
	 * @type {string[]}
	 */
	#ftp;

	/**
	 * @param {string} base 
	 * @param {string[]} ttp 
	 * @param {string} fn 
	 * @param {string[]} ftp 
	 */
	constructor(base, ttp, fn = "", ftp = []) {
		this.#base = base;
		this.#ttp = ttp;
		this.#fn = fn;
		this.#ftp = ftp;
	}

	/**
	 * @param {string} base 
	 * @param {number} nTtps 
	 * @param {string} fn 
	 * @param {number} nFtps 
	 * @returns 
	 */
	static newTemplate(base, nTtps, fn = "", nFtps = 0) {
		return new IRParametricName(
			base, 
			(new Array(nTtps)).map((_, i) => `${TTPP}${i}`),
			fn,
			(new Array(nFtps)).map((_, i) => `${FTPP}${i}`)
		);
	}

	/**
	 * @type {string}
	 */
	get base() {
		return this.#base;
	}

	/**
	 * @param {string[]} ttp 
	 * @param {string[]} ftp 
	 * @returns {IRParametricName}
	 */
	toImplementation(ttp, ftp = []) {
		assert(ttp.length == this.#ttp.length, `expected ${this.#ttp.length} type parameters, got ${ttp.length} (in ${this.toString()})`);
		assert(ftp.length == this.#ftp.length, `expected ${this.#ftp.length} function type parameters, got ${ftp.length} (in ${this.toString()})`);

		return new IRParametricName(this.#base, ttp, this.#fn, ftp);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#base}${this.#ttp.length > 0 ? `[${this.#ttp.join("@")}]` : ""}${this.#fn}${this.#ftp.length > 0 ? `[${this.#ftp.join("@")}]` : ""}`;
	}

	/**
	 * @return {string}
	 */
	toTemplate() {
		return `${this.#base}${this.#ttp.length > 0 ? `[${this.#ttp.map((_, i) => `${TTPP}${i}`).join("@")}]` : ""}${this.#fn}${this.#ftp.length > 0 ? `[${this.#ftp.map((_, i) => `${FTPP}${i}`).join("@")}]` : ""}`;
	}

	/**
	 * @param {IR} ir
	 * @returns {IR}
	 */
	replaceTemplateNames(ir) {
		this.#ttp.forEach((name, i) => {
			ir = ir.replace(new RegExp(`\\b${TTPP}${i}`, "gm"), name);
		})

		this.#ftp.forEach((name, i) => {
			ir = ir.replace(new RegExp(`\\b${FTPP}${i}`, "gm"), name);
		})

		return ir;
	}

	/**
	 * @example
 	 * IRParametricName.matches("__helios__map[__T0@__T1]__fold[__F2@__F3]") => true
	 * @example
	 * IRParametricName.matches("__helios__int") => false
	 * @example
	 * IRParametricName.matches("__helios__option[__T0]__none__new") => true
	 * @param {string} str 
	 * @returns {boolean}
	 */
	static matches(str) {
		return str.match(RE_IR_PARAMETRIC_NAME) ? true : false;
	}

	/**
	 * @param {string} name 
	 * @returns {boolean}
	 */
	static isTemplate(name) {
		return name.match(RE_TEMPLATE_NAME) ? true : false;
	}

	/**
	 * @example
	 * IRParametricName.parse("__helios__map[__T0@__T1]__fold[__F0@__F1]").toString() => "__helios__map[__T0@__T1]__fold[__F0@__F1]"
	 * @example
	 * IRParametricName.parse("__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__int]]__fold[__F0@__F1]").toString() => "__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__int]]__fold[__F0@__F1]"
	 * @example
	 * IRParametricName.parse("__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__list[__T0]]]__fold[__F0@__F1]").toString() => "__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__list[__T0]]]__fold[__F0@__F1]"
	 * @param {string} str 
	 * @param {boolean} preferType
	 * @returns {IRParametricName}
	 */
	static parse(str, preferType = false) {
		let pos = 0;

		/**
		 * @returns {string}
		 */
		const eatAlphaNum = () => {
			let c = str.charAt(pos);

			const chars = [];

			while ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_" || (c >= "0" && c <= "9")) {
				chars.push(c);

				pos++;

				c = str.charAt(pos);
			}
			
			return chars.join("");
		}

		/**
		 * @returns {string[]}
		 */
		const eatParams = () => {
			if (pos >= str.length) {
				return [];
			}
			
			let c = str.charAt(pos);

			assert(c == "[", `expected [, got ${c} (in ${str})`);

			const groups = [];
			let chars = [];

			let depth = 1;

			while (depth > 0) {
				pos++;

				c = str.charAt(pos);

				if (c == "[") {
					chars.push(c);
					depth++;
				} else if (c == "]") {
					if (depth > 1) {
						chars.push(c);
					} else {
						if (chars.length > 0) {
							groups.push(chars);	
						}
						chars = [];
					}
					depth--;
				} else if (c == "@") {
					if (depth > 1) {
						chars.push(c);
					} else {
						assert(chars.length > 0, "zero chars in group before @");
						groups.push(chars);
						chars = [];
					}
				} else if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_" || (c >= "0" && c <= "9")) {
					chars.push(c);
				} else {
					throw new Error(`unexpected char '${c}' in parametric name '${str}'`);
				}
			}

			// final closing bracket
			pos++;

			return groups.map(g => g.join(""));
		}

		/**
		 * 
		 * @param {string} base 
		 * @returns {[string, string]}
		 */
		const uneatFn = (base) => {
			let pos = base.length - 1;

			let c = base.charAt(pos);

			assert(c != "_", "unexpected underscore");

			let underscores = 0;

			while (pos > 0) {
				pos--;
				c = base.charAt(pos);

				if (underscores >= 2) {
					if (c != "_") {
						return [base.slice(0, pos+1), base.slice(pos+1)];
					} else {
						underscores++;
					}
				} else {
					if (c == "_") {
						underscores++;
					} else {
						underscores = 0;
					}
				}
			}

			throw new Error("bad name format");
		}

		let base = eatAlphaNum();

		let ttp = eatParams();
		let fn = "";
		let ftp = [];

		if (pos >= str.length) {
			if (!preferType) {
				[base, fn] = uneatFn(base);
				ftp = ttp;
				ttp = [];
			}
		} else {
			fn = eatAlphaNum();

			if (pos < str.length) {
				ftp = eatParams();
			}
		}

		return new IRParametricName(base, ttp, fn, ftp);
	}
}


////////////////////////////////////
// Section 4: Cryptography functions
////////////////////////////////////
/**
 * Size of default Blake2b digest
 * @package
 */
var BLAKE2B_DIGEST_SIZE = 32; // bytes

/**
 * Changes the value of BLAKE2B_DIGEST_SIZE 
 *  (because the nodejs crypto module only supports 
 *   blake2b-512 and not blake2b-256, and we want to avoid non-standard dependencies in the 
 *   test-suite)
 * @package
 * @param {number} s - 32 or 64
 */
function setBlake2bDigestSize(s) {
    BLAKE2B_DIGEST_SIZE = s;
}
 
/**
 * Make sure resulting number fits in uint32
 * @package
 * @param {number} x
 */
function imod32(x) {
	return x >>> 0;
}

/**
 * 32 bit number rotation
 * @package
 * @param {number} x - originally uint32
 * @param {number} n
 * @returns {number} - originally uint32
 */
function irotr(x, n) {
	return imod32((x >>> n) | (x << (32 - n)));
}

/**
 * Positive modulo operator
 * @package
 * @param {bigint} x 
 * @param {bigint} n 
 * @returns {bigint}
 */
function posMod(x, n) {
	const res = x % n;

	if (res < 0n) {
		return res + n;
	} else {
		return res;
	}
}

/**
 * UInt64 number (represented by 2 UInt32 numbers)
 * @package
 */
class UInt64 {
	#high;
	#low;

	/**
	 * @param {number} high  - uint32 number
	 * @param {number} low - uint32 number
	 */
	constructor(high, low) {		
		this.#high = imod32(high);
		this.#low = imod32(low);
	}

	/**
     * @package
	 * @returns {UInt64}
	 */
	static zero() {
		return new UInt64(0, 0);
	}

	/**
     * @package
	 * @param {number[]} bytes - 8 uint8 numbers
	 * @param {boolean} littleEndian
	 * @returns {UInt64}
	 */
	static fromBytes(bytes, littleEndian = true) {
		/** @type {number} */
		let low;

		/** @type {number} */
		let high;

		if (littleEndian) {
			low  = (bytes[0] << 0) | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
			high = (bytes[4] << 0) | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
		} else {
			high = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3] << 0);
			low  = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | (bytes[7] << 0);
		}

		return new UInt64(imod32(high), imod32(low));
	}

	/**
     * @package
	 * @param {string} str 
	 * @returns {UInt64}
	 */
	static fromString(str) {
		const high = parseInt(str.slice(0,  8), 16);
		const low  = parseInt(str.slice(8, 16), 16);

		return new UInt64(high, low);
	}

    /**
     * @package
     * @type {number}
     */
	get high() {
		return this.#high;
	}

    /**
     * @package
     * @type {number}
     */
	get low() {
		return this.#low;
	}

	/**
	 * Returns [low[0], low[1], low[2], low[3], high[0], high[1], high[2], high[3]] if littleEndian==true
     * @package
	 * @param {boolean} littleEndian
	 * @returns {number[]}
	 */
	toBytes(littleEndian = true) {
		const res = [
			(0x000000ff & this.#low),
			(0x0000ff00 & this.#low) >>> 8,
			(0x00ff0000 & this.#low) >>> 16,
			(0xff000000 & this.#low) >>> 24,
			(0x000000ff & this.#high),
			(0x0000ff00 & this.#high) >>> 8,
			(0x00ff0000 & this.#high) >>> 16,
			(0xff000000 & this.#high) >>> 24,
		];

		if (!littleEndian) {
			res.reverse(); 
		} 
		
		return res;
	}

	/**
     * @package
	 * @param {UInt64} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return (this.#high == other.#high) && (this.#low == other.#low);
	}

	/**
     * @package
	 * @returns {UInt64} 
	 */
	not() {
		return new UInt64(~this.#high, ~this.#low);
	}

	/**
     * @package
	 * @param {UInt64} other
	 * @returns {UInt64}
	 */
	and(other) {
		return new UInt64(this.#high & other.#high, this.#low & other.#low);
	}

	/**
     * @package
	 * @param {UInt64} other 
	 * @returns {UInt64}
	 */
	xor(other) {
		return new UInt64(this.#high ^ other.#high, this.#low ^ other.#low);
	}

	/**
     * @package
	 * @param {UInt64} other 
	 * @returns {UInt64}
	 */
	add(other) {
		const low = this.#low + other.#low;

		let high = this.#high + other.#high;

		if (low >= 0x100000000) {
			high += 1;
		}

		return new UInt64(high, low);
	}

	/**
     * @package
	 * @param {number} n 
	 * @returns {UInt64}
	 */
	rotr(n) {
		if (n == 32) {
			return new UInt64(this.#low, this.#high);
		} else if (n > 32) {
			return (new UInt64(this.#low, this.#high)).rotr(n - 32);
		} else {
			return new UInt64(
				imod32((this.#high >>> n) | (this.#low  << (32 - n))), 
				imod32((this.#low  >>> n) | (this.#high << (32 - n)))
			);
		}
	}

	/**
     * @package
	 * @param {number} n
	 * @returns {UInt64}
	 */
	shiftr(n) {
		if (n >= 32) {
			return new UInt64(0, this.#high >>> n - 32);
		} else {
			return new UInt64(this.#high >>> n, (this.#low >>> n) | (this.#high << (32 - n)));
		}
	}	
}

/**
 * A collection of cryptography primitives are included here in order to avoid external dependencies
 *     mulberry32: random number generator
 *     base32 encoding and decoding
 *     bech32 encoding, checking, and decoding
 *     sha2_256, sha2_512, sha3 and blake2b hashing
 *     ed25519 pubkey generation, signing, and signature verification (NOTE: the current implementation is simple but slow)
 */
export class Crypto {
	/**
	 * Returns a simple random number generator
     * @package
	 * @param {number} seed
	 * @returns {NumberGenerator} - a random number generator
	 */
	static mulberry32(seed) {
		/**
		 * @type {NumberGenerator}
		 */
		return function() {
			let t = seed += 0x6D2B79F5;
			t = Math.imul(t ^ t >>> 15, t | 1);
			t ^= t + Math.imul(t ^ t >>> 7, t | 61);
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		}
	}

	/**
	 * Alias for rand generator of choice
     * @package
	 * @param {number} seed
	 * @returns {NumberGenerator} - the random number generator function
	 */
	static rand(seed) {
		return this.mulberry32(seed);
	}

	/**
	 * Rfc 4648 base32 alphabet
	 * @type {string}
	 */
	static get DEFAULT_BASE32_ALPHABET() {
		return "abcdefghijklmnopqrstuvwxyz234567";
	}

	/**
	 * Bech32 base32 alphabet
	 * @type {string}
	 */
	static get BECH32_BASE32_ALPHABET() {
		return "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
	}
	
	/**
	 * Encode bytes in special base32.
	 * @example
	 * Crypto.encodeBase32(textToBytes("f")) => "my"
	 * @example
	 * Crypto.encodeBase32(textToBytes("fo")) => "mzxq"
	 * @example
	 * Crypto.encodeBase32(textToBytes("foo")) => "mzxw6"
	 * @example
	 * Crypto.encodeBase32(textToBytes("foob")) => "mzxw6yq"
	 * @example
	 * Crypto.encodeBase32(textToBytes("fooba")) => "mzxw6ytb"
	 * @example
	 * Crypto.encodeBase32(textToBytes("foobar")) => "mzxw6ytboi"
     * @package
	 * @param {number[]} bytes - uint8 numbers
	 * @param {string} alphabet - list of chars
	 * @return {string}
	 */
	static encodeBase32(bytes, alphabet = Crypto.DEFAULT_BASE32_ALPHABET) {
		return Crypto.encodeBase32Bytes(bytes).map(c => alphabet[c]).join("");
	}

	/**
	 * Internal method
     * @package
	 * @param {number[]} bytes 
	 * @returns {number[]} - list of numbers between 0 and 32
	 */
	static encodeBase32Bytes(bytes)  {
		const result = [];

		const reader = new BitReader(bytes, false);

		while (!reader.eof()) {
			result.push(reader.readBits(5));
		}

		return result;
	}

	/**
	 * Decode base32 string into bytes.
	 * @example
	 * bytesToText(Crypto.decodeBase32("my")) => "f"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxq")) => "fo"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6")) => "foo"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6yq")) => "foob"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6ytb")) => "fooba"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6ytboi")) => "foobar"
     * @package
	 * @param {string} encoded
	 * @param {string} alphabet
	 * @return {number[]}
	 */
	static decodeBase32(encoded, alphabet = Crypto.DEFAULT_BASE32_ALPHABET) {
		const writer = new BitWriter();

		const n = encoded.length;

		for (let i = 0; i < n; i++) {
			const c = encoded[i];
			const code = alphabet.indexOf(c.toLowerCase());

			if (i == n - 1) {
				// last, make sure we align to byte

				const nCut = n*5 - 8*Math.floor(n*5/8);

				const bits = padZeroes(code.toString(2), 5)

				writer.write(bits.slice(0, 5 - nCut));
			} else {
				const bits = padZeroes(code.toString(2), 5);

				writer.write(bits);
			}
		}

		const result = writer.finalize(false);

		return result;
	}

	/**
	 * Expand human readable prefix of the bech32 encoding so it can be used in the checkSum
	 * Internal method.
     * @package
	 * @param {string} hrp
	 * @returns {number[]}
	 */
	static expandBech32HumanReadablePart(hrp) {
		const bytes = [];
		for (let c of hrp) {
			bytes.push(c.charCodeAt(0) >> 5);
		}

		bytes.push(0);

		for (let c of hrp) {
			bytes.push(c.charCodeAt(0) & 31);
		}

		return bytes;
	}

	/**
	 * Used as part of the bech32 checksum.
	 * Internal method.
     * @package
	 * @param {number[]} bytes 
	 * @returns {number}
	 */
	static calcBech32Polymod(bytes) {
		const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

		let chk = 1;
		for (let b of bytes) {
			const c = (chk >> 25);
			chk = (chk & 0x1fffffff) << 5 ^ b;

			for (let i = 0; i < 5; i++) {
				if (((c >> i) & 1) != 0) {
					chk ^= GEN[i];
				}
			}
		}

		return chk;
	}

	/**
	 * Generate the bech32 checksum
	 * Internal method
     * @package
	 * @param {string} hrp 
	 * @param {number[]} data - numbers between 0 and 32
	 * @returns {number[]} - 6 numbers between 0 and 32
	 */
	static calcBech32Checksum(hrp, data) {
		const bytes = Crypto.expandBech32HumanReadablePart(hrp).concat(data);

		const chk = Crypto.calcBech32Polymod(bytes.concat([0,0,0,0,0,0])) ^ 1;

		const chkSum = [];
		for (let i = 0; i < 6; i++) {
			chkSum.push((chk >> 5 * (5 - i)) & 31);
		}

		return chkSum;
	}

	/**
	 * Creates a bech32 checksummed string (used to represent Cardano addresses)
	 * @example
	 * Crypto.encodeBech32("foo", textToBytes("foobar")) => "foo1vehk7cnpwgry9h96"
	 * @example
	 * Crypto.encodeBech32("addr_test", hexToBytes("70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539")) => "addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld"
     * @package
	 * @param {string} hrp 
	 * @param {number[]} data - uint8 0 - 256
	 * @returns {string}
	 */
	static encodeBech32(hrp, data) {
		assert(hrp.length > 0, "human-readable-part must have non-zero length");

		data = Crypto.encodeBase32Bytes(data);

		const chkSum = Crypto.calcBech32Checksum(hrp, data);

		return hrp + "1" + data.concat(chkSum).map(i => Crypto.BECH32_BASE32_ALPHABET[i]).join("");
	}

	/**
	 * Decomposes a bech32 checksummed string (i.e. Cardano address), and returns the human readable part and the original bytes
	 * Throws an error if checksum is invalid.
	 * @example
	 * bytesToHex(Crypto.decodeBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld")[1]) => "70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539"
     * @package
	 * @param {string} addr 
	 * @returns {[string, number[]]}
	 */
	static decodeBech32(addr) {
		assert(Crypto.verifyBech32(addr), "invalid bech32 addr");

		const i = addr.indexOf("1");

		assert(i != -1);

		const hrp = addr.slice(0, i);

		addr = addr.slice(i+1);

		const data = Crypto.decodeBase32(addr.slice(0, addr.length - 6), Crypto.BECH32_BASE32_ALPHABET);

		return [hrp, data];
	}

	/**
	 * Verify a bech32 checksum
	 * @example
	 * Crypto.verifyBech32("foo1vehk7cnpwgry9h96") => true
	 * @example
	 * Crypto.verifyBech32("foo1vehk7cnpwgry9h97") => false
	 * @example
	 * Crypto.verifyBech32("a12uel5l") => true
	 * @example
	 * Crypto.verifyBech32("mm1crxm3i") => false
	 * @example
	 * Crypto.verifyBech32("A1G7SGD8") => false
	 * @example
	 * Crypto.verifyBech32("abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw") => true
	 * @example
	 * Crypto.verifyBech32("?1ezyfcl") => true
	 * @example
	 * Crypto.verifyBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld") => true
     * @package
	 * @param {string} addr
	 * @returns {boolean}
	 */
	static verifyBech32(addr) {
		const data =[];

		const i = addr.indexOf("1");
        
		if (i == -1 || i == 0) {
			return false;
		}

		const hrp = addr.slice(0, i);

		addr = addr.slice(i + 1);

		for (let c of addr) {
			const j = Crypto.BECH32_BASE32_ALPHABET.indexOf(c);
			if (j == -1) {
				return false;
			}

			data.push(j);
		}

		const chkSumA = data.slice(data.length - 6);

		const chkSumB = Crypto.calcBech32Checksum(hrp, data.slice(0, data.length - 6));

		for (let j = 0; j < 6; j++) {
			if (chkSumA[j] != chkSumB[j]) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Calculates sha2-256 (32bytes) hash of a list of uint8 numbers.
	 * Result is also a list of uint8 number.
	 * @example 
	 * bytesToHex(Crypto.sha2_256([0x61, 0x62, 0x63])) => "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
	 * @example
	 * Crypto.sha2_256(textToBytes("Hello, World!")) => [223, 253, 96, 33, 187, 43, 213, 176, 175, 103, 98, 144, 128, 158, 195, 165, 49, 145, 221, 129, 199, 247, 10, 75, 40, 104, 138, 54, 33, 130, 152, 111]
     * @package
	 * @param {number[]} bytes - list of uint8 numbers
	 * @returns {number[]} - list of uint8 numbers
	 */
	static sha2_256(bytes) {
		/**
		 * Pad a bytearray so its size is a multiple of 64 (512 bits).
		 * Internal method.
		 * @param {number[]} src - list of uint8 numbers
		 * @returns {number[]}
		 */
		function pad(src) {
			const nBits = src.length*8;

			let dst = src.slice();

			dst.push(0x80);

			if ((dst.length + 8)%64 != 0) {
				let nZeroes = (64 - dst.length%64) - 8;
				if (nZeroes < 0) {
					nZeroes += 64;
				}

				for (let i = 0; i < nZeroes; i++) {
					dst.push(0);
				}
			}

			assert((dst.length + 8)%64 == 0, "bad padding");

			const lengthPadding = bigIntToBytes(BigInt(nBits));

			assert(lengthPadding.length <= 8, "input data too big");

			while (lengthPadding.length < 8) {
				lengthPadding.unshift(0)
			}

			dst = dst.concat(lengthPadding);
			
			return dst;
		}

		/**
		 * @type {number[]} - 64 uint32 numbers
		 */
		const k = [
			0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
			0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
			0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
			0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
			0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
			0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
			0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
			0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
			0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
			0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
			0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
			0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
			0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
			0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
			0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
			0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
		];

		/**
		 * Initial hash (updated during compression phase)
		 * @type {number[]} - 8 uint32 number
		 */
		const hash = [
			0x6a09e667, 
			0xbb67ae85, 
			0x3c6ef372, 
			0xa54ff53a, 
			0x510e527f, 
			0x9b05688c, 
			0x1f83d9ab, 
			0x5be0cd19,
		];
	
		/**
		 * @param {number} x
		 * @returns {number}
		 */
		function sigma0(x) {
			return irotr(x, 7) ^ irotr(x, 18) ^ (x >>> 3);
		}

		/**
		 * @param {number} x
		 * @returns {number}
		 */
		function sigma1(x) {
			return irotr(x, 17) ^ irotr(x, 19) ^ (x >>> 10);
		}

		bytes = pad(bytes);

		// break message in successive 64 byte chunks
		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
			const chunk = bytes.slice(chunkStart, chunkStart + 64);

			const w = (new Array(64)).fill(0); // array of 32 bit numbers!

			// copy chunk into first 16 positions of w
			for (let i = 0; i < 16; i++) {
				w[i] = (chunk[i*4 + 0] << 24) |
					   (chunk[i*4 + 1] << 16) |
					   (chunk[i*4 + 2] <<  8) |
					   (chunk[i*4 + 3]);
			}

			// extends the first 16 positions into the remaining 48 positions
			for (let i = 16; i < 64; i++) {
				w[i] = imod32(w[i-16] + sigma0(w[i-15]) + w[i-7] + sigma1(w[i-2]));
			}

			// intialize working variables to current hash value
			let a = hash[0];
			let b = hash[1];
			let c = hash[2];
			let d = hash[3];
			let e = hash[4];
			let f = hash[5];
			let g = hash[6];
			let h = hash[7];

			// compression function main loop
			for (let i = 0; i < 64; i++) {
				const S1 = irotr(e, 6) ^ irotr(e, 11) ^ irotr(e, 25);
				const ch = (e & f) ^ ((~e) & g);
				const temp1 = imod32(h + S1 + ch + k[i] + w[i]);
				const S0 = irotr(a, 2) ^ irotr(a, 13) ^ irotr(a, 22);
				const maj = (a & b) ^ (a & c) ^ (b & c);
				const temp2 = imod32(S0 + maj);

				h = g;
				g = f;
				f = e;
				e = imod32(d + temp1);
				d = c;
				c = b;
				b = a;
				a = imod32(temp1 + temp2);
			}

			// update the hash
			hash[0] = imod32(hash[0] + a);
			hash[1] = imod32(hash[1] + b);
			hash[2] = imod32(hash[2] + c);
			hash[3] = imod32(hash[3] + d);
			hash[4] = imod32(hash[4] + e);
			hash[5] = imod32(hash[5] + f);
			hash[6] = imod32(hash[6] + g);
			hash[7] = imod32(hash[7] + h);
		}

		// produce the final digest of uint8 numbers
		const result = [];
		for (let i = 0; i < 8; i++) {
			const item = hash[i];

			result.push(imod8(item >> 24));
			result.push(imod8(item >> 16));
			result.push(imod8(item >>  8));
			result.push(imod8(item >>  0));
		}
	
		return result;
	}

	/**
	 * Calculates sha2-512 (64bytes) hash of a list of uint8 numbers.
	 * Result is also a list of uint8 number.
	 * @example 
	 * bytesToHex(Crypto.sha2_512([0x61, 0x62, 0x63])) => "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
	 * @example 
	 * bytesToHex(Crypto.sha2_512([])) => "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
	 * @example
	 * bytesToHex(Crypto.sha2_512(textToBytes("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))) => "204a8fc6dda82f0a0ced7beb8e08a41657c16ef468b228a8279be331a703c33596fd15c13b1b07f9aa1d3bea57789ca031ad85c7a71dd70354ec631238ca3445"
	 * @example
	 * bytesToHex(Crypto.sha2_512(textToBytes("abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstuu"))) => "23565d109ac0e2aa9fb162385178895058b28489a6bc31cb55491ed83956851ab1d4bbd46440586f5c9c4b69c9c280118cbc55c71495d258cc27cc6bb25ee720"
     * @package
	 * @param {number[]} bytes - list of uint8 numbers
	 * @returns {number[]} - list of uint8 numbers
	 */
	static sha2_512(bytes) {
		/**
		 * Pad a bytearray so its size is a multiple of 128 (1024 bits).
		 * Internal method.
		 * @param {number[]} src - list of uint8 numbers
		 * @returns {number[]}
		 */
		function pad(src) {
			const nBits = src.length*8;

			let dst = src.slice();

			dst.push(0x80);

			if ((dst.length + 16)%128 != 0) {
				let nZeroes = (128 - dst.length%128) - 16;
				if (nZeroes < 0) {
					nZeroes += 128;
				}

				for (let i = 0; i < nZeroes; i++) {
					dst.push(0);
				}
			}

			assert((dst.length + 16)%128 == 0, "bad padding");

			// assume nBits fits in 32 bits
			const lengthPadding = bigIntToBytes(BigInt(nBits));

			assert(lengthPadding.length <= 16, "input data too big");

			while (lengthPadding.length < 16) {
				lengthPadding.unshift(0);
			}

			dst = dst.concat(lengthPadding);

			assert(dst.length%128 == 0, "bad length padding");
			
			return dst;
		}

		/**
		 * @type {UInt64[]} - 80 uint64 numbers
		 */
		const k = [
			new UInt64(0x428a2f98, 0xd728ae22), new UInt64(0x71374491, 0x23ef65cd), 
			new UInt64(0xb5c0fbcf, 0xec4d3b2f), new UInt64(0xe9b5dba5, 0x8189dbbc),
			new UInt64(0x3956c25b, 0xf348b538), new UInt64(0x59f111f1, 0xb605d019), 
			new UInt64(0x923f82a4, 0xaf194f9b), new UInt64(0xab1c5ed5, 0xda6d8118),
			new UInt64(0xd807aa98, 0xa3030242), new UInt64(0x12835b01, 0x45706fbe), 
			new UInt64(0x243185be, 0x4ee4b28c), new UInt64(0x550c7dc3, 0xd5ffb4e2),
			new UInt64(0x72be5d74, 0xf27b896f), new UInt64(0x80deb1fe, 0x3b1696b1), 
			new UInt64(0x9bdc06a7, 0x25c71235), new UInt64(0xc19bf174, 0xcf692694),
			new UInt64(0xe49b69c1, 0x9ef14ad2), new UInt64(0xefbe4786, 0x384f25e3), 
			new UInt64(0x0fc19dc6, 0x8b8cd5b5), new UInt64(0x240ca1cc, 0x77ac9c65),
			new UInt64(0x2de92c6f, 0x592b0275), new UInt64(0x4a7484aa, 0x6ea6e483), 
			new UInt64(0x5cb0a9dc, 0xbd41fbd4), new UInt64(0x76f988da, 0x831153b5),
			new UInt64(0x983e5152, 0xee66dfab), new UInt64(0xa831c66d, 0x2db43210), 
			new UInt64(0xb00327c8, 0x98fb213f), new UInt64(0xbf597fc7, 0xbeef0ee4),
			new UInt64(0xc6e00bf3, 0x3da88fc2), new UInt64(0xd5a79147, 0x930aa725), 
			new UInt64(0x06ca6351, 0xe003826f), new UInt64(0x14292967, 0x0a0e6e70),
			new UInt64(0x27b70a85, 0x46d22ffc), new UInt64(0x2e1b2138, 0x5c26c926), 
			new UInt64(0x4d2c6dfc, 0x5ac42aed), new UInt64(0x53380d13, 0x9d95b3df),
			new UInt64(0x650a7354, 0x8baf63de), new UInt64(0x766a0abb, 0x3c77b2a8), 
			new UInt64(0x81c2c92e, 0x47edaee6), new UInt64(0x92722c85, 0x1482353b),
			new UInt64(0xa2bfe8a1, 0x4cf10364), new UInt64(0xa81a664b, 0xbc423001), 
			new UInt64(0xc24b8b70, 0xd0f89791), new UInt64(0xc76c51a3, 0x0654be30),
			new UInt64(0xd192e819, 0xd6ef5218), new UInt64(0xd6990624, 0x5565a910), 
			new UInt64(0xf40e3585, 0x5771202a), new UInt64(0x106aa070, 0x32bbd1b8),
			new UInt64(0x19a4c116, 0xb8d2d0c8), new UInt64(0x1e376c08, 0x5141ab53), 
			new UInt64(0x2748774c, 0xdf8eeb99), new UInt64(0x34b0bcb5, 0xe19b48a8),
			new UInt64(0x391c0cb3, 0xc5c95a63), new UInt64(0x4ed8aa4a, 0xe3418acb), 
			new UInt64(0x5b9cca4f, 0x7763e373), new UInt64(0x682e6ff3, 0xd6b2b8a3),
			new UInt64(0x748f82ee, 0x5defb2fc), new UInt64(0x78a5636f, 0x43172f60), 
			new UInt64(0x84c87814, 0xa1f0ab72), new UInt64(0x8cc70208, 0x1a6439ec),
			new UInt64(0x90befffa, 0x23631e28), new UInt64(0xa4506ceb, 0xde82bde9), 
			new UInt64(0xbef9a3f7, 0xb2c67915), new UInt64(0xc67178f2, 0xe372532b),
			new UInt64(0xca273ece, 0xea26619c), new UInt64(0xd186b8c7, 0x21c0c207), 
			new UInt64(0xeada7dd6, 0xcde0eb1e), new UInt64(0xf57d4f7f, 0xee6ed178),
			new UInt64(0x06f067aa, 0x72176fba), new UInt64(0x0a637dc5, 0xa2c898a6), 
			new UInt64(0x113f9804, 0xbef90dae), new UInt64(0x1b710b35, 0x131c471b),
			new UInt64(0x28db77f5, 0x23047d84), new UInt64(0x32caab7b, 0x40c72493), 
			new UInt64(0x3c9ebe0a, 0x15c9bebc), new UInt64(0x431d67c4, 0x9c100d4c),
			new UInt64(0x4cc5d4be, 0xcb3e42b6), new UInt64(0x597f299c, 0xfc657e2a), 
			new UInt64(0x5fcb6fab, 0x3ad6faec), new UInt64(0x6c44198c, 0x4a475817),
		];

		/**
		 * Initial hash (updated during compression phase)
		 * @type {UInt64[]} - 8 uint64 numbers
		 */
		const hash = [
			new UInt64(0x6a09e667, 0xf3bcc908),
			new UInt64(0xbb67ae85, 0x84caa73b),
			new UInt64(0x3c6ef372, 0xfe94f82b),
			new UInt64(0xa54ff53a, 0x5f1d36f1),
			new UInt64(0x510e527f, 0xade682d1),
			new UInt64(0x9b05688c, 0x2b3e6c1f),
			new UInt64(0x1f83d9ab, 0xfb41bd6b),
			new UInt64(0x5be0cd19, 0x137e2179),
		];
	
		/**
		 * @param {UInt64} x
		 * @returns {UInt64} 
		 */
		function sigma0(x) {
			return x.rotr(1).xor(x.rotr(8)).xor(x.shiftr(7));
		}

		/**
		 * @param {UInt64} x
		 * @returns {UInt64}
		 */
		function sigma1(x) {
			return x.rotr(19).xor(x.rotr(61)).xor(x.shiftr(6));
		}

		bytes = pad(bytes);

		// break message in successive 64 byte chunks
		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 128) {
			const chunk = bytes.slice(chunkStart, chunkStart + 128);

			const w = (new Array(80)).fill(UInt64.zero()); // array of 32 bit numbers!

			// copy chunk into first 16 hi/lo positions of w (i.e. into first 32 uint32 positions)
			for (let i = 0; i < 16; i++) {
				w[i] = UInt64.fromBytes(chunk.slice(i*8, i*8 + 8), false);
			}

			// extends the first 16 positions into the remaining 80 positions
			for (let i = 16; i < 80; i++) {
				w[i] = sigma1(w[i-2]).add(w[i-7]).add(sigma0(w[i-15])).add(w[i-16]);
			}

			// intialize working variables to current hash value
			let a = hash[0];
			let b = hash[1];
			let c = hash[2];
			let d = hash[3];
			let e = hash[4];
			let f = hash[5];
			let g = hash[6];
			let h = hash[7];

			// compression function main loop
			for (let i = 0; i < 80; i++) {
				const S1 = e.rotr(14).xor(e.rotr(18)).xor(e.rotr(41));
				const ch = e.and(f).xor(e.not().and(g));
				const temp1 = h.add(S1).add(ch).add(k[i]).add(w[i]);
				const S0 = a.rotr(28).xor(a.rotr(34)).xor(a.rotr(39));
				const maj = a.and(b).xor(a.and(c)).xor(b.and(c));
				const temp2 = S0.add(maj);

				h = g;
				g = f;
				f = e;
				e = d.add(temp1);
				d = c;
				c = b;
				b = a;
				a = temp1.add(temp2);
			}

			// update the hash
			hash[0] = hash[0].add(a);
			hash[1] = hash[1].add(b);
			hash[2] = hash[2].add(c);
			hash[3] = hash[3].add(d);
			hash[4] = hash[4].add(e);
			hash[5] = hash[5].add(f);
			hash[6] = hash[6].add(g);
			hash[7] = hash[7].add(h);
		}

		// produce the final digest of uint8 numbers
		let result = [];
		for (let i = 0; i < 8; i++) {
			const item = hash[i];

			result = result.concat(item.toBytes(false));
		}
	
		return result;
	}

	/**
	 * Calculates sha3-256 (32bytes) hash of a list of uint8 numbers.
	 * Result is also a list of uint8 number.
	 * Sha3 only bit-wise operations, so 64-bit operations can easily be replicated using 2 32-bit operations instead
	 * @example
	 * bytesToHex(Crypto.sha3(textToBytes("abc"))) => "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(136)).fill(1))) => "b36dc2167c4d9dda1a58b87046c8d76a6359afe3612c4de8a38857e09117b2db"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(135)).fill(2))) => "5bdf5d815d29a9d7161c66520efc17c2edd7898f2b99a029e8d2e4ff153407f4"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(134)).fill(3))) => "8e6575663dfb75a88f94a32c5b363c410278b65020734560d968aadd6896a621"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(137)).fill(4))) => "f10b39c3e455006aa42120b9751faa0f35c821211c9d086beb28bf3c4134c6c6"
     * @package
	 * @param {number[]} bytes - list of uint8 numbers
	 * @returns {number[]} - list of uint8 numbers
	 */
	static sha3(bytes) {
		/**
		 * @type {number} - state width (1600 bits, )
		 */
		const WIDTH = 200;

		/**
		 * @type {number} - rate (1088 bits, 136 bytes)
		 */
		const RATE = 136;

		/**
		 * @type {number} - capacity
		 */
		const CAP = WIDTH - RATE;

		/**
		 * Apply 1000...1 padding until size is multiple of r.
		 * If already multiple of r then add a whole block of padding.
		 * @param {number[]} src - list of uint8 numbers
		 * @returns {number[]} - list of uint8 numbers
		 */
		function pad(src) {
			const dst = src.slice();

			/** @type {number} */
			let nZeroes = RATE - 2 - (dst.length%RATE);
			if (nZeroes < -1) {
				nZeroes += RATE - 2;
			}

			if (nZeroes == -1) {
				dst.push(0x86);
			} else {
				dst.push(0x06);

				for (let i = 0; i < nZeroes; i++) {
					dst.push(0);
				}

				dst.push(0x80);
			}

			assert(dst.length%RATE == 0);
			
			return dst;
		}

		/**
		 * 24 numbers used in the sha3 permute function
		 * @type {number[]}
		 */
		const OFFSETS = [6, 12, 18, 24, 3, 9, 10, 16, 22, 1, 7, 13, 19, 20, 4, 5, 11, 17, 23, 2, 8, 14, 15, 21];

		/**
		 * 24 numbers used in the sha3 permute function
		 * @type {number[]}
		 */
		const SHIFTS = [-12, -11, 21, 14, 28, 20, 3, -13, -29, 1, 6, 25, 8, 18, 27, -4, 10, 15, -24, -30, -23, -7, -9, 2];

		/**
		 * Round constants used in the sha3 permute function
		 * @type {UInt64[]} 
		 */
		const RC = [
			new UInt64(0x00000000, 0x00000001) , 
			new UInt64(0x00000000, 0x00008082) , 
			new UInt64(0x80000000, 0x0000808a) ,
			new UInt64(0x80000000, 0x80008000) ,
			new UInt64(0x00000000, 0x0000808b) ,
			new UInt64(0x00000000, 0x80000001) ,
			new UInt64(0x80000000, 0x80008081) ,
			new UInt64(0x80000000, 0x00008009) ,
			new UInt64(0x00000000, 0x0000008a) ,
			new UInt64(0x00000000, 0x00000088) ,
			new UInt64(0x00000000, 0x80008009) ,
			new UInt64(0x00000000, 0x8000000a) ,
			new UInt64(0x00000000, 0x8000808b) ,
			new UInt64(0x80000000, 0x0000008b) ,
			new UInt64(0x80000000, 0x00008089) ,
			new UInt64(0x80000000, 0x00008003) ,
			new UInt64(0x80000000, 0x00008002) ,
			new UInt64(0x80000000, 0x00000080) ,
			new UInt64(0x00000000, 0x0000800a) ,
			new UInt64(0x80000000, 0x8000000a) ,
			new UInt64(0x80000000, 0x80008081) ,
			new UInt64(0x80000000, 0x00008080) ,
			new UInt64(0x00000000, 0x80000001) ,
			new UInt64(0x80000000, 0x80008008) ,
		];
		
		/**
		 * @param {UInt64[]} s 
		 */
		function permute(s) {	
			/**
			 * @type {UInt64[]}
			 */		
			const c = new Array(5);

			/**
			 * @type {UInt64[]}
			 */
			const b = new Array(25);
			
			for (let round = 0; round < 24; round++) {
				for (let i = 0; i < 5; i++) {
					c[i] = s[i].xor(s[i+5]).xor(s[i+10]).xor(s[i+15]).xor(s[i+20]);
				}

				for (let i = 0; i < 5; i++) {
					const i1 = (i+1)%5;
					const i2 = (i+4)%5;

					const tmp = c[i2].xor(c[i1].rotr(63));

					for (let j = 0; j < 5; j++) {
						s[i+5*j] = s[i+5*j].xor(tmp);
					}
				}				

				b[0] = s[0];

				for(let i = 1; i < 25; i++) {
					const offset = OFFSETS[i-1];

					const left = Math.abs(SHIFTS[i-1]);
					const right = 32 - left;

					if (SHIFTS[i-1] < 0) {
						b[i] = s[offset].rotr(right);
					} else {
						b[i] = s[offset].rotr(right + 32);
					}
				}

				for (let i = 0; i < 5; i++) {
					for (let j = 0; j < 5; j++) {
						s[i*5+j] = b[i*5+j].xor(b[i*5 + (j+1)%5].not().and(b[i*5 + (j+2)%5]))
					}
				}

				s[0] = s[0].xor(RC[round]);
			}
		}

		bytes = pad(bytes);

		// initialize the state
		/**
		 * @type {UInt64[]}
		 */
		const state = (new Array(WIDTH/8)).fill(UInt64.zero());

		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += RATE) {
			// extend the chunk to become length WIDTH
			const chunk = bytes.slice(chunkStart, chunkStart + RATE).concat((new Array(CAP)).fill(0));

			// element-wise xor with 'state'
			for (let i = 0; i < WIDTH; i += 8) {
				state[i/8] = state[i/8].xor(UInt64.fromBytes(chunk.slice(i, i+8)));

				// beware: a uint32 is stored as little endian, but a pair of uint32s that form a uin64 are stored in big endian format!
			}

			// apply block permutations
			permute(state);
		}

		/** @type {number[]} */
		let hash = [];
		for (let i = 0; i < 4; i++) {
			hash = hash.concat(state[i].toBytes());
		}

		return hash;
	}

	/**
	 * Calculates blake2b hash of a list of uint8 numbers (variable digest size).
	 * Result is also a list of uint8 number.
	 * Blake2b is a 64bit algorithm, so we need to be careful when replicating 64-bit operations with 2 32-bit numbers (low-word overflow must spill into high-word, and shifts must go over low/high boundary)
	 * @example                                        
	 * bytesToHex(Crypto.blake2b([0, 1])) => "01cf79da4945c370c68b265ef70641aaa65eaa8f5953e3900d97724c2c5aa095"
	 * @example
	 * bytesToHex(Crypto.blake2b(textToBytes("abc"), 64)) => "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
     * @package
	 * @param {number[]} bytes 
	 * @param {number} digestSize - at most 64
	 * @returns {number[]}
	 */
	static blake2b(bytes, digestSize = BLAKE2B_DIGEST_SIZE) {
		/**
		 * 128 bytes (16*8 byte words)
		 * @type {number}
		 */
		const WIDTH = 128;

		/**
		 * Initialization vector
		 */
		const IV = [
			new UInt64(0x6a09e667, 0xf3bcc908), 
			new UInt64(0xbb67ae85, 0x84caa73b),
			new UInt64(0x3c6ef372, 0xfe94f82b), 
			new UInt64(0xa54ff53a, 0x5f1d36f1),
			new UInt64(0x510e527f, 0xade682d1),
			new UInt64(0x9b05688c, 0x2b3e6c1f),
			new UInt64(0x1f83d9ab, 0xfb41bd6b), 
			new UInt64(0x5be0cd19, 0x137e2179), 
		];

		const SIGMA = [
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
			[14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
			[11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
			[7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
			[9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
			[2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
			[12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
			[13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
			[6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
			[10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
		];

		/**
		 * @param {number[]} src - list of uint8 bytes
		 * @returns {number[]} - list of uint8 bytes
		 */
		function pad(src) {
			const dst = src.slice();

			const nZeroes = dst.length == 0 ? WIDTH : (WIDTH - dst.length%WIDTH)%WIDTH;

			// just padding with zeroes, the actual message length is used during compression stage of final block in order to uniquely hash messages of different lengths
			for (let i = 0; i < nZeroes; i++) {
				dst.push(0);
			}
			
			return dst;
		}

		/**
		 * @param {UInt64[]} v
		 * @param {UInt64[]} chunk
		 * @param {number} a - index
		 * @param {number} b - index
		 * @param {number} c - index
		 * @param {number} d - index
		 * @param {number} i - index in chunk for low word 1
		 * @param {number} j - index in chunk for low word 2
		 */
		function mix(v, chunk, a, b, c, d, i, j) {
			const x = chunk[i];
			const y = chunk[j];

			v[a] = v[a].add(v[b]).add(x);
			v[d] = v[d].xor(v[a]).rotr(32);
			v[c] = v[c].add(v[d]);
			v[b] = v[b].xor(v[c]).rotr(24);
			v[a] = v[a].add(v[b]).add(y);
			v[d] = v[d].xor(v[a]).rotr(16);
			v[c] = v[c].add(v[d]);
			v[b] = v[b].xor(v[c]).rotr(63);
		}

		/**
		 * @param {UInt64[]} h - state vector
		 * @param {UInt64[]} chunk
		 * @param {number} t - chunkEnd (expected to fit in uint32)
		 * @param {boolean} last
		 */
		function compress(h, chunk, t, last) {
			// work vectors
			const v = h.slice().concat(IV.slice());

			v[12] = v[12].xor(new UInt64(0, imod32(t))); // v[12].high unmodified
			// v[13] unmodified

			if (last) {
				v[14] = v[14].xor(new UInt64(0xffffffff, 0xffffffff));
			}

			for (let round = 0; round < 12; round++) {
				const s = SIGMA[round%10];

				for (let i = 0; i < 4; i++) {
					mix(v, chunk, i, i+4, i+8, i+12, s[i*2], s[i*2+1]);
				}
				
				for (let i = 0; i < 4; i++) {
					mix(v, chunk, i, (i+1)%4 + 4, (i+2)%4 + 8, (i+3)%4 + 12, s[8+i*2], s[8 + i*2 + 1]);
				}
			}

			for (let i = 0; i < 8; i++) {
				h[i] = h[i].xor(v[i].xor(v[i+8]));
			}		
		}
 
		const nBytes = bytes.length;

		bytes = pad(bytes);

		// init hash vector
		const h = IV.slice();
		

		// setup the param block
		const paramBlock = new Uint8Array(64);
		paramBlock[0] = digestSize; // n output  bytes
		paramBlock[1] = 0; // key-length (always zero in our case) 
		paramBlock[2] = 1; // fanout
		paramBlock[3] = 1; // depth

		//mix in the parameter block
		const paramBlockView = new DataView(paramBlock.buffer);
		for (let i = 0; i < 8; i++) {
			h[i] = h[i].xor(new UInt64(
				paramBlockView.getUint32(i*8+4, true),
				paramBlockView.getUint32(i*8, true),
			));
		}
		
		// loop all chunks
		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += WIDTH) {
			const chunkEnd = chunkStart + WIDTH; // exclusive
			const chunk = bytes.slice(chunkStart, chunkStart + WIDTH);

			const chunk64 = new Array(WIDTH/8);
			for (let i = 0; i < WIDTH; i += 8) {
				chunk64[i/8] = UInt64.fromBytes(chunk.slice(i, i+8));
			}
			
			if (chunkStart == bytes.length - WIDTH) {
				// last block
				compress(h, chunk64, nBytes, true);
			} else {
				compress(h, chunk64, chunkEnd, false);
			}
		}

		// extract lowest BLAKE2B_DIGEST_SIZE bytes from h

		/** @type {number[]} */
		let hash = [];
		for (let i = 0; i < digestSize/8; i++) {
			hash = hash.concat(h[i].toBytes());
		}

		return hash.slice(0, digestSize);
	}

	/**
	 * Crypto.Ed25519 exports the following functions:
	 *  * Crypto.Ed25519.derivePublicKey(privateKey)
	 *  * Crypto.Ed25519.sign(message, privateKey)
	 *  * Crypto.Ed25519.verify(message, signature, publicKey)
	 * 
	 * Ported from: https://ed25519.cr.yp.to/python/ed25519.py
	 * ExtendedPoint implementation from: https://github.com/paulmillr/noble-ed25519
     * @package
	 */
	static get Ed25519() {
		/**
		 * @template {Point<T>} T
		 * @typedef {{
		 *   add(other: T): T
		 *   mul(scalar: bigint): T
		 *   equals(other: T): boolean
		 *   encode(): number[]
		 * }} Point
		 */

		const Q = 57896044618658097711785492504343953926634992332820282019728792003956564819949n; // ipowi(255n) - 19n
		const Q38 = 7237005577332262213973186563042994240829374041602535252466099000494570602494n; // (Q + 3n)/8n
		const CURVE_ORDER = 7237005577332262213973186563042994240857116359379907606001950938285454250989n; // ipow2(252n) + 27742317777372353535851937790883648493n;
		const D = -4513249062541557337682894930092624173785641285191125241628941591882900924598840740n; // -121665n * invert(121666n);
		const I = 19681161376707505956807079304988542015446066515923890162744021073123829784752n; // expMod(2n, (Q - 1n)/4n, Q);
	
		/**
		 * @param {bigint} b 
		 * @param {bigint} e 
		 * @param {bigint} m 
		 * @returns {bigint}
		 */
		function expMod(b, e, m) {
			if (e == 0n) {
				return 1n;
			} else {
				let t = expMod(b, e/2n, m);
				t = (t*t) % m;

				if ((e % 2n) != 0n) {
					t = posMod(t*b, m)
				}

				return t;
			}
		}

		/**
		 * @param {bigint} x 
		 * @returns {bigint}
		 */
		function curveMod(x) {
			return posMod(x, Q)
		}

		/**
		 * @param {bigint} n 
		 * @returns {bigint}
		 */
		function invert(n) {
			let a = curveMod(n);
			let b = Q;

			let x = 0n;
			let y = 1n;
			let u = 1n;
			let v = 0n;

			while (a !== 0n) {
				const q = b / a;
				const r = b % a;
				const m = x - u*q;
				const n = y - v*q;
				b = a;
				a = r;
				x = u;
				y = v;
				u = m;
				v = n;
			}

			return curveMod(x);
		}

		/**
		 * @param {bigint} y 
		 * @returns {bigint}
		 */
		function recoverX(y) {
			const yy = y*y;
			const xx = (yy - 1n) * invert(D*yy + 1n);
			let x = expMod(xx, Q38, Q);

			if (((x*x - xx) % Q) != 0n) {
				x = (x*I) % Q;
			}

			if ((x%2n) != 0n) {
				x = Q - x;
			}

			return x;
		}

		/**
		 * Curve point 'multiplication'
		 * @param {bigint} y 
		 * @returns {number[]}
		 */
		function encodeInt(y) {
			const bytes = bigIntToBytes(y).reverse();
			
			while (bytes.length < 32) {
				bytes.push(0);
			}

			return bytes;
		}

		/**
		 * @param {number[]} s 
		 * @returns {bigint}
		 */
		function decodeInt(s) {
			return bytesToBigInt(s.reverse());
		}

		/**
		 * @param {number[]} bytes 
		 * @param {number} i - bit index
		 * @returns {number} - 0 or 1
		 */
		function getBit(bytes, i) {
			return (bytes[Math.floor(i/8)] >> i%8) & 1
		}

		/**
		 * @implements {Point<AffinePoint>}
		 */
		class AffinePoint {
			#x;
			#y;

			/**
			 * @param {bigint} x 
			 * @param {bigint} y 
			 */
			constructor(x, y) {
				this.#x = x;
				this.#y = y;
			}

			/**
			 * @type {AffinePoint}
			 */
			static get BASE() {
				return new AffinePoint(
					15112221349535400772501151409588531511454012693041857206046113283949847762202n, // recoverX(B[1]) % Q
					46316835694926478169428394003475163141307993866256225615783033603165251855960n  // (4n*invert(5n)) % Q
				);
			}
			
			/**
			 * @type {AffinePoint}
			 */
			static get ZERO() {
				return new AffinePoint(0n, 1n);
			}

			/**
			 * @param {number[]} bytes 
			 * @returns {AffinePoint}
			 */
			static decode(bytes) {
				assert(bytes.length == 32);

				const tmp = bytes.slice();
				tmp[31] = tmp[31] & 0b01111111;
	
				const y = decodeInt(tmp);
	
				let x = recoverX(y);
				if (Number(x & 1n) != getBit(bytes, 255)) {
					x = Q - x;
				}
	
				const point = new AffinePoint(x, y);
	
				assert(point.isOnCurve(), "point isn't on curve");
	
				return point;
			}

			/**
			 * @type {bigint}
			 */
			get x() {
				return this.#x;
			}

			/**
			 * @type {bigint}
			 */
			get y() {
				return this.#y;
			}

			/** 
			 * Curve point 'addition'
		     * Note: the invert call in this calculation is very slow (prefer ExtendedPoint for speed)
			 * @param {AffinePoint} other 
			 * @returns {AffinePoint}
			 */
			add(other) {
				const x1 = this.#x;
				const y1 = this.#y;
				const x2 = other.#x;
				const y2 = other.#y;
				const dxxyy = D*x1*x2*y1*y2;
				const x3 = (x1*y2+x2*y1) * invert(1n+dxxyy);
				const y3 = (y1*y2+x1*x2) * invert(1n-dxxyy);

				return new AffinePoint(
					curveMod(x3), 
					curveMod(y3)
				);
			}

			/**
			 * @param {AffinePoint} other 
			 * @returns {boolean}
			 */
			equals(other) {
				return this.x == other.x && this.y == other.y;
			}

			/**
			 * @returns {boolean}
			 */
		 	isOnCurve() {
				const x = this.#x;
				const y = this.#y;
				const xx = x*x;
				const yy = y*y;
				return (-xx + yy - 1n - D*xx*yy) % Q == 0n;
			}

			/**
			 * @param {bigint} s 
			 * @returns {AffinePoint}
			 */
			mul(s) {
				if (s == 0n) {
					return AffinePoint.ZERO;
				} else {
					let sum = this.mul(s/2n);

					sum = sum.add(sum);

					if ((s % 2n) != 0n) {
						sum = sum.add(this);
					}
	
					return sum;
				}
			}

			/**
			 * @returns {number[]}
			 */
			encode() {
				const bytes = encodeInt(this.#y);
	
				// last bit is determined by x
	
				bytes[31] = (bytes[31] & 0b011111111) | (Number(this.#x & 1n) * 0b10000000);
	
				return bytes;
			}
		}

		/**
		 * Extended point implementation take from @noble/ed25519
		 * @implements {Point<ExtendedPoint>}
		 */
		class ExtendedPoint {
			#x;
			#y;
			#z;
			#t;

			/**
			 * @param {bigint} x 
			 * @param {bigint} y 
			 * @param {bigint} z 
			 * @param {bigint} t 
			 */
			constructor(x, y, z, t) {
				this.#x = x;
				this.#y = y;
				this.#z = z;
				this.#t = t;
			}

			/**
			 * @type {ExtendedPoint}
			 */
			static get BASE() {
				return new ExtendedPoint(
					AffinePoint.BASE.x,
					AffinePoint.BASE.y,
					1n,
					curveMod(AffinePoint.BASE.x*AffinePoint.BASE.y)
				)
			}

			/**
			 * @type {ExtendedPoint}
			 */
			static get ZERO() {
				return new ExtendedPoint(0n, 1n, 1n, 0n);
			}

			/**
			 * @param {number[]} bytes 
			 * @returns {ExtendedPoint}
			 */
			static decode(bytes) {
				return ExtendedPoint.fromAffine(AffinePoint.decode(bytes));
			}

			/**
			 * @param {AffinePoint} affine 
			 * @returns {ExtendedPoint}
			 */
			static fromAffine(affine) {
				return new ExtendedPoint(affine.x, affine.y, 1n, curveMod(affine.x*affine.y));
			}

			/**
			 * @param {ExtendedPoint} other 
			 * @returns {ExtendedPoint}
			 */
			add(other) {
				const x1 = this.#x;
				const y1 = this.#y;
				const z1 = this.#z;
				const t1 = this.#t;

				const x2 = other.#x;
				const y2 = other.#y;
				const z2 = other.#z;
				const t2 = other.#t;

				const a = curveMod(x1*x2);
				const b = curveMod(y1*y2);
				const c = curveMod(D*t1*t2);
				const d = curveMod(z1*z2);
				const e = curveMod((x1 + y1)*(x2 + y2) - a - b);
				const f = curveMod(d - c);
				const g = curveMod(d + c);
				const h = curveMod(a + b);
				const x3 = curveMod(e*f);
				const y3 = curveMod(g*h);
				const z3 = curveMod(f*g);
				const t3 = curveMod(e*h);
				
				return new ExtendedPoint(x3, y3, z3, t3);
			}

			/**
			 * @returns {number[]}
			 */
			encode() {
				return this.toAffine().encode()
			}

			/**
			 * @param {ExtendedPoint} other 
			 * @returns {boolean}
			 */
			equals(other) {
				return (curveMod(this.#x*other.#z) == curveMod(other.#x*this.#z)) && (curveMod(this.#y*other.#z) == curveMod(other.#y*this.#z));
			}

			/**
			 * @returns {boolean}
			 */
			isBase() {
				return this.equals(ExtendedPoint.BASE);
			}

			/**
			 * @returns {boolean}
			 */
			isZero() {
				return this.equals(ExtendedPoint.ZERO);
			}

			/**
			 * @param {bigint} s 
			 * @returns {ExtendedPoint}
			 */
			mul(s) {
				if (s == 0n) {
					return ExtendedPoint.ZERO;
				} else {
					let sum = this.mul(s/2n);

					sum = sum.add(sum);

					if ((s % 2n) != 0n) {
						sum = sum.add(this);
					}
	
					return sum;
				}
			}

			/**
			 * @returns {AffinePoint}
			 */
			toAffine() {
				if (this.isZero()) {
					return AffinePoint.ZERO;
				} else {
					const zInverse = invert(this.#z);

					return new AffinePoint(
						curveMod(this.#x*zInverse),
						curveMod(this.#y*zInverse)
					);
				}
			}
		}

		/**
		 * Couldn't think of a proper name for this function
		 * @param {number[]} h 
		 * @returns {bigint}
		 */
		function calca(h) {
			const a = 28948022309329048855892746252171976963317496166410141009864396001978282409984n; // ipow2(253)

			const bytes = h.slice(0, 32);
			bytes[0] = bytes[0] & 0b11111000;
			bytes[31] = bytes[31] & 0b00111111;

			const x = bytesToBigInt(bytes.reverse());
			return a + x;
		}

		/**
		 * @param {number[]} m 
		 * @returns {bigint}
		 */
		function ihash(m) {
			const h = Crypto.sha2_512(m);

			return decodeInt(h);
		}

		const PointImpl = ExtendedPoint

		return {
			/**
			 * @param {number[]} privateKey 
			 * @returns {number[]}
			 */
			derivePublicKey: function(privateKey) {
				const privateKeyHash = Crypto.sha2_512(privateKey);
				const a = calca(privateKeyHash);
				const A = PointImpl.BASE.mul(a);

				return A.encode();
			},

			/**
			 * @param {number[]} message 
			 * @param {number[]} privateKey 
			 * @returns {number[]}
			 */
			sign: function(message, privateKey) {
				const privateKeyHash = Crypto.sha2_512(privateKey);
				const a = calca(privateKeyHash);

				// for convenience calculate publicKey here:
				const publicKey = PointImpl.BASE.mul(a).encode();

				const r = ihash(privateKeyHash.slice(32, 64).concat(message));
				const R = PointImpl.BASE.mul(r);
				const Rencoded = R.encode();
				const ih = ihash(Rencoded.concat(publicKey).concat(message));
				const S = posMod(r + ih*a, CURVE_ORDER);

				return Rencoded.concat(encodeInt(S));
			},

			/**
			 * @param {number[]} signature 
			 * @param {number[]} message 
			 * @param {number[]} publicKey 
			 * @returns {boolean}
			 */
			verify: function(signature, message, publicKey) {
				if (signature.length != 64) {
					throw new Error(`unexpected signature length ${signature.length}`);
				}
	
				if (publicKey.length != 32) {
					throw new Error(`unexpected publickey length ${publicKey.length}`);
				}

				const R = PointImpl.decode(signature.slice(0, 32));
				const A = PointImpl.decode(publicKey);
				const S = decodeInt(signature.slice(32, 64));
				const h = ihash(signature.slice(0, 32).concat(publicKey).concat(message));

				const left = PointImpl.BASE.mul(S);
				const right = R.add(A.mul(h));

				return left.equals(right);
			}
		}
	}
}


//////////////////////////////////
// Section 5: Cbor encoder/decoder
//////////////////////////////////

/**
 * @typedef {(i: number, bytes: number[]) => void} Decoder
 */

/**
 * Base class of any Cbor serializable data class
 * Also contains helper methods for (de)serializing data to/from Cbor
 */
export class CborData {
	constructor() {
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {number} m - major type
	 * @param {bigint} n - size parameter
	 * @returns {number[]} - uint8 bytes
	 */
	static encodeHead(m, n) {
		if (n <= 23n) {
			return [32*m + Number(n)];
		} else if (n >= 24n && n <= 255n) {
			return [32*m + 24, Number(n)];
		} else if (n >= 256n && n <= 256n*256n - 1n) {
			return [32*m + 25, Number((n/256n)%256n), Number(n%256n)];
		} else if (n >= 256n*256n && n <= 256n*256n*256n*256n - 1n) {
			let e4 = bigIntToBytes(n);

			while (e4.length < 4) {
				e4.unshift(0);
			}
			return [32*m + 26].concat(e4);
		} else if (n >= 256n*256n*256n*256n && n <= 256n*256n*256n*256n*256n*256n*256n*256n - 1n) {
			let e8 = bigIntToBytes(n);

			while(e8.length < 8) {
				e8.unshift(0);
			}
			return [32*m + 27].concat(e8);
		} else {
			throw new Error("n out of range");
		}
	}

	/**
	 * @param {number[]} bytes - mutated to contain the rest
	 * @returns {[number, bigint]} - [majorType, n]
	 */
	static decodeHead(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor head");
		}

		let first = assertDefined(bytes.shift());

		if (first%32 <= 23) {
			return [idiv(first, 32), BigInt(first%32)];
		} else if (first%32 == 24) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 1))];
		} else if (first%32 == 25) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 2))];
		} else if (first%32 == 26) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 4))];
		} else if (first%32 == 27) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 8))];
		} else {
			throw new Error("bad header");
		}
	}

	/**
	 * @param {number} m
	 * @returns {number[]}
	 */
	static encodeIndefHead(m) {
		return [32*m + 31];
	}

	/**
	 * @param {number[]} bytes - cbor bytes
	 * @returns {number} - majorType
	 */
	static decodeIndefHead(bytes) {
		let first = assertDefined(bytes.shift());

		let m = idiv(first - 31, 32);

		return m;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isNull(bytes) {
		return bytes[0] == 246;
	}

	/**
	 * @returns {number[]}
	 */
	static encodeNull() {
		return [246];
	}

	/**
	 * Throws error if not null
	 * @param {number[]} bytes
	 */
	static decodeNull(bytes) {
		let b = assertDefined(bytes.shift());

		if (b != 246) {
			throw new Error("not null");
		}
	}

	/**
	 * @param {boolean} b
	 * @returns {number[]}
	 */
	static encodeBool(b) {
		if (b) {
			return [245];
		} else {
			return [244];
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static decodeBool(bytes) {
		let b = assertDefined(bytes.shift());

		if (b == 245) {
			return true;
		} else if (b == 244) {
			return false;
		} else {
			throw new Error("unexpected non-boolean cbor object");
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isDefBytes(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		let [m, _] = CborData.decodeHead(bytes.slice(0, 9));

		return m == 2;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isIndefBytes(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return 2*32 + 31 == bytes[0];
	}

	/**
	 * @example
	 * bytesToHex(CborData.encodeBytes(hexToBytes("4d01000033222220051200120011"))) => "4e4d01000033222220051200120011"
	 * @param {number[]} bytes
	 * @param {boolean} splitInChunks
	 * @returns {number[]} - cbor bytes
	 */
	static encodeBytes(bytes, splitInChunks = false) {
		bytes = bytes.slice();

		if (bytes.length <= 64 || !splitInChunks) {
			let head = CborData.encodeHead(2, BigInt(bytes.length));
			return head.concat(bytes);
		} else {
			let res = CborData.encodeIndefHead(2);

			while (bytes.length > 0) {
				let chunk = bytes.splice(0, 64);

				res = res.concat(CborData.encodeHead(2, BigInt(chunk.length))).concat(chunk);
			}

			res.push(255);

			return res;
		}
	}

	/**
	 * Decodes both an indef array of bytes, and a bytearray of specified length
	 * @example
	 * bytesToHex(CborData.decodeBytes(hexToBytes("4e4d01000033222220051200120011"))) => "4d01000033222220051200120011"
	 * @param {number[]} bytes - cborbytes, mutated to form remaining
	 * @returns {number[]} - byteArray
	 */
	static decodeBytes(bytes) {
		// check header type
		assert(bytes.length > 0);

		if (CborData.isIndefBytes(bytes)) {
			// multiple chunks
			void bytes.shift();

			/**
			 * @type {number[]}
			 */
			let res = [];

			while(bytes[0] != 255) {
				let [_, n] = CborData.decodeHead(bytes);
				if (n > 64n) {
					throw new Error("bytearray chunk too large");
				}

				res = res.concat(bytes.splice(0, Number(n)));
			}

			assert(bytes.shift() == 255);

			return res;
		} else {
			let [_, n] = CborData.decodeHead(bytes);

			return bytes.splice(0, Number(n));
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isUtf8(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return bytes[0] === 120;
	}

	/**
	 * Encodes a Utf8 string into Cbor bytes.
	 * Strings can be split into lists with chunks of up to 64 bytes
	 * to play nice with Cardano tx metadata constraints.
	 * @param {string} str
	 * @param {boolean} split
	 * @returns {number[]}
	 */
	static encodeUtf8(str, split = false) {
		const bytes = textToBytes(str);

		if (split && bytes.length > 64) {
			/** @type {number[][]} */
			const chunks = [];

			let i = 0;
			while (i < bytes.length) {
				// We encode the largest chunk up to 64 bytes
				// that is valid UTF-8
				let maxChunkLength = 64, chunk;
				while (true) {
					try {
						chunk = bytes.slice(i, i + maxChunkLength);
						bytesToText(chunk); // Decode to validate utf-8
						break;
					} catch(_) {
						maxChunkLength--;
					}
				}
				chunks.push([120, chunk.length].concat(chunk));
				i += chunk.length;
			}

			return CborData.encodeDefList(chunks);
		} else {
			return [120, bytes.length].concat(bytes);
		}
	}

	/**
	* @param {number[]} bytes
	* @returns {string}
	*/
	static decodeUtf8Internal(bytes) {
		assert(bytes.shift() === 120);

		const length = bytes.shift();

		return bytesToText(bytes.splice(0, length));
	}

	/**
	* @param {number[]} bytes
	* @returns {string}
	*/
	static decodeUtf8(bytes) {
		assert(bytes.length > 0);

		if (CborData.isDefList(bytes)) {
			let result = "";

			CborData.decodeList(bytes, (_, itemBytes) => {
				result += CborData.decodeUtf8Internal(itemBytes);
			});

			return result;
		} else {
			return CborData.decodeUtf8Internal(bytes);
		}
	}

	/**
	 * @param {bigint} n
	 * @returns {number[]} - cbor bytes
	 */
	static encodeInteger(n) {
		if (n >= 0n && n <= (2n << 63n) - 1n) {
			return CborData.encodeHead(0, n);
		} else if (n >= (2n << 63n)) {
			return CborData.encodeHead(6, 2n).concat(CborData.encodeBytes(bigIntToBytes(n)));
		} else if (n <= -1n && n >= -(2n << 63n)) {
			return CborData.encodeHead(1, -n - 1n);
		} else {
			return CborData.encodeHead(6, 3n).concat(CborData.encodeBytes(bigIntToBytes(-n - 1n)));
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	static decodeInteger(bytes) {
		let [m, n] = CborData.decodeHead(bytes);

		if (m == 0) {
			return n;
		} else if (m == 1) {
			return -n - 1n;
		} else if (m == 6) {
			if (n == 2n) {
				let b = CborData.decodeBytes(bytes);

				return bytesToBigInt(b);
			} else if (n == 3n) {
				let b = CborData.decodeBytes(bytes);

				return -bytesToBigInt(b) - 1n;
			} else {
				throw new Error(`unexpected tag n:${n}`);
			}
		} else {
			throw new Error(`unexpected tag m:${m}`);
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isIndefList(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return 4*32 + 31 == bytes[0];
	}

	/**
	 * @returns {number[]}
	 */
	static encodeIndefListStart() {
		return CborData.encodeIndefHead(4);
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeListInternal(list) {
		/**
		 * @type {number[]}
		 */
		let res = [];
		for (let item of list) {
			if (item instanceof CborData) {
				res = res.concat(item.toCbor());
			} else {
				res = res.concat(item);
			}
		}

		return res;
	}

	/**
	 * @returns {number[]}
	 */
	static encodeIndefListEnd() {
		return [255];
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeList(list) {
		// This follows the serialization format that the Haskell input-output-hk/plutus UPLC evaluator
		// https://github.com/well-typed/cborg/blob/4bdc818a1f0b35f38bc118a87944630043b58384/serialise/src/Codec/Serialise/Class.hs#L181
		return list.length ? CborData.encodeIndefList(list) : CborData.encodeDefList(list);
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeIndefList(list) {
		return CborData.encodeIndefListStart().concat(CborData.encodeListInternal(list)).concat(CborData.encodeIndefListEnd());
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isDefList(bytes) {
		try {
			let [m, _] = CborData.decodeHead(bytes.slice(0, 9));
			return m == 4;
		} catch (error) {
			if (error.message.includes("bad header")) return false;
			throw error;
		}
	}

	/**
	 * @param {bigint} n
	 * @returns {number[]}
	 */
	static encodeDefListStart(n) {
		return CborData.encodeHead(4, n);
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeDefList(list) {
		return CborData.encodeDefListStart(BigInt(list.length)).concat(CborData.encodeListInternal(list));
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isList(bytes) {
		return CborData.isIndefList(bytes) || CborData.isDefList(bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @param {Decoder} itemDecoder
	 */
	static decodeList(bytes, itemDecoder) {
		if (CborData.isIndefList(bytes)) {
			assert(CborData.decodeIndefHead(bytes) == 4);

			let i = 0;
			while(bytes[0] != 255) {
				itemDecoder(i, bytes);
				i++;
			}

			assert(bytes.shift() == 255);
		} else {
			let [m, n] = CborData.decodeHead(bytes);

			assert(m == 4);

			for (let i = 0; i < Number(n); i++) {
				itemDecoder(i, bytes);
			}
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isTuple(bytes) {
		return CborData.isIndefList(bytes) || CborData.isDefList(bytes);
	}

	/**
	 * @param {number[][]} tuple
	 * @returns {number[]}
	 */
	static encodeTuple(tuple) {
		return CborData.encodeDefList(tuple);
	}


	/**
	 * @param {number[]} bytes
	 * @param {Decoder} tupleDecoder
	 * @returns {number} - returns the size of the tuple
	 */
	static decodeTuple(bytes, tupleDecoder) {
		let count = 0;

		CborData.decodeList(bytes, (_, itemBytes) => {
			tupleDecoder(count, itemBytes);
			count++;
		});

		return count;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isMap(bytes) {
		let [m, _] = CborData.decodeHead(bytes.slice(0, 9));

		return m == 5;
	}

	/**
	 * @param {[CborData | number[], CborData | number[]][]} pairList
	 * @returns {number[]}
	 */
	static encodeMapInternal(pairList) {
		/**
		 * @type {number[]}
		 */
		let res = [];

		for (let pair of pairList) {
			let key = pair[0];
			let value = pair[1];

			if (key instanceof CborData) {
				res = res.concat(key.toCbor());
			} else {
				res = res.concat(key);
			}

			if (value instanceof CborData) {
				res = res.concat(value.toCbor());
			} else {
				res = res.concat(value);
			}
		}

		return res;
	}

	/**
	 * A decode map method doesn't exist because it specific for the requested type
	 * @param {[CborData | number[], CborData | number[]][]} pairList
	 * @returns {number[]}
	 */
	static encodeMap(pairList) {
		return CborData.encodeHead(5, BigInt(pairList.length)).concat(CborData.encodeMapInternal(pairList));
	}

	/**
	 * @param {number[]} bytes
	 * @param {Decoder} pairDecoder
	 */
	static decodeMap(bytes, pairDecoder) {
		let [m, n] = CborData.decodeHead(bytes);

		assert(m == 5);

		for (let i = 0; i < n; i++) {
			pairDecoder(i, bytes);
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isObject(bytes) {
		return CborData.isMap(bytes);
	}

	/**
	 * @param {Map<number, CborData | number[]>} object
	 * @returns {number[]}
	 */
	static encodeObject(object) {
		return CborData.encodeMap(Array.from(object.entries()).map(pair => [
			CborData.encodeInteger(BigInt(pair[0])),
			pair[1]
		]));
	}

	/**
	 * @param {number[]} bytes
	 * @param {Decoder} fieldDecoder
	 * @returns {Set<number>}
	 */
	static decodeObject(bytes, fieldDecoder) {
		/** @type {Set<number>} */
		let done = new Set();

		CborData.decodeMap(bytes, (_, pairBytes) => {
			let i = Number(CborData.decodeInteger(pairBytes));

			fieldDecoder(i, pairBytes);

			done.add(i);
		});

		return done;
	}

	/**
	 * Unrelated to constructor
	 * @param {bigint} tag
	 * @returns {number[]}
	 */
	static encodeTag(tag) {
		return CborData.encodeHead(6, tag);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	static decodeTag(bytes) {
		let [m, n] = CborData.decodeHead(bytes);

		assert(m == 6);

		return n;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isConstr(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		let [m, _] = CborData.decodeHead(bytes.slice(0, 9));

		return m == 6;
	}

	/**
	 * Encode a constructor tag of a ConstrData type
	 * @param {number} tag
	 * @returns {number[]}
	 */
	static encodeConstrTag(tag) {
		if (tag >= 0 && tag <= 6) {
			return CborData.encodeHead(6, 121n + BigInt(tag));
		} else if (tag >= 7 && tag <= 127) {
			return CborData.encodeHead(6, 1280n + BigInt(tag - 7));
		} else {
			return CborData.encodeHead(6, 102n).concat(CborData.encodeHead(4, 2n)).concat(CborData.encodeInteger(BigInt(tag)));
		}
	}

	/**
	 * @param {number} tag
	 * @param {CborData[] | number[][]} fields
	 * @returns {number[]}
	 */
	static encodeConstr(tag, fields) {
		return CborData.encodeConstrTag(tag).concat(CborData.encodeList(fields));
	}

	/**
	 * @param {number[]} bytes
	 * @returns {number}
	 */
	static decodeConstrTag(bytes) {
		// constr
		let [m, n] = CborData.decodeHead(bytes);

		assert(m == 6);

		if (n < 127n) {
			return Number(n - 121n);
		} else if (n == 102n) {
			let [mCheck, nCheck] = CborData.decodeHead(bytes);
			assert(mCheck == 4 && nCheck == 2n);

			return Number(CborData.decodeInteger(bytes));
		} else {
			return Number(n - 1280n + 7n);
		}
	}

	/**
	 * Returns the tag
	 * @param {number[]} bytes
	 * @param {Decoder} fieldDecoder
	 * @returns {number}
	 */
	static decodeConstr(bytes, fieldDecoder) {
		let tag = CborData.decodeConstrTag(bytes);

		CborData.decodeList(bytes, fieldDecoder);

		return tag;
	}
}



/////////////////////////////
// Section 6: Uplc data types
/////////////////////////////

/**
 * Min memory used by a UplcData value during validation
 * @package
 * @type {number}
 */
const UPLC_DATA_NODE_MEM_SIZE = 4;

/**
 * Base class for Plutus-core data classes (not the same as Plutus-core value classes!)
 */
export class UplcData extends CborData {
	constructor() {
		super();
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not yet implemented");
	}

	/**
	 * Estimate of memory usage during validation
	 * @type {number}
	 */
	get memSize() {
		throw new Error("not yet implemented");
	}

	/**
	 * Compares the schema jsons
	 * @param {UplcData} other
	 * @returns {boolean}
	 */
	isSame(other) {
		return this.toSchemaJson() == other.toSchemaJson();
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		throw new Error("not a bytearray");
	}

	/**
	 * @type {bigint}
	 */
	get int() {
		throw new Error("not an int");
	}

	/**
	 * @type {number}
	 */
	get index() {
		throw new Error("not a constr");
	}

	/**
	 * @type {UplcData[]}
	 */
	get fields() {
		throw new Error("not a constr");
	}

	/**
	 * @type {UplcData[]}
	 */
	get list() {
		throw new Error("not a list");
	}

	/**
	 * @type {[UplcData, UplcData][]}
	 */
	get map() {
		throw new Error("not a map");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {string | number[]} bytes
	 * @returns {UplcData}
	 */
	static fromCbor(bytes) {
		if (typeof bytes == "string") {
			return UplcData.fromCbor(hexToBytes(bytes));
		} else {
			if (CborData.isList(bytes)) {
				return ListData.fromCbor(bytes);
			} else if (CborData.isIndefBytes(bytes)) {
				return ByteArrayData.fromCbor(bytes);
			} else {
				if (CborData.isDefBytes(bytes)) {
					return ByteArrayData.fromCbor(bytes);
				} else if (CborData.isMap(bytes)) {
					return MapData.fromCbor(bytes);
				} else if (CborData.isConstr(bytes)) {
					return ConstrData.fromCbor(bytes);
				} else {
					// int, must come last
					return IntData.fromCbor(bytes);
				}
			}
		}
	}
}

/**
 * Plutus-core int data class
 */
export class IntData extends UplcData {
	#value;

	/**
	 * @param {bigint} value
	 */
	constructor(value) {
		super();
		this.#value = value;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferIntData(this.#value);
	}

	/**
	 * @type {bigint}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * Alias getter
	 * @type {bigint}
	 */
	get int() {
		return this.#value;
	}

    /**
     * Calculate the mem size of a integer (without the DATA_NODE overhead)
     * @param {bigint} value
     * @returns {number}
     */
    static memSizeInternal(value) {
        if (value == 0n) {
			return 1;
		} else {
			const abs = value > 0n ? value : -value;

			return Math.floor(Math.floor(Math.log2(Number(abs)))/64) + 1;
		}
    }

	/**
	 * @type {number}
	 */
	get memSize() {
		return UPLC_DATA_NODE_MEM_SIZE + IntData.memSizeInternal(this.#value);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}

	/**
	 * Returns integer literal wrapped with integer data function call.
	 * @returns {IR}
	 */
	toIR() {
		return new IR(`__core__iData(${this.#value.toString()})`);
	}

	/**
	 * Returns string, not js object, because of unbounded integers
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"int": ${this.#value.toString()}}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeInteger(this.#value);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {IntData}
	 */
	static fromCbor(bytes) {
		return new IntData(CborData.decodeInteger(bytes));
	}
}

/**
 * Plutus-core bytearray data class.
 * Wraps a regular list of uint8 numbers (so not Uint8Array)
 */
export class ByteArrayData extends UplcData {
	#bytes;

	/**
	 * @param {number[]} bytes
	 */
	constructor(bytes) {
		super();
		this.#bytes = bytes;
	}

	/**
	 * Applies utf-8 encoding
	 * @param {string} s
	 * @returns {ByteArrayData}
	 */
	static fromString(s) {
		let bytes = textToBytes(s);

		return new ByteArrayData(bytes);
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferByteArrayData(this.#bytes);
	}

	/**
	 * Returns a copy of the underlying bytes.
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes.slice();
	}

    /**
     * Calculates the mem size of a byte array without the DATA_NODE overhead.
     * @param {number[]} bytes
     * @returns {number}
     */
    static memSizeInternal(bytes) {
        const n = bytes.length;

		if (n === 0) {
			return 1; // this is so annoying: haskell reference implementation says it should be 0, but current (20220925) testnet and mainnet settings say it's 1
		} else {
			return Math.floor((n - 1)/8) + 1;
		}
    }

	/**
	 * @type {number}
	 */
	get memSize() {
		return UPLC_DATA_NODE_MEM_SIZE + ByteArrayData.memSizeInternal(this.#bytes);
	}

	/**
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `#${this.toHex()}`;
	}

	/**
	 * Returns bytearray literal wrapped with bytearray data function as IR.
	 * @returns {IR}
	 */
	toIR() {
		return new IR(`__core__bData(#${this.toHex()})`);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"bytes": "${this.toHex()}"}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes, true);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {ByteArrayData}
	 */
	static fromCbor(bytes) {
		return new ByteArrayData(CborData.decodeBytes(bytes));
	}

	/**
	 * Bytearray comparison, which can be used for sorting bytearrays
	 * @example
	 * ByteArrayData.comp(hexToBytes("0101010101010101010101010101010101010101010101010101010101010101"), hexToBytes("0202020202020202020202020202020202020202020202020202020202020202")) => -1
	 * @param {number[]} a
	 * @param {number[]} b
	 * @returns {number} - 0 -> equals, 1 -> gt, -1 -> lt
	 */
	static comp(a, b) {
		/** @return {boolean} */
		function lessThan() {
			for (let i = 0; i < Math.min(a.length, b.length); i++) {
				if (a[i] != b[i]) {
					return a[i] < b[i];
				}
			}

			return a.length < b.length;
		}

		/** @return {number} */
		function lessOrGreater() {
			return lessThan() ? -1 : 1;
		}

		if (a.length != b.length) {
			return lessOrGreater();
		} else {
			for (let i = 0; i < a.length; i++) {
				if (a[i] != b[i]) {
					return lessOrGreater();
				}
			}

			return 0;
		}
	}
}

/**
 * Plutus-core list data class
 */
export class ListData extends UplcData {
	#items;

	/**
	 * @param {UplcData[]} items
	 */
	constructor(items) {
		super();
		this.#items = items;
	}

	/**
	 * @param {TransferUplcAst} other 
	 */
	transfer(other) {
		return other.transferListData(
			this.#items.map(item => item.transfer(other))
		);
	}

	/**
	 * @type {UplcData[]}
	 */
	get list() {
		return this.#items.slice();
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		let sum = UPLC_DATA_NODE_MEM_SIZE;

		for (let item of this.#items) {
			sum += item.memSize;
		}

		return sum;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[${this.#items.map(item => item.toString()).join(", ")}]`;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		let ir = new IR("__core__mkNilData(())");
		for (let i = this.#items.length - 1; i >= 0; i--) {
			ir = new IR([new IR("__core__mkCons("), this.#items[i].toIR(), new IR(", "), ir, new IR(")")]);
		}

		return new IR([new IR("__core__listData("), ir, new IR(")")]);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"list":[${this.#items.map(item => item.toSchemaJson()).join(", ")}]}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeList(this.#items);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {ListData}
	 */
	static fromCbor(bytes) {
		/**
		 * @type {UplcData[]}
		 */
		let list = [];

		CborData.decodeList(bytes, (_, itemBytes) => {
			list.push(UplcData.fromCbor(itemBytes));
		});

		return new ListData(list);
	}
}

/**
 * Plutus-core map data class
 */
export class MapData extends UplcData {
	#pairs;

	/**
	 * @param {[UplcData, UplcData][]} pairs
	 */
	constructor(pairs) {
		super();
		this.#pairs = pairs;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferMapData(
			this.#pairs.map(([a, b]) => {
				return [a.transfer(other), b.transfer(other)]
			})
		);
	}

	/**
	 * @type {[UplcData, UplcData][]}
	 */
	get map() {
		return this.#pairs.slice();
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		let sum = UPLC_DATA_NODE_MEM_SIZE;

		for (let [k, v] of this.#pairs) {
			sum += k.memSize + v.memSize;
		}

		return sum;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `{${this.#pairs.map(([fst, snd]) => `${fst.toString()}: ${snd.toString()}`).join(", ")}}`;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		let ir = new IR("__core__mkNilPairData(())");

		for (let i = this.#pairs.length - 1; i >= 0; i--) {
			const a = this.#pairs[i][0].toIR();
			const b = this.#pairs[i][1].toIR();

			ir = new IR([new IR("__core__mkCons(__core__mkPairData("), a, new IR(", "), b, new IR(", "), new IR(")"), new IR(", "), ir, new IR(")")]);
		}

		return new IR([new IR("__core__mapData("), ir, new IR(")")]);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"map": [${this.#pairs.map(pair => { return "{\"k\": " + pair[0].toSchemaJson() + ", \"v\": " + pair[1].toSchemaJson() + "}" }).join(", ")}]}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeMap(this.#pairs);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {MapData}
	 */
	static fromCbor(bytes) {
		/**
		 * @type {[UplcData, UplcData][]}
		 */
		let pairs = [];

		CborData.decodeMap(bytes, (_, pairBytes) => {
			pairs.push([UplcData.fromCbor(pairBytes), UplcData.fromCbor(pairBytes)]);
		});

		return new MapData(pairs);
	}
}

/**
 * Plutus-core constructed data class
 */
export class ConstrData extends UplcData {
	#index;
	#fields;

	/**
	 * @param {number} index
	 * @param {UplcData[]} fields
	 */
	constructor(index, fields) {
		super();
		this.#index = index;
		this.#fields = fields;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferConstrData(
			this.#index,
			this.#fields.map(f => f.transfer(other))
		);
	}

	/**
	 * @type {number}
	 */
	get index() {
		return this.#index;
	}

	/**
	 * @type {UplcData[]}
	 */
	get fields() {
		return this.#fields.slice();
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		let sum = UPLC_DATA_NODE_MEM_SIZE;

		for (let field of this.#fields) {
			sum += field.memSize;
		}

		return sum;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let parts = this.#fields.map(field => field.toString());
		return `${this.#index.toString()}{${parts.join(", ")}}`;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		let ir = new IR("__core__mkNilData(())");
		for (let i = this.#fields.length - 1; i >= 0; i--) {
			ir = new IR([new IR("__core__mkCons("), this.#fields[i].toIR(), new IR(", "), ir, new IR(")")]);
		}

		return new IR([new IR("__core__constrData("), new IR(this.#index.toString()), new IR(", "), ir, new IR(")")]);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"constructor": ${this.#index.toString()}, "fields": [${this.#fields.map(f => f.toSchemaJson()).join(", ")}]}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeConstr(this.#index, this.#fields);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {ConstrData}
	 */
	static fromCbor(bytes) {
		/**
		 * @type {UplcData[]}
		 */
		let fields = [];

		let tag = CborData.decodeConstr(bytes, (_, fieldBytes) => {
			fields.push(UplcData.fromCbor(fieldBytes));
		});

		return new ConstrData(tag, fields);
	}
}


/////////////////////////////////
// Section 7: Helios data objects
/////////////////////////////////

/**
 * Base-type of all data-types that exist both on- and off-chain, and map directly to Helios instances.
 */
export class HeliosData extends CborData {
	constructor() {
        super();
	}

    /**
     * Name begins with underscore so it can never conflict with structure field names.
     * @package
     * @returns {UplcData}
     */
	_toUplcData() {
        throw new Error("not yet implemented");
	}

    /**
     * @returns {string}
     */
	toSchemaJson() {
		return this._toUplcData().toSchemaJson();
	}
}

/**
 * @template {HeliosData} T
 * 
 * @typedef {{
 *   new(...args: any[]): T
 *   fromUplcCbor: (bytes: (string | number[])) => T
 *   fromUplcData: (data: UplcData) => T
 * }} HeliosDataClass
 */

/**
 * Helios Int type
 */
export class HInt extends HeliosData {
    /** 
     * @type {bigint} 
     */
    #value;

    /**
     * @package
     * @param {number | bigint | string} rawValue
     * @returns {bigint}
     */
    static cleanConstructorArg(rawValue) {
        const value = BigInt(rawValue);

        if (value.toString() != rawValue.toString()) {
            throw new Error("not a valid integer");
        }

        return value;
    }

    /**
     * @param {number | bigint | string} rawValue
     */
    constructor(rawValue) {
        super();

        this.#value = HInt.cleanConstructorArg(rawValue);
    }

    /**
     * @type {bigint}
     */
    get value() {
        return this.#value;
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new IntData(this.#value);
    }

    /**
     * @param {UplcData} data
     * @returns {HInt}
     */
    static fromUplcData(data) {
        return new HInt(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {HInt}
     */
    static fromUplcCbor(bytes) {
        return HInt.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Milliseconds since 1 jan 1970
 */
export class Time extends HInt {
     /**
     * @package
     * @param {number | bigint | string | Date} rawValue
     * @returns {bigint}
     */
	static cleanConstructorArg(rawValue) {
        if (rawValue instanceof Date) {
            return BigInt(rawValue.getTime());
        } else {
            const value = BigInt(rawValue);

            if (value.toString() != rawValue.toString()) {
                throw new Error("not a valid integer");
            } else {
                return value;
            }
        }
    }

    /**
     * @param {number | bigint | string | Date} rawValue
     */
    constructor(rawValue) {
        super(Time.cleanConstructorArg(rawValue));
    }

    /**
     * @param {UplcData} data
     * @returns {Time}
     */
    static fromUplcData(data) {
        return new Time(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {Time}
     */
    static fromUplcCbor(bytes) {
        return Time.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Difference between two time values in milliseconds.
 */
export class Duration extends HInt {
    /**
     * @param {UplcData} data
     * @returns {Duration}
     */
    static fromUplcData(data) {
        return new Duration(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {Duration}
     */
    static fromUplcCbor(bytes) {
        return Duration.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios Bool type
 */
export class Bool extends HeliosData {
    /** 
     * @type {boolean} 
     */
    #value;

    /**
     * @package
     * @param {boolean | string} rawValue 
     * @returns {boolean}
     */
    static cleanConstructorArg(rawValue) {
        if (typeof rawValue == "string") {
            if (rawValue == "false") {
                return false;
            } else if (rawValue == "true") {
                return true;
            } else {
                throw new Error("not a valid string representation of a Bool");
            }
        } else if (typeof rawValue == "boolean") {
            return rawValue;
        } else {
            throw new Error("can't convert to boolean");
        }
    }

    /**
     * @param {boolean | string} rawValue 
     */
    constructor(rawValue) {
        super();

        this.#value = Bool.cleanConstructorArg(rawValue);
    }

    get bool() {
        return this.#value;
    }
    
    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(this.#value ? 1 : 0, []);
    }

    /** 
     * @param {UplcData} data
     * @returns {Bool}
     */
    static fromUplcData(data) {
        assert(data.fields.length == 0, "bool data can't have fields");

        if (data.index == 0) {
            return new Bool(false);
        } else if (data.index == 1) {
            return new Bool(true);
        } else {
            throw new Error("expected 0 or 1 for ConstrData representing Bool");
        }
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {Bool}
     */
    static fromUplcCbor(bytes) {
        return Bool.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios String type.
 * Can't be named 'String' because that would interfere with the javascript 'String'-type
 */
export class HString extends HeliosData {
    /**
     * @type {string}
     */
    #value;

    /**
     * @param {string} value 
     */
    constructor(value) {
        super();

        this.#value = value;
    }

    get string() {
        return this.#value;
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(textToBytes(this.#value));
    }

    /**
     * @param {UplcData} data 
     * @returns {HString}
     */
    static fromUplcData(data) {
        return new HString(bytesToText(data.bytes));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {HString}
     */
    static fromUplcCbor(bytes) {
        return HString.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios ByteArray type
 */
export class ByteArray extends HeliosData {
    /**
     * @type {number[]}
     */
    #bytes;

    /**
     * @package
     * @param {string | number[]} rawValue 
     */
    static cleanConstructorArg(rawValue) {
        if (Array.isArray(rawValue)) {
            return rawValue;
        } else if (typeof rawValue == "string") {
            if (rawValue.startsWith("#")) {
                rawValue = rawValue.slice(1);
            }

            return hexToBytes(rawValue);
        } else {
            throw new Error("unexpected bytes type");
        }
    }

    /**
     * @param {string | number[]} rawValue 
     */
    constructor(rawValue) {
        super();

        this.#bytes = ByteArray.cleanConstructorArg(rawValue);
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
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

    /**
     * @param {UplcData} data 
     * @returns {ByteArray}
     */
    static fromUplcData(data) {
        return new ByteArray(data.bytes);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {ByteArray}
     */
    static fromUplcCbor(bytes) {
        return ByteArray.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Dynamically constructs a new List class, depending on the item type.
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} ItemClass
 * @returns {HeliosDataClass<HList_>}
 */
export function HList(ItemClass) {
    assert(!new.target, "List can't be called with new");
    assert(ItemClass.prototype instanceof HeliosData);

    const typeName = `[]${ItemClass.name}`;

    class HList_ extends HeliosData {
        /** 
         * @type {T[]} 
         */
        #items;

        /**
         * @param {any[]} rawList 
         */
        constructor(rawList) {
            super();

            this.#items = rawList.map(item => {
                if (item instanceof ItemClass) {
                    return item;
                } else {
                    return new ItemClass(item);
                }
            });
        }

        /**
         * @package
         * @type {string}
         */
        get _listTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._listTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {T[]}
         */
        get items() {
            return this.#items;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new ListData(this.#items.map(item => item._toUplcData()))
        }

        /**
         * @param {UplcData} data 
         * @returns {HList_}
         */
        static fromUplcData(data) {
            return new HList_(data.list.map(d => ItemClass.fromUplcData(d)));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {HList_}
         */
        static fromUplcCbor(bytes) {
            return HList_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HList_, "name", {
        value: typeName,
        writable: false
    });

    return HList_;
}

/**
 * @template {HeliosData} TKey
 * @template {HeliosData} TValue
 * @param {HeliosDataClass<TKey>} KeyClass 
 * @param {HeliosDataClass<TValue>} ValueClass
 * @returns {HeliosDataClass<HMap_>}
 */
export function HMap(KeyClass, ValueClass) {
    assert(!new.target, "HMap can't be called with new");
    assert(KeyClass.prototype instanceof HeliosData);
    assert(ValueClass.prototype instanceof HeliosData);
    
    const typeName = `Map[${KeyClass.name}]${ValueClass.name}`;

    class HMap_ extends HeliosData {
        /**
         * @type {[TKey, TValue][]}
         */
        #pairs;

        /**
         * @package
         * @param {...any} args
         * @returns {[any, any][]}
         */
        static cleanConstructorArgs(...args) {
            /** @type {[any, any][]} */
            let pairs = [];

            if (args.length == 1) {
                const arg = args[0];

                if (arg instanceof Map) {
                    return HMap_.cleanConstructorArgs(Array.from(arg.entries()));
                } else if (!Array.isArray(arg)) {
                    throw new Error("expected array or Map arg");
                } else {
                    const lst = arg;

                    pairs = lst.map(item => {
                        if (!Array.isArray(item)) {
                            throw new Error("expected array item (pair)");
                        } else if (item.length != 2) {
                            throw new Error("expected array item of length 2 (pair)");
                        } else {
                            return [item[0], item[1]];
                        }
                    });
                }
            } else if (args.length == 2) {
                const [keys, values] = args;

                if (!Array.isArray(keys)) {
                    throw new Error("expected keys array arg");
                } else if (!Array.isArray(values)) {
                    throw new Error("expected values array arg");
                } else if (keys.length != values.length) {
                    throw new Error("keys and values list don't have same length");
                } else {
                    pairs = keys.map((key, i) => {
                        const value = values[i];

                        return [key, value];
                    });
                }
            } else {
                throw new Error("unexpected number of args");
            }

            return pairs;
        }

        /**
         * @param  {...any} args
         */
        constructor(...args) {
            const rawPairs = HMap_.cleanConstructorArgs(...args);

            /**
             * @type {[TKey, TValue][]}
             */
            const pairs = rawPairs.map(([rawKey, rawValue]) => {
                const key = function() {
                    if (rawKey instanceof KeyClass) {
                        return rawKey;
                    } else {
                        return new KeyClass(rawKey);
                    }
                }();

                const value = function() {
                    if (rawValue instanceof ValueClass) {
                        return rawValue;
                    } else {
                        return new ValueClass(rawValue);
                    }
                }();

                return [key, value];
            });

            super();

            this.#pairs = pairs;
        }

        /**
         * @package
         * @type {string}
         */
        get _mapTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._mapTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {[TKey, TValue][]}
         */
        get pairs() {
            return this.#pairs;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new MapData(this.#pairs.map(([key, value]) => [key._toUplcData(), value._toUplcData()]));
        }

        /**
         * @param {UplcData} data 
         * @returns {HMap_}
         */
        static fromUplcData(data) {
            return new HMap_(data.map.map(([kd, vd]) => [KeyClass.fromUplcData(kd), ValueClass.fromUplcData(vd)]));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {HMap_}
         */
        static fromUplcCbor(bytes) {
            return HMap_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HMap_, "name", {
        value: typeName,
        writable: false
    });

    return HMap_;
}

/**
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} SomeClass
 * @returns {HeliosDataClass<Option_>}
 */
export function Option(SomeClass) {
    assert(!new.target, "Option can't be called with new");
    assert(SomeClass.prototype instanceof HeliosData);

    const typeName = `Option[${SomeClass.name}]`;

    class Option_ extends HeliosData {
        /**
         * @type {?T}
         */
        #value;

        /**
         * @package
         * @param {?any} rawValue 
         * @returns {?T}
         */
        static cleanConstructorArg(rawValue) {
            if (rawValue == null) {
                return null;
            } else if (!(rawValue instanceof SomeClass)) {
                return new SomeClass(rawValue);
            } else {
                return rawValue;
            }
        }

        /** 
         * @param {?any} rawValue
         */
        constructor(rawValue = null) {
            super();

            this.#value = Option_.cleanConstructorArg(rawValue);
        }

        /**
         * @package
         * @type {string}
         */
        get _optionTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._optionTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {?T}
         */
        get some() {
            return this.#value;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new ConstrData(this.#value === null ? 1 : 0, this.#value === null ? [] : [this.#value._toUplcData()]);
        }

        /**
         * @param {UplcData} data 
         * @returns {Option_}
         */
        static fromUplcData(data) {
            if (data.index == 1) {
                assert(data.fields.length == 0);

                return new Option_(null);
            } else if (data.index == 0) {
                assert(data.fields.length == 1);

                return new Option_(SomeClass.fromUplcData(data.fields[0]))
            } else {
                throw new Error("unexpected option constr index");
            }
        }

        /**
         * @param {string | number[]} bytes
         * @returns {Option_}
         */
        static fromUplcCbor(bytes) {
            return Option_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HList, "name", {
        value: typeName,
        writable: false
    });

    return Option_;
}


/**
 * Base class of all hash-types
 * @package
 */
class Hash extends HeliosData {
	/** @type {number[]} */
	#bytes;

	/**
	 * @param {string | number[]} rawValue 
	 * @returns {number[]}
	 */
	static cleanConstructorArg(rawValue) {
		if (typeof rawValue == "string") {
			return hexToBytes(rawValue);
		} else {
			return rawValue;
		}
	}

	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		super();
		this.#bytes = bytes;
	}

	/**
	 * @returns {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @returns {string}
	 */
	get hex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

	/**
	 * Used internally for metadataHash and scriptDataHash
	 * @param {number[]} bytes 
	 * @returns {Hash}
	 */
	static fromCbor(bytes) {
		return new Hash(CborData.decodeBytes(bytes));
	}

	/**
	 * Might be needed for internal use
	 * @param {string} str 
	 * @returns {Hash}
	 */
	static fromHex(str) {
		return new Hash(hexToBytes(str));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @param {Hash} other
	 */
	eq(other) {
		return eq(this.#bytes, other.#bytes);
	}

	/**
	 * @param {Hash} a 
	 * @param {Hash} b 
	 * @returns {number}
	 */
	static compare(a, b) {
		return ByteArrayData.comp(a.#bytes, b.#bytes);
	}
}

export class DatumHash extends Hash {
	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 32);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {DatumHash}
	 */
	static fromCbor(bytes) {
		return new DatumHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {DatumHash}
	 */
	 static fromUplcData(data) {
		return new DatumHash(data.bytes);
	}
	
	/**
	 * @param {string | number[]} bytes 
	 * @returns {DatumHash}
	 */
	static fromUplcCbor(bytes) {
		return DatumHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {DatumHash}
	 */
	static fromHex(str) {
		return new DatumHash(hexToBytes(str));
	}
}

export class PubKey extends HeliosData {
	#bytes;

	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
		super();
		const bytes = (typeof rawValue == "string") ? hexToBytes(rawValue) : rawValue;

		assert(bytes.length == 32, `expected 32 for PubKey, got ${bytes.length}`);
		this.#bytes = bytes;
	}

	/**
	 * @returns {PubKey}
	 */
	static dummy() {
		return new PubKey((new Array(32)).fill(0));
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
	 * @param {UplcData} data 
	 * @returns {PubKey}
	 */
	static fromUplcData(data) {
		return new PubKey(data.bytes)
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {PubKey}
	 */
	static fromCbor(bytes) {
		return new PubKey(CborData.decodeBytes(bytes));
	}

	/**
	 * @returns {boolean}
	 */
	isDummy() {
		return this.#bytes.every(b => b == 0);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

	/**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

	/**
	 * @returns {PubKeyHash}
	 */
	hash() {
		return new PubKeyHash(Crypto.blake2b(this.#bytes, 28));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return this.hex;
	}
}

export class PubKeyHash extends Hash {
	
	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 28, `expected 28 bytes for PubKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {PubKeyHash}
	 */
	static fromCbor(bytes) {
		return new PubKeyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {PubKeyHash}
	 */
	static fromUplcData(data) {
		return new PubKeyHash(data.bytes);
	}
	
	/**
	 * @param {string | number[]} bytes 
	 * @returns {PubKeyHash}
	 */
	static fromUplcCbor(bytes) {
		return PubKeyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {PubKeyHash}
	 */
	static fromHex(str) {
		return new PubKeyHash(hexToBytes(str));
	}
}

export class ScriptHash extends Hash {
	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 28, `expected 28 bytes for ScriptHash, got ${bytes.length}`);
		super(bytes);
	}
}

export class MintingPolicyHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {MintingPolicyHash}
	 */
	static fromCbor(bytes) {
		return new MintingPolicyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {MintingPolicyHash}
	 */
	static fromUplcData(data) {
		return new MintingPolicyHash(data.bytes);
	}
			
	/**
	 * @param {string | number[]} bytes 
	 * @returns {MintingPolicyHash}
	 */
	static fromUplcCbor(bytes) {
		return MintingPolicyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {MintingPolicyHash}
	 */
	static fromHex(str) {
		return new MintingPolicyHash(hexToBytes(str));
	}

	/**
	 * Encodes as bech32 string using 'asset' as human readable part
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32("asset", Crypto.blake2b(this.bytes, 20));
	}
}

export class StakeKeyHash extends Hash {
	/**
	 * @param {number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);
		
		assert(bytes.length == 28, `expected 28 bytes for StakeKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {StakeKeyHash}
	 */
	static fromCbor(bytes) {
		return new StakeKeyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {StakeKeyHash}
	 */
	static fromUplcData(data) {
		return new StakeKeyHash(data.bytes);
	}
		
	/**
	 * @param {string | number[]} bytes 
	 * @returns {StakeKeyHash}
	 */
	static fromUplcCbor(bytes) {
		return StakeKeyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {StakeKeyHash}
	 */
	static fromHex(str) {
		return new StakeKeyHash(hexToBytes(str));
	}
}

export class StakingValidatorHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {StakingValidatorHash}
	 */
	static fromCbor(bytes) {
		return new StakingValidatorHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {StakingValidatorHash}
	 */
	static fromUplcData(data) {
		return new StakingValidatorHash(data.bytes);
	}
			
	/**
	 * @param {string | number[]} bytes 
	 * @returns {StakingValidatorHash}
	 */
	static fromUplcCbor(bytes) {
		return StakingValidatorHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {StakingValidatorHash}
	 */
	static fromHex(str) {
		return new StakingValidatorHash(hexToBytes(str));
	}
}

export class ValidatorHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {ValidatorHash}
	 */
	static fromCbor(bytes) {
		return new ValidatorHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {ValidatorHash}
	 */
	static fromUplcData(data) {
		return new ValidatorHash(data.bytes);
	}
		
	/**
	 * @param {string | number[]} bytes 
	 * @returns {ValidatorHash}
	 */
	static fromUplcCbor(bytes) {
		return ValidatorHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {ValidatorHash}
	 */
	static fromHex(str) {
		return new ValidatorHash(hexToBytes(str));
	}
}

/**
 * Hash of a transaction
 */
export class TxId extends Hash {
	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
        const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 32, `expected 32 bytes for TxId, got ${bytes.length}`);
		super(bytes);
	}

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(0, [new ByteArrayData(this.bytes)]);
    }

	/**
	 * @param {number[]} bytes 
	 * @returns {TxId}
	 */
	static fromCbor(bytes) {
		return new TxId(CborData.decodeBytes(bytes));
	}

    /**
     * @param {UplcData} data
     * @returns {TxId}
     */
    static fromUplcData(data) {
        assert(data.index == 0);
        assert(data.fields.length == 1);

        return new TxId(data.fields[0].bytes);
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {TxId}
     */
    static fromUplcCbor(bytes) {
        return TxId.fromUplcData(UplcData.fromCbor(bytes));
    }

	/**
	 * @param {string} str 
	 * @returns {TxId}
	 */
	static fromHex(str) {
		return new TxId(hexToBytes(str));
	}

	/**
	 * Filled with 255 so that the internal show() function has max execution budget cost
	 * @param {number} fill
	 * @returns {TxId}
	 */
	static dummy(fill = 255) {
		return new TxId((new Array(32)).fill(fill));
	}
}

/**
 * Id of a Utxo
 */
export class TxOutputId extends HeliosData {
    /** @type {TxId} */
    #txId;

    /** @type {HInt} */
    #utxoIdx;

    /**
     * @param  {...any} args
     * @returns {[any, any]}
     */
    static cleanConstructorArgs(...args) {
        if (args.length == 1) {
            const arg = args[0];

            if (typeof arg == "string") {
                const parts = arg.split("#");

                assert(parts.length == 2);

                return [parts[0], parts[1]];
            } else {
                throw new Error("unexpected single arg type");
            }
        } else if (args.length == 2) {
            return [args[0], args[1]];
        } else {
            throw new Error("unexpected number of args");
        }
    }

    /**
     * @param {...any} args
     */
    constructor(...args) {
        const [rawTxId, rawUtxoIdx] = TxOutputId.cleanConstructorArgs(...args);

        const txId = (rawTxId instanceof TxId) ? rawTxId : new TxId(rawTxId);
        const utxoIdx = (rawUtxoIdx instanceof HInt) ? rawUtxoIdx : new HInt(rawUtxoIdx);

        super();

        this.#txId = txId;
        this.#utxoIdx = utxoIdx;
    }

    get txId() {
        return this.#txId;
    }

    get utxoIdx() {
        return this.#utxoIdx;
    }

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(0, [this.#txId._toUplcData(), this.#utxoIdx._toUplcData()])
    }

    /**
     * @param {UplcData} data
     * @returns {TxOutputId}
     */
    static fromUplcData(data) {
        assert(data.index == 0);
        assert(data.fields.length == 2);

        return new TxOutputId(TxId.fromUplcData(data.fields[0]), HInt.fromUplcData(data.fields[1]));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {TxOutputId}
     */
    static fromUplcCbor(bytes) {
        return TxOutputId.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * See CIP19 for formatting of first byte
 */
export class Address extends HeliosData {
	/** @type {number[]} */
	#bytes;

    /**
	 * @param {number[] | string} rawValue
	 * @returns {number[]}
	 */
    static cleanConstructorArg(rawValue) {
        if (typeof rawValue == "string") {
            if (rawValue.startsWith("addr")) {
                return Address.fromBech32(rawValue).bytes;
            } else {
                if (rawValue.startsWith("#")) {
                    rawValue = rawValue.slice(1);
                }

                return hexToBytes(rawValue);
            }
        } else {
            return rawValue;
        }
    }

	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		super();
		this.#bytes = Address.cleanConstructorArg(rawValue);

        assert(this.#bytes.length == 29 || this.#bytes.length == 57, `expected 29 or 57 bytes for Address, got ${this.#bytes.length}`);
	}

	get bytes() {
		return this.#bytes.slice();
	}

	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {Address}
	 */
	static fromCbor(bytes) {
		return new Address(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {string} str
	 * @returns {Address}
	 */
	static fromBech32(str) {
		// ignore the prefix (encoded in the bytes anyway)
		let [prefix, bytes] = Crypto.decodeBech32(str);

		let result = new Address(bytes);

		assert(prefix == (Address.isForTestnet(result) ? "addr_test" : "addr"), "invalid Address prefix");

		return result;
	}

	/**
	 * Doesn't check validity
	 * @param {string} hex
	 * @returns {Address}
	 */
	static fromHex(hex) {
		return new Address(hexToBytes(hex));
	}

	/**
	 * Returns the raw Address bytes as a hex encoded string
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
	}

    /**
     * @param {PubKeyHash | ValidatorHash} hash 
     * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHashes(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
        if (hash instanceof PubKeyHash) {
            return Address.fromPubKeyHash(hash, stakingHash, isTestnet);
        } else if (hash instanceof ValidatorHash) {
            return Address.fromValidatorHash(hash, stakingHash, isTestnet);
        } else {
            throw new Error("unexpected");
        }
    }

	/**
	 * Simple payment address without a staking part
	 * @param {PubKeyHash} hash
	 * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
	 * @returns {Address}
	 */
	static fromPubKeyHash(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
		if (stakingHash !== null) {
			if (stakingHash instanceof StakeKeyHash) {
				return new Address(
					[isTestnet ? 0x00 : 0x01].concat(hash.bytes).concat(stakingHash.bytes)
				);
			} else {
				assert(stakingHash instanceof StakingValidatorHash);
				return new Address(
					[isTestnet ? 0x20 : 0x21].concat(hash.bytes).concat(stakingHash.bytes)
				);
			}
		} else {
			return new Address([isTestnet ? 0x60 : 0x61].concat(hash.bytes));
		}
	}

	/**
	 * Simple script address without a staking part
	 * Only relevant for validator scripts
	 * @param {ValidatorHash} hash
	 * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
	 * @returns {Address}
	 */
	static fromValidatorHash(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
		if (stakingHash !== null) {
			if (stakingHash instanceof StakeKeyHash) {
				return new Address(
					[isTestnet ? 0x10 : 0x11].concat(hash.bytes).concat(stakingHash.bytes)
				);
			} else {
				assert(stakingHash instanceof StakingValidatorHash);
				return new Address(
					[isTestnet ? 0x30 : 0x31].concat(hash.bytes).concat(stakingHash.bytes)
				);
			}
		} else {
			return new Address([isTestnet ? 0x70 : 0x71].concat(hash.bytes));
		}
	}


	/**
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32(
			Address.isForTestnet(this) ? "addr_test" : "addr",
			this.#bytes
		);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			hex: bytesToHex(this.#bytes),
			bech32: this.toBech32(),
		};
	}

	/**
	 * @param {Address} address
	 * @returns {boolean}
	 */
	static isForTestnet(address) {
		let type = address.bytes[0] & 0b00001111;

		return type == 0;
	}

	/**
     * 
     * @private
	 * @returns {ConstrData}
	 */
	toCredentialData() {
		let vh = this.validatorHash;

		if (vh !== null) {
			return new ConstrData(1, [new ByteArrayData(vh.bytes)]);
		} else {
			let pkh = this.pubKeyHash;

			if (pkh === null) {
				throw new Error("unexpected");
			} else {
				return new ConstrData(0, [new ByteArrayData(pkh.bytes)]);
			}
		}
	}

	/**
	 * @returns {ConstrData}
	 */
	toStakingData() {
        const type = this.#bytes[0] >> 4;
		const sh = this.stakingHash;

		if (sh == null) {
			return new ConstrData(1, []); // none
		} else {
            if (type == 4 || type == 5) {
                throw new Error("not yet implemented");
            } else if (type == 3 || type == 2) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // StakingValidator credential
                        new ConstrData(1, [new ByteArrayData(sh.bytes)]),
                    ]),
                ]);
            } else if (type == 0 || type == 1) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // StakeKeyHash credential
                        new ConstrData(0, [new ByteArrayData(sh.bytes)]),
                    ]),
                ]);
            } else {
                throw new Error("unexpected");
            }
		}
	}

	/**
	 * @returns {UplcData}
	 */
	_toUplcData() {
		return new ConstrData(0, [this.toCredentialData(), this.toStakingData()]);
	}

    /**
     * @param {UplcData} data 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data, isTestnet = config.IS_TESTNET) {
        assert(data.index == 0);
        assert(data.fields.length == 2);
        
        const credData = data.fields[0];
        const stakData = data.fields[1];

        assert(credData.fields.length == 1);

        /**
         * @type {?(StakeKeyHash | StakingValidatorHash)}
         */
        let sh;

		// for some weird reason Option::None has index 1
        if (stakData.index == 1) {
            sh = null;
        } else if (stakData.index == 0) {
            assert(stakData.fields.length == 1);

            const inner = stakData.fields[0];
            assert(inner.fields.length == 1);

            if (inner.index == 0) {
                const innerInner = inner.fields[0];
                assert(innerInner.fields.length == 1);

                if (innerInner.index == 0) {
                    sh = new StakeKeyHash(innerInner.fields[0].bytes);
                } else if (innerInner.index == 1) {
                    sh = new StakingValidatorHash(innerInner.fields[0].bytes);
                } else {
                    throw new Error("unexpected");
                }
            } else if (inner.index == 1) {
                throw new Error("staking pointer not yet handled");
            } else {
                throw new Error("unexpected");
            }
        } else {
            throw new Error("unexpected");
        }

        if (credData.index == 0) {
            return Address.fromPubKeyHash(new PubKeyHash(credData.fields[0].bytes), sh, isTestnet);
        } else if (credData.index == 1) {
            return Address.fromValidatorHash(new ValidatorHash(credData.fields[0].bytes), sh, isTestnet);
        } else {
            throw new Error("unexpected");
        }
    }

    /**
     * @param {string | number[]} bytes 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcCbor(bytes, isTestnet = config.IS_TESTNET) {
        return Address.fromUplcData(UplcData.fromCbor(bytes), isTestnet);
    }

	/**
	 * @type {?PubKeyHash}
	 */
	get pubKeyHash() {
		let type = this.#bytes[0] >> 4;

		if (type % 2 == 0) {
			return new PubKeyHash(this.#bytes.slice(1, 29));
		} else {
			return null;
		}
	}

	/**
	 * @type {?ValidatorHash}
	 */
	get validatorHash() {
		let type = this.#bytes[0] >> 4;

		if (type % 2 == 1) {
			return new ValidatorHash(this.#bytes.slice(1, 29));
		} else {
			return null;
		}
	}

	/**
	 * @type {?(StakeKeyHash | StakingValidatorHash)}
	 */
	get stakingHash() {
		let type = this.#bytes[0] >> 4;

        let bytes = this.#bytes.slice(29);
        

        if (type == 0 || type == 1) {
            assert(bytes.length == 28);
            return new StakeKeyHash(bytes);
        } else if (type == 2 || type == 3) {
            assert(bytes.length == 28);
            return new StakingValidatorHash(bytes);
        } else if (type == 4 || type == 5) {
            throw new Error("staking pointer not yet supported");
        } else {
			return null;
		}
	}

	/**
	 * Used to sort txbody withdrawals
	 * @param {Address} a
	 * @param {Address} b
	 * @return {number}
	 */
	static compStakingHashes(a, b) {
		return Hash.compare(assertDefined(a.stakingHash), assertDefined(b.stakingHash));
	}
}

export class AssetClass extends HeliosData {
	/**
	 * @type {MintingPolicyHash}
	 */
	#mph;

	/**
	 * @type {number[]}
	 */
	#tokenName;

	/**
	 * @param {any[]} args
	 * @returns {[MintingPolicyHash, number[]]}
	 */
	static cleanConstructorArgs(args) {
		if (args.length == 1) {
			const arg = args[0];	

			if (typeof arg == "string") {
				const fields = arg.split(".")

				assert(fields.length == 2, "expected '.' in hex encoded AssetClass");

				return [new MintingPolicyHash(fields[0]), hexToBytes(fields[1])];
			} else {
				throw new Error("unexpected AssetClass arg type");
			}
		} else if (args.length == 2) {
			const arg0 = args[0];
			const arg1 = args[1];

			return [
				arg0 instanceof MintingPolicyHash ? arg0 : new MintingPolicyHash(arg0),
				Array.isArray(arg1) ? arg1 : hexToBytes(arg1)
			];
		} else {
			throw new Error("unexpected number of AssetClass args");
		}
	}

	/**
	 * 
	 * @param {any[]} args 
	 */
	constructor(...args) {
		super();
		const [mph, tokenName] = AssetClass.cleanConstructorArgs(args);

		this.#mph = mph;
		this.#tokenName = tokenName;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {ConstrData}
	 */
	_toUplcData() {
		return new ConstrData(0, [
			this.#mph._toUplcData(),
			new ByteArrayData(this.#tokenName)
		])
	}

	/**
	 * 
	 * @param {UplcData} data 
	 * @returns {AssetClass}
	 */
	static fromUplcData(data) {
		assert(data.index == 0);
		assert(data.fields.length == 2);

		const mph = MintingPolicyHash.fromUplcData(data.fields[0]);
		const tokenName = data.fields[1].bytes;

		return new AssetClass(mph, tokenName);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeConstr(0, [
			this.#mph.toCbor(),
			CborData.encodeBytes(this.#tokenName)
		]);
	}

	/**
	 * @param {number[]} bytes 
	 */
	static fromCbor(bytes) {
		/**
		 * @type {MintingPolicyHash | null}
		 */
		let mph = null;

		/**
		 * @type {number[] | null}
		 */
		let tokenName = null;

		const tag = CborData.decodeConstr(bytes, (i, fieldBytes) => {
			switch (i) {
				case 0:
					mph = MintingPolicyHash.fromCbor(fieldBytes);
					break;
				case 1:
					tokenName = CborData.decodeBytes(fieldBytes);
					break;
				default:
					throw new Error("unexpected field");
			} 
		});

		assert(tag == 0);

		if (mph == null || tokenName == null) {
			throw new Error("insufficient fields");
		} else {
			return new AssetClass(mph, tokenName);
		}
	}

    /**
     * @param {string | number[]} bytes
     * @returns {AssetClass}
     */
    static fromUplcCbor(bytes) {
        return AssetClass.fromUplcData(UplcData.fromCbor(bytes));
    }

	/**
	 * @type {AssetClass}
	 */
	static get ADA() {
		return new AssetClass(new MintingPolicyHash(""), "");
	}
}


/**
 * Collection of non-lovelace assets
 */
export class Assets extends CborData {
	/** @type {[MintingPolicyHash, [number[], bigint][]][]} */
	#assets;

	/**
	 * @param {[MintingPolicyHash | number[] | string, [number[] | string, bigint | number][]][]} assets 
	 */
	constructor(assets = []) {
		super();
		this.#assets = assets.map(([rawMph, tokens]) => {
			const mph = rawMph instanceof MintingPolicyHash ? rawMph : new MintingPolicyHash(rawMph);

			return [
				mph,
				tokens.map(([rawName, amount]) => {
					const name = Array.isArray(rawName) ? rawName : hexToBytes(rawName);

					return [name, BigInt(amount)];
				})
			];
		});
	}

	/**
	 * @type {MintingPolicyHash[]}
	 */
	get mintingPolicies() {
		return this.#assets.map(([mph, _]) => mph);
	}

	/**
	 * @type {number}
	 */
	get nTokenTypes() {
		let count = 0;
		
		this.#assets.forEach(([mph, tokens]) => {
			tokens.forEach(([tokenName, _]) => {
				count += 1
			})
		})

		return count;
	}

	/**
	 * Returns empty if mph not found
	 * @param {MintingPolicyHash} mph
	 * @returns {[number[], bigint][]}
	 */
	getTokens(mph) {
		const i = this.#assets.findIndex(entry => entry[0].eq(mph));

		if (i != -1) {
			return this.#assets[i][1];
		} else {
			return [];
		}
	}

	/**
	 * @returns {boolean}
	 */
	isZero() {
		return this.#assets.length == 0;
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @returns {boolean}
	 */
	has(mph, tokenName) {
		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner !== undefined) {
			return inner[1].findIndex(pair => eq(pair[0], tokenName)) != -1;
		} else {
			return false;
		}
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @returns {bigint}
	 */
	get(mph, tokenName) {
		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner !== undefined) {
			let token = inner[1].find(pair => eq(pair[0], tokenName));

			if (token !== undefined) {
				return token[1];
			} else {
				return 0n;
			}
		} else {
			return 0n;
		}
	}

	/**
	 * Mutates 'this'
	 */
	removeZeroes() {
		for (let asset of this.#assets) {
			asset[1] = asset[1].filter(token => token[1] != 0n);
		}

		this.#assets = this.#assets.filter(asset => asset[1].length != 0);
	}

	/**
	 * Mutates 'this'
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @param {bigint} quantity
	 */
	addComponent(mph, tokenName, quantity) {
		if (quantity == 0n) {
			return;
		}

		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner === undefined) {
			this.#assets.push([mph, [[tokenName, quantity]]]);
		} else {
			let token = inner[1].find(pair => eq(pair[0], tokenName));

			if (token === undefined) {
				inner[1].push([tokenName, quantity]);
			} else {
				token[1] += quantity;
			}
		}

		this.removeZeroes();
	}

	/**
	 * @param {Assets} other 
	 * @param {(a: bigint, b: bigint) => bigint} op 
	 * @returns {Assets}
	 */
	applyBinOp(other, op) {
		let res = new Assets();

		for (let [mph, tokens] of this.#assets) {
			for (let [tokenName, quantity] of tokens) {
				res.addComponent(mph, tokenName, op(quantity, 0n));
			}
		}

		for (let [mph, tokens] of other.#assets) {
			for (let [tokenName, quantity] of tokens) {
				res.addComponent(mph, tokenName, op(0n, quantity));
			}
		}

		return res;
	}

	/**
	 * @param {Assets} other 
	 * @returns {Assets}
	 */
	add(other) {
		return this.applyBinOp(other, (a, b) => a + b);
	}

	/**
	 * @param {Assets} other 
	 * @returns {Assets}
	 */
	sub(other) {
		return this.applyBinOp(other, (a, b) => a - b);
	}

	/**
	 * @param {bigint} scalar 
	 * @returns {Assets}
	 */
	mul(scalar) {
		return new Assets(this.#assets.map(([mph, tokens]) => {
			return [mph, tokens.map(([token, qty]) => [token, qty*scalar])]
		}))
	}

	/**
	 * Mutates 'this'
	 * Throws error if mph is already contained in 'this'
	 * @param {MintingPolicyHash} mph
	 * @param {[number[], bigint][]} tokens
	 */
	addTokens(mph, tokens) {
		for (let asset of this.#assets) {
			if (asset[0].eq(mph)) {
				throw new Error(`MultiAsset already contains ${bytesToHex(mph.bytes)}`);
			}
		}

		this.#assets.push([mph, tokens.slice()]);

		// sort immediately
		this.sort();
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @returns {number[][]}
	 */
	getTokenNames(mph) {
		for (let [otherMph, tokens] of this.#assets) {
			if (otherMph.eq(mph)) {
				return tokens.map(([tokenName, _]) => tokenName);
			}
		}

		return [];
	}

	/**
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	eq(other) {
		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] != other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (token[1] != this.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Strict gt, if other contains assets this one doesn't contain => return false
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	gt(other) {
		if (this.isZero()) {
			return false;
		}

		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] <= other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (!this.has(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	ge(other) {
		if (this.isZero()) {
			return other.isZero();
		}

		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] < other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (!this.has(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * @returns {boolean}
	 */
	allPositive() {
		for (let asset of this.#assets) {
			for (let pair of asset[1]) {
				if (pair[1] < 0n) {
					return false;
				} else if (pair[1] == 0n) {
					throw new Error("unexpected");
				}
			}
		}

		return true;
	}

	/**
	 * Throws an error if any contained quantity <= 0n
	 */
	assertAllPositive() {
		assert(this.allPositive(), "non-positive token amounts detected");
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeMap(
			this.#assets.map(
				outerPair => {
					return [outerPair[0].toCbor(), CborData.encodeMap(outerPair[1].map(
						innerPair => {
							return [
								CborData.encodeBytes(innerPair[0]), CborData.encodeInteger(innerPair[1])
							]
						}
					))]
				}
			)
		)
	}

	/**
	 * @param {number[]} bytes
	 * @returns {Assets}
	 */
	static fromCbor(bytes) {
		let ms = new Assets();

		CborData.decodeMap(bytes, (_, pairBytes) => {
			let mph = MintingPolicyHash.fromCbor(pairBytes);

			/**
			 * @type {[number[], bigint][]}
			 */
			let innerMap = [];
			
			CborData.decodeMap(pairBytes, (_, innerPairBytes) => {
				innerMap.push([
					CborData.decodeBytes(innerPairBytes),
					CborData.decodeInteger(innerPairBytes),
				]);
			});

			ms.#assets.push([mph, innerMap]);
		});

		return ms;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = {};

		for (let [mph, tokens] of this.#assets) {
			let innerObj = {};

			for (let [tokenName, quantity] of tokens) {
				innerObj[bytesToHex(tokenName)] = quantity.toString();
			}

			obj[mph.dump()] = innerObj;
		}

		return obj;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {MapData}
	 */
	_toUplcData() {
		/** @type {[UplcData, UplcData][]} */
		let pairs = [];

		for (let asset of this.#assets) {
			/** @type {[UplcData, UplcData][]} */
			let innerPairs = [];

			for (let token of asset[1]) {
				innerPairs.push([
					new ByteArrayData(token[0]),
					new IntData(token[1]),
				]);
			}

			pairs.push([
				new ByteArrayData(asset[0].bytes),
				new MapData(innerPairs),
			])
		}

		return new MapData(pairs);
	}

	/**
	 * Makes sure minting policies are in correct order
	 * Mutates 'this'
	 * Order of tokens per mintingPolicyHash isn't changed
	 */
	sort() {
		this.#assets.sort((a, b) => {
			return Hash.compare(a[0], b[0]);
		});
	}

	assertSorted() {
		this.#assets.forEach((b, i) => {
			if (i > 0) {
				const a = this.#assets[i-1];

				assert(Hash.compare(a[0], b[0]) == -1, "assets not sorted")
			}
		})
	}
}

export class Value extends HeliosData {
	/** @type {bigint} */
	#lovelace;

	/** @type {Assets} */
	#assets;
	
	/**
	 * @param {bigint} lovelace 
	 * @param {Assets} assets 
	 */
	constructor(lovelace = 0n, assets = new Assets()) {
		super();
		this.#lovelace = lovelace;
		this.#assets = assets;
	}

	/**
	 * @param {MintingPolicyHash} mph 
	 * @param {number[]} tokenName 
	 * @param {bigint} quantity 
	 * @returns {Value}
	 */
	static asset(mph, tokenName, quantity) {
		return new Value(0n, new Assets([
			[mph, [
				[tokenName, quantity]
			]]
		]));
	}

	/**
	 * @type {bigint}
	 */
	get lovelace() {
		return this.#lovelace;
	}

	/**
	 * Setter for lovelace
	 * Note: mutation is handy when balancing transactions
	 * @param {bigint} lovelace
	 */
	setLovelace(lovelace) {
		this.#lovelace = lovelace;
	}

	/**
	 * @type {Assets}
	 */
	get assets() {
		return this.#assets;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		if (this.#assets.isZero()) {
			return CborData.encodeInteger(this.#lovelace);
		} else {
			return CborData.encodeTuple([
				CborData.encodeInteger(this.#lovelace),
				this.#assets.toCbor()
			]);
		}
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Value}
	 */
	static fromCbor(bytes) {
		let mv = new Value();

		if (CborData.isTuple(bytes)) {
			CborData.decodeTuple(bytes, (i, fieldBytes) => {
				switch(i) {
					case 0:
						mv.#lovelace = CborData.decodeInteger(fieldBytes);
						break;
					case 1:
						mv.#assets = Assets.fromCbor(fieldBytes);
						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else {
			mv.#lovelace = CborData.decodeInteger(bytes);
		}

		return mv;
	}

	/**
	 * @param {Value[]} values 
	 * @returns {Value}
	 */
	static sum(values) {
		let s = new Value(0n);

		values.forEach(v => {
			s = s.add(v);
		});

		return s;
	}
	
	/**
	 * @param {Value} other 
	 * @returns {Value}
	 */
	add(other) {
		return new Value(this.#lovelace + other.#lovelace, this.#assets.add(other.#assets));
	}

	/**
	 * @param {Value} other 
	 * @returns {Value}
	 */
	sub(other) {
		return new Value(this.#lovelace - other.#lovelace, this.#assets.sub(other.#assets));
	}

	/**
	 * @param {bigint} scalar 
	 * @returns {Value}
	 */
	mul(scalar) {
		return new Value(this.#lovelace*scalar, this.#assets.mul(scalar))
	}

	/**
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return (this.#lovelace == other.#lovelace) && (this.#assets.eq(other.#assets));
	}

	/**
	 * Strictly greater than. Returns false if any asset is missing 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	gt(other) {
		return (this.#lovelace > other.#lovelace) && (this.#assets.gt(other.#assets));
	}

	/**
	 * Strictly >= 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	ge(other) {
		return (this.#lovelace >= other.#lovelace) && (this.#assets.ge(other.#assets));
	}

	/**
	 * Throws an error if any contained quantity is negative
	 * Used when building transactions because transactions can't contain negative values
	 * @returns {Value} - returns this
	 */
	assertAllPositive() {
		assert(this.#lovelace >= 0n);

		this.#assets.assertAllPositive();

		return this;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			lovelace: this.#lovelace.toString(),
			assets: this.#assets.dump()
		};
	}

	/**
	 * Used when building script context
	 * @param {boolean} isInScriptContext
	 * @returns {MapData}
	 */
	_toUplcData(isInScriptContext = false) {
		let map = this.#assets._toUplcData();

		if (this.#lovelace != 0n || isInScriptContext) {
			let inner = map.map; 

			inner.unshift([
				new ByteArrayData([]),
				new MapData([
					[new ByteArrayData([]), new IntData(this.#lovelace)]
				]),
			]);

			// 'inner' is copy, so mutating won't change the original
			map = new MapData(inner);
		}

		return map;
	}

	/**
	 * Useful when deserializing inline datums
	 * @param {UplcData} data
	 * @returns {Value}
	 */
	static fromUplcData(data) {
		let sum = new Value();

		let outerMap = data.map;

		for (let [mphData, tokensData] of outerMap) {
			let mphBytes = mphData.bytes;

			let innerMap = tokensData.map;

			if (mphBytes.length == 0) {
				//lovelace
				assert(innerMap.length == 1 && innerMap[0][0].bytes.length == 0); 
				sum = sum.add(new Value(innerMap[0][1].int));
			} else {
				// other assets
				let mph = new MintingPolicyHash(mphBytes);

				for (let [tokenNameData, quantityData] of innerMap) {
					let tokenName = tokenNameData.bytes;
					let quantity = quantityData.int;

					sum = sum.add(Value.asset(mph, tokenName, quantity));
				}
			}
		}

		return sum;
	}

	/**
	 * @param {string | number[]} bytes 
	 * @returns {Value}
	 */
	static fromUplcCbor(bytes) {
		return Value.fromUplcData(UplcData.fromCbor(bytes));
	}
}


//////////////////////////////
// Section 8: Uplc cost-models
//////////////////////////////

/**
 * @typedef {Object} Cost
 * @property {bigint} mem
 * @property {bigint} cpu
 */

/**
 * @typedef {() => bigint} LiveSlotGetter
 */

/**
 * NetworkParams contains all protocol parameters. These are needed to do correct, up-to-date, cost calculations.
 */
export class NetworkParams {
	#raw;

	/**
	 * Should only be set by the network emulator
	 * @type {null | LiveSlotGetter}
	 */
	#liveSlotGetter;

	/**
	 * @param {Object} raw 
	 * @param {null | LiveSlotGetter} liveSlotGetter
	 */
	constructor(raw, liveSlotGetter = null) {
		this.#raw = raw;
		this.#liveSlotGetter = liveSlotGetter;
	}

	/**
	 * @type {Object}
	 */
	get raw() {
		return this.#raw;
	}
	
	/**
	 * @type {null | bigint}
	 */
	get liveSlot() {
		if (this.#liveSlotGetter) {
			return this.#liveSlotGetter()
		} else {
			return null;
		}
	}

    /**
     * @package
     * @type {Object}
     */
	get costModel() {
		return assertDefined(this.#raw?.latestParams?.costModels?.PlutusScriptV2, "'obj.latestParams.costModels.PlutusScriptV2' undefined");
	}

	/**
     * @package
	 * @param {string} key 
	 * @returns {number}
	 */
	getCostModelParameter(key) {
		return assertNumber(this.costModel[key], `'obj.${key}' undefined`);
	}

	/**
     * @package
	 * @param {string} name 
	 * @returns {Cost}
	 */
	getTermCost(name) {
		let memKey = `cek${name}Cost-exBudgetMemory`;
		let cpuKey = `cek${name}Cost-exBudgetCPU`;

		return {
			mem: BigInt(assertNumber(this.costModel[memKey], `'obj.${memKey}' undefined`)),
			cpu: BigInt(assertNumber(this.costModel[cpuKey], `'obj.${cpuKey}' undefined`)),
		};
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreStartupCost() {
		return this.getTermCost("Startup");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreVariableCost() {
		return this.getTermCost("Var");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreLambdaCost() {
		return this.getTermCost("Lam");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreDelayCost() {
		return this.getTermCost("Delay");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreCallCost() {
		return this.getTermCost("Apply");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreConstCost() {
		return this.getTermCost("Const");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreForceCost() {
		return this.getTermCost("Force");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreBuiltinCost() {
		return this.getTermCost("Builtin");
	}

	/**
     * @package
	 * @type {[number, number]} - a + b*size
	 */
	get txFeeParams() {
		return [
			assertNumber(this.#raw?.latestParams?.txFeeFixed),
			assertNumber(this.#raw?.latestParams?.txFeePerByte),
		];
	}

	/**
     * @package
	 * @type {[number, number]} - [memFee, cpuFee]
	 */
	get exFeeParams() {
		return [
			assertNumber(this.#raw?.latestParams?.executionUnitPrices?.priceMemory),
			assertNumber(this.#raw?.latestParams?.executionUnitPrices?.priceSteps),
		];
	}
	
	/**
     * @package
	 * @type {number[]}
	 */
	get sortedCostParams() {
		let baseObj = this.#raw?.latestParams?.costModels?.PlutusScriptV2;
		let keys = Object.keys(baseObj);

		keys.sort();

		return keys.map(key => assertNumber(baseObj[key]));
	}

	/**
     * @package
	 * @type {number}
	 */
	get lovelacePerUTXOByte() {
		return assertNumber(this.#raw?.latestParams?.utxoCostPerByte);
	}

	/**
     * @package
	 * @type {number}
	 */
	get minCollateralPct() {
		return assertNumber(this.#raw?.latestParams?.collateralPercentage);
	}

	/**
     * @package
	 * @type {number}
	 */
	get maxCollateralInputs() {
		return assertNumber(this.#raw?.latestParams?.maxCollateralInputs);
	}

	/**
     * @package
	 * @type {[number, number]} - [mem, cpu]
	 */
	get maxTxExecutionBudget() {
		return [
			assertNumber(this.#raw?.latestParams?.maxTxExecutionUnits?.memory),
			assertNumber(this.#raw?.latestParams?.maxTxExecutionUnits?.steps),
		];
	}

	/**
     * @package
	 * @type {number}
	 */
	get maxTxSize() {
		return assertNumber(this.#raw?.latestParams?.maxTxSize);
	}

	/**
	 * @package
	 * @type {bigint}
	 */
	get maxTxFee() {
		const [a, b] = this.txFeeParams;
		const [feePerMem, feePerCpu] = this.exFeeParams;
		const [maxMem, maxCpu] = this.maxTxExecutionBudget;

		return BigInt(a) + BigInt(Math.ceil(b*this.maxTxSize)) + BigInt(Math.ceil(feePerMem*maxMem)) + BigInt(Math.ceil(feePerCpu*maxCpu));
	}

	/**
	 * Use the latest slot in networkParameters to determine time.
     * @package
	 * @param {bigint} slot
	 * @returns {bigint}
	 */
	slotToTime(slot) {
		let secondsPerSlot = assertNumber(this.#raw?.shelleyGenesis?.slotLength);

		let lastSlot = BigInt(assertNumber(this.#raw?.latestTip?.slot));
		let lastTime = BigInt(assertNumber(this.#raw?.latestTip?.time));

		let slotDiff = slot - lastSlot;

		return lastTime + slotDiff*BigInt(secondsPerSlot*1000);
	}

	/**
	 * Use the latest slot in network parameters to determine slot.
     * @package
	 * @param {bigint} time - milliseconds since 1970
	 * @returns {bigint}
	 */
	timeToSlot(time) {
		let secondsPerSlot = assertNumber(this.#raw?.shelleyGenesis?.slotLength);

		let lastSlot = BigInt(assertNumber(this.#raw?.latestTip?.slot));
		let lastTime = BigInt(assertNumber(this.#raw?.latestTip?.time));

		let timeDiff = time - lastTime;

		return lastSlot + BigInt(Math.round(Number(timeDiff)/(1000*secondsPerSlot)));
	}
}

/**
 * Each builtin has an associated CostModel.
 * The CostModel calculates the execution cost of a builtin, depending on the byte-size of the inputs.
 * @package
 */
class CostModel {
	constructor() {
	}

	/**
	 * @param {NetworkParams} params
	 * @param {string} baseName
	 * @returns {CostModel}
	 */
	static fromParams(params, baseName) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {number[]} args 
	 * @returns {bigint}
	 */
	calc(args) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	dump() {
		throw new Error("not yet implemented");
	}
}

/**
 * A simple constant cost, independent of arg size.
 * @package
 */
class ConstCost extends CostModel {
	#constant;

	/**
	 * @param {bigint} constant
	 */
	constructor(constant) {
		super();
		this.#constant = constant;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ConstCost}
	 */
	static fromParams(params, baseName) {
		let a = params.getCostModelParameter(`${baseName}`);

		return new ConstCost(BigInt(a));
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.#constant;
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return `const: ${this.#constant.toString()}`;
	}
}

/**
 * cost = a + b*size(arg)
 * @package
 */
class LinearCost extends CostModel {
	#a;
	#b;

	/**
	 * a + b*SizeFn(x, y)
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super();
		this.#a = a;
		this.#b = b;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {[bigint, bigint]}
	 */
	static getParams(params, baseName) {
		let a = params.getCostModelParameter(`${baseName}-intercept`);
		let b = params.getCostModelParameter(`${baseName}-slope`);

		return [BigInt(a), BigInt(b)];
	}

	/**
	 * @param  {number} size
	 * @returns {bigint}
	 */
	calcInternal(size) {
		return this.#a + this.#b*BigInt(size);
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return `intercept: ${this.#a.toString()}, slope: ${this.#b.toString()}`;
	}
}

/**
 * cost = a + b*size(args[i])
 * @package
 */
class ArgSizeCost extends LinearCost {
	#i;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {number} i - index of the arg
	 */
	constructor(a, b, i) {
		super(a, b);
		this.#i = i;
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(this.#i < args.length && this.#i >= 0);

		return this.calcInternal(args[this.#i]);
	}
}

/**
 * cost = a + b*size(arg0)
 * @package
 */
class Arg0SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 0);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg0SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg0SizeCost(a, b);
	}
}

/**
 * cost = a + b*size(arg1)
 * @package
 */
class Arg1SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 1);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg1SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg1SizeCost(a, b);
	}
}

/**
 * cost = a + b*size(arg2)
 * @package
 */
class Arg2SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 2);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg2SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg2SizeCost(a, b);
	}
}

/**
 * cost = a + b*min(args)
 * @package
 */
class MinArgSizeCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new MinArgSizeCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.calcInternal(Math.min(...args));
	}
}

/**
 * cost = a + b*max(args)
 * @package
 */
class MaxArgSizeCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new MaxArgSizeCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.calcInternal(Math.max(...args));
	}
}

/**
 * cost = a + b*sum(sizes(args))
 * @package
 */
class SumArgSizesCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new SumArgSizesCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		let sum = 0;

		for (let arg of args) {
			sum += arg;
		}

		return this.calcInternal(sum);
	}
}

/**
 * cost = a + b*max(size(arg0)-size(arg1), min)
 * (only for Uplc functions with two arguments) 
 * @package
 */
class ArgSizeDiffCost extends LinearCost {
	#min;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {number} min
	 */
	constructor(a, b, min) {
		super(a, b);
		this.#min = min
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ArgSizeDiffCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);
		let min = params.getCostModelParameter(`${baseName}-minimum`);

		return new ArgSizeDiffCost(a, b, min);
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);
		let [x, y] = args;

		return this.calcInternal(Math.max(x - y, this.#min));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, minimum: ${this.#min.toString()}`;
	}
}

/**
 * cost = (size(arg0) > size(arg1)) ? constant : a + b*size(arg0)*size(arg1)
 * (only for Uplc functions with two arguments)
 * @package
 */
class ArgSizeProdCost extends LinearCost {
	#constant;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {bigint} constant
	 */
	constructor(a, b, constant) {
		super(a, b);
		this.#constant = constant;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		const [a, b] = LinearCost.getParams(params, `${baseName}-model-arguments`);
		const constant = params.getCostModelParameter(`${baseName}-constant`);

		return new ArgSizeProdCost(a, b, BigInt(constant));
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);
		
		const [x, y] = args;

		if (x > y) {
			return this.#constant;
		} else {
			return this.calcInternal(x*y);
		}
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, constant: ${this.#constant.toString()}`;
	}
}

/**
 * cost = (size(arg0) != size(arg1)) ? constant : a + b*size(arg0)
 * (only for Uplc functions with two arguments)
 * @package
 */
class ArgSizeDiagCost extends LinearCost {
	#constant;

	/**
	 * @param {bigint} a
	 * @param {bigint} b
	 * @param {bigint} constant
	 */
	constructor(a, b, constant) {
		super(a, b);
		this.#constant = constant;
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ArgSizeDiagCost}
	 */
	static fromParams(params, baseName) {
		const [a, b] = LinearCost.getParams(params, baseName);
		const constant = params.getCostModelParameter(`${baseName}-constant`);

		return new ArgSizeDiagCost(a, b, BigInt(constant));
	}

	/**
	 * @param {number[]} args 
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);

		if (args[0] == args[1]) {
			return this.calcInternal(args[0]);
		} else {
			return this.#constant;
		}
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, constant: ${this.#constant.toString()}`;
	}
}

/**
 * @typedef CostModelClass
 * @property {(params: NetworkParams, baseName: string) => CostModel} fromParams
 */


/////////////////////////////////////
// Section 9: Uplc built-in functions
/////////////////////////////////////

/**
 * Cost-model configuration of UplcBuiltin.
 * Also specifies the number of times a builtin must be 'forced' before being callable.
 * @package
 */
 class UplcBuiltinConfig {
	#name;
	#forceCount;
	#memCostModelClass;
	#cpuCostModelClass;

	/**
	 * @param {string} name 
	 * @param {number} forceCount - number of type parameters of a Plutus-core builtin function (0, 1 or 2)
	 * @param {CostModelClass} memCostModelClass 
	 * @param {CostModelClass} cpuCostModelClass 
	 */
	constructor(name, forceCount, memCostModelClass, cpuCostModelClass) {
		this.#name = name;
		this.#forceCount = forceCount;
		this.#memCostModelClass = memCostModelClass;
		this.#cpuCostModelClass = cpuCostModelClass;
	}

	get name() {
		return this.#name;
	}

	get forceCount() {
		return this.#forceCount;
	}

	/**
	 * @param {NetworkParams} params
	 * @returns {[CostModel, CostModel]}
	 */
	instantiateCostModels(params) {
		if (this.#memCostModelClass !== null && this.#cpuCostModelClass !== null) {
			let memCostModel = this.#memCostModelClass.fromParams(params, `${this.#name}-memory-arguments`);
			let cpuCostModel = this.#cpuCostModelClass.fromParams(params, `${this.#name}-cpu-arguments`);

			return [memCostModel, cpuCostModel];
		} else {
			throw new Error(`cost model not yet implemented for builtin ${this.#name}`);
		}
	}

	/**
	 * @param {NetworkParams} params
	 * @param {number[]} argSizes
	 * @returns {Cost}
	 */
	calcCost(params, argSizes) {
		// Note: instantiating everytime might be slow. Should this be cached (eg. in the params object?)?
		const [memCostModel, cpuCostModel] = this.instantiateCostModels(params);

		const memCost = memCostModel.calc(argSizes);
		const cpuCost = cpuCostModel.calc(argSizes);

		return {mem: memCost, cpu: cpuCost};
	}

	/**
	 * @param {NetworkParams} params
	 */
	dumpCostModel(params) {
		const [memCostModel, cpuCostModel] = this.instantiateCostModels(params);

		console.log(`${this.name}-memory-arguments={${memCostModel.dump()},\n${this.name}-cpu-arguments={${cpuCostModel.dump()}}`);
	}
}

/** 
 * A list of all PlutusScript builins, with associated costmodels (actual costmodel parameters are loaded from NetworkParams during runtime)
 * @package
 * @type {UplcBuiltinConfig[]} 
 */
const UPLC_BUILTINS = (
	/**
	 * @returns {UplcBuiltinConfig[]}
	 */
	function () {
		/**
		 * Constructs a builtinInfo object
		 * @param {string} name 
		 * @param {number} forceCount 
		 * @param {CostModelClass} memCostModel
		 * @param {CostModelClass} cpuCostModel
		 * @returns {UplcBuiltinConfig}
		 */
		function builtinConfig(name, forceCount, memCostModel, cpuCostModel) {
			// builtins might need be wrapped in `force` a number of times if they are not fully typed
			return new UplcBuiltinConfig(name, forceCount, memCostModel, cpuCostModel);
		}

		return [
			builtinConfig("addInteger",               0, MaxArgSizeCost, MaxArgSizeCost), // 0
			builtinConfig("subtractInteger",          0, MaxArgSizeCost, MaxArgSizeCost),
			builtinConfig("multiplyInteger",          0, SumArgSizesCost, SumArgSizesCost),
			builtinConfig("divideInteger",            0, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("quotientInteger",          0, ArgSizeDiffCost, ArgSizeProdCost), 
			builtinConfig("remainderInteger",         0, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("modInteger",               0, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("equalsInteger",            0, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanInteger",          0, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanEqualsInteger",    0, ConstCost, MinArgSizeCost),
			builtinConfig("appendByteString",         0, SumArgSizesCost, SumArgSizesCost), // 10
			builtinConfig("consByteString",           0, SumArgSizesCost, Arg1SizeCost),
			builtinConfig("sliceByteString",          0, Arg2SizeCost, Arg2SizeCost),
			builtinConfig("lengthOfByteString",       0, ConstCost, ConstCost),
			builtinConfig("indexByteString",          0, ConstCost, ConstCost),
			builtinConfig("equalsByteString",         0, ConstCost, ArgSizeDiagCost),
			builtinConfig("lessThanByteString",       0, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanEqualsByteString", 0, ConstCost, MinArgSizeCost),
			builtinConfig("sha2_256",                 0, ConstCost, Arg0SizeCost),
			builtinConfig("sha3_256",                 0, ConstCost, Arg0SizeCost),
			builtinConfig("blake2b_256",              0, ConstCost, Arg0SizeCost), // 20
			builtinConfig("verifyEd25519Signature",   0, ConstCost, Arg2SizeCost),
			builtinConfig("appendString",             0, SumArgSizesCost, SumArgSizesCost),
			builtinConfig("equalsString",             0, ConstCost, ArgSizeDiagCost),
			builtinConfig("encodeUtf8",               0, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("decodeUtf8",               0, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("ifThenElse",               1, ConstCost, ConstCost),
			builtinConfig("chooseUnit",               1, ConstCost, ConstCost),
			builtinConfig("trace",                    1, ConstCost, ConstCost),
			builtinConfig("fstPair",                  2, ConstCost, ConstCost),
			builtinConfig("sndPair",                  2, ConstCost, ConstCost), // 30
			builtinConfig("chooseList",               2, ConstCost, ConstCost),
			builtinConfig("mkCons",                   1, ConstCost, ConstCost),
			builtinConfig("headList",                 1, ConstCost, ConstCost),
			builtinConfig("tailList",                 1, ConstCost, ConstCost),
			builtinConfig("nullList",                 1, ConstCost, ConstCost),
			builtinConfig("chooseData",               1, ConstCost, ConstCost),
			builtinConfig("constrData",               0, ConstCost, ConstCost),
			builtinConfig("mapData",                  0, ConstCost, ConstCost),
			builtinConfig("listData",                 0, ConstCost, ConstCost),
			builtinConfig("iData",                    0, ConstCost, ConstCost), // 40
			builtinConfig("bData",                    0, ConstCost, ConstCost),
			builtinConfig("unConstrData",             0, ConstCost, ConstCost),
			builtinConfig("unMapData",                0, ConstCost, ConstCost),
			builtinConfig("unListData",               0, ConstCost, ConstCost),
			builtinConfig("unIData",                  0, ConstCost, ConstCost),
			builtinConfig("unBData",                  0, ConstCost, ConstCost),
			builtinConfig("equalsData",               0, ConstCost, MinArgSizeCost),
			builtinConfig("mkPairData",               0, ConstCost, ConstCost),
			builtinConfig("mkNilData",                0, ConstCost, ConstCost),
			builtinConfig("mkNilPairData",            0, ConstCost, ConstCost), // 50
			builtinConfig("serialiseData",            0, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("verifyEcdsaSecp256k1Signature",   0, ConstCost, ConstCost), // these parameters are from aiken, but the cardano-cli parameter file differ?
			builtinConfig("verifySchnorrSecp256k1Signature", 0, ConstCost, Arg1SizeCost), // these parameters are from, but the cardano-cli parameter file differs?
		];
	}
)();

/**
 * Use this function to check cost-model parameters
 * @package
 * @param {NetworkParams} networkParams
 */
function dumpCostModels(networkParams) {
	for (let builtin of UPLC_BUILTINS) {
		builtin.dumpCostModel(networkParams);
	}
}

/**
 * Returns index of a named builtin
 * Throws an error if builtin doesn't exist
 * @param {string} name 
 * @returns 
 */
export function findUplcBuiltin(name) {
	let i = UPLC_BUILTINS.findIndex(info => { return "__core__" + info.name == name });
	assert(i != -1, `${name} is not a real builtin`);
	return i;
}

/**
 * Checks if a named builtin exists
 * @param {string} name 
 * @param {boolean} strict - if true then throws an error if builtin doesn't exist
 * @returns {boolean}
 */
export function isUplcBuiltin(name, strict = false) {
	if (name.startsWith("__core")) {
		if (strict) {
			void this.findBuiltin(name); // assert that builtin exists
		}
		return true;
	} else {
		return false;
	}
}


///////////////////////
// Section 10: Uplc AST
///////////////////////

/**
 * A Helios/Uplc Program can have different purposes
 * @package
 * @type {{
 *   Testing: number,
 * 	 Minting: number,
 *   Spending: number,
 *   Staking: number,
 *   Module: number
 * }}
 */
const ScriptPurpose = {
	Testing: -1,
	Minting:  0,
	Spending: 1,
	Staking:  2,
	Module:   3
};

/**
 * @package
 * @param {number} id
 * @returns {string}
 */
function getPurposeName(id) {
	switch (id) {
		case ScriptPurpose.Testing:
			return "testing";
		case ScriptPurpose.Minting:
			return "minting";
		case ScriptPurpose.Spending:
			return "spending";
		case ScriptPurpose.Staking:
			return "staking";
		case ScriptPurpose.Module:
			return "module";
		default:
			throw new Error(`unhandled ScriptPurpose ${id}`);
	}
}


/** 
 * a UplcValue is passed around by Plutus-core expressions.
 */
export class UplcValue {
	#site;

	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		assert(site != undefined && (site instanceof Site));
		this.#site = site;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not yet implemented");
	}

	/**
	 * Return a copy of the UplcValue at a different Site.
     * @package
	 * @param {Site} newSite 
	 * @returns {UplcValue}
	 */
	copy(newSite) {
		throw new Error("not implemented");
	}

    /**
     * @package
     * @type {Site}
     */
	get site() {
		return this.#site;
	}

	/**
	 * @package
	 * @type {number}
	 */
	get length() {
		throw new Error("not a list nor a map");
	}

	/**
	 * Size in words (8 bytes, 64 bits) occupied in target node
     * @package
	 * @type {number}
	 */
	get memSize() {
		throw new Error("not yet implemented");
	}

	/**
	 * Throws an error because most values can't be called (overridden by UplcAnon)
     * @package
	 * @param {UplcRte | UplcStack} rte 
	 * @param {Site} site 
	 * @param {UplcValue} value
	 * @returns {Promise<UplcValue>}
	 */
	async call(rte, site, value) {
		throw site.typeError(`expected a Plutus-core function, got '${this.toString()}'`);
	}

	/**
     * @package
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		return this;
	}

	/**
	 * @type {bigint}
	 */
	get int() {
		throw this.site.typeError(`expected a Plutus-core int, got '${this.toString()}'`);
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		throw this.site.typeError(`expected a Plutus-core bytearray, got '${this.toString()}'`);
	}

	/**
	 * @type {string}
	 */
	get string() {
		throw this.site.typeError(`expected a Plutus-core string, got '${this.toString()}'`);
	}
	
	/**
	 * @type {boolean}
	 */
	get bool() {
		throw this.site.typeError(`expected a Plutus-core bool, got '${this.toString()}'`);
	}

	/**
	 * Distinguishes a pair from a mapItem
	 * @returns {boolean}
	 */
	isPair() {
		return false;
	}

	/**
	 * @type {UplcValue}
	 */
	get first() {
		throw this.site.typeError(`expected a Plutus-core pair, got '${this.toString()}'`);
	}

	/**
	 * @type {UplcValue}
	 */
	get second() {
		throw this.site.typeError(`expected a Plutus-core pair, got '${this.toString()}'`);
	}

	/**
	 * Distinguishes a list from a map
	 * @returns {boolean}
	 */
	isList() {
		return false;
	}

	/**
	 * @type {UplcType}
	 */
	get itemType() {
		throw this.site.typeError("not a list");
	}

	/**
	 * @type {UplcValue[]}
	 */
	get list() {
		throw this.site.typeError(`expected a Plutus-core list, got '${this.toString()}'`);
	}

    /**
     * @returns {boolean}
     */
	isData() {
		return false;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		throw this.site.typeError(`expected Plutus-core data, got '${this.toString()}'`);
	}

	/**
     * @package
	 * @returns {Promise<UplcValue>}
	 */
	force() {
		throw this.site.typeError(`expected delayed value, got '${this.toString()}'`);
	}

	/**
     * @package
	 * @returns {UplcUnit}
	 */
	assertUnit() {
		throw this.site.typeError(`expected Plutus-core unit, got '${this.toString}'`);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
     * @package
	 * @returns {string}
	 */
	typeBits() {
		throw new Error("not yet implemented");
	}

	/**
	 * Encodes value without type header
     * @package
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		throw new Error("not yet implemented");
	}

	/**
	 * Encodes value with plutus flat encoding.
	 * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
     * @package
	 * @param {BitWriter} bitWriter
	 */
	toFlatValue(bitWriter) {
		bitWriter.write('1' + this.typeBits() + '0');
		
		this.toFlatValueInternal(bitWriter);
	}
}

export class UplcType {
	#typeBits;

	/**
	 * @param {string} typeBits 
	 */
	constructor(typeBits) {
		this.#typeBits = typeBits;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcType(
			this.#typeBits
		);
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return this.#typeBits;
	}

	/**
	 * @param {UplcValue} value 
	 * @returns {boolean}
	 */
	isSameType(value) {
		return this.#typeBits == value.typeBits();
	}

	/**
	 * @returns {boolean}
	 */
	isData() {
		return this.#typeBits == UplcType.newDataType().#typeBits;
	}

	/**
	 * @returns {boolean}
	 */
	isDataPair() {
		return this.#typeBits == UplcType.newDataPairType().#typeBits;
	}

	/**
	 * @returns {UplcType}
	 */
	static newDataType() {
		return new UplcType("1000");
	}

	/**
	 * @returns {UplcType}
	 */
	static newDataPairType() {
		return new UplcType(["0111", "0111", "0110", "1000", "1000"].join("1"));
	}

	/**
	 * @param {number[]} lst
	 * @returns {UplcType}
	 */
	static fromNumbers(lst) {
		return new UplcType(lst.map(x => byteToBitString(x, 4, false)).join("1"));
	}
}

/**
 * @package
 * @typedef {[?string, UplcValue][]} UplcRawStack
 */

/**
* @typedef {object} UplcRTECallbacks
* @property {(msg: string) => Promise<void>} [onPrint]
* @property {(site: Site, rawStack: UplcRawStack) => Promise<boolean>} [onStartCall]
* @property {(site: Site, rawStack: UplcRawStack) => Promise<void>} [onEndCall]
* @property {(name: string, isTerm: boolean, cost: Cost) => void} [onIncrCost]
*/

/**
 * @type {UplcRTECallbacks}
 */
export const DEFAULT_UPLC_RTE_CALLBACKS = {
	onPrint: async function (/** @type {string} */ msg) {return},
	onStartCall: async function(/** @type {Site} */ site, /** @type {UplcRawStack} */ rawStack) {return false},
	onEndCall: async function(/** @type {Site} */ site, /** @type {UplcRawStack} */ rawStack) {return},
	onIncrCost: function(/** @type {string} */ name, /** @type {boolean} */ isTerm, /** @type {Cost} */ cost) {return},
}

/**
 * Plutus-core Runtime Environment is used for controlling the programming evaluation (eg. by a debugger)
 * @package
 */
class UplcRte {
	#callbacks;

	#networkParams;

	/**
	 * this.onNotifyCalls is set to 'false' when the debugger is in step over-mode.
	 * @type {boolean}
	 */
	#notifyCalls;

	/**
	 * this.onNotifyCalls is set back to true if the endCall is called with the same rawStack as the marker.
	 * @type {?UplcRawStack}
	 */
	#marker;

	/**
	 * @typedef {[?string, UplcValue][]} UplcRawStack
	 */

	/**
	 * @param {UplcRTECallbacks} callbacks 
	 * @param {?NetworkParams} networkParams
	 */
	constructor(callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		assertDefined(callbacks);
		this.#callbacks = callbacks;
		this.#networkParams = networkParams;
		this.#notifyCalls = true;
		this.#marker = null;
	}

	/**
	 * @param {string} name - for breakdown
	 * @param {boolean} isTerm
	 * @param {Cost} cost 
	 */
	incrCost(name, isTerm, cost) {
		if (cost.mem <= 0n || cost.cpu <= 0n) {
			throw new Error("cost not increasing");
		}

		if (this.#callbacks.onIncrCost !== undefined) {
			this.#callbacks.onIncrCost(name, isTerm, cost);
		}
	}

	incrStartupCost() {
		if (this.#networkParams !== null) {
			this.incrCost("startup", true, this.#networkParams.plutusCoreStartupCost);
		}
	}

	incrVariableCost() {
		if (this.#networkParams !== null) {
			this.incrCost("variable", true, this.#networkParams.plutusCoreVariableCost);
		}
	}

	incrLambdaCost() {
		if (this.#networkParams !== null) {
			this.incrCost("lambda", true, this.#networkParams.plutusCoreLambdaCost);
		}
	}

	incrDelayCost() {
		if (this.#networkParams !== null) {
			this.incrCost("delay", true, this.#networkParams.plutusCoreDelayCost);
		}
	}

	incrCallCost() {
		if (this.#networkParams !== null) {
			this.incrCost("call", true, this.#networkParams.plutusCoreCallCost);
		}
	}

	incrConstCost() {
		if (this.#networkParams !== null) {
			this.incrCost("const", true, this.#networkParams.plutusCoreConstCost);
		}
	}

	incrForceCost() {
		if (this.#networkParams !== null) {
			this.incrCost("force", true, this.#networkParams.plutusCoreForceCost);
		}
	}

	incrBuiltinCost() {
		if (this.#networkParams !== null) {
			this.incrCost("builtin", true, this.#networkParams.plutusCoreBuiltinCost);
		}
	}

	/**
	 * @param {UplcBuiltin} fn
	 * @param {UplcValue[]} args
	 */
	calcAndIncrCost(fn, ...args) {
		if (this.#networkParams !== null) {
			let cost = fn.calcCost(this.#networkParams, ...args);

			this.incrCost(fn.name, false, cost);
		}
	}

	/**
	 * Gets variable using Debruijn index. Throws error here because UplcRTE is the stack root and doesn't contain any values.
	 * @param {number} i 
	 * @returns {UplcValue}
	 */
	get(i) {
		throw new Error("variable index out of range");
	}

	/**
	 * Creates a child stack.
	 * @param {UplcValue} value 
	 * @param {?string} valueName 
	 * @returns {UplcStack}
	 */
	push(value, valueName = null) {
		return new UplcStack(this, value, valueName);
	}

	/**
	 * Calls the print callback (or does nothing if print callback isn't defined)
	 * @param {string} msg 
	 * @returns {Promise<void>}
	 */
	async print(msg) {
		if (this.#callbacks.onPrint != undefined) {
			await this.#callbacks.onPrint(msg);
		}
	}

	/**
	 * Calls the onStartCall callback.
	 * @param {Site} site 
	 * @param {UplcRawStack} rawStack 
	 * @returns {Promise<void>}
	 */
	async startCall(site, rawStack) {
		if (this.#notifyCalls && this.#callbacks.onStartCall != undefined) {
			let stopNotifying = await this.#callbacks.onStartCall(site, rawStack);
			if (stopNotifying) {
				this.#notifyCalls = false;
				this.#marker = rawStack;
			}
		}
	}

	/**
	 * Calls the onEndCall callback if '#notifyCalls == true'.
	 * '#notifyCalls' is set to true if 'rawStack == #marker'.
	 * @param {Site} site 
	 * @param {UplcRawStack} rawStack 
	 * @param {UplcValue} result 
	 * @returns {Promise<void>}
	 */
	async endCall(site, rawStack, result) {
		if (!this.#notifyCalls && this.#marker == rawStack) {
			this.#notifyCalls = true;
			this.#marker = null;
		}

		if (this.#notifyCalls && this.#callbacks.onEndCall != undefined) {
			rawStack = rawStack.slice();
			rawStack.push(["__result", result]);
			await this.#callbacks.onEndCall(site, rawStack);
		}
	}

	/**
	 * @returns {UplcRawStack}
	 */
	toList() {
		return [];
	}
}

/**
 * UplcStack contains a value that can be retrieved using a Debruijn index.
 */
class UplcStack {
	#parent;
	#value;
	#valueName;

	/**
	 * @param {(?UplcStack) | UplcRte} parent
	 * @param {?UplcValue} value
	 * @param {?string} valueName
	 */
	constructor(parent, value = null, valueName = null) {
		this.#parent = parent;
		this.#value = value;
		this.#valueName = valueName;
	}

	incrStartupCost() {
		if (this.#parent !== null) {
			this.#parent.incrStartupCost()
		}
	}

	incrVariableCost() {
		if (this.#parent !== null) {
			this.#parent.incrVariableCost()
		}
	}

	incrLambdaCost() {
		if (this.#parent !== null) {
			this.#parent.incrLambdaCost()
		}
	}
	
	incrDelayCost() {
		if (this.#parent !== null) {
			this.#parent.incrDelayCost();
		}
	}

	incrCallCost() {
		if (this.#parent !== null) {
			this.#parent.incrCallCost();
		}
	}

	incrConstCost() {
		if (this.#parent !== null) {
			this.#parent.incrConstCost();
		}
	}

	incrForceCost() {
		if (this.#parent !== null) {
			this.#parent.incrForceCost()
		}
	}

	incrBuiltinCost() {
		if (this.#parent !== null) {
			this.#parent.incrBuiltinCost()
		}
	}

	/**
	 * @param {UplcBuiltin} fn
	 * @param {UplcValue[]} args
	 */
	calcAndIncrCost(fn, ...args) {
		if (this.#parent !== null) {
			this.#parent.calcAndIncrCost(fn, ...args);
		}
	}

	/**
	 * Gets a value using the Debruijn index. If 'i == 1' then the current value is returned.
	 * Otherwise 'i' is decrement and passed to the parent stack.
	 * @param {number} i 
	 * @returns {UplcValue}
	 */
	get(i) {
		i -= 1;

		if (i == 0) {
			if (this.#value === null) {
				throw new Error("Plutus-core stack value not set");
			} else {
				return this.#value;
			}
		} else {
			assert(i > 0);
			if (this.#parent === null) {
				throw new Error("variable index out of range");
			} else {
				return this.#parent.get(i);
			}
		}
	}

	/**
	 * Instantiates a child stack.
	 * @param {UplcValue} value 
	 * @param {?string} valueName 
	 * @returns {UplcStack}
	 */
	push(value, valueName = null) {
		return new UplcStack(this, value, valueName);
	}

	/**
	 * Calls the onPrint callback in the RTE (root of stack).
	 * @param {string} msg 
	 * @returns {Promise<void>}
	 */
	async print(msg) {
		if (this.#parent !== null) {
			await this.#parent.print(msg);
		}
	}

	/**
	 * Calls the onStartCall callback in the RTE (root of stack).
	 * @param {Site} site 
	 * @param {UplcRawStack} rawStack 
	 * @returns {Promise<void>}
	 */
	async startCall(site, rawStack) {
		if (this.#parent !== null) {
			await this.#parent.startCall(site, rawStack);
		}
	}

	/** 
	 * Calls the onEndCall callback in the RTE (root of stack).
	 * @param {Site} site
	 * @param {UplcRawStack} rawStack
	 * @param {UplcValue} result
	 * @returns {Promise<void>}
	*/
	async endCall(site, rawStack, result) {
		if (this.#parent !== null) {
			await this.#parent.endCall(site, rawStack, result);
		}
	}

	/** 
	 * @returns {UplcRawStack}
	*/
	toList() {
		let lst = this.#parent !== null ? this.#parent.toList() : [];
		if (this.#value !== null) {
			lst.push([this.#valueName, this.#value]);
		}
		return lst;
	}
}

/**
 * Anonymous Plutus-core function.
 * Returns a new UplcAnon whenever it is called/applied (args are 'accumulated'), except final application, when the function itself is evaluated.
 * @package
 */
class UplcAnon extends UplcValue {
	/**
	 * @typedef {(callSite: Site, subStack: UplcStack, ...args: UplcValue[]) => (UplcValue | Promise<UplcValue>)} UplcAnonCallback
	 */

	#rte;
	#nArgs;
	#argNames;

	/**
	 * Increment every time function a new argument is applied.
	 */
	#argCount;

	/**
	 * Callback that is called when function is fully applied.
	 * @type {UplcAnonCallback}
	 */
	#fn;
	#callSite;

	/**
	 * 
	 * @param {Site} site 
	 * @param {UplcRte | UplcStack} rte 
	 * @param {string[] | number} args - args can be list of argNames (for debugging), or the number of args
	 * @param {UplcAnonCallback} fn 
	 * @param {number} argCount 
	 * @param {?Site} callSite 
	 */
	constructor(site, rte, args, fn, argCount = 0, callSite = null) {
		super(site);
		assert(typeof argCount == "number");

		let nArgs = 0;
		/** @type {?string[]} */
		let argNames = null;
		if ((typeof args != 'number')) {
			if (args instanceof Array) {
				nArgs = args.length;
				argNames = args;
			} else {
				throw new Error("not an Array");
			}
		} else {
			nArgs = args;
		}

		assert(nArgs >= 1);

		this.#rte = rte;
		this.#nArgs = nArgs;
		this.#argNames = argNames;
		this.#argCount = argCount;
		this.#fn = fn;
		this.#callSite = callSite;
	}

	/**
	 * Should never be part of the uplc ast
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not expected to be part of uplc ast");
	}

	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcAnon}
	 */
	copy(newSite) {
		return new UplcAnon(
			newSite,
			this.#rte,
			this.#argNames !== null ? this.#argNames : this.#nArgs,
			this.#fn,
			this.#argCount,
			this.#callSite,
		);
	}

	/**
	 * @param {Site} callSite
	 * @param {UplcStack} subStack
	 * @param {UplcValue[]} args
	 * @returns {UplcValue | Promise<UplcValue>}
	 */
	callSync(callSite, subStack, args) {
		return this.#fn(callSite, subStack, ...args);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @param {Site} site 
	 * @param {UplcValue} value 
	 * @returns {Promise<UplcValue>}
	 */
	async call(rte, site, value) {
		assert(site != undefined && site instanceof Site);

		let subStack = this.#rte.push(value, this.#argNames !== null ? this.#argNames[this.#argCount] : null); // this is the only place where the stack grows
		let argCount = this.#argCount + 1;
		let callSite = this.#callSite !== null ? this.#callSite : site;

		// function is fully applied, collect the args and call the callback
		if (argCount == this.#nArgs) {
			/** @type {UplcValue[]} */
			let args = [];

			let rawStack = rte.toList(); // use the RTE of the callsite

			for (let i = this.#nArgs; i >= 1; i--) {
				let argValue = subStack.get(i);
				args.push(argValue);
				rawStack.push([`__arg${this.#nArgs - i}`, argValue]);
			}

			// notify the RTE of the new live stack (list of pairs instead of UplcStack), and await permission to continue
			await this.#rte.startCall(callSite, rawStack);

			try {
				let result = this.callSync(callSite, subStack, args);

				if (result instanceof Promise) {
					result = await result;
				}
	
				// the same rawStack object can be used as a marker for 'Step-Over' in the debugger
				await this.#rte.endCall(callSite, rawStack, result);
	
				return result.copy(callSite);
			} catch(e) {
				// TODO: better trace
				if (e instanceof RuntimeError) {
					e = e.addTraceSite(callSite);
				}

				throw e;
			}
		} else {
			// function isn't yet fully applied, return a new partially applied UplcAnon
			assert(this.#nArgs > 1);

			return new UplcAnon(
				callSite,
				subStack,
				this.#argNames !== null ? this.#argNames : this.#nArgs,
				this.#fn,
				argCount,
				callSite,
			);
		}
	}

	toString() {
		if (this.#argNames !== null) {
			return `fn(${this.#argNames.join(", ")})`;
		} else {
			return "fn";
		}
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		throw new Error("a UplcAnon value doesn't have a literal representation");
	}

	/**
	 * Encodes value with plutus flat encoding.
	 * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
	 * @param {BitWriter} bitWriter
	 */
	toFlatValue(bitWriter) {
		throw new Error("a UplcAnon value doesn't have a literal representation");
	}
}

/**
 * @package
 */
class UplcDelayedValue extends UplcValue {
	#evaluator;

	/**
	 * @param {Site} site
	 * @param {() => (UplcValue | Promise<UplcValue>)} evaluator
	 */
	constructor(site, evaluator) {
		super(site);
		this.#evaluator = evaluator;
	}

	/**
	 * Should never be part of ast
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not expected to be part of uplc ast");
	}

	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcValue}
	 */
	copy(newSite) {
		return new UplcDelayedValue(newSite, this.#evaluator);
	}

	/**
	 * @return {Promise<UplcValue>}
	 */
	force() {
		let res = this.#evaluator();

		if (res instanceof Promise) {
			return res;
		} else {
			return new Promise((resolve, _) => {
				resolve(res);
			});
		}
	}

	toString() {
		return `delay`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		throw new Error("a UplcDelayedValue value doesn't have a literal representation");
	}

	/**
	 * Encodes value with plutus flat encoding.
	 * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
	 * @param {BitWriter} bitWriter
	 */
	toFlatValue(bitWriter) {
		throw new Error("a UplcDelayedValue value doesn't have a literal representation");
	}
}

/**
 * Plutus-core Integer class
 */
export class UplcInt extends UplcValue {
	#value;
	#signed;

	/**
	 * @param {Site} site
	 * @param {bigint} value - supposed to be arbitrary precision
	 * @param {boolean} signed - unsigned is only for internal use
	 */
	constructor(site, value, signed = true) {
		super(site);
		assert(typeof value == 'bigint', "not a bigint");
		this.#value = value;
		this.#signed = signed;
	}

	/**
	 * Constructs a UplcInt without requiring a Site
	 * @param {bigint | number} value
	 * @returns {UplcInt} 
	 */
	static new(value) {
		if (typeof value == 'number') {
			assert(value % 1.0 == 0.0, "must be whole number");
			return new UplcInt(Site.dummy(), BigInt(value));
		} else {
			return new UplcInt(Site.dummy(), value);
		}
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcInt(
			this.site.transfer(other),
			this.#value,
			this.#signed
		);
	}

	get signed() {
		return this.#signed;
	}

	/**
	 * Creates a UplcInt wrapped in a UplcConst, so it can be used a term
	 * @param {Site} site 
	 * @param {bigint} value 
	 * @returns 
	 */
	static newSignedTerm(site, value) {
		return new UplcConst(new UplcInt(site, value, true));
	}

	/**
	 * @type {number}
	 */
	get memSize() {
        return IntData.memSizeInternal(this.#value);
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcInt}
	 */
	copy(newSite) {
		return new UplcInt(newSite, this.#value, this.#signed);
	}

	/**
	 * @type {bigint}
	 */
	get int() {
		return this.#value;
	}

	/**
	 * Parses a single byte in the Plutus-core byte-list representation of an int
	 * @param {number} b 
	 * @returns {number}
	 */
	static parseRawByte(b) {
		return b & 0b01111111;
	}

	/**
	 * Returns true if 'b' is the last byte in the Plutus-core byte-list representation of an int.
	 * @param {number} b 
	 * @returns {boolean}
	 */
	static rawByteIsLast(b) {
		return (b & 0b10000000) == 0;
	}

	/**
	 * Combines a list of Plutus-core bytes into a bigint (leading bit of each byte is ignored).
     * Differs from bytesToBigInt in utils.js because only 7 bits are used from each byte.
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	static bytesToBigInt(bytes) {
		let value = BigInt(0);

		let n = bytes.length;

		for (let i = 0; i < n; i++) {
			let b = bytes[i];

			// 7 (not 8), because leading bit isn't used here
			value = value + BigInt(b) * ipow2(BigInt(i) * 7n);
		}

		return value;
	}

	/**
	 * Applies zigzag encoding
	 * @example
	 * (new UplcInt(Site.dummy(), -1n, true)).toUnsigned().int => 1n
	 * @example
	 * (new UplcInt(Site.dummy(), -1n, true)).toUnsigned().toSigned().int => -1n
	 * @example
	 * (new UplcInt(Site.dummy(), -2n, true)).toUnsigned().toSigned().int => -2n
	 * @example
	 * (new UplcInt(Site.dummy(), -3n, true)).toUnsigned().toSigned().int => -3n
	 * @example
	 * (new UplcInt(Site.dummy(), -4n, true)).toUnsigned().toSigned().int => -4n
	 * @returns {UplcInt}
	 */
	toUnsigned() {
		if (this.#signed) {
			if (this.#value < 0n) {
				return new UplcInt(this.site, -this.#value*2n - 1n, false);
			} else {
				return new UplcInt(this.site, this.#value * 2n, false);
			}
		} else {
			return this;
		}
	}

	/** 
	 * Unapplies zigzag encoding 
	 * @example
	 * (new UplcInt(Site.dummy(), 1n, false)).toSigned().int => -1n
	 * @returns {UplcInt}
	*/
	toSigned() {
		if (this.#signed) {
			return this;
		} else {
			if (this.#value % 2n == 0n) {
				return new UplcInt(this.site, this.#value / 2n, true);
			} else {
				return new UplcInt(this.site, -(this.#value + 1n) / 2n, true);
			}
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatInternal(bitWriter) {
		let zigzag = this.toUnsigned();
		let bitString = padZeroes(zigzag.#value.toString(2), 7);

		// split every 7th
		let parts = [];
		for (let i = 0; i < bitString.length; i += 7) {
			parts.push(bitString.slice(i, i + 7));
		}

		// reverse the parts
		parts.reverse();

		for (let i = 0; i < parts.length; i++) {
			if (i == parts.length - 1) {
				// last
				bitWriter.write('0' + parts[i]);
			} else {
				bitWriter.write('1' + parts[i]);
			}
		}
	}

	/**
	 * Encodes unsigned integer with plutus flat encoding.
	 * Throws error if signed.
	 * Used by encoding plutus core program version and debruijn indices.
	 * @param {BitWriter} bitWriter 
	 */
	toFlatUnsigned(bitWriter) {
		assert(!this.#signed);

		this.toFlatInternal(bitWriter);
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0000";
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlatValueInternal(bitWriter) {
		assert(this.#signed);

		this.toFlatInternal(bitWriter);
	}
}

/**
 * Plutus-core ByteArray value class
 * Wraps a regular list of uint8 numbers (so not Uint8Array)
 */
export class UplcByteArray extends UplcValue {
	#bytes;

	/**
	 * @param {Site} site
	 * @param {number[]} bytes
	 */
	constructor(site, bytes) {
		super(site);
		assert(bytes != undefined);
		this.#bytes = bytes;
		for (let b of this.#bytes) {
			assert(typeof b == 'number');
		}
	}

	/**
	 * Construct a UplcByteArray without requiring a Site
	 * @param {number[]} bytes 
	 * @returns {UplcByteArray}
	 */
	static new(bytes) {
		return new UplcByteArray(Site.dummy(), bytes);
	}

	/**
	 * Creates new UplcByteArray wrapped in UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {number[]} bytes 
	 * @returns 
	 */
	static newTerm(site, bytes) {
		return new UplcConst(new UplcByteArray(site, bytes));
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcByteArray(
			this.site.transfer(other),
			this.#bytes
		)
	}

	/**
	 * @type {number}
	 */
	get memSize() {
        return ByteArrayData.memSizeInternal(this.#bytes);
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcByteArray}
	 */
	copy(newSite) {
		return new UplcByteArray(newSite, this.#bytes);
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes.slice();
	}

	/**
	 * Returns hex representation of byte array
	 * @returns {string}
	 */
	toString() {
		return `#${bytesToHex(this.#bytes)}`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0001";
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		UplcByteArray.writeBytes(bitWriter, this.#bytes);
	}

	/**
	 * Write a list of bytes to the bitWriter using flat encoding.
	 * Used by UplcString, UplcByteArray and UplcDataValue
	 * Equivalent to E_B* function in Plutus-core docs
	 * @param {BitWriter} bitWriter 
	 * @param {number[]} bytes 
	 */
	static writeBytes(bitWriter, bytes) {
		bitWriter.padToByteBoundary(true);

		// the rest of this function is equivalent to E_C* function in Plutus-core docs
		let n = bytes.length;
		let pos = 0;

		// write chunks of 255
		while (pos < n) {
			// each iteration is equivalent to E_C function in Plutus-core docs

			let nChunk = Math.min(n - pos, 255);

			// equivalent to E_8 function in Plutus-core docs
			bitWriter.write(padZeroes(nChunk.toString(2), 8));

			for (let i = pos; i < pos + nChunk; i++) {
				let b = bytes[i];

				// equivalent to E_8 function in Plutus-core docs
				bitWriter.write(padZeroes(b.toString(2), 8));
			}

			pos += nChunk;
		}

		bitWriter.write('00000000');
	}
}

/**
 * Plutus-core string value class
 */
export class UplcString extends UplcValue {
	#value;

	/**
	 * @param {Site} site 
	 * @param {string} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	/**
	 * Constructs a UplcStrin without requiring a Site
	 * @param {string} value 
	 * @returns {UplcString}
	 */
	static new(value) {
		return new UplcString(Site.dummy(), value);
	}

	/**
	 * Creates a new UplcString wrapped with UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {string} value 
	 * @returns {UplcConst}
	 */
	static newTerm(site, value) {
		return new UplcConst(new UplcString(site, value));
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcString(
			this.site.transfer(other),
			this.#value
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#value.length;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcString}
	 */
	copy(newSite) {
		return new UplcString(newSite, this.#value);
	}

	/**
	 * @type {string}
	 */
	get string() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `"${this.#value}"`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0010";
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		let bytes = Array.from((new TextEncoder()).encode(this.#value));

		UplcByteArray.writeBytes(bitWriter, bytes);
	}
}

/**
 * Plutus-core unit value class
 */
export class UplcUnit extends UplcValue {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * Constructs a UplcUnit without requiring a Site
	 * @returns {UplcUnit}
	 */
	static new () {
		return new UplcUnit(Site.dummy());
	}

	/**
	 * Creates a new UplcUnit wrapped with UplcConst so it can be used as a term
	 * @param {Site} site 
	 * @returns {UplcConst}
	 */
	static newTerm(site) {
		return new UplcConst(new UplcUnit(site));
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcUnit(
			this.site.transfer(other)
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcUnit}
	 */
	copy(newSite) {
		return new UplcUnit(newSite);
	}

	toString() {
		return "()";
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0011";
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
	}

	/**
	 * @returns {UplcUnit}
	 */
	assertUnit() {
		return this;
	}
}

/**
 * Plutus-core boolean value class
 */
export class UplcBool extends UplcValue {
	#value;

	/**
	 * @param {Site} site 
	 * @param {boolean} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	/**
	 * Constructs a UplcBool without requiring a Site
	 * @param {boolean} value 
	 * @returns {UplcBool}
	 */
	static new(value) {
		return new UplcBool(Site.dummy(), value);
	}

	/**
	 * Creates a new UplcBool wrapped with UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {boolean} value 
	 * @returns {UplcConst}
	 */
	static newTerm(site, value) {
		return new UplcConst(new UplcBool(site, value));
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcBool(
			this.site.transfer(other),
			this.#value
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcBool}
	 */
	copy(newSite) {
		return new UplcBool(newSite, this.#value);
	}

	/**
	 * @type {boolean}
	 */
	get bool() {
		return this.#value;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return new ConstrData(this.#value ? 1 : 0, []);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value ? "true" : "false";
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return '0100';
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		if (this.#value) {
			bitWriter.write('1');
		} else {
			bitWriter.write('0');
		}
	}
}

/**
 * Plutus-core pair value class
 * Can contain any other value type.
 */
export class UplcPair extends UplcValue {
	#first;
	#second;

	/**
	 * @param {Site} site
	 * @param {UplcValue} first
	 * @param {UplcValue} second
	 */
	constructor(site, first, second) {
		super(site);
		this.#first = first;
		this.#second = second;
	}

	/**
	 * Constructs a UplcPair without requiring a Site
	 * @param {UplcValue} first 
	 * @param {UplcValue} second 
	 * @returns {UplcPair}
	 */
	static new(first, second) {
		return new UplcPair(Site.dummy(), first, second);
	}

	/**
	 * Creates a new UplcBool wrapped with UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {UplcValue} first
	 * @param {UplcValue} second
	 * @returns {UplcConst}
	 */
	static newTerm(site, first, second) {
		return new UplcConst(new UplcPair(site, first, second));
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcPair(
			this.site.transfer(other),
			this.#first.transfer(other),
			this.#second.transfer(other)
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#first.memSize + this.#second.memSize;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcPair}
	 */
	copy(newSite) {
		return new UplcPair(newSite, this.#first, this.#second);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#first.toString()}, ${this.#second.toString()})`;
	}

	/**
	 * @returns {boolean}
	 */
	isPair() {
		return true;
	}

	/**
	 * @type {UplcValue}
	 */
	get first() {
		return this.#first;
	}

	/**
	 * @type {UplcValue}
	 */
	get second() {
		return this.#second;
	}

	/**
	 * @type {UplcData}
	 */
	get key() {
		return this.#first.data;
	}

	/**
	 * @type {UplcData}
	 */
	get value() {
		return this.#second.data;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		// 7 (7 (6) (fst)) (snd)
		return ["0111", "0111", "0110", this.#first.typeBits(), this.#second.typeBits()].join("1");
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		this.#first.toFlatValueInternal(bitWriter);
		this.#second.toFlatValueInternal(bitWriter);
	}
}

/** 
 * Plutus-core list value class.
 * Only used during evaluation.
*/
export class UplcList extends UplcValue {
	#itemType;
	#items;

	/**
	 * @param {Site} site 
	 * @param {UplcType} itemType 
	 * @param {UplcValue[]} items 
	 */
	constructor(site, itemType, items) {
		super(site);
		this.#itemType = itemType;
		this.#items = items;
	}

	/**
	 * Constructs a UplcList without requiring a Site
	 * @param {UplcType} type 
	 * @param {UplcValue[]} items 
	 */
	static new(type, items) {
		return new UplcList(Site.dummy(), type, items);
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcList(
			this.site.transfer(other),
			this.#itemType.transfer(other),
			this.#items.map(item => item.transfer(other))
		);
	}

	/**
	 * @type {number}
	 */
	get length() {
		return this.#items.length;
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		let sum = 0;

		for (let item of this.#items) {
			sum += item.copy(this.site).memSize;
		}

		return sum;
	}

	/**
	 * @type {UplcType}
	 */
	get itemType() {
		return this.#itemType;
	}

	/**
	 * @param {Site} newSite
	 * @returns {UplcList}
	 */
	copy(newSite) {
		return new UplcList(newSite, this.#itemType, this.#items.slice());
	}

	/**
	 * @returns {boolean}
	 */
	isList() {
		return true;
	}

	/**
	 * @type {UplcValue[]}
	 */
	get list() {
		return this.#items.slice();
	}

	/**
	 * @returns {boolean}
	 */
	isDataList() {
		return this.#itemType.isData();
	}
	
	/**
	 * @returns {boolean}
	 */
	isDataMap() {
		return this.#itemType.isDataPair();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[${this.#items.map(item => item.toString()).join(", ")}]`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		// 7 (5) (type bits of content)
		return ["0111", "0101", this.#itemType.typeBits()].join("1");
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlatValueInternal(bitWriter) {
		for (let item of this.#items) {
			bitWriter.write('1');

			item.copy(this.site).toFlatValueInternal(bitWriter);
		}

		bitWriter.write('0');
	}
}

/**
 * Wrapper for UplcData.
 */
export class UplcDataValue extends UplcValue {
	#data;

	/**
	 * @param {Site} site 
	 * @param {UplcData} data 
	 */
	constructor(site, data) {
		super(site);
		this.#data = assertDefined(data);
		assert(data instanceof UplcData);
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcDataValue(
			this.site.transfer(other),
			this.#data.transfer(other)
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#data.memSize;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcDataValue}
	 */
	copy(newSite) {
		return new UplcDataValue(newSite, this.#data);
	}

	/**
	 * @returns {boolean}
	 */
	isData() {
		return true;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `data(${this.#data.toString()})`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return UplcType.newDataType().typeBits();
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		UplcByteArray.writeBytes(bitWriter, this.#data.toCbor());
	}

	/**
	 * @param {UplcDataValue | UplcData} data 
	 * @returns {UplcData}
	 */
	static unwrap(data) {
		if (data instanceof UplcDataValue) {
			return data.data;
		} else {
			return data;
		}
	}
}

/**
 * Base class of Plutus-core terms
 * @package
 */
class UplcTerm {
	#site;
	#type;

	/**
	 * @param {Site} site
	 * @param {number} type
	 */
	constructor(site, type) {
		assert(site != undefined && site instanceof Site);
		this.#site = site;
		this.#type = type;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#site;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not yet implemented");
	}

	/**
	 * Generic term toString method
	 * @returns {string}
	 */
	toString() {
		return `(Term ${this.#type.toString()})`;
	}

	/**
	 * Calculates a value, and also increments the cost
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		throw new Error("not yet implemented");
	}

	/**
	 * Writes bits of flat encoded Plutus-core terms to bitWriter. Doesn't return anything.
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		throw new Error("not yet implemented");
	}
}

/**
 * Plutus-core variable ref term (index is a Debruijn index)
 * @package
 */
class UplcVariable extends UplcTerm {
	#index;

	/**
	 * @param {Site} site 
	 * @param {UplcInt} index 
	 */
	constructor(site, index) {
		super(site, 0);
		this.#index = index;
	}

	/**
	 * @param {TransferUplcAst} other 
	 */
	transfer(other) {
		return other.transferUplcVariable(
			this.site.transfer(other),
			this.#index.transfer(other)
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `x${this.#index.toString()}`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0000');
		this.#index.toFlatUnsigned(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		// add costs before get the value
		rte.incrVariableCost();

		return rte.get(Number(this.#index.int));
	}
}

/**
 * Plutus-core delay term.
 * @package
 */
class UplcDelay extends UplcTerm {
	#expr;

	/**
	 * @param {Site} site 
	 * @param {UplcTerm} expr 
	 */
	constructor(site, expr) {
		super(site, 1);
		this.#expr = expr;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcDelay(
			this.site.transfer(other),
			this.#expr.transfer(other)
		);
	}

	/**
	 * @returns {string} 
	 */
	toString() {
		return `(delay ${this.#expr.toString()})`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0001');
		this.#expr.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrDelayCost();

		return new UplcDelayedValue(this.site, () =>  this.#expr.eval(rte));
	}
}

/**
 * Plutus-core lambda term
 * @package
 */
class UplcLambda extends UplcTerm {
	#rhs;
	#argName;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} rhs
	 * @param {null | string} argName
	 */
	constructor(site, rhs, argName = null) {
		super(site, 2);
		this.#rhs = rhs;
		this.#argName = argName;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcLambda(
			this.site.transfer(other),
			this.#rhs.transfer(other),
			this.#argName
		);
	}

	/**
	 * Returns string with unicode lambda symbol
	 * @returns {string}
	 */
	toString() {
		return `(\u039b${this.#argName !== null ? " " + this.#argName + " ->" : ""} ${this.#rhs.toString()})`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0010');
		this.#rhs.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrLambdaCost();

		return new UplcAnon(this.site, rte, this.#argName !== null ? [this.#argName] : 1, (callSite, subStack) => {
			return this.#rhs.eval(subStack);
		});
	}
}

/**
 * Plutus-core function application term (i.e. function call)
 * @package
 */
class UplcCall extends UplcTerm {
	#a;
	#b;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} a
	 * @param {UplcTerm} b
	 */
	constructor(site, a, b) {
		super(site, 3);
		this.#a = a;
		this.#b = b;
	}

	/**
	 * @param {TransferUplcAst} other
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcCall(
			this.site.transfer(other),
			this.#a.transfer(other),
			this.#b.transfer(other)
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[${this.#a.toString()} ${this.#b.toString()}]`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0011');
		this.#a.toFlat(bitWriter);
		this.#b.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns 
	 */
	async eval(rte) {
		rte.incrCallCost();

		let fn = await this.#a.eval(rte);
		let arg = await this.#b.eval(rte);

		return await fn.call(rte, this.site, arg);
	}
}

/**
 * Plutus-core const term (i.e. a literal in conventional sense)
 * @package
 */
class UplcConst extends UplcTerm {
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super(value.site, 4);

		this.#value = value;

		if (value instanceof UplcInt) {
			assert(value.signed);
		}
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcConst(
			this.#value.transfer(other)
		);
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0100');
		this.#value.toFlatValue(bitWriter);
	}

	/**
	 * @param {UplcStack | UplcRte} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrConstCost();

		return await this.#value.eval(rte);
	}
}

/**
 * Plutus-core force term
 * @package
 */
class UplcForce extends UplcTerm {
	#expr;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} expr
	 */
	constructor(site, expr) {
		super(site, 5);
		this.#expr = expr;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcForce(
			this.site.transfer(other),
			this.#expr.transfer(other)
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(force ${this.#expr.toString()})`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0101');
		this.#expr.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrForceCost();

		return await (await this.#expr.eval(rte)).force();
	}
}

/**
 * Plutus-core error term
 * @package
 */
class UplcError extends UplcTerm {
	/** 'msg' is only used for debuggin and doesn't actually appear in the final program */
	#msg;

	/**
	 * @param {Site} site 
	 * @param {string} msg 
	 */
	constructor(site, msg = "") {
		super(site, 6);
		this.#msg = msg;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcError(
			this.site.transfer(other),
			this.#msg
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "(error)";
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0110');
	}

	/**
	 * Throws a RuntimeError when evaluated.
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		throw this.site.runtimeError(this.#msg);
	}
}

/**
 * Plutus-core builtin function ref term
 * @package
 */
class UplcBuiltin extends UplcTerm {
	/** unknown builtins stay integers */
	#name;

	/**
	 * @param {Site} site 
	 * @param {string | number} name 
	 */
	constructor(site, name) {
		super(site, 7);
		this.#name = name;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcBuiltin(
			this.site.transfer(other),
			this.#name
		);
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.toString();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (typeof this.#name == "string") {
			return `(builtin ${this.#name})`;
		} else {
			return `(builtin unknown${this.#name.toString()})`;
		}
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0111');

		/** @type {number} */
		let i;

		if (typeof this.#name == "string") {
			i = UPLC_BUILTINS.findIndex(info => info.name == this.#name);
		} else {
			i = this.#name;
		}

		let bitString = padZeroes(i.toString(2), 7);

		bitWriter.write(bitString);
	}

	/**
	 * @param {NetworkParams} params
	 * @param  {...UplcValue} args
	 * @returns {Cost}
	 */
	calcCost(params, ...args) {
		let i = UPLC_BUILTINS.findIndex(info => info.name == this.#name);

		let argSizes = args.map(a => a.memSize);

		if (!argSizes.every(size => !Number.isNaN(size) && size >= 0)) {
			throw new Error("invalid arg size");
		}

		return UPLC_BUILTINS[i].calcCost(params, argSizes);
	}

	/**
	 * Used by IRCoreCallExpr
	 * @param {Word} name
	 * @param {UplcValue[]} args
	 * @returns {UplcValue}
	 */
	static evalStatic(name, args) {
		let builtin = new UplcBuiltin(name.site, name.value);

		let dummyRte = new UplcRte();

		let anon = builtin.evalInternal(dummyRte);

		let subStack = new UplcStack(dummyRte);

		let res = anon.callSync(name.site, subStack, args);

		if (res instanceof Promise) {
			throw new Error("can't call trace through evalStatic");
		} else {
			return res;
		}
	}

	/**
	 * @param {UplcRte | UplcStack} rte
	 * @returns {UplcAnon}
	 */
	evalInternal(rte = new UplcRte()) {
		if (typeof this.#name == "number") {
			throw new Error("can't evaluate unknown Plutus-core builtin");
		}

		switch (this.#name) {
			case "addInteger":
				// returning a lambda is assumed to be free
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					// but calling a lambda has a cost associated
					rte.calcAndIncrCost(this, a, b);

					return new UplcInt(callSite, a.int + b.int);
				});
			case "subtractInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcInt(callSite, a.int - b.int);
				});
			case "multiplyInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcInt(callSite, a.int * b.int);
				});
			case "divideInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (b.int === 0n) {
						throw callSite.runtimeError("division by zero");
					} else {
						return new UplcInt(callSite, a.int / b.int);
					}
				});
			case "modInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (b.int === 0n) {
						throw callSite.runtimeError("division by zero");
					} else {
						return new UplcInt(callSite, a.int % b.int);
					}
				});
			case "equalsInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.int == b.int);
				});
			case "lessThanInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.int < b.int);
				});
			case "lessThanEqualsInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.int <= b.int);
				});
			case "appendByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcByteArray(callSite, a.bytes.concat(b.bytes));
				});
			case "consByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					let bytes = b.bytes;
					bytes.unshift(Number(a.int % 256n));
					return new UplcByteArray(callSite, bytes);
				});
			case "sliceByteString":
				return new UplcAnon(this.site, rte, 3, (callSite, _, a, b, c) => {
					rte.calcAndIncrCost(this, a, b, c);

					let start = Number(a.int);
					let n = Number(b.int);
					let bytes = c.bytes;
					if (start < 0) {
						start = 0;
					}

					if (start + n > bytes.length) {
						n = bytes.length - start;
					}

					if (n < 0) {
						n = 0;
					}

					let sub = bytes.slice(start, start + n);

					return new UplcByteArray(callSite, sub);
				});
			case "lengthOfByteString":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcInt(callSite, BigInt(a.bytes.length));
				});
			case "indexByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					let bytes = a.bytes;
					let i = b.int;
					if (i < 0 || i >= bytes.length) {
						throw new Error("index out of range");
					}

					return new UplcInt(callSite, BigInt(bytes[Number(i)]));
				});
			case "equalsByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, ByteArrayData.comp(a.bytes, b.bytes) == 0);
				});
			case "lessThanByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, ByteArrayData.comp(a.bytes, b.bytes) == -1);
				});
			case "lessThanEqualsByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, ByteArrayData.comp(a.bytes, b.bytes) <= 0);
				});
			case "appendString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcString(callSite, a.string + b.string);
				});
			case "equalsString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.string == b.string);
				});
			case "encodeUtf8":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, textToBytes(a.string));
				});
			case "decodeUtf8":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					try {
						return new UplcString(callSite, bytesToText(a.bytes));
					} catch(_) {
						throw callSite.runtimeError("invalid utf-8");
					}
				});
			case "sha2_256":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, Crypto.sha2_256(a.bytes))
				});
			case "sha3_256":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, Crypto.sha3(a.bytes))
				});
			case "blake2b_256":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, Crypto.blake2b(a.bytes)); 
				});
			case "verifyEd25519Signature":
				return new UplcAnon(this.site, rte, 3, (callSite, _, key, msg, signature) => {
					rte.calcAndIncrCost(this, key, msg, signature);

					let keyBytes = key.bytes;
					if (keyBytes.length != 32) {
						throw callSite.runtimeError(`expected key of length 32 for verifyEd25519Signature, got key of length ${keyBytes.length}`);
					}

					let msgBytes = msg.bytes;
					
					let signatureBytes = signature.bytes;
					if (signatureBytes.length != 64) {
						throw callSite.runtimeError(`expected signature of length 64 for verifyEd25519Signature, got signature of length ${signatureBytes.length}`);
					}

					let ok = Crypto.Ed25519.verify(signatureBytes, msgBytes, keyBytes);

					return new UplcBool(callSite, ok);
				});
			case "ifThenElse":
				return new UplcAnon(this.site, rte, 3, (callSite, _, a, b, c) => {
					rte.calcAndIncrCost(this, a, b, c);

					return a.bool ? b.copy(callSite) : c.copy(callSite);
				});
			case "chooseUnit":
				// what is the point of this function?
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					a.assertUnit();

					return b.copy(callSite);
				});
			case "trace":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return rte.print(a.string).then(() => {
						return b.copy(callSite);
					});
				});
			case "fstPair":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isPair()) {
						return a.first.copy(callSite);
					} else {
						throw callSite.typeError(`expected pair or data-pair for first arg, got '${a.toString()}'`);
					}
				});
			case "sndPair":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isPair()) {
						return a.second.copy(callSite);
					} else {
						throw callSite.typeError(`expected pair or data-pair for first arg, got '${a.toString()}'`);
					}
				});
			case "chooseList":
				return new UplcAnon(this.site, rte, 3, (callSite, _, a, b, c) => {
					rte.calcAndIncrCost(this, a, b, c);

					if (a.isList()) {
						if (a.length == 0) {
							return b.copy(callSite);
						} else {
							return c.copy(callSite);
						}
					} else {
						throw callSite.typeError(`expected list or map first arg, got '${a.toString()}'`);
					}
				});
			case "mkCons":
				// only allow data items in list
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (b.isList()) {
						if (!b.itemType.isSameType(a)) {
							throw callSite.typeError(`wrong type for 2nd arg of mkCons, expected ${a.toString()}, got ${b.toString()}`);
						}

						let lst = b.list;
						lst.unshift(a);

						return new UplcList(callSite, b.itemType, lst);
					} else {
						throw callSite.typeError(`expected list or map for second arg, got '${b.toString()}'`);
					}
				});
			case "headList":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isList()) {
						const lst = a.list;
						if (lst.length == 0) {
							throw callSite.runtimeError("empty list");
						}

						return lst[0].copy(callSite);
					} else {
						throw callSite.typeError(`__core__head expects list or map, got '${a.toString()}'`);
					}
				});
			case "tailList":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isList()) {
						let lst = a.list;
						if (lst.length == 0) {
							throw callSite.runtimeError("empty list");
						}

						return new UplcList(callSite, a.itemType, lst.slice(1));
					} else {
						throw callSite.typeError(`__core__tail expects list or map, got '${a.toString()}'`);
					}
				});
			case "nullList":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isList()) {
						return new UplcBool(callSite, a.list.length == 0);
					} else {
						throw callSite.typeError(`__core__nullList expects list or map, got '${a.toString()}'`);
					}
				});
			case "chooseData":
				return new UplcAnon(this.site, rte, 6, (callSite, _, a, b, c, d, e, f) => {
					rte.calcAndIncrCost(this, a, b, c, d, e, f);

					let data = a.data;

					if (data instanceof ConstrData) {
						return b;
					} else if (data instanceof MapData) {
						return c;
					} else if (data instanceof ListData) {
						return d;
					} else if (data instanceof IntData) {
						return e;
					} else if (data instanceof ByteArrayData) {
						return f;
					} else {
						throw new Error("unexpected");
					}
				});
			case "constrData":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					const i = a.int;
					assert(i >= 0);

					const lst = b.list;

					return new UplcDataValue(callSite, new ConstrData(Number(i), lst.map(item => item.data)));
				});
			case "mapData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcDataValue(callSite, new MapData(a.list.map(pair => {
						return [pair.first.data, pair.second.data];
					})));
				});
			case "listData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcDataValue(callSite, new ListData(a.list.map(item => item.data)));
				});
			case "iData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);
					
					return new UplcDataValue(callSite, new IntData(a.int));
				});
			case "bData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcDataValue(callSite, new ByteArrayData(a.bytes));
				});
			case "unConstrData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unConstrData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof ConstrData)) {
						throw callSite.runtimeError(`unexpected unConstrData argument '${data.toString()}'`);
					} else {
						return new UplcPair(callSite, new UplcInt(callSite, BigInt(data.index)), new UplcList(callSite, UplcType.newDataType(), data.fields.map(f => new UplcDataValue(callSite, f))));
					}
				});
			case "unMapData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unMapData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof MapData)) {
						throw callSite.runtimeError(`unexpected unMapData argument '${data.toString()}'`);
					} else {
						return new UplcList(callSite, UplcType.newDataPairType(), data.map.map(([fst, snd]) => new UplcPair(callSite, new UplcDataValue(callSite, fst), new UplcDataValue(callSite, snd))));
					}
				});
			case "unListData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unListData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof ListData)) {
						throw callSite.runtimeError(`unexpected unListData argument '${data.toString()}'`);
					} else {
						return new UplcList(callSite, UplcType.newDataType(), data.list.map(item => new UplcDataValue(callSite, item)));
					}
				});
			case "unIData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unIData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof IntData)) {
						throw callSite.runtimeError(`unexpected unIData argument '${data.toString()}'`);
					} else {
						return new UplcInt(callSite, data.value);
					}
				});
			case "unBData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unBData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof ByteArrayData)) {
						throw callSite.runtimeError(`unexpected unBData argument '${data.toString()}'`);
					} else {
						return new UplcByteArray(callSite, data.bytes);
					}
				});
			case "equalsData":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for 1st arg of equalsData, got ${a.toString()}`);
					}

					if (!b.isData()) {
						throw callSite.typeError(`expected data for 2nd arg of equalsData, got ${b.toString()}`);
					}

					return new UplcBool(callSite, a.data.isSame(b.data));
				});
			case "mkPairData":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcPair(callSite, new UplcDataValue(callSite, a.data), new UplcDataValue(callSite, b.data));
				});
			case "mkNilData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					a.assertUnit();

					return new UplcList(callSite, UplcType.newDataType(), []);
				});
			case "mkNilPairData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					a.assertUnit();

					return new UplcList(callSite, UplcType.newDataPairType(), []);
				});
			case "serialiseData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, a.data.toCbor());
				});
			case "verifyEcdsaSecp256k1Signature":
			case "verifySchnorrSecp256k1Signature":
				throw new Error("no immediate need, so don't bother yet");
			default:
				throw new Error(`builtin ${this.#name} not yet implemented`);
		}
	}

	/**
	 * Returns appropriate callback wrapped with UplcAnon depending on builtin name.
	 * Emulates every Plutus-core that Helios exposes to the user.
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrBuiltinCost();

		/**
		 * @type {UplcValue}
		 */
		let v = this.evalInternal(rte);

		if  (typeof this.#name === 'string') {
			let nForce = UPLC_BUILTINS[findUplcBuiltin("__core__" + this.#name)].forceCount;

			for  (let i = 0; i < nForce; i++) {
				const vPrev = v;

				v = new UplcDelayedValue(this.site, () => vPrev);
			}
		}
 
		return v;
	}
}


///////////////////////////
// Section 11: Uplc program
///////////////////////////

/**
 * This library uses version "1.0.0" of Plutus-core
 * @package
 */
const UPLC_VERSION_COMPONENTS = [1n, 0n, 0n];

 /**
  * i.e. "1.0.0"
  * @package
  * @type {string}
  */
const UPLC_VERSION = UPLC_VERSION_COMPONENTS.map(c => c.toString()).join(".");

/**
 * This library uses V2 of the Plutus Ledger API, and is no longer compatible with V1
 * @package
 */
const PLUTUS_SCRIPT_VERSION = "PlutusScriptV2";

/**
 * @package
 * @type {Object.<string, number>}
 */
const UPLC_TAG_WIDTHS = {
	term:      4,
	type:      3,
	constType: 4,
	builtin:   7,
	constant:  4,
	kind:      1
};

/**
 * TODO: purpose as enum type
 * @typedef {{
 *   purpose: null | number 
 *   callsTxTimeRange: boolean
 * }} ProgramProperties
 */

/**
 * The constructor returns 'any' because it is an instance of TransferableUplcProgram, and the instance methods don't need to be defined here
 * @template TInstance
 * @typedef {{
 *   transferUplcProgram: (expr: any, properties: ProgramProperties, version: any[]) => TInstance,
 *   transferUplcAst: TransferUplcAst
 * }} TransferableUplcProgram
 */

/**
 * Plutus-core program class
 */
 export class UplcProgram {
	#version;
	#expr;
	#properties;

	/**
	 * @param {UplcTerm} expr 
	 * @param {ProgramProperties} properties
	 * @param {UplcInt[]} version
	 */
	constructor(expr, properties = {purpose: null, callsTxTimeRange: false}, version = UPLC_VERSION_COMPONENTS.map(v => new UplcInt(expr.site, v, false))) {
		this.#version    = version;
		this.#expr       = expr;
		this.#properties = properties;
	}

	/**
	 * @type {UplcTerm}
	 */
	get expr() {
		return this.#expr;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return new Site(this.#expr.site.src, 0);
	}

	/**
	 * Returns the IR source
	 * @type {string}
	 */
	get src() {
		return this.site.src.raw;
	}

	/**
	 * @type {ProgramProperties}
	 */
	get properties() {
		return this.#properties;
	}

	/**
	 * @template TInstance
	 * @param {TransferableUplcProgram<TInstance>} other
	 * @returns {TInstance}
	 */
	transfer(other) {
		return other.transferUplcProgram(
			this.#expr.transfer(other.transferUplcAst),
			this.#properties,
			this.#version.map(i => i.transfer(other.transferUplcAst))
		);
	}

	/**
	 * Returns version of Plutus-core (!== Plutus script version!)
	 * @type {string}
	 */
	get versionString() {
		return this.#version.map(v => v.toString()).join(".");
	}

	/**
	 * @returns {string}
	 */
	plutusScriptVersion() {
		// Note: only supports PlutusScriptV2 for now
		return PLUTUS_SCRIPT_VERSION;
	}

	/**
	 * Returns 1 for PlutusScriptV1, 2 for PlutusScriptV2
	 * @returns {number}
	 */
	versionTag() {
		let v = this.plutusScriptVersion();

		switch (v) {
			case "PlutusScriptV1":
				return 1;
			case "PlutusScriptV2":
				return 2;
			default:
				throw new Error(`unhandled script version '${v}'`);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(program ${this.versionString} ${this.#expr.toString()})`;
	}

	/**
	 * Flat encodes the entire Plutus-core program.
	 * Note that final padding isn't added now but is handled by bitWriter upon finalization.
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		for (let v of this.#version) {
			v.toFlatUnsigned(bitWriter);
		}

		this.#expr.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		return this.#expr.eval(rte);
	}

	/**
	 * Evaluates the term contained in UplcProgram (assuming it is a lambda term)
	 * @param {?UplcValue[]} args
	 * @param {UplcRTECallbacks} callbacks
	 * @param {?NetworkParams} networkParams
	 * @returns {Promise<UplcValue>}
	 */
	async runInternal(args, callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		assertDefined(callbacks);

		let rte = new UplcRte(callbacks, networkParams);

		// add the startup costs
		rte.incrStartupCost();

		let fn = await this.eval(rte);

		// program site is at pos 0, but now the call site is actually at the end 
		let globalCallSite = new Site(this.site.src, this.site.src.length);
		
		/** @type {UplcValue} */
		let result = fn;

		if (args !== null) {
			if (args.length === 0 && fn instanceof UplcDelayedValue) {
				result = await fn.force();
			} else {
				for (let arg of args) {
					// each call also adds to the total cost
					rte.incrCallCost();
					rte.incrConstCost();

					result = await result.call(rte, globalCallSite, arg);
				}
			}
		}

		return result;
	}

	/**
	 * Wrap the top-level term with consecutive UplcCall terms
	 * No checks are performed whether this makes sense or not, so beware
	 * Throws an error if you are trying to apply an  with anon func.
	 * @param {(UplcValue | HeliosData)[]} args
	 * @returns {UplcProgram} - a new UplcProgram instance
	 */
	apply(args) {
		let expr = this.expr;

		for (let arg of args) {
			if (arg instanceof UplcValue) {
				if (arg instanceof UplcAnon) {
					throw new Error("UplcAnon cannot be applied to UplcProgram");
				}
				
				expr = new UplcCall(arg.site, expr, new UplcConst(arg));
			} else if (arg instanceof HeliosData) {
				expr = new UplcCall(Site.dummy(), expr, new UplcConst(new UplcDataValue(Site.dummy(), arg._toUplcData())));
			}
		}

		return new UplcProgram(expr, this.#properties, this.#version);
	}

	/**
	 * @param {?UplcValue[]} args - if null the top-level term is returned as a value
	 * @param {UplcRTECallbacks} callbacks 
	 * @param {?NetworkParams} networkParams
	 * @returns {Promise<UplcValue | UserError>}
	 */
	async run(args, callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		try {
			return await this.runInternal(args, callbacks, networkParams);
		} catch (e) {
			if (!(e instanceof UserError)) {
				throw e;
			} else {
				return e;
			}
		}
	}

	/**
	 * @param {?UplcValue[]} args
	 * @returns {Promise<[(UplcValue | UserError), string[]]>}
	 */
	async runWithPrint(args) {
		/**
		 * @type {string[]}
		 */
		const messages = [];

		const callbacks = Object.assign({}, DEFAULT_UPLC_RTE_CALLBACKS);

		callbacks.onPrint = async function(msg) {
			messages.push(msg);
		};

		const res = await this.run(args, callbacks);

		return [res, messages];
	}

	/**
	 * @typedef {{
	 *   mem: bigint, 
	 *   cpu: bigint,
	 *   size: number,
	 *   builtins: {[name: string]: Cost},
	 *   terms: {[name: string]: Cost},
	 *   result: UserError | UplcValue,
	 *   messages: string[]
	 * }} Profile
	 * mem:  in 8 byte words (i.e. 1 mem unit is 64 bits)
	 * cpu:  in reference cpu microseconds
	 * size: in bytes
	 * builtins: breakdown per builtin
	 * terms: breakdown per termtype
	 * result: result of evaluation
	 * messages: printed messages (can be helpful when debugging)
	 */

	/**
	 * @param {UplcValue[]} args
	 * @param {NetworkParams} networkParams
	 * @returns {Promise<Profile>}
	 */
	async profile(args, networkParams) {
		let callbacks = Object.assign({}, DEFAULT_UPLC_RTE_CALLBACKS);

		let memCost = 0n;
		let cpuCost = 0n;

		/**
		 * @type {{[name: string]: Cost}}
		 */
		const builtins = {};

		/**
		 * @type {{[name: string]: Cost}}
		 */
		const terms = {};
		
		/**
		 * @type {(name: string, isTerm: boolean, cost: Cost) => void}
		 */
		callbacks.onIncrCost = (name, isTerm, cost) => {
			memCost += cost.mem;
			cpuCost += cost.cpu;

			if (name !== undefined) {
				if (isTerm) {
					const prev = terms[name];
					if (prev !== undefined) {
						terms[name] = {
							mem: prev.mem + cost.mem,
							cpu: prev.cpu + cost.cpu
						};
					} else {
						terms[name] = cost;
					}
				} else {
					const prev = builtins[name];

					if (prev !== undefined) {
						builtins[name] = {
							mem: prev.mem + cost.mem,
							cpu: prev.cpu + cost.cpu
						};
					} else {
						builtins[name] = cost;
					}
				}
			}
		};
		
		/** @type {string[]} */
		let messages = [];

		/**
		 * @type {(msg: string) => Promise<void>}
		 */
		callbacks.onPrint = async function(msg) {
			messages.push(msg);
		};

		let result = await this.run(args, callbacks, networkParams);

		return {
			mem: memCost,
			cpu: cpuCost,
			size: this.calcSize(),
			builtins: builtins,
			terms: terms,
			result: result,
			messages: messages
		};
	}

	/**
	 * Returns flat bytes of serialized script
	 * @returns {number[]}
	 */
	serializeBytes() {
		let bitWriter = new BitWriter();

		this.toFlat(bitWriter);

		return bitWriter.finalize();
	}

	/**
	 * Calculates the on chain size of the program (number of bytes).
	 * @returns {number}
	 */
	calcSize() {
		return this.serializeBytes().length;
	}

	/**
	 * Returns the Cbor encoding of a script (flat bytes wrapped twice in Cbor bytearray)
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(CborData.encodeBytes(this.serializeBytes()));
	}

	/**
	 * Returns Plutus-core script in JSON format (as string, not as object!)
	 * @returns {string}
	 */
	serialize() {
		let cborHex = bytesToHex(this.toCbor());

		return `{"type": "${this.plutusScriptVersion()}", "description": "", "cborHex": "${cborHex}"}`;
	}

	/**
	 * @returns {number[]} - 28 byte hash
	 */
	hash() {
		let innerBytes = CborData.encodeBytes(this.serializeBytes());

		innerBytes.unshift(this.versionTag());

		// used for both script addresses and minting policy hashes
		return Crypto.blake2b(innerBytes, 28);
	}

	/**
	 * @type {ValidatorHash}
	 */
	get validatorHash() {
		const purpose = this.#properties.purpose;

		assert(purpose === null || purpose === ScriptPurpose.Spending);

		return new ValidatorHash(this.hash());
	}

	/**
	 * @type {MintingPolicyHash}
	 */
	get mintingPolicyHash() {
		const purpose = this.#properties.purpose;

		assert(purpose === null || purpose === ScriptPurpose.Minting);

		return new MintingPolicyHash(this.hash());
	}

	/**
	 * @type {StakingValidatorHash}
	 */
	get stakingValidatorHash() {
		const purpose = this.#properties.purpose;

		assert(purpose === null || purpose === ScriptPurpose.Staking);

		return new StakingValidatorHash(this.hash());
	}

	/**
	 * @param {number[] | string} bytes 
	 * @returns {UplcProgram}
	 */
	static fromCbor(bytes) {
		if (typeof bytes == "string") {
			return UplcProgram.fromCbor(hexToBytes(bytes))
		} else {
			return deserializeUplcBytes(CborData.decodeBytes(CborData.decodeBytes(bytes)));
		}
	}


	/**
	 * Intended for transfer only
	 * @param {any} expr 
	 * @param {ProgramProperties} properties 
	 * @param {any[]} version 
	 * @returns {UplcProgram}
	 */
	static transferUplcProgram(expr, properties, version) {
		if (!(expr instanceof UplcTerm)) {
			throw new Error("program expr not transferred correctly");
		} else if (!version.every(v => v instanceof UplcInt)) {
			throw new Error("program version ints not transferred correctly");
		} else {
			return new UplcProgram(expr, properties, version);
		}
	}

	/**
	 * @type {TransferUplcAst}
	 */
	static get transferUplcAst() {
		return {
			transferByteArrayData: (bytes) => new ByteArrayData(bytes),
			transferConstrData:    (index, fields) => new ConstrData(index, fields),
			transferIntData:       (value) => new IntData(value),
			transferListData:      (items) => new ListData(items),
			transferMapData:       (pairs) => new MapData(pairs),
			transferSite:          (src, startPos, endPos, codeMapSite = null) => new Site(src, startPos, endPos, codeMapSite),
			transferSource:        (raw, fileIndex) => new Source(raw, fileIndex),
			transferUplcBool:      (site, value) => new UplcBool(site, value),
			transferUplcBuiltin:   (site, name) => new UplcBuiltin(site, name),
			transferUplcByteArray: (site, bytes) => new UplcByteArray(site, bytes),
			transferUplcCall:      (site, a, b) => new UplcCall(site, a, b),
			transferUplcConst:     (value) => new UplcConst(value),
			transferUplcDataValue: (site, data) => new UplcDataValue(site, data),
			transferUplcDelay:     (site, expr) => new UplcDelay(site, expr),
			transferUplcError:     (site, msg) => new UplcError(site, msg),
			transferUplcForce:     (site, expr) => new UplcForce(site, expr),
			transferUplcInt:       (site, value, signed) => new UplcInt(site, value, signed),
			transferUplcLambda:    (site, rhs, name = null) => new UplcLambda(site, rhs, name),
			transferUplcList:      (site, itemType, items) => new UplcList(site, itemType, items),
			transferUplcPair:      (site, first, second) => new UplcPair(site, first, second),
			transferUplcString:    (site, value) => new UplcString(site, value),
			transferUplcType:      (typeBits) => new UplcType(typeBits),
			transferUplcUnit:      (site) => new UplcUnit(site),
			transferUplcVariable:  (site, index) => new UplcVariable(site, index)
		};
	}
}

/**
 * Plutus-core deserializer creates a Plutus-core form an array of bytes
 */
 class UplcDeserializer extends BitReader {
	
	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		super(bytes);
	}

	/**
	 * @param {string} category 
	 * @returns {number}
	 */
	tagWidth(category) {
		assert(category in UPLC_TAG_WIDTHS, `unknown tag category ${category.toString()}`);

		return UPLC_TAG_WIDTHS[category];
	}

	/**
	 * Returns the name of a known builtin
	 * Returns the integer id if id is out of range (thus if the builtin is unknown)
	 * @param {number} id
	 * @returns {string | number}
	 */
	builtinName(id) {
		let all = UPLC_BUILTINS;

		if (id >= 0 && id < all.length) {
			return all[id].name;
		} else {
			console.error(`Warning: builtin id ${id.toString()} out of range`);

			return id;
		}
	}

	/**
	 * Reads a Plutus-core list with a specified size per element
	 * Calls itself recursively until the end of the list is reached
	 * @param {number} elemSize 
	 * @returns {number[]}
	 */
	readLinkedList(elemSize) {
		// Cons and Nil constructors come from Lisp/Haskell
		//  cons 'a' creates a linked list node,
		//  nil      creates an empty linked list
		let nilOrCons = this.readBits(1);

		if (nilOrCons == 0) {
			return [];
		} else {
			return [this.readBits(elemSize)].concat(this.readLinkedList(elemSize));
		}
	}

	/**
	 * Reads a single UplcTerm
	 * @returns {UplcTerm}
	 */
	readTerm() {
		let tag = this.readBits(this.tagWidth("term"));

		switch (tag) {
			case 0:
				return this.readVariable();
			case 1:
				return this.readDelay();
			case 2:
				return this.readLambda();
			case 3:
				return this.readCall(); // aka function application
			case 4:
				return this.readConstant();
			case 5:
				return this.readForce();
			case 6:
				return new UplcError(Site.dummy());
			case 7:
				return this.readBuiltin();
			default:
				throw new Error("term tag " + tag.toString() + " unhandled");
		}
	}

	/**
	 * Reads a single unbounded integer
	 * @param {boolean} signed 
	 * @returns {UplcInt}
	 */
	readInteger(signed = false) {
		let bytes = [];

		let b = this.readByte();
		bytes.push(b);

		while (!UplcInt.rawByteIsLast(b)) {
			b = this.readByte();
			bytes.push(b);
		}

		// strip the leading bit
		let res = new UplcInt(Site.dummy(), UplcInt.bytesToBigInt(bytes.map(b => UplcInt.parseRawByte(b))), false); // raw int is unsigned

		if (signed) {
			res = res.toSigned(); // unzigzag is performed here
		}

		return res;
	}

	/**
	 * Reads bytearray or string characters
	 * @returns {number[]}
	 */
	readBytes() {
		this.moveToByteBoundary(true);

		let bytes = [];

		let nChunk = this.readByte();

		while (nChunk > 0) {
			for (let i = 0; i < nChunk; i++) {
				bytes.push(this.readByte());
			}

			nChunk = this.readByte();
		}

		return bytes;
	}

	/**
	 * Reads a literal bytearray
	 * @returns {UplcByteArray}
	 */
	readByteArray() {
		let bytes = this.readBytes();

		return new UplcByteArray(Site.dummy(), bytes);
	}

	/**
	 * Reads a literal string
	 * @returns {UplcString}
	 */
	readString() {
		let bytes = this.readBytes();

		let s = bytesToText(bytes);

		return new UplcString(Site.dummy(), s);
	}

	/**
	 * @param {() => UplcValue} typedReader 
	 * @returns {UplcValue[]}
	 */
	readList(typedReader) {
		/** @type {UplcValue[]} */
		let items = [];

		while (this.readBits(1) == 1) {
			items.push(typedReader());
		}

		return items;
	}

	/**
	 * Reads a data object
	 * @returns {UplcData}
	 */
	readData() {
		let bytes = this.readBytes();

		return UplcData.fromCbor(bytes);
	}

	/**
	 * Reads a variable term
	 * @returns {UplcVariable}
	 */
	readVariable() {
		let index = this.readInteger()

		return new UplcVariable(Site.dummy(), index);
	}

	/**
	 * Reads a lambda expression term
	 * @returns {UplcLambda}
	 */
	readLambda() {
		let rhs = this.readTerm();

		return new UplcLambda(Site.dummy(), rhs);
	}

	/**
	 * Reads a function application term
	 * @returns {UplcCall}
	 */
	readCall() {
		let a = this.readTerm();
		let b = this.readTerm();

		return new UplcCall(Site.dummy(), a, b);
	}

	/**
	 * Reads a single constant
	 * @returns {UplcConst}
	 */
	readConstant() {
		let typeList = this.readLinkedList(this.tagWidth("constType"));

		let res = new UplcConst(this.readTypedValue(typeList));

		return res;
	}

	/**
	 * Reads a single constant
	 * @param {number[]} typeList 
	 * @returns {UplcValue}
	 */
	readTypedValue(typeList) {
		const typedReader = this.constructTypedReader(typeList);

		assertEq(typeList.length, 0, "Did not consume all type parameters");

		return typedReader();
	}

	/**
	 * Constructs a reader for a single construct recursively
	 * @param {number[]} typeList 
	 * NOTE: the implicit assumption is that this functions modifies the typeList
	 * by removing all elements that it "consumed" to define a type
	 * @returns {() => UplcValue}
	 */
	constructTypedReader(typeList){
		const type = assertDefined(typeList.shift());

		switch (type) {
			case 0: // signed Integer
				return () => this.readInteger(true);
			case 1: // bytearray
				return () => this.readByteArray();
			case 2: // utf8-string
				return () => this.readString();
			case 3:
				return () => new UplcUnit(Site.dummy()); // no reading needed
			case 4: // Bool
				return () => new UplcBool(Site.dummy(), this.readBits(1) == 1);
			case 5:
			case 6:
				throw new Error("unexpected type tag without type application");
			case 7:
				let containerType = assertDefined(typeList.shift());
				if (containerType == 5) {
					// typeList is consumed by the construct call, so make sure to read it before!
					const listType = UplcType.fromNumbers(typeList);
					const typeReader = this.constructTypedReader(typeList);

					return () => new UplcList(Site.dummy(), listType, this.readList(typeReader));
				} else {
					assertEq(containerType, 7, "Unexpected type tag");
					containerType = assertDefined(typeList.shift());
					if (containerType == 6) {
						// typeList is consumed by the construct call, so make sure to read it in correct order!
						const leftReader = this.constructTypedReader(typeList);
						const rightReader = this.constructTypedReader(typeList);
						return () => new UplcPair(Site.dummy(), leftReader(), rightReader())
					}
				}
			case 8:
				return () => new UplcDataValue(Site.dummy(), this.readData());
			default:
				throw new Error(`unhandled constant type ${type.toString()}`);
		}
	}

	/**
	 * Reads a delay term
	 * @returns {UplcDelay}
	 */
	readDelay() {
		let expr = this.readTerm();

		return new UplcDelay(Site.dummy(), expr);
	}

	/**
	 * Reads a force term
	 * @returns {UplcForce}
	 */
	readForce() {
		let expr = this.readTerm();

		return new UplcForce(Site.dummy(), expr);
	}

	/**
	 * Reads a builtin function ref term
	 * @returns {UplcBuiltin}
	 */
	readBuiltin() {
		let id = this.readBits(this.tagWidth("builtin"));

		let name = this.builtinName(id);

		return new UplcBuiltin(Site.dummy(), name);
	}

	/**
	 * Move to the next byteboundary
	 * (and check that we are at the end)
	 */
	finalize() {
		this.moveToByteBoundary(true);
	}
}

/**
 * @param {number[]} bytes 
 * @returns {UplcProgram}
 */
export function deserializeUplcBytes(bytes) {
	let reader = new UplcDeserializer(bytes);

	let version = [
		reader.readInteger(),
		reader.readInteger(),
		reader.readInteger(),
	];

	let versionKey = version.map(v => v.toString()).join(".");

	if (versionKey != UPLC_VERSION) {
		console.error(`Warning: Plutus-core script doesn't match version of Helios (expected ${UPLC_VERSION}, got ${versionKey})`);
	}

	let expr = reader.readTerm();

	reader.finalize();

	return new UplcProgram(expr, {purpose: null, callsTxTimeRange: false}, version);
}

/**
 * Parses a plutus core program. Returns a UplcProgram object
 * @param {string} jsonString 
 * @returns {UplcProgram}
 */
export function deserializeUplc(jsonString) {
	let obj = JSON.parse(jsonString);

	if (!("cborHex" in obj)) {
		throw UserError.syntaxError(new Source(jsonString), 0, 1, "cborHex field not in json")
	}

	let cborHex = obj.cborHex;
	if (typeof cborHex !== "string") {
		let src = new Source(jsonString);
		let re = /cborHex/;
		let cborHexMatch = jsonString.match(re);
		if (cborHexMatch === null) {
			throw UserError.syntaxError(src, 0, 1, "'cborHex' key not found");
		} else {
			const pos = jsonString.search(re)
			throw UserError.syntaxError(src, pos, pos+1, "cborHex not a string");
		}
	}

	return UplcProgram.fromCbor(hexToBytes(cborHex));
}


///////////////////////////
// Section 12: Tokenization
///////////////////////////

export class Tokenizer {
	#src;
	#pos;

	/**
	 * Tokens are accumulated in '#ts'
	 * @type {Token[]} 
	 */
	#ts;
	#codeMap;
	#codeMapPos;

	#irMode;

	/**
	 * @param {Source} src 
	 * @param {?CodeMap} codeMap 
	 * @param {boolean} irMode - if true '@' is treated as a regular character
	 */
	constructor(src, codeMap = null, irMode = false) {
		assert(src instanceof Source);

		this.#src = src;
		this.#pos = 0;
		this.#ts = []; // reset to empty to list at start of tokenize()
		this.#codeMap = codeMap; // can be a list of pairs [pos, site in another source]
		this.#codeMapPos = 0; // not used if codeMap === null
		this.#irMode = irMode;
	}

	incrPos() {
		this.#pos += 1;
	}

	decrPos() {
		this.#pos -= 1;
		assert(this.#pos >= 0);
	}

	get currentSite() {
		return new Site(this.#src, this.#pos);
	}

	/**
	 * @param {Token} t 
	 */
	pushToken(t) {
		this.#ts.push(t);

		if (this.#codeMap !== null && this.#codeMapPos < this.#codeMap.length) {
			let pair = (this.#codeMap[this.#codeMapPos]);

			if (pair[0] == t.site.startPos) {
				t.site.setCodeMapSite(pair[1]);
				this.#codeMapPos += 1;
			}
		}
	}

	/**
	 * Reads a single char from the source and advances #pos by one
	 * @returns {string}
	 */
	readChar() {
		assert(this.#pos >= 0);

		let c;
		if (this.#pos < this.#src.length) {
			c = this.#src.getChar(this.#pos);
		} else {
			c = '\0';
		}

		this.incrPos();

		return c;
	}

	/**
	 * @returns {string}
	 */
	peekChar() {
		assert(this.#pos >= 0);

		if (this.#pos < this.#src.length) {
			return this.#src.getChar(this.#pos);
		} else {
			return '\0';
		}
	}

	/**
	 * Decreases #pos by one
	 */
	unreadChar() {
		this.decrPos();
	}

	/**
	 * Start reading precisely one token
	 * @param {Site} site 
	 * @param {string} c 
	 */
	readToken(site, c) {
		if (c == '_' || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (this.#irMode && (c == '@' || c == '[' || c == ']'))) {
			this.readWord(site, c);
		} else if (c == '/') {
			this.readMaybeComment(site);
		} else if (c == '0') {
			this.readSpecialInteger(site);
		} else if (c >= '1' && c <= '9') {
			this.readDecimal(site, c);
		} else if (c == '#') {
			this.readByteArray(site);
		} else if (c == '"') {
			this.readString(site);
		} else if (c == '?' || c == '!' || c == '%' || c == '&' || (c >= '(' && c <= '.') || (c >= ':' && c <= '>') || c == '[' || c == ']' || (c >= '{' && c <= '}')) {
			this.readSymbol(site, c);
		} else if (!(c == ' ' || c == '\n' || c == '\t' || c == '\r')) {
			site.syntaxError(`invalid source character '${c}' (utf-8 not yet supported outside string literals)`);
		}
	}

	/**
	 * Tokenize the complete source.
	 * Nests groups before returning a list of tokens
	 * @returns {Token[] | null}
	 */
	tokenize() {
		// reset #ts
		this.#ts = [];

		let site = this.currentSite;
		let c = this.readChar();

		while (c != '\0') {
			this.readToken(site, c);

			site = this.currentSite;
			c = this.readChar();
		}

		return this.nestGroups(this.#ts);
	}

	/** 
	 * Returns a generator
	 * Use gen.next().value to access to the next Token
	 * Doesn't perform any grouping
	 * Used for quickly parsing the ScriptPurpose header of a script
	 * @returns {Generator<Token>}
	 */
	*streamTokens() {
		this.#ts = [];

		let site = this.currentSite;
		let c = this.readChar();

		while (c != '\0') {
			this.readToken(site, c);

			let t = this.#ts.shift();
			while (t != undefined) {
				yield t;
				t = this.#ts.shift();
			}

			site = this.currentSite;
			c = this.readChar();
		}

		assert(this.#ts.length == 0);
	}

	/**
	 * Reads one word token.
	 * Immediately turns "true" or "false" into a BoolLiteral instead of keeping it as Word
	 * @param {Site} site
	 * @param {string} c0 - first character 
	 */
	readWord(site, c0) {
		let chars = [];

		let c = c0;
		while (c != '\0') {
			if (c == '_' || (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (this.#irMode && (c == '@' || c == '[' || c == ']'))) {
				chars.push(c);
				c = this.readChar();
			} else {
				this.unreadChar();
				break;
			}
		}

		let value = chars.join('');

		if (value == "true" || value == "false") {
			this.pushToken(
				new BoolLiteral(
					new Site(site.src, site.startPos, this.currentSite.startPos),
					value == "true"
				)
			);
		} else {
			this.pushToken(
				new Word(
					new Site(site.src, site.startPos, this.currentSite.startPos),
					value
				)
			);
		}
	}

	/**
	 * Reads and discards a comment if current '/' char is followed by '/' or '*'.
	 * Otherwise pushes Symbol('/') onto #ts
	 * @param {Site} site 
	 */
	// comments are discarded
	readMaybeComment(site) {
		let c = this.readChar();

		if (c == '\0') {
			this.pushToken(new SymbolToken(site, '/'));
		} else if (c == '/') {
			this.readSingleLineComment();
		} else if (c == '*') {
			this.readMultiLineComment(site);
		} else {
			this.pushToken(new SymbolToken(site, '/'));
			this.unreadChar();
		}
	}

	/**
	 * Reads and discards a single line comment (from '//' to end-of-line)
	 */
	readSingleLineComment() {
		let c = this.readChar();

		while (c != '\n' && c != '\0') {
			c = this.readChar();
		}
	}

	/**
	 * Reads and discards a multi-line comment (from '/' '*' to '*' '/')
	 * @param {Site} site 
	 */
	readMultiLineComment(site) {
		let prev = '';
		let c = this.readChar();

		while (true) {
			prev = c;
			c = this.readChar();

			if (c == '/' && prev == '*') {
				break;
			} else if (c == '\0') {
				const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);
				errorSite.syntaxError("unterminated multiline comment");
				return;
			}
		}
	}

	/**
	 * REads a literal integer
	 * @param {Site} site 
	 */
	readSpecialInteger(site) {
		let c = this.readChar();

		if (c == '\0') {
			this.pushToken(new IntLiteral(site, 0n));
		} else if (c == 'b') {
			this.readBinaryInteger(site);
		} else if (c == 'o') {
			this.readOctalInteger(site);
		} else if (c == 'x') {
			this.readHexInteger(site);
		} else if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
			site.syntaxError(`bad literal integer type 0${c}`);
		} else if (c >= '0' && c <= '9') {
			site.syntaxError("unexpected leading 0");
		} else if (c == '.') {
			this.readFixedPoint(site, ['0']);
		} else {
			this.pushToken(new IntLiteral(site, 0n));
			this.unreadChar();
		}
	}

	/**
	 * @param {Site} site 
	 */
	readBinaryInteger(site) {
		this.readRadixInteger(site, "0b", c => (c == '0' || c == '1'));
	}

	/**
	 * @param {Site} site 
	 */
	readOctalInteger(site) {
		this.readRadixInteger(site, "0o", c => (c >= '0' && c <= '7'));
	}

	/**
	 * @param {Site} site 
	 */
	readHexInteger(site) {
		this.readRadixInteger(site, "0x",
			c => ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')));
	}

	/**
	 * @param {Site} site 
	 * @param {string[]} chars 
	 * @param {boolean} reverse
	 * @returns {string[]}
	 */
	static assertCorrectDecimalUnderscores(site, chars, reverse = false) {
		if (chars.some(c => c == '_')) {
			for (let i = 0; i < chars.length; i++) {
				const c = reverse ? chars[chars.length - 1 - i] : chars[i];

				if (i == chars.length - 1) {
					if (c == '_') {
						site.syntaxError("redundant decimal underscore");
					}
				}

				if ((i+1)%4 == 0) {
					if (c != '_') {
						site.syntaxError("bad decimal underscore");
					}
				} else {
					if (c == '_') {
						site.syntaxError("bad decimal underscore");
					}
				}
			}

			return chars.filter(c => c != '_');
		} else {
			return chars;
		}
	}

	/**
	 * @param {Site} site 
	 * @param {string} c0 - first character
	 */
	readDecimal(site, c0) {
		/**
		 * @type {string[]}
		 */
		let chars = [];

		let c = c0;
		while (c != '\0') {
			if ((c >= '0' && c <= '9') || c == '_') {
				chars.push(c);
			} else {
				if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
					const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);

					errorSite.syntaxError("invalid syntax for decimal integer literal");
				} else if (c == '.') {
					const cf = this.peekChar();

					if (cf >= '0' && cf <= '9') {
						this.readFixedPoint(site, chars);

						return;
					}
				}

				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		const intSite = new Site(site.src, site.startPos, this.currentSite.startPos);

		chars = Tokenizer.assertCorrectDecimalUnderscores(intSite, chars, true);

		this.pushToken(
			new IntLiteral(
				intSite,
				BigInt(chars.filter(c => c != '_').join(''))
			)
		);
	}

	/**
	 * @param {Site} site 
	 * @param {string} prefix 
	 * @param {(c: string) => boolean} valid - checks if character is valid as part of the radix
	 */
	readRadixInteger(site, prefix, valid) {
		let c = this.readChar();

		let chars = [];

		if (!(valid(c))) {
			const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);

			errorSite.syntaxError(`expected at least one char for ${prefix} integer literal`);

			this.unreadChar();
			return;
		}

		while (c != '\0') {
			if (valid(c)) {
				chars.push(c);
			} else {
				if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
					const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);

					errorSite.syntaxError(`invalid syntax for ${prefix} integer literal`);
				}

				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		this.pushToken(
			new IntLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				BigInt(prefix + chars.join(''))
			)
		);
	}

	/**
	 * @param {Site} site 
	 * @param {string[]} leading 
	 */
	readFixedPoint(site, leading) {
		/**
		 * @type {string[]}
		 */
		let trailing = [];

		let c = this.readChar();

		while (c != '\0') {
			if ((c >= '0' && c <= '9') || c == '_') {
				trailing.push(c);

			} else {
				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		const tokenSite = new Site(site.src, site.startPos, this.currentSite.startPos);

		leading = Tokenizer.assertCorrectDecimalUnderscores(tokenSite, leading, true);

		trailing = Tokenizer.assertCorrectDecimalUnderscores(tokenSite, trailing, false);

		if (trailing.length > REAL_PRECISION) {
			tokenSite.syntaxError(`literal real decimal places overflow (max ${REAL_PRECISION} supported, but ${trailing.length} specified)`);

			trailing.splice(REAL_PRECISION);
		} 
		
		while (trailing.length < REAL_PRECISION) {
			trailing.push('0');
		}

		this.pushToken(
			new RealLiteral(
				tokenSite,
				BigInt(leading.concat(trailing).join(''))
			)
		);
	}

	/**
	 * Reads literal hexadecimal representation of ByteArray
	 * @param {Site} site 
	 */
	readByteArray(site) {
		let c = this.readChar();

		let chars = [];

		// case doesn't matter
		while ((c >= 'a' && c <= 'f') || (c >= '0' && c <= '9')) {
			chars.push(c);
			c = this.readChar();
		}

		// empty byteArray is allowed (eg. for Ada mintingPolicyHash)

		// last char is the one that made the while loop break, so should be unread
		this.unreadChar();

		let bytes = hexToBytes(chars.join(''));

		this.pushToken(
			new ByteArrayLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				bytes
			)
		);
	}

	/**
	 * Reads literal string delimited by double quotes.
	 * Allows for three escape character: '\\', '\n' and '\t'
	 * @param {Site} site 
	 */
	readString(site) {
		let c = this.readChar();

		let chars = [];

		let escaping = false;
		/** @type {?Site} */
		let escapeSite = null; // for escape syntax errors

		while (!(!escaping && c == '"')) {
			if (c == '\0') {
				site.syntaxError("unmatched '\"'");
				break;
			}

			if (escaping) {
				if (c == 'n') {
					chars.push('\n');
				} else if (c == 't') {
					chars.push('\t');
				} else if (c == '\\') {
					chars.push('\\');
				} else if (c == '"') {
					chars.push(c);
				} else if (escapeSite !== null) {
					const errorSite = new Site(escapeSite.src, escapeSite.startPos, this.currentSite.startPos);

					errorSite.syntaxError(`invalid escape sequence ${c}`);
				} else {
					throw new Error("escape site should be non-null");
				}

				escaping = false;
				escapeSite = null;
			} else {
				if (c == '\\') {
					escapeSite = this.currentSite;
					escaping = true;
				} else {
					chars.push(c);
				}
			}

			c = this.readChar();
		}

		this.pushToken(
			new StringLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				chars.join('')
			)
		);
	}

	/**
	 * Reads single or double character symbols
	 * @param {Site} site 
	 * @param {string} c0 - first character
	 */
	readSymbol(site, c0) {
		let chars = [c0];

		/** @type {(second: string) => boolean} */
		let parseSecondChar = (second) => {
			let d = this.readChar();

			if (d == second) {
				chars.push(d);
				return true;
			} else {
				this.unreadChar();
				return false;
			}
		}

		if (c0 == '|') {
			parseSecondChar('|');
		} else if (c0 == '&') {
			parseSecondChar('&');
		} else if (c0 == '=') {
			if (!parseSecondChar('=')) {
				parseSecondChar('>');
			}
		} else if (c0 == '!' || c0 == '<' || c0 == '>') { // could be !=, ==, <= or >=
			parseSecondChar('=');
		} else if (c0 == ':') {
			parseSecondChar(':');
		} else if (c0 == '-') {
			parseSecondChar('>');
		}

		this.pushToken(
			new SymbolToken(
				new Site(site.src, site.startPos, site.endPos),
				chars.join('')
			)
		);
	}

	/**
	 * Separates tokens in fields (separted by commas)
	 * @param {Token[]} ts 
	 * @returns {Group | null}
	 */
	static buildGroup(ts) {
		const open = assertDefined(ts.shift()).assertSymbol();

		if (!open) {
			return null;
		}

		const stack = [open]; // stack of symbols
		let curField = [];
		let fields = [];

		/** @type {?SymbolToken} */
		let firstComma = null;

		/** @type {?SymbolToken} */
		let lastComma = null;

		/** @type {?Site} */
		let endSite = null;

		while (stack.length > 0 && ts.length > 0) {
			const t = assertToken(ts.shift(), open.site);

			if (!t) {
				return null;
			}

			const prev = stack.pop();

			endSite = t.site;

			if (t != undefined && prev != undefined) {
				if (!t.isSymbol(Group.matchSymbol(prev))) {
					stack.push(prev);

					if (Group.isCloseSymbol(t)) {
						t.site.syntaxError(`unmatched '${assertDefined(t.assertSymbol()).value}'`);
						return null;
					} else if (Group.isOpenSymbol(t)) {
						stack.push(assertDefined(t.assertSymbol()));
						curField.push(t);
					} else if (t.isSymbol(",") && stack.length == 1) {
						if (firstComma === null) {
							firstComma = t.assertSymbol();
						}

						lastComma = t.assertSymbol();
						if (curField.length == 0) {
							t.site.syntaxError("empty field");
							return null;
						} else {
							fields.push(curField);
							curField = [];
						}
					} else {
						curField.push(t);
					}
				} else if (stack.length > 0) {
					curField.push(t);
				}
			} else {
				throw new Error("unexpected");
			}
		}

		let last = stack.pop();
		if (last != undefined) {
			last.syntaxError(`EOF while matching '${last.value}'`);
			return null;
		}

		if (curField.length > 0) {
			// add removing field
			fields.push(curField);
		} else if (lastComma !== null) {
			lastComma.syntaxError(`trailing comma`);
			return null;
		}

		let site = open.site;

		if (endSite) {
			site = site.merge(endSite);
		}

		return new Group(site, open.value, fields, firstComma);
	}

	/**
	 * Match group open with group close symbols in order to form groups.
	 * This is recursively applied to nested groups.
	 * @param {Token[]} ts 
	 * @returns {Token[] | null}
	 */
	nestGroups(ts) {
		/**
		 * @type {Token[][]}
		 */
		const stack = [];

		/**
		 * @type {Token[]}
		 */
		let current = [];

		for (let t of ts) {
			if (Group.isOpenSymbol(t)) {
				stack.push(current);

				current = [t];
			} else if (Group.isCloseSymbol(t)) {
				const prev = assertDefined(current[0]?.assertSymbol());
				if (!t.isSymbol(Group.matchSymbol(prev))) {
					prev.syntaxError(`unmatched '${prev.value}'`);
					t.syntaxError(`unmatched '${assertDefined(t.assertSymbol()).value}'`);
					return null;
				}

				current.push(t);

				const group = Tokenizer.buildGroup(current);
				if (!group) {
					return null;
				}

				current = assertDefined(stack.pop());

				current.push(group);
			} else {
				current.push(t);
			}
		}

		if (stack.length > 0) {
			const t = assertDefined(stack[stack.length - 1][0]?.assertSymbol());
			t.syntaxError(`unmacthed '${t.value}'`);
		}
		
		return current;
	}
}

/**
 * Tokenizes a string (wrapped in Source)
 * Also used by VSCode plugin
 * @param {Source} src 
 * @returns {Token[] | null}
 */
export function tokenize(src) {
	let tokenizer = new Tokenizer(src);

	return tokenizer.tokenize();
}

/**
 * Tokenizes an IR string with a codemap to the original source
 * @package
 * @param {string} rawSrc 
 * @param {CodeMap} codeMap 
 * @returns {Token[]}
 */
function tokenizeIR(rawSrc, codeMap) {
	let src = new Source(rawSrc);

	// the Tokenizer for Helios can simply be reused for the IR
	let tokenizer = new Tokenizer(src, codeMap, true);

	const ts = tokenizer.tokenize();

	if (src.errors.length > 0) {
		throw src.errors[0];
	} else if (ts === null) {
		throw new Error("should've been thrown above");
	}

	return ts;
}



////////////////////////////////
// Section 13: Eval common types
////////////////////////////////

/**
 * @template {HeliosData} T
 */

/**
 * @typedef {Named & Type & {
 *   asDataType: DataType
 *   fieldNames:  string[]
 *   offChainType: (null | HeliosDataClass<HeliosData>)
 * }} DataType
 */

/**
 * @typedef {DataType & {
 *   asEnumMemberType: EnumMemberType
 *   constrIndex: number
 *   parentType: DataType
 * }} EnumMemberType
 */

/**
 * EvalEntities assert themselves
 * @typedef {{
 *   asDataType:       (null | DataType)
 *   asEnumMemberType: (null | EnumMemberType)
 *   asFunc:           (null | Func)
 *   asInstance:       (null | Instance)
 *   asMulti:          (null | Multi)
 *   asNamed:          (null | Named)
 *   asNamespace:      (null | Namespace)
 *   asParametric:     (null | Parametric)
 * 	 asType:           (null | Type)
 *   asTyped:          (null | Typed)
 *   asTypeClass:      (null | TypeClass)
 *   toString():       string
 * }} EvalEntity
 */

/**
 * @typedef {Typed & {
 *   asFunc: Func
 *   call(site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}): (Typed | Multi)
 * }} Func
 */

/**
 * @typedef {Typed & {
 *   asInstance:      Instance
 *   fieldNames:      string[]
 *   instanceMembers: InstanceMembers
 * }} Instance
 */

/**
 * @typedef {EvalEntity & {
 *	 asMulti: Multi
 *   values:  Typed[]
 * }} Multi
 */

/**
 * @typedef {EvalEntity & {
 *   asNamed: Named
 *   name:    string
 *   path:    string
 * }} Named
 */

/**
 * @typedef {EvalEntity & {
 *   asNamespace: Namespace
 *   namespaceMembers: NamespaceMembers
 * }} Namespace
 */

/**
 * @typedef {EvalEntity & {
 *   asParametric: Parametric
 *   offChainType: (null | ((...any) => HeliosDataClass<HeliosData>))
 *   typeClasses: TypeClass[]
 *   apply(types: Type[], site?: Site): EvalEntity
 *   inferCall(site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}, paramTypes?: Type[]): Func
 * 	 infer(site: Site, map: Map<string, Type>): Parametric
 * }} Parametric
 */

/**
 * @typedef {EvalEntity & {
 *   asType:               Type
 *   instanceMembers:      InstanceMembers
 *   typeMembers:          TypeMembers
 *   isBaseOf(type: Type): boolean
 *   infer(site: Site, map: Map<string, Type>, type: (null | Type)): Type
 *   toTyped():            Typed
 * }} Type
 */

/**
 * @typedef {EvalEntity & {
 *   asTyped: Typed
 *   type: Type
 * }} Typed
 */

/**
 * @typedef {EvalEntity & {
 *   asTypeClass:                        TypeClass
 *   genInstanceMembers(impl: Type):     TypeClassMembers
 *   genTypeMembers(impl: Type):         TypeClassMembers
 *   isImplementedBy(type: Type):        boolean
 *   toType(name: string, path: string): Type
 * }} TypeClass
 */

/**
 * @typedef {{[name: string]: (Parametric | Type)}} InstanceMembers
 */

/**
 * @typedef {{[name: string]: EvalEntity}} NamespaceMembers
 */

/**
 * @typedef {{[name: string]: (Parametric | Type | Typed)}} TypeMembers
 */

/**
 * @typedef {{[name: string]: Type}} TypeClassMembers
 */

/**
 * @param {Parametric} parametric
 * @param {Type[]} types
 * @returns {DataType}
 */
export function applyTypes(parametric, ...types) {
    return assertDefined(parametric.apply(types).asDataType);
}

/**
 * @package
 */
class Common {
	constructor() {
	}

    /**
     * @param {Typed} i 
     * @param {Type} t 
     * @returns {boolean}
     */
    static instanceOf(i, t) {
        return t.isBaseOf(i.type);
    }

    /**
     * @param {Type | Type[]} type 
     * @returns {Typed | Multi}
     */
    static toTyped(type) {
        if (Array.isArray(type)) {
            if (type.length === 1) {
                return Common.toTyped(type[0]);
            } else {
                return new MultiEntity(type.map(t => {
                    const typed = Common.toTyped(t).asTyped;
                    
                    if (!typed) {
                        throw new Error("unexpected nested Multi");
                    } else {
                        return typed;
                    }
                }));
            }
        } else {
			return type.toTyped();
        }
    }

	/**
	 * Compares two types. Throws an error if neither is a Type.
	 * @example
	 * Common.typesEq(IntType, IntType) => true
	 * @param {Type} a 
	 * @param {Type} b 
	 * @returns {boolean}
	 */
	static typesEq(a, b) {
		return a.isBaseOf(b) && b.isBaseOf(a);
	}

	/**
	 * @param {Type} type 
	 */
	static isEnum(type) {
		return Object.values(type.typeMembers).some(v => v.asEnumMemberType);
	}

	/**
	 * @param {Type} type 
	 */
	static countEnumMembers(type) {
		return Object.values(type.typeMembers).reduce((prev, v) => v.asEnumMemberType ? prev + 1 : prev, 0);
	}
  
    /**
     * @param {TypeClass} tc 
     * @returns {string[]}
     */
    static typeClassMembers(tc) {
        const dummy = tc.toType("", "");

        const typeMemberNames = Object.keys(tc.genTypeMembers(dummy)).sort();
        const instanceMemberNames = Object.keys(tc.genInstanceMembers(dummy)).sort();

        return typeMemberNames.concat(instanceMemberNames);
    }

    /**
     * @param {Type} type 
     * @param {TypeClass} tc 
     * @returns {boolean}
     */
    static typeImplements(type, tc) {
		if (type instanceof AllType) {
			return true;
		}

        const typeMembers = tc.genTypeMembers(type);

        for (let k in typeMembers) {
            const check = type.typeMembers[k]?.asType;

            if ((check && !typeMembers[k].asType?.isBaseOf(check)) || !check) {
                return false;
            } 
        }

        const instanceMembers = tc.genInstanceMembers(type);

        for (let k in instanceMembers) {
            const check = type.instanceMembers[k]?.asType;

            if ((check && !instanceMembers[k].asType?.isBaseOf(check)) || !check) {
                return false;
            }
        }

        return true;
    }

    /**
     * @type {null | DataType}
     */
    get asDataType() {
        return null;
    }

    /**
     * @type {null | EnumMemberType}
     */
    get asEnumMemberType() {
        return null;
    }

    /**
     * @type {null | Func}
     */
    get asFunc() {
        return null;
    }

    /**
	 * @type {null | Instance}
	 */
	get asInstance() {
		return null;
	}

    /**
     * @type {null | Multi}
     */
    get asMulti() {
        return null;
    }

    /**
     * @type {null | Named}
     */
    get asNamed() {
        return null;
    }

    /**
	 * @type {null | Namespace}
	 */
	get asNamespace() {
		return null;
	}

    /**
     * @type {null | Parametric}
     */
    get asParametric() {
        return null;
    }

	/**
	 * @type {null | Type}
	 */
	get asType() {
		return null;
	}

    /**
     * @type {null | Typed}
     */
    get asTyped() {
        return this.asInstance ?? this.asFunc;
    }

	/**
	 * @type {null | TypeClass}
	 */
	get asTypeClass() {
		return null;
	}

    /**
     * @returns {string}
     */
    toString() {
        throw new Error("not yet implemented");
    }
}

/**
 * @package
 * @implements {DataType}
 */
class AllType extends Common {
	constructor() {
		super();
	}

	/**
	 * @type {DataType}
	 */
	get asDataType() {
		return this;
	}

	/**
	 * @type {HeliosDataClass<HeliosData> | null}
	 */
	get offChainType() {
		return null;
	}

	/**
	 * @type {string[]}
	 */
	get fieldNames() {
		return [];
	}

	/**
	 * @type {Named}
	 */
	get asNamed() {
		return this;
	}

	/**
     * @type {Type}
     */
	get asType() {
        return this;
    }

	/**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
		return {};
	}

	/**
	 * @type {string}
	 */
	get name() {
		return "";
	}

	/**
	 * @type {string}
	 */
	get path() {
		return "";
	}

	/**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
		return {}
	}

	/**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
	infer(site, map, type) {
        return this;
    }

	/**
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(other) {
		return true;
	}

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		throw new Error("can't be turned into a type");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "All";
	}
}

/**
 * @package
 * @implements {Type}
 */
class AnyType extends Common {
	constructor() {
		super();
	}

	/**
     * @type {Type}
     */
	get asType() {
        return this;
    }

	/**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
		return {};
	}
	
	/**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
		return {}
	}

	/**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
	infer(site, map, type) {
        return this;
    }

	/**
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(other) {
		return true;
	}

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		throw new Error("can't be turned into a type");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Any";
	}
}

/**
 * Type of special case of no-return value where execution can't continue.
 * @package
 * @implements {Type}
 */
class ErrorType extends Common {
	constructor() {
        super();
	}

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {};
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {};
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
    infer(site, map, type) {
        return this;
    }

	/**
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(type) {
		return type instanceof ErrorType;
	}

    /**
     * @returns {string}
     */
    toString() {
        return "()";
    }

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new ErrorEntity();
	}
}

/**
 * @package
 */
class ArgType {
	#name;
	#type;
	#optional;

	/**
	 * 
	 * @param {null | Word} name 
	 * @param {Type} type 
	 * @param {boolean} optional 
	 */
	constructor(name, type, optional = false) {
		this.#name = name;
		this.#type = assertDefined(type);
		this.#optional = optional;
	}

	/**
	 * @type {string}
	 */
	get name() {
		if (this.#name === null) {
			return "";
		} else {
			return this.#name.toString();
		}
	}

	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

    /**
	 * @package
	 * @param {Site} site 
	 * @param {Map<string, Type>} map 
	 * @param {null | Type} type 
	 * @returns {ArgType}
	 */
	infer(site, map, type) {
		return new ArgType(
			this.#name,
			this.#type.infer(site, map, type),
			this.#optional
		);
	}

    /**
	 * @param {ArgType} other 
	 * @returns {boolean}
	 */
	isBaseOf(other) {
		// if this arg has a default value, the other arg must also have a default value
		if (this.#optional && !other.#optional) {
			return false;
		}

		// if this is named, the other must be named as well
		if (this.#name != null) {
			return this.#name.toString() == (other.#name?.toString() ?? "");
		}

		if (!other.#type.isBaseOf(this.#type)) { // note the reversal of the check
			return false;
		}

		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name !== null;
	}

	/**
	 * @returns {boolean}
	 */
	isOptional() {
		return this.#optional;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: ` : "",
			this.#optional ? "?" : "",
			this.#type.toString()
		].join("");
	}
}

/**
 * Function type with arg types and a return type
 * @package
 * @implements {Type}
 */
class FuncType extends Common {
	/**
	 * @type {ArgType[]}
	 */
	#argTypes;

	/**
	 * @type {Type[]}
	 */
	#retTypes;

	/**
	 * @param {Type[] | ArgType[]} argTypes 
	 * @param {Type | Type[]} retTypes 
	 */
	constructor(argTypes, retTypes) {
        super();

		this.#argTypes = argTypes.map(at => (at instanceof ArgType) ? at : new ArgType(null, at));

		if (!Array.isArray(retTypes)) {
			retTypes = [retTypes];
		}

		this.#retTypes = retTypes;
	}

    /**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#argTypes.slice().map(at => at.type);
	}

	/**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
		return {};
	}

    /**
	 * @type {number}
	 */
	get nArgs() {
		return this.#argTypes.length;
	}

    /**
	 * @type {number}
	 */
	get nNonOptArgs() {
		return this.#argTypes.filter(at => !at.isOptional()).length;
	}

    /**
	 * @type {number}
	 */
	get nOptArgs() {
		return this.#argTypes.filter(at => at.isOptional()).length;
	}

    /**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#retTypes;
	}

    /**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
		return {};
	}

	/**
	 * @type {Type}
	 */
	get asType() {
		return this;
    }


	/**
	 * Checks if arg types are valid.
	 * Throws errors if not valid. Returns the return type if valid. 
	 * @param {Site} site 
	 * @param {Typed[]} posArgs
	 * @param {{[name: string]: Typed}} namedArgs
	 * @returns {Type[]}
	 */
	checkCall(site, posArgs, namedArgs = {}) {
		if (posArgs.length < this.nNonOptArgs) {
			// check if each nonOptArg is covered by the named args
			for (let i = 0; i < this.nNonOptArgs; i++) {
				if (!this.#argTypes[i].isNamed()) {
					throw site.typeError(`expected at least ${this.#argTypes.filter(at => !at.isNamed()).length} positional arg(s), got ${posArgs.length} positional arg(s)`);
				} else if (!(this.#argTypes[i].name in namedArgs)) {
					throw site.typeError(`expected at least ${this.nNonOptArgs} arg(s), missing '${this.#argTypes[i].name}'`);
				}
			}

		} else if (posArgs.length > this.#argTypes.length) {
			throw site.typeError(`expected at most ${this.#argTypes.length} arg(s), got ${posArgs.length} arg(s)`);
		}

		for (let i = 0; i < posArgs.length; i++) {
			if (!Common.instanceOf(posArgs[i], this.#argTypes[i].type)) {
				throw site.typeError(`expected '${this.#argTypes[i].type.toString()}' for arg ${i + 1}, got '${posArgs[i].type.toString()}'`);
			}
		}

		for (let key in namedArgs) {
			const i = this.#argTypes.findIndex(at => at.name == key);

			if (i == -1) {
				throw site.typeError(`arg named ${key} not found in function type ${this.toString()}`);
			}

			if (i < posArgs.length) {
				throw site.typeError(`named arg '${key}' already covered by positional arg ${i+1}`);
			}

			const thisArg = this.#argTypes[i];

			if (!Common.instanceOf(namedArgs[key], thisArg.type)) {
				throw site.typeError(`expected '${thisArg.type.toString()}' for arg '${key}', got '${namedArgs[key].toString()}`);
			}
		}

		return this.#retTypes;
	}

    /**
	 * @package
	 * @param {Site} site
	 * @param {Map<string, Type>} map 
	 * @param {Type | null} type 
	 * @returns {Type}
	 */
	infer(site, map, type) {
		if (!type) {
			return new FuncType(
				this.#argTypes.map(at => at.infer(site, map, null)),
				this.#retTypes.map(rt=> rt.infer(site, map, null))
			);
		} else if (type instanceof FuncType) {
			if (type.argTypes.length == this.#argTypes.length && type.retTypes.length == this.#retTypes.length) {
				return new FuncType(
					this.#argTypes.map((at, i) => at.infer(site, map, type.argTypes[i])),
					this.#retTypes.map((rt, i) => rt.infer(site, map, type.retTypes[i]))
				);
			}
		}

		throw site.typeError(`unable to infer type of ${this.toString()}`);
	}

    /**
	 * @package
	 * @param {Site} site 
	 * @param {Map<string, Type>} map 
	 * @param {Type[]} argTypes 
	 * @returns {FuncType}
	 */
	inferArgs(site, map, argTypes) {
		if (argTypes.length == this.argTypes.length) {
			return new FuncType(
				this.#argTypes.map((at, i) => at.infer(site, map, argTypes[i])),
				this.#retTypes.map(rt => rt.infer(site, map, null))
			)
		}

		throw site.typeError("unable to infer from args");
	}

    /** 
	 * Checks if any of 'this' argTypes or retType is same as Type.
	 * Only if this checks return true is the association allowed.
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isAssociated(site, type) {
		for (let arg of this.#argTypes) {
			if (Common.typesEq(arg.type, type)) {
				return true;
			}
		}

		for (let rt of this.#retTypes) {
			if (Common.typesEq(type, rt)) {
				return true;
			}
		}

		return false;
	}

    /**
	 * Checks if 'this' is a base type of another FuncType.
	 * The number of args needs to be the same.
	 * Each argType of the FuncType we are checking against needs to be the same or less specific (i.e. isBaseOf(this.#argTypes[i]))
	 * The retType of 'this' needs to be the same or more specific
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(other) {
		if (other instanceof FuncType) {
			if (this.nNonOptArgs != other.nNonOptArgs) {
				return false;
			} else {
				for (let i = 0; i < this.nNonOptArgs; i++) {
					if (!this.#argTypes[i].isBaseOf(other.#argTypes[i])) {
						return false;
					}
				}

				if (this.#retTypes.length === other.#retTypes.length) {
					for (let i = 0; i < this.#retTypes.length; i++) {
						if (!this.#retTypes[i].isBaseOf(other.#retTypes[i])) {
							return false;
						}
					}

					return true;
				} else {
					return false;
				}
			}

		} else {
			return false;
		}
	}

    /**
	 * Checks if the type of the first arg is the same as 'type'
	 * Also returns false if there are no args.
	 * For a method to be a valid instance member its first argument must also be named 'self', but that is checked elsewhere
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isMaybeMethod(site, type) {
		if (this.#argTypes.length > 0) {
			return Common.typesEq(this.#argTypes[0].type, type);
		} else {
			return false;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypes.length === 1) {
			return `(${this.#argTypes.map(a => a.toString()).join(", ")}) -> ${this.#retTypes.toString()}`;
		} else {
			return `(${this.#argTypes.map(a => a.toString()).join(", ")}) -> (${this.#retTypes.map(t => t.toString()).join(", ")})`;
		}
	}
	
	/**
	 * Throws an error if name isn't found
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getNamedIndex(site, name) {
		const i = this.#argTypes.findIndex(at => at.name == name);

		if (i == -1) {
			throw site.typeError(`arg name ${name} not found`);
		} else {
			return i;
		}
	}

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new FuncEntity(this);
	}
}

/**
 * Created by statements
 * @package
 * @template {HeliosData} T
 * @implements {DataType}
 */
class GenericType extends Common {
    #name;

    /**
     * @type {string}
     */
    #path;

	#genOffChainType;
    #offChainType;
    #fieldNames;

	/**
	 * defer until needed
	 * @type {(self: Type) => InstanceMembers}
	 */
	#genInstanceMembers; 

	/**
	 * defer until needed
	 * @type {(self: Type) => TypeMembers}
	 */
	#genTypeMembers;

    /**
     * @param {({
     *   name: string,
     *   path?: string,
     *   offChainType?: HeliosDataClass<T> | null,
	 *   genOffChainType?: (() => HeliosDataClass<T>) | null
     *   fieldNames?: string[],
     *   genInstanceMembers: (self: Type) => InstanceMembers,
     *   genTypeMembers: (self: Type) => TypeMembers
     * })} props
     */
    constructor({name, path, offChainType, genOffChainType, fieldNames, genInstanceMembers, genTypeMembers}) {
        super();

        this.#name = name;
        this.#path = path ?? `__helios__${name.toLowerCase()}`;
		this.#genOffChainType = genOffChainType ?? null;
        this.#offChainType = offChainType ?? null;
        this.#fieldNames = fieldNames ?? [];

		this.#genInstanceMembers = genInstanceMembers;
		this.#genTypeMembers = genTypeMembers;
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this.#fieldNames;
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
		return this.#genInstanceMembers(this);
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name;
    }

    /**
     * @type {null | HeliosDataClass<T>}
     */
    get offChainType() {
		if (this.#offChainType) {
			return this.#offChainType;
		} else if (this.#genOffChainType) {
			return this.#genOffChainType();
		} else {
			return null;
		}
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#path;
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
		return this.#genTypeMembers(this);
    }

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this;
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this;
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
     * @param {Site} site 
     * @param {Map<string, Type>} map
     */
    inferInternal(site, map) {
		return {
			name: this.#name,
			path: this.#path,
			fieldNames: this.#fieldNames,
			genInstanceMembers: (self) => {
				/**
				 * @type {InstanceMembers}
				 */
				const instanceMembers = {};

				const oldInstanceMembers = this.#genInstanceMembers(self);

				for (let k in oldInstanceMembers) {
					const v = oldInstanceMembers[k];

					if (v.asParametric) {
						instanceMembers[k] = v.asParametric.infer(site, map);
					} else if (v.asType) {
						instanceMembers[k] = v.asType.infer(site, map, null);
					} else {
						throw new Error("unhandled");
					}
				}

				return instanceMembers;
			},
			genTypeMembers: (self) => {
				/**
				 * @type {TypeMembers}
				 */
				const typeMembers = {};

				const oldTypeMembers = this.#genTypeMembers(self);

				for (let k in oldTypeMembers) {
					const v = oldTypeMembers[k];

					if (v.asParametric) {
						typeMembers[k] = v.asParametric.infer(site, map);
					} else if (v.asTyped) {
						typeMembers[k] = v.asTyped.type.infer(site, map, null).toTyped();
					} else if (v.asType) {
						typeMembers[k] = v.asType.infer(site, map, null);
					} else {
						throw new Error("unhandled");
					}
				}

				return typeMembers;
			}
		}
    }

	/**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
	infer(site, map, type) {
		if (type !== null) {
			return this;
		} else {
			return new GenericType(this.inferInternal(site, map));
		}
	}

	/**
	 * @param {string} name 
	 * @param {string} path 
	 * @returns {GenericType}
	 */
	changeNameAndPath(name, path) {
		return new GenericType({
			name: name,
			path: path,
			fieldNames: this.#fieldNames,
			genInstanceMembers: this.#genInstanceMembers,
			genTypeMembers: this.#genTypeMembers
		});
	}

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
		if (other.asEnumMemberType) {
			return this.isBaseOf(other.asEnumMemberType.parentType);
		} else if (other.asNamed) { 
			return other.asNamed.path == this.#path;
		} else {
			return false;
		}
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.name;
    }

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new DataEntity(this);
	}
}

/**
 * Created by statements
 * @package
 * @template {HeliosData} T
 * @implements {EnumMemberType}
 * @extends {GenericType<T>}
 */
class GenericEnumMemberType extends GenericType {
    #constrIndex;
    #parentType;

    /**
     * @param {({
     *   name: string,
     *   path?: string,
     *   constrIndex: number,
     *   parentType: DataType,
     *   offChainType?: HeliosDataClass<T>,
	 *   genOffChainType?: () => HeliosDataClass<T>,
     *   fieldNames?: string[],
     *   genInstanceMembers: (self: Type) => InstanceMembers,
     *   genTypeMembers?: (self: Type) => TypeMembers
     * })} props
     */
    constructor({name, path, constrIndex, parentType, offChainType, genOffChainType, fieldNames, genInstanceMembers, genTypeMembers}) {
        super({
            name, 
            path: path ?? `${parentType.path}__${name.toLowerCase()}`, 
			genOffChainType,
            offChainType, 
            fieldNames, 
            genInstanceMembers, 
            genTypeMembers: genTypeMembers ?? ((self) => ({}))
        });

        this.#constrIndex = constrIndex;
        this.#parentType = parentType;
    }
    
    /**
     * @type {number}
     */
    get constrIndex() {
        return this.#constrIndex;
    }

    /**
     * @type {DataType}
     */
    get parentType() {
        return this.#parentType;
    }

    /**
     * @type {EnumMemberType}
     */
    get asEnumMemberType() {
        return this;
    }

	/**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
	infer(site, map, type) {
		if (type !== null) {
			return this;
		} else {
			return new GenericEnumMemberType({
				...this.inferInternal(site, map),
				parentType: assertDefined(this.#parentType.infer(site, map, null).asDataType),
				constrIndex: this.#constrIndex
			});
		}
	}

	/**
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(other) {
		if (other instanceof GenericEnumMemberType) {
			return other.path == this.path;
		} else {
			return false;
		}
	}

	/**
	 * @returns {string}
	 */
    toString() {
        return `${this.#parentType.toString()}::${this.name}`;
    }
}

/**
 * Type of return-value of functions that don't return anything (eg. assert, print, error)
 * @package
 * @implements {Type}
 */
class VoidType extends Common {
	constructor() {
		super();
	}

	/**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {};
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {};
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
     * 
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
    infer(site, map, type) {
        return this;
    }

	/**
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(type) {
		return type instanceof VoidType;
	}

    /**
     * @returns {string}
     */
    toString() {
		return "()";
	}
	
	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new VoidEntity();
	}
}


/**
 * A regular non-Func Instance. DataValues can always be compared, serialized, used in containers.
 * @package
 * @implements {Instance}
 */
class DataEntity extends Common {
	#type;

	/**
	 * @param {DataType} type 
	 */
	constructor(type) {
        super();
		assert(!(type instanceof FuncType));
		this.#type = type;
	}

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this.#type.fieldNames;
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return this.#type.instanceMembers;
    }

	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

    /**
     * @type {Instance}
     */
    get asInstance() {
        return this;
    }

	/**
	 * @type {Typed}
	 */
	get asTyped() {
		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#type.toString();
	}
}

/**
 * Returned by an error()
 * Special case of no-return-value that indicates that execution can't proceed.
 * @package
 */
class ErrorEntity extends Common {
	constructor() {
		super();
	}

	/**
	 * @type {string[]}
	 */
	get fieldNames() {
		return [];
	}

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {};
    }

    /**
     * @type {Type}
     */
	get type() {
		return new ErrorType();
	}

    /**
     * @type {Instance}
     */
    get asInstance() {
        return this;
    }

	/**
	 * @type {Typed}
	 */
	get asTyped() {
		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()";
	}
}

/**
 * @package
 * @implements {Named}
 */
class NamedEntity {
	#name;
	#path;
	#entity;

	/**
	 * @param {string} name 
	 * @param {string} path 
	 * @param {EvalEntity} entity
	 */
	constructor(name, path, entity) {
		this.#name = name;
		this.#path = path;
		this.#entity = entity;
	}

	/**
	 * @type {null | DataType}
	 */
	get asDataType() {
		return this.#entity.asDataType;
	}

	/**
	 * @type {null | EnumMemberType}
	 */
	get asEnumMemberType() {
		return this.#entity.asEnumMemberType;
	}

	/**
	 * @type {null | Func}
	 */
	get asFunc() {
		return this.#entity.asFunc;
	}

	/**
	 * @type {null | Instance}
	 */
	get asInstance() {
		return this.#entity.asInstance;
	}
	
	/**
	 * @type {null | Multi}
	 */
	get asMulti() {
		return this.#entity.asMulti;
	}

	/**
	 * @type {Named}
	 */
	get asNamed() {
		return this;
	}

	/**
	 * @type {null | Namespace}
	 */
	get asNamespace() {
		return this.#entity.asNamespace;
	}

	/**
	 * @type {null | Parametric}
	 */
	get asParametric() {
		return this.#entity.asParametric;
	}

	/**
	 * @type {null | Type}
	 */
	get asType() {
		return this.#entity.asType;
	}

	/**
	 * @type {null | Typed}
	 */
	get asTyped() {
		return this.#entity.asTyped;
	}

	/**
	 * @type {null | TypeClass}
	 */
	get asTypeClass() {
		return this.#entity.asTypeClass;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return this.#path;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#entity.toString();
	}
}

/**
 * A callable Instance.
 * @package
 * @implements {Func}
 */
class FuncEntity extends Common {
	/**
	 * @type {FuncType}
	 */
	#type;

	#name;
	#path;

	/**
	 * @param {FuncType} type
	 */
	constructor(type) {
        super();

		assert(type instanceof FuncType);

		this.#type = type;
	}

	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

    /**
	 * Returns the underlying FuncType directly.
	 * @type {FuncType}
	 */
	get funcType() {
		return this.#type;
	}

	/**
	 * @type {Func}
	 */
	get asFunc() {
		return this;
	}

	/**
	 * @type {Typed}
	 */
	get asTyped() {
		return this;
	}

    /**
	 * @param {Site} site 
	 * @param {Typed[]} args 
	 * @param {{[name: string]: Typed}} namedArgs
	 * @returns {Typed | Multi}
	 */
	call(site, args, namedArgs = {}) {
		return Common.toTyped(this.#type.checkCall(site, args, namedArgs));
	}

	/**
	 * Returns a string representing the type.
	 * @returns {string}
	 */
	toString() {
		return this.#type.toString();
	}
}

/**
 * Wraps multiple return values
 * @package
 * @implements {Multi}
 */
class MultiEntity extends Common {
	#values;

	/**
	 * @param {Typed[]} values 
	 */
	constructor(values) {
        super();

		this.#values = values;
	}

    /**
	 * @param {(Typed | Multi)[]} vals
	 * @returns {Typed[]}
	 */
    static flatten(vals) {
        /**
         * @type {Typed[]}
         */
        let result = [];

        for (let v of vals) {
            if (v.asMulti) {
                result = result.concat(v.asMulti.values);
            } else if (v.asTyped) {
                result.push(v.asTyped);
            } else {
				throw new Error("unexpected");
			}
        }

        return result;
    }

	/**
	 * @type {Typed[]}
	 */
	get values() {
		return this.#values;
	}

    /**
	 * @type {Multi}
	 */
	get asMulti() {
		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#values.map(v => v.toString()).join(", ")})`;
	}	
}

/**
 * @package
 * @implements {Typed}
 */
class TypedEntity extends Common {
	/**
	 * @type {Type}
	 */
	#type;

	/**
	 * @param {Type} type 
	 */
	constructor(type) {
		super();

		this.#type = type;
	}

	/**
	 * @returns {Typed}
	 */
	get asTyped() {
		return this
	}

	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}
}

/**
 * Returned by functions that don't return anything (eg. assert, error, print)
 * @package
 * @implements {Instance}
 */
class VoidEntity extends Common {
	constructor() {
		super();
	}

	/**
	 * @type {string[]}
	 */
	get fieldNames() {
		return [];
	}

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {};
    }

    /**
     * @type {Type}
     */
	get type() {
		return new VoidType();
	}

    /**
     * @type {Instance}
     */
    get asInstance() {
        return this;
    }

	/**
	 * @type {Typed}
	 */
	get asTyped() {
		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()";
	}
}

/**
 * @package
 * @implements {Namespace}
 */
class ModuleNamespace extends Common {
	#members;

	/**
	 * @param {NamespaceMembers} members
	 */
	constructor(members) {
		super();
		this.#members = members;
	}

	/**
	 * @type {NamespaceMembers}
	 */
	get namespaceMembers() {
		return this.#members;
	}

	/**
	 * @type {Namespace}
	 */
	get asNamespace() {
		return this;
	}
}


///////////////////////////////////
// Section 14: Eval primitive types
///////////////////////////////////
/**
 * @package
 * @param {Type} type
 * @returns {InstanceMembers}
 */
function genCommonInstanceMembers(type) {
    return {
        serialize: new FuncType([], ByteArrayType),
    }
}

/**
 * @package
 * @param {Type} type
 * @returns {TypeMembers}
 */
function genCommonTypeMembers(type) {
    return {
        __eq:      new FuncType([type, type], BoolType),
        __neq:     new FuncType([type, type], BoolType),
        from_data: new FuncType([RawDataType], type),
        __to_data: new FuncType([type], RawDataType),
    }
}

/**
 * @package
 * @param {Type} type
 * @param {Type} parentType
 * @returns {TypeMembers}
 */
function genCommonEnumTypeMembers(type, parentType) {
    return {
        __eq:      new FuncType([type, parentType], BoolType),
        __neq:     new FuncType([type, parentType], BoolType),
        from_data: new FuncType([RawDataType], type),
        __to_data: new FuncType([type], RawDataType),
    }
}


/**
 * Builtin bool type
 * @package
 * @type {DataType}
 */
const BoolType = new GenericType({
    name: "Bool",
    offChainType: Bool,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        show:      new FuncType([], StringType),
        to_int:    new FuncType([], IntType),
        trace:     new FuncType([StringType], self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __and:     new FuncType([self, self], self),
        __neq:     new FuncType([self, self], self),
        __not:     new FuncType([self], self),
        __or:      new FuncType([self, self], self),
        and:       new FuncType([new FuncType([], self), new FuncType([], self)], self),
        or:        new FuncType([new FuncType([], self), new FuncType([], self)], self)
    })
});

/**
 * Builtin bytearray type
 * @package
 * @type {DataType}
 */
const ByteArrayType = new GenericType({
    name: "ByteArray",
    offChainType: ByteArray,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        blake2b: new FuncType([], self),
        decode_utf8: new FuncType([], StringType),
        ends_with: new FuncType([self], BoolType),
        length: IntType,
        prepend: new FuncType([IntType], self),
        sha2: new FuncType([], self),
        sha3: new FuncType([], self),
        show: new FuncType([], StringType),
        slice: new FuncType([IntType, IntType], self),
        starts_with: new FuncType([self], BoolType),
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType)
    })
});

/**
 * @package
 * @type {DataType}
 */
const IntType = new GenericType({
    name: "Int",
    offChainType: HInt,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        abs: new FuncType([], self),
        bound: new FuncType([self, self], self),
        bound_max: new FuncType([self], self),
        bound_min: new FuncType([self], self),
        decode_zigzag: new FuncType([], self),
        encode_zigzag: new FuncType([], self),
        show: new FuncType([], StringType),
        to_base58: new FuncType([], StringType),
        to_big_endian: new FuncType([], ByteArrayType),
        to_bool: new FuncType([], BoolType),
        to_hex: new FuncType([], StringType),
        to_little_endian: new FuncType([], ByteArrayType),
        to_real: new FuncType([], RealType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self),
        __add1: new FuncType([self, RealType], RealType),
        __div: new FuncType([self, self], self),
        __div1: new FuncType([self, RealType], RealType),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType),
        __mod: new FuncType([self, self], self),
        __mul: new FuncType([self, self], self),
        __mul1: new FuncType([self, RealType], RealType),
        __neg: new FuncType([self], self),
        __pos: new FuncType([self], self),
        __sub: new FuncType([self, self], self),
        __sub1: new FuncType([self, RealType], RealType),
        from_base58: new FuncType([StringType], self),
        from_big_endian: new FuncType([ByteArrayType], self),
        from_little_endian: new FuncType([ByteArrayType], self),
        max: new FuncType([self, self], self),
        min: new FuncType([self, self], self),
        parse: new FuncType([StringType], self),
        sqrt: new FuncType([self], self)
    })
});

/**
 * Type of external data that must be cast/type-checked before using
 * Not named 'Data' in Js because it's too generic
 * @package
 * @type {DataType}
 */
const RawDataType = new GenericType({
    name: "Data",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        tag: IntType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self)
    })
});

/**
 * Builtin Real fixed point number type
 * @package
 * @type {DataType}
 */
const RealType = new GenericType({
    name: "Real",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        abs: new FuncType([], self),
        ceil: new FuncType([], IntType),
        floor: new FuncType([], IntType),
        round: new FuncType([], IntType),
        show: new FuncType([], StringType),
        trunc: new FuncType([], IntType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self),
        __add1: new FuncType([self, IntType], self),
        __div: new FuncType([self, self], self),
        __div1: new FuncType([self, IntType], self),
        __eq1: new FuncType([self, IntType], BoolType),
        __geq: new FuncType([self, self], BoolType),
        __geq1: new FuncType([self, IntType], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __gt1: new FuncType([self, IntType], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __leq1: new FuncType([self, IntType], BoolType),
        __lt: new FuncType([self, self], BoolType),
        __lt1: new FuncType([self, IntType], BoolType),
        __mul: new FuncType([self, self], self),
        __mul1: new FuncType([self, IntType], self),
        __neg: new FuncType([self], self),
        __neq1: new FuncType([self, IntType], BoolType),
        __pos: new FuncType([self], self),
        __sub: new FuncType([self, self], self),
        __sub1: new FuncType([self, IntType], self),
        sqrt: new FuncType([self], self)
    })
});

/**
 * Builtin string type
 * @package
 * @type {DataType}
 */
const StringType = new GenericType({
    name: "String",
    offChainType: HString,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        encode_utf8: new FuncType([], ByteArrayType),
        ends_with: new FuncType([self], BoolType),
        starts_with: new FuncType([self], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self)
    })
});


///////////////////////////////////////
// Section 15: Eval builtin typeclasses
///////////////////////////////////////

/**
 * @package
 * @implements {Type}
 */
class TypeClassImpl extends Common {
	/**
	 * @type {string}
	 */
	#name;
	/**
	 * @type {InstanceMembers}
	 */
	#instanceMembers;

	/**
	 * @type {TypeMembers}
	 */
	#typeMembers;

	/**
	 * @param {TypeClass} typeClass
	 */
	constructor(typeClass, name) {
		super();
		this.#name = name;
        this.#instanceMembers = typeClass.genInstanceMembers(this);
		this.#typeMembers = typeClass.genTypeMembers(this);
    }

    /**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
		return this.#instanceMembers;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
		return this.#typeMembers;
	}

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
	 * @package
	 * @param {Site} site 
	 * @param {Map<string, Type>} map 
	 * @param {null | Type} type
	 * @returns {Type}
	 */
	infer(site, map, type) {
		const prev = map.get(this.#name);

		if (!prev) {
			if (type) {
				map.set(this.#name, type);

				return type;
			} else {
				// type not yet available: could be parametric func inside a parametric type
				return this;
			}
		} else {
			return prev;
		}
	}

	/**
	 * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(type) {
		if (type instanceof TypeClassImpl) {
			// we cans simply use name because name-shadowing isn't allowed
			return type.name == this.name;
		} else {
			return false;
		}
	}

    /**
	 * @returns {string}
	 */
	toString() {
		return this.name;
	}

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new TypedEntity(this);
	}
}

/**
 * @package
 * @implements {DataType}
 */
class DataTypeClassImpl extends TypeClassImpl {
	/**
     * @type {string}
     */
	#path;

	/**
	 * @param {TypeClass} typeClass
	 * @param {string} name
	 * @param {string} path
	 */
	constructor(typeClass, name, path) {
		super(typeClass, name);

		this.#path = path;
    }

	/**
	 * @type {string[]}
	 */
	get fieldNames() {
		return [];
	}

	/**
	 * @type {null | HeliosDataClass<HeliosData>}
	 */
	get offChainType() {
		return null;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return this.#path;
	}

	/**
	 * @type {Named}
	 */
	get asNamed() {
		return this;
	}

	/**
	 * @type {DataType}
	 */
	get asDataType() {
		return this;
	}

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new DataEntity(this);
	}
}

/**
 * @package
 * @implements {TypeClass}
 */
class AnyTypeClass extends Common {
    constructor() {
        super();
    }

	/**
	 * @type {TypeClass}
	 */
	get asTypeClass() {
		return this;
	}

    /**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genInstanceMembers(impl) {
		return {};
	}

	/**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genTypeMembers(impl) {
		return {};
    }

	/**
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isImplementedBy(type) {
		return true;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Any";
	}

    /**
     * @param {string} name 
	 * @param {string} path
     * @returns {Type}
     */
    toType(name, path) {
		return new TypeClassImpl(this, name);
    }
}

/**
 * @package
 * @implements {TypeClass}
 */
class DefaultTypeClass extends Common {
    constructor() {
        super();
    }

	/**
	 * @type {TypeClass}
	 */
	get asTypeClass() {
		return this;
	}

	/**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genTypeMembers(impl) {
		return {
            __eq: new FuncType([impl, impl], BoolType),
            __neq: new FuncType([impl, impl], BoolType),
			__to_data: new FuncType([impl], RawDataType),
			from_data: new FuncType([RawDataType], impl)
		}
	}

	/**	
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genInstanceMembers(impl) {
		return {
            serialize: new FuncType([], ByteArrayType)
		}
	}

	/**
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isImplementedBy(type) {
		return Common.typeImplements(type, this) || type instanceof AllType;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "";
	}

    /**
     * @param {string} name 
	 * @param {string} path
     * @returns {DataType}
     */
    toType(name, path) {
        return new DataTypeClassImpl(this, name, path);
    }
}


/**
 * @package
 */
class Parameter {
	/** 
	 * @type {string} 
	 */
	#name;

	/** 
	 * @type {string} 
	 */
	#path;

	/** 
	 * @type {TypeClass}
	 */
	#typeClass;

	/**
	 * @param {string} name - typically "a" or "b"
	 * @param {string} path - typicall "__T0" or "__F0"
	 * @param {TypeClass} typeClass
	 */
	constructor(name, path, typeClass) {
		this.#name = name;
		this.#path = path;
		this.#typeClass = typeClass
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {Type}
	 */
	get ref() {
		return this.#typeClass.toType(this.#name, this.#path);
	}

	/**
	 * A null TypeClass matches any type
	 * @type {TypeClass}
	 */
	get typeClass() {
		return this.#typeClass;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#typeClass && this.#typeClass.toString() != "") {
			return `${this.#name}: ${this.#typeClass.toString()}`
		} else {
			return this.#name;
		}
	}
}

/**
 * Only func instances can be parametrics instances,
 *  there are no other kinds of parametric instances
 * @package
 * @implements {Parametric}
 */
class ParametricFunc extends Common {
	#params;
	#fnType;

	/**
	 * @param {Parameter[]} params
	 * @param {FuncType} fnType
	 */
	constructor(params, fnType) {
		super();
		this.#params = params;
		this.#fnType = fnType;
	}

	/**
	 * @type {null | ((...any) => HeliosDataClass<HeliosData>)}
	 */
	get offChainType() {
		return null;
	}

	get params() {
		return this.#params;
	}

	get fnType() {
		return this.#fnType;
	}

	/**
	 * null TypeClasses aren't included
	 * @type {TypeClass[]}
	 */
	get typeClasses() {
		return this.#params.map(p => p.typeClass);
	}

	/**
	 * @param {Type[]} types 
	 * @param {Site} site
	 * @returns {EvalEntity}
	 */
	apply(types, site = Site.dummy()) {
		if (types.length != this.#params.length) {
			throw site.typeError("wrong number of parameter type arguments");
		}

		/**
		 * @type {Map<string, Type>}
		 */
		const map = new Map();

		this.#params.forEach((p, i) => {
			if (!p.typeClass.isImplementedBy(types[i])) {
				throw site.typeError("typeclass match failed")
			}

			map.set(p.name, types[i]);
		});

		const inferred = this.#fnType.infer(site, map, null);

		return new FuncEntity(assertClass(inferred, FuncType));
	}

	/**
	 * @type {Parametric}
	 */
	get asParametric() {
		return this;
	}

    /**
	 * Must infer before calling
	 * @param {Site} site 
	 * @param {Typed[]} args
	 * @param {{[name: string]: Typed}} namedArgs
	 * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
	 * @returns {Func}
	 */
	inferCall(site, args, namedArgs = {}, paramTypes = []) {
		/**
		 * @type {Map<string, Type>}
		 */
		const map = new Map();

		const fnType = this.#fnType.inferArgs(site, map, args.map(a => a.type));

		// make sure that each parameter is defined in the map
		this.#params.forEach(p => {
			const pt = map.get(p.name);

			if (!pt) {
				throw site.typeError(`failed to infer type of '${p.name}'  (hint: apply directly using [...])`);
			}

			paramTypes.push(pt);
		});

		return new FuncEntity(fnType);
	}
	
	/**
	 * @param {Site} site 
	 * @param {Map<string, Type>} map 
	 * @returns {Parametric}
	 */
	infer(site, map) {
		const fnType = assertClass(this.#fnType.infer(site, map, null), FuncType);

		return new ParametricFunc(this.#params, fnType);
	}

    /**
     * @returns {string}
     */
	toString() {
		return `[${this.#params.map(p => p.toString()).join(", ")}]${this.#fnType.toString()}`;
	}
}

/**
 * @package
 * @implements {DataType}
 */
class AppliedType extends Common {
    #types;
    #apply;
    #inner;

    /**
     * @param {Type[]} types
     * @param {(types: Type[]) => DataType} apply
     * @param {DataType} inner 
     */
    constructor(types, apply, inner) {
        super();

        this.#types = types;
        this.#apply = apply;
        this.#inner = inner;
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this.#inner.fieldNames;
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return this.#inner.instanceMembers;
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#inner.name;
    }

    /**
     * @type {null | HeliosDataClass<HeliosData>}
     */
    get offChainType() {
        return this.#inner.offChainType;
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#inner.path;
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return this.#inner.typeMembers;
    }

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this;
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this;
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
    infer(site, map, type) {
        if (!type) {
            const inferred = this.#types.map(t => t.infer(site, map, null));

            return new AppliedType(inferred, this.#apply, this.#apply(inferred));
		} else if (type instanceof AppliedType && type.#types.length == this.#types.length) {
            const inferred = this.#types.map((t, i) => t.infer(site, map, type.#types[i]));

            const res = new AppliedType(inferred, this.#apply, this.#apply(inferred));

			if (!res.isBaseOf(type)) {
				throw site.typeError("unable to infer type");
			}

			return res;
        } else {
			throw site.typeError("unable to infer type");
		}
    }

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
        return this.#inner.isBaseOf(other);
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#inner.toString();
    }

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new DataEntity(this);
	}
}

/**
 * @package
 * @implements {Parametric}
 */
class ParametricType extends Common {
	#name;
    #offChainType;
    #parameters;
    #apply;

    /**
     * @param {{
	 * 	 name: string,
     *   offChainType?: ((...any) => HeliosDataClass<HeliosData>)
     *   parameters: Parameter[]
     *   apply: (types: Type[]) => DataType
     * }} props
     */
    constructor({name, offChainType, parameters, apply}) {
        super();
		this.#name = name;
        this.#offChainType = offChainType ?? null;
        this.#parameters = parameters;
        this.#apply = apply;
    }

    /**
     * @type {Parametric}
     */
    get asParametric() {
        return this;
    }

    /**
     * @type {null | ((...any) => HeliosDataClass<HeliosData>)}
     */
    get offChainType() {
        return this.#offChainType;
    }

	/**
	 * @type {TypeClass[]}
	 */
	get typeClasses() {
		return this.#parameters.map(p => p.typeClass);
	}

    /**
     * @param {Type[]} types 
     * @param {Site} site 
     * @returns {EvalEntity}
     */
    apply(types, site = Site.dummy()) {
        if (types.length != this.#parameters.length) {
			throw site.typeError(`expected ${this.#parameters.length} type parameter(s), got ${types.length}`);
		}

		this.#parameters.forEach((p, i) => {
			if (!p.typeClass.isImplementedBy(types[i])) {
				throw site.typeError(`${types[i].toString()} doesn't implement ${p.typeClass.toString()}`);
			}
		});

		return new AppliedType(types, this.#apply, this.#apply(types));
    }

	 /**
	 * Must infer before calling
	 * @param {Site} site 
	 * @param {Typed[]} args
	 * @param {{[name: string]: Typed}} namedArgs
	 * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
	 * @returns {Func}
	 */
	inferCall(site, args, namedArgs = {}, paramTypes = []) {
		throw site.typeError("not a parametric function");
	}

	/**
	 * @param {Site} site 
	 * @param {Map<string, Type>} map 
	 * @returns {Parametric}
	 */
	infer(site, map) {
		throw site.typeError("not a parametric function");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#name}`;//[${this.#parameters.map(p => p.toString())}]`;
	}
}


/////////////////////////////////////
// Section 16: Eval builtin functions
/////////////////////////////////////

/**
 * Used by print, error, and assert
 * @package
 * @implements {Func}
 * @implements {Named}
 */
class BuiltinFunc extends Common {
	/**
	 * @type {string}
	 */
	#name;

	/**
	 * @type {FuncType}
	 */
	#type;

	/**
	 * 
	 * @param {{
	 *   name: string,
	 *   type: FuncType
	 * }} props
	 */
	constructor({name, type}) {
		super();
		this.#name = name;
		this.#type = type;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#name}`;
	}

	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @type {Func}
	 */
	get asFunc() {
		return this;
	}

	/**
     * @type {Named}
     */
	get asNamed() {
        return this;
    }

	/**
	 * @type {Typed}
	 */
	get asTyped() {
		return this;
	}

	/**
	 * @param {Site} site 
	 * @param {Typed[]} args 
	 * @param {{[name: string]: Typed}} namedArgs
	 * @returns {Typed | Multi}
	 */
	call(site, args, namedArgs = {}) {
		return Common.toTyped(this.#type.checkCall(site, args, namedArgs));
	}

	/**
     * @returns {string}
     */
    toString() {
        return this.name;
    }
}

/**
 * Special builtin function that throws an error if condition is false and returns Void
 * @package
 */
const AssertFunc = new BuiltinFunc({
    name: "assert",
    type: new FuncType([BoolType, StringType], new VoidType())
});

/**
 * Special builtin function that throws an error and returns ErrorInstance (special case of Void)
 * @package
 */
const ErrorFunc = new BuiltinFunc({
	name: "error",
	type: new FuncType([StringType], new ErrorType())
});

/**
 * Special builtin function that prints a message and returns void
 * @package
 */
const PrintFunc = new BuiltinFunc({
	name: "print",
	type:  new FuncType([StringType], new VoidType())
});


///////////////////////////////////
// Section 17: Eval container types
///////////////////////////////////

/**
 * Builtin list type
 * @package
 * @type {Parametric}
 */
const ListType = new ParametricType({
	name: "[]",
	offChainType: HList,
	parameters: [new Parameter("ItemType", `${TTPP}0`, new DefaultTypeClass())],
	apply: ([itemType]) => {
		const offChainItemType = itemType.asDataType?.offChainType ?? null;
		const offChainType = offChainItemType ? HList(offChainItemType) : null;

		return new GenericType({
			offChainType: offChainType,
			name: `[]${itemType.toString()}`,
			path: `__helios__list[${assertDefined(itemType.asDataType).path}]`,
			genInstanceMembers: (self) => {
				/**
				 * @type {InstanceMembers}
				 */
				const specialMembers = {};

				if (IntType.isBaseOf(itemType)) {
					specialMembers.sum = new FuncType([], itemType);
				} else if (RealType.isBaseOf(itemType)) {
					specialMembers.sum = new FuncType([], itemType);
				} else if (StringType.isBaseOf(itemType)) {
					specialMembers.join = new FuncType([
						new ArgType(new Word(Site.dummy(), "separator"), StringType, true)
					], StringType);
				} else if (ByteArrayType.isBaseOf(itemType)) {
					specialMembers.join = new FuncType([
						new ArgType(new Word(Site.dummy(), "separator"), ByteArrayType, true)
					], ByteArrayType);
				} else if (itemType.asNamed?.name.startsWith("[]")) {
					specialMembers.flatten = new FuncType([], itemType);
				}

				return {
					...genCommonInstanceMembers(self),
					...specialMembers,
					all: new FuncType([new FuncType([itemType], BoolType)], BoolType),
					any: new FuncType([new FuncType([itemType], BoolType)], BoolType),
					drop: new FuncType([IntType], self),
					drop_end: new FuncType([IntType], self),
					filter: new FuncType([new FuncType([itemType], BoolType)], self),
					find: new FuncType([new FuncType([itemType], BoolType)], itemType),
					find_safe: new FuncType([new FuncType([itemType], BoolType)], OptionType$(itemType)),
					fold: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([a.ref, itemType], a.ref), a.ref], a.ref));
					})(),
					fold_lazy: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType, new FuncType([], a.ref)], a.ref), a.ref], a.ref));
					})(),
					for_each: new FuncType([new FuncType([itemType], new VoidType())], new VoidType()),
					get: new FuncType([IntType], itemType),
					get_singleton: new FuncType([], itemType),
					head: itemType,
					is_empty: new FuncType([], BoolType),
					length: IntType,
					map: (() => {
						const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType], a.ref)], ListType$(a.ref)));
					})(),
					prepend: new FuncType([itemType], self),
					sort: new FuncType([new FuncType([itemType, itemType], BoolType)], self),
					tail: self,
					take: new FuncType([IntType], self),
					take_end: new FuncType([IntType], self),
				}
			},
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
				__add: new FuncType([self, self], self),
				new: new FuncType([IntType, new FuncType([IntType], itemType)], self),
				new_const: new FuncType([IntType, itemType], self)
			})
		})
	}
});

/**
 * @param {Type} itemType 
 * @returns {DataType}
 */
export function ListType$(itemType) {
	return applyTypes(ListType, itemType);
}

/**
 * Builtin map type (in reality list of key-value pairs)
 * @package
 * @type {Parametric}
 */
const MapType = new ParametricType({
	name: "Map",
	offChainType: HMap,
	parameters: [
		new Parameter("KeyType", `${TTPP}0`, new DefaultTypeClass()), 
		new Parameter("ValueType", `${TTPP}1`, new DefaultTypeClass())
	],
	apply: ([keyType, valueType]) => {
		const offChainKeyType = keyType.asDataType?.offChainType ?? null;
		const offChainValueType = valueType.asDataType?.offChainType ?? null;
		const offChainType = offChainKeyType && offChainValueType ? HMap(offChainKeyType, offChainValueType) : null;

		return new GenericType({
			offChainType: offChainType,
			name: `Map[${keyType.toString()}]${valueType.toString()}`,
			path: `__helios__map[${assertDefined(keyType.asDataType).path}@${assertDefined(valueType.asDataType).path}]`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				all: new FuncType([new FuncType([keyType, valueType], BoolType)], BoolType),
				any: new FuncType([new FuncType([keyType, valueType], BoolType)], BoolType),
				delete: new FuncType([keyType], self),
				filter: new FuncType([new FuncType([keyType, valueType], BoolType)], self),
				find: new FuncType([new FuncType([keyType, valueType], BoolType)], [keyType, valueType]),
				find_key: new FuncType([new FuncType([keyType], BoolType)], keyType),
				find_key_safe: new FuncType([new FuncType([keyType], BoolType)], OptionType$(keyType)),
				find_safe: new FuncType([new FuncType([keyType, valueType], BoolType)], [new FuncType([], [keyType, valueType]), BoolType]),
				find_value: new FuncType([new FuncType([valueType], BoolType)], valueType),
				find_value_safe: new FuncType([new FuncType([valueType], BoolType)], OptionType$(valueType)),
				fold: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([a.ref, keyType, valueType], a.ref), a.ref], a.ref));
				})(),
				fold_lazy: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([keyType, valueType, new FuncType([], a.ref)], a.ref), a.ref], a.ref));
				})(),
				for_each: new FuncType([new FuncType([keyType, valueType], new VoidType())], new VoidType()),
				get: new FuncType([keyType], valueType),
				get_safe: new FuncType([keyType], OptionType$(valueType)),
				head: new FuncType([], [keyType, valueType]),
				head_key: keyType,
				head_value: valueType,
				is_empty: new FuncType([], BoolType),
				length: IntType,
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					const b = new Parameter("b", `${FTPP}1`, new DefaultTypeClass());

					return new ParametricFunc([a, b], new FuncType([new FuncType([keyType, valueType], [a.ref, b.ref])], MapType$(a.ref, b.ref)));
				})(),
				prepend: new FuncType([keyType, valueType], self),
				set: new FuncType([keyType, valueType], self),
				sort: new FuncType([new FuncType([keyType, valueType, keyType, valueType], BoolType)], self),
				tail: self,
				update: new FuncType([keyType, new FuncType([valueType], valueType)], self),
				update_safe: new FuncType([keyType, new FuncType([valueType], valueType)], self)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
				__add: new FuncType([self, self], self)
			})
		})
	}
});

/**
 * @param {Type} keyType 
 * @param {Type} valueType
 * @returns {DataType}
 */
export function MapType$(keyType, valueType) {
	return applyTypes(MapType, keyType, valueType);
}

/**
 * Builtin option type
 * @package
 * @type {Parametric}
 */
const OptionType = new ParametricType({
	name: "Option",
	offChainType: Option,
	parameters: [new Parameter("SomeType", `${TTPP}0`, new DefaultTypeClass())],
	apply: ([someType]) => {
		const someOffChainType = someType.asDataType?.offChainType ?? null;
		const offChainType = someOffChainType ? Option(someOffChainType) : null;
		const someTypePath = assertDefined(someType.asDataType).path;

		/**
		 * @type {DataType}
		 */
		const AppliedOptionType = new GenericType({
			offChainType: offChainType,
			name: `Option[${someType.toString()}]`,
			path: `__helios__option[${someTypePath}]`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([someType], a.ref)], OptionType$(a.ref)));
				})(),
				unwrap: new FuncType([], someType)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
           		None: NoneType,
            	Some: SomeType
			})
		});

		/**
		 * @type {EnumMemberType}
		 */
		const SomeType = new GenericEnumMemberType({
			name: "Some",
			constrIndex: 0,
			fieldNames: ["some"],
			parentType: AppliedOptionType,
			path: `__helios__option[${someTypePath}]__some`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				some: someType
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self)
			})
		});

		/**
		 * @type {EnumMemberType}
		 */
		const NoneType = new GenericEnumMemberType({
			name: "None",
			constrIndex: 1,
			parentType: AppliedOptionType,
			path: `__helios__option[${someTypePath}]__none`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self)
			})
		});

		return AppliedOptionType;
	}
});

/**
 * @param {Type} someType 
 * @returns {DataType}
 */
export function OptionType$(someType) {
	return applyTypes(OptionType, someType);
}


//////////////////////////////
// Section 18: Eval time types
//////////////////////////////

/**
 * Builtin Duration type
 * @package
 * @type {DataType}
 */
var DurationType = new GenericType({
    name: "Duration",
    offChainType: Duration,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

        return {
            ...genCommonTypeMembers(self),
            __add: new FuncType([self, self], self),
            __div: new FuncType([self, IntType], self),
            __div1: new FuncType([self, DurationType], IntType),
            __geq: new FuncType([self, DurationType], BoolType),
            __gt: new FuncType([self, DurationType], BoolType),
            __leq: new FuncType([self, DurationType], BoolType),
            __lt: new FuncType([self, DurationType], BoolType),
            __mod: new FuncType([self, self], self),
            __mul: new FuncType([self, IntType], self),
            __sub: new FuncType([self, self], self),
            new: new FuncType([IntType], self),
            SECOND: selfInstance,
            MINUTE: selfInstance,
            HOUR: selfInstance,
            DAY: selfInstance,
            WEEK: selfInstance
        }
    }
});

/**
 * Builtin Time type. Opaque alias of Int representing milliseconds since 1970
 * @package
 * @type {DataType}
 */
var TimeType = new GenericType({
    name: "Time",
    offChainType: Time,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, DurationType], TimeType),
        __geq: new FuncType([self, TimeType], BoolType),
        __gt: new FuncType([self, TimeType], BoolType),
        __leq: new FuncType([self, TimeType], BoolType),
        __lt: new FuncType([self, TimeType], BoolType),
	    __sub: new FuncType([self, TimeType], DurationType),
        __sub1: new FuncType([self, DurationType], TimeType),
        new: new FuncType([IntType], self)
    })
});

/**
 * Builtin TimeRange type
 * @package
 * @type {DataType}
 */
var TimeRangeType = new GenericType({
    name: "TimeRange",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        contains: new FuncType([TimeType], BoolType),
        start: TimeType,
        end: TimeType,
        is_before: new FuncType([TimeType], BoolType),
        is_after: new FuncType([TimeType], BoolType),
        show: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

        return {
            ...genCommonTypeMembers(self),
            new: new FuncType([TimeType, TimeType], self),
            ALWAYS: selfInstance,
            NEVER: selfInstance,
            from: new FuncType([TimeType], self),
            to: new FuncType([TimeType], self)
        };
    }
});


//////////////////////////////
// Section 19: Eval hash types
//////////////////////////////

/**
 * @param {Type} self 
 * @returns {InstanceMembers}
 */
function genHashInstanceMembers(self) {
    return {
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType)
    };
}

/**
 * @param {Type} self 
 * @returns {TypeMembers}
 */
function genHashTypeMembers(self) {
    return {
        ...genCommonTypeMembers(self),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType),
        new: new FuncType([ByteArrayType], self)
    };
}

/**
 * @package
 * @type {DataType}
 */
var DatumHashType = new GenericType({
    name: "DatumHash",
    offChainType: DatumHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * @package
 * @type {DataType}
 */
var MintingPolicyHashType = new GenericType({
    name: "MintingPolicyHash",
    offChainType: MintingPolicyHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: (self) => ({
        ...genHashTypeMembers(self),
        from_script_hash: new FuncType([ScriptHashType], self)
    })
});

/**
 * Builtin PubKey type
 * @package
 * @type {DataType}
 */
var PubKeyType = new GenericType({
    name: "PubKey",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType),
        verify: new FuncType([ByteArrayType, ByteArrayType], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([ByteArrayType], self)
    })
});

/**
 * Builtin PubKeyHash type
 * @package
 * @type {DataType}
 */
var PubKeyHashType = new GenericType({
    name: "PubKeyHash",
    offChainType: PubKeyHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * @package
 * @type {DataType}
 */
var ScriptHashType = new GenericType({
    name: "ScriptHash",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self)
    })
});

/**
 * @package
 * @type {DataType}
 */
var StakeKeyHashType = new GenericType({
    name: "StakeKeyHash",
    offChainType: StakeKeyHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * Builtin StakingHash type
 * @package
 * @type {DataType}
 */
var StakingHashType = new GenericType({
    name: "StakingHash",
    genInstanceMembers: genCommonInstanceMembers,
    genTypeMembers: (self) => ({
        StakeKey: StakingHashStakeKeyType,
        Validator: StakingHashValidatorType,
        new_stakekey: new FuncType([StakeKeyHashType], StakingHashStakeKeyType),
        new_validator: new FuncType([StakingValidatorHashType], StakingHashValidatorType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
var StakingHashStakeKeyType = new GenericEnumMemberType({
    name: "StakeKey",
    constrIndex: 0,
    parentType: StakingHashType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: StakeKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingHashType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
var StakingHashValidatorType = new GenericEnumMemberType({
    name: "Validator",
    constrIndex: 1,
    parentType: StakingHashType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: StakingValidatorHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingHashType)
    })
});

/**
 * @package
 * @type {DataType}
 */
var StakingValidatorHashType = new GenericType({
    name: "StakingValidatorHash",
    offChainType: StakingValidatorHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: (self) => ({
        ...genHashTypeMembers(self),
        from_script_hash: new FuncType([ScriptHashType], self)
    })
});

/**
 * @package
 * @type {DataType}
 */
var ValidatorHashType = new GenericType({
    name: "ValidatorHash",
    offChainType: ValidatorHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: (self) => ({
        ...genHashTypeMembers(self),
        from_script_hash:  new FuncType([ScriptHashType], self)
    })
});


///////////////////////////////
// Section 20: Eval money types
///////////////////////////////

/**
 * Builtin AssetClass type
 * @package
 * @type {DataType}
 */
var AssetClassType = new GenericType({
    name: "AssetClass",
    offChainType: AssetClass,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        mph: MintingPolicyHashType,
        token_name: ByteArrayType
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

        return {
            ...genCommonTypeMembers(self),
            ADA: selfInstance,
            new: new FuncType([MintingPolicyHashType, ByteArrayType], self)
        }
    }
});


/**
 * Builtin money Value type
 * @package
 * @type {DataType}
 */
var ValueType = new GenericType({
    name: "Value",
    offChainType: Value,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        contains: new FuncType([self], BoolType),
        contains_policy: new FuncType([MintingPolicyHashType], BoolType),
        get: new FuncType([AssetClassType], IntType),
        get_assets: new FuncType([], ValueType),
        get_lovelace: new FuncType([], IntType),
        get_policy: new FuncType([MintingPolicyHashType], MapType$(ByteArrayType, IntType)),
        get_safe: new FuncType([AssetClassType], IntType),
        is_zero: new FuncType([], BoolType),
        show: new FuncType([], StringType),
        to_map: new FuncType([], MapType$(MintingPolicyHashType, MapType$(ByteArrayType, IntType))),
        value: self // so that Value implements Valuable itself as well
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

        return {
            ...genCommonTypeMembers(self),
            __add: new FuncType([self, self], self),
            __div: new FuncType([self, IntType], ValueType),
            __geq: new FuncType([self, ValueType], BoolType),
            __gt: new FuncType([self, ValueType], BoolType),
            __leq: new FuncType([self, ValueType], BoolType),
            __lt: new FuncType([self, ValueType], BoolType),
            __mul: new FuncType([self, IntType], ValueType),
            __sub: new FuncType([self, self], self),
            from_map: new FuncType([MapType$(MintingPolicyHashType, MapType$(ByteArrayType, IntType))], self),
            lovelace: new FuncType([IntType], self),
            new: new FuncType([AssetClassType, IntType], self),
            sum: (() => {
                const a = new Parameter("a", `${FTPP}0`, new ValuableTypeClass());
                return new ParametricFunc([a], new FuncType([ListType$(a.ref)], self));
            })(),
            ZERO: selfInstance
        }
    }
});

/**
 * @package
 * @implements {TypeClass}
 */
class ValuableTypeClass extends DefaultTypeClass {
	/**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genTypeMembers(impl) {
		return {
            ...super.genTypeMembers(impl)
        };
	}

	/**	
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genInstanceMembers(impl) {
		return {
            ...super.genInstanceMembers(impl),
            value: ValueType
		};
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Valuable";
	}
}


////////////////////////////
// Section 21: Eval tx types
////////////////////////////

/**
 * Buitin Address type
 * @package
 * @type {DataType}
 */
const AddressType = new GenericType({
    name: "Address",
    offChainType: Address,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: CredentialType,
        staking_credential: OptionType$(StakingCredentialType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([CredentialType, OptionType$(StakingCredentialType)], self),
        new_empty: new FuncType([], self)
    })
});

/**
 * @package
 * @type {DataType}
 */
const DCertType = new GenericType({
    name: "DCert",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Delegate: DCertDelegateType,
        Deregister: DCertDeregisterType,
        Register: DCertRegisterType,
        RegisterPool: DCertRegisterPoolType,
        RetirePool: DCertRetirePoolType,
        new_delegate: new FuncType([StakingCredentialType, PubKeyHashType], DCertDelegateType),
        new_deregister: new FuncType([StakingCredentialType], DCertDeregisterType),
        new_register: new FuncType([StakingCredentialType], DCertRegisterType),
        new_register_pool: new FuncType([PubKeyHashType, PubKeyHashType], DCertRegisterPoolType),
        new_retire_pool: new FuncType([PubKeyHashType, IntType], DCertRetirePoolType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertDelegateType = new GenericEnumMemberType({
    name: "Delegate",
    constrIndex: 2,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        delegator: StakingCredentialType,
		pool_id: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertDeregisterType = new GenericEnumMemberType({
    name: "Deregister",
    constrIndex: 1,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertRegisterType = new GenericEnumMemberType({
    name: "Register",
    constrIndex: 0,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertRegisterPoolType = new GenericEnumMemberType({
    name: "RegisterPool",
    constrIndex: 3,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        pool_id: PubKeyHashType,
        pool_vrf: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertRetirePoolType = new GenericEnumMemberType({
    name: "RetirePool",
    constrIndex: 4,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        pool_id: PubKeyHashType,
        epoch: IntType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});


/**
 * Builtin Credential type
 * @package
 * @type {DataType}
 */
const CredentialType = new GenericType({
    name: "Credential",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        PubKey: CredentialPubKeyType,
        Validator: CredentialValidatorType,
        new_pubkey: new FuncType([PubKeyHashType], CredentialPubKeyType),
        new_validator: new FuncType([ValidatorHashType], CredentialValidatorType)
    })
});


/**
 * Builtin Credential::PubKey
 */
const CredentialPubKeyType = new GenericEnumMemberType({
    name: "PubKey",
    constrIndex: 0,
    fieldNames: ["hash"],
    parentType: CredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, CredentialType)
    })
});

/**
 * Builtin Credential::Validator type
 */
const CredentialValidatorType = new GenericEnumMemberType({
    name: "Validator",
    constrIndex: 1,
    fieldNames: ["hash"],
    parentType: CredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: ValidatorHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, CredentialType)
    })
});

/**
 * @package
 * @type {DataType}
 */
const OutputDatumType = new GenericType({
    name: "OutputDatum",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        get_inline_data: new FuncType([], RawDataType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Hash: OutputDatumHashType,
        Inline: OutputDatumInlineType,
        None: OutputDatumNoneType,
        new_hash: new FuncType([DatumHashType], OutputDatumHashType),
		new_inline: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([a.ref], OutputDatumInlineType))
        })(),
        new_none: new FuncType([], OutputDatumNoneType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const OutputDatumHashType = new GenericEnumMemberType({
    name: "Hash",
    constrIndex: 1,
    parentType: OutputDatumType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: DatumHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, OutputDatumType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const OutputDatumInlineType = new GenericEnumMemberType({
    name: "Inline",
    constrIndex: 2,
    parentType: OutputDatumType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        data: RawDataType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, OutputDatumType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const OutputDatumNoneType = new GenericEnumMemberType({
    name: "None",
    constrIndex: 0,
    parentType: OutputDatumType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, OutputDatumType)
    })
});

/**
 * Builtin ScriptContext type
 * @package
 * @implements {DataType}
 */
class ScriptContextType extends Common {
    /**
     * @type {number}
     */
    #purpose;

    /**
     * @param {number} purpose 
     */
	constructor(purpose) {
		super();

        this.#purpose = assertDefined(purpose);
	}

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return [];
    }

    /**
     * @type {string}
     */
    get name() {
        return "ScriptContext";
    }

    /**
     * @param {number} purpose
     * @returns {InstanceMembers}
     */
    static genPurposeInstanceMembers(purpose) {
        switch (purpose) {
            case ScriptPurpose.Minting:
                return {
                    get_current_minting_policy_hash: new FuncType([], MintingPolicyHashType)
                };
            case ScriptPurpose.Spending:
                return {
                    get_current_input: new FuncType([], TxInputType),
                    get_cont_outputs: new FuncType([], ListType$(TxOutputType)),
                    get_current_validator_hash: new FuncType([], ValidatorHashType),
                    get_spending_purpose_output_id: new FuncType([], TxOutputIdType)
                };
            case ScriptPurpose.Staking:
                return {
                    get_staking_purpose:new FuncType([], StakingPurposeType)
                };
            case ScriptPurpose.Testing:
            case -1:
                return {
                    ...ScriptContextType.genPurposeInstanceMembers(ScriptPurpose.Minting),
                    ...ScriptContextType.genPurposeInstanceMembers(ScriptPurpose.Spending),
                    ...ScriptContextType.genPurposeInstanceMembers(ScriptPurpose.Staking),
                };
            default:
                throw new Error(`unhandled ScriptPurpose ${purpose}`);
        }
    }
    /**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
        return {
            ...genCommonInstanceMembers(this),
            ...ScriptContextType.genPurposeInstanceMembers(this.#purpose),
            get_script_purpose: new FuncType([], ScriptPurposeType),
            tx: TxType
        };
	}

    /**
     * @type {null | HeliosDataClass<HeliosData>}
     */
    get offChainType() {
        return null;
    }

    /**
     * @type {string}
     */
    get path() {
		return "__helios__scriptcontext";
	}

	/**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
        return {
            ...genCommonTypeMembers(this),
            new_certifying: new FuncType([TxType, DCertType], new ScriptContextType(ScriptPurpose.Staking)),
            new_minting: new FuncType([TxType, MintingPolicyHashType], new ScriptContextType(ScriptPurpose.Minting)),
            new_rewarding: new FuncType([TxType, StakingCredentialType], new ScriptContextType(ScriptPurpose.Staking)),
            new_spending: new FuncType([TxType, TxOutputIdType], new ScriptContextType(ScriptPurpose.Spending))
        };
	}

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this;
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this;
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
    infer(site, map, type) {
        return this;
    }

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
        return other instanceof ScriptContextType;
    }

    /**
     * @returns {string}
     */
	toString() {
		return this.name;
	}

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new DataEntity(this);
    }
}

/**
 * Builtin ScriptPurpose type (Minting| Spending| Rewarding | Certifying)
 * @package
 * @type {DataType}
 */
const ScriptPurposeType = new GenericType({
    name: "ScriptPurpose",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Certifying: ScriptPurposeCertifyingType,
        Minting: ScriptPurposeMintingType,
        Rewarding: ScriptPurposeTypeRewarding,
        Spending: ScriptPurposeSpendingType,
        new_certifying: new FuncType([DCertType], ScriptPurposeCertifyingType),
        new_minting: new FuncType([MintingPolicyHashType], ScriptPurposeMintingType),
        new_rewarding: new FuncType([StakingCredentialType], ScriptPurposeTypeRewarding),
        new_spending: new FuncType([TxOutputIdType], ScriptPurposeSpendingType), 
    })
}); 

/**
 * Builtin ScriptPurpose::Certifying
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeCertifyingType = new GenericEnumMemberType({
    name: "Certifying",
    constrIndex: 3,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        dcert: DCertType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Minting
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeMintingType = new GenericEnumMemberType({
    name: "Minting",
    constrIndex: 0,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        policy_hash: MintingPolicyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Rewarding
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeTypeRewarding = new GenericEnumMemberType({
    name: "Rewarding",
    constrIndex: 2,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Spending
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeSpendingType = new GenericEnumMemberType({
    name: "Spending",
    constrIndex: 1,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        output_id: TxOutputIdType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin StakingCredential type
 * @package
 * @type {DataType}
 */
const StakingCredentialType = new GenericType({
    name: "StakingCredential",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Hash: StakingCredentialHashType,
        Ptr: StakingCredentialPtrType,
        new_hash: new FuncType([StakingHashType], StakingCredentialHashType),
        new_ptr: new FuncType([IntType, IntType, IntType], StakingCredentialPtrType)
    })
});

/**
 * Builtin StakingCredential::Hash
 * @package
 * @type {EnumMemberType}
 */
const StakingCredentialHashType = new GenericEnumMemberType({
    name: "Hash",
    constrIndex: 0,
    parentType: StakingCredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: StakingHashType,
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingCredentialType)
    })
});

/**
 * Builtin StakingCredential::Ptr
 * @package
 * @type {EnumMemberType}
 */
const StakingCredentialPtrType = new GenericEnumMemberType({
    name: "Ptr",
    constrIndex: 1,
    parentType: StakingCredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingCredentialType)
    })
});

/**
 * Builtin StakingPurpose type (Rewarding or Certifying)
 * @package
 * @type {DataType}
 */
const StakingPurposeType = new GenericType({
    name : "StakingPurpose",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Certifying: StakingPurposeCertifyingType,
        Rewarding: StakingPurposeRewardingType
    })
});

/**
 * Builtin ScriptPurpose::Minting
 * @package
 * @type {EnumMemberType}
 */
const StakingPurposeCertifyingType = new GenericEnumMemberType({
    name: "Certifying",
    constrIndex: 3,
    parentType: StakingPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        dcert: DCertType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Minting
 * @package
 * @type {EnumMemberType}
 */
const StakingPurposeRewardingType = new GenericEnumMemberType({
    name: "Rewarding",
    constrIndex: 2,
    parentType: StakingPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType,
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingPurposeType)
    })
});


/**
 * Builtin Tx type
 * @package
 * @type {DataType}
 */
const TxType = new GenericType({
    name: "Tx",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        inputs: ListType$(TxInputType),
		ref_inputs: ListType$(TxInputType),
        outputs: ListType$(TxOutputType),
        fee: ValueType,
        minted: ValueType,
        dcerts: ListType$(DCertType),
        withdrawals: MapType$(StakingCredentialType, IntType),
		time_range: TimeRangeType,
		signatories: ListType$(PubKeyHashType),
        redeemers: MapType$(ScriptPurposeType, RawDataType),
        datums: MapType$(DatumHashType, RawDataType),
        id: TxIdType,
        find_datum_hash: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([a.ref], DatumHashType))
        })(),
        get_datum_data: new FuncType([TxOutputType], RawDataType),
        outputs_sent_to: new FuncType([PubKeyHashType], ListType$(TxOutputType)),
        outputs_sent_to_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([PubKeyHashType, a.ref, BoolType], ListType$(TxOutputType)))
        })(),
        outputs_locked_by: new FuncType([ValidatorHashType], ListType$(TxOutputType)),
        outputs_locked_by_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([ValidatorHashType, a.ref, BoolType], ListType$(TxOutputType)))
        })(),
        value_sent_to: new FuncType([PubKeyHashType], ValueType),
        value_sent_to_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([PubKeyHashType, a.ref, BoolType], ValueType));
        })(),
        value_locked_by: new FuncType([ValidatorHashType], ValueType),
        value_locked_by_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([ValidatorHashType, a.ref, BoolType], ValueType));
        })(),
        value_paid_to: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([AddressType, a.ref], ValueType));
        })(),
        is_signed_by: new FuncType([PubKeyHashType], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
            const b = new Parameter("b", `${FTPP}1`, new DefaultTypeClass());
            
            return new ParametricFunc([a, b], new FuncType([
                ListType$(TxInputType), // 0
                ListType$(TxInputType), // 1
                ListType$(TxOutputType), // 2
                ValueType, // 3
                ValueType, // 4
                ListType$(DCertType), // 5
                MapType$(StakingCredentialType, IntType), // 6
                TimeRangeType, // 7
                ListType$(PubKeyHashType), // 8
                MapType$(ScriptPurposeType, a.ref), // 9
                MapType$(DatumHashType, b.ref), // 10
                TxIdType // 11
            ], self))
        })()
    })
});

/**
 * Builtin TxId type
 * @package
 * @type {DataType}
 */
const TxIdType = new GenericType({
    name: "TxId",
    offChainType: TxId,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType),
        new: new FuncType([ByteArrayType], self)
    })
});


/**
 * Builtin TxInput type
 * @package
 * @type {DataType}
 */
const TxInputType = new GenericType({
    name: "TxInput",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        output_id: TxOutputIdType,
        output: TxOutputType,
        address: AddressType,
        value: ValueType,
        datum: OutputDatumType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([TxOutputIdType, TxOutputType], self)
    })
});

/**
 * Builtin TxOutput type
 * @package
 * @type {DataType}
 */
const TxOutputType = new GenericType({
    name: "TxOutput",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        address: AddressType,
        value: ValueType,
	    datum: OutputDatumType,
        ref_script_hash: OptionType$(ScriptHashType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([AddressType, ValueType, OutputDatumType], self)
    })
});

/**
 * Builtin TxOutputId type
 * @package
 * @type {DataType}
 */
const TxOutputIdType = new GenericType({
    name: "TxOutputId",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        tx_id: TxIdType,
        index: IntType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __geq: new FuncType([self, TxOutputIdType], BoolType),
        __gt: new FuncType([self, TxOutputIdType], BoolType),
        __leq: new FuncType([self, TxOutputIdType], BoolType),
        __lt: new FuncType([self, TxOutputIdType], BoolType),
        new: new FuncType([TxIdType, IntType], TxOutputIdType)
    })
});


/////////////////////
// Section 22: Scopes
/////////////////////


/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 * @package
 */
class GlobalScope {
	/**
	 * @type {[Word, EvalEntity][]}
	 */
	#values;

	constructor() {
		this.#values = [];
	}

	/**
	 * Checks if scope contains a name
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	has(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Sets a global name, doesn't check for uniqueness
	 * Called when initializing GlobalScope
	 * @param {string | Word} name
	 * @param {EvalEntity} value
	 */
	set(name, value) {
		/** @type {Word} */
		let nameWord = !(name instanceof Word) ? Word.new(name) : name;

		this.#values.push([nameWord, value]);
	}

	/**
	 * Gets a named value from the scope.
	 * Throws an error if not found.
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	get(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return pair[1];
			}
		}

		throw name.referenceError(`'${name.toString()}' undefined`);
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		throw new Error("should've been returned be TopScope");
	}

	/**
	 * Initialize the GlobalScope with all the builtins
	 * @param {number} purpose
	 * @returns {GlobalScope}
	 */
	static new(purpose) {
		let scope = new GlobalScope();

		// List (aka '[]'), Option, and Map types are accessed through special expressions

		// fill the global scope with builtin types
        scope.set("Address",              AddressType);
		scope.set("Any",         		  new AnyTypeClass());
        scope.set("AssetClass",           AssetClassType);
        scope.set("Bool",                 BoolType);
        scope.set("ByteArray",            ByteArrayType);
		scope.set("DCert",                DCertType);
        scope.set("Credential",           CredentialType);
        scope.set("DatumHash",            DatumHashType);
        scope.set("Data",                 RawDataType);
        scope.set("Duration",             DurationType);
		scope.set("Int",                  IntType);
        scope.set("MintingPolicyHash",    MintingPolicyHashType);
        scope.set("OutputDatum",          OutputDatumType);
        scope.set("PubKey",               PubKeyType);
		scope.set("PubKeyHash",           PubKeyHashType);
		scope.set("Real",                 RealType);
        scope.set("ScriptContext",        new ScriptContextType(purpose));
        scope.set("ScriptHash",           ScriptHashType);
        scope.set("ScriptPurpose",        ScriptPurposeType);
        scope.set("StakeKeyHash",         StakeKeyHashType);
        scope.set("StakingCredential",    StakingCredentialType);
        scope.set("StakingHash",          StakingHashType);
        scope.set("StakingPurpose",       StakingPurposeType);
        scope.set("StakingValidatorHash", StakingValidatorHashType);
		scope.set("String",               StringType);
        scope.set("Time",                 TimeType);
        scope.set("TimeRange",            TimeRangeType);
        scope.set("Tx",                   TxType);
        scope.set("TxId",                 TxIdType);
        scope.set("TxInput",              TxInputType);
        scope.set("TxOutput",             TxOutputType);
        scope.set("TxOutputId",           TxOutputIdType);
		scope.set("ValidatorHash",        ValidatorHashType);
        scope.set("Value",                ValueType);
		scope.set("Valuable",             new ValuableTypeClass());

        // builtin functions
        scope.set("assert",               AssertFunc);
		scope.set("error",                ErrorFunc);
        scope.set("print",                PrintFunc);
		

		return scope;
	}

	/**
	 * @param {(name: string, type: Type) => void} callback 
	 */
	loopTypes(callback) {
		for (let [k, v] of this.#values) {
			if (v.asType) {
				callback(k.value, v.asType);
			}
		}
	}
}

/**
 * User scope
 * @package
 * @implements {EvalEntity}
 */
class Scope extends Common {
	/** @type {GlobalScope | Scope} */
	#parent;

	/** 
	 * TopScope can elverage the #values to store ModuleScopes
	 * @type {[Word, (EvalEntity | Scope)][]} 
	 */
	#values;

	/**
	 * @type {Set<string>}
	 */
	#used;

	/**
	 * @param {GlobalScope | Scope} parent 
	 */
	constructor(parent) {
		super()
		this.#parent = parent;
		this.#values = []; // list of pairs
		this.#used = new Set();
	}

	/**
	 * Used by top-scope to loop over all the statements
	 */
	get values() {
		return this.#values.slice();
	}

	/**
	 * Checks if scope contains a name
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	has(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		if (this.#parent !== null) {
			return this.#parent.has(name);
		} else {
			return false;
		}
	}

	/**
	 * Sets a named value. Throws an error if not unique
	 * @param {Word} name 
	 * @param {EvalEntity | Scope} value 
	 */
	set(name, value) {
		if (value instanceof Scope) {
			assert(name.value.startsWith("__scope__"));
		}

		if (this.has(name)) {
			throw name.syntaxError(`'${name.toString()}' already defined`);
		}

		this.#values.push([name, value]);
	}

	/**
	 * @param {Word} name 
	 */
	remove(name) {
		this.#values = this.#values.filter(([n, _]) => n.value != name.value);
	}

	/**
	 * @param {Word} name 
	 * @returns {Scope}
	 */
	getScope(name) {
		assert(!name.value.startsWith("__scope__"));

		const entity = this.get(new Word(name.site, `__scope__${name.value}`));

		if (entity instanceof Scope) {
			return entity;
		} else {
			throw name.typeError(`expected Scope, got ${entity.toString()}`);
		}
	}

	/**
	 * Gets a named value from the scope. Throws an error if not found
	 * @param {Word} name 
	 * @returns {EvalEntity | Scope}
	 */
	get(name) {
		if (!(name instanceof Word)) {
			name = Word.new(name);
		}

		for (let [key, entity] of this.#values) {
			if (key.toString() == name.toString()) {
				this.#used.add(key.toString());

				return entity;
			}
		}

		if (this.#parent !== null) {
			return this.#parent.get(name);
		} else {
			throw name.referenceError(`'${name.toString()}' undefined`);
		}
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		return this.#parent.isStrict();
	}

	/**
	 * Asserts that all named values are user.
	 * Throws an error if some are unused.
	 * Check is only run if we are in strict mode
	 * @param {boolean} onlyIfStrict
	 */
	assertAllUsed(onlyIfStrict = true) {
		if (!onlyIfStrict || this.isStrict()) {
			for (let [name, entity] of this.#values) {
				if (!(entity instanceof Scope) && !this.#used.has(name.toString())) {
					throw name.referenceError(`'${name.toString()}' unused`);
				}
			}
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	isUsed(name) {
		for (let [checkName, entity] of this.#values) {
			if (name.value == checkName.value && !(entity instanceof Scope)) {
				return this.#used.has(name.toString());
			}
		}

		throw new Error(`${name.value} not found`);
	}

	dump() {
		console.log("DUMPING SCOPE", this.#values.length);
		this.#values.forEach(([w, v]) => {
			console.log(w.value, v);
		});
	}

	/**
	 * @param {(name: string, type: Type) => void} callback 
	 */
	loopTypes(callback) {
		this.#parent.loopTypes(callback);

		for (let [k, v] of this.#values) {
			if (v.asType) {
				callback(k.value, v.asType);
			}
		}
	}
}

/**
 * TopScope is a special scope that can contain UserTypes
 * @package
 */
class TopScope extends Scope {
	#strict;

	/**
	 * @param {GlobalScope} parent 
	 * @param {boolean} strict
	 */
	constructor(parent, strict = true) {
		super(parent);
		this.#strict = strict;
	}

	/**
	 * Prepends "__scope__" to name before actually setting scope
	 * @param {Word} name 
	 * @param {Scope} value 
	 */
	setScope(name, value) {
		assert(!name.value.startsWith("__scope__"));

		this.set(new Word(name.site, `__scope__${name.value}`), value);
	}

	/**
	 * @param {Word} name 
	 * @param {EvalEntity | Scope} value 
	 */
	set(name, value) {
		if (value instanceof Scope) {
			assert(name.value.startsWith("__scope__"));
		}

		super.set(name, value);
	}

	/**
	 * @param {boolean} s 
	 */
	setStrict(s) {
		this.#strict = s;
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		return this.#strict;
	}

	/**
	 * @param {Word} name 
	 * @returns {ModuleScope}
	 */
	getModuleScope(name) {
		assert(!name.value.startsWith("__scope__"));

		const maybeModuleScope = this.get(new Word(name.site, `__scope__${name.value}`));

		if (maybeModuleScope instanceof ModuleScope) {
			return maybeModuleScope;
		} else {
			throw new Error("expected ModuleScope");
		}
	}
}

/**
 * @package
 */
class ModuleScope extends Scope {
}


/////////////////////////////////////
// Section 23: Helios AST expressions
/////////////////////////////////////

/**
 * Base class of every Type and Instance expression.
 * @package
 */
class Expr extends Token {
	/**@type {null | EvalEntity} */
	#cache;

	/**
	 * @param {Site} site 
	 
	 */
	constructor(site) {
		super(site);
		this.#cache = null;
	}

	/**
	 * @type {null | EvalEntity}
	 */
	get cache() {
		return this.#cache;
	}

	/**
	 * Used in switch cases where initial typeExpr is used as memberName instead
	 * @param {null | EvalEntity} c
	 */
	set cache(c) {
		this.#cache = c;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	eval(scope) {
		//if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		//}

		return this.#cache;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {DataType}
	 */
	evalAsDataType(scope) {
		const result = this.eval(scope).asDataType;

		if (!result) {
			throw this.typeError("not a data type");
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalAsType(scope) {
		const r = this.eval(scope);

		const result = r.asType;

		if (!result) {
			throw this.typeError(`${r.toString()} isn't a type`);
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Typed}
	 */
	evalAsTyped(scope) {
		const r  = this.eval(scope);

		const result = r.asTyped;

		if (!result) {
			throw this.typeError(`${r.toString()} isn't a value`);
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Typed | Multi}
	 */
	evalAsTypedOrMulti(scope) {
		const r  = this.eval(scope);

		if (r.asTyped) {
			return r.asTyped;
		} else if (r.asMulti) {
			return r.asMulti;
		} else {
			throw this.typeError(`${r.toString()} isn't a value`);
		}
	}	

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return false;
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}
}

/**
 * Simple reference class (i.e. using a Word)
 * @package
 */
class RefExpr extends Expr {
	#name;

	/**
	 * @param {Word} name
	 */
	constructor(name) {
		super(name.site);
		this.#name = name;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return scope.get(this.#name);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const path = this.cache?.asNamed ? this.cache.asNamed.path : this.#name.value;

		let ir = new IR(path, this.site);
		
		return ir;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#name.toString();
	}
}

/**
 * Name::Member expression
 * @package
 */
class PathExpr extends Expr {
	#baseExpr;
	#memberName;

	/**
	 * @param {Site} site 
	 * @param {Expr} baseExpr 
	 * @param {Word} memberName
	 */
	constructor(site, baseExpr, memberName) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#memberName = memberName;
	}

	/**
	 * @type {Expr}
	 */
	get baseExpr() {
		return this.#baseExpr;
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const base = this.#baseExpr.eval(scope);

		/**
		 * @type {null | EvalEntity}
		 */
		let member = null;

		if (base.asNamespace) {
			member = base.asNamespace.namespaceMembers[this.#memberName.value];
		} else if (base.asType) {
			const typeMembers = base.asType.typeMembers;

			member = typeMembers[this.#memberName.value];
		}

		if (!member) {
			throw this.#memberName.referenceError(`${base.toString()}::${this.#memberName.value} not found`);
		}

		if (member.asType?.toTyped().asFunc) {
			return member.asType.toTyped();
		} else {
			return member;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const v = this.cache;

		if (v?.asNamed) {
			return new IR(`${v.asNamed.path}`, this.site);
		} else if (this.#baseExpr.cache?.asNamed) {
			return new IR(`${this.#baseExpr.cache.asNamed.path}__${this.#memberName.value}`, this.site);
		} else {
			throw new Error(`expected named value, ${v?.toString()}`);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseExpr.toString()}::${this.#memberName.toString()}`;
	}
}

/**
 * Name::Member expression which can instantiate zero field structs and enum members
 * @package
 */
class ValuePathExpr extends PathExpr {

	/**
	 * @param {Site} site 
	 * @param {Expr} baseExpr 
	 * @param {Word} memberName
	 */
	constructor(site, baseExpr, memberName) {
		super(site, baseExpr, memberName);
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const member = super.evalInternal(scope);

		if (member.asEnumMemberType && member.asEnumMemberType.fieldNames.length == 0) {
			return new DataEntity(member.asEnumMemberType);
		} else {
			return member;
		}
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return (this.cache?.asTyped?.type.asEnumMemberType?.fieldNames?.length ?? -1) == 0;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const v = this.cache;

		if (v?.asTyped?.type?.asEnumMemberType && v.asTyped.type.asEnumMemberType.fieldNames.length == 0) {
			return new IR([
				new IR(`${v.asTyped.type.asEnumMemberType.path}____new`, this.site),
				new IR("()")
			]);
		} else {
			return super.toIR(indent);
		}
	}
}

/**
 * []ItemType
 * @package
 */
class ListTypeExpr extends Expr {
	#itemTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} itemTypeExpr 
	 */
	constructor(site, itemTypeExpr) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		const itemType_ = this.#itemTypeExpr.eval(scope);
		const itemType = itemType_.asType;

		if (!itemType) {
			throw this.#itemTypeExpr.typeError(`'${itemType_.toString()}' isn't a type`);
		}

		return ListType$(itemType);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[]${this.#itemTypeExpr.toString()}`;
	}
}

/**
 * Map[KeyType]ValueType expression
 * @package
 */
class MapTypeExpr extends Expr {
	#keyTypeExpr;
	#valueTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} keyTypeExpr 
	 * @param {Expr} valueTypeExpr 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const keyType = this.#keyTypeExpr.eval(scope).asType;
		if (!keyType) {
			throw this.#keyTypeExpr.typeError("map key type not a type");
		}

		const valueType = this.#valueTypeExpr.eval(scope).asType;
		if (!valueType) {
			throw this.#valueTypeExpr.typeError("map value type not a type");
		}

		return MapType$(keyType, valueType);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}`;
	}
}

/**
 * Option[SomeType] expression
 * @package
 */
class OptionTypeExpr extends Expr {
	#someTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} someTypeExpr 
	 */
	constructor(site, someTypeExpr) {
		super(site);
		this.#someTypeExpr = someTypeExpr;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		return OptionType$(this.#someTypeExpr.evalAsType(scope));
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Option[${this.#someTypeExpr.toString()}]`;
	}
}

/**
 * '()' which can only be used as return type of func
 * @package
 */
class VoidTypeExpr extends Expr {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return new VoidType();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()";
	}
}

/**
 * @package
 */
class FuncArgTypeExpr extends Token {
	#name;
	#typeExpr;
	optional;

	/**
	 * @param {Site} site 
	 * @param {null | Word} name 
	 * @param {Expr} typeExpr 
	 * @param {boolean} optional 
	 */
	constructor(site, name, typeExpr, optional) {
		super(site);
		this.#name = name;
		this.#typeExpr = typeExpr;
		this.optional = optional;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name == null;
	}

	/**
	 * @returns {boolean}
	 */
	isOptional() {
		return this.optional;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {ArgType}
	 */
	eval(scope) {
		const type_ = this.#typeExpr.eval(scope);

		const type = type_.asType;
		if (!type) {
			throw this.#typeExpr.typeError(`'${type_.toString()}' isn't a type`);
		}

		return new ArgType(this.#name, type, this.optional);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: ` : "",
			this.optional ? "?" : "",
			this.#typeExpr.toString()
		].join("");
	}
}

/**
 * (ArgType1, ...) -> RetType expression
 * @package
 */
class FuncTypeExpr extends Expr {
	#argTypeExprs;
	#retTypeExprs;

	/**
	 * @param {Site} site
	 * @param {FuncArgTypeExpr[]} argTypeExprs 
	 * @param {Expr[]} retTypeExprs 
	 */
	constructor(site, argTypeExprs, retTypeExprs) {
		super(site);
		this.#argTypeExprs = argTypeExprs;
		this.#retTypeExprs = retTypeExprs;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		const argTypes = this.#argTypeExprs.map(a => a.eval(scope));

		const retTypes = this.#retTypeExprs.map(e => {
			const retType = e.eval(scope).asType;

			if (!retType) {
				throw e.typeError("return type isn't a type");
			}

			return retType;
		});

		return new FuncType(argTypes, retTypes);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			return `(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> ${this.#retTypeExprs.toString()}`;
		} else {
			return `(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => e.toString()).join(", ")})`;
		}
	}
}

/**
 * '... = ... ; ...' expression
 * @package
 */
class AssignExpr extends Expr {
	#nameTypes;
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr[]} nameTypes 
	 * @param {Expr} upstreamExpr 
	 * @param {Expr} downstreamExpr 
	 */
	constructor(site, nameTypes, upstreamExpr, downstreamExpr) {
		super(site);
		assert(nameTypes.length > 0);
		this.#nameTypes = nameTypes;
		this.#upstreamExpr = assertDefined(upstreamExpr);
		this.#downstreamExpr = assertDefined(downstreamExpr);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const subScope = new Scope(scope);

		let upstreamVal = this.#upstreamExpr.eval(scope);

		if (this.#nameTypes.length > 1) {
			if (!upstreamVal.asMulti) {
				throw this.typeError("rhs ins't a multi-value");
			}

			const vals = upstreamVal.asMulti.values;

			if (this.#nameTypes.length != vals.length) {
				throw this.typeError(`expected ${this.#nameTypes.length} rhs in multi-assign, got ${vals.length}`);
			}

			this.#nameTypes.forEach((nt, i) => {
				nt.evalInAssignExpr(subScope, assertDefined(vals[i].type.asType), i)
			});
		} else if (upstreamVal.asTyped) {
			if (this.#nameTypes[0].hasType()) {
				this.#nameTypes[0].evalInAssignExpr(subScope, assertDefined(upstreamVal.asTyped.type.asType), 0);
			} else if (this.#upstreamExpr.isLiteral()) {
				// enum variant type resulting from a constructor-like associated function must be cast back into its enum type
				if ((this.#upstreamExpr instanceof CallExpr &&
					this.#upstreamExpr.fnExpr instanceof PathExpr) || 
					(this.#upstreamExpr instanceof PathExpr && 
					!this.#upstreamExpr.isLiteral())) 
				{
					const upstreamType = upstreamVal.asTyped.type;

					if (upstreamType.asEnumMemberType) {
						upstreamVal = new DataEntity(upstreamType.asEnumMemberType.parentType);
					}
				}

				subScope.set(this.#nameTypes[0].name, upstreamVal);
			} else {
				throw this.typeError("unable to infer type of assignment rhs");
			}
		} else {
			throw this.#upstreamExpr.typeError("not an instance");
		}

		const downstreamVal = this.#downstreamExpr.eval(subScope);

		subScope.assertAllUsed();

		return downstreamVal;
	}

	/**
	 * 
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		if (this.#nameTypes.length === 1) {
			let inner = this.#downstreamExpr.toIR(indent + TAB);

			inner = this.#nameTypes[0].wrapDestructIR(indent, inner, 0);

			let upstream = this.#upstreamExpr.toIR(indent);

			// enum member run-time error IR
			if (this.#nameTypes[0].hasType()) {
				const t = this.#nameTypes[0].type;

				if (t.asEnumMemberType) {
					upstream = new IR([
						new IR("__helios__common__assert_constr_index("),
						upstream,
						new IR(`, ${t.asEnumMemberType.constrIndex})`)
					]);
				}
			}

			return new IR([
				new IR("("),
				this.#nameTypes[0].toNameIR(0),
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
				inner,
				new IR(`\n${indent}}(`),
				upstream,
				new IR(")")
			]);
		} else {
			let inner = this.#downstreamExpr.toIR(indent + TAB + TAB);

			for (let i = this.#nameTypes.length - 1; i >= 0; i--) {
				// internally generates enum-member error IR
				inner = this.#nameTypes[i].wrapDestructIR(indent, inner, i);
			}

			const ir = new IR([
				this.#upstreamExpr.toIR(indent),
				new IR(`(\n${indent + TAB}(`), new IR(this.#nameTypes.map((nt, i) => nt.toNameIR(i))).join(", "), new IR(") ->", this.site), new IR(` {\n${indent}${TAB}${TAB}`),
				inner,
				new IR(`\n${indent + TAB}}\n${indent})`)
			]);

			return ir;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let downstreamStr = this.#downstreamExpr.toString();
		assert(downstreamStr != undefined);

		if (this.#nameTypes.length === 1) {
			return `${this.#nameTypes.toString()} = ${this.#upstreamExpr.toString()}; ${downstreamStr}`;
		} else {
			return `(${this.#nameTypes.map(nt => nt.toString()).join(", ")}) = ${this.#upstreamExpr.toString()}; ${downstreamStr}`;
		}
	}
}

/**
 * Helios equivalent of unit
 * @package
 */
class VoidExpr extends Expr {
	/**
	 * @param {Site} site
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return new VoidEntity();
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR("()", this.site);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()";
	}
}

/**
 * expr(...); ...
 * @package
 */
class ChainExpr extends Expr {
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} upstreamExpr 
	 * @param {Expr} downstreamExpr 
	 */
	constructor(site, upstreamExpr, downstreamExpr) {
		super(site);
		this.#upstreamExpr = upstreamExpr;
		this.#downstreamExpr = downstreamExpr;
	}

	toString() {
		return `${this.#upstreamExpr.toString()}; ${this.#downstreamExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const upstreamVal = this.#upstreamExpr.eval(scope).asTyped;

		if (!upstreamVal) {
			throw this.#upstreamExpr.typeError("upstream isn't typed");
		}

		if ((new ErrorType()).isBaseOf(upstreamVal.type)) {
			throw this.#downstreamExpr.typeError("unreachable code (upstream always throws error)");
		} else if (!((new VoidType()).isBaseOf(upstreamVal.type))) {
			throw this.#upstreamExpr.typeError("unexpected return value (hint: use '='");
		}

		return this.#downstreamExpr.eval(scope);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR("__core__chooseUnit(", this.site),
			this.#upstreamExpr.toIR(indent),
			new IR(", "),
			this.#downstreamExpr.toIR(indent),
			new IR(")")
		]);
	}
}

/**
 * Literal expression class (wraps literal tokens)
 * @package
 */
class PrimitiveLiteralExpr extends Expr {
	#primitive;

	/**
	 * @param {PrimitiveLiteral} primitive 
	 */
	constructor(primitive) {
		super(primitive.site);
		this.#primitive = primitive;
	}

	/**
	 * @type {DataType}
	 */
	get type() {
		if (this.#primitive instanceof IntLiteral) {
			return IntType;
		} else if (this.#primitive instanceof RealLiteral) {
			return RealType;
		} else if (this.#primitive instanceof BoolLiteral) {
			return BoolType;
		} else if (this.#primitive instanceof StringLiteral) {
			return StringType;
		} else if (this.#primitive instanceof ByteArrayLiteral) {
			return ByteArrayType;
		} else {
			throw new Error("unhandled primitive type");
		}	
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return new DataEntity(this.type);
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// all literals can be reused in their string-form in the IR
		return new IR(this.#primitive.toString(), this.#primitive.site);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#primitive.toString();
	}
}

/**
 * Literal UplcData which is the result of parameter substitutions.
 * @package
 */
class LiteralDataExpr extends Expr {
	#type;
	#data;

	/**
	 * @param {Site} site 
	 * @param {DataType} type
	 * @param {UplcData} data
	 */
	constructor(site, type, data) {
		super(site);
		this.#type = type;
		this.#data = data;
	}

	/**
	 * @package
	 * @type {DataType}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return new DataEntity(this.#type);
	}

	/**
	 * @type {EvalEntity}
	 */
	get cache() {
		return new DataEntity(this.#type);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR(this.toString(), this.site);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `##${bytesToHex(this.#data.toCbor())}`;
	}
}

/**
 * Struct field (part of a literal struct constructor)
 * @package
 */
class StructLiteralField {
	#name;
	#value;

	/**
	 * @param {null | Word} name 
	 * @param {Expr} value 
	 */
	constructor(name, value) {
		this.#name = name;
		this.#value = value;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		if (this.#name === null) {
			throw new Error("name of field not given");
		} else {
			return this.#name;
		}
	}

	get site() {
		if (this.#name === null) {
			return this.#value.site;
		} else {
			return this.#name.site;
		}
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	eval(scope) {
		return this.#value.eval(scope);
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name !== null;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.#value.toIR(indent);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#name === null) {
			return this.#value.toString();
		} else {
			return `${this.#name.toString()}: ${this.#value.toString()}`;
		}
	}
}

/**
 * Struct literal constructor
 * @package
 */
class StructLiteralExpr extends Expr {
	#typeExpr;
	#fields;

	/**
	 * @param {Expr} typeExpr 
	 * @param {StructLiteralField[]} fields 
	 */
	constructor(typeExpr, fields) {
		super(typeExpr.site);
		this.#typeExpr = typeExpr;
		this.#fields = fields;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const type = this.#typeExpr.eval(scope).asDataType;

		if (!type) {
			throw this.#typeExpr.typeError(`'${this.#typeExpr.toString()}' doesn't evaluate to a data type`);
		}

		if (type.fieldNames.length != this.#fields.length) {
			throw this.typeError(`wrong number of fields for ${type.toString()}, expected ${type.fieldNames.length}, got ${this.#fields.length}`);
		}

		/**
		 * @param {Word} name
		 * @returns {Type}
		 */
		const getMemberType = (name) => {
			const memberVal = type.instanceMembers[name.value];

			if (!memberVal) {
				throw name.typeError(`member '${name.value}' not defined`);
			}

			const memberType = memberVal.asType;

			if (!memberType) {
				throw name.typeError(`member '${name.value}' isn't a type`);
			}

			return memberType;
		};

		for (let i = 0; i < this.#fields.length; i++) {
			const f = this.#fields[i];
		
			const fieldVal = f.eval(scope).asTyped;
			if (!fieldVal) {
				throw f.site.typeError("not typed");
			}

			if (f.isNamed()) {
				if (type.fieldNames.findIndex(n => n == f.name.value) == -1) {
					throw f.name.site.typeError("not a valid field");
				}

				// check the named type
				const memberType = getMemberType(f.name);

				if (!memberType.isBaseOf(fieldVal.type)) {
					throw f.site.typeError(`wrong field type for '${f.name.toString()}', expected ${memberType.toString()}, got ${fieldVal.type.toString()}`);
				}
			} else {
				// check the positional type
				const memberType = getMemberType(new Word(f.site, type.fieldNames[i]));
				
				if (!memberType.isBaseOf(fieldVal.type)) {
					throw f.site.typeError(`wrong field type for field ${i.toString()}, expected ${memberType.toString()}, got ${fieldVal.type.toString()}`);
				}
			}
		}

		return new DataEntity(type);
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		// the expression builder already checked that all fields are named or all or positional (i.e. not mixed)
		return this.#fields.length > 0 && this.#fields[0].isNamed();
	}

	/**
	 * @param {Site} site
	 * @param {string} path
	 * @param {IR[]} fields
	 */
	static toIRInternal(site, path, fields) {
		return new IR([
			new IR(`${path}____new`),
			new IR("("),
			new IR(fields).join(", "),
			new IR(")")
		], site);
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const type = assertDefined(this.#typeExpr.cache?.asDataType);

		const fields = this.#fields.slice();

		// sort fields by correct name
		if (this.isNamed()) {
			fields.sort((a, b) => type.fieldNames.findIndex(n => n == a.name.value) - type.fieldNames.findIndex(n => n == b.name.value));
		}

		const irFields = fields.map(f => f.toIR(indent));

		return StructLiteralExpr.toIRInternal(this.site, type.path, irFields);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#typeExpr.toString()}{${this.#fields.map(f => f.toString()).join(", ")}}`;
	}
}

/**
 * []{...} expression
 * @package
 */
class ListLiteralExpr extends Expr {
	#itemTypeExpr;
	#itemExprs;

	/**
	 * @param {Site} site 
	 * @param {Expr} itemTypeExpr 
	 * @param {Expr[]} itemExprs 
	 */
	constructor(site, itemTypeExpr, itemExprs) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
		this.#itemExprs = itemExprs;
	}

	/**
	 * @type {DataType}
	 */
	get itemType() {
		return assertDefined(this.#itemTypeExpr.cache?.asDataType);
	}

	/**
	 * @param {Scope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const itemType = this.#itemTypeExpr.eval(scope).asDataType;

		if (!itemType) {
			throw this.#itemTypeExpr.typeError("content of list can't be func");
		}

		for (let itemExpr of this.#itemExprs) {
			let itemVal = itemExpr.eval(scope).asTyped;

			if (!itemVal) {
				throw itemExpr.typeError("not typed");
			}

			if (!itemType.isBaseOf(itemVal.type)) {
				throw itemExpr.typeError(`expected ${itemType.toString()}, got ${itemVal.type.toString()}`);
			}
		}

		return new DataEntity(ListType$(itemType));
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let ir = new IR("__core__mkNilData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#itemExprs.length - 1; i >= 0; i--) {

			let itemIR = new IR([
				new IR(`${this.itemType.path}____to_data`),
				new IR("("),
				this.#itemExprs[i].toIR(indent),
				new IR(")"),
			]);

			ir = new IR([
				new IR("__core__mkCons"),
				new IR("("),
				itemIR,
				new IR(", "),
				ir,
				new IR(")")
			]);
		}

		return ir;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[]${this.#itemTypeExpr.toString()}{${this.#itemExprs.map(itemExpr => itemExpr.toString()).join(', ')}}`;
	}
}

/**
 * Map[...]...{... : ...} expression
 * @package
 */
class MapLiteralExpr extends Expr {
	#keyTypeExpr;
	#valueTypeExpr;
	#pairExprs;

	/**
	 * @param {Site} site 
	 * @param {Expr} keyTypeExpr 
	 * @param {Expr} valueTypeExpr
	 * @param {[Expr, Expr][]} pairExprs 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr, pairExprs) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
		this.#pairExprs = pairExprs;
	}

	/**
	 * @type {DataType}
	 */
	get keyType() {
		return assertDefined(this.#keyTypeExpr.cache?.asDataType);
	}

	/**
	 * @type {DataType}
	 */
	get valueType() {
		return assertDefined(this.#valueTypeExpr.cache?.asDataType);
	}

	/**
	 * @param {Scope} scope
	 */
	evalInternal(scope) {
		const keyType = this.#keyTypeExpr.eval(scope).asDataType;
		if (!keyType) {
			throw this.#keyTypeExpr.typeError("key-type of Map can't be func");
		}

		const valueType = this.#valueTypeExpr.eval(scope).asDataType;
		if (!valueType) {
			throw this.#valueTypeExpr.typeError("value-type of Map can't be func");
		}

		for (let [keyExpr, valueExpr] of this.#pairExprs) {
			const keyVal = keyExpr.eval(scope).asTyped;
			if (!keyVal) {
				throw keyExpr.typeError("not typed");
			}

			const valueVal = valueExpr.eval(scope).asTyped;
			if (!valueVal) {
				throw valueExpr.typeError("not typed");
			}

			if (!keyType.isBaseOf(keyVal.type)) {
				throw keyExpr.typeError(`expected ${keyType.toString()} for map key, got ${keyVal.toString()}`);
			}
			
			if (!valueType.isBaseOf(valueVal.type)) {
				throw valueExpr.typeError(`expected ${valueType.toString()} for map value, got ${valueVal.toString()}`);
			}
		}

		return new DataEntity(MapType$(keyType, valueType));
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let ir = new IR("__core__mkNilPairData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#pairExprs.length - 1; i >= 0; i--) {
			let [keyExpr, valueExpr] = this.#pairExprs[i];

			let keyIR = new IR([
				new IR(`${this.keyType.path}____to_data`),
				new IR("("),
				keyExpr.toIR(indent),
				new IR(")"),
			]);

			let valueIR = new IR([
				new IR(`${this.valueType.path}____to_data`),
				new IR("("),
				valueExpr.toIR(indent),
				new IR(")"),
			]);

			ir = new IR([
				new IR("__core__mkCons("),
				new IR("__core__mkPairData("),
				keyIR,
				new IR(","),
				valueIR,
				new IR(")"),
				new IR(", "),
				ir,
				new IR(")")
			], this.site);
		}

		return ir;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}{${this.#pairExprs.map(([keyExpr, valueExpr]) => `${keyExpr.toString()}: ${valueExpr.toString()}`).join(', ')}}`;
	}
}

/**
 * NameTypePair is base class of FuncArg and DataField (differs from StructLiteralField) 
 * @package
 */
class NameTypePair {
	#name;
	#typeExpr;

	/**
	 * @param {Word} name 
	 * @param {null | Expr} typeExpr 
	 */
	constructor(name, typeExpr) {
		this.#name = name;
		this.#typeExpr = typeExpr;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#name.site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {Type}
	 */
	get type() {
		if (this.isIgnored()) {
			return new AllType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			return assertDefined(this.#typeExpr.cache?.asType);
		}
	}

	/**
	 * @type {null | Expr}
	 */
	get typeExpr() {
		return this.#typeExpr
	}

	/**
	 * @type {string}
	 */
	get typeName() {
		if (this.#typeExpr === null) {
			return "";
		} else {
			return this.#typeExpr.toString();
		}
	}

	/**
	 * @returns {boolean}
	 */
	isIgnored() {
		return this.name.value === "_";
	}

	/**
	 * @returns {boolean}
	 */
	hasType() {
		return this.#typeExpr !== null;
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalType(scope) {
		if (this.isIgnored()) {
			return new AllType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			const t = this.#typeExpr.eval(scope);

			if (!t.asType) {
				throw this.#typeExpr.typeError(`'${t.toString()} isn't a valid type`);
			} else {
				return t.asType;
			}
		}
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}

	/**
	 * 
	 * @returns {string}
	 */
	toString() {
		if (this.#typeExpr === null) {
			return this.name.toString();
		} else {
			return `${this.name.toString()}: ${this.#typeExpr.toString()}`;
		}
	}
}

/**
 * Function argument class
 * @package
 */
class FuncArg extends NameTypePair {
	#defaultValueExpr;

	/**
	 * @param {Word} name 
	 * @param {null | Expr} typeExpr
	 * @param {null | Expr} defaultValueExpr
	 */
	constructor(name, typeExpr, defaultValueExpr = null) {
		super(name, typeExpr);

		this.#defaultValueExpr = defaultValueExpr;
	}

	/**
	 * @param {Scope} scope 
	 */
	evalDefault(scope) {
		if (this.#defaultValueExpr != null) {
			const v = this.#defaultValueExpr.eval(scope).asTyped;
			if (!v) {
				throw this.#defaultValueExpr.typeError("not typed");
			}

			const t = this.evalType(scope);

			if (!t.isBaseOf(v.type)) {
				throw this.#defaultValueExpr.site.typeError(`expected ${t.toString()}, got ${v.type.toString()}`);
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {ArgType}
	 */
	evalArgType(scope) {
		const t = super.evalType(scope);

		return new ArgType(this.name, t, this.#defaultValueExpr != null);
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		const name = super.toIR();

		if (this.#defaultValueExpr == null) {
			return name;
		} else {
			return new IR([
				new IR(`__useopt__${this.name.toString()}`),
				new IR(", "),
				name
			]);
		}
	}

	/**
	 * @param {IR} bodyIR 
	 * @param {string} name 
	 * @param {IR} defaultIR 
	 * @returns {IR}
	 */
	static wrapWithDefaultInternal(bodyIR, name, defaultIR) {
		return new IR([
			new IR(`(${name}) -> {`),
			bodyIR,
			new IR([
				new IR(`}(__core__ifThenElse(__useopt__${name}, () -> {${name}}, () -> {`),
				defaultIR, 
				new IR("})())")
			])
		]);
	}

	/**
	 * (argName) -> {
	 *   <bodyIR>
	 * }(
	 *   ifThenElse(
	 * 		__useoptarg__argName,
	 *  	() -> {
	 *        argName
	 *      },
	 *      () -> {
	 *        <defaultValueExpr>
	 *      }
	 *   )()
	 * )
	 * TODO: indentation
	 * @param {IR} bodyIR 
	 * @returns {IR}
	 */
	wrapWithDefault(bodyIR) {
		if (this.#defaultValueExpr == null) {
			return bodyIR;
		} else {
			const name = this.name.toString();

			return FuncArg.wrapWithDefaultInternal(bodyIR, name, this.#defaultValueExpr.toIR(""));
		}
	}
}

/**
 * (..) -> RetTypeExpr {...} expression
 * @package
 */
class FuncLiteralExpr extends Expr {
	#args;
	#retTypeExprs;
	#bodyExpr;

	/**
	 * @param {Site} site
	 * @param {FuncArg[]} args 
	 * @param {(null | Expr)[]} retTypeExprs 
	 * @param {Expr} bodyExpr 
	 */
	constructor(site, args, retTypeExprs, bodyExpr) {
		super(site);
		this.#args = args;
		this.#retTypeExprs = retTypeExprs;
		this.#bodyExpr = bodyExpr;
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#args.map(a => a.type);
	}

	/**
	 * @type {string[]}
	 */
	get argTypeNames() {
		return this.#args.map(a => a.typeName)
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#retTypeExprs.map(e => {
			if (e == null) {
				return new AllType();
			} else {
				return assertDefined(e.cache?.asType);
			}
		});
	}
	
	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {FuncType}
	 */
	evalType(scope) {
		let args = this.#args;
		if (this.isMethod()) {
			args = args.slice(1);
		}

		const argTypes = args.map(a => a.evalArgType(scope));

		const retTypes = this.#retTypeExprs.map(e => {
			if (e == null) {
				return new AllType();
			} else {
				return e.evalAsType(scope);
			}
		});

		return new FuncType(argTypes, retTypes);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const fnType = this.evalType(scope);
		
		// argTypes is calculated separately again here so it includes self
		const argTypes = this.#args.map(a => a.evalType(scope));

		const subScope = new Scope(scope);

		argTypes.forEach((a, i) => {
			if (!this.#args[i].isIgnored()) {
				this.#args[i].evalDefault(subScope);

				subScope.set(this.#args[i].name, a.toTyped());
			}
		});

		let bodyVal = this.#bodyExpr.eval(subScope);

		if (this.#retTypeExprs.length === 1) {
			if (this.#retTypeExprs[0] == null) {
				if (bodyVal.asMulti) {
					return new FuncEntity(new FuncType(fnType.argTypes, bodyVal.asMulti.values.map(v => v.type)));
				} else if (bodyVal.asTyped) {
					return new FuncEntity(new FuncType(fnType.argTypes, bodyVal.asTyped.type));
				} else {
					throw this.#bodyExpr.typeError("expect multi or typed");
				}
			} else if (bodyVal.asMulti) {
				throw this.#retTypeExprs[0].typeError("unexpected multi-value body");
			} else if (bodyVal.asTyped) {
				if (!fnType.retTypes[0].isBaseOf(bodyVal.asTyped.type)) {
					throw this.#retTypeExprs[0].typeError(`wrong return type, expected ${fnType.retTypes[0].toString()} but got ${bodyVal.asTyped.type.toString()}`);
				}
			} else {
				throw this.#bodyExpr.typeError("expect multi or typed");
			}
		} else {
			if (bodyVal.asMulti) {
				/** 
				 * @type {Typed[]} 
				 */
				let bodyVals = bodyVal.asMulti.values;

				if (bodyVals.length !== this.#retTypeExprs.length) {
					throw this.#bodyExpr.typeError(`expected multi-value function body with ${this.#retTypeExprs.length} values, but got ${bodyVals.length} values`);
				} else {
					for (let i = 0; i < bodyVals.length; i++) {
						let v = bodyVals[i];

						let retTypeExpr = assertDefined(this.#retTypeExprs[i]);
						if (!fnType.retTypes[i].isBaseOf(v.type)) {
							throw retTypeExpr.typeError(`wrong return type for value ${i}, expected ${fnType.retTypes[i].toString()} but got ${v.type.toString()}`);
						}
					}
				}
			} else {
				throw this.#bodyExpr.typeError(`expected multi-value function body, but got ${this.#bodyExpr.toString()}`);
			}
		}

		subScope.assertAllUsed();

		return new FuncEntity(fnType);
	}

	isMethod() {
		return this.#args.length > 0 && this.#args[0].name.toString() == "self";
	}

	/**
	 * @returns {IR}
	 */
	argsToIR() {
		let args = this.#args.map(a => a.toIR());
		if (this.isMethod()) {
			args = args.slice(1);
		}

		return (new IR(args)).join(", ");
	}

	/**
	 * In reverse order, because later opt args might depend on earlier args
	 * @param {IR} innerIR 
	 * @returns {IR}
	 */
	wrapWithDefaultArgs(innerIR) {
		const args = this.#args.slice().reverse();

		for (let arg of args) {
			innerIR = arg.wrapWithDefault(innerIR);
		}

		return innerIR;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIRInternal(indent = "") {
		let argsWithCommas = this.argsToIR();

		let innerIndent = indent;
		let methodIndent = indent;
		if (this.isMethod()) {
			innerIndent += TAB;
		}

		let innerIR = this.#bodyExpr.toIR(innerIndent + TAB);

		innerIR = this.wrapWithDefaultArgs(innerIR);

		let ir = new IR([
			new IR("("),
			argsWithCommas,
			new IR(") "), new IR("->", this.site), new IR(` {\n${innerIndent}${TAB}`),
			innerIR,
			new IR(`\n${innerIndent}}`),
		]);

		// wrap with 'self'
		if (this.isMethod()) {
			ir = new IR([
				new IR(`(self) -> {\n${methodIndent}${TAB}`),
				ir,
				new IR(`\n${methodIndent}}`),
			]);
		}

		return ir;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.toIRInternal(indent);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			let retTypeExpr = this.#retTypeExprs[0];
			if (retTypeExpr == null) {
				return `(${this.#args.map(a => a.toString()).join(", ")}) -> {${this.#bodyExpr.toString()}}`;
			} else {
				return `(${this.#args.map(a => a.toString()).join(", ")}) -> ${retTypeExpr.toString()} {${this.#bodyExpr.toString()}}`;
			}
		} else {
			return `(${this.#args.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => assertDefined(e).toString()).join(", ")}) {${this.#bodyExpr.toString()}}`;
		}
	}
}

/**
 * value[...] expression
 * @package
 */
class ParametricExpr extends Expr {
	#baseExpr;
	#parameters;

	/**
	 * @param {Site} site - site of brackets
	 * @param {Expr} baseExpr
	 * @param {Expr[]} parameters
	 */
	constructor(site, baseExpr, parameters) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#parameters = parameters;
	}

	/**
	 * @type {Type[]}
	 */
	get paramTypes() {
		return this.#parameters.map(p => {
			const pt = p.cache?.asType;

			if (!pt) {
				throw new Error("not a type");
			}

			return pt;
		})
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const paramTypes = this.#parameters.map(p => p.evalAsType(scope));

		const baseVal = this.#baseExpr.eval(scope);

		if (!baseVal.asParametric) {
			throw this.site.typeError(`'${baseVal.toString()}' isn't a parametric instance`);
		} else {
			return baseVal.asParametric.apply(paramTypes, this.site);
		}
	}

	/**
	 * Reused by CallExpr
	 * @param {Type[]} paramTypes
	 * @returns {string}
	 */
	static toApplicationIR(paramTypes) {
		return `[${paramTypes.map(pt => {
			if (pt instanceof FuncType) {
				return "__fn";
			} else {
				return assertDefined(pt.asNamed).path;
			}
		}).join("@")}]`;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const params = ParametricExpr.toApplicationIR(this.paramTypes);
		
		if (this.#baseExpr instanceof MemberExpr) {
			return this.#baseExpr.toIR(indent, params);
		} else {
			return new IR(`${this.#baseExpr.toIR().toString()}${params}`, this.site);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseExpr.toString()}[${this.#parameters.map(p => p.toString()).join(", ")}]`;
	}
}

/**
 * Unary operator expression
 * Note: there are no post-unary operators, only pre
 * @package
 */
class UnaryExpr extends Expr {
	#op;
	#a;

	/**
	 * @param {SymbolToken} op 
	 * @param {Expr} a 
	 */
	constructor(op, a) {
		super(op.site);
		this.#op = op;
		this.#a = a;
	}

	/**
	 * Turns an op symbol into an internal name
	 * @returns {Word}
	 */
	translateOp() {
		const op = this.#op.toString();
		const site = this.#op.site;

		if (op == "+") {
			return new Word(site, "__pos");
		} else if (op == "-") {
			return new Word(site, "__neg");
		} else if (op == "!") {
			return new Word(site, "__not");
		} else {
			throw new Error("unhandled unary op");
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const a = this.#a.eval(scope).asInstance;
		if (!a) {
			throw this.#a.site.typeError("not an instance");
		}

		const op = this.translateOp().value;

		const fnVal = a.type.typeMembers[op]?.asType?.toTyped()?.asFunc;

		if (fnVal) {
			// immediately applied
			return fnVal.asFunc.call(this.#op.site, [a]);
		} else {
			throw this.#a.site.typeError(`'${this.#op.toString()} ${a.type.toString()}' undefined`);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const path = assertDefined(this.cache?.asTyped?.type?.asNamed).path;

		return new IR([
			new IR(`${path}__${this.translateOp().value}`, this.site), new IR("("),
			this.#a.toIR(indent),
			new IR(")")
		]);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#op.toString()}${this.#a.toString()}`;
	}
}

/**
 * Binary operator expression
 * @package
 */
class BinaryExpr extends Expr {
	#op;
	#a;
	#b;
	#swap; // swap a and b for commutative ops
	#alt; // use alt (each operator can have one overload)

	/**
	 * @param {SymbolToken} op 
	 * @param {Expr} a 
	 * @param {Expr} b 
	 */
	constructor(op, a, b) {
		super(op.site);
		this.#op = op;
		this.#a = a;
		this.#b = b;
		this.#swap = false;
		this.#alt = 0;
	}

	/** 
	 * @type {Expr}
	 */
	get first() {
		return this.#swap ? this.#b : this.#a;
	}

	/**
	 * @type {Expr} 
	 */
	get second() {
		return this.#swap ? this.#a : this.#b;
	}

	toString() {
		return `${this.#a.toString()} ${this.#op.toString()} ${this.#b.toString()}`;
	}

	/**
	 * Turns op symbol into internal name
	 * @param {number} alt
	 * @returns {Word}
	 */
	translateOp(alt = 0) {
		const op = this.#op.toString();
		const site = this.#op.site;
		let name;

		if (op == "||") {
			name = "__or";
		} else if (op == "&&") {
			name = "__and";
		} else if (op == "==") {
			name = "__eq";
		} else if (op == "!=") {
			name = "__neq";
		} else if (op == "<") {
			name = "__lt";
		} else if (op == "<=") {
			name = "__leq";
		} else if (op == ">") {
			name = "__gt";
		} else if (op == ">=") {
			name = "__geq";
		} else if (op == "+") {
			name = "__add";
		} else if (op == "-") {
			name = "__sub";
		} else if (op == "*") {
			name = "__mul";
		} else if (op == "/") {
			name = "__div";
		} else if (op == "%") {
			name = "__mod";
		} else {
			throw new Error("unhandled");
		}

		if (alt > 0) {
			name += alt.toString();
		}

		return new Word(site, name);
	}

	/**
	 * @returns {boolean}
	 */
	isCommutative() {
		switch (this.#op.toString()) {
			case "+":
			case "*":
			case "==":
			case "!=":
				return true;
			default:
				return false;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const a = this.#a.eval(scope).asInstance;
		if (!a) {
			throw this.#a.typeError("not an instance");
		} 

		const b = this.#b.eval(scope).asInstance;
		if (!b) {
			throw this.#b.typeError("not an instance");
		}

		for (let swap of (this.isCommutative() ? [false, true] : [false])) {
			for (let alt of [0, 1, 2]) {
				let first  = swap ? b : a;
				let second = swap ? a : b;

				try {
					const fnVal_ = first.type.typeMembers[this.translateOp(alt).value];

					let fnVal = fnVal_?.asType?.toTyped()?.asFunc;
					if (!fnVal) {
						continue;
					}

					let res = fnVal.call(this.#op.site, [first, second]);

					this.#swap = swap;
					this.#alt  = alt;

					return res;
				} catch (e) {
					if (e instanceof UserError) {
						continue;
					} else {
						throw e;
					}
				}
			}
		}

		throw this.typeError(`'${a.type.toString()} ${this.#op.toString()} ${b.type.toString()}' undefined`);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = assertDefined(this.first.cache?.asTyped?.type.asNamed).path;

		let op = this.translateOp(this.#alt).value;

		if (op == "__and" || op == "__or") {
			return new IR([
				new IR(`${path}${op}`, this.site), new IR(`(\n${indent}${TAB}() -> {`),
				this.first.toIR(indent + TAB),
				new IR(`},\n${indent}${TAB}() -> {`),
				this.second.toIR(indent + TAB),
				new IR(`}\n${indent})`)
			]);
		} else {
			return new IR([
				new IR(`${path}__${op}`, this.site), new IR("("),
				this.first.toIR(indent),
				new IR(", "),
				this.second.toIR(indent),
				new IR(")")
			]);
		}
	}
}

/**
 * Parentheses expression
 * @package
 */
class ParensExpr extends Expr {
	#exprs;

	/**
	 * @param {Site} site 
	 * @param {Expr[]} exprs
	 */
	constructor(site, exprs) {
		super(site);
		this.#exprs = exprs;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].eval(scope);
		} else {
			return new MultiEntity(this.#exprs.map(e => {
				const v = e.eval(scope).asTyped;

				if (!v) {
					throw e.site.typeError("not typed");
				} 
				
				if ((new ErrorType()).isBaseOf(v.type)) {
					throw e.site.typeError("unexpected error call in multi-valued expression");
				}

				return v;
			}));
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].toIR(indent);
		} else {
			return new IR(
				[new IR(`(callback) -> {\n${indent + TAB}callback(\n${indent + TAB + TAB}`, this.site)]
				.concat(new IR(this.#exprs.map(e => e.toIR(indent + TAB + TAB))).join(`,\n${indent + TAB + TAB}`))
				.concat([new IR(`\n${indent + TAB})\n${indent}}`)])
			);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#exprs.map(e => e.toString()).join(", ")})`;
	}
}

/**
 * @package
 */
class CallArgExpr extends Token {
	#name;
	#valueExpr;

	/**
	 * @param {Site} site 
	 * @param {null | Word} name 
	 * @param {Expr} valueExpr 
	 */
	constructor(site, name, valueExpr) {
		super(site);

		this.#name = name;
		this.#valueExpr = valueExpr;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name?.toString() ?? "";
	}

	/**
	 * @type {Expr}
	 */
	get valueExpr() {
		return this.#valueExpr;
	}

	/**
	 * @type {EvalEntity}
	 */
	get value() {
		return assertDefined(this.#valueExpr.cache);
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name != null;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return this.#valueExpr.isLiteral();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: `: "",
			this.#valueExpr.toString()
		].join("");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	eval(scope) {
		return this.#valueExpr.eval(scope);
	}
}

/**
 * ...(...) expression
 * @package
 */
class CallExpr extends Expr {
	#fnExpr;
	#argExprs;

	/**
	 * @type {Type[]}
	 */
	#paramTypes;

	/**
	 * @type {null | Func}
	 */
	#appliedFnVal;

	/**
	 * @param {Site} site 
	 * @param {Expr} fnExpr 
	 * @param {CallArgExpr[]} argExprs 
	 */
	constructor(site, fnExpr, argExprs) {
		super(site);
		this.#fnExpr = fnExpr;
		this.#argExprs = argExprs;
		this.#paramTypes = [];
		this.#appliedFnVal = null; // only for inferred parametric funcions
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	toString() {
		return `${this.#fnExpr.toString()}(${this.#argExprs.map(a => a.toString()).join(", ")})`;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		if (this.#fnExpr instanceof PathExpr && this.cache?.asTyped && this.#fnExpr.baseExpr.cache?.asType?.isBaseOf(this.cache.asTyped.type)) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const fnVal = this.#fnExpr.eval(scope);

		const argVals = this.#argExprs.map(ae => {
			const av_ = ae.eval(scope);
			
			const av = av_.asTyped ?? av_.asMulti;

			if (!av) {
				throw ae.typeError("not an instance");
			}

			return av;
		});

		/**
		 * @type {(Typed | Multi)[]}
		 */
		const posArgVals_ = [];

		this.#argExprs.forEach((argExpr, i) => {
			if (!argExpr.isNamed()) {
				posArgVals_.push(argVals[i]);
			}
		});

		/**
		 * @type {Typed[]}
		 */
		const posArgVals = MultiEntity.flatten(posArgVals_);

		/**
		 * @type {{[name: string]: Typed}}
		 */
		const namedArgVals = {};

		this.#argExprs.forEach((argExpr, i) => {
			if (argExpr.isNamed()) {
				const val = argVals[i];

				// can't be multi instance
				if (val.asMulti) {
					throw argExpr.typeError("can't use multiple return values as named argument");
				} else if (val.asTyped) {
					namedArgVals[argExpr.name] = val.asTyped;
				} else {
					throw new Error("unexpected");
				}
			}
		});

		assert(posArgVals.every(pav => pav != undefined));

		if (fnVal.asParametric) {
			this.#paramTypes = [];

			this.#appliedFnVal = fnVal.asParametric.inferCall(this.site, posArgVals, namedArgVals, this.#paramTypes);

			return this.#appliedFnVal.call(this.site, posArgVals, namedArgVals);
		} else if (fnVal.asFunc) {
			return fnVal.asFunc.call(this.site, posArgVals, namedArgVals);
		} else {
			throw this.#fnExpr.typeError(`expected function, got ${fnVal.toString()}`);
		}
	}

	/**
	 * Don't call this inside eval() because param types won't yet be complete.
	 * @type {FuncType}
	 */
	get fn() {
		if (this.#fnExpr.cache?.asParametric) {
			return assertClass(this.#appliedFnVal?.type?.asType, FuncType);
		} else {
			return assertClass(this.#fnExpr.cache?.asTyped?.type.asType, FuncType);
		}
	}

	/**
	 * @returns {[Expr[], IR[]]} - first list are positional args, second list named args and remaining opt args
	 */
	expandArgs() {
		const fn = this.fn;
		const nNonOptArgs = fn.nNonOptArgs;

		/**
		 * @type {Expr[]}
		 */
		const positional = [];

		this.#argExprs.forEach(ae => {
			if (!ae.isNamed()) {
				positional.push(ae.valueExpr);
			}
		});

		/**
		 * @type {IR[]}
		 */
		const namedOptional = [];

		this.#argExprs.forEach(ae => {
			if (ae.isNamed()) {
				const i = fn.getNamedIndex(ae.site, ae.name);

				if (i < nNonOptArgs) {
					positional[i] = ae.valueExpr;
				} else {
					namedOptional[i - nNonOptArgs] = new IR([
						new IR("true"),
						new IR(", "),
						ae.valueExpr.toIR()
					]);
				}
			}
		});

		for (let i = nNonOptArgs; i < fn.nArgs; i++) {
			if (namedOptional[i - nNonOptArgs] == undefined) {
				namedOptional[i - nNonOptArgs] = new IR([
					new IR("false"),
					new IR(", "),
					new IR("()")
				]);
			}
		}

		return [positional.filter(p => p != undefined), namedOptional];
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toFnExprIR(indent = "") {
		if (this.#fnExpr.cache?.asParametric instanceof ParametricFunc) {
			assert(this.#paramTypes.length > 0);

			const params = ParametricExpr.toApplicationIR(this.#paramTypes);

			if (this.#fnExpr instanceof MemberExpr) {
				return this.#fnExpr.toIR(indent, params);
			} else {
				return new IR(`${this.#fnExpr.toIR(indent).toString()}${params}`, this.#fnExpr.site);
			}
		} else {
			return this.#fnExpr.toIR(indent);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let fnIR = this.toFnExprIR(indent);

		/**
		 * We need the func type for things like multivalued args and optional args 
		 * @type {FuncType} 
		 */
		const fn = this.fn;

		/**
		 * First step is to eliminate the named args
		 * @type {[Expr[], IR[]]}
		 */
		const [positional, namedOptional] = this.expandArgs();

		if (positional.some(e => (!e.isLiteral()) && (e.cache?.asMulti))) {
			// count the number of final args
			let n = 0;

			positional.forEach((e, i) => {
				if ((!e.isLiteral()) && (e.cache?.asMulti)) {
					n += e.cache.asMulti.values.length;
				} else {
					n += 1;
				}
			});

			n += namedOptional.length;

			if (n > fn.nArgs) {
				namedOptional.splice(0, n - fn.nArgs);
			}

			let names = [];

			for (let i = 0; i < fn.nArgs; i++) {
				if (i >= fn.nNonOptArgs) {
					names.push(`__useopt__x${i}`);
				}

				names.push(`x${i}`);
			}

			let ir = new IR([
				fnIR,
				new IR("("),
				new IR(names.map(n => new IR(n))).join(", "),
				new IR(")", this.site)
			]);

			for (let namedIR of namedOptional.slice().reverse()) {
				const n2 = assertDefined(names.pop());
				const n1 = assertDefined(names.pop());
				assert(n1.startsWith("__useopt__"));

				ir = new IR([
					new IR("("),
					new IR(n1),
					new IR(", "),
					new IR(n2),
					new IR(") -> {"),
					ir,
					new IR("}("),
					assertDefined(namedIR), // bool - val pair
					new IR(")")
				]);
			}

			for (let i = positional.length - 1; i >= 0; i--) {
				const e = positional[i];

				if ((!e.isLiteral()) && (e.cache?.asMulti)) {
					const nMulti = e.cache.asMulti.values.length;
					const multiNames = [];
					const multiOpt = [];

					while (multiNames.length < nMulti) {
						multiNames.unshift(assertDefined(names.pop()));

						if (names.length > 0 && names[names.length-1] == `__useopt__${multiNames[0]}`) {
							multiOpt.unshift(assertDefined(names.pop()));
						}
					}

					if (multiOpt.length > 0) {
						ir = new IR([
							new IR("("),
							new IR(multiOpt.map(n => new IR(n))).join(", "),
							new IR(") -> {"),
							ir,
							new IR("}("),
							new IR(multiOpt.map(n => new IR("true"))).join(", "),
							new IR(")")
						])
					}

					ir = new IR([
						e.toIR(),
						new IR("(("),
						new IR(multiNames.map(n => new IR(n))).join(", "),
						new IR(") -> {"),
						ir,
						new IR("})")
					]);
				} else {
					const name = assertDefined(names.pop());

					if (names.length > 0 && names[names.length - 1] == `__useopt__${name}`) {
						ir = new IR([
							new IR("("),
							new IR(assertDefined(names.pop())),
							new IR(") -> {"),
							new IR("}(true)")
						]);
					}

					ir = new IR([
						new IR("("),
						new IR(name),
						new IR(") -> {"),
						ir,
						new IR("}("),
						e.toIR(),
						new IR(")")
					]);
				}
			}

			return ir;
		} else {
			if (positional.length + namedOptional.length > fn.nArgs) {
				namedOptional.splice(0, positional.length + namedOptional.length - fn.nArgs);
			}

			let args = positional.map((a, i) => {
				let ir = a.toIR(indent);

				if (i >= fn.nNonOptArgs) {
					ir = new IR([
						new IR("true, "),
						ir
					]);
				}

				return ir;
			}).concat(namedOptional);

			return new IR([
				fnIR,
				new IR("("),
				(new IR(args)).join(", "),
				new IR(")", this.site)
			]);
		}
	}
}

/**
 *  ... . ... expression
 * @package
 */
class MemberExpr extends Expr {
	#objExpr;
	#memberName;

	/**
	 * @param {Site} site 
	 * @param {Expr} objExpr 
	 * @param {Word} memberName 
	 */
	constructor(site, objExpr, memberName) {
		super(site);
		this.#objExpr = objExpr;
		this.#memberName = memberName;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const objVal = this.#objExpr.eval(scope).asInstance;
		if (!objVal) {
			throw this.#objExpr.site.typeError("not an instance");
		}

		let member = objVal.instanceMembers[this.#memberName.value];
		if (!member) {

			if (objVal?.type?.asEnumMemberType) {
				member = objVal.type.asEnumMemberType.parentType.instanceMembers[this.#memberName.value];
			}

			if (!member) {
				throw this.#memberName.referenceError(`'${objVal.type.toString()}.${this.#memberName.value}' undefined`);
			}
		}

		if (member.asParametric) {
			return member;
		} else if (member.asType) {
			const memberVal = member.asType.toTyped();

			return memberVal;
		} else {
			throw new Error("expected type or parametric");
		}
	}

	/**
	 * @param {string} indent 
	 * @param {string} params - applied type parameters must be inserted Before the call to self
	 * @returns {IR}
	 */
	toIR(indent = "", params = "") {
		// members can be functions so, field getters are also encoded as functions for consistency

		const objType = assertDefined(this.#objExpr.cache?.asTyped?.type?.asNamed); 

		let objPath = objType.path;

		// if we are getting the member of an enum member we should check if it a field or method, because for a method we have to use the parent type
		if (objType.asEnumMemberType && (objType.asEnumMemberType.instanceMembers[this.#memberName.value] === undefined)) {
			objPath = objType.asEnumMemberType.parentType.path;
		}

		let ir = new IR(`${objPath}__${this.#memberName.toString()}${params}`, this.site);

		return new IR([
			ir, new IR("("),
			this.#objExpr.toIR(indent),
			new IR(")"),
		]);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#objExpr.toString()}.${this.#memberName.toString()}`;
	}
}

/**
 * if-then-else expression 
 * @package
 */
class IfElseExpr extends Expr {
	#conditions;
	#branches;

	/**
	 * @param {Site} site 
	 * @param {Expr[]} conditions 
	 * @param {Expr[]} branches 
	 */
	constructor(site, conditions, branches) {
		assert(branches.length == conditions.length + 1);
		assert(branches.length > 1);

		super(site);
		this.#conditions = conditions;
		this.#branches = branches;
	}

	toString() {
		let s = "";
		for (let i = 0; i < this.#conditions.length; i++) {
			s += `if (${this.#conditions[i].toString()}) {${this.#branches[i].toString()}} else `;
		}

		s += `{${this.#branches[this.#conditions.length].toString()}}`;

		return s;
	}

	/**
	 * @param {Site} site
	 * @param {null | Type} prevType
	 * @param {Type} newType
	 */
	static reduceBranchType(site, prevType, newType) {
		if (prevType === null || prevType instanceof ErrorType) {
			return newType;
		} else if (newType instanceof ErrorType) {
			return prevType;
		} else if (!prevType.isBaseOf(newType)) {
			if (newType.isBaseOf(prevType)) {
				return newType;
			} else {
				// check if enumparent is base of newType and of prevType
				if (newType.asEnumMemberType) {
					const parentType = newType.asEnumMemberType.parentType;

					if (parentType.isBaseOf(prevType) && parentType.isBaseOf(newType)) {
						return parentType;
					}
				}

				throw site.typeError("inconsistent types");
			}
		} else {
			return prevType;
		}
	}

	/**
	 * @param {Site} site
	 * @param {null | Type[]} prevTypes
	 * @param {Typed | Multi} newValue
	 * @returns {?Type[]}
	 */
	static reduceBranchMultiType(site, prevTypes, newValue) {
		if (!newValue.asMulti && newValue.asTyped && (new ErrorType()).isBaseOf(newValue.asTyped.type)) {
			return prevTypes;
		}

		const newTypes = (newValue.asMulti) ?
			newValue.asMulti.values.map(v => v.type) :
			[assertDefined(newValue.asTyped).type];

		if (prevTypes === null) {
			return newTypes;
		} else if (prevTypes.length !== newTypes.length) {
			throw site.typeError("inconsistent number of multi-value types");
		} else {
			return prevTypes.map((pt, i) => IfElseExpr.reduceBranchType(site, pt, newTypes[i]));
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		for (let c of this.#conditions) {
			let cVal = c.eval(scope).asTyped;

			if (!cVal || !BoolType.isBaseOf(cVal.type)) {
				throw c.typeError("expected bool");
			}
		}

		/**
		 * Supports multiple return values
		 * @type {?Type[]}
		 */
		let branchMultiType = null;

		for (let b of this.#branches) {
			const branchVal = b.evalAsTypedOrMulti(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				b.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (branchMultiType === null) {
			// i.e. every branch throws an error
			return new ErrorEntity();
		} else  {
			return Common.toTyped(branchMultiType);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let n = this.#conditions.length;

		// each branch actually returns a function to allow deferred evaluation
		let res = new IR([
			new IR("() -> {"),
			this.#branches[n].toIR(indent),
			new IR("}")
		]);

		// TODO: nice indentation
		for (let i = n - 1; i >= 0; i--) {
			res = new IR([
				new IR("__core__ifThenElse("),
				this.#conditions[i].toIR(indent),
				new IR(", () -> {"),
				this.#branches[i].toIR(indent),
				new IR("}, () -> {"),
				res,
				new IR("()})"),
			]);
		}

		return new IR([res, new IR("()", this.site)]);
	}
}

/**
 * DestructExpr is for the lhs-side of assignments and for switch cases
 * @package
 */
class DestructExpr {
	/**
	 * @type {Word}
	 */
	#name;

	/**
	 * @type {null | Expr}
	 */
	#typeExpr;

	/**
	 * @type {DestructExpr[]}
	 */
	#destructExprs;

	/**
	 * @param {Word} name - use an underscore as a sink
	 * @param {null | Expr} typeExpr 
	 * @param {DestructExpr[]} destructExprs
	 */
	constructor(name, typeExpr, destructExprs = []) {
		this.#name = name;
		this.#typeExpr = typeExpr;
		this.#destructExprs = destructExprs;

		assert (!(this.#typeExpr == null && this.#destructExprs.length > 0));
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#name.site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @returns {boolean}
	 */
	hasDestructExprs() {
		return this.#destructExprs.length > 0;
	}

	isIgnored() {
		return this.name.value === "_";
	}

	/**
	 * @returns {boolean}
	 */
	hasType() {
		return this.#typeExpr !== null;
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {Type}
	 */
	get type() {
		if (this.#typeExpr === null) {
			if (this.isIgnored()) {
				return new AllType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			if (!this.#typeExpr.cache?.asType) {
				throw this.#typeExpr.typeError(`invalid type '${assertDefined(this.#typeExpr.cache, "cache unset").toString()}'`);
			} else {
				return this.#typeExpr.cache.asType;
			}
		}
	}

	/**
	 * @type {Word}
	 */
	get typeName() {
		if (this.#typeExpr === null) {
			return new Word(this.site, "");
		} else {
			return new Word(this.#typeExpr.site, this.#typeExpr.toString());
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#typeExpr === null) {
			return this.name.toString();
		} else {
			let destructStr = "";

			if (this.#destructExprs.length > 0) {
				destructStr = `{${this.#destructExprs.map(de => de.toString()).join(", ")}}`;
			}

			if (this.isIgnored()) {
				return `${this.#typeExpr.toString()}${destructStr}`;
			} else {
				return `${this.name.toString()}: ${this.#typeExpr.toString()}${destructStr}`;
			}
		}
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalType(scope) {
		if (this.#typeExpr === null) {
			if (this.isIgnored()) {
				return new AllType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			return this.#typeExpr.evalAsType(scope);
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType 
	 */
	evalDestructExprs(scope, upstreamType) {
		if (this.#destructExprs.length > 0) {
			if (!upstreamType.asDataType) {
				throw this.site.typeError("can't destruct a function");
			}

			const upstreamFieldNames = upstreamType.asDataType.fieldNames;

			if (upstreamFieldNames.length != this.#destructExprs.length) {
				throw this.site.typeError(`wrong number of destruct fields, expected ${upstreamFieldNames.length}, got ${this.#destructExprs.length}`);
			}

			for (let i = 0; i < this.#destructExprs.length; i++) {

				this.#destructExprs[i].evalInternal(
					scope, 
					assertDefined(upstreamType.instanceMembers[upstreamFieldNames[i]].asDataType), 
					i
				);
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType
	 * @param {number} i
	 */
	evalInternal(scope, upstreamType, i) {
		if (this.hasType()) {
			const t = this.evalType(scope).asDataType;
			if (!t) {
				throw this.site.typeError("not a data type");
			}

			// differs from upstreamType because can be enum parent
			let checkType = t;

			// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
			if (t.asEnumMemberType && !upstreamType.asEnumMemberType) {
				checkType = t.asEnumMemberType.parentType;
			}

			if (!checkType.isBaseOf(upstreamType)) {
				throw this.site.typeError(`expected ${checkType.toString()} for destructure field ${i+1}, got ${upstreamType.toString()}`);
			}

			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, t.toTyped());
			}

			this.evalDestructExprs(scope, t);
		} else {
			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, upstreamType.toTyped());
			}

			this.evalDestructExprs(scope, upstreamType);
		}
	}

	/**
	 * @param {Scope} scope
	 * @param {DataType} caseType
	 */
	evalInSwitchCase(scope, caseType) {
		if (!this.isIgnored()) {
			scope.set(this.#name, caseType.toTyped());
		}

		if (this.#typeExpr) {
			this.#typeExpr.cache = caseType;
		}

		this.evalDestructExprs(scope, caseType);
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType
	 * @param {number} i
	 */
	evalInAssignExpr(scope, upstreamType, i) {
		/**
		 * @param {null | Type} t 
		 */
		const checkType = (t) => {
			if (!t) {
				throw this.site.typeError("not a type");
			}

			// differs from upstreamType because can be enum parent
			let checkType = t;

			// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
			if (t.asEnumMemberType && !upstreamType.asEnumMemberType) {
				checkType = t.asEnumMemberType.parentType;
			}

			if (!checkType.isBaseOf(upstreamType)) {
				throw this.site.typeError(`expected ${checkType.toString()} for rhs ${i+1}, got ${upstreamType.toString()}`);
			}

			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, t.toTyped());
			}

			this.evalDestructExprs(scope, t);
		}

		const t = this.evalType(scope);

		if (t.asType) {
			checkType(t.asType);
		} else if (t.asMulti) {
			if (i >= t.asMulti.values.length) {
				throw this.site.typeError(`expected multi instace with only ${t.asMulti.values.length} items`);
			}

			checkType(t.asMulti.values[i].type.asDataType);
		} else {
			throw new Error("unexpected");
		}
	}

	/**
	 * @param {number} argIndex 
	 * @returns {IR}
	 */
	toNameIR(argIndex) {
		if (this.isIgnored()) {
			return new IR(`__lhs_${argIndex}`);
		} else {
			return new IR(this.#name.toString(), this.#name.site)
		}
	}

	/**
	 * @param {number} fieldIndex
	 * @returns {string}
	 */
	getFieldFn(fieldIndex) {
		const type = this.type;

		if (type.asDataType) {
			return `${type.asDataType.path}__${type.asDataType.fieldNames[fieldIndex]}`;
		} else {
			return "";
		}
	}

	/**
	 * @param {string} indent
	 * @param {IR} inner 
	 * @param {string} objName 
	 * @param {number} fieldIndex 
	 * @param {string} fieldFn
	 * @returns {IR}
	 */
	wrapDestructIRInternal(indent, inner, objName, fieldIndex, fieldFn) {
		if (this.isIgnored() && this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `${objName}_${fieldIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				inner = this.#destructExprs[i].wrapDestructIRInternal(indent + TAB, inner, baseName, i, this.getFieldFn(i));
			}

			let getter = `${fieldFn}(${objName})`;

			// assert correct constructor index
			if (this.#typeExpr && this.type.asEnumMemberType) {
				const constrIdx = this.type.asEnumMemberType.constrIndex;

				getter = `__helios__common__assert_constr_index(${getter}, ${constrIdx})`;
			}
			
			return new IR([
				new IR("("),
				new IR(baseName, this.#name.site),
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
				inner,
				new IR(`\n${indent}}(${getter})`),
			]);
		}
	}

	/**
	 * @param {string} indent
	 * @param {IR} inner 
	 * @param {number} argIndex 
	 * @returns {IR}
	 */
	wrapDestructIR(indent, inner, argIndex) {
		if (this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `__lhs_${argIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				const de = this.#destructExprs[i];

				inner = de.wrapDestructIRInternal(indent + TAB, inner, baseName, i, this.getFieldFn(i));
			}

			return inner;
		}
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}
}

/**
 * Switch case for a switch expression
 * @package
 */
class SwitchCase extends Token {
	#lhs;
	#bodyExpr;

	/** @type {?number} */
	#constrIndex;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr} lhs
	 * @param {Expr} bodyExpr 
	 */
	constructor(site, lhs, bodyExpr) {
		super(site);
		this.#lhs = lhs;
		this.#bodyExpr = bodyExpr;
		this.#constrIndex = null;
	}

	/**
	 * @type {Expr}
	 */
	get body() {
		return this.#bodyExpr;
	}

	/**
	 * Used by parser to check if typeExpr reference the same base enum
	 * @type {Word} - word representation of type
	 */
	get memberName() {
		return this.#lhs.typeName;
	}

	isDataMember() {
		switch (this.memberName.value) {
			case "Int":
			case "[]Data":
			case "ByteArray":
			case "Map[Data]Data":
				return true;
			default:
				return false;
		}
	}

	/**
	 * @type {number}
	 */
	get constrIndex() {
		if (this.#constrIndex === null) {
			throw new Error("constrIndex not yet set");
		} else {
			return this.#constrIndex;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#lhs.toString()} => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope 
	 * @param {DataType} enumType
	 * @returns {EvalEntity}
	 */
	evalEnumMember(scope, enumType) {
		const caseType = enumType.typeMembers[this.memberName.value]?.asEnumMemberType;
		if (!caseType) {
			throw this.memberName.typeError(`${this.memberName.value} isn't a valid enum member of ${enumType.toString()}`);
		}

		this.#constrIndex = caseType.constrIndex;

		assert(this.#constrIndex >= 0);

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, caseType);

		const bodyVal = this.#bodyExpr.eval(caseScope);

		caseScope.assertAllUsed();

		return bodyVal;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {EvalEntity}
	 */
	evalDataMember(scope) {
		/** @type {DataType} */
		let memberType;

		switch (this.memberName.value) {
			case "Int":
				memberType = IntType;
				break;
			case "ByteArray":
				memberType = ByteArrayType;
				break;
			case "[]Data":
				memberType = ListType$(RawDataType);
				break;
			case "Map[Data]Data":
				memberType = MapType$(RawDataType, RawDataType);
				break;
			default:
				let maybeMemberType = scope.get(this.memberName).asDataType;
				if (!maybeMemberType) {
					throw this.memberName.typeError("expected a data type");
				}
				memberType = maybeMemberType;

				if (!Common.isEnum(memberType)) {
					throw this.memberName.typeError("expected an enum type");
				}
		}

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, memberType);

		const bodyVal = this.#bodyExpr.eval(caseScope);

		caseScope.assertAllUsed();

		return bodyVal;
	}

	/**
	 * Accept an arg because will be called with the result of the controlexpr
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let inner = this.#bodyExpr.toIR(indent + TAB);

		inner = this.#lhs.wrapDestructIR(indent, inner, 0);

		return new IR([
			new IR("("),
			this.#lhs.toNameIR(0), 
			new IR(") "),
			new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
			inner,
			new IR(`\n${indent}}`),
		]);
	}
}

/**
 * @package
 */
class UnconstrDataSwitchCase extends SwitchCase {
	#intVarName;
	#lstVarName;

	/**
	 * @param {Site} site 
	 * @param {?Word} intVarName 
	 * @param {?Word} lstVarName 
	 * @param {Expr} bodyExpr 
	 */
	constructor(site, intVarName, lstVarName, bodyExpr) {
		super(site, new DestructExpr(new Word(site, "_"), new RefExpr(new Word(site, "(Int, []Data)"))), bodyExpr);

		this.#intVarName = intVarName;
		this.#lstVarName = lstVarName;
	}

	isDataMember() {
		return true;
	}

	toString() {
		return `(${this.#intVarName === null ? "" : this.#intVarName.value + ": "}Int, ${this.#lstVarName === null ? "" : this.#lstVarName.value + ": "} []Data) => ${this.body.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} enumType
	 * @returns {Instance}
	 */
	evalEnumMember(scope, enumType) {
		throw new Error("not available");
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {EvalEntity}
	 */
	evalDataMember(scope) {
		if (this.#intVarName !== null || this.#lstVarName !== null) {
			let caseScope = new Scope(scope);

			if (this.#intVarName !== null) {
				caseScope.set(this.#intVarName, new DataEntity(IntType));
			}

			if (this.#lstVarName !== null) {
				caseScope.set(this.#lstVarName, new DataEntity(ListType$(RawDataType)));
			}

			let bodyVal = this.body.eval(caseScope);

			caseScope.assertAllUsed();

			return bodyVal;
		} else {
			return this.body.eval(scope);
		}
	}

	/**
	 * Accepts two args
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR(`(data) -> {\n${indent}${TAB}`),
			new IR(`(pair) -> {\n${indent}${TAB}${TAB}`),
			new IR(`(${this.#intVarName !== null ? this.#intVarName.toString() : "_"}, ${this.#lstVarName !== null ? this.#lstVarName.toString() : "_"}) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}${TAB}${TAB}`),
			this.body.toIR(indent + TAB + TAB + TAB),
			new IR(`\n${indent}${TAB}${TAB}}(__core__fstPair(pair), __core__sndPair(pair))`),
			new IR(`\n${indent}${TAB}}(__core__unConstrData(data))`),
			new IR(`\n${indent}}`)
		]);
	}
}

/**
 * Default switch case
 * @package
 */
class SwitchDefault extends Token {
	#bodyExpr;

	/**
	 * @param {Site} site
	 * @param {Expr} bodyExpr
	 */
	constructor(site, bodyExpr) {
		super(site);
		this.#bodyExpr = bodyExpr;
	}

	toString() {
		return `else => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	eval(scope) {
		return this.#bodyExpr.eval(scope);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR(`(_) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
			this.#bodyExpr.toIR(indent + TAB),
			new IR(`\n${indent}}`)
		]);
	}
}

/**
 * Parent class of EnumSwitchExpr and DataSwitchExpr
 */
class SwitchExpr extends Expr {
	#controlExpr;
	#cases;
	#defaultCase;

	/** 
	 * @param {Site} site
	 * @param {Expr} controlExpr - input value of the switch
	 * @param {SwitchCase[]} cases
	 * @param {?SwitchDefault} defaultCase
	*/
	constructor(site, controlExpr, cases, defaultCase = null) {
		super(site);
		this.#controlExpr = controlExpr;
		this.#cases = cases;
		this.#defaultCase = defaultCase;
	}

	get controlExpr() {
		return this.#controlExpr;
	}

	get cases() {
		return this.#cases;
	}

	get defaultCase() {
		return this.#defaultCase;
	}

	/**
	 * If there isn't enough coverage then we can simply set the default case to void, so the other branches can be error, print or assert
	 */
	setDefaultCaseToVoid() {
		this.#defaultCase = new SwitchDefault(this.site, new VoidExpr(this.site));
	}

	toString() {
		return `${this.#controlExpr.toString()}.switch{${this.#cases.map(c => c.toString()).join(", ")}${this.#defaultCase === null ? "" : ", " + this.#defaultCase.toString()}}`;
	}
}

/**
 * Switch expression for Enum, with SwitchCases and SwitchDefault as children
 * @package
 */
class EnumSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope).asTyped;

		if (!controlVal) {
			throw this.controlExpr.typeError("not typed");
		}

		let enumType = controlVal.type.asDataType;

		if (!enumType) {
			throw this.controlExpr.typeError("not an enum");
		}

		let nEnumMembers = Common.countEnumMembers(enumType);

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && nEnumMembers > this.cases.length) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {null | Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalEnumMember(scope, enumType).asTyped;

			if (!branchVal) {
				throw c.typeError("not typed");
			}
	
			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope).asTyped;

			if (!defaultVal) {
				throw this.defaultCase.typeError("not typed");
			}

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site,
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			return new ErrorEntity();
		} else {
			return Common.toTyped(branchMultiType);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let cases = this.cases.slice();

		/** @type {SwitchCase | SwitchDefault} */
		let last;
		if (this.defaultCase !== null) {
			last = this.defaultCase;
		} else {
			last = assertDefined(cases.pop());
		}

		let n = cases.length;

		let res = last.toIR(indent + TAB + TAB + TAB);

		for (let i = n - 1; i >= 0; i--) {
			res = new IR([
				new IR(`__core__ifThenElse(__core__equalsInteger(i, ${cases[i].constrIndex.toString()}), () -> {`),
				cases[i].toIR(indent + TAB + TAB + TAB),
				new IR(`}, () -> {`),
				res,
				new IR(`})()`)
			]);
		}

		return new IR([
			new IR(`(e) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}(\n${indent}${TAB}${TAB}(i) -> {\n${indent}${TAB}${TAB}${TAB}`),
			res,
			new IR(`\n${indent}${TAB}${TAB}}(__core__fstPair(__core__unConstrData(e)))\n${indent}${TAB})(e)\n${indent}}(`),
			this.controlExpr.toIR(indent),
			new IR(")"),
		]);
	}
}

/**
 * Switch expression for Data
 * @package
 */
class DataSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope).asTyped;
		if (!controlVal) {
			throw this.controlExpr.typeError("not typed");
		}

		let dataType = controlVal.type.asDataType;
		if (!dataType) {
			throw this.controlExpr.typeError("not a data type");
		}

		if (!RawDataType.isBaseOf(dataType)) {
			throw this.controlExpr.typeError(`expected Data type, got ${controlVal.type.toString()}`);
		}

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && this.cases.length < 5) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalDataMember(scope).asTyped;
			if (!branchVal) {
				throw c.typeError("not typed");
			}

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope).asTyped;
			if (!defaultVal) {
				throw this.defaultCase.typeError("not typed");
			}

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site, 
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			// only possible if each branch is an error
			return new ErrorEntity();
		} else {
			return Common.toTyped(branchMultiType);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		/** @type {[?IR, ?IR, ?IR, ?IR, ?IR]} */
		let cases = [null, null, null, null, null]; // constr, map, list, int, byteArray

		for (let c of this.cases) {
			let ir = c.toIR(indent + TAB + TAB);

			switch (c.memberName.value) {
				case "ByteArray":
					cases[4] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__helios__bytearray__from_data"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "Int":
					cases[3] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__helios__int__from_data"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "[]Data":
					cases[2] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__code__unListData"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "Map[Data]Data":
					cases[1] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__code__unMapData"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "(Int, []Data)":
					// conversion from_data is handled by UnconstrDataSwitchCase
					cases[0] = ir;
					break;
				default:
					if (cases[0] !== null) {
						throw new Error("should've been caught before");
					}

					cases[0] = ir;
			}
		}

		if (this.defaultCase !== null) {
			for (let i = 0; i < 5; i++) {
				if (cases[i] === null) {
					cases[i] = new IR(`${indent}${TAB}def`);
				}
			}
		}

		let res = new IR([
			new IR(`${indent}__core__chooseData(e, `, this.site),
			new IR(cases.map(c => assertDefined(c))).join(", "),
			new IR(`${indent})`)
		]);

		if (this.defaultCase !== null) {
			res = new IR([
				new IR(`${indent}(def) -> {\n`),
				res,
				new IR(`\n${indent}}(`),
				this.defaultCase.toIR(indent),
				new IR(`)`)
			]);
		}

		res = new IR([
			new IR(`${indent}(e) -> {\n`),
			res,
			new IR("(e)"),
			new IR(`${indent}}(`),
			this.controlExpr.toIR(indent),
			new IR(")")
		]);

		return res;
	}
}


////////////////////////////////////
// Section 24: Helios AST statements
////////////////////////////////////

/**
 * Base class for all statements
 * Doesn't return a value upon calling eval(scope)
 * @package
 */
class Statement extends Token {
	#name;
	#basePath; // set by the parent Module

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 */
	constructor(site, name) {
		super(site);
		this.#name = name;
		this.#basePath = "__user";
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return `${this.#basePath}__${this.name.toString()}`;
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		this.#basePath = basePath;
	}

	/**
	 * Returns IR of statement.
	 * No need to specify indent here, because all statements are top-level
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}
}

/**
 * Each field in `import {...} from <ModuleName>` is given a separate ImportFromStatement
 * @package
 */
class ImportFromStatement extends Statement {
	#origName;
	#moduleName;

	/**
	 * @param {Site} site 
	 * @param {Word} name
	 * @param {Word} origName
	 * @param {Word} moduleName
	 */
	constructor(site, name, origName, moduleName) {
		super(site, name);
		this.#origName = origName;
		this.#moduleName = moduleName;
	}

	/**
	 * @type {Word}
	 */
	get moduleName() {
		return this.#moduleName;
	}

	/**
	 * @param {ModuleScope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let importedScope = scope.getScope(this.#moduleName);

		let importedEntity = importedScope.get(this.#origName);

		if (importedEntity instanceof Scope) {
			throw this.#origName.typeError(`can't import a module from a module`);
		} else {
			return importedEntity;
		}
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		const v = this.evalInternal(scope);

		scope.set(this.name, v);
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		// import statements only have a scoping function and don't do anything to the IR
	}
}

/**
 * `import <ModuleName>`
 * @package
 */
class ImportModuleStatement extends Statement {
	/**
	 * @type {Map<string, EvalEntity>}
	 */
	#imported;

	/**
	 * @param {Site} site 
	 * @param {Word} moduleName
	 */
	constructor(site, moduleName) {
		super(site, moduleName);
		this.#imported = new Map();
	}

	/**
	 * @type {Word}
	 */
	get moduleName() {
		return this.name;
	}

	/**
	 * @param {ModuleScope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let importedScope = scope.getScope(this.name);
		
		/**
		 * @type {NamespaceMembers}
		 */
		const namespaceMembers = {};

		for (let [name, entity] of importedScope.values) {
			if (!(entity instanceof Scope)) {
				namespaceMembers[name.value] = entity;
			}
		}

		return new ModuleNamespace(namespaceMembers);
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		let v = this.evalInternal(scope);

		scope.set(this.name, v);
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		// import statements only have a scoping function and don't do anything to the IR
	}
}

/**
 * Const value statement
 * @package
 */
class ConstStatement extends Statement {
	/**
	 * @type {Expr}
	 */
	#typeExpr;

	/**
	 * @type {null | Expr}
	 */
	#valueExpr;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {Expr} typeExpr - can be null in case of type inference
	 * @param {null | Expr} valueExpr 
	 */
	constructor(site, name, typeExpr, valueExpr) {
		super(site, name);
		this.#typeExpr = typeExpr;
		this.#valueExpr = valueExpr;
	}

	/**
	 * @type {DataType}
	 */
	get type() {
		return assertDefined(this.#typeExpr.cache?.asDataType, this.#typeExpr.cache?.toString() ?? this.#typeExpr.toString());
	}

	/**
	 * Include __const prefix in path so that mutual recursion injection isn't applied
	 * @type {string}
	 */
	get path() {
		return `__const${super.path}`;
	}

	/**
	 * @returns {boolean}
	 */
	isSet() {
		return this.#valueExpr !== null;
	}

	/**
	 * Use this to change a value of something that is already typechecked.
	 * @param {UplcData} data
	 */
	changeValueSafe(data) {
		const type = this.type;
		const site = this.#valueExpr ? this.#valueExpr.site : this.site;

		this.#valueExpr = new LiteralDataExpr(site, type, data);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `const ${this.name.toString()}${this.#typeExpr.toString()}${this.#valueExpr ? ` = ${this.#valueExpr.toString()}` : ""};`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {DataType}
	 */
	evalType(scope) {
		return this.#typeExpr.evalAsDataType(scope);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const type = this.#typeExpr.evalAsDataType(scope);

		if (this.#valueExpr) {
			const value = this.#valueExpr.evalAsTyped(scope);

			if (!type.isBaseOf(value.type)) {
				throw this.#valueExpr.typeError("wrong type");
			}
		}

		return new DataEntity(type);
	}

	/**
	 * Evaluates rhs and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		scope.set(this.name, new NamedEntity(this.name.value, this.path, this.evalInternal(scope)));
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		callback(`${namespace}${this.name.value}`, this);
	}

	/**
	 * @returns {IR}
	 */
	toIRInternal() {
		let ir = assertDefined(this.#valueExpr).toIR();

		if (this.#valueExpr instanceof LiteralDataExpr) {
			ir = new IR([
				new IR(`${this.#valueExpr.type.path}__from_data`),
				new IR("("),
				ir,
				new IR(")")
			]);
		}

		return new IR([
			new IR("const(", this.site),
			ir,
			new IR(")")
		]);
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		if (this.#valueExpr) {
			map.set(this.path, this.toIRInternal());
		}
	}
}


/**
 * @package
 */
class TypeParameter {
	#name;
	#typeClassExpr;

	/**
	 * @param {Word} name 
	 * @param {null | Expr} typeClassExpr 
	 */
	constructor(name, typeClassExpr) {
		this.#name = name;
		this.#typeClassExpr = typeClassExpr;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.value;
	}

	/**
	 * @type {TypeClass}
	 */
	get typeClass() {
		if (this.#typeClassExpr) {
			return assertDefined(this.#typeClassExpr.cache?.asTypeClass);
		} else {
			return new DefaultTypeClass();
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {string} path
	 */
	eval(scope, path) {
		const typeClass = this.#typeClassExpr ? this.#typeClassExpr.eval(scope).asTypeClass : new DefaultTypeClass();
		if (!typeClass ) {
			throw this.#typeClassExpr?.typeError("not a typeclass");
		}

		scope.set(this.#name, typeClass.toType(this.#name.value, path));
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#typeClassExpr) {
			return `${this.#name}: ${this.#typeClassExpr.toString()}`;
		} else {
			return `${this.#name}`;
		}
	}
}

/**
 * @package
 */
class TypeParameters {
	#parameters;
	#prefix;

	/**
	 * @param {TypeParameter[]} parameters 
	 * @param {boolean} isForFunc
	 */
	constructor(parameters, isForFunc) {
		this.#parameters = parameters;
		this.#prefix = isForFunc ? FTPP : TTPP;
	}

	hasParameters() {
		return this.#parameters.length > 0;
	}

	/**
	 * @returns {Parameter[]}
	 */
	getParameters() {
		return this.#parameters.map((p, i) => new Parameter(p.name, `${this.#prefix}${i}`, p.typeClass));
	}

	/**
	 * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
	 * @param {string} base
	 * @returns {string}
	 */
	genTypePath(base) {
		return `${base}[${this.#parameters.map((_, i) => `${this.#prefix}${i}`).join("@")}]`;
	}

	/**
	 * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
	 * @param {string} base
	 * @returns {string}
	 */
	genFuncPath(base) {
		if (this.hasParameters()) {
			return this.genTypePath(base);
		} else {
			return base;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (!this.hasParameters) {
			return "";
		} else {
			return `[${this.#parameters.map(p => p.toString()).join(", ")}]`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Scope}
	 */
	evalParams(scope) {
		const subScope = new Scope(scope);

		this.#parameters.forEach((p, i) => p.eval(subScope, `${this.#prefix}${i}`));

		return subScope;
	}

	/**
	 * @param {Scope} scope 
	 * @param {(scope: Scope) => FuncType} evalConcrete
	 * @returns {ParametricFunc | FuncType}
	 */
	evalParametricFuncType(scope, evalConcrete, impl = null) {
		const typeScope = this.evalParams(scope);

		const type = evalConcrete(typeScope);

		typeScope.assertAllUsed();

		return this.hasParameters() ? new ParametricFunc(this.getParameters(), type) : type;
	}

	/**
	 * @param {Scope} scope 
	 * @param {(scope: Scope) => FuncType} evalConcrete 
	 * @returns {EvalEntity}
	 */
	evalParametricFunc(scope, evalConcrete) {
		const type = this.evalParametricFuncType(scope, evalConcrete);

		if (type.asType) {
			return type.asType.toTyped();
		} else {
			return type;
		}
	}

	/**
	 * @param {Scope} scope
	 * @param {Site} site
	 * @param {(scope: Scope) => DataType} evalConcrete
	 * @returns {[DataType | ParametricType, Scope]}
	 */
	createParametricType(scope, site, evalConcrete) {
		const typeScope = this.evalParams(scope);

		const type = evalConcrete(new Scope(typeScope));

		if (!this.hasParameters()) {
			return [type, typeScope];
		} else {
			const paramType = new ParametricType({
				name: type.name,
				parameters: this.getParameters(),
				apply: (paramTypes) => {
					/**
					 * @type {Map<string, Type>}
					 */
					const map = new Map();

					paramTypes.forEach((pt, i) => {
						const name = this.getParameters()[i].name;

						map.set(name, pt);
					});

					const appliedType = assertDefined(type.infer(site, map, null).asDataType);

					const appliedPath = IRParametricName.parse(type.path, true).toImplementation(paramTypes.map(pt => assertDefined(pt.asDataType).path)).toString();

					if (appliedType instanceof GenericType) {
						return appliedType.changeNameAndPath(
							`${type.name}[${paramTypes.map(pt => pt.toString()).join(",")}]`,
							appliedPath
						);
					} else {
						throw new Error("unexpected");
					}
				}
			});

			return [paramType, typeScope];
		}
	}
}

/**
 * Single field in struct or enum member
 * @package
 */
class DataField extends NameTypePair {
	/**
	 * @param {Word} name 
	 * @param {Expr} typeExpr 
	 */
	constructor(name, typeExpr) {
		super(name, typeExpr);
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {DataType}
	 */
	get type() {
		return assertDefined(super.type.asDataType);
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {DataType}
	 */
	eval(scope) {
		if (this.typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			const t = this.typeExpr.eval(scope);

			if (t.asDataType) {
				return t.asDataType;
			} else {
				throw this.typeExpr.typeError(`'${t.toString()}' isn't a valid data field type`);
			}
		}
	}
}

/**
 * Base class for struct and enum member
 * @package
 */
class DataDefinition {
	#site;
	#name;
	#fields;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {DataField[]} fields 
	 */
	constructor(site, name, fields) {
		this.#site = site;
		this.#name = name;
		this.#fields = fields;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {DataField[]}
	 */
	get fields() {
		return this.#fields.slice();
	}

	/**
	 * Returns index of a field.
	 * Returns -1 if not found.
	 * @param {Word} name 
	 * @returns {number}
	 */
	findField(name) {
		let found = -1;
		let i = 0;
		for (let f of this.#fields) {
			if (f.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	/**
	 * @type {string[]}
	 */
	get fieldNames() {
		return this.#fields.map(f => f.name.value);
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	hasField(name) {
		return this.findField(name) != -1;
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	hasMember(name) {
		return this.hasField(name) || name.value == "copy";
	}

	/**
	 * @returns {string}
	 */
	toStringFields() {
		return `{${this.#fields.map(f => f.toString()).join(", ")}}`;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.name.toString()} ${this.toStringFields()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {InstanceMembers}
	 */
	evalFieldTypes(scope) {
		/**
		 * @type {InstanceMembers}
		 */
		const fields = {};

		for (let f of this.#fields) {
			fields[f.name.value]= f.eval(scope);
		}

		return fields;
	}

	/**
	 * @param {Type} self
	 * @returns {Type}
	 */
	genCopyType(self) {
		return new FuncType(this.#fields.map(f => new ArgType(f.name, f.type, true)), self);
	}

	/**
	 * @type {number}
	 */
	get nFields() {
		return this.#fields.length;
	}

	/**
	 * @param {number} i 
	 * @returns {DataType}
	 */
	getFieldType(i) {
		return this.#fields[i].type;
	}

	/**
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(name) {
		const i = this.findField(new Word(Site.dummy(), name));

		if (i == -1) {
			throw new Error(`field ${name} not find in ${this.toString()}`);
		} else {
			return i;
		}
	}

	/**
	 * @param {number} i
	 * @returns {string}
	 */
	getFieldName(i) {
		return this.#fields[i].name.toString();
	}

	/**
	 * Gets insance member value.
	 * @param {Type} self
	 * @returns {InstanceMembers}
	 */
	genInstanceMembers(self) {
		const members = {
			...genCommonInstanceMembers(self),
			copy: new FuncType(this.#fields.map(f => new ArgType(f.name, f.type, true)), self),
		};

		for (let f of this.fields) {
			members[f.name.value] = f.type;
		}

		return members;
	}

	/**
	 * @param {Type} self
	 * @returns {TypeMembers}
	 */
	genTypeMembers(self) {
		return {
			...genCommonTypeMembers(self)
		};
	}

	/**
	 * @param {string} path
	 * @param {IRDefinitions} map 
	 * @param {number} constrIndex
	 */
	newToIR(path, map, constrIndex) {
		const isConstr = constrIndex != -1;

		/**
		 * @type {IR}
		 */
		let ir;

		if (this.nFields == 1) {
			if (isConstr) {
				ir = new IR(`(self) -> {
					__core__constrData(${constrIndex}, __helios__common__list_1(${this.getFieldType(0).path}____to_data(self)))
				}`, this.site);
			} else {
				ir = new IR("__helios__common__identity");
		}
		} else {
			ir = new IR([
				new IR("__core__mkNilData"),
				new IR("(())")
			]);

			for (let i = this.nFields - 1; i >= 0; i--) {
				const f = this.#fields[i];

				ir = new IR([
					new IR("__core__mkCons"),
					new IR("("), new IR(`${f.type.path}____to_data`), new IR("("), new IR(f.name.value), new IR("), "),
					ir,
					new IR(")")
				]);
			}

			if (isConstr) {
				ir = new IR([
					new IR("__core__constrData"),
					new IR("("),
					new IR(constrIndex.toString()),
					new IR(", "),
					ir,
					new IR(")")
				]);
			}

			// wrap as function
			ir = new IR([
				new IR("("),
				new IR(this.#fields.map(f => new IR(f.name.value))).join(", "),
				new IR(") -> {"),
				ir,
				new IR("}")
			]);
		}

		const key = `${path}____new`;

		map.set(key, ir);
	}

	/**
	 * @package
	 * @param {string} path
	 * @param {IRDefinitions} map 
	 * @param {string[]} getterNames
	 * @param {number} constrIndex
	 */
	copyToIR(path, map, getterNames, constrIndex = -1) {
		const key = `${path}__copy`;

		let ir = StructLiteralExpr.toIRInternal(this.site, path, this.#fields.map(df => new IR(df.name.value)));

		// wrap with defaults

		for (let i = getterNames.length - 1; i >= 0; i--) {
			const fieldName = this.#fields[i].name.toString();

			ir = FuncArg.wrapWithDefaultInternal(ir, fieldName, new IR([
				new IR(getterNames[i]),
				new IR("(self)")
			]))
		}

		ir = new IR([
			new IR("("), new IR("self"), new IR(") -> {"),
			new IR("("),
			new IR(this.#fields.map(f => new IR([
				new IR(`__useopt__${f.name.toString()}`),
				new IR(", "),
				new IR(`${f.name.toString()}`)
			]))).join(", "),
			new IR(") -> {"),
			ir,
			new IR("}"),
			new IR("}")
		]);

		map.set(key, ir);
	}

	/**
	 * Doesn't return anything, but sets its IRdef in the map
	 * @param {string} path
	 * @param {IRDefinitions} map
	 * @param {number} constrIndex
	 */
	toIR(path, map, constrIndex) {
		const isConstr = constrIndex != -1;

		const getterBaseName = isConstr ? "__helios__common__field" : "__helios__common__tuple_field";

		/**
		 * @type {string[]}
		 */
		const getterNames = [];

		if (this.fields.length == 1 && !isConstr) {
			const f = this.fields[0];
			const key = `${path}__${f.name.value}`;

			const getter =  new IR("__helios__common__identity", f.site);
			
			map.set(key, getter);

			getterNames.push(key);
		} else {
			// add a getter for each field
			for (let i = 0; i < this.#fields.length; i++) {
				let f = this.#fields[i];
				let key = `${path}__${f.name.value}`;
				getterNames.push(key);

				/**
				 * @type {IR}
				 */
				let getter;

				if (i < 20) {
					getter = new IR(`${getterBaseName}_${i}`, f.site);

					getter = new IR([
						new IR("("), new IR("self"), new IR(") "), 
						new IR("->", f.site), 
						new IR(" {"), 
						new IR(`${f.type.path}__from_data`), new IR("("),
						new IR(`${getterBaseName}_${i}`), new IR("("), new IR("self"), new IR(")"),
						new IR(")"),
						new IR("}"),
					]);
				} else {
					let inner = new IR("self");

					if (isConstr) {
						inner = new IR([
							new IR("__core__sndPair"),
							new IR("("),
							new IR("__core__unConstrData"), new IR("("), inner, new IR(")"),
							new IR(")")
						]);
					}

					for (let j = 0; j < i; j++) {
						inner = new IR([
							new IR("__core__tailList"), new IR("("), inner, new IR(")")
						]);
					}

					inner = new IR([
						new IR("__core__headList"), new IR("("), inner, new IR(")")
					]);

					inner = new IR([
						new IR(`${f.type.path}__from_data`), new IR("("), inner, new IR(")")
					]);

					getter = new IR([
						new IR("("), new IR("self"), new IR(") "), 
						new IR("->", f.site), 
						new IR(" {"),
						inner,
						new IR("}"),
					]);
				}

				map.set(key, getter)
			}
		}

		this.newToIR(path, map, constrIndex);
		this.copyToIR(path, map, getterNames);
	}
}

/**
 * Struct statement
 * @package
 */
class StructStatement extends Statement {
	#parameters;
	#dataDef;
	#impl;

	/**
	 * @param {Site} site
	 * @param {Word} name
	 * @param {TypeParameters} parameters
	 * @param {DataField[]} fields 
	 * @param {ImplDefinition} impl
	 */
	constructor(site, name, parameters, fields, impl) {
		super(site, name);

		this.#parameters = parameters;
		this.#dataDef = new DataDefinition(this.site, name, fields);
		this.#impl = impl;
	}

	get path() {
		return this.#parameters.genTypePath(super.path);
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		super.setBasePath(basePath);

		this.#impl.setBasePath(this.path);
	}

	/**
	 * @returns {HeliosDataClass<HeliosData>}
	 */
	genOffChainType() {
		const statement = this;

		class Struct extends HeliosData {
			/**
			 * So we can access fields by index
			 * @type {HeliosData[]}
			 */
			#fields;

			/**
			 * @param  {...any} args
			 */
			constructor(...args) {
				super();
				if (args.length != statement.#dataDef.nFields) {
					throw new Error(`expected ${statement.#dataDef.nFields} args, got ${args.length}`);
				}

				this.#fields = [];

				args.forEach((arg, i) => {
					const fieldName = statement.#dataDef.getFieldName(i);
					const fieldType = statement.#dataDef.getFieldType(i);

					if (!fieldType.offChainType) {
						throw new Error(`offChainType for ${fieldType.name} not yet implemented`);
					}

					const FieldClass = fieldType.offChainType;

					const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

					this.#fields.push(instance);
					this[fieldName] = instance;
				});
			}

			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._structStatement === statement) && (other instanceof HeliosData);
			}

			/**
			 * @type {StructStatement}
			 */
			get _structStatement() {
				return statement;
			}

			/**
			 * @returns {UplcData}
			 */
			_toUplcData() {
				if (this.#fields.length == 1) {
					return this.#fields[0]._toUplcData();
				} else {
					return new ListData(this.#fields.map(f => f._toUplcData()));
				}
			}

			/**
			 * @param {string | number[]} bytes 
			 * @returns {Struct}
			 */
			static fromUplcCbor(bytes) {
				return Struct.fromUplcData(UplcData.fromCbor(bytes));
			}

			/**
			 * @param {UplcData} data 
			 * @returns {Struct}
			 */
			static fromUplcData(data) {
				const dataItems = data.list;

				if (dataItems.length != statement.#dataDef.nFields) {
					throw new Error("unexpected number of fields");
				}

				const args = dataItems.map((item, i) => {
					return assertDefined(statement.#dataDef.getFieldType(i).offChainType).fromUplcData(item);
				});

				return new Struct(...args);
			}
		}

		Object.defineProperty(Struct, "name", {value: this.name, writable: false});		

		return Struct;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `struct ${this.name.toString()}${this.#parameters.toString()} ${this.#dataDef.toStringFields()}`;
	}

	/**
	 * Evaluates own type and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		const [type, typeScope] = this.#parameters.createParametricType(scope, this.site, (typeScope) => {
			return new GenericType({
				fieldNames: this.#dataDef.fieldNames,
				name: this.name.value,
				path: this.path, // includes template parameters
				genOffChainType: () => this.genOffChainType(),
				genInstanceMembers: (self) => ({
					...genCommonInstanceMembers(self),
					...this.#dataDef.evalFieldTypes(typeScope),
					...this.#impl.genInstanceMembers(typeScope),
					copy: this.#dataDef.genCopyType(self)
				}),
				genTypeMembers: (self) => ({
					...genCommonTypeMembers(self),
					...this.#impl.genTypeMembers(typeScope)
				})
			});
		});

		const path = this.#parameters.hasParameters() ? super.path : this.path;
		
		scope.set(this.name, new NamedEntity(this.name.value, path, type));

		void this.#dataDef.evalFieldTypes(typeScope);

		typeScope.assertAllUsed();

		this.#impl.eval(typeScope);
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		this.#impl.loopConstStatements(`${namespace}${this.name.value}::`, callback);
	}

	/**
	 * @param {IRDefinitions} map
	 */
	toIR(map) {
		const implPath = this.#dataDef.fieldNames.length == 1 ? this.#dataDef.getFieldType(0).path : "__helios__tuple";

		map.set(`${this.path}____eq`, new IR(`${implPath}____eq`, this.site));
		map.set(`${this.path}____neq`, new IR(`${implPath}____neq`, this.site));
		map.set(`${this.path}__serialize`, new IR(`${implPath}__serialize`, this.site));
		map.set(`${this.path}__from_data`, new IR(`${implPath}__from_data`, this.site));
		map.set(`${this.path}____to_data`, new IR(`${implPath}____to_data`, this.site));

		// super.toIR adds __new and copy, which might depend on __to_data, so must come after
		this.#dataDef.toIR(this.path, map, -1);

		this.#impl.toIR(map);
	}
}

/**
 * Function statement
 * (basically just a named FuncLiteralExpr)
 * @package
 */
class FuncStatement extends Statement {
	#parameters;
	#funcExpr;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {TypeParameters} parameters
	 * @param {FuncLiteralExpr} funcExpr 
	 */
	constructor(site, name, parameters, funcExpr) {
		super(site, name);
		this.#parameters = parameters;
		this.#funcExpr = funcExpr;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return this.#parameters.genFuncPath(super.path,);
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#funcExpr.argTypes;
	}

	/**
	 * @type {string[]}
	 */
	get argTypeNames() {
		return this.#funcExpr.argTypeNames;
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#funcExpr.retTypes;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `func ${this.name.toString()}${this.#parameters.toString()}${this.#funcExpr.toString()}`;
	}

	/**
	 * Evaluates a function and returns a func value
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const typed = this.#parameters.evalParametricFunc(scope, (subScope) => {
			const type = this.#funcExpr.evalType(subScope);

			const implScope = new Scope(subScope);

			// recursive calls expect func value, not func type
			implScope.set(this.name, new NamedEntity(this.name.value, super.path, type.toTyped()));

			
			void this.#funcExpr.evalInternal(implScope);

			return type;
		});

		return typed;
	}

	/**
	 * Evaluates type of a funtion.
	 * Separate from evalInternal so we can use this function recursively inside evalInternal
	 * @param {Scope} scope 
	 * @returns {ParametricFunc | FuncType}
	 */
	evalType(scope) {
		return this.#parameters.evalParametricFuncType(scope, (subScope) => {
			return this.#funcExpr.evalType(subScope);
		});
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		const typed = this.evalInternal(scope);

		assert(!typed.asType);

		scope.set(this.name, new NamedEntity(this.name.value, super.path, typed));
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * Returns IR of function
	 * @returns {IR}
	 */
	toIRInternal() {
		return this.#funcExpr.toIR(TAB);
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		map.set(this.path, this.toIRInternal());
	}

	/**
	 * @param {Statement} s 
	 * @returns {boolean}
	 */
	static isMethod(s) {
		if (s instanceof FuncStatement) {
			return s.#funcExpr.isMethod();
		} else {
			return false;
		}
	}
}

/**
 * EnumMember defintion is similar to a struct definition
 * @package
 */
class EnumMember {
	/** @type {null | EnumStatement} */
	#parent;

	/** @type {?number} */
	#constrIndex;

	#dataDef;

	/**
	 * @param {Word} name
	 * @param {DataField[]} fields
	 */
	constructor(name, fields) {
		this.#parent = null; // registered later
		this.#constrIndex = null;
		this.#dataDef = new DataDefinition(name.site, name, fields);
	}

	/**
	 * @returns {number}
	 */
	get constrIndex() {
		if (this.#constrIndex === null) {
			throw new Error("constrIndex not set");
		} else {
			return this.#constrIndex;
		}
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#dataDef.name;
	}

	/** 
	 * @param {EnumStatement} parent
	 * @param {number} i
	*/
	registerParent(parent, i) {
		this.#parent = parent;
		this.#constrIndex = i;
	}
	
	/**
	 * @type {EnumStatement}
	 */
	get parent() {
		if (this.#parent === null) {
			throw new Error("parent not yet registered");
		} else {
			return this.#parent;
		}
	}

	/**
	 * @returns {HeliosDataClass<HeliosData>}
	 */
	genOffChainType() {
		const statement = this;

		const enumStatement = statement.parent;

		const index = statement.constrIndex;

		const nFields = statement.#dataDef.nFields;

		/**
		 * @type {[string, DataType][]} - [name, type]
		 */
		const fields = [];

		for (let i = 0; i < nFields; i++) {
			fields.push([statement.#dataDef.getFieldName(i), statement.#dataDef.getFieldType(i)]);
		}

		// similar to Struct
		class EnumVariant extends HeliosData {
			/**
			 * So we can access fields by index
			 * @type {HeliosData[]}
			 */
			#fields;

			/**
			 * @param  {...any} args
			 */
			constructor(...args) {
				super();
				if (args.length != nFields) {
					throw new Error(`expected ${nFields} args, got ${args.length}`);
				}

				this.#fields = [];

				args.forEach((arg, i) => {
					const [fieldName, fieldType] = fields[i];
					const FieldClass = assertDefined(fieldType.offChainType);

					const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

					this.#fields.push(instance);
					this[fieldName] = instance;

				});
			}

			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._enumVariantStatement === statement) && (other instanceof HeliosData);
			}

			/**
			 * @type {EnumStatement}
			 */
			get _enumStatement() {
				return enumStatement;
			}

			/**
			 * @type {EnumMember}
			 */
			get _enumVariantStatement() {
				return statement;
			}

			/**
			 * @returns {UplcData}
			 */
			_toUplcData() {
				return new ConstrData(index, this.#fields.map(f => f._toUplcData()));
			}

			/**
			 * @param {string | number[]} bytes 
			 * @returns {EnumVariant}
			 */
			static fromUplcCbor(bytes) {
				return EnumVariant.fromUplcData(UplcData.fromCbor(bytes));
			}

			/**
			 * @param {UplcData} data 
			 * @returns {EnumVariant}
			 */
			static fromUplcData(data) {
				assert(data.index == index, "wrong index");

				const dataItems = data.list;

				if (dataItems.length != nFields) {
					throw new Error("unexpected number of fields");
				}

				const args = dataItems.map((item, i) => {
					return assertDefined(fields[i][1].offChainType).fromUplcData(item);
				});

				return new EnumVariant(...args);
			}
		}

		Object.defineProperty(EnumVariant, "name", {value: this.#dataDef.name, writable: false});

		return EnumVariant;

	}

	/**
	 * @param {Scope} scope 
	 */
	evalDataFields(scope) {
		this.#dataDef.evalFieldTypes(scope);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {(parent: DataType) => EnumMemberType}
	 */
	evalType(scope) {
		if (this.#parent === null) {
			throw new Error("parent should've been registered");
		}

		return (parent) => {
			const path = `${parent.path}__${this.#dataDef.name.value}`; 

			return new GenericEnumMemberType({
				name: this.#dataDef.name.value,
				path: path, 
				constrIndex: this.constrIndex,
				genOffChainType: () => this.genOffChainType(),
				parentType: parent,
				fieldNames: this.#dataDef.fieldNames,
				genInstanceMembers: (self) => {
					const res = {
						...genCommonInstanceMembers(self),
						...this.#dataDef.evalFieldTypes(scope),
						copy: this.#dataDef.genCopyType(self)
					}

					return res;
				},
				genTypeMembers: (self) => ({
					...genCommonEnumTypeMembers(self, parent),
				})
			})
		};
	}

	get path() {
		return `${this.parent.path}__${this.#dataDef.name.toString()}`;
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		map.set(`${this.path}____eq`, new IR("__helios__common____eq", this.#dataDef.site));
		map.set(`${this.path}____neq`, new IR("__helios__common____neq", this.#dataDef.site));
		map.set(`${this.path}__serialize`, new IR("__helios__common__serialize", this.#dataDef.site));
		map.set(`${this.path}__from_data`, new IR(`(data) -> {
			__helios__common__assert_constr_index(data, ${this.constrIndex})
		}`, this.#dataDef.site));
		map.set(`${this.path}____to_data`, new IR("__helios__common__identity", this.#dataDef.site));

		// super.toIR adds __new and copy, which might depend on __to_data, so must come after
		this.#dataDef.toIR(this.path, map, this.constrIndex);
	}
}

/**
 * Enum statement, containing at least one member
 * @package
 */
class EnumStatement extends Statement {
	#parameters;
	#members;
	#impl;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {TypeParameters} parameters
	 * @param {EnumMember[]} members 
	 * @param {ImplDefinition} impl
	 */
	constructor(site, name, parameters, members, impl) {
		super(site, name);
		this.#parameters = parameters;
		this.#members = members;
		this.#impl = impl;
		
		for (let i = 0; i < this.#members.length; i++) {
			this.#members[i].registerParent(this, i);
		}
	}

	/**
	 * @type {string}
	 */
	get path() {
		return this.#parameters.genTypePath(super.path);
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		super.setBasePath(basePath);

		this.#impl.setBasePath(this.path);
	}

	/**
	 * @package
	 * @returns {HeliosDataClass<HeliosData>}
	 */
	genOffChainType() {
		const statement = this;

		const nVariants = statement.nEnumMembers;

		/**
		 * @type {HeliosDataClass<HeliosData>[]}
		 */
		const variants = [];

		for (let i = 0; i < nVariants; i++) {
			variants.push(this.#members[i].genOffChainType());
		}

		class Enum extends HeliosData {
			constructor() {
				super();
				throw new Error("can't be constructed (hint: construct an enum)");
			}

			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._enumStatement === statement) && (other instanceof HeliosData);
			}

			/**
			 * @type {EnumStatement}
			 */
			get _enumStatement() {
				return statement;
			}

			/**
			 * @param {string | number[]} bytes
			 * @returns {HeliosData}
			 */
			static fromUplcCbor(bytes) {
				return Enum.fromUplcData(UplcData.fromCbor(bytes));
			}

			/**
			 * @param {UplcData} data 
			 * @returns {HeliosData}
			 */
			static fromUplcData(data) {
				const variant = assertDefined(variants[data.index], "index out of range");

				return variant.fromUplcData(data);
			}
		}

		Object.defineProperty(Enum, "name", {value: this.name, writable: false});

		for (let v of variants) {
			Object.defineProperty(Enum, v.name, {value: v, writable: false});
		}

		return Enum;
	}

	/**
	 * Returns index of enum member.
	 * Returns -1 if not found
	 * @param {Word} name 
	 * @returns {number}
	 */
	// returns an index
	findEnumMember(name) {
		let found = -1;
		let i = 0;
		for (let member of this.#members) {
			if (member.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	/**
	 * @param {number} i
	 * @returns {EnumMember}
	 */
	getEnumMember(i) {
		return assertDefined(this.#members[i]);
	}

	/**
	 * @param {Word} name
	 * @returns {boolean}
	 */
	hasEnumMember(name) {
		return this.findEnumMember(name) != -1;
	}

	/**
	 * @returns {number}
	 */
	get nEnumMembers() {
		return this.#members.length;
	}

	/**
	 * @param {DataType} self 
	 * @returns {TypeMembers}
	 */
	genEnumMemberShellTypes(self) {
		/**
		 * @type {TypeMembers}
		 */
		const types = {};

		for (let member of this.#members) {
			types[member.name.value] = new GenericEnumMemberType({
				constrIndex: member.constrIndex,
				name: member.name.value,
				path: `${self.path}__${member.name.value}`,
				parentType: assertDefined(self.asDataType),
				genInstanceMembers: (self) => ({}),
				genTypeMembers: (self) => ({})
			});
		}

		return types
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		const [type, typeScope] = this.#parameters.createParametricType(scope, this.site, (typeScope) => {
			/**
			 * @type {{[name: string]: (parent: DataType) => EnumMemberType}}
			 */
			const genFullMembers = {};

			this.#members.forEach(m => {
				genFullMembers[m.name.value] = m.evalType(typeScope);
			});

			const type = new GenericType({
				name: this.name.value,
				path: this.path,
				genOffChainType: () => this.genOffChainType(),
				genInstanceMembers: (self) => ({
					...genCommonInstanceMembers(self),
					...this.#impl.genInstanceMembers(typeScope),
				}),
				genTypeMembers: (self) => {
					const typeMembers_ = {
						...genCommonTypeMembers(self),
						...this.#impl.genTypeMembers(typeScope)
					};
					
					// TODO: detect duplicates
					for (let memberName in genFullMembers) {
						typeMembers_[memberName] = genFullMembers[memberName](assertDefined(self.asDataType))
					}

					return typeMembers_
				}
			});

			return type;
		});

		// don't include type parameters in path (except empty), these are added by application statement
		const path = this.#parameters.hasParameters() ? super.path : this.path;
		
		scope.set(this.name, new NamedEntity(this.name.value, path, type));

		this.#members.forEach(m => {
			m.evalDataFields(typeScope);
		});

		typeScope.assertAllUsed();
		
		this.#impl.eval(typeScope);
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		this.#impl.loopConstStatements(`${namespace}${this.name.value}::`, callback);
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		map.set(`${this.path}____eq`, new IR("__helios__common____eq", this.site));
		map.set(`${this.path}____neq`, new IR("__helios__common____neq", this.site));
		map.set(`${this.path}__serialize`, new IR("__helios__common__serialize", this.site));
		map.set(`${this.path}__from_data`, new IR("__helios__common__identity", this.site));
		map.set(`${this.path}____to_data`, new IR("__helios__common__identity", this.site));

		// member __new and copy methods might depend on __to_data, so must be generated after
		for (let member of this.#members) {
			member.toIR(map);
		}

		this.#impl.toIR(map);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `enum ${this.name.toString()}${this.#parameters.toString()} {${this.#members.map(m => m.toString()).join(", ")}}`;
	}
}

/**
 * Impl statements, which add functions and constants to registry of user types (Struct, Enum Member and Enums)
 * @package
 */
class ImplDefinition {
	#selfTypeExpr;
	#statements;

	/**
	 * @param {Expr} selfTypeExpr;
	 * @param {(FuncStatement | ConstStatement)[]} statements 
	 */
	constructor(selfTypeExpr, statements) {
		this.#selfTypeExpr = selfTypeExpr;
		this.#statements = statements;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#selfTypeExpr.site;
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		for (let s of this.#statements) {
			s.setBasePath(basePath);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#statements.map(s => s.toString()).join("\n")}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {TypeMembers}
	 */
	genTypeMembers(scope) {
		/**
		 * @type {TypeMembers}
		 */
		const typeMembers = {};

		for (let s of this.#statements) {
			if (s instanceof ConstStatement) {
				typeMembers[s.name.value] = s.evalType(scope).toTyped();
			} else if (!FuncStatement.isMethod(s)) {
				typeMembers[s.name.value] = s.evalType(scope);
			}
		}

		return typeMembers;
	}

	/**
	 * Doesn't add the common types
	 * @param {Scope} scope 
	 * @returns {InstanceMembers}
	 */
	genInstanceMembers(scope) {
		/**
		 * @type {InstanceMembers}
		 */
		const instanceMembers = {};

		for (let s of this.#statements) {
			if (FuncStatement.isMethod(s)) {
				instanceMembers[s.name.value] = s.evalType(scope);
			}
		}

		return instanceMembers;
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		void this.#selfTypeExpr.eval(scope);

		for (let s of this.#statements) {
			void s.evalInternal(scope);
		}
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		for (let s of this.#statements) {
			s.loopConstStatements(namespace, callback);
		}
	}
	
	/**
	 * Returns IR of all impl members
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		for (let s of this.#statements) {
			s.toIR(map);
		}
	}
}


//////////////////////////////////
// Section 25: Helios AST building
//////////////////////////////////

const AUTOMATIC_METHODS = [
	"__eq",
	"__neq",
	"copy",
	"from_data",
	"serialize"
];

/**
 * @type {null | ((path: StringLiteral) => (string | null))}
 */
let importPathTranslator = null

/**
 * Used by VSCode plugin
 * @param {(path: StringLiteral) => (string | null)} fn 
 */
export function setImportPathTranslator(fn) {
	importPathTranslator = fn
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {Statement[]}
 */
function buildProgramStatements(ts) {
	/**
	 * @type {Statement[]}
	 */
	let statements = [];

	while (ts.length != 0) {
		const t = ts.shift()?.assertWord();

		if (!t) {
			continue;
		}

		const kw = t.value;

		/**
		 * @type {Statement | (Statement | null)[] | null}
		 */
		let s = null;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "struct") {
			s = buildStructStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts);
		} else if (kw == "enum") {
			s = buildEnumStatement(t.site, ts);
		} else if (kw == "import") {
			s = buildImportStatements(t.site, ts);
		} else {
			t.syntaxError(`invalid top-level keyword '${kw}'`);
		}

		if (s) {
			if (Array.isArray(s)) {
				for (let s_ of s) {
					if (s_) {
						statements.push(s_);
					}
				}
			} else {
				statements.push(s);
			}
		}
	}

	return statements;
}

/**
 * @package
 * @param {Token[]} ts
 * @param {null | number} expectedPurpose
 * @returns {[number, Word] | null} - [purpose, name] (ScriptPurpose is an integer)
 * @package
 */
function buildScriptPurpose(ts, expectedPurpose = null) {
	// need at least 2 tokens for the script purpose
	if (ts.length < 2) {

		if (ts.length == 0) {
			Site.dummy().syntaxError("invalid script purpose syntax");
		} else {
			ts[0].syntaxError("invalid script purpose syntax");
			ts.splice(0);
		}

		return null;
	}

	const purposeWord = ts.shift()?.assertWord();

	if (!purposeWord) {
		return null;
	}

	/**
	 * @type {number | null}
	 */
	let purpose = null;

	if (purposeWord.isWord("spending")) {
		purpose = ScriptPurpose.Spending;
	} else if (purposeWord.isWord("minting")) {
		purpose = ScriptPurpose.Minting;
	} else if (purposeWord.isWord("staking")) {
		purpose = ScriptPurpose.Staking;
	} else if (purposeWord.isWord("testing")) { // 'test' is not reserved as a keyword though
		purpose = ScriptPurpose.Testing;
	} else if (purposeWord.isWord("module")) {
		purpose = ScriptPurpose.Module;
	} else if (purposeWord.isKeyword()) {
		purposeWord.syntaxError(`script purpose missing`);

		ts.unshift(purposeWord);

		return null;
	} else {
		purposeWord.syntaxError(`unrecognized script purpose '${purposeWord.value}' (expected 'testing', 'spending', 'staking', 'minting' or 'module')`);
		purpose = -1;
	}

	if (expectedPurpose !== null && purpose !== null) {
		if (expectedPurpose != purpose) {
			purposeWord.syntaxError(`expected '${getPurposeName(purpose)}' script purpose`);
		}
	}

	const name = assertToken(ts.shift(), purposeWord.site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (name.value === "main") {
		name.syntaxError(`${purposeWord.value} script can't be named 'main'`);
	}

	return [purpose, name];
}

/**
 * Also used by VSCode plugin
 * @param {Token[]} ts 
 * @param {number | null} expectedPurpose 
 * @returns {[number | null, Word | null, Statement[], number]}
 */
export function buildScript(ts, expectedPurpose = null) {
	const first = ts[0];

	const purposeName = buildScriptPurpose(ts, expectedPurpose);

	const statements = buildProgramStatements(ts);

	let mainIdx = -1;

	const [purpose, name] = purposeName !== null ? purposeName : [null, null];

	if (purpose != ScriptPurpose.Module) {
		mainIdx = statements.findIndex(s => s.name.value === "main");

		if (mainIdx == -1) {
			if (name !== null) {
				first.site.merge(name.site).syntaxError("entrypoint 'main' not found");
			} else {
				first.site.syntaxError("entrypoint 'main' not found");
			}
		}
	}

	return [purpose, name, statements, mainIdx];
}

/**
 * Parses Helios quickly to extract the script purpose header.
 * Returns null if header is missing or incorrectly formed (instead of throwing an error)
 * @param {string} rawSrc 
 * @returns {?[string, string]} - [purpose, name]
 */
export function extractScriptPurposeAndName(rawSrc) {
	try {
		let src = new Source(rawSrc);

		let tokenizer = new Tokenizer(src);

		let gen = tokenizer.streamTokens();

		// Don't parse the whole script, just 'eat' 2 tokens: `<purpose> <name>`
		let ts = [];
		for (let i = 0; i < 2; i++) {
			let yielded = gen.next();
			if (yielded.done) {
				return null;
			}

			ts.push(yielded.value);
		}

		const purposeName = buildScriptPurpose(ts);

		src.throwErrors();

		if (purposeName !== null) {
			const [purpose, name] = purposeName;

			return [getPurposeName(purpose), name.value];
		} else {
			throw new Error("unexpected"); // should've been caught above by calling src.throwErrors()
		}
	} catch (e) {
		if (!(e instanceof UserError)) {
			throw e;
		} else {
			return null;
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {ConstStatement | null}
 */
function buildConstStatement(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("invalid syntax (expected name after 'const')");
		return null;
	}

	const name = assertToken(ts.shift(), site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (!(ts.length > 0 && ts[0].isSymbol(":"))) {
		site.merge(name.site).syntaxError(`expected type annotation after 'const ${name.value}'`);
		ts.splice(0);
		return null;
	}

	const colon = assertDefined(ts.shift());

	let equalsPos = SymbolToken.find(ts, "=");
	const statementEndPos = Word.find(ts, ["const", "func", "struct", "enum", "import"]);

	let typeEndPos = equalsPos;

	let hasRhs = false;

	if (equalsPos == -1 && statementEndPos == -1) {
		typeEndPos = ts.length;
	} else if (statementEndPos != -1 && (equalsPos == -1 || (equalsPos > statementEndPos))) {
		typeEndPos = statementEndPos;
	} else if (equalsPos == 0) {
		colon.site.merge(ts[0].site).syntaxError("expected type expression between ':' and '='");
		ts.shift();
		return null;
	} else {
		hasRhs = true;
	}

	let endSite = ts[typeEndPos-1].site;

	const typeExpr = buildTypeExpr(colon.site, ts.splice(0, typeEndPos));
	if (!typeExpr) {
		return null;
	}

	/**
	 * @type {null | Expr}
	 */
	let valueExpr = null;

	if (hasRhs) {
		const maybeEquals = ts.shift();

		if (maybeEquals === undefined) {
			site.merge(name.site).syntaxError("expected '=' after 'const'");
			ts.splice(0);
			return null;
		} else if (!maybeEquals.isSymbol("=")) {
			site.merge(maybeEquals.site).syntaxError("expected '=' after 'const'");
			return null;
		} else {
			const equals = maybeEquals.assertSymbol("=");

			if (!equals) {
				return null;
			}

			const nextStatementPos = Word.find(ts, ["const", "func", "struct", "enum", "import"]);

			const tsValue = nextStatementPos == -1 ? ts.splice(0) : ts.splice(0, nextStatementPos);

			if (tsValue.length == 0) {
				equals.syntaxError("expected expression after '='");
				return null;
			} else {
				endSite = tsValue[tsValue.length-1].site;

				valueExpr = buildValueExpr(tsValue);
			}
		}
	}

	return new ConstStatement(site.merge(endSite), name, typeExpr, valueExpr);
}

/**
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {RefExpr | null}
 */
function buildTypeClassExpr(site, ts) {
	const name = assertToken(ts.shift(), site, "expected word")?.assertWord()?.assertNotKeyword();
	if (!name) {
		return null;
	}

	return new RefExpr(name);
}

/**
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {null | TypeParameter}
 */
function buildTypeParameter(site, ts) {
	const name = assertToken(ts.shift(), site, "expected type parameter name")?.assertWord()?.assertNotKeyword() ?? null;
	if (!name) {
		return null;
	}

	const maybeColon = ts.shift();
	if (!maybeColon) {
		return new TypeParameter(name, null);
	}

	const colon = maybeColon.assertSymbol(":");
	if (!colon) {
		return null;
	}

	const typeClassExpr = buildTypeClassExpr(site, ts);
	if (!typeClassExpr) {
		return null;
	}

	if (ts.length > 0) {
		ts[0].syntaxError("unexpected token");
		return null;
	}

	return new TypeParameter(name, typeClassExpr);
}

/**
 * @param {Token[]} ts 
 * @param {boolean} isForFunc
 * @returns {TypeParameters}
 */
function buildTypeParameters(ts, isForFunc) {
	if (ts.length > 0 && ts[0].isGroup("[")) {
		const brackets = assertDefined(ts.shift()).assertGroup("[");

		if (brackets) {
			/**
			 * @type {TypeParameter[] | null}
			 */
			const params = reduceNull(brackets.fields.map(fts => {
				return buildTypeParameter(brackets.site, fts);
			}));

			if (params) {
				return new TypeParameters(params, isForFunc);
			}			
		}
	}

	return new TypeParameters([], isForFunc);
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {[Token[], Token[]]}
 */
function splitDataImpl(ts) {
	const implPos = Word.find(ts, ["const", "func"]);

	if (implPos == -1) {
		return [ts, []];
	} else {
		return [ts.slice(0, implPos), ts.slice(implPos)];
	}
}


/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {StructStatement | null}
 */
function buildStructStatement(site, ts) {
	const maybeName = assertToken(ts.shift(), site, "expected name after 'struct'");
	if (!maybeName) {
		return null;
	}

	const name = maybeName.assertWord()?.assertNotKeyword();
	if (!name) {
		return null;
	}

	const parameters = buildTypeParameters(ts, false);

	const maybeBraces = assertToken(ts.shift(), name.site, `expected '{...}' after 'struct ${name.toString()}'`);
	if (!maybeBraces) {
		return null;
	}

	if (!maybeBraces.isGroup("{", 1)) {
		maybeBraces.syntaxError("expected non-empty '{..}' without separators");
		return null;
	}

	const braces = maybeBraces.assertGroup("{", 1);

	if (!braces) {
		return null;
	}

	const [tsFields, tsImpl] = splitDataImpl(braces.fields[0]);

	const fields = buildDataFields(tsFields);

	/**
	 * @type {Expr}
	 */
	let selfTypeExpr = new RefExpr(name);

	if (parameters.hasParameters()) {
		selfTypeExpr = new ParametricExpr(
			selfTypeExpr.site, 
			selfTypeExpr,
			parameters.getParameters().map(p => new RefExpr(new Word(selfTypeExpr.site, p.name)))
		)
	}

	const impl = buildImplDefinition(tsImpl, selfTypeExpr, fields.map(f => f.name), braces.site.endSite);

	if (impl === null) {
		return null;
	} else {
		return new StructStatement(site.merge(braces.site), name, parameters, fields, impl);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {DataField[]}
 */
function buildDataFields(ts) {
	/** @type {DataField[]} */
	const fields = []

	/**
	 * @param {Word} fieldName
	 */
	function assertUnique(fieldName) {
		if (fields.findIndex(f => f.name.toString() == fieldName.toString()) != -1) {
			fieldName.typeError(`duplicate field \'${fieldName.toString()}\'`);
		}
	}

	while (ts.length > 0) {
		const colonPos = SymbolToken.find(ts, ":");

		if (colonPos == -1) {
			ts[0].site.merge(ts[ts.length-1].site).syntaxError("expected ':' in data field");
			return fields;
		}

		const colon = ts[colonPos];
		const tsBef = ts.slice(0, colonPos);
		const tsAft = ts.slice(colonPos+1);
		const maybeFieldName = tsBef.shift();
		if (maybeFieldName === undefined) {
			colon.syntaxError("expected word before ':'");
			continue;
		} else {
			const fieldName = maybeFieldName?.assertWord()?.assertNotKeyword();

			if (!fieldName) {
				return fields;
			}

			assertUnique(fieldName);

			if (tsAft.length == 0) {
				colon.syntaxError("expected type expression after ':'");
				return fields;
			}

			const nextColonPos = SymbolToken.find(tsAft, ":");

			if (nextColonPos != -1) {
				if (nextColonPos == 0) {
					tsAft[nextColonPos].syntaxError("expected word before ':'");
					return fields;
				}

				void tsAft[nextColonPos-1].assertWord();

				ts = tsAft.splice(nextColonPos-1);
			} else {
				ts = [];
			}

			const typeExpr = buildTypeExpr(colon.site, tsAft);

			if (!typeExpr) {
				return fields;
			}

			fields.push(new DataField(fieldName, typeExpr));
		}
	}

	return fields;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {null | Expr} methodOf - methodOf !== null then first arg can be named 'self'
 * @returns {FuncStatement | null}
 */
function buildFuncStatement(site, ts, methodOf = null) {
	const name = assertToken(ts.shift(), site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (ts.length == 0) {
		name.site.syntaxError("invalid syntax");
		return null;
	}

	const parameters = buildTypeParameters(ts, true);

	const fnExpr = buildFuncLiteralExpr(ts, methodOf, false);

	if (!fnExpr) {
		return null;
	}

	return new FuncStatement(site.merge(fnExpr.site), name, parameters, fnExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {null | Expr} methodOf - methodOf !== null then first arg can be named 'self'
 * @param {boolean} allowInferredRetType
 * @returns {FuncLiteralExpr | null}
 */
function buildFuncLiteralExpr(ts, methodOf = null, allowInferredRetType = false) {
	const parens = assertDefined(ts.shift()).assertGroup("(");
	if (!parens) {
		return null;
	}

	const site = parens.site;
	const args = buildFuncArgs(parens, methodOf);

	const arrow = assertToken(ts.shift(), site)?.assertSymbol("->");
	if (!arrow) {
		return null;
	}

	const bodyPos = Group.find(ts, "{");

	if (bodyPos == -1) {
		site.syntaxError("no function body");
		return null;
	} else if (bodyPos == 0 && !allowInferredRetType) {
		site.syntaxError("no return type specified");
	}

	const retTypeExprs = buildFuncRetTypeExprs(arrow.site, ts.splice(0, bodyPos), allowInferredRetType);

	if (retTypeExprs === null) {
		return null;
	}

	const bodyGroup = assertToken(ts.shift(), site)?.assertGroup("{", 1)

	if (!bodyGroup) {
		return null;
	}

	const bodyExpr = buildValueExpr(bodyGroup.fields[0]);

	if (!bodyExpr) {
		return null;
	}

	return new FuncLiteralExpr(site, args, retTypeExprs, bodyExpr);
}

/**
 * @package
 * @param {Group} parens 
 * @param {null | Expr} methodOf - methodOf !== nul then first arg can be named 'self'
 * @returns {FuncArg[]}
 */
function buildFuncArgs(parens, methodOf = null) {
	/** @type {FuncArg[]} */
	const args = [];

	let hasDefaultArgs = false;

	for (let i = 0; i < parens.fields.length; i++) {
		const f = parens.fields[i];
		const ts = f.slice();

		const name = assertToken(ts.shift(), parens.site)?.assertWord();

		if (!name) {
			continue;
		}

		if (name.toString() == "self") {
			if (i != 0 || methodOf === null) {
				name.syntaxError("'self' is reserved");
			} else {
				if (ts.length > 0) {
					if (ts[0].isSymbol(":")) {
						ts[0].syntaxError("unexpected type expression after 'self'");
					} else {
						ts[0].syntaxError("unexpected token");
					}
				} else {
					args.push(new FuncArg(name, methodOf));
				}
			}
		} else if (name.toString() == "_") {
			if (ts.length > 0) {
				if (ts[0].isSymbol(":")) {
					ts[0].syntaxError("unexpected type expression after '_'");
				} else {
					ts[0].syntaxError("unexpected token");
				}
			} else {
				args.push(new FuncArg(name, methodOf));
			}
		} else {
			if (name.isKeyword()) {
				name.syntaxError("unexpected keyword");
			}

			for (let prev of args) {
				if (prev.name.toString() == name.toString()) {
					name.syntaxError(`duplicate argument '${name.toString()}'`);
				}
			}

			const maybeColon = ts.shift();
			if (maybeColon === undefined) {
				name.syntaxError(`expected ':' after '${name.toString()}'`);
			} else {
				const colon = maybeColon.assertSymbol(":");

				if (!colon) {
					continue;
				}

				const equalsPos = SymbolToken.find(ts, "=");

				/**
				 * @type {null | Expr}
				 */
				let defaultValueExpr = null;

				if (equalsPos != -1) {
					if (equalsPos == ts.length-1) {
						ts[equalsPos].syntaxError("expected expression after '='");
					} else {
						const vts = ts.splice(equalsPos);

						vts.shift()?.assertSymbol("=");
						
						defaultValueExpr = buildValueExpr(vts);

						hasDefaultArgs = true;
					}
				} else {
					if (hasDefaultArgs) {
						name.syntaxError("positional args must come before default args");
					}
				}

				/**
				 * @type {null | Expr}
				 */
				let typeExpr = null;

				if (ts.length == 0) {
					colon.syntaxError("expected type expression after ':'");
				} else {
					typeExpr = buildTypeExpr(colon.site, ts);
				}

				args.push(new FuncArg(name, typeExpr, defaultValueExpr));
			}
		}
	}

	return args;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {EnumStatement | null}
 */
function buildEnumStatement(site, ts) {
	const name = assertToken(ts.shift(), site, "expected word after 'enum'")?.assertWord()?.assertNotKeyword();
	if (!name) {
		return null;
	}

	const parameters = buildTypeParameters(ts, false);

	const braces = assertToken(ts.shift(), name.site, `expected '{...}' after 'enum ${name.toString()}'`)?.assertGroup("{", 1);

	if (!braces) {
		return null;
	}

	const [tsMembers, tsImpl] = splitDataImpl(braces.fields[0]);

	if (tsMembers.length == 0) {
		braces.syntaxError("expected at least one enum member");
	}

	/** @type {EnumMember[]} */
	const members = [];

	while (tsMembers.length > 0) {
		const member = buildEnumMember(tsMembers);

		if (!member) {
			continue;
		}

		members.push(member);
	}

	/**
	 * @type {Expr}
	 */
	let selfTypeExpr = new RefExpr(name);

	if (parameters.hasParameters()) {
		selfTypeExpr = new ParametricExpr(
			selfTypeExpr.site, 
			selfTypeExpr,
			parameters.getParameters().map(p => new RefExpr(new Word(selfTypeExpr.site, p.name)))
		)
	}

	const impl = buildImplDefinition(tsImpl, selfTypeExpr, members.map(m => m.name), braces.site.endSite);

	if (!impl) {
		return null;
	}

	return new EnumStatement(site.merge(braces.site), name, parameters, members, impl);
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {(ImportFromStatement | ImportModuleStatement | null)[] | null}
 */
function buildImportStatements(site, ts) {
	const t = assertToken(ts.shift(), site, "expected '{...}' or Word after 'import'");
	if (!t) {
		return null;
	}

	if (t.isWord()) {
		const statement = buildImportModuleStatement(site, t);

		if (!statement) {
			return null;
		}

		return [statement];
	} else {
		return buildImportFromStatements(site, t, ts);
	}
}

/**
 * @param {Site} site 
 * @param {Token} maybeName 
 * @returns {ImportModuleStatement | null}
 */
function buildImportModuleStatement(site, maybeName) {
	/**
	 * @type {Word | null}
	 */
	let moduleName = null;

	if (maybeName instanceof StringLiteral && importPathTranslator) {
		const translated = importPathTranslator(maybeName);
		if (!translated) {
			return null;
		}

		moduleName = new Word(maybeName.site, translated);
	} else {
		moduleName = maybeName.assertWord()?.assertNotKeyword() ?? null;
	}

	if (!moduleName) {
		return null;
	}

	return new ImportModuleStatement(site, moduleName);
}

/**
 * 
 * @param {Site} site 
 * @param {Token} maybeBraces 
 * @param {Token[]} ts 
 * @returns {(ImportFromStatement | null)[] | null}
 */
function buildImportFromStatements(site, maybeBraces, ts) {
	const braces = maybeBraces.assertGroup("{");
	if (!braces) {
		return null;
	}

	const maybeFrom = assertToken(ts.shift(), maybeBraces.site, "expected 'from' after 'import {...}'")?.assertWord("from");
	if (!maybeFrom) {
		return null;
	}

	const maybeModuleName = assertToken(ts.shift(), maybeFrom.site, "expected module name after 'import {...} from'");
	if (!maybeModuleName) {
		return null;
	}

	/**
	 * @type {null | undefined | Word}
	 */
	let moduleName = null;

	if (maybeModuleName instanceof StringLiteral && importPathTranslator) {
		const translated = importPathTranslator(maybeModuleName);

		if (!translated) {
			return null;
		}

		moduleName = new Word(maybeModuleName.site, translated);
	} else {
		moduleName = maybeModuleName.assertWord()?.assertNotKeyword();
	}

	if (!moduleName) {
		return null;
	}

	const mName = moduleName;

	if (braces.fields.length === 0) {
		braces.syntaxError("expected at least 1 import field");
	}

	return braces.fields.map(fts => {
		const ts = fts.slice();
		const maybeOrigName = ts.shift();

		if (maybeOrigName === undefined) {
			braces.syntaxError("empty import field");
			return null;
		} else {
			const origName = maybeOrigName.assertWord();

			if (!origName) {
				return null;
			} else if (ts.length === 0) {
				return new ImportFromStatement(site, origName, origName, mName);
			} else {
				const maybeAs = ts.shift();

				if (maybeAs === undefined) {
					maybeOrigName.syntaxError(`expected 'as' or nothing after '${origName.value}'`);
					return null;
				} else {
					maybeAs.assertWord("as");

					const maybeNewName = ts.shift();

					if (maybeNewName === undefined) {
						maybeAs.syntaxError("expected word after 'as'");
						return null;
					} else {
						const newName = maybeNewName.assertWord();

						if (!newName) {
							return null;
						}

						const rem = ts.shift();
						if (rem !== undefined) {
							rem.syntaxError("unexpected token");
							return null;
						} else {
							return new ImportFromStatement(site, newName, origName, mName);
						}
					}
				}
			}
		}
	}).filter(f => f !== null)
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {EnumMember | null}
 */
function buildEnumMember(ts) {
	const name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	} else if (ts.length == 0 || ts[0].isWord()) {
		return new EnumMember(name, []);
	} else {
		const braces = assertToken(ts.shift(), name.site)?.assertGroup("{", 1);

		if (!braces) {
			return null;
		} else {
			const fields = buildDataFields(braces.fields[0]);

			return new EnumMember(name, fields);
		}
	}
}

/** 
 * @package
 * @param {Token[]} ts 
 * @param {Expr} selfTypeExpr - reference to parent type
 * @param {Word[]} fieldNames - to check if impl statements have a unique name
 * @param {?Site} endSite
 * @returns {ImplDefinition | null}
 */
function buildImplDefinition(ts, selfTypeExpr, fieldNames, endSite) {
	/**
	 * @param {Word} name
	 * @returns {boolean}
	 */
	function isNonAuto(name) {
		if (AUTOMATIC_METHODS.findIndex(n => n == name.toString()) != -1) {
			name.syntaxError(`'${name.toString()}' is a reserved member`);
			return false;
		} else {
			return true;
		}
	}

	for (let fieldName of fieldNames) {
		if (!isNonAuto(fieldName)) {
			return null;
		}
	}

	const statements = buildImplMembers(ts, selfTypeExpr);

	/** 
	 * @param {number} i
	 * @returns {boolean} - ok
	 */
	function isUnique(i) {
		let s = statements[i];

		isNonAuto(s.name);

		for (let fieldName of fieldNames) {
			if (fieldName.toString() == s.name.toString()) {
				s.name.syntaxError(`'${s.name.toString()}' is duplicate`);
				return false;
			}
		}

		for (let j = i+1; j < statements.length; j++) {
			if (statements[j].name.toString() == s.name.toString()) {
				statements[j].name.syntaxError(`'${s.name.toString()}' is duplicate`);
				return false;
			}
		}

		return true;
	}

	const n = statements.length;

	for (let i = 0; i < n; i++) {
		if (!isUnique(i)) {
			return null;
		}
	}

	if (n > 0 && endSite !== null) {
		statements[n-1].site.setEndSite(endSite);
	}

	return new ImplDefinition(selfTypeExpr, statements);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {Expr} methodOf
 * @returns {(ConstStatement | FuncStatement)[]}
 */
function buildImplMembers(ts, methodOf) {
	/** @type {(ConstStatement | FuncStatement)[]} */
	const statements = [];

	while (ts.length != 0) {
		const t = assertDefined(ts.shift()).assertWord();

		if (!t) {
			continue;
		}

		const kw = t.value;

		/**
		 * @type {null | ConstStatement | FuncStatement}
		 */
		let s = null;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts, methodOf);
		} else {
			t.syntaxError("invalid impl syntax");
		}

		if (s) {
			statements.push(s);
		}
	}

	return statements
}

/**
 * TODO: chain like value
 * @package
 * @param {Site} site
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildTypeExpr(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("expected token");
		return null;
	}

	if (ts[0].isGroup("[")) {
		return buildListTypeExpr(ts);
	} else if (ts[0].isWord("Map")) {
		return buildMapTypeExpr(ts);
	} else if (ts[0].isWord("Option")) {
		return buildOptionTypeExpr(ts);
	} else if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncTypeExpr(ts);
	} else if (ts.length > 2 && ts[0].isGroup("[") && ts[1].isGroup("(") && ts[2].isSymbol("->")) {
		return buildFuncTypeExpr(ts);
	} else if (SymbolToken.find(ts, "::") > Group.find(ts, "[")) {
		return buildTypePathExpr(ts);
	} else if (Group.find(ts, "[") > SymbolToken.find(ts, "::")) {
		return buildParametricTypeExpr(ts);
	} else if (ts.length == 1 && ts[0].isWord()) {
		return buildTypeRefExpr(ts);
	} else {
		ts[0].syntaxError("invalid type syntax");
		return null;
	}
}

/**
 * @param {Token[]} ts 
 * @returns {ParametricExpr | null}
 */
function buildParametricTypeExpr(ts) {
	const brackets = assertDefined(ts.pop()).assertGroup("[");
	if (!brackets) {
		return null;
	}

	const baseExpr = buildTypeExpr(brackets.site, ts);
	if (!baseExpr) {
		return null;
	}

	const typeExprs = reduceNull(brackets.fields.map(fts => {
		return buildTypeExpr(brackets.site, fts);
	}));

	if (!typeExprs) {
		return null;
	}

	return new ParametricExpr(brackets.site, baseExpr, typeExprs);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListTypeExpr | null}
 */
function buildListTypeExpr(ts) {
	const brackets = assertDefined(ts.shift()).assertGroup("[", 0);

	if (!brackets) {
		return null
	}

	const itemTypeExpr = buildTypeExpr(brackets.site, ts);

	if (!itemTypeExpr) {
		return null;
	}

	return new ListTypeExpr(brackets.site, itemTypeExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {MapTypeExpr | null}
 */
function buildMapTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Map");

	if (!kw) {
		return null;
	}

	const maybeKeyTypeExpr = assertToken(ts.shift(), kw.site, "missing Map key-type");

	if (!maybeKeyTypeExpr) {
		return null;
	}

	const keyTypeTs = maybeKeyTypeExpr.assertGroup("[", 1)?.fields[0];
	if (keyTypeTs === null || keyTypeTs === undefined) {
		return null;
	} else if (keyTypeTs.length == 0) {
		kw.syntaxError("missing Map key-type (brackets can't be empty)");
		return null;
	} 

	const keyTypeExpr = buildTypeExpr(kw.site, keyTypeTs);
	if (!keyTypeExpr) {
		return null;
	}

	if (ts.length == 0) {
		kw.syntaxError("missing Map value-type");
		return null;
	} 

	const valueTypeExpr = buildTypeExpr(kw.site, ts);

	if (!valueTypeExpr) {
		return null;
	}

	return new MapTypeExpr(kw.site, keyTypeExpr, valueTypeExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildOptionTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Option");

	if (!kw) {
		return null;
	}

	const typeTs = assertToken(ts.shift(), kw.site)?.assertGroup("[", 1)?.fields[0];

	if (!typeTs) {
		return null;
	}

	const someTypeExpr = buildTypeExpr(kw.site, typeTs);
	if (!someTypeExpr) {
		return null;
	}

	const typeExpr = new OptionTypeExpr(kw.site, someTypeExpr);
	if (ts.length > 0) {
		if (ts[0].isSymbol("::") && ts[1].isWord(["Some", "None"])) {
			if (ts.length > 2) {
				ts[2].syntaxError("unexpected token");
				return null;
			} else {
				const memberName = ts[1].assertWord()

				if (!memberName) {
					return null;
				}

				return new PathExpr(ts[0].site, typeExpr, memberName);
			}
		} else {
			ts[0].syntaxError("invalid option type syntax");
			return null;
		}
	} else {
		return typeExpr;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {FuncTypeExpr | null}
 */
function buildFuncTypeExpr(ts) {
	const parens = assertDefined(ts.shift()).assertGroup("(");
	if (!parens) {
		return null;
	}

	let hasOptArgs = false;

	const argTypes = reduceNull(parens.fields.map(f => {
		const fts = f.slice();

		if (fts.length == 0) {
			parens.syntaxError("expected func arg type");
			return null;
		}

		const funcArgTypeExpr = buildFuncArgTypeExpr(fts);

		if (!funcArgTypeExpr) {
			return null;
		}

		if (hasOptArgs) {
			if (!funcArgTypeExpr.isOptional()) {
				funcArgTypeExpr.syntaxError("optional arguments must come last");
				return null;
			}
		} else {
			if (funcArgTypeExpr.isOptional()) {
				hasOptArgs = true;
			}
		}

		return funcArgTypeExpr;
	}));

	if (!argTypes) {
		return null;
	} 

	if (argTypes.some(at => at.isNamed()) && argTypes.some(at => !at.isNamed())) {
		argTypes[0].syntaxError("can't mix named and unnamed args in func type");
		return null;
	}

	const arrow = assertToken(ts.shift(), parens.site)?.assertSymbol("->");

	if (!arrow) {
		return null;
	}

	const retTypes = buildFuncRetTypeExprs(arrow.site, ts, false);

	if (!retTypes) {
		return null;
	}

	return new FuncTypeExpr(parens.site, argTypes, retTypes.map(t => assertDefined(t)));
}

/**
 * 
 * @param {Token[]} ts 
 * @returns {FuncArgTypeExpr | null}
 */
function buildFuncArgTypeExpr(ts) {
	const colonPos = SymbolToken.find(ts, ":");

	if (colonPos != -1 && colonPos != 1) {
		ts[0].syntaxError("invalid syntax");
		return null;
	}

	/**
	 * @type {Word | null}
	 */
	let name = null;

	if (colonPos != -1) {
		name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword() ?? null;

		if (!name) {
			return null;
		}

		const colon = assertDefined(ts.shift()).assertSymbol(":");

		if (!colon) {
			return null;
		}
		
		if (ts.length == 0) {
			colon.syntaxError("expected type expression after ':'");
			return null;
		}
	}

	const next = assertDefined(ts[0]);

	const hasDefault = next.isSymbol("?");
	if (hasDefault) {
		const opt = assertDefined(ts.shift());

		if (ts.length == 0) {
			opt.syntaxError("invalid type expression after '?'");
			return null;
		}
	}

	const typeExpr = buildTypeExpr(next.site, ts);
	if (!typeExpr) {
		return null;
	}

	return new FuncArgTypeExpr(name !== null ? name.site : typeExpr.site, name, typeExpr, hasDefault);
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {boolean} allowInferredRetType
 * @returns {null | (null | Expr)[]}
 */
function buildFuncRetTypeExprs(site, ts, allowInferredRetType = false) {
	if (ts.length === 0) {
		if (allowInferredRetType) {
			return [null];
		} else {
			site.syntaxError("expected type expression after '->'");
			return null;
		}
	} else {
		if (ts[0].isGroup("(") && (ts.length == 1 || !ts[1].isSymbol("->"))) {
			const group = assertToken(ts.shift(), site)?.assertGroup("(");

			if (!group) {
				return null;
			} else if (group.fields.length == 0) {
				return [new VoidTypeExpr(group.site)];
			} else if (group.fields.length == 1) {
				group.syntaxError("expected 0 or 2 or more types in multi return type");
				return null;
			} else {
				return group.fields.map(fts => {
					fts = fts.slice();

					return buildTypeExpr(group.site, fts);
				});
			}
		} else {
			return [buildTypeExpr(site, ts)];
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {null | PathExpr}
 */
function buildTypePathExpr(ts) {
	const i = SymbolToken.findLast(ts, "::");

	assert(i != -1);

	const baseExpr = buildTypeExpr(ts[0].site, ts.splice(0, i));
	if (!baseExpr) {
		return null;
	}

	const dcolon = assertDefined(ts.shift()).assertSymbol("::");
	if (!dcolon) {
		return null;
	}

	const memberName = assertToken(ts.shift(), dcolon.site)?.assertWord()?.assertNotKeyword();
	if (!memberName) {
		return null;
	}
	
	return new PathExpr(dcolon.site, baseExpr, memberName);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {RefExpr | null}
 */
function buildTypeRefExpr(ts) {
	const name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (ts.length > 0) {
		ts[0].syntaxError("invalid type syntax");
		return null;
	}

	return new RefExpr(name);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {Expr | null}
 */
function buildValueExpr(ts, prec = 0) {
	assert(ts.length > 0);

	// lower index in exprBuilders is lower precedence
	/** @type {((ts: Token[], prev: number) => (Expr | null))[]} */
	const exprBuilders = [
		/**
		 * 0: lowest precedence is assignment
		 * @param {Token[]} ts_ 
		 * @param {number} prec_ 
		 * @returns 
		 */
		function (ts_, prec_) {
			return buildMaybeAssignOrChainExpr(ts_, prec_);
		},
		makeBinaryExprBuilder('||'), // 1: logical or operator
		makeBinaryExprBuilder('&&'), // 2: logical and operator
		makeBinaryExprBuilder(['==', '!=']), // 3: eq or neq
		makeBinaryExprBuilder(['<', '<=', '>', '>=']), // 4: comparison
		makeBinaryExprBuilder(['+', '-']), // 5: addition subtraction
		makeBinaryExprBuilder(['*', '/', '%']), // 6: multiplication division remainder
		makeUnaryExprBuilder(['!', '+', '-']), // 7: logical not, negate
		/**
		 * 8: variables or literal values chained with: (enum)member access, indexing and calling
		 * @param {Token[]} ts_ 
		 * @param {number} prec_ 
		 * @returns 
		 */
		function (ts_, prec_) {
			return buildChainedValueExpr(ts_, prec_);
		}
	];

	return exprBuilders[prec](ts, prec);
}

/**
 * @package
 * @param {Token[]} ts
 * @param {number} prec
 * @returns {Expr | null}
 */
function buildMaybeAssignOrChainExpr(ts, prec) {
	let semicolonPos = SymbolToken.find(ts, ";");
	const equalsPos = SymbolToken.find(ts, "=");

	if (semicolonPos == -1) {
		if (equalsPos != -1) {
			ts[equalsPos].syntaxError("invalid assignment syntax, expected ';' after '...=...'");
			return null;
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	} else {
		if (equalsPos == -1 || equalsPos > semicolonPos) {
			const upstreamExpr = buildValueExpr(ts.splice(0, semicolonPos), prec+1);
			const site = assertDefined(ts.shift()).site;

			if (ts.length == 0) {
				site.syntaxError("expected expression after ';'");
				return null;
			} else if (upstreamExpr === null) {
				// error will already have been created
				return null;
			} else {
				const downstreamExpr = buildValueExpr(ts, prec);

				if (downstreamExpr === null) {
					// error will already have been created
					return null;
				} else {
					return new ChainExpr(site, upstreamExpr, downstreamExpr);
				}
			}
		} else if (equalsPos != -1 && equalsPos < semicolonPos) {
			const equals = ts[equalsPos].assertSymbol("=");

			if (!equals) {
				return null;
			}

			const equalsSite = equals.site;

			const lts = ts.splice(0, equalsPos);

			const lhs = buildAssignLhs(equalsSite, lts);
			
			assertDefined(ts.shift()).assertSymbol("=");

			semicolonPos = SymbolToken.find(ts, ";");
			assert(semicolonPos != -1);

			let upstreamTs = ts.splice(0, semicolonPos);
			if (upstreamTs.length == 0) {
				equalsSite.syntaxError("expected expression between '=' and ';'");
				return null;
			}

			const upstreamExpr = buildValueExpr(upstreamTs, prec + 1);

			const semicolon  = assertToken(ts.shift(), equalsSite)?.assertSymbol(";");

			if (!semicolon) {
				return null;
			}

			const semicolonSite = semicolon.site;

			if (ts.length == 0) {
				semicolonSite.syntaxError("expected expression after ';'");
				return null;
			}

			const downstreamExpr = buildValueExpr(ts, prec);

			if (downstreamExpr === null || upstreamExpr === null || lhs === null) {
				// error will already have been thrown internally
				return null;
			} else {
				return new AssignExpr(equalsSite, lhs, upstreamExpr, downstreamExpr);
			}
		} else {
			ts[0].syntaxError("unhandled");
			return null;
		}
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts 
 * @param {boolean} isSwitchCase
 * @returns {DestructExpr | null}
 */
function buildDestructExpr(site, ts, isSwitchCase = false) {
	if (ts.length == 0) {
		site.syntaxError("expected token inside destructuring braces");
		return null;
	}

	let maybeName = assertToken(ts.shift(), site);

	if (!maybeName) {
		return null;
	}

	if (maybeName.isWord("_")) {
		if (ts.length != 0) {
			maybeName.syntaxError("unexpected tokens after '_'");
			return null;
		} else {
			return new DestructExpr(new Word(maybeName.site, "_"), null);
		}
	} else {
		let name = new Word(maybeName.site, "_");

		if (ts.length >= 1 && ts[0].isSymbol(":")) {
			let name_ = maybeName.assertWord()?.assertNotKeyword();

			if (!name_) {
				return null;
			}

			name = name_;

			const colon = assertToken(ts.shift(), name.site)?.assertSymbol(":");

			if (!colon) {
				return null;
			}

			if (ts.length == 0) {
				colon.syntaxError("expected type expression after ':'");
				return null;
			} 

			const destructExprs = buildDestructExprs(ts);

			if (destructExprs === null || destructExprs === undefined) {
				return null
			}

			const typeExpr = buildTypeExpr(colon.site, ts);

			if (!typeExpr) {
				return null;
			}

			return new DestructExpr(name, typeExpr, destructExprs);
		} else if (ts.length == 0) {
			if (isSwitchCase) {
				const typeName = maybeName.assertWord()?.assertNotKeyword();

				if (!typeName) {
					return null;
				}

				const typeExpr = new RefExpr(typeName);

				if (!typeExpr) {
					return null;
				} 

				return new DestructExpr(name, typeExpr);
			} else {
				const name = maybeName.assertWord()?.assertNotKeyword();

				if (!name) {
					return null;
				}

				return new DestructExpr(name, null);
			}
		} else {
			ts.unshift(maybeName);

			const destructExprs = buildDestructExprs(ts);

			if (destructExprs === null || destructExprs === undefined) {
				return null;
			}
	
			const typeExpr = buildTypeExpr(site, ts);

			if (!typeExpr) {
				return null;
			}

			return new DestructExpr(name, typeExpr, destructExprs);
		}
	}
}

/**
 * Pops the last element of ts if it is a braces group
 * @param {Token[]} ts
 * @returns {null | DestructExpr[]}
 */
function buildDestructExprs(ts) {
	if (ts.length == 0) {
		return [];
	} else if (ts[ts.length -1].isGroup("{")) {
		const group = assertDefined(ts.pop()).assertGroup("{");

		if (!group) {
			return null;
		}

		const destructExprs = group.fields.map(fts => {
			return buildDestructExpr(group.site, fts);
		});
	
		if (destructExprs.every(le => le !== null && le.isIgnored() && !le.hasDestructExprs())) {
			group.syntaxError("expected at least one used field while destructuring")
			return null;
		}

		return reduceNull(destructExprs);
	} else {
		return [];
	}	
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {null | DestructExpr[]}
 */
function buildAssignLhs(site, ts) {
	const maybeName = ts.shift();
	if (maybeName === undefined) {
		site.syntaxError("expected a name before '='");
		return null;
	} else {
		/**
		 * @type {DestructExpr[]}
		 */
		const pairs = [];

		if (maybeName.isWord()) {
			ts.unshift(maybeName);

			const lhs = buildDestructExpr(maybeName.site, ts);

			if (lhs === null) {
				return null;
			} else if (lhs.isIgnored() && !lhs.hasDestructExprs()) {
				maybeName.syntaxError(`unused assignment ${maybeName.toString()}`);
				return null;
			}

			pairs.push(lhs);
		} else if (maybeName.isGroup("(")) {
			const group = maybeName.assertGroup("(");

			if (!group) {
				return null;
			}

			if (group.fields.length < 2) {
				group.syntaxError("expected at least 2 lhs' for multi-assign");
				return null;
			}

			let someNoneUnderscore = false;
			for (let fts of group.fields) {
				if (fts.length == 0) {
					group.syntaxError("unexpected empty field for multi-assign");
					return null;
				}

				fts = fts.slice();

				const lhs = buildDestructExpr(group.site, fts);

				if (!lhs) {
					return null;
				}
				
				if (!lhs.isIgnored() || lhs.hasDestructExprs()) {
					someNoneUnderscore = true;
				}

				// check that name is unique
				pairs.forEach(p => {
					if (!lhs.isIgnored() && p.name.value === lhs.name.value) {
						lhs.name.syntaxError(`duplicate name '${lhs.name.value}' in lhs of multi-assign`);
					}
				});

				pairs.push(lhs);
			}

			if (!someNoneUnderscore) {
				group.syntaxError("expected at least one non-underscore in lhs of multi-assign");
				return null;
			}
		} else {
			maybeName.syntaxError("unexpected syntax for lhs of =");
			return null;
		}

		return pairs;
	}
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => (Expr | null)}
 */
function makeBinaryExprBuilder(symbol) {
	// default behaviour is left-to-right associative
	return function (ts, prec) {
		const iOp = SymbolToken.findLast(ts, symbol);

		if (iOp == ts.length - 1) {
			// post-unary operator, which is invalid
			ts[iOp].syntaxError(`invalid syntax, '${ts[iOp].toString()}' can't be used as a post-unary operator`);
			return null;
		} else if (iOp > 0) { // iOp == 0 means maybe a (pre)unary op, which is handled by a higher precedence
			const a = buildValueExpr(ts.slice(0, iOp), prec);
			const b = buildValueExpr(ts.slice(iOp + 1), prec + 1);
			const op = ts[iOp].assertSymbol();

			if (!a || !b || !op) {
				return null;
			}

			return new BinaryExpr(op, a, b);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	};
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => (Expr | null)}
 */
function makeUnaryExprBuilder(symbol) {
	// default behaviour is right-to-left associative
	return function (ts, prec) {
		if (ts[0].isSymbol(symbol)) {
			const rhs = buildValueExpr(ts.slice(1), prec);
			const op = ts[0].assertSymbol();

			if (!rhs || !op) {
				return null;
			}

			return new UnaryExpr(op, rhs);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {Expr | null}
 */
function buildChainedValueExpr(ts, prec) {
	/** @type {Expr | null} */
	let expr = buildChainStartValueExpr(ts);

	// now we can parse the rest of the chaining
	while (ts.length > 0) {
		if (expr === null) {
			return null;
		}

		const t = assertDefined(ts.shift());

		if (t.isGroup("(")) {
			expr = buildCallExpr(t.site, expr, assertDefined(t.assertGroup()));
		} else if (t.isGroup("[")) {
			expr = buildParametricValueExpr(expr, assertDefined(t.assertGroup("[")));
		} else if (t.isSymbol(".") && ts.length > 0 && ts[0].isWord("switch")) {
			expr = buildSwitchExpr(expr, ts);
		} else if (t.isSymbol(".")) {
			const name = assertToken(ts.shift(), t.site)?.assertWord()?.assertNotKeyword();

			if (!name) {
				return null;
			}

			expr = new MemberExpr(t.site, expr, name);
		} else if (t.isGroup("{")) {
			t.syntaxError("invalid syntax");
			return null;
		} else if (t.isSymbol("::")) {
			t.syntaxError("invalid syntax");
			return null;
		} else {
			t.syntaxError(`invalid syntax '${t.toString()}'`);
			return null;
		}
	}

	return expr;
}

/**
 * @param {Expr} expr 
 * @param {Group} brackets 
 * @returns {ParametricExpr | null}
 */
function buildParametricValueExpr(expr, brackets) {
	const typeExprs = reduceNull(brackets.fields.map(fts => {
		if (fts.length == 0) {
			brackets.site.syntaxError("unexpected empty field");
			return null;
		} else {
			const typeExpr = buildTypeExpr(brackets.site, fts);

			if (fts.length != 0) {
				fts[0].syntaxError("unexpected token");
				return null;
			} else {
				return typeExpr;
			}
		}
	}));

	if (!typeExprs) {
		return null;
	}

	return new ParametricExpr(brackets.site, expr, typeExprs);
}

/**
 * @param {Site} site 
 * @param {Expr} fnExpr 
 * @param {Group} parens
 * @returns {CallExpr | null}
 */
function buildCallExpr(site, fnExpr, parens) {
	const callArgs = buildCallArgs(parens);

	if (callArgs === null) {
		return null;
	} else {
		return new CallExpr(site, fnExpr, callArgs);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildChainStartValueExpr(ts) {
	if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncLiteralExpr(ts, null, true);
	} else if (ts[0].isWord("if")) {
		return buildIfElseExpr(ts);
	} else if (ts[0].isWord("switch")) {
		ts[0].syntaxError("expected '... .switch' instead of 'switch'");
		return null;
	} else if (ts[0].isLiteral()) {
		return new PrimitiveLiteralExpr(assertDefined(ts.shift())); // can simply be reused
	} else if (ts[0].isGroup("(")) {
		return buildParensExpr(ts);
	} else if (Group.find(ts, "{") != -1) {
		if (ts[0].isGroup("[")) {
			return buildListLiteralExpr(ts);
		} else if (ts[0].isWord("Map") && ts[1].isGroup("[")) {
			return buildMapLiteralExpr(ts); 
		} else {
			// could be switch or literal struct construction
			const iBraces = Group.find(ts, "{");
			const iSwitch = Word.find(ts, "switch");
			const iPeriod = SymbolToken.find(ts, ".");

			if (iSwitch != -1 && iPeriod != -1 && iSwitch < iBraces && iPeriod < iBraces && iSwitch > iPeriod) {
				return buildValueExpr(ts.splice(0, iPeriod));
			} else {
				return buildStructLiteralExpr(ts);
			}
		}
	} else if (SymbolToken.find(ts, "::") != -1) {
		return buildValuePathExpr(ts);
	} else if (ts[0].isWord()) {
		if (ts[0].isWord("const") || ts[0].isWord("struct") || ts[0].isWord("enum") || ts[0].isWord("func") || ts[0].isWord("import")) {
			ts[0].syntaxError(`invalid use of '${assertDefined(ts[0].assertWord()).value}', can only be used as top-level statement`);
			return null;
		} else {
			const name = assertDefined(ts.shift()?.assertWord());

			if (name.value == "self") {
				return new RefExpr(name);
			} else {
				const n = name.assertNotKeyword();

				if (!n) {
					return null;
				}

				return new RefExpr(n);
			}
		}
	} else {
		ts[0].syntaxError("invalid syntax");
		return null;
	}
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {Expr | null}
 */
function buildParensExpr(ts) {
	const group = assertDefined(ts.shift()).assertGroup("(");

	if (!group) {
		return null;
	}

	const site = group.site;

	if (group.fields.length === 0) {
		group.syntaxError("expected at least one expr in parens");
		return null;
	} else {
		const fields = group.fields.map(fts => buildValueExpr(fts));

		/**
		 * @type {Expr[]}
		 */
		const nonNullFields = [];

		fields.forEach(f => {
			if (f !== null) {
				nonNullFields.push(f);
			}
		});

		if (nonNullFields.length == 0) {
			// error will already have been thrown internally
			return null;
		} else {
			return new ParensExpr(site, nonNullFields);
		}
	}
}

/**
 * @package
 * @param {Group} parens 
 * @returns {CallArgExpr[] | null}
 */
function buildCallArgs(parens) {
	/**
	 * @type {Set<string>}
	 */
	const names = new Set();

	const callArgs = reduceNull(parens.fields.map(fts => {
		const callArg = buildCallArgExpr(parens.site, fts);

		if (callArg !== null && callArg.isNamed()) {
			if (names.has(callArg.name)) {
				callArg.syntaxError(`duplicate named call arg ${callArg.name}`);
			}

			names.add(callArg.name);
		}

		return callArg;
	}));

	if (callArgs === null) {
		return null;
	} else {
		if (callArgs.some(ca => ca.isNamed()) && callArgs.some(ca => !ca.isNamed())) {
			callArgs[0].syntaxError("can't mix positional and named args");
			return null;
		}

		return callArgs;
	}
}

/**
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {CallArgExpr | null}
 */
function buildCallArgExpr(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("invalid syntax");
		return null;
	}

	/**
	 * @type {null | undefined | Word}
	 */
	let name = null;

	if (ts.length >= 2 && ts[0].isWord() && ts[1].isSymbol(":")) {
		name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

		if (!name) {
			return null;
		}

		const colon = assertDefined(ts.shift());

		if (ts.length == 0) {
			colon.syntaxError("expected value expressions after ':'");
			return null;
		}
	}

	const value = buildValueExpr(ts);

	if (!value) {
		return null;
	}

	return new CallArgExpr(name != null ? name.site : value.site, name, value);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {IfElseExpr | null}
 */
function buildIfElseExpr(ts) {
	const ifWord = assertDefined(ts.shift()).assertWord("if");

	if (!ifWord) {
		return null;
	}

	const site = ifWord.site;

	/** @type {Expr[]} */
	const conditions = [];

	/** @type {Expr[]} */
	const branches = [];
	while (true) {
		const parens = assertToken(ts.shift(), site)?.assertGroup("(");

		if (!parens) {
			return null;
		}

		const braces = assertToken(ts.shift(), site)?.assertGroup("{");

		if (!braces) {
			return null;
		}

		if (parens.fields.length != 1) {
			parens.syntaxError("expected single if-else condition");
			return null;
		}

		if (braces.fields.length == 0) {
			braces.syntaxError("branch body can't be empty");
			return null;
		} else if (braces.fields.length != 1) {
			braces.syntaxError("expected single if-else branch expession");
			return null;
		}

		const cond = buildValueExpr(parens.fields[0]);
		const branch = buildValueExpr(braces.fields[0]);

		if (cond === null || branch === null) {
			continue;
		}

		conditions.push(cond);
		branches.push(branch);

		const maybeElse = ts.shift();

		if (maybeElse === undefined ) {
			// add a void else branch
			branches.push(new VoidExpr(braces.site));
			break;
		} else {
			const elseWord = maybeElse.assertWord("else");

			if (!elseWord) {
				return null;
			}

			const next = assertToken(ts.shift(), elseWord.site);

			if (!next) {
				return null;
			} else if (next.isGroup("{")) {
				// last group
				const braces = next.assertGroup();

				if (!braces) {
					return null;
				}

				if (braces.fields.length != 1) {
					braces.syntaxError("expected single expession for if-else branch");
					return null;
				}

				const elseBranch = buildValueExpr(braces.fields[0]);

				if (!elseBranch) {
					return null;
				}

				branches.push(elseBranch);
				break;
			} else if (next.isWord("if")) {
				continue;
			} else {
				next.syntaxError("unexpected token");
				return null;
			}
		}
	}

	return new IfElseExpr(site, conditions, branches);
}

/**
 * @package
 * @param {Expr} controlExpr
 * @param {Token[]} ts 
 * @returns {Expr | null} - EnumSwitchExpr or DataSwitchExpr
 */
function buildSwitchExpr(controlExpr, ts) {
	const switchWord = assertDefined(ts.shift()).assertWord("switch");

	if (!switchWord) {
		return null;
	}

	const site = switchWord.site;

	const braces = assertToken(ts.shift(), site)?.assertGroup("{");

	if (!braces) {
		return null;
	}

	/** @type {SwitchCase[]} */
	const cases = [];

	/** @type {null | SwitchDefault} */
	let def = null;

	for (let tsInner of braces.fields) {
		if (tsInner[0].isWord("else") || tsInner[0].isWord("_")) {
			if (def !== null) {
				def.syntaxError("duplicate default case in switch");
				return null;
			}

			def = buildSwitchDefault(tsInner);
		} else {
			if (def !== null) {
				def.syntaxError("switch default case must come last");
				return null;
			}

			const c = buildSwitchCase(tsInner);

			if (c === null) {
				return null;
			} else {
				cases.push(c);
			}
		}
	}

	// check the uniqueness of each case here
	/** @type {Set<string>} */
	const set = new Set()
	for (let c of cases) {
		let t = c.memberName.toString();
		if (set.has(t)) {
			c.memberName.syntaxError(`duplicate switch case '${t}')`);
			return null;
		}

		set.add(t);
	}

	if (cases.length < 1) {
		site.syntaxError("expected at least one switch case");
		return null;
	}

	if (cases.some(c => c.isDataMember())) {
		if (cases.length + (def === null ? 0 : 1) > 5) {
			site.syntaxError(`too many cases for data switch, expected 5 or less, got ${cases.length.toString()}`);
			return null;
		} else {
			let count = 0;
			cases.forEach(c => {if (!c.isDataMember()){count++}});

			if (count > 1) {
				site.syntaxError(`expected at most 1 enum case in data switch, got ${count}`);
				return null;
			} else {
				if (count === 1 && cases.some(c => c instanceof UnconstrDataSwitchCase)) {
					site.syntaxError(`can't have both enum and (Int, []Data) in data switch`);
					return null;
				} else {
					return new DataSwitchExpr(site, controlExpr, cases, def);
				}
			}
		}
	} else {
		return new EnumSwitchExpr(site, controlExpr, cases, def);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @param {boolean} isAfterColon
 * @returns {Word | null} 
 */
function buildSwitchCaseName(site, ts, isAfterColon) {
	const first = ts.shift();

	if (first === undefined) {
		if (isAfterColon) {
			site.syntaxError("invalid switch case syntax, expected member name after ':'");
			return null;
		} else {
			site.syntaxError("invalid switch case syntax");
			return null;
		}
	}
		
	if (first.isWord("Map")) {
		const second = ts.shift();

		if (!second) {
			site.syntaxError("expected token after 'Map'");
			return null;
		}

		const keyTs = second.assertGroup("[]", 1)?.fields[0];

		if (keyTs === undefined || keyTs === null) {
			return null;
		}

		const key = keyTs.shift();

		if (key === undefined) {
			second.syntaxError("expected 'Map[Data]Data'");
			return null;
		}

		key.assertWord("Data");

		if (keyTs.length > 0) {
			keyTs[0].syntaxError("unexpected token after 'Data'");
			return null;
		}

		const third = ts.shift();

		if (third === undefined) {
			site.syntaxError("expected token after 'Map[Data]");
			return null;
		}

		third.assertWord("Data");

		if (ts.length > 0) {
			ts[0].syntaxError("unexpected token after 'Map[Data]Data'");
			return null;
		}

		return new Word(first.site, "Map[Data]Data");
	} else if (first.isWord()) {
		if (ts.length > 0) {
			ts[0].syntaxError("unexpected token");
			return null;
		}

		return first?.assertWord()?.assertNotKeyword() ?? null;
	} else if (first.isGroup("[")) {
		// list 
		first.assertGroup("[", 0);

		const second = ts.shift();

		if (second === undefined) {
			site.syntaxError("expected token after '[]'");
			return null;
		} else if (ts.length > 0) {
			ts[0].syntaxError("unexpected token");
			return null;
		}

		second.assertWord("Data");

		return new Word(first.site, "[]Data");
	} else {
		first.syntaxError("invalid switch case name syntax");
		return null;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchCase | null}
 */
function buildSwitchCase(ts) {
	const arrowPos = SymbolToken.find(ts, "=>");

	if (arrowPos == -1) {
		ts[0].syntaxError("expected '=>' in switch case");
		return null;
	} else if (arrowPos == 0) {
		ts[0].syntaxError("expected '<word>' or '<word>: <word>' to the left of '=>'");
		return null;
	}

	const tsLeft = ts.splice(0, arrowPos);

	if (tsLeft.length === 1 && tsLeft[0].isGroup("(")) {
		return buildMultiArgSwitchCase(tsLeft, ts);
	} else {
		return buildSingleArgSwitchCase(tsLeft, ts);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {null | [?Word, Word]} - varName is optional
 */
function buildSwitchCaseNameType(ts) {
	const colonPos = SymbolToken.find(ts, ":");

	/** @type {null | Word} */
	let varName = null;

	/** @type {null | Word} */
	let memberName = null;

	if (colonPos != -1) {
		const maybeVarName = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

		if (!maybeVarName) {
			return null;
		}

		varName = maybeVarName;
		
		const maybeColon = ts.shift();

		if (maybeColon === undefined) {
			varName.syntaxError("invalid switch case syntax, expected '(<name>: <enum-member>)', got '(<name>)'");
			return null;
		} else {
			void maybeColon.assertSymbol(":");

			memberName = buildSwitchCaseName(maybeColon.site, ts, true);
		}
	} else {
		memberName = buildSwitchCaseName(ts[0].site, ts, false);
	}

	if (ts.length !== 0) {
		ts[0].syntaxError("unexpected token");
		return null;
	}

	if (memberName === null) {
		// error will already have been thrown internally
		return null;
	} else {
		return [varName, memberName];
	}
}

/**
 * @package
 * @param {Token[]} tsLeft
 * @param {Token[]} ts
 * @returns {SwitchCase | null}
 */
function buildMultiArgSwitchCase(tsLeft, ts) {
	const parens = assertDefined(tsLeft.shift()).assertGroup("(");

	if (!parens) {
		return null;
	}

	const pairs = reduceNull(parens.fields.map(fts => buildSwitchCaseNameType(fts)));

	if (pairs === null) {
		return null;
	}

	assert(tsLeft.length === 0);

	if (pairs.length !== 2) {
		parens.syntaxError(`expected (Int, []Data) case, got (${pairs.map(p => p[1].value).join(", ")}`);
		return null;
	} else if (pairs[0][1].value != "Int" || pairs[1][1].value != "[]Data") {
		parens.syntaxError(`expected (Int, []Data) case, got (${pairs[0][1].value}, ${pairs[1][1].value})`);
		return null;
	} else {
		const maybeArrow = ts.shift();

		if (maybeArrow === undefined) {
			parens.syntaxError("expected '=>'");
			return null;
		} else {
			const arrow = maybeArrow.assertSymbol("=>");

			if (!arrow) {
				return null;
			}

			const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

			if (bodyExpr === null) {
				return null;
			} else {
				return new UnconstrDataSwitchCase(arrow.site, pairs[0][0], pairs[1][0], bodyExpr);
			}
		}
	}
}

/**
 * @package
 * @param {Token[]} tsLeft 
 * @param {Token[]} ts 
 * @returns {SwitchCase | null}
 */
function buildSingleArgSwitchCase(tsLeft, ts) {
	const site = tsLeft[tsLeft.length-1].site;

	const destructExpr = buildDestructExpr(site, tsLeft, true);

	if (destructExpr === null) {
		return null;
	} else if (!destructExpr.hasType()) {
		destructExpr.site.syntaxError("invalid switch case syntax");
		return null;
	}
	
	const maybeArrow = ts.shift();

	if (maybeArrow === undefined) {
		site.syntaxError("expected '=>'");
		return null;
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		if (!arrow) {
			return null;
		}

		const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

		if (bodyExpr === null) {
			return null;
		} else {
			return new SwitchCase(arrow.site, destructExpr, bodyExpr);
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildSwitchCaseBody(site, ts) {
	/** @type {null | Expr} */
	let bodyExpr = null;

	if (ts.length == 0) {
		site.syntaxError("expected expression after '=>'");
		return null;
	} else if (ts[0].isGroup("{")) {
		if (ts.length > 1) {
			ts[1].syntaxError("unexpected token");
			return null;
		}

		const tsBody = ts[0].assertGroup("{", 1)?.fields[0];

		if (tsBody === undefined || tsBody === null) {
			return null;
		}

		bodyExpr = buildValueExpr(tsBody);
	} else {
		bodyExpr = buildValueExpr(ts);
	}

	return bodyExpr;
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchDefault | null}
 */
function buildSwitchDefault(ts) {
	const elseWord = assertDefined(ts.shift()).assertWord();

	if (!elseWord) {
		return null;
	} else if (!(elseWord.isWord("else") || elseWord.isWord("_"))) {
		elseWord.syntaxError("expected 'else' or '_'");
		return null;
	}

	const site = elseWord.site;

	const maybeArrow = ts.shift();
	if (maybeArrow === undefined) {
		site.syntaxError(`expected '=>' after '${elseWord.value}'`);
		return null;
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		if (!arrow) {
			return null;
		}

		/** @type {null | Expr} */
		let bodyExpr = null;

		if (ts.length == 0) {
			arrow.syntaxError("expected expression after '=>'");
			return null;
		} else if (ts[0].isGroup("{")) {
			if (ts.length > 1) {
				ts[1].syntaxError("unexpected token");
				return null;
			} else {
				const bodyTs = ts[0].assertGroup("{", 1)?.fields[0];

				if (bodyTs === undefined || bodyTs === null) {
					return null;
				}

				bodyExpr = buildValueExpr(bodyTs);
			}
		} else {
			bodyExpr = buildValueExpr(ts);
		}

		if (!bodyExpr) {
			arrow.syntaxError("empty switch default case body");
			return null;
		}

		return new SwitchDefault(arrow.site, bodyExpr);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListLiteralExpr | null}
 */
function buildListLiteralExpr(ts) {
	const group = assertDefined(ts.shift()).assertGroup("[", 0);

	if (!group) {
		return null;
	}

	const site = group.site;

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		site.syntaxError("invalid list literal expression syntax");
		return null;
	}

	const itemTypeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!itemTypeExpr) {
		return null;
	}

	const braces = assertToken(ts.shift(), site)?.assertGroup("{");

	if (!braces) {
		return null;
	}

	const itemExprs = reduceNull(braces.fields.map(fts => buildValueExpr(fts)));

	if (itemExprs === null) {
		// error will have already been thrown internally
		return null;
	}

	return new ListLiteralExpr(site, itemTypeExpr, itemExprs);
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {MapLiteralExpr | null}
 */
function buildMapLiteralExpr(ts) {
	const mapWord = assertDefined(ts.shift()).assertWord("Map");

	if (!mapWord) {
		return null;
	}

	const site = mapWord.site;

	const bracket = assertDefined(ts.shift()).assertGroup("[", 1);

	if (!bracket) {
		return null;
	}

	const keyTypeExpr = buildTypeExpr(site, bracket.fields[0]);

	if (!keyTypeExpr) {
		return null;
	}

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		site.syntaxError("invalid map literal expression syntax");
		return null;
	}

	const valueTypeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!valueTypeExpr) {
		return null;
	}

	const braces = assertDefined(ts.shift()).assertGroup("{");

	if (!braces) {
		return null;
	}

	/**
	 * @type {null | [Expr, Expr][]}
	 */
	const pairs = reduceNullPairs(braces.fields.map(fts => {
		const colonPos = SymbolToken.find(fts, ":");

		if (colonPos == -1) {
			if (fts.length == 0) {
				braces.syntaxError("unexpected empty field");
			} else {
				fts[0].syntaxError("expected ':' in map literal field");
			}
		} else if (colonPos == 0) {
			fts[colonPos].syntaxError("expected expression before ':' in map literal field");
		} else if (colonPos == fts.length - 1) {
			fts[colonPos].syntaxError("expected expression after ':' in map literal field");
		} else {
			const keyExpr = buildValueExpr(fts.slice(0, colonPos));

			const valueExpr = buildValueExpr(fts.slice(colonPos+1));

			/**
			 * @type {[Expr | null, Expr | null]}
			 */
			return [keyExpr, valueExpr];
		}

		return [null, null];
	}));

	if (pairs === null) {
		return null;
	}

	return new MapLiteralExpr(site, keyTypeExpr, valueTypeExpr, pairs);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {StructLiteralExpr | null}
 */
function buildStructLiteralExpr(ts) {
	const bracesPos = Group.find(ts, "{");

	assert(bracesPos != -1);

	const site = ts[bracesPos].site;

	if (bracesPos == 0) {
		site.syntaxError("expected struct type before braces");
		return null;
	}
	
	const typeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!typeExpr) {
		return null;
	}

	const braces = assertDefined(ts.shift()).assertGroup("{");

	if (!braces) {
		return null;
	}

	const fields = reduceNull(braces.fields.map(fts => buildStructLiteralField(braces.site, fts)));

	if (fields === null) {
		return null;
	} 
	
	if (fields.every(f => f.isNamed()) || fields.every(f => !f.isNamed())) {
		return new StructLiteralExpr(typeExpr, fields);
	} else {
		braces.site.syntaxError("mangled literal struct (hint: specify all fields positionally or all with keys)");
		return null;
	}
}

/**
 * @package
 * @param {Site} site - site of the braces
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralField(site, ts) {
	if (ts.length > 2 && ts[0].isWord() && ts[1].isSymbol(":")) {
		return buildStructLiteralNamedField(site, ts);
	} else {
		return buildStructLiteralUnnamedField(site, ts);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralNamedField(site, ts) {
	const name = assertToken(ts.shift(), site, "empty struct literal field")?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	const colon = assertToken(ts.shift(), name.site, "expected ':' after struct field name")?.assertSymbol(":");

	if (!colon) {
		return null;
	}

	if (ts.length == 0) {
		colon.syntaxError("expected expression after ':'");
		return null;
	}
	const valueExpr = buildValueExpr(ts);

	if (!valueExpr) {
		return null;
	}

	return new StructLiteralField(name, valueExpr);
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralUnnamedField(site, ts) {
	const valueExpr = buildValueExpr(ts);

	if (!valueExpr) {
		return null;
	}

	return new StructLiteralField(null, valueExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildValuePathExpr(ts) {
	const dcolonPos = SymbolToken.findLast(ts, "::");

	assert(dcolonPos != -1);

	const typeExpr = buildTypeExpr(ts[dcolonPos].site, ts.splice(0, dcolonPos));

	if (!typeExpr) {
		return null;
	}

	const dcolon = assertDefined(ts.shift()?.assertSymbol("::"));

	const memberName = assertToken(ts.shift(), dcolon.site)?.assertWord()?.assertNotKeyword();

	if (!memberName) {
		return null;
	}
	
	return new ValuePathExpr(typeExpr.site, typeExpr, memberName);
}


/////////////////////////////
// Section 26: IR definitions
/////////////////////////////
/**
 * For collecting test coverage statistics
 * @type {?((name: string, count: number) => void)}
 */
var onNotifyRawUsage = null;

/**
 * Set the statistics collector (used by the test-suite)
 * @param {(name: string, count: number) => void} callback 
 */
function setRawUsageNotifier(callback) {
	onNotifyRawUsage = callback;
}

const RE_BUILTIN = new RegExp("(?<![@[])__helios[a-zA-Z0-9_@[\\]]*", "g");

/**
 * Wrapper for a builtin function (written in IR)
 */
class RawFunc {
	#name;
	#definition;

	/** @type {Set<string>} */
	#dependencies;

	/**
	 * Construct a RawFunc, and immediately scan the definition for dependencies
	 * @param {string} name 
	 * @param {string} definition 
	 */
	constructor(name, definition) {
		this.#name = name;
		assert(definition != undefined);
		this.#definition = definition;
		this.#dependencies = new Set();

		let matches = this.#definition.match(RE_BUILTIN);

		if (matches !== null) {
			for (let match of matches) {
				this.#dependencies.add(match);
			}
		}
	}

	get name() {
		return this.#name;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(replaceTabs(this.#definition))
	}

	/**
	 * Loads 'this.#dependecies' (if not already loaded), then load 'this'
	 * @param {Map<string, RawFunc>} db 
	 * @param {IRDefinitions} dst 
	 * @returns {void}
	 */
	load(db, dst) {
		if (onNotifyRawUsage !== null) {
			onNotifyRawUsage(this.#name, 1);
		}

		if (dst.has(this.#name)) {
			return;
		} else {
			for (let dep of this.#dependencies) {
				if (!db.has(dep)) {
					throw new Error(`InternalError: dependency ${dep} is not a builtin`);
				} else {
					assertDefined(db.get(dep)).load(db, dst);
				}
			}

			dst.set(this.#name, this.toIR());
		}
	}
}

/**
 * Initializes the db containing all the builtin functions
 * @returns {Map<string, RawFunc>}
 */
// only need to wrap these source in IR right at the very end
function makeRawFunctions() {
	/** @type {Map<string, RawFunc>} */
	let db = new Map();

	// local utility functions

	/**
	 * @param {RawFunc} fn 
	 */
	function add(fn) {
		if (db.has(fn.name)) {
			throw new Error(`builtin ${fn.name} duplicate`);
		}
		db.set(fn.name, fn);
	}

	/**
	 * @param {string} ns 
	 */
	function addNeqFunc(ns) {
		add(new RawFunc(`${ns}____neq`, 
		`(self, other) -> {
			__helios__bool____not(${ns}____eq(self, other))
		}`));
	}

	/**
	 * @param {string} ns 
	 */
	function addDataLikeEqFunc(ns) {
		add(new RawFunc(`${ns}____eq`, 
		`(self, other) -> {
			__core__equalsData(${ns}____to_data(self), ${ns}____to_data(other))
		}`));
	}

	/**
	 * @param {string} ns 
	 */
	function addSerializeFunc(ns) {
		add(new RawFunc(`${ns}__serialize`, 
		`(self) -> {
			() -> {
				__core__serialiseData(${ns}____to_data(self))
			}
		}`));
	}

	/**
	 * @param {string} ns 
	 */
	function addIntLikeFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__int____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__int____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__int__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__int__from_data"));
		add(new RawFunc(`${ns}____to_data`, "__helios__int____to_data"));
	}

	/**
	 * @param {string} ns 
	 */
	function addByteArrayLikeFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__bytearray____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__bytearray____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__bytearray__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__bytearray__from_data"));
		add(new RawFunc(`${ns}____to_data`, "__helios__bytearray____to_data"));
		add(new RawFunc(`${ns}____lt`, "__helios__bytearray____lt"));
		add(new RawFunc(`${ns}____leq`, "__helios__bytearray____leq"));
		add(new RawFunc(`${ns}____gt`, "__helios__bytearray____gt"));
		add(new RawFunc(`${ns}____geq`, "__helios__bytearray____geq"));
		add(new RawFunc(`${ns}__new`, `__helios__common__identity`));
		add(new RawFunc(`${ns}__show`, "__helios__bytearray__show"));
	}

	/**
	 * Adds basic auto members to a fully named type
	 * @param {string} ns 
	 */
	function addDataFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__common__identity"));
		add(new RawFunc(`${ns}____to_data`, "__helios__common__identity"));
	}

	/**
	 * Adds basic auto members to a fully named enum type
	 * @param {string} ns 
	 * @param {number} constrIndex
	 */
	function addEnumDataFuncs(ns, constrIndex) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
		add(new RawFunc(`${ns}____to_data`, "__helios__common__identity"));
		add(new RawFunc(`${ns}__from_data`, 
		`(data) -> {
			__helios__common__assert_constr_index(data, ${constrIndex})
		}`))
	}

	/**
	 * Generates the IR needed to unwrap a Plutus-core constrData
	 * @param {string} dataExpr
	 * @param {number} iConstr 
	 * @param {number} iField 
	 * @param {string} errorExpr 
	 * @returns {string}
	 */
	function unData(dataExpr, iConstr, iField, errorExpr = "error(\"unexpected constructor index\")") {
		let inner = "__core__sndPair(pair)";
		for (let i = 0; i < iField; i++) {
			inner = `__core__tailList(${inner})`;
		}

		// deferred evaluation of ifThenElse branches
		return `(pair) -> {__core__ifThenElse(__core__equalsInteger(__core__fstPair(pair), ${iConstr}), () -> {__core__headList(${inner})}, () -> {${errorExpr}})()}(__core__unConstrData(${dataExpr}))`;
	}

	/**
	 * Generates verbose IR for unwrapping a Plutus-core constrData.
	 * If config.DEBUG === false then returns IR without print statement
	 * @param {string} dataExpr
	 * @param {string} constrName
	 * @param {number} iConstr
	 * @param {number} iField
	 * @returns {string}
	 */
	function unDataVerbose(dataExpr, constrName, iConstr, iField) {
		if (!config.DEBUG) {
			return unData(dataExpr, iConstr, iField);
		} else {
			return unData(dataExpr, iConstr, iField, `__helios__common__verbose_error(__core__appendString("bad constr for ${constrName}, want ${iConstr.toString()} but got ", __helios__int__show(__core__fstPair(pair))()))`)
		}
	}

	/**
	 * Generates IR for constructing a list.
	 * By default the result is kept as list, and not converted to data
	 * @param {string[]} args 
	 * @param {boolean} toData 
	 * @returns 
	 */
	function makeList(args, toData = false) {
		let n = args.length;
		let inner = "__core__mkNilData(())";

		for (let i = n - 1; i >= 0; i--) {
			inner = `__core__mkCons(${args[i]}, ${inner})`;
		}

		if (toData) {
			inner = `__core__listData(${inner})`
		}

		return inner;
	}


	// Common builtins
	add(new RawFunc("__helios__common__verbose_error",
	`(msg) -> {
		__core__trace(msg, () -> {error("")})()
	}`));
	add(new RawFunc("__helios__common__assert_constr_index",
	`(data, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), i),
			() -> {data},
			() -> {error("unexpected constructor index")}
		)()
	}`));
	add(new RawFunc("__helios__common__identity",
	`(self) -> {self}`));
	add(new RawFunc("__helios__common____eq", "__core__equalsData"));
	add(new RawFunc("__helios__common____neq",
	`(a, b) -> {
		__helios__bool____not(__core__equalsData(a, b))
	}`));
	add(new RawFunc("__helios__common__serialize",
	`(self) -> {
		() -> {
			__core__serialiseData(self)
		}
	}`));
	add(new RawFunc("__helios__common__any",
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {false}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {true}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__all", 
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self,
					() -> {true},
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {recurse(recurse, __core__tailList(self), fn)},
							() -> {false}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map",
	`(self, fn, init) -> {
		(recurse) -> {
			recurse(recurse, self, init)
		}(
			(recurse, rem, lst) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {
						__core__mkCons(
							fn(__core__headList(rem)), 
							recurse(recurse, __core__tailList(rem), lst)
						)
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__filter", 
	`(self, fn, nil) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {nil}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {__core__mkCons(__core__headList(self), recurse(recurse, __core__tailList(self), fn))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__filter_list", 
	`(self, fn) -> {
		__helios__common__filter(self, fn, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__common__filter_map",
	`(self, fn) -> {
		__helios__common__filter(self, fn, __core__mkNilPairData(()))
	}`));
	add(new RawFunc("__helios__common__find",
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {error("not found")}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {__core__headList(self)}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__find_safe",
	`(self, fn, callback) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {__core__constrData(1, __helios__common__list_0)}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {__core__constrData(0, __helios__common__list_1(callback(__core__headList(self))))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {recurse(recurse, __core__tailList(self), fn, fn(z, __core__headList(self)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold_lazy",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {fn(__core__headList(self), () -> {recurse(recurse, __core__tailList(self), fn, z)})}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__insert_in_sorted",
	`(x, lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {__core__mkCons(x, lst)},
					() -> {
						(head) -> {
							__core__ifThenElse(
								comp(x, head),
								() -> {__core__mkCons(x, lst)},
								() -> {__core__mkCons(head, recurse(recurse, __core__tailList(lst)))}
							)()
						}(__core__headList(lst))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__sort", 
	`(lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {lst},
					() -> {
						(head, tail) -> {
							__helios__common__insert_in_sorted(head, tail, comp)
						}(__core__headList(lst), recurse(recurse, __core__tailList(lst)))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map_get",
	`(self, key, fnFound, fnNotFound) -> {
		(recurse) -> {
			recurse(recurse, self, key)
		}(
			(recurse, self, key) -> {
				__core__chooseList(
					self, 
					fnNotFound, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(key, __core__fstPair(__core__headList(self))), 
							() -> {fnFound(__core__sndPair(__core__headList(self)))}, 
							() -> {recurse(recurse, __core__tailList(self), key)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__is_in_bytearray_list",
	`(lst, key) -> {
		__helios__common__any(lst, (item) -> {__core__equalsData(item, key)})
	}`));
	add(new RawFunc("__helios__common__length", 
	`(lst) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst, 
					() -> {0}, 
					() -> {__core__addInteger(recurse(recurse, __core__tailList(lst)), 1)}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__concat", 
	`(a, b) -> {
		(recurse) -> {
			recurse(recurse, b, a)
		}(
			(recurse, lst, rem) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {__core__mkCons(__core__headList(rem), recurse(recurse, lst, __core__tailList(rem)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__slice_bytearray",
	`(self, selfLengthFn) -> {
		(start, end) -> {
			(normalize) -> {
				(fn) -> {
					fn(normalize(start))
				}(
					(start) -> {
						(fn) -> {
							fn(normalize(end))
						}(
							(end) -> {
								__core__sliceByteString(start, __core__subtractInteger(end, __helios__int__max(start, 0)), self)
							}
						)
					}
				)
			}(
				(pos) -> {
					__core__ifThenElse(
						__core__lessThanInteger(pos, 0),
						() -> {
							__core__addInteger(__core__addInteger(selfLengthFn(self), 1), pos)
						},
						() -> {
							pos
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__common__starts_with", 
	`(self, selfLengthFn) -> {
		(prefix) -> {
			(n, m) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, m),
					() -> {false},
					() -> {
						__core__equalsByteString(prefix, __core__sliceByteString(0, m, self))
					}
				)()
			}(selfLengthFn(self), __core__lengthOfByteString(prefix))
		}
	}`));
	add(new RawFunc("__helios__common__ends_with",
	`(self, selfLengthFn) -> {
		(suffix) -> {
			(n, m) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, m),
					() -> {false},
					() -> {
						__core__equalsByteString(suffix, __core__sliceByteString(__core__subtractInteger(n, m), m, self))
					}
				)()
			}(selfLengthFn(self), __core__lengthOfByteString(suffix))
		}
	}`));
	add(new RawFunc("__helios__common__fields", 
	`(self) -> {
		__core__sndPair(__core__unConstrData(self))
	}`));
	add(new RawFunc("__helios__common__field_0", 
	`(self) -> {
		__core__headList(__helios__common__fields(self))
	}`));
	add(new RawFunc("__helios__common__fields_after_0",
	`(self) -> {
		__core__tailList(__helios__common__fields(self))
	}`));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__tuple_field_0", "__core__headList"));
	add(new RawFunc("__helios__common__tuple_fields_after_0", "__core__tailList"));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__tuple_field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__tuple_fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__list_0", "__core__mkNilData(())"));
	add(new RawFunc("__helios__common__list_1", 
	`(a) -> {
		__core__mkCons(a, __helios__common__list_0)
	}`));
	for (let i = 2; i < 20; i++) {
		/**
		 * @type {string[]}
		 */
		let args = [];

		for (let j = 0; j < i; j++) {
			args.push(`arg${j.toString()}`);
		}

		let woFirst = args.slice()
		let first = assertDefined(woFirst.shift());

		add(new RawFunc(`__helios__common__list_${i.toString()}`,
	`(${args.join(", ")}) -> {
		__core__mkCons(${first}, __helios__common__list_${(i-1).toString()}(${woFirst.join(", ")}))
	}`));
	}
	add(new RawFunc(`__helios__common__hash_datum_data[${FTPP}0]`, 
	`(data) -> {
		__core__blake2b_256(${FTPP}0__serialize(data)())
	}`));


	// Global builtin functions
	add(new RawFunc("__helios__print", 
	`(msg) -> {
		__core__trace(msg, ())
	}`));
	add(new RawFunc("__helios__error",
	`(msg) -> {
		__core__trace(
			msg, 
			() -> {
				error("error thrown by user-code")
			}
		)()
	}`));
	add(new RawFunc("__helios__assert",
	`(cond, msg) -> {
		__core__ifThenElse(
			cond,
			() -> {
				()
			},
			() -> {
				__core__trace(
					msg,
					() -> {
						error("assert failed")
					}
				)()
			}
		)()
	}`));


	// Int builtins
	add(new RawFunc("__helios__int____eq", "__core__equalsInteger"));
	add(new RawFunc("__helios__int__from_data", "__core__unIData"));
	add(new RawFunc("__helios__int____to_data", "__core__iData"));
	addNeqFunc("__helios__int");
	addSerializeFunc("__helios__int");
	add(new RawFunc("__helios__int____neg",
	`(self) -> {
		__core__multiplyInteger(self, -1)
	}`));
	add(new RawFunc("__helios__int____pos", "__helios__common__identity"));
	add(new RawFunc("__helios__int____add", "__core__addInteger"));
	add(new RawFunc("__helios__int____sub", "__core__subtractInteger"));
	add(new RawFunc("__helios__int____mul", "__core__multiplyInteger"));
	add(new RawFunc("__helios__int____div", "__core__divideInteger"));
	add(new RawFunc("__helios__int____mod", "__core__modInteger"));
	add(new RawFunc("__helios__int____add1",
	`(a, b) -> {
		__core__addInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int____sub1",
	`(a, b) -> {
		__core__subtractInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int____mul1", "__helios__int____mul"));
	add(new RawFunc("__helios__int____div1",
	`(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, __helios__real__ONESQ),
			b
		)
	}`));
	add(new RawFunc("__helios__int____geq",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanInteger(a, b))
	}`));
	add(new RawFunc("__helios__int____gt",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanEqualsInteger(a, b))
	}`));
	add(new RawFunc("__helios__int____leq", "__core__lessThanEqualsInteger"));
	add(new RawFunc("__helios__int____lt", "__core__lessThanInteger"));
	add(new RawFunc("__helios__int____geq1",
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanInteger(
				__core__multiplyInteger(a, __helios__real__ONE),
				b
			)
		)
	}`));
	add(new RawFunc("__helios__int____gt1",
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanEqualsInteger(
				__core__multiplyInteger(a, __helios__real__ONE),
				b
			)
		)
	}`));
	add(new RawFunc("__helios__int____leq1",
	`(a, b) -> {
		__core__lessThanEqualsInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int____lt1",
	`(a, b) -> {
		__core__lessThanInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int__min",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			a,
			b
		)
	}`));
	add(new RawFunc("__helios__int__max",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			b,
			a
		)
	}`));
	add(new RawFunc("__helios__int__bound_min",
	`(self) -> {
		(other) -> {
			__helios__int__max(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound_max",
	`(self) -> {
		(other) -> {
			__helios__int__min(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound",
	`(self) -> {
		(min, max) -> {
			__helios__int__max(__helios__int__min(self, max), min)
		}
	}`));
	add(new RawFunc("__helios__int__abs",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__core__multiplyInteger(self, -1)
				},
				() -> {
					self
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__encode_zigzag",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__core__subtractInteger(__core__multiplyInteger(self, -2), 1)
				},
				() -> {
					__core__multiplyInteger(self, 2)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__decode_zigzag",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					error("expected positive int")
				},
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(__core__modInteger(self, 2), 0),
						() -> {
							__core__divideInteger(self, 2)
						},
						() -> {
							__core__divideInteger(__core__addInteger(self, 1), -2)
						}
					)()
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__to_bool",
	`(self) -> {
		() -> {
			__core__ifThenElse(__core__equalsInteger(self, 0), false, true)
		}
	}`));
	add(new RawFunc("__helios__int__to_real",
	`(self) -> {
		() -> {
			__core__multiplyInteger(self, __helios__real__ONE)
		}
	}`));
	add(new RawFunc("__helios__int__to_hex",
	`(self) -> {
		() -> {
			(recurse) -> {
				__core__decodeUtf8(
					__core__ifThenElse(
						__core__lessThanInteger(self, 0),
						() -> {
							__core__consByteString(
								45,
								recurse(recurse, __core__multiplyInteger(self, -1), #)
							)
						},
						() -> {
							recurse(recurse, self, #)
						}
					)()
				)
			}(
				(recurse, self, bytes) -> {
					(digit) -> {
						(bytes) -> {
							__core__ifThenElse(
								__core__lessThanInteger(self, 16),
								() -> {bytes},
								() -> {
									recurse(recurse, __core__divideInteger(self, 16), bytes)
								}
							)()
						}(
							__core__consByteString(
								__core__ifThenElse(
									__core__lessThanInteger(digit, 10), 
									__core__addInteger(digit, 48), 
									__core__addInteger(digit, 87)
								), 
								bytes
							)
						)
					}(__core__modInteger(self, 16))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__common__BASE58_ALPHABET", "#31323334353637383941424344454647484a4b4c4d4e505152535455565758595a6162636465666768696a6b6d6e6f707172737475767778797a"))
	add(new RawFunc("__helios__int__to_base58",
	`(self) -> {
		() -> {
			__core__decodeUtf8(
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						error("expected positive number")
					},
					() -> {
						(recurse) -> {
							recurse(recurse, self, #)
						}(
							(recurse, self, bytes) -> {
								(digit) -> {
									(bytes) -> {
										__core__ifThenElse(
											__core__lessThanInteger(self, 58),
											() -> {
												bytes
											},
											() -> {
												recurse(recurse, __core__divideInteger(self, 58), bytes)
											}
										)()
									}(
										__core__consByteString(
											__core__indexByteString(__helios__common__BASE58_ALPHABET, digit),
											bytes
										)
									)
								}(__core__modInteger(self, 58))
							}
						)
					}
				)()
			)
		}
	}`));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_1", "#ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000102030405060708ffffffffffff"));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_2", "#ff090a0b0c0d0e0f10ff1112131415ff161718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f30313233343536373839ffffffffff"));
	add(new RawFunc("__helios__int__invert_base58_char", 
	`(char) -> {
		(digit) -> {
			__core__ifThenElse(
				__core__equalsInteger(digit, 0xff),
				() -> {
					error("invalid base58 character")
				},
				() -> {
					digit
				}
			)()
		}(
			__core__ifThenElse(
				__core__lessThanInteger(char, 64),
				() -> {
					__core__indexByteString(__helios__int__BASE58_INVERSE_ALPHABET_1, char)
				},
				() -> {
					__core__ifThenElse(
						__core__lessThanInteger(char, 128),
						() -> {
							__core__indexByteString(
								__helios__int__BASE58_INVERSE_ALPHABET_2,
								__core__subtractInteger(char, 64)
							)
						},
						() -> {
							0xff
						}
					)()
				}
			)()
		)
	}`));
	add(new RawFunc("__helios__int__from_base58",
	`(str) -> {
		(bytes) -> {
			(n) -> {
				(recurse) -> {
					recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
				}(
					(recurse, acc, pow, i) -> {
						__core__ifThenElse(
							__core__equalsInteger(i, -1),
							() -> {
								acc
							},
							() -> {
								(new_acc) -> {
									recurse(recurse, new_acc, __core__multiplyInteger(pow, 58), __core__subtractInteger(i, 1))
								}(
									__core__addInteger(
										acc,
										__core__multiplyInteger(
											__helios__int__invert_base58_char(
												__core__indexByteString(bytes, i)
											),
											pow
										)
									)
								)
							}
						)()
					}
				)
			}(__core__lengthOfByteString(bytes))
		}(__core__encodeUtf8(str))
	}`));
	add(new RawFunc("__helios__int__show_digit",
	`(x) -> {
		__core__addInteger(__core__modInteger(x, 10), 48)
	}`));
	add(new RawFunc("__helios__int__show",
	`(self) -> {
		() -> {
			__core__decodeUtf8(
				(recurse) -> {
					__core__ifThenElse(
						__core__lessThanInteger(self, 0),
						() -> {__core__consByteString(45, recurse(recurse, __core__multiplyInteger(self, -1), #))},
						() -> {recurse(recurse, self, #)}
					)()
				}(
					(recurse, i, bytes) -> {
						(bytes) -> {
							__core__ifThenElse(
								__core__lessThanInteger(i, 10),
								() -> {
									bytes
								},
								() -> {
									recurse(recurse, __core__divideInteger(i, 10), bytes)
								}
							)()
						}(__core__consByteString(__helios__int__show_digit(i), bytes))
					}
				)
			)
		}
	}`));
	// not exposed, assumes positive number
	add(new RawFunc("__helios__int__show_padded",
	`(self, n) -> {
		(recurse) -> {
			recurse(recurse, self, 0, #)
		}(
			(recurse, x, pos, bytes) -> {
				__core__ifThenElse(
					__core__lessThanInteger(x, 10),
					() -> {
						__core__ifThenElse(
							__core__lessThanEqualsInteger(n, pos),
							() -> {
								bytes
							},
							() -> {
								recurse(
									recurse,
									0,
									__core__addInteger(pos, 1),
									__core__consByteString(48, bytes)
								)
							}
						)()
					},
					() -> {
						recurse(
							recurse,
							__core__divideInteger(x, 10),
							__core__addInteger(pos, 1),
							__core__consByteString(__helios__int__show_digit(x), bytes)
						)
					}
				)()
			}
		)
	}`));
	
	add(new RawFunc("__helios__int__parse_digit",
	`(digit) -> {
		__core__ifThenElse(
			__core__lessThanEqualsInteger(digit, 57),
			() -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(48, digit),
					() -> {
						__core__subtractInteger(digit, 48)
					},
					() -> {
						error("not a digit")
					}
				)()
			},
			() -> {
				error("not a digit")
			}
		)()
	}`));
	add(new RawFunc("__helios__int__parse",
	`(string) -> {
		(bytes) -> {
			(n, b0) -> {
				(recurse) -> {
					__core__ifThenElse(
						__core__equalsInteger(b0, 48),
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(n, 1),
								() -> {
									0
								},
								() -> {
									error("zero padded integer can't be parsed")
								}
							)()
						},
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(b0, 45),
								() -> {
									__core__ifThenElse(
										__core__equalsInteger(__core__indexByteString(bytes, 1), 48),
										() -> {
											error("-0 not allowed")
										},
										() -> {
											__core__multiplyInteger(
												recurse(recurse, 0, 1),
												-1
											)
										}
									)()
								},
								() -> {
									recurse(recurse, 0, 0)
								}
							)()
						}
					)()
				}(
					(recurse, acc, i) -> {
						__core__ifThenElse(
							__core__equalsInteger(i, n),
							() -> {
								acc
							},
							() -> {
								(new_acc) -> {
									recurse(recurse, new_acc, __core__addInteger(i, 1))
								}(
									__core__addInteger(
										__core__multiplyInteger(acc, 10), 
										__helios__int__parse_digit(__core__indexByteString(bytes, i))
									)
								)
							}
						)()
					}
				)
			}(__core__lengthOfByteString(bytes), __core__indexByteString(bytes, 0))
		}(__core__encodeUtf8(string))
	}`));
	add(new RawFunc("__helios__int__from_big_endian",
	`(bytes) -> {
		(n) -> {
			(recurse) -> {
				recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
			}(
				(recurse, acc, pow, i) -> {
					__core__ifThenElse(
						__core__equalsInteger(i, -1),
						() -> {
							acc
						},
						() -> {
							(new_acc) -> {
								recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__subtractInteger(i, 1))
							}(
								__core__addInteger(
									acc,
									__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
								)
							)
						}
					)()
				}
			)
		}(__core__lengthOfByteString(bytes))
	}`));
	add(new RawFunc("__helios__int__from_little_endian", 
	`(bytes) -> {
		(n) -> {
			(recurse) -> {
				recurse(recurse, 0, 1, 0)
			}(
				(recurse, acc, pow, i) -> {
					__core__ifThenElse(
						__core__equalsInteger(i, n),
						() -> {
							acc
						},
						() -> {
							(new_acc) -> {
								recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__addInteger(i, 1))
							}(
								__core__addInteger(
									acc,
									__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
								)
							)
						}
					)()
				}
			)
		}(__core__lengthOfByteString(bytes))
	}`));
	add(new RawFunc("__helios__int__to_big_endian",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					error("can't convert negative number to big endian bytearray")
				},
				() -> {
					(recurse) -> {
						recurse(recurse, self, #)
					}(
						(recurse, self, bytes) -> {
							(bytes) -> {
								__core__ifThenElse(
									__core__lessThanInteger(self, 256),
									() -> {
										bytes
									},
									() -> {
										recurse(
											recurse,
											__core__divideInteger(self, 256),
											bytes
										)
									}
								)()
							}(__core__consByteString(self, bytes))
						}
					)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__to_little_endian",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					error("can't convert negative number to big endian bytearray")
				},
				() -> {
					(recurse) -> {
						recurse(recurse, self)
					}(
						(recurse, self) -> {
							__core__consByteString(self,
								__core__ifThenElse(
									__core__lessThanInteger(self, 256),
									() -> {
										#
									},
									() -> {
										recurse(recurse, __core__divideInteger(self, 256))
									}
								)()
							)
						}
					)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__sqrt",
	`(x) -> {
		__core__ifThenElse(
			__core__lessThanInteger(x, 2),
			() -> {
				__core__ifThenElse(
					__core__equalsInteger(x, 1),
					() -> {
						1
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(x, 0),
							() -> {
								0
							},
							() -> {
								error("negative number in sqrt")
							}
						)()
					}
				)()
			},
			() -> {
				(recurse) -> {
					recurse(recurse, __core__divideInteger(x, 2))
				}(
					(recurse, x0) -> {
						(x1) -> {
							__core__ifThenElse(
								__core__lessThanEqualsInteger(x0, x1),
								() -> {
									x0
								},
								() -> {
									recurse(recurse, x1)
								}
							)()
						}(
							__core__divideInteger(
								__core__addInteger(
									x0,
									__core__divideInteger(x, x0)
								),
								2
							)
						)
					}
				)
			}
		)()
	}`));


	// Real builtins
	addIntLikeFuncs("__helios__real");
	add(new RawFunc("__helios__real__PRECISION", REAL_PRECISION.toString()));
	add(new RawFunc("__helios__real__ONE", '1' + new Array(REAL_PRECISION).fill('0').join('')));
	add(new RawFunc("__helios__real__HALF", '5' + new Array(REAL_PRECISION-1).fill('0').join('')));
	add(new RawFunc("__helios__real__NEARLY_ONE", new Array(REAL_PRECISION).fill('9').join('')));
	add(new RawFunc("__helios__real__ONESQ", '1' + new Array(REAL_PRECISION*2).fill('0').join('')));
	add(new RawFunc("__helios__real____neg", "__helios__int____neg"));
	add(new RawFunc("__helios__real____pos", "__helios__int____pos"));
	add(new RawFunc("__helios__real____add", "__helios__int____add"));
	add(new RawFunc("__helios__real____add1", 
	`(a, b) -> {
		__core__addInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real____sub", "__helios__int____sub"));
	add(new RawFunc("__helios__real____sub1", 
	`(a, b) -> {
		__core__subtractInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real____mul",
	`(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, b),
			__helios__real__ONE
		)
	}`));
	add(new RawFunc("__helios__real____mul1", "__helios__int____mul"));
	add(new RawFunc("__helios__real____div",
	`(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__real____div1", "__helios__int____div"));
	add(new RawFunc("__helios__real____geq", "__helios__int____geq"));
	add(new RawFunc("__helios__real____gt", "__helios__int____gt"));
	add(new RawFunc("__helios__real____leq", "__helios__int____leq"));
	add(new RawFunc("__helios__real____lt", "__helios__int____lt"));
	add(new RawFunc("__helios__real____eq1",
	`(a, b) -> {
		__core__equalsInteger(a,
			__core__multiplyInteger(
				b,
				__helios__real__ONE
			)
		)
	}`));
	add(new RawFunc("__helios__real____neq1",
	`(a, b) -> {
		__helios__bool____not(
			__core__equalsInteger(
				a,
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`));
	add(new RawFunc("__helios__real____geq1", 
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanInteger(
				a,
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`));
	add(new RawFunc("__helios__real____gt1", 
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanEqualsInteger(
				a, 
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`));
	add(new RawFunc("__helios__real____leq1",
	`(a, b) -> {
		__core__lessThanEqualsInteger(
			a, 
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real____lt1", 
	`(a, b) -> {
		__core__lessThanInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real__abs", "__helios__int__abs"));
	add(new RawFunc("__helios__real__sqrt", 
	`(self) -> {
		__helios__int__sqrt(
			__helios__int____mul(self, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real__floor", 
	`(self) -> {
		() -> {
			__core__divideInteger(self, __helios__real__ONE)
		}
	}`));
	add(new RawFunc("__helios__real__trunc",
	`(self) -> {
		() -> {
			__core__quotientInteger(self, __helios__real__ONE)
		}
	}`));
	add(new RawFunc("__helios__real__ceil",
	`(self) -> {
		() -> {
			__core__divideInteger(
				__core__addInteger(self, __helios__real__NEARLY_ONE),
				__helios__real__ONE
			)
		}
	}`));
	add(new RawFunc("__helios__real__round",
	`(self) -> {
		() -> {
			__core__divideInteger(
				__core__addInteger(self, __helios__real__HALF),
				__helios__real__ONE
			)
		}
	}`));
	add(new RawFunc("__helios__real__show",
	`(self) -> {
		() -> {
			__helios__string____add(
				__helios__string____add(
					__core__ifThenElse(__core__lessThanInteger(0, self), "-", ""),
					__helios__int__show(
						__helios__real__floor(
							__helios__real__abs(self)()
						)()
					)(),
				),
				__helios__string____add(
					".",
					__helios__int__show_padded(
						__helios__int____mod(self, __helios__real__ONE),
						__helios__real__PRECISION
					)
				)
			)
		}
	}`));


	// Bool builtins
	addSerializeFunc("__helios__bool");
	add(new RawFunc("__helios__bool____eq", 
	`(a, b) -> {
		__core__ifThenElse(a, b, __helios__bool____not(b))
	}`));
	add(new RawFunc("__helios__bool____neq",
	`(a, b) -> {
		__core__ifThenElse(a, __helios__bool____not(b), b)
	}`));
	add(new RawFunc("__helios__bool__from_data", 
	`(d) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(d)), 0), 
			false, 
			true
		)
	}`));
	add(new RawFunc("__helios__bool____to_data",  
	`(b) -> {
		__core__constrData(__core__ifThenElse(b, 1, 0), __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__bool__and",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {b()}, 
			() -> {false}
		)()
	}`));
	add(new RawFunc("__helios__bool__or",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {true},
			() -> {b()}
		)()
	}`));
	add(new RawFunc("__helios__bool____not", 
	`(b) -> {
		__core__ifThenElse(b, false, true)
	}`));
	add(new RawFunc("__helios__bool__to_int",
	`(self) -> {
		() -> {
			__core__ifThenElse(self, 1, 0)
		}
	}`));
	add(new RawFunc("__helios__bool__show",
	`(self) -> {
		() -> {
			__core__ifThenElse(self, "true", "false")
		}
	}`));
	add(new RawFunc("__helios__bool__trace",
	`(self) -> {
		(prefix) -> {
			__core__trace(
				__helios__string____add(
					prefix,
					__helios__bool__show(self)()
				), 
				self
			)
		}
	}`));


	// String builtins
	addSerializeFunc("__helios__string");
	addNeqFunc("__helios__string");
	add(new RawFunc("__helios__string____eq", "__core__equalsString"));
	add(new RawFunc("__helios__string__from_data", 
	`(d) -> {
		__core__decodeUtf8(__core__unBData(d))
	}`));
	add(new RawFunc("__helios__string____to_data", 
	`(s) -> {
		__core__bData(__core__encodeUtf8(s))
	}`));
	add(new RawFunc("__helios__string____add", "__core__appendString"));
	add(new RawFunc("__helios__string__starts_with", 
	`(self) -> {
		(prefix) -> {
			__helios__bytearray__starts_with(
				__core__encodeUtf8(self)
			)(__core__encodeUtf8(prefix))
		}
	}`));
	add(new RawFunc("__helios__string__ends_with", 
	`(self) -> {
		(suffix) -> {
			__helios__bytearray__ends_with(
				__core__encodeUtf8(self)
			)(__core__encodeUtf8(suffix))
		}
	}`));
	add(new RawFunc("__helios__string__encode_utf8",
	`(self) -> {
		() -> {
			__core__encodeUtf8(self)
		}
	}`));


	// ByteArray builtins
	addSerializeFunc("__helios__bytearray");
	addNeqFunc("__helios__bytearray");
	add(new RawFunc("__helios__bytearray____eq", "__core__equalsByteString"));
	add(new RawFunc("__helios__bytearray__from_data", "__core__unBData"));
	add(new RawFunc("__helios__bytearray____to_data", "__core__bData"));
	add(new RawFunc("__helios__bytearray____add", "__core__appendByteString"));
	add(new RawFunc("__helios__bytearray____geq",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanByteString(a, b))
	}`));
	add(new RawFunc("__helios__bytearray____gt",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanEqualsByteString(a, b))
	}`));
	add(new RawFunc("__helios__bytearray____leq", "__core__lessThanEqualsByteString"));
	add(new RawFunc("__helios__bytearray____lt", "__core__lessThanByteString"));
	add(new RawFunc("__helios__bytearray__length", "__core__lengthOfByteString"));
	add(new RawFunc("__helios__bytearray__slice",
	`(self) -> {
		__helios__common__slice_bytearray(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__starts_with", 
	`(self) -> {
		__helios__common__starts_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__ends_with",
	`(self) -> {
		__helios__common__ends_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__prepend", 
	`(self) -> {
		(byte) -> {
			__core__consByteString(byte, self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__sha2",
	`(self) -> {
		() -> {
			__core__sha2_256(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__sha3",
	`(self) -> {
		() -> {
			__core__sha3_256(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__blake2b",
	`(self) -> {
		() -> {
			__core__blake2b_256(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__decode_utf8",
	`(self) -> {
		() -> {
			__core__decodeUtf8(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__show",
	`(self) -> {
		() -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, self) -> {
					(n) -> {
						__core__ifThenElse(
							__core__lessThanInteger(0, n),
							() -> {
								__core__appendString(
									__core__decodeUtf8(
										(hexBytes) -> {
											__core__ifThenElse(
												__core__equalsInteger(__core__lengthOfByteString(hexBytes), 1),
												__core__consByteString(48, hexBytes),
												hexBytes
											)
										}(
											__core__encodeUtf8(
												__helios__int__to_hex(
													__core__indexByteString(self, 0)
												)()
											)
										)
									), 
									recurse(recurse, __core__sliceByteString(1, n, self))
								)
							},
							() -> {
								""
							}
						)()
					}(__core__lengthOfByteString(self))
				}
			)
		}
	}`));


	// Tuple (list of data, which is used by structs which have more than 1 field)
	addSerializeFunc("__helios__tuple");
	addNeqFunc("__helios__tuple");
	addDataLikeEqFunc("__helios__tuple");
	add(new RawFunc("__helios__tuple__from_data", "__core__unListData"));
	add(new RawFunc("__helios__tuple____to_data", "__core__listData"));


	// List builtins
	addSerializeFunc(`__helios__list[${TTPP}0]`);
	addNeqFunc(`__helios__list[${TTPP}0]`);
	addDataLikeEqFunc(`__helios__list[${TTPP}0]`);
	add(new RawFunc(`__helios__list[${TTPP}0]__from_data`, "__core__unListData"));
	add(new RawFunc(`__helios__list[${TTPP}0]____to_data`, "__core__listData"));
	add(new RawFunc(`__helios__list[${TTPP}0]__new`,
	`(n, fn) -> {
		(recurse) -> {
			recurse(recurse, 0)
		}(
			(recurse, i) -> {
				__core__ifThenElse(
					__core__lessThanInteger(i, n),
					() -> {__core__mkCons(${TTPP}0____to_data(fn(i)), recurse(recurse, __core__addInteger(i, 1)))},
					() -> {__core__mkNilData(())}
				)()
			}
		)
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__new_const`,
	`(n, item) -> {
		__helios__list[${TTPP}0]__new(n, (i) -> {item})
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]____add`, "__helios__common__concat"));
	add(new RawFunc(`__helios__list[${TTPP}0]__length`, "__helios__common__length"));
	add(new RawFunc(`__helios__list[${TTPP}0]__head`, 
	`(self) -> {
		${TTPP}0__from_data(__core__headList(self))
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__tail`, "__core__tailList"));
	add(new RawFunc(`__helios__list[${TTPP}0]__is_empty`,
	`(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__get`,
	`(self) -> {
		(index) -> {
			${TTPP}0__from_data(__helios__list[__helios__data]__get(self)(index))
		}
	}`));
	add(new RawFunc("__helios__list[__helios__data]__get",
	`(self) -> {
		(index) -> {
			(recurse) -> {
				recurse(recurse, self, index)
			}(
				(recurse, self, index) -> {
					__core__chooseList(
						self, 
						() -> {error("index out of range")}, 
						() -> {__core__ifThenElse(
							__core__lessThanInteger(index, 0), 
							() -> {error("index out of range")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(index, 0), 
									() -> {__core__headList(self)}, 
									() -> {recurse(recurse, __core__tailList(self), __core__subtractInteger(index, 1))}
								)()
							}
						)()}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__get_singleton`,
	`(self) -> {
		() -> {
			${TTPP}0__from_data(
				__helios__list[__helios__data]__get_singleton(self)()
			)
		}
	}`));
	add(new RawFunc("__helios__list[__helios__data]__get_singleton",
	`(self) -> {
		() -> {
			__core__chooseUnit(
				__helios__assert(
					__core__nullList(__core__tailList(self)),
					"not a singleton list"
				),
				__core__headList(self)
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__drop`, "__helios__list[__helios__data]__drop"));
	add(new RawFunc("__helios__list[__helios__data]__drop",
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in drop")
					},
					() -> {
						recurse(recurse, self, n)
					}
				)()
			}(
				(recurse, lst, n) -> {
					__core__ifThenElse(
						__core__equalsInteger(n, 0),
						() -> {
							lst
						},
						() -> {
							recurse(
								recurse,
								__core__tailList(lst),
								__core__subtractInteger(n, 1)
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__drop_end`, "__helios__list[__helios__data]__drop_end"));
	add(new RawFunc("__helios__list[__helios__data]__drop_end",
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in drop_end")
					},
					() -> {
						recurse(recurse, self)(
							(count, result) -> {
								__core__ifThenElse(
									__core__lessThanInteger(count, n),
									() -> {
										error("list too short")
									},
									() -> {
										result
									}
								)()
							}
						)
					}
				)()
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							(callback) -> {callback(0, lst)}
						},
						() -> {
							recurse(recurse, __core__tailList(lst))(
								(count, result) -> {
									__core__ifThenElse(
										__core__equalsInteger(count, n),
										() -> {
											(callback) -> {
												callback(
													count,
													__core__mkCons(
														__core__headList(lst), 
														result
													)
												)
											}
										},
										() -> {
											(callback) -> {
												callback(
													__core__addInteger(count, 1),
													result
												)
											}
										}
									)()
								}
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__take`, "__helios__list[__helios__data]__take"));
	add(new RawFunc("__helios__list[__helios__data]__take",
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in take")
					},
					() -> {
						recurse(recurse, self, n)
					}
				)()
			}(
				(recurse, lst, n) -> {
					__core__ifThenElse(
						__core__equalsInteger(n, 0),
						() -> {
							__core__mkNilData(())
						},
						() -> {
							__core__mkCons(
								__core__headList(lst),
								recurse(
									recurse,
									__core__tailList(lst),
									__core__subtractInteger(n, 1)
								)
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__take_end`, "__helios__list[__helios__data]__take_end"));
	add(new RawFunc(`__helios__list[__helios__data]__take_end`,
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in take_end")
					},
					() -> {
						recurse(recurse, self)(
							(count, result) -> {
								__core__ifThenElse(
									__core__lessThanInteger(count, n),
									() -> {
										error("list too short")
									},
									() -> {
										result
									}
								)()
							}
						)
					}
				)()
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							(callback) -> {callback(0, lst)}
						},
						() -> {
							recurse(recurse, __core__tailList(lst))(
								(count, tail) -> {
									__core__ifThenElse(
										__core__equalsInteger(count, n),
										() -> {
											(callback) -> {callback(count, tail)}
										},
										() -> {
											(callback) -> {
												callback(
													__core__addInteger(count, 1),
													lst
												)
											}
										}
									)()
								}
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__any`,
	`(self) -> {
		(fn) -> {
			__helios__common__any(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__all`,
	`(self) -> {
		(fn) -> {
			__helios__common__all(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__prepend`,
	`(self) -> {
		(item) -> {
			__core__mkCons(${TTPP}0____to_data(item), self)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__find`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst, 
						() -> {error("not found")}, 
						() -> {
							(item) -> {
								__core__ifThenElse(
									fn(item), 
									() -> {item}, 
									() -> {recurse(recurse, __core__tailList(lst))}
								)()
							}(${TTPP}0__from_data(__core__headList(lst)))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__find_safe`,
	`(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(item) -> {
					fn(${TTPP}0__from_data(item))
				},
				__helios__common__identity
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__filter`,
	`(self) -> {
		(fn) -> {
			__helios__common__filter_list(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__for_each`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							()
						},
						() -> {
							__core__chooseUnit(
								fn(${TTPP}0__from_data(__core__headList(lst))),
								recurse(recurse, __core__tailList(lst))
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__fold[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold(
				self, 
				(prev, item) -> {
					fn(prev, ${TTPP}0__from_data(item))
				}, 
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__fold_lazy[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold_lazy(
				self, 
				(item, next) -> {
					fn(${TTPP}0__from_data(item), next)
				},
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__map[${FTPP}0]`,
	`(self) -> {
		(fn) -> {
			__helios__common__map(
				self, 
				(item) -> {
					${FTPP}0____to_data(fn(${TTPP}0__from_data(item)))
				}, 
				__core__mkNilData(())
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__sort`,
	`(self) -> {
		(comp) -> {
			__helios__common__sort(
				self, 
				(a, b) -> {
					comp(${TTPP}0__from_data(a), ${TTPP}0__from_data(b))
				}
			)
		}
	}`));


	// List specials
	add(new RawFunc("__helios__list[__helios__int]__sum",
	`(self) -> {
		() -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							0
						},
						() -> {
							__core__addInteger(		
								__core__unIData(__core__headList(lst)),
								recurse(recurse, __core__tailList(lst))
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__list[__helios__real]__sum", "__helios__list[__helios__int]__sum"));
	add(new RawFunc("__helios__list[__helios__string]__join",
	`(self) -> {
		(__useopt__separator, separator) -> {
			(separator) -> {
				(recurse) -> {
					recurse(recurse, self, "")
				}(
					(recurse, lst, sep) -> {
						__core__chooseList(
							lst,
							() -> {
								""
							},
							() -> {
								__helios__string____add(
									__helios__string____add(
										sep,
										__helios__string__from_data(__core__headList(lst))
									),
									recurse(recurse, __core__tailList(lst), separator)
								)
							}
						)()
					}
				)
			}(__core__ifThenElse(__useopt__separator, separator, ""))
		}
	}`));
	add(new RawFunc("__helios__list[__helios__bytearray]__join",
	`(self) -> {
		(__useopt__separator, separator) -> {
			(separator) -> {
				(recurse) -> {
					recurse(recurse, self, #)
				}(
					(recurse, lst, sep) -> {
						__core__chooseList(
							lst,
							() -> {
								#
							},
							() -> {
								__helios__bytearray____add(
									__helios__bytearray____add(
										sep,
										__core__unBData(__core__headList(lst))
									),
									recurse(recurse, __core__tailList(lst), separator)
								)
							}
						)()
					}
				)
			}(__core__ifThenElse(__useopt__separator, separator, #))
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__flatten`,
	`(self) -> {
		() -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							__core__mkNilData(())
						},
						() -> {
							__helios__list[${TTPP}0]____add(
								__core__unListData(__core__headList(lst)),
								recurse(recurse, __core__tailList(lst))
							)
						}
					)()
				}
			)
		}
	}`));
	

	// Map builtins
	addSerializeFunc(`__helios__map[${TTPP}0@${TTPP}1]`);
	addNeqFunc(`__helios__map[${TTPP}0@${TTPP}1]`);
	addDataLikeEqFunc(`__helios__map[${TTPP}0@${TTPP}1]`);
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__from_data`, "__core__unMapData"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]____to_data`, "__core__mapData"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]____add`, "__helios__common__concat"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__prepend`,
	`(self) -> {
		(key, value) -> {
			__core__mkCons(__core__mkPairData(${TTPP}0____to_data(key), ${TTPP}1____to_data(value)), self)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__head`,
	`(self) -> {
		(head) -> {
			() -> {
				(callback) -> {
					callback(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head)))
				}
			}
		}(__core__headList(self))
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__head_key`,
	`(self) -> {
		${TTPP}0__from_data(__core__fstPair(__core__headList(self)))
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__head_value`,
	`(self) -> {
		${TTPP}1__from_data(__core__sndPair(__core__headList(self)))
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__length`,
	`(self) -> {
		__helios__common__length(self)
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__tail`, "__core__tailList"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__is_empty`,
	`(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__get`,
	`(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				${TTPP}0____to_data(key), 
				(x) -> {${TTPP}1__from_data(x)}, 
				() -> {error("key not found")}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__get_safe`,
	`(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				${TTPP}0____to_data(key), 
				(x) -> {
					__core__constrData(0, __helios__common__list_1(x))
				}, 
				() -> {
					__core__constrData(1, __helios__common__list_0)
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__all`,
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__common__all(self, fn)
			}(
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__any`,
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__common__any(self, fn)
			}(
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__delete`,
	`(self) -> {
		(key) -> {
			(key) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {self},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {recurse(recurse, tail)},
										() -> {__core__mkCons(head, recurse(recurse, tail))}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}(${TTPP}0____to_data(key))
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__filter`,
	`(self) -> {
		(fn) -> {
			__helios__common__filter_map(
				self, 
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, self) -> {
					__core__chooseList(
						self, 
						() -> {error("not found")}, 
						() -> {
							(head) -> {
								(key, value) -> {
									__core__ifThenElse(
										fn(key, value), 
										() -> {
											(callback) -> {
												callback(key, value)
											}
										}, 
										() -> {
											recurse(recurse, __core__tailList(self))
										}
									)()
								}(
									${TTPP}0__from_data(__core__fstPair(head)), 
									${TTPP}1__from_data(__core__sndPair(head))
								)
							}(__core__headList(self))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_safe`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self, fn)
			}(
				(recurse, self, fn) -> {
					__core__chooseList(
						self, 
						() -> {
							(callback) -> {
								callback(() -> {error("not found")}, false)
							}
						}, 
						() -> {
							(head) -> {
								(key, value) -> {
									__core__ifThenElse(
										fn(key, value), 
										() -> {
											(callback) -> {
												callback(
													() -> {
														(callback) -> {
															callback(key, value)
														}
													},
													true
												)
											}
										}, 
										() -> {
											recurse(recurse, __core__tailList(self), fn)
										}
									)()
								}(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head)))
							}(__core__headList(self))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_key`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, map) -> {
					__core__chooseList(
						map, 
						() -> {error("not found")}, 
						() -> {
							(item) -> {
								__core__ifThenElse(
									fn(item), 
									() -> {item}, 
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}(${TTPP}0__from_data(__core__fstPair(__core__headList(map))))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_key_safe`,
	`(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)))
				},
				__core__fstPair
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_value`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, map) -> {
					__core__chooseList(
						map, 
						() -> {error("not found")}, 
						() -> {
							(item) -> {
								__core__ifThenElse(
									fn(item), 
									() -> {item}, 
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}(${TTPP}1__from_data(__core__sndPair(__core__headList(map))))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_value_safe`,
	`(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(pair) -> {
					fn(${TTPP}1__from_data(__core__sndPair(pair)))
				},
				__core__sndPair
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__map[${FTPP}0@${FTPP}1]`,
	`(self) -> {
		(fn) -> {
			__helios__common__map(
				self,
				(pair) -> {
					(mapped_pair) -> {
						mapped_pair(
							(key, value) -> {
								__core__mkPairData(${FTPP}0____to_data(key), ${FTPP}1____to_data(value))
							}
						)
					}(fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair))))
				}, 
				__core__mkNilPairData(())
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__fold[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold(self,
				(z, pair) -> {
					fn(z, ${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}, 
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__fold_lazy[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold_lazy(self, 
				(pair, next) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)), next)
				}, 
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__for_each`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, map) -> {
					__core__chooseList(
						map,
						() -> {
							()
						},
						() -> {
							(head) -> {
								__core__chooseUnit(
									fn(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head))),
									recurse(recurse, __core__tailList(map))
								)
							}(__core__headList(map))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__set`, 
	`(self) -> {
		(key, value) -> {
			(key, value) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {
								__core__mkCons(__core__mkPairData(key, value), __core__mkNilPairData(()))
							},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {
											__core__mkCons(__core__mkPairData(key, value), tail)
										},
										() -> {
											__core__mkCons(head, recurse(recurse, tail))
										}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}(${TTPP}0____to_data(key), ${TTPP}1____to_data(value))
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__update`,
	`(self) -> {
		(key, fn) -> {
			(key) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {
								error("key not found")
							},
							() -> {
								(pair) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(pair)),
										() -> {
											__core__mkCons(
												__core__mkPairData(
													key,
													${TTPP}1____to_data(fn(${TTPP}1__from_data(__core__sndPair(pair))))
												),
												__core__tailList(map)
											)
										},
										() -> {
											__core__mkCons(pair, recurse(recurse, __core__tailList(map)))
										}
									)()
								}(__core__headList(map))
							}
						)()
					}
				)
			}(${TTPP}0____to_data(key))
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__update_safe`,
	`(self) -> {
		(key, fn) -> {
			(key) -> {
				__helios__common__map(
					self,
					(pair) -> {
						(oldKey, oldValue) -> {
							(newValue) -> {
								__core__mkPairData(oldKey, newValue)
							}(
								__core__ifThenElse(
									__core__equalsData(oldKey, key),
									() -> {
										${TTPP}1____to_data(fn(${TTPP}1__from_data(oldValue)))
									},
									() -> {
										oldValue
									}
								)()
							)
						}(__core__fstPair(pair), __core__sndPair(pair))
					}, 
					__core__mkNilPairData(())
				)
			}(${TTPP}0____to_data(key))
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__sort`,
	`(self) -> {
		(comp) -> {
			__helios__common__sort(
				self, 
				(a, b) -> {
					comp(
						${TTPP}0__from_data(__core__fstPair(a)), 
						${TTPP}1__from_data(__core__sndPair(a)), 
						${TTPP}0__from_data(__core__fstPair(b)),
						${TTPP}1__from_data(__core__sndPair(b))
					)
				}
			)
		}
	}`));


	// Option[T] builtins
	addDataFuncs(`__helios__option[${TTPP}0]`);
	add(new RawFunc(`__helios__option[${TTPP}0]__map[${FTPP}0]`, 
	`(self) -> {
		(fn) -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 0),
					() -> {
						__helios__option[${FTPP}0]__some__new(
							fn(
								${TTPP}0__from_data(
									__core__headList(__core__sndPair(pair))
								)
							)
						)
					},
					() -> {
						__helios__option[${FTPP}0]__none__new()
					}
				)()
			}(__core__unConstrData(self))
		}
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__unwrap`, 
	`(self) -> {
		() -> {
			${TTPP}0__from_data(__helios__common__field_0(self))
		}
	}`));


	// Option[T]::Some
	addEnumDataFuncs(`__helios__option[${TTPP}0]__some`, 0);
	add(new RawFunc(`__helios__option[${TTPP}0]__some____new`,
	`(some) -> {
		__core__constrData(0, __helios__common__list_1(${TTPP}0____to_data(some)))
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__some__new`, `__helios__option[${TTPP}0]__some____new`));
	add(new RawFunc(`__helios__option[${TTPP}0]__some__cast`,
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__some__some`, 
	`(self) -> {
		${TTPP}0__from_data(__helios__common__field_0(self))
	}`));
	

	// Option[T]::None
	addEnumDataFuncs(`__helios__option[${TTPP}0]__none`, 1);
	add(new RawFunc("__helios__option__NONE", "__core__constrData(1, __helios__common__list_0)"));
	add(new RawFunc(`__helios__option[${TTPP}0]__none____new`,
	`() -> {
		__helios__option__NONE
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__none__new`, `__helios__option[${TTPP}0]__none____new`));
	add(new RawFunc(`__helios__option[${TTPP}0]__none__cast`,
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));

	
	for (let hash of ["pubkeyhash", "validatorhash", "mintingpolicyhash", "stakingvalidatorhash", "datumhash", "stakekeyhash"]) {
	// Hash builtins
		addByteArrayLikeFuncs(`__helios__${hash}`);
		add(new RawFunc(`__helios__${hash}__from_script_hash`, "__helios__common__identity"));
	}

	
	// ScriptHash builtin
	addByteArrayLikeFuncs("__helios__scripthash");


	// PubKey builtin
	addByteArrayLikeFuncs("__helios__pubkey");
	add(new RawFunc("__helios__pubkey__verify", 
	`(self) -> {
		(message, signature) -> {
			__core__verifyEd25519Signature(self, message, signature)
		}
	}`));


	// ScriptContext builtins
	addDataFuncs("__helios__scriptcontext");
	add(new RawFunc("__helios__scriptcontext__new_spending",
	`(tx, output_id) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(1, __helios__common__list_1(output_id))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_minting",
	`(tx, mph) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(
				0, 
				__helios__common__list_1(
					__helios__mintingpolicyhash____to_data(mph)
				)
			)
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_rewarding",
	`(tx, cred) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(2, __helios__common__list_1(cred))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_certifying",
	`(tx, dcert) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(3, __helios__common__list_1(dcert))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__tx", "__helios__common__field_0"));
	add(new RawFunc("__helios__scriptcontext__purpose", "__helios__common__field_1"));
	add(new RawFunc("__helios__scriptcontext__get_current_input",
	`(self) -> {
		() -> {
			(id) -> {
				(recurse) -> {
					recurse(recurse, __helios__tx__inputs(__helios__scriptcontext__tx(self)))
				}(
					(recurse, lst) -> {
						__core__chooseList(
							lst, 
							() -> {error("not found")}, 
							() -> {
								(item) -> {
									__core__ifThenElse(
										__core__equalsData(__helios__txinput__output_id(item), id), 
										() -> {item}, 
										() -> {recurse(recurse, __core__tailList(lst))}
									)()
								}(__core__headList(lst))
							}
						)()
					}
				)
			}(__helios__scriptcontext__get_spending_purpose_output_id(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_cont_outputs",
	`(self) -> {
		() -> {
			(vh) -> {
				(outputs) -> {
					__helios__common__filter_list(
						outputs,
						(output) -> {
							(credential) -> {
								(pair) -> {
									__core__ifThenElse(
										__core__equalsInteger(__core__fstPair(pair), 0),
										() -> {
											false
										},
										() -> {
											__core__equalsByteString(__core__unBData(__core__headList(__core__sndPair(pair))), vh)
										}
									)()
								}(__core__unConstrData(credential))
							}(__helios__address__credential(__helios__txoutput__address(output)))
						}
					)
				}(__helios__tx__outputs(__helios__scriptcontext__tx(self)))
			}(__helios__scriptcontext__get_current_validator_hash(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_spending_purpose_output_id",
	`(self) -> {
		() -> {
			__helios__common__field_0(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_validator_hash",
	`(self) -> {
		() -> {
			__helios__credential__validator__hash(
				__helios__credential__validator__cast(
					__helios__address__credential(
						__helios__txoutput__address(
							__helios__txinput__output(
								__helios__scriptcontext__get_current_input(self)()
							)
						)
					)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_minting_policy_hash", 
	`(self) -> {
		() -> {
			__helios__mintingpolicyhash__from_data(__helios__scriptcontext__get_spending_purpose_output_id(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_staking_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_script_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));


	// StakingPurpose builtins
	addDataFuncs("__helios__stakingpurpose");


	// StakingPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__stakingpurpose__rewarding", 2);
	add(new RawFunc("__helios__stakingpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// StakingPurpose::Certifying builtins
	addEnumDataFuncs("__helios__stakingpurpose__certifying", 3);
	add(new RawFunc("__helios__stakingpurpose__certifying__dcert", "__helios__common__field_0"));


	// ScriptPurpose builtins
	addDataFuncs("__helios__scriptpurpose");
	add(new RawFunc("__helios__scriptpurpose__new_minting",
	`(mph) -> {
		__core__constrData(0, __helios__common__list_1(__helios__mintingpolicyhash____to_data(mph)))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_spending",
	`(output_id) -> {
		__core__constrData(1, __helios__common__list_1(output_id))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_rewarding",
	`(cred) -> {
		__core__constrData(2, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_certifying",
	`(action) -> {
		__core__constrData(3, __helios__common__list_1(action))
	}`));


	// ScriptPurpose::Minting builtins
	addEnumDataFuncs("__helios__scriptpurpose__minting", 0);
	add(new RawFunc("__helios__scriptpurpose__minting__policy_hash", 
	`(self) -> {
		__helios__mintingpolicyhash__from_data(__helios__common__field_0(self))
	}`));

	
	// ScriptPurpose::Spending builtins
	addEnumDataFuncs("__helios__scriptpurpose__spending", 1);
	add(new RawFunc("__helios__scriptpurpose__spending__output_id", "__helios__common__field_0"));

	
	// ScriptPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__scriptpurpose__rewarding", 2);
	add(new RawFunc("__helios__scriptpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// ScriptPurpose::Certifying builtins
	addEnumDataFuncs("__helios__scriptpurpose__certifying", 3);
	add(new RawFunc("__helios__scriptpurpose__certifying__dcert", "__helios__common__field_0"));


	// DCert builtins
	addDataFuncs("__helios__dcert");
	add(new RawFunc("__helios__dcert__new_register",
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__dcert__new_deregister",
	`(cred) -> {
		__core__constrData(1, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__dcert__new_delegate",
	`(cred, pool_id) -> {
		__core__constrData(2, __helios__common__list_2(cred, __helios__pubkeyhash____to_data(pool_id)))
	}`));
	add(new RawFunc("__helios__dcert__new_register_pool",
	`(id, vrf) -> {
		__core__constrData(3, __helios__common__list_2(__helios__pubkeyhash____to_data(id), __helios__pubkeyhash____to_data(vrf)))
	}`));
	add(new RawFunc("__helios__dcert__new_retire_pool",
	`(id, epoch) -> {
		__core__constrData(4, __helios__common__list_2(__helios__pubkeyhash____to_data(id), __helios__int____to_data(epoch)))
	}`));


	// DCert::Register builtins
	addEnumDataFuncs("__helios__dcert__register", 0);
	add(new RawFunc("__helios__dcert__register__credential", "__helios__common__field_0"));


	// DCert::Deregister builtins
	addEnumDataFuncs("__helios__dcert__deregister", 1);
	add(new RawFunc("__helios__dcert__deregister__credential", "__helios__common__field_0"));


	// DCert::Delegate builtins
	addEnumDataFuncs("__helios__dcert__delegate", 2);
	add(new RawFunc("__helios__dcert__delegate__delegator", "__helios__common__field_0"));
	add(new RawFunc("__helios__dcert__delegate__pool_id", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_1(self))
	}`));


	// DCert::RegisterPool builtins
	addEnumDataFuncs("__helios__dcert__registerpool", 3);
	add(new RawFunc("__helios__dcert__registerpool__pool_id", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__dcert__registerpool__pool_vrf", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_1(self))
	}`));


	// DCert::RetirePool builtins
	addEnumDataFuncs("__helios__dcert__retirepool", 4);
	add(new RawFunc("__helios__dcert__retirepool__pool_id", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__dcert__retirepool__epoch", 
	`(self) -> {
		__helios__int__from_data(__helios__common__field_1(self))
	}`));


	// Tx builtins
	addDataFuncs("__helios__tx");
	add(new RawFunc(`__helios__tx__new[${FTPP}0@${FTPP}1]`,
	`(inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums, txId) -> {
		__core__constrData(0, __helios__common__list_12(
			__core__listData(inputs),
			__core__listData(ref_inputs),
			__core__listData(outputs),
			__core__mapData(fee),
			__core__mapData(minted),
			__core__listData(dcerts),
			__core__mapData(withdrawals),
			validity,
			__core__listData(signatories),
			__core__mapData(redeemers),
			__core__mapData(datums),
			__helios__txid__new(#0000000000000000000000000000000000000000000000000000000000000000)
		))
	}`));
	add(new RawFunc("__helios__tx__inputs", 
	`(self) -> {
		__core__unListData(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__tx__ref_inputs", 
	`(self) -> {
		__core__unListData(__helios__common__field_1(self))
	}`))
	add(new RawFunc("__helios__tx__outputs", 
	`(self) -> {
		__core__unListData(__helios__common__field_2(self))
	}`));
	add(new RawFunc("__helios__tx__fee", 
	`(self) -> {
		__core__unMapData(__helios__common__field_3(self))
	}`));
	add(new RawFunc("__helios__tx__minted", 
	`(self) -> {
		__core__unMapData(__helios__common__field_4(self))
	}`));
	add(new RawFunc("__helios__tx__dcerts", 
	`(self) -> {
		__core__unListData(__helios__common__field_5(self))
	}`));
	add(new RawFunc("__helios__tx__withdrawals", 
	`(self) -> {
		__core__unMapData(__helios__common__field_6(self))
	}`));
	add(new RawFunc("__helios__tx__time_range", "__helios__common__field_7"));
	add(new RawFunc("__helios__tx__signatories", 
	`(self) -> {
		__core__unListData(__helios__common__field_8(self))
	}`));
	add(new RawFunc("__helios__tx__redeemers", 
	`(self) -> {
		__core__unMapData(__helios__common__field_9(self))
	}`));
	add(new RawFunc("__helios__tx__datums", 
	`(self) -> {
		__core__unMapData(__helios__common__field_10(self))
	}`));
	add(new RawFunc("__helios__tx__id", "__helios__common__field_11"));
	add(new RawFunc(`__helios__tx__find_datum_hash[${FTPP}0]`,
	`(self) -> {
		(datum) -> {
			__helios__datumhash__from_data(
				__core__fstPair(
					__helios__common__find(
						__helios__tx__datums(self),
						(pair) -> {
							__core__equalsData(__core__sndPair(pair), datum)
						}
					)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__tx__get_datum_data",
	`(self) -> {
		(output) -> {
			(output) -> {
				(idx) -> {
					__core__ifThenElse(
						__core__equalsInteger(idx, 1),
						() -> {
							__helios__common__map_get(
								__helios__tx__datums(self), 
								__core__headList(__core__sndPair(output)),
								__helios__common__identity,
								() -> {error("datumhash not found")}
							)
						},
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(idx, 2),
								() -> {
									__core__headList(__core__sndPair(output))
								},
								() -> {error("output doesn't have a datum")}
							)()
						}
					)()
				}(__core__fstPair(output))
			}(__core__unConstrData(__helios__txoutput__datum(output)))
		}
	}`));
	add(new RawFunc("__helios__tx__filter_outputs",
	`(self, fn) -> {
		__helios__common__filter_list(
			__helios__tx__outputs(self), 
			fn
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to",
	`(self) -> {
		(pkh) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_sent_to(output)(pkh)
			})
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_sent_to_datum[${FTPP}0]`,
	`(self) -> {
		(pkh, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_sent_to_inline_datum[${FTPP}0](self, pkh, datum)
				},
				() -> {
					__helios__tx__outputs_sent_to_datum_hash[${FTPP}0](self, pkh, datum)
				}
			)()
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_sent_to_datum_hash[${FTPP}0]`,
	`(self, pkh, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_sent_to(output)(pkh)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data[${FTPP}0](datum))
	}`));
	add(new RawFunc(`__helios__tx__outputs_sent_to_inline_datum[${FTPP}0]`,
	`(self, pkh, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_sent_to(output)(pkh)
					},
					() -> {
						__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by",
	`(self) -> {
		(vh) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_locked_by(output)(vh)
			})
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_locked_by_datum[${FTPP}0]`,
	`(self) -> {
		(vh, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_locked_by_inline_datum[${FTPP}0](self, vh, datum)
				},
				() -> {
					__helios__tx__outputs_locked_by_datum_hash[${FTPP}0](self, vh, datum)
				}
			)()
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_locked_by_datum_hash[${FTPP}0]`,
	`(self, vh, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_locked_by(output)(vh)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data[${FTPP}0](datum))
	}`));
	add(new RawFunc(`__helios__tx__outputs_locked_by_inline_datum[${FTPP}0]`,
	`(self, vh, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_locked_by(output)(vh)
					},
					() -> {
						__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc(`__helios__tx__outputs_paid_to[${FTPP}0]`,
	`(self) -> {
		(addr, datum) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__address____eq(__helios__txoutput__address(output), addr)
						},
						() -> {
							__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
						}
					)
				}
			)
		}
	}`));
	add(new RawFunc("__helios__tx__value_sent_to",
	`(self) -> {
		(pkh) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to(self)(pkh))
		}
	}`));
	add(new RawFunc(`__helios__tx__value_sent_to_datum[${FTPP}0]`,
	`(self) -> {
		(pkh, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to_datum[${FTPP}0](self)(pkh, datum, isInline))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by",
	`(self) -> {
		(vh) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by(self)(vh))
		}
	}`));
	add(new RawFunc(`__helios__tx__value_locked_by_datum[${FTPP}0]`,
	`(self) -> {
		(vh, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by_datum[${FTPP}0](self)(vh, datum, isInline))
		}
	}`));
	add(new RawFunc(`__helios__tx__value_paid_to[${FTPP}0]`,
	`(self) -> {
		(addr, datum) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_paid_to[${FTPP}0](self)(addr, datum))
		}
	}`));
	add(new RawFunc("__helios__tx__is_signed_by",
	`(self) -> {
		(hash) -> {
			(hash) -> {
				__helios__common__any(
					__helios__tx__signatories(self),
					(signatory) -> {
						__core__equalsData(signatory, hash)
					}
				)
			}(__helios__pubkeyhash____to_data(hash))
		}
	}`));


	// TxId builtins
	addDataFuncs("__helios__txid");
	add(new RawFunc("__helios__txid__bytes",
	`(self) -> {
		__core__unBData(__core__headList(__core__sndPair(__core__unConstrData(self))))
	}`));
	add(new RawFunc("__helios__txid____lt", 
	`(a, b) -> {
		__helios__bytearray____lt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____leq", 
	`(a, b) -> {
		__helios__bytearray____leq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____gt", 
	`(a, b) -> {
		__helios__bytearray____gt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____geq", 
	`(a, b) -> {
		__helios__bytearray____geq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid__new",
	`(bytes) -> {
		__core__constrData(0, __helios__common__list_1(__core__bData(bytes))) 
	}`));
	add(new RawFunc("__helios__txid__show",
	`(self) -> {
		__helios__bytearray__show(__helios__txid__bytes(self))
	}`));


	// TxInput builtins
	addDataFuncs("__helios__txinput");
	add(new RawFunc("__helios__txinput__new",
	`(output_id, output) -> {
		__core__constrData(0, __helios__common__list_2(output_id, output))
	}`));
	add(new RawFunc("__helios__txinput__output_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txinput__output", "__helios__common__field_1"));
	add(new RawFunc("__helios__txinput__address",
	`(self) -> {
		__helios__txoutput__address(__helios__txinput__output(self))
	}`));
	add(new RawFunc("__helios__txinput__value", 
	`(self) -> {
		__helios__txoutput__value(__helios__txinput__output(self))
	}`));
	add(new RawFunc("__helios__txinput__datum",
	`(self) -> {
		__helios__txoutput__datum(__helios__txinput__output(self))
	}`));
	

	// TxOutput builtins
	addDataFuncs("__helios__txoutput");
	add(new RawFunc("__helios__txoutput__new", 
	`(address, value, datum) -> {
		__core__constrData(0, __helios__common__list_4(address, __core__mapData(value), datum, __helios__option__NONE))
	}`));
	add(new RawFunc("__helios__txoutput__address", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutput__value", `(self) -> {
		__core__unMapData(__helios__common__field_1(self))
	}`));
	add(new RawFunc("__helios__txoutput__datum", "__helios__common__field_2"));
	add(new RawFunc("__helios__txoutput__ref_script_hash", "__helios__common__field_3"));
	add(new RawFunc("__helios__txoutput__get_datum_hash",
	`(self) -> {
		() -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 1),
					() -> {
						__helios__datumhash__from_data(
							__core__headList(__core__sndPair(pair))
						)
					},
					() -> {#}
				)()
			}(__core__unConstrData(__helios__txoutput__datum(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__has_datum_hash",
	`(self, datumHash) -> {
		__helios__datumhash____eq(__helios__txoutput__get_datum_hash(self)(), datumHash)
	}`));
	add(new RawFunc(`__helios__txoutput__has_inline_datum[${FTPP}0]`,
	`(self, datum) -> {
		(pair) -> {
			__core__ifThenElse(
				__core__equalsInteger(__core__fstPair(pair), 2),
				() -> {
					__core__equalsData(
						${FTPP}0____to_data(datum),
						__core__headList(__core__sndPair(pair))
					)
				},
				() -> {false}
			)()
		}(__core__unConstrData(__helios__txoutput__datum(self)))
	}`));
	add(new RawFunc("__helios__txoutput__is_locked_by",
	`(self) -> {
		(hash) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_validator(credential),
					() -> {
						__helios__validatorhash____eq(
							hash, 
							__helios__credential__validator__hash(
								__helios__credential__validator__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__is_sent_to",
	`(self) -> {
		(pkh) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_pubkey(credential),
					() -> {
						__helios__pubkeyhash____eq(
							pkh, 
							__helios__credential__pubkey__hash(
								__helios__credential__pubkey__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__sum_values",
	`(outputs) -> {
		__helios__common__fold(
			outputs, 
			(prev, txOutput) -> {
				__helios__value____add(
					prev,
					__helios__txoutput__value(txOutput)
				)
			}, 
			__helios__value__ZERO
		)
	}`));


	// OutputDatum
	addDataFuncs("__helios__outputdatum");
	add(new RawFunc("__helios__outputdatum__new_none",
	`() -> {
		__core__constrData(0, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__outputdatum__new_hash",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(__helios__datumhash____to_data(hash)))
	}`));
	add(new RawFunc(`__helios__outputdatum__new_inline[${FTPP}0]`,
	`(data) -> {
		__core__constrData(2, __helios__common__list_1(${FTPP}0____to_data(data)))
	}`));
	add(new RawFunc("__helios__outputdatum__get_inline_data",
	`(self) -> {
		() -> {
			(pair) -> {
				(index, fields) -> {
					__core__ifThenElse(
						__core__equalsInteger(index, 2),
						() -> {
							__core__headList(fields)
						},
						() -> {
							error("not an inline datum")
						}
					)()
				}(__core__fstPair(pair), __core__sndPair(pair))
			}(__core__unConstrData(self))
		}
	}`));


	// OutputDatum::None
	addEnumDataFuncs("__helios__outputdatum__none", 0);
	

	// OutputDatum::Hash
	addEnumDataFuncs("__helios__outputdatum__hash", 1);
	add(new RawFunc("__helios__outputdatum__hash__hash", 
	`(self) -> {
		__helios__datumhash__from_data(__helios__common__field_0(self))
	}`));


	// OutputDatum::Inline
	addEnumDataFuncs("__helios__outputdatum__inline", 2);
	add(new RawFunc("__helios__outputdatum__inline__data", "__helios__common__field_0"));


	// RawData
	addDataFuncs("__helios__data");
	add(new RawFunc("__helios__data__tag", 
	`(self) -> {
		__core__fstPair(__core__unConstrData(self))
	}`));


	// TxOutputId
	addDataFuncs("__helios__txoutputid");
	add(new RawFunc("__helios__txoutputid__tx_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutputid__index", 
	`(self) -> {
		__helios__int__from_data(__helios__common__field_1(self))
	}`));
	add(new RawFunc("__helios__txoutputid__comp", 
	`(a, b, comp_txid, comp_index) -> {
		(a_txid, a_index) -> {
			(b_txid, b_index) -> {
				__core__ifThenElse(
					__core__equalsData(a_txid, b_txid),
					() -> {
						comp_index(a_index, b_index)
					},
					() -> {
						comp_txid(a_txid, b_txid)
					}
				)()
			}(__helios__txoutputid__tx_id(b), __helios__txoutputid__index(b))
		}(__helios__txoutputid__tx_id(a), __helios__txoutputid__index(a))
	}`));
	add(new RawFunc("__helios__txoutputid____lt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____lt, __helios__int____lt)
	}`));
	add(new RawFunc("__helios__txoutputid____leq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____leq, __helios__int____leq)
	}`));
	add(new RawFunc("__helios__txoutputid____gt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____gt, __helios__int____gt)
	}`));
	add(new RawFunc("__helios__txoutputid____geq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____geq, __helios__int____geq)
	}`));
	add(new RawFunc("__helios__txoutputid__new",
	`(tx_id, idx) -> {
		__core__constrData(0, __helios__common__list_2(tx_id, __helios__int____to_data(idx)))
	}`));


	// Address
	addDataFuncs("__helios__address");
	add(new RawFunc("__helios__address__new", 
	`(cred, staking_cred) -> {
		__core__constrData(0, __helios__common__list_2(cred, staking_cred))
	}`));
	add(new RawFunc("__helios__address__new_empty",
	`() -> {
		__core__constrData(0, __helios__common__list_2(__helios__credential__new_pubkey(#), __helios__option__NONE))
	}`))
	add(new RawFunc("__helios__address__credential", "__helios__common__field_0"));
	add(new RawFunc("__helios__address__staking_credential", "__helios__common__field_1"));
	add(new RawFunc("__helios__address__is_staked",
	`(self) -> {
		() -> {
			__core__equalsInteger(__core__fstPair(__core__unConstrData(__helios__common__field_1(self))), 0)
		}
	}`));


	// Credential builtins
	addDataFuncs("__helios__credential");
	add(new RawFunc("__helios__credential__new_pubkey",
	`(hash) -> {
		__core__constrData(0, __helios__common__list_1(__helios__pubkeyhash____to_data(hash)))
	}`));
	add(new RawFunc("__helios__credential__new_validator",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(__helios__validatorhash____to_data(hash)))
	}`));
	add(new RawFunc("__helios__credential__is_pubkey",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 0)
	}`));
	add(new RawFunc("__helios__credential__is_validator",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 1)
	}`));


	// Credential::PubKey builtins
	addEnumDataFuncs("__helios__credential__pubkey", 0);
	add(new RawFunc("__helios__credential__pubkey__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__credential__pubkey__hash", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_0(self))
	}`));


	// Credential::Validator builtins
	addEnumDataFuncs("__helios__credential__validator", 1);
	add(new RawFunc("__helios__credential__validator____new", "__helios__credential__new_validator"));
	add(new RawFunc("__helios__credential__validator__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));
	add(new RawFunc("__helios__credential__validator__hash", 
	`(self) -> {
		__helios__validatorhash__from_data(__helios__common__field_0(self))
	}`));


	// StakingHash builtins
	addDataFuncs("__helios__stakinghash");
	add(new RawFunc("__helios__stakinghash__new_stakekey", "__helios__credential__new_pubkey"));
	add(new RawFunc("__helios__stakinghash__new_validator", "__helios__credential__new_validator"));
	add(new RawFunc("__helios__stakinghash__is_stakekey", "__helios__credential__is_stakekey"));
	add(new RawFunc("__helios__stakinghash__is_validator", "__helios__credential__is_validator"));


	// StakingHash::StakeKey builtins
	addEnumDataFuncs("__helios__stakinghash__stakekey", 0);
	add(new RawFunc("__helios__stakinghash__stakekey__cast", "__helios__credential__pubkey__cast"));
	add(new RawFunc("__helios__stakinghash__stakekey__hash", "__helios__credential__pubkey__hash"));


	// StakingHash::Validator builtins
	addEnumDataFuncs("__helios__stakinghash__validator", 1);
	add(new RawFunc("__helios__stakinghash__validator__cast", "__helios__credential__validator__cast"));
	add(new RawFunc("__helios__stakinghash__validator__hash", "__helios__credential__validator__hash"));


	// StakingCredential builtins
	addDataFuncs("__helios__stakingcredential");
	add(new RawFunc("__helios__stakingcredential__new_hash", 
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__stakingcredential__new_ptr", 
	`(i, j, k) -> {
		__core__constrData(1, __helios__common__list_3(
			__helios__int____to_data(i), 
			__helios__int____to_data(j), 
			__helios__int____to_data(k)
		))
	}`));

	
	// StakingCredential::Hash builtins
	addEnumDataFuncs("__helios__stakingcredential__hash", 0);
	add(new RawFunc("__helios__stakingcredential__hash__hash", "__helios__common__field_0"));


	// StakingCredential::Ptr builtins
	addEnumDataFuncs("__helios__stakingcredential__ptr", 1);


	// Time builtins
	addIntLikeFuncs("__helios__time");
	add(new RawFunc("__helios__time__new", `__helios__common__identity`));
	add(new RawFunc("__helios__time____add", `__helios__int____add`));
	add(new RawFunc("__helios__time____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__time____sub1", `__helios__int____sub`));
	add(new RawFunc("__helios__time____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__time____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__time____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__time____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__time__show", `__helios__int__show`));


	// Duratin builtins
	addIntLikeFuncs("__helios__duration");
	add(new RawFunc("__helios__duration__new", `__helios__common__identity`));
	add(new RawFunc("__helios__duration____add", `__helios__int____add`));
	add(new RawFunc("__helios__duration____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__duration____mul", `__helios__int____mul`));
	add(new RawFunc("__helios__duration____div", `__helios__int____div`));
	add(new RawFunc("__helios__duration____div1", `__helios__int____div`));
	add(new RawFunc("__helios__duration____mod", `__helios__int____mod`));
	add(new RawFunc("__helios__duration____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__duration____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__duration____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__duration____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__duration__SECOND", "1000"));
	add(new RawFunc("__helios__duration__MINUTE", "60000"));
	add(new RawFunc("__helios__duration__HOUR", "3600000"));
	add(new RawFunc("__helios__duration__DAY", "86400000"));
	add(new RawFunc("__helios__duration__WEEK", "604800000"));


	// TimeRange builtins
	addDataFuncs("__helios__timerange");
	add(new RawFunc("__helios__timerange__new", `
	(a, b) -> {
		(a, b) -> {
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(a)),
					__helios__bool____to_data(true)
				)),
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(b)),
					__helios__bool____to_data(true)
				))
			))
		}(__helios__time____to_data(a), __helios__time____to_data(b))
	}`));
	add(new RawFunc("__helios__timerange__ALWAYS", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__bool____to_data(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__bool____to_data(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__NEVER", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__bool____to_data(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__bool____to_data(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__from", `
	(a) -> {
		(a) -> {
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(a)),
					__helios__bool____to_data(true)
				)),
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(2, __helios__common__list_0),
					__helios__bool____to_data(true)
				))
			))
		}(__helios__time____to_data(a))
	}`));
	add(new RawFunc("__helios__timerange__to", `
	(b) -> {
		(b) -> {
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(0, __helios__common__list_0),
					__helios__bool____to_data(true)
				)),
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(b)),
					__helios__bool____to_data(true)
				))
			))
		}(__helios__time____to_data(b))
	}`));
	add(new RawFunc("__helios__timerange__is_before", 
	`(self) -> {
		(t) -> {
			(upper) -> {
				(extended, closed) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 2),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 0),
									() -> {true},
									() -> {
										__core__ifThenElse(
											closed,
											() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)},
											() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(upper), __helios__bool__from_data(__helios__common__field_1(upper)))
			}(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__is_after",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 0),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 2),
									() -> {true},
									() -> {
										__core__ifThenElse(
											closed,
											() -> {__core__lessThanInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
											() -> {__core__lessThanEqualsInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(lower), __helios__bool__from_data(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__contains",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(lowerExtType, checkUpper) -> {
						__core__ifThenElse(
							__core__equalsInteger(lowerExtType, 2),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(lowerExtType, 0),
									() -> {checkUpper()},
									() -> {
										__core__ifThenElse(
											__core__ifThenElse(
												closed,
												() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)},
												() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)}
											)(),
											() -> {checkUpper()},
											() -> {false}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)), () -> {
						(upper) -> {
							(extended, closed) -> {
								(upperExtType) -> {
									__core__ifThenElse(
										__core__equalsInteger(upperExtType, 0),
										() -> {false},
										() -> {
											__core__ifThenElse(
												__core__equalsInteger(upperExtType, 2),
												() -> {true},
												() -> {
													__core__ifThenElse(
														__core__ifThenElse(
															closed,
															() -> {__core__lessThanEqualsInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
															() -> {__core__lessThanInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
														)(),
														true,
														false
													)
												}
											)()
										}
									)()
								}(__core__fstPair(__core__unConstrData(extended)))
							}(__helios__common__field_0(upper), __helios__bool__from_data(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					})
				}(__helios__common__field_0(lower), __helios__bool__from_data(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__start",
	`(self) -> {
		__helios__time__from_data(__helios__common__field_0(__helios__common__field_0(__helios__common__field_0(self))))
	}`));
	add(new RawFunc("__helios__timerange__end",
	`(self) -> {
		__helios__time__from_data(__helios__common__field_0(__helios__common__field_0(__helios__common__field_1(self))))
	}`));
	add(new RawFunc("__helios__timerange__show",
	`(self) -> {
		() -> {
			(show_extended) -> {
				__helios__string____add(
					(lower) -> {
						(extended, closed) -> {
							__helios__string____add(
								__core__ifThenElse(closed, "[", "("),
								show_extended(extended)
							)
						}(__helios__common__field_0(lower), __helios__bool__from_data(__helios__common__field_1(lower)))
					}(__helios__common__field_0(self)),
					__helios__string____add(
						",",
						(upper) -> {
							(extended, closed) -> {
								__helios__string____add(
									show_extended(extended),
									__core__ifThenElse(closed, "]", ")")
								)
							}(__helios__common__field_0(upper), __helios__bool__from_data(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					)
				)
			}(
				(extended) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 0),
							() -> {"-inf"},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 2),
									() -> {"+inf"},
									() -> {
										(fields) -> {
											__helios__int__show(
												__helios__int__from_data(__core__headList(fields))
											)()
										}(__core__sndPair(__core__unConstrData(extended)))
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}
			)
		}
	}`))


	// AssetClass builtins
	addDataFuncs("__helios__assetclass");
	add(new RawFunc("__helios__assetclass__ADA", `__helios__assetclass__new(#, #)`));
	add(new RawFunc("__helios__assetclass__new",
	`(mph, token_name) -> {
		__core__constrData(0, __helios__common__list_2(
			__helios__mintingpolicyhash____to_data(mph), 
			__helios__bytearray____to_data(token_name)
		))
	}`));
	add(new RawFunc("__helios__assetclass__mph", 
	`(self) -> {
		__helios__mintingpolicyhash__from_data(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__assetclass__token_name", 
	`(self) -> {
		__helios__bytearray__from_data(__helios__common__field_1(self))
	}`));


	// Value builtins
	addSerializeFunc("__helios__value");
	add(new RawFunc("__helios__value__from_data", "__core__unMapData"));
	add(new RawFunc("__helios__value____to_data", "__core__mapData"));
	add(new RawFunc("__helios__value__value", "__helios__common__identity"));
	add(new RawFunc("__helios__value__ZERO", "__core__mkNilPairData(())"));
	add(new RawFunc("__helios__value__lovelace",
	`(i) -> {
		__helios__value__new(__helios__assetclass__ADA, i)
	}`));
	add(new RawFunc("__helios__value__new",
	`(assetClass, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(0, i),
			() -> {
				__helios__value__ZERO
			},
			() -> {
				(mph, tokenName) -> {
					__core__mkCons(
						__core__mkPairData(
							mph, 
							__core__mapData(
								__core__mkCons(
									__core__mkPairData(tokenName, __helios__int____to_data(i)), 
									__core__mkNilPairData(())
								)
							)
						), 
						__core__mkNilPairData(())
					)
				}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
			}
		)()
	}`));
	add(new RawFunc("__helios__value__from_map", "__helios__common__identity"));
	add(new RawFunc("__helios__value__to_map", 
	`(self) -> {
		() -> {
			self
		}
	}`));
	add(new RawFunc("__helios__value__get_map_keys",
	`(map) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__helios__common__list_0}, 
					() -> {__core__mkCons(__core__fstPair(__core__headList(map)), recurse(recurse, __core__tailList(map)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__merge_map_keys",
	`(a, b) -> {
		(aKeys) -> {
			(recurse) -> {
				(uniqueBKeys) -> {
					__helios__common__concat(aKeys, uniqueBKeys)
				}(recurse(recurse, aKeys, b))
			}(
				(recurse, keys, map) -> {
					__core__chooseList(
						map, 
						() -> {__helios__common__list_0}, 
						() -> {
							(key) -> {
								__core__ifThenElse(
									__helios__common__is_in_bytearray_list(aKeys, key), 
									() -> {recurse(recurse, keys, __core__tailList(map))},
									() -> {__core__mkCons(key, recurse(recurse, keys, __core__tailList(map)))}
								)()
							}(__core__fstPair(__core__headList(map)))
						}
					)()
				}
			)
		}(__helios__value__get_map_keys(a))
	}`));

	add(new RawFunc("__helios__value__get_inner_map",
	`(map, mph) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__core__mkNilPairData(())},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), mph), 
							() -> {__core__unMapData(__core__sndPair(__core__headList(map)))},
							() -> {recurse(recurse, __core__tailList(map))}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__get_inner_map_int",
	`(map, key) -> {
		(recurse) -> {
			recurse(recurse, map, key)
		}(
			(recurse, map, key) -> {
				__core__chooseList(
					map, 
					() -> {0}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), key), 
							() -> {__core__unIData(__core__sndPair(__core__headList(map)))}, 
							() -> {recurse(recurse, __core__tailList(map), key)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__add_or_subtract_inner",
	`(op) -> {
		(a, b) -> {
			(recurse) -> {
				recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
			}(
				(recurse, keys, result) -> {
					__core__chooseList(
						keys, 
						() -> {result}, 
						() -> {
							(key, tail) -> {
								(sum) -> {
									__core__ifThenElse(
										__core__equalsInteger(sum, 0), 
										() -> {tail}, 
										() -> {__core__mkCons(__core__mkPairData(key, __core__iData(sum)), tail)}
									)()
								}(op(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key)))
							}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__add_or_subtract",
	`(a, b, op) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
		}(
			(recurse, keys, result) -> {
				__core__chooseList(
					keys, 
					() -> {result}, 
					() -> {
						(key, tail) -> {
							(item) -> {
								__core__chooseList(
									item, 
									() -> {tail}, 
									() -> {__core__mkCons(__core__mkPairData(key, __core__mapData(item)), tail)}
								)()
							}(__helios__value__add_or_subtract_inner(op)(__helios__value__get_inner_map(a, key), __helios__value__get_inner_map(b, key)))
						}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__map_quantities",
	`(self, op) -> {
		(recurseInner) -> {
			(recurseOuter) -> {
				recurseOuter(recurseOuter, self)
			}(
				(recurseOuter, outer) -> {
					__core__chooseList(
						outer,
						() -> {__core__mkNilPairData(())},
						() -> {
							(head) -> {
								__core__mkCons(
									__core__mkPairData(
										__core__fstPair(head), 
										__core__mapData(recurseInner(recurseInner, __core__unMapData(__core__sndPair(head))))
									),  
									recurseOuter(recurseOuter, __core__tailList(outer))
								)
							}(__core__headList(outer))
						}
					)()
				}
			)
		}(
			(recurseInner, inner) -> {
				__core__chooseList(
					inner,
					() -> {__core__mkNilPairData(())},
					() -> {
						(head) -> {
							__core__mkCons(
								__core__mkPairData(
									__core__fstPair(head),
									__core__iData(op(__core__unIData(__core__sndPair(head))))
								),
								recurseInner(recurseInner, __core__tailList(inner))
							)
						}(__core__headList(inner))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__compare_inner",
	`(comp, a, b) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b))
		}(
			(recurse, keys) -> {
				__core__chooseList(
					keys, 
					() -> {true}, 
					() -> {
						(key) -> {
							__core__ifThenElse(
								__helios__bool____not(
									comp(
										__helios__value__get_inner_map_int(a, key), 
										__helios__value__get_inner_map_int(b, key)
									)
								), 
								() -> {false}, 
								() -> {recurse(recurse, __core__tailList(keys))}
							)()
						}(__core__headList(keys))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__compare",
	`(a, b, comp) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b))
		}(
			(recurse, keys) -> {
				__core__chooseList(
					keys, 
					() -> {true}, 
					() -> {
						(key) -> {
							__core__ifThenElse(
								__helios__bool____not(
									__helios__value__compare_inner(
										comp, 
										__helios__value__get_inner_map(a, key), 
										__helios__value__get_inner_map(b, key)
									)
								), 
								() -> {false}, 
								() -> {recurse(recurse, __core__tailList(keys))}
							)()
						}(__core__headList(keys))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value____eq",
	`(a, b) -> {
		__helios__value__compare(a, b, __core__equalsInteger)
	}`));
	add(new RawFunc("__helios__value____neq",
	`(a, b) -> {
		__helios__bool____not(__helios__value____eq(a, b))
	}`));
	add(new RawFunc("__helios__value____add",
	`(a, b) -> {
		__helios__value__add_or_subtract(a, b, __core__addInteger)
	}`));
	add(new RawFunc("__helios__value____sub",
	`(a, b) -> {
		__helios__value__add_or_subtract(a, b, __core__subtractInteger)
	}`));
	add(new RawFunc("__helios__value____mul",
	`(a, scale) -> {
		__helios__value__map_quantities(a, (qty) -> {__core__multiplyInteger(qty, scale)})
	}`));
	add(new RawFunc("__helios__value____div",
	`(a, den) -> {
		__helios__value__map_quantities(a, (qty) -> {__core__divideInteger(qty, den)})
	}`));
	add(new RawFunc("__helios__value____geq",
	`(a, b) -> {
		__helios__value__compare(
			a, 
			b, 
			(a_qty, b_qty) -> {
				__helios__bool____not(
					__core__lessThanInteger(a_qty, b_qty)
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value__contains", `
	(self) -> {
		(value) -> {
			__helios__value____geq(self, value)
		}
	}`));
	add(new RawFunc("__helios__value____gt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__bool____not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare(
					a, 
					b,
					(a_qty, b_qty) -> {
						__helios__bool____not(__core__lessThanEqualsInteger(a_qty, b_qty))
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value____leq",
	`(a, b) -> {
		__helios__value__compare(a, b, __core__lessThanEqualsInteger)
	}`));
	add(new RawFunc("__helios__value____lt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__bool____not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare( 
					a, 
					b,
					(a_qty, b_qty) -> {
						__core__lessThanInteger(a_qty, b_qty)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value__is_zero",
	`(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`));
	add(new RawFunc("__helios__value__get",
	`(self) -> {
		(assetClass) -> {
			(mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, self)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("policy not found")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("tokenName not found")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), tokenName),
									() -> {
										__core__unIData(__core__sndPair(__core__headList(map)))
									},
									() -> {
										inner(inner, __core__tailList(map))
									}
								)()
							}
						)()
					}
				)
			}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_safe",
	`(self) -> {
		(assetClass) -> {
			(mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, self)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
							() -> {0}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__chooseList(
							map, 
							() -> {0}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), tokenName),
									() -> {
										__core__unIData(__core__sndPair(__core__headList(map)))
									},
									() -> {
										inner(inner, __core__tailList(map))
									}
								)()
							}
						)()
					}
				)
			}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_lovelace",
	`(self) -> {
		() -> {
			__helios__value__get_safe(self)(__helios__assetclass__ADA)
		}
	}`));
	add(new RawFunc("__helios__value__get_assets",
	`(self) -> {
		() -> {
			__helios__common__filter_map(
				self,
				(pair) -> {
					__helios__bool____not(__core__equalsByteString(__core__unBData(__core__fstPair(pair)), #))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__get_policy", 
	`(self) -> {
		(mph) -> {
			(mph) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {error("policy not found")},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {
										__core__unMapData(__core__sndPair(__core__headList(map)))
									},
									() -> {
										recurse(recurse, __core__tailList(map))
									}
								)()
							}
						)()
					}
				)
			}(__helios__mintingpolicyhash____to_data(mph))
		} 
	}`));
	add(new RawFunc("__helios__value__contains_policy",
	`(self) -> {
		(mph) -> {
			(mph) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {true},
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__helios__mintingpolicyhash____to_data(mph))
		}
	}`));
	add(new RawFunc("__helios__value__show",
	`(self) -> {
		() -> {
			__helios__common__fold(
				self,
				(prev, pair) -> {
					(mph, tokens) -> {
						__helios__common__fold(
							tokens,
							(prev, pair) -> {
								(token_name, qty) -> {
									__helios__string____add(
										prev,
										__core__ifThenElse(
											__helios__mintingpolicyhash____eq(mph, #),
											() -> {
												__helios__string____add(
													"lovelace: ",
													__helios__string____add(
														__helios__int__show(qty)(),
														"\\n"
													)
												)
											},
											() -> {
												__helios__string____add(
													__helios__mintingpolicyhash__show(mph)(),
													__helios__string____add(
														".",
														__helios__string____add(
															__helios__bytearray__show(token_name)(),
															__helios__string____add(
																": ",
																__helios__string____add(
																	__helios__int__show(qty)(),
																	"\\n"
																)
															)
														)
													)
												)
											}
										)()
									)
								}(__helios__bytearray__from_data(__core__fstPair(pair)), __helios__int__from_data(__core__sndPair(pair)))
							},
							prev
						)
					}(__helios__mintingpolicyhash__from_data(__core__fstPair(pair)), __core__unMapData(__core__sndPair(pair)))
				},
				""
			)
		}
	}`))
	add(new RawFunc(`__helios__value__sum[${FTPP}0]`,
	`(self) -> {
		(recurse) -> {
			recurse(recurse, self)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						__helios__value__ZERO
					},
					() -> {
						__helios__value____add(
							${FTPP}0__value(${FTPP}0__from_data(__core__headList(lst))),
							recurse(recurse, __core__tailList(lst))
						)
					}
				)()
			}
		)
	}`));

	return db;
}

const db = makeRawFunctions();

/**
 * Load all raw generics so all possible implementations can be generated correctly during type parameter injection phase
 * @package
 * @returns {IRDefinitions}
 */
function fetchRawGenerics() {
	/**
	 * @type {IRDefinitions}
	 */
	const map = new Map();

	for (let [k, v] of db) {
		if (IRParametricName.matches(k)) {
			// load without dependencies
			map.set(k, v.toIR())
		}
	}

	return map;
}

/**
 * Doesn't add templates
 * @package
 * @param {IR} ir 
 * @returns {IRDefinitions}
 */
function fetchRawFunctions(ir) {
	// notify statistics of existence of builtin in correct order
	if (onNotifyRawUsage !== null) {
		for (let [name, _] of db) {
			// don't add templates, as they will never actually be used
			if (!IRParametricName.isTemplate(name)) {
				onNotifyRawUsage(name, 0);
			}
		}
	}

	let [src, _] = ir.generateSource();

	let matches = src.match(RE_BUILTIN);

	/**
	 * @type {IRDefinitions}
	 */
	const map = new Map();

	if (matches !== null) {
		for (let m of matches) {
			if (!IRParametricName.matches(m) && !map.has(m)) {
				const builtin = db.get(m);

				if (!builtin) {
					throw new Error(`builtin ${m} not found`);
				}

				builtin.load(db, map);
			}
		}
	}

	return map;
}

/**
 * @package
 * @param {IR} ir 
 * @returns {IR}
 */
function wrapWithRawFunctions(ir) {
	const map = fetchRawFunctions(ir);
	
	return IR.wrapWithDefinitions(ir, map);
}



/////////////////////////////////
// Section 27: IR Context objects
/////////////////////////////////

/**
 * Scope for IR names.
 * Works like a stack of named values from which a Debruijn index can be derived
 * @package
 */
class IRScope {
	#parent;
	/** variable name (can be empty if no usable variable defined at this level) */
	#variable;

	/**
	 * @param {null | IRScope} parent 
	 * @param {null | IRVariable} variable
	 */
	constructor(parent, variable) {
		this.#parent = parent;
		this.#variable = variable;
	}

	/**
	 * Calculates the Debruijn index of a named value. Internal method
	 * @param {Word | IRVariable} name 
	 * @param {number} index 
	 * @returns {[number, IRVariable]}
	 */
	getInternal(name, index) {
		if (this.#variable !== null && (name instanceof Word && this.#variable.toString() == name.toString()) || (name instanceof IRVariable && this.#variable == name)) {
			return [index, this.#variable];
		} else if (this.#parent === null) {
			throw name.referenceError(`variable ${name.toString()} not found`);
		} else {
			return this.#parent.getInternal(name, index + 1);
		}
	}

	/**
	 * Calculates the Debruijn index.
	 * @param {Word | IRVariable} name 
	 * @returns {[number, IRVariable]}
	 */
	get(name) {
		// one-based
		return this.getInternal(name, 1);
	}

	/**
	 * Checks if a named builtin exists
	 * @param {string} name 
	 * @param {boolean} strict - if true then throws an error if builtin doesn't exist
	 * @returns {boolean}
	 */
	static isBuiltin(name, strict = false) {
		if (name.startsWith("__core")) {
			if (strict) {
				void this.findBuiltin(name); // assert that builtin exists
			}
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Returns index of a named builtin
	 * Throws an error if builtin doesn't exist
	 * @param {string} name 
	 * @returns 
	 */
	static findBuiltin(name) {
		let i = UPLC_BUILTINS.findIndex(info => { return "__core__" + info.name == name });
		assert(i != -1, `${name} is not a real builtin`);
		return i;
	}
}

const ALWAYS_INLINEABLE = [
	"__helios__int____to_data",
	"__helios__common__identity",
	"__helios__int____neg",
	"__helios__common__fields",
	"__helios__common__fields_after_0",
	"__helios__common__field_0"
];

/**
 * IR class that represents function arguments
 * @package
 */
class IRVariable extends Token {
	#name;

	/**
	 * @param {Word} name
	 */
	constructor(name) {
		super(name.site);
		this.#name = name;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.toString();
	}

	toString() {
		return this.name;
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRVariable}
	 */
	copy(newVars) {
		const newVar = new IRVariable(this.#name);

		newVars.set(this, newVar);

		return newVar;
	}

	/**
	 * @returns {boolean}
	 */
	isAlwaysInlineable() {
		return ALWAYS_INLINEABLE.findIndex((name_) => name_ == this.#name.value) != -1;
	}
}

/**
 * @package
 */
class IRValue {
	constructor() {
	}

	/**
	 * @param {IRValue[]} args 
	 * @returns {?IRValue}
	 */
	call(args) {
		throw new Error("not a function");
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		throw new Error("not a literal value");
	}
}

/**
 * @package
 */
class IRFuncValue extends IRValue {
	#callback;

	/**
	 * @param {(args: IRValue[]) => ?IRValue} callback
	 */
	constructor(callback) {
		super();
		this.#callback = callback;
	}

	/**
	 * @param {IRValue[]} args 
	 * @returns {?IRValue}
	 */
	call(args) {
		return this.#callback(args);
	}
}

/**
 * @package
 */
class IRLiteralValue extends IRValue {
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super();
		this.#value = value;
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}
}

/**
 * @package
 */
class IRDeferredValue extends IRValue {
    #deferred;

    /**
     * @type {undefined | null | IRValue}
     */
    #cache;

    /**
     * @param {() => ?IRValue} deferred
     */
    constructor(deferred) {
        super();
        this.#deferred = deferred;
        this.#cache = undefined;
    }
    /**
     * @param {IRValue[]} args 
     * @returns {?IRValue}
     */
    call(args) {
        if (this.#cache === undefined) {
            this.#cache = this.#deferred();
        }
        
        if (this.#cache != null) {
            return this.#cache.call(args);
        } else {
            return null;
        }
    }

    /**
     * @type {UplcValue}
     */
    get value() {
        if (this.#cache === undefined) {
            this.#cache = this.#deferred();
        }
        
        if (this.#cache != null) {
            return this.#cache.value;
        } else {
            throw new Error("not a value");
        }
    }

}

/**
 * @package
 */
class IRCallStack {
	#throwRTErrors;
	#parent;
	#variable;
	#value;

	/**
	 * @param {boolean} throwRTErrors
	 * @param {?IRCallStack} parent 
	 * @param {?IRVariable} variable 
	 * @param {?IRValue} value 
	 */
	constructor(throwRTErrors, parent = null, variable = null, value = null) {
		this.#throwRTErrors = throwRTErrors;
		this.#parent = parent;
		this.#variable = variable;
		this.#value = value;
	}

	get throwRTErrors() {
		return this.#throwRTErrors;
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {?IRValue}
	 */
	get(variable) {
		if (this.#variable !== null && this.#variable === variable) {
			return this.#value;
		} else if (this.#parent !== null) {
			return this.#parent.get(variable);
		} else {
			return new IRValue()
			return null;
		}
	}

	/**
	 * @param {IRVariable} variable 
	 * @param {IRValue} value 
	 * @returns {IRCallStack}
	 */
	set(variable, value) {
		return new IRCallStack(this.#throwRTErrors, this, variable, value);
	}

	/**
	 * @returns {string[]}
	 */
	dump() {
		return (this.#parent?.dump() ?? []).concat([this.#variable?.name ?? ""])
	}
}


/////////////////////////////
// Section 28: IR AST objects
/////////////////////////////

/**
 * @typedef {Map<IRVariable, IRLiteralExpr>} IRLiteralRegistry
 */

export class IRNameExprRegistry {
	/**
	 * @type {Map<IRVariable, Set<IRNameExpr>>}
	 */
	#map;

	/**
	 * @type {Set<IRVariable>}
	 */
	#maybeInsideLoop;

	/**
	 * Reset whenever recursion is detected.
	 * @type {Set<IRVariable>}
	 */
	#variables;

	/**
	 * @param {Map<IRVariable, Set<IRNameExpr>>} map
	 */
	constructor(map = new Map(), maybeInsideLoop = new Set()) {
		this.#map = map;
		this.#maybeInsideLoop = maybeInsideLoop;
		this.#variables = new Set();
	}

	/**
	 * @param {IRNameExpr} nameExpr 
	 */
	register(nameExpr) {
		if (!nameExpr.isCore()) {
			const variable = nameExpr.variable;

			if (!this.#map.has(variable)) {
				this.#map.set(variable, new Set([nameExpr]));
			} else {
				assertDefined(this.#map.get(variable)).add(nameExpr);
			}

			// add another reference in case of recursion
			if (!this.#variables.has(variable)) {
				this.#maybeInsideLoop.add(variable);
			}
		}
	}

	/**
	 * Used to prevent inlining upon recursion
	 * @param {IRVariable} variable
	 */
	registerVariable(variable) {
		this.#variables.add(variable)
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {number}
	 */
	countReferences(variable) {
		const set = this.#map.get(variable);

		if (set == undefined) {
			return 0;
		} else {
			return set.size;
		}
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {boolean}
	 */
	maybeInsideLoop(variable) {
		return this.#maybeInsideLoop.has(variable);
	}

	/**
	 * Called whenever recursion is detected
	 * @returns {IRNameExprRegistry}
	 */
	resetVariables() {
		return new IRNameExprRegistry(this.#map, this.#maybeInsideLoop);
	}
}

export class IRExprRegistry {
	#nameExprs;

	/**
	 * @type {Map<IRVariable, IRExpr>}
	 */
	#inline;

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	constructor(nameExprs) {
		this.#nameExprs = nameExprs;
		this.#inline = new Map();
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {number}
	 */
	countReferences(variable) {
		return this.#nameExprs.countReferences(variable);
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {boolean}
	 */
	maybeInsideLoop(variable) {
		return this.#nameExprs.maybeInsideLoop(variable);
	}

	/**
	 * @param {IRVariable} variable
	 * @returns {boolean}
	 */
	isInlineable(variable) {
		return this.#inline.has(variable);
	}

	/**
	 * @param {IRVariable} variable
	 * @returns {IRExpr}
	 */
	getInlineable(variable) {
		return assertDefined(this.#inline.get(variable), `${this.isInlineable(variable)} ????`).copy(new Map());
	}

	/**
	 * @param {IRVariable} variable 
	 * @param {IRExpr} expr 
	 */
	addInlineable(variable, expr) {
		this.#inline.set(variable, assertDefined(expr));
	}
}

/**
 * Base class of all Intermediate Representation expressions
 * @package
 */
class IRExpr extends Token {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * For pretty printing the IR
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		throw new Error("not yet implemented");
	}

	/**
	 * Link IRNameExprs to variables
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * Turns all IRConstExpr istances into IRLiteralExpr instances
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		throw new Error("not yet implemented");
	}

	/**
	 * Evaluates an expression to something (hopefully) literal
	 * Returns null if it the result would be worse than the current expression
	 * Doesn't return an IRLiteral because the resulting expression might still be an improvement, even if it isn't a literal
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used to inline literals and to evaluate IRCoreCallExpr instances with only literal args.
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used before simplifyTopology
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used during inlining/expansion to make sure multiple inlines of IRNameExpr don't interfere when setting the Debruijn index
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {IRVariable} fnVar
	 * @param {number[]} remaining
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		throw new Error("not yet implemented");
	}
}

/**
 * Intermediate Representation variable reference expression
 * @package
 */
class IRNameExpr extends IRExpr {
	#name;

	/**
	 * @type {?number} - cached debruijn index 
	 */
	#index;

	/**
	 * @type {?IRVariable} - cached variable
	 */
	#variable;

	/**
	 * @type {?IRValue} - cached eval result (reused when eval is called within simplifyLiterals)
	 */
	#value;

	/**
	 * @param {Word} name 
	 * @param {?IRVariable} variable
	 * @param {?IRValue} value
	 */
	constructor(name, variable = null, value = null) {
		super(name.site);
		assert(name.toString() != "_");
		assert(!name.toString().startsWith("undefined"));
		this.#name = name;
		this.#index = null;
		this.#variable = variable;
		this.#value = value;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.toString();
	}

	/**
	 * isVariable() should be used to check if a IRNameExpr.variable is equal to a IRVariable (includes special handling of "__core*")
	 * @type {IRVariable}
	 */
	get variable() {
		if (this.#variable === null) {
			throw new Error(`variable should be set (name: ${this.name})`);
		} else {
			return this.#variable;
		}
	}

	/**
	 * @package
	 * @returns {boolean}
	 */
	isCore() {
		const name = this.name;

		return name.startsWith("__core");
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {boolean}
	 */
	isVariable(ref) {
		if (this.isCore()) {
			return false;
		} else {
			return this.variable === ref;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return this.#name.toString();
	}

	/**
	 * @param {IRScope} scope
	 */
	resolveNames(scope) {
		if (!this.name.startsWith("__core")) {
			if (this.#variable == null || this.name.startsWith("__PARAM")) {
				[this.#index, this.#variable] = scope.get(this.#name);
			} else {
				[this.#index, this.#variable] = scope.get(this.#variable);
			}
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		if (this.#variable != null) {
			this.#value = stack.get(this.#variable);
		}

		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		if (this.isCore()) {
			return new IRFuncValue((args) => {
				return IRCoreCallExpr.evalValues(this.site, stack.throwRTErrors, this.#name.value.slice("__core__".length), args);
			});
		} else if (this.#variable === null) {
			throw new Error("variable should be set");
		} else {
			// prefer result from stack, and use cached result as backup
			const result = stack.get(this.#variable);

			if (result == null) {
				return this.#value;
			} else {
				return result;
			}
		}
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	removeUnusedCallArgs(fnVar, remaining) {
		return this;
	}
	
	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		if (this.#variable !== null && literals.has(this.#variable)) {
			return assertDefined(literals.get(this.#variable));
		} else if (this.#value instanceof IRLiteralExpr) {
			return this.#value;
		} else {
			return this;
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		nameExprs.register(this);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		let v = this.#variable;

		if (v != null) {
			const maybeNewVar = newVars.get(v);

			if (maybeNewVar != undefined) {
				v = maybeNewVar;
			}
		}

		return new IRNameExpr(this.#name, v, this.#value);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		if (!this.isCore() && registry.isInlineable(this.variable)) {
			return registry.getInlineable(this.variable);
		} else {
			return this;
		}
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return this;
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return this;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		if (this.name.startsWith("__core")) {
			return IRCoreCallExpr.newUplcBuiltin(this.site, this.name);
		} else if (this.#index === null) {
			// use a dummy index (for size calculation)
			return new UplcVariable(
				this.site,
				new UplcInt(this.site, BigInt(0), false),
			);
		} else {
			return new UplcVariable(
				this.site,
				new UplcInt(this.site, BigInt(this.#index), false),
			);
		}
	}
}

/**
 * IR wrapper for UplcValues, representing literals
 * @package
 */
class IRLiteralExpr extends IRExpr {
	/**
	 * @type {UplcValue}
	 */
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super(value.site);

		this.#value = value;
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return this.#value.toString();
	}

	/**
	 * Linking doesn't do anything for literals
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
	}

	/**
	 * @param {IRCallStack} stack
	 */
	evalConstants(stack) {
		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return new IRLiteralValue(this.value);
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	removeUnusedCallArgs(fnVar, remaining) {
		return this;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return this;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRLiteralExpr(this.#value);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return this;
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return this;
	}

	/**
	 * @returns {UplcConst}
	 */
	toUplc() {
		return new UplcConst(this.#value);
	}
}

/**
 * The IRExpr simplify methods aren't implemented because any IRConstExpr instances should've been eliminated during evalConstants.
 * @package
 */
class IRConstExpr extends IRExpr {
	#expr;

	/**
	 * @param {Site} site 
	 * @param {IRExpr} expr 
	 */
	constructor(site, expr) {
		super(site);
		this.#expr = expr;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return `const(${this.#expr.toString(indent)})`;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		this.#expr.registerNameExprs(nameExprs);
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.#expr.resolveNames(scope);
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		const result = this.#expr.eval(stack);

		if (result != null) {
			return new IRLiteralExpr(result.value);
		} else {
			console.log(this.toString());
			throw new Error("unable to evaluate const");
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return this.#expr.eval(stack);
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRConstExpr(this.site, this.#expr.simplifyUnusedRecursionArgs(fnVar, remaining));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return new IRConstExpr(this.site, this.#expr.simplifyUnused(registry));
	}
}

/**
 * IR function expression with some args, that act as the header, and a body expression
 * @package
 */
class IRFuncExpr extends IRExpr {
	#args;
	#body;

	/**
	 * @param {Site} site 
	 * @param {IRVariable[]} args 
	 * @param {IRExpr} body 
	 */
	constructor(site, args, body) {
		super(site);
		this.#args = args;
		this.#body = assertDefined(body);
	}

	get args() {
		return this.#args.slice();
	}

	get body() {
		return this.#body;
	}

	/**
	 * @returns {boolean}
	 */
	hasOptArgs() {
		const b = this.#args.some(a => a.name.startsWith("__useopt__"));

		if (b) {
			return b;
		}

		if (this.#body instanceof IRFuncExpr) {
			return this.#body.hasOptArgs();
		} else {
			return false;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		let innerIndent = (this.#body instanceof IRUserCallExpr && this.#body.argExprs.length == 1 && this.#body.fnExpr instanceof IRFuncExpr && this.#body.fnExpr.args[0].name.startsWith("__")) ? indent : indent + TAB;

		let s = "(" + this.#args.map(n => n.toString()).join(", ") + ") -> {\n" + innerIndent;
		s += this.#body.toString(innerIndent);
		s += "\n" + indent + "}";

		return s;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		// in the zero-arg case no Debruijn indices need to be added because we use Delay/Force

		for (let arg of this.#args) {
			scope = new IRScope(scope, arg);
		}

		this.#body.resolveNames(scope);
	}

	/**
	 * @param {IRCallStack} stack 
	 */
	evalConstants(stack) {
		return new IRFuncExpr(this.site, this.args, this.#body.evalConstants(stack));
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return new IRFuncValue((args) => {
			if (args.length != this.#args.length) {
				throw this.site.syntaxError(`expected ${this.#args.length} arg(s), got ${args.length} arg(s)`);
			}

			for (let i = 0; i < args.length; i++) {
				stack = stack.set(this.#args[i], args[i]);
			}

			return this.#body.eval(stack);
		});
	}
	
	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		this.#args.forEach(a => nameExprs.registerVariable(a));

		this.#body.registerNameExprs(nameExprs);
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining
	 * @returns {IRExpr} 
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyUnusedRecursionArgs(fnVar, remaining));
	}

	/**
	 * @param {IRLiteralRegistry} literals 
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyLiterals(literals));
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRFuncExpr(this.site, this.args.map(oldArg => oldArg.copy(newVars)), this.#body.copy(newVars));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyTopology(registry));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRFuncExpr}
	 */
	simplifyUnused(registry) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyUnused(registry));
	}

	/** 
	 * @returns {UplcTerm}
	 */
	toUplc() {
		let term = this.#body.toUplc();

		if (this.#args.length == 0) {
			// a zero-arg func is turned into a UplcDelay term
			term = new UplcDelay(this.site, term);
		} else {
			for (let i = this.#args.length - 1; i >= 0; i--) {
				term = new UplcLambda(this.site, term, this.#args[i].toString());
			}
		}

		return term;
	}
}

/**
 * Base class of IRUserCallExpr and IRCoreCallExpr
 * @package
 */
class IRCallExpr extends IRExpr {
	#argExprs;
	#parensSite;

	/**
	 * @param {Site} site
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(site, argExprs, parensSite) {
		super(site);
		this.#argExprs = assertDefined(argExprs);
		this.#parensSite = parensSite;
		
	}

	get argExprs() {
		return this.#argExprs.slice();
	}

	get parensSite() {
		return this.#parensSite;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	argsToString(indent = "") {
		return this.#argExprs.map(argExpr => argExpr.toString(indent)).join(", ")
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNamesInArgs(scope) {
		for (let argExpr of this.#argExprs) {
			argExpr.resolveNames(scope);
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr[]}
	 */
	evalConstantsInArgs(stack) {
		return this.#argExprs.map(a => a.evalConstants(stack));
	}

	/** 
	 * @param {IRCallStack} stack
	 * @returns {?IRValue[]} 
	 */
	evalArgs(stack) {
		/**
		 * @type {IRValue[]}
		 */
		let args = [];

		for (let argExpr of this.argExprs) {
			let argVal = argExpr.eval(stack);
			if (argVal !== null) {
				args.push(argVal);
			} else {
				return null;
			}
		}

		return args;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr[]}
	 */
	simplifyLiteralsInArgs(literals) {
		return this.#argExprs.map(a => a.simplifyLiterals(literals));
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprsInArgs(nameExprs) {
		this.#argExprs.forEach(a => a.registerNameExprs(nameExprs));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr[]}
	 */
	simplifyTopologyInArgs(registry) {
		return this.#argExprs.map(a => assertDefined(a.simplifyTopology(registry)));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr[]}
	 */
	simplifyUnusedInArgs(registry) {
		return this.#argExprs.map(a => a.simplifyUnused(registry));
	}

	/**
	 * @param {UplcTerm} term
	 * @returns {UplcTerm}
	 */
	toUplcCall(term) {
		if (this.#argExprs.length == 0) {
			// assuming underlying zero-arg function has been converted into a UplcDelay term
			term = new UplcForce(this.site, term);
		} else {
			for (let argExpr of this.#argExprs) {
				term = new UplcCall(this.site, term, argExpr.toUplc());
			}
		}

		return term;
	}
}

/**
 * IR function call of core functions
 * @package
 */
class IRCoreCallExpr extends IRCallExpr {
	#name;

	/**
	 * @param {Word} name 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(name, argExprs, parensSite) {
		super(name.site, argExprs, parensSite);
		assert(name.value !== "" && name.value !== "error");
		this.#name = name;

		assert(this.builtinName !== "", name.value);
	}

	get builtinName() {
		return this.#name.toString().slice(8);
	}

	/**
	 * @returns {boolean}
	 */
	isCast() {
		let name = this.builtinName;

		return name == "iData" || name == "bData" || name == "unIData" || name == "unBData" || name == "mapData" || name == "unMapData" || name == "listData" || name == "unListData";
	}

	/**
	 * @param {string} indent
	 * @returns {string}
	 */
	toString(indent = "") {
		if (this.builtinName == "ifThenElse") {
			return `${this.#name.toString()}(\n${indent}${TAB}${this.argExprs[0].toString(indent + TAB)},\n${indent}${TAB}${this.argExprs[1].toString(indent + TAB)},\n${indent}${TAB}${this.argExprs[2].toString(indent+TAB)}\n${indent})`;
		} else {
			return `${this.#name.toString()}(${this.argsToString(indent)})`;
		}
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.resolveNamesInArgs(scope);
	}

	/**
	 * @param {Site} site
	 * @param {boolean} throwRTErrors
	 * @param {string} builtinName
	 * @param {IRValue[]} args 
	 * @returns {?IRValue}
	 */
	static evalValues(site, throwRTErrors, builtinName, args) {
		if (builtinName == "ifThenElse") {
			let cond = args[0].value;
			if (cond !== null && cond instanceof UplcBool) {
				if (cond.bool) {
					return args[1];
				} else {
					return args[2];
				}
			} else {
				return null;
			}
		} else if (builtinName == "chooseList") {
			const lst = args[0].value;

			if (lst !== null && lst instanceof UplcList) {
				if (lst.length == 0) {
					return args[1];
				} else {
					return args[2];
				}
			} else {
				return null;
			}
		} else if (builtinName == "chooseUnit") {
			return args[1];
		} else if (builtinName == "trace") {
			return args[1];
		} else {
			/**
			 * @type {UplcValue[]}
			 */
			let argValues = [];

			for (let arg of args) {
				if (arg.value !== null) {
					argValues.push(arg.value);
				} else {
					return null;
				}
			}

			try {
				let result = UplcBuiltin.evalStatic(new Word(Site.dummy(), builtinName), argValues);

				return new IRLiteralValue(result);
			} catch(e) {
				// runtime errors like division by zero are allowed if throwRTErrors is false
				if (e instanceof RuntimeError) {
					if (!throwRTErrors) {
						return null;
					} else {
						throw e.addTraceSite(site);
					}
				} else {
					throw e;
				}
			}
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return new IRCoreCallExpr(this.#name, this.evalConstantsInArgs(stack), this.parensSite);
	}
	
	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		let args = this.evalArgs(stack);

		if (args !== null) {
			return IRCoreCallExpr.evalValues(this.site, stack.throwRTErrors, this.builtinName, args);
		}
		
		return null;
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		const argExprs = this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining));

		return new IRCoreCallExpr(this.#name, argExprs, this.parensSite);
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		if (args.length > 0 && args.every(a => a instanceof IRLiteralExpr)) {
			try {
				const res = IRCoreCallExpr.evalValues(
					this.site,
					false,
					this.builtinName,
					args.map(a => new IRLiteralValue(assertClass(a, IRLiteralExpr).value))
				);

				if (res != null) {
					return new IRLiteralExpr(res.value);
				}
			} catch (e) {
			}
		}

		switch(this.builtinName) {
			case "addInteger": {
					// check if first or second arg evaluates to 0
					const [a, b] = args;

					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt && a.value.int == 0n) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
						return a;
					}
				}
				break;
			case "appendByteString": {
					// check if either 1st or 2nd arg is the empty bytearray
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcByteArray && a.value.bytes.length == 0) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcByteArray && b.value.bytes.length == 0) {
						return a;
					}
				}
				break;
			case "appendString": {
					// check if either 1st or 2nd arg is the empty string
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcString && a.value.string.length == 0) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcString && b.value.string.length == 0) {
						return a;
					}
				}
				break;
			case "divideInteger": {
					// check if second arg is 1
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt) {
						if (b.value.int == 1n) {
							return a;
						} else if (b.value.int == 0n) {
							return new IRCoreCallExpr(this.#name, args, this.parensSite);
						}
					}
				}
				break;
			case "ifThenElse": {
					const [cond, a, b] = args;

					if (cond instanceof IRLiteralExpr && cond.value instanceof UplcBool) {
						// if the condition is a literal, one the branches can be returned
						if (cond.value.bool) {
							return a;
						} else {
							return b;
						}
					} else if (a instanceof IRLiteralExpr && a.value instanceof UplcBool && b instanceof IRLiteralExpr && b.value instanceof UplcBool) {
						if (a.value.bool && !b.value.bool) {
							return cond;
						} else if (
							!a.value.bool && 
							b.value.bool && 
							cond instanceof IRUserCallExpr && 
							cond.fnExpr instanceof IRNameExpr && 
							cond.fnExpr.name === "__helios__bool____not"
						) {
							return cond.argExprs[0];
						}	
					}
				}
				break;
			case "modInteger": {
					// check if second arg is 1
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 1n) {
						return new IRLiteralExpr(new UplcInt(this.site, 0n));
					}
				}
				break;
			case "multiplyInteger": {
					// check if first arg is 0 or 1
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt) {
						if (a.value.int == 0n) {
							return a;
						} else if (a.value.int == 1n) {
							return b;
						}
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcInt) {
						if (b.value.int == 0n) {
							return b;
						} else if (b.value.int == 1n) {
							return a;
						}
					}
				}
				break;
			case "subtractInteger": {
					// check if second arg evaluates to 0
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
						return a;
					}
				}
				break;
		}

		if (args.every(a => a instanceof IRLiteralExpr)) {
			return new IRLiteralExpr(
				UplcBuiltin.evalStatic(
					new Word(this.#name.site, this.builtinName),
					args.map(a => assertClass(a, IRLiteralExpr).value)
				)
			);
		} else {
			return new IRCoreCallExpr(this.#name, args, this.parensSite);
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRCoreCallExpr(this.#name, this.argExprs.map(a => a.copy(newVars)), this.parensSite);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		switch(this.builtinName) {
			case "encodeUtf8":
				// we can't eliminate a call to decodeUtf8, as it might throw some errors
				break;
			case "decodeUtf8": {
				// check if arg is a call to encodeUtf8
				const [arg] = args;
				if (arg instanceof IRCoreCallExpr && arg.builtinName == "encodeUtf8") {
					return arg.argExprs[0];
				}
				
				break;
			}		
			case "equalsData": {
				const [a, b] = args;

				if (a instanceof IRCoreCallExpr && b instanceof IRCoreCallExpr) {
					if (a.builtinName === "iData" && b.builtinName === "iData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsInteger"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "bData" && b.builtinName === "bData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsByteString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "decodeUtf8" && b.builtinName === "decodeUtf8") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);
					}
				}

				break;
			}
			case "ifThenElse": {
				const [cond, a, b] = args;

				if (cond instanceof IRCoreCallExpr && cond.builtinName === "nullList") {
					return new IRCoreCallExpr(new Word(this.site, "__core__chooseList"), [cond.argExprs[0], a, b], this.parensSite);
				}

				break;
			}
			case "chooseUnit": {
				const a = args[0];

				if (a instanceof IRLiteralExpr && a.value instanceof UplcUnit) {
					return args[1];
				}

				break;
			}
			case "trace":
				return args[1];
			case "unIData": {
				// check if arg is a call to iData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "iData") {
					return a.argExprs[0];
				}

				break;
			}
			case "iData": {
				// check if arg is a call to unIData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unIData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unBData": {
				// check if arg is a call to bData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "bData") {
					return a.argExprs[0];
				}

				break;
			}
			case "bData": {
				// check if arg is a call to unBData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unBData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unMapData": {
				// check if arg is call to mapData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "mapData") {
					return a.argExprs[0];
				}
				
				break;
			}
			case "mapData": {
				// check if arg is call to unMapData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unMapData") {
					return a.argExprs[0];
				}

				break;
			}
			case "listData": {
				// check if arg is call to unListData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unListData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unListData": {
				// check if arg is call to listData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "listData") {
					return a.argExprs[0];
				}
				
				break;
			}		
		}

		return new IRCoreCallExpr(this.#name, args, this.parensSite);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const args = this.simplifyUnusedInArgs(registry);

		return new IRCoreCallExpr(this.#name, args, this.parensSite);
	}

	/**
	 * @param {Site} site
	 * @param {string} name - full name of builtin, including prefix
	 * @returns {UplcTerm}
	 */
	static newUplcBuiltin(site, name) {
		let builtinName = name.slice("__core__".length);
		assert(!builtinName.startsWith("__core__"));

		/**
		 * @type {UplcTerm}
		 */
		let term = new UplcBuiltin(site, builtinName);

		let nForce = UPLC_BUILTINS[IRScope.findBuiltin(name)].forceCount;
 
		for (let i = 0; i < nForce; i++) {
			term = new UplcForce(site, term);
		}
 
		return term;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		let term = IRCoreCallExpr.newUplcBuiltin(this.site, this.#name.value);

		return this.toUplcCall(term);
	}
}

/**
 * IR function call of non-core function
 * @package
 */
class IRUserCallExpr extends IRCallExpr {
	#fnExpr;

	/**
	 * @param {IRExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(fnExpr, argExprs, parensSite) {
		super(fnExpr.site, argExprs, parensSite);

		this.#fnExpr = fnExpr;
	}

	/**
	 * @param {IRExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 * @returns {IRUserCallExpr}
	 */
	static new(fnExpr, argExprs, parensSite) {
		if (fnExpr instanceof IRAnonCallExpr) {
			return new IRNestedAnonCallExpr(fnExpr, argExprs, parensSite);
		} else if (fnExpr instanceof IRFuncExpr) {
			if (argExprs.length == 1 && argExprs[0] instanceof IRFuncExpr) {
				const argExpr = argExprs[0];

				if (argExpr instanceof IRFuncExpr) {
					return new IRFuncDefExpr(fnExpr, argExpr, parensSite);
				}
			}

			return new IRAnonCallExpr(fnExpr, argExprs, parensSite);
		} else {
			return new IRUserCallExpr(fnExpr, argExprs, parensSite);
		}
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	/**
	 * @param {string} indent
	 * @returns {string}
	 */
	toString(indent = "") {
		let comment = (this.#fnExpr instanceof IRFuncExpr && this.#fnExpr.args.length == 1 && this.#fnExpr.args[0].name.startsWith("__")) ? `/*${this.#fnExpr.args[0].name}*/` : "";

		return `${this.#fnExpr.toString(indent)}(${comment}${this.argsToString(indent)})`;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.#fnExpr.resolveNames(scope);

		super.resolveNamesInArgs(scope);
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return IRUserCallExpr.new(
			this.#fnExpr.evalConstants(stack),
			this.evalConstantsInArgs(stack),
			this.parensSite
		);
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {?IRValue}
	 */
	eval(stack) {
		let args = this.evalArgs(stack);

		if (args === null) {
			return null;
		} else {
			let fn = this.#fnExpr.eval(stack);

			if (fn === null) {
				return null;
			} else {
				try {
					return fn.call(args);
				} catch (e) {
					if (e instanceof RuntimeError) {
						if (!stack.throwRTErrors) {
							return null;
						} else {
							throw e.addTraceSite(this.site);
						}
					} else {
						throw e;
					}
				}
			}
		}
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		const argExprs = this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining));

		if (this.#fnExpr instanceof IRNameExpr && this.#fnExpr.isVariable(fnVar)) {
			const remainingArgExprs = argExprs.filter((_, i) => remaining.some(i_ => i_ == i));

			if (remainingArgExprs.length == 0) {
				return this.#fnExpr;
			} else {
				return new IRUserCallExpr(
					this.#fnExpr,
					remainingArgExprs,
					this.parensSite
				);
			}
		} else {
			const fnExpr = this.#fnExpr.simplifyUnusedRecursionArgs(fnVar, remaining);

			return new IRUserCallExpr(
				fnExpr,
				argExprs,
				this.parensSite
			)
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {(IRExpr[] | IRLiteralExpr)}
	 */
	simplifyLiteralsInArgsAndTryEval(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		if (args.length > 0 && args.every(a => ((a instanceof IRLiteralExpr) || (a instanceof IRFuncExpr)))) {
			try {
				const fn = this.#fnExpr.eval(new IRCallStack(false));

				if (fn != null) {
					const res = fn.call(
						args.map(a => {
							const v = a.eval(new IRCallStack(false));

							if (v == null) {
								// caught by outer catch
								throw new Error("null eval sub-result");
							} else {
								return v;
							}
						})
					);

					if (res != null) {
						return new IRLiteralExpr(res.value);
					}
				}
			} catch(e) {
			}
		}

		return args;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const argsOrLiteral = this.simplifyLiteralsInArgsAndTryEval(literals);

		if (argsOrLiteral instanceof IRLiteralExpr) {
			return argsOrLiteral;
		} else {
			const args = argsOrLiteral;

			return IRUserCallExpr.new(
				this.#fnExpr.simplifyLiterals(literals),
				args, 
				this.parensSite
			);
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);
		
		this.#fnExpr.registerNameExprs(nameExprs);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRUserCallExpr(this.#fnExpr.copy(newVars), this.argExprs.map(a => a.copy(newVars)), this.parensSite);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		if (this.#fnExpr instanceof IRNameExpr) {
			if (this.#fnExpr.isCore()) {
				return new IRCoreCallExpr(new Word(this.#fnExpr.site, this.#fnExpr.name), args, this.parensSite);
			} else {
				switch (this.#fnExpr.name) {
					case "__helios__bool____to_data": {
							// check if arg is a call to __helios__bool__from_data
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__bool__from_data") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__bool__from_data": {
							// check if arg is a call to __helios__bool____to_data
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__bool____to_data") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__bool____not": {
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__bool____not") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__concat": {
							// check if either 1st or 2nd arg is the empty list
							const [a, b] = args;
							if (a instanceof IRLiteralExpr && a.value instanceof UplcList && a.value.length == 0) {
								return b;
							} else {
								if (b instanceof IRLiteralExpr && b.value instanceof UplcList && b.value.length == 0) {
									return a;
								}
							}
						}
						break;
				}
			}
		}

		return IRUserCallExpr.new(
			this.#fnExpr.simplifyTopology(registry),
			args,
			this.parensSite
		);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const args = this.simplifyUnusedInArgs(registry);

		return IRUserCallExpr.new(
			this.#fnExpr.simplifyUnused(registry),
			args,
			this.parensSite
		);
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return super.toUplcCall(this.#fnExpr.toUplc());
	}
}

export class IRAnonCallExpr extends IRUserCallExpr {
	#anon;

	/**
	 * @param {IRFuncExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(fnExpr, argExprs, parensSite) {
		super(fnExpr, argExprs, parensSite)

		this.#anon = fnExpr;
	}

	/**
	 * Internal function
	 * @type {IRFuncExpr}
	 */
	get anon() {
		return this.#anon;
	}

	/**
	 * @type {IRVariable[]}
	 */
	get argVariables() {
		return this.#anon.args;
	}

	/**
	 * Add args to the stack as IRDeferredValue instances
	 * @param {IRCallStack} stack
	 */
	evalConstants(stack) {
		const argExprs = this.evalConstantsInArgs(stack);

		const parentStack = stack;

		argExprs.forEach((argExpr, i) => {
			stack = stack.set(this.argVariables[i], new IRDeferredValue(() => argExpr.eval(parentStack)));
		});

		const anonBody = this.#anon.body.evalConstants(stack);

		if (anonBody instanceof IRLiteralExpr) {
			return anonBody;
		} else {
			return IRUserCallExpr.new(
				new IRFuncExpr(
					this.#anon.site,
					this.#anon.args,
					anonBody
				),
				argExprs,
				this.parensSite
			);
		}
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		const argExprs = this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining));

		let anon = assertClass(this.#anon.simplifyUnusedRecursionArgs(fnVar, remaining), IRFuncExpr);

		return new IRAnonCallExpr(anon, argExprs, this.parensSite);
	}

	/**
	 * Add literal args to the map
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const argsOrLiteral = super.simplifyLiteralsInArgsAndTryEval(literals);

		if (argsOrLiteral instanceof IRLiteralExpr) {
			return argsOrLiteral;
		} else {
			const args = argsOrLiteral;

			args.forEach((arg, i) => {
				if (arg instanceof IRLiteralExpr) {
					literals.set(this.argVariables[i], arg);
				}
			});

			const anonBody = this.#anon.body.simplifyLiterals(literals);

			if (anonBody instanceof IRLiteralExpr) {
				return anonBody;
			} else {
				return new IRAnonCallExpr(
					new IRFuncExpr(
						this.#anon.site,
						this.#anon.args,
						anonBody
					),
					args,
					this.parensSite
				);
			}
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);

		this.argVariables.forEach(a => nameExprs.registerVariable(a));

		this.#anon.body.registerNameExprs(nameExprs);
	}
	
	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		assert(args.length == this.argVariables.length, `number of args should be equal to number of argVariables (${this.toString()})`);

		// remove unused args, inline args that are only referenced once, inline all IRNameExprs, inline function with default args,
		//  inline tiny builtins, inline functions whose body is simply a IRNameExpr
		const remainingIds = this.argVariables.map((variable, i) => {
			const n = registry.countReferences(variable);

			const arg = assertDefined(args[i]);

			if (
				n == 0 
				|| variable.isAlwaysInlineable()
				|| (n == 1 && (!registry.maybeInsideLoop(variable) || arg instanceof IRFuncExpr)) 
				|| arg instanceof IRNameExpr 
				|| (arg instanceof IRFuncExpr && arg.hasOptArgs())
				|| (arg instanceof IRFuncExpr && arg.body instanceof IRNameExpr)
				
			) {
				if (n > 0 && arg != null) {
					// inline
					registry.addInlineable(variable, arg);
				}

				return -1;
			} else {
				return i;
			}
		}).filter(i => i != -1);

		const remainingVars = remainingIds.map(i => this.argVariables[i]);
		const remainingExprs = remainingIds.map(i => args[i]);

		const anonBody = this.#anon.body.simplifyTopology(registry);

		if (anonBody instanceof IRLiteralExpr || remainingExprs.length == 0) {
			return anonBody;
		} else {
			return new IRAnonCallExpr(
				new IRFuncExpr(
					this.#anon.site,
					remainingVars,
					anonBody
				),
				remainingExprs,
				this.parensSite
			);
		}
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const args = this.simplifyUnusedInArgs(registry);

		// remove unused args
		const remainingIds = this.argVariables.map((variable, i) => {
			const n = registry.countReferences(variable);

			if (n == 0) {
				return -1;
			} else {
				return i;
			}
		}).filter(i => i != -1);

		const remainingVars = remainingIds.map(i => this.argVariables[i]);
		const remainingExprs = remainingIds.map(i => args[i]);

		const anonBody = this.#anon.body.simplifyUnused(registry);

		if (remainingVars.length == 0) {
			return anonBody;
		} else {
			return new IRAnonCallExpr(
				new IRFuncExpr(
					this.#anon.site,
					remainingVars,
					anonBody
				),
				remainingExprs,
				this.parensSite
			);
		}
	}
}

export class IRNestedAnonCallExpr extends IRUserCallExpr {
	#anon;

	/**
	 * @param {IRAnonCallExpr} anon
	 * @param {IRExpr[]} outerArgExprs
	 * @param {Site} parensSite
	 */
	constructor(anon, outerArgExprs, parensSite) {
		super(anon, outerArgExprs, parensSite);

		this.#anon = anon;
	}

	/**
	 * @param {IRVariable} fnVar
	 * @param {number[]} remaining
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRNestedAnonCallExpr(
			assertClass(this.#anon.simplifyUnusedRecursionArgs(fnVar, remaining), IRAnonCallExpr),
			this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining)),
			this.parensSite
		)
	}
		
	/**
	 * Flattens consecutive nested calls
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const anon = this.#anon.simplifyTopology(registry);

		const args = this.simplifyTopologyInArgs(registry);

		if (anon instanceof IRAnonCallExpr && anon.anon.body instanceof IRFuncExpr) {
			// flatten
			const allArgs = anon.argExprs.slice().concat(args);
			const allVars = anon.argVariables.slice().concat(anon.anon.body.args.slice());

			assert(allArgs.length == allVars.length);

			return IRUserCallExpr.new(
				new IRFuncExpr(
					anon.anon.body.site,
					allVars,
					anon.anon.body.body
				),
				allArgs,
				this.parensSite
			);
		} else {
			return IRUserCallExpr.new(
				anon,
				args,
				this.parensSite
			);
		}
	}

	/**
	 * Flattens consecutive nested calls
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const anon = this.#anon.simplifyUnused(registry);

		const args = this.simplifyUnusedInArgs(registry);

		if (anon instanceof IRAnonCallExpr) {
			return new IRNestedAnonCallExpr(
				anon,
				args,
				this.parensSite
			);
		} else {
			return new IRUserCallExpr(
				anon,
				args,
				this.parensSite
			)
		}
	}
}

export class IRFuncDefExpr extends IRAnonCallExpr {
	#def;

	/**
	 * @param {IRFuncExpr} anon 
	 * @param {IRFuncExpr} defExpr 
	 * @param {Site} parensSite
	 */
	constructor(anon, defExpr, parensSite) {
		super(anon, [defExpr], parensSite);

		this.#def = defExpr;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.argVariables.forEach(a => nameExprs.registerVariable(a));

		this.anon.body.registerNameExprs(nameExprs);

		nameExprs = nameExprs.resetVariables();

		this.#def.registerNameExprs(nameExprs);
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {[IRFuncExpr, IRExpr]}
	 */
	simplifyRecursionArgs(registry) {
		let anon = this.anon;
		let def = this.#def;

		if (this.#def.args.every(a => a.name.startsWith("__module") || a.name.startsWith("__const"))) {
			const usedArgs = this.#def.args.map((variable, i) => {
				const n = registry.countReferences(variable);

				if (n == 0) {
					return -1;
				} else {
					return i;
				}
			}).filter(i => i != -1);

			if (usedArgs.length < this.#def.args.length) {
				anon = new IRFuncExpr(
					anon.site,
					anon.args,
					anon.body.simplifyUnusedRecursionArgs(anon.args[0], usedArgs)
				);

				if (usedArgs.length == 0) {
					// simplify the body if none of the args remain
					return [anon, this.#def.body];
				}

				def = new IRFuncExpr(
					this.#def.site,
					usedArgs.map(i => def.args[i]),
					this.#def.body
				);
			}
		}

		return [anon, def];
	}

	/**
	 * Remove args that are unused in def
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const [anon, def] = this.simplifyRecursionArgs(registry);
		
		const res = (new IRAnonCallExpr(anon, [def], this.parensSite)).simplifyTopology(registry);

		if (res instanceof IRAnonCallExpr && res.argExprs.length == 0) {
			const argExpr = res.argExprs[0];
			
			if (res.anon.args.length == 1 && argExpr instanceof IRFuncExpr) {
				return new IRFuncDefExpr(
					res.anon,
					argExpr,
					this.parensSite
				)
			}
		}

		return res;
	}

	/**
	 * @param {IRVariable} fnVar
	 * @param {number[]} remaining
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRFuncDefExpr(
			assertClass(this.anon.simplifyUnusedRecursionArgs(fnVar, remaining), IRFuncExpr),
			assertClass(this.#def.simplifyUnusedRecursionArgs(fnVar, remaining), IRFuncExpr),
			this.parensSite
		);
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		if (registry.countReferences(this.anon.args[0]) == 0) {
			return this.anon.body.simplifyUnused(registry);
		} else {
			const [anon, def] = this.simplifyRecursionArgs(registry);

			if (def instanceof IRFuncExpr) {
				return new IRFuncDefExpr(
					anon.simplifyUnused(registry),
					def.simplifyUnused(registry),
					this.parensSite
				);
			} else {
				return new IRAnonCallExpr(
					anon.simplifyUnused(registry),
					[def],
					this.site
				);
			}
		}
	}
}

/**
 * Intermediate Representation error call (with optional literal error message)
 * @package
 */
class IRErrorCallExpr extends IRExpr {
	#msg;

	/**
	 * @param {Site} site 
	 * @param {string} msg 
	 */
	constructor(site, msg = "") {
		super(site);
		this.#msg = msg;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return "error()";
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		if (stack.throwRTErrors) {
			throw this.site.runtimeError(this.#msg);
		} else {
			return null;
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals 
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return this;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRErrorCallExpr(this.site, this.#msg);
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return this;
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return this;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return new UplcError(this.site, this.#msg);
	}
}


/////////////////////////////////////
// Section 29: IR AST build functions
/////////////////////////////////////

/**
 * Build an Intermediate Representation expression
 * @param {Token[]} ts 
 * @returns {IRExpr}
 * @package
 */
function buildIRExpr(ts) {
	/** @type {?IRExpr} */
	let expr = null;

	while (ts.length > 0) {
		let t = ts.shift();

		if (t === undefined) {
			throw new Error("unexpected");
		} else {
			if (t.isGroup("(") && ts.length > 0 && ts[0].isSymbol("->")) {
				assert(expr === null);

				ts.unshift(t);

				expr = buildIRFuncExpr(ts);
			} else if (t.isGroup("(")) {
				let group = assertDefined(t.assertGroup());

				if (expr === null) {
					if (group.fields.length == 1) {
						expr = buildIRExpr(group.fields[0])
					} else if (group.fields.length == 0) {
						expr = new IRLiteralExpr(new UplcUnit(t.site));
					} else {
						group.syntaxError("unexpected parentheses with multiple fields");
					}
				} else {
					let args = [];
					for (let f of group.fields) {
						args.push(buildIRExpr(f));
					}

					if (expr instanceof IRNameExpr && expr.name.startsWith("__core")) {
						if (!IRScope.isBuiltin(expr.name)) {
							throw expr.site.referenceError(`builtin '${expr.name}' undefined`);
						}

						expr = new IRCoreCallExpr(new Word(expr.site, expr.name), args, t.site);
					} else {
						expr = IRUserCallExpr.new(expr, args, t.site);
					}
				}
			} else if (t.isSymbol("-")) {
				// only makes sense next to IntegerLiterals
				let int = assertDefined(ts.shift());
				if (int instanceof IntLiteral) {
					expr = new IRLiteralExpr(new UplcInt(int.site, int.value * (-1n)));
				} else {
					throw int.site.typeError(`expected literal int, got ${int}`);
				}
			} else if (t instanceof BoolLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcBool(t.site, t.value));
			} else if (t instanceof IntLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcInt(t.site, t.value));
			} else if (t instanceof ByteArrayLiteral) {
				assert(expr === null);
				if (t.bytes.length == 0 && ts[0] != undefined && ts[0] instanceof ByteArrayLiteral) {
					// literal data is ##<...>
					const next = assertDefined(ts.shift());

					if (next instanceof ByteArrayLiteral) {
						expr = new IRLiteralExpr(new UplcDataValue(next.site, UplcData.fromCbor(next.bytes)));
					} else {
						throw new Error("unexpected");
					}
				} else {
					expr = new IRLiteralExpr(new UplcByteArray(t.site, t.bytes));
				}
			} else if (t instanceof StringLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcString(t.site, t.value));
			} else if (t.isWord("const")) {
				assert(expr === null);

				let maybeGroup = ts.shift();
				if (maybeGroup === undefined) {
					throw t.site.syntaxError("expected parens after const");
				} else {
					let parens = assertDefined(maybeGroup.assertGroup("(", 1));
					let pts = parens.fields[0];

					expr = new IRConstExpr(t.site, buildIRExpr(pts));
				}
			} else if (t.isWord("error")) {
				assert(expr === null);

				let maybeGroup = ts.shift();
				if (maybeGroup === undefined) {
					throw t.site.syntaxError("expected parens after error");
				} else {
					let parens = assertDefined(maybeGroup.assertGroup("(", 1));
					let pts = parens.fields[0];

					if (pts.length != 1) {
						throw parens.syntaxError("error call expects a single literal string msg arg");
					}

					let msg = pts[0];
					if (!(msg instanceof StringLiteral)) {
						throw msg.syntaxError("error call expects literal string msg arg");
					}
					expr = new IRErrorCallExpr(t.site, msg.value);
				}
			} else if (t.isWord()) {
				assert(expr === null);
				expr = new IRNameExpr(assertDefined(t.assertWord()));
			} else {
				throw new Error("unhandled untyped token " + t.toString());
			}
		}
	}

	if (expr === null) {
		throw new Error("expr is null");
	} else {
		return expr;
	}
}

/**
 * Build an IR function expression
 * @param {Token[]} ts 
 * @returns {IRFuncExpr}
 */
function buildIRFuncExpr(ts) {
	let maybeParens = ts.shift();
	if (maybeParens === undefined) {
		throw new Error("empty func expr");
	} else {
		let parens = assertDefined(maybeParens.assertGroup("("));

		assertDefined(ts.shift()).assertSymbol("->");
		let braces = assertDefined(assertDefined(ts.shift()).assertGroup("{"));

		/**
		 * @type {Word[]}
		 */
		let argNames = [];

		for (let f of parens.fields) {
			assert(f.length == 1, "expected single word per arg");
			argNames.push(assertDefined(f[0].assertWord()));
		}

		if (braces.fields.length > 1) {
			throw braces.syntaxError("unexpected comma in function body")
		} else if (braces.fields.length == 0) {
			throw braces.syntaxError("empty function body")
		}

		let bodyExpr = buildIRExpr(braces.fields[0]);

		return new IRFuncExpr(parens.site, argNames.map(a => new IRVariable(a)), bodyExpr)
	}
}


/////////////////////////
// Section 30: IR Program
/////////////////////////


/**
 * Wrapper for IRFuncExpr, IRCallExpr or IRLiteralExpr
 * @package
 */
class IRProgram {
	#expr;
	#properties;

	/**
	 * @param {IRFuncExpr | IRCallExpr | IRLiteralExpr} expr
	 * @param {ProgramProperties} properties
	 */
	constructor(expr, properties) {
		this.#expr = expr;
		this.#properties = properties;
	}

	/**
	 * @param {IRExpr} expr 
	 * @returns {IRFuncExpr | IRCallExpr | IRLiteralExpr}
	 */
	static assertValidRoot(expr) {
		if (expr instanceof IRFuncExpr || expr instanceof IRCallExpr || expr instanceof IRLiteralExpr) {
			return expr;
		} else {
			throw new Error("invalid IRExpr type for IRProgram");
		}
	}

	/**
	 * @package
	 * @param {IR} ir 
	 * @param {?number} purpose
	 * @param {boolean} simplify
	 * @param {boolean} throwSimplifyRTErrors - if true -> throw RuntimErrors caught during evaluation steps
	 * @param {IRScope} scope
	 * @returns {IRProgram}
	 */
	static new(ir, purpose, simplify = false, throwSimplifyRTErrors = false, scope = new IRScope(null, null)) {
		let [irSrc, codeMap] = ir.generateSource();

		const callsTxTimeRange = irSrc.match(/\b__helios__tx__time_range\b/) !== null;

		let irTokens = tokenizeIR(irSrc, codeMap);

		let expr = buildIRExpr(irTokens);
		
		try {
			expr.resolveNames(scope);
		} catch (e) {
			console.log((new Source(irSrc)).pretty());

			throw e;
		}
		
		expr = expr.evalConstants(new IRCallStack(throwSimplifyRTErrors));

		// expr = IRProgram.simplifyUnused(expr); // this has been deprecated in favor of Program.eliminateUnused() (TODO: check that performs is the same and then remove this)

		if (simplify) {
			// inline literals and evaluate core expressions with only literal args (some can be evaluated with only partial literal args)
			expr = IRProgram.simplify(expr);
		}

		// make sure the debruijn indices are correct (doesn't matter for simplication because names are converted into unique IRVariables, but is very important before converting to UPLC)
		expr.resolveNames(scope);

		const program = new IRProgram(IRProgram.assertValidRoot(expr), {
			purpose: purpose,
			callsTxTimeRange: callsTxTimeRange
		});

		return program;
	}

	/**
	 * @param {IRExpr} expr
	 * @returns {IRExpr}
	 */
	static simplify(expr) {
		let dirty = true;
		let oldState = expr.toString();

		while (dirty) {
			dirty = false;

			expr = IRProgram.simplifyLiterals(expr);

			expr = IRProgram.simplifyTopology(expr);

			const newState = expr.toString();

			if (newState != oldState) {
				dirty = true;
				oldState = newState;
			}
		}

		return expr;
	}

	/**
	 * @param {IRExpr} expr 
	 * @returns {IRExpr}
	 */
	static simplifyLiterals(expr) {
		return expr.simplifyLiterals(new Map());
	}

	/**
	 * @param {IRExpr} expr 
	 * @returns {IRExpr}
	 */
	static simplifyTopology(expr) {
		const nameExprs = new IRNameExprRegistry();

		expr.registerNameExprs(nameExprs);

		return expr.simplifyTopology(new IRExprRegistry(nameExprs));
	}

	/**
	 * @param {IRExpr} expr 
	 * @returns {IRExpr}
	 */
	static simplifyUnused(expr) {
		let dirty = true;
		let oldState = expr.toString();

		while (dirty) {
			dirty = false;

			const nameExprs = new IRNameExprRegistry();

			expr.registerNameExprs(nameExprs);
	
			expr = expr.simplifyUnused(new IRExprRegistry(nameExprs));

			const newState = expr.toString();

			if (newState != oldState) {
				dirty = true;
				oldState = newState;
			}
		}
		
		return expr;
	}

	/**
	 * @package
	 * @type {IRFuncExpr | IRCallExpr | IRLiteralExpr}
	 */
	get expr() {
		return this.#expr;
	}

	/**
	 * @package
	 * @type {ProgramProperties}
	 */
	get properties() {
		return this.#properties;
	}

	/**
	 * @package
	 * @type {Site}
	 */
	get site() {
		return this.#expr.site;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		if (this.#expr instanceof IRLiteralExpr) {
			let v = this.#expr.value;

			if (v instanceof UplcDataValue) {
				return v.data;
			} else if (v instanceof UplcInt) {
				return new IntData(v.int);
			} else if (v instanceof UplcBool) {
				return new ConstrData(v.bool ? 1 : 0, []);
			} else if (v instanceof UplcList) {
				if (v.isDataList()) {
					return new ListData(v.list.map(item => item.data));
				} else if (v.isDataMap()) {
					return new MapData(v.list.map(item => {
						const pair = assertClass(item, UplcPair);

						return [pair.key, pair.value];
					}));
				}
			} else if (v instanceof UplcString) {
				return new ByteArrayData(textToBytes(v.string));
			} else if (v instanceof UplcByteArray) {
				return new ByteArrayData(v.bytes);
			}
		} 

		throw new Error(`unable to turn '${this.toString()}' into data`);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#expr.toString();
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		return new UplcProgram(this.#expr.toUplc(), this.#properties);
	}

	/**
	 * @returns {number}
	 */
	calcSize() {
		return this.toUplc().calcSize();
	}
}

export class IRParametricProgram {
	#irProgram;
	#parameters;

	/**
	 * @param {IRProgram} irProgram
	 * @param {string[]} parameters
	 */
	constructor(irProgram, parameters) {
		this.#irProgram = irProgram;
		this.#parameters = parameters;
	}

	/**
	 * @package
	 * @param {IR} ir 
	 * @param {?number} purpose
	 * @param {string[]} parameters
	 * @param {boolean} simplify
	 * @returns {IRParametricProgram}
	 */
	static new(ir, purpose, parameters, simplify = false) {
		let scope = new IRScope(null, null);

		parameters.forEach((p, i) => {
			const internalName = `__PARAM_${i}`;

			scope = new IRScope(scope, new IRVariable(new Word(Site.dummy(), internalName)));
		});

		const irProgram = IRProgram.new(ir, purpose, simplify, false, scope);

		return new IRParametricProgram(irProgram, parameters);
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		let exprUplc = this.#irProgram.expr.toUplc();

		this.#parameters.forEach(p => {
			exprUplc = new UplcLambda(Site.dummy(), exprUplc, p);
		});

		return new UplcProgram(exprUplc, this.#irProgram.properties);
	}
}



/////////////////////////////
// Section 31: Helios program
/////////////////////////////


/**
 * A Module is a collection of statements
 */
class Module {
	#name;
	#statements;

	/**
	 * @param {Word} name 
	 * @param {Statement[]} statements
	 */
	constructor(name, statements) {
		this.#name = name;
		this.#statements = statements;

		this.#statements.forEach(s => s.setBasePath(`__module__${this.#name.toString()}`));
	}

	/**
	 * @param {string} rawSrc
	 * @param {?number} fileIndex - a unique optional index passed in from outside that makes it possible to associate a UserError with a specific file
	 * @returns {Module}
	 */
	static new(rawSrc, fileIndex = null) {
		const src = new Source(rawSrc, fileIndex);

		const ts = tokenize(src);

		src.throwErrors();

		if (ts === null) {
			throw new Error("should've been thrown above");
		}

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, 1, "empty script");
		}

		const [purpose, name, statements, mainIdx] = buildScript(ts, ScriptPurpose.Module);

		src.throwErrors();

		if (name !== null) {
			return new Module(name, statements);
		} else {
			throw new Error("unexpected"); // should've been caught by calling src.throwErrors() above
		}
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {Statement[]}
	 */
	get statements() {
		return this.#statements.slice();
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		for (let s of this.#statements) {
			s.loopConstStatements(namespace, callback);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#statements.map(s => s.toString()).join("\n");
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	evalTypes(scope) {
		for (let s of this.statements) {
			s.eval(scope);
		}
	}

	/**
	 * This module can depend on other modules
	 * TODO: detect circular dependencies
	 * @param {Module[]} modules 
	 * @param {Module[]} stack
	 * @returns {Module[]}
	 */
	filterDependencies(modules, stack = []) {
		/**
		 * @type {Module[]}
		 */
		let deps = [];

		/** @type {Module[]} */
		let newStack = [this];
		newStack = newStack.concat(stack);

		for (let s of this.#statements) {
			if (s instanceof ImportFromStatement || s instanceof ImportModuleStatement) {
				let mn = s.moduleName.value;

				if (mn == this.name.value) {
					throw s.syntaxError("can't import self");
				} else if (stack.some(d => d.name.value == mn)) {
					throw s.syntaxError("circular import detected");
				}

				// if already in deps, then don't add (because it will have been added before along with all its dependencies)
				if (!deps.some(d => d.name.value == mn)) {
					let m = modules.find(m => m.name.value == mn);

					if (m === undefined) {
						throw s.referenceError(`module '${mn}' not found`);
					} else {
						// only add deps that weren't added before
						let newDeps = m.filterDependencies(modules, newStack).concat([m]).filter(d => !deps.some(d_ => d_.name.value == d.name.value));

						deps = deps.concat(newDeps);
					}
				}
			}
		}

		return deps;
	}
}

/**
 * The entrypoint module
 */
class MainModule extends Module {
	/**
	 * @param {Word} name 
	 * @param {Statement[]} statements 
	 */
	constructor(name, statements) {
		super(name, statements);
	}

	/**
	 * @type {FuncStatement}
	 */
	get mainFunc() {
		for (let s of this.statements) {
			if (s.name.value == "main") {
				if (!(s instanceof FuncStatement)) {	
					throw s.typeError("'main' isn't a function statement");
				} else {
					return s;
				}
			}
		}

		throw new Error("'main' not found (is a module being used as an entrypoint?)");
	}
}

/**
 * @typedef {{[name: string]: any}} UserTypes
 */

/**
 * Helios root object
 */
 export class Program {
	#purpose;
	#modules;

	/** @type {UserTypes} */
	#types;

	/**
	 * Cache of const values
	 * @type {Object.<string, HeliosData>}
	 */
	#parameters;
	
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules
	 */
	constructor(purpose, modules) {
		this.#purpose = purpose;
		this.#modules = modules;
		this.#types = {};
		this.#parameters = {};
	}

	/**
	 * @param {string} rawSrc 
	 * @returns {[purpose, Module[]]}
	 */
	static parseMain(rawSrc) {
		const src = new Source(rawSrc, 0);

		const ts = tokenize(src);

		src.throwErrors();

		if (ts === null) {
			throw new Error("should've been thrown above");
		}

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, 1, "empty script");
		}

		const [purpose, name, statements, mainIdx] = buildScript(ts);

		src.throwErrors();

		if (purpose !== null && name !== null) {
			/**
			 * @type {Module[]}
			 */
			const modules = [new MainModule(name, statements.slice(0, mainIdx+1))];

			if (mainIdx < statements.length - 1) {
				modules.push(new Module(name, statements.slice(mainIdx+1)));
			}

			return [purpose, modules];
		} else {
			throw new Error("unexpected"); // should've been caught by calling src.throwErrors() above
		}
	}

	/**
	 * 
	 * @param {string} mainName 
	 * @param {string[]} moduleSrcs
	 * @returns {Module[]}
	 */
	static parseImports(mainName, moduleSrcs = []) {
		let imports = moduleSrcs.map((src, i) => Module.new(src, i+1));

		/**
		 * @type {Set<string>}
		 */
		let names = new Set();

		names.add(mainName);

		for (let m of imports) {
			if (names.has(m.name.value)) {
				throw m.name.syntaxError(`non-unique module name '${m.name.value}'`);
			}

			names.add(m.name.value);
		}

		return imports;
	}

	/**
	 * Creates  a new program.
	 * @param {string} mainSrc 
	 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
	 * @returns {Program}
	 */
	static new(mainSrc, moduleSrcs = []) {
		let [purpose, modules] = Program.parseMain(mainSrc);

		let site = modules[0].name.site;

		let imports = Program.parseImports(modules[0].name.value, moduleSrcs);
		
		let mainImports = modules[0].filterDependencies(imports);

		/** @type {Module[]} */
		let postImports = [];

		if (modules.length > 1) {
			postImports = modules[modules.length - 1].filterDependencies(imports).filter(m => !mainImports.some(d => d.name.value == m.name.value));
		}

		// create the final order of all the modules (this is the order in which statements will be added to the IR)
		modules = mainImports.concat([modules[0]]).concat(postImports).concat(modules.slice(1));
	
		/**
		 * @type {Program}
		 */
		let program;

		switch (purpose) {
			case ScriptPurpose.Testing:
				program = new TestingProgram(modules);
				break;
			case ScriptPurpose.Spending:
				program = new SpendingProgram(modules);
				break;
			case ScriptPurpose.Minting:
				program = new MintingProgram(modules);
				break
			case ScriptPurpose.Staking:
				program = new StakingProgram(modules);
				break
			case ScriptPurpose.Module:
				throw site.syntaxError("can't use module for main");
			default:
				throw new Error("unhandled script purpose");
		}

		const topScope = program.evalTypes();

		program.fillTypes(topScope);

		return program;
	}

	/** 
	 * @type {Module[]} 
	 */
	get mainImportedModules() {
		/** @type {Module[]} */
		let ms = [];

		for (let m of this.#modules) {
			if (m instanceof MainModule) {
				break;
			} else {
				ms.push(m);
			}
		}

		return ms;
	}

	/**
	 * @type {MainModule}
	 */
	get mainModule() {
		for (let m of this.#modules) {
			if (m instanceof MainModule) {
				return m;
			}
		}

		throw new Error("MainModule not found");
	}

	/**
	 * @type {?Module}
	 */
	get postModule() {
		let m = this.#modules[this.#modules.length - 1];

		if (m instanceof MainModule) {
			return null;
		} else {
			return m;
		}
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.mainModule.name.value;
	}

	/**
	 * @type {FuncStatement}
	 */
	get mainFunc() {
		return this.mainModule.mainFunc;
	}

	/**
	 * @type {DataType[]}
	 */
	get mainArgTypes() {
		return this.mainFunc.argTypes.map(at => assertDefined(at.asDataType));
	}

	/**
	 * @type {string}
	 */
	get mainPath() {
		return this.mainFunc.path;
	}

	/**
	 * @type {Statement[]}
	 */
	get mainStatements() {
		return this.mainModule.statements;
	}

	/**
	 * Needed to list the paramTypes, and to call changeParam
	 * @type {Statement[]}
	 */
	get mainAndPostStatements() {
		let statements = this.mainModule.statements;

		if (this.postModule != null) {
			statements = statements.concat(this.postModule.statements);
		}

		return statements;
	}

	/**
	 * @type {[Statement, boolean][]} - boolean value marks if statement is import or not
	 */
	get allStatements() {
		/**
		 * @type {[Statement, boolean][]}
		 */
		let statements = [];

		for (let i = 0; i < this.#modules.length; i++) {
			let m = this.#modules[i];

			// MainModule or PostModule => isImport == false
			let isImport = !(m instanceof MainModule || (i == this.#modules.length - 1));

			statements = statements.concat(m.statements.map(s => [s, isImport]));
		}

		return statements;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#modules.map(m => m.toString()).join("\n");
	}

	/**
	 * @param {GlobalScope} globalScope
	 * @returns {TopScope}
	 */
	evalTypesInternal(globalScope) {
		const topScope = new TopScope(globalScope);

		// loop through the modules

		for (let i = 0; i < this.#modules.length; i++) {
			const m = this.#modules[i];

			// reuse main ModuleScope for post module
			const moduleScope = (m ===  this.postModule) ? topScope.getModuleScope(this.mainModule.name) : new ModuleScope(topScope);

			m.evalTypes(moduleScope);

			if (m instanceof MainModule) {
				topScope.setStrict(false);
			}

			if (m !== this.postModule) {
				topScope.setScope(m.name, moduleScope);
			}
		}
		
		return topScope;
	}

	/**
	 * @returns {TopScope}
	 */
	evalTypes() {
		throw new Error("not yet implemeneted");
	}

	/**
	 * @type {UserTypes}
	 */
	get types() {
		return this.#types;
	}

	/**
	 * Fill #types with convenient javascript equivalents of Int, ByteArray etc.
	 * @param {TopScope} topScope
	 */
	fillTypes(topScope) {
		const mainModuleScope = topScope.getModuleScope(this.mainModule.name);

		mainModuleScope.loopTypes((name, type) => {
			if (type?.asDataType?.offChainType) {
				this.#types[name] = type.asDataType.offChainType;
			}
		});
	}

	/**
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(callback) {
		const postModule = this.postModule;

		for (let m of this.#modules) {
			const namespace = (m instanceof MainModule || m === postModule) ? "" : `${m.name.value}::`;

			m.loopConstStatements(namespace, callback);
		}
	}

	/**
	 * @type {{[name: string]: DataType}}
	 */
	get paramTypes() {
		/**
		 * @type {{[name: string]: DataType}}
		 */
		let res = {};

		this.loopConstStatements((name, constStatement) => {
			res[name] = constStatement.type
		});

		return res;
	}

	/**
	 * Change the literal value of a const statements  
	 * @package
	 * @param {string} name
	 * @param {UplcData} data
	 */
	changeParamSafe(name, data) {
		let found = false;

		this.loopConstStatements((constName, constStatement) => {
			if (!found) {
				if (constName == name) {
					constStatement.changeValueSafe(data);
					found = true;
				}
			}
		})

		if (!found) {
			throw this.mainFunc.referenceError(`param '${name}' not found`);
		}
	}

	/**
	 * @param {string} name 
	 * @returns {ConstStatement | null}
	 */
	findConstStatement(name) {
		/**
		 * @type {ConstStatement | null}
		 */
		let cs = null;

		this.loopConstStatements((constName, constStatement) => {
			if (cs === null) {
				if (name == constName)  {
					cs = constStatement;
				}
			}
		});

		return cs;
	}

	/**
	 * @param {ConstStatement} constStatement
	 * @returns {UplcValue}
	 */
	evalConst(constStatement) {
		const map = this.fetchDefinitions(new IR(""), [], (s, isImport) => {
			let found = false;
			s.loopConstStatements("", (_, cs) => {
				if (!found) {
					if (cs === constStatement) {
						found = true;
					}
				}
			})

			return found;
		});

		const path = constStatement.path;

		const inner = new IR([
			new IR("const"),
			new IR("("),
			new IR(path),
			new IR(")")
		]);

		const ir = this.wrapInner(inner, map);

		const irProgram = IRProgram.new(ir, this.#purpose, true, true);

		return new UplcDataValue(irProgram.site, irProgram.data);
	}

	/**
	 * Doesn't use wrapEntryPoint
	 * @param {string} name - can be namespace: "Type::ConstName" or "Module::ConstName" or "Module::Type::ConstName"
	 * @returns {UplcValue}
	 */
	evalParam(name) {
		/** 
		 * @type {ConstStatement | null} 
		 */
		let constStatement = this.findConstStatement(name);

		if (!constStatement) {
			throw new Error(`param '${name}' not found`);
		}

		return this.evalConst(constStatement);
	}
	
	/**
	 * Alternative way to get the parameters as HeliosData instances
	 * @returns {{[name: string]: HeliosData | any}}
	 */
	get parameters() {
		const that = this;

		// not expensive, so doesn't need to be evaluated on-demand
		const types = this.paramTypes;

		const handler = {
			/**
			 * Return from this.#parameters if available, or calculate
			 * @param {{[name: string]: HeliosData}} target 
			 * @param {string} name
			 * @returns {HeliosData}
			 */
			get(target, name) {
				if (name in target) {
					return target[name];
				} else {
					const type = assertDefined(types[name], `invalid param name '${name}'`);
					
					const uplcValue = that.evalParam(name);

					const value = assertDefined(type.offChainType).fromUplcData(uplcValue.data);
						
					target[name] = value;

					return value;
				}
			},
			
			/**
			 * @param {{[name: string]: HeliosData}} target
			 * @param {string} name
			 * @param {HeliosData | any} rawValue
			 * @returns {boolean}
			 */
			set(target, name, rawValue) {
				let permissive = false;
				if (name.startsWith("?")) {
					name = name.slice(1);
					permissive = true;
				}

				if (!types[name]) {
					if (!permissive) {
						throw new Error(`invalid parameter name '${name}'`);
					}
				} else {
					const UserType = assertDefined(types[name].offChainType, `invalid param name '${name}'`);

					const value = rawValue instanceof UserType ? rawValue : new UserType(rawValue);

					target[name] = value;

					that.changeParamSafe(name, value._toUplcData());
				}

				return true;
			}
		};

		return new Proxy(this.#parameters, handler);
	}

	/**
	 * Use proxy for setting
	 * @param {{[name: string]: HeliosData | any}} values
	 */
	set parameters(values) {
		const proxy = this.parameters;

		for (let name in values) {
			proxy[name] = values[name];
		}
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @param {(s: Statement, isImport: boolean) => boolean} endCond
	 * @returns {IRDefinitions} 
	 */
	statementsToIR(parameters, endCond) {
		// find the constStatements associated with the parameters
		/**
		 * @type {(ConstStatement | null)[]}
		 */
		const parameterStatements = new Array(parameters.length).fill(null);

		if (parameters.length > 0) {
			for (let statement of this.mainStatements) {
				if (statement instanceof ConstStatement) {
					const i = parameters.findIndex(p => statement.name.value == p);

					if (i != -1) {
						parameterStatements[i] = statement;
					}
				}
			}

			parameters.forEach((p, i) => {
				if (parameterStatements[i] == null) {
					throw new Error(`parameter ${p} not found (hint: must come before main)`);
				}
			});
		}		

		/**
		 * @type {IRDefinitions}
		 */
		const map = new Map();

		for (let [statement, isImport] of this.allStatements) {
			if (parameters.length > 0 && statement instanceof ConstStatement) {
				const i = parameterStatements.findIndex(cs => cs === statement);

				if (i != -1) {
					let ir = new IR(`__PARAM_${i}`);

					ir = new IR([
						new IR(`${statement.type.path}__from_data`),
						new IR("("),
						ir,
						new IR(")")
					]);

					map.set(statement.path, ir); 

					continue;
				}
			}

			statement.toIR(map);

			if (endCond(statement, isImport)) {
				break;
			}
		}

		return map;
	}

	/**
	 * For top-level statements
	 * @package
	 * @param {IR} mainIR
	 * @param {IRDefinitions} map
	 * @returns {IR}
	 */
	static injectMutualRecursions(mainIR, map) {
		/**
		 * @param {string} name
		 * @param {string[]} potentialDependencies 
		 * @returns {string[]}
		 */
		const filterMutualDependencies = (name, potentialDependencies) => {
			// names to be treated
			const stack = [name];

			/**
			 * @type {Set<string>}
			 */
			let set = new Set();

			while (stack.length > 0) {
				const name = assertDefined(stack.shift());

				const ir = assertDefined(map.get(name));

				const localDependencies = potentialDependencies.slice(potentialDependencies.findIndex(n => n == name));

				for (let i = 0; i < localDependencies.length; i++) {
					const dep = localDependencies[i];
					if (ir.includes(dep)) {
						set.add(dep)

						if (dep != name) {
							stack.push(dep);
						}
					}
				}
			}

			return potentialDependencies.filter(d => set.has(d));
		}

		const keys = Array.from(map.keys());

		for (let i = keys.length - 1; i >= 0; i--) {
			const k = keys[i];

			// don't make a final const statement self-recursive (makes evalParam easier)
			// don't make __helios builtins mutually recursive
			// don't make __from_data and ____<op> methods mutually recursive (used frequently inside the entrypoint)
			if ((k.startsWith("__const") && i == keys.length - 1) || k.startsWith("__helios") || k.endsWith("__from_data") || k.includes("____")) {
				continue;
			}

			let prefix = assertDefined(k.match(/(__const)?([^[]+)(\[|$)/))[0];

			// get all following definitions including self, excluding constants
			// also don't mutual recurse helios functions
			const potentialDependencies = keys.slice(i).filter(k => (k.startsWith(prefix) || k.startsWith(`__const${prefix}`)) && !k.endsWith("__from_data") && !k.includes("____"));

			const dependencies = filterMutualDependencies(k, potentialDependencies);

			if (dependencies.length > 0) {
				const escaped = k.replace(/\[/g, "\\[").replace(/]/g, "\\]");

				const re = new RegExp(`\\b${escaped}(\\b|$)`, "gm");
				const newStr = `${k}(${dependencies.join(", ")})`;
				// do the actual replacing
				for (let k_ of keys) {
					map.set(k_, assertDefined(map.get(k_)).replace(re, newStr));
				}

				mainIR = mainIR.replace(re, newStr);

				const wrapped = new IR([
					new IR(`(${dependencies.join(", ")}) -> {`),
					assertDefined(map.get(k)),
					new IR("}")
				]);

				// wrap own definition
				map.set(k, wrapped);
			}
		}

		return mainIR;
	}

	/**
	 * Also merges builtins and map
	 * @param {IR} mainIR
	 * @param {IRDefinitions} map 
	 * @returns {IRDefinitions}
	 */
	static applyTypeParameters(mainIR, map) {
		const builtinGenerics = fetchRawGenerics();

		/**
		 * @type {Map<string, [string, IR]>}
		 */
		const added = new Map();

		/**
		 * @param {string} name 
		 * @param {string} location
		 */
		const add = (name, location) => {
			if (map.has(name) || added.has(name)) {
				return;
			}

			const pName = IRParametricName.parse(name);

			const genericName = pName.toTemplate();

			let ir = builtinGenerics.get(name) ?? builtinGenerics.get(genericName) ?? map.get(genericName);

			if (!ir) {
				throw new Error(`${genericName} undefined in ir`);
			} else {
				ir = pName.replaceTemplateNames(ir);

				added.set(name, [location, ir]);

				ir.search(RE_IR_PARAMETRIC_NAME, (name_) => add(name_, name));
			}
		};

		for (let [k, v] of map) {
			v.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, k));
		}

		mainIR.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, "main"))

		// we need to keep templates, otherwise find() might fail to inject the applied definitions in the right location
		let entries = Array.from(map.entries());

		/**
		 * @param {string} name
		 * @returns {number}
		 */
		const find = (name) => {
			for (let i = entries.length - 1; i >= 0; i--) {
				if (entries[i][0] == name) {
					return i;
				}
			}

			if (name == "main") {
				return entries.length;
			} else {
				throw new Error(`${name} not found`);
			}
		};

		const addedEntries = Array.from(added.entries());

		for (let i = 0; i < addedEntries.length; i++) {
			const [name, [location, ir]] = addedEntries[i];

			const j = find(location);

			// inject right before location

			entries = entries.slice(0, j).concat([[name, ir]]).concat(entries.slice(j));
		}

		/**
		 * Remove template because they don't make any sense in the final output
		 */
		entries = entries.filter(([key, _]) => !IRParametricName.isTemplate(key));

		return new Map(entries);
	}

	/**
	 * @param {IR} ir 
	 * @param {IRDefinitions} definitions 
	 * @returns {IRDefinitions}
	 */
	eliminateUnused(ir, definitions) {
		/**
		 * Set of global paths
		 * @type {Set<string>}
		 */
		const used = new Set();

		/**
		 * @type {IR[]}
		 */
		const stack = [ir];

		const RE = /__[a-zA-Z0-9_[\]@]+/g;

		while (stack.length > 0) {
			const ir = assertDefined(stack.pop());

			ir.search(RE, (match) => {
				if (!used.has(match)) {
					used.add(match);

					const def = definitions.get(match);

					if (def) {
						stack.push(def);
					}
				}
			})
		}

		// eliminate all definitions that are not in set

		/**
		 * @type {IRDefinitions}
		 */
		const result = new Map();

		for (let [k, ir] of definitions) {
			if (used.has(k)) {
				result.set(k, ir);
			}
		}

		// Loop internal const statemtsn
		this.loopConstStatements((name, cs) => {
			const path = cs.path;

			if (used.has(path) && !cs.isSet()) {
				throw cs.site.referenceError(`used unset const '${name}' (hint: use program.parameters['${name}'] = ...)`);
			}
		});

		return result;
	}

	/**
	 * Loops over all statements, until endCond == true (includes the matches statement)
	 * Then applies type parameters
	 * @package
	 * @param {IR} ir
	 * @param {string[]} parameters
	 * @param {(s: Statement) => boolean} endCond
	 * @returns {IRDefinitions}
	 */
	fetchDefinitions(ir, parameters, endCond) {
		let map = this.statementsToIR(parameters, endCond);

		return Program.applyTypeParameters(ir, map);
	}

	/**
	 * @param {IR} ir
	 * @param {IRDefinitions} definitions
	 * @returns {IR}
	 */
	wrapInner(ir, definitions) {
		ir = Program.injectMutualRecursions(ir, definitions);

		definitions = this.eliminateUnused(ir, definitions);

		ir = IR.wrapWithDefinitions(ir, definitions);

		// add builtins as late as possible, to make sure we catch as many dependencies as possible
		const builtins = fetchRawFunctions(ir);

		ir = IR.wrapWithDefinitions(ir, builtins);

		return ir;
	}

	/**
	 * @package
	 * @param {IR} ir
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	wrapEntryPoint(ir, parameters) {
		let map = this.fetchDefinitions(ir, parameters, (s) => s.name.value == "main");

		return this.wrapInner(ir, map);
	}

	/**
	 * @package
	 * @param {string[]}  parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	prettyIR(simplify = false) {
		const ir = this.toIR([]);

		const irProgram = IRProgram.new(ir, this.#purpose, simplify);

		return new Source(irProgram.toString()).pretty();
	}

	/**
	 * @param {boolean} simplify 
	 * @returns {UplcProgram}
	 */
	compile(simplify = false) {
		const ir = this.toIR([]);

		const irProgram = IRProgram.new(ir, this.#purpose, simplify);
		
		//console.log(new Source(irProgram.toString()).pretty());
		
		return irProgram.toUplc();
	}

	/**
	 * Compile a special Uplc
	 * @param {string[]} parameters
	 * @param {boolean} simplify
	 * @returns {UplcProgram}
	 */
	compileParametric(parameters, simplify = false) {
		assert(parameters.length > 0, "expected at least 1 parameter (hint: use program.compile() instead)");

		const ir = this.toIR(parameters);

		const irProgram = IRParametricProgram.new(ir, this.#purpose, parameters, simplify);

		// TODO: UplcParametricProgram
		return irProgram.toUplc();
	}
}

class RedeemerProgram extends Program {
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules 
	 */
	constructor(purpose, modules) {
		super(purpose, modules);
	}

	/**
	 * @package
	 * @param {GlobalScope} scope
	 * @returns {TopScope}
	 */
	evalTypesInternal(scope) {
		const topScope = super.evalTypesInternal(scope);

		// check the 'main' function

		const main = this.mainFunc;
		const argTypeNames = main.argTypeNames;
		const argTypes = main.argTypes;
		const retTypes = main.retTypes;

		if (argTypes.length != 2) {
			throw main.typeError("expected 2 args for main");
		}

		if (argTypeNames[0] != "" && !(new DefaultTypeClass()).isImplementedBy(argTypes[0])) {
			throw main.typeError(`illegal redeemer argument type in main: '${argTypes[0].toString()}`);
		}

		if (argTypeNames[1] != "" && !(new ScriptContextType(-1)).isBaseOf(argTypes[1])) {
			throw main.typeError(`illegal 3rd argument type in main, expected 'ScriptContext', got ${argTypes[1].toString()}`);
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(BoolType.isBaseOf(retTypes[0]))) {
			throw main.typeError(`illegal return type for main, expected 'Bool', got '${retTypes[0].toString()}'`);
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @returns {IR} 
	 */
	toIR(parameters = []) {
		const argNames = ["redeemer", "ctx"];

		/** @type {IR[]} */
		const outerArgs = [];

		/** 
		 * @type {IR[]} 
		 */
		const innerArgs = [];

		const argTypeNames = this.mainFunc.argTypeNames;

		this.mainArgTypes.forEach((t, i) => {
			const name = argNames[i];

			// empty path
			if (argTypeNames[i] != "") {
				innerArgs.push(new IR([
					new IR(`${assertNonEmpty(t.path)}__from_data`),
					new IR("("),
					new IR(name),
					new IR(")")
				]));
			} else {
				// unused arg, 0 is easier to optimize
				innerArgs.push(new IR("0"));
			}

			outerArgs.push(new IR(name));
		});

		const ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class DatumRedeemerProgram extends Program {
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules
	 */
	constructor(purpose, modules) {
		super(purpose, modules);
	}

	/**
	 * @package
	 * @param {GlobalScope} scope 
	 * @returns {TopScope}
	 */
	evalTypesInternal(scope) {
		const topScope = super.evalTypesInternal(scope);

		// check the 'main' function

		const main = this.mainFunc;
		const argTypeNames = main.argTypeNames;
		const argTypes = main.argTypes;
		const retTypes = main.retTypes;

		if (argTypes.length != 3) {
			throw main.typeError("expected 3 args for main");
		}

		if (argTypeNames[0] != "" && !(new DefaultTypeClass()).isImplementedBy(argTypes[0])) {
			throw main.typeError(`illegal datum argument type in main: '${argTypes[0].toString()}`);
		}

		if (argTypeNames[1] != "" && !(new DefaultTypeClass()).isImplementedBy(argTypes[1])) {
			throw main.typeError(`illegal redeemer argument type in main: '${argTypes[1].toString()}`);
		}

		if (argTypeNames[2] != "" && !(new ScriptContextType(-1)).isBaseOf(argTypes[2])) {
			throw main.typeError(`illegal 3rd argument type in main, expected 'ScriptContext', got ${argTypes[2].toString()}`);
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(BoolType.isBaseOf(retTypes[0]))) {
			throw main.typeError(`illegal return type for main, expected 'Bool', got '${retTypes[0].toString()}'`);
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		const argNames = ["datum", "redeemer", "ctx"];

		/** @type {IR[]} */
		const outerArgs = [];

		/** 
		 * @type {IR[]} 
		 */
		const innerArgs = [];

		const argTypeNames = this.mainFunc.argTypeNames;
		this.mainArgTypes.forEach((t, i) => {
			const name = argNames[i];

			// empty path
			if (argTypeNames[i] != "") {
				innerArgs.push(new IR([
					new IR(`${assertNonEmpty(t.path)}__from_data`),
					new IR("("),
					new IR(name),
					new IR(")")
				]));
			} else {
				// unused arg, 0 is easier to optimize
				innerArgs.push(new IR("0"));
			}

			outerArgs.push(new IR(name));
		});

		const ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class TestingProgram extends Program {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Testing, modules);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `testing ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Testing);

		const topScope = this.evalTypesInternal(scope);

		if (this.mainFunc.argTypes.some(at => !(new DefaultTypeClass()).isImplementedBy(at))) {
			throw this.mainFunc.typeError("invalid entry-point argument types");
		}

		if (this.mainFunc.retTypes.length != 1) {
			throw this.mainFunc.typeError("program entry-point can only return one value");
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		const argTypeNames = this.mainFunc.argTypeNames;

		const innerArgs = this.mainArgTypes.map((t, i) => {
			// empty path
			if (argTypeNames[i] != "") {
				return new IR([
					new IR(`${assertNonEmpty(t.path)}__from_data`),
					new IR("("),
					new IR(`arg${i}`),
					new IR(")")
				]);
			} else {
				// unused arg, 0 is easier to optimize
				return new IR("0")
			}
		});

		let ir = new IR([
			new IR(`${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(")"),
		]);

		const retType = assertDefined(this.mainFunc.retTypes[0].asDataType);

		ir = new IR([
			new IR(`${retType.path}____to_data`),
			new IR("("),
			ir,
			new IR(")")
		]);

		const outerArgs = this.mainFunc.argTypes.map((_, i) => new IR(`arg${i}`));

		ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			ir,
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class SpendingProgram extends DatumRedeemerProgram {
	/**
	 * @param {Module[]} modules
	 */
	constructor(modules) {
		super(ScriptPurpose.Spending, modules);
	}

	toString() {
		return `spending ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Spending);

		return this.evalTypesInternal(scope);	
	}
}

class MintingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Minting, modules);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `minting ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Minting);

		return this.evalTypesInternal(scope);	
	}
}

class StakingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Staking, modules);
	}

	toString() {
		return `staking ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Staking);

		return this.evalTypesInternal(scope);	
	}
}


/////////////////////////////
// Section 32: Native scripts
/////////////////////////////

/**
 * @package
 */
class NativeContext {
    #firstValidSlot;
    #lastValidSlot;
    #keys;

    /**
     * 
     * @param {bigint | null} firstValidSlot 
     * @param {bigint | null} lastValidSlot 
     * @param {PubKeyHash[]} keys
     */
    constructor(firstValidSlot, lastValidSlot, keys) {
        this.#firstValidSlot = firstValidSlot;
        this.#lastValidSlot = lastValidSlot;
        this.#keys = keys;
    }

    /**
     * Used by NativeAfter
     * @param {bigint} slot 
     * @returns {boolean}
     */
    isAfter(slot) {
        if (this.#firstValidSlot !== null) {
            return this.#firstValidSlot >= slot;
        } else {
            console.error("Warning: tx validity time range start not set but checked in native script");
            return false;
        }
    }

    /**
     * 
     * @param {bigint} slot 
     * @returns {boolean}
     */
    isBefore(slot) {
        if (this.#lastValidSlot !== null) {
            return this.#lastValidSlot < slot;
        } else {
            console.error("Warning: tx validity time range end not set but checked in native script");
            return false;
        }
    }

    /**
     * 
     * @param {PubKeyHash} key
     * @returns {boolean}
     */
    isSignedBy(key) {
        return this.#keys.some((k => k.eq(key)));
    }
}

export class NativeScript extends CborData {
    #type;

    /**
     * @param {number} type 
     */
    constructor(type) {
        super();
        this.#type = type;
    }

    /**
     * @returns {number[]}
     */
    typeToCbor() {
        return CborData.encodeInteger(BigInt(this.#type));
    }

    /**
     * @param {string | number[]} raw 
     * @returns {NativeScript}
     */
    static fromCbor(raw) {
        const bytes = (typeof raw == "string") ? hexToBytes(raw) : raw;

        if (bytes[0] == 0) {
            bytes.shift();
        }

        let type = -1;

        /**
         * @type {bigint}
         */
        let nOrSlot = -1n;

        /**
         * @type {NativeScript | null}
         */
        let script = null;

        CborData.decodeTuple(bytes, (i, fieldBytes) => {
            if (i == 0) {
                type = Number(CborData.decodeInteger(fieldBytes))
            } else {
                switch(type) {
                    case 0:
                        assert(i == 1);

                        script = new NativeSig(PubKeyHash.fromCbor(fieldBytes));
                        
                        break;
                    case 1:
                    case 2: {
                            assert(i == 1);

                            /**
                             * @type {NativeScript[]}
                             */
                            const children = [];

                            CborData.decodeList(fieldBytes, (_, listBytes) => {
                                children.push(NativeScript.fromCbor(listBytes))
                            });

                            switch (type) {
                                case 1:
                                    script = new NativeAll(children);
                                    break;
                                case 2:
                                    script = new NativeAny(children);
                                    break;
                                default:
                                    throw new Error("unexpected");
                            }
                        }

                        break;
                    case 3:
                        if (i == 1) {
                            nOrSlot = CborData.decodeInteger(fieldBytes);
                        } else {
                            assert(i == 2);

                            /**
                             * @type {NativeScript[]}
                             */
                            const children = [];

                            CborData.decodeList(fieldBytes, (_, listBytes) => {
                                children.push(NativeScript.fromCbor(listBytes))
                            });

                            script = new NativeAtLeast(Number(nOrSlot), children);
                        }

                        break;
                    case 4:
                    case 5:
                        assert(i == 1);

                        nOrSlot = CborData.decodeInteger(fieldBytes);

                        switch(type) {
                            case 4:
                                script = new NativeAfter(nOrSlot);
                                break;
                            case 5:
                                script = new NativeBefore(nOrSlot);
                                break;
                            default:
                                throw new Error("unexpected");
                        }

                        break;
                    default:
                        throw new Error("unexpected");
                }
            }
        });

        if (!script) {
            throw new Error("unable to deserialize native script");
        } else {
            return script;
        }
    }

    /**
     * @param {string | Object} json 
     * @returns {NativeScript}
     */
    static fromJson(json) {
        const obj = (typeof json == "string") ? JSON.parse(json) : json;

        const type = obj.type;

        if (!type) {
            throw new Error("invalid Native script");
        }

        switch (type) {
            case "sig": {
                const keyHash = obj.keyHash;

                if (!keyHash) {
                    throw new Error("invalid NativeKey script");
                }

                return new NativeSig(PubKeyHash.fromHex(keyHash));
            }
            case "all": {
                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts;

                if (!scripts) {
                    throw new Error("invalid NativeAll script");
                }

                return new NativeAll(scripts.map(s => NativeScript.fromJson(s)));
            }
            case "any": {
                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts;

                if (!scripts) {
                    throw new Error("invalid NativeAny script");
                }

                return new NativeAny(scripts.map(s => NativeScript.fromJson(s)));
            }
            case "atLeast": {
                const n = obj.required;

                if (typeof n != "number") {
                    throw new Error("invalid NativeAtLeast script");
                }

                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts;

                if (!scripts) {
                    throw new Error("invalid NativeAtLeast script");
                }
    

                return new NativeAtLeast(n, scripts.map(s => NativeScript.fromJson(s)));
            }
            case "after": {
                const slot = obj.slot;

                if (typeof slot != "number") {
                    throw new Error("invalid NativeAfter script");
                }

                return new NativeAfter(BigInt(slot));
            }
            case "before": {
                const slot = obj.slot;

                if (typeof slot != "number") {
                    throw new Error("invalid NativeAfter script");
                }

                return new NativeBefore(BigInt(slot));
            }
            default:
                throw new Error(`unrecognized NativeScript type '${type}'`);
        }
    }

    /**
     * @returns {Object}
     */
    toJson() {
        throw new Error("not implemented");
    }

    /**
     * @param {NativeContext} context 
     * @returns {boolean}
     */
    eval(context) {
       throw new Error("not implemented");
    }

    /**
     * @returns {number[]}
     */
    hash() {
        let innerBytes = this.toCbor();

		innerBytes.unshift(0);

		// used for both script addresses and minting policy hashes
		return Crypto.blake2b(innerBytes, 28);
    }

    /**
     * A NativeScript can be used both as a Validator and as a MintingPolicy
     * @type {ValidatorHash}
     */
    get validatorHash() {
        return new ValidatorHash(this.hash());
    }

    /**
     * A NativeScript can be used both as a Validator and as a MintingPolicy
     * @type {MintingPolicyHash}
     */
    get mintingPolicyHash() {
        return new MintingPolicyHash(this.hash());
    }
}

class NativeSig extends NativeScript {
    #pkh;

    /**
     * @param {PubKeyHash} pkh 
     */
    constructor(pkh) {
        super(0);
        this.#pkh = pkh;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            this.#pkh.toCbor()
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "sig",
            keyHash: this.#pkh.hex
        }
    }

    /**
     * @param {NativeContext} context 
     * @returns {boolean}
     */
    eval(context) {
        return context.isSignedBy(this.#pkh);
    }
}

class NativeAll extends NativeScript {
    #scripts;

    /**
     * @param {NativeScript[]} scripts 
     */
    constructor(scripts) {
        super(1);
        assert(scripts.length > 0);
        this.#scripts = scripts;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeDefList(this.#scripts)
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "all",
            scripts: this.#scripts.map(s => s.toJson())
        }
    }

    /**
     * @param {NativeContext} context 
     * @returns {boolean}
     */
    eval(context) {
        return this.#scripts.every(s => s.eval(context));
    }
}

class NativeAny extends NativeScript {
    #scripts;

    /**
     * @param {NativeScript[]} scripts
     */
    constructor(scripts) {
        super(2);
        assert(scripts.length > 0);
        this.#scripts = scripts;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeDefList(this.#scripts)
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "any",
            scripts: this.#scripts.map(s => s.toJson())
        }
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        return this.#scripts.some(s => s.eval(context));
    }
}

class NativeAtLeast extends NativeScript {
    #required;
    #scripts;

    /**
     * @param {number} required
     * @param {NativeScript[]} scripts
     */
    constructor(required, scripts) {
        super(3);
        assert(scripts.length >= required);
        this.#required = required;
        this.#scripts = scripts;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeInteger(BigInt(this.#required)),
            CborData.encodeDefList(this.#scripts)
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "atLeast",
            required: this.#required,
            scripts: this.#scripts.map(s => s.toJson())
        };
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        const count = this.#scripts.reduce((prev, s) => prev + (s.eval(context) ? 1 : 0), 0);

        return count >= this.#required;
    }
}

class NativeAfter extends NativeScript {
    #slot;

    /**
     * @param {bigint} slot
     */
    constructor(slot) {
        super(4);
        this.#slot = slot;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeInteger(this.#slot)
        ])
    }

    /**
     * @returns {Object}
     */
    toJson() {
        const slot = Number(this.#slot);

        if (BigInt(slot) != this.#slot) {
            console.error("Warning: slot overflow (not representable by Number in Native script Json)");
        }

        return {
            type: "after",
            slot: slot
        };
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        return context.isAfter(this.#slot);
    }
}

class NativeBefore extends NativeScript {
    #slot;

    /**
     * @param {bigint} slot
     */
    constructor(slot) {
        super(5);
        this.#slot = slot;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeInteger(this.#slot)
        ])
    }

    /**
     * @returns {Object}
     */
    toJson() {
        const slot = Number(this.#slot);

        if (BigInt(slot) != this.#slot) {
            console.error("Warning: slot overflow (not representable by Number in Native script Json)");
        }

        return {
            type: "before",
            slot: slot
        };
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        return context.isBefore(this.#slot);
    }
}


///////////////////////
// Section 33: Tx types
///////////////////////

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
	 * @type {?TxMetadata} 
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

	constructor() {
		super();
		this.#body = new TxBody();
		this.#witnesses = new TxWitnesses();
		this.#valid = false; // building is only possible if valid==false
		this.#metadata = null;
		this.#validTo = null;
		this.#validFrom = null;
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
		return Crypto.blake2b(this.#body.toCbor());
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
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#body.toCbor(),
			this.#witnesses.toCbor(),
			CborData.encodeBool(this.#valid),
			this.#metadata === null ? CborData.encodeNull() : this.#metadata.toCbor(),
		]);
	}

	/**
	 * @param {number[] | string} raw
	 * @returns {Tx}
	 */
	static fromCbor(raw) {
		let bytes = (typeof raw == "string") ? hexToBytes(raw) : raw;

		bytes = bytes.slice();

		let tx = new Tx();

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					tx.#body = TxBody.fromCbor(fieldBytes);
					break;
				case 1:
					tx.#witnesses = TxWitnesses.fromCbor(fieldBytes);
					break;
				case 2:
					tx.#valid = CborData.decodeBool(fieldBytes);
					break;
				case 3:
					if (CborData.isNull(fieldBytes)) {
						CborData.decodeNull(fieldBytes);

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
	 * @returns {Object}
	 */
	dump() {
		return {
			body: this.#body.dump(),
			witnesses: this.#witnesses.dump(),
			valid: this.#valid,
			metadata: this.#metadata !== null ? this.#metadata.dump() : null
		};
	}

	/**
	 * @param {bigint | Date } slotOrTime
	 * @returns {Tx}
	 */
	validFrom(slotOrTime) {
		assert(!this.#valid);

		this.#validFrom = slotOrTime;

		return this;
	}

	/**
	 * @param {bigint | Date } slotOrTime
	 * @returns {Tx}
	 */
	validTo(slotOrTime) {
		assert(!this.#valid);

		this.#validTo = slotOrTime;

		return this;
	}

	/**
	 * Throws error if assets of given mph are already being minted in this transaction
	 * @param {MintingPolicyHash} mph 
	 * @param {[number[] | string, bigint][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
	 * @param {UplcDataValue | UplcData | null} redeemer
	 * @returns {Tx}
	 */
	mintTokens(mph, tokens, redeemer) {
		assert(!this.#valid);

		this.#body.addMint(mph, tokens.map(([name, amount]) => {
			if (typeof name == "string" ) {
				return [hexToBytes(name), amount];
			} else {
				return [name, amount];
			}
		}));

		if (!redeemer) {
			if (!this.#witnesses.isNativeScript(mph)) {
				throw new Error("no redeemer specified for minted tokens (hint: if this policy is a NativeScript, attach that script before calling tx.mintTokens())");
			}
		} else {
			this.#witnesses.addMintingRedeemer(mph, UplcDataValue.unwrap(redeemer));
		}
		

		return this;
	}

	/**
	 * @param {UTxO} input
	 * @param {?(UplcDataValue | UplcData | HeliosData)} rawRedeemer
	 * @returns {Tx}
	 */
	addInput(input, rawRedeemer = null) {
		assert(!this.#valid);

		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		} else {
			void this.#body.addInput(input.asTxInput);

			if (rawRedeemer !== null) {
				assert(input.origOutput.address.validatorHash !== null, "input isn't locked by a script");

				const redeemer = rawRedeemer instanceof HeliosData ? rawRedeemer._toUplcData() : UplcDataValue.unwrap(rawRedeemer);

				this.#witnesses.addSpendingRedeemer(input.asTxInput, redeemer);

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
	 * @param {UTxO[]} inputs
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
	 * @param {TxRefInput} input
	 * @param {?UplcProgram} refScript
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
	 * @param {TxRefInput[]} inputs
	 * @returns {Tx}
	 */
	addRefInputs(inputs) {
		for (let input of inputs) {
			this.addRefInput(input);
		}

		return this;
	}

	/**
	 * @param {TxOutput} output 
	 * @returns {Tx}
	 */
	addOutput(output) {
		assert(!this.#valid);
		
		// min lovelace is checked during build, because 
		this.#body.addOutput(output);

		return this;
	}

	/**
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
	 * @param {PubKeyHash} hash
	 * @returns {Tx}
	 */
	addSigner(hash) {
		assert(!this.#valid);

		this.#body.addSigner(hash);

		return this;
	}

	/**
	 * Unused scripts are detected during finalize(), in which case an error is thrown
	 * Throws error if script was already added before
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
	 * Usually adding only one collateral input is enough
	 * Must be less than the limit in networkParams (eg. 3), or else an error is thrown during finalization
	 * @param {UTxO} input 
	 * @returns {Tx}
	 */
	addCollateral(input) {
		assert(!this.#valid);

		this.#body.addCollateral(input.asTxInput);

		return this;
	}

	/**
	 * Calculates tx fee (including script execution)
	 * Shouldn't be used directly
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
	 */
	checkScripts() {
		let scripts = this.#witnesses.scripts;

		/**
		 * @type {Set<string>}
		 */
		const currentScripts = new Set();
		scripts.forEach(script => {
			currentScripts.add(bytesToHex(script.hash()))
		})

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
						throw new Error(`missing script for input ${value}`);
					} else if (value < 0) {
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
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, changeAddress) {
		await this.#witnesses.executeScripts(networkParams, this.#body, changeAddress);
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {Promise<void>}
	 */
	async checkExecutionBudgets(networkParams) {
		await this.#witnesses.checkExecutionBudgets(networkParams, this.#body);
	}

	/**
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

			const changeOutput = new TxOutput(changeAddress, new Value(0n, diff));

			this.#body.addOutput(changeOutput);
		}
	}

	/**
	 * Calculate the base fee which will be multiplied by the required min collateral percentage 
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress 
	 * @param {UTxO[]} spareUtxos 
	 */
	estimateCollateralBaseFee(networkParams, changeAddress, spareUtxos) {
		assert(config.N_DUMMY_INPUTS == 1 || config.N_DUMMY_INPUTS == 2, "expected N_DUMMY_INPUTs == 1 or N_DUMMY_INPUTS == 2");

		// create the collateral return output (might not actually be added if there isn't enough lovelace)
		const dummyOutput = new TxOutput(changeAddress, new Value(0n));
		dummyOutput.correctLovelace(networkParams);

		// some dummy UTxOs on to be able to correctly calculate the collateral (assuming it uses full body fee)
		const dummyCollateral = spareUtxos.map(spare => spare.asTxInput).concat(this.#body.inputs).slice(0, 3);
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
	 * @param {NetworkParams} networkParams
	 * @param {Address} changeAddress
	 * @param {UTxO[]} spareUtxos
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
			// first try using the UTxOs that already form the inputs
			const cleanInputs = inputs.filter(utxo => utxo.value.assets.isZero()).sort((a, b) => Number(a.value.lovelace - b.value.lovelace));

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

		addCollateralInputs(spareUtxos.map(utxo => utxo.asTxInput));

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
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @param {UTxO[]} spareUtxos - used when there are yet enough inputs to cover everything (eg. due to min output lovelace requirements, or fees)
	 */
	balanceLovelace(networkParams, changeAddress, spareUtxos) {
		// don't include the changeOutput in this value
		let nonChangeOutputValue = this.#body.sumOutputValue();

		// assume a change output is always needed
		const changeOutput = new TxOutput(changeAddress, new Value(0n));

		changeOutput.correctLovelace(networkParams);

		this.#body.addOutput(changeOutput);
		
		const minLovelace = changeOutput.value.lovelace;

		let fee = this.setFee(networkParams, this.estimateFee(networkParams));
		
		let inputValue = this.#body.sumInputAndMintedValue();

		let feeValue = new Value(fee);

		nonChangeOutputValue = feeValue.add(nonChangeOutputValue);

		spareUtxos = spareUtxos.filter(utxo => utxo.value.assets.isZero());
		
		// use some spareUtxos if the inputValue doesn't cover the outputs and fees

		while (!inputValue.ge(nonChangeOutputValue.add(changeOutput.value))) {
			let spare = spareUtxos.pop();

			if (spare === undefined) {
				throw new Error("transaction doesn't have enough inputs to cover the outputs + fees + minLovelace");
			} else {
				this.#body.addInput(spare.asTxInput);

				inputValue = inputValue.add(spare.value);
			}
		}

		// use to the exact diff, which is >= minLovelace
		let diff = inputValue.sub(nonChangeOutputValue);

		assert(diff.assets.isZero(), "unexpected unbalanced assets");
		assert(diff.lovelace >= minLovelace);

		changeOutput.setValue(diff);

		// we can mutate the lovelace value of 'changeOutput' until we have a balanced transaction with precisely the right fee

		let oldFee = fee;
		fee = this.estimateFee(networkParams);

		while (fee != oldFee) {
			this.#body.setFee(fee);

			let diffFee = fee - oldFee;

			// use some more spareUtxos
			while (diffFee  > (changeOutput.value.lovelace - minLovelace)) {
				let spare = spareUtxos.pop();

				if (spare === undefined) {
					throw new Error("not enough clean inputs to cover fees");
				} else {
					this.#body.addInput(spare.asTxInput);

					inputValue = inputValue.add(spare.value);

					diff = diff.add(spare.value);

					changeOutput.setValue(diff);
				}
			}

			changeOutput.value.setLovelace(changeOutput.value.lovelace - diffFee);

			// changeOutput.value.lovelace should still be >= minLovelace at this point

			oldFee = fee;

			fee = this.estimateFee(networkParams);
		}
	}

	/**
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 */
	syncScriptDataHash(networkParams) {
		const hash = this.#witnesses.calcScriptDataHash(networkParams);

		this.#body.setScriptDataHash(hash);
	}

	/**
	 * @returns {boolean}
	 */
	isSmart() {
		return this.#witnesses.scripts.length > 0;
	}

	/**
	 * Throws an error if there isn't enough collateral
	 * Also throws an error if the script doesn't require collateral, but collateral was actually included
	 * Shouldn't be used directly
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
	 * @param {NetworkParams} networkParams 
	 */
	checkFee(networkParams) {
		assert(this.estimateFee(networkParams) <= this.#body.fee, "fee too small");
	}

	/**
	 * @param {NetworkParams} networkParams 
	 */
	finalizeValidityTimeRange(networkParams) {
		if (this.#witnesses.anyScriptCallsTxTimeRange() && this.#validFrom === null && this.#validTo === null) {
			const now = new Date();
			const currentSlot = networkParams.liveSlot;

			if (config.VALIDITY_RANGE_START_OFFSET !== null) {
				if (currentSlot !== null) {
					this.#validFrom = currentSlot;
				} else {
					this.#validFrom = new Date(now.getTime() - 1000*config.VALIDITY_RANGE_START_OFFSET);
				}
			}

			if (config.VALIDITY_RANGE_END_OFFSET !== null) {
				if (currentSlot !== null) {
					this.#validTo = currentSlot;
				} else {
					this.#validTo = new Date(now.getTime() + 1000*config.VALIDITY_RANGE_END_OFFSET);
				}
			}

			if (!config.AUTO_SET_VALIDITY_RANGE) {
				console.error("Warning: validity interval is unset but detected usage of tx.time_range in one of the scripts.\nSetting the tx validity interval to a sane default\m(hint: set helios.config.AUTO_SET_VALIDITY_RANGE to true to avoid this warning)");
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
	 * Assumes transaction hasn't yet been signed by anyone (i.e. witnesses.signatures is empty)
	 * Mutates 'this'
	 * Note: this is an async function so that a debugger can optionally be attached in the future
	 * @param {NetworkParams} networkParams
	 * @param {Address}       changeAddress
	 * @param {UTxO[]}        spareUtxos - might be used during balancing if there currently aren't enough inputs
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

		// auto set the validity time range if the script call tx.time_range
		//  and translate the time range dates to slots
		this.finalizeValidityTimeRange(networkParams);

		// inputs, minted assets, and withdrawals must all be in a particular order
		this.#body.sort();

		// after inputs etc. have been sorted we can calculate the indices of the redeemers referring to those inputs
		this.#witnesses.updateRedeemerIndices(this.#body);

		this.checkScripts();

		// balance the non-ada assets
		this.balanceAssets(changeAddress)

		// make sure that each output contains the necessary minimum amount of lovelace	
		this.#body.correctOutputs(networkParams);

		// the scripts executed at this point will not see the correct txHash nor the correct fee
		await this.executeRedeemers(networkParams, changeAddress);

		// balance collateral (if collateral wasn't already set manually)
		this.balanceCollateral(networkParams, changeAddress, spareUtxos.slice());

		// balance the lovelace
		this.balanceLovelace(networkParams, changeAddress, spareUtxos.slice());

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

		this.#valid = true;

		return this;
	}

	/**
	 * Throws an error if verify==true and signature is invalid 
	 * Adding many signatures might be a bit slow
	 * @param {Signature} signature 
	 * @param {boolean} verify
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
	 * Throws an error if verify==true and any of the signatures is invalid
	 * Adding many signatures might be a bit slow
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
class TxBody extends CborData {
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
	#certs;

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

	/** @type {?Hash} */
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
		this.#certs = [];
		this.#withdrawals = new Map();
		this.#firstValidSlot = null;
		this.#minted = new Assets(); // starts as zero value (i.e. empty map)
		this.#scriptDataHash = new Hash((new Array(32)).fill(0)); // initially dummy for more correct body size, (re)calculated upon finalization
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
	 * @type {TxOutput[]}
	 */
	get outputs() {
		return this.#outputs;
	}

	get fee() {
		return this.#fee;
	}

	/**
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
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		object.set(0, CborData.encodeDefList(this.#inputs));
		object.set(1, CborData.encodeDefList(this.#outputs));
		object.set(2, CborData.encodeInteger(this.#fee));
		
		if (this.#lastValidSlot !== null) {
			object.set(3, CborData.encodeInteger(this.#lastValidSlot));
		}

		if (this.#certs.length != 0) {
			object.set(4, CborData.encodeDefList(this.#certs));
		}

		if (this.#withdrawals.size != 0) {
			throw new Error("not yet implemented");
		}

		if (this.#metadataHash !== null) {
			object.set(7, this.#metadataHash.toCbor());
		}

		if (this.#firstValidSlot !== null) {
			object.set(8, CborData.encodeInteger(this.#firstValidSlot));
		}

		if (!this.#minted.isZero()) {
			object.set(9, this.#minted.toCbor());
		}

		if (this.#scriptDataHash !== null) {
			object.set(11, this.#scriptDataHash.toCbor());
		}

		if (this.#collateral.length != 0) {
			object.set(13, CborData.encodeDefList(this.#collateral));
		}

		if (this.#signers.length != 0) {
			object.set(14, CborData.encodeDefList(this.#signers));
		}

		// what is NetworkId used for?
		//object.set(15, CborData.encodeInteger(2n));

		if (this.#collateralReturn !== null) {
			object.set(16, this.#collateralReturn.toCbor());
		}

		if (this.#totalCollateral > 0n) {
			object.set(17, CborData.encodeInteger(this.#totalCollateral));
		}

		if (this.#refInputs.length != 0) {
			object.set(18, CborData.encodeDefList(this.#refInputs));
		}

		return CborData.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {TxBody}
	 */
	static fromCbor(bytes) {
		let txBody = new TxBody();

		let done = CborData.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#inputs.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 1:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#outputs.push(TxOutput.fromCbor(itemBytes));
					})
					break;
				case 2:
					txBody.#fee = CborData.decodeInteger(fieldBytes);
					break;
				case 3:
					txBody.#lastValidSlot = CborData.decodeInteger(fieldBytes);
					break;
				case 4:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#certs.push(DCert.fromCbor(itemBytes));
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
					txBody.#firstValidSlot = CborData.decodeInteger(fieldBytes);
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
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#collateral.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 14:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#signers.push(PubKeyHash.fromCbor(itemBytes));
					});
					break;
				case 15:
					assert(CborData.decodeInteger(fieldBytes) == 2n);
					break;
				case 16:
					txBody.#collateralReturn = TxOutput.fromCbor(fieldBytes);
					break;
				case 17:
					txBody.#totalCollateral = CborData.decodeInteger(fieldBytes);
					break;
				case 18:
					CborData.decodeList(fieldBytes, itemBytes => {
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
			collateral: this.#collateral.length == 0 ? null : this.#collateral.map(c => c.dump()),
			signers: this.#signers.length == 0 ? null : this.#signers.map(rs => rs.dump()),
			collateralReturn: this.#collateralReturn === null ? null : this.#collateralReturn.dump(),
			//totalCollateral: this.#totalCollateral.toString(), // doesn't seem to be used anymore
			refInputs: this.#refInputs.map(ri => ri.dump()),
		};
	}

	/**
	 * For now simply returns minus infinity to plus infinity (WiP)
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
				new ConstrData(1, []), // true
			]),
		]);
	}

	/**
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
			new ListData(this.#certs.map(cert => cert.toData())),
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
	 * @param {NetworkParams} networkParams 
	 * @param {Redeemer[]} redeemers
	 * @param {ListData} datums
	 * @param {number} redeemerIdx
	 * @returns {UplcData}
	 */
	toScriptContextData(networkParams, redeemers, datums, redeemerIdx) {		
		return new ConstrData(0, [
			// tx (we can't know the txId right now, because we don't know the execution costs yet, but a dummy txId should be fine)
			this.toTxData(networkParams, redeemers, datums, TxId.dummy()),
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
	 * @param {bigint} slot
	 */
	validFrom(slot) {
		this.#firstValidSlot = slot;
	}

	/**
	 * @param {bigint} slot
	 */
	validTo(slot) {
		this.#lastValidSlot = slot;
	}

	/**
	 * Throws error if this.#minted already contains mph
	 * @param {MintingPolicyHash} mph - minting policy hash
	 * @param {[number[], bigint][]} tokens
	 */
	addMint(mph, tokens) {
		this.#minted.addTokens(mph, tokens);
	}

	/**
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
	 * Internal use only!
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
	 * @param {TxInput} input 
	 */
	addRefInput(input) {
		this.#refInputs.push(input);
	}

	/**
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
	 * Internal use only!
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
	 * @param {PubKeyHash} hash 
	 */
	addSigner(hash) {
		this.#signers.push(hash);
	}

	/**
	 * @param {TxInput} input 
	 */
	addCollateral(input) {
		this.#collateral.push(input);
	}
	
	/**
	 * @param {Hash | null} scriptDataHash
	 */
	setScriptDataHash(scriptDataHash) {
		this.#scriptDataHash = scriptDataHash;
	}

	/**
	 * @param {Hash} metadataHash
	 */
	setMetadataHash(metadataHash) {
		this.#metadataHash = metadataHash;
	}

	/**
	 * @param {TxOutput | null} output 
	 */
	setCollateralReturn(output) {
		this.#collateralReturn = output;
	}

	/**
	 * Calculates the number of dummy signatures needed to get precisely the right tx size
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
	 * Script hashes are found in addresses of TxInputs and hashes of the minted MultiAsset
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
	 * Makes sure each output contains the necessary min lovelace
	 * @param {NetworkParams} networkParams
	 */
	correctOutputs(networkParams) {
		for (let output of this.#outputs) {
			output.correctLovelace(networkParams);
		}
	}

	/**
	 * Checks that each output contains enough lovelace
	 * @param {NetworkParams} networkParams
	 */
	checkOutputs(networkParams) {
		for (let output of this.#outputs) {
			let minLovelace = output.calcMinLovelace(networkParams);

			assert(minLovelace <= output.value.lovelace, `not enough lovelace in output (expected at least ${minLovelace.toString()}, got ${output.value.lovelace})`);
		}
	}
	
	/**
	 * @param {NetworkParams} networkParams
	 * @param {?bigint} minCollateral 
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
	 * Makes sore inputs, withdrawals, and minted assets are in correct order
	 * Mutates
	 */
	sort() {
		// inputs should've been added in sorted manner, so this is just a check
		this.#inputs.forEach((input, i) => {
			if (i > 0) {
				const prev = this.#inputs[i-1];

				// can be less than -1 if utxoIds aren't consecutive
				assert(TxInput.comp(prev, input) <= -1, "inputs not sorted");
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
	 * Used by (indirectly) by emulator to check if slot range is valid.
	 * Note: firstValidSlot == lastValidSlot is allowed
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
}

export class TxWitnesses extends CborData {
	/** @type {Signature[]} */
	#signatures;

	/** @type {ListData} */
	#datums;

	/** @type {Redeemer[]} */
	#redeemers;

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
		this.#scripts = []; // always plutus v2
		this.#refScripts = [];
		this.#nativeScripts = [];
	}

	/**
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
	 * @param {ValidatorHash | MintingPolicyHash} h 
	 * @returns {boolean}
	 */
	isNativeScript(h) {
		return this.#nativeScripts.some(s => eq(s.hash(), h.bytes));
	}

	/**
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
			object.set(0, CborData.encodeDefList(this.#signatures));
		}
		
		if (this.#nativeScripts.length > 0) {
			object.set(1, CborData.encodeDefList(this.#nativeScripts));
		}

		if (this.#datums.list.length > 0) {
			object.set(4, this.#datums.toCbor());
		}

		if (this.#redeemers.length > 0) {
			object.set(5, CborData.encodeDefList(this.#redeemers));
		}

		if (this.#scripts.length > 0) {
			/**
			 * @type {number[][]}
			 */
			let scriptBytes = this.#scripts.map(s => s.toCbor());

			object.set(6, CborData.encodeDefList(scriptBytes));
		}

		return CborData.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxWitnesses}
	 */
	static fromCbor(bytes) {
		let txWitnesses = new TxWitnesses();

		CborData.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#signatures.push(Signature.fromCbor(itemBytes));
					});
					break;
				case 1:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#nativeScripts.push(NativeScript.fromCbor(itemBytes));
					});
					break;
				case 2:
				case 3:
					throw new Error(`unhandled TxWitnesses field ${i}`);
				case 4:
					txWitnesses.#datums = ListData.fromCbor(fieldBytes);
					break;
				case 5:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#redeemers.push(Redeemer.fromCbor(itemBytes));
					});
					break;
				case 6:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
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
	 * @param {number[]} bodyBytes 
	 */
	verifySignatures(bodyBytes) {
		for (let signature of this.#signatures) {
			signature.verify(Crypto.blake2b(bodyBytes));
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			signatures: this.#signatures.map(pkw => pkw.dump()),
			datums: this.#datums.list.map(datum => datum.toString()),
			redeemers: this.#redeemers.map(redeemer => redeemer.dump()),
			nativeScripts: this.#nativeScripts.map(script => script.toJson()),
			scripts: this.#scripts.map(script => bytesToHex(script.toCbor())),
			refScripts: this.#refScripts.map(script => bytesToHex(script.toCbor())),
		};
	}

	/**
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
	 * @param {Signature} signature 
	 */
	addSignature(signature) {
		this.#signatures.push(signature);
	}

	/**
	 * @param {number} n
	 */
	addDummySignatures(n) {
		for (let i = 0 ; i < n; i++) {
			this.#signatures.push(Signature.dummy());
		}
	}

	removeDummySignatures() {
		this.#signatures = this.#signatures.filter(pkw => !pkw.isDummy());
	}

	/**
	 * Index is calculated later
	 * @param {TxInput} input
	 * @param {UplcData} redeemerData 
	 */
	addSpendingRedeemer(input, redeemerData) {
		this.#redeemers.push(new SpendingRedeemer(input, -1, redeemerData)); // actual input index is determined later
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {UplcData} redeemerData
	 */
	addMintingRedeemer(mph, redeemerData) {
		this.#redeemers.push(new MintingRedeemer(mph, -1, redeemerData));
	}

	/**
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
	 * @param {NativeScript} script 
	 */
	attachNativeScript(script) {
		const h = script.hash();

		assert(this.#nativeScripts.every(other => !eq(h, other.hash())));

		this.#nativeScripts.push(script);
	}

	/**
	 * Throws error if script was already added before
	 * @param {UplcProgram} program 
	 * @param {boolean} isRef
	 */
	attachPlutusScript(program, isRef = false) {
		const h = program.hash();

		assert(this.#scripts.every(s => !eq(s.hash(), h)));
		assert(this.#refScripts.every(s => !eq(s.hash(), h)));

		if (isRef) {
			this.#refScripts.push(program);
		} else {
			this.#scripts.push(program);
		}
	}

	/**
	 * Retrieves either a regular script or a reference script
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
	 * @param {TxBody} body
	 */
	updateRedeemerIndices(body) {
		for (let redeemer of this.#redeemers) {
			redeemer.updateIndex(body);
		}
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {Hash | null} - returns null if there are no redeemers
	 */
	calcScriptDataHash(networkParams) {
		if (this.#redeemers.length > 0) {
			let bytes = CborData.encodeDefList(this.#redeemers);

			if (this.#datums.list.length > 0) {
				bytes = bytes.concat(this.#datums.toCbor());
			}

			// language view encodings?
			let sortedCostParams = networkParams.sortedCostParams;

			bytes = bytes.concat(CborData.encodeMap([[
				CborData.encodeInteger(1n), 
				CborData.encodeDefList(sortedCostParams.map(cp => CborData.encodeInteger(BigInt(cp)))),
			]]));

			return new Hash(Crypto.blake2b(bytes));
		} else {
			return null;
		}
	}

	/**
	 * 
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body
	 * @param {Redeemer} redeemer 
	 * @param {UplcData} scriptContext
	 * @returns {Promise<Cost>} 
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

					const args = [
						new UplcDataValue(Site.dummy(), datumData), 
						new UplcDataValue(Site.dummy(), redeemer.data), 
						new UplcDataValue(Site.dummy(), scriptContext),
					];

					const profile = await script.profile(args, networkParams);

					profile.messages.forEach(m => console.log(m));

					if (profile.result instanceof UserError) {	
						profile.result.context["Datum"] = bytesToHex(datumData.toCbor());
						profile.result.context["Redeemer"] = bytesToHex(redeemer.data.toCbor());
						profile.result.context["ScriptContext"] = bytesToHex(scriptContext.toCbor());
						throw profile.result;
					} else {
						return {mem: profile.mem, cpu: profile.cpu};
					}
				}
			}
		} else if (redeemer instanceof MintingRedeemer) {
			const mph = body.minted.mintingPolicies[redeemer.mphIndex];

			const script = this.getUplcProgram(mph);

			const args = [
				new UplcDataValue(Site.dummy(), redeemer.data),
				new UplcDataValue(Site.dummy(), scriptContext),
			];

			const profile = await script.profile(args, networkParams);

			profile.messages.forEach(m => console.log(m));

			if (profile.result instanceof UserError) {
				profile.result.context["Redeemer"] = bytesToHex(redeemer.data.toCbor());
				profile.result.context["ScriptContext"] = bytesToHex(scriptContext.toCbor());
				throw profile.result;
			} else {
				return {mem: profile.mem, cpu: profile.cpu};
			}
		} else {
			throw new Error("unhandled redeemer type");
		}
	}

	/**
	 * Executes the redeemers in order to calculate the necessary ex units
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
			TxId.dummy(0),
			0n,
			new TxOutput(
				changeAddress,
				new Value(fee + 1000_000_000n)
			)
		);
		
		const dummyInput2 = new TxInput(
			TxId.dummy(255),
			999n,
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

			redeemer.setCost(cost);
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
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body 
	 */
	async checkExecutionBudgets(networkParams, body) {
		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];

			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i);

			const cost = await this.executeRedeemer(networkParams, body, redeemer, scriptContext);

			if (redeemer.memCost < cost.mem) {
				throw new Error("internal finalization error, redeemer mem budget too low");
			} else if (redeemer.cpuCost < cost.cpu) {
				throw new Error("internal finalization error, redeemer cpu budget too low");
			}
		}
	}

	/**
	 * Throws error if execution budget is exceeded
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

		if (totalMem >= BigInt(maxMem)) {
			throw new Error("execution budget exceeded for mem");
		}

		if (totalCpu >= BigInt(maxCpu)) {
			throw new Error("execution budget exceeded for cpu");
		}
	}
}

/**
 * @package
 */
class TxInput extends CborData {
	/** @type {TxId} */
	#txId;

	/** @type {bigint} */
	#utxoIdx;

	/** @type {?TxOutput} */
	#origOutput;

	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoIdx 
	 * @param {?TxOutput} origOutput - used during building, not part of serialization
	 */
	constructor(txId, utxoIdx, origOutput = null) {
		super();
		this.#txId = txId;
		this.#utxoIdx = utxoIdx;
		this.#origOutput = origOutput;
	}
	
	/**
	 * @type {TxId}
	 */
	get txId() {
		return this.#txId;
	}

	/**
	 * @type {bigint}
	 */
	get utxoIdx() {
		return this.#utxoIdx;
	}

	/**
	 * @type {TxOutput}
	 */
	get origOutput() {
		if (this.#origOutput === null) {
			throw new Error("origOutput not set");
		} else {
			return this.#origOutput;
		}
	}

	/**
	 * @type {UTxO}
	 */
	get utxo() {
		if (this.#origOutput === null) {
			throw new Error("origOutput not set");
		} else {
			return new UTxO(this.#txId, this.#utxoIdx, this.#origOutput);
		}
	}

	/**
	 * Shortcut
	 * @type {Value}
	 */
	get value() {
		return this.origOutput.value;
	}

	/**
	 * Shortcut
	 * @type {Address}
	 */
	get address() {
		return this.origOutput.address;
	}

	/**
	 * @returns {ConstrData}
	 */
	toOutputIdData() {
		return new ConstrData(0, [
			new ConstrData(0, [new ByteArrayData(this.#txId.bytes)]),
			new IntData(this.#utxoIdx),
		]);
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		if (this.#origOutput === null) {
			throw new Error("expected to be non-null");
		} else {
			return new ConstrData(0, [
				this.toOutputIdData(),
				this.#origOutput.toData(),
			]);
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#txId.toCbor(),
			CborData.encodeInteger(this.#utxoIdx),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxInput}
	 */
	static fromCbor(bytes) {
		/** @type {?TxId} */
		let txId = null;

		/** @type {?bigint} */
		let utxoIdx = null;

		CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					txId = TxId.fromCbor(fieldBytes);
					break;
				case 1:
					utxoIdx = CborData.decodeInteger(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		if (txId === null || utxoIdx === null) {
			throw new Error("unexpected");
		} else {
			return new TxInput(txId, utxoIdx);
		}
	}

	/**
	 * Tx inputs must be ordered. 
	 * The following function can be used directly by a js array sort
	 * @param {TxInput} a
	 * @param {TxInput} b
	 * @returns {number}
	 */
	static comp(a, b) {
		let res = ByteArrayData.comp(a.#txId.bytes, b.#txId.bytes);

		if (res == 0) {
			return Number(a.#utxoIdx - b.#utxoIdx);
		} else {
			return res;
		}
	} 

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			txId: this.#txId.dump(),
			utxoIdx: this.#utxoIdx.toString(),
			origOutput: this.#origOutput !== null ? this.#origOutput.dump() : null,
		};
	}
}

/**
 * UTxO wraps TxInput
 */
export class UTxO {
	#input;

	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoIdx 
	 * @param {TxOutput} origOutput
	 */
	constructor(txId, utxoIdx, origOutput) {
		this.#input = new TxInput(txId, utxoIdx, origOutput);
	}

	/**
	 * @type {TxId}
	 */
	get txId() {
		return this.#input.txId;
	}

	/**
	 * @type {bigint}
	 */
	get utxoIdx() {
		return this.#input.utxoIdx;
	}

	/**
	 * @type {TxInput}
	 */
	get asTxInput() {
		return this.#input;
	}

	/**
	 * @type {Value}
	 */
	get value() {
		return this.#input.value;
	}

	/**
	 * @type {TxOutput}
	 */
	get origOutput() {
		return this.#input.origOutput;
	}

	/**
	 * Deserializes UTxO format used by wallet connector
	 * @param {number[]} bytes
	 * @returns {UTxO}
	 */
	static fromCbor(bytes) {
		/** @type {?TxInput} */
		let maybeTxInput = null;

		/** @type {?TxOutput} */
		let origOutput = null;

		CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					maybeTxInput = TxInput.fromCbor(fieldBytes);
					break;
				case 1:
					origOutput = TxOutput.fromCbor(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		if (maybeTxInput !== null && origOutput !== null) {
            /** @type {TxInput} */
            const txInput = maybeTxInput;
            
			return new UTxO(txInput.txId, txInput.utxoIdx, origOutput);
		} else {
			throw new Error("unexpected");
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#input.toCbor(),
			this.#input.origOutput.toCbor()
		]);
	}

	/**
	 * @param {UTxO[]} utxos
	 * @returns {Value}
	 */
	static sumValue(utxos) {
		let sum = new Value();

		for (let utxo of utxos) {
			sum = sum.add(utxo.value);
		}

		return sum;
	}
}

export class TxRefInput extends TxInput {
	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoId
	 * @param {TxOutput} origOutput
	 */
	constructor(txId, utxoId, origOutput) {
		super(txId, utxoId, origOutput);
	}
}

export class TxOutput extends CborData {
	/** @type {Address} */
	#address;

	/** @type {Value} */
	#value;

	/** @type {?Datum} */
	#datum;

	/** @type {?UplcProgram} */
	#refScript;

	/**
	 * @param {Address} address 
	 * @param {Value} value 
	 * @param {?Datum} datum 
	 * @param {?UplcProgram} refScript 
	 */
	constructor(address, value, datum = null, refScript = null) {
		assert(datum === null || datum instanceof Datum); // check this explicitely because caller might be using this constructor without proper type-checking
		super();
		this.#address = address;
		this.#value = value;
		this.#datum = datum;
		this.#refScript = refScript;
	}

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

			return CborData.encodeTuple(fields);
		} else {
			/** @type {Map<number, number[]>} */
			let object = new Map();

			object.set(0, this.#address.toCbor());
			object.set(1, this.#value.toCbor());

			if (this.#datum !== null) {
				object.set(2, this.#datum.toCbor());
			}

			if (this.#refScript !== null) {
				object.set(3, CborData.encodeTag(24n).concat(CborData.encodeBytes(
					CborData.encodeTuple([
						CborData.encodeInteger(BigInt(this.#refScript.versionTag())),
						this.#refScript.toCbor()
					])
				)));
			}

			return CborData.encodeObject(object);
		}
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxOutput}
	 */
	static fromCbor(bytes) {
		/** @type {?Address} */
		let address = null;

		/** @type {?Value} */
		let value = null;

		/** @type {?Datum} */
		let outputDatum = null;

		/** @type {?UplcProgram} */
		let refScript = null;

		if (CborData.isObject(bytes)) {
			CborData.decodeObject(bytes, (i, fieldBytes) => {
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
						assert(CborData.decodeTag(fieldBytes) == 24n);

						let tupleBytes = CborData.decodeBytes(fieldBytes);

						CborData.decodeTuple(tupleBytes, (tupleIdx, innerTupleBytes) => {
							assert(refScript === null);

							switch(tupleIdx) {
								case 0:
									throw new Error("native refScript unhandled");
								case 1:
									throw new Error("plutuScriptV1 as refScript unhandled");
								case 2:
									refScript = UplcProgram.fromCbor(innerTupleBytes);
								default:
									throw new Error("unhandled script type for refScript");
							}
						});

						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else if (CborData.isTuple(bytes)) {
			// this is the pre-vasil format, which is still sometimes returned by wallet connector functions
			CborData.decodeTuple(bytes, (i, fieldBytes) => {
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
			new ConstrData(1, []), // TODO: how to include the ref script
		]);
	}

	/**
	 * Each UTxO must contain some minimum quantity of lovelace to avoid that the blockchain is used for data storage
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	calcMinLovelace(networkParams) {
		let lovelacePerByte = networkParams.lovelacePerUTXOByte;

		let correctedSize = this.toCbor().length + 160; // 160 accounts for some database overhead?

		return BigInt(correctedSize)*BigInt(lovelacePerByte);
	}

	/**
	 * Mutates. Makes sure the output contains at least the minimum quantity of lovelace.
	 * Other parts of the output can optionally also be mutated
	 * @param {NetworkParams} networkParams 
	 * @param {?((output: TxOutput) => void)} updater
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

// TODO: enum members
class DCert extends CborData {
	constructor() {
		super();
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {DCert}
	 */
	static fromCbor(bytes) {
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
 * Convenience address that is used to query all assets controlled by a given StakeHash (can be scriptHash or regular stakeHash)
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
	 * @param {StakeAddress} sa
	 * @returns {boolean}
	 */
	static isForTestnet(sa) {
		return Address.isForTestnet(new Address(sa.bytes));
	}

	/**
	 * Convert regular Address into StakeAddress.
	 * Throws an error if the given Address doesn't have a staking part.
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
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {StakeAddress}
	 */
	static fromCbor(bytes) {
		return new StakeAddress(CborData.decodeBytes(bytes));
	}

	/**
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
	 * Returns the raw StakeAddress bytes as a hex encoded string
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
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
	 * Address with only staking part (regular StakeKeyHash)
	 * @param {boolean} isTestnet
	 * @param {StakeKeyHash} hash
	 * @returns {StakeAddress}
	 */
	static fromStakeKeyHash(isTestnet, hash) {
		return new StakeAddress(
			[isTestnet ? 0xe0 : 0xe1].concat(hash.bytes)
		);
	}

	/**
	 * Address with only staking part (script StakingValidatorHash)
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
	 * @param {boolean} isTestnet
	 * @param {StakeKeyHash | StakingValidatorHash} hash
	 * @returns {StakeAddress}
	 */
	static fromHash(isTestnet, hash) {
		if (hash instanceof StakeKeyHash) {
			return StakeAddress.fromStakeKeyHash(isTestnet, hash);
		} else {
			return StakeAddress.fromStakingValidatorHash(isTestnet, hash);
		}
	}

	/**
	 * @returns {StakeKeyHash | StakingValidatorHash}
	 */
	get stakingHash() {
		const type = this.bytes[0];

		if (type == 0xe0 || type == 0xe1) {
			return new StakeKeyHash(this.bytes.slice(1));
		} else if (type == 0xf0 || type == 0xf1) {
			return new StakingValidatorHash(this.bytes.slice(1));
		} else {
			throw new Error("bad StakeAddress header");
		}
	}
}

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
	 * @type {PubKey}
	 */
	get pubKey() {
		return this.#pubKey;
	}

	/**
	 * @type {PubKeyHash}
	 */
	get pubKeyHash() {
		return this.pubKey.hash();
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
		return CborData.encodeTuple([
			this.#pubKey.toCbor(),
			CborData.encodeBytes(this.#signature),
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

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					pubKey = PubKey.fromCbor(fieldBytes);
					break;
				case 1:
					signature = CborData.decodeBytes(fieldBytes);
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
				if (!Crypto.Ed25519.verify(this.#signature, msg, this.#pubKey.bytes)) {
					throw new Error("incorrect signature");
				}
			}
		}
	}
}

export class PrivateKey extends HeliosData {
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
     * @returns {PrivateKey} - Ed25519 private key is 32 bytes long
     */
	static random(random) {
		const key = [];

        for (let i = 0; i < 32; i++) {
            key.push(Math.floor(random()*256)%256);
        }

        return new PrivateKey(key);
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
	 * @returns {PrivateKey}
	 */
	extend() {
		return new PrivateKey(Crypto.sha2_512(this.#bytes));
	}

	/**
	 * @returns {PubKey}
	 */
	derivePubKey() {
		if (this.#pubKey) {
			return this.#pubKey;
		} else {
			this.#pubKey = new PubKey(Crypto.Ed25519.derivePublicKey(this.#bytes));
			
			return this.#pubKey;
		}
	}

	/**
	 * @param {number[] | string} message 
	 * @returns {Signature}
	 */
	sign(message) {
		return new Signature(
			this.derivePubKey(),
			Crypto.Ed25519.sign(Array.isArray(message) ? message : hexToBytes(message), this.#bytes)
		);
	}
}

class Redeemer extends CborData {
	/** @type {UplcData} */
	#data;

	/** @type {Cost} */
	#exUnits;

	/**
	 * @param {UplcData} data 
	 * @param {Cost} exUnits 
	 */
	constructor(data, exUnits = {mem: 0n, cpu: 0n}) {
		super();
		this.#data = data;
		this.#exUnits = exUnits;
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
		return this.#exUnits.mem;
	}

	/**
	 * @type {bigint}
	 */
	get cpuCost() {
		return this.#exUnits.cpu;
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
		return CborData.encodeTuple([
			CborData.encodeInteger(BigInt(type)),
			CborData.encodeInteger(BigInt(index)),
			this.#data.toCbor(),
			CborData.encodeTuple([
				CborData.encodeInteger(this.#exUnits.mem),
				CborData.encodeInteger(this.#exUnits.cpu),
			]),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Redeemer}
	 */
	static fromCbor(bytes) {
		/** @type {?number} */
		let type = null;

		/** @type {?number} */
		let index = null;

		/** @type {?UplcData} */
		let data = null;

		/** @type {?Cost} */
		let cost = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 1:
					index = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 2:
					data = UplcData.fromCbor(fieldBytes);
					break;
				case 3: 
					/** @type {?bigint} */
					let mem = null;

					/** @type {?bigint} */
					let cpu = null;

					let m = CborData.decodeTuple(fieldBytes, (j, subFieldBytes) => {
						switch (j) {
							case 0:
								mem = CborData.decodeInteger(subFieldBytes);
								break;
							case 1:
								cpu = CborData.decodeInteger(subFieldBytes);
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
			data: this.#data.toString(),
			exUnits: {
				mem: this.#exUnits.mem.toString(),
				cpu: this.#exUnits.cpu.toString(),
			},
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
	 * @param {Cost} cost 
	 */
	setCost(cost) {
		this.#exUnits = cost;
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		// this.#exUnits.mem and this.#exUnits can be 0 if we are estimating the fee for an initial balance
		
		let [memFee, cpuFee] = networkParams.exFeeParams;

		return BigInt(Math.ceil(Number(this.#exUnits.mem)*memFee + Number(this.#exUnits.cpu)*cpuFee));
	}
}

class SpendingRedeemer extends Redeemer {
	#input;
	#inputIndex;

	/**
	 * @param {?TxInput} input
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

class MintingRedeemer extends Redeemer {
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
 * Inside helios this type is named OutputDatum in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
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
		/** @type {?number} */
		let type = null;

		/** @type {?Datum} */
		let res = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 1:
					if (type == 0) {
						res = new HashedDatum(DatumHash.fromCbor(fieldBytes));
					} else if (type == 1) {
						assert(CborData.decodeTag(fieldBytes) == 24n);

						let dataBytes = CborData.decodeBytes(fieldBytes);
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
	 * @param {UplcDataValue | UplcData | HeliosData} data
	 * @returns {HashedDatum}
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
	 * @returns {InlineDatum}
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

	/** @type {?UplcData} */
	#origData;

	/**
	 * @param {DatumHash} hash 
	 * @param {?UplcData} origData
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
		return CborData.encodeTuple([
			CborData.encodeInteger(0n),
			this.#hash.toCbor(),
		]);
	}

	/**
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
		return CborData.encodeTuple([
			CborData.encodeInteger(1n),
			CborData.encodeTag(24n).concat(CborData.encodeBytes(this.#data.toCbor()))
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
		return CborData.encodeUtf8(metadata, true);
	} else if (typeof metadata === 'number') {
		assert(metadata % 1.0 == 0.0);

		return CborData.encodeInteger(BigInt(metadata));
	} else if (Array.isArray(metadata)) {
		return CborData.encodeDefList(metadata.map(item => encodeMetadata(item)));
	} else if (metadata instanceof Object && "map" in metadata && Object.keys(metadata).length == 1) {
		let pairs = metadata["map"];

		if (Array.isArray(pairs)) {
			return CborData.encodeMap(pairs.map(pair => {
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
	if (CborData.isUtf8(bytes)) {
		return CborData.decodeUtf8(bytes);
	} else if (CborData.isList(bytes)) {
		/**
		 * @type {Metadata[]}
		 */
		let items = [];

		CborData.decodeList(bytes, (_, itemBytes) => {
			items.push(decodeMetadata(itemBytes));
		});

		return items;
	} else if (CborData.isMap(bytes)) {
		/**
		 * @type {[Metadata, Metadata][]}
		 */
		let pairs = [];

		CborData.decodeMap(bytes, (_, pairBytes) => {
			pairs.push([
				decodeMetadata(pairBytes),
				decodeMetadata(pairBytes)
			]);
		});

		return {"map": pairs};
	} else {
		return Number(CborData.decodeInteger(bytes));
	}
}

class TxMetadata {
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
			CborData.encodeInteger(BigInt(key)),
			encodeMetadata(this.#metadata[key])
		]);
		
		return CborData.encodeMap(pairs);
	}

	/**
	* Decodes a TxMetadata instance from Cbor
	* @param {number[]} data
	* @returns {TxMetadata}
	*/
	static fromCbor(data) {
		const txMetadata = new TxMetadata();

		CborData.decodeMap(data, (_, pairBytes) => {
			txMetadata.add(
				Number(CborData.decodeInteger(pairBytes)), 
				decodeMetadata(pairBytes)
			);
		});

		return txMetadata;
	}
}



////////////////////////////////////
// Section 34: Highlighting function
////////////////////////////////////

/**
 * Categories for syntax highlighting
 */
const SyntaxCategory = {
	Normal:     0,
	Comment:    1,
	Literal:    2,
	Symbol:     3,
	Type:       4,
	Keyword:    5,
	Error:      6,
};

/**
 * Applies syntax highlighting by returning a list of char categories.
 * Not part of Tokeizer because it needs to be very fast and can't throw errors.
 * Doesn't depend on any other functions so it can easily be ported to other languages.
 * @param {string} src
 * @returns {Uint8Array}
 */
export function highlight(src) {
	let n = src.length;

	const SyntaxState = {
		Normal:        0,
		SLComment:     1,
		MLComment:     2,
		String:        3,
		NumberStart:   4,
		HexNumber:     5,
		BinaryNumber:  6,
		OctalNumber:   7,
		DecimalNumber: 8,
		ByteArray:     9,
	};

	// array of categories
	let data = new Uint8Array(n);

	let j = 0; // position in data
	let state = SyntaxState.Normal;

	/** @type {SymbolToken[]} */
	let groupStack = [];
	
	for (let i = 0; i < n; i++) {
		let c = src[i];
		let isLast = i == n - 1;

		switch (state) {
			case SyntaxState.Normal:
				if (c == "/") {
					// maybe comment
					if (!isLast && src[i+1] == "/") {
						data[j++] = SyntaxCategory.Comment;
						data[j++] = SyntaxCategory.Comment;
		
						i++;
						state = SyntaxState.SLComment;
					} else if (!isLast && src[i+1] == "*") {
						data[j++] = SyntaxCategory.Comment;
						data[j++] = SyntaxCategory.Comment;

						i++;
						state = SyntaxState.MLComment;
					} else {
						data[j++] = SyntaxCategory.Symbol;
					}
				} else if (c == "[" || c == "]" || c == "{" || c == "}" || c == "(" || c == ")") {
					let s = new SymbolToken(new Site(new Source(src), i), c);

					if (Group.isOpenSymbol(s)) {
						groupStack.push(s);
						data[j++] = SyntaxCategory.Normal;
					} else {
						let prevGroup = groupStack.pop();

						if (prevGroup === undefined) {
							data[j++] = SyntaxCategory.Error;
						} else if (c == Group.matchSymbol(prevGroup)) {
							data[j++] = SyntaxCategory.Normal;
						} else {
							data[prevGroup.site.startPos] = SyntaxCategory.Error;
							data[j++] = SyntaxCategory.Error;
						}
					}
				} else if (c == "%" || c == "!" || c == "&" || c == "*" || c == "+" || c == "-" || c == "<" || c == "=" || c == ">" || c == "|") {
					// symbol
					switch (c) {
						case "&":
							if (!isLast && src[i+1] == "&") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Normal;
							}
							break;
						case "|":
							if (!isLast && src[i+1] == "|") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Normal;
							}
							break;
						case "!":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "=":
							if (!isLast && (src[i+1] == "=" || src[i+1] == ">")) {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case ">":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "<":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "-":
							if (!isLast && src[i+1] == ">") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						default:
							data[j++] = SyntaxCategory.Symbol;
					}
				} else if (c == "\"") {
					// literal string
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.String;
				} else if (c == "0") {
					// literal number
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.NumberStart;
				} else if (c >= "1" && c <= "9") {
					// literal decimal number
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.DecimalNumber;
				} else if (c == "#") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.ByteArray;
				} else if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_") {
					// maybe keyword, builtin type, or boolean
					let i0 = i;
					let chars = [c];
					// move i to the last word char
					while (i + 1 < n) {
						let d = src[i+1];

						if ((d >= "a" && d <= "z") || (d >= "A" && d <= "Z") || d == "_" || (d >= "0" && d <= "9")) {
							chars.push(d);
							i++;
						} else {
							break;
						}
					}

					let word = chars.join("");
					/** @type {number} */
					let type;
					switch (word) {
						case "true":
						case "false":
							type = SyntaxCategory.Literal;
							break;
						case "Bool":
						case "Int":
						case "ByteArray":
						case "String":
						case "Option":
							type = SyntaxCategory.Type;
							break;
						case "if":
						case "else":
						case "switch":
						case "func":
						case "const":
						case "struct":
						case "enum":
						case "import":
						case "print":
						case "error":
						case "self":
							type = SyntaxCategory.Keyword;
							break;
						case "testing":
						case "spending":
						case "staking":
						case "minting":
						case "module":
							if (i0 == 0) {
								type = SyntaxCategory.Keyword;
							} else {
								type = SyntaxCategory.Normal;
							}
							break;
						default:
							type = SyntaxCategory.Normal;
					}

					for (let ii = i0; ii < i0 + chars.length; ii++) {
						data[j++] = type;
					}
				} else {
					data[j++] = SyntaxCategory.Normal;
				}
				break;
			case SyntaxState.SLComment:
				data[j++] = SyntaxCategory.Comment;
				if (c == "\n") {
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.MLComment:
				data[j++] = SyntaxCategory.Comment;

				if (c == "*" && !isLast && src[i+1] == "/") {
					i++;
					data[j++] = SyntaxCategory.Comment;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.String:
				data[j++] = SyntaxCategory.Literal;

				if (c == "\"") {
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.NumberStart:
				if (c == "x") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.HexNumber;
				} else if (c == "o") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.OctalNumber;
				} else if (c == "b") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.BinaryNumber;
				} else if (c >= "0" && c <= "9") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.DecimalNumber;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.DecimalNumber:
				if (c >= "0" && c <= "9") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.HexNumber:
			case SyntaxState.ByteArray:
				if ((c >= "a" && c <= "f") || (c >= "0" && c <= "9")) {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.OctalNumber:
				if (c >= "0" && c <= "7") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.BinaryNumber:
				if (c == "0" || c == "1") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			default:
				throw new Error("unhandled SyntaxState");
		}		
	}

	for (let s of groupStack) {
		data[s.site.startPos] = SyntaxCategory.Error;
	}

	return data;
}


//////////////////////////////////////
// Section 35: Fuzzy testing framework
//////////////////////////////////////

/**
 * @typedef {() => UplcData} ValueGenerator
 */

/**
 * @typedef {(args: UplcValue[], res: (UplcValue | UserError)) => (boolean | Object.<string, boolean>)} PropertyTest
 */

/**
 * Creates generators and runs script tests
 */
export class FuzzyTest {
	/**
	 * @type {NumberGenerator} - seed generator
	 */
	#rand;

	#runsPerTest;

	#simplify;

	/**
	 * @param {number} seed
	 * @param {number} runsPerTest
	 * @param {boolean} simplify - if true then also test the simplified program
	 */
	constructor(seed = 0, runsPerTest = 100, simplify = false) {
		console.log("starting fuzzy testing  with seed", seed);

		this.#rand = Crypto.rand(seed);
		this.#runsPerTest = runsPerTest;
		this.#simplify = simplify;
	}

	/**
	 * @returns {NumberGenerator}
	 */
	newRand() {
		let seed = this.#rand()*1000000;

		return Crypto.rand(seed);
	}

	/**
	 * Returns a gernator for whole numbers between min and max
	 * @param {number} min
	 * @param {number} max
	 * @returns {() => bigint}
	 */
	rawInt(min = -10000000, max = 10000000) {
		let rand = this.newRand();

		return function() {
			return BigInt(Math.floor(rand()*(max - min)) + min);
		}
	}

	/**
	 * Returns a generator for whole numbers between min and max, wrapped with IntData
	 * @param {number} min
	 * @param {number} max
	 * @returns {ValueGenerator}
	 */
	int(min = -10000000, max = 10000000) {		
		let rand = this.rawInt(min, max);

		return function() {
			return new IntData(rand());
		}
	}

	/**
	 * @param {number} min 
	 * @param {number} max 
	 * @returns {ValueGenerator}
	 */
	real(min = -1000, max = 1000) {
		let rand = this.newRand();

		return function() {
			return new IntData(BigInt(Math.floor(((rand()*(max - min)) + min)*1000000)))
		}
	}

	/**
	 * Returns a generator for strings containing any utf-8 character
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	string(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let chars = [];
			for (let i = 0; i < n; i++) {
				chars.push(String.fromCodePoint(Math.round(rand()*1112064)));
			}
			
			return ByteArrayData.fromString(chars.join(""));
		}
	}

	/** 
	 * Returns a generator for strings with ascii characters from 32 (space) to 126 (tilde)
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	ascii(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let chars = [];
			for (let i = 0; i < n; i++) {
				chars.push(String.fromCharCode(Math.round(rand()*94 + 32)));
			}
			
			return ByteArrayData.fromString(chars.join(""));
		}
	}

	/**
	 * Returns a generator for bytearrays containing only valid ascii characters
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	asciiBytes(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let bytes = [];
			for (let i = 0; i < n; i++) {
				bytes.push(Math.floor(rand()*94 + 32));
			}

			return new ByteArrayData(bytes);
		}
	}

	/**
	 * Returns a generator for bytearrays the are also valid utf8 strings
	 * @param {number} minLength - length of the string, not of the bytearray!
	 * @param {number} maxLength - length of the string, not of the bytearray!
	 * @returns {ValueGenerator}
	 */
	utf8Bytes(minLength = 0, maxLength = 64) {
		return this.string(minLength, maxLength);
	}

	/**
	 * Returns a generator for number[]
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {() => number[]}
	 */
	rawBytes(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let bytes = [];
			for (let i = 0; i < n; i++) {
				bytes.push(Math.floor(rand()*256));
			}

			return bytes;
		}
	}

	/**
	 * Returns a generator for bytearrays 
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	bytes(minLength = 0, maxLength = 64) {
		let rand = this.rawBytes(minLength, maxLength);

		return function() {
			let bytes = rand();

			return new ByteArrayData(bytes);
		}
	}
	/**
	 * Returns a generator for booleans,
	 * @returns {() => boolean}
	 */
	rawBool() {
		let rand = this.newRand();

		return function() {
			let x = rand();

			return x >= 0.5;
		}
	}

	/**
	 * Returns a generator for booleans, wrapped with ConstrData
	 * @returns {ValueGenerator}
	 */
	bool() {
		let rand = this.rawBool();

		return function() {
			return new ConstrData(rand() ? 1 : 0, []);
		}
	}

	/**
	 * Returns a generator for options
	 * @param {ValueGenerator} someGenerator
	 * @param {number} noneProbability
	 * @returns {ValueGenerator}
	 */
	option(someGenerator, noneProbability = 0.5) {
		let rand = this.newRand();

		return function() {
			let x = rand();

			if (x < noneProbability) {
				return new ConstrData(1, []);
			} else {
				return new ConstrData(0, [someGenerator()]);
			}
		}
	}

	/**
	 * Returns a generator for lists
	 * @param {ValueGenerator} itemGenerator
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	list(itemGenerator, minLength = 0, maxLength = 10) {
		let rand = this.newRand();

		if (minLength < 0) {
			minLength = 0;
		}

		if (maxLength < 0) {
			maxLength = 0;
		}

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			/**
			 * @type {UplcData[]}
			 */
			let items = [];

			for (let i = 0; i < n; i++) {
				items.push(itemGenerator());
			}

			return new ListData(items);
		}
	}

	/**
	 * Returns a generator for maps
	 * @param {ValueGenerator} keyGenerator
	 * @param {ValueGenerator} valueGenerator
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	map(keyGenerator, valueGenerator, minLength = 0, maxLength = 10) {
		let rand = this.newRand();

		if (minLength < 0) {
			minLength = 0;
		}

		if (maxLength < 0) {
			maxLength = 0;
		}

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;

			if (n < 0) {
				n = 0;
			}

			/**
			 * @type {[UplcData, UplcData][]}
			 */
			let pairs = [];

			for (let i = 0; i < n; i++) {
				pairs.push([keyGenerator(), valueGenerator()]);
			}

			return new MapData(pairs);
		};
	}

	/**
	 * Returns a generator for objects
	 * @param {...ValueGenerator} itemGenerators
	 * @returns {ValueGenerator}
	 */
	object(...itemGenerators) {
		return function() {
			let items = itemGenerators.map(g => g());

			return new ConstrData(0, items);
		}
	}

	/**
	 * Returns a generator for tagged constr
	 * @param {number | NumberGenerator} tag
	 * @param {...ValueGenerator} fieldGenerators
	 * @returns {ValueGenerator}
	 */
	constr(tag, ...fieldGenerators) {
		return function() {
			const fields = fieldGenerators.map(g => g());

			const finalTag = (typeof tag == "number") ? tag : Math.round(tag()*100);
			
			return new ConstrData(finalTag, fields);
		}
	}

	/**
	 * Run a test
	 * @param {ValueGenerator[]} argGens
	 * @param {string} src
	 * @param {PropertyTest} propTest
	 * @param {number} nRuns
	 * @param {boolean} simplify
	 * @returns {Promise<void>} - throws an error if any of the property tests fail
	 */
	async test(argGens, src, propTest, nRuns = this.#runsPerTest, simplify = false) {
		// compilation errors here aren't caught

		let purposeName = extractScriptPurposeAndName(src);

		if (purposeName === null) {
			throw new Error("failed to get script purpose and name");
		} else {
			let [_, testName] = purposeName;

			let program = Program.new(src).compile(simplify);

			for (let it = 0; it < nRuns; it++) {
				let args = argGens.map(gen => new UplcDataValue(Site.dummy(), gen()));
			
				let result = await program.run(args);

				let obj = propTest(args, result);

				if (typeof obj == "boolean") {
					if (!obj) {
						throw new Error(`property test '${testName}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
					}
				} else {
					// check for failures
					for (let key in obj) {
						if (!obj[key]) {
							throw new Error(`property test '${testName}:${key}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
						}
					}
				}
			}

			console.log(`property tests for '${testName}' succeeded${simplify ? " (simplified)":""} (${program.calcSize()} bytes)`);
		}

		if (!simplify && this.#simplify) {
			await this.test(argGens, src, propTest, nRuns, true);
		}
	}

	/**
	 * @param {Object.<string, ValueGenerator>} paramGenerators
	 * @param {string[]} paramArgs
	 * @param {string} src
	 * @param {PropertyTest} propTest
	 * @param {number} nRuns
	 * @param {boolean} simplify
	 * @returns {Promise<void>}
	 */
	async testParams(paramGenerators, paramArgs, src, propTest, nRuns = this.#runsPerTest, simplify = false) {
		let program = Program.new(src);

		let purposeName = extractScriptPurposeAndName(src);

		if (purposeName === null) {
			throw new Error("failed to get script purpose and name");
		} else {
			let [_, testName] = purposeName;

			for (let it = 0; it < nRuns; it++) {

				for (let key in paramGenerators) {
					program.changeParamSafe(key, paramGenerators[key]())
				}

				let args = paramArgs.map(paramArg => program.evalParam(paramArg));
			
				let coreProgram = Program.new(src).compile(simplify);

				let result = await coreProgram.run(args);

				let obj = propTest(args, result);

				if (typeof obj == "boolean") {
					if (!obj) {
						throw new Error(`property test '${testName}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
					}
				} else {
					// check for failures
					for (let key in obj) {
						if (!obj[key]) {
							throw new Error(`property test '${testName}:${key}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
						}
					}
				}
			}

			console.log(`property tests for '${testName}' succeeded${simplify ? " (simplified)":""}`);
		}

		if (!simplify && this.#simplify) {
			await this.testParams(paramGenerators, paramArgs, src, propTest, nRuns, true);
		}
	}
}


////////////////////////////
// Section 36: CoinSelection
////////////////////////////

/**
 * @typedef {(utxos: UTxO[], amount: Value) => [UTxO[], UTxO[]]} CoinSelectionAlgorithm
 */

/**
 * Collection of coin selection algorithms
 */
export class CoinSelection {
    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @param {boolean} largestFirst
     * @returns {[UTxO[], UTxO[]]} - [picked, not picked that can be used as spares]
     */
    static selectExtremumFirst(utxos, amount, largestFirst) {
        let sum = new Value();

        /** @type {UTxO[]} */
        let notSelected = utxos.slice();

        /** @type {UTxO[]} */
        const selected = [];

        /**
         * Selects smallest utxos until 'needed' is reached
         * @param {bigint} neededQuantity
         * @param {(utxo: UTxO) => bigint} getQuantity
         */
        function select(neededQuantity, getQuantity) {
            // first sort notYetPicked in ascending order when picking smallest first,
            // and in descending order when picking largest first
            // sort UTxOs that contain more assets last
            notSelected.sort((a, b) => {
                const qa = getQuantity(a);
                const qb = getQuantity(b);

                const sign = largestFirst ? -1 : 1;

                if (qa != 0n && qb == 0n) {
                    return sign;
                } else if (qa == 0n && qb != 0n) {
                    return -sign;
                } else if (qa == 0n && qb == 0n) {
                    return 0;
                } else {
                    const na = a.value.assets.nTokenTypes;
                    const nb = b.value.assets.nTokenTypes;

                    if (na == nb) {
                        return Number(qa - qb)*sign;
                    } else if (na < nb) {
                        return sign;
                    } else {
                        return -sign
                    }
                }
            });

            let count = 0n;
            const remaining = [];

            while (count < neededQuantity || count == 0n) { // must select at least one utxo if neededQuantity == 0n
                const utxo = notSelected.shift();

                if (utxo === undefined) {
                    throw new Error("not enough utxos to cover amount");
                } else {
                    const qty = getQuantity(utxo);

                    if (qty > 0n) {
                        count += qty;
                        selected.push(utxo);
                        sum = sum.add(utxo.value);
                    } else {
                        remaining.push(utxo)
                    }
                }
            }

            notSelected = notSelected.concat(remaining);
        }

        /**
         * Select UTxOs while looping through (MintingPolicyHash,TokenName) entries
         */
        const mphs = amount.assets.mintingPolicies;

        for (const mph of mphs) {
            const tokenNames = amount.assets.getTokenNames(mph);

            for (const tokenName of tokenNames) {
                const need = amount.assets.get(mph, tokenName);
                const have = sum.assets.get(mph, tokenName);

                if (have < need) {
                    const diff = need - have;

                    select(diff, (utxo) => utxo.value.assets.get(mph, tokenName));
                }
            }
        }

        // now use the same strategy for lovelace
        const need = amount.lovelace;
        const have = sum.lovelace;

        if (have < need) {
            const diff = need - have;

            select(diff, (utxo) => utxo.value.lovelace);
        }

        assert(selected.length + notSelected.length == utxos.length, "internal error: select algorithm doesn't conserve utxos");

        return [selected, notSelected];
    }

    /**
     * @type {CoinSelectionAlgorithm}
     */
    static selectSmallestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, false);
    }

    /**
     * @type {CoinSelectionAlgorithm}
     */
    static selectLargestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, true);
    }
}


//////////////////////
// Section 37: Wallets
//////////////////////

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



//////////////////////
// Section 38: Network
//////////////////////

/**
 * @typedef {{
 *     getUtxos(address: Address): Promise<UTxO[]>,
 *     submitTx(tx: Tx): Promise<TxId>
 * }} Network
 */

/**
 * @implements {Network}
 */
export class BlockfrostV0 {
    #networkName;
    #projectId;

    /**
     * @param {string} networkName - "preview", "preprod" or "mainnet"
     * @param {string} projectId
     */
    constructor(networkName, projectId) {
        this.#networkName = networkName;
        this.#projectId = projectId
    }

    /**
     * Determine the network which the wallet is connected to.
     * @param {Wallet} wallet 
     * @param {{
     *     preview?: string,
     *     preprod?: string,
     *     mainnet?: string
     * }} projectIds 
     * @returns {Promise<BlockfrostV0>}
     */
    static async resolve(wallet, projectIds) {
        if (await wallet.isMainnet()) {
            return new BlockfrostV0("mainnet", assertDefined(projectIds["mainnet"]));
        } else {
            const helper = new WalletHelper(wallet);

            const refUtxo = await helper.refUtxo;

            if (refUtxo === null) {
                throw new Error("empty wallet, can't determine which testnet you are connecting to");
            } else {
                const preprodProjectId = projectIds["preprod"];
                const previewProjectId = projectIds["preview"];

                if (preprodProjectId !== undefined) {
                    const preprodNetwork = new BlockfrostV0("preprod", preprodProjectId);

                    if (await preprodNetwork.hasUtxo(refUtxo)) {
                        return preprodNetwork;
                    }
                } 
                
                if (previewProjectId !== undefined) {
                    const previewNetwork = new BlockfrostV0("preview", previewProjectId);

                    if (!(await previewNetwork.hasUtxo(refUtxo))) {
                        throw new Error("not preview network (hint: provide project id for preprod");
                    } else {
                        return previewNetwork;
                    }
                } else {
                    if (preprodProjectId === undefined) {
                        throw new Error("no project ids for testnets");
                    } else {
                        throw new Error("no project id for preview testnet");
                    }
                }
            }
        }
    }

    /**
     * @param {any} obj 
     * @returns 
     */
    static parseValue(obj) {
        let value = new Value();

        for (let item of obj) {
            let qty = BigInt(item.quantity);

            if (item.unit == "lovelace") {
                value = value.add(new Value(qty));
            } else {
                let policyID = item.unit.substring(0, 56);
                let mph = MintingPolicyHash.fromHex(policyID);

                let token = hexToBytes(item.unit.substring(56));

                value = value.add(new Value(0n, new Assets([
                    [mph, [
                        [token, qty]
                    ]]
                ])));
            }
        }

        return value;
    }

    /**
     * Used by BlockfrostV0.resolve()
     * @param {UTxO} utxo
     * @returns {Promise<boolean>}
     */
    async hasUtxo(utxo) {
        const txId = utxo.txId;

        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/txs/${txId.hex}/utxos`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "project_id": this.#projectId
            }
        });

        return response.ok;
    }

    /**
     * Returns oldest UTxOs first, newest last.
     * TODO: pagination
     * @param {Address} address 
     * @returns {Promise<UTxO[]>}
     */
    async getUtxos(address) {
        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/addresses/${address.toBech32()}/utxos?order=asc`;

        const response = await fetch(url, {
            headers: {
                "project_id": this.#projectId
            }
        });

        /** 
         * @type {any} 
         */
        let all = await response.json();

        if (all?.status_code >= 300) {
            all = []; 
        }

        return all.map(obj => {
            return new UTxO(
                TxId.fromHex(obj.tx_hash),
                BigInt(obj.output_index),
                new TxOutput(
                    address,
                    BlockfrostV0.parseValue(obj.amount),
                    Datum.inline(ConstrData.fromCbor(hexToBytes(obj.inline_datum)))
                )
            );
        });
    }  

    /** 
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const data = new Uint8Array(tx.toCbor());
        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/tx/submit`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/cbor",
                "project_id": this.#projectId
            },
            body: data
        }).catch(e => {
            console.error(e);
            throw e;
        });

        const responseText = await response.text();

        if (response.status != 200) {
            throw new Error(responseText);
        } else {
            return new TxId(JSON.parse(responseText));  
        }
    }   
}


///////////////////////
// Section 39: Emulator
///////////////////////
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


/**
 * The following functions are used for some tests in ./test/, and aren't
 * intended to be used by regular users of this library.
 */
export const exportedForTesting = {
	assert: assert,
	assertClass: assertClass,
	bigIntToBytes: bigIntToBytes,
	bytesToBigInt: bytesToBigInt,
	setRawUsageNotifier: setRawUsageNotifier,
	setBlake2bDigestSize: setBlake2bDigestSize,
	dumpCostModels: dumpCostModels,
	Site: Site,
	Source: Source,
	Crypto: Crypto,
	MapData: MapData,
	UplcData: UplcData,
	CborData: CborData,
	ConstrData: ConstrData,
	IntData: IntData,
	ByteArrayData: ByteArrayData,
	ListData: ListData,
	UplcBool: UplcBool,
	UplcValue: UplcValue,
	UplcDataValue: UplcDataValue,
	ScriptPurpose: ScriptPurpose,
	UplcTerm: UplcTerm,
	UplcProgram: UplcProgram,
	UplcLambda: UplcLambda,
	UplcCall: UplcCall,
	UplcBuiltin: UplcBuiltin,
	UplcVariable: UplcVariable,
	UplcConst: UplcConst,
	UplcInt: UplcInt,
	IRProgram: IRProgram,
	Tx: Tx,
	TxInput: TxInput,
	TxBody: TxBody,
	REAL_PRECISION: REAL_PRECISION
};