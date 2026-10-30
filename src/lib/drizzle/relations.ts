import { relations } from "drizzle-orm/relations";
import {
  djangoContentType,
  authPermission,
  authGroupPermissions,
  authGroup,
  authUserGroups,
  authUser,
  authUserUserPermissions,
  djangoAdminLog,
  taggitTaggeditem,
  taggitTag,
  integrationCategory,
  integration,
  integrationAttribute,
  company,
  companyDomain,
  companyMembership,
  threadRegistry,
  socialAccountRegistry,
  storeRegistry,
  workflow,
  workflowDependsOn,
  aiUsage,
  aiAgentUsage,
  billingTopUp,
  billingSubscription,
  subscriptionPlan,
  billingCreditTransaction,
  citiesLightCountry,
  citiesLightRegion,
  citiesLightCity,
  citiesLightSubregion,
  userAuthState,
  revokedToken,
  store,
  storeCredentials,
  chatbotWidgetCustomization,
  chatbotWidgetCustomizationQuickActions,
  quickAction,
  quickLink,
  chatThread,
  chatHistory,
  chatbotFeedback,
  chatCustomer,
  chatBotevent,
  chatAddress,
  sentimentAnalysis,
  sessionResolutionVerdict,
  aiInsights,
  userMetadata,
  fraudFlag,
  chatCustomerorder,
  ticketMessage,
  ticketAttachment,
  supportTicket,
  supportTicketChannel,
  supportTicketTags,
  ticketTag,
  storeIntegration,
  storeIntegrationAttribute,
  ticketMessageDraft,
  supportTicketAssignmentAudit,
  supportTicketStatusAudit,
  neverSayRules,
  vocabulary,
  personaIdentity,
  vocabularyWordReplacements,
  wordReplacement,
  toneStyle,
  socialSubscription,
  socialConnectedAccount,
  socialPost,
  socialPostMedia,
  socialUser,
  socialMessage,
  socialWebhookEvent,
  socialReaction,
  socialCommentAnalysis,
  socialCommentSetting,
  socialMessageAttachment,
  socialCommentDraft,
  emailTemplate,
  campaignSendLog,
  whatsappTemplate,
  campaign,
  campaignSequence,
  segmentsCategory,
  segments,
  templateAttachment,
  campaignStepRun,
  chatThreadAssignment,
  chatThreadOrders,
  storeWorkflowSetting,
  category,
  collection,
  product,
  productSyncJob,
  productVariant,
  productCategories,
  productCollections,
  knowledgeItem,
  knowledgeItemCategories,
  knowledgeItemCollections,
  knowledgeItemProducts,
  notification,
  supportConfiguration,
  aiInsightsTicketTags,
} from "./schema";

export const authPermissionRelations = relations(
  authPermission,
  ({ one, many }) => ({
    djangoContentType: one(djangoContentType, {
      fields: [authPermission.contentTypeId],
      references: [djangoContentType.id],
    }),
    authGroupPermissions: many(authGroupPermissions),
    authUserUserPermissions: many(authUserUserPermissions),
  }),
);

export const djangoContentTypeRelations = relations(
  djangoContentType,
  ({ many }) => ({
    authPermissions: many(authPermission),
    djangoAdminLogs: many(djangoAdminLog),
    taggitTaggeditems: many(taggitTaggeditem),
  }),
);

export const authGroupPermissionsRelations = relations(
  authGroupPermissions,
  ({ one }) => ({
    authPermission: one(authPermission, {
      fields: [authGroupPermissions.permissionId],
      references: [authPermission.id],
    }),
    authGroup: one(authGroup, {
      fields: [authGroupPermissions.groupId],
      references: [authGroup.id],
    }),
  }),
);

export const authGroupRelations = relations(authGroup, ({ many }) => ({
  authGroupPermissions: many(authGroupPermissions),
  authUserGroups: many(authUserGroups),
}));

export const authUserGroupsRelations = relations(authUserGroups, ({ one }) => ({
  authGroup: one(authGroup, {
    fields: [authUserGroups.groupId],
    references: [authGroup.id],
  }),
  authUser: one(authUser, {
    fields: [authUserGroups.userId],
    references: [authUser.id],
  }),
}));

export const authUserRelations = relations(authUser, ({ many }) => ({
  authUserGroups: many(authUserGroups),
  authUserUserPermissions: many(authUserUserPermissions),
  djangoAdminLogs: many(djangoAdminLog),
  companyMemberships: many(companyMembership),
  aiUsages: many(aiUsage),
  userAuthStates: many(userAuthState),
  revokedTokens: many(revokedToken),
}));

export const authUserUserPermissionsRelations = relations(
  authUserUserPermissions,
  ({ one }) => ({
    authPermission: one(authPermission, {
      fields: [authUserUserPermissions.permissionId],
      references: [authPermission.id],
    }),
    authUser: one(authUser, {
      fields: [authUserUserPermissions.userId],
      references: [authUser.id],
    }),
  }),
);

