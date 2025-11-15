const API_URL = "http://localhost:8080/rest/players";
let currentPage = 0;
let pageSize = 5;
let totalPlayers = 0;

function fetchTotalPlayersCount() {
    return $.get(`${API_URL}/count`)
        .then(data => {
            if (typeof data === "number") {
                return data;
            }
            if (typeof data === "object" && data.count !== undefined) {
                return data.count;
            }
            console.warn("Unexpected response format from /count:", data);
            return 0;
        })
        .catch(() => {
            alert("Failed to fetch total player count. Please check the server.");
            return 0;
        });
}

function loadPlayers(page = 0) {
    currentPage = page;
    pageSize = parseInt($("#pageSizeSelect").val());



    $.get(`${API_URL}?pageNumber=${currentPage}&pageSize=${pageSize}`, function(players) {
        const tbody = $("#playersTable tbody");
        tbody.empty();

        if (!Array.isArray(players)) {
            alert("Invalid data format received from server.");
            return;
        }

        players.forEach((player, index) => {
           // const birthday = new Date(player.birthday).toLocaleDateString();
            const banned = player.banned ? "Yes" : "No";

            const birthdayDate = new Date(player.birthday);
            const birthdayFormatted = birthdayDate.toLocaleDateString("ru-RU"); // или en-GB, если нужно
            const birthdayISO = birthdayDate.toISOString().split("T")[0]; // yyyy-mm-dd


            const row = `
                <tr data-id="${player.id}">
                    <td>${index + 1 + page * pageSize}</td>
                    <td class="cell-name">${player.name}</td>
                    <td class="cell-title">${player.title}</td>
                    <td class="cell-race">${player.race}</td>
                    <td class="cell-profession">${player.profession}</td>
                    <td class="cell-level">${player.level}</td>
                    <td class="cell-birthday" data-raw="${birthdayISO}">${birthdayFormatted}</td>
                    <td class="cell-banned">${banned}</td>
                    <td><img src="/img/edit.png" class="edit-btn" data-id="${player.id}" style="cursor:pointer;"></td>
                    <td><img src="/img/delete.png" class="delete-btn" data-id="${player.id}" style="cursor:pointer;"></td>    
                </tr>
            `;
            tbody.append(row);
        });

        renderPagination();
    }).fail(() => {
        alert("Failed to load players. Please check the /rest/players endpoint.");
    });
}


function renderPagination() {
    const totalPages = Math.ceil(totalPlayers / pageSize);
    const container = $("#paginationControls");
    container.empty();

    for (let i = 0; i < totalPages; i++) {
        const btn = $(`<button>${i + 1}</button>`);
        if (i === currentPage) {
            btn.addClass("active");
        }
        btn.on("click", () => loadPlayers(i));
        container.append(btn);
    }
}

$("#pageSizeSelect").on("change", () => {
    fetchTotalPlayersCount().then(count => {
        totalPlayers = count;
        loadPlayers(0);
    });
});

$("#createPlayerForm").submit(function(event) {
    event.preventDefault();

    const playerData = {
        name: $(this).find("input[name='name']").val(),
        title: $(this).find("input[name='title']").val(),
        race: $(this).find("select[name='race']").val(),
        profession: $(this).find("select[name='profession']").val(),
        level: parseInt($(this).find("input[name='level']").val()),
        birthday: new Date($(this).find("input[name='birthday']").val()).getTime(),
        banned: $(this).find("input[name='banned']").is(":checked")
    };

    $.ajax({
        url: API_URL,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(playerData),
        success: function() {
            alert("Player created successfully!");
            fetchTotalPlayersCount().then(count => {
                totalPlayers = count;
                loadPlayers(0);
            });
            $("#createPlayerForm")[0].reset();
        },
        error: function() {
            alert("Failed to create player. Please check the input data and server logs.");
        }
    });
});

$(document).ready(function() {
    fetchTotalPlayersCount().then(count => {
        totalPlayers = count;
        loadPlayers();
    });
});

