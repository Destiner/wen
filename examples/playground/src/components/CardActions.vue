<template>
  <TabsRoot
    class="root"
    default-value="basic"
  >
    <TabsList
      class="list"
      aria-label="Manage your account"
    >
      <TabsTrigger
        class="trigger"
        value="basic"
      >
        Basic
      </TabsTrigger>
      <TabsTrigger
        class="trigger"
        value="sessions"
      >
        Session Keys
      </TabsTrigger>
    </TabsList>
    <TabsContent
      class="actions"
      value="basic"
    >
      <div class="action">
        <div>
          <PlayButton
            type="secondary"
            :disabled="!isValidOwner || isPending"
            @click="handleSendTransactionClick"
          >
            Send transaction
          </PlayButton>
        </div>
        <div>
          <div
            v-if="txHash"
            class="action-result"
          >
            Sent
            <a
              :href="getBlockExplorerTxUrl(txHash)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconArrowTopRight class="icon" />
            </a>
          </div>
        </div>
      </div>
      <div class="action">
        <div>
          <PlayButton
            type="secondary"
            :disabled="!isValidOwner || isPending"
            @click="handleSendUserOpClick"
          >
            Send user operation
          </PlayButton>
        </div>
        <div>
          <div
            v-if="opTxHash"
            class="action-result"
          >
            Sent
            <a
              :href="getBlockExplorerTxUrl(opTxHash)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconArrowTopRight class="icon" />
            </a>
          </div>
        </div>
      </div>
    </TabsContent>
    <TabsContent
      class="actions"
      value="sessions"
    >
      <div class="sessions">
        <div
          v-if="isValidOwner"
          class="data-row"
          :class="{ invalid: !areSessionKeysEnabled }"
        >
          <div class="label">Session Keys</div>
          <div class="value">
            <template v-if="areSessionKeysEnabled">Enabled</template>
            <template v-else>Disabled</template>
          </div>
        </div>
        <div
          v-if="areSessionKeysEnabled"
          class="data-row"
          :class="{ invalid: !isSessionEnabled }"
        >
          <div class="label">Active Session</div>
          <div class="value">
            <template v-if="isSessionEnabled">Enabled</template>
            <template v-else>Disabled</template>
          </div>
        </div>
        <div
          v-if="isSessionEnabled"
          class="data-row"
        >
          <div class="label">Count</div>
          <div class="value">
            {{ count }}
          </div>
        </div>
      </div>
      <div class="actions">
        <div
          v-if="areSessionKeysEnabled && !isSessionEnabled"
          class="action"
        >
          <div>
            <PlayButton
              type="secondary"
              :disabled="!isValidOwner || isPending"
              @click="handleEnableSession"
            >
              Enable session
            </PlayButton>
          </div>
          <div>
            <div
              v-if="enableSessionTxHash"
              class="action-result"
            >
              Sent
              <a
                :href="getBlockExplorerTxUrl(enableSessionTxHash)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconArrowTopRight class="icon" />
              </a>
            </div>
          </div>
        </div>
        <div
          v-if="isSessionEnabled"
          class="action"
        >
          <div>
            <PlayButton
              type="secondary"
              :disabled="!isValidOwner || isPending"
              @click="handleIncrease"
            >
              Increase
            </PlayButton>
          </div>
          <div>
            <div
              v-if="increaseTxHash"
              class="action-result"
            >
              Sent
              <a
                :href="getBlockExplorerTxUrl(increaseTxHash)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconArrowTopRight class="icon" />
              </a>
            </div>
          </div>
        </div>
        <div
          v-if="isSessionEnabled"
          class="action"
        >
          <div>
            <PlayButton
              type="secondary"
              :disabled="!isValidOwner || isPending"
              @click="handleDecrease"
            >
              Decrease
            </PlayButton>
          </div>
          <div>
            <div
              v-if="decreaseTxHash"
              class="action-result"
            >
              Sent
              <a
                :href="getBlockExplorerTxUrl(decreaseTxHash)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconArrowTopRight class="icon" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  </TabsRoot>
</template>

<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'radix-vue';
import { Hex } from 'viem';
import { odysseyTestnet } from 'viem/chains';

import IconArrowTopRight from './IconArrowTopRight.vue';
import PlayButton from './PlayButton.vue';

defineProps<{
  isValidOwner: boolean;
  isPending: boolean;
  txHash: Hex | null;
  opTxHash: Hex | null;
  areSessionKeysEnabled: boolean | undefined;
  isSessionEnabled: boolean | undefined;
  count: bigint;
  enableSessionTxHash: Hex | null;
  increaseTxHash: Hex | null;
  decreaseTxHash: Hex | null;
}>();

const emit = defineEmits<{
  'send-transaction': [];
  'send-user-op': [];
  'enable-session': [];
  increase: [];
  decrease: [];
}>();

function handleSendTransactionClick(): void {
  emit('send-transaction');
}

function handleSendUserOpClick(): void {
  emit('send-user-op');
}

function handleEnableSession(): void {
  emit('enable-session');
}

function handleIncrease(): void {
  emit('increase');
}

function handleDecrease(): void {
  emit('decrease');
}

function getBlockExplorerTxUrl(hash: Hex): string {
  const chain = odysseyTestnet;
  const explorerUrl = chain.blockExplorers.default.url;
  return `${explorerUrl}/tx/${hash}`;
}
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background-secondary);
  gap: 24px;
}

.list {
  display: flex;
  position: relative;
  flex-shrink: 0;
  border-bottom: 1px solid var(--mauve-6);
}

.indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: var(--radix-tabs-indicator-size);
  height: 2px;
  padding-left: 2rem;
  transform: translateX(var(--radix-tabs-indicator-position));
  transition-property: width, transform;
  transition-duration: 300ms;
  border-radius: 9999px; /* rounded-full equivalent */
}

.trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
}

.trigger:first-child {
  border-top-left-radius: 6px;
}

.trigger:last-child {
  border-top-right-radius: 6px;
}

.trigger:hover {
  color: var(--text-primary);
}

.trigger[data-state='active'] {
  box-shadow:
    inset 0 -1px 0 0 currentcolor,
    0 1px 0 0 currentcolor;
  color: var(--accent);
}

.trigger:focus {
  position: relative;
}

.sessions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: flex;
  gap: 2px;
  flex-direction: column;

  .value {
    color: var(--text-primary);
    word-wrap: break-word;
  }

  &.invalid {
    .value {
      color: #db3807;
    }
  }

  .label {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.actions {
  display: flex;
  gap: 8px;
  flex-direction: column;

  &[hidden] {
    display: none;
  }

  .action {
    display: flex;
    gap: 2px;
    flex-direction: column;

    .action-result {
      display: inline-flex;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--background-primary);
      font-family: Consolas, Inconsolata, monospace;
      font-size: 13px;
      gap: 4px;

      .icon {
        width: 16px;
        height: 16px;
        color: var(--text-primary);
      }
    }
  }
}
</style>
