import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  unique,
  integer,
  index,
  foreignKey,
  boolean,
  check,
  text,
  smallint,
  jsonb,
  uuid,
  doublePrecision,
  numeric,
  inet,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const djangoMigrations = pgTable("django_migrations", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
    name: "django_migrations_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 9223372036854775807,
    cache: 1,
  }),
  app: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  applied: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const djangoContentType = pgTable(
  "django_content_type",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "django_content_type_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    appLabel: varchar("app_label", { length: 100 }).notNull(),
    model: varchar({ length: 100 }).notNull(),
  },
  (table) => [
    unique("django_content_type_app_label_model_76bd3d3b_uniq").on(
      table.appLabel,
      table.model,
    ),
  ],
);

export const authPermission = pgTable(
  "auth_permission",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "auth_permission_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    name: varchar({ length: 255 }).notNull(),
    contentTypeId: integer("content_type_id").notNull(),
    codename: varchar({ length: 100 }).notNull(),
  },
  (table) => [
    index("auth_permission_content_type_id_2f476e4b").using(
      "btree",
      table.contentTypeId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.contentTypeId],
      foreignColumns: [djangoContentType.id],
      name: "auth_permission_content_type_id_2f476e4b_fk_django_co",
    }),
    unique("auth_permission_content_type_id_codename_01ab375a_uniq").on(
      table.contentTypeId,
      table.codename,
    ),
  ],
);

export const authGroup = pgTable(
  "auth_group",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "auth_group_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    name: varchar({ length: 150 }).notNull(),
  },
  (table) => [
    index("auth_group_name_a6ea08ec_like").using(
      "btree",
      table.name.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    unique("auth_group_name_key").on(table.name),
  ],
);

export const authGroupPermissions = pgTable(
  "auth_group_permissions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "auth_group_permissions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    groupId: integer("group_id").notNull(),
    permissionId: integer("permission_id").notNull(),
  },
  (table) => [
    index("auth_group_permissions_group_id_b120cbf9").using(
      "btree",
      table.groupId.asc().nullsLast().op("int4_ops"),
    ),
    index("auth_group_permissions_permission_id_84c5c92e").using(
      "btree",
      table.permissionId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [authGroup.id],
      name: "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id",
    }),
    foreignKey({
      columns: [table.permissionId],
      foreignColumns: [authPermission.id],
      name: "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm",
    }),
    unique("auth_group_permissions_group_id_permission_id_0cd325b0_uniq").on(
      table.groupId,
      table.permissionId,
    ),
  ],
);

export const authUser = pgTable(
  "auth_user",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "auth_user_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    password: varchar({ length: 128 }).notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true, mode: "string" }),
    isSuperuser: boolean("is_superuser").notNull(),
    username: varchar({ length: 150 }).notNull(),
    firstName: varchar("first_name", { length: 150 }).notNull(),
    lastName: varchar("last_name", { length: 150 }).notNull(),
    email: varchar({ length: 254 }).notNull(),
    isStaff: boolean("is_staff").notNull(),
    isActive: boolean("is_active").notNull(),
    dateJoined: timestamp("date_joined", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
  },
  (table) => [
    index("auth_user_username_6821ab7c_like").using(
      "btree",
      table.username.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    unique("auth_user_username_key").on(table.username),
  ],
);

export const authUserGroups = pgTable(
  "auth_user_groups",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "auth_user_groups_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    userId: integer("user_id").notNull(),
    groupId: integer("group_id").notNull(),
  },
  (table) => [
    index("auth_user_groups_group_id_97559544").using(
      "btree",
      table.groupId.asc().nullsLast().op("int4_ops"),
    ),
    index("auth_user_groups_user_id_6a12ed8b").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUser.id],
      name: "auth_user_groups_user_id_6a12ed8b_fk_auth_user_id",
    }),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [authGroup.id],
      name: "auth_user_groups_group_id_97559544_fk_auth_group_id",
    }),
    unique("auth_user_groups_user_id_group_id_94350c0c_uniq").on(
      table.userId,
      table.groupId,
    ),
  ],
);

