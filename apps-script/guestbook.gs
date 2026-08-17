/**
 * Guest-registration (kniha hostů) Web App backend.
 * =================================================
 * Receives a STRUCTURED JSON payload from _includes/guestbook-form.html and
 * appends one row per guest to the existing sheet (gid 16871345), keeping the
 * same columns, formulas and notification email as the old Google Form flow.
 *
 * The target spreadsheet is opened by key (SPREADSHEET_ID), so this script does
 * NOT need to be container-bound to it — it can live as a standalone project.
 * Set SPREADSHEET_ID below before deploying.
 *
 * DEPLOY: Apps Script editor → Deploy → New deployment → type "Web app",
 *   Execute as: Me, Who has access: Anyone. Copy the /exec URL into
 *   _config.yml → guestbook_script_url.
 *
 * This file is excluded from the Jekyll build (see _config.yml exclude).
 */

// --- Config ---------------------------------------------------------------
var SPREADSHEET_ID = '';                        // target spreadsheet key (from its URL: /d/<ID>/edit)
var SHEET_GID = 16871345;                       // target tab (gid) within that spreadsheet
var NOTIFY_TO = 'chaloupkapodlipou@gmail.com';  // notification recipient
var CZECH_VALUE = 'Czech Republic';             // citizenship value that marks a domestic guest
var MAX_GUESTS = 50;                            // reject oversized payloads (spam / execution-limit guard)

/**
 * Returns the sheet (tab) whose numeric gid matches, by scanning every sheet
 * in the spreadsheet and comparing each one's getSheetId(). This mirrors the
 * gid you see in a sheet's URL (#gid=...) and is stable across renames, unlike
 * getSheetByName. Throws if no tab has the given gid.
 */
function getSheetByGid_(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) return sheets[i];
  }
  throw new Error('Sheet with gid ' + gid + ' not found');
}

// Wrap any object as a JSON HTTP response (Web Apps can only return text/blob).
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Entry point ----------------------------------------------------------
// Called by Apps Script for every POST to the /exec URL. `e.parameter.data`
// holds the JSON payload sent by the guestbook form.
function doPost(e) {
  // Serialise concurrent submissions so appendRow + getLastRow below always
  // refer to the same row (see file header). Wait up to 30s for the lock.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    // Log the full incoming request so any bad submission can be reproduced
    // from the Apps Script execution logs (Executions / Stackdriver).
    console.log('doPost called; e=' + JSON.stringify(e));

    // Parse and validate the incoming payload.
    var raw = (e && e.parameter && e.parameter.data) || '';
    console.log('raw payload: ' + raw);
    var data = JSON.parse(raw);

    var checkin = parseDate_(data.checkin);
    var checkout = parseDate_(data.checkout);
    var guests = Array.isArray(data.guests) ? data.guests : [];
    console.log('parsed: checkin=' + checkin + ', checkout=' + checkout +
                ', guests=' + guests.length);

    if (!checkin || !checkout || !guests.length) {
      console.warn('Rejected: missing dates or guests');
      return jsonOut_({ status: 'error', message: 'Missing dates or guests' });
    }
    if (guests.length > MAX_GUESTS) {
      console.warn('Rejected: too many guests (' + guests.length + ')');
      return jsonOut_({ status: 'error', message: 'Too many guests' });
    }

    // Open the target spreadsheet by key so the script need not be bound to it.
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = getSheetByGid_(ss, SHEET_GID);
    var timestamp = new Date();  // one shared submission time for all rows

    var rows = [];       // one A–N array per guest, written in a single setValues
    var emailRows = [];  // HTML <tr> per guest, assembled for the notification

    guests.forEach(function (g) {
      // Normalise every field to a trimmed string; missing keys become ''.
      var firstName = String(g.first_name || '').trim();
      var lastName = String(g.last_name || '').trim();
      var bdate = parseDate_(g.bdate);
      var citizenship = String(g.citizenship || '').trim();
      var passport = String(g.passport || '').trim();
      var address = String(g.address || '').trim();
      // Column A flags a domestic guest (no foreign-guest reporting needed).
      var isCompleted = (citizenship === CZECH_VALUE);

      // Column layout A–N (must match the existing sheet):
      // [isCompleted, checkin, checkout, daysFormula(D), lname(E), fname(F),
      //  bdate(G), isChildFormula(H), flagFormula(I), cit(J), IDnum(K),
      //  address(L), (empty M), timestamp(N)]
      // Formula columns (D, H, I) are left blank here and filled in below once
      // the row numbers are known. Free-text fields go through cell_() to block
      // formula injection.
      rows.push([
        isCompleted, checkin, checkout, '', cell_(lastName), cell_(firstName),
        bdate, '', '', cell_(citizenship), cell_(passport), cell_(address), '', timestamp
      ]);

      emailRows.push(
        '<tr>' +
        '<td style="padding:4px 8px;border:1px solid #ddd;">' + esc_(firstName + ' ' + lastName) + '</td>' +
        '<td style="padding:4px 8px;border:1px solid #ddd;">' + esc_(fmtDate_(bdate)) + '</td>' +
        '<td style="padding:4px 8px;border:1px solid #ddd;">' + esc_(citizenship) + '</td>' +
        '<td style="padding:4px 8px;border:1px solid #ddd;">' + esc_(passport) + '</td>' +
        '<td style="padding:4px 8px;border:1px solid #ddd;">' + esc_(address) + '</td>' +
        '</tr>'
      );
    });

    // --- Write all rows in ONE atomic setValues -----------------------------
    // Single write (vs. appendRow per guest) so a mid-loop failure can't leave a
    // partially-recorded party that the guest would then re-submit → duplicates.
    var startRow = sheet.getLastRow() + 1;  // first empty row (lock prevents interleave)
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

    // Derived-value formulas, now that the row numbers are fixed.
    for (var i = 0; i < rows.length; i++) {
      var r = startRow + i;
      // D: nights of stay = checkout − checkin.
      sheet.getRange(r, 4).setFormula('=C' + r + '-B' + r);
      // H: mark the guest as a child if under 18 at check-out.
      sheet.getRange(r, 8).setFormula('=IF(DATEDIF(G' + r + ',C' + r + ',"Y")<18,"— DÍTĚ —","")');
      // I: render the citizenship country's flag image from the country name.
      sheet.getRange(r, 9).setFormula(
        '=IMAGE("https://www.sciencekids.co.nz/images/pictures/flags680/"&ENCODEURL(SUBSTITUTE(J' +
        r + '," ","_"))&".jpg",2)'
      );
    }
    console.log(rows.length + ' guest row(s) written starting at row ' + startRow);

    // --- Notify -------------------------------------------------------------
    // Isolated so a mail failure (e.g. daily quota) does NOT fail the request:
    // the rows are already saved and are the source of truth. We report success
    // regardless, and log any send failure for follow-up.
    try {
      sendNotification_(checkin, checkout, emailRows, timestamp);
      console.log('Notification email sent to ' + NOTIFY_TO);
    } catch (mailErr) {
      console.error('Rows saved but notification email failed: ' + mailErr);
    }

    console.log('doPost success: ' + guests.length + ' guest(s) recorded');
    return jsonOut_({ status: 'success' });
  } catch (err) {
    console.error(err);  // full detail stays server-side (Apps Script logs)
    return jsonOut_({ status: 'error', message: 'Server error' });
  } finally {
    // Only release if we actually acquired it — waitLock() may have thrown.
    if (lock.hasLock()) lock.releaseLock();
  }
}

