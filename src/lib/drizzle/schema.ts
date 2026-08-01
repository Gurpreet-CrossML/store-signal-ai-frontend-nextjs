import {
  pgTable,
  unique,
  integer,
  varchar,
  index,
  foreignKey,
  bigint,
  timestamp,
  boolean,
  check,
  text,
  smallint,
  uuid,
  jsonb,
  uniqueIndex,
  doublePrecision,
  numeric,
  inet,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const djangoContentType = pgTable(
  "django_content_type",
  {
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
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

export const company = pgTable(
  "company",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "company_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    schemaName: varchar("schema_name", { length: 63 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    logo: varchar({ length: 255 }),
    email: varchar({ length: 254 }),
    phone: varchar({ length: 20 }),
    street: varchar({ length: 255 }),
    city: varchar({ length: 128 }),
    state: varchar({ length: 128 }),
    country: varchar({ length: 128 }),
    isActive: boolean("is_active").notNull(),
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
    index("company_name_5abe57d9_like").using(
      "btree",
      table.name.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("company_schema_name_09f104c8_like").using(
      "btree",
      table.schemaName.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    unique("company_schema_name_key").on(table.schemaName),
    unique("company_name_key").on(table.name),
  ],
);

export const companyDomain = pgTable(
  "company_domain",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "company_domain_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    domain: varchar({ length: 253 }).notNull(),
    isPrimary: boolean("is_primary").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("company_domain_domain_a41c83b2_like").using(
      "btree",
      table.domain.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("company_domain_is_primary_5a4983ec").using(
      "btree",
      table.isPrimary.asc().nullsLast().op("bool_ops"),
    ),
    index("company_domain_tenant_id_7b933fbc").using(
      "btree",
      table.tenantId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [company.id],
      name: "company_domain_tenant_id_7b933fbc_fk_company_id",
    }),
    unique("company_domain_domain_key").on(table.domain),
  ],
);

export const companyMembership = pgTable(
  "company_membership",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "company_membership_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
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
    companyId: bigint("company_id", { mode: "number" }).notNull(),
    userId: integer("user_id").notNull(),
  },
  (table) => [
    index("company_membership_company_id_9840e603").using(
      "btree",
      table.companyId.asc().nullsLast().op("int8_ops"),
    ),
    index("company_membership_user_id_21a9cb1c").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [company.id],
      name: "company_membership_company_id_9840e603_fk_company_id",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUser.id],
      name: "company_membership_user_id_21a9cb1c_fk_auth_user_id",
    }),
    unique("unique_user_company_membership").on(table.companyId, table.userId),
  ],
);

export const storeRegistry = pgTable(
  "store_registry",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "store_registry_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    code: varchar({ length: 255 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storePk: bigint("store_pk", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    companyId: bigint("company_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("store_registry_code_63f1a96a_like").using(
      "btree",
      table.code.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("store_registry_company_id_8c6eaa64").using(
      "btree",
      table.companyId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [company.id],
      name: "store_registry_company_id_8c6eaa64_fk_company_id",
    }),
    unique("store_registry_code_key").on(table.code),
    check("store_registry_store_pk_check", sql`store_pk >= 0`),
  ],
);

export const threadRegistry = pgTable(
  "thread_registry",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "thread_registry_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    threadId: uuid("thread_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    companyId: bigint("company_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("thread_registry_company_id_7576e8a9").using(
      "btree",
      table.companyId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [company.id],
      name: "thread_registry_company_id_7576e8a9_fk_company_id",
    }),
    unique("thread_registry_thread_id_key").on(table.threadId),
  ],
);

