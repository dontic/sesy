// @ts-nocheck
export interface ApiKey {
  readonly pk: number;
  /** @maxLength 100 */
  name?: string;
  readonly key: string;
  readonly created_by: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ApiKeyRequest {
  /**
     * @minLength 1
     * @maxLength 100
     */
  name?: string;
}

/**
 * * `admin` - Admin
 * * `user` - User
 */
export type AssignableRoleEnum = typeof AssignableRoleEnum[keyof typeof AssignableRoleEnum];


export const AssignableRoleEnum = {
  admin: 'admin',
  user: 'user',
} as const;

export interface Tag {
  readonly pk: number;
  /** @maxLength 100 */
  name: string;
  readonly created_at: string;
}

export interface AudienceMember {
  readonly pk: number;
  /** @maxLength 254 */
  email: string;
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
  subscribed?: boolean;
  tags?: number[];
  readonly tags_detail: readonly Tag[];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AudienceMemberCsvUploadRequest {
  file: Blob;
}

export interface AudienceMemberRequest {
  /**
     * @minLength 1
     * @maxLength 254
     */
  email: string;
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
  subscribed?: boolean;
  tags?: number[];
}

/**
 * * `draft` - Draft
 * * `sending` - Sending
 * * `sent` - Sent
 * * `failed` - Failed
 */
export type CampaignStatusEnum = typeof CampaignStatusEnum[keyof typeof CampaignStatusEnum];


export const CampaignStatusEnum = {
  draft: 'draft',
  sending: 'sending',
  sent: 'sent',
  failed: 'failed',
} as const;

export interface Campaign {
  readonly pk: number;
  /** @maxLength 255 */
  name: string;
  /** @maxLength 254 */
  from_email: string;
  /** @maxLength 255 */
  from_name?: string;
  /** @maxLength 998 */
  subject: string;
  /** HTML body. Use {{first_name}} and {{last_name}} for personalization. */
  html_body: string;
  /** Send to all audience members. If False, only send to members with the specified tags. */
  send_to_all?: boolean;
  tags?: number[];
  readonly tags_detail: readonly Tag[];
  readonly status: CampaignStatusEnum;
  /** @nullable */
  readonly sent_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CampaignRequest {
  /**
     * @minLength 1
     * @maxLength 255
     */
  name: string;
  /**
     * @minLength 1
     * @maxLength 254
     */
  from_email: string;
  /** @maxLength 255 */
  from_name?: string;
  /**
     * @minLength 1
     * @maxLength 998
     */
  subject: string;
  /**
     * HTML body. Use {{first_name}} and {{last_name}} for personalization.
     * @minLength 1
     */
  html_body: string;
  /** Send to all audience members. If False, only send to members with the specified tags. */
  send_to_all?: boolean;
  tags?: number[];
}

export interface DetailResponse {
  detail: string;
}

export interface LoginRequest {
  /** @minLength 1 */
  username: string;
  /** @minLength 1 */
  password: string;
}

/**
 * * `pending` - Pending
 * * `verified` - Verified
 * * `failed` - Failed
 */
export type MailFromStatusEnum = typeof MailFromStatusEnum[keyof typeof MailFromStatusEnum];


export const MailFromStatusEnum = {
  pending: 'pending',
  verified: 'verified',
  failed: 'failed',
} as const;

export interface OnboardingResponse {
  username_changed: boolean;
  password_changed: boolean;
  project_created: boolean;
  ses_configured: boolean;
  domain_configured: boolean;
}

export interface PaginatedAudienceMemberList {
  count: number;
  /** @nullable */
  next?: string | null;
  /** @nullable */
  previous?: string | null;
  results: AudienceMember[];
}

export interface PasswordChangeRequest {
  /** @minLength 1 */
  old_password?: string;
  /** @minLength 1 */
  new_password1: string;
  /** @minLength 1 */
  new_password2: string;
}

/**
 * Used by admins and the owner to list, create and update other users.
 */
export interface PatchedUserManagementUpdateRequest {
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
  role?: AssignableRoleEnum;
}

/**
 * * `unknown` - Unknown
 * * `sandbox` - Sandbox
 * * `production` - Production
 */
export type ProductionStatusEnum = typeof ProductionStatusEnum[keyof typeof ProductionStatusEnum];


export const ProductionStatusEnum = {
  unknown: 'unknown',
  sandbox: 'sandbox',
  production: 'production',
} as const;

/**
 * * `pending` - Pending
 * * `verified` - Verified
 * * `failed` - Failed
 */
export type StatusA39Enum = typeof StatusA39Enum[keyof typeof StatusA39Enum];


export const StatusA39Enum = {
  pending: 'pending',
  verified: 'verified',
  failed: 'failed',
} as const;

export interface VerifiedDomain {
  readonly pk: number;
  /** @maxLength 255 */
  domain: string;
  readonly verification_token: string;
  readonly dkim_tokens: unknown;
  readonly mail_from_domain: string;
  readonly mail_from_status: MailFromStatusEnum;
  readonly dns_records: string;
  readonly status: StatusA39Enum;
  /** @nullable */
  readonly last_checked_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Project {
  readonly pk: number;
  /** @maxLength 255 */
  name: string;
  description?: string;
  readonly domain: VerifiedDomain;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProjectRequest {
  /**
     * @minLength 1
     * @maxLength 255
     */
  name: string;
  description?: string;
}

export interface PublicAudienceMemberRequest {
  project_pk: number;
  /** @minLength 1 */
  email: string;
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
  /**
     * @items.minLength 1
     * @items.maxLength 100
     */
  tags?: string[];
}

export interface PublicMemberBadRequest {
  detail: string;
}

export interface PublicMemberNotFound {
  detail: string;
}

export interface PublicMemberUnauthorized {
  detail: string;
}

/**
 * * `owner` - Owner
 * * `admin` - Admin
 * * `user` - User
 */
export type RoleEnum = typeof RoleEnum[keyof typeof RoleEnum];


export const RoleEnum = {
  owner: 'owner',
  admin: 'admin',
  user: 'user',
} as const;

export interface SESConfiguration {
  readonly pk: number;
  /** @maxLength 255 */
  aws_access_key_id: string;
  /** @maxLength 50 */
  aws_region?: string;
  /** Max emails per second */
  sending_rate?: number;
  readonly production_status: ProductionStatusEnum;
  /**
     * Max sending rate (emails/sec) retrieved from AWS SES
     * @nullable
     */
  readonly max_sending_rate: number | null;
  /** Indicates whether the AWS credentials are valid and reachable */
  readonly config_valid: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SESConfigurationRequest {
  /**
     * @minLength 1
     * @maxLength 255
     */
  aws_access_key_id: string;
  aws_secret_access_key?: string;
  /**
     * @minLength 1
     * @maxLength 50
     */
  aws_region?: string;
  /** Max emails per second */
  sending_rate?: number;
}

export interface TagMergeRequestRequest {
  target_tag_pk: number;
}

export interface TagNameConflictDetail {
  message: string;
  conflicting_tag_pk: number;
}

export interface TagNameConflictError {
  name: TagNameConflictDetail;
}

export interface TagRequest {
  /**
     * @minLength 1
     * @maxLength 100
     */
  name: string;
}

export interface TempPassword {
  readonly username: string;
  readonly temp_password: string;
}

export interface UnsubscribeRequest {
  /** @minLength 1 */
  email: string;
}

export interface User {
  readonly pk: number;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  readonly username: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  /** Designates whether the user can log into this admin site. */
  readonly is_staff: boolean;
  readonly role: RoleEnum;
  /** Designates whether the user must set a new password on next login. */
  readonly must_change_password: boolean;
}

/**
 * Used by admins and the owner to list, create and update other users.
 */
export interface UserCreated {
  readonly pk: number;
  /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     * @maxLength 150
     * @pattern ^[\w.@+-]+$
     */
  username: string;
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
  role?: AssignableRoleEnum;
  /** Designates whether the user must set a new password on next login. */
  readonly must_change_password: boolean;
  /** @nullable */
  readonly last_login: string | null;
  readonly date_joined: string;
  readonly temp_password: string;
}

/**
 * Used by admins and the owner to list, create and update other users.
 */
export interface UserManagement {
  readonly pk: number;
  /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     * @maxLength 150
     * @pattern ^[\w.@+-]+$
     */
  username: string;
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
  role?: AssignableRoleEnum;
  /** Designates whether the user must set a new password on next login. */
  readonly must_change_password: boolean;
  /** @nullable */
  readonly last_login: string | null;
  readonly date_joined: string;
}

/**
 * Used by admins and the owner to list, create and update other users.
 */
export interface UserManagementRequest {
  /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     * @minLength 1
     * @maxLength 150
     * @pattern ^[\w.@+-]+$
     */
  username: string;
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
  role?: AssignableRoleEnum;
}

export interface UserUpdateRequest {
  /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     * @minLength 1
     * @maxLength 150
     * @pattern ^[\w.@+-]+$
     */
  username: string;
  /** @maxLength 150 */
  first_name?: string;
  /** @maxLength 150 */
  last_name?: string;
}

export interface VerifiedDomainRequest {
  /**
     * @minLength 1
     * @maxLength 255
     */
  domain: string;
}

export type SesyProjectsDomainCreate400 = {[key: string]: unknown};

export type SesyProjectsMembersListParams = {
/**
 * A page number within the paginated result set.
 */
page?: number;
/**
 * Number of results to return per page.
 */
page_size?: number;
/**
 * A search term.
 */
search?: string;
subscribed?: boolean;
tag?: string;
};

export type SesyProjectsMembersUploadCsvCreate202 = {
  task_id?: string;
};

export type SesyTasksRetrieve200Status = typeof SesyTasksRetrieve200Status[keyof typeof SesyTasksRetrieve200Status];


export const SesyTasksRetrieve200Status = {
  pending: 'pending',
  in_progress: 'in_progress',
  succeeded: 'succeeded',
  failed: 'failed',
} as const;

export type SesyTasksRetrieve200 = {
  status?: SesyTasksRetrieve200Status;
  processed?: number;
  total?: number;
  created?: number;
  skipped?: number;
};

