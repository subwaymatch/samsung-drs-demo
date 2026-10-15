// Hand-written records with full histories. Ids are placeholders ("D:duplex",
// "CR:duplex") that the generator replaces with real ids once every record is
// numbered; "{D:key}" and "{CR:key}" inside text are replaced the same way.

import { A, F_, FD, RV } from '../records';
import type { Defect, Review } from '../types';

type HwDefect = Omit<Defect, 'steps' | 'attachments'> & Partial<Pick<Defect, 'steps' | 'attachments'>>;

export const HW_DEFECTS: HwDefect[] = [
  // ---- September 2017: the current showcase ----
  {
    id: 'D:duplex', title: '[SL-C3060FR] 양면 인쇄 시 2페이지 이후 용지 걸림 (Jam 0x21) 발생', model: 'SL-C3060FR', comp: 'Print Engine', sev: 'critical', status: 'in_progress', fw: 'V4.00.03.24',
    reporter: 'u1', assignees: ['u2', 'u5'], created: '2017-09-11 09:42',
    desc: 'A4 80g 용지로 양면 인쇄 시, 2페이지 출력 직후 듀플렉스 유닛에서 Jam 0x21이 반복적으로 발생합니다. 단면 인쇄에서는 재현되지 않습니다.\n발생 빈도: 10회 중 7회',
    steps: '1. 트레이 1에 A4 80g 용지 적재\n2. PC에서 4페이지 문서를 양면 인쇄로 전송\n3. 2페이지 출력 후 듀플렉스 반전 구간에서 정지\n4. 조작부에 "용지 걸림 0x21" 표시',
    attachments: [F_('jam_0x21_duplex.mp4', 12400000, 'video/mp4'), F_('panel_jam_0x21.jpg', 820000, 'image/jpeg'), F_('engine_log_0911.txt', 48200, 'text/plain')],
    activity: [
      A('e', 'u1', '2017-09-11 09:42', 'reported this defect'), A('e', 'u1', '2017-09-11 09:43', 'assigned 박성민'),
      A('c', 'u2', '2017-09-11 14:10', '로그 확인했습니다. 듀플렉스 반전 모터 타이밍이 V4.00.03.20 이후 18ms 앞당겨졌습니다. 센서 응답도 같이 봐야 할 것 같아 최영호 책임님 추가합니다.'),
      A('e', 'u2', '2017-09-11 14:11', 'assigned 최영호'), A('e', 'u2', '2017-09-12 10:02', 'changed status to In progress'),
      A('c', 'u5', '2017-09-13 16:35', '센서 응답 시간은 사양 범위 내입니다 (평균 4.2ms). 펌웨어 타이밍 원복 시 Jam 재현되지 않는 것 확인했습니다.', null, [F_('exit_sensor_scope.png', 640000, 'image/png')]),
      A('c', 'u2', '2017-09-14 11:20', '수정 사항 {CR:duplex}로 리뷰 요청했습니다.')
    ]
  },
  {
    id: 'D:addrbook', title: 'SyncThru Web Service: Address book import fails for CSV files over 500 entries', model: 'SL-M4080FX', comp: 'SyncThru Web UI', sev: 'major', status: 'open', fw: 'V4.00.03.11',
    reporter: 'u8', assignees: ['u9'], created: '2017-09-08 13:05',
    desc: 'Importing an address book CSV with more than 500 entries through SyncThru Web Service returns "Import failed (E-302)" and no entries are saved. Files with 500 or fewer entries import correctly.',
    steps: '1. Log in to SyncThru Web Service as admin\n2. Address Book > Individual > Import\n3. Select a CSV with 501+ entries\n4. Click Import',
    attachments: [F_('syncthru_import_error.png', 310000, 'image/png'), F_('addressbook_501.csv', 38000, 'text/csv')],
    activity: [
      A('e', 'u8', '2017-09-08 13:05', 'reported this defect'), A('e', 'u8', '2017-09-08 13:06', 'assigned Daniel Becker'),
      A('c', 'u9', '2017-09-11 10:12', 'Reproduced. The import handler reads the whole file into a single 64 KB buffer. I will process it in chunks; review request incoming.'),
      A('c', 'u1', '2017-09-11 11:30', '국내 B2B 고객사에서도 동일 문의 2건 접수되었습니다. 우선순위 높여주세요.')
    ]
  },
  {
    id: 'D:faxsleep', title: '[SL-M4080FX] 팩스 수신 직후 절전 모드 진입 시 수신 문서 일부 유실', model: 'SL-M4080FX', comp: 'Fax', sev: 'critical', status: 'open', fw: 'V4.00.03.11',
    reporter: 'u1', assignees: ['u4'], created: '2017-09-07 17:20',
    desc: '팩스 수신 완료 후 1분 이내 절전 모드로 진입하면 메모리에 저장된 수신 문서의 마지막 페이지가 출력되지 않고 유실됩니다.',
    steps: '1. 절전 모드 진입 시간을 1분으로 설정\n2. 외부 팩스에서 3페이지 문서 송신\n3. 수신 완료 후 대기\n4. 절전 복귀 후 3페이지 누락 확인',
    attachments: [F_('fax_rx_trace.log', 212000, 'text/plain')],
    activity: [
      A('e', 'u1', '2017-09-07 17:20', 'reported this defect'), A('e', 'u1', '2017-09-07 17:21', 'assigned Rahul Sharma'),
      A('c', 'u4', '2017-09-08 12:40', 'Looks like the RX buffer is not flushed to NAND before the sleep transition. I will add a forced flush in the power manager hook.'),
      A('c', 'u4', '2017-09-13 18:05', 'Fix submitted as {CR:faxflush}.')
    ]
  },
  {
    id: 'D:wfd', title: 'Wi-Fi Direct pairing drops after firmware update on SL-M2020W', model: 'SL-M2020W', comp: 'Network / Wi-Fi', sev: 'major', status: 'in_progress', fw: 'V3.00.03.08',
    reporter: 'u8', assignees: ['u4', 'u10'], created: '2017-09-06 11:15',
    desc: 'After updating to V3.00.03.08, Wi-Fi Direct connections from Android devices disconnect after roughly 3 minutes idle and cannot reconnect without power cycling the printer.',
    steps: '1. Update firmware to V3.00.03.08\n2. Connect an Android phone via Wi-Fi Direct\n3. Leave idle for 3+ minutes\n4. Try to print from Samsung Mobile Print',
    activity: [
      A('e', 'u8', '2017-09-06 11:15', 'reported this defect'), A('e', 'u8', '2017-09-06 11:16', 'assigned Rahul Sharma'), A('e', 'u4', '2017-09-06 15:30', 'assigned 오세훈'),
      A('c', 'u10', '2017-09-07 15:00', 'Samsung Mobile Print 앱에서도 동일하게 재현됩니다. 재연결 시 group owner 정보가 갱신되지 않는 것으로 보입니다.', null, [F_('wfd_reconnect_fail.mp4', 8700000, 'video/mp4')]),
      A('e', 'u4', '2017-09-08 09:20', 'changed status to In progress')
    ]
  },
  {
    id: 'D:a3adf', title: '[SL-X7600LX] ADF 스캔 시 A3 원본 하단 약 3mm 잘림', model: 'SL-X7600LX', comp: 'Scanner / ADF', sev: 'major', status: 'open', fw: 'V5.10.03.03',
    reporter: 'u23', assignees: ['u5'], created: '2017-09-05 10:30',
    desc: 'ADF로 A3 원본 스캔 시 하단 약 3mm가 잘려서 저장됩니다. 평판(플래튼) 스캔에서는 정상입니다.',
    attachments: [F_('a3_adf_scan_cut.jpg', 1830000, 'image/jpeg'), F_('a3_platen_ok.jpg', 1790000, 'image/jpeg')],
    activity: [
      A('e', 'u23', '2017-09-05 10:30', 'reported this defect'), A('e', 'u23', '2017-09-05 10:31', 'assigned 최영호'),
      A('c', 'u5', '2017-09-06 13:45', 'ADF 후단 센서 위치 공차 확인 중입니다. 양산 샘플 5대 측정 후 공유드리겠습니다.')
    ]
  },
  {
    id: 'D:tonerko', title: '조작부 UI: "토너 부족" 경고가 한국어 설정에서 영문으로 표시됨', model: 'SL-C480FW', comp: 'Panel UI', sev: 'minor', status: 'resolved', fw: 'V3.00.03.30',
    reporter: 'u1', assignees: ['u3'], created: '2017-08-31 09:10',
    desc: '언어를 한국어로 설정해도 토너 부족 경고가 "Toner Low"로 표시됩니다.',
    attachments: [F_('panel_toner_low_en.jpg', 540000, 'image/jpeg')],
    activity: [
      A('e', 'u1', '2017-08-31 09:10', 'reported this defect'), A('e', 'u1', '2017-08-31 09:11', 'assigned 이수진'),
      A('c', 'u3', '2017-09-04 09:50', 'ko-KR 리소스 파일에 키가 누락되어 있었습니다. {CR:tonerko}에서 수정했습니다.'),
      A('e', 'u3', '2017-09-05 17:40', 'changed status to Resolved')
    ]
  },
  {
    id: 'D:watermark', title: 'PCL6 driver: Watermark shifts 12 mm right on Letter size in landscape', model: 'SL-M4080FX', comp: 'Print Driver', sev: 'minor', status: 'resolved', fw: 'UPD 3.04.01',
    reporter: 'u16', assignees: ['u9'], created: '2017-08-29 14:00',
    desc: 'With a text watermark enabled, Letter landscape jobs print the watermark about 12 mm right of center. A4 is not affected.',
    activity: [
      A('e', 'u16', '2017-08-29 14:00', 'reported this defect'), A('e', 'u16', '2017-08-29 14:01', 'assigned Daniel Becker'),
      A('e', 'u9', '2017-09-04 12:00', 'changed status to Resolved')
    ]
  },
  {
    id: 'D:colorreg', title: '[SL-C480FW] 컬러 레지스트레이션 자동 보정 후 시안 번짐', model: 'SL-C480FW', comp: 'Print Engine', sev: 'major', status: 'closed', fw: 'V3.00.03.28',
    reporter: 'u1', assignees: ['u5', 'u2'], created: '2017-08-24 10:00',
    desc: '자동 컬러 레지스트레이션 실행 후 시안(C) 색상이 약 0.3mm 번져 보입니다.',
    activity: [
      A('e', 'u1', '2017-08-24 10:00', 'reported this defect'), A('e', 'u1', '2017-08-24 10:01', 'assigned 최영호'), A('e', 'u5', '2017-08-25 09:00', 'assigned 박성민'),
      A('c', 'u2', '2017-08-29 15:20', '보정 패턴 측정 시 시안 오프셋 부호가 반대로 적용되고 있었습니다. 수정 펌웨어 빌드 서버에 올렸습니다.'),
      A('e', 'u2', '2017-08-30 10:00', 'changed status to Resolved'),
      A('c', 'u1', '2017-09-01 14:50', 'V3.00.03.30에서 수정 확인했습니다. 종료합니다.'),
      A('e', 'u1', '2017-09-01 15:00', 'changed status to Closed')
    ]
  },
  {
    id: 'D:staple', title: 'Finisher staple count mismatch when a job exceeds 50 sheets', model: 'SL-X7600LX', comp: 'Finisher', sev: 'major', status: 'closed', fw: 'V5.10.03.01',
    reporter: 'u23', assignees: ['u33'], created: '2017-08-22 16:20',
    desc: 'Jobs over 50 sheets are split into sets, but the staple count reported to the job log is off by one per set.',
    activity: [
      A('e', 'u23', '2017-08-22 16:20', 'reported this defect'), A('e', 'u23', '2017-08-22 16:21', 'assigned 유하린'),
      A('c', 'u33', '2017-08-24 11:10', '세트 분할 시 마지막 스테이플 신호가 로그에 반영되지 않습니다. 피니셔 펌웨어 쪽에서 카운트 보고 시점을 수정했습니다.'),
      A('e', 'u33', '2017-08-25 18:00', 'changed status to Resolved'),
      A('e', 'u23', '2017-08-30 11:00', 'changed status to Closed')
    ]
  },
  {
    id: 'D:smbko', title: '[ProXpress M4070FR] SMB 네트워크 스캔 전송 시 한글 파일명 깨짐', model: 'SL-M4070FR', comp: 'Network / Wi-Fi', sev: 'minor', status: 'in_progress', fw: 'V4.00.03.40',
    reporter: 'u1', assignees: ['u3'], created: '2017-09-04 15:30',
    desc: 'Scan to SMB 기능으로 파일명에 한글을 입력하면 Windows 공유 폴더에서 파일명이 깨져서 저장됩니다.',
    attachments: [F_('smb_filename_broken.png', 280000, 'image/png')],
    activity: [
      A('e', 'u1', '2017-09-04 15:30', 'reported this defect'), A('e', 'u1', '2017-09-04 15:31', 'assigned 이수진'),
      A('e', 'u3', '2017-09-07 10:00', 'changed status to In progress')
    ]
  },
  {
    id: 'D:tonerlow', title: 'Toner low warning appears at 40% remaining with MLT-D203L cartridge', model: 'SL-M4070FR', comp: 'Toner / Supplies', sev: 'trivial', status: 'open', fw: 'V4.00.03.40',
    reporter: 'u8', assignees: [], created: '2017-09-13 09:00',
    desc: 'With a new MLT-D203L high-yield cartridge, the toner low warning appears when the gauge still shows about 40% remaining.',
    activity: [A('e', 'u8', '2017-09-13 09:00', 'reported this defect')]
  },
  {
    id: 'D:tls', title: '[SL-M4580FX] SyncThru HTTPS still accepts TLS 1.0 after "TLS 1.2 only" is set', model: 'SL-M4580FX', comp: 'Security', sev: 'critical', status: 'in_progress', fw: 'V4.00.03.18',
    reporter: 'u24', assignees: ['u26'], created: '2017-09-12 10:20',
    desc: 'With Security > Network Security > SSL/TLS set to "TLS 1.2 only", sslscan still reports TLS 1.0 and 1.1 as accepted on port 443. The setting is saved and shown correctly in SyncThru after reboot.\nFound by the nightly security scan on the release candidate for the public-sector tender.',
    steps: '1. SyncThru > Settings > Security > SSL/TLS: select "TLS 1.2 only"\n2. Apply and reboot the device\n3. Run sslscan against port 443\n4. TLS 1.0 and TLS 1.1 are still listed as accepted',
    attachments: [F_('sslscan_m4580fx_0912.txt', 14200, 'text/plain'), F_('syncthru_tls_setting.png', 210000, 'image/png')],
    affects: { lines: ['ProXpress Mono', 'ProXpress Color'], models: [] },
    activity: [
      A('e', 'u24', '2017-09-12 10:20', 'reported this defect'), A('e', 'u24', '2017-09-12 10:21', 'assigned 황보라'),
      A('c', 'u32', '2017-09-12 11:05', '공공기관 입찰 모델이라 이번 주 안에 수정이 필요합니다. @황보라 우선 처리 부탁드립니다.'),
      A('c', 'u26', '2017-09-12 15:40', '원인 확인했습니다. 설정은 저장되지만 웹 서버 재시작 시 부팅 때 만든 SSL 컨텍스트를 재사용해서 최소 프로토콜 버전이 반영되지 않습니다. 설정 변경 시 컨텍스트를 새로 만들도록 수정하겠습니다.'),
      A('e', 'u26', '2017-09-12 15:41', 'changed status to In progress'),
      A('c', 'u26', '2017-09-14 17:30', '{CR:tls}로 리뷰 요청했습니다. 수정 후 sslscan 결과 첨부합니다.', null, [F_('sslscan_after_fix.txt', 9800, 'text/plain')])
    ]
  },
  {
    id: 'D:mopria', title: '[SL-M2885FW] Mopria print from Android 7.1 fails with "Printer unavailable"', model: 'SL-M2885FW', comp: 'Mobile Print', sev: 'major', status: 'open', fw: 'V3.00.03.12',
    reporter: 'u8', assignees: ['u20'], created: '2017-09-14 15:45',
    desc: 'Printing from the Mopria Print Service on Android 7.1 fails with "Printer unavailable" right after the job is sent. Android 6.0 devices print correctly on the same network.\nThe device log shows Get-Printer-Attributes returning client-error-bad-request.',
    steps: '1. Connect a Pixel (Android 7.1.2) to the same Wi-Fi network\n2. Open a PDF and choose Print > SL-M2885FW via Mopria\n3. Tap Print\n4. The notification shows "Printer unavailable"',
    attachments: [F_('ipp_trace_android71.pcapng', 1240000, 'application/vnd.tcpdump.pcap'), F_('mopria_logcat.txt', 88000, 'text/plain')],
    activity: [
      A('e', 'u8', '2017-09-14 15:45', 'reported this defect'), A('e', 'u8', '2017-09-14 15:46', 'assigned Vikram Rao'),
      A('c', 'u20', '2017-09-15 10:10', 'Android 7.1 requests media-col-database in requested-attributes, and our IPP parser rejects the whole request when it sees an attribute it does not support. Checking against the Mopria compliance suite before changing the parser.')
    ]
  },
  {
    id: 'D:cardauth', title: '[SL-X4300LX] 사원증 인증(HID iCLASS) 후 보안 인쇄 작업 목록이 비어 있음', model: 'SL-X4300LX', comp: 'Security', sev: 'major', status: 'in_progress', fw: 'V5.10.03.06',
    reporter: 'u23', assignees: ['u30'], created: '2017-09-07 14:05',
    desc: 'HID iCLASS 사원증으로 로그인하면 보안 인쇄 작업 목록이 비어 있습니다. 같은 사용자가 ID/비밀번호로 로그인하면 작업이 정상적으로 보입니다.\n카드 번호가 0으로 시작하는 사용자만 발생합니다.',
    steps: '1. 카드 번호가 0으로 시작하는 사원증 등록\n2. PC에서 보안 인쇄 작업 전송\n3. 조작부에서 사원증으로 로그인\n4. 보안 인쇄 > 작업 목록 확인',
    activity: [
      A('e', 'u23', '2017-09-07 14:05', 'reported this defect'), A('e', 'u23', '2017-09-07 14:06', 'assigned 조은비'),
      A('c', 'u30', '2017-09-08 10:30', '카드 UID를 사용자 ID로 매핑할 때 숫자로 변환하면서 앞자리 0이 제거되고 있습니다. 문자열 비교로 바꾸겠습니다.'),
      A('e', 'u30', '2017-09-08 10:31', 'changed status to In progress'),
      A('c', 'u30', '2017-09-11 18:20', 'Fix in {CR:cardauth}.')
    ]
  },
  {
    id: 'D:copyid', title: '[SL-K4350LX] ID 카드 복사 시 뒷면 이미지가 앞면과 겹쳐서 출력됨', model: 'SL-K4350LX', comp: 'Copy', sev: 'minor', status: 'open', fw: 'V5.10.03.06',
    reporter: 'u23', assignees: ['u25'], created: '2017-09-12 16:30',
    desc: '"ID 카드 복사"에서 앞면과 뒷면을 스캔하면 출력물에서 두 이미지가 약 10mm 겹칩니다. A4 용지에서만 발생하고 Letter에서는 정상입니다.',
    attachments: [F_('idcard_copy_overlap.jpg', 1120000, 'image/jpeg')],
    activity: [A('e', 'u23', '2017-09-12 16:30', 'reported this defect'), A('e', 'u23', '2017-09-12 16:31', 'assigned 송민재')]
  },
  {
    id: 'D:udp', title: 'Universal Print Driver hangs the Windows 10 (1703) spooler when Secure Print is selected', model: 'SL-M4580FX', comp: 'Print Driver', sev: 'critical', status: 'in_progress', fw: 'UPD 3.04.01',
    reporter: 'u16', assignees: ['u27', 'u18'], created: '2017-09-01 11:00',
    desc: 'On Windows 10 Creators Update (1703), choosing Secure Print in the UPD printing preferences and clicking OK freezes the print dialog. spoolsv.exe stops responding, and other users on the print server cannot print until the service is restarted.\nWindows 10 1607 is not affected.',
    steps: '1. Install UPD 3.04.01 on Windows 10 1703 (x64)\n2. Open Printing Preferences\n3. Job Mode: Secure Print, enter a PIN\n4. Click OK, then print from Notepad',
    attachments: [F_('spoolsv_hang.dmp', 48200000, 'application/octet-stream'), F_('procmon_trace.zip', 6200000, 'application/zip')],
    affects: { lines: [], models: ['SL-M4080FX', 'SL-C3060FR', 'SL-X7600LX'] },
    activity: [
      A('e', 'u16', '2017-09-01 11:00', 'reported this defect'), A('e', 'u16', '2017-09-01 11:01', 'assigned Kavya Reddy'),
      A('c', 'u27', '2017-09-01 16:20', 'Reproduced. The Secure Print dialog queries device status synchronously on the spooler thread; on 1703 that call blocks while the dialog is modal.'),
      A('e', 'u27', '2017-09-04 09:30', 'assigned 신유나'), A('e', 'u27', '2017-09-04 09:31', 'changed status to In progress'),
      A('c', 'u18', '2017-09-05 14:00', '드라이버 UI 스레드 분리 방향 동의합니다. 1607에서도 회귀 없는지 같이 확인하겠습니다.'),
      A('c', 'u27', '2017-09-11 19:10', 'Fix is up as {CR:udp}.')
    ]
  },

  // ---- 2016 and early 2017 history ----
  {
    id: 'D:gcp', title: 'Google Cloud Print registration fails behind an authenticated proxy', model: 'SL-M2070FW', comp: 'Network / Wi-Fi', sev: 'major', status: 'closed', fw: 'V3.00.01.17',
    reporter: 'u8', assignees: ['u4'], created: '2016-03-08 10:15',
    desc: 'Registering the printer with Google Cloud Print fails with "Connection error" when the network requires an authenticated HTTP proxy. Registration works on networks without a proxy.',
    activity: [
      A('e', 'u8', '2016-03-08 10:15', 'reported this defect'), A('e', 'u8', '2016-03-08 10:16', 'assigned Rahul Sharma'),
      A('c', 'u4', '2016-03-09 14:30', 'The Cloud Print client ignores the proxy credentials saved in SyncThru. I will pass them through to the HTTP client.'),
      A('e', 'u4', '2016-03-09 14:31', 'changed status to In progress'),
      A('c', 'u4', '2016-03-15 18:00', 'Fix in {CR:gcp}.'),
      A('e', 'u4', '2016-03-18 11:00', 'changed status to Resolved'),
      A('c', 'u8', '2016-03-22 10:30', 'Verified on V3.00.01.19 with the Bangalore office proxy. Closing.'),
      A('e', 'u8', '2016-03-22 10:31', 'changed status to Closed')
    ]
  },
  {
    id: 'D:staplesensor', title: '[SL-K7600LX] 스테이플 카트리지 교체 후에도 "스테이플 없음" 경고가 사라지지 않음', model: 'SL-K7600LX', comp: 'Finisher', sev: 'major', status: 'closed', fw: 'V5.10.01.12',
    reporter: 'u1', assignees: ['u22'], created: '2016-05-24 10:40',
    desc: '스테이플 카트리지를 새것으로 교체해도 "스테이플 없음" 경고가 계속 표시되고 스테이플 작업이 진행되지 않습니다. 피니셔 커버를 두 번 열고 닫으면 정상화됩니다.',
    attachments: [F_('staple_sensor_waveform.png', 420000, 'image/png')],
    activity: [
      A('e', 'u1', '2016-05-24 10:40', 'reported this defect'), A('e', 'u1', '2016-05-24 10:41', 'assigned 배준혁'),
      A('c', 'u22', '2016-05-25 15:10', '카트리지 장착 시 센서 신호에 약 30ms 채터링이 있습니다. 펌웨어에서 디바운스 시간을 늘리면 해결될 것으로 보입니다.', null, [F_('staple_sensor_waveform.png', 420000, 'image/png')]),
      A('e', 'u22', '2016-05-25 15:11', 'changed status to In progress'),
      A('e', 'u22', '2016-06-01 17:00', 'changed status to Resolved'),
      A('c', 'u1', '2016-06-03 11:20', 'V5.10.01.14에서 카트리지 교체 50회 반복 테스트 이상 없습니다. 종료합니다.'),
      A('e', 'u1', '2016-06-03 11:21', 'changed status to Closed')
    ]
  },
  {
    id: 'D:eco', title: '[SL-M3065FW] 절전 모드 소비전력 2.1W 측정 (에너지스타 기준 초과)', model: 'SL-M3065FW', comp: 'Power / Sleep', sev: 'critical', status: 'closed', fw: 'V4.00.02.06',
    reporter: 'u15', assignees: ['u17'], created: '2016-10-18 09:30',
    desc: '에너지스타 사전 측정에서 슬립 모드 소비전력이 2.1W로 측정되었습니다. 기준은 1.6W 이하입니다. 유선 네트워크 연결 시에만 발생합니다.',
    attachments: [F_('power_measure_m3065fw.csv', 18000, 'text/csv')],
    activity: [
      A('e', 'u15', '2016-10-18 09:30', 'reported this defect'), A('e', 'u15', '2016-10-18 09:31', 'assigned 장현우'),
      A('c', 'u17', '2016-10-18 16:00', '슬립 진입 시 이더넷 PHY가 저전력 모드로 내려가지 않고 있습니다. WoL 대기에 필요한 최소 상태로 내리도록 수정하겠습니다.'),
      A('e', 'u17', '2016-10-18 16:01', 'changed status to In progress'),
      A('c', 'u12', '2016-10-19 09:10', '인증 일정 때문에 이번 주 내 처리가 필요합니다. 하드웨어 확인이 필요하면 @최영호 책임님께 요청하세요.'),
      A('c', 'u5', '2016-10-19 13:30', 'PHY 저전력 모드 진입 시 링크 유지 조건 확인했습니다. 하드웨어 변경은 필요 없습니다.'),
      A('c', 'u17', '2016-10-20 18:40', '{CR:eco} 리뷰 요청했습니다. 수정 후 1.3W 측정됩니다.'),
      A('e', 'u17', '2016-10-24 10:00', 'changed status to Resolved'),
      A('c', 'u15', '2016-10-26 10:00', 'V4.00.02.08에서 1.3W 확인했습니다. 인증 시료 제출 완료. 종료합니다.'),
      A('e', 'u15', '2016-10-26 10:01', 'changed status to Closed')
    ]
  },
  {
    id: 'D:xss', title: 'SyncThru: stored XSS in the device location field', model: 'SL-M4580FX', comp: 'Security', sev: 'critical', status: 'closed', fw: 'V4.00.02.21',
    reporter: 'u14', assignees: ['u26'], created: '2016-12-06 13:20',
    desc: 'The device location field in SyncThru accepts HTML and renders it unescaped on the Information page, so a script entered by an admin runs for every visitor.\nFound in the static analysis review and confirmed manually. Affects every ProXpress model on the XOA platform.',
    affects: { lines: ['ProXpress Mono', 'ProXpress Color'], models: [] },
    activity: [
      A('e', 'u14', '2016-12-06 13:20', 'reported this defect'), A('e', 'u14', '2016-12-06 13:21', 'assigned 황보라'),
      A('c', 'u26', '2016-12-06 16:10', 'Confirmed. The Information page template uses innerHTML for the location and contact fields. Escaping every device info field.'),
      A('e', 'u26', '2016-12-06 16:11', 'changed status to In progress'),
      A('c', 'u32', '2016-12-07 09:00', '금융권 고객 보안 점검 일정이 있어 다음 릴리스에 반드시 포함되어야 합니다.'),
      A('c', 'u26', '2016-12-08 17:30', 'Fix in {CR:xss}.'),
      A('e', 'u26', '2016-12-12 10:00', 'changed status to Resolved'),
      A('c', 'u24', '2016-12-14 15:00', 'Verified with the OWASP ZAP baseline scan on V4.00.02.23. Closing.'),
      A('e', 'u24', '2016-12-14 15:01', 'changed status to Closed')
    ]
  }
];

