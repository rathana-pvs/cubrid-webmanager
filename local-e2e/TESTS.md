# E2E 테스트 커버리지 현황

`local-e2e/tests/` 기준. 모두 `data-testid` 셀렉터 + Page Object(`local-e2e/pages/`) 구조이며, 실제 외부 CUBRID 호스트(192.168.7.31:8003)와 실제 `npm run dev:stack` 인스턴스에 대해 실행/검증됨.

**현재: 33개 파일, 68개 테스트, 전부 통과.**

---

## auth/ (2 파일, 9 테스트)

### auth_login.spec.js — Login
- 빈 폼으로 제출하면 필수 항목 오류가 표시된다
- 잘못된 자격증명으로 로그인하면 인증 실패 메시지가 표시된다
- 올바른 자격증명으로 로그인하면 대시보드로 이동한다
- 비밀번호 표시 토글이 입력 타입을 전환한다
- 회원가입 링크를 클릭하면 회원가입 페이지로 이동한다

### auth_register.spec.js — Register
- 빈 폼으로 제출하면 필수 항목 오류가 표시된다
- 비밀번호와 확인 비밀번호가 다르면 오류가 표시되고 제출되지 않는다
- 새 계정을 생성하면 로그인 페이지로 이동하고, 그 계정으로 로그인할 수 있다
- 이미 존재하는 사용자명으로 가입하면 오류가 표시된다

---

## host/ (11 파일, 24 테스트)

### host_tree_navigation.spec.js — Host Tree Navigation
- 호스트를 단일 클릭하면 선택만 되고 DB 트리는 열리지 않는다
- 호스트를 더블 클릭하면 로그인 후 DB 트리가 열린다
- 그룹을 클릭하면 선택되고 펼쳐진다
- 호스트를 우클릭하면 컨텍스트 메뉴가 열린다

### host_add.spec.js — Add Host
- 빈 폼으로 연결 시도하면 필수 항목 오류가 표시된다
- Save only(로그인 없이 저장)로 호스트를 추가하면 목록에 나타난다
- Test Connection & Save로 실제 호스트를 추가하면 로그인까지 완료된다
- 동일한 주소로 중복 추가하면 오류가 표시된다

### host_edit.spec.js — Edit Host
- 별칭을 비우고 저장하면 필수 항목 오류가 표시된다
- 별칭을 수정하고 저장하면 트리에 새 이름이 표시된다
- 올바른 비밀번호로 Test Connection & Save 하면 로그인에 성공한다

### host_delete.spec.js — Delete Host
- 호스트를 삭제하면 목록에서 사라진다
- 삭제 취소를 누르면 호스트가 유지된다

### host_group_create_rename.spec.js — Group Create/Rename
- 빈 이름으로 그룹 생성을 시도하면 오류가 표시된다
- 그룹을 생성하면 목록에 나타난다
- 그룹 이름을 변경하면 트리에 반영된다

### host_group_delete.spec.js — Group Delete
- 그룹을 삭제하면 목록에서 사라진다
- 삭제 취소를 누르면 그룹이 유지된다

### host_group_manage_members.spec.js — Manage Group Members
- 체크된 호스트를 그룹에 추가하고, 체크 해제하면 미분류로 이동한다

### host_cms_user_management.spec.js — Host CMS User Management
- CMS 사용자를 생성하고, 권한을 수정한 뒤, 삭제하면 사라진다

### host_import_export.spec.js — Host Import/Export
- 호스트 목록을 내보낸 뒤 같은 파일을 다시 가져오면 모두 중복으로 표시된다

### host_reconnect_and_password.spec.js — Host Change Password
- Change Password로 비밀번호를 변경하면 성공하고, 되돌리면 원래대로 로그인된다
  - (부수적으로 ReconnectHostModal 트리거까지 커버 — 세션 토큰 무효화 시 뜨는 "Connection Lost" 모달)

### ⛔ host_ha_discovery.spec.js — 미작성 (차단됨)
실제 다중 노드 HA 클러스터가 없어 SuggestedHaNodesModal 트리거를 재현할 수 없음.

### ⛔ host_ha_merge_and_cluster_link.spec.js — 미작성 (차단됨)
위와 동일한 이유로 차단.

---

## database/ (13 파일, 21 테스트)

### database_tree_navigation.spec.js — Database Tree Navigation
- DB를 클릭하면 선택되지만 로그인되지 않는다
- DB를 펼치면 Users/Job automation/Space 하위 노드가 나타난다
- DB를 더블 클릭하면 대시보드 탭이 열린다
- DB를 우클릭하면 컨텍스트 메뉴가 열린다

### database_create_login.spec.js — Create Database and Login
- DB를 생성하고, 로그인 모달의 여러 케이스를 검증한 뒤, 삭제하면 사라진다

### database_start_stop_delete.spec.js — Database Start/Stop
- DB가 실행 중이면 Stop Database 메뉴가, 중지 상태면 Start Database 메뉴가 보인다
- DB를 중지했다 다시 시작하면 상태 아이콘이 off→on으로 바뀐다

### database_rename_copy.spec.js — Database Rename/Copy
- Rename Database 모달은 활성 DB에서는 비활성화, 이름 미변경시 실행 버튼이 비활성 상태다
- DB 복사를 실행하면 백그라운드 작업이 시작된다

### database_compact_check_optimize.spec.js — Database Check/Compact/Optimize
- Check Database를 실행하면 작업이 시작된다
- Compact Database를 실행하면 작업이 시작된다
- Optimize Database를 실행하면 작업이 시작된다

### database_backup_plan.spec.js — Database Backup Plan
- 백업 계획을 생성하면 트리에 나타나고, 삭제하면 사라진다

