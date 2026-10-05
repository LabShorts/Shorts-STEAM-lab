// ======================================================
// LAB SHORTS
// Авторизация: НОМЕР ТЕЛЕФОНА + ПАРОЛЬ
// ======================================================


// ======================================================
// 1. НАСТРОЙКИ SUPABASE
// ======================================================

const SUPABASE_URL = "https://cibgooixsyfhnbskpxoy.supabase.co";

const SUPABASE_KEY = "sb_publishable_5zfUVgE8walslrWBt2MOyg_y2eNJbKS";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ======================================================
// 2. ПЕРЕМЕННЫЕ
// ======================================================

let currentUser = null;
let currentProfile = null;


// ======================================================
// 3. ПОКАЗ СТРАНИЦ
// ======================================================

function showPage(page) {

    document.querySelectorAll(".page").forEach(function(element) {
        element.classList.remove("active");
    });

    const selectedPage = document.getElementById(page);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }
}


// ======================================================
// 4. РЕГИСТРАЦИЯ
// ======================================================

async function register() {

    const name = document
        .getElementById("registerName")
        .value
        .trim();

    const phone = document
        .getElementById("registerPhone")
        .value
        .trim();

    const password = document
        .getElementById("registerPassword")
        .value;

    const schoolCode = document
        .getElementById("schoolCode")
        .value
        .trim();


    // Проверяем поля

    if (!name || !phone || !password || !schoolCode) {

        document.getElementById("registerMessage").innerText =
            "Заполните все поля.";

        return;
    }


    // Проверяем код школы

    if (schoolCode !== "LAB2026") {

        document.getElementById("registerMessage").innerText =
            "Неверный код школы.";

        return;
    }


    // Проверяем номер

    const cleanPhone = phone.replace(/[^\d+]/g, "");


    if (cleanPhone.length < 10) {

        document.getElementById("registerMessage").innerText =
            "Введите правильный номер телефона.";

        return;
    }


    if (password.length < 6) {

        document.getElementById("registerMessage").innerText =
            "Пароль должен содержать минимум 6 символов.";

        return;
    }


    document.getElementById("registerMessage").innerText =
        "Создание аккаунта...";


    // ==================================================
    // СОЗДАЁМ АККАУНТ SUPABASE ПО НОМЕРУ
    // ==================================================

    const { data, error } =
        await supabaseClient.auth.signUp({

            phone: cleanPhone,

            password: password

        });


    if (error) {

        console.error(error);

        document.getElementById("registerMessage").innerText =
            "Ошибка регистрации: " + error.message;

        return;
    }


    if (!data.user) {

        document.getElementById("registerMessage").innerText =
            "Не удалось создать пользователя.";

        return;
    }


    // ==================================================
    // СОЗДАЁМ ПРОФИЛЬ
    // ==================================================

    const { error: profileError } =
        await supabaseClient
            .from("profiles")
            .insert({

                id: data.user.id,

                name: name,

                phone: cleanPhone,

                role: "teacher",

                uploads_count: 0

            });


    if (profileError) {

        console.error(profileError);

        document.getElementById("registerMessage").innerText =
            "Аккаунт создан, но профиль не удалось создать.";

        return;
    }


    document.getElementById("registerMessage").innerText =
        "Регистрация успешна!";


    // Очищаем поля

    document.getElementById("registerName").value = "";
    document.getElementById("registerPhone").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("schoolCode").value = "";


    // Переходим на вход

    setTimeout(function() {

        showLogin();

    }, 1200);

}


// ======================================================
// 5. ВХОД
// ======================================================

async function login() {

    const phone = document
        .getElementById("loginPhone")
        .value
        .trim();

    const password = document
        .getElementById("loginPassword")
        .value;


    if (!phone || !password) {

        document.getElementById("loginMessage").innerText =
            "Введите номер телефона и пароль.";

        return;
    }


    const cleanPhone = phone.replace(/[^\d+]/g, "");


    document.getElementById("loginMessage").innerText =
        "Выполняется вход...";


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            phone: cleanPhone,

            password: password

        });


    if (error) {

        console.error(error);

        document.getElementById("loginMessage").innerText =
            "Неверный номер телефона или пароль.";

        return;
    }


    currentUser = data.user;


    await loadProfile();


    // Закрываем окно входа

    document.getElementById("loginScreen")
        .classList.add("hidden");


    // Показываем приложение

    document.getElementById("app")
        .style.display = "block";


    showPage("home");

}


// ======================================================
// 6. ЗАГРУЗКА ПРОФИЛЯ
// ======================================================

