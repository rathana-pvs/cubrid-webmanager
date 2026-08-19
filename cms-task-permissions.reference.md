# web-manager 기능 ↔ CMS task ↔ 요구 권한 (자동 생성)

2026-08-11 기준, `cubrid-manager-server`의 `cm_server_util.cpp`/`cm_server_extend_interface.cpp`
task 테이블과 web-manager `apps/api-server/src/**/*.service.ts`의 실제 `task: '...'` 호출을
매칭해서 생성. PR #136(CBRD-26918, 권한 검사 강화)이 머지되면 검사 로직 자체가 바뀔 수 있으니
그때 재생성 필요 — CMS 소스가 바뀌지 않는 한 이 표 자체는 유효함.

검사 방식은 OR-매칭입니다: `현재계정권한 & 요구권한 != 0`이면 통과 — 요구 권한에 나열된 비트 중 하나만 겹쳐도 됩니다 (전부 가져야 하는 게 아님). `ALL_AUTHORITY`는 6개 비트 전부의 OR이라, 실제로는 "6개 중 뭐라도 하나만 있으면 통과"라는 뜻으로 가장 느슨한 요구치입니다.

`AU_ADMIN`이 필요한 태스크는 web-manager가 전혀 호출하지 않습니다 (get_mon_interval류 시스템 관리 기능뿐).

## 브로커 관리

_apps/api-server/src/broker/broker.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `adddbmtuser` | AU_DBC |
| `broker_start` | AU_DBC 또는 AU_DBO 또는 AU_BRK |
| `broker_stop` | AU_DBC 또는 AU_DBO 또는 AU_BRK |
| `getbrokersinfo` | ALL_AUTHORITY |
| `getbrokerstatus` | ALL_AUTHORITY |
| `startbroker` | AU_DBC 또는 AU_DBO 또는 AU_BRK |
| `stopbroker` | AU_DBC 또는 AU_DBO 또는 AU_BRK |
| `updatedbmtuser` | AU_DBC |

## CMS 접속/로그인

_apps/api-server/src/cms-auth/cms-auth.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `login` | ALL_AUTHORITY |

## CMS 설정 (파라미터/브로커 정보/Plan Dump 등)

_apps/api-server/src/cms-config/cms-config.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `broker_setparam` | AU_DBC 또는 AU_DBO 또는 AU_BRK |
| `getaddbrokerinfo` | ALL_AUTHORITY |
| `getallsysparam` | ALL_AUTHORITY |
| `getenv` | ALL_AUTHORITY |
| `paramdump` | ALL_AUTHORITY |
| `plandump` | ALL_AUTHORITY |
| `setsysparam` | AU_DBC 또는 AU_DBO |
| `statdump` | ALL_AUTHORITY |

## CMS(dbmt) 사용자 관리

_apps/api-server/src/cms-user/cms-user.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `adddbmtuser` | AU_DBC |
| `deletedbmtuser` | AU_DBC |
| `getdbmtuserinfo` | ALL_AUTHORITY |
| `setdbmtpasswd` | ALL_AUTHORITY ^ AU_DBC |
| `updatedbmtuser` | AU_DBC |

## 백업/복구

_apps/api-server/src/database/backup/database-backup.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `addbackupinfo` | AU_DBC 또는 AU_DBO 또는 AU_JOB |
| `backupdb` | AU_DBC 또는 AU_DBO |
| `backupdbinfo` | ALL_AUTHORITY |
| `deletebackupinfo` | AU_DBC 또는 AU_DBO 또는 AU_JOB |
| `getautobackupdberrlog` | ALL_AUTHORITY |
| `getbackupinfo` | ALL_AUTHORITY |
| `getbackuplist` | ALL_AUTHORITY |
| `restoredb` | AU_DBC 또는 AU_DBO |
| `setbackupinfo` | AU_DBC 또는 AU_DBO 또는 AU_JOB |

## DB 설정 (자동 볼륨 추가, Job Automation, 크기)

