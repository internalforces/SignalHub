# CSV to Signal 한국어 안내서

[English](../README.md)

CSV to Signal은 시간 정보가 포함된 숫자 관측값을 결정론적 신호로 변환하고 점수순으로
정렬하는 도구입니다. 별도의 서비스, 스케줄러, 대시보드를 운영하지 않고 시계열 신호
규칙을 검증하려는 개발자와 분석가를 대상으로 합니다.

```text
CSV -> Core -> Detector -> Signal -> CLI
```

저장된 관측값과 탐지기 설정이 같으면 동일한 신호 ID와 점수를 생성합니다. 현재 사용자가
직접 실행할 수 있는 명령은 로컬 CSV 파일을 분석하며, 관측값과 신호를 SQLite에 저장합니다.

## 현재 지원 범위

- `csv-to-signal analyze` CLI를 통한 CSV 입력
- 기본 연속 구간 변화율 신호
- 선택적 상향 임계값 통과 신호
- `--window-hours`를 통한 선택적 윈도우 변화 신호
- 점수 필터링과 결정론적 JSON 출력
- 워크스페이스 라이브러리 형태의 GitHub 커밋 기록과 CoinGecko 가격 기록

GitHub와 CoinGecko는 현재 CLI에 연결되어 있지 않습니다. 윈도우 CLI 분석을 포함한
CSV to Signal `0.3.0`은 npm에 `csv-to-signal`로 공개됐습니다. 스케줄링, 알림, REST API,
대시보드, YAML 설정, Polymarket 또는 범용 REST
수집, ML 방식의 이상·추세·스파이크·변화점 탐지는 제공하지 않습니다.

## 실행 요구 사항

- Node.js `^20.0.0 || ^22.0.0 || ^24.0.0`
- Corepack과 pnpm 9.7.0

## 빠른 시작

저장소 루트에서 다음 명령을 실행합니다.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
node apps/cli/dist/index.js analyze examples/prices.csv
```

포함된 예제 파일의 내용은 다음과 같습니다.

```csv
metricId,timestamp,value
demo.price,2026-08-01T00:00:00Z,100
demo.price,2026-08-02T00:00:00Z,125
demo.price,2026-08-03T00:00:00Z,100
```

명령은 점수순으로 정렬된 JSON을 출력합니다.

```json
[
  {
    "id": "[\"percentage-change\",\"demo.price\",\"2026-08-02T00:00:00.000Z\",125,25]",
    "metricId": "demo.price",
    "type": "increase",
    "score": 50,
    "direction": "up",
    "timestamp": "2026-08-02T00:00:00.000Z",
    "value": 125,
    "changePercent": 25
  },
  {
    "id": "[\"percentage-change\",\"demo.price\",\"2026-08-03T00:00:00.000Z\",100,-20]",
    "metricId": "demo.price",
    "type": "decrease",
    "score": 40,
    "direction": "down",
    "timestamp": "2026-08-03T00:00:00.000Z",
    "value": 100,
    "changePercent": -20
  }
]
```

## CLI 옵션

```text
csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

| 인자 | 설명 |
|---|---|
| `<file.csv>` | 현재 작업 디렉터리를 기준으로 해석하는 CSV 경로 |
| `--min-score <n>` | 점수가 `n` 이상인 신호만 반환합니다. 기본값은 `0`입니다 |
| `--threshold <n>` | 첫 관측값이 `n` 이상이거나 이후 값이 아래에서 위로 `n`을 통과할 때 임계값 신호를 추가합니다 |
| `--window-hours <n>` | 최신 값을 양의 유한한 시간 윈도우 경계 또는 그 이전의 가장 최신 관측값과 비교합니다 |

예를 들면 다음과 같습니다.

```bash
node apps/cli/dist/index.js analyze examples/prices.csv --min-score 45 --threshold 120 --window-hours 24
```

옵션 값은 유한한 숫자여야 하며, 플래그와 값의 쌍으로 해석됩니다. 같은 플래그를 여러 번
지정하면 마지막 값이 사용됩니다.

## CSV 규칙과 자주 발생하는 오류

첫 번째 비어 있지 않은 줄에는 `metricId,timestamp,value` 헤더가 정확히 이 순서로 있어야
합니다. 헤더의 대소문자와 앞뒤 공백은 무시합니다. 비어 있지 않은 각 데이터 행은 쉼표로
구분된 필드 세 개를 가져야 합니다.

- `metricId`는 비어 있을 수 없습니다.
- `timestamp`는 JavaScript에서 해석 가능해야 하며 ISO 8601 UTC로 정규화됩니다.
- `value`는 유한한 숫자여야 합니다.
- 빈 줄은 무시하지만, 오류 메시지의 실제 파일 줄 번호 계산에는 포함됩니다.

CSV 파서는 의도적으로 단순합니다. 따옴표 필드, 이스케이프된 쉼표, 다른 열 순서,
RFC 4180 CSV 기능을 지원하지 않습니다. 일반적인 실패 원인은 잘못된 헤더, 열 개수,
누락된 metric ID, 잘못된 타임스탬프나 숫자, 존재하지 않는 파일, 잘못된 CLI 사용법입니다.

## 로컬 데이터베이스

CLI를 실행할 때마다 입력 CSV의 위치가 아닌 현재 작업 디렉터리에서 `data.db`를 열거나
새로 만듭니다. 이 데이터베이스에는 정규화된 데이터 포인트와 생성된 신호가 저장됩니다.
관측값과 결정론적 신호 ID는 한 번만 삽입되므로 같은 입력을 다시 실행해도 중복 저장되지
않습니다. `data.db`는 Git 추적 대상에서 제외됩니다.

분석별로 데이터베이스를 분리하려면 각각 별도의 작업 디렉터리에서 CLI를 실행하십시오.

## 추가 문서

- [라이브러리 사용법](library-usage.md): GitHub, CoinGecko,
  `WindowedChangeDetector` 예제(영문)
- [개발 안내](development.md): 저장소 구조, 개발 명령, 테스트, 의존성 규칙(영문)
- [M6 윈도우 CLI 계획](2026-08-08-signal-hub-m6-windowed-cli.md): `0.3.0`으로 공개된
  윈도우 CLI 통합 범위(영문)
- [MVP 구현 계획](2026-07-27-signal-hub-mvp.md): 작업 단위의 과거 구현 기록(영문)
