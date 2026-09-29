/**
 * Integration tests for Lambda function
 * These tests can be run locally to test the Lambda handler directly
 */

// Set environment variables before requiring the lambda module
process.env.OPENAI_API_KEY = 'test-key';
process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
process.env.MAX_TOKENS = '150';
process.env.TEMPERATURE = '0.7';

const { handler, container } = require('../../lambda/index');

describe('Lambda Handler Integration Tests', () => {
    describe('LaunchRequest', () => {
        it('should handle LaunchRequest', async () => {
            const event = {
                version: '1.0',
                session: {
                    new: true,
                    sessionId: 'test-session',
                    application: {
                        applicationId: 'amzn1.ask.skill.test'
                    },
                    attributes: {},
                    user: {
                        userId: 'test-user'
                    }
                },
                context: {
                    System: {
                        application: {
                            applicationId: 'amzn1.ask.skill.test'
                        },
                        user: {
                            userId: 'test-user'
                        },
                        device: {
                            deviceId: 'test-device',
                            supportedInterfaces: {}
                        }
                    }
                },
                request: {
                    type: 'LaunchRequest',
                    requestId: 'test-request',
                    timestamp: '2024-01-01T00:00:00Z',
                    locale: 'en-US'
                }
            };

            const result = await new Promise((resolve, reject) => {
                handler(event, {}, (error, response) => {
                    if (error) reject(error);
                    else resolve(response);
                });
            });

            expect(result).toHaveProperty('response');
            expect(result.response).toHaveProperty('outputSpeech');
            expect(result.response.outputSpeech.ssml).toContain('Bem-vindo, senhor');
        });
    });

    describe('HelpIntent', () => {
        it('should handle AMAZON.HelpIntent', async () => {
            const event = {
                version: '1.0',
                session: {
                    new: false,
                    sessionId: 'test-session',
                    application: {
                        applicationId: 'amzn1.ask.skill.test'
                    },
                    attributes: {},
                    user: {
                        userId: 'test-user'
                    }
                },
                context: {
                    System: {
                        application: {
                            applicationId: 'amzn1.ask.skill.test'
                        },
                        user: {
                            userId: 'test-user'
                        },
                        device: {
                            deviceId: 'test-device',
                            supportedInterfaces: {}
                        }
                    }
                },
                request: {
                    type: 'IntentRequest',
                    requestId: 'test-request',
                    timestamp: '2024-01-01T00:00:00Z',
                    locale: 'en-US',
                    intent: {
                        name: 'AMAZON.HelpIntent',
                        confirmationStatus: 'NONE'
                    }
                }
            };

            const result = await new Promise((resolve, reject) => {
                handler(event, {}, (error, response) => {
                    if (error) reject(error);
                    else resolve(response);
                });
            });

            expect(result).toHaveProperty('response');
            expect(result.response.outputSpeech.ssml).toContain('Pode me perguntar qualquer coisa');
        });
    });

    describe('StopIntent', () => {
        it('should handle AMAZON.StopIntent', async () => {
            const event = {
                version: '1.0',
                session: {
                    new: false,
                    sessionId: 'test-session',
                    application: {
                        applicationId: 'amzn1.ask.skill.test'
                    },
                    attributes: {},
                    user: {
                        userId: 'test-user'
                    }
                },
                context: {
                    System: {
                        application: {
                            applicationId: 'amzn1.ask.skill.test'
                        },
                        user: {
                            userId: 'test-user'
                        },
                        device: {
                            deviceId: 'test-device',
                            supportedInterfaces: {}
                        }
                    }
                },
                request: {
                    type: 'IntentRequest',
                    requestId: 'test-request',
                    timestamp: '2024-01-01T00:00:00Z',
                    locale: 'en-US',
                    intent: {
                        name: 'AMAZON.StopIntent',
                        confirmationStatus: 'NONE'
                    }
                }
            };

            const result = await new Promise((resolve, reject) => {
                handler(event, {}, (error, response) => {
                    if (error) reject(error);
                    else resolve(response);
                });
            });

            expect(result).toHaveProperty('response');
            expect(result.response.outputSpeech.ssml).toContain('Até logo, senhor');
        });
    });
});

describe('Dependency Container', () => {
    it('should create services with proper dependencies', () => {
        const testContainer = container;
        
        expect(testContainer.getConversationService()).toBeDefined();
        expect(testContainer.getOpenAIRepository()).toBeDefined();
        expect(testContainer.getRequestHandlers()).toBeDefined();
        expect(testContainer.getRequestHandlers().length).toBeGreaterThan(0);
    });

    it('should return same instance for multiple calls (singleton)', () => {
        const testContainer = container;
        
        const service1 = testContainer.getConversationService();
        const service2 = testContainer.getConversationService();
        
        expect(service1).toBe(service2);
    });
});
