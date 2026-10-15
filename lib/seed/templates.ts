// Building blocks for the generated history. Titles mix Korean and English the
// way the Suwon and Bangalore teams wrote them. "{m}" is replaced with a model id.

/** [component, title, description, steps?] */
export const DT: [string, string, string, string?][] = [
  ['Print Engine', '[{m}] 저온 환경에서 첫 장 인쇄 시 정착 불량 (토너 묻어남)', '10°C 이하 환경에서 절전 복귀 후 첫 장 인쇄 시 토너가 손에 묻어납니다.', '1. 항온항습실을 8°C로 설정\n2. 절전 모드 진입 후 30분 대기\n3. PC에서 텍스트 1페이지 인쇄\n4. 출력물 문질러서 정착 상태 확인'],
  ['Print Engine', '[{m}] Banding on halftone pages after 20k prints', 'Horizontal banding appears roughly every 94 mm on halftone test pages after the page counter passes 20,000.'],
  ['Print Engine', '[{m}] 봉투(C5) 인쇄 시 후단 구김 발생', 'C5 봉투 인쇄 시 정착부 이후 구간에서 구김이 발생합니다.'],
  ['Print Engine', '[{m}] Ghosting on heavy paper (163 g/m²) with "Thick" media type', 'Images repeat faintly about 75 mm below the original on 163 g/m² stock when the media type is set to Thick.', '1. Load 163 g/m² paper in the MP tray\n2. Set the media type to Thick\n3. Print the ghosting test chart\n4. Check 75 mm below each solid patch'],
  ['Print Engine', '[{m}] 연속 500매 인쇄 시 메인 모터 과열 경고 (E-0x3A)', '고온다습(30°C/80%) 환경에서 연속 500매 인쇄 시 메인 모터 과열 경고로 인쇄가 중단됩니다.'],
  ['Print Engine', '[{m}] Skew over 1.5 mm on Tray 2 with A5 paper', 'Pages fed from Tray 2 with A5 paper are skewed by more than 1.5 mm, outside the 1.0 mm spec.'],
  ['Scanner / ADF', '[{m}] ADF 다중 급지 시 경고 없이 스캔 완료', 'ADF에서 2매가 겹쳐 급지되어도 경고 없이 스캔이 완료되어 페이지가 누락됩니다.', '1. 80g 용지 30매를 ADF에 적재\n2. 두 장을 살짝 붙여서 중간에 삽입\n3. 스캔 to 이메일 실행\n4. PDF 페이지 수 확인'],
  ['Scanner / ADF', '[{m}] Scan to Email drops PDFs larger than 10 MB', 'When a scanned PDF exceeds 10 MB the job reports success but no email is delivered.'],
  ['Scanner / ADF', '[{m}] 컬러 스캔 시 붉은색 계열 채도 저하', '컬러 스캔에서 빨간색 계열이 원본 대비 채도가 낮게 표현됩니다.'],
  ['Scanner / ADF', '[{m}] Scan to SMB fails with Windows Server 2016 (SMB2 signing required)', 'Scan to SMB returns "Server error (E-551)" when the share requires SMB2 signing, as on Windows Server 2016 defaults.', '1. Create a share on Windows Server 2016 with default policies\n2. Add it as an SMB destination on the panel\n3. Scan one page to the share\n4. The panel shows E-551'],
  ['Scanner / ADF', '[{m}] 양면 스캔 시 짝수 페이지 180도 회전되어 저장', 'ADF 양면 스캔에서 "위로 넘김" 설정 시 짝수 페이지가 180도 회전되어 PDF에 저장됩니다.'],
  ['Copy', '[{m}] ID 카드 복사 시 앞뒷면 이미지 간격 불균일', 'ID 카드 복사에서 앞면과 뒷면 사이 간격이 매번 다르게 출력됩니다.'],
  ['Copy', '[{m}] Reduce/Enlarge 70% on A3 to A4 cuts off the right margin', 'Copying A3 to A4 with the 70% preset loses about 4 mm on the right edge.'],
  ['Copy', '[{m}] 컬러 복사 시 "사진" 모드에서 피부색이 붉게 표현됨', '사진 모드 컬러 복사에서 인물 피부색이 원본보다 붉게 표현됩니다.'],
  ['Copy', '[{m}] Book copy mode ignores the "Erase center shadow" option', 'The center-shadow erase option has no effect in book copy mode.'],
  ['Fax', '[{m}] 해외 팩스 송신 시 ECM 오류로 3페이지 이후 실패', 'ECM 모드로 해외 송신 시 3페이지 이후 통신 오류(E-0x15)로 중단됩니다.', '1. ECM 모드 켜기\n2. 해외 테스트 회선(+44)으로 5페이지 송신\n3. 3페이지 전송 후 오류 확인'],
  ['Fax', '[{m}] Fax forward to SMB ignores the configured file name prefix', 'Received faxes forwarded to a network folder use the default name instead of the configured prefix.'],
  ['Fax', '[{m}] Fax to Email attaches a blank first page', 'Received faxes forwarded to email contain an extra blank page at the start of the PDF.'],
  ['Fax', '[{m}] 일본 PSTN 환경에서 다이얼톤 감지 실패', '일본 회선 환경에서 다이얼톤을 감지하지 못해 송신이 시작되지 않습니다.'],
  ['Network / Wi-Fi', '[{m}] IPv6 전용 네트워크에서 AirPrint 검색 안 됨', 'IPv6만 활성화된 환경에서 macOS / iOS 기기에서 프린터가 검색되지 않습니다.'],
  ['Network / Wi-Fi', '[{m}] Printer unreachable after DHCP lease renewal', 'After a DHCP lease renewal the printer keeps the old address and is unreachable until reboot.', '1. Set the DHCP lease time to 10 minutes\n2. Change the reservation to a new address\n3. Wait for renewal\n4. Ping the old and new addresses'],
  ['Network / Wi-Fi', '[{m}] WPA2-Enterprise(PEAP) 연결 시 인증서 검증 실패', '사내 인증서로 PEAP 연결 시 인증서 체인 검증 오류로 연결되지 않습니다.'],
  ['Network / Wi-Fi', '[{m}] 802.1X 인증서 갱신 후 네트워크 연결 안 됨', '802.1X 클라이언트 인증서를 갱신한 뒤 재부팅하면 네트워크에 연결되지 않습니다.'],
  ['Network / Wi-Fi', '[{m}] Bonjour name collision makes the printer disappear from macOS', 'When two printers share the same default Bonjour name, the second one never appears in macOS printer lists.'],
  ['SyncThru Web UI', '[{m}] SyncThru: 관리자 비밀번호 변경 후 기존 세션 유지됨', '관리자 비밀번호를 변경해도 기존 로그인 세션이 만료되지 않습니다.'],
  ['SyncThru Web UI', '[{m}] SyncThru job log export uses UTC timestamps', 'The exported job log CSV uses UTC instead of the device time zone.'],
  ['SyncThru Web UI', '[{m}] SyncThru: Address book export misses group members', 'The address book export only includes individual entries; group membership is lost.'],
  ['SyncThru Web UI', '[{m}] SyncThru 작업 관리 화면이 IE11 호환성 보기에서 깨짐', 'IE11 호환성 보기에서 작업 관리 화면의 레이아웃이 깨지고 버튼이 동작하지 않습니다.'],
  ['Panel UI', '[{m}] 조작부 우측 하단 터치 좌표 5px 어긋남', '조작부 우측 하단 버튼 터치 시 인접 버튼이 선택됩니다.'],
  ['Panel UI', '[{m}] Copy count field accepts 0 and starts an empty job', 'Entering 0 copies is accepted and sends an empty job to the engine.'],
  ['Panel UI', '[{m}] Hindi labels truncated on the job status screen', 'Hindi labels are cut off on the job status screen at the default font size.'],
  ['Panel UI', '[{m}] 7인치 조작부에서 빠르게 두 번 터치 시 앱 강제 종료', '홈 화면에서 앱 아이콘을 빠르게 두 번 터치하면 앱이 강제 종료됩니다.'],
  ['Panel UI', '[{m}] Arabic job names render left-to-right on the job status screen', 'Job names in Arabic are displayed left-to-right and the characters are disconnected.'],
  ['Print Driver', '[{m}] UPD N-up 인쇄 시 사용자 지정 여백 무시', 'N-up(2-up, 4-up) 인쇄 시 사용자 지정 여백이 적용되지 않습니다.'],
  ['Print Driver', '[{m}] PS driver booklet mode reverses page order on Windows 10', 'Booklet mode on Windows 10 prints pages in reverse order.'],
  ['Print Driver', '[{m}] Duplex option missing in macOS Sierra print dialog', 'The two-sided printing option is not shown in the print dialog on macOS 10.12.'],
  ['Print Driver', '[{m}] Secure Print PIN field accepts letters in the PCL6 driver', 'The Secure Print PIN field accepts non-numeric characters; the job is then rejected on the device.'],
  ['Print Driver', '[{m}] UPD 설치 후 기본 용지가 Letter로 설정됨', '한국어 Windows 10에서 UPD 설치 후 기본 용지가 A4가 아닌 Letter로 설정됩니다.', '1. 한국어 Windows 10 x64 클린 설치\n2. UPD 설치 후 프린터 추가\n3. 인쇄 기본 설정 > 용지 크기 확인'],
  ['Mobile Print', '[{m}] Samsung Mobile Print: NFC tap does not open the app on Android 7', 'Tapping an NFC-enabled phone on the panel does nothing on Android 7.0 devices.'],
  ['Mobile Print', '[{m}] iOS AirPrint 작업이 양면 설정을 무시함', 'iOS 10에서 AirPrint로 양면 인쇄를 선택해도 단면으로 출력됩니다.'],
  ['Mobile Print', '[{m}] Mopria discovery shows the printer twice on dual-band Wi-Fi', 'On dual-band networks the printer appears twice in Mopria Print Service, and one entry fails.'],
  ['Mobile Print', '[{m}] Mobile Print 스캔 결과가 갤러리에 저장되지 않음', 'Samsung Mobile Print로 스캔한 이미지가 Android 갤러리에 나타나지 않습니다.'],
  ['Security', '[{m}] SyncThru admin session cookie set without the Secure flag', 'The admin session cookie is sent without the Secure and HttpOnly flags over HTTPS.'],
  ['Security', '[{m}] 보안 인쇄 작업이 재부팅 후 PIN 없이 출력됨', '보안 인쇄 대기 중 전원을 껐다 켜면 PIN 입력 없이 작업이 출력됩니다.', '1. PC에서 PIN 1234로 보안 인쇄 전송\n2. 작업이 대기 목록에 있는지 확인\n3. 전원 끄고 켜기\n4. 출력 여부 확인'],
  ['Security', '[{m}] Telnet port 23 open after factory reset', 'After a factory reset, Telnet is enabled again even though the security policy disables it.'],
  ['Security', '[{m}] 하드디스크 데이터 덮어쓰기(3회) 완료 후 감사 로그 미기록', 'HDD 이미지 덮어쓰기 3회 옵션 완료 후 감사 로그에 기록이 남지 않습니다.'],
  ['Finisher', '[{m}] A4 세로 2공 펀치 위치 2mm 치우침', 'A4 세로 방향 2공 펀치 시 펀치 위치가 중앙에서 약 2mm 벗어납니다.'],
  ['Finisher', '[{m}] Offset stacking disabled after a staple jam', 'After clearing a staple jam, offset stacking stays off until the device restarts.'],
  ['Finisher', '[{m}] 중철 제본 시 20매 이상에서 접지 위치 3mm 어긋남', '중철 제본 20매 이상에서 접지 위치가 중앙에서 약 3mm 어긋납니다.'],
  ['Toner / Supplies', '[{m}] 정품 토너 장착 후 "비정품 토너" 경고 표시', '정품 토너를 장착해도 간헐적으로 비정품 토너 경고가 표시됩니다.'],
  ['Toner / Supplies', '[{m}] Imaging unit counter resets after firmware update', 'The imaging unit page counter resets to 0 after updating firmware.'],
  ['Toner / Supplies', '[{m}] Toner yield estimate drops 15% after switching to Toner Save', 'The remaining-pages estimate drops about 15% after Toner Save is turned on, then recovers after restart.'],
  ['Power / Sleep', '[{m}] Deep sleep 상태에서 LPR 작업 수신 시 복귀 안 됨', 'Deep sleep 상태에서 LPR 작업을 수신해도 프린터가 깨어나지 않습니다.'],
  ['Power / Sleep', '[{m}] Wake-on-LAN ignored when Eco mode is on', 'With Eco mode on, the device ignores Wake-on-LAN magic packets.'],
  ['Power / Sleep', '[{m}] 저전력 모드 복귀에 18초 소요 (사양 10초)', '저전력 모드에서 인쇄 작업 수신 시 복귀까지 약 18초가 걸립니다. 사양은 10초 이내입니다.']
];