_apps/api-server/src/database/config/database-config.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `classinfo` | ALL_AUTHORITY |
| `getautoaddvol` | ALL_AUTHORITY |
| `getautoaddvollog` | ALL_AUTHORITY |
| `getautoexecquery` | ALL_AUTHORITY |
| `getautoexecqueryerrlog` | ALL_AUTHORITY |
| `getdbsize` | ALL_AUTHORITY |
| `setautoaddvol` | AU_DBC 또는 AU_DBO |
| `setautoexecquery` | AU_DBC 또는 AU_DBO 또는 AU_JOB |

## DB 트리/StartInfo

_apps/api-server/src/database/info/database-info.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `startinfo` | ALL_AUTHORITY |

## DB 생성/삭제/시작/중지

_apps/api-server/src/database/lifecycle/database-lifecycle.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `createdb` | AU_DBC |
| `dbspaceinfo` | ALL_AUTHORITY |
| `deletedb` | AU_DBC |
| `startdb` | AU_DBC 또는 AU_DBO |
| `stopdb` | AU_DBC 또는 AU_DBO |

## DB 관리 (Unload/Load/Check/Compact/Optimize/Copy/Rename/락/트랜잭션/볼륨)

_apps/api-server/src/database/management/database-management.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `addvoldb` | AU_DBC 또는 AU_DBO |
| `checkdb` | AU_DBC 또는 AU_DBO |
| `compactdb` | AU_DBC 또는 AU_DBO |
| `copydb` | AU_DBC |
| `getaddvolstatus` | ALL_AUTHORITY |
| `gettransactioninfo` | ALL_AUTHORITY |
| `killtransaction` | AU_DBC 또는 AU_DBO 또는 AU_MON |
| `loaddb` | AU_DBC 또는 AU_DBO |
| `lockdb` | ALL_AUTHORITY |
| `optimizedb` | AU_DBC 또는 AU_DBO |
| `renamedb` | AU_DBC |
| `unloaddb` | AU_DBC 또는 AU_DBO |
| `unloadinfo` | ALL_AUTHORITY |

## DB 사용자 관리

_apps/api-server/src/database/user/database-user.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `createuser` | AU_DBO |
| `dbmtuserlogin` | ALL_AUTHORITY |
| `deleteuser` | AU_DBO |
| `updateuser` | AU_DBO |
| `userinfo` | ALL_AUTHORITY |
| `userverify` | ALL_AUTHORITY |

## 파일 검사

_apps/api-server/src/file/file.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `checkfile` | ALL_AUTHORITY |

## HA(고가용성)

_apps/api-server/src/ha/ha.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `ha_reload` | AU_DBC 또는 AU_DBO |
| `ha_start` | AU_DBC 또는 AU_DBO |
| `ha_stop` | AU_DBC 또는 AU_DBO |
| `heartbeatlist` | ALL_AUTHORITY |

## 로그 조회

_apps/api-server/src/log/log.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `getadminloginfo` | ALL_AUTHORITY |
| `getlogfileinfo` | ALL_AUTHORITY |
| `getloginfo` | ALL_AUTHORITY |
| `loadaccesslog` | ALL_AUTHORITY |
| `viewlog` | ALL_AUTHORITY |

## 리소스 모니터링

_apps/api-server/src/monitoring/resource-monitoring/resource-monitoring.service.ts_

| CMS task | 요구 권한 |
|---|---|
| `gethoststat` | ALL_AUTHORITY |

## 접속 계정 권한별 web-manager 기능 가용성

위 표를 "계정이 가진 권한 비트에 따라 web-manager의 어떤 기능이 실제로 통과/차단되는가" 관점으로 재구성한 것. OR-매칭이므로 요구 권한 목록에 있는 비트 중 하나만 있어도 통과. web-manager는 현재 이 정보를 미리 알고 UI를 가리거나 막지 않으므로, 권한이 없는 계정도 버튼을 누를 수는 있고 CMS가 그 시점에 거부한다 — 아래는 "눌렀을 때 성공하는가"의 기준.