export const authUserUserPermissions = pgTable(
  "auth_user_user_permissions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "auth_user_user_permissions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    userId: integer("user_id").notNull(),
    permissionId: integer("permission_id").notNull(),
  },
  (table) => [
    index("auth_user_user_permissions_permission_id_1fbb5f2c").using(
      "btree",
      table.permissionId.asc().nullsLast().op("int4_ops"),
    ),
    index("auth_user_user_permissions_user_id_a95ead1b").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUser.id],
      name: "auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id",
    }),
    foreignKey({
      columns: [table.permissionId],
      foreignColumns: [authPermission.id],
      name: "auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm",
    }),
    unique("auth_user_user_permissions_user_id_permission_id_14a6b632_uniq").on(
      table.userId,
      table.permissionId,
    ),
  ],
);

export const djangoAdminLog = pgTable(
  "django_admin_log",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "django_admin_log_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    actionTime: timestamp("action_time", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    objectId: text("object_id"),
    objectRepr: varchar("object_repr", { length: 200 }).notNull(),
    actionFlag: smallint("action_flag").notNull(),
    changeMessage: text("change_message").notNull(),
    contentTypeId: integer("content_type_id"),
    userId: integer("user_id").notNull(),
  },
  (table) => [
    index("django_admin_log_content_type_id_c4bce8eb").using(
      "btree",
      table.contentTypeId.asc().nullsLast().op("int4_ops"),
    ),
    index("django_admin_log_user_id_c564eba6").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.contentTypeId],
      foreignColumns: [djangoContentType.id],
      name: "django_admin_log_content_type_id_c4bce8eb_fk_django_co",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUser.id],
      name: "django_admin_log_user_id_c564eba6_fk_auth_user_id",
    }),
    check("django_admin_log_action_flag_check", sql`action_flag >= 0`),
  ],
);

export const store = pgTable(
  "store",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "store_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 255 }).notNull(),
    platform: varchar({ length: 20 }).notNull(),
    url: varchar({ length: 200 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
  },
  (table) => [
    index("store_code_5512d74c_like").using(
      "btree",
      table.code.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("store_name_fb31a80d_like").using(
      "btree",
      table.name.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    unique("store_name_key").on(table.name),
    unique("store_code_key").on(table.code),
  ],
);

export const chatbotWidgetCustomization = pgTable(
  "chatbot_widget_customization",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "chatbot_widget_customization_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    primaryColor: varchar("primary_color", { length: 7 }),
    secondaryColor: varchar("secondary_color", { length: 7 }),
    tertiaryColor: varchar("tertiary_color", { length: 7 }),
    logo: varchar({ length: 255 }),
    welcomeMessage: varchar("welcome_message", { length: 500 }).notNull(),
    greetingMessage: varchar("greeting_message", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "chatbot_widget_customization_store_id_c92a0380_fk_store_id",
    }),
    unique("chatbot_widget_customization_store_id_key").on(table.storeId),
  ],
);

export const chatbotWidgetCustomizationQuickActions = pgTable(
  "chatbot_widget_customization_quick_actions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "chatbot_widget_customization_quick_actions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    chatbotwidgetcustomizationId: bigint("chatbotwidgetcustomization_id", {
      mode: "number",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    quickactionId: bigint("quickaction_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index(
      "chatbot_widget_customizati_chatbotwidgetcustomization_dbdfee1b",
    ).using(
      "btree",
      table.chatbotwidgetcustomizationId.asc().nullsLast().op("int8_ops"),
    ),
    index("chatbot_widget_customizati_quickaction_id_41680d88").using(
      "btree",
      table.quickactionId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.chatbotwidgetcustomizationId],
      foreignColumns: [chatbotWidgetCustomization.id],
      name: "chatbot_widget_custo_chatbotwidgetcustomi_dbdfee1b_fk_chatbot_w",
    }),
    foreignKey({
      columns: [table.quickactionId],
      foreignColumns: [quickAction.id],
      name: "chatbot_widget_custo_quickaction_id_41680d88_fk_quick_act",
    }),
    unique(
      "chatbot_widget_customiza_chatbotwidgetcustomizati_56a32df7_uniq",
    ).on(table.chatbotwidgetcustomizationId, table.quickactionId),
  ],
);

export const quickAction = pgTable("quick_action", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
    name: "quick_action_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 9223372036854775807,
    cache: 1,
  }),
  name: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
});

