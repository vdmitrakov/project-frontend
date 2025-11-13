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
            const birthday = new Date(player.birthday).toLocaleDateString();
            const banned = player.banned ? "Yes" : "No";

            const row = `
                <tr>
                    <td>${index + 1 + page * pageSize}</td>
                    <td>${player.name}</td>
                    <td>${player.title}</td>
                    <td>${player.race}</td>
                    <td>${player.profession}</td>
                    <td>${player.level}</td>
                    <td>${birthday}</td>
                    <td>${banned}</td>
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
