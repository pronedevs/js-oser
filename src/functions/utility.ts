import { AnyConstructor } from '../types/common';

export function isConstructor<T extends object = any>(obj: any): obj is AnyConstructor<T> {
	try {
		const proxy: any = new Proxy<T>(obj, {
			construct() {
				return {};
			},
		});

		new proxy();
	} catch (exc) {
		// TODO: Revoked proxies are not checked
		return false;
	}

	return true;
}
