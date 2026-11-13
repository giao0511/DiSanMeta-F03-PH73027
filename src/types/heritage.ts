export type ManifestationType =
  | 'bản gốc'
  | 'bản sao'
  | 'bản số của gốc'
  | 'bản số của sao'
  | 'Chưa xác định';

export type TextVerificationStatus =
  | 'Chưa có nguồn'
  | 'Chờ kiểm chứng'
  | 'Đã đối chiếu nguồn'
  | 'Đã kiểm chứng'
  | 'Chưa kiểm chứng'
  | 'Chưa đọc được';

export type RecordVerificationLevel =
  | 'Chưa có nguồn'
  | 'Chờ kiểm chứng'
  | 'Đã đối chiếu nguồn'
  | 'Có thông tin mâu thuẫn'
  | 'Không thể xác minh';

export type ClaimVerificationResult =
  | 'Chưa có nguồn'
  | 'Chờ kiểm chứng'
  | 'Đã đối chiếu nguồn'
  | 'Có thông tin mâu thuẫn'
  | 'Không thể xác minh';

export type CollectionRightsStatus =
  | 'CHƯA XÁC MINH'
  | 'ĐÃ XÁC MINH MỘT PHẦN'
  | 'ĐÃ XÁC MINH ĐẦY ĐỦ'
  | 'ĐÃ THU HỒI';

export type SourceCategory =
  | 'Chính thống'
  | 'Học thuật'
  | 'Lưu trữ nội bộ'
  | 'Tham khảo'
  | 'Tham khảo khác'
  | 'Tài liệu kỹ thuật'
  | 'Tài liệu pháp lý';

export type SourceLevel =
  | 'Cấp bộ sưu tập'
  | 'Cấp từng bia'
  | 'Kỹ thuật / Pháp lý';

export type SourceVerificationStatus =
  | 'Chưa xác minh liên kết'
  | 'Chờ kiểm chứng'
  | 'Đã đối chiếu nguồn'
  | 'Có thông tin mâu thuẫn'
  | 'Không thể xác minh'
  | 'Chưa kiểm tra'
  | 'Đã đối chiếu'
  | 'Có mâu thuẫn'
  | 'Không xác minh được';

export type PublicationRightStatus =
  | 'Chưa xác minh quyền'
  | 'Đã cấp phép'
  | 'Từ chối'
  | 'Đã thu hồi';

export interface ImageAsset {
  id: string;
  url: string;
  viewType: 'toàn cảnh' | 'cận cảnh';
  caption: string;
  imageSource: string;
  photographer?: string;
  rightsVerified: boolean;
  allowWebDisplay: boolean;
  allowDownload: boolean;
}

export interface EvidenceMapping {
  id: string;
  claimField: string;
  claimValue: string;
  sourceId: string;
  citationDetail: string;
  verifiedBy?: string;
  verifiedDate?: string;
  verificationResult: ClaimVerificationResult;
}

export interface HeritageCollection {
  id: string;
  name: string;
  materialType: string;
  plannedTotal: number;
  repositoryName: string;
  repositoryAddress: string;
  rightsContactUnit: string;
  rightsStatus: CollectionRightsStatus;
  notes?: string;
  isPublic: boolean;
  updatedAt: string;
}

export interface HeritageRecord {
  id: string;
  recordCode: string;
  collectionId: string;
  // 15 chuẩn Dublin Core
  dcTitle: string;
  dcCreator: string;
  dcSubject: string;
  dcDescription: string;
  dcPublisher: string;
  dcContributor: string;
  dcDate: string;
  dcType: string;
  dcFormat: string;
  dcIdentifier: string;
  dcSource: string;
  dcLanguage: string;
  dcRelation: string;
  dcCoverage: string;
  dcRights: string;
  // Trường lưu trữ, bảo quản, quyền & kiểm chứng bắt buộc
  currentRepository: string;
  sensitiveStorageNote?: string;
  historicalRepository: string;
  manifestationType: ManifestationType;
  originalCondition: string;
  damageDescription: string;
  repositoryRegistrationNo: string;
  rightsAuthority: string;
  rightsConfirmedBy: string;
  rightsConsentDate: string;
  rightsEvidence: string;
  rightsScope: string;
  recordRightsStatus: PublicationRightStatus;
  allowImagePublish: boolean;
  allowImageDownload: boolean;
  nonPublicContent?: string;
  transcriptionText: string;
  transcriptionVerification: TextVerificationStatus;
  translationText: string;
  translationVerification: TextVerificationStatus;
  verifierName: string;
  verifiedDate: string;
  digitizerName: string;
  digitizedDate: string;
  unclearPoints: string;
  recordVerificationLevel: RecordVerificationLevel;
  isPubliclyPublished: boolean;
  hasRedactedContent?: boolean;
  images: ImageAsset[];
  sourceIds: string[];
  evidenceMappings: EvidenceMapping[];
  createdByUid?: string;
  updatedByUid?: string;
  createdByName?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface SourceItem {
  id: string;
  organizationOrAuthor: string;
  documentTitle: string;
  urlOrArchiveCode: string;
  accessDate: string;
  sourceCategory: SourceCategory;
  sourceLevel: SourceLevel;
  provableScope: string;
  verificationStatus: SourceVerificationStatus;
  lastLinkCheckResult?: string;
  lastLinkCheckedAt?: string;
  notes: string;
  isPublic: boolean;
  isBuiltIn?: boolean;
  createdByUid?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface PublicationRight {
  id: string;
  targetType: 'collection' | 'record';
  recordId?: string;
  recordCode?: string;
  authorizerName: string;
  authorizerRole: string;
  confirmedBy?: string;
  consentDate: string;
  evidenceDescription: string;
  scopeDescription?: string;
  restrictedParts?: string;
  canView: boolean;
  canPhotograph: boolean;
  canPublishWebsite: boolean;
  canDownloadImage: boolean;
  status: PublicationRightStatus;
  revokedReason?: string;
  updatedByUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationLog {
  id: string;
  recordId: string;
  recordCode: string;
  verifierName: string;
  previousLevel: string;
  newLevel: string;
  notes?: string;
  isPublic: boolean;
  createdByUid?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  recordId?: string;
  recordCode?: string;
  actorUid: string;
  actorName: string;
  action: string;
  changedFields: string[];
  summary: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  orderIndex: number;
  question: string;
  evidenceNote: string;
  evidenceUrl: string;
  isCompleted: boolean;
  verifiedByName: string;
  isPublic: boolean;
  updatedByUid?: string;
  updatedAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'reviewer';
  addedByUid: string;
  createdAt: string;
}

export interface GeminiAskCitation {
  recordCode: string;
  title: string;
  repository: string;
  manifestationType: string;
  verificationLevel: string;
  relatedSources: string[];
}

export interface GeminiAskResponse {
  answeredFromData: boolean;
  answer: string;
  citations: GeminiAskCitation[];
  verificationNote: string;
}

export interface GeminiSuggestResponse {
  suggestedDescription: string;
  suggestedSubject: string;
  missingFields: string[];
  verificationSuggestions: string[];
  disclaimer: string;
  isUnverifiedSuggestion: boolean;
  generatedAt: string;
}
