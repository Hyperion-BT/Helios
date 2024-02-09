//@ts-check
// Helios AST expressions

import {
	TAB
} from "./config.js";

import {
	assert,
	assertClass,
	assertDefined,
	bytesToHex,
	reduceNull
} from "./utils.js";

import { 
	BoolLiteral,
	ByteArrayLiteral,
	IntLiteral,
	IR,
	PrimitiveLiteral,
    RealLiteral,
    Site,
	StringLiteral,
	SymbolToken,
    Token,
	UserError,
	Word
} from "./tokens.js";

import {
	UplcData
} from "./uplc-data.js";

import {
	AllType,
	AnyType,
	ArgType,
	Common,
	DataEntity,
	ErrorEntity,
	ErrorType,
	FuncEntity,
	FuncType,
	VoidEntity,
	VoidType

} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EvalEntity} EvalEntity
 */

/**
 * @typedef {import("./eval-common.js").Func} Func
 */

/**
 * @typedef {import("./eval-common.js").Instance} Instance
 */

/**
 * @typedef {import("./eval-common.js").Namespace} Namespace
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */

/**
 * @typedef {import("./eval-common.js").Typed} Typed
 */

/**
 * @typedef {import("./eval-common.js").TypeClass} TypeClass
 */


import {
	BoolType,
	ByteArrayType,
	IntType,
	RawDataType,
	RealType,
	StringType
} from "./eval-primitives.js";

import {
	ParametricFunc
} from "./eval-parametric.js";

import {
	ListType$,
	MapType$,
	OptionType$,
	IteratorType$,
	TupleType$,
	TupleType,
	getTupleItemTypes
} from "./eval-containers.js";

import {
	Scope
} from "./helios-scopes.js";

import {
    ToIRContext
} from "./ir-defs.js";

/**
 * Base class of every Type and Instance expression.
 * @internal
 */
export class Expr extends Token {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	eval(scope) {
		//if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		//}

