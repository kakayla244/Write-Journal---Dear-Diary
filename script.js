const STORAGE_KEY = "dearDiaryEntries";


function getEntries() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );
}


function saveEntries(entries) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(entries)
    );
}


function formatDate(date) {
    if (!date) return "-";

    return new Date(date + "T00:00:00").toLocaleDateString(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}


function todayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}




function initHome() {

    const journalList = document.getElementById("journalList");
    const emptyState = document.getElementById("emptyState");
    const totalEntries = document.getElementById("totalEntries");
    const latestEntry = document.getElementById("latestEntry");

    const viewModal = document.getElementById("viewModal");
    const modalContent = document.getElementById("modalContent");
    const closeModal = document.getElementById("closeModal");

    function renderJournals() {

        const entries = getEntries();

        entries.sort((a, b) => {
            return new Date(b.updatedAt || b.createdAt) -
                   new Date(a.updatedAt || a.createdAt);
        });

        totalEntries.textContent = entries.length;

        latestEntry.textContent = entries.length
            ? formatDate(entries[0].date)
            : "-";

        journalList.innerHTML = "";

        if (entries.length === 0) {
            emptyState.classList.remove("hidden");
            return;
        }

        emptyState.classList.add("hidden");

        entries.forEach(entry => {

            const card = document.createElement("article");

            card.className = "journal-card";

            const shortContent = entry.content.length > 120
                ? entry.content.substring(0, 120) + "..."
                : entry.content;

            card.innerHTML = `
                <div class="card-top">

                    <span class="mood-pill">
                        ${escapeHTML(entry.mood)}
                    </span>

                    <span class="entry-date">
                        ${formatDate(entry.date)}
                    </span>

                </div>

                <h3>${escapeHTML(entry.title)}</h3>

                <p>${escapeHTML(shortContent)}</p>

                <div class="card-actions">

                    <button data-action="view" data-id="${escapeHTML(entry.id)}">
                        Read More
                    </button>

                    <a href="write.html?id=${encodeURIComponent(entry.id)}">
                        Edit
                    </a>

                    <button class="delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(entry.id)}">
                        Delete
                    </button>

                </div>
            `;

            journalList.appendChild(card);

        });

    }

   
    function openJournal(id) {

        const entries = getEntries();

        const entry = entries.find(item => item.id === id);

        if (!entry) return;

        modalContent.innerHTML = `

            <p class="small-text">
                MY PERSONAL JOURNAL
            </p>

            <span class="mood-pill">
                ${escapeHTML(entry.mood)}
            </span>

            <h2>${escapeHTML(entry.title)}</h2>

            <p class="modal-date">
                ${formatDate(entry.date)}
            </p>

            <div class="modal-story">
                ${escapeHTML(entry.content)}
            </div>

            <a class="primary-btn"
                href="write.html?id=${encodeURIComponent(entry.id)}">
                Edit Journal
            </a>

        `;

        viewModal.classList.remove("hidden");

    }

    
    closeModal.addEventListener("click", () => {
        viewModal.classList.add("hidden");
    });

    viewModal.addEventListener("click", (event) => {
        if (event.target === viewModal) {
            viewModal.classList.add("hidden");
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            viewModal.classList.add("hidden");
        }
    });

    
    journalList.addEventListener("click", (event) => {

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "view") {

            openJournal(id);

        }

        if (action === "delete") {

            const confirmDelete = confirm(
                "Are you sure you want to delete this journal?"
            );

            if (!confirmDelete) return;

            const entries = getEntries().filter(
                entry => entry.id !== id
            );

            saveEntries(entries);

            renderJournals();

        }

    });

    renderJournals();

}




function initWrite() {

    const form = document.getElementById("journalForm");

    const titleInput = document.getElementById("title");
    const dateInput = document.getElementById("date");
    const moodInput = document.getElementById("mood");
    const contentInput = document.getElementById("content");

    const editorTitle = document.getElementById("editorTitle");

    const params = new URLSearchParams(
        window.location.search
    );

    const editId = params.get("id");

    let currentEntry = null;

    if (editId) {

        const entries = getEntries();

        currentEntry = entries.find(
            entry => entry.id === editId
        );

        if (currentEntry) {

            titleInput.value = currentEntry.title;
            dateInput.value = currentEntry.date;
            moodInput.value = currentEntry.mood;
            contentInput.value = currentEntry.content;

            editorTitle.textContent = "Edit Your Story.";

            form.querySelector(
                'button[type="submit"]'
            ).textContent = "Update Journal";

        }

    }


    if (!currentEntry) {
        dateInput.value = todayDate();
    }

  
    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const title = titleInput.value.trim();
        const date = dateInput.value;
        const mood = moodInput.value;
        const content = contentInput.value.trim();

        if (!title || !content || !date) {
            alert("Please complete your journal!");
            return;
        }

        const entries = getEntries();

        const now = new Date().toISOString();

        if (currentEntry) {

           

            const updatedEntries = entries.map(entry => {

                if (entry.id === editId) {

                    return {
                        ...entry,
                        title,
                        date,
                        mood,
                        content,
                        updatedAt: now
                    };

                }

                return entry;

            });

            saveEntries(updatedEntries);

            alert("Journal successfully updated!");

        } else {



            const newEntry = {

                id: Date.now().toString(),

                title: title,
                date: date,
                mood: mood,
                content: content,

                createdAt: now,
                updatedAt: now

            };

            entries.push(newEntry);

            saveEntries(entries);

            alert("Journal successfully saved!");

        }

        window.location.href = "index.html";

    });

}




const page = document.body.dataset.page;

if (page === "home") {
    initHome();
}

if (page === "write") {
    initWrite();
}