const { Expo } = require('expo-server-sdk');
const fs = require('fs');
const path = require('path');

const expo = new Expo();
const SUBS_FILE = path.join(__dirname, '../data/subscriptions.json');

function loadSubscriptions() {
  try {
    if (fs.existsSync(SUBS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function saveSubscriptions(subs) {
  const dir = path.dirname(SUBS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
}

function addSubscription(sub) {
  const subs = loadSubscriptions();
  const idx = subs.findIndex((s) => s.expoPushToken === sub.expoPushToken);
  if (idx >= 0) {
    subs[idx] = sub;
  } else {
    subs.push(sub);
  }
  saveSubscriptions(subs);
}

function removeSubscription(expoPushToken) {
  const subs = loadSubscriptions().filter((s) => s.expoPushToken !== expoPushToken);
  saveSubscriptions(subs);
}

function outageMatchesSubscription(outage, sub) {
  if (!sub.types.includes(outage.type)) return false;
  if (outage.province !== sub.province) return false;
  if (sub.district && !outage.districts.includes(sub.district)) return false;
  if (sub.neighborhood && !outage.neighborhoods.includes(sub.neighborhood)) return false;
  return true;
}

function typeLabel(type) {
  const labels = { electricity: 'Elektrik', water: 'Su', gas: 'Doğalgaz' };
  return labels[type] || type;
}

async function sendForNewOutages(previous, current) {
  const prevIds = new Set((previous || []).map((o) => o.id));
  const newOutages = current.filter((o) => !prevIds.has(o.id));

  if (newOutages.length === 0) return;

  const subs = loadSubscriptions();
  if (subs.length === 0) return;

  const messages = [];

  for (const outage of newOutages) {
    for (const sub of subs) {
      if (!Expo.isExpoPushToken(sub.expoPushToken)) continue;
      if (!outageMatchesSubscription(outage, sub)) continue;

      const districtStr = outage.districts.slice(0, 3).join(', ');
      const timeStr = outage.endTime
        ? `Tahmini bitiş: ${new Date(outage.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
        : 'Bitiş saati belirsiz';

      messages.push({
        to: sub.expoPushToken,
        sound: 'default',
        title: `${typeLabel(outage.type)} Kesintisi - ${outage.province}`,
        body: `${districtStr} bölgesinde kesinti başladı. ${timeStr}`,
        data: { outageId: outage.id },
      });
    }
  }

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('[Notifier] Send error:', err.message);
    }
  }

  console.log(`[Notifier] Sent ${messages.length} notifications for ${newOutages.length} new outages`);
}

module.exports = { addSubscription, removeSubscription, sendForNewOutages };