		return this.#cache;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | DataType}
	 */
	evalAsDataType(scope) {
		const result_ = this.eval(scope);

		if (!result_) {
			return null;
		}

		const result = result_.asDataType;

		if (!result) {
			this.typeError("not a data type");
			return null;
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | Type}
	 */
	evalAsType(scope) {
		const r = this.eval(scope);

		if (!r) {
			return null;
		}

		const result = r.asType;

		if (!result) {
			this.typeError(`${r.toString()} isn't a type`);
			return null;
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | Typed}
	 */
	evalAsTyped(scope) {
		const r  = this.eval(scope);

		if (!r) {
			return null;
		}

		const result = r.asTyped;

		if (!result) {
			this.typeError(`${r.toString()} isn't a value`);
			return null;
		}

		return result;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return false;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
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
 * @internal
 */
export class RefExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		return scope.get(this.#name);
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
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
 * @internal
 */
export class PathExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const base = this.#baseExpr.eval(scope);

		if (!base) {
			return null;
		}

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
			this.#memberName.referenceError(`${base.toString()}::${this.#memberName.value} not found`);
			return null;
		}

		if (member.asType?.toTyped().asFunc) {
			return member.asType.toTyped();
		} else {
			return member;
		}
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
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
 * @internal
 */
export class ValuePathExpr extends PathExpr {

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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const member = super.evalInternal(scope);

		if (!member) {
			return null;
		}

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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		const v = this.cache;

		if (v?.asTyped?.type?.asEnumMemberType && v.asTyped.type.asEnumMemberType.fieldNames.length == 0) {
			return new IR([
				new IR(`${v.asTyped.type.asEnumMemberType.path}____new`, this.site),
				new IR("()")
			]);
		} else {
			return super.toIR(ctx);
		}
	}
}

/**
 * []ItemType
 * @internal
 */
export class ListTypeExpr extends Expr {
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
	 * @returns {null | Type}
	 */
	evalInternal(scope) {
		const itemType_ = this.#itemTypeExpr.eval(scope);

		if (!itemType_) {
			return null;
		}

		const itemType = itemType_.asType;

		if (!itemType) {
			this.#itemTypeExpr.typeError(`'${itemType_.toString()}' isn't a type`);
			return null;
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
 * @internal
 */
export class MapTypeExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const keyType_ = this.#keyTypeExpr.eval(scope);
		if (!keyType_) {
			return null;
		}

		const keyType = keyType_.asType;
		if (!keyType) {
			this.#keyTypeExpr.typeError("map key type not a type");
			return null;
		}

		const valueType_ = this.#valueTypeExpr.eval(scope);
		if (!valueType_) {
			return null;
		}

		const valueType = valueType_.asType;
		if (!valueType) {
			this.#valueTypeExpr.typeError("map value type not a type");
			return null;
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
 * Iterator[Type1, ...] expr
 * @internal
 */
export class IteratorTypeExpr extends Expr {
	#itemTypeExprs;

	/**
	 * @param {Site} site
	 * @param {Expr[]} itemTypeExprs
	 */
	constructor(site, itemTypeExprs) {
		super(site);

		this.#itemTypeExprs = itemTypeExprs;
	}

	/**
	 * @param {Scope} scope
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const itemTypes_ = this.#itemTypeExprs.map(ite => {
			const ite_ = ite.eval(scope);

			if (!ite_) {
				return null;
			}

			const itemType = ite_.asType;

			if (!itemType) {
				ite.typeError("not a type");
				return null;
			}

			return itemType;
		});

		const itemTypes = reduceNull(itemTypes_);
		if (itemTypes === null) {
			return null;
		}

		if (itemTypes.length > 10) {
			this.site.typeError("too many Iterator type args (limited to 10)");
			return null;
		}

		return IteratorType$(itemTypes);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Iterator[${this.#itemTypeExprs.map(ite => ite.toString()).join(", ")}]`;
	}
}

/**
 * Option[SomeType] expression
 * @internal
 */
export class OptionTypeExpr extends Expr {
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
	 * @returns {null | Type}
	 */
	evalInternal(scope) {
		const someType = this.#someTypeExpr.evalAsType(scope);

		if (!someType) {
			return null;
		}

		return OptionType$(someType);
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
 * @internal
 */
export class VoidTypeExpr extends Expr {
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
 * @internal
 */
export class TupleTypeExpr extends Expr {
	#itemTypeExprs;

	/**
	 * @param {Site} site
	 * @param {Expr[]} itemTypeExprs
	 */
	constructor(site, itemTypeExprs) {
		super(site);
		this.#itemTypeExprs = itemTypeExprs;
	}

	/**
	 * @param {Scope} scope
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const itemTypes_ = this.#itemTypeExprs.map(ite => {
			const ite_ = ite.eval(scope);

			if (!ite_) {
				return null;
			}

			const itemType = ite_.asType;

			if (!itemType) {
				ite.typeError("not a type");
				return null;
			}

			return itemType;
		});

		const itemTypes = reduceNull(itemTypes_);
		if (itemTypes === null) {
			return null;
		}

		if (itemTypes.length > 10) {
			this.site.typeError("too many Type type args (limited to 10)");
			return null;
		}

		return TupleType$(itemTypes);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#itemTypeExprs.map(ite => ite.toString()).join(", ")})`;
	}
}

/**
 * @internal
 */
export class FuncArgTypeExpr extends Token {
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
	 * @returns {null | ArgType}
	 */
	eval(scope) {
		const type_ = this.#typeExpr.eval(scope);

		if (!type_) {
			return null;
		}

		const type = type_.asType;
		if (!type) {
			this.#typeExpr.typeError(`'${type_.toString()}' isn't a type`);
			return null;
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
 * @internal
 */
export class FuncTypeExpr extends Expr {
	#argTypeExprs;
	#retTypeExpr;

	/**
	 * @param {Site} site
	 * @param {FuncArgTypeExpr[]} argTypeExprs 
	 * @param {Expr} retTypeExpr 
	 */
	constructor(site, argTypeExprs, retTypeExpr) {
		super(site);
		this.#argTypeExprs = argTypeExprs;
		this.#retTypeExpr = retTypeExpr;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | Type}
	 */
	evalInternal(scope) {
		const argTypes_ = this.#argTypeExprs.map(a => a.eval(scope));

		const retType_ = this.#retTypeExpr.eval(scope);

		if (!retType_) {
			return null;
		}

		const retType = retType_.asType;
		if (!retType) {
			this.#retTypeExpr.typeError("return type isn't a type");
			return null;
		}

		const argTypes = reduceNull(argTypes_);

		if (argTypes === null) {
			return null;
		}

		return new FuncType(argTypes, retType);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> ${this.#retTypeExpr.toString()}`;
	}
}

/**
 * expr(...); ...
 * @internal
 */
export class ChainExpr extends Expr {
	/**
	 * @readonly
	 * @type {Expr}
	 */
	upstreamExpr;

	/**
	 * @readonly
	 * @type {Expr}
	 */
	downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} upstreamExpr 
	 * @param {Expr} downstreamExpr 
	 */
	constructor(site, upstreamExpr, downstreamExpr) {
		super(site);
		this.upstreamExpr = upstreamExpr;
		this.downstreamExpr = downstreamExpr;
	}

	toString() {
		return `${this.upstreamExpr.toString()}; ${this.downstreamExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const upstreamVal_ = this.upstreamExpr.eval(scope);

		if (upstreamVal_) {
			const upstreamVal = upstreamVal_.asTyped;

			if (!upstreamVal) {
				this.upstreamExpr.typeError("upstream isn't typed");
			} else {
				if ((new ErrorType()).isBaseOf(upstreamVal.type)) {
					this.downstreamExpr.typeError("unreachable code (upstream always throws error)");
				} else if (!((new VoidType()).isBaseOf(upstreamVal.type))) {
					this.upstreamExpr.typeError("unexpected return value (hint: use '='");
				}
			}
		}

		return this.downstreamExpr.eval(scope);
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		return new IR([
			new IR("__core__chooseUnit(", this.site),
			this.upstreamExpr.toIR(ctx),
			new IR(", "),
			this.downstreamExpr.toIR(ctx),
			new IR(")")
		]);
	}
}

/**
 * '... = ... ; ...' expression
 * @internal
 */
export class AssignExpr extends ChainExpr {
	/**
	 * @type {DestructExpr}
	 */
	#nameType;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr} nameType 
	 * @param {Expr} upstreamExpr 
	 * @param {Expr} downstreamExpr 
	 */
	constructor(site, nameType, upstreamExpr, downstreamExpr) {
		super(site, assertDefined(upstreamExpr), assertDefined(downstreamExpr));
		this.#nameType = assertDefined(nameType);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const subScope = new Scope(scope, scope.allowShadowing);

		let upstreamVal = this.upstreamExpr.eval(scope);

		if (upstreamVal && upstreamVal.asTyped) {
			if (this.#nameType.hasType() || this.#nameType.isTuple()) {
				this.#nameType.evalInAssignExpr(subScope, assertDefined(upstreamVal.asTyped.type.asType), 0);
			} else if (this.upstreamExpr.isLiteral() || scope.has(this.#nameType.name)) {
				// enum variant type resulting from a constructor-like associated function must be cast back into its enum type
				if ((this.upstreamExpr instanceof CallExpr &&
					this.upstreamExpr.fnExpr instanceof PathExpr) || 
					(this.upstreamExpr instanceof PathExpr && 
					!this.upstreamExpr.isLiteral())) 
				{
					const upstreamType = upstreamVal.asTyped.type;

					if (upstreamType.asEnumMemberType) {
						upstreamVal = new DataEntity(upstreamType.asEnumMemberType.parentType);
					}
				}

				subScope.set(this.#nameType.name, upstreamVal);
			} else {
				this.typeError("unable to infer type of assignment rhs");
			}
		} else if (this.#nameType.hasType()) {
			this.#nameType.evalInAssignExpr(subScope, null, 0);
		} else {
			this.upstreamExpr.typeError("rhs isn't an instance");
			subScope.set(this.#nameType.name, new DataEntity(new AnyType()));
		}
		
		const downstreamVal = this.downstreamExpr.eval(subScope);

		subScope.assertAllUsed();

		return downstreamVal;
	}

	/**
	 * 
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let inner = this.downstreamExpr.toIR(ctx.tab());
		
		if (this.#nameType.isTuple() && this.#nameType.isIgnored()) {
			// TODO: get rid of this on the next major version release, while making sure the default approach is equally efficient (i.e. the callback call is properly inlined)
			// keep using the old way of creating the IR in order to assure backwards compatibility
			for (let i = this.#nameType.children.length - 1; i >= 0; i--) {
				// internally generates enum-member error IR
				inner = this.#nameType.children[i].wrapDestructIR(ctx, inner, i);
			}

			const ir = new IR([
				this.upstreamExpr.toIR(ctx),
				new IR(`(\n${ctx.indent + TAB}(`), new IR(this.#nameType.children.map((nt, i) => nt.toNameIR(i))).join(", "), new IR(") ->", this.site), new IR(` {\n${ctx.indent}${TAB}${TAB}`),
				inner,
				new IR(`\n${ctx.indent + TAB}}\n${ctx.indent})`)
			]);

			return ir;
		} else {
			inner = this.#nameType.wrapDestructIR(ctx, inner, 0);

			let upstream = this.upstreamExpr.toIR(ctx);

			// enum member run-time error IR
			if (this.#nameType.hasType()) {
				const t = assertDefined(this.#nameType.type);

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
				this.#nameType.toNameIR(0), // wrapDestructIR depends on this name
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${ctx.indent}${TAB}`),
				inner,
				new IR(`\n${ctx.indent}}(`),
				upstream,
				new IR(")")
			]);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let downstreamStr = this.downstreamExpr.toString();
		assert(downstreamStr != undefined);

		return `${this.#nameType.toString()} = ${this.upstreamExpr.toString()}; ${downstreamStr}`;
	}
}

/**
 * Helios equivalent of unit
 * @internal
 */
export class VoidExpr extends Expr {
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
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
 * Literal expression class (wraps literal tokens)
 * @internal
 */
export class PrimitiveLiteralExpr extends Expr {
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
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
 * @internal
 */
export class LiteralDataExpr extends Expr {
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
	 * @internal
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
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
 * @internal
 */
export class StructLiteralField {
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
	 * @returns {null | EvalEntity}
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		return this.#value.toIR(ctx);
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
 * @internal
 */
export class StructLiteralExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const type_ = this.#typeExpr.eval(scope);

		if (!type_) {
			return null;
		}

		const type = type_.asDataType;

		if (!type) {
			this.#typeExpr.typeError(`'${this.#typeExpr.toString()}' doesn't evaluate to a data type`);
			return null;
		}

		if (type.fieldNames.length != this.#fields.length) {
			this.typeError(`wrong number of fields for ${type.toString()}, expected ${type.fieldNames.length}, got ${this.#fields.length}`);
			return null;
		}

		/**
		 * @param {Word} name
		 * @returns {null | Type}
		 */
		const getMemberType = (name) => {
			const memberVal = type.instanceMembers[name.value];

			if (!memberVal) {
				name.typeError(`member '${name.value}' not defined`);
				return null;
			}

			const memberType = memberVal.asType;

			if (!memberType) {
				name.typeError(`member '${name.value}' isn't a type`);
				return null;
			}

			return memberType;
		};

		for (let i = 0; i < this.#fields.length; i++) {
			const f = this.#fields[i];
		
			const fieldVal_ = f.eval(scope);
			if (!fieldVal_) {
				return null
			}

			const fieldVal = fieldVal_.asTyped;
			if (!fieldVal) {
				f.site.typeError("not typed");
				return null;
			}

			if (f.isNamed()) {
				if (type.fieldNames.findIndex(n => n == f.name.value) == -1) {
					f.name.site.typeError("not a valid field");
					return null;
				}

				// check the named type
				const memberType = getMemberType(f.name);
				if (!memberType) {
					continue;
				}

				if (!memberType.isBaseOf(fieldVal.type)) {
					f.site.typeError(`wrong field type for '${f.name.toString()}', expected ${memberType.toString()}, got ${fieldVal.type.toString()}`);
					return null;
				}
			} else {
				// check the positional type
				const memberType = getMemberType(new Word(f.site, type.fieldNames[i]));

				if (!memberType) {
					continue;
				}
				
				if (!memberType.isBaseOf(fieldVal.type)) {
					f.site.typeError(`wrong field type for field ${i.toString()}, expected ${memberType.toString()}, got ${fieldVal.type.toString()}`);
					return null;
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
	 * @param {ToIRContext} ctx
	 * @param {Site} site
	 * @param {string} path
	 * @param {IR[]} fields
	 */
	static toIRInternal(ctx, site, path, fields) {
		return new IR([
			new IR(`${path}____new`),
			new IR("("),
			new IR(fields).join(", "),
			new IR(")")
		], site);
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		const type = assertDefined(this.#typeExpr.cache?.asDataType);

		const fields = this.#fields.slice();

		// sort fields by correct name
		if (this.isNamed()) {
			fields.sort((a, b) => type.fieldNames.findIndex(n => n == a.name.value) - type.fieldNames.findIndex(n => n == b.name.value));
		}

		const irFields = fields.map(f => f.toIR(ctx));

		return StructLiteralExpr.toIRInternal(ctx, this.site, type.path, irFields);
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
 * @internal
 */
export class ListLiteralExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const itemType_ = this.#itemTypeExpr.eval(scope);
		if (!itemType_) {
			return null;
		}

		const itemType = itemType_.asDataType;

		if (!itemType) {
			this.#itemTypeExpr.typeError("content of list can't be func");
			return null;
		}

		for (let itemExpr of this.#itemExprs) {
			const itemVal_ = itemExpr.eval(scope);
			if (!itemVal_) {
				continue;
			}

			const itemVal = itemVal_.asTyped;

			if (!itemVal) {
				itemExpr.typeError("not typed");
				continue;
			}

			if (!itemType.isBaseOf(itemVal.type)) {
				itemExpr.typeError(`expected ${itemType.toString()}, got ${itemVal.type.toString()}`);
				continue;
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let ir = new IR("__core__mkNilData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#itemExprs.length - 1; i >= 0; i--) {

			let itemIR = new IR([
				new IR(`${this.itemType.path}____to_data`),
				new IR("("),
				this.#itemExprs[i].toIR(ctx),
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
 * @internal
 */
export class MapLiteralExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const keyType_ = this.#keyTypeExpr.eval(scope);
		if (!keyType_) {
			return null;
		}

		const keyType = keyType_.asDataType;
		if (!keyType) {
			this.#keyTypeExpr.typeError("key-type of Map can't be func");
			return null;
		}

		const valueType_ = this.#valueTypeExpr.eval(scope);
		if (!valueType_) {
			return null;
		}

		const valueType = valueType_.asDataType;
		if (!valueType) {
			this.#valueTypeExpr.typeError("value-type of Map can't be func");
			return null;
		}

		for (let [keyExpr, valueExpr] of this.#pairExprs) {
			const keyVal_ = keyExpr.eval(scope);
			if (!keyVal_) {
				continue;
			}

			const keyVal = keyVal_.asTyped;
			if (!keyVal) {
				keyExpr.typeError("not typed");
				continue;
			}

			const valueVal_ = valueExpr.eval(scope); 
			if (!valueVal_) {
				continue;
			}

			const valueVal = valueVal_.asTyped;
			if (!valueVal) {
				valueExpr.typeError("not typed");
				continue;
			}

			if (!keyType.isBaseOf(keyVal.type)) {
				keyExpr.typeError(`expected ${keyType.toString()} for map key, got ${keyVal.toString()}`);
				continue;
			}
			
			if (!valueType.isBaseOf(valueVal.type)) {
				valueExpr.typeError(`expected ${valueType.toString()} for map value, got ${valueVal.toString()}`);
				continue;
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let ir = new IR("__core__mkNilPairData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#pairExprs.length - 1; i >= 0; i--) {
			let [keyExpr, valueExpr] = this.#pairExprs[i];

			let keyIR = new IR([
				new IR(`${this.keyType.path}____to_data`),
				new IR("("),
				keyExpr.toIR(ctx),
				new IR(")"),
			]);

			let valueIR = new IR([
				new IR(`${this.valueType.path}____to_data`),
				new IR("("),
				valueExpr.toIR(ctx),
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
 * @internal
 */
export class NameTypePair {
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
			throw new Error("typeExpr not set in " + this.site.src.raw.split("\n")[0]);
		} else {
			// asDataType might be null if the evaluation of its TypeExpr threw a syntax error
			return this.#typeExpr.cache?.asType ?? new AllType();
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
	 * @returns {null | Type}
	 */
	evalType(scope) {
		if (this.isIgnored()) {
			return new AllType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set in " + this.site.src.raw.split("\n")[0]);
		} else {
			const t = this.#typeExpr.eval(scope);

			if (!t) {
				return null;
			}

			if (!t.asType) {
				this.#typeExpr.typeError(`'${t.toString()} isn't a valid type`);
				return null;
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
 * @internal
 */
export class FuncArg extends NameTypePair {
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
			const v_ = this.#defaultValueExpr.eval(scope);
			if (!v_) {
				return;
			}

			const v = v_.asTyped;
			if (!v) {
				this.#defaultValueExpr.typeError("not typed");
				return;
			}

			const t = this.evalType(scope);
			if (!t) {
				return;
			}

			if (!t.isBaseOf(v.type)) {
				this.#defaultValueExpr.site.typeError(`expected ${t.toString()}, got ${v.type.toString()}`);
				return;
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | ArgType}
	 */
	evalArgType(scope) {
		const t = super.evalType(scope);

		if (!t) {
			return null;
		}

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
	 * @param {ToIRContext} ctx
	 * @param {IR} bodyIR 
	 * @returns {IR}
	 */
	wrapWithDefault(ctx, bodyIR) {
		if (this.#defaultValueExpr == null) {
			return bodyIR;
		} else {
			const name = this.name.toString();

			return FuncArg.wrapWithDefaultInternal(bodyIR, name, this.#defaultValueExpr.toIR(ctx));
		}
	}
}

/**
 * (..) -> RetTypeExpr {...} expression
 * @internal
 */
export class FuncLiteralExpr extends Expr {
	#args;
	#retTypeExpr;
	#bodyExpr;

	/**
	 * @param {Site} site
	 * @param {FuncArg[]} args 
	 * @param {null | Expr} retTypeExpr 
	 * @param {Expr} bodyExpr 
	 */
	constructor(site, args, retTypeExpr, bodyExpr) {
		super(site);
		this.#args = args;
		this.#retTypeExpr = retTypeExpr;
		this.#bodyExpr = bodyExpr;
	}

	/**
	 * @type {number}
	 */
	get nArgs() {
		return this.#args.length;
	}

	/**
	 * @type {string[]}
	 */
	get argNames() {
		return this.#args.map(a => a.name.value);
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
	 * @type {Expr}
	 */
	get retExpr() {
		let expr = this.#bodyExpr;

		while (expr instanceof ChainExpr) {
			expr = expr.downstreamExpr;
		}

		return expr;
	}

	/**
	 * @type {Type}
	 */
	get retType() {
		if (this.#retTypeExpr === null) {
			return new AllType();
		} else {
			return assertDefined(this.#retTypeExpr.cache?.asType);
		}
	}
	
	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | FuncType}
	 */
	evalType(scope) {
		let args = this.#args;
		if (this.isMethod()) {
			args = args.slice(1);
		}

		const argTypes = reduceNull(args.map(a => a.evalArgType(scope)));

		const retType = this.#retTypeExpr ? this.#retTypeExpr.evalAsType(scope) : new AllType();

		if (argTypes === null || retType === null) {
			return null;
		}

		return new FuncType(argTypes, retType);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const fnType = this.evalType(scope);

		if (!fnType) {
			return null;
		}
		
		// argTypes is calculated separately again here so it includes self
		const argTypes = this.#args.map(a => a.evalType(scope));

		const subScope = new Scope(scope, true);

		argTypes.forEach((a, i) => {
			if (a && !this.#args[i].isIgnored()) {
				this.#args[i].evalDefault(subScope);

				subScope.set(this.#args[i].name, a.toTyped());
			}
		});

		let bodyVal = this.#bodyExpr.eval(subScope);

		if (!bodyVal) {
			return null;
		}

		if (this.#retTypeExpr == null) {
			if (bodyVal.asTyped) {
				return new FuncEntity(new FuncType(fnType.argTypes, bodyVal.asTyped.type));
			} else {
				this.#bodyExpr.typeError("expect multi or typed");
				return null;
			}
		} else if (bodyVal.asTyped) {
			if (!fnType.retType.isBaseOf(bodyVal.asTyped.type)) {
				this.#retTypeExpr.typeError(`wrong return type, expected ${fnType.retType.toString()} but got ${bodyVal.asTyped.type.toString()}`);
				return null;
			}
		} else {
			this.#bodyExpr.typeError("expect multi or typed");
			return null;
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
	 * @param {ToIRContext} ctx
	 * @param {IR} innerIR 
	 * @returns {IR}
	 */
	wrapWithDefaultArgs(ctx, innerIR) {
		const args = this.#args.slice().reverse();

		for (let arg of args) {
			innerIR = arg.wrapWithDefault(ctx, innerIR);
		}

		return innerIR;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIRInternal(ctx) {
		let argsWithCommas = this.argsToIR();

		let innerIndent = ctx.indent;
		let methodIndent = ctx.indent;
		if (this.isMethod()) {
			innerIndent += TAB;
		}

		let innerIR = this.#bodyExpr.toIR(ctx.tab());

		innerIR = this.wrapWithDefaultArgs(ctx, innerIR);

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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		return this.toIRInternal(ctx);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExpr == null) {
			return `(${this.#args.map(a => a.toString()).join(", ")}) -> {${this.#bodyExpr.toString()}}`;
		} else {
			return `(${this.#args.map(a => a.toString()).join(", ")}) -> ${this.#retTypeExpr.toString()} {${this.#bodyExpr.toString()}}`;
		}
	}
}

/**
 * value[...] expression
 * @internal
 */
export class ParametricExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const paramTypes = reduceNull(this.#parameters.map(p => p.evalAsType(scope)));

		const baseVal = this.#baseExpr.eval(scope);

		if (!baseVal) {
			return null;
		}

		if (!baseVal.asParametric) {
			this.site.typeError(`'${baseVal.toString()}' isn't a parametric type`);
			return null;
		} 

		if (paramTypes === null) {
			return null
		}
		
		return baseVal.asParametric.apply(paramTypes, this.site);
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		const params = ParametricExpr.toApplicationIR(this.paramTypes);
		
		if (this.#baseExpr instanceof MemberExpr) {
			return this.#baseExpr.toIR(ctx, params);
		} else {
			return IR.new`${this.#baseExpr.toIR(ctx).toString()}${params}${this.site}`;
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
 * @internal
 */
export class UnaryExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const a_ = this.#a.eval(scope);
		if (!a_) {
			return null;
		}

		const a = a_.asInstance;
		if (!a) {
			this.#a.site.typeError("not an instance");
			return null;
		}

		const op = this.translateOp().value;

		const fnVal = a.type.typeMembers[op]?.asType?.toTyped()?.asFunc;

		if (fnVal) {
			// immediately applied
			return fnVal.asFunc.call(this.#op.site, [a]);
		} else {
			this.#a.site.typeError(`'${this.#op.toString()} ${a.type.toString()}' undefined`);
			return null;
		}
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		const path = assertDefined(this.cache?.asTyped?.type?.asNamed).path;

		return IR.new`${path}__${this.translateOp().value}${this.site}(${this.#a.toIR(ctx)})`;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#op.toString()}${this.#a.toString()}`;
	}
}

/**
 * @internal
 * @type {{[name: string]: string}}
 */
export const BINARY_SYMBOLS_MAP = {
	"||": "__or",
	"&&": "__and",
	"==": "__eq",
	"!=": "__neq",
	"<": "__lt",
	"<=": "__leq",
	">": "__gt",
	">=": "__geq",
	"+": "__add",
	"-": "__sub",
	"*": "__mul",
	"/": "__div",
	"%": "__mod"
}

/**
 * Binary operator expression
 * @internal
 */
export class BinaryExpr extends Expr {
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

		let name = BINARY_SYMBOLS_MAP[op];

		if (!name) {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const a_ = this.#a.eval(scope);
		const b_ = this.#b.eval(scope);
		
		if (!a_ || !b_) {
			return null;
		}

		const a = a_.asInstance;
		if (!a) {
			this.#a.typeError(`lhs of ${this.#op.toString()} not an instance`);
			return null;
		}

		const b = b_.asInstance;
		if (!b) {
			this.#b.typeError(`rhs of ${this.#op.toString()} not an instance`);
			return null;
		}

		for (let swap of (this.isCommutative() ? [false, true] : [false])) {
			for (let alt of [0, 1, 2]) {
				let first  = swap ? b : a;
				let second = swap ? a : b;

				const fnVal_ = first.type.typeMembers[this.translateOp(alt).value];

				let fnVal = fnVal_?.asType?.toTyped()?.asFunc;
				if (!fnVal) {
					continue;
				}

				if (fnVal.funcType.argTypes[0].isBaseOf(first.type) && fnVal.funcType.argTypes[1].isBaseOf(second.type)) {
					let res = fnVal.call(this.#op.site, [first, second]);

					this.#swap = swap;
					this.#alt  = alt;

					return res;
				}
			}
		}

		this.typeError(`'${a.type.toString()} ${this.#op.toString()} ${b.type.toString()}' undefined`);
		return null;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let path = assertDefined(this.first.cache?.asTyped?.type.asNamed).path;

		let op = this.translateOp(this.#alt).value;

		if (op == "__and" || op == "__or") {
			return new IR([
				new IR(`${path}${op}`, this.site), new IR(`(\n${ctx.indent}${TAB}() -> {`),
				this.first.toIR(ctx.tab()),
				new IR(`},\n${ctx.indent}${TAB}() -> {`),
				this.second.toIR(ctx.tab()),
				new IR(`}\n${ctx.indent})`)
			]);
		} else {
			return new IR([
				new IR(`${path}__${op}`, this.site), new IR("(", this.site),
				this.first.toIR(ctx),
				new IR(", "),
				this.second.toIR(ctx),
				new IR(")")
			]);
		}
	}
}

/**
 * Parentheses expression
 * @internal
 */
export class ParensExpr extends Expr {
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
	 * @returns {boolean}
	 */
	isLiteral() {
		return this.#exprs.every(e => e.isLiteral());
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].eval(scope);
		} else {
			const entries = reduceNull(this.#exprs.map(e => {
				const v_ = e.eval(scope);
				if (!v_) {
					return null;
				}

				const v = v_.asTyped;
				if (!v) {
					e.site.typeError("not typed");
					return null;
				} 
				
				if ((new ErrorType()).isBaseOf(v.type)) {
					e.site.typeError("unexpected error call in multi-valued expression");
					return null;
				}

				return v.type;
			}));

			if (entries === null) {
				return null;
			}

			//return new MultiEntity(entries);

			return TupleType$(entries).toTyped();
		}
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].toIR(ctx);
		} else {
			return new IR(
				[new IR(`(callback) -> {\n${ctx.indent + TAB}callback(\n${ctx.indent + TAB + TAB}`, this.site)]
				.concat(new IR(this.#exprs.map(e => e.toIR(ctx.tab().tab()))).join(`,\n${ctx.indent + TAB + TAB}`))
				.concat([new IR(`\n${ctx.indent + TAB})\n${ctx.indent}}`)])
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
 * @internal
 */
export class CallArgExpr extends Token {
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
	 * @returns {null | EvalEntity}
	 */
	eval(scope) {
		return this.#valueExpr.eval(scope);
	}
}

/**
 * ...(...) expression
 * @internal
 */
export class CallExpr extends Expr {
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
		this.#appliedFnVal = null; // only for infered parametric funcions
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const fnVal = this.#fnExpr.eval(scope);

		const argVals = reduceNull(this.#argExprs.map((ae, i) => {
			const av_ = ae.eval(scope);

			if (!av_) {
				return null;
			}
			
			const av = av_.asTyped;

			if (!av) {
				ae.typeError(`arg ${i+1} not an instance`);
				return null;
			}

			return av;
		}));

		if (!fnVal || argVals === null) {
			return null;
		}

		/**
		 * @type {Typed[]}
		 */
		const posArgVals = [];

		this.#argExprs.forEach((argExpr, i) => {
			if (!argExpr.isNamed()) {
				posArgVals.push(argVals[i]);
			}
		});

		/**
		 * @type {{[name: string]: Typed}}
		 */
		const namedArgVals = {};

		this.#argExprs.forEach((argExpr, i) => {
			if (argExpr.isNamed()) {
				const val = argVals[i];

				if (val.asTyped) {
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
			this.#fnExpr.typeError(`unable to call ${fnVal.toString()} (returned by ${this.#fnExpr.toString()})`);
			return null;
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
	 * @param {ToIRContext} ctx
	 * @returns {[Expr[], IR[]]} - first list are positional args, second list named args and remaining opt args
	 */
	expandArgs(ctx) {
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
						ae.valueExpr.toIR(ctx)
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toFnExprIR(ctx) {
		if (this.#fnExpr.cache?.asParametric instanceof ParametricFunc) {
			assert(this.#paramTypes.length > 0);

			const params = ParametricExpr.toApplicationIR(this.#paramTypes);

			if (this.#fnExpr instanceof MemberExpr) {
				return this.#fnExpr.toIR(ctx, params);
			} else {
				return new IR(`${this.#fnExpr.toIR(ctx).toString()}${params}`, this.#fnExpr.site);
			}
		} else {
			return this.#fnExpr.toIR(ctx);
		}
	}

	/**
	 * @private
	 * @param {Expr[]} posExprs 
	 * @returns {Map<Expr, number>}
	 */
	detectExpandedTuples(posExprs) {
		/**
		 * @type {Map<Expr, number>}
		 */
		const result = new Map();

		const posArgs = reduceNull(posExprs.map(e => e.cache?.asTyped ?? null));

		if (!posArgs) {
			posExprs.forEach(e => {
				result.set(e, 0);
			})

			return result;
		}

		const expandedPosArgs = this.fn.expandTuplesInPosArgs(posArgs);

		let j = 0;

		for (let i = 0; i < posArgs.length; i++) {
			if (j >= expandedPosArgs.length) {
				throw new Error("unexpected");
			}

			if (posArgs[i] == expandedPosArgs[j]) {
				result.set(posExprs[i], 0);
				j++;
			} else {
				const tupleItemTypes = getTupleItemTypes(posArgs[i].type);
				if (!tupleItemTypes) {
					throw new Error("unexpected");
				}

				result.set(posExprs[i], tupleItemTypes.length);
				j += tupleItemTypes.length;
			}
		}

		return result;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let fnIR = this.toFnExprIR(ctx);

		/**
		 * We need the func type for things like multivalued args and optional args 
		 * @type {FuncType} 
		 */
		const fn = this.fn;

		/**
		 * First step is to eliminate the named args
		 * @type {[Expr[], IR[]]}
		 */
		const [posExprs, namedOptExprs] = this.expandArgs(ctx);

		// some multiValued args (always positional)
		const isExpandedTuple = this.detectExpandedTuples(posExprs);

		if (posExprs.some(e => (isExpandedTuple.get(e) ?? 0) > 0 )) {
			// count the number of final args
			let n = 0;

			posExprs.forEach((e, i) => {
				if ((isExpandedTuple.get(e) ?? 0) > 0) {
					n += assertDefined(isExpandedTuple.get(e));
				} else {
					n += 1;
				}
			});

			n += namedOptExprs.length;

			if (n > fn.nArgs) {
				namedOptExprs.splice(0, n - fn.nArgs);
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

			for (let namedIR of namedOptExprs.slice().reverse()) {
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

			for (let i = posExprs.length - 1; i >= 0; i--) {
				const e = posExprs[i];

				if ((isExpandedTuple.get(e) ?? 0) > 0) {
					const nMulti = assertDefined(isExpandedTuple.get(e));
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
						e.toIR(ctx),
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
						e.toIR(ctx),
						new IR(")")
					]);
				}
			}

			return ir;
		} else /* no multivalued args */ {
			if (posExprs.length + namedOptExprs.length > fn.nArgs) {
				namedOptExprs.splice(0, posExprs.length + namedOptExprs.length - fn.nArgs);
			}

			let args = posExprs.map((a, i) => {
				let ir = a.toIR(ctx);

				if (i >= fn.nNonOptArgs) {
					ir = new IR([
						new IR("true, "),
						ir
					]);
				}

				return ir;
			}).concat(namedOptExprs);

			return new IR([
				fnIR,
				new IR("(", this.site),
				(new IR(args)).join(", "),
				new IR(")")
			]);
		}
	}
}

/**
 *  ... . ... expression
 * @internal
 */
export class MemberExpr extends Expr {
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const objVal_ = this.#objExpr.eval(scope);
		if (!objVal_) {
			return null;
		}

		const objVal = objVal_.asInstance;
		if (!objVal) {
			this.#objExpr.site.typeError(`lhs of '.' not an instance`);
			return null;
		}

		let member = objVal.instanceMembers[this.#memberName.value];
		if (!member) {

			if (objVal?.type?.asEnumMemberType) {
				member = objVal.type.asEnumMemberType.parentType.instanceMembers[this.#memberName.value];
			}

			if (!member) {
				this.#memberName.referenceError(`'${objVal.type.toString()}.${this.#memberName.value}' undefined`);
				return null;
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
	 * @param {ToIRContext} ctx
	 * @param {string} params - applied type parameters must be inserted Before the call to self
	 * @returns {IR}
	 */
	toIR(ctx, params = "") {
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
			this.#objExpr.toIR(ctx),
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
 * @internal
 */
export class IfElseExpr extends Expr {
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
	 * @returns {null | Type}
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

				const prevTupleItems = getTupleItemTypes(prevType);
				const newTupleItems = getTupleItemTypes(newType);

				if (prevTupleItems && newTupleItems && prevTupleItems.length == newTupleItems.length) {
					const reducedTupleItems = reduceNull(prevTupleItems.map((prev, i) => IfElseExpr.reduceBranchType(site, prev, newTupleItems[i])));

					if (reducedTupleItems) {
						return TupleType$(reducedTupleItems);
					}
				}

				site.typeError("inconsistent types");
				return null;
			}
		} else {
			return prevType;
		}
	}

	/**
	 * @param {Site} site
	 * @param {null | Type} prevType
	 * @param {Typed} newValue
	 * @returns {null | Type}
	 */
	static reduceBranchMultiType(site, prevType, newValue) {
		if (newValue.asTyped && (new ErrorType()).isBaseOf(newValue.asTyped.type)) {
			return prevType;
		}

		const newType = assertDefined(newValue.asTyped).type;

		if (prevType === null) {
			return newType;
		} else {
			return IfElseExpr.reduceBranchType(site, prevType, newType);
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		for (let c of this.#conditions) {
			const cVal_ = c.eval(scope);
			if (!cVal_) {
				continue;
			}

			const cVal = cVal_.asTyped;

			if (!cVal || !BoolType.isBaseOf(cVal.type)) {
				c.typeError("expected bool");
				continue;
			}
		}

		/**
		 * @type {null | Type}
		 */
		let branchMultiType = null;

		for (let b of this.#branches) {
			// don't allow shadowing
			const branchScope = new Scope(scope, false);

			const branchVal = b.evalAsTyped(branchScope);

			if (!branchVal) {
				continue;
			}

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
			return branchMultiType.toTyped();
		}
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let n = this.#conditions.length;

		// each branch actually returns a function to allow deferred evaluation
		let res = new IR([
			new IR("() -> {"),
			this.#branches[n].toIR(ctx),
			new IR("}")
		]);

		// TODO: nice indentation
		for (let i = n - 1; i >= 0; i--) {
			res = new IR([
				new IR("__core__ifThenElse("),
				this.#conditions[i].toIR(ctx),
				new IR(", () -> {"),
				this.#branches[i].toIR(ctx),
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
 * `NameExpr [':' TypeExpr ['{' ... '}']]`
 * @internal
 */
export class DestructExpr {
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
	 * @type {boolean}
	 */
	#isTuple;

	/**
	 * @param {Word} name - use an underscore as a sink
	 * @param {null | Expr} typeExpr 
	 * @param {DestructExpr[]} destructExprs
	 * @param {boolean} isTuple typeExpr must be `null` if isTuple is `true` and `destructExpr.length` must be `> 0`
	 */
	constructor(name, typeExpr, destructExprs = [], isTuple = false) {
		this.#name = assertDefined(name);
		this.#typeExpr = typeExpr;
		this.#destructExprs = destructExprs;
		this.#isTuple = isTuple;

		if (isTuple) {
			assert(this.#destructExprs.length > 0 && this.#typeExpr == null);
		} else {
			assert(!(this.#typeExpr == null && this.#destructExprs.length > 0), `unexpected syntax: ${this.toString()}`);
		}
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
	 * @type {DestructExpr[]}
	 */
	get children() {
		return this.#destructExprs;
	}

	/**
	 * @returns {boolean}
	 */
	isTuple() {
		return this.#isTuple;
	}

	/**
	 * @returns {boolean}
	 */
	hasDestructExprs() {
		return this.#destructExprs.length > 0;
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
	 * Throws an error if called before evalType()
	 * @type {null | Type}
	 */
	get type() {
		if (this.#typeExpr === null) {
			if (this.#isTuple) {
				const nestedTypes = reduceNull(this.#destructExprs.map(e => e.type));

				if (!nestedTypes) {
					this.site.typeError(`invalid nested tuple in in destruct expression`);
					return null;
				}

				return TupleType$(nestedTypes);
			} else if (this.isIgnored()) {
				return new AllType();
			} else {
				return null;
			}
		} else {
			if (!this.#typeExpr.cache?.asType) {
				this.#typeExpr.typeError(`invalid type '${assertDefined(this.#typeExpr.cache, "cache unset").toString()}'`);
				return null;
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
			if (this.#destructExprs.length > 0 && this.#isTuple) {
				return `${this.name.toString()}: (${this.#destructExprs.map(de => de.toString()).join(", ")})`;
			} else {
				return this.name.toString();
			}
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
	 * @param {null | Type} upstreamType
	 * @returns {null | Type}
	 */
	evalType(scope, upstreamType = null) {
		if (this.#typeExpr === null) {
			if (this.#isTuple) {
				const upstreamItemTypes = upstreamType ? getTupleItemTypes(upstreamType) : null;
				const nestedTypes = reduceNull(this.#destructExprs.map((e, i) => e.evalType(scope, upstreamItemTypes ? upstreamItemTypes[i] : null)));

				if (!nestedTypes) {
					this.site.typeError(`invalid nested tuple in in destruct expression`);
					return null;
				}

				return TupleType$(nestedTypes);
			} else if (this.isIgnored()) {
				return new AllType();
			} else {
				throw new Error("typeExpr not set in " + this.site.src.raw.split("\n")[0]);
			}
		} else {
			const t = this.#typeExpr.evalAsType(scope);

			if (t && upstreamType && !upstreamType.asEnumMemberType && t.asEnumMemberType) {
				return t.asEnumMemberType.parentType;
			} else {
				return t;
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType 
	 */
	evalDestructExprs(scope, upstreamType) {
		if (this.#destructExprs.length > 0) {
			if (this.#isTuple) {
				const tupleItemTypes = getTupleItemTypes(upstreamType);

				if (!tupleItemTypes) {
					this.site.typeError("upstream value isn't a tuple, can't destruct");
					return;
				}

				if (tupleItemTypes.length != this.#destructExprs.length) {
					this.site.typeError(`wrong number of destruct tuple fields, expected ${tupleItemTypes.length}, got ${this.#destructExprs.length}`);
					return;
				}

				for (let i = 0; i < this.#destructExprs.length; i++) {
					this.#destructExprs[i].evalInternal(
						scope, 
						tupleItemTypes[i], 
						i
					);
				}
			} else {
				if (!upstreamType.asDataType) {
					this.site.typeError("can't destruct a function");
					return;
				}

				const upstreamFieldNames = upstreamType.asDataType.fieldNames;

				if (upstreamFieldNames.length != this.#destructExprs.length) {
					this.site.typeError(`wrong number of destruct fields, expected ${upstreamFieldNames.length}, got ${this.#destructExprs.length}`);
					return;
				}

				for (let i = 0; i < this.#destructExprs.length; i++) {
					this.#destructExprs[i].evalInternal(
						scope, 
						assertDefined(upstreamType.instanceMembers[upstreamFieldNames[i]].asDataType), // we `asDataType` because methods can't be destructed
						i
					);
				}
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
			const t = this.evalType(scope);
			if (!t) {
				return;
			}

			// differs from upstreamType because can be enum parent
			let checkType = t;

			// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
			if (t.asEnumMemberType && !upstreamType.asEnumMemberType) {
				checkType = t.asEnumMemberType.parentType;
			}

			if (!checkType.isBaseOf(upstreamType)) {
				this.site.typeError(`expected ${checkType.toString()} for destructure field ${i+1}, got ${upstreamType.toString()}`);
				return null;
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
	 * @param {null | Type} upstreamType
	 * @param {number} i
	 */
	evalInAssignExpr(scope, upstreamType, i) {
		const t = this.evalType(scope);

		if (!t) {
			scope.set(this.name, new DataEntity(new AnyType()));
			return;
		}

		// differs from upstreamType because can be enum parent
		// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
		// also do this for nested as well
		const checkType = this.evalType(scope, upstreamType);

		if (checkType && upstreamType) {
			if (!checkType.isBaseOf(upstreamType)) {
				this.site.typeError(`expected ${checkType.toString()} for rhs ${i+1}, got ${upstreamType.toString()}`);
			}
		}

		if (!this.isIgnored()) {
			// TODO: take into account ghost type parameters
			scope.set(this.name, t.toTyped());
		}

		this.evalDestructExprs(scope, t);
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
		const type = assertDefined(this.type);

		if (type.asDataType) {
			return `${type.asDataType.path}__${type.asDataType.fieldNames[fieldIndex]}`;
		} else {
			return "";
		}
	}

	/**
	 * @private
	 * @param {ToIRContext} ctx
	 * @param {IR} inner 
	 * @param {string} objName 
	 * @param {number} fieldIndex 
	 * @param {string} fieldGetter
	 * @returns {IR}
	 */
	wrapDestructIRInternal(ctx, inner, objName, fieldIndex, fieldGetter) {
		if (this.isIgnored() && this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `${objName}_${fieldIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				const de = this.#destructExprs[i];

				const innerGetter = this.#isTuple ? de.toNameIR(i).toString() : `${this.getFieldFn(i)}(${baseName})`;

				inner = de.wrapDestructIRInternal(ctx.tab(), inner, baseName, i, innerGetter);
			}

			if (this.#isTuple) {
				inner = IR.new`${baseName}(
					(${new IR(this.#destructExprs.map((de, i) => de.toNameIR(i))).join(", ")}) -> {
						${inner}
					}
				)`;
			}

			let getter = fieldGetter;

			const t = this.type;

			// assert correct constructor index
			if (this.#typeExpr && t && t.asEnumMemberType) {
				const constrIdx = t.asEnumMemberType.constrIndex;

				getter = `__helios__common__assert_constr_index(${getter}, ${constrIdx})`;
			}
			
			return new IR([
				new IR("("),
				new IR(baseName, this.#name.site),
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${ctx.indent}${TAB}`),
				inner,
				new IR(`\n${ctx.indent}}(${getter})`),
			]);
		}
	}

	/**
	 * 
	 * @param {ToIRContext} ctx
	 * @param {IR} inner - downstream IR expression
	 * @param {number} argIndex 
	 * @returns {IR}
	 */
	wrapDestructIR(ctx, inner, argIndex) {
		if (this.#destructExprs.length == 0) {
			return inner;
		} else {
			/**
			 * same as this.toNameIR()
			 * TODO: can __lhs be changed to underscore?
			 */
			const baseName = this.isIgnored() ? `__lhs_${argIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				const de = this.#destructExprs[i];

				const getter = this.#isTuple ? de.toNameIR(i).toString() : `${this.getFieldFn(i)}(${baseName})`;

				inner = de.wrapDestructIRInternal(ctx.tab(), inner, baseName, i, getter);
			}

			if (this.#isTuple) {
				return IR.new`${baseName}(
					(${new IR(this.#destructExprs.map((de, i) => de.toNameIR(i))).join(", ")}) -> {
						${inner}
					}
				)`;
			} else {
				return inner;
			}
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
 * @internal
 */
export class SwitchCase extends Token {
	#lhs;
	#bodyExpr;

	/** 
	 * @type {null | number} 
	 */
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

	/**
	 * @returns {boolean}
	 */
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
	 * @returns {null | Typed}
	 */
	evalEnumMember(scope, enumType) {
		const caseType = enumType.typeMembers[this.memberName.value]?.asEnumMemberType;
		if (!caseType) {
			this.memberName.typeError(`${this.memberName.value} isn't a valid enum member of ${enumType.toString()}`);
			return null;
		}

		this.#constrIndex = caseType.constrIndex;

		assert(this.#constrIndex >= 0);

		const caseScope = new Scope(scope, false);

		this.#lhs.evalInSwitchCase(caseScope, caseType);

		const bodyVal_ = this.#bodyExpr.eval(caseScope);
		
		if (!bodyVal_) {
			return null;
		}

		const bodyVal = bodyVal_.asTyped;

		if (!bodyVal) {
			this.#bodyExpr.typeError("not typed");
			return null;
		}

		caseScope.assertAllUsed();

		return bodyVal;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {null | Typed}
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
				const maybeMemberType_ = scope.get(this.memberName);
				if (!maybeMemberType_) {
					return null;
				}

				let maybeMemberType = maybeMemberType_.asDataType;
				if (!maybeMemberType) {
					this.memberName.typeError("expected a data type");
					return null;
				}
				memberType = maybeMemberType;

				if (!Common.isEnum(memberType)) {
					this.memberName.typeError("expected an enum type");
					return null;
				}
		}

		const caseScope = new Scope(scope, false);

		this.#lhs.evalInSwitchCase(caseScope, memberType);

		const bodyVal_ = this.#bodyExpr.eval(caseScope);

		if (!bodyVal_) {
			return null;
		}

		caseScope.assertAllUsed();

		const bodyVal = bodyVal_.asTyped;

		if (!bodyVal) {
			this.#bodyExpr.typeError("not typed");
			return null;
		}

		return bodyVal;
	}

	/**
	 * Accept an arg because will be called with the result of the controlexpr
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let inner = this.#bodyExpr.toIR(ctx.tab());

		inner = this.#lhs.wrapDestructIR(ctx, inner, 0);

		return new IR([
			new IR("("),
			this.#lhs.toNameIR(0), // wrapDestructIR depends on this name
			new IR(") "),
			new IR("->", this.site), new IR(` {\n${ctx.indent}${TAB}`),
			inner,
			new IR(`\n${ctx.indent}}`),
		]);
	}
}

/**
 * @internal
 */
export class UnconstrDataSwitchCase extends SwitchCase {
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
	 * @returns {null | Typed}
	 */
	evalDataMember(scope) {
		/**
		 * @type {null | Typed}
		 */
		let bodyVal = null;

		if (this.#intVarName !== null || this.#lstVarName !== null) {
			let caseScope = new Scope(scope, false);

			if (this.#intVarName !== null) {
				caseScope.set(this.#intVarName, new DataEntity(IntType));
			}

			if (this.#lstVarName !== null) {
				caseScope.set(this.#lstVarName, new DataEntity(ListType$(RawDataType)));
			}

			const bodyVal_ = this.body.eval(caseScope);

			if (!bodyVal_) {
				return null;
			}

			bodyVal = bodyVal_.asTyped;

			caseScope.assertAllUsed();
		} else {
			const bodyVal_ = this.body.eval(scope);

			if (!bodyVal_) {
				return null;
			}

			bodyVal = bodyVal_.asTyped;
		}

		if (!bodyVal) {
			this.body.typeError("not typed");
			return null;
		}

		return bodyVal;
	}

	/**
	 * Accepts two args
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		return new IR([
			new IR(`(data) -> {\n${ctx.indent}${TAB}`),
			new IR(`(pair) -> {\n${ctx.indent}${TAB}${TAB}`),
			new IR(`(${this.#intVarName !== null ? this.#intVarName.toString() : "_"}, ${this.#lstVarName !== null ? this.#lstVarName.toString() : "_"}) `), new IR("->", this.site), new IR(` {\n${ctx.indent}${TAB}${TAB}${TAB}`),
			this.body.toIR(ctx.tab().tab().tab()),
			new IR(`\n${ctx.indent}${TAB}${TAB}}(__core__fstPair(pair), __core__sndPair(pair))`),
			new IR(`\n${ctx.indent}${TAB}}(__core__unConstrData(data))`),
			new IR(`\n${ctx.indent}}`)
		]);
	}
}

/**
 * Default switch case
 * @internal
 */
export class SwitchDefault extends Token {
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
	 * @returns {null | Typed}
	 */
	eval(scope) {
		const bodyVal_ = this.#bodyExpr.eval(scope);

		if (!bodyVal_) {
			return null;
		}

		const bodyVal = bodyVal_.asTyped;

		if (!bodyVal) {
			this.#bodyExpr.typeError("not typed");
			return null;
		}

		return bodyVal;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		return new IR([
			new IR(`(_) `), new IR("->", this.site), new IR(` {\n${ctx.indent}${TAB}`),
			this.#bodyExpr.toIR(ctx.tab()),
			new IR(`\n${ctx.indent}}`)
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
	 * @param {null | SwitchDefault} defaultCase
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
 * @internal
 */
export class EnumSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const controlVal_ = this.controlExpr.eval(scope);
		if (!controlVal_) {
			return null;
		}

		const controlVal = controlVal_.asTyped;

		if (!controlVal) {
			this.controlExpr.typeError("not typed");
			return null;
		}

		let enumType = controlVal.type.asDataType;

		if (!enumType) {
			this.controlExpr.typeError("not an enum");
			return null;
		}

		if (controlVal.type.asEnumMemberType) {
			this.controlExpr.typeError(`${controlVal.type.toString()} is an enum variant, not an enum`);
			enumType = controlVal.type.asEnumMemberType.parentType; // continue with optimistic evaluation, even though compilation will fail
		}

		const nEnumMembers = Common.countEnumMembers(enumType);

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && nEnumMembers > this.cases.length) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {null | Type} */
		let branchMultiType = null;

		for (let c of this.cases) {
			const branchVal = c.evalEnumMember(scope, enumType);

			if (!branchVal) {
				continue;
			}
	
			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			const defaultVal = this.defaultCase.eval(scope);

			if (defaultVal) {
				branchMultiType = IfElseExpr.reduceBranchMultiType(
					this.defaultCase.site,
					branchMultiType, 
					defaultVal
				);
			}
		}

		if (branchMultiType === null) {
			return new ErrorEntity();
		} else {
			return branchMultiType.toTyped();
		}
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		let cases = this.cases.slice();

		/** @type {SwitchCase | SwitchDefault} */
		let last;
		if (this.defaultCase !== null) {
			last = this.defaultCase;
		} else {
			last = assertDefined(cases.pop());
		}

		let n = cases.length;

		let res = last.toIR(ctx.tab().tab().tab());

		// TODO: if constrIndex is null then use the case test that is defined as a builtin (needed to be able to treat StakingCredential as an enum)
		// TODO: once the null fallback has been implemented get rid of constrIndex
		for (let i = n - 1; i >= 0; i--) {
			const c = cases[i];
			
			const test = IR.new`__core__equalsInteger(i, ${c.constrIndex.toString()})`;

			res = IR.new`__core__ifThenElse(
				${test},
				() -> {
					${c.toIR(ctx.tab().tab().tab())}
				}, () -> {
					${res}
				}
			)()`;
		}

		return new IR([
			new IR(`(e) `), new IR("->", this.site), new IR(` {\n${ctx.indent}${TAB}(\n${ctx.indent}${TAB}${TAB}(i) -> {\n${ctx.indent}${TAB}${TAB}${TAB}`),
			res,
			new IR(`\n${ctx.indent}${TAB}${TAB}}(__core__fstPair(__core__unConstrData(e)))\n${ctx.indent}${TAB})(e)\n${ctx.indent}}(`),
			this.controlExpr.toIR(ctx),
			new IR(")"),
		]);
	}
}

/**
 * Switch expression for Data
 * @internal
 */
export class DataSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const controlVal_ = this.controlExpr.eval(scope);
		if (!controlVal_) {
			return null;
		}

		const controlVal = controlVal_.asTyped;
		if (!controlVal) {
			this.controlExpr.typeError("not typed");
			return null;
		}

		const dataType = controlVal.type.asDataType;
		if (!dataType) {
			this.controlExpr.typeError("not a data type");
			return null;
		}

		if (!RawDataType.isBaseOf(dataType)) {
			this.controlExpr.typeError(`expected Data type, got ${controlVal.type.toString()}`);
			return null;
		}

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && this.cases.length < 5) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {null | Type} */
		let branchMultiType = null;

		for (let c of this.cases) {
			const branchVal = c.evalDataMember(scope);

			if (!branchVal) {
				continue;
			}

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			const defaultVal = this.defaultCase.eval(scope);

			if (defaultVal) {
				branchMultiType = IfElseExpr.reduceBranchMultiType(
					this.defaultCase.site, 
					branchMultiType, 
					defaultVal
				);
			}
		}

		if (branchMultiType === null) {
			// only possible if each branch is an error
			return new ErrorEntity();
		} else {
			return branchMultiType.toTyped();
		}
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIR(ctx) {
		/** @type {[?IR, ?IR, ?IR, ?IR, ?IR]} */
		let cases = [null, null, null, null, null]; // constr, map, list, int, byteArray

		for (let c of this.cases) {
			let ir = c.toIR(ctx.tab().tab());

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
						new IR("__core__unListData"),
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
						new IR("__core__unMapData"),
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
					cases[i] = new IR(`${ctx.indent}${TAB}def`);
				}
			}
		}

		let res = new IR([
			new IR(`${ctx.indent}__core__chooseData(e, `, this.site),
			new IR(cases.map(c => assertDefined(c))).join(", "),
			new IR(`${ctx.indent})`)
		]);

		if (this.defaultCase !== null) {
			res = new IR([
				new IR(`${ctx.indent}(def) -> {\n`),
				res,
				new IR(`\n${ctx.indent}}(`),
				this.defaultCase.toIR(ctx),
				new IR(`)`)
			]);
		}

		res = new IR([
			new IR(`${ctx.indent}(e) -> {\n`),
			res,
			new IR("(e)"),
			new IR(`${ctx.indent}}(`),
			this.controlExpr.toIR(ctx),
			new IR(")")
		]);

		return res;
	}
}
