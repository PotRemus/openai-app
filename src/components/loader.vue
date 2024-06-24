<template>
    <div class="ai-loader-progress ai-loader-loading">
        <div class="ai-loader-mask"></div>
        <div class="ai-loader">
            <div class="ai-spinner-icon"></div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.ai-loader-progress {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    height: auto;
    width: auto;
    min-height: 100px;
    min-width: 60px;
    margin-left: 0;
    margin-top: 0;

    .ai-loader-mask {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: var(--bg-primary-color);
        opacity: 0.7;
    }

    .ai-loader {
        display: inline-block;
        width: 60px;
        height: 60px;
        position: absolute;
        top: 50%;
        margin-top: -30px;
        left: 50%;
        margin-left: -30px;

        .ai-spinner-icon {
            width: 60px;
            height: 60px;
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
            border: solid 0.1em transparent;
            border-color: var(--font-secondary-color) var(--font-primary-color);
            -webkit-border-radius: 100%;
            -moz-border-radius: 100%;
            -ms-border-radius: 100%;
            -o-border-radius: 100%;
            border-radius: 100%;
            -webkit-animation: progress-loader 1000ms linear infinite;
            -moz-animation: progress-loader 1000ms linear infinite;
            -o-animation: progress-loader 1000ms linear infinite;
            animation: progress-loader 1000ms linear infinite;
        }
    }
}

@-webkit-keyframes progress-loader {
    0% {
        transform: rotate(0);
        -moz-transform: rotate(0);
        -ms-transform: rotate(0);
        -o-transform: rotate(0);
        -webkit-transform: rotate(0);
    }

    100% {
        transform: rotate(360deg);
        -moz-transform: rotate(360deg);
        -ms-transform: rotate(360deg);
        -o-transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
    }
}

@-moz-keyframes progress-loader {
    0% {
        transform: rotate(0);
        -moz-transform: rotate(0);
        -ms-transform: rotate(0);
        -o-transform: rotate(0);
        -webkit-transform: rotate(0);
    }

    100% {
        transform: rotate(360deg);
        -moz-transform: rotate(360deg);
        -ms-transform: rotate(360deg);
        -o-transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
    }
}

@keyframes progress-loader {
    0% {
        transform: rotate(0);
        -moz-transform: rotate(0);
        -ms-transform: rotate(0);
        -o-transform: rotate(0);
        -webkit-transform: rotate(0);
    }

    100% {
        transform: rotate(360deg);
        -moz-transform: rotate(360deg);
        -ms-transform: rotate(360deg);
        -o-transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
    }
}
</style>
