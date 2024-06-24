import { Store } from "tauri-plugin-store-api";
import { locale } from '@tauri-apps/api/os';

export default new class DataService {
    private _storeSettings: Store;
    private _storeThreads: Store;
    constructor() {
        this._storeSettings = new Store(".config/settings.dat");
        this._storeThreads = new Store(".config/threads.dat");
    }

    async getSetting(key: string) {
        let result = "";
        const settings = await this.getSettings();
        if (settings[key]) {
            result = settings[key];
        }
        return result;
    }

    async setSetting(key: string, value: string) {
        const settings = await this.getSettings();
        settings[key] = value;
        await this._storeSettings.set(key, value);
    }

    private settings?: DataSettings;
    async getSettings() {
        if (!this.settings) {
            this.settings = {};
            const keys = await this._storeSettings.keys();
            for (const key of keys) {
                this.settings[key] = (await this._storeSettings.get(key)) ?? "";
            }
        }
        return this.settings;
    }

    async getThread(id: string) {
        let result: DataThread | undefined;
        const threads = await this.getThreads();
        if (threads[id]) {
            result = threads[id];
        }
        return result;
    }

    async deleteThread(id: string) {
        if (await this._storeThreads.delete(id)) {
            const threads = await this.getThreads();
            delete threads[id];
        }
    }

    async setThread(thread: DataThread) {
        const threads = await this.getThreads();
        threads[thread.id] = thread;
        await this._storeThreads.set(thread.id, thread);
    }

    private threads?: { [id: string]: DataThread };
    async getThreads() {
        if (!this.threads) {
            this.threads = {};
            const keys = await this._storeThreads.keys();
            for (const key of keys) {
                const thread = await this._storeThreads.get<DataThread>(key);
                if (thread) {
                    if (thread.createdDate) {
                        thread.createdDate = new Date(thread.createdDate);
                    }
                    if (!thread.fileIds) {
                        thread.fileIds = [];
                    }
                    this.threads[key] = thread;
                }
            }
        }
        return this.threads;
    }

    getSelectedThreadId() {
        const result = window.sessionStorage.getItem("threadId");
        return result;
    }

    setSelectedThreadId(threadId: string) {
        window.sessionStorage.setItem("threadId", threadId);
    }

    private _supportedLanguages = ["en", "fr"];
    private _languages?: Language[];
    get languages() {
        if (this._languages == null) {
            this._languages = [];
            const languageNames = new Intl.DisplayNames(this._supportedLanguages, {
                type: 'language'
            });
            for (const code of this._supportedLanguages) {
                const language = languageNames.of(code);
                this._languages.push({
                    name: language ?? "",
                    code: code,
                    langCode: code
                });
            }
        }
        return this._languages;
    }

    private _language?: Language;
    async initLanguage() {
        if (!this._language) {
            let code = (await this.getSetting("language")) ||
                (await locale()) ||
                window.navigator.language;
            
            let language = this.languages.find(l => l.code == code || l.langCode == code);
            if(!language) {
                language = this.languages[0];
            }
            await this.setLanguage(language);
        }
    }

    async setLanguage(lang: Language) {
        await this.setSetting("language", lang.code);
        this._language = lang;
    }

    get language() {
        if (!this._language) {
            throw new Error("Language not initialized");
        }
        return this._language;
    }
}

export interface Language {
    name: string;
    code: string;
    langCode: string;
}

export interface DataThread {
    id: string;
    title: string;
    createdDate: Date;
    fileIds: string[];
}

export interface DataSettings {
    [key: string]: string
}