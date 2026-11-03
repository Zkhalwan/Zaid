import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { getUserFavorites, addFavorite, removeFavorite } from './src/db/favorites.ts';
import { getUserDocuments, saveDocumentWithVersion, getDocumentVersions } from './src/db/documents.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function getApiKeyOrThrow() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
}

// AI Advisor: Helps users find the right AI tool, compares tools, and suggests prompts
app.post('/api/ai/advisor', async (req: Request, res: Response): Promise<void> => {
  try {
    getApiKeyOrThrow();
    const { query, currentCategory = 'all' } = req.body;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    const systemInstruction = `أنت "المستشار الذكي لأدوات الذكاء الاصطناعي"، خبير محترف ومحايد في منظومة أدوات الذكاء الاصطناعي الحديثة (ChatGPT, Gemini, Claude, DeepSeek, Midjourney, Runway, ElevenLabs, Cursor, Perplexity, Canva, Suno, NotebookLM وغيرها).
مهمتك:
1. فهم احتياج المستخدم (مثال: "بدي أداة مجانية تترجم فيديوهات"، "بدي أصمم لوجو عالي الجودة"، "أفضل أداة لكتابة كود").
2. ترشيح أفضل 2 إلى 3 أدوات مناسبة لاحتياجه بدقة مع ذكر:
   - اسم الأداة
   - سبب اختيارها المباشر
   - هل هي مجانية أم مدفوعة
   - نصيحة عملية للبدء وكتابة برومبت فعال
3. صياغة الإجابة بلغة عربية فصيحة، راقية، منظمة ومباشرة دون حشو.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `استفسار المستخدم: "${query}"\nالتصنيف الحالي المتصفح: ${currentCategory}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'ملخص موجز للنصيحة' },
            recommendedTools: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  toolName: { type: Type.STRING },
                  category: { type: Type.STRING },
                  whyThisTool: { type: Type.STRING },
                  pricingInfo: { type: Type.STRING },
                  recommendedPrompt: { type: Type.STRING },
                },
                required: ['toolName', 'whyThisTool', 'pricingInfo'],
              },
            },
            proTip: { type: Type.STRING, description: 'نصيحة ذهبية للاستفادة القصوى' },
          },
          required: ['summary', 'recommendedTools', 'proTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in AI Advisor:', error);
    res.status(500).json({ error: error?.message || 'Failed to process AI advisor request' });
  }
});

// AI Document Editor: Edits, refines, and formats documents with AI-logged version change summary
app.post('/api/ai/edit-document', async (req: Request, res: Response): Promise<void> => {
  try {
    getApiKeyOrThrow();
    const { title = 'مستند', content = '', instruction = 'تحسين وتنسيق المحتوى', actionType = 'improve' } = req.body;

    if (!content && !title) {
      res.status(400).json({ error: 'Content or title is required.' });
      return;
    }

    const systemInstruction = `أنت محرر ومساعد ذكي محترف متخصص في صياغة وتطوير مستندات وأدلة ومذكرات الذكاء الاصطناعي التوليدي.
المطلوب منك:
1. تعديل وتحسين محتوى المستند بدقة وبأسلوب Markdown احترافي وجميل حسب تعليمات المستخدم.
2. تزويدنا بملخص واضح، دقيق وموجز (سطر أو سطرين) لما تم إجراؤه من تعديلات ليتم توثيقه في سجل الإصدارات (Version History).`;

    const prompt = `عنوان المستند: "${title}"
نوع الإجراء: ${actionType}
التعليمات المحددة: "${instruction}"

المحتوى الحالي للمستند:
"""
${content}
"""

يرجى إرجاع المحتوى المحسن مع ملخص التعديلات بصيغة JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            updatedContent: { type: Type.STRING, description: 'المحتوى الجديد المعدل للمستند بالكامل' },
            changeSummary: { type: Type.STRING, description: 'ملخص موجز ودقيق للتغييرات التي أجراها الذكاء الاصطناعي' },
          },
          required: ['updatedContent', 'changeSummary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in AI Document Editor:', error);
    res.status(500).json({ error: error?.message || 'Failed to edit document with AI' });
  }
});

// ==========================================
// Cloud SQL (PostgreSQL) Authenticated Endpoints
// ==========================================

// Synchronize authenticated Firebase user to PostgreSQL users table
app.get('/api/user/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const firebaseUser = req.user!;
    const user = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || '',
      firebaseUser.name,
      firebaseUser.picture
    );
    res.json({ user });
  } catch (error: any) {
    console.error('Failed to sync user to Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// User Favorites endpoints powered by Cloud SQL
app.get('/api/user/favorites', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const firebaseUser = req.user!;
    const user = await getOrCreateUser(firebaseUser.uid, firebaseUser.email || '');
    const favorites = await getUserFavorites(user.id);
    res.json({ favorites });
  } catch (error: any) {
    console.error('Failed to fetch user favorites:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch favorites' });
  }
});

app.post('/api/user/favorites', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { toolId } = req.body;
    if (!toolId) {
      res.status(400).json({ error: 'toolId is required' });
      return;
    }
    const firebaseUser = req.user!;
    const user = await getOrCreateUser(firebaseUser.uid, firebaseUser.email || '');
    await addFavorite(user.id, toolId);
    res.json({ success: true, toolId });
  } catch (error: any) {
    console.error('Failed to add favorite:', error);
    res.status(500).json({ error: error.message || 'Failed to add favorite' });
  }
});

app.delete('/api/user/favorites/:toolId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { toolId } = req.params;
    const firebaseUser = req.user!;
    const user = await getOrCreateUser(firebaseUser.uid, firebaseUser.email || '');
    await removeFavorite(user.id, toolId);
    res.json({ success: true, toolId });
  } catch (error: any) {
    console.error('Failed to remove favorite:', error);
    res.status(500).json({ error: error.message || 'Failed to remove favorite' });
  }
});

// Document versions logged and queried from Cloud SQL
app.post('/api/user/documents/version', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id, title, content, category, versionNumber, summary, author, changeType } = req.body;
    if (!id || !title || content === undefined || !versionNumber) {
      res.status(400).json({ error: 'Missing required document fields' });
      return;
    }
    const firebaseUser = req.user!;
    const user = await getOrCreateUser(firebaseUser.uid, firebaseUser.email || '');
    await saveDocumentWithVersion({
      id,
      userId: user.id,
      title,
      content,
      category,
      versionNumber,
      summary: summary || 'حفظ إصدار جديد',
      author: author || firebaseUser.name || 'المستخدم',
      changeType: changeType || 'manual_edit',
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to record document version:', error);
    res.status(500).json({ error: error.message || 'Failed to record version' });
  }
});

app.get('/api/user/documents/:id/versions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const versions = await getDocumentVersions(id);
    res.json({ versions });
  } catch (error: any) {
    console.error('Failed to get versions:', error);
    res.status(500).json({ error: error.message || 'Failed to get versions' });
  }
});

// Vite middleware or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Tools Atlas server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
