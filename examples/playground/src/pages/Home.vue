<template>
  <div class="page">
    <div class="content">
      <div class="account">
        <template v-if="!isConnected">
          <div>Connect a wallet to get started</div>
          <div>
            <PlayButton
              type="primary"
              @click="openConnectorDialog"
            >
              Connect
            </PlayButton>
          </div>
        </template>
        <template v-else>
          <div>
            <PlayButton
              type="secondary"
              @click="handleDisconnectClick"
            >
              Disconnect
            </PlayButton>
          </div>
          <div class="data-row">
            <div class="label">Account</div>
            <div class="value">{{ accountAddress }}</div>
          </div>

          <div
            class="data-row"
            :class="{ invalid: !isValidDelegatee }"
          >
            <div class="label">Delegatee</div>
            <div class="value">
              <template v-if="isValidDelegatee">
                {{ delegateeAddress }}
              </template>
              <template v-else-if="delegateeAddress">
                {{ delegateeAddress }} (not supported, please delegate to Kernel
                V3)
              </template>
              <template v-else> Not delegating </template>
            </div>
          </div>

          <div
            v-if="isValidDelegatee"
            class="data-row"
            :class="{ invalid: !isInitialized }"
          >
            <div class="label">Is initialized?</div>
            <div class="value">
              <template v-if="isInitialized">Yes</template>
              <template v-else>
                No: please initialize the account first
              </template>
            </div>
          </div>

          <div
            v-if="isInitialized"
            class="data-row"
            :class="{ invalid: !hasValidRootValidator }"
          >
            <div class="label">Has valid root validator?</div>
            <div class="value">
              <template v-if="hasValidRootValidator">Yes</template>
              <template v-else> No: please use multi-chain validator </template>
            </div>
          </div>

          <div
            v-if="hasValidRootValidator"
            class="data-row"
            :class="{ invalid: !isValidOwner }"
          >
            <div class="label">Is valid owner?</div>
            <div class="value">
              <template v-if="isValidOwner">Yes</template>
              <template v-else> No: please make your EOA an owner </template>
            </div>
          </div>
        </template>
      </div>
      <div class="actions">
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
      </div>
    </div>
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
import IconArrowTopRight from '@/components/IconArrowTopRight.vue';
import PlayButton from '@/components/PlayButton.vue';
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
const isInitialized = computed(
  () =>
    rootValidatorResult.data.value !== undefined &&
    rootValidatorResult.data.value !== '0x',
);
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

const isPending = ref(false);

const txHash = ref<Hex | null>(null);
async function handleSendTransactionClick(): Promise<void> {
  isPending.value = true;
  try {
    const hash = await sendTransactionAsync({
      to: accountAddress.value,
      value: 0n,
    });
    txHash.value = hash;
  } catch {
    // Ignore
  }
  isPending.value = false;
}

const opHash = ref<Hex | null>(null);
const opTxHash = ref<Hex | null>(null);
async function handleSendUserOpClick(): Promise<void> {
  isPending.value = true;
  const hash = await sendUserOp();
  if (!hash) {
    isPending.value = false;
    return;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const txHash = await getOpTxHash(bundlerClient, hash);
  isPending.value = false;
  opHash.value = hash;
  opTxHash.value = txHash;
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

function getBlockExplorerTxUrl(hash: Hex): string {
  const chain = odysseyTestnet;
  const explorerUrl = chain.blockExplorers.default.url;
  return `${explorerUrl}/tx/${hash}`;
}
</script>

<style scoped>
.page {
  display: flex;
  align-items: start;
  justify-content: center;
  min-height: 100vh;
  margin: 32px 16px;
  background: #f3f4ef;
}

@media (width >= 768px) {
  .page {
    align-items: center;
    margin: 0;
  }
}

.content {
  display: flex;
  flex-direction: column;
  width: 640px;
  max-width: 100%;
  padding: 8px;
  border: 1px solid #dadbd2;
  border-radius: 6px;
  background: #fff;
  gap: 24px;
}

.account {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: flex;
  gap: 2px;
  flex-direction: column;

  .value {
    overflow: hidden;
    color: #111;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.invalid {
    .value {
      color: #db3807;
    }
  }

  .label {
    color: #737373;
    font-size: 12px;
  }
}

.actions {
  display: flex;
  gap: 8px;
  flex-direction: column;

  .action {
    display: flex;
    gap: 2px;
    flex-direction: column;

    .action-result {
      display: inline-flex;
      padding: 6px 10px;
      border: 1px solid #dadbd2;
      border-radius: 6px;
      background: #e5e7e0;
      font-family: Consolas, Inconsolata, monospace;
      font-size: 13px;
      gap: 4px;

      .icon {
        width: 16px;
        height: 16px;
        color: #111;
      }
    }
  }
}
</style>
