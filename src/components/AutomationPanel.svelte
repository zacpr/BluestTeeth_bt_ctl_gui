<script>
  import {
    automationRules,
    automationTriggers,
    automationActionTypes,
    automationEventLabel,
    actionTypeLabel,
  } from '../stores/automation.js';
  import { devices } from '../stores/bluetooth.js';

  export let open = false;
  export let onClose = () => {};

  let name = '';
  let trigger = 'device_connected';
  let mac = '';
  let actionType = 'command';
  let command = '';
  let webhookUrl = '';

  function resetForm() {
    name = '';
    trigger = 'device_connected';
    mac = '';
    actionType = 'command';
    command = '';
    webhookUrl = '';
  }

  function addRule() {
    automationRules.addRule({ name, trigger, mac, actionType, command, webhookUrl });
    resetForm();
  }

  function formatLastRun(timestamp) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="automation-overlay" on:click={onClose}></div>
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <section class="automation-panel" on:click|stopPropagation>
    <header class="automation-header">
      <div>
        <p class="eyebrow">Automation</p>
        <h2>Event Actions</h2>
      </div>
      <button class="close-btn" on:click={onClose} aria-label="Close automation panel">×</button>
    </header>

    <div class="automation-grid">
      <form class="automation-form" on:submit|preventDefault={addRule}>
        <h3>Create Rule</h3>

        <label>
          <span>Name</span>
          <input bind:value={name} placeholder="e.g. Start music when headphones connect" />
        </label>

        <label>
          <span>Trigger</span>
          <select bind:value={trigger}>
            {#each automationTriggers as item}
              <option value={item.value}>{item.label}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Device Filter</span>
          <select bind:value={mac}>
            <option value="">Any device</option>
            {#each $devices as device}
              <option value={device.mac}>{device.alias || device.name} ({device.mac})</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Action</span>
          <select bind:value={actionType}>
            {#each automationActionTypes as item}
              <option value={item.value}>{item.label}</option>
            {/each}
          </select>
        </label>

        {#if actionType === 'command'}
          <label>
            <span>Command</span>
            <input bind:value={command} placeholder="notify-send 'Headphones connected'" />
          </label>
          <p class="hint">The event JSON is available to commands as <code>BLUEST_TEETH_EVENT</code>.</p>
        {:else}
          <label>
            <span>Webhook URL</span>
            <input bind:value={webhookUrl} placeholder="https://example.com/bluetooth-event" />
          </label>
          <p class="hint">Webhook body includes <code>source</code>, <code>event</code>, and <code>payload</code>.</p>
        {/if}

        <button class="primary-btn" type="submit" disabled={actionType === 'command' ? !command : !webhookUrl}>
          Add Rule
        </button>
      </form>

      <div class="rule-list">
        <h3>Active Rules</h3>
        {#if $automationRules.length === 0}
          <div class="empty-rules">
            <div class="orb"></div>
            <p>No automations yet</p>
            <span>Add a rule to react to device events.</span>
          </div>
        {:else}
          {#each $automationRules as rule (rule.id)}
            <article class="rule-card" class:disabled={!rule.enabled}>
              <div class="rule-main">
                <div>
                  <h4>{rule.name}</h4>
                  <p>{automationEventLabel(rule.trigger)} · {rule.mac || 'Any device'}</p>
                </div>
                <button class="toggle" class:enabled={rule.enabled} on:click={() => automationRules.toggleRule(rule.id)}>
                  {rule.enabled ? 'On' : 'Off'}
                </button>
              </div>

              <div class="rule-meta">
                <span>{actionTypeLabel(rule.actionType)}</span>
                <span>Last run: {formatLastRun(rule.lastRun)}</span>
              </div>

              <code class="rule-target">{rule.actionType === 'command' ? rule.command : rule.webhookUrl}</code>

              <button class="remove-btn" on:click={() => automationRules.removeRule(rule.id)}>Remove</button>
            </article>
          {/each}
        {/if}
      </div>
    </div>
  </section>
{/if}

<style>
  .automation-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(5px);
    z-index: 150;
  }

  .automation-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(980px, calc(100vw - 40px));
    max-height: min(760px, calc(100vh - 40px));
    overflow: auto;
    z-index: 151;
    background: radial-gradient(circle at top left, rgba(0, 212, 255, 0.18), transparent 34%), rgba(8, 12, 25, 0.94);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55), 0 0 45px rgba(0, 212, 255, 0.12);
    padding: var(--spacing-xl);
    color: var(--color-text-primary);
  }

  .automation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-xl);
  }

  .eyebrow {
    margin: 0 0 4px;
    color: var(--color-accent-primary);
    font-size: 0.75rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-weight: 700;
  }

  .automation-header h2 {
    margin: 0;
    font-size: 1.6rem;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--glass-border);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: 1.4rem;
  }

  .automation-grid {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: var(--spacing-xl);
  }

  .automation-form,
  .rule-list {
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
  }

  h3 {
    margin: 0 0 var(--spacing-lg);
    font-size: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: var(--spacing-md);
  }

  label span {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input,
  select {
    background: var(--color-bg-primary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    padding: 10px 12px;
    outline: none;
  }

  input:focus,
  select:focus {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.16);
  }

  .hint {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    line-height: 1.4;
    margin: -4px 0 var(--spacing-md);
  }

  .primary-btn {
    width: 100%;
    border: none;
    border-radius: var(--radius-md);
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--color-accent-primary), #7c3cff);
    color: #06111e;
    font-weight: 800;
    cursor: pointer;
  }

  .primary-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .rule-list {
    min-height: 420px;
  }

  .empty-rules {
    height: 320px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 8px;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .empty-rules p {
    margin: 0;
    color: var(--color-text-primary);
    font-weight: 700;
  }

  .empty-rules span {
    font-size: 0.85rem;
  }

  .orb {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--color-accent-primary), transparent 66%);
    filter: blur(1px);
    box-shadow: 0 0 38px var(--color-accent-glow);
  }

  .rule-card {
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.04);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .rule-card.disabled {
    opacity: 0.55;
  }

  .rule-main {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .rule-main h4 {
    margin: 0 0 4px;
    font-size: 0.95rem;
  }

  .rule-main p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.78rem;
  }

  .toggle,
  .remove-btn {
    border: 1px solid var(--glass-border);
    border-radius: 999px;
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 6px 12px;
    height: fit-content;
  }

  .toggle.enabled {
    border-color: var(--color-success);
    color: var(--color-success);
    box-shadow: 0 0 14px rgba(0, 255, 157, 0.14);
  }

  .rule-meta {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin: var(--spacing-sm) 0;
    color: var(--color-text-muted);
    font-size: 0.72rem;
  }

  .rule-target {
    display: block;
    padding: 8px;
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.18);
    color: var(--color-accent-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-btn {
    margin-top: var(--spacing-sm);
    color: var(--color-error);
  }

  @media (max-width: 820px) {
    .automation-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
