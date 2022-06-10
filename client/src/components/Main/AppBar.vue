<template>
  <v-system-bar
    height="30"
    color="grey lighten-4"
    style="border-bottom-width: 1px; border-color: #bdbdbd !important; border-bottom-style: solid"
  >
    <router-link to="/Start" style="text-decoration: none">
      <div class="mx-4 text-h6 indigo--text text--darken-4 font-weight-bold text-decoration-none" to="/Start">
        <div>Thermott</div>
      </div>
    </router-link>
    <v-btn depressed height="30" tile small text color="black" class="mx-1" @click="deleteLocalStorage">
      <v-icon color="black" dense class="mr-2">mdi-file-document-outline</v-icon>New
    </v-btn>
    <v-btn depressed height="30" tile small text color="black" class="mx-1" @click="$emit('loadSession')">
      <v-icon dense color="black" class="mr-2">mdi-folder-open</v-icon>
      Load
    </v-btn>
    <v-btn depressed height="30" tile small text color="black" class="mx-1" @click="$emit('saveSessionDialog')">
      <v-icon dense color="black" class="mr-2">mdi-download</v-icon>
      Download
    </v-btn>
    <v-spacer />
    <v-btn depressed height="30" tile small text color="black" class="mx-1" @click="$emit('sessionDialog')"
      ><v-icon class="mr-2">mdi-information-outline</v-icon>Session: {{ sessionDisplayName }}</v-btn
    >
    <v-spacer />
    <v-btn depressed height="30" tile small text color="black" class="mx-1" target="_blank" href="/documentation/">
      <v-icon dense color="black" class="mr-2">mdi-book-open-variant</v-icon>
      Documentation
    </v-btn>
    <v-btn depressed height="30" tile small text color="black" class="mx-1" @click="$emit('preferencesDialog')">
      <v-icon dense color="black" class="mr-2">mdi-cog</v-icon>
      Settings
    </v-btn>
  </v-system-bar>
</template>

<script lang="ts">
import { useAppData } from "@/store";
import { defineComponent, computed } from "@vue/composition-api";
import { useConfirm } from "@/components/Generic/confirmdialog";
import { SaveAppData_LocalStorage, Delete_AppData } from "../../utils/localStorage";

export default defineComponent({
  setup() {
    const appData = useAppData();

    const confirm = useConfirm();

    const sessionDisplayName = computed(() => {
      if (appData.sessionInfo.name != null && appData.sessionInfo.name.trim().length > 0) {
        return appData.sessionInfo.name;
      } else {
        return "untitled";
      }
    });

    const deleteLocalStorage = async () => {
      const res = (await confirm({ text: "Do you want to start a new session?<br>(All current data will be deleted)" })) as boolean;
      if (!res) return;
      Delete_AppData();
      await SaveAppData_LocalStorage();
    };

    return { sessionDisplayName, deleteLocalStorage };
  },
});
</script>
