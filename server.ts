import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  if (/^10\./.test(lower) || /^192\.168\./.test(lower) || /^169\.254\./.test(lower)) {
    return true;
  }
  const match172 = /^172\.(\d+)\./.exec(lower);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

interface CompactRecordPayload {
  recordCode: string;
  dcTitle: string;
  dcCreator?: string;
  dcSubject?: string;
  dcDescription?: string;
  dcDate?: string;
  dcType?: string;
  dcFormat?: string;
  dcSource?: string;
  dcLanguage?: string;
  dcCoverage?: string;
  dcRights?: string;
  currentRepository?: string;
  historicalRepository?: string;
  manifestationType: string;
  originalCondition?: string;
  damageDescription?: string;
  repositoryRegistrationNo?: string;
  transcriptionVerification: string;
  translationVerification: string;
  recordVerificationLevel: string;
  unclearPoints?: string;
  sourceIds?: string[];
}

interface CompactSourcePayload {
  id: string;
  organizationOrAuthor: string;
  documentTitle: string;
  urlOrArchiveCode: string;
  sourceCategory: string;
  sourceLevel?: string;
  provableScope?: string;
  verificationStatus: string;
}

const OUT_OF_SCOPE_MSG = 'Chưa có đủ tư liệu được kiểm chứng để trả lời câu hỏi này';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '');
  res.json({
    status: 'ok',
    geminiConfigured,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/sources/check-url', async (req, res) => {
  try {
    const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Thiếu địa chỉ URL cần kiểm tra.' });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.json({
        reachable: false,
        isHttpUrl: false,
        statusCode: null,
        checkedAt: new Date().toISOString(),
        message: 'Chưa xác minh liên kết (đây là mã hồ sơ lưu trữ nội bộ hoặc không phải URL HTTP/HTTPS). Vui lòng đối chiếu thủ công.',
      });
      return;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.json({
        reachable: false,
        isHttpUrl: false,
        statusCode: null,
        checkedAt: new Date().toISOString(),
        message: 'Chưa xác minh liên kết (chỉ hỗ trợ kiểm tra http:// hoặc https://).',
      });
      return;
    }

    if (isPrivateOrLocalHostname(parsed.hostname)) {
      res.status(400).json({ error: 'Không cho phép kiểm tra địa chỉ mạng nội bộ.' });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    try {
      let response = await fetch(parsed.toString(), {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'DiSanMeta-LinkChecker/1.0' },
      });
      if (response.status === 405 || response.status === 403 || response.status === 400) {
        response = await fetch(parsed.toString(), {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'DiSanMeta-LinkChecker/1.0' },
        });
      }
      clearTimeout(timer);
      const reachable = response.status >= 200 && response.status < 400;
      const isBotBlocked = response.status === 401 || response.status === 403;
      res.json({
        reachable,
        isHttpUrl: true,
        statusCode: response.status,
        checkedAt: new Date().toISOString(),
        message: reachable
          ? `Liên kết hoạt động (HTTP ${response.status}). Lưu ý: kiểm tra kỹ thuật chỉ xác nhận URL phản hồi, quản trị viên phải tự đọc và đối chiếu nội dung trước khi chuyển sang "Đã đối chiếu nguồn".`
          : isBotBlocked
          ? `Chưa xác minh liên kết — Cổng thông tin đích chặn kiểm tra tự động (HTTP ${response.status}). Điều này không đồng nghĩa liên kết hỏng; vui lòng bấm "Mở nguồn gốc" để kiểm tra trực tiếp trên trình duyệt.`
          : `Chưa xác minh liên kết (máy chủ đích trả về HTTP ${response.status}). Vui lòng mở nguồn gốc và kiểm tra thủ công.`,
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      const errMsg = fetchErr instanceof Error ? fetchErr.message : 'Lỗi kết nối';
      res.json({
        reachable: false,
        isHttpUrl: true,
        statusCode: null,
        checkedAt: new Date().toISOString(),
        message: `Chưa xác minh liên kết (không thể truy cập tự động: ${errMsg}). Vui lòng mở nguồn gốc để kiểm tra thủ công.`,
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Lỗi máy chủ khi kiểm tra liên kết.',
    });
  }
});

