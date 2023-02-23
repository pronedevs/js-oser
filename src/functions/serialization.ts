import {DESERIALIZATION, SERIALIZATION, SERIALIZATION_PROPERTY} from '../constants/constants';
import {UnserializableError} from '../errors/unserializable-error';
import {
    AnyConstructor,
    AnyObject,
    AnyProperty,
    SerializationConditionsContext,
    SerializationContext,
} from '../types/common';
import {SerializationMetadata} from '../types/metadata';
import {
    DeserializationOptions,
    ParsedDeserializationOptions,
    ParsedSerializationOptions,
    SerializationOptions,
} from '../types/options';
import {getNestedSerializationType, getRulesByPriority, getSerializationMetadata,} from './metadata';
import {transformPropertyValue} from './property';
import {determineNameByProperty, determinePropertyByName} from './public';
import {CircularReferenceError} from "../errors/circular-reference-error";

export function parseSerializationOptions(
    options?: SerializationOptions,
): ParsedSerializationOptions {
    return {
        allowCircularReferences:
            typeof options?.allowCircularReferences === 'boolean'
                ? options?.allowCircularReferences
                : false,
        ignoreUnknownProperties:
            typeof options?.ignoreUnknownProperties === 'boolean'
                ? options?.ignoreUnknownProperties
                : false,
        scopes: typeof options !== 'undefined' && Array.isArray(options?.scopes) ? options.scopes : [],
    };
}

export function parseDeserializationOptions(
    options?: DeserializationOptions,
): ParsedDeserializationOptions {
    return {
        allowCircularReferences:
            typeof options?.allowCircularReferences === 'boolean'
                ? options?.allowCircularReferences
                : false,
        scopes: typeof options !== 'undefined' && Array.isArray(options?.scopes) ? options.scopes : [],
    };
}

export function recursivelySerializeObject<T extends AnyObject>(
    data: AnyObject,
    target: AnyConstructor<T>,
    options?: SerializationOptions,
    processedObjects?: Map<AnyObject, AnyObject>,
): T {
    // Use default options if not provided
    const parsedOptions = parseSerializationOptions(options);
    const conditions: SerializationConditionsContext = {
        direction: SERIALIZATION,
        scopes: parsedOptions.scopes,
    };

    // Get serializable metadata and check that target is serializable
    const metadata: SerializationMetadata = getSerializationMetadata(target.prototype);
    if (metadata?.serialize !== true) {
        throw new UnserializableError();
    }

    // Define helper variables for serialization
    const instance: Record<string | symbol | number, any> = new target();
    const dataProperties: AnyProperty[] = Object.keys(data);
    const serializedObjects: Map<AnyObject, AnyObject> = processedObjects ?? new Map();
    const nestedDataProperties: Map<
        AnyProperty,
        {
            type: AnyConstructor;
            instanceProperty: AnyProperty;
        }
    > = new Map();

    // Serialize not-nested properties and prepare nested properties for delayed serialization
    for (const dataProperty of dataProperties) {
        // Get property
        const instanceProperty = determinePropertyByName(dataProperty, target, {
            ignoreUnknownProperties: parsedOptions.ignoreUnknownProperties,
            scopes: parsedOptions.scopes,
        });

        // Assign the property if serializable and defined
        if (typeof instanceProperty !== 'undefined') {
            const serializationContext: SerializationContext = {
                conditions,
                value: data[dataProperty],
                data,
                dataProperty: dataProperty,
                instance,
                instanceProperty: instanceProperty,
            };

            // Delay property serialization if nested serialization type is specified
            const nestedType = getNestedSerializationType(
                instanceProperty,
                metadata,
                serializationContext,
            );

            if (typeof nestedType !== 'undefined') {
                nestedDataProperties.set(dataProperty, {
                    type: nestedType,
                    instanceProperty: instanceProperty,
                });

                continue;
            }

            // Assign the property
            instance[instanceProperty] = transformPropertyValue(
                instanceProperty,
                metadata,
                serializationContext,
            );
        }
    }

    // Save current serialization state of instance into serialized objects cache to prevent infinite
    // circular reference loop during nested serialization
    serializedObjects.set(data, instance);

    // Serialize nested properties
    for (const pair of nestedDataProperties) {
        const dataProperty = pair[0];
        const details = pair[1];

        // If the value has not yet been serialized, serialize it
        const isAlreadySerialized = serializedObjects.has(data[dataProperty]);

        if (!isAlreadySerialized) {
            serializedObjects.set(
                data[dataProperty],
                recursivelySerializeObject(data[dataProperty], details.type, options, serializedObjects),
            );
        } else if (isAlreadySerialized && !parsedOptions.allowCircularReferences) {
            throw new CircularReferenceError();
        }

        // Create serialization context
        const serializationContext: SerializationContext = {
            conditions,
            value: serializedObjects.get(data[dataProperty]),
            data,
            dataProperty: dataProperty,
            instance,
            instanceProperty: details.instanceProperty,
        };

        // Assign the property
        instance[details.instanceProperty] = transformPropertyValue(
            details.instanceProperty,
            metadata,
            serializationContext,
        );
    }

    return instance;
}

