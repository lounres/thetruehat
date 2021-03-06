<span style="color: red;">Пробная версия. Требуется доработка.</span>

## Соглашения по игре.
1. В каждой игре участвуют только игроки, вошедшие в комнату и находящиеся онлайн в момент старта игры.
1. Время всегда мерится и определяется в мс (миллисекундах). Моменты времени определяются по стандарту UTC+0, с начала Эпохи.
1. Характеристики каждой комнаты:
    - `key (string)` - ключ комнаты.
    - `state (string)` - состояние комнаты. Оно может принимать такие значения:
        - `wait` - идёт набор игроков либо комната не создана.
        - `play` - идёт игра. Подключиться можно только по имени из списка, за которым никто не стоит.
        - `end` - игра закончена.
    - `substate (string)` - Если `state = play`. Состояние комнаты во время игры. Оно может принимать такие значения:
        - `wait` - ожидаем готовности объясняющего и слушающего.
        - `explanation` - идёт объяснение слова.
        - `edit` - вносятся правки в прошедший раунд.
    - `playerList` - список игроков. Игроки описаны так:
        - `username (string)` - имя игрока.
        - `online (bool)` - подключен ли игрок к серверу.
    - `wordsCount (int)` - кол-во оставшихся слов.
1. Характеристики каждого игрока:
    - `username (string)` - имя игрока.
    - `online (bool)` - подключен ли игрок к серверу.
1. Характеристики каждого слова:
    - `explained` - слово было объяснено.
    - `mistake` - слово было объяснено с ошибкой.
    - `notExplained` - слово не было объяснено.
1. Характеристики каждого раунда:
    - `speaker (string)` - кто будет объяснять.
    - `listener (string)` - кому будут объяснять.
    - `words (array)` - список слов до/после правок.
        - `word (string)`
        - `wordState (string)`
            - `explained` - слово было объяснено.
            - `mistake` - слово было объяснено с ошибкой.
            - `notExplained` - слово не было объяснено.
1. Игроки в каждый момент раунда делятся на три категории:
    - `speaker` - объясняющий слова.
    - `listener` - отгадывающий слова.
    - `observer` - любой другой игрок, следящий за ходом объяснения.