app.post('/api/gemini/suggest-description', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Máy chủ chưa được cấu hình GEMINI_API_KEY. Vui lòng thiết lập khóa API trong Settings > Secrets của môi trường triển khai.',
      });
      return;
    }

    const record = req.body?.record as Partial<CompactRecordPayload> | undefined;
    const rawNotes = typeof req.body?.userNotes === 'string' ? req.body.userNotes.trim() : '';

    if (!record && !rawNotes) {
      res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu bản ghi hoặc ghi chú người dùng để Gemini hỗ trợ rà soát.' });
      return;
    }

    const systemInstruction = [
      'Bạn là chuyên gia chuẩn Dublin Core và kiểm chứng dữ liệu di sản tư liệu Việt Nam trong hệ thống DiSanMeta.',
      'NGUYÊN TẮC BẮT BUỘC (TUYỆT ĐỐI KHÔNG VI PHẠM):',
      '1. CHỈ tổng hợp, chuẩn hóa văn phong mô tả từ ĐÚNG thông tin người dùng cung cấp trong bản ghi và ghi chú.',
      '2. TUYỆT ĐỐI KHÔNG tự bịa niên đại, tên nhân vật lịch sử, khoa thi, quyết định công nhận, kích thước, lời phiên âm hoặc lời dịch nếu không có trong dữ liệu đầu vào.',
      '3. Nếu thiếu thông tin, ghi rõ trạng thái "Chưa xác định" hoặc "Chưa đủ bằng chứng" và liệt kê vào danh sách trường còn thiếu hoặc điểm cần kiểm chứng.',
      '4. KHÔNG BAO GIỜ tự xác nhận một thông tin lịch sử là đúng hay đánh dấu "Đã đối chiếu nguồn". Mọi đầu ra đều là ĐỀ XUẤT CHƯA KIỂM CHỨNG dành cho quản trị viên.',
      '5. Trả lời bằng tiếng Việt rõ ràng, súc tích, chuẩn học thuật bảo tàng/thư viện số.',
    ].join('\n');

    const promptPayload = JSON.stringify({ record: record ?? {}, userNotes: rawNotes }, null, 2);

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Hãy phân tích thông tin bản ghi tư liệu dưới đây để đề xuất nội dung mô tả Dublin Core (chỉ dựa trên thông tin đã cung cấp), phát hiện các trường còn thiếu, và gợi ý các điểm cần kiểm chứng nguồn gốc:\n\n${promptPayload}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedDescription: {
              type: Type.STRING,
              description: 'Đoạn đề xuất trường Description dựa hoàn toàn trên thông tin đầu vào, không suy đoán.',
            },
            suggestedSubject: {
              type: Type.STRING,
              description: 'Đề xuất từ khóa chủ đề (Subject) dựa trên thông tin đầu vào.',
            },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Danh sách tên tiếng Việt các trường Dublin Core hoặc trường lưu trữ/kiểm chứng còn thiếu hoặc đang "Chưa xác định".',
            },
            verificationSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Danh sách các điểm cụ thể cần đối chiếu với nguồn chính thống trước khi quản trị viên xác nhận.',
            },
            disclaimer: {
              type: Type.STRING,
              description: 'Cảnh báo đây là đề xuất AI chưa kiểm chứng.',
            },
          },
          required: ['suggestedDescription', 'suggestedSubject', 'missingFields', 'verificationSuggestions', 'disclaimer'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      ...parsed,
      isUnverifiedSuggestion: true,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi gọi Gemini API.';
    res.status(500).json({ error: `Không thể xử lý yêu cầu Gemini: ${message}` });
  }
});