export const chatbotWidgetCustomization = pgTable(
  "chatbot_widget_customization",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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

export const storeFaqs = pgTable(
  "store_faqs",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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

export const store = pgTable(
  "store",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    defaultLanguage: varchar("default_language", { length: 20 }).notNull(),
    widgetKey: text("widget_key").notNull(),
    isFollowUpsAllowed: boolean("is_follow_ups_allowed").notNull(),
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

export const otpStore = pgTable("otp_store", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity({
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

export const storeCredentials = pgTable(
  "store_credentials",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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

export const chatCustomer = pgTable("chat_customer", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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

export const chatbotFeedback = pgTable(
  "chatbot_feedback",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    externalId: varchar("external_id", { length: 255 }),
    source: varchar({ length: 20 }).notNull(),
    chatHandler: varchar("chat_handler", { length: 10 }).notNull(),
    chatHandlerUserId: integer("chat_handler_user_id"),
  },
  (table) => [
    index("chat_thread_chat_handler_44f4c9ad").using(
      "btree",
      table.chatHandler.asc().nullsLast().op("text_ops"),
    ),
    index("chat_thread_chat_handler_44f4c9ad_like").using(
      "btree",
      table.chatHandler.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("chat_thread_chat_handler_user_id_b6c39021").using(
      "btree",
      table.chatHandlerUserId.asc().nullsLast().op("int4_ops"),
    ),
    index("chat_thread_customer_id_31f2879e").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    index("chat_thread_external_id_781a6db4").using(
      "btree",
      table.externalId.asc().nullsLast().op("text_ops"),
    ),
    index("chat_thread_external_id_781a6db4_like").using(
      "btree",
      table.externalId.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("chat_thread_store_id_b856f451").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    uniqueIndex("uniq_store_external_thread")
      .using(
        "btree",
        table.storeId.asc().nullsLast().op("text_ops"),
        table.externalId.asc().nullsLast().op("text_ops"),
      )
      .where(sql`(external_id IS NOT NULL)`),
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
    foreignKey({
      columns: [table.chatHandlerUserId],
      foreignColumns: [authUser.id],
      name: "chat_thread_chat_handler_user_id_b6c39021_fk_auth_user_id",
    }),
  ],
);

export const chatHistory = pgTable(
  "chat_history",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    workflow: varchar({ length: 100 }),
    message: text().notNull(),
    imageUrl: jsonb("image_url"),
    messagedById: integer("messaged_by_id"),
    totalCost: numeric("total_cost", { precision: 12, scale: 8 }).notNull(),
    totalInputTokens: integer("total_input_tokens").notNull(),
    totalOutputTokens: integer("total_output_tokens").notNull(),
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
    index("chat_history_messaged_by_id_3c647c76").using(
      "btree",
      table.messagedById.asc().nullsLast().op("int4_ops"),
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
    foreignKey({
      columns: [table.messagedById],
      foreignColumns: [authUser.id],
      name: "chat_history_messaged_by_id_3c647c76_fk_auth_user_id",
    }),
    check(
      "chat_history_total_input_tokens_check",
      sql`total_input_tokens >= 0`,
    ),
    check(
      "chat_history_total_output_tokens_check",
      sql`total_output_tokens >= 0`,
    ),
  ],
);

export const aiInsights = pgTable(
  "ai_insights",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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

export const storeAccess = pgTable(
  "store_access",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "store_access_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    level: varchar({ length: 10 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    grantedById: integer("granted_by_id"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
    userId: integer("user_id").notNull(),
  },
  (table) => [
    index("store_access_granted_by_id_d401d2b2").using(
      "btree",
      table.grantedById.asc().nullsLast().op("int4_ops"),
    ),
    index("store_access_store_id_1ab4524d").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    index("store_access_user_id_42bec867").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "store_access_store_id_1ab4524d_fk_store_id",
    }),
    foreignKey({
      columns: [table.grantedById],
      foreignColumns: [authUser.id],
      name: "store_access_granted_by_id_d401d2b2_fk_auth_user_id",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUser.id],
      name: "store_access_user_id_42bec867_fk_auth_user_id",
    }),
    unique("unique_user_store_access").on(table.storeId, table.userId),
  ],
);

export const fraudFlag = pgTable(
  "fraud_flag",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "fraud_flag_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    flagType: varchar("flag_type", { length: 30 }).notNull(),
    severity: varchar({ length: 10 }).notNull(),
    userMessage: text("user_message").notNull(),
    reason: varchar({ length: 500 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    chatMessageId: bigint("chat_message_id", { mode: "number" }),
    threadId: uuid("thread_id").notNull(),
  },
  (table) => [
    index("fraud_flag_chat_message_id_454a6d33").using(
      "btree",
      table.chatMessageId.asc().nullsLast().op("int8_ops"),
    ),
    index("fraud_flag_flag_ty_bf4569_idx").using(
      "btree",
      table.flagType.asc().nullsLast().op("text_ops"),
    ),
    index("fraud_flag_severit_271a2c_idx").using(
      "btree",
      table.severity.asc().nullsLast().op("text_ops"),
    ),
    index("fraud_flag_thread__f0e650_idx").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("fraud_flag_thread_id_f2c39240").using(
      "btree",
      table.threadId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.chatMessageId],
      foreignColumns: [chatHistory.id],
      name: "fraud_flag_chat_message_id_454a6d33_fk_chat_history_id",
    }),
    foreignKey({
      columns: [table.threadId],
      foreignColumns: [chatThread.id],
      name: "fraud_flag_thread_id_f2c39240_fk_chat_thread_id",
    }),
  ],
);

export const scrapeLinkslinks = pgTable(
  "_scrapeLinkslinks",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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

export const taggitTaggeditem = pgTable(
  "taggit_taggeditem",
  {
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "taggit_taggeditem_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 2147483647,
        cache: 1,
      }),
    objectId: integer("object_id").notNull(),
    contentTypeId: integer("content_type_id").notNull(),
    tagId: integer("tag_id").notNull(),
  },
  (table) => [
    index("taggit_tagg_content_8fc721_idx").using(
      "btree",
      table.contentTypeId.asc().nullsLast().op("int4_ops"),
      table.objectId.asc().nullsLast().op("int4_ops"),
    ),
    index("taggit_taggeditem_content_type_id_9957a03c").using(
      "btree",
      table.contentTypeId.asc().nullsLast().op("int4_ops"),
    ),
    index("taggit_taggeditem_object_id_e2d7d1df").using(
      "btree",
      table.objectId.asc().nullsLast().op("int4_ops"),
    ),
    index("taggit_taggeditem_tag_id_f4f5b767").using(
      "btree",
      table.tagId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.contentTypeId],
      foreignColumns: [djangoContentType.id],
      name: "taggit_taggeditem_content_type_id_9957a03c_fk_django_co",
    }),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [taggitTag.id],
      name: "taggit_taggeditem_tag_id_f4f5b767_fk_taggit_tag_id",
    }),
    unique(
      "taggit_taggeditem_content_type_id_object_id_tag_id_4bb97a8e_uni",
    ).on(table.objectId, table.contentTypeId, table.tagId),
  ],
);

