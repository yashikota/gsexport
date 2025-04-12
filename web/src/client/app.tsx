import { Suspense, use, useState } from "react";

const fetchData = async (url: string) => {
	const response = await fetch(
		`/api/slide-info?url=${encodeURIComponent(url)}`,
	);
	return response.json();
};

const Component = ({ promise }: { promise: Promise<any> }) => {
	const data = use(promise);
	return (
		<div className="mt-4 p-4 bg-gray-100 rounded-lg">
			<pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
		</div>
	);
};

const App = () => {
	const [url, setUrl] = useState("");
	const [promise, setPromise] = useState<Promise<any> | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (url) {
			setPromise(fetchData(url));
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-3xl font-bold mb-6">gsexport</h1>
			<form onSubmit={handleSubmit} className="mb-4">
				<div className="flex flex-col gap-4">
					<input
						type="text"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="Enter Google Slides URL"
						className="p-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
					>
						Fetch Data
					</button>
				</div>
			</form>

			{promise && (
				<Suspense fallback={<div className="text-center">Loading...</div>}>
					<Component promise={promise} />
				</Suspense>
			)}
		</div>
	);
};

export default App;