export const djangoAdminLogRelations = relations(djangoAdminLog, ({ one }) => ({
  djangoContentType: one(djangoContentType, {
    fields: [djangoAdminLog.contentTypeId],
    references: [djangoContentType.id],
  }),
  authUser: one(authUser, {
    fields: [djangoAdminLog.userId],
    references: [authUser.id],
  }),
}));

export const taggitTaggeditemRelations = relations(
  taggitTaggeditem,
  ({ one }) => ({
    djangoContentType: one(djangoContentType, {
      fields: [taggitTaggeditem.contentTypeId],
      references: [djangoContentType.id],
    }),
    taggitTag: one(taggitTag, {
      fields: [taggitTaggeditem.tagId],
      references: [taggitTag.id],
    }),
  }),
);

export const taggitTagRelations = relations(taggitTag, ({ many }) => ({
  taggitTaggeditems: many(taggitTaggeditem),
}));

export const integrationRelations = relations(integration, ({ one, many }) => ({
  integrationCategory: one(integrationCategory, {
    fields: [integration.categoryId],
    references: [integrationCategory.id],
  }),
  integrationAttributes: many(integrationAttribute),
}));

export const integrationCategoryRelations = relations(
  integrationCategory,
  ({ many }) => ({
    integrations: many(integration),
  }),
);

export const integrationAttributeRelations = relations(
  integrationAttribute,
  ({ one }) => ({
    integration: one(integration, {
      fields: [integrationAttribute.integrationId],
      references: [integration.id],
    }),
  }),
);

export const companyDomainRelations = relations(companyDomain, ({ one }) => ({
  company: one(company, {
    fields: [companyDomain.tenantId],
    references: [company.id],
  }),
}));

export const companyRelations = relations(company, ({ many }) => ({
  companyDomains: many(companyDomain),
  companyMemberships: many(companyMembership),
  threadRegistries: many(threadRegistry),
  socialAccountRegistries: many(socialAccountRegistry),
  storeRegistries: many(storeRegistry),
  aiUsages: many(aiUsage),
  billingTopUps: many(billingTopUp),
  billingSubscriptions: many(billingSubscription),
  billingCreditTransactions: many(billingCreditTransaction),
}));

export const companyMembershipRelations = relations(
  companyMembership,
  ({ one }) => ({
    company: one(company, {
      fields: [companyMembership.companyId],
      references: [company.id],
    }),
    authUser: one(authUser, {
      fields: [companyMembership.userId],
      references: [authUser.id],
    }),
  }),
);

export const threadRegistryRelations = relations(threadRegistry, ({ one }) => ({
  company: one(company, {
    fields: [threadRegistry.companyId],
    references: [company.id],
  }),
}));

export const socialAccountRegistryRelations = relations(
  socialAccountRegistry,
  ({ one }) => ({
    company: one(company, {
      fields: [socialAccountRegistry.companyId],
      references: [company.id],
    }),
  }),
);

export const storeRegistryRelations = relations(storeRegistry, ({ one }) => ({
  company: one(company, {
    fields: [storeRegistry.companyId],
    references: [company.id],
  }),
}));

export const workflowDependsOnRelations = relations(
  workflowDependsOn,
  ({ one }) => ({
    workflow_fromWorkflowId: one(workflow, {
      fields: [workflowDependsOn.fromWorkflowId],
      references: [workflow.id],
      relationName: "workflowDependsOn_fromWorkflowId_workflow_id",
    }),
    workflow_toWorkflowId: one(workflow, {
      fields: [workflowDependsOn.toWorkflowId],
      references: [workflow.id],
      relationName: "workflowDependsOn_toWorkflowId_workflow_id",
    }),
  }),
);

export const workflowRelations = relations(workflow, ({ many }) => ({
  workflowDependsOns_fromWorkflowId: many(workflowDependsOn, {
    relationName: "workflowDependsOn_fromWorkflowId_workflow_id",
  }),
  workflowDependsOns_toWorkflowId: many(workflowDependsOn, {
    relationName: "workflowDependsOn_toWorkflowId_workflow_id",
  }),
}));

export const aiUsageRelations = relations(aiUsage, ({ one, many }) => ({
  company: one(company, {
    fields: [aiUsage.companyId],
    references: [company.id],
  }),
  authUser: one(authUser, {
    fields: [aiUsage.performedById],
    references: [authUser.id],
  }),
  aiAgentUsages: many(aiAgentUsage),
  billingCreditTransactions: many(billingCreditTransaction),
}));

export const aiAgentUsageRelations = relations(aiAgentUsage, ({ one }) => ({
  aiUsage: one(aiUsage, {
    fields: [aiAgentUsage.usageId],
    references: [aiUsage.id],
  }),
}));

export const billingTopUpRelations = relations(
  billingTopUp,
  ({ one, many }) => ({
    company: one(company, {
      fields: [billingTopUp.companyId],
      references: [company.id],
    }),
    billingCreditTransactions: many(billingCreditTransaction),
  }),
);

