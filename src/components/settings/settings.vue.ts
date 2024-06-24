import dataService from '@/services/data-service';
import openaiService from '@/services/openai-service';
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
    props: {
        isOpen: {
            type: Boolean,
            required: true
        }
    },
    emits: ['close'],
    setup(_, { emit }) {
        const i18n = useI18n();
        const languages = ref(dataService.languages);
        let language = ref(dataService.language);
        let apiKey = ref('');
        let originalApiKey = ref('');
        dataService.getSetting("apiKey").then((value) => {
            apiKey.value = value;
            originalApiKey.value = value;
        })

        async function submitSettings(e: Event) {
            await dataService.setSetting("apiKey", apiKey.value);
            if (apiKey.value !== originalApiKey.value) {
                if (apiKey.value) {
                    await dataService.setSetting("assistantId", '');
                    await openaiService.init();
                }
                originalApiKey.value = apiKey.value;
            }
            await dataService.setLanguage(language.value);
            i18n.locale.value = language.value.langCode;
            if (apiKey.value) {
                close(e);
            }
        }

        const hasApiKey = computed(() => originalApiKey.value ? true : false);

        function close(e: Event) {
            emit('close', e);
        }

        async function cancel(e: MouseEvent) {
            apiKey.value = await dataService.getSetting("apiKey") ?? '';
            language.value = dataService.language;
            if(apiKey.value) {
                close(e);
            }
        }

        return {
            hasApiKey,
            submitSettings,
            apiKey,
            language,
            languages,
            close,
            cancel
        };
    }
})