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
        <template v-if="!isValidDelegatee">
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
  <div
    v-if="isValidOwner"
    class="actions"
  >
    <button @click="handleSendTransactionClick">Send test transaction</button>
    <button @click="handleSendUserOpClick">Send test user operation</button>
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
  useSignMessage,
} from '@wagmi/vue';
import {
  Address,
  concat,
  createPublicClient,
  Hex,
  http,
  slice,
  zeroAddress,
} from 'viem';
import {
  createBundlerClient,
  createPaymasterClient,
  entryPoint07Address,
} from 'viem/account-abstraction';
import { odysseyTestnet } from 'viem/chains';
import { computed, ref, watch } from 'vue';

import kernelMultiChainValidatorAbi from '@/abi/kernelMultiChainValidator';
import kernelV3ImplementationAbi from '@/abi/kernelV3Implementation';
import DialogConnectors from '@/components/DialogConnectors.vue';
import useEnv from '@/composables/useEnv';
import {
  Execution,
  getOpHash,
  getOpTxHash,
  prepareOp,
  submitOp,
} from '@/utils/aa';

const { bundlerRpc, paymasterRpc } = useEnv();

const connectedAccount = useAccount();
const accountCodeResult = useBytecode({
  address: connectedAccount.address,
});
const { connect } = useConnect();
const { disconnect } = useDisconnect();
const { sendTransactionAsync } = useSendTransaction();
const { signMessageAsync } = useSignMessage();

const KERNEL_V3_IMPLEMENTATION_LEGACY_ADDRESS =
  '0x94f097e1ebeb4eca3aae54cabb08905b239a7d27';
const KERNEL_V3_IMPLEMENTATION_ADDRESS =
  '0x21523eaa06791d2524eb2788af8aa0e1cfbb61b7';
const KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS =
  '0x02d32f9c668c92a60b44825c4f79b501c0f685da';
const KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID = concat([
  '0x01',
  KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS,
]);

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
const isValidDelegatee = computed(() => {
  if (delegateeAddress.value === KERNEL_V3_IMPLEMENTATION_ADDRESS) {
    return true;
  }
  if (delegateeAddress.value === KERNEL_V3_IMPLEMENTATION_LEGACY_ADDRESS) {
    return true;
  }
  return false;
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
  return rootValidatorResult.data.value === KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID;
});

const ecdsaValidatorStorageAddress = computed(() => {
  if (!accountAddress.value) {
    return zeroAddress;
  }
  return accountAddress.value;
});
const validatorStorage = useReadContract({
  address: KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS,
  abi: kernelMultiChainValidatorAbi,
  functionName: 'ecdsaValidatorStorage',
  args: [ecdsaValidatorStorageAddress],
});
watch(accountAddress, () => {
  validatorStorage.refetch();
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

async function handleSendUserOpClick(): Promise<void> {
  const opHash = await sendUserOp();
  if (!opHash) {
    return;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const txHash = await getOpTxHash(bundlerClient, opHash);
  if (!txHash) {
    return;
  }
}

async function sendUserOp(): Promise<null | Hex> {
  if (!accountAddress.value) {
    return null;
  }
  const paymasterClient = createPaymasterClient({
    transport: http(paymasterRpc),
  });
  const executions: Execution[] = [
    {
      target: accountAddress.value,
      value: 0n,
      callData: '0x',
    },
  ];
  const nonceKey = BigInt(KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID);
  const op = await prepareOp(
    accountAddress.value,
    paymasterClient,
    executions,
    nonceKey,
  );
  const hash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!hash) {
    throw new Error('Failed to get hash');
  }
  try {
    const signature = await signMessageAsync({
      message: {
        raw: hash,
      },
    });
    op.signature = signature;
    const publicClient = createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    });
    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(bundlerRpc),
    });
    const opHash = await submitOp(accountAddress.value, bundlerClient, op);
    return opHash;
  } catch {
    return null;
  }
}
</script>
