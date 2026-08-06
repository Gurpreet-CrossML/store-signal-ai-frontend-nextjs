import { relations } from "drizzle-orm/relations";
import {
  djangoContentType,
  authPermission,
  authGroupPermissions,
  authGroup,
  company,
  storeRegistry,
  threadRegistry,
  authUserGroups,
  authUser,
  authUserUserPermissions,
  djangoAdminLog,
  companyDomain,
  companyMembership,
  store,
  chatbotWidgetCustomization,
  chatbotWidgetCustomizationQuickActions,
  quickAction,
  storeAccess,
  quickLink,
  storeFaqs,
  storeCredentials,
  chatCustomer,
  chatAddress,
  chatHistory,
  chatbotFeedback,
  chatThread,
  chatBotevent,
  aiInsights,
  sentimentAnalysis,
  sessionResolutionVerdict,
  userMetadata,
  fraudFlag,
  scrapeLinkslinks,
  knowledgeStorelibrarydocument,
  supportTicket,
  taggitTaggeditem,
  taggitTag,
  integrationCategory,
  integration,
  integrationAttribute,
  storeIntegration,
  storeIntegrationAttribute,
  chatCustomerorder,
  vocabulary,
  neverSayRules,
  personaIdentity,
  vocabularyWordReplacements,
  wordReplacement,
  toneStyle,
  aiUsage,
  socialSubscription,
  socialConnectedAccount,
  socialPost,
  socialPostMedia,
  socialUser,
  socialMessage,
  socialWebhookEvent,
  socialReaction,
  socialCommentAnalysis,
  socialAccountRegistry,
  supportTicketChannel,
  ticketMessage,
  supportTicketTags,
  ticketTag,
  ticketAttachment,
  ticketMessageDraft,
  supportTicketAssignmentAudit,
  supportTicketStatusAudit,
  supportTicketAiActivity,
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

export const storeRegistryRelations = relations(storeRegistry, ({ one }) => ({
  company: one(company, {
    fields: [storeRegistry.companyId],
    references: [company.id],
  }),
}));

export const companyRelations = relations(company, ({ many }) => ({
  storeRegistries: many(storeRegistry),
  threadRegistries: many(threadRegistry),
  companyDomains: many(companyDomain),
  companyMemberships: many(companyMembership),
  socialAccountRegistries: many(socialAccountRegistry),
}));

export const threadRegistryRelations = relations(threadRegistry, ({ one }) => ({
  company: one(company, {
    fields: [threadRegistry.companyId],
    references: [company.id],
  }),
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
  storeAccesss_grantedById: many(storeAccess, {
    relationName: "storeAccess_grantedById_authUser_id",
  }),
  storeAccesss_userId: many(storeAccess, {
    relationName: "storeAccess_userId_authUser_id",
  }),
  chatThreads: many(chatThread),
  supportTickets_closedById: many(supportTicket, {
    relationName: "supportTicket_closedById_authUser_id",
  }),
  supportTickets_internalAssigneeId: many(supportTicket, {
    relationName: "supportTicket_internalAssigneeId_authUser_id",
  }),
  supportTickets_resolvedById: many(supportTicket, {
    relationName: "supportTicket_resolvedById_authUser_id",
  }),
  supportTickets_snoozedById: many(supportTicket, {
    relationName: "supportTicket_snoozedById_authUser_id",
  }),
  chatHistorys: many(chatHistory),
  socialMessages: many(socialMessage),
  ticketMessages: many(ticketMessage),
  ticketMessageDrafts_agentId: many(ticketMessageDraft, {
    relationName: "ticketMessageDraft_agentId_authUser_id",
  }),
  ticketMessageDrafts_createdById: many(ticketMessageDraft, {
    relationName: "ticketMessageDraft_createdById_authUser_id",
  }),
  supportTicketAssignmentAudits_assignedById: many(
    supportTicketAssignmentAudit,
    {
      relationName: "supportTicketAssignmentAudit_assignedById_authUser_id",
    },
  ),
  supportTicketAssignmentAudits_fromAgentId: many(
    supportTicketAssignmentAudit,
    {
      relationName: "supportTicketAssignmentAudit_fromAgentId_authUser_id",
    },
  ),
  supportTicketAssignmentAudits_toAgentId: many(supportTicketAssignmentAudit, {
    relationName: "supportTicketAssignmentAudit_toAgentId_authUser_id",
  }),
  supportTicketStatusAudits: many(supportTicketStatusAudit),
  supportTicketAiActivitys: many(supportTicketAiActivity),
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

export const companyDomainRelations = relations(companyDomain, ({ one }) => ({
  company: one(company, {
    fields: [companyDomain.tenantId],
    references: [company.id],
  }),
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
  storeAccesss: many(storeAccess),
  storeFaqss: many(storeFaqs),
  storeCredentialss: many(storeCredentials),
  sessionResolutionVerdicts: many(sessionResolutionVerdict),
  chatThreads: many(chatThread),
  scrapeLinkslinkss: many(scrapeLinkslinks),
  knowledgeStorelibrarydocuments: many(knowledgeStorelibrarydocument),
  supportTickets: many(supportTicket),
  storeIntegrations: many(storeIntegration),
  vocabularys: many(vocabulary),
  neverSayRuless: many(neverSayRules),
  personaIdentitys: many(personaIdentity),
  toneStyles: many(toneStyle),
  socialSubscriptions: many(socialSubscription),
  ticketTags: many(ticketTag),
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

export const storeAccessRelations = relations(storeAccess, ({ one }) => ({
  authUser_grantedById: one(authUser, {
    fields: [storeAccess.grantedById],
    references: [authUser.id],
    relationName: "storeAccess_grantedById_authUser_id",
  }),
  store: one(store, {
    fields: [storeAccess.storeId],
    references: [store.id],
  }),
  authUser_userId: one(authUser, {
    fields: [storeAccess.userId],
    references: [authUser.id],
    relationName: "storeAccess_userId_authUser_id",
  }),
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
  chatCustomerorders: many(chatCustomerorder),
  socialUsers: many(socialUser),
  ticketMessages: many(ticketMessage),
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
  fraudFlags: many(fraudFlag),
  authUser: one(authUser, {
    fields: [chatHistory.messagedById],
    references: [authUser.id],
  }),
  chatThread: one(chatThread, {
    fields: [chatHistory.threadId],
    references: [chatThread.id],
  }),
  aiUsages: many(aiUsage),
}));

export const chatThreadRelations = relations(chatThread, ({ one, many }) => ({
  chatbotFeedbacks: many(chatbotFeedback),
  chatBotevents: many(chatBotevent),
  aiInsightss: many(aiInsights),
  sentimentAnalysiss: many(sentimentAnalysis),
  sessionResolutionVerdicts: many(sessionResolutionVerdict),
  authUser: one(authUser, {
    fields: [chatThread.chatHandlerUserId],
    references: [authUser.id],
  }),
  chatCustomer: one(chatCustomer, {
    fields: [chatThread.customerId],
    references: [chatCustomer.id],
  }),
  store: one(store, {
    fields: [chatThread.storeId],
    references: [store.id],
  }),
  userMetadatas: many(userMetadata),
  fraudFlags: many(fraudFlag),
  supportTickets: many(supportTicket),
  chatHistorys: many(chatHistory),
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

export const supportTicketRelations = relations(
  supportTicket,
  ({ one, many }) => ({
    authUser_closedById: one(authUser, {
      fields: [supportTicket.closedById],
      references: [authUser.id],
      relationName: "supportTicket_closedById_authUser_id",
    }),
    chatCustomer: one(chatCustomer, {
      fields: [supportTicket.customerId],
      references: [chatCustomer.id],
    }),
    authUser_internalAssigneeId: one(authUser, {
      fields: [supportTicket.internalAssigneeId],
      references: [authUser.id],
      relationName: "supportTicket_internalAssigneeId_authUser_id",
    }),
    authUser_resolvedById: one(authUser, {
      fields: [supportTicket.resolvedById],
      references: [authUser.id],
      relationName: "supportTicket_resolvedById_authUser_id",
    }),
    authUser_snoozedById: one(authUser, {
      fields: [supportTicket.snoozedById],
      references: [authUser.id],
      relationName: "supportTicket_snoozedById_authUser_id",
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
    ticketAttachments: many(ticketAttachment),
    ticketMessageDrafts: many(ticketMessageDraft),
    supportTicketAssignmentAudits: many(supportTicketAssignmentAudit),
    supportTicketStatusAudits: many(supportTicketStatusAudit),
    supportTicketAiActivitys: many(supportTicketAiActivity),
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

export const chatCustomerorderRelations = relations(
  chatCustomerorder,
  ({ one }) => ({
    chatCustomer: one(chatCustomer, {
      fields: [chatCustomerorder.customerId],
      references: [chatCustomer.id],
    }),
  }),
);

export const vocabularyRelations = relations(vocabulary, ({ one, many }) => ({
  store: one(store, {
    fields: [vocabulary.storeId],
    references: [store.id],
  }),
  vocabularyWordReplacementss: many(vocabularyWordReplacements),
}));

export const neverSayRulesRelations = relations(neverSayRules, ({ one }) => ({
  store: one(store, {
    fields: [neverSayRules.storeId],
    references: [store.id],
  }),
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

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  chatHistory: one(chatHistory, {
    fields: [aiUsage.chatHistoryId],
    references: [chatHistory.id],
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

export const socialPostRelations = relations(socialPost, ({ one, many }) => ({
  socialConnectedAccount: one(socialConnectedAccount, {
    fields: [socialPost.accountId],
    references: [socialConnectedAccount.id],
  }),
  socialPostMedias: many(socialPostMedia),
  socialMessages: many(socialMessage),
}));

export const socialConnectedAccountRelations = relations(
  socialConnectedAccount,
  ({ one, many }) => ({
    socialPosts: many(socialPost),
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
    socialUsers: many(socialUser),
    socialMessages: many(socialMessage),
    socialWebhookEvents: many(socialWebhookEvent),
  }),
);

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
    authUser: one(authUser, {
      fields: [socialMessage.agentId],
      references: [authUser.id],
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

export const socialAccountRegistryRelations = relations(
  socialAccountRegistry,
  ({ one }) => ({
    company: one(company, {
      fields: [socialAccountRegistry.companyId],
      references: [company.id],
    }),
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

export const ticketMessageRelations = relations(
  ticketMessage,
  ({ one, many }) => ({
    authUser: one(authUser, {
      fields: [ticketMessage.agentId],
      references: [authUser.id],
    }),
    chatCustomer: one(chatCustomer, {
      fields: [ticketMessage.customerId],
      references: [chatCustomer.id],
    }),
    supportTicket: one(supportTicket, {
      fields: [ticketMessage.ticketId],
      references: [supportTicket.id],
    }),
    ticketAttachments: many(ticketAttachment),
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
}));

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

export const ticketMessageDraftRelations = relations(
  ticketMessageDraft,
  ({ one }) => ({
    authUser_agentId: one(authUser, {
      fields: [ticketMessageDraft.agentId],
      references: [authUser.id],
      relationName: "ticketMessageDraft_agentId_authUser_id",
    }),
    authUser_createdById: one(authUser, {
      fields: [ticketMessageDraft.createdById],
      references: [authUser.id],
      relationName: "ticketMessageDraft_createdById_authUser_id",
    }),
    supportTicket: one(supportTicket, {
      fields: [ticketMessageDraft.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const supportTicketAssignmentAuditRelations = relations(
  supportTicketAssignmentAudit,
  ({ one }) => ({
    authUser_assignedById: one(authUser, {
      fields: [supportTicketAssignmentAudit.assignedById],
      references: [authUser.id],
      relationName: "supportTicketAssignmentAudit_assignedById_authUser_id",
    }),
    authUser_fromAgentId: one(authUser, {
      fields: [supportTicketAssignmentAudit.fromAgentId],
      references: [authUser.id],
      relationName: "supportTicketAssignmentAudit_fromAgentId_authUser_id",
    }),
    supportTicket: one(supportTicket, {
      fields: [supportTicketAssignmentAudit.ticketId],
      references: [supportTicket.id],
    }),
    authUser_toAgentId: one(authUser, {
      fields: [supportTicketAssignmentAudit.toAgentId],
      references: [authUser.id],
      relationName: "supportTicketAssignmentAudit_toAgentId_authUser_id",
    }),
  }),
);

export const supportTicketStatusAuditRelations = relations(
  supportTicketStatusAudit,
  ({ one }) => ({
    authUser: one(authUser, {
      fields: [supportTicketStatusAudit.changedById],
      references: [authUser.id],
    }),
    supportTicket: one(supportTicket, {
      fields: [supportTicketStatusAudit.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const supportTicketAiActivityRelations = relations(
  supportTicketAiActivity,
  ({ one }) => ({
    authUser: one(authUser, {
      fields: [supportTicketAiActivity.performedById],
      references: [authUser.id],
    }),
    supportTicket: one(supportTicket, {
      fields: [supportTicketAiActivity.ticketId],
      references: [supportTicket.id],
    }),
  }),
);