/** Typical files attached to new defects, per component: [name, size, type]. */
export const ATT: Record<string, [string, number, string][]> = {
  'Print Engine': [['engine_log.txt', 46200, 'text/plain'], ['print_sample.jpg', 910000, 'image/jpeg'], ['halftone_chart_scan.pdf', 1820000, 'application/pdf']],
  'Scanner / ADF': [['scan_result.pdf', 2400000, 'application/pdf'], ['adf_sensor_log.txt', 31000, 'text/plain']],
  Copy: [['copy_output.jpg', 1210000, 'image/jpeg'], ['original_scan.png', 2100000, 'image/png']],
  Fax: [['fax_t30_trace.log', 188000, 'text/plain'], ['fax_report.jpg', 640000, 'image/jpeg']],
  'Network / Wi-Fi': [['capture.pcapng', 3400000, 'application/vnd.tcpdump.pcap'], ['network_config.txt', 8200, 'text/plain']],
  'SyncThru Web UI': [['syncthru_screen.png', 380000, 'image/png'], ['har_export.zip', 520000, 'application/zip']],
  'Panel UI': [['panel_photo.jpg', 860000, 'image/jpeg'], ['panel_screen_recording.mp4', 9400000, 'video/mp4']],
  'Print Driver': [['driver_debug_log.zip', 1300000, 'application/zip'], ['print_preferences.png', 290000, 'image/png']],
  'Mobile Print': [['logcat.txt', 96000, 'text/plain'], ['app_screen.png', 410000, 'image/png']],
  Security: [['scan_report.txt', 22000, 'text/plain'], ['burp_request.txt', 6400, 'text/plain']],
  Finisher: [['finisher_log.txt', 54000, 'text/plain'], ['output_stack.jpg', 1040000, 'image/jpeg']],
  'Toner / Supplies': [['crum_dump.bin', 4096, 'application/octet-stream'], ['supplies_report.jpg', 520000, 'image/jpeg']],
  'Power / Sleep': [['power_measurement.csv', 18000, 'text/csv'], ['sleep_trace.log', 72000, 'text/plain']]
};

