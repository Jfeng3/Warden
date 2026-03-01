import "dotenv/config";
import { createSchedule, listSchedules, removeSchedule } from "../src/queue.js";
import { upsertSchedule } from "../src/db.js";

// Define your cron schedules here
const SCHEDULES = [
  {
    name: "daily-review",
    cron: "0 9 * * *", // 9 AM daily
    prompt: "Review my GitHub notifications and summarize any important updates.",
    context: { source: "scheduled" },
  },
  // Add more schedules as needed
];

async function setup() {
  console.log("Setting up QStash schedules...\n");

  // List existing schedules
  const existing = await listSchedules();
  console.log(`Found ${existing.length} existing schedule(s) in QStash`);

  // Remove all existing schedules
  for (const schedule of existing) {
    console.log(`  Removing: ${schedule.scheduleId}`);
    await removeSchedule(schedule.scheduleId);
  }

  // Create new schedules
  for (const schedule of SCHEDULES) {
    console.log(`\nCreating schedule: ${schedule.name} (${schedule.cron})`);
    const messageId = await createSchedule(schedule);
    console.log(`  QStash message ID: ${messageId}`);

    // Mirror to Supabase
    await upsertSchedule({
      qstash_schedule_id: messageId,
      name: schedule.name,
      cron: schedule.cron,
      prompt: schedule.prompt,
      context: schedule.context,
    });
    console.log(`  Mirrored to Supabase`);
  }

  console.log("\nDone!");
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
