import { getSerializationMetadata } from '../functions/metadata';
import { SerializableOptions } from '../types/options';

export function Serializable(options?: SerializableOptions): ClassDecorator {
	return function (target: Function): void {
		// Get serializable metadata
		const metadata = getSerializationMetadata(target.prototype);

		// Make object serializable
		metadata.serialize = true;
	};
}
