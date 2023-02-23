import { SerializationError } from './serialization-error';

export class UnserializableError extends SerializationError {
	constructor(message?: string) {
		super(message ?? 'Target is not marked as serializable. Use @Serializable() class decorator.');
	}
}