### database_restore.spec.js — Database Restore
- DB가 중지된 상태에서 Restore Database 모달이 열리고 닫힌다
  - (실제 백업 파일이 없는 환경이라 모달 열기/닫기까지만 검증)

### database_unload.spec.js — Database Unload
- Unload Database를 실행하면 작업이 시작된다

### database_load.spec.js — Database Load
- Load Database 모달이 열리고 취소하면 닫힌다

### database_query_plan.spec.js — Database Query Plan
- 쿼리 계획을 생성하면 트리에 나타나고, 수정 후 삭제하면 사라진다

### database_volume_management.spec.js — Database Volume Management
- Add Volume 모달이 기본값과 함께 열리고, 입력에 반응하며, 취소하면 닫힌다

### database_dashboard_sections.spec.js — Database Dashboard Sections
- DB를 활성화하면 대시보드 탭이 열리고 6개 섹션이 모두 렌더링된다
- 섹션 헤더를 클릭하면 접히고, 다시 클릭하면 펼쳐진다

### database_property_and_info_modals.spec.js — Database Property and Info Modals
- Properties 모달이 열리고, 적용하지 않고 닫을 수 있다
- Database Info > Param Dump 실행하면 파라미터 테이블이 표시된다

---

## broker/ (3 파일, 6 테스트)

### broker_status_and_tree.spec.js — Broker Status and Tree
- 브로커를 더블 클릭하면 상태 탭이 열린다
- 브로커 우클릭하면 Start Broker/Stop Broker 중 하나만 보이고, Show Status로 상태 탭이 열린다
- Stop Broker 후 Start Broker로 되돌리면 상태가 원래대로 복구된다

### broker_config_editor.spec.js — Broker Config Editor
- Edit Broker Config를 열면 설정 내용이 표시되고, 수정하면 dirty 표시가 되며, Undo로 되돌릴 수 있다

### broker_logs.spec.js — Broker Logs
- 로그 파일을 더블 클릭하면 뷰어 탭이 열리고 내용이 표시된다
- View All Logs를 열면 로그 아코디언이 표시되고, 접기/펼치기와 전체 새로고침이 동작한다

---

## server/ (3 파일, 5 테스트)

### server_dashboard.spec.js — Server Dashboard
- 호스트를 활성화하면 서버 대시보드 탭이 열리고 주요 섹션이 표시된다
- 새로고침 버튼을 누르면 대시보드가 다시 로드된다

### service_dashboard_global.spec.js — Service Dashboard (Global)
- Service Dashboard 탭이 열리고 전체 호스트 테이블과 새로고침이 표시된다
- 호스트 행을 클릭하면 해당 호스트의 서버 대시보드로 이동한다

### cubrid_config_editor.spec.js — Cubrid Config Editor
- Edit Cubrid Config를 열면 설정 내용이 표시되고, 수정하면 dirty 표시가 되며, Undo로 되돌릴 수 있다

---

## user/ (1 파일, 1 테스트)

### db_user_management.spec.js — Database User Management
- DB 유저를 생성하면 트리에 나타나고, 수정 후 삭제하면 사라진다

---

## layout/ (1 파일, 3 테스트)

### navigation_tabs_and_breadcrumb.spec.js — Navigation Tabs and Breadcrumb
- 여러 탭을 열고 전환하면 각 탭의 내용이 올바르게 표시된다
- 탭을 닫으면 사라지고, 남은 탭이 활성화된다
- 수정 중인 탭을 닫으려 하면 확인 다이얼로그가 뜨고, 취소하면 유지되며 확정하면 닫힌다

---

## 남은 작업

- **HA 관련 2개 스펙 미작성** — 실제 멀티노드 HA 클러스터 환경이 없어 재현 불가. 환경이 생기면 착수.
- **기존 68개 테스트의 커버리지 심화** — 에러 케이스/엣지 케이스 보강 (아직 미착수).
- 이번 세션에서 `host_reconnect_and_password.spec.js` 작업 중, 앱 자체의 실버그(`setHostPassword.fulfilled`가 "Passcode Updated" 성공 화면이 뜨기도 전에 모달을 강제로 닫아버리던 문제)를 발견해 `hostSlice.js`에서 수정함.

## 알려진 flakiness

- **`database_rename_copy.spec.js`의 복사 작업 이후** — 실제 백그라운드 복사 job이 완료될 때까지(수 분) 실제 CMS 호스트가 새 로그인을 거부하는 경우가 있음. 알파벳순으로 바로 다음인 `database_restore.spec.js`/`database_start_stop_delete.spec.js`가 이 시간대에 걸리면 드물게 flake — 재실행하면 통과. `HostTreePage.activateHost()`에 재시도 로직을 넣었지만 수 분 단위 지연은 재시도로 완전히 흡수되진 않음. 실제 호스트 제약이지 코드 버그 아님.
- **`host_reconnect_and_password.spec.js`가 전체 스위트 내에서 드물게 타임아웃** — 실행 중 앱 전역의 `CmsJobProvider`가 다른 스펙이 남긴 완료 job 알림 모달(`job-result-modal`)을 띄워 클릭을 막는 문제는 고쳤지만(`AuthPage.login()`에서 로그인 직후 자동 dismiss), 실제 호스트가 바쁠 때는 여전히 간헐적으로 타임아웃될 수 있음. 이 테스트가 타임아웃되면 **실제 호스트 비밀번호가 고정 상수 `E2eTempPass_Fixed01`에 멈춰 있을 가능성이 있음** — 그 값으로 재로그인 후 Change Password로 1234로 복구하면 됨 (값이 고정이라 추측 없이 바로 복구 가능).