/** Bug-fix review titles per component. */
export const FIX: Record<string, string[]> = {
  'Print Engine': ['정착 온도 보정 테이블 수정', 'Correct fuser warm-up timing', 'Adjust transfer bias for heavy media'],
  'Scanner / ADF': ['ADF 급지 센서 판정 로직 수정', 'Fix scan job size handling', 'Negotiate SMB2 signing for scan destinations'],
  Copy: ['ID 카드 복사 이미지 배치 로직 수정', 'Fix reduce/enlarge margin calculation'],
  Fax: ['팩스 ECM 재전송 처리 수정', 'Fix fax forwarding file naming'],
  'Network / Wi-Fi': ['네트워크 재연결 처리 수정', 'Re-bind network interface after lease renewal'],
  'SyncThru Web UI': ['SyncThru 세션 만료 처리 수정', 'Use device time zone in SyncThru exports'],
  'Panel UI': ['조작부 터치 좌표 보정 값 수정', 'Validate copy count input on the panel'],
  'Print Driver': ['드라이버 N-up 여백 계산 수정', 'Fix booklet page ordering in the PS driver'],
  'Mobile Print': ['Mobile Print NFC 핸드오버 처리 수정', 'Deduplicate Mopria discovery records'],
  Security: ['관리자 세션 쿠키 보안 속성 추가', 'Re-apply security policy after factory reset'],
  Finisher: ['피니셔 펀치 위치 보정 값 수정', 'Restore offset stacking after staple jam recovery'],
  'Toner / Supplies': ['토너 인증 재시도 로직 수정', 'Persist imaging unit counter across updates'],
  'Power / Sleep': ['Deep sleep 네트워크 복귀 처리 수정', 'Honor Wake-on-LAN while Eco mode is on']
};