export const HW_REVIEWS: Review[] = [
  {
    id: 'CR:duplex', title: 'Restore duplex reverse motor timing for SL-C3060FR (Jam 0x21)', type: 'Bug fix', branch: 'fw/c3060/fix-duplex-jam-0x21', author: 'u2',
    reviewers: RV('u7', 'u11:approved'), status: 'in_review', linked: 'D:duplex', submitted: '2017-09-14 11:15',
    desc: 'V4.00.03.20에서 변경된 듀플렉스 반전 모터 구동 타이밍(-18ms)을 원복합니다. 최영호 책임 측정 결과 센서 응답은 정상 범위로, 타이밍 변경이 원인으로 확인되었습니다.\n\n테스트: A4 / Letter 80g, 양면 200매 × 3회, Jam 0건',
    attachments: [F_('duplex_200x3_test_report.pdf', 420000, 'application/pdf')],
    files: [
      FD('engine/duplex/duplex_motor.c', ['@@ -212,7 +212,7 @@ static void duplex_reverse_start(void)', ' {', '     motor_set_dir(DUPLEX_MOTOR, DIR_REVERSE);', '-    timer_start(DUPLEX_TMR, DUPLEX_REV_DELAY_MS - 18);', '+    timer_start(DUPLEX_TMR, DUPLEX_REV_DELAY_MS);', '     sensor_arm(DUPLEX_EXIT_SNS);', ' }']),
      FD('engine/duplex/duplex_cfg.h', ['@@ -40,3 +40,4 @@', ' #if defined(MODEL_C3060)', '+/* Do not shorten: exit sensor needs >= 140 ms after reverse start ({D:duplex}) */', ' #define DUPLEX_REV_DELAY_MS   (142)'])
    ],
    activity: [
      A('e', 'u2', '2017-09-14 11:15', 'requested a code review'), A('e', 'u7', '2017-09-14 13:02', 'assigned 한도윤 as reviewer'),
      A('e', 'u7', '2017-09-14 13:03', 'assigned 윤재석 as reviewer'),
      A('d', 'u11', '2017-09-14 18:40', 'LGTM. 타이밍 원복과 주석 추가 확인했습니다.', 'approved'),
      A('c', 'u7', '2017-09-15 09:15', 'duplex_cfg.h 매크로가 C3060 계열 외 다른 모델에도 영향 있는지 확인 부탁드립니다. C3010 계열이 같은 헤더를 사용합니다.'),
      A('c', 'u2', '2017-09-15 10:02', 'C3010 계열은 별도 오버라이드 값을 사용해서 영향 없습니다. 빌드 로그 첨부합니다.', null, [F_('build_c3010_c3060.log', 96000, 'text/plain')])
    ]
  },
  {
    id: 'CR:wfd', title: 'Wi-Fi Direct reconnect: refresh group owner info on idle timeout', type: 'Firmware update', branch: 'fw/m2020/wfd-reconnect', author: 'u4',
    reviewers: RV('u6:changes'), status: 'changes', linked: 'D:wfd', submitted: '2017-09-12 16:40',
    desc: 'On idle timeout, refresh the group owner info and reconnect instead of tearing the session down. Targets firmware V3.00.03.10.',
    attachments: [],
    files: [FD('net/wfd/wfd_session.c', ['@@ -88,6 +88,9 @@ void wfd_on_idle_timeout(wfd_ctx_t *ctx)', '     wfd_log(LOG_INFO, "idle timeout");', '-    wfd_disconnect(ctx);', '+    wfd_refresh_go_info(ctx);', '+    while (!wfd_reconnect(ctx)) {', '+        os_sleep_ms(500);', '+    }', ' }'])],
    activity: [
      A('e', 'u4', '2017-09-12 16:40', 'requested a code review'), A('e', 'u7', '2017-09-12 17:30', 'assigned 정민아 as reviewer'),
      A('d', 'u6', '2017-09-13 15:20', 'Reconnect loop has no upper bound. Please cap retries (max 5) and add backoff, otherwise a lost peer keeps the radio awake and breaks sleep mode.', 'changes'),
      A('c', 'u4', '2017-09-13 18:00', 'Understood, will add exponential backoff and a retry cap.')
    ]
  },
  {
    id: 'CR:addrbook', title: 'SyncThru address book: process CSV import in 32 KB chunks', type: 'Bug fix', branch: 'web/syncthru/addrbook-chunked-import', author: 'u9',
    reviewers: [], status: 'pending', linked: 'D:addrbook', submitted: '2017-09-15 09:30',
    desc: 'Reads the uploaded CSV in 32 KB chunks instead of a single 64 KB buffer. Tested with 500, 2,000 and 10,000 entry files.',
    attachments: [],
    files: [FD('web/syncthru/addressbook/import.js', ['@@ -54,8 +54,11 @@ function importCsv(file) {', '-  var text = readAll(file, 65536);', '-  return parseRows(text);', '+  var rows = [];', '+  readChunks(file, 32768, function (chunk) {', '+    rows = rows.concat(parseRows(chunk));', '+  });', '+  return rows;', ' }'])],
    activity: [A('e', 'u9', '2017-09-15 09:30', 'requested a code review')]
  },
  {
    id: 'CR:tonerko', title: 'Panel UI: add missing ko-KR string keys for toner warnings', type: 'Localization', branch: 'ui/panel/ko-toner-strings', author: 'u3',
    reviewers: RV('u6:approved'), status: 'approved', linked: 'D:tonerko', submitted: '2017-09-04 10:00',
    desc: 'ko-KR 리소스에 누락된 토너 경고 문자열 키 2개를 추가합니다.',
    attachments: [F_('panel_toner_low_ko.jpg', 510000, 'image/jpeg')],
    files: [FD('ui/panel/res/strings_ko.xml', ['@@ -311,2 +311,4 @@', '   <string id="TONER_EMPTY">토너를 교체하세요</string>', '+  <string id="TONER_LOW">토너가 부족합니다</string>', '+  <string id="TONER_VERY_LOW">토너가 거의 없습니다. 교체를 준비하세요</string>'])],
    activity: [A('e', 'u3', '2017-09-04 10:00', 'requested a code review'), A('e', 'u11', '2017-09-04 10:40', 'assigned 정민아 as reviewer'), A('d', 'u6', '2017-09-04 16:25', '문구 검수 완료. 승인합니다.', 'approved')]
  },
  {
    id: 'CR:securepin', title: 'Secure print: PIN release on MultiXpress X7600 panel', type: 'Feature', branch: 'sol/x7600/secure-pin-release', author: 'u10',
    reviewers: RV('u7:approved', 'u11:approved'), status: 'approved', linked: '', submitted: '2017-08-30 14:00',
    desc: '보안 인쇄 작업을 조작부에서 PIN 입력 후 출력하는 기능을 추가합니다. PIN 5회 오류 시 작업이 삭제됩니다.',
    files: [], attachments: [F_('secure_print_flow.mp4', 15800000, 'video/mp4')],
    activity: [
      A('e', 'u10', '2017-08-30 14:00', 'requested a code review'), A('e', 'u7', '2017-08-30 15:10', 'assigned 한도윤 as reviewer'), A('e', 'u7', '2017-08-30 15:11', 'assigned 윤재석 as reviewer'),
      A('d', 'u7', '2017-09-01 11:00', 'PIN이 작업 로그에 평문으로 남습니다. 마스킹 처리 후 다시 올려주세요.', 'changes'),
      A('e', 'u10', '2017-09-04 09:30', 'resubmitted for review'), A('d', 'u7', '2017-09-05 15:00', '확인했습니다. 승인합니다.', 'approved'),
      A('d', 'u11', '2017-09-05 17:20', 'Masking verified in the job log and SyncThru export. Approved.', 'approved')
    ]
  },
  {
    id: 'CR:watermark', title: 'PCL6: correct landscape watermark offset for Letter', type: 'Bug fix', branch: 'drv/pcl6/watermark-landscape', author: 'u9',
    reviewers: RV('u11:approved'), status: 'approved', linked: 'D:watermark', submitted: '2017-09-01 11:00',
    desc: 'Use the rotated page width when centering the watermark in landscape.', files: [], attachments: [],
    activity: [A('e', 'u9', '2017-09-01 11:00', 'requested a code review'), A('e', 'u7', '2017-09-01 11:40', 'assigned 윤재석 as reviewer'), A('d', 'u11', '2017-09-02 10:20', 'Verified on Letter, Legal and A4. Approved.', 'approved')]
  },
  {
    id: 'CR:faxflush', title: 'Fax: flush RX buffer to NAND before entering sleep', type: 'Bug fix', branch: 'fw/m4080/fax-rx-flush', author: 'u4',
    reviewers: [], status: 'pending', linked: 'D:faxsleep', submitted: '2017-09-13 18:00',
    desc: 'Forces a flush of the fax receive buffer from the power manager prepare-sleep hook.', attachments: [],
    files: [FD('fax/fax_power.c', ['@@ -130,5 +130,7 @@ int fax_pm_prepare_sleep(void)', '     if (fax_rx_active())', '         return PM_BUSY;', '+    if (fax_rx_buffer_dirty())', '+        fax_rx_flush_nand();   /* {D:faxsleep} */', '     return PM_OK;'])],
    activity: [A('e', 'u4', '2017-09-13 18:00', 'requested a code review')]
  },
  {
    id: 'CR:snmp', title: 'Remove legacy SNMPv1 default community strings', type: 'Refactor', branch: 'net/snmp/remove-v1-defaults', author: 'u10',
    reviewers: RV('u7:denied'), status: 'denied', linked: '', submitted: '2017-08-28 10:00',
    desc: 'SNMPv1 기본 community string(public/private)을 제거합니다.', files: [], attachments: [],
    activity: [
      A('e', 'u10', '2017-08-28 10:00', 'requested a code review'), A('e', 'u7', '2017-08-28 11:00', 'assigned 한도윤 as reviewer'),
      A('d', 'u7', '2017-08-29 17:00', 'SNMPv1 기본값은 공공기관 납품 모델에서 아직 사용 중입니다. 사업부 보안 정책 확정 후 별도 설정 옵션으로 다시 제안해 주세요.', 'denied')
    ]
  },
  {
    id: 'CR:tls', title: 'SyncThru: rebuild the TLS context when the minimum protocol version changes', type: 'Security fix', branch: 'web/syncthru/tls-min-version-reload', author: 'u26',
    reviewers: RV('u28'), status: 'in_review', linked: 'D:tls', submitted: '2017-09-14 17:20',
    desc: 'Rebuilds the SSL context whenever the minimum TLS version or cipher list changes, instead of reusing the context created at boot. Also stops offering TLS 1.0/1.1 cipher suites when "TLS 1.2 only" is set.\n\nTested: sslscan and the nightly security suite on SL-M4580FX and SL-C3060FR.',
    attachments: [F_('nightly_security_suite_0914.html', 184000, 'text/html')],
    files: [
      FD('web/syncthru/httpd/tls_config.c', ['@@ -101,9 +101,14 @@ int tls_config_apply(const sec_policy_t *p)', ' \tif (!p)', ' \t\treturn -EINVAL;', '-\ttls_set_min_version(g_ctx, p->min_version);', '-\ttls_set_ciphers(g_ctx, p->ciphers);', '-\treturn 0;', '+\ttls_ctx_t *next = tls_ctx_new(p->min_version, p->ciphers);', '+\tif (!next)', '+\t\treturn -ENOMEM;', '+\t/* Existing sessions keep the old context until they close. */', '+\ttls_ctx_t *old = atomic_xchg(&g_ctx, next);', '+\ttls_ctx_release_when_idle(old);', '+\treturn 0;', ' }']),
      FD('test/unit/test_tls_config.c', ['@@ -0,0 +1,5 @@', '+TEST(tls_min_version_reload) {', '+\tapply_policy(TLS_1_2_ONLY);', '+\tASSERT_REJECTS(handshake(TLS_1_0));', '+\tASSERT_ACCEPTS(handshake(TLS_1_2));', '+}'])
    ],
    activity: [
      A('e', 'u26', '2017-09-14 17:20', 'requested a code review'), A('e', 'u7', '2017-09-14 17:50', 'assigned 문준영 as reviewer'),
      A('c', 'u28', '2017-09-15 09:20', 'tls_ctx_release_when_idle()가 관리자 세션을 강제로 끊지 않는지 확인 부탁드립니다. 설정 변경 중에 세션이 끊기면 안 됩니다.')
    ]
  },
  {
    id: 'CR:udp', title: 'UPD: query Secure Print status off the spooler thread', type: 'Bug fix', branch: 'drv/upd/secure-print-async-status', author: 'u27',
    reviewers: RV('u29:approved', 'u11'), status: 'in_review', linked: 'D:udp', submitted: '2017-09-11 18:50',
    desc: 'Moves the device status query in the Secure Print dialog to a worker thread and caches the result for 30 seconds. The dialog shows "Checking device..." until the result arrives instead of blocking spoolsv.exe.\n\nTested on Windows 10 1607 and 1703 (x64 and x86) and on a Windows Server 2012 R2 print server with 20 clients.',
    attachments: [F_('upd_secure_print_test_matrix.xlsx', 64000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')],
    files: [FD('driver/upd/ui/secure_print_dlg.cpp', ['@@ -146,8 +146,12 @@ BOOL SecurePrintDlg::OnInitDialog()', '     SetDlgItemText(IDC_STATUS, L"");', '-    DeviceStatus st = QueryDeviceStatus(m_port);', '-    UpdateStatus(st);', '+    SetDlgItemText(IDC_STATUS, LoadStr(IDS_CHECKING_DEVICE));', '+    m_worker = StartWorker([hwnd = m_hWnd, port = m_port] {', '+        DeviceStatus st = StatusCache::Get(port, 30 /* s */);', '+        if (IsWindow(hwnd))', '+            PostMessage(hwnd, WM_DEVICE_STATUS, 0, st.Pack());', '+    });', '     return TRUE;', ' }'])],
    activity: [
      A('e', 'u27', '2017-09-11 18:50', 'requested a code review'), A('e', 'u7', '2017-09-12 09:05', 'assigned Rohan Desai as reviewer'), A('e', 'u7', '2017-09-12 09:06', 'assigned 윤재석 as reviewer'),
      A('d', 'u29', '2017-09-13 15:30', 'Threading looks right and the cache invalidation is covered. Approved.', 'approved'),
      A('c', 'u11', '2017-09-14 11:00', 'What happens if the dialog closes before the worker finishes? Please confirm the callback checks the window handle.'),
      A('c', 'u27', '2017-09-14 14:20', 'It posts to the HWND only if IsWindow() is still true, and the worker is joined in OnDestroy. Added a test for that path.')
    ]
  },
  {
    id: 'CR:cardauth', title: 'Secure print: compare badge UIDs as strings', type: 'Bug fix', branch: 'sol/x4300/badge-uid-leading-zero', author: 'u30',
    reviewers: RV('u28:changes'), status: 'changes', linked: 'D:cardauth', submitted: '2017-09-11 18:00',
    desc: '카드 UID를 숫자로 변환하지 않고 문자열 그대로 비교합니다. 기존에 숫자로 저장된 매핑은 부팅 시 한 번 변환합니다.',
    attachments: [],
    files: [FD('sol/secureprint/badge_auth.c', ['@@ -72,7 +72,7 @@ static int badge_lookup_user(const char *uid, user_t *out)', ' \tfor (int i = 0; i < g_map_count; i++) {', '-\t\tif (strtoul(uid, NULL, 16) == g_map[i].uid_num) {', '+\t\tif (strcasecmp(uid, g_map[i].uid) == 0) {', ' \t\t\t*out = g_map[i].user;', ' \t\t\treturn 0;', ' \t\t}'])],
    activity: [
      A('e', 'u30', '2017-09-11 18:00', 'requested a code review'), A('e', 'u7', '2017-09-12 08:50', 'assigned 문준영 as reviewer'),
      A('d', 'u28', '2017-09-12 16:10', '마이그레이션 코드에서는 원래 카드 번호 자릿수를 알 수 없어 앞자리 0을 복원할 수 없습니다. 카드 리더에서 받은 원본 길이를 같이 저장하도록 수정해 주세요.', 'changes'),
      A('c', 'u30', '2017-09-13 10:00', '리더 펌웨어에서 UID 길이를 받을 수 있는지 확인 중입니다. @권태현 그룹장님, 고객사 등록 카드 형식 공유 부탁드립니다.')
    ]
  },
  {
    id: 'CR:buildci', title: 'Move nightly firmware builds to the new Perforce stream layout', type: 'Build / CI', branch: 'build/streams/nightly-main-layout', author: 'u34',
    reviewers: RV('u29:approved', 'u7:approved'), status: 'approved', linked: '', submitted: '2017-09-06 11:30',
    desc: 'Points every nightly job at the new stream layout (//printing/main, //printing/rel/*) that replaced the ClearCase integration streams. Old depot paths stay readable for history.\n\nTested with a dry run of all 44 model builds.',
    attachments: [F_('nightly_dry_run_0906.txt', 132000, 'text/plain')],
    files: [FD('build/jenkins/nightly.groovy', ['@@ -4,9 +4,9 @@ def models = readModels()', ' pipeline {', '   environment {', '-    P4_STREAM = "//depot/printing/main"', '-    CC_VIEW   = "printing_fw_int"', '+    P4_STREAM = "//printing/main"', '+    REL_STREAMS = "//printing/rel/..."', '   }', '   stages {', '     stage(\'Sync\') { steps { p4sync stream: env.P4_STREAM } }'])],
    activity: [
      A('e', 'u34', '2017-09-06 11:30', 'requested a code review'), A('e', 'u7', '2017-09-06 13:00', 'assigned Rohan Desai as reviewer'), A('e', 'u7', '2017-09-06 13:01', 'assigned 한도윤 as reviewer'),
      A('d', 'u29', '2017-09-07 10:15', 'Dry run log looks clean for all models. Approved.', 'approved'),
      A('d', 'u7', '2017-09-07 17:40', '웨이브 3 팀 일정과 맞춰서 다음 주 월요일부터 적용하겠습니다. 승인합니다.', 'approved')
    ]
  },
  {
    id: 'CR:drs', title: 'DRS: mirror ClearQuest attachments to Jira for wave 3 teams', type: 'Feature', branch: 'tools/drs/cq-jira-attachments', author: 'u13',
    reviewers: RV('u7'), status: 'in_review', linked: '', submitted: '2017-09-13 16:00',
    desc: 'Copies ClearQuest attachments to the mirrored Jira issue during sync, so wave 3 teams can open logs and photos from Jira before their cutover. Files over 20 MB are linked instead of copied.\n\nTested against a copy of the PRNT ClearQuest database with 1,200 records.',
    attachments: [],
    files: [FD('tools/drs/sync/attachments.js', ['@@ -22,6 +22,15 @@ async function syncRecord(cq, jira, rec) {', '   const issue = await jira.findByCqId(rec.id);', '   await jira.updateFields(issue, mapFields(rec));', '+  for (const att of await cq.attachments(rec.id)) {', '+    if (await jira.hasAttachment(issue, att.name)) continue;', '+    if (att.size > 20 * 1024 * 1024) {', '+      await jira.addLink(issue, cq.attachmentUrl(rec.id, att.name), att.name);', '+    } else {', '+      await jira.attach(issue, att.name, await cq.download(rec.id, att.name));', '+    }', '+  }', '+  log.info(`synced ${rec.id} -> ${issue.key}`);', ' }'])],
    activity: [A('e', 'u13', '2017-09-13 16:00', 'requested a code review'), A('e', 'u7', '2017-09-13 16:20', 'assigned 한도윤 as reviewer')]
  },
  {
    id: 'CR:gcp', title: 'Cloud Print: use the SyncThru proxy credentials for registration', type: 'Bug fix', branch: 'fw/m2070/fix-gcp-proxy-auth', author: 'u4',
    reviewers: RV('u11:approved'), status: 'approved', linked: 'D:gcp', submitted: '2016-03-15 17:40',
    desc: 'Passes the proxy user name and password saved in SyncThru to the Cloud Print HTTP client. Previously only the proxy host and port were used.',
    attachments: [],
    files: [FD('net/gcp/gcp_register.c', ['@@ -64,6 +64,10 @@ static int gcp_http_init(http_client_t *c)', ' \tif (net_proxy_enabled()) {', ' \t\thttp_set_proxy(c, net_proxy_host(), net_proxy_port());', '+\t\tif (net_proxy_auth_enabled()) {', '+\t\t\thttp_set_proxy_auth(c, net_proxy_user(), net_proxy_pass(),', '+\t\t\t                    HTTP_AUTH_BASIC | HTTP_AUTH_NTLM);', '+\t\t}', ' \t}', ' \treturn 0;'])],
    activity: [
      A('e', 'u4', '2016-03-15 17:40', 'requested a code review'), A('e', 'u7', '2016-03-16 09:00', 'assigned 윤재석 as reviewer'),
      A('d', 'u11', '2016-03-17 11:20', 'Checked basic and NTLM against the Bangalore proxy. Approved.', 'approved')
    ]
  },
  {
    id: 'CR:eco', title: 'Power: put the Ethernet PHY in low-power mode during deep sleep', type: 'Bug fix', branch: 'fw/m3065/fix-sleep-phy-power', author: 'u17',
    reviewers: RV('u6:approved', 'u11:approved'), status: 'approved', linked: 'D:eco', submitted: '2016-10-20 18:30',
    desc: '슬립 진입 시 이더넷 PHY를 Energy Efficient Ethernet 저전력 모드로 전환하고, WoL 매직 패킷 감지만 유지합니다.\n\n측정: 슬립 소비전력 2.1W에서 1.3W로 감소 (에너지스타 기준 1.6W)',
    attachments: [F_('power_after_fix.csv', 17000, 'text/csv')],
    files: [FD('power/sleep/eth_phy_pm.c', ['@@ -40,6 +40,9 @@ void eth_phy_enter_sleep(const pm_cfg_t *cfg)', ' \tphy_write(PHY_REG_CTRL, PHY_CTRL_AUTONEG);', '+\tphy_write(PHY_REG_EEE, PHY_EEE_LPI_ENABLE);', '+\tif (cfg->wol)', '+\t\tphy_write(PHY_REG_WOL, PHY_WOL_MAGIC_ONLY);', ' \tphy_set_speed(PHY_SPEED_10M);'])],
    activity: [
      A('e', 'u17', '2016-10-20 18:30', 'requested a code review'), A('e', 'u7', '2016-10-21 08:40', 'assigned 정민아 as reviewer'), A('e', 'u7', '2016-10-21 08:41', 'assigned 윤재석 as reviewer'),
      A('d', 'u6', '2016-10-21 14:00', '측정 결과 확인했습니다. 승인합니다.', 'approved'),
      A('d', 'u11', '2016-10-21 16:30', 'WoL still works with Eco mode on. Approved.', 'approved')
    ]
  },
  {
    id: 'CR:xss', title: 'SyncThru: escape device info fields on the Information page', type: 'Security fix', branch: 'web/syncthru/escape-device-info', author: 'u26',
    reviewers: RV('u28:approved'), status: 'approved', linked: 'D:xss', submitted: '2016-12-08 17:20',
    desc: 'Renders the location, contact and device name fields as text instead of HTML on the Information page, and rejects angle brackets on save. Existing values are escaped on display, so devices in the field are covered without a settings migration.',
    attachments: [],
    files: [FD('web/syncthru/views/device_info.js', ['@@ -31,7 +31,7 @@ function renderDeviceInfo(info) {', '   var el = document.getElementById("dev-location");', '-  el.innerHTML = info.location;', '+  el.textContent = info.location;', '   document.getElementById("dev-contact").textContent = info.contact;'])],
    activity: [
      A('e', 'u26', '2016-12-08 17:20', 'requested a code review'), A('e', 'u7', '2016-12-08 17:45', 'assigned 문준영 as reviewer'),
      A('d', 'u28', '2016-12-09 11:30', '다른 필드에서도 innerHTML 사용 없는지 grep 결과 첨부 확인했습니다. 승인합니다.', 'approved')
    ]
  }
];
