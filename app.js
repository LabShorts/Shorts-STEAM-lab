const SUPABASE_URL = "https://cibgooixsyfhnbskpxoy.supabase.co";

const SUPABASE_KEY = "sb_publishable_5zfUVgE8walslrWBt2MOyg_y2eNJbKS";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


let currentUser = null;
let currentProfile = null;


// -------------------------
// ПОКАЗ СТРАНИЦ
// -------------------------

function showPage(page) {

    document.querySelectorAll(".page")
        .forEach(p => p.classList.remove("active"));

    document.getElementById(page)
        .classList.add("active");

}


// -------------------------
// LOGIN
// -------------------------

async function login() {

    const phone =
        document.getElementById("loginPhone").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    if (!phone || !password) {

        document.getElementById("loginMessage")
            .innerText = "Заполните все поля.";

        return;
    }


    const email =
        phone.replace(/\D/g, "") + "@labshorts.school";


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: password

        });


    if (error) {

        document.getElementById("loginMessage")
            .innerText = "Неверный номер или пароль.";

        return;
    }


    currentUser = data.user;

    await loadProfile();

    document.getElementById("loginScreen")
        .classList.add("hidden");

    document.getElementById("app")
        .style.display = "block";

    showPage("home");

}


// -------------------------
// REGISTRATION
// -------------------------

async function register() {

    const name =
        document.getElementById("registerName")
            .value.trim();

    const phone =
        document.getElementById("registerPhone")
            .value.trim();

    const password =
        document.getElementById("registerPassword")
            .value;

    const schoolCode =
        document.getElementById("schoolCode")
            .value.trim();


    if (!name || !phone || !password || !schoolCode) {

        document.getElementById("registerMessage")
            .innerText = "Заполните все поля.";

        return;
    }


    // Код школы
    if (schoolCode !== "LAB2026") {

        document.getElementById("registerMessage")
            .innerText = "Неверный код школы.";

        return;
    }


    const email =
        phone.replace(/\D/g, "") + "@labshorts.school";


    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,
            password: password

        });


    if (error) {

        document.getElementById("registerMessage")
            .innerText = error.message;

        return;
    }


    const user = data.user;


    const { error: profileError } =
        await supabaseClient
            .from("profiles")
            .insert({

                id: user.id,

                name: name,

                phone: phone,

                role: "teacher",

                uploads_count: 0

            });


    if (profileError) {

        document.getElementById("registerMessage")
            .innerText =
            "Аккаунт создан, но профиль не создан.";

        return;
    }


    document.getElementById("registerMessage")
        .innerText =
        "Регистрация успешна. Теперь войдите.";

    setTimeout(() => {

        showLogin();

    }, 1500);

}


// -------------------------
// ПРОФИЛЬ
// -------------------------

async function loadProfile() {

    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();


    if (error) {

        console.log(error);

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

        const adminButton =
            document.createElement("button");

        adminButton.innerHTML =
            "⚙️ Админ";

        adminButton.onclick = () => {

            showPage("admin");

            loadAdmin();

        };

        document.querySelector("nav")
            .appendChild(adminButton);

    }

}


// -------------------------
// ЗАГРУЗКА ВИДЕО
// -------------------------

