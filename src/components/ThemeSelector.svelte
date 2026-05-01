<script>
  import { onMount } from 'svelte';
  import { themes, currentTheme, applyTheme, loadSavedTheme, allThemes, glassmorphismIntensity, setGlassmorphismIntensity } from '../stores/theme.js';
  import ThemeBuilder from './ThemeBuilder.svelte';
  
  let isOpen = false;
  let showThemeBuilder = false;
  let glassIntensity = 0.7;

  onMount(() => {
    loadSavedTheme();
    glassmorphismIntensity.subscribe(value => {
      glassIntensity = value;
    });
  });

  function selectTheme(themeName) {
    applyTheme(themeName);
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function closeDropdown() {
    isOpen = false;
  }

  function openThemeBuilder() {
    showThemeBuilder = true;
    isOpen = false;
  }

  function closeThemeBuilder() {
    showThemeBuilder = false;
  }

  function handleGlassIntensityChange(event) {
    const value = parseFloat(event.target.value);
    setGlassmorphismIntensity(value);
  }
</script>

<div class="theme-selector">
  <button class="theme-btn" on:click={toggleDropdown} title="Change Theme">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
    <span>{$currentTheme ? $allThemes[$currentTheme]?.name : 'Theme'}</span>
    <svg class="icon icon-sm chevron" class:rotate={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  </button>
  
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  {#if isOpen}
    <div class="theme-dropdown" on:mouseleave={closeDropdown}>
      <div class="dropdown-header">
        <h4>Themes</h4>
      </div>

      <div class="theme-list">
        {#each Object.entries($allThemes) as [key, theme]}
          <button
            class="theme-option"
            class:active={$currentTheme === key}
            class:custom={theme.isCustom}
            on:click={() => selectTheme(key)}
          >
            <div class="color-preview" style="background: linear-gradient(135deg, {theme.accentPrimary}, {theme.accentSecondary})"></div>
            <span>{theme.name}</span>
            {#if theme.isCustom}
              <span class="custom-badge">Custom</span>
            {/if}
            {#if $currentTheme === key}
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            {/if}
          </button>
        {/each}
      </div>

      <div class="dropdown-footer">
        <button class="create-theme-btn" on:click={openThemeBuilder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Custom Theme
        </button>

        <div class="glassmorphism-control">
          <label for="glass-intensity">Glass Effect</label>
          <input
            id="glass-intensity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            bind:value={glassIntensity}
            on:input={handleGlassIntensityChange}
          />
          <span class="intensity-value">{Math.round(glassIntensity * 100)}%</span>
        </div>
      </div>
    </div>
  {/if}

  <ThemeBuilder {showThemeBuilder} on:close={closeThemeBuilder} />
</div>

<style>
  .theme-selector {
    position: relative;
  }
  
  .theme-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .theme-btn:hover {
    border-color: var(--color-accent-primary);
    color: var(--color-text-primary);
  }
  
  .theme-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .chevron {
    transition: transform var(--transition-fast);
  }
  
  .chevron.rotate {
    transform: rotate(180deg);
  }
  
  .theme-dropdown {
    position: absolute;
    top: calc(100% + var(--spacing-sm));
    right: 0;
    min-width: 200px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    box-shadow: var(--glass-shadow);
    z-index: 100;
    overflow: hidden;
  }
  
  .theme-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }
  
  .theme-option:hover {
    background: var(--color-accent-dim);
    color: var(--color-text-primary);
  }
  
  .theme-option.active {
    background: var(--color-accent-dim);
    color: var(--color-accent-primary);
  }
  
  .color-preview {
    width: 16px;
    height: 16px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  
  .check-icon {
    width: 16px;
    height: 16px;
    margin-left: auto;
    color: var(--color-accent-primary);
  }

  .dropdown-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--glass-border);
  }

  .dropdown-header h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-weight: 600;
  }

  .theme-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .dropdown-footer {
    padding: var(--spacing-md);
    border-top: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .create-theme-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-accent-primary);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-sm);
    color: var(--color-bg-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .create-theme-btn:hover {
    background: var(--color-accent-secondary);
    border-color: var(--color-accent-secondary);
  }

  .create-theme-btn svg {
    width: 16px;
    height: 16px;
  }

  .glassmorphism-control {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .glassmorphism-control label {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .glassmorphism-control input[type="range"] {
    width: 100%;
    height: 6px;
    background: var(--color-bg-tertiary);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
  }

  .glassmorphism-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 4px var(--color-accent-glow);
  }

  .glassmorphism-control input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 4px var(--color-accent-glow);
  }

  .intensity-value {
    align-self: flex-end;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: monospace;
  }

  .custom-badge {
    font-size: 0.625rem;
    color: var(--color-accent-secondary);
    background: rgba(255, 107, 53, 0.1);
    padding: 2px 6px;
    border-radius: 8px;
    font-weight: 500;
  }
</style>
