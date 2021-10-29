const html = commonTags.html;
const safeHtml = commonTags.safeHtml;

export function LockStatusComponent(locked, cursor) {
	return html`
		<i
			class="fas fa-lock${locked ? '' : '-open'} text-${locked
				? 'yellow'
				: 'green'}-500${cursor ? ' cursor-pointer' : ''}"
			id="lockStatus"
		></i>
	`;
}

export function PlayerComponent(name, owner, id, self, selfOwner, points) {
	return html`
		<div
			class="bg-white w-full h-10 rounded flex justify-between items-center px-2 mb-1"
		>
			<div class="flex gap-2 items-center flex text-black">
				<label class="${self ? `font-bold` : ''}">${name}</label>
				<label class="font-semibold text-blue-800"
					>(${points} points)</label
				>
			</div>
			<div class="flex gap-4 text-lg">
				${owner ? `<i class="fas fa-crown text-yellow-400"></i>` : ''}
				${selfOwner && !self
					? `<i class="fas fa-ban text-red-400 cursor-pointer kickUser" sid="${id}"></i>`
					: ''}
			</div>
		</div>
	`;
}

export function SystemMessageComponent(message) {
	return html`
		<p
			class="w-full flex justify-center items-center mt-2 text-gray-400 text-center"
		>
			${message}
		</p>
	`;
}

export function MessageComponent(sender, content) {
	return html`
		<div
			class="w-full bg-gray-100 text-black p-2 mt-3 rounded-lg border border-gray-400"
		>
			<label class="text-sm font-light">${sender}:</label>
			<p>${safeHtml`${content}`}</p>
		</div>
	`;
}

export function SwalSettingsComponent(ppw, ppf, reuse, required) {
	const _html = html`
		<div class="w-full h-full flex flex-col gap-4">
			<div class="flex justify-between items-center">
				<label class="text-indigo-400 font-bold"
					>Points per word:</label
				>
				<input
					class="appearance-none w-24 bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
					type="number"
					min="1"
					max="100"
					id="settings-ppw"
					value="${ppw}"
				/>
			</div>
			<div class="flex justify-between items-center">
				<label class="text-indigo-400 font-bold"
					>Points per finish:</label
				>
				<input
					class="appearance-none w-24 bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
					type="number"
					min="10"
					max="1000"
					id="settings-ppf"
					value="${ppf}"
				/>
			</div>
			<div class="flex justify-between items-center">
				<label class="text-indigo-400 font-bold"
					>Minimum words required to finish:</label
				>
				<input
					class="appearance-none w-24 bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
					type="number"
					min="1"
					max="1000"
					id="settings-required"
					value="${required}"
				/>
			</div>
			<div class="flex justify-between items-center h-12">
				<label class="text-indigo-400 font-bold"
					>Allow to reuse words before the game finished:</label
				>
				<input
					class="mr-2 leading-tight text-lg"
					type="checkbox"
					id="settings-reuse"
					${reuse ? 'checked' : ''}
				/>
			</div>
		</div>
	`;

	return {
		title: 'Settings',
		html: _html,
		confirmButtonText: 'Save',
		focusConfirm: false,
		preConfirm: () => {
			const val = id =>
				Number(Swal.getPopup().querySelector(`#settings-${id}`).value);

			const ppw = val('ppw');
			const ppf = val('ppf');
			const requiredWords = val('required');
			const reuse =
				Swal.getPopup().querySelector('#settings-reuse').checked;

			return { ppw, ppf, requiredWords, reuse };
		}
	};
}