export const taggitTag = pgTable(
  "taggit_tag",
  {
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "taggit_tag_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 2147483647,
        cache: 1,
      }),
    name: varchar({ length: 100 }).notNull(),
    slug: varchar({ length: 100 }).notNull(),
  },
  (table) => [
    index("taggit_tag_name_58eb2ed9_like").using(
      "btree",
      table.name.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("taggit_tag_slug_6be58b2c_like").using(
      "btree",
      table.slug.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    unique("taggit_tag_name_key").on(table.name),
    unique("taggit_tag_slug_key").on(table.slug),
  ],
);

export const supportTicket = pgTable(
  "support_ticket",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
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
    attachments: jsonb(),
    priority: varchar({ length: 10 }).notNull(),
    agentEmail: varchar("agent_email", { length: 254 }),
    agentName: varchar("agent_name", { length: 255 }),
    ticketUrl: varchar("ticket_url", { length: 500 }),
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

export const integrationCategory = pgTable("integration_category", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity({
      name: "integration_category_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
});

export const integration = pgTable(
  "integration",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "integration_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    name: varchar({ length: 255 }).notNull(),
    logo: varchar({ length: 100 }).notNull(),
    description: text().notNull(),
    isActive: boolean("is_active").notNull(),
    stepsForCreds: text("steps_for_creds").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    categoryId: bigint("category_id", { mode: "number" }),
  },
  (table) => [
    index("integration_category_id_7356fea4").using(
      "btree",
      table.categoryId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [integrationCategory.id],
      name: "integration_category_id_7356fea4_fk_integration_category_id",
    }),
  ],
);

export const integrationAttribute = pgTable(
  "integration_attribute",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "integration_attribute_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    name: varchar({ length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    type: varchar({ length: 20 }).notNull(),
    code: varchar({ length: 255 }).notNull(),
    isRequired: boolean("is_required").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    integrationId: bigint("integration_id", { mode: "number" }).notNull(),
    placeholder: varchar({ length: 255 }),
  },
  (table) => [
    index("integration_attribute_integration_id_accbd512").using(
      "btree",
      table.integrationId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.integrationId],
      foreignColumns: [integration.id],
      name: "integration_attribute_integration_id_accbd512_fk_integration_id",
    }),
  ],
);

export const neverSayRules = pgTable(
  "never_say_rules",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "never_say_rules_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    noHollowApologies: boolean("no_hollow_apologies").notNull(),
    neverRevealAiUnprompted: boolean("never_reveal_ai_unprompted").notNull(),
    doNotSayPhrases: jsonb("do_not_say_phrases").notNull(),
    forbiddenClaims: jsonb("forbidden_claims").notNull(),
    requiredLegalPhrases: jsonb("required_legal_phrases").notNull(),
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
      name: "never_say_rules_store_id_9293ed10_fk_store_id",
    }),
    unique("never_say_rules_store_id_key").on(table.storeId),
  ],
);