async function loadProfile() {

    if (!currentUser) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();


    if (error) {

        console.error("Ошибка профиля:", error);

        return;
    }


    currentProfile = data;


    // Имя

    document.getElementById("profileName")
        .innerText = data.name;


    // Телефон

    document.getElementById("profilePhone")
        .innerText = data.phone;


    // Количество загрузок

    document.getElementById("profileUploads")
        .innerText = data.uploads_count;


    // Роль

    document.getElementById("profileRole")
        .innerText =
        data.role === "admin"
            ? "Администратор"
            : "Учитель";


    // Если администратор

    if (data.role === "admin") {

        createAdminButton();

    }

}


// ======================================================
// 7. КНОПКА АДМИНИСТРАТОРА
// ======================================================

function createAdminButton() {

    // Проверяем, есть ли уже кнопка

    if (document.getElementById("adminNavButton")) {
        return;
    }


    const button = document.createElement("button");

    button.id = "adminNavButton";

    button.innerHTML = `
        ⚙️
        <span>Админ</span>
    `;


    button.onclick = function() {

        showPage("admin");

        loadAdmin();

    };


    document.querySelector("nav")
        .appendChild(button);

}


// ======================================================
// 8. ЗАГРУЗКА ВИДЕО
// ======================================================

async function uploadVideo() {

    if (!currentUser || !currentProfile) {

        alert("Сначала войдите в аккаунт.");

        return;
    }


    const title = document
        .getElementById("videoTitle")
        .value
        .trim();


    const description = document
        .getElementById("videoDescription")
        .value
        .trim();


    const category = document
        .getElementById("videoCategory")
        .value;


    const fileInput =
        document.getElementById("videoFile");


    const file = fileInput.files[0];


    // Проверяем название

    if (!title) {

        alert("Введите название видео.");

        return;
    }


    // Проверяем видео

    if (!file) {

        alert("Выберите видео.");

        return;
    }


    // Проверяем формат

    if (!file.type.startsWith("video/")) {

        alert("Можно загружать только видео.");

        return;
    }


    // Ограничение размера — 100 МБ

    const maxSize = 100 * 1024 * 1024;


    if (file.size > maxSize) {

        alert("Размер видео не должен превышать 100 МБ.");

        return;
    }


    const status =
        document.getElementById("uploadStatus");


    status.innerText =
        "Загрузка видео...";


    // ==================================================
    // СОЗДАЁМ ИМЯ ФАЙЛА
    // ==================================================

    const extension =
        file.name.split(".").pop();


    const fileName =
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8) +
        "." +
        extension;


    const filePath =
        currentUser.id +
        "/" +
        fileName;


    // ==================================================
    // ЗАГРУЖАЕМ В STORAGE
    // ==================================================

    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("videos")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


    if (uploadError) {

        console.error(uploadError);

        status.innerText =
            "Ошибка загрузки: " +
            uploadError.message;

        return;
    }


    // ==================================================
    // ПОЛУЧАЕМ ССЫЛКУ
    // ==================================================

    const { data: urlData } =
        supabaseClient
            .storage
            .from("videos")
            .getPublicUrl(filePath);


    const videoUrl =
        urlData.publicUrl;


    // ==================================================
    // СОХРАНЯЕМ ИНФОРМАЦИЮ О ВИДЕО
    // ==================================================

    const { error: insertError } =
        await supabaseClient
            .from("videos")
            .insert({

                title: title,

                description: description,

                category: category,

                video_url: videoUrl,

                author_id: currentUser.id,

                author_name: currentProfile.name,

                views: 0

            });


    if (insertError) {

        console.error(insertError);

        status.innerText =
            "Видео загружено, но данные не сохранились.";

        return;
    }


    // ==================================================
    // УВЕЛИЧИВАЕМ СЧЁТЧИК ЗАГРУЗОК
    // ==================================================

    const newUploadCount =
        currentProfile.uploads_count + 1;


    const { error: updateError } =
        await supabaseClient
            .from("profiles")
            .update({

                uploads_count: newUploadCount

            })
            .eq("id", currentUser.id);


    if (updateError) {

        console.error(updateError);

    }


    currentProfile.uploads_count =
        newUploadCount;


    document.getElementById("profileUploads")
        .innerText =
        newUploadCount;


    // ==================================================
    // ГОТОВО
    // ==================================================

    status.innerText =
        "✅ Видео успешно опубликовано!";


    // Очищаем форму

    document.getElementById("videoTitle")
        .value = "";

    document.getElementById("videoDescription")
        .value = "";

    document.getElementById("videoFile")
        .value = "";


    // Через 1.5 секунды показываем ленту

    setTimeout(function() {

        loadVideos();

        showPage("feed");

    }, 1500);

}


