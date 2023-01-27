
import { typeOf, VariableType } from "./types";


// TYPES ============================================================


interface SchemaProp<Type extends VariableType, ValueType = any> {

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


// HELPERS ==========================================================


const compareTypes = (optional: boolean, propType: VariableType, varType: VariableType) =>
    propType === varType || (optional && varType === 'undefined')

const compareAllowedValues = (allowedValues: any[], value: any) =>
    allowedValues.length === 0 || allowedValues.includes(value)


// PROPS ============================================================


export class $Prop<Type extends (VariableType | "any"), ValueType = any> implements SchemaProp<Type, ValueType> {

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


export class $String extends $Prop<"string", string> {

    constructor(optional?: boolean, allowedValues?: Array<string>) {
        super("string", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class $Number extends $Prop<"number", number> {

    constructor(optional?: boolean, allowedValues?: Array<number>) {
        super("number", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class $Int extends $Prop<"number", number> {

    constructor(optional?: boolean, allowedValues?: Array<number>) {
        super("number", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        if (!this.optional && !Number.isInteger(value)) return false
        return true
    }

}

export class $BigInt extends $Prop<"bigint", bigint> {

    constructor(optional?: boolean, allowedValues?: Array<bigint>) {
        super("bigint", !!optional, allowedValues || [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class $Boolean extends $Prop<"boolean", boolean> {

    constructor(optional?: boolean) {
        super("boolean", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class $Undefined extends $Prop<"undefined", undefined> {

    constructor() {
        super("undefined", false, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class $Object extends $Prop<"object", object> {

    constructor(optional?: boolean) {
        super("object", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

// TODO: Add functionality allowing to check types of variables inside of the array (including other object/array schemas)
export class $Array extends $Prop<"array", Array<any>> {

    constructor(optional?: boolean, allowedValueTypes?: Array<VariableType>) {
        super("array", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}

export class $Function extends $Prop<"function", Array<Function>> {

    constructor(optional?: boolean) {
        super("function", !!optional, [])
    }
    public validate(value: any) {
        if (!this.validateBasics(value)) return false
        return true
    }

}


// SCHEMA VALIDATION ================================================


export class $Schema {

    constructor(public schema: ObjectOf<$Prop<any> & { validate: (value: any) => boolean }>) {
        if (!typeOf(schema, ['array', 'object'])) throw new TypeError('Provided schema is not object-like.')
    }

    public validate(object: any): Boolean {
        try {

            if (!typeOf(object, ['array', 'object'])) return false
    
            for (const key in this.schema) {
                if (Object.prototype.hasOwnProperty.call(this.schema, key)) {
    
                    const schemaProp = this.schema[key]
                    const checkedProp = object[key]
    
                    const schemaType = schemaProp.type
                    const checkedType = typeOf(checkedProp)
    
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
