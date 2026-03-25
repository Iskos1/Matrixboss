import fs from 'fs';
import path from 'path';
import { generate } from '@/lib/ai/anthropic';
import { getProjectRoot } from '@/lib/utils/file-utils';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 string
}

// ─── Singleton ──────────────────────────────────────────────────────────────
let _instance: ChatService | null = null;

export class ChatService {
  private portfolioData: any;

  private constructor() {
    this.portfolioData = this.loadPortfolioData();
  }

  static getInstance(): ChatService {
    if (!_instance) {
      _instance = new ChatService();
    }
    return _instance;
  }

  /** Force reload portfolio data (call after admin edits) */
  reload(): void {
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
      console.error('[ChatService] Error loading portfolio data:', error);
      return {};
    }
  }

  /**
   * Send a message to the chatbot and get a response.
   */
  async chat(
    message: string,
    history: ChatMessage[] = [],
    image?: string
  ): Promise<{ response: string; model: string }> {
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
    1.  **Portfolio Expert:** Your primary goal is to showcase Jawad's qualifications.
    2.  **General Assistant:** Answer general questions, provide coding help, explain concepts.
    3.  **Vision:** Analyze uploaded images if provided.
    4.  **Site Navigation:** Append [[NAVIGATE:section_id]] when asked to go to a section.
        Valid IDs: profile, skills, experience, projects, social, coursework, resume.
    
    Guidelines:
    - Be professional, friendly, and concise.
    - When answering about Jawad, stick to the facts provided.
    `;

    // Convert history to Anthropic format
    const chatHistory = history.map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    // Prepare image parts
    const inlineParts: any[] = [];
    if (image) {
      const matches = image.match(
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,(.+)$/
      );
      if (matches && matches.length === 3) {
        inlineParts.push({
          inlineData: { mimeType: matches[1], data: matches[2] },
        });
      } else {
        console.warn('[ChatService] Invalid image format. Expected data URI.');
      }
    }

    const result = await generate(message || 'Analyze the uploaded image.', {
      systemInstruction,
      history: chatHistory,
      inlineParts: inlineParts.length > 0 ? inlineParts : undefined,
    });

    return { response: result.text, model: result.model };
  }
}
