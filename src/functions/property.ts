import {DESERIALIZATION, SERIALIZATION, SERIALIZATION_NAME, SERIALIZATION_PROPERTY} from '../constants/constants';
import {
    AnyConstructor,
    AnyObject,
    AnyProperty,
    SerializationConditionsContext,
    SerializationContext,
} from '../types/common';
import {SerializationMetadata} from '../types/metadata';
import {ParsedPropertyMappingOptions, PropertyMappingOptions} from '../types/options';
import {getRulesByPriority, getSerializationMetadata} from './metadata';
import {UnknownPropertyError} from "../errors/unknown-property-error";
import {UnserializableError} from "../errors/unserializable-error";

export function parsePropertyMappingOptions(
    options?: PropertyMappingOptions,
): ParsedPropertyMappingOptions {
    return {
        ignoreUnknownProperties:
            typeof options?.ignoreUnknownProperties === 'boolean'
                ? options?.ignoreUnknownProperties
                : false,
        scopes:
            typeof options?.scopes !== 'undefined' && Array.isArray(options?.scopes)
                ? options.scopes
                : [],
    };
}

export function getPropertyByName(
    name: AnyProperty,
    target: AnyConstructor | AnyObject,
    options?: PropertyMappingOptions,
): AnyProperty | undefined {
    // Use default options if not provided
    const parsedOptions = parsePropertyMappingOptions(options);
    const conditions: SerializationConditionsContext = {
        direction: SERIALIZATION,
        scopes: parsedOptions.scopes,
    };

    // Get serializable metadata and check if target is serializable
    const metadataTarget =
        typeof target === 'function' ? target.prototype : Object.getPrototypeOf(target);
    const metadata = getSerializationMetadata(metadataTarget);
    if (metadata?.serialize !== true) {
        throw new UnserializableError();
    }

    // Get first applicable rule by priority
    const firstRule = getRulesByPriority(name, metadata, conditions, SERIALIZATION_NAME).next();

    // If no applicable rule found and unknown properties should not be ignored, throw an error
    if (typeof firstRule.value === 'undefined' && !parsedOptions.ignoreUnknownProperties) {
        throw new UnknownPropertyError(name);
    }

    // If property is serializable, return it
    return firstRule.value?.serialize === true ? firstRule.value?.property : undefined;
}

export function getNameByProperty(
    property: AnyProperty,
    target: AnyConstructor | AnyObject,
    options?: PropertyMappingOptions,
): AnyProperty | undefined {
    // Use default options if not provided
    const parsedOptions = parsePropertyMappingOptions(options);
    const conditions: SerializationConditionsContext = {
        direction: DESERIALIZATION,
        scopes: parsedOptions.scopes,
    };

    // Get serializable metadata and check if target is serializable
    const metadataTarget =
        typeof target === 'function' ? target.prototype : Object.getPrototypeOf(target);
    const metadata = getSerializationMetadata(metadataTarget);
    if (metadata?.serialize !== true) {
        throw new UnserializableError();
    }

    // Get applied rules by priority
    const firstRule = getRulesByPriority(
        property,
        metadata,
        conditions,
        SERIALIZATION_PROPERTY,
    ).next();

    // If no applicable rule found and unknown properties should not be ignored, throw an error
    if (typeof firstRule.value === 'undefined' && !parsedOptions.ignoreUnknownProperties) {
        throw new UnknownPropertyError(property);
    }

    // If property is serializable, return its name
    return firstRule.value?.serialize === true
        ? typeof firstRule.value?.alias === 'string' || typeof firstRule.value?.alias === 'symbol'
            ? firstRule.value?.alias
            : firstRule.value?.property
        : undefined;
}

export function transformPropertyValue(
    property: AnyProperty,
    metadata: SerializationMetadata,
    context: SerializationContext,
): any {
    const firstRule = getRulesByPriority(
        property,
        metadata,
        context.conditions,
        SERIALIZATION_PROPERTY,
    ).next();

    if (firstRule?.value?.serialize === true && typeof firstRule?.value?.transform === 'function') {
        return firstRule.value.transform(context);
    }

    return context.value;
}