export const vocabulary = pgTable(
  "vocabulary",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "vocabulary_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    preferredPhrases: jsonb("preferred_phrases").notNull(),
    bannedWords: jsonb("banned_words").notNull(),
    signaturePhrases: jsonb("signature_phrases").notNull(),
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
      name: "vocabulary_store_id_599134c7_fk_store_id",
    }),
    unique("vocabulary_store_id_key").on(table.storeId),
  ],
);

export const personaIdentity = pgTable(
  "persona_identity",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "persona_identity_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    roleDescription: varchar("role_description", { length: 255 }).notNull(),
    selfReference: varchar("self_reference", { length: 10 }).notNull(),
    emailSignature: varchar("email_signature", { length: 255 }).notNull(),
    backstory: text().notNull(),
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
    name: varchar({ length: 100 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "persona_identity_store_id_591e4b25_fk_store_id",
    }),
    unique("persona_identity_store_id_key").on(table.storeId),
  ],
);

export const vocabularyWordReplacements = pgTable(
  "vocabulary_word_replacements",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "vocabulary_word_replacements_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    vocabularyId: bigint("vocabulary_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    wordreplacementId: bigint("wordreplacement_id", {
      mode: "number",
    }).notNull(),
  },
  (table) => [
    index("vocabulary_word_replacements_vocabulary_id_37a9c4c7").using(
      "btree",
      table.vocabularyId.asc().nullsLast().op("int8_ops"),
    ),
    index("vocabulary_word_replacements_wordreplacement_id_322e70a7").using(
      "btree",
      table.wordreplacementId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.vocabularyId],
      foreignColumns: [vocabulary.id],
      name: "vocabulary_word_repl_vocabulary_id_37a9c4c7_fk_vocabular",
    }),
    foreignKey({
      columns: [table.wordreplacementId],
      foreignColumns: [wordReplacement.id],
      name: "vocabulary_word_repl_wordreplacement_id_322e70a7_fk_word_repl",
    }),
    unique(
      "vocabulary_word_replacem_vocabulary_id_wordreplac_fee69a97_uniq",
    ).on(table.vocabularyId, table.wordreplacementId),
  ],
);

