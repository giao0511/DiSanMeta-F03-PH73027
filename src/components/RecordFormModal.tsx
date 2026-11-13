import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CopyCheck,
  ImagePlus,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  DUBLIN_CORE_FIELDS,
  evaluateRecordCompleteness,
} from '../constants/dublinCore';
import { estimateJsonByteSize } from '../lib/textUtils';
import type {
  ClaimVerificationResult,
  EvidenceMapping,
  GeminiSuggestResponse,
  HeritageRecord,
  ImageAsset,
  SourceItem,
} from '../types/heritage';

interface RecordFormModalProps {
  initialRecord: HeritageRecord | null;
  nextRecordCode: string;
  sources: SourceItem[];
  onClose: () => void;
  onSave: (record: HeritageRecord, isNew: boolean, previousLevel?: string) => Promise<void>;
}

type FormStep = 'dublin-core' | 'archival-text' | 'sources-evidence' | 'rights-images';

const FORM_STEPS: Array<{ id: FormStep; shortLabel: string; index: number }> = [
  { id: 'dublin-core', shortLabel: '1. Mã & 15 trường Dublin Core', index: 1 },
  { id: 'archival-text', shortLabel: '2. Lưu trữ & Văn bản', index: 2 },
  { id: 'sources-evidence', shortLabel: '3. Nguồn & Kiểm chứng', index: 3 },
  { id: 'rights-images', shortLabel: '4. Quyền & Ảnh tư liệu', index: 4 },
];

const F03_CODE_OPTIONS = Array.from({ length: 15 }, (_, idx) =>
  `F03-${String(idx + 1).padStart(5, '0')}`
);

const MAX_SAFE_FIRESTORE_BYTES = 950 * 1024; // Ngưỡng an toàn dưới giới hạn 1 MiB/document của Firestore

