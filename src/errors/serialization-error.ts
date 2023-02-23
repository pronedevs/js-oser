export class SerializationError extends Error {
	constructor(message?: string) {
		super(message ?? 'An error occurred during de/serialization.');
	}
}