/** [title, branch slug] per change type. */
export const FEAT: [string, string][] = [
  ['Secure print: badge release on {m}', 'badge-release'], ['{m} 조작부 에코 리포트 화면 추가', 'eco-report'],
  ['SyncThru: SNMPv3 settings page for {m}', 'snmpv3-page'], ['Mobile Print: NFC tap-to-pair for {m}', 'nfc-pairing'],
  ['Scan to OneDrive for Business on {m}', 'scan-onedrive'], ['{m} 원격 진단 로그 업로드 기능 추가', 'remote-diag'],
  ['Google Cloud Print 2.0 support on {m}', 'gcp2'], ['{m} 사용자별 인쇄 할당량 기능 추가', 'print-quota'],
  ['Mopria 2.0 certification fixes for {m}', 'mopria2'], ['{m} 팩스 수신 문서 이메일 전달 기능 개선', 'fax-to-email'],
  ['Scan to Box for Smart UX on {m}', 'scan-box'], ['SyncThru: bulk address book import for {m}', 'addrbook-bulk']
];
export const REF: [string, string][] = [
  ['엔진 로그 링버퍼 구조 개선', 'engine-log-ringbuffer'], ['Enable static analysis gate on firmware CI', 'ci-static-analysis'],
  ['네트워크 스택 공통 모듈 분리', 'net-common-module'], ['Remove duplicated PDL parser utilities', 'pdl-parser-dedupe'],
  ['조작부 리소스 로더 정리', 'panel-resource-loader'], ['Split the job manager into print and scan queues', 'job-manager-split'],
  ['공통 설정 저장소(NVRAM) 접근 계층 정리', 'nvram-access-layer']
];
export const SEC: [string, string][] = [
  ['Disable TLS 1.0 on the SyncThru web server for {m}', 'tls10-off'], ['{m} SNMP community 문자열 기본값 제거', 'snmp-defaults'],
  ['Sanitize address book fields in SyncThru exports', 'addrbook-sanitize'], ['Rate-limit admin login attempts on {m}', 'login-ratelimit'],
  ['보안 인쇄 PIN 로그 마스킹', 'pin-mask']
];
export const LOC: [string, string][] = [
  ['Add Vietnamese panel strings for {m}', 'vi-panel-strings'], ['{m} 조작부 아랍어 RTL 레이아웃 수정', 'rtl-layout'],
  ['Update Hindi and Tamil font subsets', 'indic-fonts'], ['Polish (pl-PL) translations for SyncThru 2017', 'pl-syncthru']
];
export const BCI: [string, string][] = [
  ['Cache toolchain downloads on the firmware build farm', 'toolchain-cache'], ['빌드 서버 정적 분석 리포트 자동 업로드', 'sa-report-upload'],
  ['Split nightly builds per product line', 'nightly-split'], ['Sign release images on the build server', 'image-signing']
];
export const PERF: [string, string][] = [
  ['Speed up first page out on {m} by preheating the fuser on job receive', 'fpo-preheat'],
  ['{m} PDF 다이렉트 인쇄 래스터 처리 속도 개선', 'pdf-raster-speed'], ['Reduce SyncThru dashboard load time', 'sws-dashboard-perf']
];
export const TST: [string, string][] = [
  ['Add regression tests for duplex paper path timing', 'duplex-regress'], ['팩스 ECM 시나리오 자동화 테스트 추가', 'fax-ecm-tests'],
  ['Automate driver install tests on Windows 10', 'drv-install-tests']
];

