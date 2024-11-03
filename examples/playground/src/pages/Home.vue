<template>
  <div class="account">
    <template v-if="!isConnected">
      <p>Not connected</p>
      <button @click="openConnectorDialog">Connect</button>
    </template>
    <template v-else>
      <p>Connected</p>
      <button @click="handleDisconnectClick">Disconnect</button>
      <p>Address: {{ accountAddress }}</p>
      <template v-if="!delegateeAddress">
        <p>Not delegating</p>
      </template>
      <template v-else>
        <p>Delegating to: {{ delegateeAddress }}</p>
        <template v-if="delegateeAddress !== KERNEL_V3_IMPLEMENTATION_ADDRESS">
          <p>Delegatee not supported: please delegate to Kernel V3</p>
        </template>
        <template v-else-if="!isInitialized">
          <p>Not initialized: please initialize the account first</p>
        </template>
        <template v-else-if="!hasValidRootValidator">
          <p>Not a valid root validator: please use multi-chain validator</p>
        </template>
        <template v-else-if="!isValidOwner">
          <p>Not the owner of the root validator</p>
        </template>
        <template v-else>
          <p>Account is ready</p>
        </template>
      </template>
    </template>
  </div>
  <div class="actions">
    <button @click="handleSendTransactionClick">Send test transaction</button>
  </div>
  <DialogConnectors
    v-model:model-value="isDialogConnectorsOpen"
    @select="handleConnectorSelect"
  />
</template>

<script setup lang="ts">
import {
  Connector,
  useAccount,
  useBytecode,
  useConnect,
  useDisconnect,
  useReadContract,
  useSendTransaction,
} from '@wagmi/vue';
import { Address, slice, zeroAddress } from 'viem';
import { odysseyTestnet } from 'viem/chains';
import { computed, ref } from 'vue';

import kernelMultiChainValidatorAbi from '@/abi/kernelMultiChainValidator';
import kernelV3ImplementationAbi from '@/abi/kernelV3Implementation';
import DialogConnectors from '@/components/DialogConnectors.vue';

const connectedAccount = useAccount();
const accountCodeResult = useBytecode({
  address: connectedAccount.address,
});
const { connect } = useConnect();
const { disconnect } = useDisconnect();
const { sendTransactionAsync } = useSendTransaction();

const KERNEL_V3_IMPLEMENTATION_ADDRESS =
  '0x94f097e1ebeb4eca3aae54cabb08905b239a7d27';
const KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS =
  '0x02d32f9c668c92a60b44825c4f79b501c0f685da';

const isConnected = computed(() => connectedAccount.isConnected.value);
const accountAddress = computed(() => connectedAccount.address.value);
const delegateeAddress = computed<Address | null>(() => {
  if (!accountCodeResult.data.value) {
    return null;
  }
  if (!accountCodeResult.data.value.startsWith('0xef0100')) {
    return null;
  }
  if (accountCodeResult.data.value.length !== 48) {
    return null;
  }
  return slice(accountCodeResult.data.value, 3, 3 + 20);
});

const rootValidatorResult = useReadContract({
  address: accountAddress,
  abi: kernelV3ImplementationAbi,
  functionName: 'rootValidator',
});
const isInitialized = computed(() => rootValidatorResult.data.value !== '0x');
const hasValidRootValidator = computed(() => {
  if (!isInitialized.value) {
    return false;
  }
  return (
    rootValidatorResult.data.value ===
    `0x01${KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS.slice(2)}`
  );
});

const validatorStorage = useReadContract({
  address: KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS,
  abi: kernelMultiChainValidatorAbi,
  functionName: 'ecdsaValidatorStorage',
  args: [accountAddress.value || zeroAddress],
});
const isValidOwner = computed(() => {
  if (!hasValidRootValidator.value) {
    return false;
  }
  return validatorStorage.data.value === accountAddress.value;
});

const isDialogConnectorsOpen = ref(false);
function openConnectorDialog(): void {
  isDialogConnectorsOpen.value = true;
}
async function handleConnectorSelect(connector: Connector): Promise<void> {
  isDialogConnectorsOpen.value = false;
  connect({
    connector,
    chainId: odysseyTestnet.id,
  });
}
async function handleDisconnectClick(): Promise<void> {
  disconnect();
}

async function handleSendTransactionClick(): Promise<void> {
  await sendTransactionAsync({
    to: accountAddress.value,
    value: 0n,
  });
}
</script>
