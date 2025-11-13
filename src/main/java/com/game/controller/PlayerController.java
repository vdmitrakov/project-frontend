package com.game.controller;

import com.game.entity.Player;
import com.game.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.Objects.isNull;
import static java.util.Objects.nonNull;

@RestController
@RequestMapping("/rest/players")
public class PlayerController {

    private final PlayerService playerService;

    @Autowired
    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    // ✅ Получение списка игроков с пагинацией
    @GetMapping
    public List<PlayerInfo> getAll(@RequestParam(required = false) Integer pageNumber,
                                   @RequestParam(required = false) Integer pageSize) {
        int page = isNull(pageNumber) ? 0 : pageNumber;
        int size = isNull(pageSize) ? 3 : pageSize;

        List<Player> players = playerService.getAll(page, size);
        return players.stream().map(this::toPlayerInfo).collect(Collectors.toList());
    }

    // ✅ Возвращает JSON-объект с количеством игроков
    @GetMapping("/count")
    public Map<String, Integer> getAllCount() {
        return Collections.singletonMap("count", playerService.getAllCount());
    }

    // ✅ Создание нового игрока
    @PostMapping
    public ResponseEntity<PlayerInfo> createPlayer(@RequestBody PlayerInfo info) {
        if (isInvalid(info)) return ResponseEntity.badRequest().build();

        LocalDate localDate = new Date(info.birthday).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        int year = localDate.getYear();
        if (year < 2000 || year > 3000) return ResponseEntity.badRequest().build();

        boolean banned = nonNull(info.banned) && info.banned;

        Player player = playerService.createPlayer(
                info.name, info.title, info.race, info.profession,
                info.birthday, banned, info.level
        );

        return ResponseEntity.ok(toPlayerInfo(player));
    }

    // ✅ Обновление игрока
    @PostMapping("/{id}")
    public ResponseEntity<PlayerInfo> updatePlayer(@PathVariable long id,
                                                   @RequestBody PlayerInfo info) {
        if (id <= 0) return ResponseEntity.badRequest().build();
        if (nonNull(info.name) && (info.name.isEmpty() || info.name.length() > 12)) return ResponseEntity.badRequest().build();
        if (nonNull(info.title) && info.title.length() > 30) return ResponseEntity.badRequest().build();

        Player updated = playerService.updatePlayer(id, info.name, info.title, info.race, info.profession, info.banned);
        return isNull(updated) ? ResponseEntity.notFound().build() : ResponseEntity.ok(toPlayerInfo(updated));
    }

    // ✅ Удаление игрока
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable long id) {
        if (id <= 0) return ResponseEntity.badRequest().build();

        Player deleted = playerService.delete(id);
        return isNull(deleted) ? ResponseEntity.notFound().build() : ResponseEntity.ok().build();
    }

    // ✅ Преобразование сущности в DTO
    private PlayerInfo toPlayerInfo(Player player) {
        if (isNull(player)) return null;

        PlayerInfo dto = new PlayerInfo();
        dto.id = player.getId();
        dto.name = player.getName();
        dto.title = player.getTitle();
        dto.race = player.getRace();
        dto.profession = player.getProfession();
        dto.birthday = player.getBirthday().getTime();
        dto.banned = player.getBanned();
        dto.level = player.getLevel();
        return dto;
    }

    // ✅ Валидация входных данных
    private boolean isInvalid(PlayerInfo info) {
        return isNull(info.name) || info.name.length() > 12 ||
                isNull(info.title) || info.title.length() > 30 ||
                isNull(info.race) || isNull(info.profession) ||
                isNull(info.birthday) || info.birthday < 0;
    }
}
