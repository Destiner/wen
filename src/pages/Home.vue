<template>
  <WenPage>
    <template #default>
      <div class="page-home">
        <div
          v-if="walletAddress"
          class="address-block"
        >
          <div class="address">{{ formatAddress(walletAddress, 10) }}</div>
          <WenIcon
            size="small"
            kind="copy"
            class="icon"
            @click="handleCopyWalletClick"
          />
        </div>
        <div
          v-if="balance"
          class="balance-block"
        >
          <div>Balance</div>
          <div class="balance">{{ formatEther(balance) }} ETH</div>
        </div>
      </div>
    </template>

    <template #footer>
      <WenInfoBlock type="info">
        <template
          v-if="delegation"
          #default
        >
          <div class="delegation">
            Delegating to {{ formatAddress(delegation, 8) }}
            <WenIcon
              size="small"
              kind="copy"
              class="icon icon-small"
              @click="handleCopyDelegationClick"
            />
          </div>
        </template>
        <template
          v-else
          #default
        >
          Not delegating
        </template>
        <template #append>
          <WenButton
            :label="delegation ? 'Edit' : 'Delegate'"
            type="ghost"
            size="small"
            @click="openDelegationPage"
          />
        </template>
      </WenInfoBlock>
      <WenButton
        label="Edit Mnemonic"
        type="primary"
        size="large"
        @click="openMnemonicPage"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import {
  Address,
  createPublicClient,
  formatEther,
  http,
  size,
  slice,
} from 'viem';
import { getBalance, getCode } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import WenButton from '@/components/__common/WenButton.vue';
import WenIcon from '@/components/__common/WenIcon.vue';
import WenInfoBlock from '@/components/__common/WenInfoBlock.vue';
import WenPage from '@/components/__common/WenPage.vue';
import { useWallet } from '@/composables/useWallet';

const DELEGATION_HEADER = '0xef0100';

const router = useRouter();

const wallet = useWallet();

const walletAddress = computed(() => wallet.address.value);

const balance = ref<bigint | null>(null);
const delegation = ref<Address | null>(null);
useIntervalFn(
  () => {
    fetchBalance();
    fetchDelegation();
  },
  10 * 1000,
  {
    immediate: true,
    immediateCallback: true,
  },
);
async function fetchBalance(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  const client = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const accountBalance = await getBalance(client, {
    address: walletAddress.value,
  });
  balance.value = accountBalance;
}
async function fetchDelegation(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  const client = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const code = await getCode(client, {
    address: walletAddress.value,
  });
  delegation.value =
    code === undefined
      ? null
      : slice(code, 0, size(DELEGATION_HEADER)) === DELEGATION_HEADER
        ? slice(code, size(DELEGATION_HEADER))
        : null;
}

function handleCopyWalletClick(): void {
  if (!walletAddress.value) {
    return;
  }
  handleCopyClick(walletAddress.value);
}

function handleCopyDelegationClick(): void {
  if (!delegation.value) {
    return;
  }
  handleCopyClick(delegation.value);
}

function handleCopyClick(address: Address): void {
  navigator.clipboard.writeText(address);
}

function openDelegationPage(): void {
  router.push({
    name: 'delegation',
  });
}

function openMnemonicPage(): void {
  router.push({
    name: 'mnemonic',
  });
}

function formatAddress(address: Address, length: number): string {
  return `${address.substring(0, length / 2 + 2)}...${address.substring(
    address.length - length / 2,
  )}`;
}
</script>

<style scoped>
.page-home {
  display: flex;
  flex-direction: column;
  margin-top: 48px;
  padding: 16px;
  gap: 16px;
}

.address-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 20px;
}

.balance-block {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.delegation {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 16px;
  height: 16px;
  opacity: 0.6;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
}

.icon-small {
  width: 14px;
  height: 14px;
}
</style>
