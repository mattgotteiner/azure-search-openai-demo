import { AskRequest, AskResponse, ChatRequest } from "./models";
import { loginRequest } from '../authconfig'

export async function askApi(options: AskRequest): Promise<AskResponse> {
    var headers: Record<string, any> = {
        "Content-Type": "application/json"
    };
    const instance = options.overrides?.msalInstance
    if (instance) {
        const account = instance.getActiveAccount();
        if (account) {
            const response = await options.overrides?.msalInstance?.acquireTokenSilent({
                ...loginRequest,
                account: account
            });
            headers["Authorization"] = `Bearer ${response?.accessToken}`
        }
    }

    const response = await fetch("/ask", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            question: options.question,
            approach: options.approach,
            overrides: {
                retrieval_mode: options.overrides?.retrievalMode,
                semantic_ranker: options.overrides?.semanticRanker,
                semantic_captions: options.overrides?.semanticCaptions,
                top: options.overrides?.top,
                temperature: options.overrides?.temperature,
                prompt_template: options.overrides?.promptTemplate,
                prompt_template_prefix: options.overrides?.promptTemplatePrefix,
                prompt_template_suffix: options.overrides?.promptTemplateSuffix,
                exclude_category: options.overrides?.excludeCategory,
                use_security_group_filter: options.overrides?.useSecurityGroupFilter
            }
        })
    });

    const parsedResponse: AskResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error(parsedResponse.error || "Unknown error");
    }

    return parsedResponse;
}

export async function chatApi(options: ChatRequest): Promise<AskResponse> {
    var headers: Record<string, any> = {
        "Content-Type": "application/json"
    };
    const instance = options.overrides?.msalInstance
    if (instance) {
        const account = instance.getActiveAccount();
        if (account) {
            const response = await options.overrides?.msalInstance?.acquireTokenSilent({
                ...loginRequest,
                account: account
            });
            headers["Authorization"] = `Bearer ${response?.accessToken}`
        }
    }

    const response = await fetch("/chat", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            history: options.history,
            approach: options.approach,
            overrides: {
                retrieval_mode: options.overrides?.retrievalMode,
                semantic_ranker: options.overrides?.semanticRanker,
                semantic_captions: options.overrides?.semanticCaptions,
                top: options.overrides?.top,
                temperature: options.overrides?.temperature,
                prompt_template: options.overrides?.promptTemplate,
                prompt_template_prefix: options.overrides?.promptTemplatePrefix,
                prompt_template_suffix: options.overrides?.promptTemplateSuffix,
                exclude_category: options.overrides?.excludeCategory,
                suggest_followup_questions: options.overrides?.suggestFollowupQuestions,
                use_security_group_filter: options.overrides?.useSecurityGroupFilter
            }
        })
    });

    const parsedResponse: AskResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error(parsedResponse.error || "Unknown error");
    }

    return parsedResponse;
}

export function getCitationFilePath(citation: string): string {
    return `/content/${citation}`;
}
