import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Link2,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { normalizeVietnamese } from '../lib/textUtils';
import type {
  AdminUser,
  AuditLog,
  HeritageCollection,
  HeritageRecord,
  PublicationRight,
  SourceItem,
  VerificationLog,
} from '../types/heritage';

interface SourcesAndRightsViewProps {
  collectionScope: HeritageCollection;
  records: HeritageRecord[];
  sources: SourceItem[];
  rights: PublicationRight[];
  verificationLogs: VerificationLog[];
  auditLogs: AuditLog[];
  adminUsers: AdminUser[];
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
  onSaveSource: (source: SourceItem, isNew: boolean) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onSaveRight: (right: PublicationRight, isNew: boolean) => Promise<void>;
  onSaveCollectionScope: (scope: HeritageCollection) => Promise<void>;
  onAddAdmin: (data: {
    uid: string;
    email: string;
    displayName: string;
    role: 'admin' | 'reviewer';
  }) => Promise<void>;
}

const SOURCE_CATEGORY_OPTIONS: SourceItem['sourceCategory'][] = [
  'Chính thống',
  'Học thuật',
  'Lưu trữ nội bộ',
  'Tham khảo',
  'Tài liệu kỹ thuật',
  'Tài liệu pháp lý',
];

const SOURCE_LEVEL_OPTIONS: SourceItem['sourceLevel'][] = [
  'Cấp từng bia',
  'Cấp bộ sưu tập',
  'Kỹ thuật / Pháp lý',
];

const SOURCE_VERIFICATION_OPTIONS: SourceItem['verificationStatus'][] = [
  'Chưa xác minh liên kết',
  'Chờ kiểm chứng',
  'Đã đối chiếu nguồn',
  'Có thông tin mâu thuẫn',
  'Không thể xác minh',
];

