<template>
  <v-form v-model="form" class="d-flex flex-column align-center">
    <v-sheet outlined rounded class="pa-2 ma-3">Database BVTS</v-sheet>
    <div class="d-flex flex-row align-center">
      
      <v-text-field
v-model="auth.username" outlined type="text" autocomplete="username" label="Username" :rules="loginRules" placeholder=" "
        persistent-placeholder />
      <v-text-field
v-model="auth.password" outlined type="password" autocomplete="current-password" label="Password" class="mx-2"
        :rules="loginRules" placeholder=" " persistent-placeholder />

    </div>
    <div class="d-flex flex-row justify-space-between">
      <v-btn depressed class="mx-2" color="primary" small :loading="loading" :disabled="loading" @click="testLogin">Login</v-btn>
    </div>

    <v-spacer />
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from "@vue/composition-api";
import { Auth } from "@/components/DatabaseTab/database";
import {validationRules as rules}from "@/utils/validationRules";
import {TestLogin} from "../../databaseFunc";
import { Notify } from "@/components/Generic/GlobalSnackbarStore";

export default defineComponent({
  props: { auth: Object as PropType<Auth>, login: Boolean },
  emits: ["update:login"],
  setup(props, {emit}) {
    const form = ref(false);
    const loginRules = [rules.exists];
    const loading = ref(false);

    const testLogin = async () => {
      loading.value = true;
      const res = await TestLogin("plbd/BVTS", props.auth);
      loading.value = false;
      if (res) emit("update:login", true);
      else Notify("Failed login", "error", 5_000);
    }
    return { loading, loginRules, testLogin, form };
  },
});
</script>
