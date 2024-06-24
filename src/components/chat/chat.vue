<template>
    <div id="ai-chat">
        <div class="ai-chat-content" ref="chatDivContainer">
            <div class="ai-chat-date">{{ chatDate }}</div>
            <div v-for="chatMessage in chatMessages" :key="chatMessage.id"
                :class="['ai-chat-message', chatMessage.user]">
                <figure class="ai-chat-avatar" v-if="chatMessage.isBot">
                    <icon name="auto_awesome"></icon>
                </figure>
                <div class="ai-chat-message-content">
                    <bdi v-for="chatContent in chatMessage.contents" :key="chatContent.id" class="ai-chat-message-text"
                        v-html="chatContent.value" @click="clickInText">
                    </bdi>
                    <div class="ai-chat-timestamp">{{ chatMessage.time }}</div>
                </div>
            </div>
            <template v-if="chatResponse">
                <div :class="['ai-chat-message ai-chat-response', chatResponse.user]">
                    <figure class="ai-chat-avatar">
                        <icon name="auto_awesome"></icon>
                    </figure>
                    <div class="ai-chat-message-content">
                        <template v-if="chatResponse.contents.length">
                            <bdi v-for="chatContent in chatResponse.contents" :key="chatContent.id"
                                class="ai-chat-message-text" v-html="chatContent.value">
                            </bdi>
                        </template>
                        <template v-else>
                            <bdi class="ai-chat-message-text">
                                <div class="typing typing-1"></div>
                                <div class="typing typing-2"></div>
                                <div class="typing typing-3"></div>
                            </bdi>
                        </template>
                    </div>
                </div>
            </template>
            <loader v-if="isLoadingMessages"></loader>
        </div>
        <form class="ai-chat-form pure-form" @submit.prevent="submitPrompt">
            <div class="ai-form-action">
                <button type="button" class="ai-form-action-attach pure-button pure-button-reset" :disabled="isLoading"
                    @click.stop.prevent="toogleFormAction">
                    <icon name="attach_file"></icon>
                </button>
                <div class="ai-form-action-menu" v-if="isOpenFormAction">
                    <button type="button" class="pure-button pure-button-reset" :disabled="isLoading"
                        @click="openFileSelector">
                        <icon class="button-icon" name="note_add"></icon>
                        <span>{{ $t('chat.prompt-file-local') }}</span>
                    </button>
                </div>
            </div>
            <div class="ai-chat-entry">
                <div class="ai-chat-entry-images" v-if="formImages.length">
                    <div v-for="formImage in formImages" :key="formImage.id" class="ai-chat-image">
                        <img :src="formImage.src" />
                        <button type="button" @click="removeImage(formImage.id)"
                            class="pure-button pure-button-reset ai-chat-image-remove">
                            <icon name="cancel"></icon>
                        </button>
                    </div>
                </div>
                <div class="ai-chat-entry-text">
                    <textarea type="text" :placeholder="$t('chat.prompt-placeholder')" ref="inputTextarea"
                        class="ai-chat-prompt" :style="inputTextareaStyle" v-model.trim="computedFormInput"
                        @keydown.ctrl.enter="addNewLine" @keypress.enter.prevent="submitPrompt" :disabled="isLoading"
                        :lang="language.langCode" />
                    <button type="submit" class="ai-form-submit pure-button pure-button-reset"
                        :disabled="!canSubmitForm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 32 32">
                            <path fill="currentColor" fill-rule="evenodd"
                                d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
                                clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </form>
    </div>
</template>

<script lang="ts" src="./chat.vue.ts"></script>
<style scoped lang="less" src="./chat.vue.less"></style>
<style lang="less" src="./chat.vue.msg.less"></style>