export function recursivelyDeserializeObject<T extends AnyObject>(
    target: AnyObject,
    options?: DeserializationOptions,
    processedObjects?: Map<AnyObject, AnyObject>,
): T {
    // Use default options if not provided
    const parsedOptions = parseSerializationOptions(options);
    const conditions: SerializationConditionsContext = {
        direction: DESERIALIZATION,
        scopes: parsedOptions.scopes,
    };

    // Get serializable metadata and check that target is serializable
    const metadata: SerializationMetadata = getSerializationMetadata(Object.getPrototypeOf(target));
    if (metadata?.serialize !== true) {
        throw new UnserializableError();
    }

    // Define helper variables for deserialization
    const data: AnyObject = {};
    const instanceProperties = Object.keys(target);
    const deserializedObjects: Map<AnyObject, AnyObject> = processedObjects ?? new Map();
    const nestedInstanceProperties: Map<AnyProperty, AnyProperty> = new Map();

    // Deserialize not-nested properties and prepare nested properties for delayed deserialization
    for (const instanceProperty of instanceProperties) {
        // Get name
        const dataProperty = determineNameByProperty(instanceProperty, target, {
            ignoreUnknownProperties: true,
            scopes: parsedOptions.scopes,
        });

        // Assign the property if serializable and defined
        if (typeof dataProperty !== 'undefined') {
            const serializationContext: SerializationContext = {
                conditions,
                value: target[instanceProperty],
                data,
                dataProperty: dataProperty,
                instance: target,
                instanceProperty: instanceProperty,
            };

            // Delay property deserialization if nested serialization type is specified
            const firstRule = getRulesByPriority(
                instanceProperty,
                metadata,
                conditions,
                SERIALIZATION_PROPERTY,
            ).next();

            if (typeof firstRule?.value?.nested !== 'undefined') {
                nestedInstanceProperties.set(instanceProperty, dataProperty);

                continue;
            }

            // Assign the property
            data[dataProperty] = transformPropertyValue(instanceProperty, metadata, serializationContext);
        }
    }

    // Save current deserialization state of instance into deserialized objects cache to prevent
    // infinite circular reference loop during nested deserialization
    deserializedObjects.set(target, data);

    // Deserialize nested properties
    for (const pair of nestedInstanceProperties) {
        const instanceProperty = pair[0];
        const dataProperty = pair[1];

        // If the value has not yet been deserialized, deserialize it
        const isAlreadyDeserialized = deserializedObjects.has(target[instanceProperty]);

        if (!isAlreadyDeserialized) {
            deserializedObjects.set(
                target[instanceProperty],
                recursivelyDeserializeObject(target[instanceProperty], options, deserializedObjects),
            );
        } else if (isAlreadyDeserialized && !parsedOptions.allowCircularReferences) {
            throw new CircularReferenceError();
        }

        // Create serialization context
        const serializationContext: SerializationContext = {
            conditions,
            value: deserializedObjects.get(target[instanceProperty]),
            data,
            dataProperty: dataProperty,
            instance: target,
            instanceProperty: instanceProperty,
        };

        // Assign the property
        data[dataProperty] = transformPropertyValue(instanceProperty, metadata, serializationContext);
    }

    return data as T;
}