export const billingSubscriptionRelations = relations(
  billingSubscription,
  ({ one, many }) => ({
    company: one(company, {
      fields: [billingSubscription.companyId],
      references: [company.id],
    }),
    subscriptionPlan: one(subscriptionPlan, {
      fields: [billingSubscription.planId],
      references: [subscriptionPlan.id],
    }),
    billingCreditTransactions: many(billingCreditTransaction),
  }),
);

export const subscriptionPlanRelations = relations(
  subscriptionPlan,
  ({ many }) => ({
    billingSubscriptions: many(billingSubscription),
  }),
);

export const billingCreditTransactionRelations = relations(
  billingCreditTransaction,
  ({ one }) => ({
    billingSubscription: one(billingSubscription, {
      fields: [billingCreditTransaction.subscriptionId],
      references: [billingSubscription.id],
    }),
    billingTopUp: one(billingTopUp, {
      fields: [billingCreditTransaction.topUpId],
      references: [billingTopUp.id],
    }),
    company: one(company, {
      fields: [billingCreditTransaction.companyId],
      references: [company.id],
    }),
    aiUsage: one(aiUsage, {
      fields: [billingCreditTransaction.usageId],
      references: [aiUsage.id],
    }),
  }),
);

export const citiesLightRegionRelations = relations(
  citiesLightRegion,
  ({ one, many }) => ({
    citiesLightCountry: one(citiesLightCountry, {
      fields: [citiesLightRegion.countryId],
      references: [citiesLightCountry.id],
    }),
    citiesLightCities: many(citiesLightCity),
    citiesLightSubregions: many(citiesLightSubregion),
  }),
);

export const citiesLightCountryRelations = relations(
  citiesLightCountry,
  ({ many }) => ({
    citiesLightRegions: many(citiesLightRegion),
    citiesLightCities: many(citiesLightCity),
    citiesLightSubregions: many(citiesLightSubregion),
  }),
);

export const citiesLightCityRelations = relations(
  citiesLightCity,
  ({ one }) => ({
    citiesLightCountry: one(citiesLightCountry, {
      fields: [citiesLightCity.countryId],
      references: [citiesLightCountry.id],
    }),
    citiesLightRegion: one(citiesLightRegion, {
      fields: [citiesLightCity.regionId],
      references: [citiesLightRegion.id],
    }),
    citiesLightSubregion: one(citiesLightSubregion, {
      fields: [citiesLightCity.subregionId],
      references: [citiesLightSubregion.id],
    }),
  }),
);

export const citiesLightSubregionRelations = relations(
  citiesLightSubregion,
  ({ one, many }) => ({
    citiesLightCities: many(citiesLightCity),
    citiesLightCountry: one(citiesLightCountry, {
      fields: [citiesLightSubregion.countryId],
      references: [citiesLightCountry.id],
    }),
    citiesLightRegion: one(citiesLightRegion, {
      fields: [citiesLightSubregion.regionId],
      references: [citiesLightRegion.id],
    }),
  }),
);

export const userAuthStateRelations = relations(userAuthState, ({ one }) => ({
  authUser: one(authUser, {
    fields: [userAuthState.userId],
    references: [authUser.id],
  }),
}));

export const revokedTokenRelations = relations(revokedToken, ({ one }) => ({
  authUser: one(authUser, {
    fields: [revokedToken.userId],
    references: [authUser.id],
  }),
}));

export const storeCredentialsRelations = relations(
  storeCredentials,
  ({ one }) => ({
    store: one(store, {
      fields: [storeCredentials.storeId],
      references: [store.id],
    }),
  }),
);

export const storeRelations = relations(store, ({ many }) => ({
  storeCredentialss: many(storeCredentials),
  chatbotWidgetCustomizations: many(chatbotWidgetCustomization),
  chatThreads: many(chatThread),
  sessionResolutionVerdicts: many(sessionResolutionVerdict),
  supportTickets: many(supportTicket),
  storeIntegrations: many(storeIntegration),
  ticketTags: many(ticketTag),
  neverSayRuless: many(neverSayRules),
  vocabularys: many(vocabulary),
  personaIdentitys: many(personaIdentity),
  toneStyles: many(toneStyle),
  socialSubscriptions: many(socialSubscription),
  emailTemplates: many(emailTemplate),
  whatsappTemplates: many(whatsappTemplate),
  segmentss: many(segments),
  campaigns: many(campaign),
  storeWorkflowSettings: many(storeWorkflowSetting),
  categorys: many(category),
  collections: many(collection),
  products: many(product),
  productSyncJobs: many(productSyncJob),
  knowledgeItems: many(knowledgeItem),
  notifications: many(notification),
  supportConfigurations: many(supportConfiguration),
}));

export const chatbotWidgetCustomizationQuickActionsRelations = relations(
  chatbotWidgetCustomizationQuickActions,
  ({ one }) => ({
    chatbotWidgetCustomization: one(chatbotWidgetCustomization, {
      fields: [
        chatbotWidgetCustomizationQuickActions.chatbotwidgetcustomizationId,
      ],
      references: [chatbotWidgetCustomization.id],
    }),
    quickAction: one(quickAction, {
      fields: [chatbotWidgetCustomizationQuickActions.quickactionId],
      references: [quickAction.id],
    }),
  }),
);

