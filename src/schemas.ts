
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
     * Specifies whether the property is required or optional, meaning it can be
     * undefined or not exist on the object in the first place.
     */
    required: boolean

    /**
     * A base callback function used to validate a property against the schema.
     */
    validateBasics: (value: any) => boolean

}

type ObjectOf<Item = any> = {
    [key: string|number]: Item
}
type SelfOrArrayOf<Item = any> = Item | Array<Item>

type RequiredPropMark = "?" | "!" | boolean | undefined

// HELPERS ==========================================================


const compareTypes = (required: boolean, propType: VariableType, varType: VariableType) =>
    propType === varType || (!required && varType === 'undefined')

const compareAllowedValues = (allowedValues: any[], value: any) =>
    allowedValues.length === 0 || allowedValues.includes(value)

const convertSyntaxToBool = (value: RequiredPropMark) => {
    if (typeOf(value, ['boolean', 'undefined'])) return !!value
    return ({ "?": false, "!": true })[value as ("?"|"!")] || false
}

const arrayWrap = <Item = any>(item: Item): Item[] => Array.isArray(item) ? item : [item]


// PROPS ============================================================


export class $Prop<Type extends (VariableType | "any"), ValueType = any> implements SchemaPropInterface<Type, ValueType> {

    public type: Type
    public required: boolean
    public allowedValues: ValueType[];

    constructor(type: Type, required: boolean, allowedValues: Array<ValueType>) {
        this.type = type
        this.required = required
        this.allowedValues = allowedValues
    }

    public validateBasics(value: any) {
        // Check of the types match and alternatively allow for "undefined" if prop is required
        if (!compareTypes(this.required, this.type, typeOf(value))) return false
        // Compare the value to a set of allowed ones if they were specified
        if (!compareAllowedValues(this.allowedValues, value)) return false

        return true
    }

}


// ==================================================================


export class _String extends $Prop<"string", string> {

    private expression?: RegExp

    constructor(required?: boolean, allowedValues?: Array<string> | RegExp) {
        super("string", !!required, allowedValues instanceof RegExp ? [] : (allowedValues || []))
        this.expression = allowedValues instanceof RegExp ? allowedValues : undefined
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        if (this.expression && !this.expression.test(value)) return false
        return true
    }

}

export class _Number extends $Prop<"number", number> {

    constructor(required?: boolean, allowedValues?: Array<number>) {
        super("number", !!required, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Int extends $Prop<"number", number> {

    constructor(required?: boolean, allowedValues?: Array<number>) {
        super("number", !!required, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        if (this.required && !Number.isInteger(value)) return false
        return true
    }

}

export class _BigInt extends $Prop<"bigint", bigint> {

    constructor(required?: boolean, allowedValues?: Array<bigint>) {
        super("bigint", !!required, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Boolean extends $Prop<"boolean", boolean> {

    constructor(required?: boolean) {
        super("boolean", !!required, [])
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


export class _Object extends $Prop<"object", SelfOrArrayOf<SchemaObject>> {

    private internalSchemas: $Schema[] = []

    constructor(required?: boolean, content?: SelfOrArrayOf<SchemaObject>) {
        super("object", !!required, [])

        if (content !== undefined) {

            content = Array.isArray(content) ? content : [content]
            const schemas = content[0] ? content : []
            
            for (const key in schemas) {
                if (Object.prototype.hasOwnProperty.call(schemas, key)) {
                    const schemaObject = schemas[key]
                    this.internalSchemas.push(new $Schema(schemaObject))
                }
            }

        }

    }
    public validate(value: any) {
        // Compare the type of the property against the schema prop type
        if (!compareTypes(this.required, this.type, typeOf(value))) return false
        // Compare the input value against all allowed schemas
        const tests = this.internalSchemas.map(x => x.validate(value))
        if (tests.length > 0 && tests.includes(true) === false) return false

        return true
    }

}

// TODO: Add functionality allowing to check types of variables inside of the array (including other object/array schemas)
export class _Array extends $Prop<"array", Array<any>> {

    constructor(required?: boolean, allowedValueTypes?: Array<VariableType>) {
        super("array", !!required, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class _Function extends $Prop<"function", Array<Function>> {

    constructor(required?: boolean) {
        super("function", !!required, [])
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

export const $String    = (required: RequiredPropMark = "!", values?: Array<string> | RegExp)       => new _String    (convertSyntaxToBool(required), values)
export const $Number    = (required: RequiredPropMark = "!", values?: Array<number>)                => new _Number    (convertSyntaxToBool(required), values)
export const $Int       = (required: RequiredPropMark = "!", values?: Array<number>)                => new _Int       (convertSyntaxToBool(required), values)
export const $BigInt    = (required: RequiredPropMark = "!", values?: Array<bigint>)                => new _BigInt    (convertSyntaxToBool(required), values)
export const $Boolean   = (required: RequiredPropMark = "!")                                        => new _Boolean   (convertSyntaxToBool(required))
export const $Function  = (required: RequiredPropMark = "!")                                        => new _Function  (convertSyntaxToBool(required))
export const $Undefined = ()                                                                        => new _Undefined ()

export const $Object    = (required: RequiredPropMark = "!", values?: SelfOrArrayOf<SchemaObject>)  => new _Object    (convertSyntaxToBool(required), values)

