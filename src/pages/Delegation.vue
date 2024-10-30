<template>
  <button @click="openHomePage">← Back</button>
  <div>Delegate your EOA to a smart contract</div>
  <select v-model="selectedDelegationType">
    <option
      v-for="option in delegationTypes"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
  <template v-if="selectedDelegationType === CUSTOM">
    <input
      v-model="delegateeAddressInput"
      placeholder="Delegatee address"
      @blur="handleBlur"
    />
    <input
      v-model="initializationDataInput"
      placeholder="Initialization data"
      @blur="handleBlur"
    />
    <div
      v-if="!isValid && isDirty"
      class="error"
    >
      Invalid address
    </div>
  </template>
  <button @click="delegate">Delegate</button>
  <div>{{ output }}</div>
</template>

<script setup lang="ts">
import {
  Address,
  concat,
  encodeFunctionData,
  Hex,
  isAddress,
  zeroAddress,
} from 'viem';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useProvider } from '@/composables/useProvider';
import { useWallet } from '@/composables/useWallet';

const { address } = useWallet();

const KERNER_V3_IMPLEMENTATION_ADDRESS =
  '0x94F097E1ebEB4ecA3AAE54cabb08905B239A7D27';
const MULTI_CHAIN_VALIDATOR_ADDRESS =
  '0x02d32f9c668c92a60b44825c4f79b501c0f685da';

const KERNEL_V3 = 'kernel_v3';
const CUSTOM = 'custom';
const selectedDelegationType = ref(KERNEL_V3);
const delegationTypes = ref([
  { value: KERNEL_V3, label: 'Kernel V3' },
  { value: CUSTOM, label: 'Custom' },
]);

const router = useRouter();

const { delegate: providerDelegate } = useProvider();

const delegateeAddressInput = ref('');
const initializationDataInput = ref('');
const isDirty = ref(false);

const delegateeAddress = computed(() => {
  if (selectedDelegationType.value === KERNEL_V3) {
    return KERNER_V3_IMPLEMENTATION_ADDRESS;
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
      ],
    });
  }
  return initializationDataInput.value;
});

function isHex(value: string): boolean {
  return /^0x[0-9a-fA-F]*$/.test(value);
}

const isValid = computed(
  () =>
    isAddress(delegateeAddress.value) &&
    (initializationData.value === '' || isHex(initializationData.value)),
);

const output = ref('');

async function delegate(): Promise<void> {
  if (!isValid.value) {
    isDirty.value = true;
    return;
  }
  const data = initializationData.value
    ? (initializationData.value as Hex)
    : '0x';
  await providerDelegate(
    delegateeAddress.value as Address,
    data,
    (txHash: Hex | null) => {
      output.value = `Delegated to ${delegateeAddress.value} with tx hash ${txHash}`;
    },
  );
}

function handleBlur(): void {
  isDirty.value = true;
}

function openHomePage(): void {
  router.push({
    name: 'home',
  });
}
</script>