// ======================================================
// 9. ЗАГРУЗКА ЛЕНТЫ
// ======================================================

async function loadVideos() {

    const container =
        document.getElementById("videoList");


    container.innerHTML =
        "<p>Загрузка видео...</p>";


    const { data, error } =
        await supabaseClient
            .from("videos")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Не удалось загрузить видео.</p>";

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            "<p>Пока нет загруженных видео.</p>";

        return;
    }


    container.innerHTML = "";


    data.forEach(function(video) {

        container.innerHTML +=
            createVideoCard(video);

    });

}


// ======================================================
// 10. ЗАГРУЗКА КАТЕГОРИИ
// ======================================================

async function loadCategory(category) {

    const container =
        document.getElementById("categoryVideos");


    container.innerHTML =
        "<p>Загрузка...</p>";


    const { data, error } =
        await supabaseClient
            .from("videos")
            .select("*")
            .eq("category", category)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Ошибка загрузки.</p>";

        return;
    }


    container.innerHTML =
        `<h3>${escapeHtml(category)}</h3>`;


    if (!data || data.length === 0) {

        container.innerHTML +=
            "<p>В этом разделе пока нет видео.</p>";

        return;
    }


    data.forEach(function(video) {

        container.innerHTML +=
            createVideoCard(video);

    });

}


// ======================================================
// 11. КАРТОЧКА ВИДЕО
// ======================================================

function createVideoCard(video) {

    return `

        <div class="video-card">

            <video
                controls
                playsinline
                preload="metadata"
                src="${escapeHtml(video.video_url)}">
            </video>

            <h3>
                ${escapeHtml(video.title)}
            </h3>

            <p>
                ${escapeHtml(
                    video.description || ""
                )}
            </p>

            <small>
                📁 ${escapeHtml(video.category)}
            </small>

            <br>

            <small>
                👤 ${escapeHtml(video.author_name)}
            </small>

            <br>

            <small>
                👁 ${video.views || 0}
            </small>

        </div>

    `;

}


// ======================================================
// 12. ПАНЕЛЬ АДМИНИСТРАТОРА
// ======================================================

async function loadAdmin() {

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {

        alert("Доступ запрещён.");

        return;
    }


    // Получаем пользователей

    const { data: users, error: usersError } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (usersError) {

        console.error(usersError);

        return;
    }


    // Получаем видео

    const { data: videos, error: videosError } =
        await supabaseClient
            .from("videos")
            .select("id");


    if (videosError) {

        console.error(videosError);

        return;
    }


    // Общая статистика

    document.getElementById("totalUsers")
        .innerText =
        users.length;


    document.getElementById("totalVideos")
        .innerText =
        videos.length;


    // Список пользователей

    const list =
        document.getElementById("usersList");


    list.innerHTML = "";


    users.forEach(function(user) {

        list.innerHTML += `

            <div class="user-card">

                <strong>
                    ${escapeHtml(user.name)}
                </strong>

                <br>

                📱
                ${escapeHtml(user.phone || "")}

                <br>

                🎬 Загружено:
                ${user.uploads_count}

                <br>

                👤 Роль:
                ${escapeHtml(user.role)}

            </div>

        `;

    });

}


// ======================================================
// 13. ВЫХОД
// ======================================================

async function logout() {

    await supabaseClient.auth.signOut();

    currentUser = null;

    currentProfile = null;

    location.reload();

}


// ======================================================
// 14. ПОКАЗ РЕГИСТРАЦИИ
// ======================================================

function showRegister() {

    document.getElementById("loginScreen")
        .classList.add("hidden");


    document.getElementById("registerScreen")
        .classList.remove("hidden");

}


// ======================================================
// 15. ПОКАЗ ВХОДА
// ======================================================

function showLogin() {

    document.getElementById("registerScreen")
        .classList.add("hidden");


    document.getElementById("loginScreen")
        .classList.remove("hidden");

}


// ======================================================
// 16. ЗАЩИТА ТЕКСТА
// ======================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}


// ======================================================
// 17. ЗАПУСК САЙТА
// ======================================================

async function startApp() {

    const { data } =
        await supabaseClient
            .auth
            .getSession();


    if (data.session) {

        currentUser =
            data.session.user;


        await loadProfile();


        document.getElementById("loginScreen")
            .classList.add("hidden");


        document.getElementById("registerScreen")
            .classList.add("hidden");


        document.getElementById("app")
            .style.display = "block";


        showPage("home");


    } else {

        document.getElementById("app")
            .style.display = "none";


        document.getElementById("loginScreen")
            .classList.remove("hidden");

    }

}


// ======================================================
// 18. ЗАПУСК
// ======================================================

startApp();
