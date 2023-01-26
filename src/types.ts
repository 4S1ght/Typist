

export type VariableType = 
    "string"  | "number"   | "bigint"    | 
    "boolean" | "symbol"   | "undefined" | 
    "object"  | "function" | "array"     | 
    "null"      


/**
 * A more comprehensive implementation of `typeof x`.  
 * Unlike regular `typeof` it distinguishes `array` and `null` as separate types.  
 * 
 * This method also accepts a separate parameter that allows to quickly check
 * the type of a variable and compare it against a list of allowed types.
 * Eg:
 * ```js
 * typeOf('strng') // => "string"
 * typeOf('string', ['string', 'number', 'null']) // => true
 * typeOf({}, ['string', 'number', 'null']) // => false
 * ```
 */
export function typeOf(value: any): VariableType
export function typeOf(value: any, types: VariableType[]): boolean 
export function typeOf(value: any, types?: VariableType[]): VariableType|boolean {
    if (typeof types !== undefined) {
        if (Array.isArray(types)) return types.includes(typeOf(value))
        throw TypeError(`typeOf(value, types) - "types" parameter was supplied but it's not an array. (type: ${typeof types})`)
    }
    if (Array.isArray(value)) return 'array'
    if (value === null) return 'null'
    return typeof value
}