export const wordReplacement = pgTable("word_replacement", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity({
      name: "word_replacement_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
  sayWord: varchar("say_word", { length: 255 }).notNull(),
  replaceWord: varchar("replace_word", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
});

export const chatCustomerorder = pgTable(
  "chat_customerorder",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "chat_customerorder_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    orderId: varchar("order_id", { length: 100 }).notNull(),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    name: varchar({ length: 50 }).notNull(),
    confirmationNumber: varchar("confirmation_number", { length: 100 }),
    customerEmail: varchar("customer_email", { length: 254 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
    financialStatus: varchar("financial_status", { length: 50 }).notNull(),
    fulfillmentStatus: varchar("fulfillment_status", { length: 50 }),
    confirmed: boolean().notNull(),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
      mode: "string",
    }),
    cancelReason: varchar("cancel_reason", { length: 255 }).notNull(),
    statusHistory: jsonb("status_history"),
    currency: varchar({ length: 10 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    subtotalPrice: numeric("subtotal_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    totalTax: numeric("total_tax", { precision: 12, scale: 2 }).notNull(),
    totalDiscounts: numeric("total_discounts", {
      precision: 12,
      scale: 2,
    }).notNull(),
    totalShipping: numeric("total_shipping", {
      precision: 12,
      scale: 2,
    }).notNull(),
    totalPriceUsd: numeric("total_price_usd", { precision: 12, scale: 2 }),
    totalPaid: numeric("total_paid", { precision: 12, scale: 2 }).notNull(),
    totalOutstanding: numeric("total_outstanding", {
      precision: 12,
      scale: 2,
    }).notNull(),
    totalRefunded: numeric("total_refunded", {
      precision: 12,
      scale: 2,
    }).notNull(),
    discountCodes: jsonb("discount_codes"),
    gateway: varchar({ length: 100 }).notNull(),
    paymentDetails: jsonb("payment_details"),
    paymentTerms: jsonb("payment_terms"),
    shippingAddress: jsonb("shipping_address"),
    billingAddress: jsonb("billing_address"),
    shippingLines: jsonb("shipping_lines"),
    trackingCompany: varchar("tracking_company", { length: 100 }),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    trackingUrl: varchar("tracking_url", { length: 200 }),
    orderStatusUrl: varchar("order_status_url", { length: 200 }).notNull(),
    landingSite: varchar("landing_site", { length: 200 }).notNull(),
    tags: varchar({ length: 500 }).notNull(),
    note: text().notNull(),
    noteAttributes: jsonb("note_attributes"),
    items: jsonb(),
    fulfillments: jsonb(),
    refunds: jsonb(),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "string",
    }),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
    recordCreatedAt: timestamp("record_created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    recordUpdatedAt: timestamp("record_updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }).notNull(),
    shippingMethod: varchar("shipping_method", { length: 100 }),
  },
  (table) => [
    index("chat_custom_created_cbf142_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("chat_custom_custome_4d7ae4_idx").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    index("chat_custom_custome_f18652_idx").using(
      "btree",
      table.customerEmail.asc().nullsLast().op("text_ops"),
    ),
    index("chat_custom_financi_5df63e_idx").using(
      "btree",
      table.financialStatus.asc().nullsLast().op("text_ops"),
    ),
    index("chat_custom_fulfill_900a2e_idx").using(
      "btree",
      table.fulfillmentStatus.asc().nullsLast().op("text_ops"),
    ),
    index("chat_custom_order_n_be1dd8_idx").using(
      "btree",
      table.orderNumber.asc().nullsLast().op("text_ops"),
    ),
    index("chat_customerorder_customer_email_a4c8d820").using(
      "btree",
      table.customerEmail.asc().nullsLast().op("text_ops"),
    ),
    index("chat_customerorder_customer_email_a4c8d820_like").using(
      "btree",
      table.customerEmail.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("chat_customerorder_customer_id_23fe8bbb").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    index("chat_customerorder_order_id_c520d70b_like").using(
      "btree",
      table.orderId.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    index("chat_customerorder_order_number_bc81e209").using(
      "btree",
      table.orderNumber.asc().nullsLast().op("text_ops"),
    ),
    index("chat_customerorder_order_number_bc81e209_like").using(
      "btree",
      table.orderNumber.asc().nullsLast().op("varchar_pattern_ops"),
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [chatCustomer.id],
      name: "chat_customerorder_customer_id_23fe8bbb_fk_chat_customer_id",
    }),
    unique("chat_customerorder_order_id_key").on(table.orderId),
  ],
);

export const toneStyle = pgTable(
  "tone_style",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "tone_style_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    presetId: bigint("preset_id", { mode: "number" }).notNull(),
    warmth: smallint().notNull(),
    formality: smallint().notNull(),
    energy: smallint().notNull(),
    playfulness: smallint().notNull(),
    directness: smallint().notNull(),
    answerLength: varchar("answer_length", { length: 10 }).notNull(),
    regionalSpelling: varchar("regional_spelling", { length: 5 }).notNull(),
    useBulletPoints: boolean("use_bullet_points").notNull(),
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
    emojiPolicy: varchar("emoji_policy", { length: 10 }).notNull(),
    exclamationMarksPolicy: varchar("exclamation_marks_policy", {
      length: 10,
    }).notNull(),
  },
  (table) => [
    index("tone_style_preset_id_4a487003").using(
      "btree",
      table.presetId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "tone_style_store_id_b6e0aeaf_fk_store_id",
    }),
    unique("tone_style_store_id_key").on(table.storeId),
    check("tone_style_warmth_check", sql`warmth >= 0`),
    check("tone_style_formality_check", sql`formality >= 0`),
    check("tone_style_energy_check", sql`energy >= 0`),
    check("tone_style_playfulness_check", sql`playfulness >= 0`),
    check("tone_style_directness_check", sql`directness >= 0`),
  ],
);

export const storeIntegration = pgTable(
  "store_integration",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "store_integration_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
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
    integrationId: bigint("integration_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("store_integration_integration_id_9fe693af").using(
      "btree",
      table.integrationId.asc().nullsLast().op("int8_ops"),
    ),
    index("store_integration_store_id_38acbb75").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "store_integration_store_id_38acbb75_fk_store_id",
    }),
    unique("unique_store_integration").on(table.integrationId, table.storeId),
  ],
);

export const storeIntegrationAttribute = pgTable(
  "store_integration_attribute",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "store_integration_attribute_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    key: varchar({ length: 255 }).notNull(),
    value: text().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeIntegrationId: bigint("store_integration_id", {
      mode: "number",
    }).notNull(),
  },
  (table) => [
    index("store_integration_attribute_store_integration_id_1cf271b2").using(
      "btree",
      table.storeIntegrationId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeIntegrationId],
      foreignColumns: [storeIntegration.id],
      name: "store_integration_at_store_integration_id_1cf271b2_fk_store_int",
    }),
    unique("unique_store_integration_attribute").on(
      table.key,
      table.storeIntegrationId,
    ),
  ],
);

