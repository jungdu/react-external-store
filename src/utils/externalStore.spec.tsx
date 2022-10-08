import { act, render, screen } from "@testing-library/react";
import { createStore, SetStateParam, useStore } from "./externalStore";

function createTestStore<T>(initial: T) {
	const store = createStore(initial);
	const origSetState = store.setState;
	store.setState = (param: SetStateParam<T>) =>
		act(() => {
			origSetState(param);
		});
	return store;
}

test("Render initial value in store", () => {
	const store = createTestStore({ text: "initial" });
	const Text: React.FC = () => {
		const { text } = useStore(store);
		return <div>{text}</div>;
	};
	render(<Text />);
	expect(screen.getByText("initial")).toBeInTheDocument();
});

test("Render changed value", async () => {
	const store = createTestStore({ text: "initial" });
	const Text: React.FC = () => {
		const { text } = useStore(store);
		return <div>{text}</div>;
	};
	render(<Text />);
	store.setState({ text: "changed" });
	await screen.findByText("changed");
});

test("Render selected value", () => {
	const store = createTestStore({ text: "initial" });
	const Text: React.FC = () => {
		const text = useStore(store, (state) => state.text);
		return <div>{text}</div>;
	};
	render(<Text />);
	expect(screen.getByText("initial")).toBeInTheDocument();
});

test("Render selected value after change", async () => {
	const store = createTestStore({ count: 0 });
	const Count: React.FC = () => {
		const text = useStore(store, (state) => state.count);
		return <div>{text}</div>;
	};
	render(<Count />);

	store.setState((prev) => ({ count: prev.count + 1 }));
	await screen.findByText("1");
	store.setState((prev) => ({ count: prev.count + 1 }));
	await screen.findByText("2");
	store.setState((prev) => ({ count: prev.count + 1 }));
	await screen.findByText("3");
});

test("External Store fire rerender only when selected value is changed", async () => {
	const store = createTestStore({ text: "initial", count: 0 });
	const mockFn = jest.fn();
	const Text: React.FC = () => {
		const text = useStore(store, (state) => state.text);
		mockFn();
		return <div>{text}</div>;
	};
	render(<Text />);
	store.setState((prev) => ({ ...prev, count: prev.count + 1 }));
	store.setState((prev) => ({ ...prev, count: prev.count + 1 }));
	store.setState((prev) => ({ ...prev, count: prev.count + 1 }));
	store.setState((prev) => ({ ...prev, count: prev.count + 1 }));
	store.setState((prev) => ({ ...prev, count: prev.count + 1 }));
	store.setState((prev) => ({ ...prev, text: "changed" }));

	await screen.findByText("changed");
	expect(store.getState().count).toBe(5);
	expect(mockFn).toHaveBeenCalledTimes(2);
});
