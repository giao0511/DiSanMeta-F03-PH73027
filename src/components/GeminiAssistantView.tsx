import React, { useState } from 'react';
import {
  AlertTriangle,
  FlaskConical,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { evaluateRecordCompleteness } from '../constants/dublinCore';
import type {
  GeminiAskResponse,
  GeminiSuggestResponse,
  HeritageRecord,
  SourceItem,
} from '../types/heritage';

interface GeminiAssistantViewProps {
  realRecords: HeritageRecord[];
  realSources: SourceItem[];
  demoRecords: HeritageRecord[];
  demoSources: SourceItem[];
  geminiConfigured: boolean | null;
}

export const GeminiAssistantView: React.FC<GeminiAssistantViewProps> = ({
  realRecords,
  realSources,
  demoRecords,
  demoSources,
  geminiConfigured,
}) => {
  const [question, setQuestion] = useState('');
  const [useDemoSandbox, setUseDemoSandbox] = useState(false);
  const [asking, setAsking] = useState(false);
  const [askResult, setAskResult] = useState<GeminiAskResponse | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  // Completeness & Description Suggestion Tool
  const [selectedRecordCode, setSelectedRecordCode] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestResult, setSuggestResult] = useState<GeminiSuggestResponse | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const activeRecords = useDemoSandbox ? demoRecords : realRecords;
  const activeSources = useDemoSandbox ? demoSources : realSources;

  const selectedRecord = activeRecords.find((r) => r.recordCode === selectedRecordCode) ?? null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAskError(null);
    setAskResult(null);

    try {
      const compactRecords = activeRecords.map((r) => ({
        recordCode: r.recordCode,
        dcTitle: r.dcTitle,
        dcCreator: r.dcCreator,
        dcSubject: r.dcSubject,
        dcDescription: r.dcDescription,
        dcDate: r.dcDate,
        dcType: r.dcType,
        dcFormat: r.dcFormat,
        dcSource: r.dcSource,
        dcLanguage: r.dcLanguage,
        dcCoverage: r.dcCoverage,
        dcRights: r.dcRights,
        currentRepository: r.currentRepository,
        historicalRepository: r.historicalRepository,
        manifestationType: r.manifestationType,
        originalCondition: r.originalCondition,
        damageDescription: r.damageDescription,
        repositoryRegistrationNo: r.repositoryRegistrationNo,
        recordRightsStatus: r.recordRightsStatus,
        rightsScope: r.rightsScope,
        transcriptionVerification: r.transcriptionVerification,
        translationVerification: r.translationVerification,
        recordVerificationLevel: r.recordVerificationLevel,
        unclearPoints: r.unclearPoints,
        sourceIds: r.sourceIds,
        evidenceMappings: r.evidenceMappings,
      }));

      const compactSources = activeSources.map((s) => ({
        id: s.id,
        organizationOrAuthor: s.organizationOrAuthor,
        documentTitle: s.documentTitle,
        urlOrArchiveCode: s.urlOrArchiveCode,
        sourceCategory: s.sourceCategory,
        sourceLevel: s.sourceLevel,
        provableScope: s.provableScope,
        verificationStatus: s.verificationStatus,
      }));

      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          records: compactRecords,
          sources: compactSources,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể kết nối máy chủ Gemini.');
      }
      setAskResult(data as GeminiAskResponse);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Lỗi truy vấn Gemini.');
    } finally {
      setAsking(false);
    }
  };

  const handleAuditSuggest = async () => {
    if (!selectedRecord && !extraNotes.trim()) {
      setSuggestError('Vui lòng chọn một bản ghi hoặc nhập ghi chú thông tin cần Gemini rà soát.');
      return;
    }
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestResult(null);

    try {
      const res = await fetch('/api/gemini/suggest-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record: selectedRecord ?? undefined,
          userNotes: extraNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể chạy rà soát Gemini.');
      }
      setSuggestResult(data as GeminiSuggestResponse);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Lỗi khi gọi Gemini.');
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E3DDD2] pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B5B3E] font-medium">
            Tra cứu theo dữ liệu lưu trữ
          </p>
          <h1 className="font-serif text-3xl font-semibold text-[#162436] mt-1">
            Trợ lý Tra cứu Tư liệu
          </h1>
          <p className="text-sm text-[#4B5B6E] mt-1 max-w-2xl">
            Hỏi đáp và rà soát thông tin chỉ dựa trên hồ sơ bia và nguồn sử liệu đã lưu trong kho DiSanMeta.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUseDemoSandbox((v) => !v);
            setAskResult(null);
            setSelectedRecordCode('');
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md border cursor-pointer shrink-0 ${
            useDemoSandbox
              ? 'bg-[#9A7B3E]/15 border-[#9A7B3E] text-[#785E2B]'
              : 'bg-white border-[#D7CFC0] text-[#4B5B6E] hover:text-[#162436]'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>
            {useDemoSandbox
              ? 'Đang thử trên dữ liệu DEMO'
              : `Dữ liệu thật: ${realRecords.length} hồ sơ · ${realSources.length} nguồn`}
          </span>
        </button>
      </div>

      {geminiConfigured === false && (
        <div className="bg-[#FDF2EF] border border-[#E5C6BD] rounded-lg p-4 text-xs text-[#9A3412] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Chưa cấu hình GEMINI_API_KEY ở máy chủ:</strong> Chức năng tra cứu ngoài dữ liệu vẫn trả lời an toàn khi kho trống, nhưng các lệnh gọi model Gemini cần biến môi trường <span className="font-mono">GEMINI_API_KEY</span> được cấu hình trong Settings &gt; Secrets của hệ thống triển khai.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Grounded Q&A */}
        <section className="lg:col-span-7 bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-5">
          <div className="border-b border-[#EFEAE0] pb-3 space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#162436]">
              Hỏi đáp theo dữ liệu đã lưu
            </h2>
            <p className="text-xs text-[#64748B]">
              Bắt buộc kèm mã bản ghi, nơi lưu giữ, loại bản và nguồn liên quan. Nếu thiếu bằng chứng hoặc ngoài dữ liệu đã lưu, hệ thống trả lời đúng câu: &quot;Chưa có đủ tư liệu được kiểm chứng để trả lời câu hỏi này&quot;.
            </p>
            <p className="text-xs font-mono text-[#162436] bg-[#FBF9F5] border border-[#E3DDD2] rounded px-3 py-1.5">
              Phạm vi đang nạp: {activeRecords.length} hồ sơ bia · {activeSources.length} nguồn (gồm 7 nguồn N01–N07)
            </p>
          </div>

          <form onSubmit={handleAsk} className="space-y-3">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ví dụ: 7 nguồn cấp bộ sưu tập N01–N07 hiện có gồm những cơ quan nào? Hoặc thử hỏi kích thước một tấm bia cụ thể để kiểm tra cơ chế từ chối..."
              className="w-full p-3 text-sm border border-[#D7CFC0] rounded-md bg-[#FBF9F5] focus:outline-none focus:border-[#162436]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      '7 nguồn cấp bộ sưu tập N01–N07 hiện có gồm những cơ quan nào và chứng minh được phạm vi thông tin gì?'
                    )
                  }
                  className="px-2.5 py-1.5 text-xs border border-[#E3DDD2] rounded bg-[#FBF9F5] text-[#4B5B6E] hover:text-[#162436] cursor-pointer"
                >
                  Hỏi về 7 nguồn N01–N07
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      'Trong dữ liệu đã lưu hiện có những hồ sơ bia nào và trạng thái kiểm chứng ra sao?'
                    )
                  }
                  className="px-2.5 py-1.5 text-xs border border-[#E3DDD2] rounded bg-[#FBF9F5] text-[#4B5B6E] hover:text-[#162436] cursor-pointer"
                >
                  Hỏi hồ sơ hiện có
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      'Hãy cho biết kích thước chính xác của bia Tiến sĩ khoa năm 1448 và toàn bộ danh sách Tiến sĩ khắc trên bia đó?'
                    )
                  }
                  className="px-2.5 py-1.5 text-xs border border-[#E3DDD2] rounded bg-[#FBF9F5] text-[#4B5B6E] hover:text-[#162436] cursor-pointer"
                >
                  Thử câu hỏi ngoài dữ liệu
                </button>
              </div>

              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-[#162436] text-[#FBF9F5] rounded-md hover:bg-[#233752] disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#D8B979]" />
                <span>{asking ? 'Đang đối chiếu...' : 'Gửi câu hỏi'}</span>
              </button>
            </div>
          </form>

          {askError && (
            <div className="bg-[#FDF2EF] border border-[#E5C6BD] rounded-md p-3 text-xs text-[#9A3412]">
              {askError}
            </div>
          )}

          {askResult && (
            <div className="border border-[#D7CFC0] rounded-lg p-5 bg-[#FBF9F5] space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6B501D]">
                <AlertTriangle className="w-4 h-4 text-[#9A7B3E]" />
                <span>
                  Kết quả AI tổng hợp — Chưa kiểm chứng cho đến khi quản trị viên đối chiếu nguồn
                </span>
              </div>

              <p className="text-sm text-[#162436] leading-relaxed whitespace-pre-line font-medium">
                {askResult.answer}
              </p>

              {askResult.citations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E3DDD2]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Căn cứ bản ghi &amp; Nguồn liên quan
                  </p>
                  <div className="space-y-2">
                    {askResult.citations.map((cit, i) => (
                      <div
                        key={i}
                        className="bg-white border border-[#E3DDD2] rounded-md p-3 text-xs space-y-1"
                      >
                        <p className="font-semibold text-[#162436]">
                          <span className="font-mono text-[#9A7B3E] mr-1.5">{cit.recordCode}</span>
                          {cit.title}
                        </p>
                        <p className="text-[#4B5B6E]">
                          Nơi lưu giữ: {cit.repository} · Loại bản: {cit.manifestationType} · Mức kiểm chứng:{' '}
                          {cit.verificationLevel}
                        </p>
                        <p className="text-[#64748B]">
                          Nguồn liên quan:{' '}
                          {cit.relatedSources.length > 0
                            ? cit.relatedSources.join('; ')
                            : 'Chưa gắn nguồn'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[#64748B] border-t border-[#E3DDD2] pt-2">
                {askResult.verificationNote}
              </p>
            </div>
          )}
        </section>

        {/* Right: Field Auditor & Description Assistant */}
        <section className="lg:col-span-5 bg-white border border-[#E3DDD2] rounded-lg p-6 space-y-4">
          <div className="border-b border-[#EFEAE0] pb-3">
            <h2 className="font-serif text-xl font-semibold text-[#162436]">
              Rà soát trường thiếu &amp; Gợi ý mô tả
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Chọn bản ghi đã lưu hoặc nhập ghi chú khảo sát để phát hiện trường thiếu và đề xuất điểm cần kiểm chứng.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#162436] mb-1">
                Chọn bản ghi cần rà soát
              </label>
              <select
                value={selectedRecordCode}
                onChange={(e) => setSelectedRecordCode(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
              >
                <option value="">-- Hoặc chỉ dùng ghi chú bên dưới --</option>
                {activeRecords.map((r) => (
                  <option key={r.recordCode} value={r.recordCode}>
                    {r.recordCode} — {r.dcTitle.slice(0, 48)}
                  </option>
                ))}
              </select>
            </div>

            {selectedRecord && (
              <div className="bg-[#FBF9F5] border border-[#E3DDD2] rounded p-3 text-xs space-y-1">
                {(() => {
                  const comp = evaluateRecordCompleteness(selectedRecord, activeSources);
                  return (
                    <>
                      <p className="font-semibold text-[#162436]">
                        Kiểm tra cấu trúc trực tiếp: {comp.completionPercent}%
                      </p>
                      <p className="text-[#64748B]">
                        Thiếu {comp.missingDcFields.length} trường Dublin Core ·{' '}
                        {comp.missingArchivalFields.length} trường lưu trữ/kiểm chứng · Nguồn riêng:{' '}
                        {comp.steleSpecificSourceCount}
                      </p>
                      {!comp.hasSufficientEvidence && (
                        <p className="text-[#9A3412] font-medium">
                          Chưa đủ dữ liệu / bằng chứng kiểm chứng nguồn riêng.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#162436] mb-1">
                Thông tin người dùng cung cấp thêm
              </label>
              <textarea
                rows={4}
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="Nhập ghi chép thực địa hoặc dữ kiện bạn có để Gemini chuẩn hóa thành đề xuất mô tả (không tự thêm dữ kiện ngoài ghi chú)..."
                className="w-full p-3 text-sm border border-[#D7CFC0] rounded-md bg-[#FBF9F5]"
              />
            </div>

            <button
              type="button"
              onClick={handleAuditSuggest}
              disabled={suggestLoading}
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-medium bg-[#9A7B3E] text-white rounded-md hover:bg-[#785E2B] disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{suggestLoading ? 'Đang phân tích...' : 'Chạy rà soát & Đề xuất Gemini'}</span>
            </button>
          </div>

          {suggestError && (
            <div className="bg-[#FDF2EF] border border-[#E5C6BD] rounded-md p-3 text-xs text-[#9A3412]">
              {suggestError}
            </div>
          )}

          {suggestResult && (
            <div className="bg-[#FDF8EE] border border-[#DFC99B] rounded-md p-4 space-y-3 text-xs">
              <p className="font-semibold text-[#9A3412]">{suggestResult.disclaimer}</p>
              <div>
                <p className="font-semibold text-[#162436]">Đề xuất mô tả:</p>
                <p className="text-[#3E4C5E] mt-0.5 whitespace-pre-line">
                  {suggestResult.suggestedDescription}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#162436]">Từ khóa chủ đề đề xuất:</p>
                <p className="text-[#3E4C5E] mt-0.5">{suggestResult.suggestedSubject}</p>
              </div>
              {suggestResult.missingFields.length > 0 && (
                <div>
                  <p className="font-semibold text-[#162436]">Trường còn thiếu:</p>
                  <ul className="list-disc list-inside text-[#4B5B6E] mt-0.5">
                    {suggestResult.missingFields.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {suggestResult.verificationSuggestions.length > 0 && (
                <div>
                  <p className="font-semibold text-[#162436]">Điểm cần đối chiếu nguồn:</p>
                  <ul className="list-disc list-inside text-[#4B5B6E] mt-0.5">
                    {suggestResult.verificationSuggestions.map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
