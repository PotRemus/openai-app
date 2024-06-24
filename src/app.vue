<template>
    <div id="ai-app" :class="{
        'open': isMenuOpen
    }">
        <Transition name="menu">
            <Menu id="ai-app-menu" v-if="isMenuOpen" :language="language" :thread-id="threadId"
                @select-thread="selectThread" @open-thread="openThread" @open-settings="openSettings"></Menu>
        </Transition>
        <div id="ai-app-main">
            <div id="ai-app-header">
                <button class="ai-app-menu-button pure-button pure-button-reset" type="button" @click="toogleMenu">
                    <icon name="menu"></icon>
                </button>
            </div>
            <div id="ai-app-content">
                <Chat :thread-id="threadId" :language="language" @add-thread="addThread" />
            </div>
            <Transition name="menu">
                <div id="ai-app-content-mask" v-if="isMenuOpen" @click="toogleMenu"></div>
            </Transition>
        </div>
        <Settings :is-open="isSettingsOpen" @close="closeSettings"></Settings>
    </div>
</template>

<script lang="ts" src="./app.vue.ts"></script>
<style scoped lang="less" src="./app.vue.less"></style>