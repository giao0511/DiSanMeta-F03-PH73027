import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  DEFAULT_CHECKLIST_QUESTIONS,
  DEFAULT_COLLECTION_SCOPE,
} from '../constants/dublinCore';
import { BUILTIN_SOURCES } from '../constants/initialSources';
import type {
  AdminUser,
  AuditLog,
  ChecklistItem,
  HeritageCollection,
  HeritageRecord,
  PublicationRight,
  SourceItem,
  VerificationLog,
} from '../types/heritage';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

export async function checkIsUserAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function fetchCollectionScope(): Promise<HeritageCollection> {
  const path = 'collections';
  try {
    const q = query(collection(db, path), where('isPublic', '==', true));
    const snap = await getDocs(q);
    const found = snap.docs.find((d) => d.id === 'f03-van-mieu') ?? snap.docs[0];
    if (!found) {
      return DEFAULT_COLLECTION_SCOPE;
    }
    const data = found.data();
    return {
      id: found.id,
      name: String(data.name ?? DEFAULT_COLLECTION_SCOPE.name),
      materialType: String(data.materialType ?? DEFAULT_COLLECTION_SCOPE.materialType),
      plannedTotal: Number(data.plannedTotal ?? 15),
      repositoryName: String(data.repositoryName ?? DEFAULT_COLLECTION_SCOPE.repositoryName),
      repositoryAddress: String(data.repositoryAddress ?? DEFAULT_COLLECTION_SCOPE.repositoryAddress),
      rightsContactUnit: String(data.rightsContactUnit ?? DEFAULT_COLLECTION_SCOPE.rightsContactUnit),
      rightsStatus: data.rightsStatus ?? 'CHƯA XÁC MINH',
      notes: String(data.notes ?? ''),
      isPublic: Boolean(data.isPublic),
      updatedAt: toIsoString(data.updatedAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveCollectionScope(
  scope: HeritageCollection,
  user: User
): Promise<void> {
  const path = `collections/${scope.id}`;
  try {
    const ref = doc(db, 'collections', scope.id);
    const existing = await getDoc(ref);
    const payload = {
      id: scope.id,
      name: scope.name.trim(),
      materialType: scope.materialType.trim(),
      plannedTotal: Number(scope.plannedTotal) || 15,
      repositoryName: scope.repositoryName.trim(),
      repositoryAddress: scope.repositoryAddress.trim(),
      rightsContactUnit: scope.rightsContactUnit.trim(),
      rightsStatus: scope.rightsStatus,
      notes: (scope.notes ?? '').trim(),
      isPublic: true,
      updatedAt: serverTimestamp(),
    };
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
    await writeAuditLog({
      actorUid: user.uid,
      actorName: user.displayName || user.email || 'Quản trị viên',
      action: 'Cập nhật phạm vi bộ sưu tập',
      changedFields: ['rightsStatus', 'name', 'repositoryAddress'],
      summary: `Cập nhật thông tin bộ sưu tập ${scope.id} (Quyền công bố: ${scope.rightsStatus})`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

function mapDocToRecord(id: string, data: Record<string, unknown>): HeritageRecord {
  return {
    id,
    recordCode: String(data.recordCode ?? id),
    collectionId: String(data.collectionId ?? 'f03-van-mieu'),
    dcTitle: String(data.dcTitle ?? ''),
    dcCreator: String(data.dcCreator ?? 'Chưa xác định'),
    dcSubject: String(data.dcSubject ?? 'Chưa xác định'),
    dcDescription: String(data.dcDescription ?? 'Chưa xác định'),
    dcPublisher: String(data.dcPublisher ?? 'Chưa xác định'),
    dcContributor: String(data.dcContributor ?? 'Chưa xác định'),
    dcDate: String(data.dcDate ?? 'Chưa xác định'),
    dcType: String(data.dcType ?? 'Bia Tiến sĩ'),
    dcFormat: String(data.dcFormat ?? 'Chưa xác định'),
    dcIdentifier: String(data.dcIdentifier ?? id),
    dcSource: String(data.dcSource ?? 'Chưa xác định'),
    dcLanguage: String(data.dcLanguage ?? 'Chưa xác định'),
    dcRelation: String(data.dcRelation ?? 'Chưa xác định'),
    dcCoverage: String(data.dcCoverage ?? 'Chưa xác định'),
    dcRights: String(data.dcRights ?? 'Chưa xác minh quyền'),
    currentRepository: String(data.currentRepository ?? 'Chưa xác định'),
    sensitiveStorageNote:
      typeof data.sensitiveStorageNote === 'string' ? data.sensitiveStorageNote : undefined,
    historicalRepository: String(data.historicalRepository ?? 'Chưa xác định'),
    manifestationType:
      (data.manifestationType as HeritageRecord['manifestationType']) ?? 'Chưa xác định',
    originalCondition: String(data.originalCondition ?? 'Chưa xác định'),
    damageDescription: String(data.damageDescription ?? 'Chưa xác định'),
    repositoryRegistrationNo: String(data.repositoryRegistrationNo ?? 'Chưa xác định'),
    rightsAuthority: String(data.rightsAuthority ?? 'Chưa xác định'),
    rightsConfirmedBy: String(data.rightsConfirmedBy ?? 'Chưa xác định'),
    rightsConsentDate: String(data.rightsConsentDate ?? 'Chưa xác định'),
    rightsEvidence: String(data.rightsEvidence ?? 'Chưa xác định'),
    rightsScope: String(data.rightsScope ?? 'Chưa xác định'),
    recordRightsStatus:
      (data.recordRightsStatus as HeritageRecord['recordRightsStatus']) ??
      'Chưa xác minh quyền',
    allowImagePublish: Boolean(data.allowImagePublish),
    allowImageDownload: Boolean(data.allowImageDownload),
    nonPublicContent:
      typeof data.nonPublicContent === 'string' ? data.nonPublicContent : undefined,
    transcriptionText: String(data.transcriptionText ?? ''),
    transcriptionVerification:
      (data.transcriptionVerification as HeritageRecord['transcriptionVerification']) ??
      'Chờ kiểm chứng',
    translationText: String(data.translationText ?? ''),
    translationVerification:
      (data.translationVerification as HeritageRecord['translationVerification']) ??
      'Chờ kiểm chứng',
    verifierName: String(data.verifierName ?? 'Chưa xác định'),
    verifiedDate: String(data.verifiedDate ?? 'Chưa xác định'),
    digitizerName: String(data.digitizerName ?? 'Chưa xác định'),
    digitizedDate: String(data.digitizedDate ?? 'Chưa xác định'),
    unclearPoints: String(data.unclearPoints ?? 'Chưa xác định'),
    recordVerificationLevel:
      (data.recordVerificationLevel as HeritageRecord['recordVerificationLevel']) ??
      'Chờ kiểm chứng',
    isPubliclyPublished: Boolean(data.isPubliclyPublished),
    hasRedactedContent: Boolean(data.hasRedactedContent),
    images: Array.isArray(data.images) ? (data.images as HeritageRecord['images']) : [],
    sourceIds: Array.isArray(data.sourceIds) ? (data.sourceIds as string[]) : [],
    evidenceMappings: Array.isArray(data.evidenceMappings)
      ? (data.evidenceMappings as HeritageRecord['evidenceMappings'])
      : [],
    createdByUid: typeof data.createdByUid === 'string' ? data.createdByUid : undefined,
    updatedByUid: typeof data.updatedByUid === 'string' ? data.updatedByUid : undefined,
    createdByName: typeof data.createdByName === 'string' ? data.createdByName : undefined,
    updatedByName: typeof data.updatedByName === 'string' ? data.updatedByName : undefined,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function fetchPublicRecords(): Promise<HeritageRecord[]> {
  const path = 'public_records';
  try {
    const q = query(collection(db, path), where('isPubliclyPublished', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapDocToRecord(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.recordCode.localeCompare(b.recordCode));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchAdminRecords(user: User): Promise<HeritageRecord[]> {
  const path = 'admin_records';
  try {
    if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) {
      const snap = await getDocs(collection(db, path));
      return snap.docs
        .map((d) => mapDocToRecord(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.recordCode.localeCompare(b.recordCode));
    }

    // Cộng tác viên quản trị: lấy bản ghi tự tạo + tra cứu trực tiếp 15 mã F03-00001..F03-00015 để kiểm chứng chéo nhóm
    const ownQuery = query(collection(db, path), where('createdByUid', '==', user.uid));
    const f03Codes = Array.from({ length: 15 }, (_, idx) => `F03-${String(idx + 1).padStart(5, '0')}`);
    const [ownSnap, ...slotSnaps] = await Promise.all([
      getDocs(ownQuery),
      ...f03Codes.map((code) => getDoc(doc(db, path, code)).catch(() => null)),
    ]);

    const byCode = new Map<string, HeritageRecord>();
    for (const d of ownSnap.docs) {
      byCode.set(d.id, mapDocToRecord(d.id, d.data() as Record<string, unknown>));
    }
    for (const s of slotSnaps) {
      if (s && s.exists()) {
        byCode.set(s.id, mapDocToRecord(s.id, s.data() as Record<string, unknown>));
      }
    }
    return Array.from(byCode.values()).sort((a, b) => a.recordCode.localeCompare(b.recordCode));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

function buildPublicProjection(record: HeritageRecord) {
  const recordPermitsImages =
    record.recordRightsStatus === 'Đã cấp phép' && record.allowImagePublish;

  const permittedImages = recordPermitsImages
    ? (record.images ?? []).filter((img) => img.rightsVerified && img.allowWebDisplay)
    : [];

  const hasUnpermittedImages = (record.images ?? []).length > permittedImages.length;
  const hasRedacted =
    Boolean(record.sensitiveStorageNote?.trim()) ||
    Boolean(record.nonPublicContent?.trim()) ||
    hasUnpermittedImages;

  return {
    recordCode: record.recordCode,
    collectionId: record.collectionId,
    dcTitle: record.dcTitle,
    dcCreator: record.dcCreator,
    dcSubject: record.dcSubject,
    dcDescription: record.dcDescription,
    dcPublisher: record.dcPublisher,
    dcContributor: record.dcContributor,
    dcDate: record.dcDate,
    dcType: record.dcType,
    dcFormat: record.dcFormat,
    dcIdentifier: record.dcIdentifier,
    dcSource: record.dcSource,
    dcLanguage: record.dcLanguage,
    dcRelation: record.dcRelation,
    dcCoverage: record.dcCoverage,
    dcRights: record.dcRights,
    currentRepository: record.currentRepository,
    historicalRepository: record.historicalRepository,
    manifestationType: record.manifestationType,
    originalCondition: record.originalCondition,
    damageDescription: record.damageDescription,
    repositoryRegistrationNo: record.repositoryRegistrationNo,
    rightsAuthority: record.rightsAuthority,
    rightsConfirmedBy: record.rightsConfirmedBy,
    rightsConsentDate: record.rightsConsentDate,
    rightsEvidence: record.rightsEvidence,
    rightsScope: record.rightsScope,
    recordRightsStatus: record.recordRightsStatus,
    allowImagePublish: record.allowImagePublish,
    allowImageDownload: record.allowImageDownload,
    transcriptionText: record.transcriptionText,
    transcriptionVerification: record.transcriptionVerification,
    translationText: record.translationText,
    translationVerification: record.translationVerification,
    verifierName: record.verifierName,
    verifiedDate: record.verifiedDate,
    digitizerName: record.digitizerName,
    digitizedDate: record.digitizedDate,
    unclearPoints: record.unclearPoints,
    recordVerificationLevel: record.recordVerificationLevel,
    isPubliclyPublished: record.isPubliclyPublished,
    hasRedactedContent: hasRedacted,
    images: permittedImages,
    sourceIds: record.sourceIds,
    evidenceMappings: record.evidenceMappings,
  };
}

export async function saveHeritageRecord(
  record: HeritageRecord,
  user: User,
  isNew: boolean,
  previousVerificationLevel?: string
): Promise<void> {
  const docId = record.recordCode.trim().toUpperCase();
  const adminPath = `admin_records/${docId}`;
  const publicPath = `public_records/${docId}`;

  try {
    const adminRef = doc(db, 'admin_records', docId);
    const publicRef = doc(db, 'public_records', docId);
    const actorName = user.displayName || user.email || 'Quản trị viên';

    const adminPayloadBase = {
      recordCode: docId,
      collectionId: record.collectionId || 'f03-van-mieu',
      dcTitle: record.dcTitle.trim(),
      dcCreator: record.dcCreator.trim() || 'Chưa xác định',
      dcSubject: record.dcSubject.trim() || 'Chưa xác định',
      dcDescription: record.dcDescription.trim() || 'Chưa xác định',
      dcPublisher: record.dcPublisher.trim() || 'Chưa xác định',
      dcContributor: record.dcContributor.trim() || 'Chưa xác định',
      dcDate: record.dcDate.trim() || 'Chưa xác định',
      dcType: record.dcType.trim() || 'Bia Tiến sĩ',
      dcFormat: record.dcFormat.trim() || 'Chưa xác định',
      dcIdentifier: record.dcIdentifier.trim() || docId,
      dcSource: record.dcSource.trim() || 'Chưa xác định',
      dcLanguage: record.dcLanguage.trim() || 'Chưa xác định',
      dcRelation: record.dcRelation.trim() || 'Chưa xác định',
      dcCoverage: record.dcCoverage.trim() || 'Chưa xác định',
      dcRights: record.dcRights.trim() || 'Chưa xác minh quyền',
      currentRepository: record.currentRepository.trim() || 'Chưa xác định',
      sensitiveStorageNote: (record.sensitiveStorageNote ?? '').trim(),
      historicalRepository: record.historicalRepository.trim() || 'Chưa xác định',
      manifestationType: record.manifestationType || 'Chưa xác định',
      originalCondition: record.originalCondition.trim() || 'Chưa xác định',
      damageDescription: record.damageDescription.trim() || 'Chưa xác định',
      repositoryRegistrationNo: record.repositoryRegistrationNo.trim() || 'Chưa xác định',
      rightsAuthority: record.rightsAuthority.trim() || 'Chưa xác định',
      rightsConfirmedBy: (record.rightsConfirmedBy ?? '').trim() || 'Chưa xác định',
      rightsConsentDate: record.rightsConsentDate.trim() || 'Chưa xác định',
      rightsEvidence: (record.rightsEvidence ?? '').trim() || 'Chưa xác định',
      rightsScope: record.rightsScope.trim() || 'Chưa xác định',
      recordRightsStatus: record.recordRightsStatus || 'Chưa xác minh quyền',
      allowImagePublish: Boolean(record.allowImagePublish),
      allowImageDownload: Boolean(record.allowImageDownload),
      nonPublicContent: (record.nonPublicContent ?? '').trim(),
      transcriptionText: record.transcriptionText.trim(),
      transcriptionVerification: record.transcriptionVerification,
      translationText: record.translationText.trim(),
      translationVerification: record.translationVerification,
      verifierName: record.verifierName.trim() || 'Chưa xác định',
      verifiedDate: record.verifiedDate.trim() || 'Chưa xác định',
      digitizerName: record.digitizerName.trim() || 'Chưa xác định',
      digitizedDate: record.digitizedDate.trim() || 'Chưa xác định',
      unclearPoints: record.unclearPoints.trim() || 'Chưa xác định',
      recordVerificationLevel: record.recordVerificationLevel,
      isPubliclyPublished: Boolean(record.isPubliclyPublished),
      images: record.images ?? [],
      sourceIds: record.sourceIds ?? [],
      evidenceMappings: record.evidenceMappings ?? [],
      updatedByUid: user.uid,
      updatedByName: actorName,
      updatedAt: serverTimestamp(),
    };

    const existingAdminSnap = await getDoc(adminRef);
    if (isNew || !existingAdminSnap.exists()) {
      await setDoc(adminRef, {
        ...adminPayloadBase,
        createdByUid: user.uid,
        createdByName: actorName,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(adminRef, adminPayloadBase);
    }

    const publicBase = buildPublicProjection({ ...record, recordCode: docId });
    const existingPublicSnap = await getDoc(publicRef);
    if (record.isPubliclyPublished) {
      if (!existingPublicSnap.exists()) {
        await setDoc(publicRef, {
          ...publicBase,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(publicRef, {
          ...publicBase,
          updatedAt: serverTimestamp(),
        });
      }
    } else if (existingPublicSnap.exists()) {
      await deleteDoc(publicRef);
    }

    if (
      previousVerificationLevel &&
      previousVerificationLevel !== record.recordVerificationLevel
    ) {
      await writeVerificationLog({
        recordId: docId,
        recordCode: docId,
        verifierName:
          record.verifierName.trim() && record.verifierName !== 'Chưa xác định'
            ? record.verifierName.trim()
            : actorName,
        previousLevel: previousVerificationLevel,
        newLevel: record.recordVerificationLevel,
        notes: `Phiên âm: ${record.transcriptionVerification} · Dịch nghĩa: ${record.translationVerification}`,
        createdByUid: user.uid,
      });
    }

    await writeAuditLog({
      recordId: docId,
      recordCode: docId,
      actorUid: user.uid,
      actorName,
      action: isNew ? 'Tạo bản ghi tư liệu' : 'Cập nhật bản ghi tư liệu',
      changedFields: ['dcTitle', 'recordVerificationLevel', 'recordRightsStatus'],
      summary: `${isNew ? 'Tạo mới' : 'Cập nhật'} hồ sơ ${docId} (${record.dcTitle.slice(0, 80)})`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${adminPath} | ${publicPath}`);
  }
}

export async function deleteHeritageRecord(recordCode: string, user: User): Promise<void> {
  const path = `admin_records/${recordCode}`;
  try {
    await deleteDoc(doc(db, 'admin_records', recordCode));
    const publicRef = doc(db, 'public_records', recordCode);
    const pubSnap = await getDoc(publicRef);
    if (pubSnap.exists()) {
      await deleteDoc(publicRef);
    }
    await writeAuditLog({
      recordId: recordCode,
      recordCode,
      actorUid: user.uid,
      actorName: user.displayName || user.email || 'Quản trị viên',
      action: 'Xóa bản ghi tư liệu',
      changedFields: ['deleted'],
      summary: `Xóa bản ghi ${recordCode} khỏi cơ sở dữ liệu quản trị và công khai`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fetchSources(): Promise<SourceItem[]> {
  const path = 'sources';
  try {
    const q = query(collection(db, path), where('isPublic', '==', true));
    const snap = await getDocs(q);
    const storedMap = new Map<string, SourceItem>();
    for (const d of snap.docs) {
      const data = d.data();
      const builtInMatch = BUILTIN_SOURCES.find((b) => b.id === d.id);
      storedMap.set(d.id, {
        id: d.id,
        organizationOrAuthor: String(data.organizationOrAuthor ?? ''),
        documentTitle: String(data.documentTitle ?? ''),
        urlOrArchiveCode: String(data.urlOrArchiveCode ?? ''),
        accessDate: String(data.accessDate ?? ''),
        sourceCategory: data.sourceCategory ?? 'Tham khảo',
        sourceLevel:
          data.sourceLevel ?? builtInMatch?.sourceLevel ?? 'Cấp từng bia',
        provableScope: String(
          data.provableScope ?? builtInMatch?.provableScope ?? ''
        ),
        verificationStatus: data.verificationStatus ?? 'Chờ kiểm chứng',
        lastLinkCheckResult:
          typeof data.lastLinkCheckResult === 'string' && data.lastLinkCheckResult
            ? data.lastLinkCheckResult
            : 'Chưa xác minh liên kết',
        lastLinkCheckedAt:
          typeof data.lastLinkCheckedAt === 'string' ? data.lastLinkCheckedAt : undefined,
        notes: String(data.notes ?? ''),
        isPublic: Boolean(data.isPublic),
        isBuiltIn: Boolean(builtInMatch),
        createdByUid: typeof data.createdByUid === 'string' ? data.createdByUid : undefined,
        createdAt: toIsoString(data.createdAt),
        updatedAt: toIsoString(data.updatedAt),
      });
    }

    // Hợp nhất 7 nguồn N01–N07 + 2 tài liệu kỹ thuật/pháp lý khởi tạo sẵn với các bản lưu từ Firestore
    const merged: SourceItem[] = [];
    for (const builtin of BUILTIN_SOURCES) {
      merged.push(storedMap.get(builtin.id) ?? builtin);
      storedMap.delete(builtin.id);
    }
    const extraStored = Array.from(storedMap.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    return [...merged, ...extraStored];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveSourceItem(
  source: SourceItem,
  user: User,
  isNew: boolean
): Promise<void> {
  const id = source.id || makeDocId('SRC');
  const path = `sources/${id}`;
  try {
    const ref = doc(db, 'sources', id);
    const existing = await getDoc(ref);
    const basePayload = {
      id,
      organizationOrAuthor: source.organizationOrAuthor.trim(),
      documentTitle: source.documentTitle.trim(),
      urlOrArchiveCode: source.urlOrArchiveCode.trim(),
      accessDate: source.accessDate.trim() || 'Chưa xác định',
      sourceCategory: source.sourceCategory,
      sourceLevel: source.sourceLevel || 'Cấp từng bia',
      provableScope: (source.provableScope ?? '').trim(),
      verificationStatus: source.verificationStatus,
      lastLinkCheckResult: (source.lastLinkCheckResult ?? 'Chưa xác minh liên kết').trim(),
      lastLinkCheckedAt: (source.lastLinkCheckedAt ?? '').trim(),
      notes: source.notes.trim(),
      isPublic: true,
      updatedAt: serverTimestamp(),
    };
    if (isNew || !existing.exists()) {
      await setDoc(ref, {
        ...basePayload,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, basePayload);
    }
    await writeAuditLog({
      actorUid: user.uid,
      actorName: user.displayName || user.email || 'Quản trị viên',
      action: isNew || !existing.exists() ? 'Thêm / Lưu nguồn tư liệu' : 'Cập nhật nguồn tư liệu',
      changedFields: ['documentTitle', 'verificationStatus', 'lastLinkCheckResult'],
      summary: `Lưu nguồn ${id} (${source.documentTitle.slice(0, 60)}) — ${source.verificationStatus}`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteSourceItem(id: string, user: User): Promise<void> {
  const path = `sources/${id}`;
  try {
    await deleteDoc(doc(db, 'sources', id));
    await writeAuditLog({
      actorUid: user.uid,
      actorName: user.displayName || user.email || 'Quản trị viên',
      action: 'Xóa nguồn tư liệu',
      changedFields: ['deleted'],
      summary: `Xóa nguồn tư liệu ${id}`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fetchPublicationRights(user: User): Promise<PublicationRight[]> {
  const path = 'publication_rights';
  try {
    const q =
      user.email === BOOTSTRAPPED_ADMIN_EMAIL
        ? collection(db, path)
        : query(collection(db, path), where('updatedByUid', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          targetType: data.targetType ?? 'record',
          recordId: typeof data.recordId === 'string' ? data.recordId : undefined,
          recordCode: typeof data.recordCode === 'string' ? data.recordCode : undefined,
          authorizerName: String(data.authorizerName ?? ''),
          authorizerRole: String(data.authorizerRole ?? ''),
          confirmedBy: typeof data.confirmedBy === 'string' ? data.confirmedBy : '',
          consentDate: String(data.consentDate ?? ''),
          evidenceDescription: String(data.evidenceDescription ?? ''),
          scopeDescription: typeof data.scopeDescription === 'string' ? data.scopeDescription : '',
          restrictedParts: typeof data.restrictedParts === 'string' ? data.restrictedParts : '',
          canView: Boolean(data.canView),
          canPhotograph: Boolean(data.canPhotograph),
          canPublishWebsite: Boolean(data.canPublishWebsite),
          canDownloadImage: Boolean(data.canDownloadImage),
          status: data.status ?? 'Chưa xác minh quyền',
          revokedReason: typeof data.revokedReason === 'string' ? data.revokedReason : undefined,
          updatedByUid: typeof data.updatedByUid === 'string' ? data.updatedByUid : undefined,
          createdAt: toIsoString(data.createdAt),
          updatedAt: toIsoString(data.updatedAt),
        } as PublicationRight;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function savePublicationRight(
  right: PublicationRight,
  user: User,
  isNew: boolean
): Promise<void> {
  const id = right.id || makeDocId('RIGHT');
  const path = `publication_rights/${id}`;
  try {
    const ref = doc(db, 'publication_rights', id);
    const existing = await getDoc(ref);
    const payload = {
      id,
      targetType: right.targetType,
      recordId: right.recordId ?? '',
      recordCode: right.recordCode ?? '',
      authorizerName: right.authorizerName.trim(),
      authorizerRole: right.authorizerRole.trim(),
      confirmedBy: (right.confirmedBy ?? '').trim(),
      consentDate: right.consentDate.trim(),
      evidenceDescription: right.evidenceDescription.trim(),
      scopeDescription: (right.scopeDescription ?? '').trim(),
      restrictedParts: (right.restrictedParts ?? '').trim(),
      canView: Boolean(right.canView),
      canPhotograph: Boolean(right.canPhotograph),
      canPublishWebsite: Boolean(right.canPublishWebsite),
      canDownloadImage: Boolean(right.canDownloadImage),
      status: right.status,
      revokedReason: (right.revokedReason ?? '').trim(),
      updatedByUid: user.uid,
      updatedAt: serverTimestamp(),
    };
    if (isNew || !existing.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payload);
    }

    // Đồng bộ trực tiếp trạng thái quyền lên bản ghi liên quan
    if (right.targetType === 'record' && right.recordCode) {
      const adminRecRef = doc(db, 'admin_records', right.recordCode);
      const adminRecSnap = await getDoc(adminRecRef);
      if (adminRecSnap.exists()) {
        const recData = mapDocToRecord(
          right.recordCode,
          adminRecSnap.data() as Record<string, unknown>
        );
        const allowWeb = right.status === 'Đã cấp phép' && right.canPublishWebsite;
        const allowDl = right.status === 'Đã cấp phép' && right.canDownloadImage;
        const updatedImages = recData.images.map((img) => ({
          ...img,
          allowWebDisplay: allowWeb,
          allowDownload: allowDl,
          rightsVerified: right.status === 'Đã cấp phép',
        }));
        const shouldUnpublish = right.status === 'Đã thu hồi' || right.status === 'Từ chối';
        await updateDoc(adminRecRef, {
          images: updatedImages,
          recordRightsStatus: right.status,
          allowImagePublish: allowWeb,
          allowImageDownload: allowDl,
          rightsAuthority: right.authorizerName,
          rightsConfirmedBy: right.confirmedBy || 'Chưa xác định',
          rightsConsentDate: right.consentDate || 'Chưa xác định',
          rightsEvidence: right.evidenceDescription || 'Chưa xác định',
          rightsScope: right.scopeDescription || 'Chưa xác định',
          isPubliclyPublished: shouldUnpublish ? false : recData.isPubliclyPublished,
          dcRights: `Trạng thái quyền: ${right.status}${right.revokedReason ? ` (${right.revokedReason})` : ''}`,
          updatedByUid: user.uid,
          updatedByName: user.displayName || user.email || 'Quản trị viên',
          updatedAt: serverTimestamp(),
        });

        const pubRef = doc(db, 'public_records', right.recordCode);
        const pubSnap = await getDoc(pubRef);
        if (shouldUnpublish && pubSnap.exists()) {
          await deleteDoc(pubRef);
        } else if (pubSnap.exists()) {
          await updateDoc(pubRef, {
            images: allowWeb ? updatedImages : [],
            recordRightsStatus: right.status,
            allowImagePublish: allowWeb,
            allowImageDownload: allowDl,
            hasRedactedContent: !allowWeb || Boolean(recData.nonPublicContent),
            dcRights: `Trạng thái quyền: ${right.status}`,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    await writeAuditLog({
      recordId: right.recordId,
      recordCode: right.recordCode,
      actorUid: user.uid,
      actorName: user.displayName || user.email || 'Quản trị viên',
      action:
        right.status === 'Đã thu hồi'
          ? 'Thu hồi quyền công bố'
          : isNew
          ? 'Đăng ký quyền công bố'
          : 'Cập nhật quyền công bố',
      changedFields: ['status', 'canPublishWebsite', 'canDownloadImage'],
      summary: `${right.status} cho ${
        right.targetType === 'collection' ? 'toàn bộ sưu tập' : right.recordCode || 'bản ghi'
      } bởi ${right.authorizerName}`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchVerificationLogs(): Promise<VerificationLog[]> {
  const path = 'verification_logs';
  try {
    const q = query(collection(db, path), where('isPublic', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          recordId: String(data.recordId ?? ''),
          recordCode: String(data.recordCode ?? ''),
          verifierName: String(data.verifierName ?? ''),
          previousLevel: String(data.previousLevel ?? ''),
          newLevel: String(data.newLevel ?? ''),
          notes: typeof data.notes === 'string' ? data.notes : undefined,
          isPublic: Boolean(data.isPublic),
          createdByUid: typeof data.createdByUid === 'string' ? data.createdByUid : undefined,
          createdAt: toIsoString(data.createdAt),
        } as VerificationLog;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

async function writeVerificationLog(input: {
  recordId: string;
  recordCode: string;
  verifierName: string;
  previousLevel: string;
  newLevel: string;
  notes?: string;
  createdByUid: string;
}): Promise<void> {
  const id = makeDocId('VLOG');
  await setDoc(doc(db, 'verification_logs', id), {
    id,
    recordId: input.recordId,
    recordCode: input.recordCode,
    verifierName: input.verifierName,
    previousLevel: input.previousLevel,
    newLevel: input.newLevel,
    notes: input.notes ?? '',
    isPublic: true,
    createdByUid: input.createdByUid,
    createdAt: serverTimestamp(),
  });
}

export async function fetchAuditLogs(user: User): Promise<AuditLog[]> {
  const path = 'audit_logs';
  try {
    const q =
      user.email === BOOTSTRAPPED_ADMIN_EMAIL
        ? collection(db, path)
        : query(collection(db, path), where('actorUid', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          recordId: typeof data.recordId === 'string' ? data.recordId : undefined,
          recordCode: typeof data.recordCode === 'string' ? data.recordCode : undefined,
          actorUid: String(data.actorUid ?? ''),
          actorName: String(data.actorName ?? ''),
          action: String(data.action ?? ''),
          changedFields: Array.isArray(data.changedFields)
            ? (data.changedFields as string[])
            : [],
          summary: String(data.summary ?? ''),
          createdAt: toIsoString(data.createdAt),
        } as AuditLog;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

async function writeAuditLog(input: {
  recordId?: string;
  recordCode?: string;
  actorUid: string;
  actorName: string;
  action: string;
  changedFields: string[];
  summary: string;
}): Promise<void> {
  const id = makeDocId('AUDIT');
  await setDoc(doc(db, 'audit_logs', id), {
    id,
    recordId: input.recordId ?? '',
    recordCode: input.recordCode ?? '',
    actorUid: input.actorUid,
    actorName: input.actorName,
    action: input.action,
    changedFields: input.changedFields,
    summary: input.summary,
    createdAt: serverTimestamp(),
  });
}

export async function fetchChecklistItems(): Promise<ChecklistItem[]> {
  const path = 'checklist_items';
  try {
    const q = query(collection(db, path), where('isPublic', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      return DEFAULT_CHECKLIST_QUESTIONS.map((question, idx) => ({
        id: `chk-${String(idx + 1).padStart(2, '0')}`,
        orderIndex: idx + 1,
        question,
        evidenceNote: '',
        evidenceUrl: '',
        isCompleted: false,
        verifiedByName: '',
        isPublic: true,
        updatedAt: new Date().toISOString(),
      }));
    }
    const storedMap = new Map<string, ChecklistItem>();
    for (const d of snap.docs) {
      const data = d.data();
      storedMap.set(d.id, {
        id: d.id,
        orderIndex: Number(data.orderIndex ?? 1),
        question: String(data.question ?? ''),
        evidenceNote: String(data.evidenceNote ?? ''),
        evidenceUrl: String(data.evidenceUrl ?? ''),
        isCompleted: Boolean(data.isCompleted),
        verifiedByName: String(data.verifiedByName ?? ''),
        isPublic: Boolean(data.isPublic),
        updatedByUid: typeof data.updatedByUid === 'string' ? data.updatedByUid : undefined,
        updatedAt: toIsoString(data.updatedAt),
      });
    }
    return DEFAULT_CHECKLIST_QUESTIONS.map((question, idx) => {
      const id = `chk-${String(idx + 1).padStart(2, '0')}`;
      return (
        storedMap.get(id) ?? {
          id,
          orderIndex: idx + 1,
          question,
          evidenceNote: '',
          evidenceUrl: '',
          isCompleted: false,
          verifiedByName: '',
          isPublic: true,
          updatedAt: new Date().toISOString(),
        }
      );
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveChecklistItem(
  item: ChecklistItem,
  user: User
): Promise<void> {
  const path = `checklist_items/${item.id}`;
  try {
    const ref = doc(db, 'checklist_items', item.id);
    const existing = await getDoc(ref);
    const payload = {
      id: item.id,
      orderIndex: item.orderIndex,
      question: item.question,
      evidenceNote: item.evidenceNote.trim(),
      evidenceUrl: item.evidenceUrl.trim(),
      isCompleted: item.isCompleted,
      verifiedByName: item.verifiedByName.trim() || user.displayName || user.email || '',
      isPublic: true,
      updatedByUid: user.uid,
      updatedAt: serverTimestamp(),
    };
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const path = 'admins';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: String(data.email ?? ''),
        displayName: String(data.displayName ?? ''),
        role: data.role === 'reviewer' ? 'reviewer' : 'admin',
        addedByUid: String(data.addedByUid ?? ''),
        createdAt: toIsoString(data.createdAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function addAdminUser(
  adminData: { uid: string; email: string; displayName: string; role: 'admin' | 'reviewer' },
  actor: User
): Promise<void> {
  const path = `admins/${adminData.uid}`;
  try {
    await setDoc(doc(db, 'admins', adminData.uid), {
      uid: adminData.uid.trim(),
      email: adminData.email.trim(),
      displayName: adminData.displayName.trim(),
      role: adminData.role,
      addedByUid: actor.uid,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