export const neverSayRulesPreset = pgTable("never_say_rules_preset", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity({
      name: "never_say_rules_preset_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
  doNotSayPhrases: jsonb("do_not_say_phrases").notNull(),
  forbiddenClaims: jsonb("forbidden_claims").notNull(),
  requiredLegalPhrases: jsonb("required_legal_phrases").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
});

export const tonePreset = pgTable(
  "tone_preset",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "tone_preset_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    name: varchar({ length: 100 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    icon: varchar({ length: 100 }),
    warmth: smallint().notNull(),
    formality: smallint().notNull(),
    energy: smallint().notNull(),
    playfulness: smallint().notNull(),
    directness: smallint().notNull(),
    previewQuestion: varchar("preview_question", { length: 255 }).notNull(),
    previewMessage: varchar("preview_message", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    check("tone_preset_warmth_check", sql`warmth >= 0`),
    check("tone_preset_formality_check", sql`formality >= 0`),
    check("tone_preset_energy_check", sql`energy >= 0`),
    check("tone_preset_playfulness_check", sql`playfulness >= 0`),
    check("tone_preset_directness_check", sql`directness >= 0`),
  ],
);

export const vocabularyPreset = pgTable("vocabulary_preset", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity({
      name: "vocabulary_preset_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
  preferredPhrases: jsonb("preferred_phrases").notNull(),
  bannedWords: jsonb("banned_words").notNull(),
  signaturePhrases: jsonb("signature_phrases").notNull(),
  wordReplacementPairs: jsonb("word_replacement_pairs").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
});

export const socialSubscription = pgTable(
  "social_subscription",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "social_subscription_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    provider: varchar({ length: 50 }).notNull(),
    externalUserId: varchar("external_user_id", { length: 255 }).notNull(),
    externalUserEmail: varchar("external_user_email", {
      length: 254,
    }).notNull(),
    externalUserName: varchar("external_user_name", { length: 255 }).notNull(),
    status: varchar({ length: 50 }).notNull(),
    scopes: jsonb().notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", {
      withTimezone: true,
      mode: "string",
    }),
    tokenRefreshedAt: timestamp("token_refreshed_at", {
      withTimezone: true,
      mode: "string",
    }),
    lastError: text("last_error").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    connectedById: integer("connected_by_id"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storeId: bigint("store_id", { mode: "number" }).notNull(),
    externalUserPictureUrl: varchar("external_user_picture_url", {
      length: 1000,
    }).notNull(),
  },
  (table) => [
    index("social_subscription_connected_by_id_d683f5ac").using(
      "btree",
      table.connectedById.asc().nullsLast().op("int4_ops"),
    ),
    index("social_subscription_store_id_b97ee9e2").using(
      "btree",
      table.storeId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.storeId],
      foreignColumns: [store.id],
      name: "social_subscription_store_id_b97ee9e2_fk_store_id",
    }),
    unique("uniq_subscription_provider_user").on(
      table.provider,
      table.externalUserId,
      table.storeId,
    ),
  ],
);

export const socialConnectedAccount = pgTable(
  "social_connected_account",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "social_connected_account_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    channelType: varchar("channel_type", { length: 50 }).notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    username: varchar({ length: 255 }).notNull(),
    profilePictureUrl: varchar("profile_picture_url", {
      length: 1000,
    }).notNull(),
    accessToken: text("access_token"),
    tokenExpiresAt: timestamp("token_expires_at", {
      withTimezone: true,
      mode: "string",
    }),
    webhookStatus: varchar("webhook_status", { length: 50 }).notNull(),
    subscribedFields: jsonb("subscribed_fields").notNull(),
    webhookSubscribedAt: timestamp("webhook_subscribed_at", {
      withTimezone: true,
      mode: "string",
    }),
    lastEventAt: timestamp("last_event_at", {
      withTimezone: true,
      mode: "string",
    }),
    lastError: text("last_error").notNull(),
    isActive: boolean("is_active").notNull(),
    metadata: jsonb().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    linkedAccountId: bigint("linked_account_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    subscriptionId: bigint("subscription_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("social_connected_account_linked_account_id_a6aa2c2c").using(
      "btree",
      table.linkedAccountId.asc().nullsLast().op("int8_ops"),
    ),
    index("social_connected_account_subscription_id_4b981dfd").using(
      "btree",
      table.subscriptionId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.subscriptionId],
      foreignColumns: [socialSubscription.id],
      name: "social_connected_acc_subscription_id_4b981dfd_fk_social_su",
    }),
    foreignKey({
      columns: [table.linkedAccountId],
      foreignColumns: [table.id],
      name: "social_connected_acc_linked_account_id_a6aa2c2c_fk_social_co",
    }),
    unique("uniq_account_channel_external").on(
      table.channelType,
      table.externalId,
      table.subscriptionId,
    ),
  ],
);

