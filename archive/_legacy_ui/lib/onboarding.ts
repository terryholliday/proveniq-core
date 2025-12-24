import { db } from "@/lib/db";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
}

export const ONBOARDING_STEPS: Omit<OnboardingStep, "completed">[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your name and profile picture",
    href: "/settings/profile",
  },
  {
    id: "organization",
    title: "Create an organization",
    description: "Set up your first organization to start managing assets",
    href: "/settings/organizations/new",
  },
  {
    id: "api_key",
    title: "Generate an API key",
    description: "Create an API key for programmatic access",
    href: "/settings/api-keys",
  },
  {
    id: "first_asset",
    title: "Register your first asset",
    description: "Add an asset to start tracking and verification",
    href: "/assets/new",
  },
  {
    id: "webhook",
    title: "Set up webhooks",
    description: "Configure webhooks to receive real-time updates",
    href: "/settings/webhooks",
  },
];

export async function getOnboardingProgress(userId: string): Promise<OnboardingStep[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      organizations: true,
      apiKeys: true,
    },
  });

  if (!user) {
    return ONBOARDING_STEPS.map((step) => ({ ...step, completed: false }));
  }

  // Check completion status for each step
  const completedSteps: Record<string, boolean> = {
    profile: Boolean(user.name && user.image),
    organization: user.organizations.length > 0,
    api_key: user.apiKeys.length > 0,
    first_asset: false, // Would need to check assets
    webhook: false, // Would need to check webhooks
  };

  // Check for assets and webhooks if user has an organization
  if (user.organizations.length > 0) {
    const orgId = user.organizations[0].organizationId;
    
    const assetCount = await db.asset.count({
      where: { organizationId: orgId },
    });
    completedSteps.first_asset = assetCount > 0;

    const webhookCount = await db.webhook.count({
      where: { organizationId: orgId },
    });
    completedSteps.webhook = webhookCount > 0;
  }

  return ONBOARDING_STEPS.map((step) => ({
    ...step,
    completed: completedSteps[step.id] ?? false,
  }));
}

export function calculateProgress(steps: OnboardingStep[]): number {
  const completed = steps.filter((s) => s.completed).length;
  return Math.round((completed / steps.length) * 100);
}

export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.every((s) => s.completed);
}
