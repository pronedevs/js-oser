import { DESERIALIZATION, SERIALIZATION } from '../constants/constants';

export type AnyProperty = string | symbol;

export type AnyFunction<T = any> = (...args: any[]) => T;

export type AnyObject<T extends Record<AnyProperty, any> = Record<AnyProperty, any>> = T;

export type AnyConstructor<T extends AnyObject = AnyObject> = new (...args: any[]) => T;

export type SerializationScope = string | symbol;

export type SerializationDirection = typeof SERIALIZATION | typeof DESERIALIZATION;

export type NestedSerializationType = AnyConstructor | undefined;

export interface SerializationContext {
	conditions: SerializationConditionsContext;
	data: AnyObject;
	dataProperty: AnyProperty;
	instance: AnyObject;
	instanceProperty: AnyProperty;
	value: any;
}

export interface SerializationConditionsContext {
	direction?: SerializationDirection;
	scopes: SerializationScope[];
}

export type NestedSerializationTypeFunction = (
	context: SerializationContext,
) => NestedSerializationType;

export type SerializationTransformFunction = (context: SerializationContext) => any;