export const socialPost = pgTable(
  "social_post",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "social_post_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    channelType: varchar("channel_type", { length: 50 }).notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    content: text().notNull(),
    permalink: varchar({ length: 500 }).notNull(),
    mediaType: varchar("media_type", { length: 50 }).notNull(),
    likeCount: integer("like_count"),
    commentsCount: integer("comments_count").notNull(),
    countsSyncedAt: timestamp("counts_synced_at", {
      withTimezone: true,
      mode: "string",
    }),
    postedAt: timestamp("posted_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    lastActivityAt: timestamp("last_activity_at", {
      withTimezone: true,
      mode: "string",
    }),
    isPublished: boolean("is_published").notNull(),
    isHidden: boolean("is_hidden").notNull(),
    metadata: jsonb().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    accountId: bigint("account_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_post_account_posted").using(
      "btree",
      table.accountId.asc().nullsLast().op("int8_ops"),
      table.postedAt.desc().nullsFirst().op("int8_ops"),
    ),
    index("social_post_account_id_d44f0e06").using(
      "btree",
      table.accountId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [socialConnectedAccount.id],
      name: "social_post_account_id_d44f0e06_fk_social_connected_account_id",
    }),
    unique("uniq_post_account_external").on(table.externalId, table.accountId),
    check("social_post_like_count_check", sql`like_count >= 0`),
    check("social_post_comments_count_check", sql`comments_count >= 0`),
  ],
);

export const socialPostMedia = pgTable(
  "social_post_media",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "social_post_media_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    mediaType: varchar("media_type", { length: 50 }).notNull(),
    position: integer().notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    url: varchar({ length: 1000 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 1000 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    width: integer(),
    height: integer(),
    caption: text().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    postId: bigint("post_id", { mode: "number" }).notNull(),
  },
  (table) => [
    index("social_post_media_post_id_6cfb9bb3").using(
      "btree",
      table.postId.asc().nullsLast().op("int8_ops"),
    ),
    uniqueIndex("uniq_media_post_external")
      .using(
        "btree",
        table.postId.asc().nullsLast().op("int8_ops"),
        table.externalId.asc().nullsLast().op("int8_ops"),
      )
      .where(sql`(NOT ((external_id)::text = ''::text))`),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [socialPost.id],
      name: "social_post_media_post_id_6cfb9bb3_fk_social_post_id",
    }),
    check("social_post_media_position_check", sql`"position" >= 0`),
    check("social_post_media_width_check", sql`width >= 0`),
    check("social_post_media_height_check", sql`height >= 0`),
  ],
);

export const socialUser = pgTable(
  "social_user",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "social_user_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    username: varchar({ length: 255 }).notNull(),
    profilePictureUrl: varchar("profile_picture_url", {
      length: 1000,
    }).notNull(),
    metadata: jsonb().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }),
  },
  (table) => [
    index("social_user_account_id_0d28f18e").using(
      "btree",
      table.accountId.asc().nullsLast().op("int8_ops"),
    ),
    index("social_user_customer_id_217b2096").using(
      "btree",
      table.customerId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [socialConnectedAccount.id],
      name: "social_user_account_id_0d28f18e_fk_social_connected_account_id",
    }),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [chatCustomer.id],
      name: "social_user_customer_id_217b2096_fk_chat_customer_id",
    }),
    unique("uniq_social_user_account_external").on(
      table.externalId,
      table.accountId,
    ),
  ],
);