export const quickLink = pgTable(
  "quick_link",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "quick_link_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    name: varchar({ length: 255 }).notNull(),
    url: varchar({ length: 200 }).notNull(),
    priority: integer(),
    isActive: boolean("is_active").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    widgetId: bigint("widget_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("quick_link_widget_id_7a6f5641").using(
      "btree",
      table.widgetId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.widgetId],
      foreignColumns: [chatbotWidgetCustomization.id],
      name: "quick_link_widget_id_7a6f5641_fk_chatbot_w",
    }),
    check("quick_link_priority_check", sql`priority >= 0`),
  ],
);

export const storeCredentials = pgTable(
  "store_credentials",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "store_credentials_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    baseUrl: varchar("base_url", { length: 200 }).notNull(),
    storefrontToken: text("storefront_token"),
    adminAccessToken: text("admin_access_token"),
    mcpUrl: varchar("mcp_url", { length: 200 }),
    n8NUrl: varchar("n8n_url", { length: 200 }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "store_credentials_store_id_3c6945c8_fk_store_id",
    }),
    unique("store_credentials_store_id_key").on(table.storeId),
  ],
);

export const storeFaqs = pgTable(
  "store_faqs",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "store_faqs_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    question: text().notNull(),
    answer: text().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("store_faqs_store_id_77dc29ac").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "store_faqs_store_id_77dc29ac_fk_store_id",
    }),
  ],
);

export const otpStore = pgTable("otp_store", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
    name: "otp_store_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 9223372036854775807,
    cache: 1,
  }),
  threadId: varchar("thread_id", { length: 150 }),
  email: varchar({ length: 254 }).notNull(),
  otp: varchar({ length: 6 }).notNull(),
  isVerified: boolean("is_verified").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
});

export const chatCustomer = pgTable("chat_customer", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
    name: "chat_customer_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 9223372036854775807,
    cache: 1,
  }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar({ length: 254 }).notNull(),
  store: varchar({ length: 255 }),
  customerId: varchar("customer_id", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
});

export const chatAddress = pgTable(
  "chat_address",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "chat_address_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    street: jsonb(),
    countryId: varchar("country_id", { length: 3 }),
    region: varchar({ length: 100 }),
    city: varchar({ length: 100 }),
    postcode: varchar({ length: 20 }),
    telephone: varchar({ length: 20 }),
    defaultBilling: boolean("default_billing").notNull(),
    defaultShipping: boolean("default_shipping").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("chat_address_customer_id_f707e8c0").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [chatCustomer.id],
      name: "chat_address_customer_id_f707e8c0_fk_chat_customer_id",
    }),
  ],
);

export const chatThread = pgTable(
  "chat_thread",
  {
    id: uuid().primaryKey().notNull(),
    name: varchar({ length: 255 }),
    isActive: boolean("is_active").notNull(),
    followupLevel: integer("followup_level").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("chat_thread_customer_id_31f2879e").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    index("chat_thread_store_id_b856f451").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [chatCustomer.id],
      name: "chat_thread_customer_id_31f2879e_fk_chat_customer_id",
    }),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "chat_thread_store_id_b856f451_fk_store_id",
    }),
  ],
);

export const chatbotFeedback = pgTable(
  "chatbot_feedback",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "chatbot_feedback_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    rating: varchar({ length: 10 }).notNull(),
    feedbackMessage: varchar("feedback_message", { length: 500 }),
    conversationSummary: text("conversation_summary"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    chatMessageId: bigint("chat_message_id", { mode: "number" }),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    index("chatbot_fee_thread__ce8e5f_idx").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("chatbot_feedback_chat_message_id_253617b0").using(
      "btree",
      table.chatMessageId.asc().nullsLast().op("int8_ops"),
    ),
    index("chatbot_feedback_thread_id_e45b9eb9").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.chatMessageId],
      foreignColumns: [chatHistory.id],
      name: "chatbot_feedback_chat_message_id_253617b0_fk_chat_history_id",
    }),
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "chatbot_feedback_thread_id_e45b9eb9_fk_chat_thread_id",
    }),
  ],
);

export const chatBotevent = pgTable(
  "chat_botevent",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "chat_botevent_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    productId: varchar("product_id", { length: 100 }),
    productName: varchar("product_name", { length: 255 }),
    category: varchar({ length: 255 }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    index("chat_botevent_thread_id_aad111f3").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "chat_botevent_thread_id_aad111f3_fk_chat_thread_id",
    }),
  ],
);

