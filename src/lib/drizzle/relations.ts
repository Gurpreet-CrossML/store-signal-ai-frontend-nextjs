import { relations } from "drizzle-orm/relations";
import {
  djangoContentType,
  authPermission,
  authGroup,
  authGroupPermissions,
  authUser,
  authUserGroups,
  authUserUserPermissions,
  djangoAdminLog,
  company,
  companyDomain,
  companyMembership,
  storeRegistry,
  threadRegistry,
  store,
  chatbotWidgetCustomization,
  chatbotWidgetCustomizationQuickActions,
  quickAction,
  quickLink,
  storeFaqs,
  storeCredentials,
  chatCustomer,
  chatAddress,
  chatThread,
  chatHistory,
  chatbotFeedback,
  chatBotevent,
  aiInsights,
  sentimentAnalysis,
  sessionResolutionVerdict,
  userMetadata,
  storeAccess,
  fraudFlag,
  scrapeLinkslinks,
  knowledgeStorelibrarydocument,
  taggitTaggeditem,
  taggitTag,
  supportTicket,
  storeIntegration,
  integration,
  integrationAttribute,
  storeIntegrationAttribute,
  integrationCategory,
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
    authGroup: one(authGroup, {
      fields: [authGroupPermissions.groupId],
      references: [authGroup.id],
    }),
    authPermission: one(authPermission, {
      fields: [authGroupPermissions.permissionId],
      references: [authPermission.id],
    }),
  }),
);

export const authGroupRelations = relations(authGroup, ({ many }) => ({
  authGroupPermissions: many(authGroupPermissions),
  authUserGroups: many(authUserGroups),
}));

export const authUserGroupsRelations = relations(authUserGroups, ({ one }) => ({
  authUser: one(authUser, {
    fields: [authUserGroups.userId],
    references: [authUser.id],
  }),
  authGroup: one(authGroup, {
    fields: [authUserGroups.groupId],
    references: [authGroup.id],
  }),
}));

export const authUserRelations = relations(authUser, ({ many }) => ({
  authUserGroups: many(authUserGroups),
  authUserUserPermissions: many(authUserUserPermissions),
  djangoAdminLogs: many(djangoAdminLog),
  companyMemberships: many(companyMembership),
  chatHistorys: many(chatHistory),
  storeAccesss_grantedById: many(storeAccess, {
    relationName: "storeAccess_grantedById_authUser_id",
  }),
  storeAccesss_userId: many(storeAccess, {
    relationName: "storeAccess_userId_authUser_id",
  }),
}));

