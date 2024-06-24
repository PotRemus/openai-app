import { ref, defineComponent } from 'vue'
import Chat from '@/components/chat/chat.vue'
import Menu from '@/components/menu/menu.vue'
import Settings from '@/components/settings/settings.vue'
import dataService, { DataThread } from '@/services/data-service';
import openaiService from './services/openai-service';

export default defineComponent({
    components: { Chat, Menu, Settings },
    setup() {
        const threadId = ref(dataService.getSelectedThreadId() ?? '');
        const isMenuOpen = ref(false)
        const isSettingsOpen = ref(false)
        const language = ref(dataService.language);

        document.getElementsByTagName('html')[0].setAttribute('lang', language.value.code);

        function toogleMenu() {
            isMenuOpen.value = !isMenuOpen.value
        }

        function openSettings() {
            isSettingsOpen.value = true
        }

        function closeSettings() {
            isSettingsOpen.value = false
        }

        function addThread(newThread: DataThread) {
            threadId.value = newThread.id
            dataService.setSelectedThreadId(newThread.id)
            dataService.setThread(newThread)
        }

        async function selectThread(selectedThreadId?: string) {
            if (selectedThreadId) {
                const thread = await dataService.getThread(selectedThreadId)
                if (thread) {
                    dataService.setSelectedThreadId(selectedThreadId ?? '')
                } else {
                    selectedThreadId = '';
                }
            }
            threadId.value = selectedThreadId ?? '';
        }

        async function openThread(selectedThreadId?: string) {
            isMenuOpen.value = false
            selectThread(selectedThreadId);
        }

        dataService.getSetting("apiKey").then(async (value) => {
            if (!value) {
                isSettingsOpen.value = true
            } else {
                await openaiService.init();
            }
        });

        return {
            language,
            openThread,
            selectThread,
            addThread,
            threadId,
            isMenuOpen,
            isSettingsOpen,
            toogleMenu,
            openSettings,
            closeSettings
        }
    }
})