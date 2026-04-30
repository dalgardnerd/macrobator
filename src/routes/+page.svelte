<script lang="ts">
	import {
		DEFAULT_INGREDIENTS,
		STORAGE_KEY,
		type CommonIngredient
	} from '$lib/ingredients';

	type Ingredient = {
		name: string;
		weight: number;
		caloriesPer100g: number | null;
	};

	let phase: 'idle' | 'weighing' = $state('idle');
	let ingredients: Ingredient[] = $state([]);

	// Persistent data source — common ingredients
	let commonIngredients: CommonIngredient[] = $state([...DEFAULT_INGREDIENTS]);
	let hydrated = $state(false);

	$effect(() => {
		if (!hydrated) {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					const parsed = JSON.parse(stored) as CommonIngredient[];
					if (Array.isArray(parsed)) commonIngredients = parsed;
				} catch {
					// fall back to defaults
				}
			}
			hydrated = true;
			return;
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(commonIngredients));
	});

	// Add-ingredient input state
	let selectedKey = $state(''); // index into commonIngredients, or '__custom__', or ''
	let customName = $state('');
	let customCalories = $state('');
	let inputWeight = $state('');

	const isCustom = $derived(selectedKey === '__custom__');

	const totalCalories = $derived(
		ingredients.reduce((sum, ing) => {
			if (ing.caloriesPer100g == null) return sum;
			return sum + (ing.weight * ing.caloriesPer100g) / 100;
		}, 0)
	);

	const hasUnknownCalories = $derived(
		ingredients.some((ing) => ing.caloriesPer100g == null)
	);

	// Manage-ingredients modal state
	let manageDialog: HTMLDialogElement | null = $state(null);
	let newSourceName = $state('');
	let newSourceCalories = $state('');

	function openManager() {
		manageDialog?.showModal();
	}

	function addToSource() {
		const name = newSourceName.trim();
		const cal = parseFloat(newSourceCalories);
		if (!name || isNaN(cal) || cal < 0) return;
		commonIngredients.push({ name, caloriesPer100g: cal });
		newSourceName = '';
		newSourceCalories = '';
	}

	function removeFromSource(i: number) {
		commonIngredients.splice(i, 1);
	}

	function resetSource() {
		commonIngredients = [...DEFAULT_INGREDIENTS];
	}

	function handleSourceAddKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') addToSource();
	}

	// Export / Import
	let fileInput: HTMLInputElement | null = $state(null);
	let importMessage = $state('');
	let importMessageKind: 'error' | 'success' = $state('error');

	function exportIngredients() {
		const data = JSON.stringify(commonIngredients, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		const date = new Date().toISOString().slice(0, 10);
		a.download = `macrobator-ingredients-${date}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function triggerImport() {
		importMessage = '';
		fileInput?.click();
	}

	async function handleImport(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const parsed = JSON.parse(text);
			if (!Array.isArray(parsed)) throw new Error('File must contain a JSON array');

			const cleaned: CommonIngredient[] = parsed.map((item, i) => {
				if (
					item == null ||
					typeof item.name !== 'string' ||
					typeof item.caloriesPer100g !== 'number' ||
					!isFinite(item.caloriesPer100g)
				) {
					throw new Error(`Invalid entry at index ${i}`);
				}
				return { name: item.name, caloriesPer100g: item.caloriesPer100g };
			});

			if (
				commonIngredients.length > 0 &&
				!confirm(
					`Replace ${commonIngredients.length} saved ingredient(s) with ${cleaned.length} from file?`
				)
			) {
				return;
			}

			commonIngredients = cleaned;
			importMessageKind = 'success';
			importMessage = `Imported ${cleaned.length} ingredient(s).`;
		} catch (err) {
			importMessageKind = 'error';
			importMessage = err instanceof Error ? err.message : 'Failed to import';
		} finally {
			input.value = '';
		}
	}

	// Meal session
	function startWeighing() {
		phase = 'weighing';
	}

	function calories(ing: Ingredient): number | null {
		if (ing.caloriesPer100g == null) return null;
		return Math.round((ing.weight * ing.caloriesPer100g) / 100);
	}

	function addIngredient() {
		const w = parseFloat(inputWeight);
		if (isNaN(w) || w <= 0) return;

		let name = '';
		let cal: number | null = null;

		if (isCustom) {
			name = customName.trim();
			if (!name) return;
			const c = parseFloat(customCalories);
			cal = isNaN(c) ? null : c;
		} else {
			const idx = parseInt(selectedKey, 10);
			const picked = commonIngredients[idx];
			if (!picked) return;
			name = picked.name;
			cal = picked.caloriesPer100g;
		}

		ingredients.push({ name, weight: w, caloriesPer100g: cal });

		selectedKey = '';
		customName = '';
		customCalories = '';
		inputWeight = '';
	}

	function handleAddKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') addIngredient();
	}

	function removeIngredient(i: number) {
		ingredients.splice(i, 1);
	}
</script>

<div class="min-h-screen bg-base-200 flex flex-col items-center p-6">
	<header class="w-full max-w-2xl flex items-center justify-between mb-8 mt-4">
		<h1 class="text-3xl font-bold">macrobator</h1>
		<button class="btn btn-sm btn-ghost" onclick={openManager}>
			Manage ingredients
		</button>
	</header>

	{#if phase === 'idle'}
		<div class="flex flex-col items-center gap-4 mt-24">
			<p class="text-base-content/60 text-lg">Ready to log a meal?</p>
			<button class="btn btn-primary btn-lg" onclick={startWeighing}>
				Start Weighing Meal
			</button>
		</div>
	{:else}
		<div class="w-full max-w-2xl flex flex-col gap-6">

			<!-- Ingredient picker -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-4 gap-3">
					<div class="flex flex-col sm:flex-row gap-2">
						<select class="select select-bordered flex-1" bind:value={selectedKey}>
							<option value="" disabled>Choose ingredient…</option>
							{#each commonIngredients as ing, i}
								<option value={String(i)}>{ing.name} — {ing.caloriesPer100g} cal/100g</option>
							{/each}
							<option value="__custom__">Custom (one-off)…</option>
						</select>

						<label class="input input-bordered flex items-center gap-1 w-full sm:w-32">
							<input
								type="number"
								class="w-full"
								placeholder="weight"
								min="0"
								step="0.1"
								bind:value={inputWeight}
								onkeydown={handleAddKeydown}
							/>
							<span class="text-base-content/50 text-sm">g</span>
						</label>

						<button class="btn btn-primary" onclick={addIngredient}>Add</button>
					</div>

					{#if isCustom}
						<div class="flex flex-col sm:flex-row gap-2">
							<input
								class="input input-bordered flex-1"
								placeholder="Custom name"
								bind:value={customName}
								onkeydown={handleAddKeydown}
							/>
							<label class="input input-bordered flex items-center gap-1 w-full sm:w-44">
								<input
									type="number"
									class="w-full"
									placeholder="calories per 100g"
									min="0"
									step="1"
									bind:value={customCalories}
									onkeydown={handleAddKeydown}
								/>
								<span class="text-base-content/50 text-xs whitespace-nowrap">cal/100g</span>
							</label>
						</div>
						<p class="text-xs text-base-content/40">
							This is one-off and won't be saved. Use “Manage ingredients” to add to your saved list.
						</p>
					{/if}
				</div>
			</div>

			<!-- Ingredient cards -->
			{#if ingredients.length > 0}
				<div class="flex flex-wrap gap-3">
					{#each ingredients as ingredient, i}
						<div class="card bg-base-100 shadow w-48">
							<div class="card-body p-4 gap-1">
								<h2 class="card-title text-sm break-words leading-tight">{ingredient.name}</h2>
								<p class="text-2xl font-bold leading-tight">
									{ingredient.weight}<span class="text-sm font-normal text-base-content/50"> g</span>
								</p>
								{#if calories(ingredient) != null}
									<p class="text-sm text-base-content/70">{calories(ingredient)} cal</p>
								{:else}
									<p class="text-sm text-base-content/40 italic">unknown cal</p>
								{/if}
								<button
									class="btn btn-xs btn-ghost text-error mt-1 self-start"
									onclick={() => removeIngredient(i)}
								>remove</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-base-content/40 text-sm">Add your first ingredient above.</p>
			{/if}

			<!-- Macros placeholder / running totals -->
			<div class="card border-2 border-dashed border-base-300 bg-base-100/50 mt-2">
				<div class="card-body py-6 gap-2">
					{#if ingredients.length > 0}
						<div class="flex items-baseline justify-between">
							<span class="text-sm uppercase tracking-wide text-base-content/50">Total</span>
							<span class="text-2xl font-bold">
								{Math.round(totalCalories)}<span class="text-sm font-normal text-base-content/50"> cal</span>
							</span>
						</div>
						{#if hasUnknownCalories}
							<p class="text-xs text-base-content/40">
								Some ingredients have no calorie data — total may be incomplete.
							</p>
						{/if}
						<p class="text-xs text-base-content/30 text-center mt-1">
							Macro breakdown will appear here
						</p>
					{:else}
						<p class="text-sm text-base-content/30 text-center">Macros will appear here</p>
					{/if}
				</div>
			</div>

		</div>
	{/if}
</div>

<!-- Manage ingredients modal -->
<dialog bind:this={manageDialog} class="modal">
	<div class="modal-box max-w-2xl">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close">✕</button>
		</form>
		<h3 class="font-bold text-lg mb-1">Manage ingredients</h3>
		<p class="text-sm text-base-content/60 mb-4">
			Edit your saved ingredient list. Changes persist locally.
		</p>

		<!-- Add new -->
		<div class="flex flex-col sm:flex-row gap-2 mb-4">
			<input
				class="input input-bordered input-sm flex-1"
				placeholder="Ingredient name"
				bind:value={newSourceName}
				onkeydown={handleSourceAddKeydown}
			/>
			<label class="input input-bordered input-sm flex items-center gap-1 w-full sm:w-44">
				<input
					type="number"
					class="w-full"
					placeholder="cal/100g"
					min="0"
					step="1"
					bind:value={newSourceCalories}
					onkeydown={handleSourceAddKeydown}
				/>
				<span class="text-base-content/50 text-xs whitespace-nowrap">cal/100g</span>
			</label>
			<button class="btn btn-sm btn-primary" onclick={addToSource}>Add</button>
		</div>

		<!-- Existing -->
		<div class="max-h-80 overflow-y-auto border border-base-300 rounded-lg">
			{#if commonIngredients.length === 0}
				<p class="p-4 text-sm text-base-content/40 text-center">No ingredients saved.</p>
			{:else}
				<ul class="divide-y divide-base-300">
					{#each commonIngredients as ing, i}
						<li class="flex items-center gap-2 p-2">
							<input
								class="input input-bordered input-xs flex-1"
								bind:value={commonIngredients[i].name}
							/>
							<label class="input input-bordered input-xs flex items-center gap-1 w-32">
								<input
									type="number"
									class="w-full"
									min="0"
									step="1"
									bind:value={commonIngredients[i].caloriesPer100g}
								/>
								<span class="text-base-content/50 text-[10px] whitespace-nowrap">cal/100g</span>
							</label>
							<button
								class="btn btn-xs btn-ghost text-error"
								onclick={() => removeFromSource(i)}
								aria-label="Remove"
							>✕</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if importMessage}
			<div
				class="alert {importMessageKind === 'success' ? 'alert-success' : 'alert-error'} mt-3 py-2"
			>
				<span class="text-sm">{importMessage}</span>
			</div>
		{/if}

		<div class="modal-action flex-wrap justify-between gap-2">
			<div class="flex flex-wrap gap-2">
				<button class="btn btn-sm btn-ghost" onclick={exportIngredients}>Export</button>
				<button class="btn btn-sm btn-ghost" onclick={triggerImport}>Import</button>
				<button class="btn btn-sm btn-ghost" onclick={resetSource}>Reset to defaults</button>
			</div>
			<form method="dialog">
				<button class="btn btn-sm btn-primary">Done</button>
			</form>
		</div>

		<input
			bind:this={fileInput}
			type="file"
			accept="application/json,.json"
			class="hidden"
			onchange={handleImport}
		/>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
