import {
    AnyProperty,
    NestedSerializationTypeFunction,
    SerializationScope,
    SerializationTransformFunction
} from './common';
import {DESERIALIZATION, SERIALIZATION} from "../constants/constants";

export interface SerializationMetadata {
    serialize: boolean;
    scopes: Map<SerializationScope | undefined, SerializationScopeMetadata>;
}

export interface SerializationScopeMetadata {
    rulesByName: Map<AnyProperty, SerializationRuleMetadata>;
    rulesByProperty: Map<AnyProperty, SerializationRuleMetadata>;
}

export interface SerializationRuleMetadata {
    alias?: AnyProperty;
    direction?: typeof SERIALIZATION | typeof DESERIALIZATION;
    nested?: NestedSerializationTypeFunction;
    property: AnyProperty;
    serialize: boolean;
    transform?: SerializationTransformFunction;
}