export const chatHistory = pgTable(
  "chat_history",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "chat_history_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    role: varchar({ length: 20 }).notNull(),
    jsonContent: jsonb("json_content").notNull(),
    messageType: varchar("message_type", { length: 30 }).notNull(),
    responseTime: doublePrecision("response_time").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    threadId: uuid("thread_id").notNull(),
    workflow: varchar({ length: 30 }),
    message: text().notNull(),
    imageUrl: jsonb("image_url"),
  },
  (table) => [
    index("chat_histor_created_2850f7_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("chat_histor_message_aee83b_idx").using(
      "btree",
      table.messageType.asc().nullsLast().op("text_ops"),
    ),
    index("chat_histor_role_2d2777_idx").using(
      "btree",
      table.role.asc().nullsLast().op("text_ops"),
    ),
    index("chat_histor_thread__381e32_idx").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    index("chat_history_thread_id_4bac8b19").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "chat_history_thread_id_4bac8b19_fk_chat_thread_id",
    }),
  ],
);

export const aiInsights = pgTable(
  "ai_insights",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "ai_insights_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    underperformingCases: jsonb("underperforming_cases").notNull(),
    overperformingCases: jsonb("overperforming_cases").notNull(),
    resolutionSuccessRate: numeric("resolution_success_rate", {
      precision: 5,
      scale: 2,
    }).notNull(),
    reasonForScore: text("reason_for_score").notNull(),
    tags: jsonb().notNull(),
    aiInsightRequired: boolean("ai_insight_required").notNull(),
    nextActionableItems: jsonb("next_actionable_items").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "ai_insights_thread_id_ff0c2d42_fk_chat_thread_id",
    }),
    unique("ai_insights_thread_id_key").on(table.threadId),
  ],
);

export const sentimentAnalysis = pgTable(
  "sentiment_analysis",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "sentiment_analysis_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    totalQueries: integer("total_queries").notNull(),
    resolvedQueries: integer("resolved_queries").notNull(),
    unresolvedQueries: integer("unresolved_queries").notNull(),
    resolvedQueriesList: jsonb("resolved_queries_list").notNull(),
    unresolvedQueriesList: jsonb("unresolved_queries_list").notNull(),
    topIntent: varchar("top_intent", { length: 50 }).notNull(),
    searchKeywords: jsonb("search_keywords").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "sentiment_analysis_thread_id_ad847984_fk_chat_thread_id",
    }),
    unique("sentiment_analysis_thread_id_key").on(table.threadId),
  ],
);

export const sessionResolutionVerdict = pgTable(
  "session_resolution_verdict",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "session_resolution_verdict_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    verdict: varchar({ length: 20 }).notNull(),
    reason: text(),
    confidence: doublePrecision().notNull(),
    totalQueries: integer("total_queries").notNull(),
    resolvedCount: integer("resolved_count").notNull(),
    unresolvedCount: integer("unresolved_count").notNull(),
    querySummaries: jsonb("query_summaries").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    index("session_resolution_verdict_store_id_d0e896c1").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "session_resolution_verdict_store_id_d0e896c1_fk_store_id",
    }),
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "session_resolution_verdict_thread_id_72042b2d_fk_chat_thread_id",
    }),
    unique("session_resolution_verdict_thread_id_key").on(table.threadId),
  ],
);

export const userMetadata = pgTable(
  "user_metadata",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "user_metadata_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    customerName: varchar("customer_name", { length: 255 }),
    geoLocation: varchar("geo_location", { length: 255 }),
    ipAddress: inet("ip_address"),
    deviceType: varchar("device_type", { length: 100 }),
    browser: varchar({ length: 100 }),
    os: varchar({ length: 100 }),
    initialCartData: jsonb("initial_cart_data").notNull(),
    updatedCartData: jsonb("updated_cart_data").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "user_metadata_thread_id_368d9e3f_fk_chat_thread_id",
    }),
    unique("user_metadata_thread_id_key").on(table.threadId),
  ],
);

