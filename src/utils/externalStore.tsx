import { useEffect, useState } from "react";

export type Store = ReturnType<typeof createStore>;
type Selector<T, U> = (state: T) => U;

type SetStateFn<T> = (state: T) => T;
export type SetStateParam<T> = T | SetStateFn<T>;

function isSetStateFn<T>(value: T | SetStateFn<T>): value is SetStateFn<T> {
	return typeof value === "function";
}

export function createStore<T>(initialState: T) {
	let state = initialState;
	const getState = () => state;
	const listeners = new Set<() => void>();
	const setState = (newState: SetStateParam<T>) => {
		if (isSetStateFn(newState)) {
			state = newState(state);
		} else {
			state = newState;
		}
		listeners.forEach((listener) => listener());
	};
	const subscribe = (listener: () => void) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	};
	return { getState, setState, subscribe };
}

const defaultSelector: Selector<any, any> = (state) => state;

export function useStore<T, U = T>(
	store: ReturnType<typeof createStore<T>>,
	selector: Selector<T, U> = defaultSelector
) {
	const [state, setState] = useState<U>(selector(store.getState()));

	useEffect(() => {
		const callback = () => setState(selector(store.getState()));
		const unsubscribe = store.subscribe(callback);
		return () => {
			unsubscribe();
		};
	}, [store, selector]);
	return state;
}