// --- Helpers --------------------------------------------------------------
/**
 * Parses a date string in ISO format (YYYY-MM-DD) and returns a Date object.
 * Returns null if the input is invalid or cannot be parsed.
 */
function parseDate_(iso) {
  if (!iso) return null;
  var p = String(iso).split('-');
  if (p.length !== 3) return null;
  var y = Number(p[0]), m = Number(p[1]), day = Number(p[2]);
  if (!(y > 0) || !(m >= 1 && m <= 12) || !(day >= 1 && day <= 31)) return null;
  var d = new Date(y, m - 1, day);
  if (isNaN(d.getTime())) return null;
  // Reject rolled-over dates (e.g. 2026-02-31 -> Mar 3): the parts must survive.
  if (d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) return null;
  return d;
}

/**
 * Guards against spreadsheet formula injection: a cell string beginning with
 * =, +, -, or @ is interpreted as a live formula by appendRow/setValue, so
 * prefix such untrusted values with a literal apostrophe to force plain text.
 */
function cell_(s) {
  s = String(s == null ? '' : s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// Format a Date as Czech "d. M. yyyy" for display in the email; '' for null.
function fmtDate_(d) {
  if (!d) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'd. M. yyyy');
}

// Escape a string for safe insertion as HTML text in the notification email.
function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Build and send the host notification email listing every guest in the party.
function sendNotification_(checkin, checkout, emailRows, timestamp) {
  var subject = 'Kniha hostů — nová registrace (' + fmtDate_(checkin) + ' – ' + fmtDate_(checkout) + ')';
  var body =
    '<div style="font-family:Arial,sans-serif;color:#333;">' +
    '<h2 style="color:#7a6b52;">Nová registrace hostů</h2>' +
    '<p><strong>Termín pobytu:</strong> ' + esc_(fmtDate_(checkin)) + ' – ' + esc_(fmtDate_(checkout)) + '</p>' +
    '<table style="border-collapse:collapse;font-size:14px;">' +
    '<thead><tr style="background:#f3efe7;">' +
    '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Jméno</th>' +
    '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Narození</th>' +
    '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Občanství</th>' +
    '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Doklad</th>' +
    '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Adresa</th>' +
    '</tr></thead><tbody>' + emailRows.join('') + '</tbody></table>' +
    '<p style="color:#999;font-size:12px;margin-top:16px;">Odesláno ' + esc_(fmtDate_(timestamp)) + '</p>' +
    '</div>';

  MailApp.sendEmail({ to: NOTIFY_TO, subject: subject, htmlBody: body });
}

// --- Manual test (run in the editor) -------------------------------------
// Feeds doPost a sample payload so you can verify the sheet write + email
// from the Apps Script editor without submitting the real form.
function test_doPost() {
  var mock = {
    parameter: {
      data: JSON.stringify({
        checkin: '2026-09-01',
        checkout: '2026-09-05',
        guests: [
          { first_name: 'Jan', last_name: 'Novák', bdate: '1985-04-12',
            citizenship: 'Czech Republic', passport: '123456789', address: 'Praha 1, Česko' },
          { first_name: 'Anna', last_name: 'Schmidt', bdate: '2015-06-30',
            citizenship: 'Germany', passport: 'C01X00T47', address: 'Berlin, Germany' }
        ]
      })
    }
  };
  Logger.log(doPost(mock).getContent());
}