export const authUserUserPermissionsRelations = relations(
  authUserUserPermissions,
  ({ one }) => ({
    authUser: one(authUser, {
      fields: [authUserUserPermissions.userId],
      references: [authUser.id],
    }),
    authPermission: one(authPermission, {
      fields: [authUserUserPermissions.permissionId],
      references: [authPermission.id],
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

export const companyDomainRelations = relations(companyDomain, ({ one }) => ({
  company: one(company, {
    fields: [companyDomain.tenantId],
    references: [company.id],
  }),
}));

export const companyRelations = relations(company, ({ many }) => ({
  companyDomains: many(companyDomain),
  companyMemberships: many(companyMembership),
  storeRegistries: many(storeRegistry),
  threadRegistries: many(threadRegistry),
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

export const storeRegistryRelations = relations(storeRegistry, ({ one }) => ({
  company: one(company, {
    fields: [storeRegistry.companyId],
    references: [company.id],
  }),
}));

export const threadRegistryRelations = relations(threadRegistry, ({ one }) => ({
  company: one(company, {
    fields: [threadRegistry.companyId],
    references: [company.id],
  }),
}));

export const chatbotWidgetCustomizationRelations = relations(
  chatbotWidgetCustomization,
  ({ one, many }) => ({
    store: one(store, {
      fields: [chatbotWidgetCustomization.storeId],
      references: [store.id],
    }),
    chatbotWidgetCustomizationQuickActionss: many(
      chatbotWidgetCustomizationQuickActions,
    ),
    quickLinks: many(quickLink),
  }),
);

export const storeRelations = relations(store, ({ many }) => ({
  chatbotWidgetCustomizations: many(chatbotWidgetCustomization),
  storeFaqss: many(storeFaqs),
  storeCredentialss: many(storeCredentials),
  chatThreads: many(chatThread),
  sessionResolutionVerdicts: many(sessionResolutionVerdict),
  storeAccesss: many(storeAccess),
  scrapeLinkslinkss: many(scrapeLinkslinks),
  knowledgeStorelibrarydocuments: many(knowledgeStorelibrarydocument),
  supportTickets: many(supportTicket),
  storeIntegrations: many(storeIntegration),
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

export const storeFaqsRelations = relations(storeFaqs, ({ one }) => ({
  store: one(store, {
    fields: [storeFaqs.storeId],
    references: [store.id],
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

export const chatAddressRelations = relations(chatAddress, ({ one }) => ({
  chatCustomer: one(chatCustomer, {
    fields: [chatAddress.customerId],
    references: [chatCustomer.id],
  }),
}));

export const chatCustomerRelations = relations(chatCustomer, ({ many }) => ({
  chatAddresss: many(chatAddress),
  chatThreads: many(chatThread),
  supportTickets: many(supportTicket),
}));

export const chatThreadRelations = relations(chatThread, ({ one, many }) => ({
  chatCustomer: one(chatCustomer, {
    fields: [chatThread.customerId],
    references: [chatCustomer.id],
  }),
  store: one(store, {
    fields: [chatThread.storeId],
    references: [store.id],
  }),
  chatbotFeedbacks: many(chatbotFeedback),
  chatBotevents: many(chatBotevent),
  chatHistorys: many(chatHistory),
  aiInsightss: many(aiInsights),
  sentimentAnalysiss: many(sentimentAnalysis),
  sessionResolutionVerdicts: many(sessionResolutionVerdict),
  userMetadatas: many(userMetadata),
  fraudFlags: many(fraudFlag),
  supportTickets: many(supportTicket),
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

export const chatHistoryRelations = relations(chatHistory, ({ one, many }) => ({
  chatbotFeedbacks: many(chatbotFeedback),
  chatThread: one(chatThread, {
    fields: [chatHistory.threadId],
    references: [chatThread.id],
  }),
  authUser: one(authUser, {
    fields: [chatHistory.messagedById],
    references: [authUser.id],
  }),
  fraudFlags: many(fraudFlag),
}));

export const chatBoteventRelations = relations(chatBotevent, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [chatBotevent.threadId],
    references: [chatThread.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [aiInsights.threadId],
    references: [chatThread.id],
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

export const userMetadataRelations = relations(userMetadata, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [userMetadata.threadId],
    references: [chatThread.id],
  }),
}));

export const storeAccessRelations = relations(storeAccess, ({ one }) => ({
  store: one(store, {
    fields: [storeAccess.storeId],
    references: [store.id],
  }),
  authUser_grantedById: one(authUser, {
    fields: [storeAccess.grantedById],
    references: [authUser.id],
    relationName: "storeAccess_grantedById_authUser_id",
  }),
  authUser_userId: one(authUser, {
    fields: [storeAccess.userId],
    references: [authUser.id],
    relationName: "storeAccess_userId_authUser_id",
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

export const scrapeLinkslinksRelations = relations(
  scrapeLinkslinks,
  ({ one }) => ({
    store: one(store, {
      fields: [scrapeLinkslinks.storeId],
      references: [store.id],
    }),
  }),
);

export const knowledgeStorelibrarydocumentRelations = relations(
  knowledgeStorelibrarydocument,
  ({ one }) => ({
    store: one(store, {
      fields: [knowledgeStorelibrarydocument.storeId],
      references: [store.id],
    }),
  }),
);

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

export const supportTicketRelations = relations(supportTicket, ({ one }) => ({
  chatCustomer: one(chatCustomer, {
    fields: [supportTicket.customerId],
    references: [chatCustomer.id],
  }),
  store: one(store, {
    fields: [supportTicket.storeId],
    references: [store.id],
  }),
  chatThread: one(chatThread, {
    fields: [supportTicket.threadId],
    references: [chatThread.id],
  }),
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

export const integrationAttributeRelations = relations(
  integrationAttribute,
  ({ one, many }) => ({
    integration: one(integration, {
      fields: [integrationAttribute.integrationId],
      references: [integration.id],
    }),
    storeIntegrationAttributes: many(storeIntegrationAttribute),
  }),
);

export const integrationRelations = relations(integration, ({ one, many }) => ({
  integrationAttributes: many(integrationAttribute),
  integrationCategory: one(integrationCategory, {
    fields: [integration.categoryId],
    references: [integrationCategory.id],
  }),
}));

export const storeIntegrationAttributeRelations = relations(
  storeIntegrationAttribute,
  ({ one }) => ({
    integrationAttribute: one(integrationAttribute, {
      fields: [storeIntegrationAttribute.integrationAttributeId],
      references: [integrationAttribute.id],
    }),
    storeIntegration: one(storeIntegration, {
      fields: [storeIntegrationAttribute.storeIntegrationId],
      references: [storeIntegration.id],
    }),
  }),
);

export const integrationCategoryRelations = relations(
  integrationCategory,
  ({ many }) => ({
    integrations: many(integration),
  }),
);
