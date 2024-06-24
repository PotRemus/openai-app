<template>
    <span id="ai-icon" class="material-icons">{{ name }}</span>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

defineProps({
    name: {
        type: String,
        required: true
    }
})
</script>
<style scoped lang="less"></style>