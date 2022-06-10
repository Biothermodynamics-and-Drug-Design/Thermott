import Vue from "vue";

import VueCompositionAPI from "@vue/composition-api";
Vue.use(VueCompositionAPI);

import App from "./App.vue";

import router from "./router";
//import vuetify from './plugins/vuetify';

//Registering ChartJS components for treeshaking
import { Chart, ScatterController, LinearScale, PointElement, LineElement, LogarithmicScale, Tooltip, Legend, Filler } from "chart.js";
Chart.register([ScatterController, LinearScale, LogarithmicScale, PointElement, LineElement, Tooltip, Legend, Filler]);

import { notify } from "./components/Generic/GlobalSnackbarStore";
// import { store } from "./store";
import "./global.css";

import { InitLocalStorage } from "./utils/localStorage";
import Vuetify from "vuetify";
import colors from "vuetify/lib/util/colors";

import { useAppData, useAppSettings } from "./store";

Vue.use(Vuetify);

Vue.config.productionTip = false;

const vuetify_instance = new Vuetify({
  theme: {
    options: { customProperties: true },
    themes: {
      light: {
        primary: colors.indigo.darken2,
        secondary: colors.grey.darken2,
        accent: colors.blueGrey.base,
        error: colors.red.base,
      },
      dark: {
        primary: colors.indigo.darken2,
        secondary: colors.grey.darken2,
        accent: colors.blueGrey.base,
        error: colors.red.base,
      },
    },
  },
});

const app = new Vue({
  router,
  vuetify: vuetify_instance,

  render: (h) => h(App),
}).$mount("#app");

const cypress = (window as any).Cypress;

if (cypress) {
  cypress.app = { appData: useAppData(), appSettings: useAppSettings() };
  console.log(cypress);
}

const useRouter = () => app.$router;
const useRoute = () => app.$route;

export { useRouter, useRoute };

InitLocalStorage(); //Loads session from LocalStorage(usually IndexedDB)
Vue.use(notify);
