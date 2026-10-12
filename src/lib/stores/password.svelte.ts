interface PasswordRequest {
	fileName: string;
	incorrect: boolean;
	resolve: (password: string | null) => void;
}

class PasswordPrompt {
	request = $state<PasswordRequest | null>(null);

	/** Shows the dialog; resolves with the password, or null when cancelled. */
	ask(fileName: string, incorrect: boolean): Promise<string | null> {
		this.request?.resolve(null);
		return new Promise((resolve) => {
			this.request = { fileName, incorrect, resolve };
		});
	}

	answer(password: string | null): void {
		const request = this.request;
		this.request = null;
		request?.resolve(password);
	}
}

export const passwordPrompt = new PasswordPrompt();
