-- Internal Messenger MVP: channels, channel messages, DM threads + messages

CREATE TYPE "MessengerChannelType" AS ENUM ('PROJECT', 'GENERAL', 'ANNOUNCEMENT');

CREATE TABLE "messenger_channels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "MessengerChannelType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messenger_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messenger_channel_messages" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_name_snapshot" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messenger_channel_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messenger_channel_messages_channel_id_created_at_idx" ON "messenger_channel_messages" ("channel_id", "created_at");

ALTER TABLE "messenger_channel_messages" ADD CONSTRAINT "messenger_channel_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messenger_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_channel_messages" ADD CONSTRAINT "messenger_channel_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "messenger_direct_threads" (
    "id" TEXT NOT NULL,
    "participant_a_id" TEXT NOT NULL,
    "participant_b_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messenger_direct_threads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_direct_threads_participant_a_id_participant_b_id_key" ON "messenger_direct_threads" ("participant_a_id", "participant_b_id");

ALTER TABLE "messenger_direct_threads" ADD CONSTRAINT "messenger_direct_threads_participant_a_id_fkey" FOREIGN KEY ("participant_a_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_direct_threads" ADD CONSTRAINT "messenger_direct_threads_participant_b_id_fkey" FOREIGN KEY ("participant_b_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "messenger_direct_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_name_snapshot" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messenger_direct_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messenger_direct_messages_thread_id_created_at_idx" ON "messenger_direct_messages" ("thread_id", "created_at");

ALTER TABLE "messenger_direct_messages" ADD CONSTRAINT "messenger_direct_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "messenger_direct_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_direct_messages" ADD CONSTRAINT "messenger_direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
