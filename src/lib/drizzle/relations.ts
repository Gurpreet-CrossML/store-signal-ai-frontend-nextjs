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
  company,
  storeRegistry,
  companyDomain,
  companyMembership,
  threadRegistry,
  socialAccountRegistry,
  store,
  chatbotWidgetCustomization,
  chatbotWidgetCustomizationQuickActions,
  quickAction,
  quickLink,
  storeFaqs,
  storeCredentials,
  chatHistory,
  chatbotFeedback,
  chatThread,
  chatBotevent,
  chatCustomer,
  chatAddress,
  sentimentAnalysis,
  sessionResolutionVerdict,
  userMetadata,
  aiInsights,
  storeAccess,
  fraudFlag,
  chatCustomerorder,
  ticketTag,
  supportTicket,
  supportTicketChannel,
  supportTicketTags,
  ticketMessage,
  ticketAttachment,
  storeIntegration,
  storeIntegrationAttribute,
  supportTicketAssignmentAudit,
  supportTicketStatusAudit,
  ticketMessageDraft,
  supportTicketAiActivity,
  vocabulary,
  vocabularyWordReplacements,
  wordReplacement,
  neverSayRules,
  personaIdentity,
  toneStyle,
  aiUsage,
  socialSubscription,
  socialConnectedAccount,
  socialPost,
  socialPostMedia,
  socialUser,
  socialMessage,
  socialWebhookEvent,
  socialAiUsage,
  socialReaction,
  socialCommentAnalysis,
  socialMessageAttachment,
  socialCommentDraft,
  socialCommentSetting,
  campaignWhatsappTemplate,
  campaignSendLog,
  campaignAutoSendRule,
  scrapeLinkslinks,
  knowledgeStorelibrarydocument,
  taggitTaggeditem,
  taggitTag,
  integrationCategory,
  integration,
  integrationAttribute,
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

export const storeRegistryRelations = relations(storeRegistry, ({ one }) => ({
  company: one(company, {
    fields: [storeRegistry.companyId],
    references: [company.id],
  }),
}));

export const companyRelations = relations(company, ({ many }) => ({
  storeRegistries: many(storeRegistry),
  companyDomains: many(companyDomain),
  companyMemberships: many(companyMembership),
  threadRegistries: many(threadRegistry),
  socialAccountRegistries: many(socialAccountRegistry),
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
  ticketTags: many(ticketTag),
  supportTickets: many(supportTicket),
  storeIntegrations: many(storeIntegration),
  neverSayRuless: many(neverSayRules),
  vocabularys: many(vocabulary),
  personaIdentitys: many(personaIdentity),
  toneStyles: many(toneStyle),
  socialSubscriptions: many(socialSubscription),
  scrapeLinkslinkss: many(scrapeLinkslinks),
  knowledgeStorelibrarydocuments: many(knowledgeStorelibrarydocument),
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
  fraudFlags: many(fraudFlag),
  aiUsages: many(aiUsage),
}));

export const chatThreadRelations = relations(chatThread, ({ one, many }) => ({
  chatbotFeedbacks: many(chatbotFeedback),
  chatBotevents: many(chatBotevent),
  chatCustomer: one(chatCustomer, {
    fields: [chatThread.customerId],
    references: [chatCustomer.id],
  }),
  store: one(store, {
    fields: [chatThread.storeId],
    references: [store.id],
  }),
  chatHistorys: many(chatHistory),
  sentimentAnalysiss: many(sentimentAnalysis),
  sessionResolutionVerdicts: many(sessionResolutionVerdict),
  userMetadatas: many(userMetadata),
  aiInsightss: many(aiInsights),
  fraudFlags: many(fraudFlag),
  supportTickets: many(supportTicket),
}));

export const chatBoteventRelations = relations(chatBotevent, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [chatBotevent.threadId],
    references: [chatThread.id],
  }),
}));

