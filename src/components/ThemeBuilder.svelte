<script>
  import { createEventDispatcher } from 'svelte';
  import { allThemes, currentTheme, createCustomTheme, updateCustomThemeAccent, applyTheme } from '../stores/theme.js';

  export let isOpen = false;

  let customThemeName = '';
  let baseTheme = 'electricAurora';
  let primaryColor = '#00d4ff';
  let secondaryColor = '#00a8cc';
  let previewTheme = null;

  const dispatch = createEventDispatcher();

  function updatePreview() {
    const baseThemeData = $allThemes[baseTheme];
    if (baseThemeData) {
      previewTheme = {
        ...baseThemeData,
        accentPrimary: primaryColor,
        accentSecondary: secondaryColor,
        accentGlow: primaryColor.replace('rgb', 'rgba').replace(')', ', 0.4)'),
        accentDim: primaryColor.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      };
    }
  }

  $: if (baseTheme || primaryColor || secondaryColor) {
    updatePreview();
  }

  function createTheme() {
    if (!customThemeName.trim()) return;

    const themeName = `custom-${Date.now()}`;
    createCustomTheme(themeName, previewTheme);
    applyTheme(themeName);

    // Reset form
    customThemeName = '';
    baseTheme = 'electricAurora';
    primaryColor = '#00d4ff';
    secondaryColor = '#00a8cc';

    dispatch('themeCreated', { themeName });
  }

  function close() {
    dispatch('close');
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="theme-builder-overlay" on:click={close}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="theme-builder" on:click|stopPropagation>
      <div class="builder-header">
        <h3>Create Custom Theme</h3>
        <button class="close-btn" on:click={close}>&times;</button>
      </div>

      <div class="builder-content">
        <div class="form-group">
          <label for="theme-name">Theme Name</label>
          <input
            id="theme-name"
            type="text"
            bind:value={customThemeName}
            placeholder="My Custom Theme"
          />
        </div>

        <div class="form-group">
          <label for="base-theme">Base Theme</label>
          <select id="base-theme" bind:value={baseTheme}>
            {#each Object.entries($allThemes) as [key, theme]}
              {#if !theme.isCustom}
                <option value={key}>{theme.name}</option>
              {/if}
            {/each}
          </select>
        </div>

        <div class="color-section">
          <h4>Accent Colors</h4>

          <div class="color-inputs">
            <div class="color-group">
              <label for="primary-color">Primary</label>
              <input
                id="primary-color"
                type="color"
                bind:value={primaryColor}
              />
              <span>{primaryColor}</span>
            </div>

            <div class="color-group">
              <label for="secondary-color">Secondary</label>
              <input
                id="secondary-color"
                type="color"
                bind:value={secondaryColor}
              />
              <span>{secondaryColor}</span>
            </div>
          </div>
        </div>

        {#if previewTheme}
          <div class="preview-section">
            <h4>Preview</h4>
            <div class="theme-preview" style="
              --preview-bg-primary: {previewTheme.bgPrimary};
              --preview-bg-secondary: {previewTheme.bgSecondary};
              --preview-accent-primary: {previewTheme.accentPrimary};
              --preview-accent-secondary: {previewTheme.accentSecondary};
            ">
              <div class="preview-card">
                <div class="preview-header">Bluetooth Device</div>
                <div class="preview-button">Connect</div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="builder-footer">
        <button class="btn-secondary" on:click={close}>Cancel</button>
        <button
          class="btn-primary"
          on:click={createTheme}
          disabled={!customThemeName.trim()}
        >
          Create Theme
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .theme-builder-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .theme-builder {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-accent-dim);
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .builder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--color-bg-tertiary);
  }

  .builder-header h3 {
    margin: 0;
    color: var(--color-text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .builder-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-accent-dim);
    border-radius: 6px;
    color: var(--color-text-primary);
    font-size: 14px;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px var(--color-accent-glow);
  }

  .color-section h4 {
    margin: 20px 0 15px 0;
    color: var(--color-text-primary);
  }

  .color-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .color-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .color-group input[type="color"] {
    width: 60px;
    height: 40px;
    padding: 0;
    border: 2px solid var(--color-bg-tertiary);
    border-radius: 6px;
    cursor: pointer;
  }

  .color-group span {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .preview-section {
    margin-top: 25px;
  }

  .preview-section h4 {
    margin-bottom: 15px;
    color: var(--color-text-primary);
  }

  .theme-preview {
    border-radius: 8px;
    padding: 15px;
    background: var(--preview-bg-primary);
    border: 1px solid var(--color-accent-dim);
  }

  .preview-card {
    background: var(--preview-bg-secondary);
    border-radius: 6px;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .preview-header {
    color: white;
    font-weight: 500;
    margin-bottom: 10px;
  }

  .preview-button {
    background: var(--preview-accent-primary);
    color: var(--preview-bg-primary);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .builder-footer {
    display: flex;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid var(--color-bg-tertiary);
  }

  .btn-secondary {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-accent-dim);
    color: var(--color-text-secondary);
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-accent-primary);
  }

  .btn-primary {
    background: var(--color-accent-primary);
    border: 1px solid var(--color-accent-primary);
    color: var(--color-bg-primary);
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-secondary);
    border-color: var(--color-accent-secondary);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>