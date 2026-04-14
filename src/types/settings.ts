export type RoleRow = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
};

export type OrganizationSettingsView = {
  id: string;
  organizationName: string;
  ga4MeasurementId: string | null;
  metaPixelId: string | null;
  webhookUrl: string | null;
  destinationAllowlist: string[];
  ipExclusions: Array<{
    id: string;
    ipAddress: string;
    note: string | null;
  }>;
  roles: RoleRow[];
};
