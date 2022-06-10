import Vue from "vue";
import { AppData, AppSettings } from "./models";
// import _Vue from "vue";
// import * as Models from './models';


const appData = Vue.observable(new AppData() )
const appSettings = Vue.observable(new AppSettings());

const useAppData = () => appData;
const useAppSettings = () => appSettings;

export {useAppData, useAppSettings};
// export function store(Vue: typeof _Vue): void {
//     Vue.prototype.$appData = Vue.observable(new Models.AppData());
//     Vue.prototype.$appSettings = Vue.observable(new Models.AppSettings());
//   }        

//   declare module 'vue/types/vue' {
//     interface Vue {
//       $appData: Models.AppData;
//     }
//   }

//   declare module 'vue/types/vue' {
//     interface Vue {
//       $appSettings: Models.AppSettings;
//     }
//   }