export const SourcesAndRightsView: React.FC<SourcesAndRightsViewProps> = ({
  collectionScope,
  records,
  sources,
  rights,
  verificationLogs,
  auditLogs,
  adminUsers,
  isAdmin,
  isPrimaryAdmin,
  onSaveSource,
  onDeleteSource,
  onSaveRight,
  onSaveCollectionScope,
  onAddAdmin,
}) => {
  const [subTab, setSubTab] = useState<'sources' | 'rights' | 'logs'>('sources');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Source form & list state
  const sourceFormRef = useRef<HTMLFormElement | null>(null);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceItem | null>(null);
  const [srcOrg, setSrcOrg] = useState('');
  const [srcTitle, setSrcTitle] = useState('');
  const [srcUrl, setSrcUrl] = useState('');
  const [srcDate, setSrcDate] = useState(new Date().toISOString().slice(0, 10));
  const [srcCat, setSrcCat] = useState<SourceItem['sourceCategory']>('Chính thống');
  const [srcLevel, setSrcLevel] = useState<SourceItem['sourceLevel']>('Cấp từng bia');
  const [srcProvableScope, setSrcProvableScope] = useState('');
  const [srcStatus, setSrcStatus] =
    useState<SourceItem['verificationStatus']>('Chờ kiểm chứng');
  const [srcNotes, setSrcNotes] = useState('');
  const [savingSource, setSavingSource] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Source search, filter & safe delete state
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceFilterCat, setSourceFilterCat] = useState('');
  const [sourceFilterStatus, setSourceFilterStatus] = useState('');
  const [pendingDeleteSource, setPendingDeleteSource] = useState<SourceItem | null>(null);
  const [deletingSource, setDeletingSource] = useState(false);

  // Rights form state
  const [rTargetType, setRTargetType] = useState<'collection' | 'record'>('record');
  const [rRecordCode, setRRecordCode] = useState('');
  const [rAuthName, setRAuthName] = useState(
    'Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu – Quốc Tử Giám'
  );
  const [rAuthRole, setRAuthRole] = useState('');
  const [rConfirmedBy, setRConfirmedBy] = useState('');
  const [rConsentDate, setRConsentDate] = useState('');
  const [rEvidence, setREvidence] = useState('');
  const [rScopeDesc, setRScopeDesc] = useState('');
  const [rRestrictedParts, setRRestrictedParts] = useState('');
  const [rCanView, setRCanView] = useState(false);
  const [rCanPhoto, setRCanPhoto] = useState(false);
  const [rCanWeb, setRCanWeb] = useState(false);
  const [rCanDownload, setRCanDownload] = useState(false);
  const [rStatus, setRStatus] = useState<PublicationRight['status']>('Chưa xác minh quyền');

  // Collection status update
  const [colRightsStatus, setColRightsStatus] = useState<HeritageCollection['rightsStatus']>(
    collectionScope.rightsStatus
  );

  // Add admin form
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // Bộ lọc tìm kiếm nguồn (hỗ trợ tiếng Việt có dấu hoặc không dấu)
  const filteredSources = useMemo(() => {
    const qNorm = normalizeVietnamese(sourceSearch);
    return sources.filter((s) => {
      if (qNorm) {
        const haystack = normalizeVietnamese(
          [
            s.id,
            s.organizationOrAuthor,
            s.documentTitle,
            s.urlOrArchiveCode,
            s.provableScope,
            s.notes,
          ].join(' ')
        );
        if (!haystack.includes(qNorm)) return false;
      }
      if (sourceFilterCat && s.sourceCategory !== sourceFilterCat) return false;
      if (sourceFilterStatus && s.verificationStatus !== sourceFilterStatus) return false;
      return true;
    });
  }, [sources, sourceSearch, sourceFilterCat, sourceFilterStatus]);

  // Thống kê tổng nguồn chuẩn (không phụ thuộc bộ lọc)
  const allHistoricalSources = sources.filter(
    (s) => s.sourceCategory !== 'Tài liệu kỹ thuật' && s.sourceCategory !== 'Tài liệu pháp lý'
  );
  const allCollectionCount = allHistoricalSources.filter(
    (s) => s.sourceLevel === 'Cấp bộ sưu tập'
  ).length;
  const allSteleCount = allHistoricalSources.filter(
    (s) => s.sourceLevel === 'Cấp từng bia'
  ).length;
  const allTechLegalCount = sources.length - allHistoricalSources.length;

  // Tách nguồn lịch sử (Cấp bộ sưu tập & Cấp từng bia) khỏi Tài liệu kỹ thuật / pháp lý (sau khi lọc)
  const historicalSources = filteredSources.filter(
    (s) => s.sourceCategory !== 'Tài liệu kỹ thuật' && s.sourceCategory !== 'Tài liệu pháp lý'
  );
  const collectionSources = historicalSources.filter(
    (s) => s.sourceLevel === 'Cấp bộ sưu tập'
  );
  const steleSpecificSources = historicalSources.filter(
    (s) => s.sourceLevel === 'Cấp từng bia'
  );
  const technicalLegalSources = filteredSources.filter(
    (s) => s.sourceCategory === 'Tài liệu kỹ thuật' || s.sourceCategory === 'Tài liệu pháp lý'
  );
  const authoritativeCount = allHistoricalSources.filter(
    (s) => s.sourceCategory === 'Chính thống'
  ).length;

  const affectedRecordsForDelete = useMemo(() => {
    if (!pendingDeleteSource) return [];
    return records.filter(
      (r) =>
        r.sourceIds.includes(pendingDeleteSource.id) ||
        r.evidenceMappings.some((m) => m.sourceId === pendingDeleteSource.id)
    );
  }, [pendingDeleteSource, records]);

  // Kiểm tra nhanh URL có dạng domain thiếu https://
  const urlLooksLikeMissingScheme = useMemo(() => {
    const trimmed = srcUrl.trim();
    if (!trimmed || /^https?:\/\//i.test(trimmed) || /\s/.test(trimmed)) return false;
    return /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed);
  }, [srcUrl]);

  const resetSourceForm = () => {
    setEditingSource(null);
    setSrcOrg('');
    setSrcTitle('');
    setSrcUrl('');
    setSrcDate(new Date().toISOString().slice(0, 10));
    setSrcCat('Chính thống');
    setSrcLevel('Cấp từng bia');
    setSrcProvableScope('');
    setSrcStatus('Chờ kiểm chứng');
    setSrcNotes('');
  };

  const handleOpenNewSourceForm = () => {
    resetSourceForm();
    setShowSourceForm(true);
    setErrorMsg(null);
    setTimeout(() => {
      sourceFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleLoadSourceForEdit = (s: SourceItem) => {
    setEditingSource(s);
    setSrcOrg(s.organizationOrAuthor);
    setSrcTitle(s.documentTitle);
    setSrcUrl(s.urlOrArchiveCode);
    setSrcDate(s.accessDate);
    setSrcCat(s.sourceCategory === 'Tham khảo khác' ? 'Tham khảo' : s.sourceCategory);
    setSrcLevel(s.sourceLevel || 'Cấp từng bia');
    setSrcProvableScope(s.provableScope || '');
    setSrcStatus(
      SOURCE_VERIFICATION_OPTIONS.includes(s.verificationStatus)
        ? s.verificationStatus
        : 'Chờ kiểm chứng'
    );
    setSrcNotes(s.notes);
    setShowSourceForm(true);
    setErrorMsg(null);
    setTimeout(() => {
      sourceFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleSourceCategoryChange = (newCat: SourceItem['sourceCategory']) => {
    setSrcCat(newCat);
    if (newCat === 'Tài liệu kỹ thuật' || newCat === 'Tài liệu pháp lý') {
      setSrcLevel('Kỹ thuật / Pháp lý');
    } else if (srcLevel === 'Kỹ thuật / Pháp lý') {
      setSrcLevel('Cấp từng bia');
    }
  };

  const handleSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    const org = srcOrg.trim();
    const title = srcTitle.trim();
    const url = srcUrl.trim();
    const scope = srcProvableScope.trim();
    const notes = srcNotes.trim();
    const date = srcDate.trim() || 'Chưa xác định';

    if (!org || !title || !url) {
      setErrorMsg('Vui lòng nhập đầy đủ cơ quan/tác giả, tên tài liệu và URL hoặc mã hồ sơ.');
      return;
    }
    if (!scope) {
      setErrorMsg(
        'Vui lòng nêu rõ phạm vi thông tin nguồn này có thể chứng minh (ví dụ: chứng minh khoa thi năm nào, nhân vật nào, hoặc giá trị cấp bộ sưu tập).'
      );
      return;
    }
    if (org.length > 300 || title.length > 500 || url.length > 1000 || scope.length > 1000 || notes.length > 2000 || date.length > 100) {
      setErrorMsg('Nội dung vượt quá độ dài tối đa cho phép của cơ sở dữ liệu.');
      return;
    }

    setSavingSource(true);
    try {
      const payload: SourceItem = {
        id: editingSource?.id || `SRC-${Date.now()}`,
        organizationOrAuthor: org,
        documentTitle: title,
        urlOrArchiveCode: url,
        accessDate: date,
        sourceCategory: srcCat,
        sourceLevel: srcLevel,
        provableScope: scope,
        verificationStatus: srcStatus,
        lastLinkCheckResult: editingSource?.lastLinkCheckResult ?? 'Chưa xác minh liên kết',
        lastLinkCheckedAt: editingSource?.lastLinkCheckedAt ?? '',
        notes,
        isPublic: true,
        isBuiltIn: editingSource?.isBuiltIn,
        createdAt: editingSource?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onSaveSource(payload, !editingSource);
      setStatusMsg(
        editingSource
          ? `Đã cập nhật nguồn ${payload.id}.`
          : `Đã thêm nguồn tư liệu mới (${payload.id}).`
      );
      resetSourceForm();
      setShowSourceForm(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu nguồn.');
    } finally {
      setSavingSource(false);
    }
  };

  const handleConfirmDeleteSource = async () => {
    if (!pendingDeleteSource) return;
    setDeletingSource(true);
    setErrorMsg(null);
    setStatusMsg(null);
    const targetId = pendingDeleteSource.id;
    try {
      await onDeleteSource(targetId);
      if (editingSource?.id === targetId) {
        resetSourceForm();
        setShowSourceForm(false);
      }
      setStatusMsg(`Đã xóa nguồn tư liệu ${targetId}.`);
      setPendingDeleteSource(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể xóa nguồn tư liệu.');
    } finally {
      setDeletingSource(false);
    }
  };

  const handleCheckLink = async (s: SourceItem) => {
    setCheckingId(s.id);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/sources/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: s.urlOrArchiveCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể kiểm tra liên kết.');

      const resultMsg = String(data.message || 'Chưa xác minh liên kết');
      if (isAdmin) {
        // Chỉ lưu log kết quả kỹ thuật, TUYỆT ĐỐI KHÔNG tự đổi verificationStatus sang "Đã đối chiếu nguồn"
        await onSaveSource(
          {
            ...s,
            lastLinkCheckResult: resultMsg,
            lastLinkCheckedAt: data.checkedAt || new Date().toISOString(),
          },
          false
        );
      }
      setStatusMsg(`${s.id}: ${resultMsg}`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Chưa xác minh liên kết — lỗi kết nối máy chủ kiểm tra.'
      );
    } finally {
      setCheckingId(null);
    }
  };

  const handleMarkManualBrowserCheck = async (s: SourceItem) => {
    if (!isAdmin) return;
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await onSaveSource(
        {
          ...s,
          accessDate: today,
          lastLinkCheckResult: `Đã mở đọc kiểm tra trực tiếp trên trình duyệt (${today}). Hãy cập nhật trạng thái xác thực sau khi hoàn tất đối chiếu nội dung.`,
          lastLinkCheckedAt: new Date().toISOString(),
        },
        false
      );
      setStatusMsg(`Đã ghi nhận ngày mở đọc thủ công (${today}) cho nguồn ${s.id}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi cập nhật ngày kiểm tra.');
    }
  };

  const handleCreateRight = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (!rAuthName.trim()) {
      setErrorMsg('Vui lòng nhập người hoặc tổ chức có thẩm quyền cho phép.');
      return;
    }
    if (rTargetType === 'record' && !rRecordCode.trim()) {
      setErrorMsg('Vui lòng chọn mã bản ghi cần quản lý quyền.');
      return;
    }
    if (rStatus === 'Đã cấp phép' && !rEvidence.trim()) {
      setErrorMsg(
        'Không thể đặt trạng thái "Đã cấp phép" khi chưa nhập bằng chứng đồng ý (số công văn, văn bản hoặc email xác nhận).'
      );
      return;
    }
    try {
      const rightPayload: PublicationRight = {
        id: `RIGHT-${Date.now()}`,
        targetType: rTargetType,
        recordId: rTargetType === 'record' ? rRecordCode : 'f03-van-mieu',
        recordCode: rTargetType === 'record' ? rRecordCode : 'COLLECTION_F03',
        authorizerName: rAuthName.trim(),
        authorizerRole: rAuthRole.trim() || 'Chưa xác định',
        confirmedBy: rConfirmedBy.trim() || 'Chưa xác định',
        consentDate: rConsentDate.trim() || 'Chưa xác định',
        evidenceDescription: rEvidence.trim() || 'Chưa xác định',
        scopeDescription: rScopeDesc.trim() || 'Chưa xác định',
        restrictedParts: rRestrictedParts.trim() || 'Không công khai ảnh khi chưa cấp phép',
        canView: rCanView,
        canPhotograph: rCanPhoto,
        canPublishWebsite: rStatus === 'Đã cấp phép' ? rCanWeb : false,
        canDownloadImage: rStatus === 'Đã cấp phép' ? rCanDownload : false,
        status: rStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onSaveRight(rightPayload, true);
      setStatusMsg('Đã lưu hồ sơ quyền công bố và đồng bộ trạng thái hiển thị.');
      setREvidence('');
      setRScopeDesc('');
      setRRestrictedParts('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu quyền công bố.');
    }
  };

  const handleRevokeRight = async (right: PublicationRight) => {
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onSaveRight(
        {
          ...right,
          canPublishWebsite: false,
          canDownloadImage: false,
          status: 'Đã thu hồi',
          revokedReason: 'Thu hồi quyền công bố và ẩn dữ liệu công khai theo yêu cầu quản trị.',
        },
        false
      );
      setStatusMsg(
        `Đã thu hồi quyền công bố và ẩn hiển thị công khai cho ${right.recordCode || 'mục đã chọn'}.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi thu hồi quyền.');
    }
  };

  const handleUpdateCollectionRights = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onSaveCollectionScope({
        ...collectionScope,
        rightsStatus: colRightsStatus,
      });
      setStatusMsg(`Đã cập nhật trạng thái quyền bộ sưu tập thành: ${colRightsStatus}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái bộ sưu tập.');
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (!newAdminUid.trim() || !newAdminEmail.trim()) {
      setErrorMsg('Cần nhập UID Firebase và Email đã xác thực của cộng tác viên.');
      return;
    }
    try {
      await onAddAdmin({
        uid: newAdminUid.trim(),
        email: newAdminEmail.trim(),
        displayName: newAdminName.trim() || newAdminEmail.trim(),
        role: 'admin',
      });
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      setStatusMsg('Đã cấp quyền quản trị viên thành công.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể thêm quản trị viên.');
    }
  };

  const renderSourceRow = (s: SourceItem) => {
    const isHttp = /^https?:\/\//i.test(s.urlOrArchiveCode);
    const linkStatusText = s.lastLinkCheckResult || 'Chưa xác minh liên kết';
    const isBeingEdited = editingSource?.id === s.id && showSourceForm;
    return (
      <div
        key={s.id}
        className={`p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 transition-colors ${
          isBeingEdited ? 'bg-[#FAF7F0] ring-1 ring-inset ring-[#9A7B3E]/40' : ''
        }`}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#64748B]">
            <span className="font-mono font-semibold text-[#162436]">{s.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#785E2B]">{s.sourceCategory}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#162436]">{s.sourceLevel}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                s.verificationStatus === 'Đã đối chiếu nguồn' ||
                s.verificationStatus === 'Đã đối chiếu'
                  ? 'text-[#14532D] font-semibold'
                  : s.verificationStatus === 'Có thông tin mâu thuẫn' ||
                    s.verificationStatus === 'Có mâu thuẫn'
                  ? 'text-[#9A3412] font-semibold'
                  : 'text-[#4B5B6E] font-medium'
              }
            >
              {s.verificationStatus}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Truy cập: {s.accessDate || 'Chưa xác định'}</span>
          </div>

          <h4 className="font-serif text-lg font-semibold text-[#162436]">
            {s.documentTitle}
          </h4>

          <p className="text-xs text-[#3E4C5E]">
            Cơ quan / Tác giả: <strong>{s.organizationOrAuthor}</strong>
          </p>

          <p className="text-xs text-[#3E4C5E] break-all">
            URL / Định danh:{' '}
            {isHttp ? (
              <a
                href={s.urlOrArchiveCode}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[#162436] underline hover:text-[#9A7B3E]"
              >
                {s.urlOrArchiveCode}
              </a>
            ) : (
              <span className="font-mono">{s.urlOrArchiveCode}</span>
            )}
          </p>

          {s.provableScope && (
            <p className="text-xs text-[#162436] bg-[#FAF7F0] border border-[#E3DDD2] rounded px-3 py-2">
              <strong>Phạm vi thông tin có thể chứng minh:</strong> {s.provableScope}
            </p>
          )}

          {s.notes && <p className="text-xs text-[#64748B]">{s.notes}</p>}

          <p className="text-xs text-[#4B5B6E] bg-[#FBF9F5] border border-[#E3DDD2] rounded px-2.5 py-1.5">
            <strong>Trạng thái kiểm tra liên kết:</strong> {linkStatusText}
            {s.lastLinkCheckedAt
              ? ` (${new Date(s.lastLinkCheckedAt).toLocaleString('vi-VN')})`
              : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isHttp && (
            <a
              href={s.urlOrArchiveCode}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở nguồn gốc</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => handleCheckLink(s)}
            disabled={checkingId === s.id}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-50"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{checkingId === s.id ? 'Đang kiểm...' : 'Kiểm tra URL'}</span>
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => handleMarkManualBrowserCheck(s)}
                className="px-3 py-2 text-xs border border-[#D7CFC0] rounded-md text-[#14532D] hover:bg-[#F0F7F2] cursor-pointer"
                title="Ghi nhận ngày đã mở xem trực tiếp trên trình duyệt (không tự đổi trạng thái đối chiếu nội dung)"
              >
                Đã mở đọc
              </button>
              <button
                type="button"
                onClick={() => handleLoadSourceForEdit(s)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>
              {!s.isBuiltIn && (
                <button
                  type="button"
                  onClick={() => setPendingDeleteSource(s)}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-[#9A3412] border border-[#E5C6BD] rounded-md hover:bg-[#FDF2EF] cursor-pointer"
                  aria-label={`Xóa nguồn ${s.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E3DDD2] pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B5B3E] font-medium">
            Truy xuất căn cứ lịch sử & Pháp lý hình ảnh
          </p>
          <h1 className="font-serif text-3xl font-semibold text-[#162436] mt-1">
            Nguồn tư liệu và Xác thực · Quyền công bố
          </h1>
        </div>

        {/* Sub-tab segmented switch */}
        <div className="flex items-center gap-1 p-1 bg-[#EFEAE0] rounded-md self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('sources')}
            className={`px-3.5 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'sources'
                ? 'bg-white text-[#162436] shadow-xs'
                : 'text-[#4B5B6E] hover:text-[#162436]'
            }`}
          >
            Nguồn & Xác thực ({allHistoricalSources.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('rights')}
            className={`px-3.5 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'rights'
                ? 'bg-white text-[#162436] shadow-xs'
                : 'text-[#4B5B6E] hover:text-[#162436]'
            }`}
          >
            Quyền công bố
          </button>
          <button
            type="button"
            onClick={() => setSubTab('logs')}
            className={`px-3.5 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'logs'
                ? 'bg-white text-[#162436] shadow-xs'
                : 'text-[#4B5B6E] hover:text-[#162436]'
            }`}
          >
            Lịch sử & Nhật ký
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-[#F0F7F2] border border-[#B7D7C2] text-[#14532D] rounded-md px-4 py-3 text-xs">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-[#FDF2EF] border border-[#E5C6BD] text-[#9A3412] rounded-md px-4 py-3 text-xs">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: SOURCES */}
      {subTab === 'sources' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-semibold text-[#162436]">
                  Phân tầng nguồn tư liệu lịch sử &amp; tài liệu chuẩn hóa
                </h2>
                <p className="text-xs text-[#4B5B6E]">
                  Các nguồn <strong>N01–N07</strong> là nguồn chính thống <strong>cấp bộ sưu tập</strong> (chứng minh tổng quan 82 bia). Mỗi hồ sơ từng tấm bia cần gắn nguồn riêng phù hợp; tài liệu kỹ thuật/pháp lý được phân loại tách riêng.
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <div className="flex flex-col items-start sm:items-end gap-0.5 text-xs font-mono tabular-nums">
                  <span className="text-[#14532D] font-semibold">
                    Cấp bộ sưu tập (N01–N07): {allCollectionCount}/7
                  </span>
                  <span
                    className={
                      allSteleCount > 0
                        ? 'text-[#14532D] font-semibold'
                        : 'text-[#9A3412] font-semibold'
                    }
                  >
                    Nguồn riêng từng bia: {allSteleCount}
                  </span>
                  <span className="text-[#64748B]">
                    Kỹ thuật &amp; Pháp lý: {allTechLegalCount} · Chính thống: {authoritativeCount}
                  </span>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenNewSourceForm}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#162436] text-white rounded-md hover:bg-[#233752] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D8B979]" />
                    <span>Thêm nguồn mới</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="pt-3 border-t border-[#EFEAE0] grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  placeholder="Tìm theo mã (N01, SRC...), cơ quan, tiêu đề, URL (có/không dấu)..."
                  className="w-full h-9 pl-9 pr-3 text-xs border border-[#D7CFC0] rounded-md bg-[#FBF9F5] focus:bg-white focus:outline-none focus:border-[#162436]"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={sourceFilterCat}
                  onChange={(e) => setSourceFilterCat(e.target.value)}
                  aria-label="Lọc theo phân loại nguồn"
                  className="w-full h-9 px-2.5 text-xs border border-[#D7CFC0] rounded-md bg-white"
                >
                  <option value="">Tất cả phân loại</option>
                  {SOURCE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <select
                  value={sourceFilterStatus}
                  onChange={(e) => setSourceFilterStatus(e.target.value)}
                  aria-label="Lọc theo trạng thái xác thực"
                  className="flex-1 h-9 px-2.5 text-xs border border-[#D7CFC0] rounded-md bg-white min-w-0"
                >
                  <option value="">Tất cả trạng thái</option>
                  {SOURCE_VERIFICATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(sourceSearch || sourceFilterCat || sourceFilterStatus) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSourceSearch('');
                      setSourceFilterCat('');
                      setSourceFilterStatus('');
                    }}
                    className="px-2.5 h-9 text-xs border border-[#D7CFC0] rounded-md hover:bg-[#F3EFE6] cursor-pointer shrink-0"
                    title="Đặt lại bộ lọc nguồn"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            </div>
          </div>

          {isAdmin && showSourceForm && (
            <form
              ref={sourceFormRef}
              onSubmit={handleSourceSubmit}
              className="bg-white border-2 border-[#9A7B3E]/50 rounded-lg p-5 space-y-4 scroll-mt-20"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#EFEAE0] pb-3">
                <h3 className="font-serif text-lg font-semibold text-[#162436]">
                  {editingSource
                    ? `Chỉnh sửa nguồn ${editingSource.id}${
                        editingSource.isBuiltIn ? ' (Nguồn chuẩn khởi tạo)' : ''
                      }`
                    : 'Thêm nguồn tư liệu mới (ưu tiên nguồn riêng cho từng tấm bia)'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    resetSourceForm();
                    setShowSourceForm(false);
                  }}
                  className="p-1.5 text-[#64748B] hover:text-[#162436] rounded hover:bg-[#F3EFE6] cursor-pointer"
                  aria-label="Đóng biểu mẫu nguồn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Cơ quan / Tác giả *{' '}
                    <span className="text-[#7A8699] font-normal">({srcOrg.length}/300)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={300}
                    value={srcOrg}
                    onChange={(e) => setSrcOrg(e.target.value)}
                    placeholder="Ví dụ: Viện Nghiên cứu Hán Nôm"
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Tiêu đề tài liệu *{' '}
                    <span className="text-[#7A8699] font-normal">({srcTitle.length}/500)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    value={srcTitle}
                    onChange={(e) => setSrcTitle(e.target.value)}
                    placeholder="Tên văn khắc, hồ sơ bia hoặc tài liệu"
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    URL hoặc Mã hồ sơ lưu trữ *
                  </label>
                  <input
                    type="text"
                    maxLength={1000}
                    value={srcUrl}
                    onChange={(e) => setSrcUrl(e.target.value)}
                    placeholder="https://... hoặc ký hiệu bản dập"
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                  {urlLooksLikeMissingScheme && (
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#9A7B3E]">
                      <span>Liên kết web nên có tiền tố https:// để mở và kiểm tra URL.</span>
                      <button
                        type="button"
                        onClick={() => setSrcUrl(`https://${srcUrl.trim()}`)}
                        className="underline font-medium hover:text-[#162436] cursor-pointer shrink-0"
                      >
                        Thêm https://
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Phân loại nguồn
                  </label>
                  <select
                    value={srcCat}
                    onChange={(e) =>
                      handleSourceCategoryChange(e.target.value as SourceItem['sourceCategory'])
                    }
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                  >
                    {SOURCE_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Cấp độ chứng minh
                  </label>
                  <select
                    value={srcLevel}
                    onChange={(e) => setSrcLevel(e.target.value as SourceItem['sourceLevel'])}
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                  >
                    {SOURCE_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Trạng thái xác thực (thủ công)
                  </label>
                  <select
                    value={srcStatus}
                    onChange={(e) =>
                      setSrcStatus(e.target.value as SourceItem['verificationStatus'])
                    }
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                  >
                    {SOURCE_VERIFICATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Ngày truy cập / đối chiếu
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={srcDate}
                    onChange={(e) => setSrcDate(e.target.value)}
                    placeholder="YYYY-MM-DD hoặc Chưa xác định"
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Phạm vi thông tin có thể chứng minh *{' '}
                    <span className="text-[#7A8699] font-normal">
                      ({srcProvableScope.length}/1000)
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength={1000}
                    value={srcProvableScope}
                    onChange={(e) => setSrcProvableScope(e.target.value)}
                    placeholder="Nêu rõ nguồn này chứng minh được thông tin gì (niên đại khoa thi, danh sách Tiến sĩ, kích thước bia...)"
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-[#162436] mb-1">
                    Ghi chú{' '}
                    <span className="text-[#7A8699] font-normal">({srcNotes.length}/2000)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={2000}
                    value={srcNotes}
                    onChange={(e) => setSrcNotes(e.target.value)}
                    placeholder="Ghi chú trang trích dẫn, điểm chưa rõ hoặc sai khác..."
                    className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetSourceForm();
                    setShowSourceForm(false);
                  }}
                  className="px-4 py-2 text-xs border border-[#D7CFC0] rounded-md hover:bg-[#F3EFE6] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingSource}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#162436] text-white rounded-md hover:bg-[#233752] cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {savingSource
                      ? 'Đang lưu...'
                      : editingSource
                      ? 'Cập nhật nguồn'
                      : 'Lưu nguồn tư liệu'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {filteredSources.length === 0 ? (
            <div className="bg-white border border-[#E3DDD2] rounded-lg p-8 text-center space-y-2">
              <p className="text-sm font-medium text-[#162436]">
                Không tìm thấy nguồn nào khớp bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSourceSearch('');
                  setSourceFilterCat('');
                  setSourceFilterStatus('');
                }}
                className="text-xs font-medium text-[#9A7B3E] underline cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <>
              {/* Section A1: Nguồn cấp bộ sưu tập (N01–N07) */}
              {collectionSources.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#9A7B3E]" />
                    <h3 className="font-serif text-xl font-semibold text-[#162436]">
                      1. Nguồn chính thống cấp bộ sưu tập (N01–N07)
                    </h3>
                  </div>
                  <div className="bg-white border border-[#E3DDD2] rounded-lg divide-y divide-[#EFEAE0]">
                    {collectionSources.map(renderSourceRow)}
                  </div>
                </section>
              )}

              {/* Section A2: Nguồn riêng cấp từng bia */}
              {(steleSpecificSources.length > 0 ||
                (!sourceSearch && !sourceFilterCat && !sourceFilterStatus)) && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-xl font-semibold text-[#162436]">
                      2. Nguồn tư liệu riêng cấp từng bia ({steleSpecificSources.length})
                    </h3>
                  </div>
                  {steleSpecificSources.length === 0 ? (
                    <div className="bg-[#FDF8EE] border border-[#DFC99B] rounded-lg p-5 text-xs text-[#6B501D] flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#9A7B3E]" />
                      <div>
                        <strong>Chưa có nguồn riêng cấp từng bia:</strong> Các nguồn N01–N07 phía trên chỉ chứng minh ở cấp bộ sưu tập. Để nhập đủ 15 hồ sơ bia Tiến sĩ đạt kiểm chứng, cần tiếp tục thu thập nguồn riêng (hồ sơ văn bia, bản dập Viện Hán Nôm, tài liệu khảo cứu chuyên biệt) phù hợp cho từng tấm bia.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E3DDD2] rounded-lg divide-y divide-[#EFEAE0]">
                      {steleSpecificSources.map(renderSourceRow)}
                    </div>
                  )}
                </section>
              )}

              {/* Section B: Tài liệu kỹ thuật & Tài liệu pháp lý */}
              {technicalLegalSources.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#64748B]" />
                    <h3 className="font-serif text-xl font-semibold text-[#162436]">
                      3. Tài liệu kỹ thuật &amp; Tài liệu pháp lý (Phân loại riêng)
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Các tài liệu dưới đây dùng làm chuẩn biên mục siêu dữ liệu và căn cứ pháp lý công bố, không tính làm bằng chứng lịch sử cho nội dung từng tấm bia.
                  </p>
                  <div className="bg-white border border-[#E3DDD2] rounded-lg divide-y divide-[#EFEAE0]">
                    {technicalLegalSources.map(renderSourceRow)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: PUBLICATION RIGHTS */}
      {subTab === 'rights' && (
        <div className="space-y-6">
          {/* Collection-level Rights Box */}
          <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#162436]">
                  Quyền công bố cấp Bộ sưu tập (Văn Miếu – Quốc Tử Giám)
                </h2>
                <p className="text-xs text-[#4B5B6E] mt-1">
                  Đơn vị quản lý cần liên hệ: <strong>{collectionScope.rightsContactUnit}</strong>.
                  Không tự ghi đã cấp phép và mặc định ẩn ảnh khỏi trang công khai khi chưa có xác minh hợp lệ.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border shrink-0 ${
                  collectionScope.rightsStatus === 'ĐÃ XÁC MINH ĐẦY ĐỦ'
                    ? 'bg-[#F0F7F2] border-[#B7D7C2] text-[#14532D]'
                    : 'bg-[#FDF2EF] border-[#E5C6BD] text-[#9A3412]'
                }`}
              >
                {collectionScope.rightsStatus === 'ĐÃ XÁC MINH ĐẦY ĐỦ' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                <span>{collectionScope.rightsStatus}</span>
              </span>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#EFEAE0]">
                <select
                  value={colRightsStatus}
                  onChange={(e) =>
                    setColRightsStatus(e.target.value as HeritageCollection['rightsStatus'])
                  }
                  className="h-9 px-3 text-xs border border-[#D7CFC0] rounded-md bg-white"
                >
                  <option value="CHƯA XÁC MINH">CHƯA XÁC MINH</option>
                  <option value="ĐÃ XÁC MINH MỘT PHẦN">ĐÃ XÁC MINH MỘT PHẦN</option>
                  <option value="ĐÃ XÁC MINH ĐẦY ĐỦ">ĐÃ XÁC MINH ĐẦY ĐỦ</option>
                  <option value="ĐÃ THU HỒI">ĐÃ THU HỒI</option>
                </select>
                <button
                  type="button"
                  onClick={handleUpdateCollectionRights}
                  className="px-4 py-2 text-xs font-medium bg-[#162436] text-white rounded-md hover:bg-[#233752] cursor-pointer"
                >
                  Cập nhật trạng thái bộ sưu tập
                </button>
              </div>
            )}
          </div>

          {!isAdmin ? (
            <div className="bg-white border border-[#E3DDD2] rounded-lg p-6 text-sm text-[#4B5B6E]">
              Sổ đăng ký quyền công bố chi tiết và hồ sơ cấp phép/thu hồi thuộc dữ liệu quản trị nội bộ. Vui lòng đăng nhập tài khoản quản trị để xem và cập nhật.
            </div>
          ) : (
            <>
              {/* Granular Publication Rights Form */}
              <form
                onSubmit={handleCreateRight}
                className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4"
              >
                <h3 className="font-serif text-lg font-semibold text-[#162436]">
                  Đăng ký văn bản cho phép & Phân quyền chi tiết
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Phạm vi áp dụng
                    </label>
                    <select
                      value={rTargetType}
                      onChange={(e) => setRTargetType(e.target.value as 'collection' | 'record')}
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                    >
                      <option value="record">Theo bản ghi cụ thể</option>
                      <option value="collection">Toàn bộ sưu tập</option>
                    </select>
                  </div>
                  {rTargetType === 'record' && (
                    <div>
                      <label className="block text-xs font-medium text-[#162436] mb-1">
                        Mã bản ghi *
                      </label>
                      <select
                        value={rRecordCode}
                        onChange={(e) => setRRecordCode(e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                      >
                        <option value="">-- Chọn bản ghi --</option>
                        {records.map((r) => (
                          <option key={r.recordCode} value={r.recordCode}>
                            {r.recordCode} — {r.dcTitle.slice(0, 45)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Đơn vị có thẩm quyền *
                    </label>
                    <input
                      type="text"
                      value={rAuthName}
                      onChange={(e) => setRAuthName(e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Vai trò / Chức danh
                    </label>
                    <input
                      type="text"
                      value={rAuthRole}
                      onChange={(e) => setRAuthRole(e.target.value)}
                      placeholder="Đơn vị quản lý di tích..."
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Người xác nhận cho phép
                    </label>
                    <input
                      type="text"
                      value={rConfirmedBy}
                      onChange={(e) => setRConfirmedBy(e.target.value)}
                      placeholder="Họ tên người ký / xác nhận..."
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Ngày xác nhận
                    </label>
                    <input
                      type="text"
                      value={rConsentDate}
                      onChange={(e) => setRConsentDate(e.target.value)}
                      placeholder="YYYY-MM-DD hoặc Chưa xác định"
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Trạng thái quyền
                    </label>
                    <select
                      value={rStatus}
                      onChange={(e) => setRStatus(e.target.value as PublicationRight['status'])}
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md bg-white"
                    >
                      <option value="Chưa xác minh quyền">Chưa xác minh quyền</option>
                      <option value="Đã cấp phép">Đã cấp phép</option>
                      <option value="Từ chối">Từ chối</option>
                      <option value="Đã thu hồi">Đã thu hồi</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Bằng chứng đồng ý (Số công văn / Biên bản / Email)
                    </label>
                    <input
                      type="text"
                      value={rEvidence}
                      onChange={(e) => setREvidence(e.target.value)}
                      placeholder="Số công văn, email xác nhận, biên bản làm việc..."
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Phạm vi sử dụng được phép
                    </label>
                    <input
                      type="text"
                      value={rScopeDesc}
                      onChange={(e) => setRScopeDesc(e.target.value)}
                      placeholder="Ví dụ: Chỉ phục vụ nghiên cứu học thuật phi lợi nhuận, không thương mại..."
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#162436] mb-1">
                      Phần bị hạn chế / không công bố
                    </label>
                    <input
                      type="text"
                      value={rRestrictedParts}
                      onChange={(e) => setRRestrictedParts(e.target.value)}
                      placeholder="Ví dụ: Ảnh độ phân giải cao, vị trí kỹ thuật..."
                      className="w-full h-10 px-3 text-sm border border-[#D7CFC0] rounded-md"
                    />
                  </div>
                </div>

                {/* 4 Granular Rights Checkboxes */}
                <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-[#162436]">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rCanView}
                      onChange={(e) => setRCanView(e.target.checked)}
                    />
                    <span>Quyền xem tư liệu</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rCanPhoto}
                      onChange={(e) => setRCanPhoto(e.target.checked)}
                    />
                    <span>Quyền chụp ảnh</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rCanWeb}
                      onChange={(e) => setRCanWeb(e.target.checked)}
                    />
                    <span>Quyền đăng lên website</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rCanDownload}
                      onChange={(e) => setRCanDownload(e.target.checked)}
                    />
                    <span>Quyền cho tải ảnh</span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-[#162436] text-white rounded-md hover:bg-[#233752] cursor-pointer"
                  >
                    Lưu hồ sơ quyền công bố
                  </button>
                </div>
              </form>

              {/* Rights Ledger */}
              <div className="bg-white border border-[#E3DDD2] rounded-lg divide-y divide-[#EFEAE0]">
                {rights.length === 0 ? (
                  <p className="p-6 text-sm text-[#64748B] text-center">
                    Chưa có hồ sơ cấp phép quyền công bố nào được ghi nhận.
                  </p>
                ) : (
                  rights.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-semibold text-[#162436]">
                            {r.recordCode || 'COLLECTION'}
                          </span>
                          <span>·</span>
                          <span
                            className={
                              r.status === 'Đã cấp phép'
                                ? 'text-[#14532D] font-semibold'
                                : 'text-[#9A3412] font-semibold'
                            }
                          >
                            {r.status}
                          </span>
                          <span>·</span>
                          <span>Ngày xác nhận: {r.consentDate || 'Chưa xác định'}</span>
                        </div>
                        <p className="text-[#162436]">
                          Đơn vị thẩm quyền: <strong>{r.authorizerName}</strong>
                          {r.authorizerRole ? ` (${r.authorizerRole})` : ''}
                          {r.confirmedBy ? ` · Người xác nhận: ${r.confirmedBy}` : ''}
                        </p>
                        <p className="text-[#4B5B6E]">
                          Phân quyền: Xem ({r.canView ? 'Có' : 'Không'}) · Chụp (
                          {r.canPhotograph ? 'Có' : 'Không'}) · Đăng ảnh web (
                          {r.canPublishWebsite ? 'Có' : 'Không'}) · Tải ảnh (
                          {r.canDownloadImage ? 'Có' : 'Không'})
                        </p>
                        {r.scopeDescription && (
                          <p className="text-[#4B5B6E]">Phạm vi: {r.scopeDescription}</p>
                        )}
                        {r.restrictedParts && (
                          <p className="text-[#64748B]">Phần hạn chế: {r.restrictedParts}</p>
                        )}
                        {r.evidenceDescription && (
                          <p className="text-[#64748B]">Bằng chứng: {r.evidenceDescription}</p>
                        )}
                      </div>

                      {r.status !== 'Đã thu hồi' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeRight(r)}
                          className="px-3.5 py-2 text-xs font-medium border border-[#E5C6BD] text-[#9A3412] rounded-md hover:bg-[#FDF2EF] cursor-pointer shrink-0"
                        >
                          Thu hồi quyền &amp; Ẩn công khai
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: LOGS & ADMIN COLLABORATORS */}
      {subTab === 'logs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verification Logs (Publicly auditable) */}
            <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-3">
              <h2 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
                Lịch sử kiểm chứng tư liệu
              </h2>
              {verificationLogs.length === 0 ? (
                <p className="text-xs text-[#64748B]">
                  Chưa có lịch sử chuyển trạng thái kiểm chứng.
                </p>
              ) : (
                <ul className="divide-y divide-[#EFEAE0] text-xs max-h-96 overflow-y-auto">
                  {verificationLogs.map((log) => (
                    <li key={log.id} className="py-2.5 space-y-0.5">
                      <p className="font-medium text-[#162436]">
                        <span className="font-mono mr-1.5">{log.recordCode}</span>
                        {log.previousLevel} → {log.newLevel}
                      </p>
                      <p className="text-[#64748B]">
                        Người kiểm chứng: {log.verifierName} ·{' '}
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </p>
                      {log.notes && <p className="text-[#4B5B6E]">{log.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Audit Logs (Admin only) */}
            <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-3">
              <h2 className="font-serif text-xl font-semibold text-[#162436] border-b border-[#EFEAE0] pb-2">
                Nhật ký chỉnh sửa (Quản trị)
              </h2>
              {!isAdmin ? (
                <p className="text-xs text-[#64748B]">
                  Nhật ký chỉnh sửa nội bộ chỉ hiển thị khi đăng nhập tài khoản quản trị.
                </p>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-[#64748B]">Chưa có nhật ký chỉnh sửa.</p>
              ) : (
                <ul className="divide-y divide-[#EFEAE0] text-xs max-h-96 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="py-2.5 space-y-0.5">
                      <p className="font-medium text-[#162436]">
                        {log.action} {log.recordCode ? `(${log.recordCode})` : ''}
                      </p>
                      <p className="text-[#4B5B6E]">{log.summary}</p>
                      <p className="text-[#64748B]">
                        Người thực hiện: {log.actorName} ·{' '}
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Primary Admin Collaborator Panel */}
          {isPrimaryAdmin && (
            <div className="bg-white border border-[#E3DDD2] rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#EFEAE0] pb-2">
                <UserPlus className="w-4 h-4 text-[#9A7B3E]" />
                <h3 className="font-serif text-lg font-semibold text-[#162436]">
                  Phân quyền cộng tác viên quản trị
                </h3>
              </div>
              <form
                onSubmit={handleAddAdminSubmit}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3"
              >
                <input
                  type="text"
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="Firebase UID"
                  className="h-9 px-3 text-xs border border-[#D7CFC0] rounded-md"
                />
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Email Google đã xác thực"
                  className="h-9 px-3 text-xs border border-[#D7CFC0] rounded-md"
                />
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Họ tên cộng tác viên"
                  className="h-9 px-3 text-xs border border-[#D7CFC0] rounded-md"
                />
                <button
                  type="submit"
                  className="h-9 px-4 text-xs font-medium bg-[#162436] text-white rounded-md hover:bg-[#233752] cursor-pointer"
                >
                  Thêm quản trị viên
                </button>
              </form>
              {adminUsers.length > 0 && (
                <ul className="text-xs text-[#4B5B6E] space-y-1">
                  {adminUsers.map((a) => (
                    <li key={a.uid} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D]" />
                      <span className="font-medium text-[#162436]">{a.displayName}</span>
                      <span>({a.email})</span>
                      <span className="font-mono text-[#64748B]">UID: {a.uid}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      {/* In-app Delete Source Confirmation Modal */}
      {pendingDeleteSource && (
        <div
          className="fixed inset-0 z-50 bg-[#162436]/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#D7CFC0] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-xl font-semibold text-[#162436]">
              Xác nhận xóa nguồn {pendingDeleteSource.id}
            </h3>
            <p className="text-sm text-[#4B5B6E]">
              Bạn sắp xóa nguồn <strong>{pendingDeleteSource.documentTitle}</strong> khỏi cơ sở dữ
              liệu. Thao tác này sẽ được ghi vào nhật ký hệ thống và không thể hoàn tác.
            </p>
            {affectedRecordsForDelete.length > 0 && (
              <div className="bg-[#FDF2EF] border border-[#E5C6BD] rounded-md p-3 text-xs text-[#9A3412] space-y-1">
                <p className="font-semibold">
                  Cảnh báo: Nguồn này đang được tham chiếu trong {affectedRecordsForDelete.length}{' '}
                  hồ sơ bia:
                </p>
                <p className="font-mono">
                  {affectedRecordsForDelete.map((r) => r.recordCode).join(', ')}
                </p>
                <p>Hãy gỡ hoặc thay nguồn khác trong các hồ sơ trên để tránh thiếu dẫn chứng.</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingSource}
                onClick={() => setPendingDeleteSource(null)}
                className="px-4 py-2 text-xs font-medium border border-[#D7CFC0] rounded-md hover:bg-[#F3EFE6] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deletingSource}
                onClick={handleConfirmDeleteSource}
                className="px-4 py-2 text-xs font-medium bg-[#9A3412] text-white rounded-md hover:bg-[#7C2D12] cursor-pointer disabled:opacity-50"
              >
                {deletingSource ? 'Đang xóa...' : 'Xác nhận xóa nguồn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