export const chatCustomerRelations = relations(chatCustomer, ({ many }) => ({
  chatThreads: many(chatThread),
  chatAddresss: many(chatAddress),
  chatCustomerorders: many(chatCustomerorder),
  supportTickets: many(supportTicket),
  ticketMessages: many(ticketMessage),
  socialUsers: many(socialUser),
  campaignSendLogs: many(campaignSendLog),
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

export const userMetadataRelations = relations(userMetadata, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [userMetadata.threadId],
    references: [chatThread.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  chatThread: one(chatThread, {
    fields: [aiInsights.threadId],
    references: [chatThread.id],
  }),
}));

export const storeAccessRelations = relations(storeAccess, ({ one }) => ({
  store: one(store, {
    fields: [storeAccess.storeId],
    references: [store.id],
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
  }),
);

export const ticketTagRelations = relations(ticketTag, ({ one, many }) => ({
  store: one(store, {
    fields: [ticketTag.storeId],
    references: [store.id],
  }),
  supportTicketTagss: many(supportTicketTags),
}));

export const supportTicketRelations = relations(
  supportTicket,
  ({ one, many }) => ({
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
    supportTicketTagss: many(supportTicketTags),
    ticketAttachments: many(ticketAttachment),
    ticketMessages: many(ticketMessage),
    supportTicketAssignmentAudits: many(supportTicketAssignmentAudit),
    supportTicketStatusAudits: many(supportTicketStatusAudit),
    ticketMessageDrafts: many(ticketMessageDraft),
    supportTicketAiActivitys: many(supportTicketAiActivity),
    campaignSendLogs: many(campaignSendLog),
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

export const ticketMessageDraftRelations = relations(
  ticketMessageDraft,
  ({ one }) => ({
    supportTicket: one(supportTicket, {
      fields: [ticketMessageDraft.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const supportTicketAiActivityRelations = relations(
  supportTicketAiActivity,
  ({ one }) => ({
    supportTicket: one(supportTicket, {
      fields: [supportTicketAiActivity.ticketId],
      references: [supportTicket.id],
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

export const vocabularyRelations = relations(vocabulary, ({ one, many }) => ({
  vocabularyWordReplacementss: many(vocabularyWordReplacements),
  store: one(store, {
    fields: [vocabulary.storeId],
    references: [store.id],
  }),
}));

export const wordReplacementRelations = relations(
  wordReplacement,
  ({ many }) => ({
    vocabularyWordReplacementss: many(vocabularyWordReplacements),
  }),
);

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
    campaignWhatsappTemplates: many(campaignWhatsappTemplate),
    campaignSendLogs: many(campaignSendLog),
    campaignAutoSendRules: many(campaignAutoSendRule),
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
    socialAiUsages: many(socialAiUsage),
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

export const socialAiUsageRelations = relations(socialAiUsage, ({ one }) => ({
  socialMessage: one(socialMessage, {
    fields: [socialAiUsage.messageId],
    references: [socialMessage.id],
  }),
}));

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

export const socialCommentSettingRelations = relations(
  socialCommentSetting,
  ({ one }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [socialCommentSetting.accountId],
      references: [socialConnectedAccount.id],
    }),
  }),
);

export const campaignWhatsappTemplateRelations = relations(
  campaignWhatsappTemplate,
  ({ one, many }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [campaignWhatsappTemplate.accountId],
      references: [socialConnectedAccount.id],
    }),
    campaignSendLogs: many(campaignSendLog),
    campaignAutoSendRules: many(campaignAutoSendRule),
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
    chatCustomerorder: one(chatCustomerorder, {
      fields: [campaignSendLog.orderId],
      references: [chatCustomerorder.id],
    }),
    campaignWhatsappTemplate: one(campaignWhatsappTemplate, {
      fields: [campaignSendLog.templateId],
      references: [campaignWhatsappTemplate.id],
    }),
    supportTicket: one(supportTicket, {
      fields: [campaignSendLog.ticketId],
      references: [supportTicket.id],
    }),
  }),
);

export const campaignAutoSendRuleRelations = relations(
  campaignAutoSendRule,
  ({ one }) => ({
    socialConnectedAccount: one(socialConnectedAccount, {
      fields: [campaignAutoSendRule.accountId],
      references: [socialConnectedAccount.id],
    }),
    campaignWhatsappTemplate: one(campaignWhatsappTemplate, {
      fields: [campaignAutoSendRule.templateId],
      references: [campaignWhatsappTemplate.id],
    }),
  }),
);

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
