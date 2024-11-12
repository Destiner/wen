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
        :disabled="isDelegating || isUndelegating"
      />
      <template v-if="selectedDelegationType === CUSTOM">
        <WenInput
          v-model="delegateeAddressInput"
          label="Delegatee address"
          placeholder="0x…"
          :is-valid="isDelegateeAddressShownValid"
          error-text="Invalid address"
          @blur="handleDelegateeAddressInputBlur"
        />

        <WenInput
          v-model="initializationDataInput"
          label="Initialization data"
          placeholder="0x…"
          :is-valid="isInitializationDataShownValid"
          error-text="Invalid data"
          @blur="handleInitializationDataInputBlur"
        />
      </template>
      <WenToggle
        v-model:model-value="isSequencerSponsorshipEnabled"
        label="Sequencer Sponsorship"
        :disabled="isDelegating || isUndelegating"
      />
    </template>

    <template #footer>
      <WenInfoBlock
        v-if="isValid"
        type="info"
      >
        <template #default>
          <ul>
            <li>
              Your EOA will be delegated to
              {{ formatAddress(delegateeAddress as Address, 20) }}
            </li>
            <li v-if="!isAlreadyInitialized">
              Your EOA will be the owner of the delegated smart account
            </li>
          </ul>
        </template>
      </WenInfoBlock>
      <WenButton
        v-if="delegation"
        type="secondary"
        size="large"
        label="Remove Delegation"
        :disabled="isUndelegating"
        @click="removeDelegation"
      />
      <WenInfoBlock
        v-if="!isValid"
        type="error"
      >
        <template #default> {{ errorText }} </template>
      </WenInfoBlock>
      <WenButton
        type="primary"
        size="large"
        label="Delegate"
        :disabled="isDelegating || !isValid"
        @click="delegate"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import {
  Address,
  concat,
  createPublicClient,
  encodeFunctionData,
  Hex,
  http,
  isAddress,
  isHex,
  size,
  slice,
  zeroAddress,
  zeroHash,
} from 'viem';
import { getCode, getStorageAt } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import WenButton from '@/components/__common/WenButton.vue';
import WenInfoBlock from '@/components/__common/WenInfoBlock.vue';
import WenInput from '@/components/__common/WenInput.vue';
import WenPage from '@/components/__common/WenPage.vue';
import WenSelect from '@/components/__common/WenSelect.vue';
import WenToggle from '@/components/__common/WenToggle.vue';
import { useProvider } from '@/composables/useProvider';
import { useWallet } from '@/composables/useWallet';
import {
  DELEGATION_HEADER,
  KERNEL_V3_IMPLEMENTATION_ADDRESS,
  MULTI_CHAIN_VALIDATOR_ADDRESS,
  KERNEL_V3_VALIDATION_MANAGER_STORAGE_SLOT,
} from '@/utils/consts';
import { formatAddress } from '@/utils/formatting';

const router = useRouter();

const { delegate: providerDelegate, undelegate: providerUndelegate } =
  useProvider();
const { address } = useWallet();

const wallet = useWallet();

const walletAddress = computed(() => wallet.address.value);

const KERNEL_V3 = 'kernel_v3';
const CUSTOM = 'custom';
const selectedDelegationType = ref(KERNEL_V3);
const delegationTypes = ref([
  { value: KERNEL_V3, label: 'Kernel V3' },
  { value: CUSTOM, label: 'Custom' },
]);

const delegation = ref<Address | null>(null);
const isAlreadyInitialized = ref(false);
onMounted(async () => {
  fetchDelegation();
  fetchInitialization();
});
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
async function fetchInitialization(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  const client = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  if (selectedDelegationType.value !== KERNEL_V3) {
    return;
  }
  const validationStorage = await getStorageAt(client, {
    address: walletAddress.value,
    slot: KERNEL_V3_VALIDATION_MANAGER_STORAGE_SLOT,
  });
  isAlreadyInitialized.value = validationStorage !== zeroHash;
}

const delegateeAddressInput = ref('');
const initializationDataInput = ref('');
const isDelegateeAddressInputDirty = ref(false);
const isInitializationDataInputDirty = ref(false);

const isDelegateeAddressValid = computed(() =>
  isAddress(delegateeAddress.value),
);
const isDelegateeAddressShownValid = computed(
  () => !isDelegateeAddressInputDirty.value || isDelegateeAddressValid.value,
);
const isInitializationDataValid = computed(() =>
  isHex(initializationData.value),
);
const isInitializationDataShownValid = computed(
  () =>
    !isInitializationDataInputDirty.value || isInitializationDataValid.value,
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
    if (isAlreadyInitialized.value) {
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

const isSameAsCurrentDelegation = computed(
  () => delegation.value === delegateeAddress.value,
);

const isValid = computed(
  () =>
    isDelegateeAddressValid.value &&
    isInitializationDataValid.value &&
    !isSameAsCurrentDelegation.value,
);

const errorText = computed(() => {
  if (!isDelegateeAddressValid.value) {
    return 'Invalid address';
  }
  if (!isInitializationDataValid.value) {
    return 'Invalid data';
  }
  if (isSameAsCurrentDelegation.value) {
    return 'Already delegated to this address';
  }
  return '';
});

const isDelegating = ref(false);
const isSequencerSponsorshipEnabled = ref(false);
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
  await providerDelegate(
    delegateeAddress.value as Address,
    data,
    isSequencerSponsorshipEnabled.value,
    (txHash) => {
      isDelegating.value = false;
      if (txHash) {
        openHomePage();
      }
    },
  );
}
const isUndelegating = ref(false);
async function removeDelegation(): Promise<void> {
  isUndelegating.value = true;
  await providerUndelegate(isSequencerSponsorshipEnabled.value, (txHash) => {
    isUndelegating.value = false;
    if (txHash) {
      openHomePage();
    }
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
