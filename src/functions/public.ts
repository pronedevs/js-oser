import {AnyConstructor, AnyObject, AnyProperty} from '../types/common';
import {getNameByProperty, getPropertyByName} from './property';
import {recursivelyDeserializeObject, recursivelySerializeObject} from './serialization';
import {DeserializationOptions, PropertyMappingOptions, SerializationOptions} from "../types/options";
import {UnserializableError} from "../errors/unserializable-error";

export function determinePropertyByName(
    name: AnyProperty,
    target: AnyConstructor | AnyObject,
    options?: PropertyMappingOptions,
): AnyProperty | undefined {
    // Validate provided arguments
    if (typeof name !== 'string' && typeof name !== 'symbol') {
        throw new TypeError(`Invalid argument 'name', must be string or symbol.`);
    }
    if (typeof target !== 'function' && (typeof target !== 'object' || typeof target === null)) {
        throw new TypeError(`Invalid argument 'target', must be constructor or object.`);
    }

    if (
        typeof options?.ignoreUnknownProperties !== 'undefined' &&
        typeof options?.ignoreUnknownProperties !== 'boolean'
    ) {
        throw new TypeError(
            `Invalid argument 'options.ignoreUnknownProperties', must be undefined or boolean.`,
        );
    }
    if (
        typeof options?.scopes !== 'undefined' &&
        (!Array.isArray(options?.scopes) ||
            options?.scopes.some(scope => typeof scope !== 'string' && typeof scope !== 'symbol'))
    ) {
        throw new TypeError(
            `Invalid argument 'options.scopes', must be undefined or (string | symbol)[].`,
        );
    }

    return getPropertyByName(name, target, options);
}

export function determineNameByProperty(
    property: AnyProperty,
    target: AnyConstructor | AnyObject,
    options?: PropertyMappingOptions,
): AnyProperty | undefined {
    // Validate provided arguments
    if (typeof property !== 'string' && typeof property !== 'symbol') {
        throw new TypeError(`Invalid argument 'property', must be string or symbol.`);
    }
    if (typeof target !== 'function' && (typeof target !== 'object' || typeof target === null)) {
        throw new TypeError(`Invalid argument 'target', must be constructor or object.`);
    }

    if (
        typeof options?.ignoreUnknownProperties !== 'undefined' &&
        typeof options?.ignoreUnknownProperties !== 'boolean'
    ) {
        throw new TypeError(
            `Invalid argument 'options.ignoreUnknownProperties', must be undefined or boolean.`,
        );
    }
    if (
        typeof options?.scopes !== 'undefined' &&
        (!Array.isArray(options?.scopes) ||
            options?.scopes.some(scope => typeof scope !== 'string' && typeof scope !== 'symbol'))
    ) {
        throw new TypeError(
            `Invalid argument 'options.scopes', must be undefined or (string | symbol)[].`,
        );
    }

    return getNameByProperty(property, target, options);
}

export function serializeObject<T extends Record<string | symbol | number, any>>(
    data: Record<string | symbol | number, any>,
    target: AnyConstructor<T>,
    options?: SerializationOptions,
): T {
    // Validate provided arguments
    if (typeof data !== 'object' || data === null) {
        throw new UnserializableError(`Invalid argument 'data', must be object.`);
    }
    if (typeof target !== 'function') {
        throw new TypeError(`Invalid argument 'target', must be a constructable function.`);
    }

    if (
        typeof options?.ignoreUnknownProperties !== 'undefined' &&
        typeof options?.ignoreUnknownProperties !== 'boolean'
    ) {
        throw new TypeError(
            `Invalid argument 'options.ignoreUnknownProperties', must be undefined or boolean.`,
        );
    }
    if (
        typeof options?.scopes !== 'undefined' &&
        (!Array.isArray(options?.scopes) ||
            options?.scopes.some(scope => typeof scope !== 'string' && typeof scope !== 'symbol'))
    ) {
        throw new TypeError(
            `Invalid argument 'options.scope', must be undefined or (string | symbol)[].`,
        );
    }

    return recursivelySerializeObject(data, target, options);
}

export function deserializeObject<T extends Record<string | symbol | number, any>>(
    target: T,
    options?: DeserializationOptions,
): Record<string | symbol | number, any> {
    // Validate provided arguments
    if (typeof target !== 'object' || target === null) {
        throw new UnserializableError(`Invalid argument 'target', must be object.`);
    }

    if (
        typeof options?.scopes !== 'undefined' &&
        (!Array.isArray(options?.scopes) ||
            options?.scopes.some(scope => typeof scope !== 'string' && typeof scope !== 'symbol'))
    ) {
        throw new TypeError(
            `Invalid argument 'options.scope', must be undefined or (string | symbol)[].`,
        );
    }

    return recursivelyDeserializeObject(target, options);
}
