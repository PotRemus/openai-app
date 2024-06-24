import "purecss";
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import "@/styles/layout.less"

import { createApp } from "vue";
import { createI18n } from 'vue-i18n'
import app from "@/app.vue";
import icon from "@/components/icon/icon.vue";
import loader from "@/components/loader.vue";
import dataService from "@/services/data-service";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";
import { appDataDir } from '@tauri-apps/api/path';

dataService.initLanguage().then(async () => {
    const appDataDirPath = await appDataDir();
    console.log("appDataDirPath: ", appDataDirPath)
    console.log("language: ", window.navigator.languages)

    const i18n = createI18n({
        legacy: false,
        locale: dataService.language.langCode,
        fallbackLocale: "en",
        messages: {
            en: en,
            fr: fr
        }
    })
    createApp(app)
        .use(i18n)
        .component("icon", icon)
        .component("loader", loader)
        .mount("#app");
});