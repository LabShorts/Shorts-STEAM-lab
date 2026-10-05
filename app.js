// ======================================================
// LAB SHORTS
// Авторизация: EMAIL + ПАРОЛЬ
// ======================================================

const SUPABASE_URL = "https://cibgooixsyfhnbskpxoy.supabase.co";
const SUPABASE_KEY = "sb_publishable_5zfUVgE8walslrWBt2MOyg_y2eNJbKS";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentUser = null;
let currentProfile = null;


// ======================================================
// ПОКАЗ СТРАНИЦ
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
// РЕГИСТРАЦИЯ
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

    const email = document
        .getElementById("registerEmail")
        .value
        .trim();

    const password = document
        .getElementById("registerPassword")
        .value;

    const schoolCode = document
        .getElementById("schoolCode")
        .value
        .trim();


    if (!name || !phone || !email || !password || !schoolCode) {

        document.getElementById("registerMessage").innerText =
            "Заполните все поля.";

        return;
    }


    if (schoolCode !== "LAB2026") {

        document.getElementById("registerMessage").innerText =
            "Неверный код школы.";

        return;
    }


    if (password.length < 6) {

        document.getElementById("registerMessage").innerText =
            "Пароль должен содержать минимум 6 символов.";

        return;
    }


    document.getElementById("registerMessage").innerText =
        "Создание аккаунта...";


    // Создаём аккаунт через Email + Password

    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,

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
            "Не удалось создать аккаунт.";

        return;
    }


    // Создаём профиль

    const { error: profileError } =
        await supabaseClient
            .from("profiles")
            .insert({

                id: data.user.id,

                name: name,

                phone: phone,

                role: "teacher",

                uploads_count: 0

            });


    if (profileError) {

        console.error(profileError);

        document.getElementById("registerMessage").innerText =
            "Аккаунт создан, но профиль не создан.";

        return;
    }


    document.getElementById("registerMessage").innerText =
        "Регистрация успешна! Проверьте почту, если требуется подтверждение.";


    document.getElementById("registerName").value = "";
    document.getElementById("registerPhone").value = "";
    document.getElementById("registerEmail").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("schoolCode").value = "";


    setTimeout(function() {

        showLogin();

    }, 2000);
}


// ======================================================
// ВХОД
// ======================================================

async function login() {

    const email = document
        .getElementById("loginEmail")
        .value
        .trim();

    const password = document
        .getElementById("loginPassword")
        .value;


    if (!email || !password) {

        document.getElementById("loginMessage").innerText =
            "Введите email и пароль.";

        return;
    }


    document.getElementById("loginMessage").innerText =
        "Выполняется вход...";


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        console.error(error);

        document.getElementById("loginMessage").innerText =
            "Неверный email или пароль.";

        return;
    }


    currentUser = data.user;


    await loadProfile();


    document.getElementById("loginScreen")
        .classList.add("hidden");


    document.getElementById("registerScreen")
        .classList.add("hidden");


    document.getElementById("app")
        .style.display = "block";


    showPage("home");
}


// ======================================================
// ЗАГРУЗКА ПРОФИЛЯ
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


    document.getElementById("profileName")
        .innerText = data.name;


    document.getElementById("profilePhone")
        .innerText = data.phone;


    document.getElementById("profileUploads")
        .innerText = data.uploads_count;


    document.getElementById("profileRole")
        .innerText =
        data.role === "admin"
            ? "Администратор"
            : "Учитель";


    if (data.role === "admin") {

        createAdminButton();

    }
}


// ======================================================
// КНОПКА АДМИНИСТРАТОРА
// ======================================================

function createAdminButton() {

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
// ЗАГРУЗКА ВИДЕО
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


    const file =
        document.getElementById("videoFile")
            .files[0];


    if (!title) {

        alert("Введите название видео.");

        return;
    }


    if (!file) {

        alert("Выберите видео.");

        return;
    }


    if (!file.type.startsWith("video/")) {

        alert("Можно загружать только видео.");

        return;
    }


    const maxSize =
        100 * 1024 * 1024;


    if (file.size > maxSize) {

        alert("Видео должно быть не больше 100 МБ.");

        return;
    }


    const status =
        document.getElementById("uploadStatus");


    status.innerText =
        "Загрузка видео...";


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


    const { data: urlData } =
        supabaseClient
            .storage
            .from("videos")
            .getPublicUrl(filePath);


    const videoUrl =
        urlData.publicUrl;


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
            "Ошибка сохранения видео.";

        return;
    }


    const newUploadCount =
        currentProfile.uploads_count + 1;


    await supabaseClient
        .from("profiles")
        .update({

            uploads_count: newUploadCount

        })
        .eq("id", currentUser.id);


    currentProfile.uploads_count =
        newUploadCount;


    document.getElementById("profileUploads")
        .innerText =
        newUploadCount;


    status.innerText =
        "✅ Видео успешно опубликовано!";


    document.getElementById("videoTitle")
        .value = "";

    document.getElementById("videoDescription")
        .value = "";

    document.getElementById("videoFile")
        .value = "";


    setTimeout(function() {

        loadVideos();

        showPage("feed");

    }, 1500);
}


// ======================================================
// ЛЕНТА
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
// КАТЕГОРИЯ
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
// КАРТОЧКА ВИДЕО
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
// АДМИН
// ======================================================

async function loadAdmin() {

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {

        alert("Доступ запрещён.");

        return;
    }


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


    const { data: videos, error: videosError } =
        await supabaseClient
            .from("videos")
            .select("id");


    if (videosError) {

        console.error(videosError);

        return;
    }


    document.getElementById("totalUsers")
        .innerText =
        users.length;


    document.getElementById("totalVideos")
        .innerText =
        videos.length;


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

                📧 ${escapeHtml(
                    user.email || ""
                )}

                <br>

                📱 ${escapeHtml(
                    user.phone || ""
                )}

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
// ВЫХОД
// ======================================================

async function logout() {

    await supabaseClient.auth.signOut();

    currentUser = null;

    currentProfile = null;

    location.reload();
}


// ======================================================
// РЕГИСТРАЦИЯ / ВХОД
// ======================================================

function showRegister() {

    document.getElementById("loginScreen")
        .classList.add("hidden");


    document.getElementById("registerScreen")
        .classList.remove("hidden");
}


function showLogin() {

    document.getElementById("registerScreen")
        .classList.add("hidden");


    document.getElementById("loginScreen")
        .classList.remove("hidden");
}


// ======================================================
// ЗАЩИТА HTML
// ======================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


// ======================================================
// ЗАПУСК
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


startApp();
