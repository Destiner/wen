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
      <div v-if="areSessionKeysSupported">
        <WenToggle
          v-model:model-value="areSessionKeysEnabled"
          label="Session Keys"
          :disabled="isSessionKeyToggleDisabled"
        />
      </div>
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
        type="secondary"
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
  concat,
  createPublicClient,
  formatEther,
  http,
  size,
  slice,
} from 'viem';
import {
  createBundlerClient,
  entryPoint07Address,
} from 'viem/account-abstraction';
import { getBalance, getCode, readContract } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import kernelV3ImplementationAbi from '@/abi/kernelV3Implementation';
import WenButton from '@/components/__common/WenButton.vue';
import WenIcon from '@/components/__common/WenIcon.vue';
import WenInfoBlock from '@/components/__common/WenInfoBlock.vue';
import WenPage from '@/components/__common/WenPage.vue';
import WenToggle from '@/components/__common/WenToggle.vue';
import { useProvider } from '@/composables/useProvider';
import { useWallet } from '@/composables/useWallet';
import {
  getDisableSmartSessionModuleExecution,
  getEnableSmartSessionModuleExecution,
  getOpHash,
  prepareOp,
  submitOp,
} from '@/utils/aa';
import {
  DELEGATION_HEADER,
  KERNEL_V3_IMPLEMENTATION_ADDRESS,
  MULTI_CHAIN_VALIDATOR_ADDRESS,
  SMART_SESSION_VALIDATOR_ADDRESS,
} from '@/utils/consts';
import { formatAddress } from '@/utils/formatting';

const router = useRouter();

const wallet = useWallet();
const { personalSign } = useProvider();

const walletAddress = computed(() => wallet.address.value);

const balance = ref<bigint | null>(null);
const delegation = ref<Address | null>(null);
onMounted(async () => {
  await Promise.all([fetchBalance(), fetchDelegation()]);
  await fetchAreSessionKeysEnabled();
});
useIntervalFn(
  () => {
    fetchBalance();
    fetchDelegation();
  },
  10 * 1000,
  {
    immediate: true,
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
const areSessionKeysEnabled = ref(false);
const isSessionKeyToggledSetProgrammatically = ref(false);
async function fetchAreSessionKeysEnabled(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  if (delegation.value !== KERNEL_V3_IMPLEMENTATION_ADDRESS) {
    return;
  }
  const client = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const isInstalled = await readContract(client, {
    address: walletAddress.value,
    abi: kernelV3ImplementationAbi,
    functionName: 'isModuleInstalled',
    args: [1n, SMART_SESSION_VALIDATOR_ADDRESS, '0x'],
  });
  if (areSessionKeysEnabled.value !== isInstalled) {
    isSessionKeyToggledSetProgrammatically.value = true;
    areSessionKeysEnabled.value = isInstalled;
  }
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

const areSessionKeysSupported = computed(
  () => delegation.value === KERNEL_V3_IMPLEMENTATION_ADDRESS,
);
const isSessionKeyToggleDisabled = ref(false);
watch(areSessionKeysEnabled, async (newValue) => {
  if (isSessionKeyToggledSetProgrammatically.value) {
    isSessionKeyToggledSetProgrammatically.value = false;
    return;
  }
  isSessionKeyToggleDisabled.value = true;
  if (newValue) {
    await enableSessionKeyModule();
  } else {
    await disableSessionKeyModule();
  }
  isSessionKeyToggleDisabled.value = false;
});

async function enableSessionKeyModule(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  const KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID = concat([
    '0x01',
    MULTI_CHAIN_VALIDATOR_ADDRESS,
  ]);
  const nonceKey = BigInt(KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID);
  const execution = await getEnableSmartSessionModuleExecution(
    walletAddress.value,
  );
  const op = await prepareOp(walletAddress.value, null, [execution], nonceKey);
  const opHash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!opHash) {
    return;
  }
  personalSign(opHash, async (signature) => {
    if (!walletAddress.value) {
      return;
    }
    if (!signature) {
      return;
    }
    op.signature = signature;
    // Submit op like a bundler
    const bundlerClient = createBundlerClient({
      client: createPublicClient({
        chain: odysseyTestnet,
        transport: http(),
      }),
      transport: http(`https://public.pimlico.io/v2/${odysseyTestnet.id}/rpc`),
    });
    const opHash = await submitOp(walletAddress.value, bundlerClient, op);
    console.log('opHash', opHash);
  });
}

async function disableSessionKeyModule(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  const KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID = concat([
    '0x01',
    MULTI_CHAIN_VALIDATOR_ADDRESS,
  ]);
  const nonceKey = BigInt(KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID);
  const execution = await getDisableSmartSessionModuleExecution(
    walletAddress.value,
  );
  const op = await prepareOp(walletAddress.value, null, [execution], nonceKey);
  const opHash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!opHash) {
    return;
  }
  personalSign(opHash, async (signature) => {
    if (!walletAddress.value) {
      return;
    }
    if (!signature) {
      return;
    }
    op.signature = signature;
    // Submit op like a bundler
    const bundlerClient = createBundlerClient({
      client: createPublicClient({
        chain: odysseyTestnet,
        transport: http(),
      }),
      transport: http(`https://public.pimlico.io/v2/${odysseyTestnet.id}/rpc`),
    });
    const opHash = await submitOp(walletAddress.value, bundlerClient, op);
    console.log('opHash', opHash);
  });
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