export const APPROVE_N = [
  'LGTM. 승인합니다.', 'Approved. Unit tests pass on the build server.', '확인했습니다. 승인합니다.', 'Looks good. Approved for submit.',
  '테스트 결과 확인했습니다. 승인합니다.', 'Approved. Nice catch on the boundary case.', 'Verified the build log and the test report. Approved.'
];
export const CHANGES_N = [
  '에러 처리 경로에서 리소스 해제가 누락되어 있습니다. 수정 부탁드립니다.', 'Please add a unit test for the boundary case.',
  '매직 넘버 대신 설정 매크로를 사용해 주세요.', 'The lock is held across a blocking call. Please restructure.',
  '다른 모델의 공통 헤더에 영향이 있습니다. 모델 조건부로 분리해 주세요.', 'This changes the NVRAM layout. Please add a migration for devices in the field.',
  'Please split the refactoring from the fix so the fix can be cherry-picked to the release stream.'
];
export const DENY_N = [
  '요구사항 범위를 벗어난 변경입니다. 기획 확정 후 다시 요청해 주세요.',
  'This duplicates the change already approved for the release stream. Please rebase on that instead.'
];
export const RQ_N = [
  '이 변경이 같은 플랫폼의 다른 모델에도 적용되는지 확인 부탁드립니다.', 'Which test cases did you run? Please attach the report.',
  'Is this covered by the nightly regression suite?', '로그 레벨이 릴리스 빌드에서도 출력되는지 확인 부탁드립니다.'
];
export const REPLY_N = ['Updated and resubmitted. Please take another look.', '수정해서 다시 올렸습니다. 확인 부탁드립니다.', 'Added the test and attached the report.', '공통 헤더 영향 없도록 모델 조건부로 분리했습니다.'];

