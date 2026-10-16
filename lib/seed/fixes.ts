// What each defect template needs from a model, and the fix that goes with it.
// DT_FIX lines up with DT in templates.ts, one entry per defect template: the
// generator files a defect only on a model with the capabilities it needs, and
// a bug-fix review for that defect gets this title and diff. In diffs, "{m}" is
// the model in lower case without its prefix ("c3150fr").

import type { Cap } from '../products';
import { FEAT, FT, LOC, PERF } from './templates';

export interface Fix {
  /** Title for Korean authors; English authors use en. */
  ko?: string;
  en: string;
  path: string;
  lines: string[];
}
interface DtExtra {
  comp: string;
  needs: Cap[];
  fix: Fix;
}

const ft = (comp: string) => ({ path: FT[comp][0], lines: FT[comp][1] });

export const DT_FIX: DtExtra[] = [
  // ---- Print Engine ----
  { comp: 'Print Engine', needs: [], fix: { ko: '저온 환경 정착 온도 보정 테이블 수정', en: 'Raise the fuser warm-up margin in cold rooms', ...ft('Print Engine') } },
  {
    comp: 'Print Engine', needs: [], fix: {
      en: 'Compensate drum wear in halftone screening after 20k pages', path: 'engine/imaging/halftone.c',
      lines: ['@@ -133,6 +133,9 @@ static void halftone_apply_profile(engine_t *e)', ' \tconst screen_t *s = e->screen;', '+\t/* Drum wear shows up as 94 mm banding; correct the screen gain past 20k pages. */', '+\tif (e->counter.pages > DRUM_WEAR_PAGES)', '+\t\tscreen_set_gain(s, drum_wear_gain(e->counter.pages));', ' \thalftone_load(s);']
    }
  },
  {
    comp: 'Print Engine', needs: [], fix: {
      ko: '봉투 모드 정착 압력 해제 시점 수정', en: 'Open the fuser nip earlier for C5 envelopes', path: 'engine/fuser/media_profile.c',
      lines: ['@@ -58,7 +58,8 @@ static const media_profile_t envelope = {', ' \t.speed_pct = 70,', '-\t.nip_release_mm = 0,', '+\t/* Open the nip before the trailing edge so C5 envelopes do not crease */', '+\t.nip_release_mm = 12,', ' \t.target_temp = 175,']
    }
  },
  {
    comp: 'Print Engine', needs: [], fix: {
      en: 'Adjust transfer bias for heavy media', path: 'engine/transfer/bias_table.c',
      lines: ['@@ -41,7 +41,8 @@ static const bias_entry_t bias_thick[] = {', '-\t{ MEDIA_THICK, 163, 1450 },', '+\t/* 1450 V leaves a ghost 75 mm down on 163 g/m2 stock */', '+\t{ MEDIA_THICK, 163, 1320 },', ' \t{ MEDIA_THICK, 176, 1500 },']
    }
  },
  {
    comp: 'Print Engine', needs: [], fix: {
      ko: '메인 모터 과열 시 정지 대신 감속 운전', en: 'Slow the main motor instead of stopping on a thermal warning', path: 'engine/motor/main_motor.c',
      lines: ['@@ -210,6 +210,10 @@ static void motor_check_thermal(motor_t *m)', ' \tint t = thermistor_read(m->sensor);', '+\tif (t > MOTOR_WARN_C && t <= MOTOR_LIMIT_C) {', '+\t\tmotor_set_speed(m, MOTOR_SPEED_REDUCED);', '+\t\treturn;', '+\t}', ' \tif (t > MOTOR_WARN_C)', ' \t\tengine_raise(m->eng, ERR_MOTOR_OVERHEAT);']
    }
  },
  {
    comp: 'Print Engine', needs: ['office'], fix: {
      en: 'Retune Tray 2 registration timing for A5', path: 'engine/feed/tray2_feed.c',
      lines: ['@@ -77,7 +77,10 @@ static int tray2_regi_delay(const paper_t *p)', '-\treturn REGI_DELAY_MS;', '+\t/* Short sheets reach the registration roller early; hold them longer to deskew */', '+\tif (p->length_mm < 215)', '+\t\treturn REGI_DELAY_MS + 18;', '+\treturn REGI_DELAY_MS;']
    }
  },
  // ---- Scanner / ADF ----
  { comp: 'Scanner / ADF', needs: ['scan'], fix: { ko: 'ADF 급지 센서 판정 로직 수정', en: 'Raise an error when the ADF detects a multi-feed', ...ft('Scanner / ADF') } },
  {
    comp: 'Scanner / ADF', needs: ['scan'], fix: {
      en: 'Split scan-to-email attachments over the SMTP size limit', path: 'scan/send/scan2email.c',
      lines: ['@@ -164,7 +164,10 @@ int scan2email_send(job_t *j, const smtp_cfg_t *c)', ' \tsize_t sz = job_output_size(j);', '-\treturn smtp_send(c, j->out, sz);', '+\tif (sz > c->max_msg_size)', '+\t\treturn scan2email_send_split(j, c, c->max_msg_size);', '+\treturn smtp_send(c, j->out, sz);']
    }
  },
  {
    comp: 'Scanner / ADF', needs: ['scan'], fix: {
      ko: '컬러 스캔 적색 영역 채도 보정', en: 'Correct red saturation in the color scan table', path: 'scan/color/scan_lut.c',
      lines: ['@@ -22,7 +22,7 @@ static const uint8_t sat_gain[HUE_BINS] = {', '-\t/* red */ 92, 94, 96,', '+\t/* red */ 104, 106, 104,', ' \t/* yellow */ 100, 100, 100,']
    }
  },
  {
    comp: 'Scanner / ADF', needs: ['scan'], fix: {
      en: 'Negotiate SMB2 signing for scan destinations', path: 'scan/send/smb_client.c',
      lines: ['@@ -98,6 +98,8 @@ static int smb_session_setup(smb_conn_t *c)', ' \tsmb_req_t *r = smb_new_req(c, SMB2_SESSION_SETUP);', '+\tif (c->srv_caps & SMB2_SIGNING_REQUIRED)', '+\t\tr->flags |= SMB2_FLAGS_SIGNED;', ' \treturn smb_send(c, r);']
    }
  },
  {
    comp: 'Scanner / ADF', needs: ['scan', 'office'], fix: {
      ko: '양면 스캔 위로 넘김 짝수 페이지 회전 처리 수정', en: 'Fix back-side rotation for top-bound duplex scans', path: 'scan/adf/duplex_orient.c',
      lines: ['@@ -51,7 +51,7 @@ static int back_side_rotation(const scan_job_t *j)', '-\treturn j->binding == BIND_TOP ? 180 : 0;', '+\treturn j->binding == BIND_TOP ? 0 : 180;']
    }
  },
  // ---- Copy ----
  { comp: 'Copy', needs: ['copy'], fix: { ko: 'ID 카드 복사 이미지 배치 로직 수정', en: 'Center both sides of ID card copies', ...ft('Copy') } },
  {
    comp: 'Copy', needs: ['copy', 'a3'], fix: {
      en: 'Fix reduce/enlarge margin calculation', path: 'copy/scale/scale_preset.c',
      lines: ['@@ -36,7 +36,8 @@ static void preset_fit(job_t *j, int pct)', ' \tj->scale = pct;', '-\tj->img.w = j->orig.w * pct / 100;', '+\tj->img.w = (j->orig.w - 2 * j->orig.margin) * pct / 100;', '+\tj->img.x = j->dst.margin;', ' \tj->img.h = j->orig.h * pct / 100;']
    }
  },
  {
    comp: 'Copy', needs: ['copy', 'color'], fix: {
      ko: '사진 모드 컬러 복사 피부색 보정 추가', en: 'Add skin tone correction to photo mode color copies', path: 'copy/color/photo_mode.c',
      lines: ['@@ -64,6 +64,7 @@ static const tone_curve_t *photo_curve(const copy_job_t *j)', ' \tif (j->mode != COPY_PHOTO)', ' \t\treturn &curve_text;', '+\tcolor_set_memory_color(j->cs, MEMCOLOR_SKIN, &skin_target_2017);', ' \treturn &curve_photo;']
    }
  },
  {
    comp: 'Copy', needs: ['copy'], fix: {
      en: 'Apply center shadow erase in book copy mode', path: 'copy/book/book_copy.c',
      lines: ['@@ -88,6 +88,8 @@ static void book_split_pages(copy_job_t *j)', ' \trect_t left = j->src, right = j->src;', ' \tleft.w = right.w = j->src.w / 2;', '+\tif (j->opt.erase_center)', '+\t\terase_band(j, j->src.w / 2, j->opt.center_mm);', ' \tcopy_page(j, &left);']
    }
  },
  // ---- Fax ----
  { comp: 'Fax', needs: ['fax'], fix: { ko: '팩스 ECM 재전송 처리 수정', en: 'Fall back to 9600 bps after repeated ECM errors', ...ft('Fax') } },
  {
    comp: 'Fax', needs: ['fax'], fix: {
      en: 'Fix fax forwarding file naming', path: 'fax/forward/fwd_smb.c',
      lines: ['@@ -45,7 +45,9 @@ static void fwd_make_name(const fax_rx_t *rx, char *out, size_t n)', '-\tsnprintf(out, n, "FAX_%s.pdf", rx->stamp);', '+\tconst char *pfx = cfg_get_str(CFG_FAX_FWD_PREFIX);', '+', '+\tsnprintf(out, n, "%s_%s.pdf", (pfx && *pfx) ? pfx : "FAX", rx->stamp);']
    }
  },
  {
    comp: 'Fax', needs: ['fax'], fix: {
      en: 'Skip the cover placeholder when forwarding faxes to email', path: 'fax/forward/fwd_email.c',
      lines: ['@@ -71,7 +71,7 @@ static int fwd_email_build_pdf(const fax_rx_t *rx, pdf_t *pdf)', '-\tfor (int i = 0; i < rx->pages; i++)', '+\tfor (int i = rx->has_cover_placeholder ? 1 : 0; i < rx->pages; i++)', ' \t\tpdf_add_page(pdf, rx->page[i]);']
    }
  },
  {
    comp: 'Fax', needs: ['fax'], fix: {
      ko: '일본 회선 다이얼톤 판정 범위 확장', en: 'Widen dial tone detection for Japanese lines', path: 'fax/line/dialtone.c',
      lines: ['@@ -30,7 +30,8 @@ static const tone_spec_t dialtone_jp = {', '-\t.freq_lo = 400, .freq_hi = 400,', '+\t/* NTT lines send 400 Hz modulated at 15 to 20 Hz */', '+\t.freq_lo = 380, .freq_hi = 420, .mod_hz = 16,', ' \t.min_ms = 1000,']
    }
  },
  // ---- Network / Wi-Fi ----
  {
    comp: 'Network / Wi-Fi', needs: [], fix: {
      ko: 'IPv6 전용 환경 mDNS AAAA 레코드 광고 추가', en: 'Announce AAAA records over mDNS on IPv6-only networks', path: 'net/mdns/mdns_responder.c',
      lines: ['@@ -120,6 +120,8 @@ static void mdns_announce(mdns_t *m)', ' \tmdns_add_a_record(m, &m->netif->ip4);', '+\tif (netif_has_ipv6(m->netif))', '+\t\tmdns_add_aaaa_record(m, &m->netif->ip6_global);', ' \tmdns_add_srv(m, "_ipp._tcp", 631);']
    }
  },
  { comp: 'Network / Wi-Fi', needs: [], fix: { en: 'Re-bind network interface after lease renewal', ...ft('Network / Wi-Fi') } },
  {
    comp: 'Network / Wi-Fi', needs: [], fix: {
      ko: 'PEAP 서버 인증서 체인 검증 시 중간 인증서 처리', en: 'Accept intermediate certificates when verifying PEAP servers', path: 'net/wifi/eap_peap.c',
      lines: ['@@ -77,7 +77,9 @@ static int peap_verify_server(eap_t *e, const x509_chain_t *ch)', '-\treturn x509_verify(ch->leaf, e->ca_store);', '+\t/* Corporate CAs send an intermediate in the chain; build the path through it */', '+\tx509_store_add_untrusted(e->ca_store, ch->intermediates, ch->n_int);', '+\treturn x509_verify(ch->leaf, e->ca_store);']
    }
  },
  {
    comp: 'Network / Wi-Fi', needs: [], fix: {
      ko: '802.1X 인증서 갱신 시 인증 정보 재로드', en: 'Reload 802.1X credentials after a certificate update', path: 'net/8021x/supplicant.c',
      lines: ['@@ -152,6 +152,8 @@ int supplicant_set_client_cert(supp_t *s, const cert_t *c)', ' \tint rc = keystore_put(KS_8021X_CLIENT, c);', '+\tif (rc == 0)', '+\t\tsupplicant_reload_credentials(s);', ' \treturn rc;']
    }
  },
  {
    comp: 'Network / Wi-Fi', needs: [], fix: {
      en: 'Rename the Bonjour service on a name conflict', path: 'net/mdns/mdns_conflict.c',
      lines: ['@@ -40,6 +40,9 @@ static void mdns_on_probe_conflict(mdns_t *m, const char *name)', '-\tLOG_WARN("mDNS name conflict: %s", name);', '+\tchar alt[64];', '+\tsnprintf(alt, sizeof alt, "%s (%02X%02X)", name, m->mac[4], m->mac[5]);', '+\tmdns_set_service_name(m, alt);', '+\tmdns_probe(m);']
    }
  },
  // ---- SyncThru Web UI ----
  { comp: 'SyncThru Web UI', needs: [], fix: { ko: 'SyncThru 세션 만료 처리 수정', en: 'End SyncThru sessions when the admin password changes', ...ft('SyncThru Web UI') } },
  {
    comp: 'SyncThru Web UI', needs: [], fix: {
      en: 'Use device time zone in SyncThru exports', path: 'web/syncthru/joblog_export.c',
      lines: ['@@ -66,7 +66,7 @@ static void joblog_write_row(csv_t *csv, const job_rec_t *r)', '-\tcsv_put_time(csv, r->finished, TZ_UTC);', '+\tcsv_put_time(csv, r->finished, tz_device());']
    }
  },
  {
    comp: 'SyncThru Web UI', needs: [], fix: {
      en: 'Include group members in SyncThru address book exports', path: 'web/syncthru/addrbook_export.c',
      lines: ['@@ -91,6 +91,9 @@ int addrbook_export_csv(csv_t *csv)', ' \tfor (int i = 0; i < ab.n_entries; i++)', ' \t\taddrbook_write_entry(csv, &ab.entries[i]);', '+\tfor (int g = 0; g < ab.n_groups; g++)', '+\t\tfor (int k = 0; k < ab.groups[g].n; k++)', '+\t\t\taddrbook_write_member(csv, &ab.groups[g], ab.groups[g].ids[k]);', ' \treturn 0;']
    }
  },
  {
    comp: 'SyncThru Web UI', needs: [], fix: {
      ko: 'SyncThru 작업 관리 화면 IE11 호환성 보기 대응', en: 'Opt the SyncThru job page out of IE11 Compatibility View', path: 'web/syncthru/www/job/index.html',
      lines: ['@@ -3,6 +3,7 @@', ' <head>', ' <meta charset="utf-8">', '+<meta http-equiv="X-UA-Compatible" content="IE=edge">', ' <title>Job Management</title>']
    }
  },
  // ---- Panel UI ----
  { comp: 'Panel UI', needs: ['touch'], fix: { ko: '조작부 터치 좌표 보정 값 수정', en: 'Correct touch calibration near the panel edge', ...ft('Panel UI') } },
  {
    comp: 'Panel UI', needs: ['copy'], fix: {
      en: 'Validate copy count input on the panel', path: 'ui/panel/copy/copy_count.c',
      lines: ['@@ -27,7 +27,7 @@ static int copy_count_valid(int n)', '-\treturn n <= COPY_COUNT_MAX;', '+\treturn n >= 1 && n <= COPY_COUNT_MAX;']
    }
  },
  {
    comp: 'Panel UI', needs: ['lcd'], fix: {
      en: 'Shrink job status labels to fit Hindi strings', path: 'ui/panel/job/job_status_view.c',
      lines: ['@@ -58,6 +58,8 @@ static void job_status_layout(view_t *v)', ' \tlabel_set_text(v->state, tr(STR_JOB_STATE));', '+\tif (label_overflows(v->state))', '+\t\tlabel_fit_font(v->state, FONT_MIN_PT);', ' \tview_layout_row(v);']
    }
  },
  {
    comp: 'Panel UI', needs: ['smartux'], fix: {
      ko: '홈 화면 앱 실행 중복 요청 무시', en: 'Ignore repeated launch taps on the home screen', path: 'ui/smartux/launcher/src/HomeLauncher.java',
      lines: ['@@ -112,6 +112,9 @@ public final class HomeLauncher {', '     void onAppIconTapped(AppInfo app) {', '+        if (launching.contains(app.packageName))', '+            return;', '+        launching.add(app.packageName);', '         startApp(app);']
    }
  },
  {
    comp: 'Panel UI', needs: ['lcd'], fix: {
      en: 'Use bidi layout for job names on the job status screen', path: 'ui/panel/job/job_name_label.c',
      lines: ['@@ -33,7 +33,8 @@ void job_name_label_set(label_t *l, const char *utf8)', '-\tlabel_set_text(l, utf8);', '+\tlabel_set_text_bidi(l, utf8, bidi_detect_base(utf8));', '+\tlabel_set_shaping(l, SHAPE_ARABIC);']
    }
  },
  // ---- Print Driver ----
  { comp: 'Print Driver', needs: [], fix: { ko: '드라이버 N-up 여백 계산 수정', en: 'Apply custom margins to N-up layouts', ...ft('Print Driver') } },
  {
    comp: 'Print Driver', needs: ['ps'], fix: {
      en: 'Fix booklet page ordering in the PS driver', path: 'driver/ps/booklet.c',
      lines: ['@@ -54,7 +54,7 @@ static int booklet_sheet_page(int sheet, int side, int n)', '-\treturn side ? n - 1 - sheet * 2 : sheet * 2;', '+\treturn side ? sheet * 2 + 1 : n - 1 - sheet * 2;']
    }
  },
  {
    comp: 'Print Driver', needs: [], fix: {
      en: 'Declare the duplex option in the macOS PPD', path: 'driver/mac/ppd/{m}.ppd',
      lines: ['@@ -88,6 +88,11 @@ *DefaultResolution: 600dpi', '+*OpenUI *Duplex/Two-Sided: PickOne', '+*DefaultDuplex: None', '+*Duplex None/Off: "<</Duplex false>>setpagedevice"', '+*Duplex DuplexNoTumble/Long-Edge Binding: "<</Duplex true /Tumble false>>setpagedevice"', '+*CloseUI: *Duplex', ' *OpenUI *ColorModel/Color Mode: PickOne']
    }
  },
  {
    comp: 'Print Driver', needs: ['office'], fix: {
      en: 'Accept only digits in the Secure Print PIN field', path: 'driver/pcl6/ui/secure_print_dlg.cpp',
      lines: ['@@ -140,6 +140,7 @@ BOOL SecurePrintDlg::OnInitDialog()', ' \tm_pin.SetLimitText(SECURE_PIN_MAX);', '+\tm_pin.ModifyStyle(0, ES_NUMBER);', ' \treturn TRUE;']
    }
  },
  {
    comp: 'Print Driver', needs: [], fix: {
      ko: 'UPD 설치 시 사용자 로캘 기준 기본 용지 설정', en: 'Pick the default paper size from the user locale', path: 'driver/upd/install/default_paper.cpp',
      lines: ['@@ -21,7 +21,9 @@ static DWORD DefaultPaperForLocale()', '-\treturn DMPAPER_LETTER;', '+\tWCHAR v[2];', '+\tGetLocaleInfoEx(LOCALE_NAME_USER_DEFAULT, LOCALE_IMEASURE, v, 2);', '+\treturn v[0] == L\'1\' ? DMPAPER_LETTER : DMPAPER_A4;']
    }
  },
  // ---- Mobile Print ----
  {
    comp: 'Mobile Print', needs: ['wifi'], fix: {
      ko: 'Mobile Print NFC 핸드오버 처리 수정', en: 'Fix the NFC handover intent on Android 7', path: 'app/mobileprint/nfc/NfcHandover.java',
      lines: ['@@ -48,7 +48,8 @@ final class NfcHandover {', '-        intent.setAction(NfcAdapter.ACTION_NDEF_DISCOVERED);', '+        // Android 7 only dispatches the handover record with a MIME match', '+        intent.setAction(NfcAdapter.ACTION_NDEF_DISCOVERED).setType(MIME_HANDOVER);', '         activity.startActivity(intent);']
    }
  },
  {
    comp: 'Mobile Print', needs: [], fix: {
      ko: 'AirPrint 작업의 IPP sides 속성 처리 추가', en: 'Honor the IPP sides attribute for AirPrint jobs', path: 'net/ipp/ipp_job_attrs.c',
      lines: ['@@ -102,6 +102,8 @@ static void ipp_apply_job_attrs(job_t *j, const ipp_attrs_t *a)', ' \tj->copies = ipp_get_int(a, "copies", 1);', '+\tconst char *sides = ipp_get_keyword(a, "sides", "one-sided");', '+\tj->duplex = strcmp(sides, "one-sided") != 0;', ' \tj->collate = ipp_get_bool(a, "multiple-document-handling", 1);']
    }
  },
  { comp: 'Mobile Print', needs: [], fix: { en: 'Deduplicate Mopria discovery records', ...ft('Mobile Print') } },
  {
    comp: 'Mobile Print', needs: ['scan'], fix: {
      ko: '스캔 이미지 저장 후 미디어 스캐너 갱신', en: 'Register saved scans with the Android media scanner', path: 'app/mobileprint/scan/ScanSaver.java',
      lines: ['@@ -66,6 +66,8 @@ final class ScanSaver {', '         writeJpeg(file, image);', '+        MediaScannerConnection.scanFile(context,', '+                new String[] { file.getAbsolutePath() }, new String[] { "image/jpeg" }, null);', '         return file;']
    }
  },
  // ---- Security ----
  { comp: 'Security', needs: [], fix: { ko: '관리자 세션 쿠키 보안 속성 추가', en: 'Set Secure and HttpOnly on the admin session cookie', ...ft('Security') } },
  {
    comp: 'Security', needs: ['office'], fix: {
      ko: '재부팅 후 보안 인쇄 대기 작업 잠금 유지', en: 'Keep secure print jobs held after a restart', path: 'job/secure/secure_queue.c',
      lines: ['@@ -80,7 +80,8 @@ static void secure_queue_restore(queue_t *q)', ' \tlist_for_each(job, &q->persisted) {', '-\t\tjob->state = JOB_READY;', '+\t\t/* Jobs restored after a power cycle still need the PIN */', '+\t\tjob->state = job->secure ? JOB_HELD_PIN : JOB_READY;', ' \t}']
    }
  },
  {
    comp: 'Security', needs: [], fix: {
      en: 'Re-apply security policy after factory reset', path: 'sys/reset/factory_reset.c',
      lines: ['@@ -119,6 +119,7 @@ void factory_reset_finish(void)', ' \tnvram_load_defaults();', '+\tsec_policy_apply(sec_policy_load());', ' \tnet_services_start();']
    }
  },
  {
    comp: 'Security', needs: ['hdd'], fix: {
      ko: 'HDD 덮어쓰기 완료 시 감사 로그 기록', en: 'Write an audit log entry when a disk overwrite finishes', path: 'storage/hdd/overwrite.c',
      lines: ['@@ -140,6 +140,8 @@ static void overwrite_done(ow_job_t *o)', ' \to->state = OW_DONE;', '+\taudit_log(AUDIT_HDD_OVERWRITE, "passes=%d result=%s", o->passes,', '+\t\t  o->err ? "failed" : "completed");', ' \tnotify_panel(EVT_OVERWRITE_DONE);']
    }
  },
  // ---- Finisher ----
  { comp: 'Finisher', needs: ['finisher'], fix: { ko: '피니셔 펀치 위치 보정 값 수정', en: 'Apply the punch skew calibration per paper size', ...ft('Finisher') } },
  {
    comp: 'Finisher', needs: ['finisher'], fix: {
      en: 'Restore offset stacking after staple jam recovery', path: 'finisher/stacker/offset.c',
      lines: ['@@ -52,6 +52,7 @@ void stacker_on_jam_cleared(stacker_t *s, jam_t j)', ' \tstacker_home(s);', '+\ts->offset_enabled = cfg_get_bool(CFG_OFFSET_STACK);', ' \tstacker_ready(s);']
    }
  },
  {
    comp: 'Finisher', needs: ['finisher'], fix: {
      ko: '중철 제본 매수별 접지 위치 보정 추가', en: 'Correct the booklet fold position for thick sets', path: 'finisher/booklet/fold_ctrl.c',
      lines: ['@@ -66,7 +66,9 @@ static int fold_position(const booklet_t *b)', '-\treturn b->sheet_len / 2;', '+\t/* Thick sets creep outwards; move the fold 0.15 mm per sheet past 15 */', '+\tint creep = b->sheets > 15 ? (b->sheets - 15) * 15 / 100 : 0;', '+\treturn b->sheet_len / 2 + creep;']
    }
  },
  // ---- Toner / Supplies ----
  { comp: 'Toner / Supplies', needs: [], fix: { ko: '토너 인증 재시도 로직 수정', en: 'Retry toner authentication before warning', ...ft('Toner / Supplies') } },
  {
    comp: 'Toner / Supplies', needs: [], fix: {
      en: 'Persist imaging unit counter across updates', path: 'supplies/counter/iu_counter.c',
      lines: ['@@ -38,7 +38,8 @@ void iu_counter_init(void)', '-\tiu.pages = 0;', '+\tif (nvram_read(NV_IU_PAGES, &iu.pages) != 0)', '+\t\tiu.pages = crum_read_pages(CRUM_IU);', ' \tiu.ready = 1;']
    }
  },
  {
    comp: 'Toner / Supplies', needs: [], fix: {
      en: 'Keep the toner yield estimate stable when Toner Save changes', path: 'supplies/gauge/yield_est.c',
      lines: ['@@ -74,7 +74,7 @@ int yield_remaining_pages(const gauge_t *g)', '-\tint per_page = g->dots_per_page;', '+\tint per_page = g->toner_save ? g->dots_per_page_normal : g->dots_per_page;', ' \treturn g->remaining_dots / per_page;']
    }
  },
  // ---- Power / Sleep ----
  { comp: 'Power / Sleep', needs: [], fix: { ko: 'Deep sleep 상태 LPR 수신 복귀 처리 추가', en: 'Wake from deep sleep on LPR jobs', ...ft('Power / Sleep') } },
  {
    comp: 'Power / Sleep', needs: [], fix: {
      en: 'Honor Wake-on-LAN while Eco mode is on', path: 'power/sleep/eco_mode.c',
      lines: ['@@ -95,7 +95,7 @@ static void eco_apply(const eco_cfg_t *c)', ' \tsleep_set_timeout(c->sleep_min);', '-\tcfg.wol = c->eco ? 0 : cfg_get_bool(CFG_WOL);', '+\tcfg.wol = cfg_get_bool(CFG_WOL);', ' \tpower_apply(&cfg);']
    }
  },
  {
    comp: 'Power / Sleep', needs: [], fix: {
      ko: '저전력 모드 복귀 시 정착기 예열 병행 처리', en: 'Preheat the fuser in parallel when waking from low power', path: 'power/sleep/wakeup.c',
      lines: ['@@ -130,7 +130,8 @@ static void wakeup_from_low_power(void)', ' \tpanel_on();', '-\tfuser_warmup_sync();', '+\tfuser_preheat_async(FUSER_PREHEAT_FAST);', '+\tnet_resume();', ' \tengine_ready_wait(WAKE_TIMEOUT_S);']
    }
  }
];

/** Capabilities that feature, performance and localization titles need, by title template. */
export const TITLE_NEEDS: Record<string, Cap[]> = {
  [FEAT[0][0]]: ['office'],
  [FEAT[1][0]]: ['touch'],
  [FEAT[3][0]]: ['wifi'],
  [FEAT[4][0]]: ['scan'],
  [FEAT[7][0]]: ['office'],
  [FEAT[9][0]]: ['fax'],
  [FEAT[10][0]]: ['smartux'],
  [FEAT[11][0]]: ['scan'],
  [PERF[1][0]]: ['ps'],
  [LOC[0][0]]: ['lcd'],
  [LOC[1][0]]: ['lcd']
};

/** What a hand-written defect needs, from its component. */
export const COMP_NEEDS: Record<string, Cap[]> = { 'Scanner / ADF': ['scan'], Copy: ['copy'], Fax: ['fax'], Finisher: ['finisher'] };
