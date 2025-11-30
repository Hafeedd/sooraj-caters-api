// services/notificationScheduler.js
import schedule from "node-schedule";
import webpush from "web-push";
import { Menu } from "../models/Menu.js";
import dayjs from "dayjs";
import { mailEventNotification } from "./mail/mailEventNotification.js";

// Store active jobs in memory
const activeJobs = new Map();

async function scheduleMenuNotification(menu) {
  // Cancel existing job if this is an update
  // console.log(activeJobs)
  if (activeJobs.has(menu._id.toString())) {
    activeJobs.get(menu._id.toString()).cancel();
    activeJobs.delete(menu._id.toString());
  }
  if (menu.menuDate === null || menu.menuDate === undefined) {
    return;
  }
  // Schedule new job
  const date = new Date(menu.menuDate);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date string");
  }

  date.setDate(date.getDate() - 2);
  let notifyDate = date;
  notifyDate.setHours(6, 0, 0, 0);

  const now = new Date();
  now.setDate(now.getDate() - 2);
  if (notifyDate < now) return;

  const job = schedule.scheduleJob(notifyDate, async () => {
    try {
      console.log("job running");
      const freshMenu = await Menu.findById(menu._id).populate("parentId");
      if (!freshMenu || freshMenu.notified) return;

      if (freshMenu.parentId.pushSubscription) {
        await sendPushNotification(
          freshMenu.parentId.pushSubscription,
          `Upcoming Function: ${freshMenu.menuName}
coming in 2 days (${dayjs(freshMenu.menuDate).format("DD-MM-YYYY")})`
        );

        mailEventNotification(freshMenu.parentId._id, freshMenu.menuDate);
      }
      freshMenu.notified = true;
      await freshMenu.save();
    } catch (error) {
      console.error(`Failed to send notification for menu ${menu._id}:`, error);
    } finally {
      activeJobs.delete(menu._id.toString());
    }
  });

  console.log(job?.name, "scheduled for", notifyDate);

  // Store job reference
  if (job) activeJobs.set(menu._id.toString(), job);

  // Update menu with job ID
  menu.jobId = menu._id.toString();
  await menu.save();
}

function cancelMenuNotification(menuId) {
  if (activeJobs.has(menuId)) {
    activeJobs.get(menuId).cancel();
    activeJobs.delete(menuId);
  }
}

async function sendPushNotification(subscription, title, body) {
  const payload = JSON.stringify({ title, body });
  await webpush.sendNotification(subscription, payload);
}

// Load existing menus on startup
async function initializeScheduler() {
  const futureMenus = await Menu.find({
    menuDate: { $gt: new Date() },
    notified: false,
  });

  for (const menu of futureMenus) {
    await scheduleMenuNotification(menu);
  }
}

export {
  scheduleMenuNotification,
  cancelMenuNotification,
  initializeScheduler,
};
