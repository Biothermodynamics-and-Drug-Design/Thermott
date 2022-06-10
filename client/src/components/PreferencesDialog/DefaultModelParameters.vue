<template>
  <div>
    <v-btn v-if="!editMode" small depressed outlined @click="startEdit">
      <v-icon class="mr-2" small v-text="'mdi-pencil'" />
      Default binding model temp. (<i>T</i><sub>0</sub>): {{ " " + defaultModelParameters.DefaultBindingModelT0 }}°C
    </v-btn>
    <v-card v-else class="pa-2 ma-0" elevation="0" outlined>
      <v-form v-model="form">
        <div class="d-flex align-center">
          <v-text-field
            v-model.number="temp_DefaultBindingModelT0"
            label="Default binding model temp."
            suffix="°C"
            outlined
            dense
            hide-details
            :rules="temperatureRules"
          />
          <v-btn small icon @click="cancelEdit"><v-icon color="error">mdi-close</v-icon></v-btn>
          <v-btn small icon @click="confirmEdit"><v-icon color="success">mdi-check-bold</v-icon></v-btn>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script lang="ts">
import { useAppSettings } from "@/store";
import { SaveAppSetting_LocalStorage } from "@/utils/localStorage";
import { defineComponent, computed, ref, Ref } from "@vue/composition-api";
import { validationRules } from "@/utils/validationRules";

export default defineComponent({
  setup() {
    const appSettings = useAppSettings();

    const editMode = ref(false);
    const form = ref(false);
    const temp_DefaultBindingModelT0: Ref<number> = ref(null);

    const defaultModelParameters = computed(() => appSettings.DefaultModelParameters);

    const startEdit = () => {
      editMode.value = true;
      temp_DefaultBindingModelT0.value = defaultModelParameters.value.DefaultBindingModelT0;
    };
    const cancelEdit = () => {
      editMode.value = false;
      temp_DefaultBindingModelT0.value = 0;
    };
    const confirmEdit = () => {
      editMode.value = false;
      defaultModelParameters.value.DefaultBindingModelT0 = temp_DefaultBindingModelT0.value;
      temp_DefaultBindingModelT0.value = null;
      SaveAppSetting_LocalStorage();
    };

    const temperatureRules = [validationRules.exists, validationRules.positiveNumber];

    return { editMode, startEdit, cancelEdit, confirmEdit, defaultModelParameters, temp_DefaultBindingModelT0, form, temperatureRules };
  },
});
</script>
