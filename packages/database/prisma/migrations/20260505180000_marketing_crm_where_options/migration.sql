-- CRM "Where" dictionary for Marketing attribution (editable in Marketing Settings).

CREATE TABLE "marketing_crm_where_options" (
    "channel" "MarketingChannelEnum" NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_crm_where_options_pkey" PRIMARY KEY ("channel")
);

INSERT INTO "marketing_crm_where_options" ("channel", "label", "sort_order", "is_active", "created_at", "updated_at")
VALUES
    ('SMM', 'SMM', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('WEBSITE', 'Website', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('LIST_AM', 'List.am', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('GOOGLE_ADS', 'Google Ads', 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('META_ADS', 'Meta Ads', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CONTENT', 'Content Marketing', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SEO', 'SEO', 70, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('OFFLINE', 'Offline', 80, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('OTHER', 'Other', 90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