export const chatbotWidgetCustomizationRelations = relations(
  chatbotWidgetCustomization,
  ({ one, many }) => ({
    chatbotWidgetCustomizationQuickActionss: many(
      chatbotWidgetCustomizationQuickActions,
    ),
    quickLinks: many(quickLink),
    store: one(store, {
      fields: [chatbotWidgetCustomization.storeId],
      references: [store.id],
    }),
  }),
);

export const quickActionRelations = relations(quickAction, ({ many }) => ({
  chatbotWidgetCustomizationQuickActionss: many(
    chatbotWidgetCustomizationQuickActions,
  ),
}));

export const quickLinkRelations = relations(quickLink, ({ one }) => ({
  chatbotWidgetCustomization: one(chatbotWidgetCustomization, {
    fields: [quickLink.widgetId],
    references: [chatbotWidgetCustomization.id],
  }),
}));

export const chatHistoryRelations = relations(chatHistory, ({ one, many }) => ({
  chatThread: one(chatThread, {
    fields: [chatHistory.threadId],
    references: [chatThread.id],
  }),
  chatbotFeedbacks: many(chatbotFeedback),
  fraudFlags: many(fraudFlag),
  chatThreadAssignments: many(chatThreadAssignment),
}));

export const chatThreadRelations = relations(chatThread, ({ one, many }) => ({
  chatHistorys: many(chatHistory),
  chatbotFeedbacks: many(chatbotFeedback),
  chatCustomer: one(chatCustomer, {
    fields: [chatThread.customerId],
    references: [chatCustomer.id],
  }),
  store: one(store, {
    fields: [chatThread.storeId],
    references: [store.id],
  }),
  chatBotevents: many(chatBotevent),
  sentimentAnalysiss: many(sentimentAnalysis),
  sessionResolutionVerdicts: many(sessionResolutionVerdict),
  aiInsightss: many(aiInsights),
  userMetadatas: many(userMetadata),
  fraudFlags: many(fraudFlag),
  supportTickets: many(supportTicket),
  chatThreadAssignments: many(chatThreadAssignment),
  chatThreadOrderss: many(chatThreadOrders),
  notifications: many(notification),
}));

export const chatbotFeedbackRelations = relations(
  chatbotFeedback,
  ({ one }) => ({
    chatHistory: one(chatHistory, {
      fields: [chatbotFeedback.chatMessageId],
      references: [chatHistory.id],
    }),
    chatThread: one(chatThread, {
      fields: [chatbotFeedback.threadId],
      references: [chatThread.id],
    }),
  }),
);

export const chatCustomerRelations = relations(chatCustomer, ({ many }) => ({
  chatThreads: many(chatThread),
  chatAddresss: many(chatAddress),
  chatCustomerorders: many(chatCustomerorder),
  supportTickets: many(supportTicket),
  ticketMessages: many(ticketMessage),
  socialUsers: many(socialUser),
  campaignSendLogs: many(campaignSendLog),
}));

export const chatBoteventRelations = relations(chatBotevent, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [chatBotevent.threadId],
    references: [chatThread.id],
  }),
}));

export const chatAddressRelations = relations(chatAddress, ({ one }) => ({
  chatCustomer: one(chatCustomer, {
    fields: [chatAddress.customerId],
    references: [chatCustomer.id],
  }),
}));

export const sentimentAnalysisRelations = relations(
  sentimentAnalysis,
  ({ one }) => ({
    chatThread: one(chatThread, {
      fields: [sentimentAnalysis.threadId],
      references: [chatThread.id],
    }),
  }),
);

export const sessionResolutionVerdictRelations = relations(
  sessionResolutionVerdict,
  ({ one }) => ({
    store: one(store, {
      fields: [sessionResolutionVerdict.storeId],
      references: [store.id],
    }),
    chatThread: one(chatThread, {
      fields: [sessionResolutionVerdict.threadId],
      references: [chatThread.id],
    }),
  }),
);

export const aiInsightsRelations = relations(aiInsights, ({ one, many }) => ({
  chatThread: one(chatThread, {
    fields: [aiInsights.threadId],
    references: [chatThread.id],
  }),
  aiInsightsTicketTagss: many(aiInsightsTicketTags),
}));

export const userMetadataRelations = relations(userMetadata, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [userMetadata.threadId],
    references: [chatThread.id],
  }),
}));

export const fraudFlagRelations = relations(fraudFlag, ({ one }) => ({
  chatHistory: one(chatHistory, {
    fields: [fraudFlag.chatMessageId],
    references: [chatHistory.id],
  }),
  chatThread: one(chatThread, {
    fields: [fraudFlag.threadId],
    references: [chatThread.id],
  }),
}));

