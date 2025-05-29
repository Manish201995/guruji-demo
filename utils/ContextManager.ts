
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class ContextManager {
    private messages: Message[] = [];
    private maxContextLength: number;

    constructor(maxContextLength: number = 10) {
        this.maxContextLength = maxContextLength;
    }

    /**
     * Add a user message to the conversation history
     * @param content The content of the user message
     */
    addUserMessage(content: string): void {
        this.messages.push({
            role: 'user',
            content,
        });
        this.pruneContext();
    }

    addPersonalisedSystemMessage(message: string): void {
        if (this.messages.filter(message => message.role === 'system').length === 0)
            this.messages.push({
                role: 'system',
                content: message
            });
    }

    /**
     * Add an assistant message to the conversation history
     * @param content The content of the assistant message
     */
    addAssistantMessage(content: string): void {
        this.messages.push({
            role: 'assistant',
            content,
        });
        this.pruneContext();
    }

    /**
     * Get the current conversation history
     * @returns The current conversation history
     */
    getMessages(): Message[] {
        return [...this.messages];
    }

    /**
     * Clear the conversation history except for the system message
     */
    clearContext(): void {
        this.messages = this.messages.filter(message => message.role === 'system');
    }

    /**
     * Prune the conversation history to maintain the maximum context length
     * This keeps the system message and the most recent messages up to maxContextLength
     */
    private pruneContext(): void {
        // Always keep the system message
        const systemMessages = this.messages.filter(message => message.role === 'system');

        // Get non-system messages
        const nonSystemMessages = this.messages.filter(message => message.role !== 'system');

        // If we have more non-system messages than the max allowed, trim the oldest ones
        if (nonSystemMessages.length > this.maxContextLength) {
            const startIndex = nonSystemMessages.length - this.maxContextLength;
            const prunedNonSystemMessages = nonSystemMessages.slice(startIndex);

            // Reconstruct the messages array with system messages and pruned non-system messages
            this.messages = [...systemMessages, ...prunedNonSystemMessages];
        }
    }
}

// Export a singleton instance for use throughout the application
export const contextManager = new ContextManager();