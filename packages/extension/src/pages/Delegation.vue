<template>
  <WenPage
    title="Delegate"
    subtitle="your EOA to a smart contract"
  >
    <template #header>
      <div>
        <WenButton
          type="naked"
          size="small"
          label="← Back"
          @click="openHomePage"
        />
      </div>
    </template>
    <template #default>
      <WenSelect
        v-model="selectedDelegationType"
        placeholder="Select delegation type"
        :options="delegationTypes"
      />
      <template v-if="selectedDelegationType === CUSTOM">
        <WenInput
          v-model="delegateeAddressInput"
          label="Delegatee address"
          placeholder="0x…"
          :is-valid="isDelegateeAddressValid"
          error-text="Invalid address"
          @blur="handleDelegateeAddressInputBlur"
        />

        <WenInput
          v-model="initializationDataInput"
          label="Initialization data"
          placeholder="0x…"
          :is-valid="isInitializationDataValid"
          error-text="Invalid data"
          @blur="handleInitializationDataInputBlur"
        />
      </template>
    </template>

    <template #footer>
      <WenInfoBlock type="info">
        <template #default>
          <ul>
            <li>
              Your EOA will be delegated to
              {{ formatAddress(delegateeAddress as Address, 20) }}
            </li>
            <li>Your EOA will be the owner of the delegated smart account</li>
          </ul>
        </template>
      </WenInfoBlock>
      <WenButton
        type="primary"
        size="large"
        label="Delegate"
        :disabled="isDelegating"
        @click="delegate"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import {
  Address,
  concat,
  encodeFunctionData,
  Hex,
  isAddress,
  isHex,
  zeroAddress,
} from 'viem';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import WenButton from '@/components/__common/WenButton.vue';
import WenInfoBlock from '@/components/__common/WenInfoBlock.vue';
import WenInput from '@/components/__common/WenInput.vue';
import WenPage from '@/components/__common/WenPage.vue';
import WenSelect from '@/components/__common/WenSelect.vue';
import { useProvider } from '@/composables/useProvider';
import { useWallet } from '@/composables/useWallet';
import {
  KERNEL_V3_IMPLEMENTATION_ADDRESS,
  MULTI_CHAIN_VALIDATOR_ADDRESS,
} from '@/utils/consts';
import { formatAddress } from '@/utils/formatting';

const router = useRouter();

const { delegate: providerDelegate } = useProvider();
const { address } = useWallet();

const KERNEL_V3 = 'kernel_v3';
const CUSTOM = 'custom';
const selectedDelegationType = ref(KERNEL_V3);
const delegationTypes = ref([
  { value: KERNEL_V3, label: 'Kernel V3' },
  { value: CUSTOM, label: 'Custom' },
]);

const delegateeAddressInput = ref('');
const initializationDataInput = ref('');
const isDelegateeAddressInputDirty = ref(false);
const isInitializationDataInputDirty = ref(false);

const isDelegateeAddressValid = computed(
  () =>
    !isDelegateeAddressInputDirty.value ||
    isAddress(delegateeAddressInput.value),
);
const isInitializationDataValid = computed(
  () =>
    !isInitializationDataInputDirty.value ||
    isHex(initializationDataInput.value),
);

function handleDelegateeAddressInputBlur(): void {
  isDelegateeAddressInputDirty.value = true;
}

function handleInitializationDataInputBlur(): void {
  isInitializationDataInputDirty.value = true;
}

const delegateeAddress = computed(() => {
  if (selectedDelegationType.value === KERNEL_V3) {
    return KERNEL_V3_IMPLEMENTATION_ADDRESS;
  }
  return delegateeAddressInput.value;
});
const initializationData = computed(() => {
  if (selectedDelegationType.value === KERNEL_V3) {
    const account = address.value;
    if (!account) {
      return '0x';
    }
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            {
              internalType: 'ValidationId',
              name: '_rootValidator',
              type: 'bytes21',
            },
            {
              internalType: 'contract IHook',
              name: 'hook',
              type: 'address',
            },
            {
              internalType: 'bytes',
              name: 'validatorData',
              type: 'bytes',
            },
            {
              internalType: 'bytes',
              name: 'hookData',
              type: 'bytes',
            },
            {
              internalType: 'bytes[]',
              name: 'initConfig',
              type: 'bytes[]',
            },
          ],
          name: 'initialize',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      functionName: 'initialize',
      args: [
        concat(['0x01', MULTI_CHAIN_VALIDATOR_ADDRESS]),
        zeroAddress,
        account,
        '0x',
        [],
      ],
    });
  }
  return initializationDataInput.value;
});

const isValid = computed(
  () => isDelegateeAddressValid.value && isInitializationDataValid.value,
);

const isDelegating = ref(false);
async function delegate(): Promise<void> {
  if (!isValid.value) {
    isDelegateeAddressInputDirty.value = true;
    isInitializationDataInputDirty.value = true;
    return;
  }
  const data = initializationData.value
    ? (initializationData.value as Hex)
    : '0x';
  isDelegating.value = true;
  await providerDelegate(delegateeAddress.value as Address, data, () => {
    isDelegating.value = false;
    openHomePage();
  });
}

function openHomePage(): void {
  router.push({
    name: 'home',
  });
}
</script>

<style scoped>
ul {
  margin: 0;
  padding-left: 16px;
}
</style>