export const DCOMM = {
  ko: [
    '재현 확인했습니다. 원인 분석 중입니다.', '로그 확인 결과 펌웨어 쪽 타이밍 문제로 보입니다.', '양산 샘플 3대에서 동일 증상 확인했습니다.',
    '직전 릴리스에서는 재현되지 않습니다. 회귀로 보입니다.', '하드웨어 측정 결과 사양 범위 내입니다. 펌웨어 쪽 확인 부탁드립니다.',
    '해외 법인에서도 동일 문의가 접수되었습니다.', '디버그 로그 레벨 올려서 재현 중입니다.'
  ],
  en: [
    'Reproduced on our side. Looking into the root cause.', 'Logs point to a firmware timing issue. Fix in progress.',
    'Confirmed on three production samples.', 'Not reproducible on the previous release, so this looks like a regression.',
    'Hardware measurements are within spec. Please check the firmware side.', 'The same issue came in from a customer through the European call center.',
    'Raised the debug log level and trying to reproduce.'
  ]
};
export const ASK = { ko: '펌웨어 버전과 엔진 로그 첨부 부탁드립니다.', en: 'Which firmware build was this on? Please attach the device log.' };
export const VERIFY = { ko: '{fw} 펌웨어에서 수정 확인했습니다. 종료합니다.', en: 'Verified on {fw}. Closing.' };
export const CLEANUP = '2017년 1분기 백로그 정리: 최신 펌웨어에서 재현되지 않아 종료합니다. 재발 시 새로 등록해 주세요.';