export const supportTicket = pgTable(
  "support_ticket",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "support_ticket_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    platform: varchar({ length: 30 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    ticketId: bigint("ticket_id", { mode: "number" }).notNull(),
    status: varchar({ length: 20 }).notNull(),
    subject: varchar({ length: 500 }).notNull(),
    description: text().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    requesterId: bigint("requester_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    emailConfigId: bigint("email_config_id", { mode: "number" }),
    platformCreatedAt: timestamp("platform_created_at", {
      withTimezone: true,
      mode: "string",
    }),
    platformUpdatedAt: timestamp("platform_updated_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    index("support_tic_custome_b1ab40_idx").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    index("support_tic_platfor_507db3_idx").using(
      "btree",
      table.platform.asc().nullsLast().op("text_ops"),
    ),
    index("support_tic_status_363e60_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("support_tic_store_i_9bc370_idx").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    index("support_tic_thread__d6c413_idx").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.asc().nullsLast().op("uuid_ops"),
    ),
    index("support_tic_ticket__1d6a0f_idx").using(
      "btree",
      table.ticketId.asc().nullsLast().op("int8_ops"),
    ),
    index("support_ticket_customer_id_21b0e471").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    index("support_ticket_store_id_e4602dd4").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    index("support_ticket_thread_id_2978cb77").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [chatCustomer.id],
      name: "support_ticket_customer_id_21b0e471_fk_chat_customer_id",
    }),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "support_ticket_store_id_e4602dd4_fk_store_id",
    }),
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "support_ticket_thread_id_2978cb77_fk_chat_thread_id",
    }),
    unique("support_ticket_ticket_id_key").on(table.ticketId),
  ],
);

export const scrapeLinkslinks = pgTable(
  "_scrapeLinkslinks",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "_scrapeLinkslinks_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
    }),
    linkType: varchar("link_type").notNull(),
    url: varchar({ length: 200 }).notNull(),
    status: varchar({ length: 20 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }),
  },
  (table) => [
    index("_scrapeLinkslinks_store_id_8ce11e9b").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "_scrapeLinkslinks_store_id_8ce11e9b_fk_store_id",
    }),
  ],
);

export const knowledgeStorelibrarydocument = pgTable(
  "knowledge_storelibrarydocument",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "knowledge_storelibrarydocument_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    name: varchar({ length: 100 }).notNull(),
    type: varchar({ length: 100 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    size: bigint({ mode: "number" }).notNull(),
    status: varchar({ length: 255 }).notNull(),
    path: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("knowledge_storelibrarydocument_store_id_032910f7").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "knowledge_storelibrarydocument_store_id_032910f7_fk_store_id",
    }),
    check("knowledge_storelibrarydocument_size_check", sql`size >= 0`),
  ],
);

export const djangoSession = pgTable(
  "django_session",
  {
    sessionKey: varchar("session_key", { length: 40 }).primaryKey().notNull(),
    sessionData: text("session_data").notNull(),
    expireDate: timestamp("expire_date", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
  },
  (table) => [
    index("django_session_expire_date_a5c62663").using(
      "btree",
      table.expireDate.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("django_session_session_key_c0390e0f_like").using(
      "btree",
      table.sessionKey.asc().nullsLast().op("varchar_pattern_ops"),
    ),
  ],
);

export const supportTicketAttachment = pgTable(
  "support_ticket_attachment",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "support_ticket_attachment_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    status: varchar({ length: 20 }).notNull(),
    fileKey: varchar("file_key", { length: 1000 }),
    originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    fileSize: bigint("file_size", { mode: "number" }),
    uploadedByCustomer: boolean("uploaded_by_customer").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    threadId: uuid("thread_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    ticketId: bigint("ticket_id", { mode: "number" }),
  },
  (table) => [
    index("support_tic_created_2caaa6_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("support_tic_status_1e2e12_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("support_tic_thread__65f6a0_idx").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("support_tic_thread__f7d931_idx").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    index("support_tic_ticket__81dbb1_idx").using(
      "btree",
      table.ticketId.asc().nullsLast().op("int8_ops"),
    ),
    index("support_tic_ticket__86c4bd_idx").using(
      "btree",
      table.ticketId.asc().nullsLast().op("int8_ops"),
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("support_ticket_attachment_thread_id_5c94acfc").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    index("support_ticket_attachment_ticket_id_c9b2a72e").using(
      "btree",
      table.ticketId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "support_ticket_attachment_thread_id_5c94acfc_fk_chat_thread_id",
    }),
    foreignKey({
      columns: [table.ticketId],
      foreignColumns: [supportTicket.id],
      name: "support_ticket_attac_ticket_id_c9b2a72e_fk_support_t",
    }),
  ],
);