export const chatCustomerorderRelations = relations(
  chatCustomerorder,
  ({ one, many }) => ({
    chatCustomer: one(chatCustomer, {
      fields: [chatCustomerorder.customerId],
      references: [chatCustomer.id],
    }),
    supportTickets: many(supportTicket),
    campaignSendLogs: many(campaignSendLog),
    chatThreadOrderss: many(chatThreadOrders),
  }),
);

export const ticketAttachmentRelations = relations(
  ticketAttachment,
  ({ one }) => ({
    ticketMessage: one(ticketMessage, {
      fields: [ticketAttachment.messageId],
      references: [ticketMessage.id],
    }),
    supportTicket: one(supportTicket, {
      fields: [ticketAttachment.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const ticketMessageRelations = relations(
  ticketMessage,
  ({ one, many }) => ({
    ticketAttachments: many(ticketAttachment),
    chatCustomer: one(chatCustomer, {
      fields: [ticketMessage.customerId],
      references: [chatCustomer.id],
    }),
    ticketMessage: one(ticketMessage, {
      fields: [ticketMessage.parentId],
      references: [ticketMessage.id],
      relationName: "ticketMessage_parentId_ticketMessage_id",
    }),
    ticketMessages: many(ticketMessage, {
      relationName: "ticketMessage_parentId_ticketMessage_id",
    }),
    supportTicket: one(supportTicket, {
      fields: [ticketMessage.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const supportTicketRelations = relations(
  supportTicket,
  ({ one, many }) => ({
    ticketAttachments: many(ticketAttachment),
    chatCustomer: one(chatCustomer, {
      fields: [supportTicket.customerId],
      references: [chatCustomer.id],
    }),
    chatCustomerorder: one(chatCustomerorder, {
      fields: [supportTicket.orderId],
      references: [chatCustomerorder.id],
    }),
    store: one(store, {
      fields: [supportTicket.storeId],
      references: [store.id],
    }),
    chatThread: one(chatThread, {
      fields: [supportTicket.threadId],
      references: [chatThread.id],
    }),
    supportTicketChannels: many(supportTicketChannel),
    ticketMessages: many(ticketMessage),
    supportTicketTagss: many(supportTicketTags),
    ticketMessageDrafts: many(ticketMessageDraft),
    supportTicketAssignmentAudits: many(supportTicketAssignmentAudit),
    supportTicketStatusAudits: many(supportTicketStatusAudit),
    campaignSendLogs: many(campaignSendLog),
    notifications: many(notification),
  }),
);

export const supportTicketChannelRelations = relations(
  supportTicketChannel,
  ({ one }) => ({
    supportTicket: one(supportTicket, {
      fields: [supportTicketChannel.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const supportTicketTagsRelations = relations(
  supportTicketTags,
  ({ one }) => ({
    supportTicket: one(supportTicket, {
      fields: [supportTicketTags.supportticketId],
      references: [supportTicket.id],
    }),
    ticketTag: one(ticketTag, {
      fields: [supportTicketTags.tickettagId],
      references: [ticketTag.id],
    }),
  }),
);

export const ticketTagRelations = relations(ticketTag, ({ one, many }) => ({
  supportTicketTagss: many(supportTicketTags),
  store: one(store, {
    fields: [ticketTag.storeId],
    references: [store.id],
  }),
  aiInsightsTicketTagss: many(aiInsightsTicketTags),
}));

export const storeIntegrationRelations = relations(
  storeIntegration,
  ({ one, many }) => ({
    store: one(store, {
      fields: [storeIntegration.storeId],
      references: [store.id],
    }),
    storeIntegrationAttributes: many(storeIntegrationAttribute),
  }),
);

export const storeIntegrationAttributeRelations = relations(
  storeIntegrationAttribute,
  ({ one }) => ({
    storeIntegration: one(storeIntegration, {
      fields: [storeIntegrationAttribute.storeIntegrationId],
      references: [storeIntegration.id],
    }),
  }),
);

export const ticketMessageDraftRelations = relations(
  ticketMessageDraft,
  ({ one }) => ({
    supportTicket: one(supportTicket, {
      fields: [ticketMessageDraft.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const supportTicketAssignmentAuditRelations = relations(
  supportTicketAssignmentAudit,
  ({ one }) => ({
    supportTicket: one(supportTicket, {
      fields: [supportTicketAssignmentAudit.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const supportTicketStatusAuditRelations = relations(
  supportTicketStatusAudit,
  ({ one }) => ({
    supportTicket: one(supportTicket, {
      fields: [supportTicketStatusAudit.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const neverSayRulesRelations = relations(neverSayRules, ({ one }) => ({
  store: one(store, {
    fields: [neverSayRules.storeId],
    references: [store.id],
  }),
}));

export const vocabularyRelations = relations(vocabulary, ({ one, many }) => ({
  store: one(store, {
    fields: [vocabulary.storeId],
    references: [store.id],
  }),
  vocabularyWordReplacementss: many(vocabularyWordReplacements),
}));

export const personaIdentityRelations = relations(
  personaIdentity,
  ({ one }) => ({
    store: one(store, {
      fields: [personaIdentity.storeId],
      references: [store.id],
    }),
  }),
);

export const vocabularyWordReplacementsRelations = relations(
  vocabularyWordReplacements,
  ({ one }) => ({
    vocabulary: one(vocabulary, {
      fields: [vocabularyWordReplacements.vocabularyId],
      references: [vocabulary.id],
    }),
    wordReplacement: one(wordReplacement, {
      fields: [vocabularyWordReplacements.wordreplacementId],
      references: [wordReplacement.id],
    }),
  }),
);

export const wordReplacementRelations = relations(
  wordReplacement,
  ({ many }) => ({
    vocabularyWordReplacementss: many(vocabularyWordReplacements),
  }),
);

export const toneStyleRelations = relations(toneStyle, ({ one }) => ({
  store: one(store, {
    fields: [toneStyle.storeId],
    references: [store.id],
  }),
}));

export const socialSubscriptionRelations = relations(
  socialSubscription,
  ({ one, many }) => ({
    store: one(store, {
      fields: [socialSubscription.storeId],
      references: [store.id],
    }),
    socialConnectedAccounts: many(socialConnectedAccount),
  }),
);

export const socialConnectedAccountRelations = relations(
  socialConnectedAccount,
  ({ one, many }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [socialConnectedAccount.linkedAccountId],
      references: [socialConnectedAccount.id],
      relationName:
        "socialConnectedAccount_linkedAccountId_socialConnectedAccount_id",
    }),
    socialConnectedAccounts: many(socialConnectedAccount, {
      relationName:
        "socialConnectedAccount_linkedAccountId_socialConnectedAccount_id",
    }),
    socialSubscription: one(socialSubscription, {
      fields: [socialConnectedAccount.subscriptionId],
      references: [socialSubscription.id],
    }),
    socialPosts: many(socialPost),
    socialUsers: many(socialUser),
    socialMessages: many(socialMessage),
    socialWebhookEvents: many(socialWebhookEvent),
    socialCommentSettings: many(socialCommentSetting),
    campaignSendLogs: many(campaignSendLog),
    whatsappTemplates: many(whatsappTemplate),
  }),
);

export const socialPostRelations = relations(socialPost, ({ one, many }) => ({
  socialConnectedAccount: one(socialConnectedAccount, {
    fields: [socialPost.accountId],
    references: [socialConnectedAccount.id],
  }),
  socialPostMedias: many(socialPostMedia),
  socialMessages: many(socialMessage),
}));

export const socialPostMediaRelations = relations(
  socialPostMedia,
  ({ one }) => ({
    socialPost: one(socialPost, {
      fields: [socialPostMedia.postId],
      references: [socialPost.id],
    }),
  }),
);

export const socialUserRelations = relations(socialUser, ({ one, many }) => ({
  socialConnectedAccount: one(socialConnectedAccount, {
    fields: [socialUser.accountId],
    references: [socialConnectedAccount.id],
  }),
  chatCustomer: one(chatCustomer, {
    fields: [socialUser.customerId],
    references: [chatCustomer.id],
  }),
  socialMessages: many(socialMessage),
  socialReactions: many(socialReaction),
}));

export const socialMessageRelations = relations(
  socialMessage,
  ({ one, many }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [socialMessage.accountId],
      references: [socialConnectedAccount.id],
    }),
    socialMessage: one(socialMessage, {
      fields: [socialMessage.parentMessageId],
      references: [socialMessage.id],
      relationName: "socialMessage_parentMessageId_socialMessage_id",
    }),
    socialMessages: many(socialMessage, {
      relationName: "socialMessage_parentMessageId_socialMessage_id",
    }),
    socialPost: one(socialPost, {
      fields: [socialMessage.postId],
      references: [socialPost.id],
    }),
    socialUser: one(socialUser, {
      fields: [socialMessage.socialUserId],
      references: [socialUser.id],
    }),
    socialReactions: many(socialReaction),
    socialCommentAnalysiss: many(socialCommentAnalysis),
    socialMessageAttachments: many(socialMessageAttachment),
    socialCommentDrafts: many(socialCommentDraft),
  }),
);

export const socialWebhookEventRelations = relations(
  socialWebhookEvent,
  ({ one }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [socialWebhookEvent.accountId],
      references: [socialConnectedAccount.id],
    }),
  }),
);

export const socialReactionRelations = relations(socialReaction, ({ one }) => ({
  socialMessage: one(socialMessage, {
    fields: [socialReaction.messageId],
    references: [socialMessage.id],
  }),
  socialUser: one(socialUser, {
    fields: [socialReaction.socialUserId],
    references: [socialUser.id],
  }),
}));

export const socialCommentAnalysisRelations = relations(
  socialCommentAnalysis,
  ({ one }) => ({
    socialMessage: one(socialMessage, {
      fields: [socialCommentAnalysis.messageId],
      references: [socialMessage.id],
    }),
  }),
);

export const socialCommentSettingRelations = relations(
  socialCommentSetting,
  ({ one }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [socialCommentSetting.accountId],
      references: [socialConnectedAccount.id],
    }),
  }),
);

export const socialMessageAttachmentRelations = relations(
  socialMessageAttachment,
  ({ one }) => ({
    socialMessage: one(socialMessage, {
      fields: [socialMessageAttachment.messageId],
      references: [socialMessage.id],
    }),
  }),
);

export const socialCommentDraftRelations = relations(
  socialCommentDraft,
  ({ one }) => ({
    socialMessage: one(socialMessage, {
      fields: [socialCommentDraft.messageId],
      references: [socialMessage.id],
    }),
  }),
);

export const emailTemplateRelations = relations(
  emailTemplate,
  ({ one, many }) => ({
    store: one(store, {
      fields: [emailTemplate.storeId],
      references: [store.id],
    }),
    campaignSendLogs: many(campaignSendLog),
    campaignSequences: many(campaignSequence),
  }),
);

export const campaignSendLogRelations = relations(
  campaignSendLog,
  ({ one }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [campaignSendLog.accountId],
      references: [socialConnectedAccount.id],
    }),
    chatCustomer: one(chatCustomer, {
      fields: [campaignSendLog.customerId],
      references: [chatCustomer.id],
    }),
    emailTemplate: one(emailTemplate, {
      fields: [campaignSendLog.emailTemplateId],
      references: [emailTemplate.id],
    }),
    chatCustomerorder: one(chatCustomerorder, {
      fields: [campaignSendLog.orderId],
      references: [chatCustomerorder.id],
    }),
    whatsappTemplate: one(whatsappTemplate, {
      fields: [campaignSendLog.templateId],
      references: [whatsappTemplate.id],
    }),
    supportTicket: one(supportTicket, {
      fields: [campaignSendLog.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const whatsappTemplateRelations = relations(
  whatsappTemplate,
  ({ one, many }) => ({
    campaignSendLogs: many(campaignSendLog),
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [whatsappTemplate.accountId],
      references: [socialConnectedAccount.id],
    }),
    store: one(store, {
      fields: [whatsappTemplate.storeId],
      references: [store.id],
    }),
    campaignSequences: many(campaignSequence),
    templateAttachments: many(templateAttachment),
  }),
);

export const campaignSequenceRelations = relations(
  campaignSequence,
  ({ one, many }) => ({
    campaign: one(campaign, {
      fields: [campaignSequence.campaignId],
      references: [campaign.id],
    }),
    emailTemplate: one(emailTemplate, {
      fields: [campaignSequence.emailTemplateId],
      references: [emailTemplate.id],
    }),
    whatsappTemplate: one(whatsappTemplate, {
      fields: [campaignSequence.whatsappTemplateId],
      references: [whatsappTemplate.id],
    }),
    campaignStepRuns: many(campaignStepRun),
  }),
);

export const campaignRelations = relations(campaign, ({ one, many }) => ({
  campaignSequences: many(campaignSequence),
  segments: one(segments, {
    fields: [campaign.segmentId],
    references: [segments.id],
  }),
  store: one(store, {
    fields: [campaign.storeId],
    references: [store.id],
  }),
  campaignStepRuns: many(campaignStepRun),
}));

export const segmentsRelations = relations(segments, ({ one, many }) => ({
  segmentsCategory: one(segmentsCategory, {
    fields: [segments.categoryId],
    references: [segmentsCategory.id],
  }),
  store: one(store, {
    fields: [segments.storeId],
    references: [store.id],
  }),
  campaigns: many(campaign),
}));

export const segmentsCategoryRelations = relations(
  segmentsCategory,
  ({ many }) => ({
    segmentss: many(segments),
  }),
);

export const templateAttachmentRelations = relations(
  templateAttachment,
  ({ one }) => ({
    whatsappTemplate: one(whatsappTemplate, {
      fields: [templateAttachment.templateId],
      references: [whatsappTemplate.id],
    }),
  }),
);

export const campaignStepRunRelations = relations(
  campaignStepRun,
  ({ one }) => ({
    campaign: one(campaign, {
      fields: [campaignStepRun.campaignId],
      references: [campaign.id],
    }),
    campaignSequence: one(campaignSequence, {
      fields: [campaignStepRun.sequenceStepId],
      references: [campaignSequence.id],
    }),
  }),
);

export const chatThreadAssignmentRelations = relations(
  chatThreadAssignment,
  ({ one }) => ({
    chatHistory: one(chatHistory, {
      fields: [chatThreadAssignment.afterMessageId],
      references: [chatHistory.id],
    }),
    chatThread: one(chatThread, {
      fields: [chatThreadAssignment.threadId],
      references: [chatThread.id],
    }),
  }),
);

export const chatThreadOrdersRelations = relations(
  chatThreadOrders,
  ({ one }) => ({
    chatCustomerorder: one(chatCustomerorder, {
      fields: [chatThreadOrders.customerorderId],
      references: [chatCustomerorder.id],
    }),
    chatThread: one(chatThread, {
      fields: [chatThreadOrders.threadId],
      references: [chatThread.id],
    }),
  }),
);

export const storeWorkflowSettingRelations = relations(
  storeWorkflowSetting,
  ({ one }) => ({
    store: one(store, {
      fields: [storeWorkflowSetting.storeId],
      references: [store.id],
    }),
  }),
);

export const categoryRelations = relations(category, ({ one, many }) => ({
  category: one(category, {
    fields: [category.parentId],
    references: [category.id],
    relationName: "category_parentId_category_id",
  }),
  categorys: many(category, {
    relationName: "category_parentId_category_id",
  }),
  store: one(store, {
    fields: [category.storeId],
    references: [store.id],
  }),
  productCategoriess: many(productCategories),
  knowledgeItemCategoriess: many(knowledgeItemCategories),
}));

export const collectionRelations = relations(collection, ({ one, many }) => ({
  store: one(store, {
    fields: [collection.storeId],
    references: [store.id],
  }),
  productCollectionss: many(productCollections),
  knowledgeItemCollectionss: many(knowledgeItemCollections),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  store: one(store, {
    fields: [product.storeId],
    references: [store.id],
  }),
  productVariants: many(productVariant),
  productCategoriess: many(productCategories),
  productCollectionss: many(productCollections),
  knowledgeItemProductss: many(knowledgeItemProducts),
}));

export const productSyncJobRelations = relations(productSyncJob, ({ one }) => ({
  store: one(store, {
    fields: [productSyncJob.storeId],
    references: [store.id],
  }),
}));

export const productVariantRelations = relations(productVariant, ({ one }) => ({
  product: one(product, {
    fields: [productVariant.productId],
    references: [product.id],
  }),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    category: one(category, {
      fields: [productCategories.categoryId],
      references: [category.id],
    }),
    product: one(product, {
      fields: [productCategories.productId],
      references: [product.id],
    }),
  }),
);

export const productCollectionsRelations = relations(
  productCollections,
  ({ one }) => ({
    collection: one(collection, {
      fields: [productCollections.collectionId],
      references: [collection.id],
    }),
    product: one(product, {
      fields: [productCollections.productId],
      references: [product.id],
    }),
  }),
);

export const knowledgeItemRelations = relations(
  knowledgeItem,
  ({ one, many }) => ({
    store: one(store, {
      fields: [knowledgeItem.storeId],
      references: [store.id],
    }),
    knowledgeItemCategoriess: many(knowledgeItemCategories),
    knowledgeItemCollectionss: many(knowledgeItemCollections),
    knowledgeItemProductss: many(knowledgeItemProducts),
  }),
);

export const knowledgeItemCategoriesRelations = relations(
  knowledgeItemCategories,
  ({ one }) => ({
    knowledgeItem: one(knowledgeItem, {
      fields: [knowledgeItemCategories.knowledgeitemId],
      references: [knowledgeItem.id],
    }),
    category: one(category, {
      fields: [knowledgeItemCategories.categoryId],
      references: [category.id],
    }),
  }),
);

export const knowledgeItemCollectionsRelations = relations(
  knowledgeItemCollections,
  ({ one }) => ({
    collection: one(collection, {
      fields: [knowledgeItemCollections.collectionId],
      references: [collection.id],
    }),
    knowledgeItem: one(knowledgeItem, {
      fields: [knowledgeItemCollections.knowledgeitemId],
      references: [knowledgeItem.id],
    }),
  }),
);

export const knowledgeItemProductsRelations = relations(
  knowledgeItemProducts,
  ({ one }) => ({
    knowledgeItem: one(knowledgeItem, {
      fields: [knowledgeItemProducts.knowledgeitemId],
      references: [knowledgeItem.id],
    }),
    product: one(product, {
      fields: [knowledgeItemProducts.productId],
      references: [product.id],
    }),
  }),
);

export const notificationRelations = relations(notification, ({ one }) => ({
  store: one(store, {
    fields: [notification.storeId],
    references: [store.id],
  }),
  chatThread: one(chatThread, {
    fields: [notification.threadId],
    references: [chatThread.id],
  }),
  supportTicket: one(supportTicket, {
    fields: [notification.ticketId],
    references: [supportTicket.id],
  }),
}));

export const supportConfigurationRelations = relations(
  supportConfiguration,
  ({ one }) => ({
    store: one(store, {
      fields: [supportConfiguration.storeId],
      references: [store.id],
    }),
  }),
);

export const aiInsightsTicketTagsRelations = relations(
  aiInsightsTicketTags,
  ({ one }) => ({
    aiInsights: one(aiInsights, {
      fields: [aiInsightsTicketTags.aiinsightsId],
      references: [aiInsights.id],
    }),
    ticketTag: one(ticketTag, {
      fields: [aiInsightsTicketTags.tickettagId],
      references: [ticketTag.id],
    }),
  }),
);