/** Diff templates per component: [path, unified diff lines]. */
export const FT: Record<string, [string, string[]]> = {
  'Print Engine': ['engine/fuser/fuser_ctrl.c', ['@@ -212,7 +212,9 @@ static void fuser_warmup(fuser_t *f)', ' \tint target = f->profile->target_temp;', '-\tif (f->temp < target - 15)', '-\t\tfuser_set_duty(f, 100);', '+\tint margin = (f->ambient < 10) ? FUSER_COLD_MARGIN : 15;', '+\tif (f->temp < target - margin)', '+\t\tfuser_set_duty(f, FUSER_DUTY_MAX);', '+\tLOG_DBG("fuser warmup t=%d m=%d", f->temp, margin);', ' \telse', ' \t\tfuser_set_duty(f, f->profile->hold_duty);']],
  'Scanner / ADF': ['scan/adf/adf_feed.c', ['@@ -88,6 +88,8 @@ int adf_check_multifeed(adf_t *a)', ' \tint v = sensor_read(a->ultrasonic);', '-\tif (v > ADF_MF_THRESH)', '+\tif (v > a->cal.mf_thresh) {', '+\t\tadf_raise(a, ADF_ERR_MULTIFEED);', ' \t\treturn 1;', '+\t}', ' \treturn 0;']],
  Copy: ['copy/idcard/idcard_layout.c', ['@@ -61,7 +61,8 @@ static void idcard_place(job_t *j, const rect_t *page)', ' \tint gap = mm_to_dots(IDCARD_GAP_MM, j->dpi);', '-\tj->back.y = j->front.y + j->front.h + gap;', '+\tint top = page->h / 2 - (j->front.h + gap + j->back.h) / 2;', '+\tj->front.y = top;', '+\tj->back.y = top + j->front.h + gap;', ' \tj->back.x = j->front.x;']],
  Fax: ['fax/t30/t30_ecm.c', ['@@ -301,7 +301,8 @@ static int ecm_resend_block(t30_t *t)', ' \tif (t->ppr_count >= 4) {', '-\t\treturn T30_ERR_ECM;', '+\t\tt30_ctc_fallback(t, T30_RATE_9600);', '+\t\tt->ppr_count = 0;', ' \t}', ' \treturn t30_send_block(t, t->cur_block);']],
  'Network / Wi-Fi': ['net/dhcp/dhcp_client.c', ['@@ -144,6 +144,9 @@ static void dhcp_on_ack(dhcp_t *d, const dhcp_msg_t *m)', ' \td->lease = m->lease_time;', '+\tif (d->addr.s_addr != m->yiaddr.s_addr) {', '+\t\tnetif_rebind(d->netif, &m->yiaddr);', '+\t}', ' \td->addr = m->yiaddr;', ' \tdhcp_schedule_renew(d);']],
  'SyncThru Web UI': ['web/syncthru/session.c', ['@@ -57,6 +57,7 @@ int sws_set_admin_password(const char *pw)', ' \tint rc = cred_store_set(CRED_ADMIN, pw);', ' \tif (rc == 0)', '+\t\tsws_session_invalidate_all();', ' \treturn rc;']],
  'Panel UI': ['ui/panel/touch_calib.c', ['@@ -40,7 +40,7 @@ void touch_map(int rx, int ry, point_t *out)', ' \tout->x = (rx * cal.ax + cal.bx) >> 16;', '-\tout->y = (ry * cal.ay + cal.by) >> 16;', '+\tout->y = ((ry * cal.ay + cal.by) >> 16) - cal.edge_offset(rx, ry);', ' \tclamp_point(out, &panel_bounds);']],
  'Print Driver': ['driver/upd/layout_nup.c', ['@@ -118,6 +118,8 @@ static void nup_compute_cells(job_t *j, rect_t *cells)', ' \trect_t area = j->page;', '+\tarea.left += j->margin.left;', '+\tarea.right -= j->margin.right;', ' \tint cols = nup_cols(j->nup);', ' \tint rows = j->nup / cols;']],
  'Mobile Print': ['app/mobileprint/discovery/MopriaDiscovery.java', ['@@ -77,7 +77,9 @@ public final class MopriaDiscovery {', '     void onServiceFound(NsdServiceInfo info) {', '-        printers.add(Printer.from(info));', '+        Printer p = Printer.from(info);', '+        if (!printers.containsUuid(p.getUuid()))', '+            printers.add(p);', '     }']],
  Security: ['web/syncthru/http/cookie.c', ['@@ -32,6 +32,8 @@ void http_set_session_cookie(http_resp_t *r, const char *sid)', ' \thttp_header_printf(r, "Set-Cookie", "SWSSID=%s; Path=/", sid);', '-\t/* TODO: secure flags */', '+\tif (r->conn->tls)', '+\t\thttp_header_append(r, "Set-Cookie", "; Secure");', '+\thttp_header_append(r, "Set-Cookie", "; HttpOnly");', ' }']],
  Finisher: ['finisher/punch/punch_ctrl.c', ['@@ -73,6 +73,7 @@ int punch_position(const paper_t *p)', ' \tint mid = p->width / 2;', '-\treturn mid - PUNCH_OFFSET;', '+\treturn mid - PUNCH_OFFSET + cal_get(CAL_PUNCH_SKEW, p->size);']],
  'Toner / Supplies': ['supplies/crum/crum_auth.c', ['@@ -95,7 +95,10 @@ int crum_authenticate(crum_t *c)', '-\treturn crum_challenge(c) == 0 ? CRUM_OK : CRUM_NOT_GENUINE;', '+\tfor (int i = 0; i < CRUM_RETRY; i++) {', '+\t\tif (crum_challenge(c) == 0) return CRUM_OK;', '+\t\tos_sleep_ms(50);', '+\t}', '+\treturn CRUM_NOT_GENUINE;']],
  'Power / Sleep': ['power/sleep/deep_sleep.c', ['@@ -201,6 +201,7 @@ static void deep_sleep_arm_wakeups(void)', ' \twake_enable(WAKE_PANEL);', ' \twake_enable(WAKE_USB);', '+\twake_enable(WAKE_LPR_515);', ' \tif (cfg.wol)', ' \t\twake_enable(WAKE_MAGIC_PKT);']]
};

