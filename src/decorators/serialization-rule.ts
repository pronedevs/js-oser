import { DESERIALIZATION, SERIALIZATION } from '../constants/constants';
import { getSerializationMetadata } from '../functions/metadata';
import { SerializationMetadata, SerializationRuleMetadata } from '../types/metadata';
import { SerializationRuleOptions } from '../types/options';

export function SerializationRule(options?: SerializationRuleOptions): PropertyDecorator {
	// Validate provided arguments
	if (typeof options?.serialize !== 'undefined' && typeof options?.serialize !== 'boolean') {
		throw new TypeError(`Invalid argument 'options.serialize', must be undefined or boolean.`);
	}
	if (
		typeof options?.alias !== 'undefined' &&
		typeof options?.alias !== 'string' &&
		typeof options?.alias !== 'symbol'
	) {
		throw new TypeError(`Invalid argument 'options.alias', must be string, symbol or number.`);
	}
	if (
		typeof options?.scopes !== 'undefined' &&
		(!Array.isArray(options?.scopes) ||
			options?.scopes?.some(scope => typeof scope !== 'string' && typeof scope !== 'symbol'))
	) {
		throw new TypeError(
			`Invalid argument 'options.scopes', must be undefined or (string | symbol)[].`,
		);
	}
	if (
		typeof options?.nested !== 'undefined' &&
		(typeof options?.nested !== 'object' || options?.nested === null) &&
		typeof options?.nested !== 'function'
	) {
		throw new TypeError(
			`Invalid argument 'options.nested', must be undefined, NestedSerializationType object or NestedSerializationTypeFunction function.`,
		);
	}
	if (typeof options?.transform !== 'undefined' && typeof options?.transform !== 'function') {
		throw new TypeError(`Invalid argument 'options.transform', must be undefined or function.`);
	}
	if (
		typeof options?.direction !== 'undefined' &&
		options?.direction !== 'SERIALIZATION' &&
		options?.direction !== 'DESERIALIZATION'
	) {
		throw new TypeError(
			`Invalid argument 'options.direction', must be undefined, '${SERIALIZATION}' or '${DESERIALIZATION}'.`,
		);
	}

	// Standardize options values
	const serialize = options?.serialize !== false;
	const scopes: (string | symbol | undefined)[] = options?.scopes ?? [undefined];
	const alias = options?.alias;
	const nested = options?.nested;
	const transform = options?.transform;
	const direction = options?.direction;

	return function (target: any, property: string | symbol): void {
		if (typeof target === 'function') {
			throw new TypeError(
				'Invalid use of @SerializationRule, static members are not serializable.',
			);
		}

		// Get serializable metadata
		const metadata: SerializationMetadata = getSerializationMetadata(
			typeof target === 'function' ? target.prototype : target,
		);

		// Apply rules for each scope
		for (const scope of scopes) {
			// If scope does not exist, create it
			let scopedMetadata = metadata.scopes.get(scope);
			if (typeof scopedMetadata === 'undefined') {
				scopedMetadata = {
					rulesByName: new Map(),
					rulesByProperty: new Map(),
				};

				metadata.scopes.set(scope, scopedMetadata);
			}

			// Construct rule
			const rule: SerializationRuleMetadata = {
				serialize,
				alias,
				property,
				nested,
				transform,
				direction,
			};

			// Set rules under alias and property
			scopedMetadata.rulesByName.set(alias ?? property, rule);
			scopedMetadata.rulesByProperty.set(property, rule);
		}
	};
}
