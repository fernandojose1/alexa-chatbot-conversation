const DependencyContainer = require('../../lambda/src/DependencyContainer');
const ConversationService = require('../../lambda/src/services/ConversationService');

describe('ConversationService', () => {
    let mockOpenAIRepository;
    let conversationService;

    beforeEach(() => {
        // Mock OpenAI Repository
        mockOpenAIRepository = {
            getChatCompletion: jest.fn(),
            searchCompletion: jest.fn()
        };
        conversationService = new ConversationService(mockOpenAIRepository, 'Você é o Jarvis.', {
            now: () => new Date('2026-09-29T16:10:00Z')
        });
    });

    describe('processMessage', () => {
        it('should process a message and return response with updated history', async () => {
            const mockResponse = 'This is a test response';
            mockOpenAIRepository.getChatCompletion.mockResolvedValue({ content: mockResponse, toolCall: null });

            const result = await conversationService.processMessage('Hello', []);

            expect(result).toHaveProperty('response', mockResponse);
            expect(result).toHaveProperty('conversationHistory');
            expect(result.conversationHistory).toHaveLength(2);
            expect(result.conversationHistory[0]).toEqual({
                role: 'user',
                content: 'Hello'
            });
            expect(result.conversationHistory[1]).toEqual({
                role: 'assistant',
                content: mockResponse
            });
        });

        it('should maintain existing conversation history', async () => {
            const existingHistory = [
                { role: 'user', content: 'Previous message' },
                { role: 'assistant', content: 'Previous response' }
            ];
            mockOpenAIRepository.getChatCompletion.mockResolvedValue({ content: 'New response', toolCall: null });

            const result = await conversationService.processMessage('New message', existingHistory);

            expect(result.conversationHistory).toHaveLength(4);
            expect(result.conversationHistory[0]).toEqual(existingHistory[0]);
        });

        it('should trim history when exceeding max length', async () => {
            const longHistory = Array.from({ length: 10 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i}`
            }));
            mockOpenAIRepository.getChatCompletion.mockResolvedValue({ content: 'Response', toolCall: null });

            const result = await conversationService.processMessage('New message', longHistory);

            expect(result.conversationHistory.length).toBeLessThanOrEqual(10);
        });

        it('should throw error when OpenAI fails', async () => {
            mockOpenAIRepository.getChatCompletion.mockRejectedValue(new Error('API Error'));

            await expect(
                conversationService.processMessage('Hello', [])
            ).rejects.toThrow('API Error');
        });
    });

    describe('trimHistory', () => {
        it('should not trim history below max length', () => {
            const history = [
                { role: 'user', content: 'Message 1' },
                { role: 'assistant', content: 'Response 1' }
            ];

            const result = conversationService.trimHistory(history);

            expect(result).toHaveLength(2);
            expect(result).toEqual(history);
        });

        it('should trim history to max length', () => {
            const history = Array.from({ length: 15 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i}`
            }));

            const result = conversationService.trimHistory(history);

            expect(result).toHaveLength(10);
            expect(result[0].content).toBe('Message 5');
        });
    });

    describe('context and web search', () => {
        it('should send the current date and time in Brasília in the system prompt', async () => {
            mockOpenAIRepository.getChatCompletion.mockResolvedValue({ content: 'Segunda.', toolCall: null });

            await conversationService.processMessage('que dia é hoje', []);

            const [messages, options] = mockOpenAIRepository.getChatCompletion.mock.calls[0];
            expect(messages[0].role).toBe('system');
            expect(messages[0].content).toContain('Você é o Jarvis.');
            expect(messages[0].content).toContain('29 de setembro de 2026');
            expect(messages[0].content).toContain('13:10');
            expect(options.tools[0].function.name).toBe('buscar_na_internet');
        });

        it('should search the web when the model asks for it, and warn before searching', async () => {
            mockOpenAIRepository.getChatCompletion.mockResolvedValue({
                content: null,
                toolCall: { name: 'buscar_na_internet', args: { consulta: 'cotação do dólar hoje' } }
            });
            mockOpenAIRepository.searchCompletion.mockResolvedValue('O dólar está em cinco reais【0†L5-L10】.');
            const onSearch = jest.fn();

            const result = await conversationService.processMessage('quanto está o dólar', [], { onSearch });

            expect(onSearch).toHaveBeenCalledTimes(1);
            const [searchMessages] = mockOpenAIRepository.searchCompletion.mock.calls[0];
            expect(searchMessages[searchMessages.length - 1].content).toContain('cotação do dólar hoje');
            expect(result.searched).toBe(true);
            expect(result.response).toBe('O dólar está em cinco reais.');
            expect(result.conversationHistory).toHaveLength(2);
        });

        it('should force a new search on a follow-up of a searched answer', async () => {
            const history = [
                { role: 'user', content: 'vai chover em São Paulo' },
                { role: 'assistant', content: 'Sim, à tarde.', pesquisa: 'previsão São Paulo' }
            ];
            mockOpenAIRepository.getChatCompletion.mockResolvedValue({
                content: null,
                toolCall: { name: 'buscar_na_internet', args: { consulta: 'previsão Rio de Janeiro' } }
            });
            mockOpenAIRepository.searchCompletion.mockResolvedValue('No Rio, sol.');

            await conversationService.processMessage('e no Rio de Janeiro', history);

            const [messages, options] = mockOpenAIRepository.getChatCompletion.mock.calls[0];
            expect(options.toolChoice).toEqual({ type: 'function', function: { name: 'buscar_na_internet' } });
            // searched answer goes as tool call -> tool result -> answer
            expect(messages[2].tool_calls[0].function.arguments).toContain('previsão São Paulo');
            expect(messages[3]).toMatchObject({ role: 'tool', content: 'Sim, à tarde.' });
            expect(messages[4]).toEqual({ role: 'assistant', content: 'Sim, à tarde.' });
        });

        it('should not search when the model answers directly', async () => {
            mockOpenAIRepository.getChatCompletion.mockResolvedValue({ content: 'Canberra.', toolCall: null });

            const result = await conversationService.processMessage('capital da Austrália', []);

            expect(mockOpenAIRepository.searchCompletion).not.toHaveBeenCalled();
            expect(result.searched).toBe(false);
        });
    });

    describe('cleanForSpeech', () => {
        it('should remove citations, markdown and links', () => {
            const text = '**Sim**, veja [aqui](https://x.com) em https://y.com 【1†L17-L22】 hoje .';

            expect(conversationService.cleanForSpeech(text)).toBe('Sim, veja aqui em hoje.');
        });
    });
});
