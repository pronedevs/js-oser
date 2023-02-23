import { DESERIALIZATION, SERIALIZATION } from '../constants/constants';
import {
	AnyProperty,
	NestedSerializationTypeFunction,
	SerializationScope,
	SerializationTransformFunction,
} from './common';

export interface SerializableOptions {}

export interface SerializationRuleOptions {
	alias?: AnyProperty;
	direction?: typeof SERIALIZATION | typeof DESERIALIZATION;
	nested?: NestedSerializationTypeFunction;
	scopes?: SerializationScope[];
	serialize?: boolean;
	transform?: SerializationTransformFunction;
}

export interface SerializationOptions {
	allowCircularReferences?: boolean;
	ignoreUnknownProperties?: boolean;
	scopes?: SerializationScope[];
}

export interface ParsedSerializationOptions {
	allowCircularReferences: boolean;
	ignoreUnknownProperties: boolean;
	scopes: SerializationScope[];
}

export interface DeserializationOptions {
	allowCircularReferences?: boolean;
	scopes?: SerializationScope[];
}

export interface ParsedDeserializationOptions {
	allowCircularReferences: boolean;
	scopes: SerializationScope[];
}

export interface PropertyMappingOptions {
	ignoreUnknownProperties?: boolean;
	scopes?: SerializationScope[];
}

export interface ParsedPropertyMappingOptions {
	ignoreUnknownProperties: boolean;
	scopes: SerializationScope[];
}