/** Diff templates per change type, for changes not tied to a component. */
export const FT_TYPE: Record<string, [string, string[]]> = {
  Feature: ['app/features/{s}/feature_cfg.c', ['@@ -12,6 +12,10 @@ static const feature_t features[] = {', ' \t{ "copy_id_card", FEAT_ON },', '+\t{ "{s}", FEAT_ON },', ' \t{ "eco_mode", FEAT_ON },', ' };', '+', '+int {s}_init(void) { return feature_register("{s}", &{s}_ops); }']],
  'Firmware update': ['release/{m}/version.mk', ['@@ -1,4 +1,4 @@', ' MODEL := {M}', '-FW_VERSION := {old}', '+FW_VERSION := {v}', ' BUILD_TYPE := release']],
  Refactor: ['common/log/ringbuf.c', ['@@ -30,9 +30,7 @@ void ringbuf_push(ringbuf_t *rb, const void *p, size_t n)', '-\tmemcpy(rb->buf + rb->head, p, n);', '-\trb->head += n;', '-\tif (rb->head >= rb->size) rb->head = 0;', '+\tringbuf_copy_in(rb, p, n);', '+\trb->head = (rb->head + n) % rb->size;', ' \trb->count += n;']],
  'Security fix': ['web/syncthru/httpd/tls_policy.c', ['@@ -48,6 +48,8 @@ static int tls_apply_policy(tls_ctx_t *ctx, const sec_policy_t *p)', ' \ttls_set_ciphers(ctx, p->ciphers);', '-\ttls_set_min_version(ctx, TLS_1_0);', '+\ttls_set_min_version(ctx, p->min_version);', '+\tif (p->min_version >= TLS_1_2)', '+\t\ttls_disable_legacy_ciphers(ctx);', ' \treturn 0;']],
  Localization: ['ui/panel/res/strings_{s}.xml', ['@@ -1,3 +1,6 @@', ' <resources>', '+  <string id="JOB_STATUS">…</string>', '+  <string id="TONER_LOW">…</string>', '+  <string id="PAPER_JAM">…</string>', ' </resources>']],
  'Build / CI': ['build/jenkins/nightly.groovy', ['@@ -18,6 +18,9 @@ pipeline {', '     stage(\'Build\') {', '-      steps { sh \'make all\' }', '+      steps {', '+        sh \'make -j8 all TOOLCHAIN_CACHE=/opt/cache\'', '+      }', '     }']],
  Performance: ['engine/job/job_receive.c', ['@@ -90,5 +90,7 @@ void job_on_receive(job_t *j)', ' \tjob_queue_push(j);', '+\tif (engine_is_cold())', '+\t\tfuser_preheat_async(FUSER_PREHEAT_FAST);', ' \tjob_parse_header(j);']],
  Test: ['test/regression/{s}.py', ['@@ -0,0 +1,6 @@', '+import drs_rig', '+', '+def test_{s}(rig):', '+    rig.run_scenario("{s}")', '+    assert rig.page_count() == rig.expected_pages()', '+    assert not rig.errors()']]
};