async function uploadVideo() {

    if (!currentUser) {

        alert("Сначала войдите.");

        return;
    }


    const title =
        document.getElementById("videoTitle")
            .value.trim();

    const description =
        document.getElementById("videoDescription")
            .value.trim();

    const category =
        document.getElementById("videoCategory")
            .value;

    const file =
        document.getElementById("videoFile")
            .files[0];


    if (!title || !file) {

        alert("Введите название и выберите видео.");

        return;
    }


    const status =
        document.getElementById("uploadStatus");

    status.innerText =
        "Загрузка видео...";


    const fileName =
        Date.now() +
        "_" +
        file.name.replace(/\s/g, "_");


    const filePath =
        currentUser.id +
        "/" +
        fileName;


    const { error: uploadError } =
        await supabaseClient.storage
            .from("videos")
            .upload(filePath, file);


    if (uploadError) {

        status.innerText =
            "Ошибка загрузки: " +
            uploadError.message;

        return;
    }


    const { data: urlData } =
        supabaseClient.storage
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

                author_name: currentProfile.name

            });


    if (insertError) {

        status.innerText =
            "Видео загружено, но запись не создана.";

        return;
    }


    await supabaseClient
        .from("profiles")
        .update({

            uploads_count:
                currentProfile.uploads_count + 1

        })
        .eq("id", currentUser.id);


    currentProfile.uploads_count++;


    document.getElementById("profileUploads")
        .innerText =
        currentProfile.uploads_count;


    status.innerText =
        "Видео успешно опубликовано!";


    document.getElementById("videoTitle")
        .value = "";

    document.getElementById("videoDescription")
        .value = "";

    document.getElementById("videoFile")
        .value = "";

}


// -------------------------
// ЗАГРУЗКА ЛЕНТЫ
// -------------------------

async function loadVideos() {

    const container =
        document.getElementById("videoList");

    container.innerHTML =
        "Загрузка...";


    const { data, error } =
        await supabaseClient
            .from("videos")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        container.innerHTML =
            "Ошибка загрузки.";

        return;
    }


    container.innerHTML = "";


    data.forEach(video => {

        container.innerHTML += createVideoCard(video);

    });

}


// -------------------------
// КАТЕГОРИЯ
// -------------------------

async function loadCategory(category) {

    const container =
        document.getElementById("categoryVideos");

    container.innerHTML =
        "Загрузка...";


    const { data, error } =
        await supabaseClient
            .from("videos")
            .select("*")
            .eq("category", category)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        container.innerHTML =
            "Ошибка.";

        return;
    }


    container.innerHTML =
        `<h3>${category}</h3>`;


    data.forEach(video => {

        container.innerHTML +=
            createVideoCard(video);

    });

}


// -------------------------
// КАРТОЧКА ВИДЕО
// -------------------------

function createVideoCard(video) {

    return `

        <div class="video-card">

            <video
                controls
                playsinline
                src="${video.video_url}">
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
                ${escapeHtml(video.category)}
                ·
                ${escapeHtml(video.author_name)}
            </small>

        </div>

    `;

}


// -------------------------
// ADMIN
// -------------------------

async function loadAdmin() {

    if (!currentProfile ||
        currentProfile.role !== "admin") {

        return;
    }


    const { data: users } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    const { data: videos } =
        await supabaseClient
            .from("videos")
            .select("id");


    document.getElementById("totalUsers")
        .innerText =
        users.length;


    document.getElementById("totalVideos")
        .innerText =
        videos.length;


    const list =
        document.getElementById("usersList");

    list.innerHTML = "";


    users.forEach(user => {

        list.innerHTML += `

            <div class="user-card">

                <strong>
                    ${escapeHtml(user.name)}
                </strong>

                <br>

                <span>
                    ${escapeHtml(user.phone || "")}
                </span>

                <br>

                <span>
                    Загружено:
                    ${user.uploads_count}
                </span>

                <br>

                <span>
                    Роль:
                    ${user.role}
                </span>

            </div>

        `;

    });

}


// -------------------------
// LOGOUT
// -------------------------

async function logout() {

    await supabaseClient.auth.signOut();

    location.reload();

}


// -------------------------
// ПЕРЕКЛЮЧЕНИЕ LOGIN / REGISTER
// -------------------------

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


// -------------------------
// ЗАЩИТА ОТ HTML
// -------------------------

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// -------------------------
// ПРОВЕРКА SESSION
// -------------------------

async function startApp() {

    const { data } =
        await supabaseClient.auth
            .getSession();


    if (data.session) {

        currentUser =
            data.session.user;

        await loadProfile();

        document.getElementById("loginScreen")
            .classList.add("hidden");

        document.getElementById("app")
            .style.display = "block";

    } else {

        document.getElementById("app")
            .style.display = "none";

    }

}


startApp();
