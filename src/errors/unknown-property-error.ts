import { SerializationError } from './serialization-error';

export class UnknownPropertyError extends SerializationError {
	constructor(property: string | symbol | number, message?: string) {
		super(
			message ??
				`Property '${property.toString()}' does not have associated serialization rule. Use @SerializationRule() property decorator.`,
		);
	}
}
