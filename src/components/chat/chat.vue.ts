import { defineComponent, ref, reactive, computed, watch, nextTick } from 'vue'
import showdown from 'showdown'
import openaiService, { ChatMessage, ChatMessageRequest, ChatUserType } from '@/services/openai-service';
import dataService, { Language } from '@/services/data-service';

export default defineComponent({
    props: {
        threadId: {
            type: String,
            required: true
        },
        language: {
            type: Object,
            required: true
        }
    },
    emits: ['add-thread'],
    setup(props, { emit }) {
        const isOpenFormAction = ref(false);
        const formInput = ref('');
        const formImages = ref<ChatImageModel[]>([]);
        const isLoading = ref(true);
        const isLoadingMessages = ref(false);
        const chatDivContainer = ref<HTMLDivElement | null>(null);
        const inputTextarea = ref<HTMLTextAreaElement | null>(null);
        const inputTextareaStyle = ref<{ height?: string }>({});
        const showdownConverter = new showdown.Converter();
        const chat = reactive<{
            messages: ChatMessage[];
            response: ChatMessage | null;
        }>({
            messages: [],
            response: null
        })

        if (props.threadId) {
            loadMessages()
        } else {
            isLoading.value = false;
        }
        watch(() => props.threadId, async () => {
            if (!isLoading.value) {
                formInput.value = '';
                formImages.value = [];
                await loadMessages()
            }
        })

        const language = computed(() => props.language as Language)

        async function submitPrompt() {
            if (canSubmitForm) {
                isLoading.value = true;
                let threadId = props.threadId;
                if (!threadId) {
                    const thread = await openaiService.createThread();
                    if (thread) {
                        threadId = thread.id;
                        emit('add-thread', thread);
                    }
                }
                if (!threadId) {
                    alert("Error to create thread");
                    return;
                }
                const thread = await dataService.getThread(threadId);
                if (!thread) {
                    alert("Error to get thread");
                    return;
                }

                const currentMessage: ChatMessage = {
                    user: ChatUserType.user,
                    date: new Date(),
                    id: chat.messages.length.toString(),
                    contents: []
                }
                if (formInput.value) {
                    const inputValue = await applyTextTransform(formInput.value);
                    currentMessage.contents.push({ id: "0", type: "text", value: inputValue });
                }
                chat.messages.push(currentMessage);
                chat.response = {
                    user: ChatUserType.assitant,
                    date: new Date(),
                    id: "0",
                    contents: []
                }
                nextTick(() => {
                    scrollBottom();
                })
                const request: ChatMessageRequest = {
                    text: computedFormInput.value,
                    fileIds: []
                }
                if (formImages.value.length > 0) {
                    for (const image of formImages.value) {
                        const base64 = image.src.split(',').slice(1).join(',');
                        const fileId = await openaiService.createFile(thread, base64, image.contentType, image.name);
                        if (fileId) {
                            request.fileIds.push(fileId);
                            currentMessage.contents.push({ 
                                id: fileId, 
                                type: "file", 
                                value: `<img src="${image.src}" />` 
                            });
                        }
                    }
                }
                const message = await openaiService.postThreadMessage(thread, request, appendMessage);
                if (message) {
                    for (const content of message.contents) {
                        if (content.type == "text") {
                            content.value = await applyTextTransform(content.value);
                        }
                    }
                    chat.messages.push(message);
                    computedFormInput.value = '';
                    formImages.value = [];
                } else {
                    alert("Error to generate response from OpenAI service");
                }
                chat.response = null;
                isLoading.value = false;
            }
        }

        async function appendMessage(index: number, type: string, value: string) {
            if (chat.response) {
                const response = chat.response
                if (response.contents.length <= index) {
                    response.contents.push({
                        id: index.toString(),
                        type: type,
                        value: ''
                    });
                }
                const content = response.contents.at(index)
                if (content) {
                    content.value += value.replaceAll('\n', '<br />');
                }
            }
        }

        const fileRegex = /(attachment)|(sandbox):\/?(file-\w+)/g
        async function applyTextTransform(value: string) {
            let result = value;
            var fileMatchs = value.matchAll(fileRegex);
            for (const fileMatch of fileMatchs) {
                const match = fileMatch[0];
                const fileId = fileMatch[3];
                const fileContent = await openaiService.getFileContent(fileId)
                if (fileContent) {
                    result = result.replace(match, `${fileContent}`);
                }
            }
            if (result) {
                result = showdownConverter.makeHtml(result);
            }
            return result;
        }


        async function loadMessages() {
            chat.response = null;
            chat.messages = [];
            if (props.threadId) {
                isLoading.value = true;
                isLoadingMessages.value = true;
                const messages = await openaiService.getThreadMessages(props.threadId);
                for (const message of messages) {
                    for (const content of message.contents) {
                        if (content.type == "image_file") {
                            content.value = `![image](attachment:${content.value})`
                        }

                        content.value = await applyTextTransform(content.value);
                    }
                }
                chat.messages = messages
                nextTick(() => {
                    isLoadingMessages.value = false;
                    isLoading.value = false;
                    scrollBottom();
                })
            }
        }

        function scrollBottom() {
            if (chatDivContainer.value) {
                chatDivContainer.value.scrollTo(0, chatDivContainer.value.scrollHeight);
            }
        }

        function createMessageModel(message: ChatMessage) {
            const result: ChatMessageModel = {
                ...message,
                contents: [...message.contents.map(c => ({ ...c }))],
                isBot: message.user == ChatUserType.assitant,
                time: message.date.toLocaleTimeString(language.value.code, {
                    hour: 'numeric',
                    minute: 'numeric'
                })
            }
            return result
        }

        const urlRegex = /^https?:\/\//i
        function clickInText(e: MouseEvent) {
            let targetElement: HTMLAnchorElement | undefined;
            if (e.composed) {
                targetElement = e.composedPath().map(f => f as HTMLElement).find(t => t.tagName === 'A') as HTMLAnchorElement;
            } else {
                targetElement = e.target as HTMLAnchorElement;
                if (targetElement?.tagName !== 'A') {
                    targetElement = e.relatedTarget as HTMLAnchorElement
                }
            }
            if (targetElement?.tagName === 'A') {
                e.stopPropagation();
                e.preventDefault();

                let target = targetElement.getAttribute('href');
                if (target && urlRegex.test(target)) {
                    window.open(target, '_blank');
                }
            }
        }

        const chatMessages = computed(() => {
            return chat.messages.map((message) => createMessageModel(message));
        })

        const chatResponse = computed(() => {
            let result: ChatMessageModel | null = null;
            if (chat.response) {
                result = createMessageModel(chat.response);
            }
            return result;
        })

        const chatDate = computed(() => {
            let result = "";
            let message: ChatMessage | undefined;
            if (chat.messages.length > 0) {
                message = chat.messages[0];
            } else if (chat.response) {
                message = chat.response;
            }
            if (message) {
                result = message.date.toLocaleDateString(language.value.code);
            }
            return result;
        })

        const computedFormInput = computed({
            get: () => formInput.value,
            set: (value: string) => {
                formInput.value = value
                inputTextareaStyle.value = {};
                nextTick(() => {
                    if (inputTextarea.value?.scrollHeight) {
                        inputTextareaStyle.value = {
                            height: inputTextarea.value.scrollHeight + 'px'
                        };
                    }
                })
            }
        })

        function addNewLine() {
            computedFormInput.value += '\n';
        }

        function toogleFormAction() {
            if (isOpenFormAction.value) {
                closeFormAction();
            } else {
                isOpenFormAction.value = true;
                document.addEventListener('click', closeFormAction);
            }
        }

        function closeFormAction() {
            isOpenFormAction.value = false;
            document.removeEventListener('click', closeFormAction);
        }

        function openFileSelector() {
            var input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';

            input.onchange = async () => {
                if (input.files && input.files.length > 0) {
                    for (let i = 0; i < input.files.length; i++) {
                        const fileItem = input.files[i]
                        const fileContent = await fileToBase64(fileItem)
                        if (fileContent) {
                            formImages.value.push({
                                id: formImages.value.length.toString(),
                                src: fileContent,
                                name: fileItem.name,
                                contentType: fileItem.type
                            })
                        }
                    }
                }
            }

            input.click();
        }

        function fileToBase64(file: File) {
            return new Promise<string | undefined>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        }

        function removeImage(imageId: string) {
            formImages.value = formImages.value.filter(i => i.id !== imageId);
        }

        const canSubmitForm = computed(() => {
            const result = !isLoading.value && (computedFormInput.value || formImages.value.length) ? true : false;
            return result;
        });

        return {
            language,
            isLoadingMessages,
            canSubmitForm,
            formImages,
            chatDivContainer,
            inputTextarea,
            chatResponse,
            chatMessages,
            chatDate,
            computedFormInput,
            submitPrompt,
            addNewLine,
            clickInText,
            inputTextareaStyle,
            isLoading,
            isOpenFormAction,
            toogleFormAction,
            openFileSelector,
            removeImage
        }
    }
})

interface ChatMessageModel extends ChatMessage {
    isBot: boolean;
    time: string;
}

interface ChatImageModel {
    id: string;
    src: string;
    name: string;
    contentType: string;
}