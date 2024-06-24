<template>
    <Transition name="settings">
        <div id="ai-settings" v-if="isOpen">
            <div class="ai-settings-header">
                <h1 class="ai-settings-title">{{ $t('settings.title') }}</h1>
                <button v-if="hasApiKey" type="button" class="pure-button pure-button-reset ai-settings-close"
                    @click="close">
                    <icon name="close"></icon>
                </button>
            </div>
            <form class="pure-form ai-settings-form" @submit.prevent="submitSettings">
                <label class="ai-settings-block">
                    <h3 class="ai-settings-block-title">{{ $t('settings.language') }}</h3>
                    <select v-model="language">
                        <option disabled value="">{{ $t('settings.language-select') }}</option>
                        <option v-for="language in languages" :key="language.code" :value="language">
                            {{ language.name }}
                        </option>
                    </select>
                </label>
                <label class="ai-settings-block">
                    <h3 class="ai-settings-block-title">{{ $t('settings.apiKey') }}</h3>
                    <p class="ai-settings-block-subtitle">
                        {{ $t('settings.apiKeyHelp') }} <br>
                        <a href="https://platform.openai.com/api-keys" target="_blank">https://platform.openai.com/api-keys</a>
                    </p>
                    <input type="text" v-model="apiKey" class="ai-settings-apikey"
                        :placeholder="$t('settings.apiKeyPlacholder')" />
                </label>
                <div class="ai-settings-action">
                    <button type="button" class="pure-button pure-button-secondary" @click="cancel">
                        {{ $t('settings.cancel') }}
                    </button>
                    <button type="submit" class="pure-button pure-button-primary">
                        {{ $t('settings.save') }}
                    </button>
                </div>
            </form>
        </div>
    </Transition>
</template>

<script lang="ts" src="./settings.vue.ts"></script>
<style scoped lang="less" src="./settings.vue.less"></style>