import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { AlertCircle, Loader2 } from 'lucide-react';
import { DEFAULT_COLLECTION_SCOPE } from './constants/dublinCore';
import { DEMO_RECORDS, DEMO_SOURCES } from './data/demoData';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  googleProvider,
  testFirestoreConnection,
} from './lib/firebase';
import {
  addAdminUser,
  checkIsUserAdmin,
  deleteHeritageRecord,
  deleteSourceItem,
  fetchAdminRecords,
  fetchAdminUsers,
  fetchAuditLogs,
  fetchChecklistItems,
  fetchCollectionScope,
  fetchPublicRecords,
  fetchPublicationRights,
  fetchSources,
  fetchVerificationLogs,
  saveChecklistItem,
  saveCollectionScope,
  saveHeritageRecord,
  savePublicationRight,
  saveSourceItem,
} from './lib/recordsService';
import type {
  AdminUser,
  AuditLog,
  ChecklistItem,
  HeritageCollection,
  HeritageRecord,
  PublicationRight,
  SourceItem,
  VerificationLog,
} from './types/heritage';
import { Header, type MainTab } from './components/Header';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { RecordDetailView } from './components/RecordDetailView';
import { RecordFormModal } from './components/RecordFormModal';
import { SourcesAndRightsView } from './components/SourcesAndRightsView';
import { GeminiAssistantView } from './components/GeminiAssistantView';
import { SubmissionHubView } from './components/SubmissionHubView';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [collectionScope, setCollectionScope] = useState<HeritageCollection>(
    DEFAULT_COLLECTION_SCOPE
  );
  const [realRecords, setRealRecords] = useState<HeritageRecord[]>([]);
  const [realSources, setRealSources] = useState<SourceItem[]>([]);
  const [rights, setRights] = useState<PublicationRight[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);

  // Interactive navigation / UI states
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<HeritageRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<HeritageRecord | null | undefined>(
    undefined
  ); // undefined = closed, null = new record, HeritageRecord = edit existing
  const [prefillRecordCode, setPrefillRecordCode] = useState<string | undefined>(undefined);

  const loadData = useCallback(async (currentUser: User | null, adminFlag: boolean) => {
    setDataLoading(true);
    setGlobalError(null);
    try {
      const conn = await testFirestoreConnection();
      if (!conn.connected) {
        setGlobalError(conn.error || 'Không thể kết nối cơ sở dữ liệu.');
      }

      const [scope, pubRecs, srcs, vLogs, chk] = await Promise.all([
        fetchCollectionScope(),
        fetchPublicRecords(),
        fetchSources(),
        fetchVerificationLogs(),
        fetchChecklistItems(),
      ]);

      setCollectionScope(scope);
      setRealSources(srcs);
      setVerificationLogs(vLogs);
      setChecklist(chk);

      if (adminFlag && currentUser) {
        const [admRecs, rts, aLogs] = await Promise.all([
          fetchAdminRecords(currentUser),
          fetchPublicationRights(currentUser),
          fetchAuditLogs(currentUser),
        ]);
        // Hợp nhất: ưu tiên dữ liệu admin đầy đủ, bổ sung bản ghi công khai khác nếu có
        const byCode = new Map<string, HeritageRecord>();
        for (const r of pubRecs) byCode.set(r.recordCode, r);
        for (const r of admRecs) byCode.set(r.recordCode, r);
        setRealRecords(
          Array.from(byCode.values()).sort((a, b) => a.recordCode.localeCompare(b.recordCode))
        );
        setRights(rts);
        setAuditLogs(aLogs);

        if (currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL) {
          const admins = await fetchAdminUsers();
          setAdminUsers(admins);
        }
      } else {
        setRealRecords(pubRecs);
        setRights([]);
        setAuditLogs([]);
        setAdminUsers([]);
      }
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu từ Firestore. Vui lòng thử lại.'
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setGeminiConfigured(Boolean(d?.geminiConfigured)))
      .catch(() => setGeminiConfigured(null));
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      const adminStatus = await checkIsUserAdmin(u);
      setIsAdmin(adminStatus);
      setAuthLoading(false);
      await loadData(u, adminStatus);
    });
    return () => unsub();
  }, [loadData]);

  const handleSignIn = async () => {
    setGlobalError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? `Đăng nhập thất bại: ${err.message}`
          : 'Không thể đăng nhập bằng Google.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setSelectedRecord(null);
    setEditingRecord(undefined);
  };

  const nextRecordCode = useMemo(() => {
    let maxNum = 0;
    for (const r of realRecords) {
      const m = /^F03-(\d+)$/.exec(r.recordCode);
      if (m) {
        maxNum = Math.max(maxNum, Number(m[1]));
      }
    }
    return `F03-${String(maxNum + 1).padStart(5, '0')}`;
  }, [realRecords]);

  const handleSaveRecord = async (
    record: HeritageRecord,
    isNew: boolean,
    previousLevel?: string
  ) => {
    if (!user || !isAdmin) {
      throw new Error('Bạn cần đăng nhập tài khoản quản trị để lưu bản ghi.');
    }
    await saveHeritageRecord(record, user, isNew, previousLevel);
    await loadData(user, isAdmin);
    if (selectedRecord && selectedRecord.recordCode === record.recordCode) {
      setSelectedRecord(record);
    }
  };

  const handleDeleteRecord = async (record: HeritageRecord) => {
    if (!user || !isAdmin) return;
    await deleteHeritageRecord(record.recordCode, user);
    if (selectedRecord?.recordCode === record.recordCode) {
      setSelectedRecord(null);
    }
    await loadData(user, isAdmin);
  };

  const handleSaveSource = async (source: SourceItem, isNew: boolean) => {
    if (!user || !isAdmin) {
      throw new Error('Cần quyền quản trị để chỉnh sửa nguồn tư liệu.');
    }
    await saveSourceItem(source, user, isNew);
    await loadData(user, isAdmin);
  };

  const handleDeleteSource = async (id: string) => {
    if (!user || !isAdmin) return;
    await deleteSourceItem(id, user);
    await loadData(user, isAdmin);
  };

  const handleSaveRight = async (right: PublicationRight, isNew: boolean) => {
    if (!user || !isAdmin) {
      throw new Error('Cần quyền quản trị để cập nhật quyền công bố.');
    }
    await savePublicationRight(right, user, isNew);
    await loadData(user, isAdmin);
  };

  const handleSaveCollectionScope = async (scope: HeritageCollection) => {
    if (!user || !isAdmin) {
      throw new Error('Cần quyền quản trị để cập nhật phạm vi bộ sưu tập.');
    }
    await saveCollectionScope(scope, user);
    await loadData(user, isAdmin);
  };

  const handleSaveChecklistItem = async (item: ChecklistItem) => {
    if (!user || !isAdmin) return;
    await saveChecklistItem(item, user);
    await loadData(user, isAdmin);
  };

  const handleAddAdmin = async (data: {
    uid: string;
    email: string;
    displayName: string;
    role: 'admin' | 'reviewer';
  }) => {
    if (!user || !isAdmin) return;
    await addAdminUser(data, user);
    await loadData(user, isAdmin);
  };

  const combinedSourcesForDetail = showDemoMode
    ? [...realSources, ...DEMO_SOURCES]
    : realSources;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#162436]">
      <Header
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setSelectedRecord(null);
        }}
        user={user}
        isAdmin={isAdmin}
        authLoading={authLoading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {globalError && (
        <div className="no-print max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-[#FDF2EF] border border-[#E5C6BD] rounded-md px-4 py-3 text-xs text-[#9A3412] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="break-words">{globalError}</div>
          </div>
        </div>
      )}

      {user && !isAdmin && !authLoading && (
        <div className="no-print max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-[#FDF8EE] border border-[#DFC99B] rounded-md px-4 py-2.5 text-xs text-[#6B501D]">
            Tài khoản <strong>{user.email}</strong> hiện đang ở chế độ người xem công khai (chưa được cấp quyền quản trị chỉnh sửa dữ liệu).
          </div>
        </div>
      )}

      <main className="flex-1">
        {dataLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-sm text-[#4B5B6E]">
            <Loader2 className="w-6 h-6 animate-spin text-[#9A7B3E]" />
            <span>Đang tải dữ liệu DiSanMeta...</span>
          </div>
        ) : selectedRecord ? (
          <RecordDetailView
            record={selectedRecord}
            sources={combinedSourcesForDetail}
            verificationLogs={verificationLogs}
            isAdmin={isAdmin}
            onBack={() => setSelectedRecord(null)}
            onEdit={() => setEditingRecord(selectedRecord)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                collectionScope={collectionScope}
                realRecords={realRecords}
                realSources={realSources}
                onSearchCatalog={(q) => {
                  setCatalogSearchQuery(q);
                  setActiveTab('catalog');
                }}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenNewRecord={() => setEditingRecord(null)}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'catalog' && (
              <CatalogView
                realRecords={realRecords}
                realSources={realSources}
                demoRecords={DEMO_RECORDS}
                showDemoMode={showDemoMode}
                onToggleDemoMode={setShowDemoMode}
                initialQuery={catalogSearchQuery}
                isAdmin={isAdmin}
                onSelectRecord={(rec) => setSelectedRecord(rec)}
                onCreateRecord={(code) => {
                  setPrefillRecordCode(code);
                  setEditingRecord(null);
                }}
                onEditRecord={(rec) => {
                  setPrefillRecordCode(undefined);
                  setEditingRecord(rec);
                }}
                onDeleteRecord={handleDeleteRecord}
              />
            )}

            {activeTab === 'sources' && (
              <SourcesAndRightsView
                collectionScope={collectionScope}
                records={realRecords}
                sources={realSources}
                rights={rights}
                verificationLogs={verificationLogs}
                auditLogs={auditLogs}
                adminUsers={adminUsers}
                isAdmin={isAdmin}
                isPrimaryAdmin={user?.email === BOOTSTRAPPED_ADMIN_EMAIL}
                onSaveSource={handleSaveSource}
                onDeleteSource={handleDeleteSource}
                onSaveRight={handleSaveRight}
                onSaveCollectionScope={handleSaveCollectionScope}
                onAddAdmin={handleAddAdmin}
              />
            )}

            {activeTab === 'gemini' && (
              <GeminiAssistantView
                realRecords={realRecords}
                realSources={realSources}
                demoRecords={DEMO_RECORDS}
                demoSources={DEMO_SOURCES}
                geminiConfigured={geminiConfigured}
              />
            )}

            {activeTab === 'submission' && (
              <SubmissionHubView
                collectionScope={collectionScope}
                realRecords={realRecords}
                realSources={realSources}
                rights={rights}
                verificationLogs={verificationLogs}
                auditLogs={auditLogs}
                checklist={checklist}
                isAdmin={isAdmin}
                geminiConfigured={geminiConfigured}
                onSaveChecklistItem={handleSaveChecklistItem}
              />
            )}
          </>
        )}
      </main>

      <footer className="no-print border-t border-[#E3DDD2] bg-[#F3EFE6]/60 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#4B5B6E]">
          <div>
            <p className="font-semibold text-[#162436]">
              DiSanMeta · Đề tài F03 · Nhóm 1 — Dự án xã hội phi lợi nhuận
            </p>
            <p className="mt-0.5">
              Sinh viên Trần Trung Hiếu (MSV: PH73027) · Thực tập sinh Đợt 15, FPT Polytechnic &amp; IMTA TECH
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedRecord(null);
                setActiveTab('submission');
              }}
              className="hover:text-[#162436] underline cursor-pointer"
            >
              Giới thiệu &amp; Kiểm tra nộp bài
            </button>
          </div>
        </div>
      </footer>

      {editingRecord !== undefined && isAdmin && (
        <RecordFormModal
          initialRecord={editingRecord}
          nextRecordCode={prefillRecordCode || nextRecordCode}
          sources={realSources}
          onClose={() => {
            setEditingRecord(undefined);
            setPrefillRecordCode(undefined);
          }}
          onSave={handleSaveRecord}
        />
      )}
    </div>
  );
}
