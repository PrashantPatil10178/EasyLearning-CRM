import { db } from "./src/server/db";

async function main() {
  try {
    console.log("Deleting all leads...");
    const { count } = await db.lead.deleteMany({});
    console.log(`Deleted ${count} leads.`);
  } catch (e) {
    console.error("Error deleting leads:", e);
  }
}

main();
