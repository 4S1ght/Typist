
import type { VariableType } from "./types"

// TYPES ============================================================

interface SchemaProp<Type extends (VariableType | "any")> {
    /** 
     * Type of the property. 
     */
    type: Type
    /** 
     * A list of allowed values that this value can represent.
     * If contains items and the provided value does not appear here
     * the schema check will fail.
     */
    allowedValues: Array<Type>
    /**
     * Specifies whether the property is optional, meaning it can be
     * undefined or not exist on the object in the first place.
     */
    optional: boolean
    /**
     * Identifies that the object is a group of schemas.
     * Always undefined on regular schema properties.
     */
    isSchemaGroup: undefined
}

interface SchemaGroup {
    /**
     * Identifies that the object is a group of schemas
     */
    isSchemaGroup: true,
    /**
     * The list of schemas to validate against.
     * The group is considered valid if any of the child schemas
     * match the provided value.
     */
    schemas: Array<SchemaProp<"any">>
}

// ==================================================================