
export type VariableType = 
    "string"  | "number"   | "bigint"    | 
    "boolean" | "symbol"   | "undefined" | 
    "object"  | "function" | "array"     | 
    "null"    | "any"

/**
 * A more comprehensive implementation of `typeof x`.  
 * Unlike regular `typeof` it distinguishes `array` and `null` as separate types.  
 * 
 * This method also accepts a separate parameter that allows to quickly check
 * the type of a variable and compare it against a list of allowed types.
 * Eg:
 * ```js
 * typeOf('string') // => "string"
 * typeOf('string', ['string', 'number', 'null']) // => true
 * typeOf({}, ['string', 'number', 'null']) // => false
 * ```
 */
export function typeOf(value: any): VariableType
export function typeOf(value: any, types: VariableType[]): boolean 
export function typeOf(value: any, types?: VariableType[]): VariableType|boolean {
    if (typeof types !== 'undefined') {
        if (Array.isArray(types)) return types.includes(typeOf(value))
        throw TypeError(`typeOf(value, types[]) - "types" parameter was supplied but it's not an array. (type: ${typeof types})`)
    }
    if (Array.isArray(value)) return 'array'
    if (value === null) return 'null'
    return typeof value
}


/**
 * Similar to `typeOf()`, it converts an array of items into an array of their types.  
 * If a second `types[]` parameter is supplied then the returned value will be a boolean
 * based on if all of the value types match at least one in the `types[]` parameter.
 * Eg:
 * ```js
 * typesOf(['string', 12n]) // => ["string", "bigint"]
 * typesOf(['string', 12n], ['string', 'number', 'null']) // => true
 * typesOf([undefined], ['string', 'number', 'null']) // => false
 * ```
 * 
 * @param values 
 */
export function typesOf(values: any[]): VariableType[]
export function typesOf(values: any[], types: VariableType[]): boolean 
export function typesOf(values: any[], types?: VariableType[]): VariableType[]|boolean {
    if (typeof types !== 'undefined') {
        if (Array.isArray(types)) {
            const valueTypes = values.map(x => typeOf(x))
            for (let i = 0; i < valueTypes.length; i++) 
                if (!types.includes(valueTypes[i])) return false
            return true
        }
        throw TypeError(`typesOf(values[], types[]) - "types" parameter was supplied but it's not an array. (type: ${typeof types})`)
    }
    return values.map(x => typeOf(x))
}

/**
 * Returns true if all the provided items are truthy.
 * @param items any
 * @returns boolean 
 */
export function allTruthy(...items: any[]): boolean {
    for (let i = 0; i < items.length; i++) if (!items[i]) return false
    return true
}
