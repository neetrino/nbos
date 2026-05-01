-- Per-employee read cursors for internal messenger (unread counts)

CREATE TABLE "messenger_channel_read_states" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "messenger_channel_read_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_channel_read_states_channel_id_employee_id_key" ON "messenger_channel_read_states" ("channel_id", "employee_id");

CREATE INDEX "messenger_channel_read_states_employee_id_idx" ON "messenger_channel_read_states" ("employee_id");

ALTER TABLE "messenger_channel_read_states" ADD CONSTRAINT "messenger_channel_read_states_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messenger_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_channel_read_states" ADD CONSTRAINT "messenger_channel_read_states_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "messenger_direct_thread_read_states" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "messenger_direct_thread_read_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_direct_thread_read_states_thread_id_employee_id_key" ON "messenger_direct_thread_read_states" ("thread_id", "employee_id");

CREATE INDEX "messenger_direct_thread_read_states_employee_id_idx" ON "messenger_direct_thread_read_states" ("employee_id");

ALTER TABLE "messenger_direct_thread_read_states" ADD CONSTRAINT "messenger_direct_thread_read_states_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "messenger_direct_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_direct_thread_read_states" ADD CONSTRAINT "messenger_direct_thread_read_states_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
