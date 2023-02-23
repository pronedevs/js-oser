import { SerializationError } from './serialization-error';

export class CircularReferenceError extends SerializationError {
	constructor(message?: string) {
		super(message ?? 'Circular reference detected during de/serialization.');
	}
}
