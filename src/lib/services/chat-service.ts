import fs from 'fs';
import path from 'path';
import { getGeminiClient } from '@/lib/utils/api-utils';
import { getProjectRoot } from '@/lib/utils/file-utils';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: string; // base64 string
}

export class ChatService {
  private portfolioData: any;

  constructor() {
    this.portfolioData = this.loadPortfolioData();
  }

  private loadPortfolioData() {
    try {
      const filePath = path.join(getProjectRoot(), 'src/data/portfolio.json');
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      return {};
    }
  }

  /**
   * Send a message to the chatbot and get a response.
   */
  async chat(message: string, history: ChatMessage[] = [], image?: string): Promise<{ response: string, model: string }> {
    const client = getGeminiClient();
    
    // Priority order: 
    // 1. Gemini 2.5 Pro (Best balance of quality and stability)
    // 2. Gemini 2.0 Flash (Fast fallback)
    const models = [
      'gemini-2.5-pro',
      'gemini-2.0-flash', 
      'gemini-flash-latest'
    ];

    const systemInstruction = `You are the AI assistant for Jawad Iskandar's portfolio, but you are also a helpful general assistant.
    
    You have access to the following specific information about Jawad:
    
    Profile:
    ${JSON.stringify(this.portfolioData.profile, null, 2)}
    
    Skills:
    ${JSON.stringify(this.portfolioData.skills, null, 2)}
    
    Experience:
    ${JSON.stringify(this.portfolioData.experience, null, 2)}
    
    Projects:
    ${JSON.stringify(this.portfolioData.projects, null, 2)}
    
    Your Role & Capabilities:
    1.  **Portfolio Expert:** Your primary goal is to showcase Jawad's qualifications. When users ask about his experience, skills, or projects, prioritize the data provided above.
    2.  **General Assistant:** You are now empowered to answer general questions, provide coding help, explain concepts, and discuss topics outside of the portfolio.
    3.  **Vision:** You can see and analyze images uploaded by the user. Use this to help with code screenshots, design feedback, or general image understanding.
    4.  **Site Navigation:** You can control the website navigation. If a user asks to see a specific section (e.g., "Show me projects", "Go to contact", "Scroll to skills"), you MUST append a navigation command to the END of your response in this format: \`[[NAVIGATE:section_id]]\`.
        - Valid section IDs: \`profile\`, \`skills\`, \`experience\`, \`projects\`, \`social\`, \`coursework\`, \`resume\`.
        - Example: "Sure, let me take you to the projects section. [[NAVIGATE:projects]]"
    
    Guidelines:
    - Be professional, friendly, and concise.
    - When answering about Jawad, stick to the facts in the provided data.
    - Use the navigation command \`[[NAVIGATE:section_id]]\` whenever appropriate to enhance the user experience.
    `;

    let lastError: any = null;

    console.log(`[ChatService] Starting chat. Message length: ${message?.length}. History: ${history.length}. Image: ${!!image}`);

    for (const modelName of models) {
      try {
        console.log(`[ChatService] Attempting to chat with model: ${modelName}`);
        const model = client.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction,
        });

        // Convert history to Gemini format
        const chatHistory = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        const chatSession = model.startChat({
          history: chatHistory,
        });

        // Prepare message parts
        const msgParts: any[] = [];
        if (message) {
          msgParts.push({ text: message });
        }

        if (image) {
          // Handle base64 image
          // Expecting data:image/jpeg;base64,...
          
          const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
             msgParts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          } else {
             console.warn('[ChatService] Invalid image format. Expected data URI.');
          }
        }

        const result = await chatSession.sendMessage(msgParts);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          throw new Error(`Empty response from ${modelName}`);
        }
        
        console.log(`[ChatService] Success with model: ${modelName}. Response length: ${text.length} chars.`);
        return { response: text, model: modelName };
        
      } catch (error: any) {
        const status = error.status || error.response?.status;
        const message = error.message || 'Unknown error';
        console.warn(`[ChatService] Failed with model ${modelName} (Status: ${status}): ${message}`);
        
        lastError = error;
        
        if (message.includes('API_KEY_INVALID') || status === 403) {
           throw error;
        }
      }
    }

    throw lastError || new Error('Failed to chat with any available Gemini model');
  }
}
