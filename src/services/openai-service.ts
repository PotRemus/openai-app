import dataService, { DataThread } from "@/services/data-service";
import { invoke } from '@tauri-apps/api/tauri'

export default new class OpenaiService {
    private _baseUrl = 'https://api.openai.com/v1';

    constructor() {
    }

    private async getApiKey() {
        const result = await dataService.getSetting("apiKey");
        return result;
    }

    private async getAssistantId() {
        const result = await dataService.getSetting("assistantId");
        return result;
    }

    async init() {
        let assistantId = await this.getAssistantId();
        const apiKey = await this.getApiKey();
        if (apiKey) {
            assistantId = await this.findExistingAssistant(assistantId);
            if (!assistantId) {
                const response = await fetch(`${this._baseUrl}/assistants`, {
                    method: "POST",
                    headers: {
                        "OpenAI-Beta": "assistants=v2",
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        instructions: `Your goal is to help the user answer these questions.
You must always remain courteous, attentive and educational in your responses.
You have two functions available to help the user:
- generateImage: allows you to generate an image from a prompt
- screenshots: allows you to retrieve screenshots of the user's screens`,
                        name: "ai-assistant-app",
                        metadata: {
                            source: "openai-app"
                        },
                        tools: [{
                            type: "function",
                            function: {
                                name: "generateImage",
                                description: "Function used to generate an image",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        prompt: {
                                            type: "string",
                                            description: "A description of the image you wish to generate, maximum 4000 characters"
                                        }
                                    },
                                    required: [
                                        "prompt"
                                    ]
                                }
                            }
                        }, {
                            type: "function",
                            function: {
                                name: "screenshots",
                                description: "Function used to retrieve screenshots from user"
                            }
                        }],
                    })
                })
                if (response.ok) {
                    const data = await response.json();
                    assistantId = data.id;
                }
            }
            await dataService.setSetting("assistantId", assistantId);
        }
    }

    async findExistingAssistant(assistantId: string) {
        let result = assistantId;
        const apiKey = await this.getApiKey();
        if (assistantId) {
            const response = await fetch(`${this._baseUrl}/assistants/${assistantId}`, {
                method: "GET",
                headers: {
                    "OpenAI-Beta": "assistants=v2",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                }
            })
            if (!response.ok && response.status == 404) {
                await dataService.setSetting("assistantId", "");
                result = "";
            }
        }
        if (!result) {
            const url = `${this._baseUrl}/assistants?limit=20`;
            let hasMore = true;
            let lastId = "";
            while (hasMore) {
                let currentUrl = url;
                if (lastId) {
                    currentUrl += `&after=${lastId}`;
                }
                const response = await fetch(currentUrl, {
                    method: "GET",
                    headers: {
                        "OpenAI-Beta": "assistants=v2",
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    }
                })
                if (response.ok) {
                    const content = await response.json();
                    hasMore = content["has_more"] ?? false;
                    lastId = content["last_id"] ?? '';

                    for (var i in content.data) {
                        const assistant = content.data[i];
                        if (assistant.metadata["source"] == "openai-app") {
                            result = assistant.id;
                            hasMore = false;
                            break;
                        }
                    }
                } else {
                    hasMore = false;
                }
            }
        }
        return result;
    }

    async getThreads() {
        const result: DataThread[] = [];
        const threads = await dataService.getThreads();
        for (const key in threads) {
            const thread = threads[key];
            result.push(thread);
        }
        return result;
    }

    async createThread(metadata?: ChatMetadata) {
        let result: DataThread | undefined;
        const body: {
            metadata: ChatMetadata
        } | undefined = metadata ? {
            metadata
        } : undefined;
        const apiKey = await this.getApiKey();
        const response = await fetch(`${this._baseUrl}/threads`, {
            method: "POST",
            headers: {
                "OpenAI-Beta": "assistants=v2",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        })

        if (response.ok) {
            const data = await response.json();
            result = {
                id: data.id,
                title: '',
                createdDate: new Date(data.created_at * 1000),
                fileIds: []
            }
        }
        return result;
    }

    async deleteThread(thread: DataThread) {
        const apiKey = await this.getApiKey();
        const response = await fetch(`${this._baseUrl}/threads/${thread.id}`, {
            method: "DELETE",
            headers: {
                "OpenAI-Beta": "assistants=v2",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }
        })
        if (response.ok || response.status == 404) {
            await dataService.deleteThread(thread.id);

            for (const fileId of thread.fileIds) {
                await this.deleteFile(fileId);
            }
        }
    }

    async deleteFile(fileId: string) {
        const apiKey = await this.getApiKey();
        await fetch(`${this._baseUrl}/files/${fileId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        })
    }

    async getThreadMessages(threadId: string) {
        const result: ChatMessage[] = [];
        const apiKey = await this.getApiKey();
        const url = `${this._baseUrl}/threads/${threadId}/messages?limit=20&order=asc`;
        let hasMore = true;
        let lastId = "";
        while (hasMore) {
            let currentUrl = url;
            if (lastId) {
                currentUrl += `&after=${lastId}`;
            }
            const response = await fetch(currentUrl, {
                method: "GET",
                headers: {
                    "OpenAI-Beta": "assistants=v2",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                }
            })
            if (response.ok) {
                const content = await response.json();
                hasMore = content["has_more"] ?? false;
                lastId = content["last_id"] ?? '';
                const messages = content.data as OpenAIMessage[];
                for (let i in messages) {
                    const m = messages[i];
                    result.push({
                        id: m.id,
                        date: new Date(m.created_at * 1000),
                        user: m.role == "user" ? ChatUserType.user : ChatUserType.assitant,
                        contents: m.content.map((c, i) => {
                            if (c.type == 'image_file') {
                                return {
                                    id: i.toString(),
                                    type: c.type,
                                    value: c.image_file.file_id
                                }
                            } else {
                                return {
                                    id: i.toString(),
                                    type: c.type,
                                    value: c.text.value
                                }
                            }
                        })
                    })
                }
            } else {
                hasMore = false;
            }
        }
        return result;
    }

    async postThreadMessage(thread: DataThread, message: ChatMessageRequest, appendText: (index: number, type: string, text: string) => Promise<void>) {
        let result: ChatMessage | undefined;
        const apiKey = await this.getApiKey();
        const content = [];
        if (message.text) {
            content.push({
                type: 'text',
                text: message.text
            })
        }
        if (message.fileIds) {
            message.fileIds.forEach(fileId => {
                content.push({
                    type: 'image_file',
                    image_file: {
                        file_id: fileId
                    }
                })
            })
        }
        const messageResponse = await fetch(`${this._baseUrl}/threads/${thread.id}/messages`, {
            method: "POST",
            headers: {
                "OpenAI-Beta": "assistants=v2",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "role": "user",
                "content": content
            })
        })
        if (messageResponse.ok) {
            const assistantId = await this.getAssistantId();
            const runResponse = await fetch(`${this._baseUrl}/threads/${thread.id}/runs`, {
                method: "POST",
                headers: {
                    "OpenAI-Beta": "assistants=v2",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    "additional_instructions": `
Unless contraindicated, you must respond in the user's language.
User language: ${dataService.language.code}`,
                    "assistant_id": assistantId,
                    "stream": true
                })
            });
            if (runResponse.ok) {
                result = await this.readThreadResponse(thread, runResponse, appendText);
            }
        }
        if ((result?.contents.length ?? 0) > 0) {
            this.updateThreadTitle(thread.id);
        }
        return result;
    }

    private async readThreadResponse(thread: DataThread, response: Response, appendText: (index: number, type: string, text: string) => Promise<void>) {
        let result: ChatMessage | undefined;
        const apiKey = await this.getApiKey();
        const reader = response.body?.getReader();
        if (reader) {
            let done, value;
            while (!done) {
                ({ done, value } = await reader.read());
                if (value) {
                    const content = new TextDecoder("utf-8").decode(value);
                    const parts = content.split("\n\n");
                    for (let i in parts) {
                        const [part1, part2] = parts[i].split("\n");
                        //console.log("chunck: ", part1, part2);
                        if (part1 == "event: thread.run.requires_action" &&
                            part2.startsWith("data:")) {
                            const data = part2.slice(5).trim();
                            const chunk: any = JSON.parse(data);
                            const tools = chunk.required_action?.submit_tool_outputs?.tool_calls ?? [];
                            if (tools.length > 0) {
                                const promiseArray: Promise<any>[] = [];
                                tools.forEach((toolCall: any) => {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    if (toolCall.function.name == "generateImage") {
                                        promiseArray.push(this.generateImage(thread, args.prompt).then((image) => {
                                            const toolResponse: OpenAIToolResponse = {
                                                id: toolCall.id,
                                                output: image
                                            }
                                            return toolResponse;
                                        }));
                                    } else if (toolCall.function.name == "screenshots") {
                                        promiseArray.push(this.takeScreenshot(thread).then((images) => {
                                            const toolResponse: OpenAIToolResponse = {
                                                id: toolCall.id,
                                                output: images
                                            }
                                            return toolResponse;
                                        }));
                                    }
                                })
                                const toolValues: OpenAIToolResponse[] = await Promise.all(promiseArray);
                                const toolResponse = await fetch(`${this._baseUrl}/threads/${chunk.thread_id}/runs/${chunk.id}/submit_tool_outputs`, {
                                    method: "POST",
                                    headers: {
                                        "OpenAI-Beta": "assistants=v2",
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${apiKey}`
                                    },
                                    body: JSON.stringify({
                                        "tool_outputs": toolValues.map(value => {
                                            let output = value.output ?? '';
                                            if (value.output && typeof value.output != 'string')
                                                output = JSON.stringify(value.output)
                                            return {
                                                tool_call_id: value.id,
                                                output
                                            }
                                        }),
                                        "stream": true
                                    })
                                });
                                if (!toolResponse.ok) {
                                    console.error("Error to submit tool response", toolResponse.status, toolResponse.statusText);
                                    const error = await toolResponse.text();
                                    console.error("Error Content:\n", error);
                                } else {
                                    result = await this.readThreadResponse(thread, toolResponse, appendText);
                                }
                            }
                        } else if (part1 == "event: thread.message.delta" &&
                            part2.startsWith("data:")) {
                            const data = part2.slice(5).trim();
                            const chunk: OpenAIAssistantDeltaChunk = JSON.parse(data);
                            if (chunk?.delta?.content?.length > 0) {
                                for (let c of chunk.delta.content) {
                                    await appendText(c.index, c.type, c.text.value);
                                }
                            }
                        } else if (part1 == "event: thread.message.completed" &&
                            part2.startsWith("data:")) {
                            const data = part2.slice(5).trim();
                            const chunk: OpenAIAssistantCompletedChunk = JSON.parse(data);
                            if (chunk?.content?.length > 0) {
                                result = {
                                    id: chunk.id,
                                    date: new Date(chunk.created_at * 1000),
                                    user: chunk.role == "user" ? ChatUserType.user : ChatUserType.assitant,
                                    contents: chunk.content.map((c, i) => {
                                        const content: ChatContent = {
                                            id: i.toString(),
                                            type: c.type,
                                            value: c.type == "text" ? c.text.value : ''
                                        }
                                        return content;
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    private async takeScreenshot(thread: DataThread) {
        const images = await invoke<ChatImage[]>("take_screen");
        const result = await Promise.all(images.map(async (image) => {
            const fileId = await this.createFile(thread, image.content, image.content_type, image.name);
            return {
                type: "image_file",
                image_file: {
                    file_id: fileId
                }
            }
        }));
        return result;
    }

    private async updateThreadTitle(threadId: string) {
        const threads = await dataService.getThreads();
        if (threads[threadId]) {
            const thread = threads[threadId];
            const apiKey = await this.getApiKey();
            const response = await fetch(`${this._baseUrl}/threads/${threadId}/messages?limit=6&order=asc`, {
                method: "GET",
                headers: {
                    "OpenAI-Beta": "assistants=v2",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                }
            })
            if (response.ok) {
                const data = (await response.json())?.data as OpenAIMessage[];
                if (data?.length < 6) {
                    let message = '';
                    for (const i in data) {
                        const m = data[i];
                        for (var ic in m.content) {
                            const c = m.content[ic];
                            if (c.type == "text") {
                                message += `${m.role}: ${c.text.value}\n`
                            }
                        }
                        message += '\n';
                    }
                    if (message) {
                        message += "Peux-tu générer un titre court (3-4 mots maximum) concernant cette conversation ?\n";
                        message += "Titre : ";
                        const titleResponse = await fetch(`${this._baseUrl}/completions`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${apiKey}`
                            },
                            body: JSON.stringify({
                                "model": "gpt-3.5-turbo-instruct",
                                "prompt": message,
                                "temperature": 0.7,
                                "max_tokens": 256
                            })
                        })
                        if (titleResponse.ok) {
                            const titleData = await titleResponse.json();
                            thread.title = titleData.choices.at(0)?.text ?? "";
                            if (thread.title) {
                                thread.title = thread.title.replaceAll(/^[ \n"]+/g, "").replaceAll(/[ \n"]+$/g, "");
                                await dataService.setThread(thread);
                            }
                        }
                    }
                }
            }
        }
    }

    async generateImage(thread: DataThread, prompt: string) {
        let result: OpenAIMessageContentImage | undefined;
        if (prompt) {
            const apiKey = await this.getApiKey();
            if (prompt.length > 4000) {
                prompt = prompt.substring(0, 4000);
            }
            const response = await fetch(`${this._baseUrl}/images/generations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "quality": "hd",
                    //"response_format": "url"
                    "response_format": "b64_json"
                })
            })
            if (response.ok) {
                const content = await response.json();
                //result = content.data[0].url;
                //result = `data:image/png;base64,${content.data[0].b64_json}`;
                const base64 = content.data[0].b64_json;
                const fileId = await this.createFile(thread, base64, "image/png", "generated-image.png");
                if (fileId) {
                    result = {
                        type: "image_file",
                        image_file: {
                            file_id: fileId
                        }
                    }
                }
            }
        }
        return result;
    }

    async createFile(thread: DataThread, base64: string, contentType: string, fileName: string) {
        let result: string | undefined;
        const apiKey = await this.getApiKey();
        const formData = new FormData();
        const blobFile = this.b64toBlob(base64);
        const file = new File([blobFile], fileName, { type: contentType });
        formData.append('file', file, fileName);
        formData.append('purpose', "vision");

        const response = await fetch(`${this._baseUrl}/files`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${apiKey}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            result = data.id;
            thread.fileIds.push(data.id);
            await dataService.setThread(thread);
        }
        return result;
    }

    async getFileContent(fileId: string) {
        let result: string | undefined;
        const apiKey = await this.getApiKey();
        const response = await fetch(`${this._baseUrl}/files/${fileId}/content`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            const data = await response.blob();
            result = URL.createObjectURL(data);
        }
        return result;
    }

    private b64toBlob(b64Data: string, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }
}

interface ChatMetadata { [key: string]: string }

interface ChatImage {
    name: string,
    content_type: string,
    content: string,
    width: number,
    height: number,
}

interface OpenAIToolResponse {
    id: string;
    output: unknown;
}

interface OpenAIMessage {
    id: string,
    object: string,
    "created_at": number,
    role: string,
    content: (OpenAIMessageContentText | OpenAIMessageContentImage)[],
}

interface OpenAIMessageContentText {
    type: 'text';
    text: {
        value: string;
    }
}

interface OpenAIMessageContentImage {
    type: 'image_file';
    image_file: {
        file_id: string;
    }
}

interface OpenAIAssistantCompletedChunk {
    id: string;
    object: string;
    created_at: number;
    role: string;
    content: OpenAIAssistantContentChunk[]
}

interface OpenAIAssistantDeltaChunk {
    id: string;
    object: string;
    delta: {
        content: OpenAIAssistantContentChunk[]
    };
}

interface OpenAIAssistantContentChunk {
    index: number;
    type: string;
    text: {
        value: string;
    }
}

export interface ChatMessage {
    id: string;
    date: Date;
    user: ChatUserType;
    contents: ChatContent[];
}

export interface ChatContent {
    id: string;
    type: string;
    value: string;
}

export enum ChatUserType {
    assitant = 'assistant',
    user = 'user'
}

export interface ChatMessageRequest {
    text: string;
    fileIds: string[];
}
