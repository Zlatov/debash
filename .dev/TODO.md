# TODO

Рабочие заметки по разработке debash. Не путать с `.dev/MANIFEST.md`
(философия и цели проекта) и `.dev/STAGES.md` (план этапов).

---

## Часто используемые команды

```bash
# Запуск локально
node bin/debash.js
./bin/debash.js

# Установка/обновление глобального пакета как у конечного пользователя
# npm update -g ненадёжен (может не подтянуть новую версию) — использовать install
# @latest сразу после publish тоже иногда даёт старую версию (задержка
# репликации реестра/кэша) — в таком случае ставить точную версию явно
npm install -g debash@latest
npm install -g debash@<версия>   # например debash@0.5.0, если @latest подвис

# npm аккаунт
npm whoami
npm login

# Проверка содержимого пакета перед публикацией
npm pack --dry-run

# Поднять версию (создаёт коммит + git-тег)
npm version patch -m "Release v%s: <что изменилось>"
npm version minor -m "Release v%s: <что изменилось>"

# Публикация (нужен OTP из аутентификатора)
npm publish --otp=<код>

# Git: обычный цикл правок
git add -A
git commit -m "<сообщение>"
git push

# Git: после npm version (коммит и тег уже созданы)
git push && git push --tags

# Полная цепочка релиза одной строкой
git push && git push --tags && npm publish --otp=<код>

# Права на исполняемый файл CLI
chmod +x bin/debash.js
```
