import { SERIALIZATION_NAME, SERIALIZATION_PROPERTY } from '../constants/constants';
import { SERIALIZATION_METADATA } from '../constants/symbols';
import {
	AnyProperty,
	NestedSerializationType,
	SerializationConditionsContext,
	SerializationContext,
	SerializationScope,
} from '../types/common';
import {
	SerializationMetadata,
	SerializationRuleMetadata,
	SerializationScopeMetadata,
} from '../types/metadata';
import { isConstructor } from './utility';

export function getSerializationMetadata(prototype: any): SerializationMetadata {
	// Validate provided arguments
	if (typeof prototype !== 'object' || prototype === null) {
		throw new TypeError(`Invalid argument 'prototype', only object can be prototype.`);
	}

	// Get prototype metadata
	let ownMetadata: SerializationMetadata | undefined = Reflect.getOwnMetadata(
		SERIALIZATION_METADATA,
		prototype,
	);
	let metadata: SerializationMetadata | undefined = Reflect.getMetadata(
		SERIALIZATION_METADATA,
		prototype,
	);

	// If own metadata already exists, return it
	if (typeof ownMetadata !== 'undefined') {
		return ownMetadata;
	}

	// If own metadata does not exist, clone inherited metadata and return it
	ownMetadata = {
		serialize: false,
		scopes: new Map([
			[
				undefined,
				{
					rulesByName: new Map(),
					rulesByProperty: new Map(),
				},
			],
		]),
	};

	// If inherited metadata is defined, copy it into own metadata
	if (typeof metadata !== 'undefined') {
		// If inherited scopes exist, copy them, only rules can be left as references
		if (metadata?.scopes instanceof Map) {
			for (const entry of metadata.scopes.entries()) {
				ownMetadata.scopes.set(entry[0], {
					rulesByName: new Map(entry[1].rulesByName),
					rulesByProperty: new Map(entry[1].rulesByProperty),
				});
			}
		}
	}

	// Define and return own metadata
	Reflect.defineMetadata(SERIALIZATION_METADATA, ownMetadata, prototype);

	return ownMetadata;
}

export function* getRulesByPriority(
	name: AnyProperty,
	metadata: SerializationMetadata,
	conditions: SerializationConditionsContext,
	ruleSet: typeof SERIALIZATION_NAME | typeof SERIALIZATION_PROPERTY = SERIALIZATION_NAME,
): Generator<SerializationRuleMetadata> {
	// Prepare helper variables
	const allScopes: (SerializationScope | undefined)[] = [...conditions.scopes, undefined];

	// Iterate over scopes and retrieve rules
	for (const scope of allScopes) {
		const scopeMetadata: SerializationScopeMetadata | undefined = metadata.scopes.get(scope);
		const metadataRuleSet =
			ruleSet === SERIALIZATION_PROPERTY
				? scopeMetadata?.rulesByProperty
				: scopeMetadata?.rulesByName;

		if (typeof scopeMetadata !== 'undefined' && metadataRuleSet instanceof Map) {
			const ruleMetadata: SerializationRuleMetadata | undefined = metadataRuleSet.get(name);

			if (
				typeof ruleMetadata !== 'undefined' &&
				(typeof conditions.direction === 'undefined' ||
					typeof ruleMetadata.direction === 'undefined' ||
					conditions.direction === ruleMetadata.direction)
			) {
				yield ruleMetadata;
			}
		}
	}
}

export function getNestedSerializationType(
	property: AnyProperty,
	metadata: SerializationMetadata,
	context: SerializationContext,
): NestedSerializationType {
	// Get first applicable rule
	const firstRule = getRulesByPriority(
		property,
		metadata,
		context.conditions,
		SERIALIZATION_PROPERTY,
	).next();
	const nestedType =
		typeof firstRule.value?.nested === 'function' ? firstRule.value.nested(context) : undefined;

	// If provided function returns a constructor, return it
	return isConstructor(nestedType) ? nestedType : undefined;
}
