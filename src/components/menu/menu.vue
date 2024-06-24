<template>
    <div class="ai-menu pure-menu">
        <div class="ai-menu-block">
            <div class="ai-menu-settings">
                <button class="pure-button pure-button-reset" type="button" @click="openSettings()">
                    <icon name="settings"></icon>
                </button>
            </div>
        </div>
        <div class="ai-menu-block">
            <div class="ai-menu-thread">
                <button class="pure-button pure-button-reset ai-menu-button" type="button" @click="openChat()">
                    <icon class="ai-menu-button-icon" name="auto_awesome"></icon>
                    {{ $t('menu.new-thread') }}
                </button>
            </div>
            <hr class="ai-menu-separator" />
        </div>
        <div class="ai-menu-block" v-for="threads in threadByTime" :key="threads.date">
            <p class="ai-menu-block-title">{{ threads.date }}</p>
            <div class="ai-menu-thread" v-for="thread in threads.items" :key="thread.id">
                <button type="button"
                    :class="['pure-button pure-button-reset ai-menu-button', { selected: thread.isSelected }]"
                    @click="openChat(thread.id)">
                    {{ thread.title }}
                </button>
                <button type="button" class="pure-button pure-button-reset ai-menu-remove"
                    @click.stop.prevent="removeThread(thread)">
                    <icon name="highlight_off"></icon>
                </button>
            </div>
            <hr class="ai-menu-separator" />
        </div>
        <loader v-if="isLoading"></loader>
    </div>
</template>

<script lang="ts" src="./menu.vue.ts"></script>
<style scoped lang="less">
.ai-menu {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .ai-menu-block {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        position: relative;

        .ai-menu-separator {
            width: calc(100% - 30px);
            margin: 5px 15px 0;
            background-color: var(--bg-thread-separator-color);
            height: 2px;
            box-sizing: border-box;
        }

        .ai-menu-block-title {
            margin: 0;
            font-size: 0.8em;
            padding: 15px 15px 10px;
            color: var(--font-anotation-color);
        }

        .ai-menu-settings {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            white-space: normal;

            button {
                display: flex;
                margin: 3px;
                padding: 2px;
                border-radius: 50%;
            }
        }

        .ai-menu-thread {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            white-space: normal;
            text-align: left;

            .ai-menu-button {
                width: 100%;
                display: flex;
                align-items: center;
                white-space: normal;
                text-align: left;

                .ai-menu-button-icon {
                    margin-right: 10px;
                }

                &.selected {
                    font-weight: bold;
                }
            }

            .ai-menu-remove {
                position: absolute;
                top: 5px;
                right: 5px;
                padding: 0;
                margin: 0;
                align-items: center;
                border-radius: 50%;
                display: none;
            }

            &:hover {
                .ai-menu-remove {
                    display: flex;
                }
            }
        }
    }
}
</style>