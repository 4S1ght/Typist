
import { typeOf, VariableType } from "./types";


// TYPES ============================================================


interface SchemaPropInterface<Type extends VariableType, ValueType = any> {

    type: Type

    /** 
     * A list of allowed values that this value can represent.
     * If contains items and the provided value does not appear here
     * the schema check will fail.
     */
    allowedValues: Array<ValueType>

    /**
     * Specifies whether the property is optional, meaning it can be
     * undefined or not exist on the object in the first place.
     */
    optional: boolean

    /**
     * A base callback function used to validate a property against the schema.
     */
    validateBasics: (value: any) => boolean

}

type ObjectOf<Item = any> = {
    [key: string|number]: Item
}

type RequiredPropMark = "?" | "!" | boolean | undefined

// HELPERS ==========================================================


const compareTypes = (optional: boolean, propType: VariableType, varType: VariableType) =>
    propType === varType || (optional && varType === 'undefined')

const compareAllowedValues = (allowedValues: any[], value: any) =>
    allowedValues.length === 0 || allowedValues.includes(value)

const convertSyntaxToBool = (value: RequiredPropMark) => {
    if (typeOf(value, ['boolean', 'undefined'])) return !!value
    return ({ "?": true, "!": false })[value as ("?"|"!")] || false
}


// PROPS ============================================================


export class $Prop<Type extends (VariableType | "any"), ValueType = any> implements SchemaPropInterface<Type, ValueType> {

    public type: Type
    public optional: boolean
    public allowedValues: ValueType[];

    constructor(type: Type, optional: boolean, allowedValues: Array<ValueType>) {
        this.type = type
        this.optional = optional
        this.allowedValues = allowedValues
    }

    public validateBasics(value: any) {
        // Check of the types match and alternatively allow for "undefined" if prop is optional
        if (!compareTypes(this.optional, this.type, typeOf(value))) return false
        // Compare the value to a set of allowed ones if they were specified
        if (!compareAllowedValues(this.allowedValues, value)) return false

        return true
    }

}


// ==================================================================


export class _String extends $Prop<"string", string> {

    constructor(optional?: boolean, allowedValues?: Array<string>) {
        super("string", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Number extends $Prop<"number", number> {

    constructor(optional?: boolean, allowedValues?: Array<number>) {
        super("number", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Int extends $Prop<"number", number> {

    constructor(optional?: boolean, allowedValues?: Array<number>) {
        super("number", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        if (!this.optional && !Number.isInteger(value)) return false
        return true
    }

}

export class _BigInt extends $Prop<"bigint", bigint> {

    constructor(optional?: boolean, allowedValues?: Array<bigint>) {
        super("bigint", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Boolean extends $Prop<"boolean", boolean> {

    constructor(optional?: boolean) {
        super("boolean", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Undefined extends $Prop<"undefined", undefined> {

    constructor() {
        super("undefined", false, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Object extends $Prop<"object", object> {

    constructor(optional?: boolean, content?: ObjectOf<SchemaProp | Object>) {
        super("object", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

// TODO: Add functionality allowing to check types of variables inside of the array (including other object/array schemas)
export class _Array extends $Prop<"array", Array<any>> {

    constructor(optional?: boolean, allowedValueTypes?: Array<VariableType>) {
        super("array", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Function extends $Prop<"function", Array<Function>> {

    constructor(optional?: boolean) {
        super("function", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}


// SCHEMA VALIDATION ================================================

type SchemaProp   = $Prop<any> & { validate: (value: any) => boolean }
type SchemaObject = ObjectOf<SchemaProp | Object>

export class $Schema {

    constructor(public schema: SchemaObject) {
        // Make sure the schema is an object
        if (!typeOf(schema, ['object'])) throw new TypeError('Provided schema is not object-like.')

        for (const prop in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, prop)) {
                const childProp = schema[prop]
                if (typeOf(childProp, ['object']) && childProp instanceof $Prop === false) {
                    schema[prop] = new $Schema(childProp as ObjectOf<SchemaProp>)
                }
            }
        }
    }

    public validate(object: any): Boolean {
        try {

            if (!typeOf(object, ['object'])) return false
    
            for (const key in this.schema) {
                if (Object.prototype.hasOwnProperty.call(this.schema, key)) {
    
                    const schemaProp  = this.schema[key] as SchemaProp
                    const checkedProp = object[key]      as SchemaProp
    
                    // Types are checked in the props themselves for now.
                    // const schemaType = schemaProp.type
                    // const checkedType = typeOf(checkedProp)
    
                    if (!schemaProp.validate(checkedProp)) return false
                    
                }
            }
    
            return true
    
        } 
        catch (error) {
            console.log(error)
            return false
        }
    }
}


// EXPORTS ================================================

export const $String    = (optional?: RequiredPropMark, values?: Array<string>) => new _String    (convertSyntaxToBool(optional), values)
export const $Number    = (optional?: RequiredPropMark, values?: Array<number>) => new _Number    (convertSyntaxToBool(optional), values)
export const $Int       = (optional?: RequiredPropMark, values?: Array<number>) => new _Int       (convertSyntaxToBool(optional), values)
export const $BigInt    = (optional?: RequiredPropMark, values?: Array<bigint>) => new _BigInt    (convertSyntaxToBool(optional), values)
export const $Boolean   = (optional?: RequiredPropMark)                         => new _Boolean   (convertSyntaxToBool(optional))
export const $Function  = (optional?: RequiredPropMark)                         => new _Function  (convertSyntaxToBool(optional))
export const $Undefined = ()                                                    => new _Undefined ()


const x = new $Schema({
    username: $String("!"),
    age: $Int("!"),
    other: {
        address: $String(),
        other_other: {
            test: $Boolean()
        }
    }
})

console.log(x)