export const socialMessage = pgTable(
  "social_message",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "social_message_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    externalMessageId: varchar("external_message_id", {
      length: 255,
    }).notNull(),
    senderType: varchar("sender_type", { length: 50 }).notNull(),
    messageDirection: varchar("message_direction", { length: 50 }).notNull(),
    messageType: varchar("message_type", { length: 50 }).notNull(),
    content: text().notNull(),
    likeCount: integer("like_count").notNull(),
    isHidden: boolean("is_hidden").notNull(),
    isDeleted: boolean("is_deleted").notNull(),
    externalCreatedAt: timestamp("external_created_at", {
      withTimezone: true,
      mode: "string",
    }),
    metadata: jsonb().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    agentId: integer("agent_id"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    parentMessageId: bigint("parent_message_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    postId: bigint("post_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    socialUserId: bigint("social_user_id", { mode: "number" }),
  },
  (table) => [
    index("idx_msg_conversation").using(
      "btree",
      table.accountId.asc().nullsLast().op("int8_ops"),
      table.socialUserId.asc().nullsLast().op("timestamptz_ops"),
      table.externalCreatedAt.desc().nullsFirst().op("timestamptz_ops"),
    ),
    index("idx_msg_post_created").using(
      "btree",
      table.postId.asc().nullsLast().op("int8_ops"),
      table.externalCreatedAt.desc().nullsFirst().op("timestamptz_ops"),
    ),
    index("social_message_account_id_ded70efc").using(
      "btree",
      table.accountId.asc().nullsLast().op("int8_ops"),
    ),
    index("social_message_agent_id_689dee07").using(
      "btree",
      table.agentId.asc().nullsLast().op("int4_ops"),
    ),
    index("social_message_parent_message_id_a4ff1cad").using(
      "btree",
      table.parentMessageId.asc().nullsLast().op("int8_ops"),
    ),
    index("social_message_post_id_d1b8f3a8").using(
      "btree",
      table.postId.asc().nullsLast().op("int8_ops"),
    ),
    index("social_message_social_user_id_668e4b36").using(
      "btree",
      table.socialUserId.asc().nullsLast().op("int8_ops"),
    ),
    uniqueIndex("uniq_message_account_external")
      .using(
        "btree",
        table.accountId.asc().nullsLast().op("text_ops"),
        table.externalMessageId.asc().nullsLast().op("text_ops"),
      )
      .where(sql`(NOT ((external_message_id)::text = ''::text))`),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [socialConnectedAccount.id],
      name: "social_message_account_id_ded70efc_fk_social_co",
    }),
    foreignKey({
      columns: [table.agentId],
      foreignColumns: [authUser.id],
      name: "social_message_agent_id_689dee07_fk_auth_user_id",
    }),
    foreignKey({
      columns: [table.parentMessageId],
      foreignColumns: [table.id],
      name: "social_message_parent_message_id_a4ff1cad_fk_social_message_id",
    }),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [socialPost.id],
      name: "social_message_post_id_d1b8f3a8_fk_social_post_id",
    }),
    foreignKey({
      columns: [table.socialUserId],
      foreignColumns: [socialUser.id],
      name: "social_message_social_user_id_668e4b36_fk_social_user_id",
    }),
    check("social_message_like_count_check", sql`like_count >= 0`),
    check(
      "chk_comment_requires_post",
      sql`(NOT ((message_type)::text = 'comment'::text)) OR (post_id IS NOT NULL)`,
    ),
  ],
);

export const socialWebhookEvent = pgTable(
  "social_webhook_event",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "social_webhook_event_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    channelType: varchar("channel_type", { length: 50 }).notNull(),
    externalEventId: varchar("external_event_id", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    payload: jsonb().notNull(),
    status: varchar({ length: 50 }).notNull(),
    error: text().notNull(),
    processedAt: timestamp("processed_at", {
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
    accountId: bigint("account_id", { mode: "number" }),
  },
  (table) => [
    index("idx_webhook_event_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("social_webhook_event_account_id_619677e6").using(
      "btree",
      table.accountId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [socialConnectedAccount.id],
      name: "social_webhook_event_account_id_619677e6_fk_social_co",
    }),
    unique("uniq_event_channel_external").on(
      table.channelType,
      table.externalEventId,
    ),
  ],
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "ai_usage_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    workflowId: text("workflow_id").notNull(),
    chatHistoryJson: jsonb("chat_history_json").notNull(),
    agentId: text("agent_id").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cost: numeric({ precision: 12, scale: 8 }).notNull(),
    latency: doublePrecision().notNull(),
    model: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    chatHistoryId: bigint("chat_history_id", { mode: "number" }),
    totalTokens: integer("total_tokens").notNull(),
  },
  (table) => [
    index("ai_usage_agent_i_231f3b_idx").using(
      "btree",
      table.agentId.asc().nullsLast().op("text_ops"),
    ),
    index("ai_usage_chat_history_id_fb9e09ec").using(
      "btree",
      table.chatHistoryId.asc().nullsLast().op("int8_ops"),
    ),
    index("ai_usage_created_ee7daf_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("ai_usage_model_85b96e_idx").using(
      "btree",
      table.model.asc().nullsLast().op("text_ops"),
    ),
    index("ai_usage_workflo_26f199_idx").using(
      "btree",
      table.workflowId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.chatHistoryId],
      foreignColumns: [chatHistory.id],
      name: "ai_usage_chat_history_id_fb9e09ec_fk_chat_history_id",
    }),
    check("ai_usage_input_tokens_check", sql`input_tokens >= 0`),
    check("ai_usage_output_tokens_check", sql`output_tokens >= 0`),
    check("ai_usage_total_tokens_check", sql`total_tokens >= 0`),
  ],
);