function deletePlayer(id) {
    $.ajax({
        url: `${API_URL}/${id}`,
        type: "DELETE",
        success: function() {
            alert(`Player with ID ${id} deleted successfully.`);
            fetchTotalPlayersCount().then(count => {
                totalPlayers = count;
                loadPlayers(currentPage);
            });
        },
        error: function() {
            alert(`Failed to delete player with ID ${id}.`);
        }
    });
}

$(document).on("click", ".delete-btn", function() {
    const id = $(this).data("id");
    deletePlayer(id);
});


//--------------Редагування----------
$(document).on("click", ".edit-btn", function () {
    const row = $(this).closest("tr");
    const id = row.data("id");

    // Скрыть кнопку Delete
    row.find(".delete-btn").hide();

    // Заменить Edit на Save
    $(this).attr("src", "/img/save.png").removeClass("edit-btn").addClass("save-btn");

    // Получить текущие значения
    const name = row.find(".cell-name").text().trim();
    const title = row.find(".cell-title").text().trim();
    const race = row.find(".cell-race").text().trim();
    const profession = row.find(".cell-profession").text().trim();
    const level = row.find(".cell-level").text().trim();
    const birthdayRaw = row.find(".cell-birthday").data("raw"); // ISO-строка yyyy-mm-dd
    const banned = row.find(".cell-banned").text().trim() === "Yes";

    // Заменить ячейки на поля ввода
    row.find(".cell-name").html(`<input type="text" class="edit-name" value="${name}" maxlength="12">`);
    row.find(".cell-title").html(`<input type="text" class="edit-title" value="${title}" maxlength="30">`);
    row.find(".cell-level").html(`<input type="number" class="edit-level" value="${level}" min="0" max="100">`);
    row.find(".cell-birthday").html(`<input type="date" class="edit-birthday" value="${birthdayRaw || ''}">`);

    const raceOptions = ["HUMAN", "DWARF", "ELF", "ORC", "TROLL", "HOBBIT", "GIANT"];
    const raceSelect = $("<select>").addClass("edit-race");
    raceOptions.forEach(opt => {
        raceSelect.append(`<option value="${opt}" ${opt === race ? "selected" : ""}>${opt}</option>`);
    });
    row.find(".cell-race").html(raceSelect);

    const profOptions = ["WARRIOR", "ROGUE", "SORCERER", "CLERIC", "PALADIN", "DRUID", "WARLOCK", "NAZGUL"];
    const profSelect = $("<select>").addClass("edit-profession");
    profOptions.forEach(opt => {
        profSelect.append(`<option value="${opt}" ${opt === profession ? "selected" : ""}>${opt}</option>`);
    });
    row.find(".cell-profession").html(profSelect);

    row.find(".cell-banned").html(`
        <select class="edit-banned">
            <option value="true" ${banned ? "selected" : ""}>true</option>
            <option value="false" ${!banned ? "selected" : ""}>false</option>
        </select>
    `);
});



//---------------Збереження--------------------------
$(document).on("click", ".save-btn", function () {
    const row = $(this).closest("tr");
    const id = row.data("id");

    const levelValue = row.find(".edit-level").val();
    const level = levelValue !== "" && !isNaN(levelValue) ? parseInt(levelValue) : null;

    const birthdayValue = row.find(".edit-birthday").val();
    const birthday = birthdayValue ? new Date(birthdayValue).getTime() : null;

    const updatedData = {
        name: row.find(".edit-name").val(),
        title: row.find(".edit-title").val(),
        race: row.find(".edit-race").val(),
        profession: row.find(".edit-profession").val(),
        level: level,
        birthday: birthday,
        banned: row.find(".edit-banned").val() === "true"
    };

    console.log("Sending data:", updatedData); // ✅ for debugging

    $.ajax({
        url: `${API_URL}/${id}`,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(updatedData),
        success: function () {
            alert(`Player with ID ${id} was successfully updated.`);
            fetchTotalPlayersCount().then(count => {
                totalPlayers = count;
                loadPlayers(currentPage);
            });
        },
        error: function () {
            alert(`Failed to update player with ID ${id}.`);
        }
    });
});


fetchTotalPlayersCount().then(count => {
    totalPlayers = count;
    loadPlayers(currentPage);
});