app.post('/api/gemini/ask', async (req, res) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    const records = Array.isArray(req.body?.records) ? (req.body.records as CompactRecordPayload[]) : [];
    const sources = Array.isArray(req.body?.sources) ? (req.body.sources as CompactSourcePayload[]) : [];

    if (!question) {
      res.status(400).json({ error: 'Vui lòng nhập câu hỏi cần tra cứu.' });
      return;
    }

    if (records.length === 0 && sources.length === 0) {
      res.json({
        answeredFromData: false,
        answer: OUT_OF_SCOPE_MSG,
        citations: [],
        verificationNote: 'Bộ dữ liệu hồ sơ và nguồn đang trống. Vui lòng nhập và đối chiếu nguồn tư liệu trước khi tra cứu.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Máy chủ chưa được cấu hình GEMINI_API_KEY. Vui lòng thiết lập khóa API trong Settings > Secrets của môi trường triển khai.',
      });
      return;
    }

    const systemInstruction = [
      'Bạn là trợ lý tra cứu di sản tư liệu số DiSanMeta.',
      'QUY TẮC NGHIÊM NGẶT NHẤT:',
      '1. CHỈ được trả lời dựa trên danh sách HỒ SƠ (records) và NGUỒN TƯ LIỆU (sources) được cung cấp trong prompt dưới đây.',
      '2. KHÔNG ĐƯỢC SỬ DỤNG kiến thức bên ngoài, KHÔNG tự tạo niên đại, tên người, khoa thi, kích thước, quyết định công nhận, lời dịch hoặc bất kỳ dữ kiện lịch sử nào không nằm nguyên văn/trực tiếp trong dữ liệu đầu vào.',
      '3. Nếu danh sách records trống và câu hỏi hỏi về thông tin chi tiết của một tấm bia cụ thể (niên đại, người đỗ, nội dung văn bia), hoặc câu hỏi nằm ngoài dữ liệu đã lưu, BẮT BUỘC đặt answeredFromData = false và trả về chính xác câu: "' + OUT_OF_SCOPE_MSG + '".',
      '4. Khi trả lời dựa trên dữ liệu có sẵn (answeredFromData = true), MỖI căn cứ trong mảng citations BẮT BUỘC phải ghi đầy đủ: recordCode (mã hồ sơ hoặc mã nguồn như N01..N07), title, repository (nơi lưu giữ), manifestationType (loại bản đang hiển thị hoặc "Nguồn tham chiếu cấp bộ sưu tập"), verificationLevel, và relatedSources (danh sách nguồn liên quan).',
      '5. TUYỆT ĐỐI KHÔNG cho phép tự xác nhận thông tin lịch sử là đúng hay đánh dấu "Đã đối chiếu nguồn". Luôn nhắc rõ đây là tổng hợp chưa kiểm chứng cho tới khi quản trị viên đối chiếu.',
    ].join('\n');

    const contextPayload = JSON.stringify({ records, sources }, null, 2);

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `DỮ LIỆU ĐÃ LƯU TRONG HỆ THỐNG:\n${contextPayload}\n\nCÂU HỎI CỦA NGƯỜI DÙNG:\n${question}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answeredFromData: {
              type: Type.BOOLEAN,
              description: 'true nếu dữ liệu đầu vào có thông tin trả lời câu hỏi; false nếu thiếu bằng chứng hoặc nằm ngoài dữ liệu.',
            },
            answer: {
              type: Type.STRING,
              description: `Câu trả lời tiếng Việt. Nếu answeredFromData là false, phải là "${OUT_OF_SCOPE_MSG}"`,
            },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  recordCode: { type: Type.STRING },
                  title: { type: Type.STRING },
                  repository: { type: Type.STRING },
                  manifestationType: { type: Type.STRING },
                  verificationLevel: { type: Type.STRING },
                  relatedSources: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['recordCode', 'title', 'repository', 'manifestationType', 'verificationLevel', 'relatedSources'],
              },
            },
            verificationNote: {
              type: Type.STRING,
              description: 'Lưu ý kiểm chứng dành cho quản trị viên.',
            },
          },
          required: ['answeredFromData', 'answer', 'citations', 'verificationNote'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (!parsed.answeredFromData) {
      res.json({
        answeredFromData: false,
        answer: OUT_OF_SCOPE_MSG,
        citations: [],
        verificationNote: parsed.verificationNote || 'Thông tin hỏi nằm ngoài phạm vi tư liệu đã lưu trong cơ sở dữ liệu.',
      });
      return;
    }

    res.json({
      answeredFromData: true,
      answer: parsed.answer,
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      verificationNote: parsed.verificationNote || 'Kết quả do AI tổng hợp từ dữ liệu đã lưu — AI không tự xác nhận thông tin là đúng; cần quản trị viên đối chiếu nguồn gốc.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi gọi Gemini API.';
    res.status(500).json({ error: `Không thể truy vấn Gemini: ${message}` });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DiSanMeta server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