### 특정 비트 하나만 있어야 통과 (다른 비트로 대체 불가)

| 필요 비트 | 기능 |
|---|---|
| `AU_DBC`만 | CMS(dbmt) 사용자 추가/수정/삭제, DB 생성/삭제/이름변경/복제 |
| `AU_DBO`만 | DB 사용자 생성/수정/삭제 |

즉 `AU_DBC`가 있어도 `AU_DBO`가 없으면 DB 사용자 관리는 못 하고, 반대로 `AU_DBO`만 있고 `AU_DBC`가 없으면 DB 자체의 생성/삭제나 CMS 사용자 관리는 못 한다 — 서로 대체되지 않는다.

### 여러 비트 중 하나면 통과 (OR)

| 필요 비트(하나 이상) | 기능 |
|---|---|
| `AU_DBC`, `AU_DBO` | 시스템 파라미터 변경(setsysparam), 백업 즉시 실행/복구, 자동 볼륨 추가 설정, DB 시작/중지, 볼륨 추가, Check/Compact/Optimize DB, Unload/Load DB, HA 시작/중지/재구성 |
| `AU_DBC`, `AU_DBO`, `AU_BRK` | 브로커 시작/중지, 브로커 설정(broker.conf) 변경 |
| `AU_DBC`, `AU_DBO`, `AU_JOB` | 백업 계획 추가/수정/삭제, 자동 실행 쿼리(Job Automation) 설정 |
| `AU_DBC`, `AU_DBO`, `AU_MON` | 트랜잭션 강제 종료(kill transaction) |
| `AU_DBO`, `AU_BRK`, `AU_MON`, `AU_VAR` (`AU_DBC` 제외) | 자신의 CMS(dbmt) 비밀번호 변경(setdbmtpasswd) — 흥미롭게도 `AU_DBC` 하나만 있는 계정은 다른 dbmt 계정을 만들 수는 있어도(위 표) 자기 자신의 비밀번호는 못 바꾼다 |

### `ALL_AUTHORITY` (6개 비트 중 아무거나 하나면 통과 — 가장 느슨함)

대부분의 조회/모니터링/로그 화면이 여기 속한다: 브로커 상태·목록 조회, CMS 로그인, 파라미터/Plan Dump/Stat Dump 조회, DB 트리·StartInfo·용량 정보, 백업 이력/자동백업 로그 조회, 트랜잭션/락 정보 조회, DB·CMS 사용자 목록/검증, 파일 검사, HA 하트비트 조회, 각종 로그 뷰어(브로커/DB/CMS/admin 로그), 리소스 모니터링(gethoststat).

→ **이 계열은 계정에 권한 비트가 단 하나라도 있으면 전부 통과한다.** 실측으로 확인된 유일한 예외는 세 도메인(dbcreate/casauth/statusmonitorauth)이 전부 `none`인 계정 — 이 경우 파생되는 권한 비트가 0이 되어 `ALL_AUTHORITY` 검사조차 실패하고 `getallsysparam` 등 조회성 기능까지 전부 막힌다(2026-08 실측 확인).

### 참고

- `dbcreate`/`casauth`(unicas)/`statusmonitorauth` 세 레거시 필드가 각각 정확히 어떤 비트로 치환되는지는 CMS PR #136(CBRD-26918)의 신규 파생 로직에 있는데, 이 로컬 체크아웃(`cubrid` 모노레포)에는 해당 PR이 반영되어 있지 않아 정확한 매핑을 소스로 재확인하지 못했다 — 필드명(dbcreate↔DBC, casauth↔BRK, statusmonitorauth↔MON)상 유추는 가능하지만 단정하지 않음. 실제 계정 설정으로 권한을 조정할 일이 있으면 `cubrid-manager-server` PR #136 코드로 재검증 필요.
- 위 표 자체(태스크→권한)는 PR #136과 무관하게 안정적 — #136은 "권한 비트가 어떻게 계산되는가"만 바꿨고, "태스크가 어떤 비트를 요구하는가"는 그대로다.
