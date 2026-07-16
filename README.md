# Geniuskey Arcade

브라우저에서 바로 실행되는 21개의 미니게임 컬렉션입니다. 설치나 빌드 없이 게임을 선택해 플레이할 수 있으며, 키보드와 터치 조작을 모두 지원합니다.

![Nebula Run thumbnail](assets/thumbnails/run.webp)

## 주요 기능

- 게임마다 고유한 16:9 플레이 장면 썸네일 제공
- 이름과 장르 검색, 장르별 필터링
- 즐겨찾기 저장 및 `All` 목록에서 우선 정렬
- 최근 플레이한 게임 빠른 실행
- 랜덤 게임 실행과 일일 탐험 미션
- 데스크톱 4열, 모바일 2열 반응형 카탈로그
- 모바일 방향키·액션 버튼과 터치 햅틱 피드백
- 최고 점수, 세이브, 설정 등을 브라우저 `localStorage`에 보관

## 로컬 실행

별도의 패키지 설치나 빌드 과정은 필요하지 않습니다.

```bash
python -m http.server 8765
```

브라우저에서 [http://localhost:8765](http://localhost:8765)을 열면 됩니다.

## 게임 목록

| 분류 | 게임 | 플레이 방식 |
| --- | --- | --- |
| 전략·퍼즐 | Cosmic Othello | 1인 전략 |
| 전략·퍼즐 | Cosmic 2048 | 1인 퍼즐 |
| 전략·퍼즐 | Cosmic Tetris | 1인 퍼즐 |
| 아케이드 | Nebula Run | 1인 비행 액션 |
| 아케이드 | Black Hole Eater | 1인 성장 액션 |
| 아케이드 | Meteor Defense | 1인 디펜스 |
| 아케이드 | Galaxy Jump | 1인 플랫폼 |
| 아케이드 | Cosmic Snake | 1인 클래식 |
| 아케이드 | Infinite Stairs | 1인 반응형 액션 |
| 레이싱 | City Race | 1인 도심 레이싱 |
| 레이싱 | Offroad Racing | 1인 오프로드 레이싱 |
| 어드벤처·생존 | Rio Horror School | 1인 호러 어드벤처 |
| 어드벤처·생존 | Tank Survival | 1인 웨이브 생존 |
| 어드벤처·생존 | Prison Life | 1인 잠입 어드벤처 |
| 어드벤처·생존 | Defend the Island | 1인 디펜스 |
| 어드벤처·생존 | Save the Island | 1인 슈팅 캠페인 |
| 멀티플레이 | Cute Volleyball | 2인 대전 |
| 멀티플레이 | Bomb Survival | 2인 생존 |
| 멀티플레이 | Safe Zone Scramble | 2인 파티 액션 |
| 멀티플레이 | Tile Fall Survival | 2인 생존 |
| 멀티플레이 | Glow Hockey | 1인 AI / 2인 대전 |

## 조작

- 각 게임의 시작 화면에서 상세 조작법을 확인할 수 있습니다.
- 일반적으로 방향키 또는 `WASD`를 사용합니다.
- 액션 게임은 `Space`, `Enter`, 마우스 또는 터치를 사용합니다.
- 모바일에서는 게임에 맞는 방향키와 액션 버튼이 자동으로 표시됩니다.

## 프로젝트 구조

```text
arcade/
├─ index.html                 # 게임 포털
├─ mobile-arcade.js           # 공통 모바일 조작 도우미
├─ assets/thumbnails/         # 게임별 WebP 썸네일
└─ <game-name>/index.html     # 각 게임의 독립 실행 파일
```

모든 게임은 독립적인 HTML 페이지로 구성되어 있어 새 게임을 추가할 때 게임 폴더와 포털 카드만 연결하면 됩니다.

