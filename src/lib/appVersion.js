import { connectDB } from '@/lib/db';
import AppVersion from '@/models/AppVersion';

/**
 * App version and force-update settings, and the one rule that decides what
 * an installed build is told. The rule lives here, on the server, so changing
 * it never needs an app release.
 */

export const PLATFORMS = ['android', 'ios'];

/** Used until an admin has saved the platform once — nothing is announced. */
const DEFAULTS = {
  android: {
    storeUrl: 'https://play.google.com/store/apps/details?id=com.justiceland.care',
  },
  ios: { storeUrl: '' },
};

const COPY = {
  optionalTitle: 'Update available',
  optionalMessage: 'A new version of Justiceland is ready, with fixes and improvements.',
  forceTitle: 'Update required',
  forceMessage: 'This version is no longer supported. Please update to continue.',
};

/** Plain settings for one platform, with defaults filled in. */
function toSettings(platform, row) {
  return {
    platform,
    latestVersion: row?.latestVersion || '',
    latestBuild: row?.latestBuild || 0,
    minSupportedBuild: row?.minSupportedBuild || 0,
    optionalTitle: row?.optionalTitle || '',
    optionalMessage: row?.optionalMessage || '',
    forceTitle: row?.forceTitle || '',
    forceMessage: row?.forceMessage || '',
    storeUrl: row?.storeUrl || DEFAULTS[platform].storeUrl,
    updatedAt: row?.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    updatedBy: row?.updatedBy || '',
  };
}

export async function getAppVersionSettings(platform) {
  await connectDB();
  const row = await AppVersion.findOne({ platform }).lean();
  return toSettings(platform, row);
}

export async function getAllAppVersionSettings() {
  await connectDB();
  const rows = await AppVersion.find({}).lean();
  return PLATFORMS.map((p) => toSettings(p, rows.find((r) => r.platform === p)));
}

/**
 * What the installed `build` is told:
 *   build < minSupportedBuild → force
 *   build < latestBuild       → optional
 *   otherwise                 → none
 */
export function decideUpdate(settings, build) {
  const force = settings.minSupportedBuild > 0 && build < settings.minSupportedBuild;
  const optional = !force && settings.latestBuild > 0 && build < settings.latestBuild;
  const update = force ? 'force' : optional ? 'optional' : 'none';

  return {
    platform: settings.platform,
    update,
    latestVersion: settings.latestVersion,
    latestBuild: settings.latestBuild,
    minSupportedBuild: settings.minSupportedBuild,
    title:
      update === 'force' ? settings.forceTitle || COPY.forceTitle
        : update === 'optional' ? settings.optionalTitle || COPY.optionalTitle
          : '',
    message:
      update === 'force' ? settings.forceMessage || COPY.forceMessage
        : update === 'optional' ? settings.optionalMessage || COPY.optionalMessage
          : '',
    storeUrl: update === 'none' ? '' : settings.storeUrl,
  };
}

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const int = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

/**
 * Save one platform's settings from an admin request. Throws an Error with
 * `status` 400 and a message for anything that would mislead the app.
 */
export async function saveAppVersionSettings(body, adminEmail = '') {
  const bad = (message) => Object.assign(new Error(message), { status: 400 });

  const platform = String(body?.platform || '');
  if (!PLATFORMS.includes(platform)) throw bad('platform must be "android" or "ios".');

  const latestBuild = int(body.latestBuild);
  const minSupportedBuild = int(body.minSupportedBuild ?? 0);
  if (!Number.isInteger(latestBuild) || latestBuild < 0) throw bad('latestBuild must be a whole number (0 or more).');
  if (!Number.isInteger(minSupportedBuild) || minSupportedBuild < 0) {
    throw bad('minSupportedBuild must be a whole number (0 = force update off).');
  }
  // Would force everyone onto a build the store does not have yet.
  if (minSupportedBuild > latestBuild) {
    throw bad('minSupportedBuild cannot be greater than latestBuild — that would force an update to a version that does not exist yet.');
  }

  const storeUrl = clip(body.storeUrl, 300);
  if (storeUrl && !/^https:\/\/\S+$/i.test(storeUrl)) throw bad('storeUrl must be an https link.');

  const update = {
    latestVersion: clip(body.latestVersion, 30),
    latestBuild,
    minSupportedBuild,
    optionalTitle: clip(body.optionalTitle, 80),
    optionalMessage: clip(body.optionalMessage, 400),
    forceTitle: clip(body.forceTitle, 80),
    forceMessage: clip(body.forceMessage, 400),
    storeUrl,
    updatedBy: adminEmail,
  };

  await connectDB();
  const row = await AppVersion.findOneAndUpdate(
    { platform },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  ).lean();
  return toSettings(platform, row);
}
