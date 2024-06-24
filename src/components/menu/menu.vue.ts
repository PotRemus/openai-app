import { defineComponent, reactive, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataThread, Language } from '@/services/data-service';
import openaiService from '@/services/openai-service';

export default defineComponent({
    props: {
        threadId: {
            type: String
        },
        language: {
            type: Object,
            required: true
        }
    },
    emits: ['select-thread', 'open-thread', 'open-settings'],
    setup(props, { emit }) {
        const { t } = useI18n()
        const language = computed(() => props.language as Language)
        const isLoading = ref(true);

        function openChat(threadId?: string) {
            emit('open-thread', threadId);
        }
        const threads = reactive<DataThread[]>([])
        async function reloadThread() {
            isLoading.value = true;
            const items = await openaiService.getThreads()
            threads.splice(0, threads.length);
            items.sort((a, b) => {
                return b.createdDate.getTime() - a.createdDate.getTime();
            }).forEach((thread) => {
                threads.push(thread);
            });
            isLoading.value = false;
        }
        reloadThread();
        const threadByTime = computed(() => {
            const result: ThreadByTimeModel[] = [];
            const aggThreads: { [date: string]: ThreadModel[] } = {};
            const last30Days = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
            const currentYear = new Date().getFullYear();
            threads.forEach((thread) => {
                let dateKey: string;
                if (thread.createdDate > last30Days) {
                    dateKey = "day30"
                } else {
                    const year = thread.createdDate.getFullYear();
                    if (year === currentYear) {
                        dateKey = thread.createdDate.toLocaleDateString(language.value.code, {
                            month: 'long'
                        });
                    } else {
                        dateKey = thread.createdDate.toLocaleDateString(language.value.code, {
                            month: 'long',
                            year: 'numeric'
                        });
                    }

                }
                if (!aggThreads[dateKey]) {
                    aggThreads[dateKey] = [];
                }
                aggThreads[dateKey].push({
                    id: thread.id,
                    title: thread.title || t('menu.thread-empty-title'),
                    data: thread,
                    isSelected: props.threadId === thread.id
                });
            });
            Object.keys(aggThreads).forEach((key) => {
                const threads = aggThreads[key];
                if (key == "day30") {
                    result.push({
                        date: t('menu.previous-30-days'),
                        items: threads
                    });
                } else {
                    result.push({
                        date: key,
                        items: threads
                    });
                }
            })
            return result;
        })

        async function removeThread(thread: ThreadModel) {
            const isConfirm = await window.confirm(t('menu.confirm-delete-thread', { title: thread.title }));
            if (thread && isConfirm) {
                isLoading.value = true;
                await openaiService.deleteThread(thread.data);
                if (props.threadId === thread.id) {
                    emit('select-thread');
                }
                await reloadThread();
            }
        }

        function openSettings() {
            emit('open-settings');
        }

        return {
            isLoading,
            openSettings,
            removeThread,
            openChat,
            threadByTime
        }
    }
})

interface ThreadByTimeModel {
    date: string;
    items: ThreadModel[];
}

interface ThreadModel {
    id: string;
    title: string;
    data: DataThread;
    isSelected: boolean;
}