function createEmptyRecord(code: string): HeritageRecord {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: code,
    recordCode: code,
    collectionId: 'f03-van-mieu',
    dcTitle: '',
    dcCreator: 'Chưa xác định',
    dcSubject: 'Chưa xác định',
    dcDescription: 'Chưa xác định',
    dcPublisher: 'Chưa xác định',
    dcContributor: 'Chưa xác định',
    dcDate: 'Chưa xác định',
    dcType: 'Bia Tiến sĩ',
    dcFormat: 'Chưa xác định',
    dcIdentifier: code,
    dcSource: 'Chưa xác định',
    dcLanguage: 'Chưa xác định',
    dcRelation: 'Chưa xác định',
    dcCoverage: 'Chưa xác định',
    dcRights: 'Chưa xác minh quyền — Mặc định chưa hiển thị ảnh công khai.',
    currentRepository:
      'Khu bia Tiến sĩ, Văn Miếu – Quốc Tử Giám, số 58 Quốc Tử Giám, phường Văn Miếu – Quốc Tử Giám, thành phố Hà Nội',
    sensitiveStorageNote: '',
    historicalRepository: 'Chưa xác định',
    manifestationType: 'Chưa xác định',
    originalCondition: 'Chưa xác định',
    damageDescription: 'Chưa xác định',
    repositoryRegistrationNo: 'Chưa xác định',
    rightsAuthority: 'Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu – Quốc Tử Giám',
    rightsConfirmedBy: 'Chưa xác định',
    rightsConsentDate: 'Chưa xác định',
    rightsEvidence: 'Chưa xác định',
    rightsScope: 'Chưa xác định',
    recordRightsStatus: 'Chưa xác minh quyền',
    allowImagePublish: false,
    allowImageDownload: false,
    nonPublicContent: '',
    transcriptionText: '',
    transcriptionVerification: 'Chờ kiểm chứng',
    translationText: '',
    translationVerification: 'Chờ kiểm chứng',
    verifierName: 'Chưa xác định',
    verifiedDate: 'Chưa xác định',
    digitizerName: 'Trần Trung Hiếu',
    digitizedDate: today,
    unclearPoints: 'Chưa xác định',
    recordVerificationLevel: 'Chưa có nguồn',
    isPubliclyPublished: true,
    images: [],
    sourceIds: [],
    evidenceMappings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1100;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể xử lý ảnh trên trình duyệt.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.76));
      };
      img.onerror = () => reject(new Error('Tệp ảnh không hợp lệ.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.readAsDataURL(file);
  });
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  initialRecord,
  nextRecordCode,
  sources,
  onClose,
  onSave,
}) => {
  const isNew = !initialRecord;
  const [activeStep, setActiveStep] = useState<FormStep>('dublin-core');
  const [form, setForm] = useState<HeritageRecord>(() =>
    initialRecord ? { ...initialRecord } : createEmptyRecord(nextRecordCode)
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  const [userNotesForAi, setUserNotesForAi] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<GeminiSuggestResponse | null>(null);

  const [imgUrlInput, setImgUrlInput] = useState('');
  const [imgViewType, setImgViewType] = useState<'toàn cảnh' | 'cận cảnh'>('toàn cảnh');
  const [imgCaption, setImgCaption] = useState('');
  const [imgSource, setImgSource] = useState('');
  const [imgPhotographer, setImgPhotographer] = useState('');
  const [imgUploading, setImgUploading] = useState(false);

  // Evidence verification entry draft
  const [evField, setEvField] = useState('Niên đại (Date)');
  const [evValue, setEvValue] = useState('');
  const [evSourceId, setEvSourceId] = useState('');
  const [evDetail, setEvDetail] = useState('');
  const [evVerifier, setEvVerifier] = useState('Trần Trung Hiếu');
  const [evDate, setEvDate] = useState(new Date().toISOString().slice(0, 10));
  const [evResult, setEvResult] = useState<ClaimVerificationResult>('Chờ kiểm chứng');

  // Lọc bỏ tài liệu kỹ thuật/pháp lý khỏi nguồn bằng chứng lịch sử của bia
  const historicalSources = useMemo(
    () =>
      sources.filter(
        (s) => s.sourceCategory !== 'Tài liệu kỹ thuật' && s.sourceCategory !== 'Tài liệu pháp lý'
      ),
    [sources]
  );
  const steleSources = useMemo(
    () => historicalSources.filter((s) => s.sourceLevel === 'Cấp từng bia'),
    [historicalSources]
  );
  const collectionSources = useMemo(
    () => historicalSources.filter((s) => s.sourceLevel === 'Cấp bộ sưu tập'),
    [historicalSources]
  );

  const completeness = useMemo(
    () => evaluateRecordCompleteness(form, sources),
    [form, sources]
  );

  const estimatedBytes = useMemo(() => estimateJsonByteSize(form), [form]);
  const estimatedKb = Math.round(estimatedBytes / 1024);
  const isOverFirestoreLimit = estimatedBytes > MAX_SAFE_FIRESTORE_BYTES;

  const updateField = <K extends keyof HeritageRecord>(key: K, value: HeritageRecord[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFillUnknownDefaults = () => {
    setForm((prev) => {
      const updated = { ...prev };
      for (const spec of DUBLIN_CORE_FIELDS) {
        const val = String(updated[spec.key] ?? '').trim();
        if (!val && spec.key !== 'dcTitle') {
          (updated[spec.key] as string) = 'Chưa xác định';
        }
      }
      if (!updated.historicalRepository.trim()) updated.historicalRepository = 'Chưa xác định';
      if (!updated.originalCondition.trim()) updated.originalCondition = 'Chưa xác định';
      if (!updated.damageDescription.trim()) updated.damageDescription = 'Chưa xác định';
      if (!updated.repositoryRegistrationNo.trim()) updated.repositoryRegistrationNo = 'Chưa xác định';
      if (!updated.rightsConfirmedBy.trim()) updated.rightsConfirmedBy = 'Chưa xác định';
      if (!updated.rightsConsentDate.trim()) updated.rightsConsentDate = 'Chưa xác định';
      if (!updated.rightsEvidence.trim()) updated.rightsEvidence = 'Chưa xác định';
      if (!updated.rightsScope.trim()) updated.rightsScope = 'Chưa xác định';
      if (!updated.verifierName.trim()) updated.verifierName = 'Chưa xác định';
      if (!updated.verifiedDate.trim()) updated.verifiedDate = 'Chưa xác định';
      if (!updated.unclearPoints.trim()) updated.unclearPoints = 'Chưa xác định';
      return updated;
    });
    setInfoBanner('Đã điền "Chưa xác định" vào các ô còn bỏ trống (không thay thế dữ liệu đã nhập).');
  };

  /**
   * Chỉ điền khung siêu dữ liệu chung của bộ sưu tập Văn Miếu – Quốc Tử Giám;
   * tuyệt đối KHÔNG điền giả nhan đề, niên đại, tác giả hoặc văn bia riêng từng bia.
   */
  const handleFillCollectionFraming = () => {
    const isBlank = (v: string) => !v.trim() || v.trim().toLowerCase() === 'chưa xác định';
    setForm((prev) => ({
      ...prev,
      dcType: isBlank(prev.dcType) ? 'Bia Tiến sĩ' : prev.dcType,
      dcPublisher: isBlank(prev.dcPublisher)
        ? 'Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu – Quốc Tử Giám (khi được cấp phép công bố)'
        : prev.dcPublisher,
      dcContributor: isBlank(prev.dcContributor)
        ? 'Nhóm 1 – Đề tài F03 (Trần Trung Hiếu, MSV: PH73027)'
        : prev.dcContributor,
      dcLanguage: isBlank(prev.dcLanguage)
        ? 'Chữ Hán (văn bia gốc); Tiếng Việt (phiên âm, dịch nghĩa, mô tả)'
        : prev.dcLanguage,
      dcRelation: isBlank(prev.dcRelation)
        ? 'Thuộc quần thể 82 Bia Tiến sĩ Văn Miếu – Quốc Tử Giám (Di sản tư liệu thế giới UNESCO)'
        : prev.dcRelation,
      dcCoverage: isBlank(prev.dcCoverage)
        ? 'Văn Miếu – Quốc Tử Giám, Hà Nội (Thăng Long)'
        : prev.dcCoverage,
      currentRepository:
        'Khu bia Tiến sĩ, Văn Miếu – Quốc Tử Giám, số 58 Quốc Tử Giám, phường Văn Miếu – Quốc Tử Giám, thành phố Hà Nội',
      rightsAuthority:
        'Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu – Quốc Tử Giám',
    }));
    setInfoBanner(
      'Đã điền sẵn khung thông tin chung của bộ sưu tập Văn Miếu (không tự tạo nhan đề, niên đại hay văn bia riêng).'
    );
  };

  const handleRequestAiSuggest = async () => {
    setAiLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/suggest-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: form, userNotes: userNotesForAi }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lấy gợi ý từ Gemini.');
      }
      setAiSuggestion(data as GeminiSuggestResponse);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi gọi Gemini.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    setErrorMsg(null);
    try {
      const compressed = await compressImageFile(file);
      const projectedBytes = estimatedBytes + compressed.length;
      if (projectedBytes > MAX_SAFE_FIRESTORE_BYTES) {
        setErrorMsg(
          `Ảnh sau nén làm tổng dung lượng hồ sơ (~${Math.round(
            projectedBytes / 1024
          )} KB) tiệm cận giới hạn 1 MB của Firestore. Nên dùng URL ảnh lưu trữ ngoài hoặc giảm số ảnh đính kèm trực tiếp.`
        );
      }
      setImgUrlInput(compressed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể xử lý tệp ảnh.');
    } finally {
      setImgUploading(false);
    }
  };

  const handleAddImage = () => {
    if (!imgUrlInput.trim()) {
      setErrorMsg('Vui lòng tải lên tệp ảnh thật hoặc nhập URL ảnh hợp lệ.');
      return;
    }
    if (!imgSource.trim()) {
      setErrorMsg('Mỗi ảnh bắt buộc phải ghi rõ nguồn ảnh.');
      return;
    }
    const newImg: ImageAsset = {
      id: `img-${Date.now()}`,
      url: imgUrlInput.trim(),
      viewType: imgViewType,
      caption: imgCaption.trim() || `Ảnh ${imgViewType} ${form.recordCode}`,
      imageSource: imgSource.trim(),
      photographer: imgPhotographer.trim() || undefined,
      rightsVerified: false,
      allowWebDisplay: false,
      allowDownload: false,
    };
    updateField('images', [...form.images, newImg]);
    setImgUrlInput('');
    setImgCaption('');
    setImgSource('');
    setImgPhotographer('');
    setErrorMsg(null);
  };

  const toggleImagePermission = (
    imgId: string,
    field: 'rightsVerified' | 'allowWebDisplay' | 'allowDownload'
  ) => {
    updateField(
      'images',
      form.images.map((img) => (img.id === imgId ? { ...img, [field]: !img[field] } : img))
    );
  };

  const removeImage = (imgId: string) => {
    updateField(
      'images',
      form.images.filter((img) => img.id !== imgId)
    );
  };

  const toggleSource = (sourceId: string) => {
    if (form.sourceIds.includes(sourceId)) {
      updateField(
        'sourceIds',
        form.sourceIds.filter((id) => id !== sourceId)
      );
    } else {
      updateField('sourceIds', [...form.sourceIds, sourceId]);
    }
  };

  const handleAddEvidence = () => {
    if (!evValue.trim() || !evSourceId) {
      setErrorMsg('Vui lòng nhập giá trị cần kiểm chứng và chọn nguồn sử dụng.');
      return;
    }
    const newEv: EvidenceMapping = {
      id: `ev-${Date.now()}`,
      claimField: evField,
      claimValue: evValue.trim(),
      sourceId: evSourceId,
      citationDetail: evDetail.trim(),
      verifiedBy: evVerifier.trim() || 'Quản trị viên',
      verifiedDate: evDate,
      verificationResult: evResult,
    };
    updateField('evidenceMappings', [...form.evidenceMappings, newEv]);
    if (!form.sourceIds.includes(evSourceId)) {
      updateField('sourceIds', [...form.sourceIds, evSourceId]);
    }
    setEvValue('');
    setEvDetail('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!form.recordCode.trim() || !/^[A-Z0-9_\-]+$/.test(form.recordCode.trim())) {
      setErrorMsg('Mã hồ sơ chỉ gồm chữ in hoa, số và dấu gạch ngang (ví dụ F03-00001).');
      setActiveStep('dublin-core');
      return;
    }
    if (!form.dcTitle.trim()) {
      setErrorMsg('Vui lòng nhập trường 1. Title – Nhan đề.');
      setActiveStep('dublin-core');
      return;
    }
    if (isOverFirestoreLimit) {
      setErrorMsg(
        `Dung lượng bản ghi (${estimatedKb} KB) vượt ngưỡng an toàn 950 KB của Firestore do chứa nhiều ảnh Base64. Vui lòng xóa bớt ảnh nội tuyến hoặc thay bằng URL ảnh ngoài.`
      );
      setActiveStep('rights-images');
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          ...form,
          recordCode: form.recordCode.trim().toUpperCase(),
          dcIdentifier: form.dcIdentifier.trim() || form.recordCode.trim().toUpperCase(),
        },
        isNew,
        initialRecord?.recordVerificationLevel
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const currentStepIdx = FORM_STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#162436]/55 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FBF9F5] border border-[#D7CFC0] rounded-lg w-full max-w-5xl max-h-[94vh] flex flex-col shadow-xl">
        {/* Top Modal Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E3DDD2] flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#9A7B3E] font-semibold">
              {isNew ? 'Tạo hồ sơ bia thật mới' : `Chỉnh sửa hồ sơ ${form.recordCode}`}
            </p>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#162436]">
              Biểu mẫu Dublin Core tiếng Việt &amp; Kiểm chứng có bằng chứng
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md border border-[#E3DDD2] text-[#4B5B6E] hover:text-[#162436] cursor-pointer"
            aria-label="Đóng biểu mẫu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sticky Step Switcher & Progress Bar */}
        <div className="px-5 py-3 bg-[#FAF7F0] border-b border-[#E3DDD2] space-y-2.5 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[#162436]">
                Độ đầy đủ:{' '}
                <span className="font-mono tabular-nums text-[#9A7B3E]">
                  {completeness.completionPercent}%
                </span>
              </span>
              <span className="text-[#C7BFAE]">·</span>
              <span
                className={
                  completeness.hasSufficientEvidence
                    ? 'text-[#14532D] font-semibold'
                    : 'text-[#9A3412] font-semibold'
                }
              >
                {completeness.hasSufficientEvidence ? 'Đủ nguồn & đối chiếu' : 'Chưa đủ dữ liệu'}
              </span>
              <span className="text-[#C7BFAE]">·</span>
              <span
                className={`font-mono tabular-nums ${
                  isOverFirestoreLimit ? 'text-[#9A3412] font-semibold' : 'text-[#64748B]'
                }`}
              >
                Dung lượng: {estimatedKb}/950 KB
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleFillCollectionFraming}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-[#D7CFC0] rounded bg-white text-[#162436] hover:bg-[#EFE9DC] cursor-pointer"
              >
                <CopyCheck className="w-3.5 h-3.5 text-[#9A7B3E]" />
                <span>Điền khung chung Văn Miếu</span>
              </button>
              <button
                type="button"
                onClick={handleFillUnknownDefaults}
                className="px-2.5 py-1.5 text-xs font-medium border border-[#D7CFC0] rounded bg-white text-[#162436] hover:bg-[#EFE9DC] cursor-pointer"
              >
                Điền &quot;Chưa xác định&quot; ô trống
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {FORM_STEPS.map((step) => {
              const active = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`px-3 py-2 text-xs font-medium rounded border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#162436] border-[#162436] text-[#FBF9F5]'
                      : 'bg-white border-[#E3DDD2] text-[#4B5B6E] hover:text-[#162436]'
                  }`}
                >
                  {step.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="bg-[#FDF2EF] border border-[#E5C6BD] text-[#9A3412] rounded-md p-3 text-xs">
              {errorMsg}
            </div>
          )}
          {infoBanner && (
            <div className="bg-[#F0F7F2] border border-[#B7D7C2] text-[#14532D] rounded-md p-3 text-xs">
              {infoBanner}
            </div>
          )}

          {/* STEP 1: IDENTIFIER + GEMINI HELPER + 15 DUBLIN CORE */}
          {activeStep === 'dublin-core' && (
            <div className="space-y-6">
              <section className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
                  Mã hồ sơ (F03-00001..F03-00015) &amp; Trạng thái kiểm chứng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#162436] mb-1">
                      Mã hồ sơ cố định *
                    </label>
                    {isNew ? (
                      <div className="flex gap-2">
                        <select
                          value={F03_CODE_OPTIONS.includes(form.recordCode) ? form.recordCode : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              updateField('recordCode', e.target.value);
                              updateField('dcIdentifier', e.target.value);
                            }
                          }}
                          className="h-10 px-2 text-xs border border-[#D7CFC0] rounded-md bg-white"
                          aria-label="Chọn nhanh mã F03"
                        >
                          <option value="">Chọn F03...</option>
                          {F03_CODE_OPTIONS.map((code) => (
                            <option key={code} value={code}>
                              {code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={form.recordCode}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            updateField('recordCode', val);
                            updateField('dcIdentifier', val);
                          }}
                          className="flex-1 h-10 px-3 font-mono text-sm border border-[#D7CFC0] rounded-md bg-white min-w-0"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form.recordCode}
                        disabled
                        className="w-full h-10 px-3 font-mono text-sm border border-[#D7CFC0] rounded-md bg-[#F3EFE6]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#162436] mb-1">
                      Trạng thái xác thực (Chỉ quản trị viên được đánh dấu Đã đối chiếu nguồn)
                    </label>
                    <select
                      value={form.recordVerificationLevel}
                      onChange={(e) =>
                        updateField(
                          'recordVerificationLevel',
                          e.target.value as HeritageRecord['recordVerificationLevel']
                        )
                      }
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                    >
                      <option value="Chưa có nguồn">Chưa có nguồn</option>
                      <option value="Chờ kiểm chứng">Chờ kiểm chứng</option>
                      <option value="Đã đối chiếu nguồn">Đã đối chiếu nguồn</option>
                      <option value="Có thông tin mâu thuẫn">Có thông tin mâu thuẫn</option>
                      <option value="Không thể xác minh">Không thể xác minh</option>
                    </select>
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="inline-flex items-center gap-2 text-sm text-[#162436] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPubliclyPublished}
                        onChange={(e) => updateField('isPubliclyPublished', e.target.checked)}
                        className="w-4 h-4 accent-[#162436]"
                      />
                      <span>Cho phép tra cứu hồ sơ ở cổng công khai</span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-[#162436]">
                      Trợ lý Gemini hỗ trợ rà soát &amp; đề xuất mô tả
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Gemini chỉ tổng hợp từ ghi chú bạn nhập; kết quả luôn là đề xuất chưa kiểm chứng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestAiSuggest}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#9A7B3E] text-white rounded-md hover:bg-[#785E2B] disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiLoading ? 'Đang phân tích...' : 'Đề xuất mô tả & tìm thiếu sót'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={userNotesForAi}
                  onChange={(e) => setUserNotesForAi(e.target.value)}
                  placeholder="Dán ghi chú khảo sát hoặc thông tin từ nguồn gốc để Gemini tổng hợp thành nháp Description..."
                  className="w-full p-3 text-sm border border-[#D7CFC0] rounded-md bg-[#FBF9F5]"
                />
                {aiSuggestion && (
                  <div className="bg-[#FDF8EE] border border-[#DFC99B] rounded-md p-4 space-y-3 text-xs">
                    <p className="font-semibold text-[#9A3412]">{aiSuggestion.disclaimer}</p>
                    <div>
                      <p className="font-semibold text-[#162436]">Đề xuất trường Description:</p>
                      <p className="mt-1 text-[#3E4C5E] whitespace-pre-line">
                        {aiSuggestion.suggestedDescription}
                      </p>
                      <button
                        type="button"
                        onClick={() => updateField('dcDescription', aiSuggestion.suggestedDescription)}
                        className="mt-1.5 px-3 py-1 bg-[#162436] text-white rounded text-xs cursor-pointer"
                      >
                        Chèn vào ô Description (cần đối chiếu lại)
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-5">
                <h3 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
                  Đầy đủ 15 trường chuẩn Dublin Core
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  {DUBLIN_CORE_FIELDS.map((spec) => {
                    const value = String(form[spec.key] ?? '');
                    const isMissing =
                      !value.trim() || value.trim().toLowerCase() === 'chưa xác định';
                    return (
                      <div
                        key={spec.key}
                        className="space-y-1.5 pb-4 border-b border-[#F3EFE6] last:border-b-0"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-sm font-semibold text-[#162436]">
                            {spec.index}. {spec.englishName} – {spec.vietnameseLabel}
                            {spec.key === 'dcTitle' && <span className="text-[#9A3412] ml-1">*</span>}
                          </label>
                          {isMissing && (
                            <span className="text-xs text-[#9A3412] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Thiếu dữ liệu</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4B5B6E]">{spec.meaning}</p>
                        <p className="text-xs text-[#785E2B] italic">{spec.example}</p>
                        {spec.multiline ? (
                          <textarea
                            rows={3}
                            value={value}
                            onChange={(e) => updateField(spec.key, e.target.value)}
                            className="w-full p-2.5 text-sm border border-[#D7CFC0] rounded-md bg-white"
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateField(spec.key, e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                          />
                        )}
                        {isMissing && (
                          <p className="text-xs text-[#9A3412]">{spec.warningIfMissing}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* STEP 2: ARCHIVAL FIELDS + TRANSCRIPTION / TRANSLATION */}
          {activeStep === 'archival-text' && (
            <section className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-5">
              <h3 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
                Trường lưu trữ, tình trạng bản gốc &amp; văn bản phiên âm/dịch nghĩa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Nơi lưu giữ hiện tại
                  </label>
                  <input
                    type="text"
                    value={form.currentRepository}
                    onChange={(e) => updateField('currentRepository', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Địa danh cũ / nơi lưu giữ thời điểm tư liệu
                  </label>
                  <input
                    type="text"
                    value={form.historicalRepository}
                    onChange={(e) => updateField('historicalRepository', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Loại bản đang hiển thị
                  </label>
                  <select
                    value={form.manifestationType}
                    onChange={(e) =>
                      updateField(
                        'manifestationType',
                        e.target.value as HeritageRecord['manifestationType']
                      )
                    }
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                  >
                    <option value="Chưa xác định">Chưa xác định</option>
                    <option value="bản gốc">Bản gốc</option>
                    <option value="bản sao">Bản sao</option>
                    <option value="bản số của gốc">Bản số của gốc</option>
                    <option value="bản số của sao">Bản số của sao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Số đăng ký tại nơi lưu giữ
                  </label>
                  <input
                    type="text"
                    value={form.repositoryRegistrationNo}
                    onChange={(e) => updateField('repositoryRegistrationNo', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Tình trạng bản gốc
                  </label>
                  <input
                    type="text"
                    value={form.originalCondition}
                    onChange={(e) => updateField('originalCondition', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Mô tả hư hại (nếu có)
                  </label>
                  <input
                    type="text"
                    value={form.damageDescription}
                    onChange={(e) => updateField('damageDescription', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Phần không công bố / bị hạn chế (Ẩn công khai)
                  </label>
                  <input
                    type="text"
                    value={form.nonPublicContent ?? ''}
                    onChange={(e) => updateField('nonPublicContent', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Vị trí cất giữ nhạy cảm (Chỉ nội bộ quản trị)
                  </label>
                  <input
                    type="text"
                    value={form.sensitiveStorageNote ?? ''}
                    onChange={(e) => updateField('sensitiveStorageNote', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Người kiểm chứng &amp; Ngày kiểm chứng
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={form.verifierName}
                      onChange={(e) => updateField('verifierName', e.target.value)}
                      className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                    />
                    <input
                      type="text"
                      value={form.verifiedDate}
                      onChange={(e) => updateField('verifiedDate', e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Người số hóa &amp; Ngày số hóa
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={form.digitizerName}
                      onChange={(e) => updateField('digitizerName', e.target.value)}
                      className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                    />
                    <input
                      type="text"
                      value={form.digitizedDate}
                      onChange={(e) => updateField('digitizedDate', e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#162436] mb-1">
                    Điểm chưa rõ
                  </label>
                  <textarea
                    rows={2}
                    value={form.unclearPoints}
                    onChange={(e) => updateField('unclearPoints', e.target.value)}
                    className="w-full p-2.5 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#EFEAE0]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#162436]">Phiên âm</label>
                    <select
                      value={form.transcriptionVerification}
                      onChange={(e) =>
                        updateField(
                          'transcriptionVerification',
                          e.target.value as HeritageRecord['transcriptionVerification']
                        )
                      }
                      className="h-8 px-2 text-xs border border-[#D7CFC0] rounded bg-white"
                    >
                      <option value="Chưa có nguồn">Chưa có nguồn</option>
                      <option value="Chờ kiểm chứng">Chờ kiểm chứng</option>
                      <option value="Đã đối chiếu nguồn">Đã đối chiếu nguồn</option>
                      <option value="Chưa đọc được">Chưa đọc được</option>
                    </select>
                  </div>
                  <textarea
                    rows={5}
                    value={form.transcriptionText}
                    onChange={(e) => updateField('transcriptionText', e.target.value)}
                    className="w-full p-2.5 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#162436]">Dịch nghĩa</label>
                    <select
                      value={form.translationVerification}
                      onChange={(e) =>
                        updateField(
                          'translationVerification',
                          e.target.value as HeritageRecord['translationVerification']
                        )
                      }
                      className="h-8 px-2 text-xs border border-[#D7CFC0] rounded bg-white"
                    >
                      <option value="Chưa có nguồn">Chưa có nguồn</option>
                      <option value="Chờ kiểm chứng">Chờ kiểm chứng</option>
                      <option value="Đã đối chiếu nguồn">Đã đối chiếu nguồn</option>
                      <option value="Chưa đọc được">Chưa đọc được</option>
                    </select>
                  </div>
                  <textarea
                    rows={5}
                    value={form.translationText}
                    onChange={(e) => updateField('translationText', e.target.value)}
                    className="w-full p-2.5 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: STELE-SPECIFIC VS COLLECTION SOURCES + FIELD-LEVEL EVIDENCE */}
          {activeStep === 'sources-evidence' && (
            <section className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEAE0] pb-2">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[#162436]">
                    Nguồn dẫn chứng &amp; Quy trình xác thực từng trường thông tin
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Mỗi hồ sơ cần tối thiểu 2 nguồn phù hợp với chính tấm bia đó (không tự gắn 2 nguồn cấp bộ sưu tập N01–N07 để hợp thức hóa).
                  </p>
                </div>
                <span
                  className={`text-xs font-mono tabular-nums ${
                    completeness.steleSpecificSourceCount >= 2
                      ? 'text-[#14532D]'
                      : 'text-[#9A3412]'
                  }`}
                >
                  Nguồn riêng bia: {completeness.steleSpecificSourceCount}/2 · Tổng gắn:{' '}
                  {form.sourceIds.length}
                </span>
              </div>

              {steleSources.length === 0 ? (
                <div className="bg-[#FDF8EE] border border-[#DFC99B] rounded p-3 text-xs text-[#6B501D]">
                  Hiện chưa có nguồn riêng cấp từng bia nào trong mục Nguồn &amp; Quyền. Vui lòng thêm nguồn riêng (văn bia, bản dập, tài liệu khảo cứu) trước khi hoàn tất kiểm chứng cho bia này.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#14532D]">
                    Nguồn riêng cho từng bia (Khuyến nghị gắn cho hồ sơ)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {steleSources.map((src) => {
                      const checked = form.sourceIds.includes(src.id);
                      return (
                        <label
                          key={src.id}
                          className={`p-2.5 border rounded-md text-xs flex items-start gap-2 cursor-pointer ${
                            checked
                              ? 'bg-[#F3EFE6] border-[#9A7B3E]'
                              : 'bg-white border-[#E3DDD2]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSource(src.id)}
                            className="mt-0.5 accent-[#162436]"
                          />
                          <div>
                            <p className="font-medium text-[#162436]">
                              <span className="font-mono mr-1">{src.id}</span>
                              {src.documentTitle}
                            </p>
                            <p className="text-[#64748B]">{src.organizationOrAuthor}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#6B501D]">
                  Nguồn cấp bộ sưu tập (N01–N07) — Chỉ dùng chứng minh thông tin chung của bộ 82 bia
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {collectionSources.map((src) => {
                    const checked = form.sourceIds.includes(src.id);
                    return (
                      <label
                        key={src.id}
                        className={`p-2.5 border rounded-md text-xs flex items-start gap-2 cursor-pointer ${
                          checked
                            ? 'bg-[#F3EFE6] border-[#9A7B3E]'
                            : 'bg-white border-[#E3DDD2]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSource(src.id)}
                          className="mt-0.5 accent-[#162436]"
                        />
                        <div>
                          <p className="font-medium text-[#162436]">
                            <span className="font-mono mr-1">{src.id}</span>
                            {src.documentTitle}
                          </p>
                          <p className="text-[#64748B]">{src.organizationOrAuthor}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFEAE0] space-y-3">
                <p className="text-xs font-semibold text-[#162436]">
                  Lưu bản ghi kiểm chứng từng trường (Trường · Nguồn · Vị trí dẫn chứng · Người kiểm · Ngày kiểm · Kết quả đối chiếu)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={evField}
                    onChange={(e) => setEvField(e.target.value)}
                    placeholder="Trường được kiểm (vd: Niên đại)"
                    className="h-9 px-2.5 text-xs border border-[#D7CFC0] rounded"
                  />
                  <input
                    type="text"
                    value={evValue}
                    onChange={(e) => setEvValue(e.target.value)}
                    placeholder="Giá trị ghi nhận"
                    className="h-9 px-2.5 text-xs border border-[#D7CFC0] rounded"
                  />
                  <select
                    value={evSourceId}
                    onChange={(e) => setEvSourceId(e.target.value)}
                    className="h-9 px-2 text-xs border border-[#D7CFC0] rounded bg-white"
                  >
                    <option value="">-- Chọn nguồn đối chiếu --</option>
                    {historicalSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} ({s.sourceLevel}): {s.documentTitle.slice(0, 40)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={evDetail}
                    onChange={(e) => setEvDetail(e.target.value)}
                    placeholder="Nội dung / vị trí dẫn chứng (trang, mục)"
                    className="h-9 px-2.5 text-xs border border-[#D7CFC0] rounded"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={evVerifier}
                      onChange={(e) => setEvVerifier(e.target.value)}
                      placeholder="Người kiểm"
                      className="h-9 px-2 text-xs border border-[#D7CFC0] rounded"
                    />
                    <input
                      type="date"
                      value={evDate}
                      onChange={(e) => setEvDate(e.target.value)}
                      className="h-9 px-2 text-xs border border-[#D7CFC0] rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={evResult}
                      onChange={(e) => setEvResult(e.target.value as ClaimVerificationResult)}
                      className="flex-1 h-9 px-2 text-xs border border-[#D7CFC0] rounded bg-white min-w-0"
                    >
                      <option value="Chưa có nguồn">Chưa có nguồn</option>
                      <option value="Chờ kiểm chứng">Chờ kiểm chứng</option>
                      <option value="Đã đối chiếu nguồn">Đã đối chiếu nguồn</option>
                      <option value="Có thông tin mâu thuẫn">Có thông tin mâu thuẫn</option>
                      <option value="Không thể xác minh">Không thể xác minh</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddEvidence}
                      className="px-3 h-9 bg-[#162436] text-white text-xs rounded hover:bg-[#233752] cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {form.evidenceMappings.length > 0 && (
                  <ul className="divide-y divide-[#EFEAE0] text-xs border border-[#E3DDD2] rounded">
                    {form.evidenceMappings.map((ev) => (
                      <li
                        key={ev.id}
                        className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span>
                          <strong>{ev.claimField}:</strong> {ev.claimValue} · Nguồn:{' '}
                          <span className="font-mono">{ev.sourceId}</span>
                          {ev.citationDetail ? ` (${ev.citationDetail})` : ''} · Kiểm:{' '}
                          {ev.verifiedBy || 'Quản trị viên'} ({ev.verifiedDate || 'Chưa rõ'}) · Kết quả:{' '}
                          <strong>{ev.verificationResult}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'evidenceMappings',
                              form.evidenceMappings.filter((item) => item.id !== ev.id)
                            )
                          }
                          className="text-[#9A3412] hover:underline cursor-pointer shrink-0"
                        >
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {/* STEP 4: PUBLICATION RIGHTS & IMAGES WITH FIRESTORE SIZE GUARD */}
          {activeStep === 'rights-images' && (
            <div className="space-y-6">
              <section className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
                  Quyền công bố của hồ sơ này
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#162436] mb-1">
                      Trạng thái quyền công bố (Mặc định: Chưa xác minh quyền)
                    </label>
                    <select
                      value={form.recordRightsStatus}
                      onChange={(e) =>
                        updateField(
                          'recordRightsStatus',
                          e.target.value as HeritageRecord['recordRightsStatus']
                        )
                      }
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                    >
                      <option value="Chưa xác minh quyền">Chưa xác minh quyền</option>
                      <option value="Đã cấp phép">Đã cấp phép</option>
                      <option value="Từ chối">Từ chối</option>
                      <option value="Đã thu hồi">Đã thu hồi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#162436] mb-1">
                      Đơn vị hoặc người có thẩm quyền
                    </label>
                    <input
                      type="text"
                      value={form.rightsAuthority}
                      onChange={(e) => updateField('rightsAuthority', e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#162436] mb-1">
                      Người xác nhận cho phép &amp; Ngày xác nhận
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={form.rightsConfirmedBy}
                        onChange={(e) => updateField('rightsConfirmedBy', e.target.value)}
                        placeholder="Người xác nhận"
                        className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                      />
                      <input
                        type="text"
                        value={form.rightsConsentDate}
                        onChange={(e) => updateField('rightsConsentDate', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#162436] mb-1">
                      Bằng chứng đồng ý &amp; Phạm vi sử dụng
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={form.rightsEvidence}
                        onChange={(e) => updateField('rightsEvidence', e.target.value)}
                        placeholder="Số công văn / văn bản"
                        className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                      />
                      <input
                        type="text"
                        value={form.rightsScope}
                        onChange={(e) => updateField('rightsScope', e.target.value)}
                        placeholder="Phạm vi sử dụng"
                        className="h-10 px-2.5 text-sm border border-[#D7CFC0] rounded-md"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-6 bg-[#FBF9F5] border border-[#E3DDD2] rounded-md p-3 text-xs">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowImagePublish}
                        onChange={(e) => updateField('allowImagePublish', e.target.checked)}
                      />
                      <span>Quyền đăng ảnh trên website (chỉ có hiệu lực khi Đã cấp phép)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowImageDownload}
                        onChange={(e) => updateField('allowImageDownload', e.target.checked)}
                      />
                      <span>Quyền cho tải ảnh</span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEAE0] pb-2">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-[#162436]">
                      Danh sách ảnh tư liệu thật
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Ảnh chỉ hiển thị công khai khi trạng thái quyền hồ sơ là &quot;Đã cấp phép&quot; và được phép đăng web. Khuyến khích dùng URL ảnh lưu trữ ngoài để không vượt giới hạn 1 MB của Firestore.
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isOverFirestoreLimit ? 'text-[#9A3412] font-semibold' : 'text-[#4B5B6E]'
                    }`}
                  >
                    {estimatedKb} / 950 KB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FBF9F5] border border-[#E3DDD2] rounded-md p-4">
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Tải ảnh từ máy hoặc nhập URL ảnh thật
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imgUrlInput}
                        onChange={(e) => setImgUrlInput(e.target.value)}
                        placeholder="https://... hoặc chọn tệp"
                        className="flex-1 h-9 px-2.5 text-xs border border-[#D7CFC0] rounded bg-white min-w-0"
                      />
                      <label className="inline-flex items-center gap-1 px-3 h-9 border border-[#D7CFC0] bg-white rounded text-xs cursor-pointer hover:bg-[#F3EFE6] shrink-0">
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>{imgUploading ? 'Đang nén...' : 'Chọn tệp'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">Góc chụp</label>
                    <select
                      value={imgViewType}
                      onChange={(e) => setImgViewType(e.target.value as 'toàn cảnh' | 'cận cảnh')}
                      className="w-full h-9 px-2.5 text-xs border border-[#D7CFC0] rounded bg-white"
                    >
                      <option value="toàn cảnh">Toàn cảnh</option>
                      <option value="cận cảnh">Cận cảnh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">Chú thích ảnh</label>
                    <input
                      type="text"
                      value={imgCaption}
                      onChange={(e) => setImgCaption(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs border border-[#D7CFC0] rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Nguồn ảnh (Bắt buộc) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imgSource}
                        onChange={(e) => setImgSource(e.target.value)}
                        placeholder="Đơn vị cấp ảnh / Hồ sơ"
                        className="flex-1 h-9 px-2.5 text-xs border border-[#D7CFC0] rounded bg-white min-w-0"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="px-3 h-9 bg-[#162436] text-white text-xs rounded hover:bg-[#233752] cursor-pointer shrink-0"
                      >
                        Thêm ảnh
                      </button>
                    </div>
                  </div>
                </div>

                {form.images.length > 0 && (
                  <div className="space-y-3">
                    {form.images.map((img) => (
                      <div
                        key={img.id}
                        className="border border-[#E3DDD2] rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={img.url}
                            alt={img.caption}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 object-cover rounded border border-[#E3DDD2] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#162436] truncate">
                              [{img.viewType}] {img.caption}
                            </p>
                            <p className="text-[#64748B] truncate">Nguồn: {img.imageSource}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={img.rightsVerified}
                              onChange={() => toggleImagePermission(img.id, 'rightsVerified')}
                            />
                            <span>Đã xác minh quyền</span>
                          </label>
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={img.allowWebDisplay}
                              onChange={() => toggleImagePermission(img.id, 'allowWebDisplay')}
                            />
                            <span>Cho phép đăng web</span>
                          </label>
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={img.allowDownload}
                              onChange={() => toggleImagePermission(img.id, 'allowDownload')}
                            />
                            <span>Cho tải ảnh</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="p-1.5 text-[#9A3412] hover:bg-[#FDF2EF] rounded cursor-pointer"
                            aria-label="Xóa ảnh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </form>

        {/* Bottom Action Footer with Step Navigation */}
        <div className="px-5 py-4 bg-white border-t border-[#E3DDD2] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#4B5B6E]">
            <CheckCircle2 className="w-4 h-4 text-[#9A7B3E]" />
            <span>Lưu bền vững vào Firestore và ghi nhật ký chỉnh sửa.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currentStepIdx > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep(FORM_STEPS[currentStepIdx - 1].id)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Bước trước</span>
              </button>
            )}
            {currentStepIdx < FORM_STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(FORM_STEPS[currentStepIdx + 1].id)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <span>Bước tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || isOverFirestoreLimit}
              className="px-5 py-2 text-xs font-medium bg-[#162436] text-[#FBF9F5] rounded-md hover:bg-[#233752] cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
