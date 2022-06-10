import Vue from "vue";
import { useAppData } from "@/store";
import { useRouter } from "@/main";

// export function demo(Vue: typeof _Vue): void {
//     Vue.prototype.$demo = Vue.observable(new Demo);
//   }

//   declare module 'vue/types/vue' {
//     interface Vue {
//       $demo: Demo
//     }
//   }

export const demo = Vue.observable({
  // showSnackbar: false,
  // color: "info",
  // timeout: -1,
  // text: "",
  state: false,
  step: 1,
});

// class Demo {
//   //state: boolean = false;
//   state = true;
//   step = 0;
// }

export function demoEvent(event_name: string) {
  const appData = useAppData();
  switch (event_name) {
    case "uploadDialogOpened":
      demo.step = 2;
      break;
    case "uploadDialogClosed":
      if (appData.experimentWells.length > 0) demo.step = 3;
      break;
    case "newBindingExperimentDialogOpened":
      demo.step = 5;
      break;
    default:
      break;
  }
}

export function startDemo() {
  demo.step = 1;
  demo.state = true;
  useRouter().push("/RawData");
}

export function endDemo() {
  demo.state = false;
  demo.step = 1;
}
