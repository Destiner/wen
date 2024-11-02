<template>
  <WenPage
    title="Connection Request"
    subtitle="Allow the app to access your account"
  >
    <template #default>
      <DetailsView :sender>
        <template #details>
          <ul>
            <li>Can see your wallet address</li>
          </ul>
        </template>
      </DetailsView>
    </template>

    <template #footer>
      <ActionList
        @allow="allow"
        @deny="deny"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import WenPage from '@/components/__common/WenPage.vue';
import ActionList from '@/components/__common/request/ActionList.vue';
import DetailsView from '@/components/__common/request/DetailsView.vue';
import { useProvider } from '@/composables/useProvider';

const {
  sender,
  allowAccountRequest: providerAllow,
  denyAccountRequest: providerDeny,
} = useProvider();

function allow(): void {
  providerAllow();
  window.close();
}

function deny(): void {
  providerDeny();
  window.close();
}
</script>

<style scoped>
ul {
  padding-left: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
